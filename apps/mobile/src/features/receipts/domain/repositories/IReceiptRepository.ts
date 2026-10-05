import type {
  Receipt,
  ReceiptFilters,
  UploadReceiptPayload,
  ConvertToExpensePayload,
} from '../../types/receipt.types';

export interface IReceiptRepository {
  upload(payload: UploadReceiptPayload): Promise<Receipt>;
  getAll(filters?: ReceiptFilters): Promise<Receipt[]>;
  getByTrip(tripId: string): Promise<Receipt[]>;
  getById(receiptId: string): Promise<Receipt>;
  delete(receiptId: string): Promise<void>;
  reprocess(receiptId: string): Promise<Receipt>;
  convertToExpense(payload: ConvertToExpensePayload): Promise<Receipt>;
}
