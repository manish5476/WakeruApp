import apiClient, { ApiResponse } from '../client';

export const achievementsApi = {
    getAchievements: async (): Promise<ApiResponse<any>> => {
        return apiClient.get('/achievements');
    },

    getNotifications: async (): Promise<ApiResponse<any>> => {
        return apiClient.get('/achievements/notifications');
    },

    markNotificationsRead: async (notificationIds?: string[]): Promise<ApiResponse<any>> => {
        return apiClient.post('/achievements/notifications/read', { notificationIds });
    },

    getLeaderboard: async (tripId: string): Promise<ApiResponse<any>> => {
        return apiClient.get(`/achievements/leaderboard/${tripId}`);
    },
};


