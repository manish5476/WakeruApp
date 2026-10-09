// __tests__/utils/money.test.ts
import {
  getCurrencyConfig,
  toMinorUnits,
  toMajorUnits,
  createMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  splitEqual,
  splitByPercentage,
  splitByShares,
  validateExactSplit,
  formatMoney,
} from '../../src/utils/money/money';

// ─── getCurrencyConfig ────────────────────────────────────────────────────────

describe('getCurrencyConfig', () => {
  it('returns INR config by default', () => {
    const cfg = getCurrencyConfig();
    expect(cfg.code).toBe('INR');
    expect(cfg.decimals).toBe(2);
    expect(cfg.symbol).toBe('₹');
  });

  it('returns correct config for USD', () => {
    const cfg = getCurrencyConfig('USD');
    expect(cfg.code).toBe('USD');
    expect(cfg.decimals).toBe(2);
  });

  it('returns 0 decimals for JPY', () => {
    const cfg = getCurrencyConfig('JPY');
    expect(cfg.decimals).toBe(0);
  });

  it('returns 3 decimals for KWD', () => {
    const cfg = getCurrencyConfig('KWD');
    expect(cfg.decimals).toBe(3);
  });

  it('falls back to 2 decimals for unknown currency', () => {
    const cfg = getCurrencyConfig('XYZ');
    expect(cfg.decimals).toBe(2);
    expect(cfg.code).toBe('XYZ');
  });
});

// ─── toMinorUnits ─────────────────────────────────────────────────────────────

describe('toMinorUnits', () => {
  it('converts 1250.5 to 125050 paise', () => {
    expect(toMinorUnits(1250.5, 'INR')).toBe(125050);
  });

  it('converts string "1250.50" correctly', () => {
    expect(toMinorUnits('1250.50', 'INR')).toBe(125050);
  });

  it('converts string with commas "1,250.50" correctly', () => {
    expect(toMinorUnits('1,250.50', 'INR')).toBe(125050);
  });

  it('handles negative amounts', () => {
    expect(toMinorUnits(-100.5, 'INR')).toBe(-10050);
  });

  it('handles negative string amounts', () => {
    expect(toMinorUnits('-100.50', 'INR')).toBe(-10050);
  });

  it('avoids floating-point artifact: 1.14 converts to 114 not 113', () => {
    expect(toMinorUnits(1.14, 'INR')).toBe(114);
  });

  it('returns 0 for empty string', () => {
    expect(toMinorUnits('', 'INR')).toBe(0);
  });

  it('returns 0 for null', () => {
    // @ts-expect-error testing edge case
    expect(toMinorUnits(null, 'INR')).toBe(0);
  });

  it('returns 0 for undefined', () => {
    // @ts-expect-error testing edge case
    expect(toMinorUnits(undefined, 'INR')).toBe(0);
  });

  it('handles JPY with 0 decimals correctly', () => {
    expect(toMinorUnits(500, 'JPY')).toBe(500);
    expect(toMinorUnits(500.9, 'JPY')).toBe(501);
  });

  it('handles KWD with 3 decimals', () => {
    expect(toMinorUnits(1.5, 'KWD')).toBe(1500);
    expect(toMinorUnits('1.500', 'KWD')).toBe(1500);
  });

  it('truncates excess decimal places', () => {
    // 1.1234 with 2 decimals should give 112, not 112.34
    expect(toMinorUnits(1.1234, 'INR')).toBe(112);
  });
});

// ─── toMajorUnits ─────────────────────────────────────────────────────────────

describe('toMajorUnits', () => {
  it('converts 125050 paise to 1250.50 rupees', () => {
    expect(toMajorUnits(125050, 'INR')).toBeCloseTo(1250.5, 5);
  });

  it('converts 500 yen: JPY has 0 decimals so returns 500', () => {
    expect(toMajorUnits(500, 'JPY')).toBe(500);
  });

  it('converts 100 cents USD to 1.00 dollar', () => {
    expect(toMajorUnits(100, 'USD')).toBeCloseTo(1.0, 5);
  });
});

// ─── createMoney ─────────────────────────────────────────────────────────────

describe('createMoney', () => {
  it('creates a Money object from a major amount', () => {
    const money = createMoney(100.5, 'INR');
    expect(money.amountMinor).toBe(10050);
    expect(money.currency).toBe('INR');
  });

  it('uppercases the currency code', () => {
    const money = createMoney(10, 'usd');
    expect(money.currency).toBe('USD');
  });

  it('creates from string amount', () => {
    const money = createMoney('50.00', 'USD');
    expect(money.amountMinor).toBe(5000);
  });
});

// ─── addMoney ────────────────────────────────────────────────────────────────

describe('addMoney', () => {
  it('adds two amounts of the same currency', () => {
    const a = createMoney(100, 'INR');
    const b = createMoney(200, 'INR');
    expect(addMoney(a, b).amountMinor).toBe(30000);
  });

  it('throws for mismatched currencies', () => {
    const inr = createMoney(100, 'INR');
    const usd = createMoney(50, 'USD');
    expect(() => addMoney(inr, usd)).toThrow();
  });

  it('preserves the currency code', () => {
    const a = createMoney(10, 'USD');
    const b = createMoney(5, 'USD');
    expect(addMoney(a, b).currency).toBe('USD');
  });
});

// ─── subtractMoney ───────────────────────────────────────────────────────────

describe('subtractMoney', () => {
  it('subtracts two amounts of the same currency', () => {
    const a = createMoney(200, 'INR');
    const b = createMoney(100, 'INR');
    expect(subtractMoney(a, b).amountMinor).toBe(10000);
  });

  it('can produce a negative result', () => {
    const a = createMoney(50, 'INR');
    const b = createMoney(100, 'INR');
    expect(subtractMoney(a, b).amountMinor).toBe(-5000);
  });

  it('throws for mismatched currencies', () => {
    const inr = createMoney(100, 'INR');
    const usd = createMoney(50, 'USD');
    expect(() => subtractMoney(inr, usd)).toThrow();
  });
});

// ─── multiplyMoney ───────────────────────────────────────────────────────────

describe('multiplyMoney', () => {
  it('multiplies by an integer', () => {
    const m = createMoney(100, 'INR'); // 10000 paise
    expect(multiplyMoney(m, 3).amountMinor).toBe(30000);
  });

  it('rounds fractional multiplication correctly', () => {
    const m = { amountMinor: 10001, currency: 'INR' as const };
    // 10001 * 0.5 = 5000.5 => rounded to 5001
    expect(multiplyMoney(m, 0.5).amountMinor).toBe(5001);
  });

  it('multiplying by 0 gives 0', () => {
    const m = createMoney(500, 'INR');
    expect(multiplyMoney(m, 0).amountMinor).toBe(0);
  });
});

// ─── splitEqual ──────────────────────────────────────────────────────────────

describe('splitEqual', () => {
  const members = [
    { userId: 'u1', displayName: 'Alice' },
    { userId: 'u2', displayName: 'Bob' },
    { userId: 'u3', displayName: 'Charlie' },
  ];

  it('splits evenly when divisible: 30000 / 3 = 10000 each', () => {
    const shares = splitEqual(30000, members);
    expect(shares).toHaveLength(3);
    shares.forEach(s => expect(s.amountMinor).toBe(10000));
  });

  it('distributes remainder with zero-loss: 10000 / 3 => 3334 + 3333 + 3333', () => {
    const shares = splitEqual(10000, members);
    const total = shares.reduce((acc, s) => acc + s.amountMinor, 0);
    expect(total).toBe(10000);
    expect(shares[0].amountMinor).toBe(3334);
    expect(shares[1].amountMinor).toBe(3333);
    expect(shares[2].amountMinor).toBe(3333);
  });

  it('returns empty array for no members', () => {
    expect(splitEqual(10000, [])).toEqual([]);
  });

  it('assigns all amount to the single member', () => {
    const shares = splitEqual(5000, [{ userId: 'u1', displayName: 'Alice' }]);
    expect(shares[0].amountMinor).toBe(5000);
  });

  it('includes userId and displayName in each share', () => {
    const shares = splitEqual(10000, members);
    expect(shares[0].userId).toBe('u1');
    expect(shares[0].displayName).toBe('Alice');
  });
});

// ─── splitByPercentage ───────────────────────────────────────────────────────

describe('splitByPercentage', () => {
  it('splits 50/50 exactly', () => {
    const members = [
      { userId: 'u1', displayName: 'Alice', percentage: 50 },
      { userId: 'u2', displayName: 'Bob', percentage: 50 },
    ];
    const shares = splitByPercentage(10000, members);
    expect(shares[0].amountMinor).toBe(5000);
    expect(shares[1].amountMinor).toBe(5000);
    const total = shares.reduce((acc, s) => acc + s.amountMinor, 0);
    expect(total).toBe(10000);
  });

  it('distributes remainder so total always matches', () => {
    const members = [
      { userId: 'u1', displayName: 'Alice', percentage: 33 },
      { userId: 'u2', displayName: 'Bob', percentage: 33 },
      { userId: 'u3', displayName: 'Charlie', percentage: 34 },
    ];
    const shares = splitByPercentage(10001, members);
    const total = shares.reduce((acc, s) => acc + s.amountMinor, 0);
    expect(total).toBe(10001);
  });

  it('returns empty array for no members', () => {
    expect(splitByPercentage(10000, [])).toEqual([]);
  });

  it('includes percentage in the share', () => {
    const members = [{ userId: 'u1', displayName: 'Alice', percentage: 100 }];
    const shares = splitByPercentage(10000, members);
    expect(shares[0].percentage).toBe(100);
    expect(shares[0].amountMinor).toBe(10000);
  });
});

// ─── splitByShares ───────────────────────────────────────────────────────────

describe('splitByShares', () => {
  it('splits 2:1 ratio correctly', () => {
    const members = [
      { userId: 'u1', displayName: 'Alice', shares: 2 },
      { userId: 'u2', displayName: 'Bob', shares: 1 },
    ];
    const shares = splitByShares(9000, members);
    expect(shares[0].amountMinor).toBe(6000); // 2/3
    expect(shares[1].amountMinor).toBe(3000); // 1/3
    const total = shares.reduce((acc, s) => acc + s.amountMinor, 0);
    expect(total).toBe(9000);
  });

  it('distributes remainder to avoid penny loss', () => {
    const members = [
      { userId: 'u1', displayName: 'Alice', shares: 1 },
      { userId: 'u2', displayName: 'Bob', shares: 1 },
      { userId: 'u3', displayName: 'Charlie', shares: 1 },
    ];
    const shares = splitByShares(10001, members);
    const total = shares.reduce((acc, s) => acc + s.amountMinor, 0);
    expect(total).toBe(10001);
  });

  it('returns empty array when no members', () => {
    expect(splitByShares(10000, [])).toEqual([]);
  });
});

// ─── validateExactSplit ──────────────────────────────────────────────────────

describe('validateExactSplit', () => {
  it('returns isValid=true when shares sum to total', () => {
    const shares = [
      { userId: 'u1', amountMinor: 5000 },
      { userId: 'u2', amountMinor: 5000 },
    ];
    const result = validateExactSplit(10000, shares);
    expect(result.isValid).toBe(true);
    expect(result.differenceMinor).toBe(0);
  });

  it('returns isValid=false and correct positive difference', () => {
    const shares = [
      { userId: 'u1', amountMinor: 4000 },
      { userId: 'u2', amountMinor: 5000 },
    ];
    const result = validateExactSplit(10000, shares);
    expect(result.isValid).toBe(false);
    expect(result.differenceMinor).toBe(1000);
  });

  it('handles negative difference when overpaid', () => {
    const shares = [
      { userId: 'u1', amountMinor: 6000 },
      { userId: 'u2', amountMinor: 5000 },
    ];
    const result = validateExactSplit(10000, shares);
    expect(result.isValid).toBe(false);
    expect(result.differenceMinor).toBe(-1000);
  });
});

// ─── formatMoney ─────────────────────────────────────────────────────────────

describe('formatMoney', () => {
  it('formats INR paise to rupee string containing 1,250.50', () => {
    const formatted = formatMoney(125050, 'INR');
    expect(formatted).toContain('1,250.50');
  });

  it('formats 0 minor units', () => {
    const formatted = formatMoney(0, 'INR');
    expect(formatted).toContain('0');
  });

  it('formats JPY with 0 decimal places', () => {
    const formatted = formatMoney(500, 'JPY');
    expect(formatted).toContain('500');
    expect(formatted).not.toMatch(/500\.\d/);
  });

  it('formats USD cents to dollar string containing 25', () => {
    const formatted = formatMoney(2500, 'USD');
    expect(formatted).toContain('25');
  });

  it('does not throw for unknown currency code', () => {
    expect(() => formatMoney(1000, 'XYZ')).not.toThrow();
  });
});
