// src/utils/money/money.ts
import {
  CurrencyCode,
  CurrencyConfig,
  CURRENCY_CONFIGS,
  Money,
  SplitShare,
} from './money.types';

/**
 * Retrieves the configuration for a given currency code.
 * Defaults to 2 decimal places if the currency is not explicitly mapped.
 */
export function getCurrencyConfig(
  currency: CurrencyCode = 'INR',
): CurrencyConfig {
  const upper = (currency || 'INR').toUpperCase();
  return (
    CURRENCY_CONFIGS[upper] || {
      code: upper,
      symbol: upper,
      decimals: 2,
      minorUnitName: 'units',
    }
  );
}

/**
 * Safely converts a major unit amount (e.g. ₹1,250.50 or "$10.25") into integer minor units (paise / cents).
 * Avoids JavaScript floating-point artifacts (e.g. 1.14 * 100 = 113.99999999999999).
 */
export function toMinorUnits(
  majorAmount: number | string,
  currency: CurrencyCode = 'INR',
): number {
  if (majorAmount === null || majorAmount === undefined || majorAmount === '') {
    return 0;
  }

  const config = getCurrencyConfig(currency);
  const decimals = config.decimals;

  if (decimals === 0) {
    const parsed =
      typeof majorAmount === 'string'
        ? parseFloat(majorAmount.replace(/,/g, ''))
        : majorAmount;
    return Math.round(parsed || 0);
  }

  const str =
    typeof majorAmount === 'number'
      ? majorAmount.toString()
      : majorAmount.replace(/,/g, '').trim();

  const isNegative = str.startsWith('-');
  const cleanStr = isNegative ? str.slice(1) : str;

  const parts = cleanStr.split('.');
  const integerPart = parts[0] || '0';
  let decimalPart = parts[1] || '';

  // Pad or truncate to the configured decimal places
  if (decimalPart.length < decimals) {
    decimalPart = decimalPart.padEnd(decimals, '0');
  } else if (decimalPart.length > decimals) {
    decimalPart = decimalPart.slice(0, decimals);
  }

  const combined = integerPart + decimalPart;
  const result = parseInt(combined, 10) || 0;
  return isNegative ? -result : result;
}

/**
 * Converts integer minor units (paise/cents) back to a standard floating-point major unit.
 */
export function toMajorUnits(
  minorAmount: number,
  currency: CurrencyCode = 'INR',
): number {
  const config = getCurrencyConfig(currency);
  if (config.decimals === 0) return minorAmount;
  return minorAmount / Math.pow(10, config.decimals);
}

/**
 * Creates a validated Money value object with integer minor units.
 */
export function createMoney(
  majorAmount: number | string,
  currency: CurrencyCode = 'INR',
): Money {
  return {
    amountMinor: toMinorUnits(majorAmount, currency),
    currency: currency.toUpperCase(),
  };
}

/**
 * Safely adds two Money objects. Throws if currencies do not match.
 */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot add mismatched currencies: ${a.currency} and ${b.currency}`,
    );
  }
  return {
    amountMinor: a.amountMinor + b.amountMinor,
    currency: a.currency,
  };
}

/**
 * Safely subtracts Money b from Money a.
 */
export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot subtract mismatched currencies: ${a.currency} and ${b.currency}`,
    );
  }
  return {
    amountMinor: a.amountMinor - b.amountMinor,
    currency: a.currency,
  };
}

/**
 * Multiplies money by a numeric multiplier with safe integer rounding.
 */
export function multiplyMoney(money: Money, multiplier: number): Money {
  return {
    amountMinor: Math.round(money.amountMinor * multiplier),
    currency: money.currency,
  };
}

/**
 * Splits an amount equally among participants with zero-loss remainder distribution.
 *
 * Example: ₹100 split among 3 people:
 * - Total: 10,000 paise
 * - Quotient: 3,333 paise
 * - Remainder: 1 paise
 * - Distribution: 3,334 + 3,333 + 3,333 = exactly 10,000 paise (₹100.00).
 */
export function splitEqual(
  totalMinor: number,
  members: Array<{ userId: string; displayName: string }>,
): SplitShare[] {
  const n = members.length;
  if (n === 0) return [];

  const quotient = Math.floor(totalMinor / n);
  const remainder = totalMinor % n;

  return members.map((member, index) => ({
    userId: member.userId,
    displayName: member.displayName,
    amountMinor: quotient + (index < remainder ? 1 : 0),
  }));
}

/**
 * Splits an amount by percentage shares, distributing rounding deltas to ensure
 * the sum of shares exactly matches the total amount.
 */
export function splitByPercentage(
  totalMinor: number,
  members: Array<{ userId: string; displayName: string; percentage: number }>,
): SplitShare[] {
  if (members.length === 0) return [];

  // Calculate base floor amounts
  const rawShares = members.map(member => ({
    userId: member.userId,
    displayName: member.displayName,
    percentage: member.percentage,
    amountMinor: Math.floor((totalMinor * member.percentage) / 100),
    fraction: ((totalMinor * member.percentage) / 100) % 1,
  }));

  const currentSum = rawShares.reduce((acc, curr) => acc + curr.amountMinor, 0);
  let delta = totalMinor - currentSum;

  // Sort indices by largest remainder fraction to distribute leftover minor units
  const sortedIndices = rawShares
    .map((item, idx) => ({ idx, fraction: item.fraction }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < delta; i++) {
    const targetIdx = sortedIndices[i % sortedIndices.length].idx;
    rawShares[targetIdx].amountMinor += 1;
  }

  return rawShares.map(({ userId, displayName, percentage, amountMinor }) => ({
    userId,
    displayName,
    percentage,
    amountMinor,
  }));
}

/**
 * Splits an amount by ratio shares (e.g. 2 shares to Alice, 1 share to Bob).
 */
export function splitByShares(
  totalMinor: number,
  members: Array<{ userId: string; displayName: string; shares: number }>,
): SplitShare[] {
  const totalShares = members.reduce((acc, m) => acc + (m.shares || 1), 0);
  if (totalShares === 0 || members.length === 0) return [];

  const raw = members.map(member => {
    const shares = member.shares || 1;
    const exact = (totalMinor * shares) / totalShares;
    return {
      userId: member.userId,
      displayName: member.displayName,
      shares,
      amountMinor: Math.floor(exact),
      fraction: exact % 1,
    };
  });

  const sum = raw.reduce((acc, r) => acc + r.amountMinor, 0);
  let delta = totalMinor - sum;

  const sorted = raw
    .map((item, idx) => ({ idx, fraction: item.fraction }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < delta; i++) {
    const targetIdx = sorted[i % sorted.length].idx;
    raw[targetIdx].amountMinor += 1;
  }

  return raw.map(({ userId, displayName, shares, amountMinor }) => ({
    userId,
    displayName,
    shares,
    amountMinor,
  }));
}

/**
 * Validates whether exact amounts sum up to the expected total.
 */
export function validateExactSplit(
  totalMinor: number,
  shares: Array<{ userId: string; amountMinor: number }>,
): { isValid: boolean; differenceMinor: number } {
  const sum = shares.reduce((acc, s) => acc + s.amountMinor, 0);
  return {
    isValid: sum === totalMinor,
    differenceMinor: totalMinor - sum,
  };
}

/**
 * Formats minor units into a human-readable, locale-aware currency string.
 *
 * Example:
 * - 125050 paise INR -> "₹1,250.50"
 * - 2500 cents USD -> "$25.00"
 * - 500 yen JPY -> "¥500"
 */
export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode = 'INR',
): string {
  const config = getCurrencyConfig(currency);
  const major = toMajorUnits(amountMinor, currency);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(major);
  } catch {
    // Fallback if Intl fails with uncommon currency
    return `${config.symbol}${major.toFixed(config.decimals)}`;
  }
}
