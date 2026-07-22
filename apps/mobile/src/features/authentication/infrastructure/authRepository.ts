import { z } from 'zod';
import type {
  AuthRepository,
  AuthSession,
  AuthenticatedUser,
  SessionTokens,
  UserId,
} from '@tripsplit/domain';
import { HttpClient } from '@/core/network/HttpClient';

const userDtoSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  photoURL: z.string().url().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

const tokenDtoSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string().optional(),
});

const authResultDtoSchema = z.object({
  data: z.object({ user: userDtoSchema, tokens: tokenDtoSchema }).optional(),
  user: userDtoSchema.optional(),
  tokens: tokenDtoSchema.optional(),
});

function unwrapAuthResult(input: unknown): AuthSession {
  const result = authResultDtoSchema.parse(input);
  const user = result.data?.user ?? result.user;
  const tokens = result.data?.tokens ?? result.tokens;
  if (user === undefined || tokens === undefined) {
    throw new Error(
      'The authentication response did not contain a user and token pair.',
    );
  }
  return { tokens: mapTokens(tokens), user: mapUser(user) };
}

function mapTokens(tokens: z.infer<typeof tokenDtoSchema>): SessionTokens {
  return {
    accessToken: tokens.accessToken,
    expiresAt: tokens.expiresAt,
    refreshToken: tokens.refreshToken,
  };
}

function mapUser(user: z.infer<typeof userDtoSchema>): AuthenticatedUser {
  const id = user.id ?? user._id;
  if (id === undefined)
    throw new Error('The authenticated user did not contain an identifier.');
  return {
    avatarUrl: user.avatarUrl ?? user.photoURL ?? undefined,
    displayName: user.displayName ?? user.name ?? user.email,
    email: user.email,
    id: id as UserId,
  };
}

export function createAuthRepository(httpClient: HttpClient): AuthRepository {
  return {
    async refreshSession(refreshToken, signal) {
      const response = await httpClient.request<unknown>({
        body: { refreshToken },
        method: 'POST',
        path: '/auth/refresh-token',
        signal,
      });
      const result = z
        .object({
          data: tokenDtoSchema.optional(),
          tokens: tokenDtoSchema.optional(),
        })
        .parse(response);
      const tokens = result.data ?? result.tokens;
      if (tokens === undefined)
        throw new Error('The refresh response did not contain a token pair.');
      return mapTokens(tokens);
    },
    async signInWithGoogle(idToken, signal) {
      const response = await httpClient.request<unknown>({
        body: { idToken },
        method: 'POST',
        path: '/auth/login',
        signal,
      });
      return unwrapAuthResult(response);
    },
    async signOut(refreshToken, signal) {
      await httpClient.request<void>({
        body: { refreshToken },
        method: 'POST',
        path: '/auth/logout',
        signal,
      });
    },
  };
}
