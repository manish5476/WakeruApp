// hooks/useInvitations.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '../../../../core/api/services/invitations.api';
import { Alert } from 'react-native'; // ✅ ADD THIS IMPORT

export function usePendingInvitations() {
  return useQuery({
    queryKey: ['invitations', 'pending'],
    queryFn: async () => {
      const response = await invitationsApi.getPending();

      // Handle ALL possible response formats
      if (Array.isArray(response)) return response;
      if (response?.data?.invitations) return response.data.invitations;
      if (Array.isArray(response?.data)) return response.data;
      if (response?.invitations) return response.invitations;

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
      return response.data?.invitation || response?.invitation;
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
      Alert.alert('Error', message);
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
      Alert.alert('Error', message);
    },
  });
}

// // hooks/useInvitations.ts

// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { invitationsApi } from '../../../../core/api/services/invitations.api';

// export function usePendingInvitations() {
//     return useQuery({
//         queryKey: ['invitations', 'pending'],
//         queryFn: async () => {
//             const response = await invitationsApi.getPending();

//             // ✅ Handle standardized backend response: { success: true, data: { invitations: [...] } }
//             if (response?.data?.invitations) {
//                 return response.data.invitations;
//             }

//             // Fallback: if response.data is an array directly
//             if (Array.isArray(response?.data)) {
//                 return response.data;
//             }

//             // Fallback: if response is an array directly
//             if (Array.isArray(response)) {
//                 return response;
//             }

//             return [];
//         },
//         staleTime: 10000,
//     });
// }

// export function useSendInvitation() {
//     const queryClient = useQueryClient();
//     return useMutation({
//         mutationFn: async ({ tripId, toUserId, message }: { tripId: string; toUserId: string; message?: string }) => {
//             const response = await invitationsApi.send(tripId, toUserId, message);
//             return response.data?.invitation;
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['invitations'] });
//         },
//     });
// }

// export function useAcceptInvitation() {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: async (invitationId: string) => {
//             return invitationsApi.accept(invitationId);
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['invitations'] });
//             queryClient.invalidateQueries({ queryKey: ['trips'] });
//             queryClient.invalidateQueries({ queryKey: ['notifications'] });
//         },
//     });
// }

// export function useDeclineInvitation() {
//     const queryClient = useQueryClient();

//     return useMutation({
//         mutationFn: async (invitationId: string) => {
//             return invitationsApi.decline(invitationId);
//         },
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ['invitations'] });
//             queryClient.invalidateQueries({ queryKey: ['notifications'] });
//         },
//     });
// }
