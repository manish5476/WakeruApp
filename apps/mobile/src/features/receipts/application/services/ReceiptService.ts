import { GetReceiptsUseCase } from '../useCases/GetReceiptsUseCase';
import { ManageReceiptUseCase } from '../useCases/ManageReceiptUseCase';
import { ReceiptRemoteDataSource } from '../../infrastructure/datasource/ReceiptRemoteDataSource';
import { ReceiptRepository } from '../../infrastructure/repository/ReceiptRepository';
import type {
  ConvertToExpensePayload,
  Receipt,
  ReceiptFilters,
  UploadReceiptPayload,
} from '../../types/receipt.types';

export class ReceiptService {
  private readonly getReceiptsUseCase: GetReceiptsUseCase;
  private readonly manageReceiptUseCase: ManageReceiptUseCase;

  constructor() {
    const dataSource = new ReceiptRemoteDataSource();
    const repository = new ReceiptRepository(dataSource);
    this.getReceiptsUseCase = new GetReceiptsUseCase(repository);
    this.manageReceiptUseCase = new ManageReceiptUseCase(repository);
  }

  // ── Read operations ──────────────────────────────────────────────────────────

  getAll(filters?: ReceiptFilters): Promise<Receipt[]> {
    return this.getReceiptsUseCase.execute(filters);
  }

  getByTrip(tripId: string): Promise<Receipt[]> {
    return this.getReceiptsUseCase.executeByTrip(tripId);
  }

  getById(receiptId: string): Promise<Receipt> {
    return this.getReceiptsUseCase.executeById(receiptId);
  }

  // ── Write operations ─────────────────────────────────────────────────────────

  upload(payload: UploadReceiptPayload): Promise<Receipt> {
    return this.manageReceiptUseCase.upload(payload);
  }

  delete(receiptId: string): Promise<void> {
    return this.manageReceiptUseCase.delete(receiptId);
  }

  reprocess(receiptId: string): Promise<Receipt> {
    return this.manageReceiptUseCase.reprocess(receiptId);
  }

  convertToExpense(payload: ConvertToExpensePayload): Promise<Receipt> {
    return this.manageReceiptUseCase.convertToExpense(payload);
  }
}

/** Pre-wired singleton for direct use outside React Query hooks. */
export const receiptService = new ReceiptService();
