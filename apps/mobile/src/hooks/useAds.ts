// src/hooks/useAds.ts
import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { useEntitlements } from './useEntitlements';
import {
  showInterstitialIfAllowed,
  showRewardedAd,
} from '../services/ads/admob.service';
import {
  canShowAd,
  resolveUserType,
  AdEligibilityResult,
  UserType,
} from '../services/ads/adEligibilityService';
import type { AdPlacementId } from '../services/ads/adConfig';

/**
 * Pure evaluation function for whether an ad should be displayed to a given user/entitlements state.
 * Guaranteed: An ordinary/free user evaluates to true.
 */
export function shouldShowAds(user: any, entitlements: any): boolean {
  const userType = resolveUserType(user, entitlements);
  return userType !== 'paid';
}

export function useAds() {
  const user = useAuthStore(s => s.user);
  const { entitlements } = useEntitlements();

  const userType: UserType = useMemo(() => {
    return resolveUserType(user, entitlements);
  }, [user, entitlements]);

  const showAds = userType !== 'paid';
  const isAdFree = !showAds;

  /**
   * Checks placement eligibility using the centralized Ad Eligibility Service.
   */
  const checkPlacementEligibility = useCallback(
    (placementId: AdPlacementId): AdEligibilityResult => {
      return canShowAd({
        user,
        entitlements,
        placement: placementId,
      });
    },
    [user, entitlements],
  );

  /**
   * Triggers an ad for a specific placement with full frequency management and lifecycle diagnostics.
   */
  const triggerPlacement = useCallback(
    async (
      placementId: AdPlacementId,
      force: boolean = false,
    ): Promise<boolean> => {
      if (isAdFree) return false;
      return await showInterstitialIfAllowed(isAdFree, placementId, force);
    },
    [isAdFree],
  );

  /**
   * Action trigger: called after a free user creates a trip.
   */
  const triggerTripCreatedInterstitial = useCallback(async () => {
    return await triggerPlacement('post_trip_create');
  }, [triggerPlacement]);

  return {
    isAdFree,
    showAds,
    userType,
    checkPlacementEligibility,
    triggerPlacement,
    triggerTripCreatedInterstitial,
    showRewardedAd,
  };
}
