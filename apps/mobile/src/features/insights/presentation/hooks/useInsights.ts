import { useQuery } from '@tanstack/react-query';
import { insightsApi } from '../../../../core/api/services/insights.api';

export function useTripComparison(tripId: string) {
  return useQuery({
    queryKey: ['insights', 'trip-comparison', tripId],
    queryFn: () => insightsApi.getTripComparison(tripId),
    enabled: !!tripId,
    staleTime: 60000,
  });
}

export function useGroupComparison(tripId: string) {
  return useQuery({
    queryKey: ['insights', 'group-comparison', tripId],
    queryFn: () => insightsApi.getGroupComparison(tripId),
    enabled: !!tripId,
    staleTime: 60000,
  });
}

export function useSpendingTrends() {
  return useQuery({
    queryKey: ['insights', 'trends'],
    queryFn: () => insightsApi.getSpendingTrends(),
    staleTime: 120000,
  });
}

export function useInsightsData() {
  return useQuery({
    queryKey: ['insights', 'dashboard'],
    queryFn: async () => {
      const [analytics, quickStats] = await Promise.all([
        insightsApi.getUserAnalytics({ groupBy: 'month' }),
        insightsApi.getQuickStats(),
      ]);
      return {
        analytics: analytics.data,
        quickStats: quickStats.data,
      };
    },
    staleTime: 60000,
  });
}
