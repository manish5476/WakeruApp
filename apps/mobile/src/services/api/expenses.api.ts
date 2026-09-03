import apiClient, { ApiResponse, PaginatedResponse } from './client';
import { IExpense } from '../../types/expense.types';

export const expensesApi = {
  create: async (data: any): Promise<ApiResponse<{ expense: IExpense }>> => {
    return apiClient.post('/expenses', data);
  },

  getStopExpenses: async (
    stopId: string,
    params?: any,
  ): Promise<ApiResponse<PaginatedResponse<IExpense>>> => {
    return apiClient.get(`/expenses/stop/${stopId}`, { params });
  },

  getStopExpenseSummary: async (stopId: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/expenses/stop/${stopId}/summary`);
  },

  getTripExpenses: async (
    tripId: string,
    params?: any,
  ): Promise<ApiResponse<PaginatedResponse<IExpense>>> => {
    return apiClient.get(`/expenses/trip/${tripId}`, { params });
  },

  getMyExpenses: async (
    params?: any,
  ): Promise<ApiResponse<PaginatedResponse<IExpense>>> => {
    return apiClient.get('/expenses/mine', { params });
  },

  getExpense: async (
    expenseId: string,
  ): Promise<ApiResponse<{ expense: IExpense }>> => {
    return apiClient.get(`/expenses/${expenseId}`);
  },

  updateExpense: async (
    expenseId: string,
    data: any,
  ): Promise<ApiResponse<{ expense: IExpense }>> => {
    return apiClient.patch(`/expenses/${expenseId}`, data);
  },

  archiveExpense: async (expenseId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/expenses/${expenseId}`);
  },

  unarchiveExpense: async (expenseId: string): Promise<ApiResponse<void>> => {
    return apiClient.post(`/expenses/${expenseId}/unarchive`);
  },

  deleteExpensePermanent: async (
    expenseId: string,
  ): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/expenses/${expenseId}/permanent`);
  },

  markSplitPaid: async (
    expenseId: string,
    userId: string,
    paymentId?: string,
  ): Promise<ApiResponse<{ expense: IExpense; isFullySettled: boolean }>> => {
    return apiClient.patch(`/expenses/${expenseId}/splits/${userId}/pay`, {
      paymentId,
    });
  },

  getTripAnalytics: async (tripId: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/expenses/trip/${tripId}/analytics`);
  },

  addComment: async (
    expenseId: string,
    content: string,
  ): Promise<ApiResponse<any>> => {
    return apiClient.post(`/expenses/${expenseId}/comments`, { text: content });
  },

  deleteComment: async (
    expenseId: string,
    commentId: string,
  ): Promise<ApiResponse<any>> => {
    return apiClient.delete(`/expenses/${expenseId}/comments/${commentId}`);
  },
};
