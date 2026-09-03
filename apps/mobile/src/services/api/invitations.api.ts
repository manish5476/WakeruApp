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
    tripId: string,
    toUserId: string,
    message?: string,
  ): Promise<ApiResponse<{ invitation: any }>> => {
    return apiClient.post('/invitations/send', { tripId, toUserId, message });
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
};

// import apiClient, { ApiResponse } from './client';

// export const invitationsApi = {
//     getPending: async (): Promise<ApiResponse<{ invitations: any[] }>> => {
//         return apiClient.get('/invitations/pending');
//     },

//     send: async (tripId: string, toUserId: string, message?: string): Promise<ApiResponse<{ invitation: any }>> => {
//         return apiClient.post('/invitations/send', { tripId, toUserId, message });
//     },

//     accept: async (invitationId: string): Promise<ApiResponse<void>> => {
//         return apiClient.post(`/invitations/${invitationId}/accept`);
//     },

//     decline: async (invitationId: string): Promise<ApiResponse<void>> => {
//         return apiClient.post(`/invitations/${invitationId}/decline`);
//     },
// };

// // import apiClient, { ApiResponse } from './client';

// // export const invitationsApi = {
// //     getPending: async (): Promise<ApiResponse<{ invitations: any[] }>> => {
// //         return apiClient.get('/invitations/pending');
// //     },

// //     send: async (tripId: string, toUserId: string, message?: string): Promise<ApiResponse<{ invitation: any }>> => {
// //         return apiClient.post('/invitations/send', { tripId, toUserId, message });
// //     },

// //     accept: async (invitationId: string): Promise<ApiResponse<void>> => {
// //         return apiClient.post(`/invitations/${invitationId}/accept`);
// //     },

// //     decline: async (invitationId: string): Promise<ApiResponse<void>> => {
// //         return apiClient.post(`/invitations/${invitationId}/decline`);
// //     },
// // };
