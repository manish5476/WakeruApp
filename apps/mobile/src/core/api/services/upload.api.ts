import apiClient, { ApiResponse } from '../client';
import { Platform } from 'react-native';

export const uploadApi = {
    uploadReceipt: async (
        imageUri: string,
        tripId?: string,
        expenseId?: string,
        onProgress?: (progress: number) => void
    ): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        const filename = `receipt-${Date.now()}.jpg`;

        if (Platform.OS === 'web') {
            const res = await fetch(imageUri);
            const blob = await res.blob();
            formData.append('receipt', blob, filename);
        } else {
            formData.append('receipt', {
                uri: imageUri,
                type: 'image/jpeg',
                name: filename,
            } as any);
        }

        if (tripId) formData.append('tripId', tripId);
        if (expenseId) formData.append('expenseId', expenseId);

        return apiClient.upload('/receipts/upload', formData, onProgress);
    },

    getReceipts: async (params?: any): Promise<ApiResponse<any>> => {
        return apiClient.get('/receipts', { params });
    },

    getTripReceipts: async (tripId: string): Promise<ApiResponse<any>> => {
        return apiClient.get(`/receipts/trip/${tripId}`);
    },

    getReceipt: async (receiptId: string): Promise<ApiResponse<any>> => {
        return apiClient.get(`/receipts/${receiptId}`);
    },

    deleteReceipt: async (receiptId: string): Promise<ApiResponse<void>> => {
        return apiClient.delete(`/receipts/${receiptId}`);
    },

    reprocessReceipt: async (receiptId: string): Promise<ApiResponse<any>> => {
        return apiClient.post(`/receipts/${receiptId}/reprocess`);
    },

    convertToExpense: async (receiptId: string, tripId: string): Promise<ApiResponse<any>> => {
        return apiClient.post(`/receipts/${receiptId}/convert`, { tripId });
    },
};

