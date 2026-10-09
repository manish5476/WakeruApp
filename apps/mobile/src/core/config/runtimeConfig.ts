import { NativeModules } from 'react-native';
import { config } from './index';

type NativeRuntimeConfig = Readonly<{ apiBaseUrl?: string }>;

export type RuntimeConfig = Readonly<{ apiBaseUrl: string }>;

const FALLBACK_API_URL = 'https://wakeru.onrender.com/api/v1';

export function createRuntimeConfig(): RuntimeConfig {
  try {
    const nativeConfig = NativeModules.TripSplitConfiguration as
      NativeRuntimeConfig | undefined;

    const apiBaseUrl =
      nativeConfig?.apiBaseUrl || config.API_URL || FALLBACK_API_URL;

    return { apiBaseUrl };
  } catch {
    // Native module not available — use env / hardcoded fallback.
    return { apiBaseUrl: config.API_URL || FALLBACK_API_URL };
  }
}
