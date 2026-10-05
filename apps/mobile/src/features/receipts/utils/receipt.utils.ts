import type { Receipt, ReceiptStatus } from '../types/receipt.types';
import { RECEIPT_STATUS_LABELS } from '../constants/receiptConstants';

export const formatReceiptStatus = (status: ReceiptStatus): string =>
  RECEIPT_STATUS_LABELS[status] ?? status;

export const isReceiptProcessable = (receipt: Receipt): boolean =>
  receipt.status === 'pending' || receipt.status === 'failed';

export const extractReceiptAmount = (receipt: Receipt): number | null => {
  if (receipt.parsedAmount !== undefined && receipt.parsedAmount !== null) {
    return receipt.parsedAmount;
  }
  if (receipt.ocrData?.lineItems && receipt.ocrData.lineItems.length > 0) {
    return receipt.ocrData.lineItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
  }
  return null;
};

export const groupReceiptsByStatus = (
  receipts: Receipt[],
): Record<ReceiptStatus, Receipt[]> => {
  const initial: Record<ReceiptStatus, Receipt[]> = {
    pending: [],
    processing: [],
    processed: [],
    failed: [],
    converted: [],
  };
  return receipts.reduce((acc, receipt) => {
    acc[receipt.status].push(receipt);
    return acc;
  }, initial);
};
