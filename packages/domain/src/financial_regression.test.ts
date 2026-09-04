import assert from 'node:assert';
import { describe, it } from 'node:test';

import { calculateSplits, validateSplitInputs } from './splits/expenseSplits.ts';
import { simplifyDebts } from './settlements/debtSimplification.ts';

describe('Financial Regression Suite (@tripsplit/domain)', () => {
  const members = [
    { userId: 'u1', displayName: 'Alice' },
    { userId: 'u2', displayName: 'Bob' },
    { userId: 'u3', displayName: 'Charlie' },
    { userId: 'u4', displayName: 'David' },
  ];

  it('Equal Split: divides cleanly among members', () => {
    const splits = calculateSplits({
      amountLocal: 120,
      exchangeRate: 1,
      splitMethod: 'equal',
      payerId: 'u1',
      memberIds: ['u1', 'u2', 'u3', 'u4'],
      allTripMembers: members,
    });

    assert.strictEqual(splits.length, 4);
    splits.forEach((s) => assert.strictEqual(s.amountLocal, 30));
    const sum = splits.reduce((acc, s) => acc + s.amountLocal, 0);
    assert.strictEqual(sum, 120);
  });

  it('Equal Split: allocates remainder cents correctly on uneven division (100 / 3)', () => {
    const splits = calculateSplits({
      amountLocal: 100,
      exchangeRate: 1,
      splitMethod: 'equal',
      payerId: 'u1',
      memberIds: ['u1', 'u2', 'u3'],
      allTripMembers: members.slice(0, 3),
    });

    assert.strictEqual(splits.length, 3);
    assert.strictEqual(splits[0]!.amountLocal, 33.34);
    assert.strictEqual(splits[1]!.amountLocal, 33.33);
    assert.strictEqual(splits[2]!.amountLocal, 33.33);
    const sum = Number(
      (splits[0]!.amountLocal + splits[1]!.amountLocal + splits[2]!.amountLocal).toFixed(2),
    );
    assert.strictEqual(sum, 100);
  });

  it('Percentage Split: calculates exact percentage shares', () => {
    const splits = calculateSplits({
      amountLocal: 250,
      exchangeRate: 1.5,
      splitMethod: 'percentage',
      payerId: 'u1',
      members: [
        { userId: 'u1', displayName: 'Alice', percentage: 40 },
        { userId: 'u2', displayName: 'Bob', percentage: 40 },
        { userId: 'u3', displayName: 'Charlie', percentage: 20 },
      ],
      allTripMembers: members.slice(0, 3),
    });

    assert.strictEqual(splits.length, 3);
    assert.strictEqual(splits[0]!.amountLocal, 100);
    assert.strictEqual(splits[1]!.amountLocal, 100);
    assert.strictEqual(splits[2]!.amountLocal, 50);
    // Base amounts with 1.5 exchange rate:
    assert.strictEqual(splits[0]!.amountBase, 150);
    assert.strictEqual(splits[1]!.amountBase, 150);
    assert.strictEqual(splits[2]!.amountBase, 75);
  });

  it('Shares Split: splits proportional to share counts', () => {
    const splits = calculateSplits({
      amountLocal: 100,
      exchangeRate: 1,
      splitMethod: 'shares',
      payerId: 'u1',
      members: [
        { userId: 'u1', displayName: 'Alice', shares: 2 },
        { userId: 'u2', displayName: 'Bob', shares: 1 },
        { userId: 'u3', displayName: 'Charlie', shares: 1 },
      ],
      allTripMembers: members.slice(0, 3),
    });

    assert.strictEqual(splits.length, 3);
    assert.strictEqual(splits[0]!.amountLocal, 50);
    assert.strictEqual(splits[1]!.amountLocal, 25);
    assert.strictEqual(splits[2]!.amountLocal, 25);
  });

  it('Exact Split: preserves exact user-specified amounts', () => {
    const splits = calculateSplits({
      amountLocal: 155.75,
      exchangeRate: 1,
      splitMethod: 'exact',
      payerId: 'u1',
      members: [
        { userId: 'u1', displayName: 'Alice', amountLocal: 55.75 },
        { userId: 'u2', displayName: 'Bob', amountLocal: 100 },
      ],
      allTripMembers: members.slice(0, 2),
    });

    assert.strictEqual(splits.length, 2);
    assert.strictEqual(splits[0]!.amountLocal, 55.75);
    assert.strictEqual(splits[1]!.amountLocal, 100);
  });

  it('Validation: detects percentage sum not equaling 100%', () => {
    const res = validateSplitInputs({
      amountLocal: 100,
      splitMethod: 'percentage',
      members: [
        { userId: 'u1', displayName: 'Alice', percentage: 50 },
        { userId: 'u2', displayName: 'Bob', percentage: 40 },
      ],
    });
    assert.strictEqual(res.isValid, false);
    assert.ok(res.error?.includes('100%'));
  });

  it('Validation: detects exact amounts not matching total', () => {
    const res = validateSplitInputs({
      amountLocal: 100,
      splitMethod: 'exact',
      members: [
        { userId: 'u1', displayName: 'Alice', amountLocal: 50 },
        { userId: 'u2', displayName: 'Bob', amountLocal: 40 },
      ],
    });
    assert.strictEqual(res.isValid, false);
    assert.ok(res.error?.includes('Exact amounts must equal'));
  });

  it('Debt Simplification: reduces 3-way circular debt to minimal payments', () => {
    const balances = [
      { userId: 'u1', displayName: 'Alice', netBalance: -10 },
      { userId: 'u2', displayName: 'Bob', netBalance: 0 },
      { userId: 'u3', displayName: 'Charlie', netBalance: 10 },
    ];

    const simplified = simplifyDebts(balances);
    assert.strictEqual(simplified.length, 1);
    assert.strictEqual(simplified[0]!.fromUserId, 'u1');
    assert.strictEqual(simplified[0]!.toUserId, 'u3');
    assert.strictEqual(simplified[0]!.amount, 10);
  });

  it('Debt Simplification: multi-party complex settlement graph', () => {
    const balances = [
      { userId: 'u1', displayName: 'Alice', netBalance: -50 },
      { userId: 'u2', displayName: 'Bob', netBalance: -30 },
      { userId: 'u3', displayName: 'Charlie', netBalance: 40 },
      { userId: 'u4', displayName: 'David', netBalance: 40 },
    ];

    const transactions = simplifyDebts(balances);
    const totalSettled = transactions.reduce((acc, t) => acc + t.amount, 0);
    assert.strictEqual(totalSettled, 80);
    assert.ok(transactions.length <= 3);
  });
});
