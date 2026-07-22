import apiClient, { ApiResponse } from '../client';

export const joinRequestsApi = {
    getPending: async (tripId: string): Promise<ApiResponse<{ requests: any[] }>> => {
        return apiClient.get(`/trips/${tripId}/join-requests`);
    },

    getAllAdminPending: async (): Promise<ApiResponse<{ requests: any[] }>> => {
        return apiClient.get(`/trips/join-requests/all`);
    },

    approve: async (tripId: string, requestId: string): Promise<ApiResponse<{ trip: any }>> => {
        return apiClient.post(`/trips/${tripId}/join-requests/${requestId}/approve`);
    },

    reject: async (tripId: string, requestId: string): Promise<ApiResponse<void>> => {
        return apiClient.post(`/trips/${tripId}/join-requests/${requestId}/reject`);
    },
};


