import type { IReceiptRepository } from '../../domain/repositories/IReceiptRepository';
import type {
  ConvertToExpensePayload,
  Receipt,
  UploadReceiptPayload,
} from '../../types/receipt.types';

export class ManageReceiptUseCase {
  constructor(private readonly repository: IReceiptRepository) {}

  async upload(payload: UploadReceiptPayload): Promise<Receipt> {
    return this.repository.upload(payload);
  }

  async delete(receiptId: string): Promise<void> {
    return this.repository.delete(receiptId);
  }

  async reprocess(receiptId: string): Promise<Receipt> {
    return this.repository.reprocess(receiptId);
  }

  async convertToExpense(payload: ConvertToExpensePayload): Promise<Receipt> {
    return this.repository.convertToExpense(payload);
  }
}
