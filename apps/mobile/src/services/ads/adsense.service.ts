// src/services/ads/adsense.service.ts
// Handles Google AdSense script loading specifically for Expo Web

import { Platform } from 'react-native';
import { AFFILIATE_CONFIG } from '../../config/affiliates.config';

let isScriptLoaded = false;

/**
 * Injects Google AdSense script tag into the document head on Web.
 * Automatically no-ops on native platforms (iOS / Android).
 */
export function loadAdSenseScript(): void {
  if (
    Platform.OS !== 'web' ||
    typeof document === 'undefined' ||
    isScriptLoaded
  ) {
    return;
  }

  const publisherId = AFFILIATE_CONFIG.ADSENSE.publisherId;
  const scriptId = 'google-adsense-script';

  if (!document.getElementById(scriptId)) {
    try {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        isScriptLoaded = true;
      };
      script.onerror = () => {
        console.warn(
          '[AdSenseService] AdSense script failed to load (possibly blocked by ad-blocker).',
        );
      };
      document.head.appendChild(script);
    } catch (e) {
      console.warn('[AdSenseService] Error appending script:', e);
    }
  }
}
