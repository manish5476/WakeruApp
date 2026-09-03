import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadApi } from '../services/api';
import { queryKeys } from './queryKeys';

// ============================================================
// Upload Receipt
// ============================================================

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageUri,
      tripId,
      expenseId,
      onProgress,
    }: {
      imageUri: string;
      tripId?: string;
      expenseId?: string;
      onProgress?: (progress: number) => void;
    }) => {
      const response = await uploadApi.uploadReceipt(
        imageUri,
        tripId,
        expenseId,
        onProgress,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.all() });
    },
  });
}

// ============================================================
// Get Receipts
// ============================================================

export function useReceipts(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.receipts.all(filters),
    queryFn: async () => {
      const response = await uploadApi.getReceipts(filters);
      return response.data;
    },
  });
}

// ============================================================
// Get Trip Receipts
// ============================================================

export function useTripReceipts(tripId: string) {
  return useQuery({
    queryKey: queryKeys.receipts.byTrip(tripId),
    queryFn: async () => {
      const response = await uploadApi.getTripReceipts(tripId);
      return response.data;
    },
    enabled: !!tripId,
  });
}

// ============================================================
// Single Receipt
// ============================================================

export function useReceipt(receiptId: string) {
  return useQuery({
    queryKey: queryKeys.receipts.detail(receiptId),
    queryFn: async () => {
      const response = await uploadApi.getReceipt(receiptId);
      return response.data;
    },
    enabled: !!receiptId,
  });
}

// ============================================================
// Delete Receipt
// ============================================================

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiptId: string) => {
      return uploadApi.deleteReceipt(receiptId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.all() });
    },
  });
}

// ============================================================
// Reprocess Receipt
// ============================================================

export function useReprocessReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiptId: string) => {
      const response = await uploadApi.reprocessReceipt(receiptId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.all() });
    },
  });
}

// ============================================================
// Convert Receipt to Expense
// ============================================================

export function useConvertReceiptToExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      receiptId,
      tripId,
    }: {
      receiptId: string;
      tripId: string;
    }) => {
      const response = await uploadApi.convertToExpense(receiptId, tripId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}
