import apiClient from './client';

export interface SharedExpensesParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  tripId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SharedTripsParams {
  page?: number;
  limit?: number;
}

export const personApi = {
  getPersonDetail: (userId: string) => apiClient.get(`/person/${userId}`), // Legacy endpoint if still used

  // LIGHTWEIGHT: Basic profile + balance
  getPersonProfile: (userId: string) =>
    apiClient.get(`/person/${userId}/profile`),

  // PAGINATED: Shared expenses
  getSharedExpenses: (userId: string, params?: SharedExpensesParams) =>
    apiClient.get(`/person/${userId}/expenses`, { params }),

  // PAGINATED: Shared trips
  getSharedTrips: (userId: string, params?: SharedTripsParams) =>
    apiClient.get(`/person/${userId}/trips`, { params }),

  // LIMITED: Recent activity (last N items)
  getRecentActivity: (userId: string, limit: number = 10) =>
    apiClient.get(`/person/${userId}/activity`, { params: { limit } }),

  // LIGHTWEIGHT: Settlement options only
  getSettlementOptions: (userId: string) =>
    apiClient.get(`/person/${userId}/settlement`),

  // FULL (optional): Complete data for export/download
  getFullDetail: (userId: string) => apiClient.get(`/person/${userId}/full`),
};
