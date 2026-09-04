import React, { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@tripsplit/design-system';
import { FeatureFlagProvider } from '../../core/feature-flags';
import { DIContainer } from '../../core/di';
import { NavigationRoot } from './NavigationRoot';

export function ProviderComposer() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),
          },
          mutations: { retry: 0 },
        },
      }),
    [],
  );

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <FeatureFlagProvider
            service={DIContainer.resolve('FeatureFlagService')}
          >
            <NavigationRoot />
          </FeatureFlagProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
