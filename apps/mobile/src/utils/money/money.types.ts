// src/utils/money/money.types.ts

export type CurrencyCode =
  | 'INR'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'AED'
  | 'THB'
  | 'SGD'
  | 'AUD'
  | 'CAD'
  | string;

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  decimals: number; // e.g. 2 for INR/USD, 0 for JPY, 3 for KWD
  minorUnitName: string; // e.g. "paise", "cents"
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', decimals: 2, minorUnitName: 'paise' },
  USD: { code: 'USD', symbol: '$', decimals: 2, minorUnitName: 'cents' },
  EUR: { code: 'EUR', symbol: '€', decimals: 2, minorUnitName: 'cents' },
  GBP: { code: 'GBP', symbol: '£', decimals: 2, minorUnitName: 'pence' },
  AED: { code: 'AED', symbol: 'AED', decimals: 2, minorUnitName: 'fils' },
  THB: { code: 'THB', symbol: '฿', decimals: 2, minorUnitName: 'satang' },
  SGD: { code: 'SGD', symbol: 'S$', decimals: 2, minorUnitName: 'cents' },
  AUD: { code: 'AUD', symbol: 'A$', decimals: 2, minorUnitName: 'cents' },
  CAD: { code: 'CAD', symbol: 'C$', decimals: 2, minorUnitName: 'cents' },
  JPY: { code: 'JPY', symbol: '¥', decimals: 0, minorUnitName: 'yen' },
  KWD: { code: 'KWD', symbol: 'KD', decimals: 3, minorUnitName: 'fils' },
};

export interface Money {
  amountMinor: number; // Stored strictly as an integer (e.g. 125050 paise for ₹1,250.50)
  currency: CurrencyCode;
}

export interface SplitShare {
  userId: string;
  displayName: string;
  amountMinor: number;
  percentage?: number;
  shares?: number;
}
