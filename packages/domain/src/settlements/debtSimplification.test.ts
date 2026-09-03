import { simplifyDebts } from './debtSimplification';

describe('Debt Simplification Algorithm (@tripsplit/domain)', () => {
  it('should simplify multi-person circular debts into minimal transactions', () => {
    // Alice paid 90 for Alice, Bob, Charlie (30 each).
    // Bob paid 30 for Charlie.
    // Net: Alice (+60), Bob (0), Charlie (-60).
    const balances = [
      { userId: 'u1', displayName: 'Alice', netBalance: 60 },
      { userId: 'u2', displayName: 'Bob', netBalance: 0 },
      { userId: 'u3', displayName: 'Charlie', netBalance: -60 },
    ];

    const result = simplifyDebts(balances);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fromUserId: 'u3',
      fromDisplayName: 'Charlie',
      toUserId: 'u1',
      toDisplayName: 'Alice',
      amount: 60,
    });
  });
});
