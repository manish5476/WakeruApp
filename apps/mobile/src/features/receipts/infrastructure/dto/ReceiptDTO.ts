import type {
  OcrData,
  ReceiptSource,
  ReceiptStatus,
} from '../../types/receipt.types';

/** Raw shape returned by the API — uses `_id` instead of `id`. */
export interface ReceiptAPIModel {
  _id: string;
  tripId?: string;
  expenseId?: string;
  imageUri: string;
  thumbnailUri?: string;
  status: ReceiptStatus;
  source?: ReceiptSource;
  ocrData?: OcrData;
  parsedAmount?: number;
  parsedDate?: string;
  parsedMerchant?: string;
  parsedCurrency?: string;
  uploadedAt: string;
  processedAt?: string;
  convertedExpenseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptResponseDTO {
  data: ReceiptAPIModel;
  message?: string;
}

export interface ReceiptListResponseDTO {
  data: ReceiptAPIModel[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}
