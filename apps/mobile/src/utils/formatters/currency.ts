/**
 * Canonical Currency Symbol lookup matching backend & TripSplit standards.
 */
export function getCurrencySymbol(currency: string = 'INR'): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    AED: 'AED ',
    SAR: 'SAR ',
    THB: '฿',
    CHF: 'CHF ',
  };
  return symbols[currency?.toUpperCase()] || (currency ? `${currency} ` : '₹');
}

/**
 * Strict currency formatter that ensures output is always compact and never overflows.
 * Handles extreme cases like 5000000000 by clamping it to Cr/M.
 */
export function formatCompactCurrency(
  amount: number | null | undefined,
  currency: string = 'INR',
): string {
  const value = Number(amount);
  const symbol = getCurrencySymbol(currency);
  if (!Number.isFinite(value) || value === 0) return `${symbol}0`;

  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  // Limit to Crore/Lakh for INR
  if (currency?.toUpperCase() === 'INR') {
    if (abs >= 1_00_00_000) {
      const crValue = Number((abs / 1_00_00_000).toFixed(1));
      return `${sign}${symbol}${crValue.toLocaleString('en-IN')}Cr`;
    }
    if (abs >= 1_00_000) {
      return `${sign}${symbol}${(abs / 1_00_000).toFixed(1).replace(/\.0$/, '')}L`;
    }
  } else {
    if (abs >= 1_000_000) {
      return `${sign}${symbol}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
  }

  // Limit to K
  if (abs >= 1_000) {
    return `${sign}${symbol}${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return `${sign}${symbol}${abs.toFixed(0)}`;
}
