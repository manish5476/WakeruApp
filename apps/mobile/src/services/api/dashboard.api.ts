import apiClient from './client';

export const dashboardApi = {
  getDashboard: (params?: any) => apiClient.get('/dashboard', { params }),
};
