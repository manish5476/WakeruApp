// src/utils/receiptParser/receiptParser.types.ts

export type ReceiptConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface ReceiptDraft {
  merchantName?: string;
  totalMinor?: number; // In integer minor units (paise for INR)
  subtotalMinor?: number;
  taxMinor?: number;
  cgstMinor?: number;
  sgstMinor?: number;
  currency: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  receiptNumber?: string;
  items: ReceiptItem[];
  categorySuggestion: string;
  parserVersion: string;
  confidenceLevel: ReceiptConfidenceLevel;
  receiptHash?: string;
  rawText: string;
}
