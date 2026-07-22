import React, {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import type { AuthRepository, SessionRepository } from '@tripsplit/domain';
import { createAuthRepository } from '@/features/authentication/infrastructure/authRepository';
import { HttpClient } from '@/core/network/HttpClient';
import { createRuntimeConfig } from '@/core/config/runtimeConfig';
import { EncryptedSessionRepository } from '@/core/storage/EncryptedSessionRepository';

export type AppServices = Readonly<{
  authRepository: AuthRepository;
  httpClient: HttpClient;
  sessionRepository: SessionRepository;
}>;

const AppServicesContext = createContext<AppServices | null>(null);

function createServices(): AppServices {
  const runtimeConfig = createRuntimeConfig();
  const sessionRepository = new EncryptedSessionRepository();
  const publicHttpClient = new HttpClient({
    baseUrl: runtimeConfig.apiBaseUrl,
  });
  const authRepository = createAuthRepository(publicHttpClient);
  const httpClient = new HttpClient({
    baseUrl: runtimeConfig.apiBaseUrl,
    tokenProvider: {
      async clear() {
        await sessionRepository.clear();
      },
      async getAccessToken() {
        return (await sessionRepository.read())?.tokens.accessToken ?? null;
      },
      async refreshAccessToken() {
        const session = await sessionRepository.read();
        if (session === null) return null;
        try {
          const tokens = await authRepository.refreshSession(
            session.tokens.refreshToken,
          );
          await sessionRepository.write({ ...session, tokens });
          return tokens.accessToken;
        } catch {
          await sessionRepository.clear();
          return null;
        }
      },
    },
  });
  return {
    authRepository,
    httpClient,
    sessionRepository,
  };
}

export function AppServicesProvider({ children }: PropsWithChildren) {
  const services = useMemo(createServices, []);
  return (
    <AppServicesContext.Provider value={services}>
      {children}
    </AppServicesContext.Provider>
  );
}

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (services === null) {
    throw new Error('useAppServices must be used below AppServicesProvider.');
  }
  return services;
}
