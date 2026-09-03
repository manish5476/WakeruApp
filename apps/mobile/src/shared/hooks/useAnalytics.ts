import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../core/api/client';

export function useQuickStats() {
  return useQuery({
    queryKey: ['analytics', 'quick-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/quick-stats');
      return response.data;
    },

    staleTime: 30000,
  });
}

export function useUserAnalytics(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['analytics', 'user', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/user', {
        params: filters,
      });
      return response.data;
    },
    staleTime: 60000,
  });
}

export function useTripAnalytics(
  tripId: string,
  filters?: Record<string, any>,
) {
  return useQuery({
    queryKey: ['analytics', 'trip', tripId, filters],
    queryFn: async () => {
      const response = await apiClient.get(`/analytics/trip/${tripId}`, {
        params: filters,
      });
      return response.data;
    },
    enabled: !!tripId,
    staleTime: 30000,
  });
}

export function useYearlySummary(year: number) {
  return useQuery({
    queryKey: ['analytics', 'yearly', year],
    queryFn: async () => {
      const response = await apiClient.get(`/analytics/yearly/${year}`);
      return response.data;
    },
    staleTime: 300000,
  });
}
