import apiClient, { ApiResponse } from '../client';
import { IUser } from '../../types/user.types';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface Session {
    token: string;
    device: string;
    ip: string;
    lastActive: string;
}

interface AuthResult {
    user: IUser;
    tokens: TokenPair;
    isNewUser: boolean;
}

export interface UserPreferences {
    defaultCurrency: string;
    language: string;
    theme: string;
    timezone: string;
    notifications: {
        push: boolean;
        email: boolean;
        sms: boolean;
        expenseAdded: boolean;
        settlementReminder: boolean;
        monthlyReport: boolean;
    };
    appearance: {
        themePreset: string;
        backgroundType: string;
        backgroundColor: string;
        backgroundImage: string;
        backgroundBlur: number;
        backgroundImagePosition: {
            x: number;
            y: number;
            scale: number;
        };
    };
}

export const authApi = {
    register: async (idToken: string, metadata?: any): Promise<ApiResponse<AuthResult>> => {
        return apiClient.post('/auth/register', { idToken, metadata });
    },

    login: async (idToken: string): Promise<ApiResponse<AuthResult>> => {
        return apiClient.post('/auth/login', { idToken });
    },

    forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
        return apiClient.post('/auth/forgot-password', { email });
    },

    refreshToken: async (refreshToken: string): Promise<ApiResponse<TokenPair>> => {
        return apiClient.post('/auth/refresh-token', { refreshToken });
    },

    logout: async (refreshToken: string): Promise<ApiResponse<void>> => {
        return apiClient.post('/auth/logout', { refreshToken });
    },

    logoutAll: async (): Promise<ApiResponse<void>> => {
        return apiClient.post('/auth/logout-all');
    },

    getSessions: async (): Promise<ApiResponse<{ sessions: Session[] }>> => {
        return apiClient.get('/auth/sessions');
    },

    getProfile: async (): Promise<ApiResponse<{ user: IUser }>> => {
        return apiClient.get('/auth/me');
    },

    updateProfile: async (data: Partial<IUser>): Promise<ApiResponse<{ user: IUser }>> => {
        return apiClient.patch('/auth/me', data);
    },

    getPreferences: async (): Promise<ApiResponse<{ preferences: UserPreferences }>> => {
        return apiClient.get('/users/preferences');
    },

    updatePreferences: async (preferences: any): Promise<ApiResponse<{ user: IUser }>> => {
        return apiClient.put('/users/preferences', preferences);
    },

    setUpiId: async (upiId: string): Promise<ApiResponse<{ user: IUser }>> => {
        return apiClient.put('/auth/me/upi', { upiId });
    },

    verifyUpi: async (): Promise<ApiResponse<{ upiVerified: boolean }>> => {
        return apiClient.post('/auth/me/upi/verify');
    },

    updateFcmToken: async (fcmToken: string): Promise<ApiResponse<void>> => {
        return apiClient.put('/auth/me/fcm-token', { fcmToken });
    },

    deleteAccount: async (): Promise<ApiResponse<void>> => {
        return apiClient.delete('/auth/me');
    },
};

