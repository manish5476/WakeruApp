import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/api/dashboard.api';

export function useDashboard(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async () => {
      const response = await dashboardApi.getDashboard(filters);
      return response.data;
    },
    staleTime: 30000,
  });
}
