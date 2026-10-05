import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import {
  localDiscoverApi,
  localVendorApi,
  localAdminApi,
  localMasterApi,
  localServicesApi,
} from '../services/api/local';

// ============================================================
// Discovery & Business Hooks
// ============================================================

export function useNearbyBusinesses(
  lat?: number,
  lng?: number,
  radius?: number,
  category?: string,
) {
  return useQuery({
    queryKey: queryKeys.local.nearby({ lat, lng, radius, category }),
    queryFn: async () => {
      if (lat === undefined || lng === undefined) return [];
      const res = await localDiscoverApi.getNearbyBusinesses(
        lat,
        lng,
        radius,
        category,
      );
      return res.data || [];
    },
    enabled: lat !== undefined && lng !== undefined,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDestinationBusinesses(
  city?: string,
  country: string = 'India',
  category?: string,
) {
  return useQuery({
    queryKey: queryKeys.local.destination({ city, country, category }),
    queryFn: async () => {
      if (!city) return [];
      const res = await localDiscoverApi.getDestinationBusinesses(
        city,
        country,
        category,
      );
      return res.data || [];
    },
    enabled: !!city,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusinessDetail(id?: string) {
  return useQuery({
    queryKey: queryKeys.local.business(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await localDiscoverApi.getBusinessDetail(id);
      return res.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useBusinessServices(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.services(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localDiscoverApi.getBusinessServices(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useBusinessOffers(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.offers(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localDiscoverApi.getBusinessOffers(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useBusinessReviews(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.reviews(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localDiscoverApi.getBusinessReviews(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useReviewsSummary(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.reviewsSummary(businessId || ''),
    queryFn: async () => {
      if (!businessId) return null;
      const res = await localDiscoverApi.getReviewsSummary(businessId);
      return res.data;
    },
    enabled: !!businessId,
  });
}

export function useCompareBusinesses(ids?: string) {
  return useQuery({
    queryKey: queryKeys.local.compare(ids || ''),
    queryFn: async () => {
      if (!ids) return [];
      const res = await localDiscoverApi.compareBusinesses(ids);
      return res.data || [];
    },
    enabled: !!ids,
  });
}

// ============================================================
// Traveler Bookings & Reservations Hooks
// ============================================================

export function useTravelerBookings() {
  return useQuery({
    queryKey: queryKeys.local.travelerBookings,
    queryFn: async () => {
      const res = await localDiscoverApi.getTravelerBookings();
      return res.data || [];
    },
  });
}

export function useTravelerBookingDetail(id?: string) {
  return useQuery({
    queryKey: queryKeys.local.travelerBookingDetail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await localDiscoverApi.getTravelerBookingDetail(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useTravelerReservationDetail(id?: string) {
  return useQuery({
    queryKey: queryKeys.local.travelerReservationDetail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await localDiscoverApi.getTravelerReservationDetail(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateBookingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      businessId,
      payload,
    }: {
      businessId: string;
      payload: any;
    }) => localDiscoverApi.createBookingRequest(businessId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.local.travelerBookings,
      });
    },
  });
}

export function useCancelBookingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      localDiscoverApi.cancelBookingRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.local.travelerBookings,
      });
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      businessId,
      payload,
    }: {
      businessId: string;
      payload: any;
    }) => localDiscoverApi.createReview(businessId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.local.reviews(variables.businessId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.local.reviewsSummary(variables.businessId),
      });
    },
  });
}

export function useReportBusiness() {
  return useMutation({
    mutationFn: ({
      id,
      reason,
      details,
    }: {
      id: string;
      reason: string;
      details?: string;
    }) => localDiscoverApi.reportBusiness(id, reason, details),
  });
}

export function useRecordInteraction() {
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: any }) =>
      localDiscoverApi.recordInteraction(id, type),
  });
}

// ============================================================
// Master Data Hooks
// ============================================================

export function useMasterCategories() {
  return useQuery({
    queryKey: queryKeys.local.masterCategories,
    queryFn: async () => {
      const res = await localMasterApi.getCategories();
      return res.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useMasterAmenities(category?: string) {
  return useQuery({
    queryKey: queryKeys.local.masterAmenities(category),
    queryFn: async () => {
      const res = await localMasterApi.getAmenities(category);
      return res.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useMasterDestinations() {
  return useQuery({
    queryKey: queryKeys.local.masterDestinations,
    queryFn: async () => {
      const res = await localMasterApi.getDestinations();
      return res.data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

// ============================================================
// Vendor Portal Hooks
// ============================================================

export function useVendorSession() {
  return useQuery({
    queryKey: ['local', 'vendor', 'session'],
    queryFn: async () => {
      const res = await localVendorApi.getSession();
      return res.data;
    },
  });
}

export function useActivateBusinessMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (phone?: string) => {
      const res = await localVendorApi.activateBusinessMode(phone);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.local.vendorProfile,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.local.vendorBusinesses,
      });
      queryClient.invalidateQueries({
        queryKey: ['local', 'vendor', 'session'],
      });
    },
  });
}

export function useVendorProfile() {
  return useQuery({
    queryKey: queryKeys.local.vendorProfile,
    queryFn: async () => {
      const res = await localVendorApi.getProfile();
      return res.data;
    },
    retry: 1,
  });
}

export function useVendorBusinesses() {
  return useQuery({
    queryKey: queryKeys.local.vendorBusinesses,
    queryFn: async () => {
      const res = await localVendorApi.getBusinesses();
      return res.data || [];
    },
  });
}

export function useVendorBusinessDetail(id?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorBusiness(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await localVendorApi.getBusinessById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useVendorOverview(id?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorOverview(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await localVendorApi.getOverview(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useVendorCompleteness(id?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorCompleteness(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const res = await localVendorApi.getCompleteness(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useVendorMedia(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorMedia(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localVendorApi.getMedia(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useVendorOffers(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorOffers(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localVendorApi.getOffers(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useVendorServices(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorServices(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localVendorApi.getServices(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useVendorLeads(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorLeads(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localVendorApi.getLeads(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useVendorBookingRequests(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorBookings(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localVendorApi.getBookingRequests(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useVendorReservations(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorReservations(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localVendorApi.getReservations(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useVendorReviews(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorReviews(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localVendorApi.getReviews(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useVendorCampaigns(businessId?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorCampaigns(businessId || ''),
    queryFn: async () => {
      if (!businessId) return [];
      const res = await localVendorApi.getCampaigns(businessId);
      return res.data || [];
    },
    enabled: !!businessId,
  });
}

export function useVendorAnalytics(businessId?: string, timeframe?: string) {
  return useQuery({
    queryKey: queryKeys.local.vendorAnalytics(businessId || '', timeframe),
    queryFn: async () => {
      if (!businessId) return null;
      const res = await localVendorApi.getAnalytics(businessId, timeframe);
      return res.data;
    },
    enabled: !!businessId,
  });
}

// ============================================================
// Vendor Mutations
// ============================================================

export function useCreateVendorBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => localVendorApi.createBusiness(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.local.vendorBusinesses,
      });
    },
  });
}

export function useUpdateBookingRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      status,
    }: {
      requestId: string;
      status: 'ACCEPTED' | 'DECLINED';
    }) => localVendorApi.updateBookingRequestStatus(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local', 'vendor'] });
    },
  });
}

export function useCompleteReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: string) =>
      localVendorApi.completeReservation(reservationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local', 'vendor'] });
    },
  });
}

export function useReplyToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      localVendorApi.replyToReview(reviewId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local', 'vendor'] });
    },
  });
}

// ============================================================
// Admin Operations Hooks
// ============================================================

export function useAdminBusinesses(page: number = 1) {
  return useQuery({
    queryKey: queryKeys.local.adminBusinesses(page),
    queryFn: async () => {
      const res = await localAdminApi.getBusinesses(page);
      return res.data || [];
    },
  });
}

export function useAdminMediaQueue() {
  return useQuery({
    queryKey: queryKeys.local.adminMediaQueue,
    queryFn: async () => {
      const res = await localAdminApi.getMediaQueue();
      return res.data || [];
    },
  });
}

export function useAdminVendors(page: number = 1) {
  return useQuery({
    queryKey: queryKeys.local.adminVendors(page),
    queryFn: async () => {
      const res = await localAdminApi.getVendors(page);
      return res.data || [];
    },
  });
}

export function useAdminReviewReports() {
  return useQuery({
    queryKey: queryKeys.local.adminReviewReports,
    queryFn: async () => {
      const res = await localAdminApi.getReviewReports();
      return res.data || [];
    },
  });
}

export function useAdminCampaigns() {
  return useQuery({
    queryKey: queryKeys.local.adminCampaigns,
    queryFn: async () => {
      const res = await localAdminApi.getCampaigns();
      return res.data || [];
    },
  });
}

export function useAdminDemandInsights() {
  return useQuery({
    queryKey: queryKeys.local.adminDemandInsights,
    queryFn: async () => {
      const res = await localAdminApi.getDemandInsights();
      return res.data || [];
    },
  });
}

export function useVerifyBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'VERIFIED' | 'REJECTED' | 'REVOKED';
    }) => localAdminApi.verifyBusiness(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local', 'admin'] });
    },
  });
}

export function useReviewMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED' | 'HIDDEN';
    }) => localAdminApi.reviewMedia(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local', 'admin'] });
    },
  });
}

export function useSuspendVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => localAdminApi.suspendVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['local', 'admin'] });
    },
  });
}
