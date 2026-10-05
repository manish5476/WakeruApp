import apiClient from '../client';
import {
  Business,
  BusinessMedia,
  VendorProfile,
  Campaign,
  AuditLog,
  DemandInsight,
  BookingRequest,
  Reservation,
} from '../../../types/local.types';

export const localAdminApi = {
  getBusinesses: (page = 1) =>
    apiClient.get<{ success: boolean; data: Business[]; pagination?: any }>(
      '/admin/businesses',
      {
        params: { page },
      },
    ),

  getBusinessById: (id: string) =>
    apiClient.get<{ success: boolean; data: Business }>(
      `/admin/businesses/${id}`,
    ),

  verifyBusiness: (
    id: string,
    verificationStatus: 'VERIFIED' | 'REJECTED' | 'REVOKED',
  ) =>
    apiClient.patch<{ success: boolean; data: Business }>(
      `/admin/businesses/${id}/verify`,
      {
        verificationStatus,
      },
    ),

  getMediaQueue: () =>
    apiClient.get<{ success: boolean; data: BusinessMedia[] }>('/admin/media'),

  reviewMedia: (
    id: string,
    moderationStatus: 'APPROVED' | 'REJECTED' | 'HIDDEN',
  ) =>
    apiClient.post<{ success: boolean }>(`/admin/media/${id}/review`, {
      moderationStatus,
    }),

  getReviewReports: () =>
    apiClient.get<{ success: boolean; data: any[] }>('/admin/reviews/reports'),

  dismissReviewReport: (reportId: string) =>
    apiClient.patch<{ success: boolean }>(
      `/admin/reviews/reports/${reportId}/dismiss`,
    ),

  deleteReview: (reviewId: string) =>
    apiClient.delete<{ success: boolean }>(`/admin/reviews/${reviewId}`),

  getVendors: (page = 1) =>
    apiClient.get<{
      success: boolean;
      data: VendorProfile[];
      pagination?: any;
    }>('/admin/vendors', {
      params: { page },
    }),

  suspendVendor: (id: string) =>
    apiClient.patch<{ success: boolean }>(`/admin/vendors/${id}/suspend`, {
      action: 'suspend',
    }),

  getBookingQueue: () =>
    apiClient.get<{ success: boolean; data: BookingRequest[] }>(
      '/admin/booking-requests',
    ),

  getReservations: () =>
    apiClient.get<{ success: boolean; data: Reservation[] }>(
      '/admin/reservations',
    ),

  getCampaigns: () =>
    apiClient.get<{ success: boolean; data: Campaign[] }>('/admin/campaigns'),

  reviewCampaign: (id: string, status: 'active' | 'rejected') =>
    apiClient.post<{ success: boolean }>(`/admin/campaigns/${id}/review`, {
      status,
    }),

  getAuditLogs: (page = 1) =>
    apiClient.get<{ success: boolean; data: AuditLog[]; pagination?: any }>(
      '/admin/audit-logs',
      {
        params: { page },
      },
    ),

  getDemandInsights: () =>
    apiClient.get<{ success: boolean; data: DemandInsight[] }>(
      '/admin/demand-insights',
    ),
};
