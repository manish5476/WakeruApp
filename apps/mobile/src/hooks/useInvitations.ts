// hooks/useInvitations.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '../services/api/invitations.api';
import { Alert } from 'react-native';
import { showToast } from '../utils/toast';

export function usePendingInvitations() {
  return useQuery({
    queryKey: ['invitations', 'pending'],
    queryFn: async () => {
      const response = await invitationsApi.getPending();

      // Handle ALL possible response formats
      if (Array.isArray(response)) return response;
      if (response?.data?.invitations) return response.data.invitations;
      if (Array.isArray(response?.data)) return response.data;
      if ((response as any)?.invitations) return (response as any).invitations;

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
      email,
      message,
    }: {
      tripId: string;
      toUserId?: string;
      email?: string;
      message?: string;
    }) => {
      const response = await invitationsApi.send({
        tripId,
        toUserId,
        email,
        message,
      });
      return response.data?.invitation || (response as any)?.invitation;
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
      showToast.success('Invitation Accepted! 🎉', 'You have joined the trip.');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('❌ Accept error:', error);
      showToast.fromError(error, 'Failed to Accept Invitation');
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
      showToast.info('Invitation Declined');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('❌ Decline error:', error);
      showToast.fromError(error, 'Failed to Decline Invitation');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useSentInvitations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['invitations', 'sent'],
    queryFn: async () => {
      const response = await invitationsApi.getSent();
      if (Array.isArray(response)) return response;
      if (response?.data?.invitations) return response.data.invitations;
      if (Array.isArray(response?.data)) return response.data;
      if ((response as any)?.invitations) return (response as any).invitations;
      return [];
    },
    staleTime: 10000,
    enabled: options?.enabled ?? true,
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      return await invitationsApi.cancel(invitationId);
    },
    onSuccess: () => {
      showToast.success('Invitation Cancelled', 'The invitation was revoked.');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['invitations', 'sent'] });
    },
    onError: (error: any) => {
      showToast.fromError(error, 'Failed to Cancel Invitation');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}
