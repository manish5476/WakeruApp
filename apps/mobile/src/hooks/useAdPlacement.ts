// src/hooks/useAdPlacement.ts
// Screen-level Ad Placement Lifecycle Hook for TripSplit / Wakeru

import { useEffect, useRef, useCallback } from 'react';
import { useAds } from './useAds';
import { showInterstitialIfAllowed } from '../services/ads/admob.service';
import type { AdPlacementId } from '../services/ads/adConfig';

interface UseAdPlacementOptions {
  autoTriggerOnMount?: boolean;
  delayMs?: number;
}

/**
 * Hook to manage screen-level ad placement lifecycle.
 * Ensures an ad is triggered safely after the screen has cleanly rendered,
 * with strict single-execution-per-visit guarantees, frequency management, and non-blocking operation.
 */
export function useAdPlacement(
  placementId: AdPlacementId,
  options: UseAdPlacementOptions = {},
) {
  const { autoTriggerOnMount = true, delayMs = 600 } = options;
  const { isAdFree, userType } = useAds();
  const hasTriggeredRef = useRef(false);

  const trigger = useCallback(
    async (force: boolean = false): Promise<boolean> => {
      if (isAdFree) return false;
      return await showInterstitialIfAllowed(isAdFree, placementId, force);
    },
    [isAdFree, placementId],
  );

  useEffect(() => {
    // Only attempt trigger for eligible free users
    if (!autoTriggerOnMount || isAdFree || hasTriggeredRef.current) {
      return;
    }

    hasTriggeredRef.current = true;
    const timer = setTimeout(() => {
      trigger().catch(err => {
        console.warn(
          `[useAdPlacement] Non-blocking trigger error for ${placementId}:`,
          err,
        );
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [autoTriggerOnMount, isAdFree, delayMs, trigger, placementId]);

  return {
    trigger,
    isAdFree,
    userType,
  };
}
