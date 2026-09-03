import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../services/api/users.api';
import { queryKeys } from './queryKeys';
import { useAuthStore } from '../stores/auth.store';

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await usersApi.searchUsers(query);
      return (response as any).data?.users || (response as any).data || [];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateBankingDetails() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);

  return useMutation({
    mutationFn: async (data: { upiId?: string; bankAccount?: any }) => {
      const response = await usersApi.updateBankingDetails(data);
      if (!response.success || !response.data?.user) {
        throw new Error(
          response.message || 'Could not update banking details.',
        );
      }
      return response.data?.user;
    },
    onSuccess: (user: any) => {
      if (user) {
        setUser(user);
        queryClient.setQueryData(queryKeys.auth.profile, user);
      }
    },
  });
}

export function useReactivateAccount() {
  return useMutation({
    mutationFn: async () => {
      const response = await usersApi.reactivateAccount();
      return response.data;
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.users.stats,
    queryFn: async () => {
      const response = await usersApi.getStats();
      return response.data?.stats;
    },
  });
}

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.publicProfile(userId),
    queryFn: async () => {
      if (!userId) return null;
      const response = await usersApi.getPublicProfile(userId);
      return response.data?.profile || response.data?.user;
    },
    enabled: !!userId,
  });
}

export function useUpgradeRole() {
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await usersApi.upgradeRole(userId, { role });
      return response.data;
    },
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile,
    queryFn: async () => {
      const response = await usersApi.getProfile();
      return response.data?.user;
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await usersApi.updateProfile(data);
      return response.data?.user;
    },
    onSuccess: (user: any) => {
      if (user) {
        setUser(user);
        queryClient.setQueryData(queryKeys.users.profile, user);
        queryClient.setQueryData(queryKeys.auth.profile, user);
      }
    },
  });
}
