import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { personApi } from '../../../../core/api/services/person.api';

// ============================================================
// PERSON PROFILE (Lightweight — loads instantly)
// ============================================================

export function usePersonProfile(userId: string) {
  return useQuery({
    queryKey: ['person', 'profile', userId],
    queryFn: async () => {
      const response = await personApi.getPersonProfile(userId);
      return response.data; // { success, data: { person, balance } }
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // Cache for 1 minute
    retry: 1,
  });
}

// ============================================================
// SHARED EXPENSES (Paginated — infinite scroll)
// ============================================================

export function useSharedExpenses(
  userId: string,
  filters?: {
    status?: string;
    category?: string;
    tripId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
) {
  return useInfiniteQuery({
    queryKey: ['person', 'expenses', userId, filters],

    queryFn: async ({ pageParam = 1 }) => {
      const response = await personApi.getSharedExpenses(userId, {
        page: pageParam,
        limit: 50,
        ...filters,
      });
      return response.data; // { success, data: { expenses, pagination } }
    },

    initialPageParam: 1,

    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.data?.pagination;
      if (pagination?.hasMore) {
        return pagination.page + 1;
      }
      return undefined;
    },

    enabled: !!userId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

// ============================================================
// SHARED TRIPS (Paginated)
// ============================================================

export function useSharedTrips(userId: string) {
  return useInfiniteQuery({
    queryKey: ['person', 'trips', userId],

    queryFn: async ({ pageParam = 1 }) => {
      const response = await personApi.getSharedTrips(userId, {
        page: pageParam,
        limit: 10,
      });
      return response.data; // { success, data: { trips, pagination } }
    },

    initialPageParam: 1,

    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.data?.pagination;
      if (pagination?.hasMore) {
        return pagination.page + 1;
      }
      return undefined;
    },

    enabled: !!userId,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

// ============================================================
// RECENT ACTIVITY (Limited — last N items)
// ============================================================

export function usePersonActivity(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: ['person', 'activity', userId, limit],
    queryFn: async () => {
      const response = await personApi.getRecentActivity(userId, limit);
      return response.data; // { success, data: [...] }
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

// ============================================================
// SETTLEMENT OPTIONS (Lightweight)
// ============================================================

export function useSettlementOptions(userId: string) {
  return useQuery({
    queryKey: ['person', 'settlement', userId],
    queryFn: async () => {
      const response = await personApi.getSettlementOptions(userId);
      return response.data; // { success, data: { balance, options } }
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
    retry: 1,
  });
}

// ============================================================
// FULL DETAIL (Export — heavier call, longer cache)
// ============================================================

export function usePersonFullDetail(userId: string) {
  return useQuery({
    queryKey: ['person', 'full', userId],
    queryFn: async () => {
      const response = await personApi.getFullDetail(userId);
      return response.data; // { success, data: { profile, balance, expenses, trips, ... } }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}
