// src/utils/receiptParser/receiptParser.ts
import { OcrResult, OcrLine } from '../../services/ocr/ocr.types';
import { toMinorUnits } from '../money/money';
import {
  ReceiptDraft,
  ReceiptItem,
  ReceiptConfidenceLevel,
} from './receiptParser.types';

export const RECEIPT_PARSER_VERSION = '1.0.0';

const NOISE_HEADER_PATTERNS = [
  /^tax\s+invoice/i,
  /^retail\s+invoice/i,
  /^bill\s+of\s+supply/i,
  /^cash\s+receipt/i,
  /^cash\s+memo/i,
  /^original\s+for\s+recipient/i,
  /^duplicate\s+for\s+transporter/i,
  /^estimate/i,
  /^quotation/i,
  /^proforma/i,
  /^welcome/i,
  /^thank\s+you/i,
  /^invoice/i,
  /^receipt/i,
  /^order\s+#/i,
  /^table\s+#/i,
  /^gstin/i,
  /^\+?[0-9\s-]{10,}$/, // Phone numbers
  /^www\./i,
  /^https?:\/\//i,
];

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

/**
 * Extracts a numeric minor amount in paise from a raw OCR string.
 * Handles: ₹850, ₹ 850, Rs 850, Rs. 850, INR 850, 1,250, 1,250.50
 * Prioritizes explicit currency tokens and ignores tax percentage rates (e.g. @ 2.5%).
 */
export function parseAmountMinor(raw: string): number | null {
  if (!raw) return null;

  // 1. If there is an explicit currency symbol with amount (e.g. ₹ 17.75, Rs. 17.75, INR 17.75), prioritize it
  const currencyMatch = raw.match(
    /(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
  );
  if (currencyMatch) {
    const numStr = currencyMatch[1].replace(/,/g, '');
    const val = parseFloat(numStr);
    if (!isNaN(val) && val >= 0) {
      return toMinorUnits(val, 'INR');
    }
  }

  // 2. Strip percentage rates like "@ 2.5%", "2.5%", "5%" so rates don't masquerade as amounts
  let cleaned = raw.replace(/@?\s*[0-9]+(?:\.[0-9]+)?\s*%/g, '');

  // Strip currency prefixes and clean symbols
  cleaned = cleaned
    .replace(/[₹RsINR]/gi, '')
    .replace(/[:=]/g, '')
    .trim();

  // Match standard numbers with optional comma separators and optional 2 decimals
  const match = cleaned.match(
    /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/,
  );
  if (!match) return null;

  const numStr = match[1].replace(/,/g, '');
  const val = parseFloat(numStr);
  if (isNaN(val) || val < 0) return null;

  return toMinorUnits(val, 'INR');
}

/**
 * Normalizes detected dates into ISO format (YYYY-MM-DD).
 */
export function extractDateAndTime(lines: string[]): {
  date?: string;
  time?: string;
} {
  let date: string | undefined;
  let time: string | undefined;

  for (const line of lines) {
    // 1. Time search: HH:MM:SS or HH:MM AM/PM
    if (!time) {
      const timeMatch = line.match(
        /\b([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?\s*(am|pm|AM|PM)?\b/,
      );
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2];
        const meridiem = timeMatch[4]?.toUpperCase();

        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;

        time = `${String(hours).padStart(2, '0')}:${minutes}`;
      }
    }

    // 2. Date search
    if (!date) {
      // Format: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
      const numDateMatch = line.match(
        /\b(0?[1-9]|[12][0-9]|3[01])[\/\-\.](0?[1-9]|1[012])[\/\-\.](20\d\d|\d\d)\b/,
      );
      if (numDateMatch) {
        const day = numDateMatch[1].padStart(2, '0');
        const month = numDateMatch[2].padStart(2, '0');
        let year = numDateMatch[3];
        if (year.length === 2) year = `20${year}`;
        date = `${year}-${month}-${day}`;
        continue;
      }

      // Format: YYYY-MM-DD
      const isoMatch = line.match(
        /\b(20\d\d)[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])\b/,
      );
      if (isoMatch) {
        const year = isoMatch[1];
        const month = isoMatch[2].padStart(2, '0');
        const day = isoMatch[3].padStart(2, '0');
        date = `${year}-${month}-${day}`;
        continue;
      }

      // Format: DD MMM YYYY (e.g. 17 Sep 2026, 17-Sep-2026)
      const textDateMatch = line.match(
        /\b(0?[1-9]|[12][0-9]|3[01])[\s\-\.]([A-Za-z]{3,9})[\s\-\.](20\d\d)\b/,
      );
      if (textDateMatch) {
        const day = textDateMatch[1].padStart(2, '0');
        const monthStr = textDateMatch[2].toLowerCase();
        const month = MONTH_MAP[monthStr];
        const year = textDateMatch[3];
        if (month) {
          date = `${year}-${month}-${day}`;
          continue;
        }
      }
    }
  }

  return { date, time };
}

/**
 * Extracts merchant business name by inspecting top lines and removing noise.
 */
export function extractMerchant(lines: string[]): string | undefined {
  const topLines = lines.slice(0, 6);

  for (const rawLine of topLines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.length < 3) continue;

    // Check against noise patterns
    const isNoise = NOISE_HEADER_PATTERNS.some(pattern =>
      pattern.test(trimmed),
    );
    if (isNoise) continue;

    // Reject lines that are primarily numbers or GSTIN
    if (GSTIN_REGEX.test(trimmed.replace(/\s/g, ''))) continue;
    if (/^[0-9\s,.:;/-]+$/.test(trimmed)) continue;

    // Clean edge punctuation
    const cleaned = trimmed
      .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9.]+$/g, '')
      .trim();
    if (cleaned.length >= 3 && /[a-zA-Z]/.test(cleaned)) {
      return cleaned;
    }
  }

  return undefined;
}

/**
 * Extracts receipt or invoice number.
 */
export function extractReceiptNumber(lines: string[]): string | undefined {
  const regex =
    /(?:receipt\s*(?:no|#|num)?|invoice\s*(?:no|#|num)?|bill\s*(?:no|#|num)?|bill\s*number|txn\s*(?:id|#)?|order\s*(?:id|#)?|trip\s*(?:id|#)?)[\s:.-]*([A-Za-z0-9\/-]+)/i;

  for (const line of lines) {
    const match = line.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Exclude if it looks like a GSTIN
      if (
        !GSTIN_REGEX.test(candidate) &&
        candidate.length >= 2 &&
        candidate.length <= 32
      ) {
        return candidate;
      }
    }
  }

  return undefined;
}

/**
 * Extracts Payable Total, Subtotal, and Tax (CGST + SGST) from receipt lines.
 */
export function extractFinancialTotals(lines: string[]): {
  totalMinor?: number;
  subtotalMinor?: number;
  taxMinor?: number;
  cgstMinor?: number;
  sgstMinor?: number;
} {
  let totalMinor: number | undefined;
  let subtotalMinor: number | undefined;
  let cgstMinor: number | undefined;
  let sgstMinor: number | undefined;
  let taxMinor: number | undefined;

  // Patterns for grand / payable total (with OCR typo variants)
  const grandTotalRegex =
    /(?:grand\s*total|net\s*total|net\s*amount(?:\s*payable)?|amount\s*payable|amount\s*due|total\s*amount|balance\s*due|to\s*pay|total|t0tal|totai|t0tai|tdtal|tota1)[\s:]*([₹\sRsINR0-9,.]+)?/i;
  const subtotalRegex =
    /(?:sub\s*total|subtotal|gross\s*amount|items\s*total)[\s:]*([₹\sRsINR0-9,.]+)?/i;
  const cgstRegex =
    /(?:cgst|central\s*gst)(?:[\s\w%@.-]*?)[\s:]*([₹\sRsINR0-9,.]+)/i;
  const sgstRegex =
    /(?:sgst|state\s*gst)(?:[\s\w%@.-]*?)[\s:]*([₹\sRsINR0-9,.]+)/i;
  const genericTaxRegex =
    /(?:tax|gst|igst|vat|service\s*tax)(?:[\s\w%@.-]*?)[\s:]*([₹\sRsINR0-9,.]+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Check Subtotal
    if (subtotalMinor === undefined) {
      const subMatch = line.match(subtotalRegex);
      if (subMatch) {
        const val = subMatch[1]
          ? parseAmountMinor(subMatch[1])
          : i + 1 < lines.length
            ? parseAmountMinor(lines[i + 1])
            : null;
        if (val && val > 0) subtotalMinor = val;
      }
    }

    // 2. Check CGST
    if (cgstMinor === undefined) {
      const cgstMatch = line.match(cgstRegex);
      if (cgstMatch && cgstMatch[1]) {
        const val = parseAmountMinor(cgstMatch[1]);
        if (val && val > 0) cgstMinor = val;
      }
    }

    // 3. Check SGST
    if (sgstMinor === undefined) {
      const sgstMatch = line.match(sgstRegex);
      if (sgstMatch && sgstMatch[1]) {
        const val = parseAmountMinor(sgstMatch[1]);
        if (val && val > 0) sgstMinor = val;
      }
    }

    // 4. Check Generic Tax if not set
    if (taxMinor === undefined && cgstMinor === undefined) {
      const taxMatch = line.match(genericTaxRegex);
      if (taxMatch && taxMatch[1]) {
        const val = parseAmountMinor(taxMatch[1]);
        if (val && val > 0) taxMinor = val;
      }
    }

    // 5. Check Grand Total (exclude lines that are subtotals)
    if (!subtotalRegex.test(line)) {
      const gtMatch = line.match(grandTotalRegex);
      if (gtMatch) {
        let candidate: number | null = null;
        if (gtMatch[1]) {
          candidate = parseAmountMinor(gtMatch[1]);
        }
        // If the label is alone on the line, look at subsequent line or line tokens
        if (!candidate && i + 1 < lines.length) {
          candidate = parseAmountMinor(lines[i + 1]);
        }

        if (candidate && candidate > 0) {
          // Exclude phone numbers or dates (e.g. 9876543210 paise = ₹9.8 crore or 20260917)
          if (candidate < 1000000000) {
            totalMinor = candidate;
          }
        }
      }
    }
  }

  // Combine CGST and SGST into taxMinor if both present
  if (cgstMinor !== undefined || sgstMinor !== undefined) {
    taxMinor = (cgstMinor || 0) + (sgstMinor || 0);
  }

  return { totalMinor, subtotalMinor, taxMinor, cgstMinor, sgstMinor };
}

/**
 * Suggests an expense category based on merchant name and receipt text.
 * Aligns with TripSplit ExpenseCategory ('food' | 'stay' | 'transport' | 'activity' | 'shopping' | 'health' | 'other').
 */
export function suggestCategory(text: string, merchant?: string): string {
  const merchantLower = (merchant || '').toLowerCase();
  const textLower = text.toLowerCase();

  const categoryMap: { category: string; keywords: string[] }[] = [
    {
      category: 'stay',
      keywords: [
        'hotel',
        'resort',
        'lodging',
        'inn',
        'suites',
        'homestay',
        'hostel',
        'room',
        'stay',
        'villa',
        'airbnb',
        'oyo',
        'guest house',
        'tariff',
      ],
    },
    {
      category: 'transport',
      keywords: [
        'uber',
        'ola',
        'taxi',
        'cab',
        'metro',
        'bus',
        'toll',
        'fuel',
        'petrol',
        'diesel',
        'auto',
        'ride',
        'railway',
        'irctc',
        'flight',
        'airline',
        'parking',
        'fastag',
      ],
    },
    {
      category: 'health',
      keywords: [
        'pharmacy',
        'chemist',
        'hospital',
        'clinic',
        'medical',
        'meds',
        'healthcare',
        'diagnostic',
        'apollo',
        'medplus',
        'dr.',
      ],
    },
    {
      category: 'food',
      keywords: [
        'restaurant',
        'cafe',
        'coffee',
        'dining',
        'pizza',
        'burger',
        'kitchen',
        'bar',
        'bakery',
        'sweets',
        'biryani',
        'grill',
        'dhaba',
        'meals',
        'roll',
        'canteen',
        'bistro',
        'food',
        'tea',
        'starbucks',
        'dominos',
        'mcdonald',
        'subway',
        'swiggy',
        'zomato',
      ],
    },
    {
      category: 'shopping',
      keywords: [
        'mart',
        'store',
        'mall',
        'retail',
        'fashion',
        'apparel',
        'clothing',
        'bazaar',
        'supermarket',
        'hypermarket',
        'd-mart',
        'reliance',
        'reliancretail',
        'zara',
        'h&m',
      ],
    },
    {
      category: 'activity',
      keywords: [
        'cinema',
        'theatre',
        'movie',
        'multiplex',
        'imax',
        'pvr',
        'inox',
        'park',
        'tickets',
        'show',
        'amusement',
        'scuba',
        'trek',
        'museum',
        'safari',
      ],
    },
  ];

  // 1. Check merchant name first for strong attribution
  if (merchantLower) {
    for (const { category, keywords } of categoryMap) {
      if (keywords.some(kw => merchantLower.includes(kw))) {
        return category;
      }
    }
  }

  // 2. Check receipt text
  for (const { category, keywords } of categoryMap) {
    if (keywords.some(kw => textLower.includes(kw))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Generates a stable deterministic content hash for duplicate receipt detection.
 */
export function computeReceiptHash(
  merchant?: string,
  date?: string,
  totalMinor?: number,
  receiptNumber?: string,
): string {
  const normalizedMerchant = (merchant || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const normalizedDate = date || '';
  const normalizedTotal = totalMinor || 0;
  const normalizedNum = (receiptNumber || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const payload = `${normalizedMerchant}|${normalizedDate}|${normalizedTotal}|${normalizedNum}`;

  // Simple FNV-1a 32-bit hash implementation
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }

  return `rec_${hash.toString(16).padStart(8, '0')}`;
}

/**
 * Calculates confidence level based on presence and consistency of critical fields.
 */
export function calculateConfidence(draft: {
  merchantName?: string;
  totalMinor?: number;
  date?: string;
}): ReceiptConfidenceLevel {
  if (
    draft.totalMinor &&
    draft.totalMinor > 0 &&
    draft.date &&
    draft.merchantName
  ) {
    return 'HIGH';
  }
  if (draft.totalMinor && draft.totalMinor > 0) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Main Receipt Parser Engine entry point.
 * Accepts OcrResult or raw text and generates a structured ReceiptDraft.
 */
export function parseReceipt(ocrResult: OcrResult | string): ReceiptDraft {
  const fullText = typeof ocrResult === 'string' ? ocrResult : ocrResult.text;
  const lines: string[] =
    typeof ocrResult === 'string'
      ? ocrResult
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
      : ocrResult.blocks
          .flatMap(b => b.lines.map(l => l.text.trim()))
          .filter(Boolean);

  const merchantName = extractMerchant(lines);
  const { date, time } = extractDateAndTime(lines);
  const receiptNumber = extractReceiptNumber(lines);
  const { totalMinor, subtotalMinor, taxMinor, cgstMinor, sgstMinor } =
    extractFinancialTotals(lines);
  const categorySuggestion = suggestCategory(fullText, merchantName);
  const receiptHash = computeReceiptHash(
    merchantName,
    date,
    totalMinor,
    receiptNumber,
  );
  const confidenceLevel = calculateConfidence({
    merchantName,
    totalMinor,
    date,
  });

  return {
    merchantName,
    totalMinor,
    subtotalMinor,
    taxMinor,
    cgstMinor,
    sgstMinor,
    currency: 'INR',
    date,
    time,
    receiptNumber,
    items: [],
    categorySuggestion,
    parserVersion: RECEIPT_PARSER_VERSION,
    confidenceLevel,
    receiptHash,
    rawText: fullText,
  };
}

export const receiptParser = {
  parse: parseReceipt,
  computeReceiptHash,
  parseAmountMinor,
};
