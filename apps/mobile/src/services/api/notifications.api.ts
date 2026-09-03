import apiClient, { ApiResponse } from './client';

export const notificationsApi = {
  getNotifications: async (params?: any): Promise<ApiResponse<any>> => {
    return apiClient.get('/notifications', { params });
  },

  getUnreadCount: async (): Promise<ApiResponse<{ unreadCount: number }>> => {
    return apiClient.get('/notifications/unread-count');
  },

  getNotificationStats: async (): Promise<ApiResponse<{ stats: any }>> => {
    return apiClient.get('/notifications/stats');
  },

  markAsRead: async (notificationId: string): Promise<ApiResponse<void>> => {
    return apiClient.post(`/notifications/${notificationId}/read`);
  },

  markAsReadByType: async (type: string): Promise<ApiResponse<void>> => {
    return apiClient.post('/notifications/read-by-type', { type });
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    return apiClient.post('/notifications/read-all');
  },

  deleteNotification: async (
    notificationId: string,
  ): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/notifications/${notificationId}`);
  },

  clearAll: async (): Promise<ApiResponse<void>> => {
    return apiClient.delete('/notifications');
  },

  deleteOld: async (days: number = 30): Promise<ApiResponse<void>> => {
    return apiClient.post('/notifications/delete-old', { days });
  },

  broadcastUpdate: async (
    password: string,
    link: string,
  ): Promise<ApiResponse<void>> => {
    return apiClient.post('/notifications/admin/broadcast-update', {
      password,
      link,
    });
  },
};
