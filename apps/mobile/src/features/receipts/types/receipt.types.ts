export type ReceiptStatus =
  'pending' | 'processing' | 'processed' | 'failed' | 'converted';

export type ReceiptSource = 'camera' | 'gallery' | 'file';

export interface OcrData {
  rawText?: string;
  confidence?: number;
  lineItems?: Array<{ description: string; amount: number }>;
}

export interface Receipt {
  id: string;
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

export interface UploadReceiptPayload {
  imageUri: string;
  tripId?: string;
  expenseId?: string;
  onProgress?: (progress: number) => void;
}

export interface ConvertToExpensePayload {
  receiptId: string;
  tripId: string;
}

export interface ReceiptFilters {
  tripId?: string;
  status?: ReceiptStatus;
  page?: number;
  limit?: number;
}
