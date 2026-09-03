import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { biometricAuth } from '../services/biometrics/biometricAuth';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

/** Blocks protected UI after session restoration and prolonged backgrounding. */
export function useBiometricLock(
  isAuthenticated: boolean,
  isInitialized: boolean,
) {
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLockReady, setIsLockReady] = useState(!isAuthenticated);
  const backgroundedAt = useRef<number | null>(null);
  const mounted = useRef(true);

  const lockIfConfigured = useCallback(async () => {
    if (!isAuthenticated || !biometricAuth.isEnabled()) {
      if (mounted.current) {
        setIsLocked(false);
        setIsLockReady(true);
      }
      return;
    }

    if (!(await biometricAuth.isAvailable())) {
      biometricAuth.disable();
      if (mounted.current) {
        setIsLocked(false);
        setIsLockReady(true);
      }
      return;
    }

    if (mounted.current) {
      setIsLocked(true);
      setIsChecking(false);
      setIsLockReady(true);
    }
  }, [isAuthenticated]);

  const unlock = useCallback(async () => {
    if (!biometricAuth.isEnabled()) {
      setIsLocked(false);
      return true;
    }
    setIsChecking(true);
    const success = await biometricAuth.authenticate();
    if (mounted.current) {
      setIsChecking(false);
      setIsLocked(!success);
    }
    return success;
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (isInitialized) void lockIfConfigured();
    return () => {
      mounted.current = false;
    };
  }, [isInitialized, lockIfConfigured]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'background' || nextState === 'inactive') {
          backgroundedAt.current = Date.now();
          return;
        }
        if (nextState === 'active' && backgroundedAt.current) {
          const wasAwayFor = Date.now() - backgroundedAt.current;
          backgroundedAt.current = null;
          if (wasAwayFor >= LOCK_TIMEOUT_MS) void lockIfConfigured();
        }
      },
    );
    return () => subscription.remove();
  }, [lockIfConfigured]);

  return { isLocked, isChecking, isLockReady, unlock };
}
