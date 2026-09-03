export interface MemberBalance {
  userId: string;
  displayName: string;
  netBalance: number; // Positive = credit (is owed), Negative = debit (owes)
}

export interface SettlementTransaction {
  fromUserId: string;
  fromDisplayName: string;
  toUserId: string;
  toDisplayName: string;
  amount: number;
}

/**
 * Minimizes settlement transactions using greedy balance matching algorithm.
 */
export function simplifyDebts(balances: MemberBalance[]): SettlementTransaction[] {
  const debtors = balances
    .filter((b) => b.netBalance < -0.009)
    .map((b) => ({ ...b, amount: Math.abs(b.netBalance) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.netBalance > 0.009)
    .map((b) => ({ ...b, amount: b.netBalance }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: SettlementTransaction[] = [];
  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex]!;
    const creditor = creditors[cIndex]!;

    const settleAmount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round((settleAmount + Number.EPSILON) * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        fromDisplayName: debtor.displayName,
        toUserId: creditor.userId,
        toDisplayName: creditor.displayName,
        amount: roundedAmount,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 0.01) dIndex++;
    if (creditor.amount < 0.01) cIndex++;
  }

  return transactions;
}
