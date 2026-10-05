// src/services/ads/travelpayouts.service.ts
import { Platform } from 'react-native';
import { AFFILIATE_CONFIG } from '../../config/affiliates.config';

let isScriptLoaded = false;

/**
 * Loads the Travelpayouts script dynamically on Expo Web for automated attribution.
 * Note: Only loads in production on non-localhost domains to prevent Travelpayouts
 * from throwing "config is not valid" (HTTP 204 No Content for unregistered domains).
 */
export function loadTravelpayoutsScript(): void {
  if (
    Platform.OS !== 'web' ||
    typeof document === 'undefined' ||
    isScriptLoaded
  )
    return;

  // Never load on localhost, development, or private networks to avoid Travelpayouts "config is not valid" error
  if (
    __DEV__ ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.local') ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.startsWith('172.')))
  ) {
    return;
  }

  // Allow explicitly disabling affiliate tracking script via environment variable
  if (process.env.EXPO_PUBLIC_DISABLE_AFFILIATE_SCRIPTS === 'true') {
    return;
  }

  if (!AFFILIATE_CONFIG.TRAVELPAYOUTS_SCRIPT_URL) {
    return;
  }

  const scriptId = 'tp-em-script';
  if (document.getElementById(scriptId)) {
    isScriptLoaded = true;
    return;
  }

  try {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.setAttribute('data-cmp-ab', '2');
    script.src = AFFILIATE_CONFIG.TRAVELPAYOUTS_SCRIPT_URL;
    document.head.appendChild(script);
    isScriptLoaded = true;
  } catch (error) {
    console.warn('[Travelpayouts] Failed to load tracking script:', error);
  }
}
