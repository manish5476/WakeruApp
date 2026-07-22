import apiClient, { ApiResponse, PaginatedResponse } from '../client';
import { Platform } from 'react-native';

export const usersApi = {
    searchUsers: async (query: string, page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<any>>> => {
        return apiClient.get('/users/search', { params: { query, page, limit } });
    },
    updateBankingDetails: async (data: { upiId?: string; bankAccount?: any }): Promise<ApiResponse<any>> => {
        return apiClient.put('/users/banking', data);
    },
    getLinkedAccounts: async (): Promise<ApiResponse<any>> => {
        return apiClient.get('/users/linked-accounts');
    },
    getPreferences: async (): Promise<ApiResponse<any>> => {
        return apiClient.get('/users/preferences');
    },
    updatePreferences: async (data: any): Promise<ApiResponse<any>> => {
        return apiClient.put('/users/preferences', data);
    },
    deactivateAccount: async (reason?: string): Promise<ApiResponse<void>> => {
        return apiClient.post('/users/deactivate', { reason });
    },
    deleteAccount: async (): Promise<ApiResponse<void>> => {
        return apiClient.delete('/users/account');
    },
    uploadProfilePicture: async (imageUri: string, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        const filename = `profile-${Date.now()}.jpg`;
        
        if (Platform.OS === 'web') {
            const res = await fetch(imageUri);
            const blob = await res.blob();
            formData.append('profilePicture', blob, filename);
        } else {
            formData.append('profilePicture', {
                uri: imageUri,
                type: 'image/jpeg',
                name: filename,
            } as any);
        }
        
        return apiClient.upload('/users/profile-picture', formData, onProgress);
    },
    registerFCMToken: async (token: string): Promise<ApiResponse<void>> => {
        return apiClient.post('/users/fcm-token', { token });
    },
    reactivateAccount: async (): Promise<ApiResponse<void>> => {
        return apiClient.post('/users/reactivate');
    },
    getStats: async (): Promise<ApiResponse<any>> => {
        return apiClient.get('/users/stats');
    },
    getPublicProfile: async (userId: string): Promise<ApiResponse<any>> => {
        return apiClient.get(`/users/${userId}`);
    },
    upgradeRole: async (userId: string, data: { role: string }): Promise<ApiResponse<any>> => {
        return apiClient.put(`/users/${userId}/role`, data);
    },
    getProfile: async (): Promise<ApiResponse<any>> => {
        return apiClient.get('/users/profile');
    },
    updateProfile: async (data: any): Promise<ApiResponse<any>> => {
        return apiClient.put('/users/profile', data);
    },
};


