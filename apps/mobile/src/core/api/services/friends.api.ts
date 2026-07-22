import apiClient, { ApiResponse } from '../client';

export const friendsApi = {
    sendRequest: (toUserId: string, message?: string) =>
        apiClient.post('/friends/request', { toUserId, message }),

    acceptRequest: (requestId: string) =>
        apiClient.post(`/friends/request/${requestId}/accept`),

    declineRequest: (requestId: string) =>
        apiClient.post(`/friends/request/${requestId}/decline`),

    removeFriend: (friendUserId: string) =>
        apiClient.delete(`/friends/${friendUserId}`),

    getFriends: (search?: string) =>
        apiClient.get('/friends', { params: { search } }),

    getPendingRequests: () =>
        apiClient.get('/friends/requests'),

    searchUsers: (query: string) =>
        apiClient.get('/friends/search', { params: { query } }),

    getSuggestions: () =>
        apiClient.get('/friends/suggestions'),

    checkFriendship: (friendUserId: string) =>
        apiClient.get(`/friends/check/${friendUserId}`),

    getFriendDetails: (friendUserId: string) =>
        apiClient.get(`/friends/${friendUserId}/details`),

    blockFriend: (friendUserId: string) =>
        apiClient.post(`/friends/${friendUserId}/block`),

    muteFriend: (friendUserId: string) =>
        apiClient.post(`/friends/${friendUserId}/mute`),

    sendTripInvite: (data: { friendUserId: string; tripId: string; message?: string }) =>
        apiClient.post('/friends/trip-invite', data),

    respondToTripInvite: (data: { inviteId: string; status: 'going' | 'interested' | 'maybe' | 'declined' }) =>
        apiClient.post('/friends/trip-invite/respond', data),

    getMyTripInvites: () =>
        apiClient.get('/friends/trip-invites'),
};

