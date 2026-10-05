export type {
  Receipt,
  ReceiptStatus,
  ReceiptSource,
  OcrData,
} from '../../types/receipt.types';
import type { Receipt, ReceiptStatus } from '../../types/receipt.types';

export const isPending = (receipt: Receipt): boolean =>
  receipt.status === 'pending';

export const isProcessed = (receipt: Receipt): boolean =>
  receipt.status === 'processed';

export const isFailed = (receipt: Receipt): boolean =>
  receipt.status === 'failed';

export const isConverted = (receipt: Receipt): boolean =>
  receipt.status === 'converted';

export const hasOcrData = (receipt: Receipt): boolean =>
  receipt.ocrData !== undefined &&
  (receipt.ocrData.rawText !== undefined ||
    (receipt.ocrData.lineItems?.length ?? 0) > 0);

export const displayStatus = (status: ReceiptStatus): string => {
  const labels: Record<ReceiptStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    processed: 'Processed',
    failed: 'Failed',
    converted: 'Converted',
  };
  return labels[status];
};
