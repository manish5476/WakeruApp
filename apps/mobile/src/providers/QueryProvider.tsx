import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

// ============================================================
// Query Client Configuration
// ============================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // 0 minutes — always consider data stale to disable offline cache
      gcTime: 1000 * 60 * 30, // 30 minutes — garbage collection
      retry: (failureCount, error: any) => {
        const status = error?.statusCode || error?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        console.error('Mutation error:', error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'An unexpected error occurred';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: message,
        });
      },
    },
  },
});

// ============================================================
// App State Handler — Refetch on foreground
// ============================================================

AppState.addEventListener('change', (state: AppStateStatus) => {
  if (state === 'active' && Platform.OS !== 'web') {
    // Refetch active queries when app comes to foreground on mobile
    queryClient.refetchQueries({
      predicate: query => query.state.data !== undefined,
    });
  }
});

// ============================================================
// Provider Component
// ============================================================

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export { queryClient };
