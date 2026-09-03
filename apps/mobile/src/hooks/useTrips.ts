import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { tripsApi } from '../services/api';
import { queryKeys } from './queryKeys';

// ============================================================
// Trip Templates
// ============================================================

export function useTripTemplates() {
  return useQuery({
    queryKey: queryKeys.trips.templates,
    queryFn: async () => {
      const response = await tripsApi.getTemplates();
      return response.data?.templates || [];
    },
    staleTime: Infinity, // Templates rarely change
  });
}

// ============================================================
// My Trips List
// ============================================================

export function useMyTrips(filters?: {
  status?: string;
  includeArchived?: boolean;
  searchName?: string;
  searchUser?: string;
  dateRange?: string;
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.trips.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await tripsApi.getMyTrips({
        ...filters,
        page: pageParam,
        limit: 10,
      });
      return response.data; // returns { trips, pagination, stats }
    },
    getNextPageParam: lastPage => {
      if (!lastPage?.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      if (page < totalPages) return page + 1;
      return undefined;
    },
    initialPageParam: 1,
  });
}

// ============================================================
// Latest Trip (Independent of filters)
// ============================================================

export function useLatestTrip() {
  return useQuery({
    queryKey: [...queryKeys.trips.list({ latest: true })],
    queryFn: async () => {
      // Fetch without any specific filters to just get the latest active trips
      const response = await tripsApi.getMyTrips({ limit: 1 });
      return response.data?.trips?.[0] || null;
    },
  });
}

// ============================================================
// Single Trip
// ============================================================

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: queryKeys.trips.detail(tripId),
    queryFn: async () => {
      const response = await tripsApi.getTrip(tripId);
      return response.data?.trip;
    },
    enabled: !!tripId,
  });
}

// ============================================================
// Trip Summary (Dashboard)
// ============================================================

export function useTripSummary(tripId: string) {
  return useQuery({
    queryKey: queryKeys.trips.summary(tripId),
    queryFn: async () => {
      const response = await tripsApi.getTripSummary(tripId);
      return (response.data as { summary?: any })?.summary;
    },
    enabled: !!tripId,
    staleTime: 1000 * 30, // 30 seconds — frequent updates
  });
}

// ============================================================
// Trip Story
// ============================================================

export function useTripStory(tripId: string) {
  return useQuery({
    queryKey: queryKeys.trips.story(tripId),
    queryFn: async () => {
      const response = await tripsApi.getTripStory(tripId);
      return (response.data as { story?: any })?.story;
    },
    enabled: !!tripId,
  });
}

// ============================================================
// Trip Members
// ============================================================

export function useTripMembers(tripId: string) {
  return useQuery({
    queryKey: queryKeys.trips.members(tripId),
    queryFn: async () => {
      const response = await tripsApi.getMembers(tripId);
      return response.data;
    },
    enabled: !!tripId,
  });
}

// ============================================================
// Create Trip (from template or manual)
// ============================================================

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      template,
      data,
    }: {
      template?: string;
      data: any;
    }) => {
      if (template) {
        const response = await tripsApi.createFromTemplate(template, data);
        return response.data?.trip;
      }
      const response = await tripsApi.create(data);
      return response.data?.trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

// ============================================================
// Update Trip
// ============================================================

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: any }) => {
      const response = await tripsApi.updateTrip(tripId, data);
      return response.data?.trip;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.list() });
    },
  });
}

export function useArchiveTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      return tripsApi.archiveTrip(tripId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

export function useUnarchiveTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      return tripsApi.unarchiveTrip(tripId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

export function useDeleteTripPermanent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      return tripsApi.deleteTripPermanent(tripId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

// ============================================================
// Join Trip via Invite
// ============================================================

export function useJoinTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await tripsApi.joinTrip(inviteCode);
      return response.data?.joinRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

// ============================================================
// Stop Management
// ============================================================

export function useAddStop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: any }) => {
      const response = await tripsApi.addStop(tripId, data);
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.summary(tripId),
      });
    },
  });
}

export function useUpdateStop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      stopId,
      data,
    }: {
      tripId: string;
      stopId: string;
      data: any;
    }) => {
      const response = await tripsApi.updateStop(tripId, stopId, data);
      return response.data?.stop;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
    },
  });
}

export function useUpdateStopRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      stopId,
      data,
    }: {
      tripId: string;
      stopId: string;
      data: any;
    }) => {
      const response = await tripsApi.updateStopRate(tripId, stopId, data);
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
    },
  });
}

export function useReorderStops() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      stopIds,
    }: {
      tripId: string;
      stopIds: string[];
    }) => {
      const response = await tripsApi.reorderStops(tripId, stopIds);
      return response.data?.stops;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
    },
  });
}

export function useDeleteStop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      stopId,
    }: {
      tripId: string;
      stopId: string;
    }) => {
      return tripsApi.deleteStop(tripId, stopId);
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.summary(tripId),
      });
    },
  });
}

// ============================================================
// Member Management
// ============================================================

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      userId,
      role,
    }: {
      tripId: string;
      userId: string;
      role: string;
    }) => {
      return tripsApi.updateMemberRole(tripId, userId, role);
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.members(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
    },
  });
}

export function useAddTripMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      userId,
      role = 'member',
    }: {
      tripId: string;
      userId: string;
      role?: string;
    }) => {
      return tripsApi.addMember(tripId, userId, role);
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.members(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.summary(tripId),
      });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      userId,
    }: {
      tripId: string;
      userId: string;
    }) => {
      return tripsApi.removeMember(tripId, userId);
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.members(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
    },
  });
}

// ============================================================
// Invite Management
// ============================================================

export function useGenerateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      expiresInDays,
    }: {
      tripId: string;
      expiresInDays?: number;
    }) => {
      const response = await tripsApi.generateInvite(tripId, expiresInDays);
      return response.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      return tripsApi.revokeInvite(tripId);
    },
    onSuccess: (_, tripId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.detail(tripId),
      });
    },
  });
}
