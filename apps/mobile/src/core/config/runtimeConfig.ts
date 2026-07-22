import { NativeModules } from 'react-native';

type NativeRuntimeConfig = Readonly<{ apiBaseUrl?: string }>;

export type RuntimeConfig = Readonly<{ apiBaseUrl: string }>;

export function createRuntimeConfig(): RuntimeConfig {
  const nativeConfig = NativeModules.TripSplitConfiguration as
    NativeRuntimeConfig | undefined;
  const apiBaseUrl =
    nativeConfig?.apiBaseUrl ?? (__DEV__ ? 'http://10.0.2.2:3000' : undefined);

  if (apiBaseUrl === undefined) {
    throw new Error(
      'TripSplitConfiguration.apiBaseUrl must be injected into release builds.',
    );
  }

  return { apiBaseUrl };
}
