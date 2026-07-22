import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import config from '../config';
import { SecureStorage } from '../storage/SecureStorage';

// ============================================================
// Types
// ============================================================

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
}

export interface PaginatedResponse<T> {
    data?: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        hasMore?: boolean;
    };
}

export class ApiError extends Error {
    statusCode: number;
    code: string;
    details?: any;

    constructor(message: string, statusCode: number, code: string, details?: any) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

// ============================================================
// API Client
// ============================================================

class ApiClient {
    private client: AxiosInstance;
    private refreshPromise: Promise<string> | null = null;
    private logoutCallback: (() => void) | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: config.API_URL,
            timeout: config.API_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    // Set this callback when the Auth Store initializes
    public setLogoutCallback(callback: () => void) {
        this.logoutCallback = callback;
    }

    // ============================================================
    // Interceptors
    // ============================================================

    private setupInterceptors(): void {
        const DEBUG_API = config.IS_DEV;

        if (DEBUG_API) {
            this.client.interceptors.request.use((axiosConfig) => {
                const method = (axiosConfig.method ?? 'GET').toUpperCase();
                const url = `${axiosConfig.baseURL ?? ''}${axiosConfig.url ?? ''}`;
                console.log(`\n🌐 [API REQUEST] ${method} ${url}`);
                return axiosConfig;
            });

            this.client.interceptors.response.use(
                (response) => {
                    const method = (response.config.method ?? 'GET').toUpperCase();
                    const url = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
                    console.log(`\n✅ [API RESPONSE] ${method} ${url} - Status: ${response.status}`);
                    return response;
                },
                (error: AxiosError) => {
                    const method = (error.config?.method ?? 'GET').toUpperCase();
                    const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
                    const status = error.response?.status ?? 'NETWORK_ERR';
                    console.log(`\n❌ [API ERROR] ${method} ${url} - Status: ${status}`);
                    return Promise.reject(error);
                }
            );
        }

        // Request interceptor — attach access token and idempotency key
        this.client.interceptors.request.use(
            async (axiosConfig) => {
                const tokens = await SecureStorage.getTokens();
                if (tokens?.accessToken) {
                    axiosConfig.headers.Authorization = `Bearer ${tokens.accessToken}`;
                }

                const method = axiosConfig.method?.toUpperCase() || 'GET';
                const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
                if (isMutation && !axiosConfig.headers['Idempotency-Key']) {
                    axiosConfig.headers['Idempotency-Key'] = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                }

                return axiosConfig;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor — handle token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<ApiResponse>) => {
                const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

                if (error.response?.status === 401) {
                    if (!originalRequest._retry) {
                        originalRequest._retry = true;

                        try {
                            const newAccessToken = await this.refreshAccessToken();
                            originalRequest.headers = {
                                ...originalRequest.headers,
                                Authorization: `Bearer ${newAccessToken}`,
                            };
                            return this.client(originalRequest);
                        } catch (refreshError) {
                            if (this.logoutCallback) this.logoutCallback();
                            return Promise.reject(refreshError);
                        }
                    } else {
                        if (this.logoutCallback) this.logoutCallback();
                    }
                }

                const apiError = this.normalizeError(error);
                return Promise.reject(apiError);
            }
        );
    }

    // ============================================================
    // Token Refresh
    // ============================================================

    private async refreshAccessToken(): Promise<string> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = (async () => {
            try {
                const tokens = await SecureStorage.getTokens();
                if (!tokens?.refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post<ApiResponse>(
                    `${config.API_URL}/auth/refresh-token`,
                    { refreshToken: tokens.refreshToken }
                );

                const newTokens = response.data.data?.tokens;
                if (!newTokens) throw new Error('No tokens in response');

                await SecureStorage.saveTokens(newTokens);
                return newTokens.accessToken;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    // ============================================================
    // Error Normalization
    // ============================================================

    private normalizeError(error: AxiosError<ApiResponse>): ApiError {
        if (error.response?.data) {
            const data = error.response.data as any;
            const errData = data.error;

            let message = data.message || (typeof errData === 'string' ? errData : errData?.message);
            if (!message) {
                if (typeof data === 'string') {
                    message = data.length > 100 ? data.substring(0, 100) + '...' : data;
                } else {
                    message = JSON.stringify(data);
                }
            }

            const code = typeof errData === 'object' ? errData?.code : 'UNKNOWN_ERROR';
            const details = typeof errData === 'object' ? errData?.details : undefined;

            return new ApiError(
                message,
                error.response.status,
                code || 'UNKNOWN_ERROR',
                details
            );
        }

        if (error.code === 'ECONNABORTED') {
            return new ApiError('Request timed out', 408, 'TIMEOUT');
        }

        if (!error.response) {
            return new ApiError('Network error — please check your connection', 0, 'NETWORK_ERROR');
        }

        return new ApiError('An unexpected error occurred', 500, 'INTERNAL_ERROR');
    }

    // ============================================================
    // HTTP Methods
    // ============================================================

    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }

    // ============================================================
    // Multipart Upload
    // ============================================================

    async upload<T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
        const tokens = await SecureStorage.getTokens();
        const headers: Record<string, string> = {
            Accept: 'application/json',
        };

        if (tokens?.accessToken) {
            headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }

        headers['Idempotency-Key'] = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        const response = await fetch(`${config.API_URL}${url}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new ApiError(data?.message || 'Upload failed', response.status, 'UPLOAD_ERROR', data);
        }

        if (onProgress) {
            onProgress(100);
        }

        return data as T;
    }
}

export const apiClient = new ApiClient();
export default apiClient;
