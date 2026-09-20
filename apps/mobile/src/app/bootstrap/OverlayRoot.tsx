import React from 'react';
import { AppErrorBoundary } from '../../core/errors/AppErrorBoundary';
import { AuthSessionProvider } from '@/features/authentication/presentation/hooks/AuthSessionProvider';
import { RootNavigator } from '@/navigation';
import Toast from 'react-native-toast-message';

export function OverlayRoot() {
  return (
    <AppErrorBoundary>
      <AuthSessionProvider>
        <RootNavigator />
      </AuthSessionProvider>
      <Toast />
    </AppErrorBoundary>
  );
}
