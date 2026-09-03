import { calculateSplits, validateSplitInputs } from './expenseSplits';

describe('Expense Split Calculations (@tripsplit/domain)', () => {
  const members = [
    { userId: 'u1', displayName: 'Alice' },
    { userId: 'u2', displayName: 'Bob' },
    { userId: 'u3', displayName: 'Charlie' },
  ];

  describe('Equal Splits', () => {
    it('should split evenly when amount divides cleanly', () => {
      const result = calculateSplits({
        amountLocal: 90,
        exchangeRate: 1,
        splitMethod: 'equal',
        payerId: 'u1',
        memberIds: ['u1', 'u2', 'u3'],
        allTripMembers: members,
      });

      expect(result).toHaveLength(3);
      expect(result[0]?.amountLocal).toBe(30);
      expect(result[1]?.amountLocal).toBe(30);
      expect(result[2]?.amountLocal).toBe(30);
      expect(result.reduce((s, r) => s + r.amountLocal, 0)).toBe(90);
    });

    it('should allocate remainder cents safely to first members when dividing unevenly', () => {
      const result = calculateSplits({
        amountLocal: 100,
        exchangeRate: 1,
        splitMethod: 'equal',
        payerId: 'u1',
        memberIds: ['u1', 'u2', 'u3'],
        allTripMembers: members,
      });

      expect(result).toHaveLength(3);
      expect(result[0]?.amountLocal).toBe(33.34);
      expect(result[1]?.amountLocal).toBe(33.33);
      expect(result[2]?.amountLocal).toBe(33.33);
      const total = Number(
        (result[0]!.amountLocal + result[1]!.amountLocal + result[2]!.amountLocal).toFixed(2),
      );
      expect(total).toBe(100);
    });
  });

  describe('Percentage Splits', () => {
    it('should calculate percentage shares accurately', () => {
      const result = calculateSplits({
        amountLocal: 200,
        exchangeRate: 1.2,
        splitMethod: 'percentage',
        payerId: 'u1',
        members: [
          { userId: 'u1', displayName: 'Alice', percentage: 50 },
          { userId: 'u2', displayName: 'Bob', percentage: 30 },
          { userId: 'u3', displayName: 'Charlie', percentage: 20 },
        ],
      });

      expect(result[0]?.amountLocal).toBe(100);
      expect(result[0]?.amountBase).toBe(120);
      expect(result[1]?.amountLocal).toBe(60);
      expect(result[2]?.amountLocal).toBe(40);
    });

    it('should validate invalid percentages', () => {
      const invalid = validateSplitInputs({
        amountLocal: 100,
        splitMethod: 'percentage',
        members: [
          { userId: 'u1', displayName: 'Alice', percentage: 50 },
          { userId: 'u2', displayName: 'Bob', percentage: 40 },
        ],
      });

      expect(invalid.isValid).toBe(false);
      expect(invalid.error).toContain('Percentages must add up to 100%');
    });
  });

  describe('Shares Splits', () => {
    it('should divide amounts according to ratio of shares', () => {
      const result = calculateSplits({
        amountLocal: 150,
        exchangeRate: 1,
        splitMethod: 'shares',
        payerId: 'u1',
        members: [
          { userId: 'u1', displayName: 'Alice', shares: 3 },
          { userId: 'u2', displayName: 'Bob', shares: 2 },
        ],
      });

      expect(result[0]?.amountLocal).toBe(90);
      expect(result[1]?.amountLocal).toBe(60);
    });
  });
});
