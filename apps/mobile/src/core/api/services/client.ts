import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import config from '../../config';
import { storage } from '../../utils/storage';

// Lazy getter to avoid circular dependency: client.ts ↔ auth.store.ts ↔ api/index.ts
const getAuthStore = () => require('../../stores/auth.store').useAuthStore;

// ============================================================
// Types
// ============================================================

export interface ApiResponse<T = any> {
  invitations: any;
  invitation: any;
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
  expenses?: T[];
  notifications?: T[];
  receipts?: T[];
  trips?: T[];
  users?: T[];
  totalAmount?: number;
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

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any,
  ) {
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

  constructor() {
    this.client = axios.create({
      baseURL: config.API_URL,
      timeout: config.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // ============================================================
  // Interceptors
  // ============================================================

  private setupInterceptors(): void {
    // ── DEV LOGGING — curl-style request/response ─────────────
    // Never emit request/response bodies: they can contain credentials and
    // financial or personal information. Use a dedicated redacted logger if
    // request diagnostics are needed in the future.
    const DEBUG_API = false;
    if (__DEV__ && DEBUG_API) {
      this.client.interceptors.request.use(axiosConfig => {
        const method = (axiosConfig.method ?? 'GET').toUpperCase();
        const url = `${axiosConfig.baseURL ?? ''}${axiosConfig.url ?? ''}`;
        const body = axiosConfig.data
          ? JSON.stringify(axiosConfig.data, null, 2)
          : '';
        const curlBody = body ? ` \\\n  -d '${body}'` : '';
        const authHeader = (axiosConfig.headers?.Authorization as
          string | undefined)
          ? ` \\\n  -H 'Authorization: ${axiosConfig.headers.Authorization}'`
          : '';

        console.log(
          `\n🌐 [API REQUEST]\ncurl -X ${method} '${url}'` +
            ` \\\n  -H 'Content-Type: application/json'` +
            `${authHeader}${curlBody}\n`,
        );
        return axiosConfig;
      });

      this.client.interceptors.response.use(
        response => {
          const method = (response.config.method ?? 'GET').toUpperCase();
          const url = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
          const status = response.status;
          const emoji = status < 300 ? '✅' : status < 400 ? '↪️' : '❌';
          console.log(
            `\n${emoji} [API RESPONSE] ${method} ${url}\n` +
              `   Status: ${status}\n` +
              `   Body: ${JSON.stringify(response.data, null, 2)}\n`,
          );
          return response;
        },
        (error: AxiosError) => {
          const method = (error.config?.method ?? 'GET').toUpperCase();
          const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
          const status = error.response?.status ?? 'NETWORK_ERR';
          console.log(
            `\n❌ [API ERROR] ${method} ${url}\n` +
              `   Status: ${status}\n` +
              `   Body: ${JSON.stringify(error.response?.data, null, 2)}\n`,
          );
          return Promise.reject(error);
        },
      );
    }

    // Request interceptor — attach access token and idempotency key
    this.client.interceptors.request.use(
      async axiosConfig => {
        const tokens = await storage.getTokens();
        if (tokens?.accessToken) {
          axiosConfig.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        // Attach Idempotency-Key for mutations if not already present
        const method = axiosConfig.method?.toUpperCase() || 'GET';
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        if (isMutation && !axiosConfig.headers['Idempotency-Key']) {
          axiosConfig.headers['Idempotency-Key'] =
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
              /[xy]/g,
              function (c) {
                const r = (Math.random() * 16) | 0,
                  v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
              },
            );
        }

        return axiosConfig;
      },
      error => Promise.reject(error),
    );

    // Response interceptor — handle token refresh
    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 — try to refresh token
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
              // Refresh failed — logout
              getAuthStore().getState().logout();
              return Promise.reject(refreshError);
            }
          } else {
            // Already retried and failed again with 401, force logout
            getAuthStore().getState().logout();
          }
        }

        // Normalize error
        const apiError = this.normalizeError(error);
        return Promise.reject(apiError);
      },
    );
  }

  // ============================================================
  // Token Refresh
  // ============================================================

  private async refreshAccessToken(): Promise<string> {
    // Deduplicate concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const tokens = await storage.getTokens();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<ApiResponse>(
          `${config.API_URL}/auth/refresh-token`,
          { refreshToken: tokens.refreshToken },
        );

        const newTokens = response.data.data?.tokens;
        if (!newTokens) throw new Error('No tokens in response');

        await storage.saveTokens(newTokens);
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

      // Backend might send { message: "..." } or { error: "..." } or { error: { message: "..." } }
      let message =
        data.message ||
        (typeof errData === 'string' ? errData : errData?.message);

      if (!message) {
        // If it's a string (like HTML page), just show a snippet of it
        if (typeof data === 'string') {
          message = data.length > 100 ? data.substring(0, 100) + '...' : data;
        } else {
          // Otherwise stringify the object so we can debug it
          message = JSON.stringify(data);
        }
      }

      const code =
        typeof errData === 'object' ? errData?.code : 'UNKNOWN_ERROR';
      const details =
        typeof errData === 'object' ? errData?.details : undefined;

      return new ApiError(
        message,
        error.response.status,
        code || 'UNKNOWN_ERROR',
        details,
      );
    }

    if (error.code === 'ECONNABORTED') {
      return new ApiError('Request timed out', 408, 'TIMEOUT');
    }

    if (!error.response) {
      return new ApiError(
        'Network error — please check your connection',
        0,
        'NETWORK_ERROR',
      );
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

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
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

  async upload<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    // We use fetch here to bypass Axios's notorious issues with React Native FormData polyfills.
    // Axios tends to either stringify it (if Content-Type is application/json) or
    // strip the multipart boundary (if Content-Type is forced to multipart/form-data).
    const tokens = await storage.getTokens();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (tokens?.accessToken) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }

    headers['Idempotency-Key'] = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );

    const response = await fetch(`${config.API_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData, // fetch will automatically add Content-Type: multipart/form-data; boundary=...
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data?.message || 'Upload failed',
        response.status,
        'UPLOAD_ERROR',
        data,
      );
    }

    if (onProgress) {
      onProgress(100);
    }

    return data as T;
  }
}

// ============================================================
// Singleton Export
// ============================================================

export const apiClient = new ApiClient();
export default apiClient;
