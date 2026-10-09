// services/api/invitations.api.ts

import apiClient, { ApiResponse } from './client';

export const invitationsApi = {
  getPending: async (): Promise<ApiResponse<{ invitations: any[] }>> => {
    console.log('📡 GET /invitations/pending');
    const response = await apiClient.get('/invitations/pending');
    console.log('📡 Response:', response?.status, typeof response?.data);
    return response;
  },

  send: async (
    tripIdOrPayload:
      | string
      | { tripId: string; toUserId?: string; email?: string; message?: string },
    toUserId?: string,
    message?: string,
    email?: string,
  ): Promise<ApiResponse<{ invitation: any }>> => {
    if (typeof tripIdOrPayload === 'object') {
      return apiClient.post('/invitations/send', tripIdOrPayload);
    }
    return apiClient.post('/invitations/send', {
      tripId: tripIdOrPayload,
      toUserId,
      message,
      email,
    });
  },

  accept: async (invitationId: string): Promise<ApiResponse<void>> => {
    console.log('📡 POST /invitations/' + invitationId + '/accept');
    const response = await apiClient.post(
      `/invitations/${invitationId}/accept`,
    );
    console.log('📡 Accept response:', response?.status);
    return response;
  },

  decline: async (invitationId: string): Promise<ApiResponse<void>> => {
    console.log('📡 POST /invitations/' + invitationId + '/decline');
    const response = await apiClient.post(
      `/invitations/${invitationId}/decline`,
    );
    console.log('📡 Decline response:', response?.status);
    return response;
  },

  getSent: async (): Promise<ApiResponse<{ invitations: any[] }>> => {
    return apiClient.get('/invitations/sent');
  },

  cancel: async (invitationId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/invitations/${invitationId}`);
  },
};
