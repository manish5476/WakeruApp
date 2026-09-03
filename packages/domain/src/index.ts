export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type UserId = Brand<string, 'UserId'>;
export type TripId = Brand<string, 'TripId'>;
export type ExpenseId = Brand<string, 'ExpenseId'>;

export type SessionTokens = Readonly<{
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
}>;

export type AuthenticatedUser = Readonly<{
  id: UserId;
  displayName: string;
  email: string;
  avatarUrl?: string;
}>;

export type AuthSession = Readonly<{
  user: AuthenticatedUser;
  tokens: SessionTokens;
}>;

export interface AuthRepository {
  signInWithGoogle(idToken: string, signal?: AbortSignal): Promise<AuthSession>;
  refreshSession(refreshToken: string, signal?: AbortSignal): Promise<SessionTokens>;
  signOut(refreshToken: string, signal?: AbortSignal): Promise<void>;
}

export interface SessionRepository {
  read(): Promise<AuthSession | null>;
  write(session: AuthSession): Promise<void>;
  clear(): Promise<void>;
}

export * from './splits/expenseSplits';
export * from './settlements/debtSimplification';
