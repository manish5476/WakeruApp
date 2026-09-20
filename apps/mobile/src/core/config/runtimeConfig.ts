import { NativeModules } from 'react-native';
import { config } from './index';

type NativeRuntimeConfig = Readonly<{ apiBaseUrl?: string }>;

export type RuntimeConfig = Readonly<{ apiBaseUrl: string }>;

export function createRuntimeConfig(): RuntimeConfig {
  const nativeConfig = NativeModules.TripSplitConfiguration as
    NativeRuntimeConfig | undefined;
  const apiBaseUrl =
    nativeConfig?.apiBaseUrl ||
    config.API_URL ||
    'https://wakeru.onrender.com/api/v1';

  return { apiBaseUrl };
}
