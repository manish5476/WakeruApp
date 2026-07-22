import apiClient, { ApiResponse } from '../client';
import { ISettlement } from '../../types/settlement.types';

export const settlementsApi = {
    getSettlement: async (tripId: string): Promise<ApiResponse<{ settlement: ISettlement; summary: any }>> => {
        return apiClient.get(`/settlements/trip/${tripId}`);
    },

    calculateSettlement: async (tripId: string): Promise<ApiResponse<{ settlement: ISettlement }>> => {
        return apiClient.post(`/settlements/trip/${tripId}/calculate`);
    },

    initiatePayment: async (tripId: string, transactionId: string): Promise<ApiResponse<{ transaction: any; upiDeepLink: string }>> => {
        return apiClient.post(`/settlements/trip/${tripId}/pay`, { transactionId });
    },

    confirmPayment: async (tripId: string, transactionId: string): Promise<ApiResponse<{ settlement: ISettlement; isFullySettled: boolean }>> => {
        return apiClient.post(`/settlements/trip/${tripId}/confirm`, { transactionId });
    },

    disputePayment: async (tripId: string, transactionId: string): Promise<ApiResponse<{ settlement: ISettlement }>> => {
        return apiClient.post(`/settlements/trip/${tripId}/dispute`, { transactionId });
    },

    getMySettlements: async (): Promise<ApiResponse<any>> => {
        return apiClient.get('/settlements/mine');
    },

    getSummary: async (tripId: string): Promise<ApiResponse<any>> => {
        return apiClient.get(`/settlements/trip/${tripId}/summary`);
    },

    retryPayment: async (tripId: string, transactionId: string): Promise<ApiResponse<any>> => {
        return apiClient.post(`/settlements/trip/${tripId}/retry`, { transactionId });
    },

    exportSettlement: async (tripId: string, format: 'json' | 'csv' = 'json'): Promise<ApiResponse<any>> => {
        return apiClient.get(`/settlements/trip/${tripId}/export`, { params: { format } });
    },

    getSettlementHistory: async (tripId: string): Promise<ApiResponse<any>> => {
        return apiClient.get(`/settlements/trip/${tripId}/history`);
    },
};

