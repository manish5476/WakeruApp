import apiClient from '../client';

export const insightsApi = {
    /** Get comparison insights for a trip */
    getTripComparison: (tripId: string) =>
        apiClient.get(`/analytics/compare/trip/${tripId}`),

    /** Get group comparison */
    getGroupComparison: (tripId: string) =>
        apiClient.get(`/analytics/compare/group/${tripId}`),

    /** Get spending trends */
    getSpendingTrends: () =>
        apiClient.get('/analytics/compare/trends'),

    /** Get user analytics for insights */
    getUserAnalytics: (params?: any) =>
        apiClient.get('/analytics/user', { params }),

    /** Get quick stats */
    getQuickStats: () =>
        apiClient.get('/analytics/quick-stats'),
};

