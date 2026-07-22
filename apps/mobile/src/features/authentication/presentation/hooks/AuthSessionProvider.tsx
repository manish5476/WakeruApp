import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { AuthSession } from '@tripsplit/domain';
import { useAppServices } from '@/app/bootstrap/AppServices';
import { SignOutUseCase } from '../../application/SignOutUseCase';

type AuthState = Readonly<{
  isHydrated: boolean;
  session: AuthSession | null;
  signOut(): Promise<void>;
}>;

const AuthSessionContext = createContext<AuthState | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const { authRepository, sessionRepository } = useAppServices();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    const hydrateSession = async () => {
      try {
        const storedSession = await sessionRepository.read();
        if (mounted) setSession(storedSession);
      } finally {
        if (mounted) setHydrated(true);
      }
    };
    hydrateSession().catch(() => {
      if (mounted) setSession(null);
    });
    return () => {
      mounted = false;
    };
  }, [sessionRepository]);

  const value = useMemo<AuthState>(
    () => ({
      isHydrated,
      session,
      async signOut() {
        await new SignOutUseCase(authRepository, sessionRepository).execute();
        setSession(null);
      },
    }),
    [authRepository, isHydrated, session, sessionRepository],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthState {
  const state = useContext(AuthSessionContext);
  if (state === null)
    throw new Error('useAuthSession must be used below AuthSessionProvider.');
  return state;
}
