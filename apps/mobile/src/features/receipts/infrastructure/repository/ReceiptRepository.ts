import type { IReceiptRepository } from '../../domain/repositories/IReceiptRepository';
import type {
  ConvertToExpensePayload,
  Receipt,
  ReceiptFilters,
  UploadReceiptPayload,
} from '../../types/receipt.types';
import { ReceiptRemoteDataSource } from '../datasource/ReceiptRemoteDataSource';
import { ReceiptMapper } from '../mapper/ReceiptMapper';

export class ReceiptRepository implements IReceiptRepository {
  constructor(private readonly dataSource: ReceiptRemoteDataSource) {}

  async upload(payload: UploadReceiptPayload): Promise<Receipt> {
    const dto = await this.dataSource.upload(payload);
    return ReceiptMapper.toDomain(dto);
  }

  async getAll(filters?: ReceiptFilters): Promise<Receipt[]> {
    const dtos = await this.dataSource.getAll(filters);
    return dtos.map(ReceiptMapper.toDomain);
  }

  async getByTrip(tripId: string): Promise<Receipt[]> {
    const dtos = await this.dataSource.getByTrip(tripId);
    return dtos.map(ReceiptMapper.toDomain);
  }

  async getById(receiptId: string): Promise<Receipt> {
    const dto = await this.dataSource.getById(receiptId);
    return ReceiptMapper.toDomain(dto);
  }

  async delete(receiptId: string): Promise<void> {
    return this.dataSource.delete(receiptId);
  }

  async reprocess(receiptId: string): Promise<Receipt> {
    const dto = await this.dataSource.reprocess(receiptId);
    return ReceiptMapper.toDomain(dto);
  }

  async convertToExpense(payload: ConvertToExpensePayload): Promise<Receipt> {
    const dto = await this.dataSource.convertToExpense(payload);
    return ReceiptMapper.toDomain(dto);
  }
}
