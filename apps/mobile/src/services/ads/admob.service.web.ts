// src/services/ads/admob.service.web.ts
// Web fallback for AdMob service — zero native imports, safe for SSR and static export

import type { AdPlacementId } from './adConfig';

export const AD_UNIT_IDS = {
  ANDROID_BANNER: '',
  ANDROID_INTERSTITIAL: '',
  ANDROID_REWARDED: '',
  IOS_BANNER: '',
  IOS_INTERSTITIAL: '',
  IOS_REWARDED: '',
};

export const getBannerAdUnitId = (): string => '';

export const getInterstitialAdUnitId = (): string => '';

export const getRewardedAdUnitId = (): string => '';

export const isAdMobReady = (): boolean => true;

export async function ensureAdMobInitialized(): Promise<boolean> {
  return true;
}

export async function gatherConsentIfRequired(): Promise<void> {
  // Safe no-op on web
}

export async function initializeAdMob(): Promise<void> {
  // Safe no-op on web
}

export function preloadInterstitial(): void {
  // Safe no-op on web
}

export async function showInterstitialIfAllowed(
  _isAdFree: boolean = false,
  _placementId: AdPlacementId = 'analytics',
  _force: boolean = false,
): Promise<boolean> {
  return false;
}

export async function showRewardedAd(
  _onEarnedReward?: () => void,
): Promise<boolean> {
  return false;
}
