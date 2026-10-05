import apiClient from '../client';
import {
  Business,
  BusinessMedia,
  BusinessOffer,
  BusinessService,
  BookingRequest,
  Reservation,
  BusinessReview,
  BusinessLead,
  Campaign,
  VendorProfile,
} from '../../../types/local.types';

export const localVendorApi = {
  getSession: () =>
    apiClient.get<{
      success: boolean;
      data: {
        hasVendorAccount: boolean;
        vendor: VendorProfile | null;
        token: string | null;
      };
    }>('/vendor/session'),

  activateBusinessMode: (phone?: string) =>
    apiClient.post<{
      success: boolean;
      data: { vendor: VendorProfile; token: string; isNew: boolean };
    }>('/vendor/session', { phone }),

  getProfile: () =>
    apiClient.get<{ success: boolean; data: VendorProfile }>('/vendor/me'),

  updateProfile: (data: Partial<VendorProfile>) =>
    apiClient.patch<{ success: boolean; data: VendorProfile }>(
      '/vendor/me',
      data,
    ),

  getBusinesses: () =>
    apiClient.get<{ success: boolean; data: Business[] }>('/vendor/businesses'),

  createBusiness: (data: Partial<Business>) =>
    apiClient.post<{ success: boolean; data: Business }>(
      '/vendor/businesses',
      data,
    ),

  getBusinessById: (id: string) =>
    apiClient.get<{ success: boolean; data: Business }>(
      `/vendor/businesses/${id}`,
    ),

  updateBusiness: (id: string, data: Partial<Business>) =>
    apiClient.put<{ success: boolean; data: Business }>(
      `/vendor/businesses/${id}`,
      data,
    ),

  getOverview: (id: string) =>
    apiClient.get<{ success: boolean; data: any }>(
      `/vendor/businesses/${id}/overview`,
    ),

  getCompleteness: (id: string) =>
    apiClient.get<{
      success: boolean;
      data: { score: number; missingFields: string[] };
    }>(`/vendor/businesses/${id}/completeness`),

  getMedia: (businessId: string) =>
    apiClient.get<{ success: boolean; data: BusinessMedia[] }>(
      `/vendor/businesses/${businessId}/media`,
    ),

  uploadMedia: (businessId: string, data: Partial<BusinessMedia>) =>
    apiClient.post<{ success: boolean; data: BusinessMedia }>(
      `/vendor/businesses/${businessId}/media`,
      data,
    ),

  deleteMedia: (mediaId: string) =>
    apiClient.delete<{ success: boolean }>(`/vendor/media/${mediaId}`),

  reorderMedia: (
    businessId: string,
    updates: { id: string; sortOrder: number }[],
  ) =>
    apiClient.patch<{ success: boolean }>(
      `/vendor/businesses/${businessId}/media/reorder`,
      {
        updates,
      },
    ),

  setCoverMedia: (businessId: string, mediaId: string) =>
    apiClient.patch<{ success: boolean }>(
      `/vendor/businesses/${businessId}/media/cover`,
      {
        mediaId,
      },
    ),

  getOffers: (businessId: string) =>
    apiClient.get<{ success: boolean; data: BusinessOffer[] }>(
      `/vendor/businesses/${businessId}/offers`,
    ),

  createOffer: (businessId: string, data: Partial<BusinessOffer>) =>
    apiClient.post<{ success: boolean; data: BusinessOffer }>(
      `/vendor/businesses/${businessId}/offers`,
      data,
    ),

  updateOfferStatus: (
    offerId: string,
    status: 'active' | 'inactive' | 'expired',
  ) =>
    apiClient.patch<{ success: boolean; data: BusinessOffer }>(
      `/vendor/offers/${offerId}/status`,
      { status },
    ),

  deleteOffer: (offerId: string) =>
    apiClient.delete<{ success: boolean }>(`/vendor/offers/${offerId}`),

  getServices: (businessId: string) =>
    apiClient.get<{ success: boolean; data: BusinessService[] }>(
      `/vendor/businesses/${businessId}/services`,
    ),

  createService: (businessId: string, data: Partial<BusinessService>) =>
    apiClient.post<{ success: boolean; data: BusinessService }>(
      `/vendor/businesses/${businessId}/services`,
      data,
    ),

  deleteService: (serviceId: string) =>
    apiClient.delete<{ success: boolean }>(`/vendor/services/${serviceId}`),

  getLeads: (businessId: string) =>
    apiClient.get<{ success: boolean; data: BusinessLead[] }>(
      `/vendor/businesses/${businessId}/leads`,
    ),

  updateLeadStatus: (leadId: string, status: string) =>
    apiClient.patch<{ success: boolean }>(`/vendor/leads/${leadId}/status`, {
      status,
    }),

  getBookingRequests: (businessId: string) =>
    apiClient.get<{ success: boolean; data: BookingRequest[] }>(
      `/vendor/businesses/${businessId}/booking-requests`,
    ),

  updateBookingRequestStatus: (
    requestId: string,
    status: 'ACCEPTED' | 'DECLINED',
  ) =>
    apiClient.patch<{ success: boolean; data: BookingRequest }>(
      `/vendor/booking-requests/${requestId}`,
      { status },
    ),

  getReservations: (businessId: string) =>
    apiClient.get<{ success: boolean; data: Reservation[] }>(
      `/vendor/businesses/${businessId}/reservations`,
    ),

  completeReservation: (reservationId: string) =>
    apiClient.patch<{ success: boolean; data: Reservation }>(
      `/vendor/reservations/${reservationId}/complete`,
    ),

  getReviews: (businessId: string) =>
    apiClient.get<{ success: boolean; data: BusinessReview[] }>(
      `/vendor/businesses/${businessId}/reviews`,
    ),

  replyToReview: (reviewId: string, reply: string) =>
    apiClient.post<{ success: boolean; data: BusinessReview }>(
      `/vendor/reviews/${reviewId}/reply`,
      { reply },
    ),

  getCampaigns: (businessId: string) =>
    apiClient.get<{ success: boolean; data: Campaign[] }>(
      `/vendor/businesses/${businessId}/campaigns`,
    ),

  createCampaign: (businessId: string, data: Partial<Campaign>) =>
    apiClient.post<{ success: boolean; data: Campaign }>(
      `/vendor/businesses/${businessId}/campaigns`,
      data,
    ),

  updateCampaignStatus: (campaignId: string, status: string) =>
    apiClient.patch<{ success: boolean; data: Campaign }>(
      `/vendor/campaigns/${campaignId}/status`,
      { status },
    ),

  getAnalytics: (businessId: string, timeframe?: string) =>
    apiClient.get<{ success: boolean; data: any }>(
      `/vendor/businesses/${businessId}/analytics`,
      { params: { timeframe } },
    ),
};
