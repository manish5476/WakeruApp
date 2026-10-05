import { apiClient, ApiResponse } from './client';

export interface CounterpartyBalance {
  counterpartyId: string;
  counterpartyName: string;
  counterpartyEmail?: string;
  grossYouOwe: number;
  grossTheyOwe: number;
  settledPaid: number;
  settledReceived: number;
  netAmount: number;
  direction: 'you_owe' | 'owes_you' | 'settled';
  status: 'pending' | 'partially_paid' | 'paid';
  tripIds: string[];
}

export interface AuthoritativeBalances {
  totalTripSpend: number;
  totalPaid: number;
  myShare: number;
  grossOwedToYou: number;
  grossYouOwe: number;
  netReceivable: number;
  netPayable: number;
  netBalance: number;
  status: 'in_credit' | 'in_debt' | 'settled';
  pendingSettlementCount: number;
  activeOutgoingPaymentsCount: number;
  baseCurrency: string;
  counterparties: CounterpartyBalance[];
}

export interface BalanceBreakdown {
  openingBalance: number;
  totalPaidByUser: number;
  userShareOfExpenses: number;
  amountOthersOweUser: number;
  amountUserOwesOthers: number;
  settledPaid: number;
  settledReceived: number;
  netBalance: number;
  formula: string;
  counterparties: CounterpartyBalance[];
}

export const ledgerApi = {
  getBalances: (tripId?: string): Promise<ApiResponse<AuthoritativeBalances>> =>
    apiClient.get('/ledger/balances', {
      params: tripId ? { tripId } : undefined,
    }),

  getBreakdown: (): Promise<ApiResponse<BalanceBreakdown>> =>
    apiClient.get('/ledger/breakdown'),
};
