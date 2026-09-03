// hooks/useInvitations.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '../services/api/invitations.api';
import { Alert } from 'react-native'; // ✅ ADD THIS IMPORT

export function usePendingInvitations() {
  return useQuery({
    queryKey: ['invitations', 'pending'],
    queryFn: async () => {
      const response = await invitationsApi.getPending();

      // Handle ALL possible response formats
      const resAny = response as any;
      if (Array.isArray(resAny)) return resAny;
      if (resAny?.data?.invitations) return resAny.data.invitations;
      if (Array.isArray(resAny?.data)) return resAny.data;
      if (resAny?.invitations) return resAny.invitations;

      return [];
    },
    staleTime: 10000,
  });
}

export function useSendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tripId,
      toUserId,
      message,
    }: {
      tripId: string;
      toUserId: string;
      message?: string;
    }) => {
      const response = await invitationsApi.send(tripId, toUserId, message);
      const resAny = response as any;
      return resAny?.data?.invitation || resAny?.invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      console.log('📤 Accepting invitation:', invitationId);
      const response = await invitationsApi.accept(invitationId);
      console.log('✅ Accept response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating queries after accept');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('❌ Accept error:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to accept invitation';
      Alert.alert('Notice', message);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      console.log('📤 Declining invitation:', invitationId);
      const response = await invitationsApi.decline(invitationId);
      console.log('✅ Decline response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating queries after decline');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('❌ Decline error:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to decline invitation';
      Alert.alert('Notice', message);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
