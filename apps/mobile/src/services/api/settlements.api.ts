import apiClient, { ApiResponse } from './client';
import { ISettlement } from '../../types/settlement.types';

export const settlementsApi = {
  getSettlement: async (
    tripId: string,
  ): Promise<ApiResponse<{ settlement: ISettlement; summary: any }>> => {
    return apiClient.get(`/settlements/trip/${tripId}`);
  },

  calculateSettlement: async (
    tripId: string,
  ): Promise<ApiResponse<{ settlement: ISettlement }>> => {
    return apiClient.post(`/settlements/trip/${tripId}/calculate`);
  },

  initiatePayment: async (
    tripId: string,
    transactionId: string,
  ): Promise<ApiResponse<{ transaction: any; upiDeepLink: string }>> => {
    return apiClient.post(`/settlements/trip/${tripId}/pay`, { transactionId });
  },

  /** Receiver confirms a payment (body-based, legacy) */
  confirmPayment: async (
    tripId: string,
    transactionId: string,
  ): Promise<
    ApiResponse<{ settlement: ISettlement; isFullySettled: boolean }>
  > => {
    return apiClient.post(`/settlements/trip/${tripId}/confirm`, {
      transactionId,
    });
  },

  /** Receiver confirms a payment (URL-based, preferred) */
  confirmTransaction: async (
    tripId: string,
    transactionId: string,
    notes?: string,
  ): Promise<
    ApiResponse<{ settlement: ISettlement; isFullySettled: boolean }>
  > => {
    return apiClient.post(
      `/settlements/trip/${tripId}/transactions/${transactionId}/confirm`,
      { notes },
    );
  },

  disputePayment: async (
    tripId: string,
    transactionId: string,
  ): Promise<ApiResponse<{ settlement: ISettlement }>> => {
    return apiClient.post(`/settlements/trip/${tripId}/dispute`, {
      transactionId,
    });
  },

  /** Payer marks a single transaction as paid (initiates it, notifies receiver) */
  settleSingle: async (
    tripId: string,
    transactionId: string,
  ): Promise<ApiResponse<{ transaction: any; settlement: ISettlement }>> => {
    return apiClient.post(
      `/settlements/trip/${tripId}/transactions/${transactionId}/settle`,
    );
  },

  /** Receiver rejects a payment claim (resets to pending) */
  rejectPayment: async (
    tripId: string,
    transactionId: string,
    reason: string,
  ): Promise<ApiResponse<{ settlement: ISettlement }>> => {
    return apiClient.post(
      `/settlements/trip/${tripId}/transactions/${transactionId}/reject`,
      { reason },
    );
  },

  /** Receiver sends a reminder to the payer (30-min cooldown) */
  remindPayer: async (
    tripId: string,
    transactionId: string,
  ): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post(
      `/settlements/trip/${tripId}/transactions/${transactionId}/remind`,
    );
  },

  /** Payer initiates all outstanding payments for this trip */
  settleAll: async (
    tripId: string,
  ): Promise<
    ApiResponse<{ settlement: ISettlement; isFullySettled: boolean }>
  > => {
    return apiClient.post(`/settlements/trip/${tripId}/settle-all`);
  },

  /** Payer initiates a selected subset of their outstanding payments */
  settleSelected: async (
    tripId: string,
    transactionIds: string[],
  ): Promise<
    ApiResponse<{ settlement: ISettlement; isFullySettled: boolean }>
  > => {
    return apiClient.post(`/settlements/trip/${tripId}/settle-selected`, {
      transactionIds,
    });
  },

  getMySettlements: async (): Promise<ApiResponse<any>> => {
    return apiClient.get('/settlements/mine');
  },

  getSummary: async (tripId: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/settlements/trip/${tripId}/summary`);
  },

  retryPayment: async (
    tripId: string,
    transactionId: string,
  ): Promise<ApiResponse<any>> => {
    return apiClient.post(`/settlements/trip/${tripId}/retry`, {
      transactionId,
    });
  },

  exportSettlement: async (
    tripId: string,
    format: 'json' | 'csv' = 'json',
  ): Promise<ApiResponse<any>> => {
    return apiClient.get(`/settlements/trip/${tripId}/export`, {
      params: { format },
    });
  },

  getSettlementHistory: async (tripId: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/settlements/trip/${tripId}/history`);
  },
};
