import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type Method,
} from 'axios';
import { ApiError, type ApiErrorKind } from './ApiError';

export type HttpRequest = Readonly<{
  method: Method;
  path: string;
  body?: unknown;
  params?: Record<string, boolean | number | string | undefined>;
  signal?: AbortSignal;
}>;

export interface AuthTokenProvider {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
  clear(): Promise<void>;
}

export interface HttpObserver {
  onRequest(request: HttpRequest): void;
  onResponse(request: HttpRequest, status: number): void;
  onError(request: HttpRequest, error: ApiError): void;
}

export class HttpClient {
  private readonly client: AxiosInstance;

  public constructor({
    baseUrl,
    observer,
    tokenProvider,
  }: Readonly<{
    baseUrl: string;
    observer?: HttpObserver;
    tokenProvider?: AuthTokenProvider;
  }>) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 15_000,
    });
    this.tokenProvider = tokenProvider;
    this.observer = observer;
  }

  private readonly observer?: HttpObserver;
  private readonly tokenProvider?: AuthTokenProvider;

  public async request<TResponse>(request: HttpRequest): Promise<TResponse> {
    let refreshed = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        this.observer?.onRequest(request);
        const accessToken = await this.tokenProvider?.getAccessToken();
        const config: AxiosRequestConfig = {
          data: request.body,
          headers:
            accessToken === null || accessToken === undefined
              ? undefined
              : { Authorization: `Bearer ${accessToken}` },
          method: request.method,
          params: request.params,
          signal: request.signal,
          url: request.path,
        };
        const response = await this.client.request<TResponse>(config);
        this.observer?.onResponse(request, response.status);
        return response.data;
      } catch (error) {
        const apiError = mapApiError(error);
        this.observer?.onError(request, apiError);
        if (
          apiError.kind === 'authentication' &&
          !refreshed &&
          this.tokenProvider !== undefined
        ) {
          refreshed = true;
          const token = await this.tokenProvider.refreshAccessToken();
          if (token !== null) continue;
          await this.tokenProvider.clear();
        }
        if (canRetry(request, apiError, attempt)) {
          await wait(250 * 2 ** attempt);
          continue;
        }
        throw apiError;
      }
    }
    throw new ApiError('The request exhausted its retry budget.', 'network');
  }
}

function canRetry(
  request: HttpRequest,
  error: ApiError,
  attempt: number,
): boolean {
  return (
    attempt < 2 &&
    ['GET', 'HEAD'].includes(request.method) &&
    ['network', 'server', 'rate-limited'].includes(error.kind)
  );
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function mapApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return new ApiError('An unexpected error occurred.', 'unknown');
  }

  const axiosError = error as AxiosError<{
    message?: string;
    requestId?: string;
  }>;
  const status = axiosError.response?.status;
  const message =
    axiosError.response?.data?.message ??
    axiosError.message ??
    'Request failed.';
  const kind = status === undefined ? 'network' : mapStatus(status);
  return new ApiError(
    message,
    kind,
    status,
    axiosError.response?.data?.requestId,
  );
}

function mapStatus(status: number): ApiErrorKind {
  if (status === 401) return 'authentication';
  if (status === 403) return 'authorization';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate-limited';
  if (status >= 500) return 'server';
  return 'unknown';
}
