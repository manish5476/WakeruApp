// src/repositories/settlement.repository.ts
import { getLocalDatabase, LocalSettlement } from '../db';
import { formatMoney } from '../utils/money/money';

export interface SimplifiedTransaction {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amountMinor: number;
  amount: number;
  amountFormatted: string;
}

export interface SettlementSummary {
  tripId: string;
  netBalances: Record<
    string,
    {
      userId: string;
      displayName: string;
      netMinor: number;
      netAmount: number;
      currency: string;
    }
  >;
  transactions: SimplifiedTransaction[];
  isFullySettled: boolean;
  updatedAt: string;
}

export class SettlementRepository {
  private db = getLocalDatabase();

  /**
   * Retrieves settlement for a trip. If not yet computed or offline, calculates debt simplification
   * client-side using safe integer minor units.
   */
  async getTripSettlement(tripId: string): Promise<SettlementSummary> {
    const cached = await this.db.getSettlement(tripId);
    if (cached) {
      try {
        const netBalances = JSON.parse(cached.netBalancesJson);
        const transactions = JSON.parse(cached.transactionsJson);
        return {
          tripId: cached.tripId,
          netBalances,
          transactions,
          isFullySettled: cached.isFullySettled,
          updatedAt: cached.updatedAt,
        };
      } catch {
        // Fallback to calculation
      }
    }

    return this.computeLocalSettlement(tripId);
  }

  /**
   * Calculates debt simplification client-side from local SQLite data with zero floating-point error.
   */
  async computeLocalSettlement(tripId: string): Promise<SettlementSummary> {
    const trip = await this.db.getTripById(tripId);
    const currency = trip?.baseCurrency || 'INR';
    const members = await this.db.getTripMembers(tripId);

    const netBalances: Record<
      string,
      {
        userId: string;
        displayName: string;
        netMinor: number;
        netAmount: number;
        currency: string;
      }
    > = {};

    interface BalanceNode {
      userId: string;
      displayName: string;
      amountMinor: number; // positive = is owed money, negative = owes money
    }

    const creditors: BalanceNode[] = [];
    const debtors: BalanceNode[] = [];

    for (const m of members) {
      const netMinor = (m.totalPaidMinor || 0) - (m.totalOwesMinor || 0);
      netBalances[m.userId] = {
        userId: m.userId,
        displayName: m.displayName,
        netMinor,
        netAmount: netMinor / 100,
        currency,
      };

      if (netMinor > 0) {
        creditors.push({
          userId: m.userId,
          displayName: m.displayName,
          amountMinor: netMinor,
        });
      } else if (netMinor < 0) {
        debtors.push({
          userId: m.userId,
          displayName: m.displayName,
          amountMinor: -netMinor,
        });
      }
    }

    // Sort descending by amount
    creditors.sort((a, b) => b.amountMinor - a.amountMinor);
    debtors.sort((a, b) => b.amountMinor - a.amountMinor);

    const transactions: SimplifiedTransaction[] = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx];
      const debtor = debtors[dIdx];

      const settlementMinor = Math.min(
        creditor.amountMinor,
        debtor.amountMinor,
      );

      if (settlementMinor > 0) {
        transactions.push({
          fromUserId: debtor.userId,
          fromName: debtor.displayName,
          toUserId: creditor.userId,
          toName: creditor.displayName,
          amountMinor: settlementMinor,
          amount: settlementMinor / 100,
          amountFormatted: formatMoney(settlementMinor, currency),
        });

        creditor.amountMinor -= settlementMinor;
        debtor.amountMinor -= settlementMinor;
      }

      if (creditor.amountMinor === 0) cIdx++;
      if (debtor.amountMinor === 0) dIdx++;
    }

    const summary: SettlementSummary = {
      tripId,
      netBalances,
      transactions,
      isFullySettled: transactions.length === 0,
      updatedAt: new Date().toISOString(),
    };

    // Cache locally
    const localRecord: LocalSettlement = {
      tripId,
      netBalancesJson: JSON.stringify(netBalances),
      transactionsJson: JSON.stringify(transactions),
      isFullySettled: summary.isFullySettled,
      updatedAt: summary.updatedAt,
    };
    await this.db.saveSettlement(localRecord);

    return summary;
  }

  /**
   * Reconciles remote settlement payload from server.
   */
  async reconcileServerSettlement(
    tripId: string,
    serverData: any,
  ): Promise<void> {
    const localRecord: LocalSettlement = {
      tripId,
      netBalancesJson: JSON.stringify(serverData.netBalances || {}),
      transactionsJson: JSON.stringify(serverData.transactions || []),
      isFullySettled: Boolean(serverData.isFullySettled),
      updatedAt: serverData.updatedAt || new Date().toISOString(),
    };
    await this.db.saveSettlement(localRecord);
  }
}

export const settlementRepository = new SettlementRepository();
