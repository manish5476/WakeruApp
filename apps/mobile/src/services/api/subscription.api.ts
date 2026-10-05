import apiClient, { ApiResponse } from './client';
import {
  IPlan,
  IUserEntitlements,
  IPlanInput,
} from '../../types/subscription.types';

export const subscriptionApi = {
  // Public & User endpoints
  getPublicPlans: async (): Promise<ApiResponse<IPlan[]>> => {
    return apiClient.get('/subscription/plans');
  },

  getEntitlements: async (): Promise<ApiResponse<IUserEntitlements>> => {
    return apiClient.get('/subscription/entitlements');
  },

  createCheckout: async (
    planKey: string,
    billingInterval: 'month' | 'year' = 'month',
    currency?: string,
    options?: { successUrl?: string; cancelUrl?: string },
  ): Promise<
    ApiResponse<{
      sessionId: string;
      checkoutUrl: string;
      planKey: string;
      amount: number;
      currency: string;
      orderId?: string;
      keyId?: string;
      provider?: string;
    }>
  > => {
    return apiClient.post('/subscription/checkout', {
      planKey,
      billingInterval,
      currency,
      ...options,
    });
  },

  simulatePurchase: async (
    planKey: string,
  ): Promise<ApiResponse<IUserEntitlements>> => {
    return apiClient.post('/subscription/simulate-purchase', { planKey });
  },

  cancelSubscription: async (): Promise<ApiResponse<any>> => {
    return apiClient.post('/subscription/cancel');
  },

  // Admin Plan Management endpoints
  adminListPlans: async (): Promise<ApiResponse<IPlan[]>> => {
    return apiClient.get('/admin/plans');
  },

  adminGetPlan: async (id: string): Promise<ApiResponse<IPlan>> => {
    return apiClient.get(`/admin/plans/${id}`);
  },

  adminCreatePlan: async (data: IPlanInput): Promise<ApiResponse<IPlan>> => {
    return apiClient.post('/admin/plans', data);
  },

  adminUpdatePlan: async (
    id: string,
    data: Partial<IPlanInput>,
  ): Promise<ApiResponse<IPlan>> => {
    return apiClient.patch(`/admin/plans/${id}`, data);
  },

  adminArchivePlan: async (
    id: string,
    reason?: string,
  ): Promise<ApiResponse<any>> => {
    return apiClient.post(`/admin/plans/${id}/archive`, { reason });
  },

  adminGetAuditLogs: async (limit = 25): Promise<ApiResponse<any[]>> => {
    return apiClient.get('/admin/audit-logs', { params: { limit } });
  },
};
