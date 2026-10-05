// ── Types ────────────────────────────────────────────────────────────────────
export type {
  Receipt,
  ReceiptStatus,
  ReceiptSource,
  OcrData,
  UploadReceiptPayload,
  ConvertToExpensePayload,
  ReceiptFilters,
} from './types/receipt.types';

// ── Domain ───────────────────────────────────────────────────────────────────
export {
  isPending,
  isProcessed,
  isFailed,
  isConverted,
  hasOcrData,
  displayStatus,
} from './domain/models/Receipt';
export type { IReceiptRepository } from './domain/repositories/IReceiptRepository';

// ── Infrastructure ───────────────────────────────────────────────────────────
export type {
  ReceiptAPIModel,
  ReceiptResponseDTO,
  ReceiptListResponseDTO,
} from './infrastructure/dto/ReceiptDTO';
export { ReceiptMapper } from './infrastructure/mapper/ReceiptMapper';
export { ReceiptRemoteDataSource } from './infrastructure/datasource/ReceiptRemoteDataSource';
export { ReceiptRepository } from './infrastructure/repository/ReceiptRepository';

// ── Application — Use Cases ──────────────────────────────────────────────────
export { GetReceiptsUseCase } from './application/useCases/GetReceiptsUseCase';
export { ManageReceiptUseCase } from './application/useCases/ManageReceiptUseCase';

// ── Application — Service ────────────────────────────────────────────────────
export {
  ReceiptService,
  receiptService,
} from './application/services/ReceiptService';

// ── Constants ────────────────────────────────────────────────────────────────
export {
  RECEIPT_STATUS_LABELS,
  RECEIPT_STALE_TIME_MS,
  DEFAULT_RECEIPT_PAGE_SIZE,
  SUPPORTED_IMAGE_TYPES,
  MAX_RECEIPT_FILE_SIZE_MB,
} from './constants/receiptConstants';

// ── Utils ────────────────────────────────────────────────────────────────────
export {
  formatReceiptStatus,
  isReceiptProcessable,
  extractReceiptAmount,
  groupReceiptsByStatus,
} from './utils/receipt.utils';

// ── Presentation ─────────────────────────────────────────────────────────────
export {
  useUploadReceipt,
  useReceipts,
  useTripReceipts,
  useReceipt,
  useDeleteReceipt,
  useReprocessReceipt,
  useConvertReceiptToExpense,
} from './presentation/hooks/useReceipts';
