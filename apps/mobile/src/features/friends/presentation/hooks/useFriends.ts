import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '../../../../core/api/services/friends.api';

// ============================================================
// Get Friends List
// ============================================================

export function useFriends(search?: string) {
  return useQuery({
    queryKey: ['friends', 'list', search],
    queryFn: async () => {
      const response = await friendsApi.getFriends(search);
      return response.data?.friends || [];
    },
    staleTime: 30000,
  });
}

// ============================================================
// Get Pending Requests
// ============================================================

export interface IFriendRequest {
  _id: string;
  fromUserId: string;
  fromName: string;
  fromPhotoURL: string;
  toUserId: string;
  toName: string;
  toPhotoURL: string;
  status: 'pending' | 'accepted' | 'declined' | string;
  message?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function usePendingRequests() {
  return useQuery({
    queryKey: ['friends', 'requests'],
    queryFn: async (): Promise<IFriendRequest[]> => {
      const response = await friendsApi.getPendingRequests();
      return response.data?.requests || [];
    },
    staleTime: 15000,
  });
}

// ============================================================
// Get Suggestions
// ============================================================

export function useFriendSuggestions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['friends', 'suggestions'],
    queryFn: async () => {
      const response = await friendsApi.getSuggestions();
      return response.data?.suggestions || [];
    },
    enabled: options?.enabled,
    staleTime: 60000,
  });
}

// ============================================================
// Send Friend Request
// ============================================================

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      toUserId,
      message,
    }: {
      toUserId: string;
      message?: string;
    }) => {
      const response = await friendsApi.sendRequest(toUserId, message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

// ============================================================
// Accept Request
// ============================================================

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      return friendsApi.acceptRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });
}

// ============================================================
// Decline Request
// ============================================================

export function useDeclineFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      return friendsApi.declineRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });
}

// ============================================================
// Remove Friend
// ============================================================

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendUserId: string) => {
      return friendsApi.removeFriend(friendUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] });
    },
  });
}

// ============================================================
// Search Users
// ============================================================

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['friends', 'search', query],
    queryFn: async () => {
      const response = await friendsApi.searchUsers(query);
      return response.data?.users || [];
    },
    enabled: query.length >= 2,
    staleTime: 10000,
  });
}

// ============================================================
// Check Friendship
// ============================================================

export function useCheckFriendship(friendUserId: string) {
  return useQuery({
    queryKey: ['friends', 'check', friendUserId],
    queryFn: async () => {
      const response = await friendsApi.checkFriendship(friendUserId);
      return response.data;
    },
    enabled: !!friendUserId,
    staleTime: 30000,
  });
}

// ============================================================
// Block Friend
// ============================================================

export function useBlockFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendUserId: string) => {
      return friendsApi.blockFriend(friendUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] });
    },
  });
}

// ============================================================
// Mute Friend
// ============================================================

export function useMuteFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendUserId: string) => {
      return friendsApi.muteFriend(friendUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'list'] });
    },
  });
}

// ============================================================
// Trip Invites
// ============================================================

export function useSendTripInvite() {
  return useMutation({
    mutationFn: async (data: {
      friendUserId: string;
      tripId: string;
      message?: string;
    }) => {
      return friendsApi.sendTripInvite(data);
    },
  });
}

export function useRespondToTripInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      inviteId: string;
      status: 'going' | 'interested' | 'maybe' | 'declined';
    }) => {
      return friendsApi.respondToTripInvite(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'trip-invites'] });
    },
  });
}

export function useMyTripInvites() {
  return useQuery({
    queryKey: ['friends', 'trip-invites'],
    queryFn: async () => {
      const response = await friendsApi.getMyTripInvites();
      return response.data?.invites || [];
    },
    staleTime: 15000,
  });
}

// ============================================================
// Get Friend Details (Mocked for Redesign)
// ============================================================

export function useFriendDetails(userId?: string) {
  return useQuery({
    queryKey: ['friends', 'details', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await friendsApi.getFriendDetails(userId);
      return response.data?.details || null;
    },
    enabled: !!userId,
    staleTime: 60000,
  });
}
