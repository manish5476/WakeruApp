import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { queryKeys } from './queryKeys';
import { useAuthStore } from '../stores/auth.store';

// ============================================================
// Profile
// ============================================================

export function useProfile() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: async () => {
      if (!isAuthenticated) {
        return null;
      }
      const response = await authApi.getProfile();
      return response.data?.user;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ============================================================
// Update Profile Mutation
// ============================================================

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await authApi.updateProfile(data);
      if (!response.success || !response.data?.user) {
        throw new Error(response.message || 'Could not update your profile.');
      }
      return response.data?.user;
    },
    onSuccess: (user: any) => {
      if (user) {
        setUser(user);
        queryClient.setQueryData(queryKeys.auth.profile, user);
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
      }
    },
  });
}

// ============================================================
// UPI Management
// ============================================================

export function useSetUpiId() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);

  return useMutation({
    mutationFn: async (upiId: string) => {
      const response = await authApi.setUpiId(upiId);
      if (!response.success || !response.data?.user) {
        throw new Error(response.message || 'Could not update your UPI ID.');
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

export function useVerifyUpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await authApi.verifyUpi();
      if (
        !response.success ||
        typeof response.data?.upiVerified !== 'boolean'
      ) {
        throw new Error(response.message || 'Could not verify your UPI ID.');
      }
      return response.data?.upiVerified;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
    },
  });
}

// ============================================================
// FCM Token
// ============================================================

export function useUpdateFcmToken() {
  return useMutation({
    mutationFn: async (fcmToken: string) => {
      return authApi.updateFcmToken(fcmToken);
    },
  });
}

// ============================================================
// Delete Account
// ============================================================

export function useDeleteAccount() {
  const logout = useAuthStore(s => s.logout);

  return useMutation({
    mutationFn: async () => {
      return authApi.deleteAccount();
    },
    onSuccess: () => {
      logout();
    },
  });
}
