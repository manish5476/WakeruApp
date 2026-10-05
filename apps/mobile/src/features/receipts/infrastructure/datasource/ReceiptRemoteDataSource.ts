import { uploadApi } from '../../../../core/api/services';
import type {
  ReceiptAPIModel,
  ReceiptListResponseDTO,
  ReceiptResponseDTO,
} from '../dto/ReceiptDTO';
import type {
  ConvertToExpensePayload,
  ReceiptFilters,
  UploadReceiptPayload,
} from '../../types/receipt.types';

export class ReceiptRemoteDataSource {
  async upload(payload: UploadReceiptPayload): Promise<ReceiptAPIModel> {
    // `any` justified: uploadApi returns a generic ApiResponse<any> at the API boundary
    const response = await uploadApi.uploadReceipt(
      payload.imageUri,
      payload.tripId,
      payload.expenseId,
      payload.onProgress,
    );
    return (response as ReceiptResponseDTO).data;
  }

  async getAll(filters?: ReceiptFilters): Promise<ReceiptAPIModel[]> {
    // `any` justified: uploadApi returns a generic ApiResponse<any> at the API boundary
    const response = await uploadApi.getReceipts(filters);
    return (response as ReceiptListResponseDTO).data;
  }

  async getByTrip(tripId: string): Promise<ReceiptAPIModel[]> {
    // `any` justified: uploadApi returns a generic ApiResponse<any> at the API boundary
    const response = await uploadApi.getTripReceipts(tripId);
    return (response as ReceiptListResponseDTO).data;
  }

  async getById(receiptId: string): Promise<ReceiptAPIModel> {
    // `any` justified: uploadApi returns a generic ApiResponse<any> at the API boundary
    const response = await uploadApi.getReceipt(receiptId);
    return (response as ReceiptResponseDTO).data;
  }

  async delete(receiptId: string): Promise<void> {
    await uploadApi.deleteReceipt(receiptId);
  }

  async reprocess(receiptId: string): Promise<ReceiptAPIModel> {
    // `any` justified: uploadApi returns a generic ApiResponse<any> at the API boundary
    const response = await uploadApi.reprocessReceipt(receiptId);
    return (response as ReceiptResponseDTO).data;
  }

  async convertToExpense(
    payload: ConvertToExpensePayload,
  ): Promise<ReceiptAPIModel> {
    // `any` justified: uploadApi returns a generic ApiResponse<any> at the API boundary
    const response = await uploadApi.convertToExpense(
      payload.receiptId,
      payload.tripId,
    );
    return (response as ReceiptResponseDTO).data;
  }
}
