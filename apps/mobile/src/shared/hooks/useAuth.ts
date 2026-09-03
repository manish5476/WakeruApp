import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../core/api/services';
import { queryKeys } from './queryKeys';
import { useAuthStore, AuthState } from '../../state/auth';

// ============================================================
// Profile
// ============================================================

export function useProfile() {
  const isAuthenticated = useAuthStore((s: AuthState) => s.isAuthenticated);

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
  const setUser = useAuthStore((s: AuthState) => s.setUser);

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await authApi.updateProfile(data);
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
  const setUser = useAuthStore((s: AuthState) => s.setUser);

  return useMutation({
    mutationFn: async (upiId: string) => {
      const response = await authApi.setUpiId(upiId);
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
  const logout = useAuthStore((s: AuthState) => s.logout);

  return useMutation({
    mutationFn: async () => {
      return authApi.deleteAccount();
    },
    onSuccess: () => {
      logout();
    },
  });
}
