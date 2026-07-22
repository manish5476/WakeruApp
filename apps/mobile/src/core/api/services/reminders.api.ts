import apiClient, { ApiResponse } from '../client';

export const remindersApi = {
    getMyReminders: (params?: {
        status?: string;
        type?: string;
        tripId?: string;
        targetUserId?: string;
        page?: number;
        limit?: number;
    }) => apiClient.get('/reminders', { params }),

    getIncomingReminders: () => 
        apiClient.get('/reminders/incoming'),

    getTripReminders: (tripId: string) => 
        apiClient.get(`/reminders/trip/${tripId}`),

    create: (data: {
        targetUserId?: string;
        tripId?: string;
        type: string;
        title: string;
        message: string;
        frequency?: string;
        customDays?: number;
    }) => apiClient.post('/reminders', data),

    createSettlementReminder: (data: {
        toUserId: string;
        amount: number;
        currency?: string;
        tripId?: string;
        expenseId?: string;
    }) => apiClient.post('/reminders/settlement', data),

    createBudgetReminder: (data: {
        category: string;
        spentPercent: number;
        month?: Date;
    }) => apiClient.post('/reminders/budget', data),

    pause: (reminderId: string) =>
        apiClient.patch(`/reminders/${reminderId}/pause`),

    resume: (reminderId: string) =>
        apiClient.patch(`/reminders/${reminderId}/resume`),

    cancel: (reminderId: string, reason?: string) =>
        apiClient.delete(`/reminders/${reminderId}`, { params: { reason } }),

    pingUser: (data: {
        targetUserId: string;
        amount: number;
        tripName: string;
        message?: string;
        expenseTitle?: string;
    }) => apiClient.post('/reminders/ping', data),
};

