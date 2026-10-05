import type { ReceiptStatus } from '../types/receipt.types';

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  processed: 'Processed',
  failed: 'Failed',
  converted: 'Converted',
};

export const RECEIPT_STALE_TIME_MS = 30_000;

export const DEFAULT_RECEIPT_PAGE_SIZE = 20;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
] as const;

export const MAX_RECEIPT_FILE_SIZE_MB = 10;
