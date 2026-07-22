export type ApiErrorKind =
  | 'authentication'
  | 'authorization'
  | 'conflict'
  | 'network'
  | 'not-found'
  | 'rate-limited'
  | 'server'
  | 'validation'
  | 'unknown';

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
