// __tests__/utils/formatters.test.ts
import {
  formatDate,
  formatTime,
  getRelativeTime,
  getMonthName,
  formatAmount,
  safeFormatCurrency,
} from '../../src/utils/formatters';

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a Date object to dd-Mon-yyyy style', () => {
    const date = new Date('2024-01-15T10:00:00');
    const formatted = formatDate(date);
    expect(formatted).toContain('15');
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('2024');
  });

  it('formats a date string', () => {
    const formatted = formatDate('2024-06-01T00:00:00');
    expect(formatted).toContain('2024');
  });
});

// ─── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formats a Date object to time string', () => {
    const date = new Date('2024-01-15T14:30:00');
    const formatted = formatTime(date);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it('formats a date string to time', () => {
    const formatted = formatTime('2024-01-15T09:05:00');
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });
});

// ─── getRelativeTime ──────────────────────────────────────────────────────────

describe('getRelativeTime', () => {
  const DAY_MS = 1000 * 60 * 60 * 24;

  it('returns "Today" for today\'s date', () => {
    const today = new Date();
    expect(getRelativeTime(today)).toBe('Today');
  });

  it('returns "Tomorrow" for tomorrow\'s date', () => {
    const tomorrow = new Date(Date.now() + DAY_MS);
    expect(getRelativeTime(tomorrow)).toBe('Tomorrow');
  });

  it('returns past relative time for a date in the past', () => {
    const yesterday = new Date(Date.now() - DAY_MS);
    const result = getRelativeTime(yesterday);
    expect(result).toContain('days ago');
  });

  it('returns "In X days" for a date a few days ahead', () => {
    const inThreeDays = new Date(Date.now() + 3 * DAY_MS);
    const result = getRelativeTime(inThreeDays);
    expect(result).toMatch(/In \d+ days/);
  });

  it('returns "In X weeks" for a date 2+ weeks ahead', () => {
    const inTwoWeeks = new Date(Date.now() + 14 * DAY_MS);
    const result = getRelativeTime(inTwoWeeks);
    expect(result).toMatch(/In \d+ weeks/);
  });

  it('returns "In X months" for a date 2+ months ahead', () => {
    const inTwoMonths = new Date(Date.now() + 60 * DAY_MS);
    const result = getRelativeTime(inTwoMonths);
    expect(result).toMatch(/In \d+ months/);
  });

  it('returns "In X years" for a date 1+ year ahead', () => {
    const inNextYear = new Date(Date.now() + 400 * DAY_MS);
    const result = getRelativeTime(inNextYear);
    expect(result).toMatch(/In \d+ years/);
  });
});

// ─── getMonthName ─────────────────────────────────────────────────────────────

describe('getMonthName', () => {
  it('returns correct month names', () => {
    expect(getMonthName(1)).toBe('Jan');
    expect(getMonthName(6)).toBe('Jun');
    expect(getMonthName(12)).toBe('Dec');
  });

  it('returns empty string for out-of-range month', () => {
    expect(getMonthName(0)).toBe('');
    expect(getMonthName(13)).toBe('');
  });
});

// ─── formatAmount ─────────────────────────────────────────────────────────────

describe('formatAmount', () => {
  it('formats amounts below 1000 as plain number', () => {
    expect(formatAmount(500, 'INR')).toBe('₹500');
  });

  it('formats thousands with K suffix', () => {
    const result = formatAmount(1500, 'INR');
    expect(result).toContain('K');
    expect(result).toContain('₹');
  });

  it('formats lakhs with L suffix', () => {
    const result = formatAmount(150000, 'INR');
    expect(result).toContain('L');
  });

  it('formats crores with Cr suffix', () => {
    const result = formatAmount(10000000, 'INR');
    expect(result).toContain('Cr');
  });

  it('uses $ symbol for USD', () => {
    const result = formatAmount(1500, 'USD');
    expect(result).toContain('$');
  });

  it('uses euro symbol for EUR', () => {
    const result = formatAmount(1500, 'EUR');
    expect(result).toContain('€');
  });

  it('returns 0 for NaN input', () => {
    const result = formatAmount(NaN, 'INR');
    expect(result).toContain('0');
  });

  it('strips trailing zeros: 1.50K -> 1.5K', () => {
    // 1500 / 1000 = 1.50, trailing zero stripped -> 1.5K
    const result = formatAmount(1500, 'INR');
    expect(result).not.toContain('1.50K');
    expect(result).toContain('1.5K');
  });
});

// ─── safeFormatCurrency ───────────────────────────────────────────────────────

describe('safeFormatCurrency', () => {
  it('is an alias for formatAmount and behaves identically', () => {
    expect(safeFormatCurrency(5000, 'INR')).toBe(formatAmount(5000, 'INR'));
    expect(safeFormatCurrency(1000000, 'USD')).toBe(
      formatAmount(1000000, 'USD'),
    );
  });
});
