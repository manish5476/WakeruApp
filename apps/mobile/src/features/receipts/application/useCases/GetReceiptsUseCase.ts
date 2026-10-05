import type { IReceiptRepository } from '../../domain/repositories/IReceiptRepository';
import type { Receipt, ReceiptFilters } from '../../types/receipt.types';

export class GetReceiptsUseCase {
  constructor(private readonly repository: IReceiptRepository) {}

  async execute(filters?: ReceiptFilters): Promise<Receipt[]> {
    return this.repository.getAll(filters);
  }

  async executeByTrip(tripId: string): Promise<Receipt[]> {
    return this.repository.getByTrip(tripId);
  }

  async executeById(receiptId: string): Promise<Receipt> {
    return this.repository.getById(receiptId);
  }
}
