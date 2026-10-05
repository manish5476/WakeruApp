import apiClient from '../client';
import {
  Business,
  BusinessService,
  BusinessOffer,
  BusinessReview,
  ReviewSummary,
  BookingRequest,
  Reservation,
} from '../../../types/local.types';

export const localDiscoverApi = {
  getNearbyBusinesses: (
    lat: number,
    lng: number,
    radius?: number,
    category?: string,
  ) =>
    apiClient.get<{ success: boolean; data: Business[] }>(
      '/discover/businesses/nearby',
      {
        params: { lat, lng, radius, category },
      },
    ),

  getDestinationBusinesses: (
    city: string,
    country: string,
    category?: string,
  ) =>
    apiClient.get<{ success: boolean; data: Business[] }>(
      '/discover/businesses/destination',
      {
        params: { city, country, category },
      },
    ),

  compareBusinesses: (ids: string) =>
    apiClient.get<{ success: boolean; data: Business[] }>(
      '/discover/businesses/compare',
      {
        params: { ids },
      },
    ),

  getBusinessDetail: (id: string) =>
    apiClient.get<{ success: boolean; data: Business }>(
      `/discover/businesses/${id}`,
    ),

  getBusinessServices: (id: string) =>
    apiClient.get<{ success: boolean; data: BusinessService[] }>(
      `/discover/businesses/${id}/services`,
    ),

  getBusinessOffers: (id: string) =>
    apiClient.get<{ success: boolean; data: BusinessOffer[] }>(
      `/discover/businesses/${id}/offers`,
    ),

  getBusinessReviews: (id: string) =>
    apiClient.get<{ success: boolean; data: BusinessReview[] }>(
      `/discover/businesses/${id}/reviews`,
    ),

  getReviewsSummary: (id: string) =>
    apiClient.get<{ success: boolean; data: ReviewSummary }>(
      `/discover/businesses/${id}/reviews/summary`,
    ),

  recordInteraction: (
    id: string,
    type: 'call' | 'whatsapp' | 'directions' | 'view' | 'enquiry',
  ) =>
    apiClient.post<{ success: boolean }>(
      `/discover/businesses/${id}/interactions`,
      { type },
    ),

  reportBusiness: (id: string, reason: string, details?: string) =>
    apiClient.post<{ success: boolean }>(`/discover/businesses/${id}/report`, {
      reason,
      details,
    }),

  createBookingRequest: (
    businessId: string,
    payload: {
      serviceId?: string;
      bookingDate: string;
      guestCount?: number;
      notes?: string;
    },
  ) =>
    apiClient.post<{ success: boolean; data: BookingRequest }>(
      `/discover/businesses/${businessId}/booking-requests`,
      payload,
    ),

  cancelBookingRequest: (requestId: string) =>
    apiClient.post<{ success: boolean }>(
      `/discover/booking-requests/${requestId}/cancel`,
    ),

  getTravelerBookings: () =>
    apiClient.get<{ success: boolean; data: BookingRequest[] }>(
      '/discover/traveler/bookings',
    ),

  getTravelerBookingDetail: (id: string) =>
    apiClient.get<{ success: boolean; data: BookingRequest }>(
      `/discover/traveler/bookings/${id}`,
    ),

  getTravelerReservationDetail: (id: string) =>
    apiClient.get<{ success: boolean; data: Reservation }>(
      `/discover/traveler/reservations/${id}`,
    ),

  createReview: (
    businessId: string,
    payload: {
      rating: number;
      comment?: string;
      provenance:
        'VERIFIED_BOOKING' | 'VERIFIED_SERVICE' | 'VERIFIED_STAY' | 'DIRECT';
      reservationId?: string;
    },
  ) =>
    apiClient.post<{ success: boolean; data: BusinessReview }>(
      `/discover/businesses/${businessId}/reviews`,
      payload,
    ),

  reportReview: (reviewId: string, reason: string) =>
    apiClient.post<{ success: boolean }>(
      `/discover/reviews/${reviewId}/report`,
      { reason },
    ),

  recordAdEvent: (campaignId: string, type: 'impression' | 'click') =>
    apiClient.post<{ success: boolean }>('/discover/events', {
      campaignId,
      type,
    }),

  getEligibleCampaigns: (category?: string, city?: string) =>
    apiClient.get<{ success: boolean; data: any[] }>(
      '/discover/campaigns/eligible',
      {
        params: { category, city },
      },
    ),
};
