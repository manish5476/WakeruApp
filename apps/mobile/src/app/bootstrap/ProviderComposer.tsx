import React, { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@tripsplit/design-system';
import { useThemeStore } from '../../state/theme.store';
import { FeatureFlagProvider } from '../../core/feature-flags';
import { DIContainer } from '../../core/di';
import { NavigationRoot } from './NavigationRoot';
import { AppServicesProvider } from './AppServices';

export function ProviderComposer() {
  const mode = useThemeStore(s => s.mode) || 'system';
  const preset = useThemeStore(s => s.preset);
  const fontColor = useThemeStore(s => s.fontColor);
  const fontPreset = useThemeStore(s => s.fontPreset);

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
      <ThemeProvider
        mode={mode as any}
        preset={preset || undefined}
        fontColor={fontColor || undefined}
        fontPreset={fontPreset}
      >
        <QueryClientProvider client={queryClient}>
          <AppServicesProvider>
            <FeatureFlagProvider
              service={DIContainer.resolve('FeatureFlagService')}
            >
              <NavigationRoot />
            </FeatureFlagProvider>
          </AppServicesProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
