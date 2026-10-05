// src/services/ads/adEligibilityService.ts
// Central Ad Eligibility Service for TripSplit / Wakeru
// Provides deterministic, verifiable ad eligibility decisions with diagnostic reasons.

import { Platform } from 'react-native';
import { ADS_CONFIG, AdPlacementId } from './adConfig';
import { adFrequencyManager } from './adFrequencyManager';
import { isAdMobReady } from './admob.service';

export type AdBlockReason =
  | 'NO_USER'
  | 'PREMIUM_USER'
  | 'AD_DISABLED'
  | 'PLATFORM_UNSUPPORTED'
  | 'MISSING_AD_UNIT'
  | 'SDK_NOT_READY'
  | 'COOLDOWN'
  | 'NOT_LOADED'
  | 'CONSENT_REQUIRED'
  | 'DISMISSED';

export type UserType = 'free' | 'paid' | 'anonymous';

export interface AdEligibilityOptions {
  user?: any;
  entitlements?: any;
  placement: AdPlacementId;
  platform?: string;
  isDismissed?: boolean;
  ignoreCooldown?: boolean;
}

export interface AdEligibilityResult {
  eligible: boolean;
  userType: UserType;
  reason?: AdBlockReason;
  details?: string;
}

/**
 * Pure evaluation function to determine user paid vs free status.
 *
 * CRITICAL RULE FOR HYDRATION:
 * If a user is logged in or hydration is in progress, they MUST be treated as 'free'
 * until explicit paid proof is established. An undefined entitlements object NEVER means ad-free.
 */
export function resolveUserType(user: any, entitlements: any): UserType {
  if (!user && !entitlements) {
    return 'anonymous';
  }

  // 1. Explicit paid roles on user record
  if (user?.role === 'premium' || user?.role === 'business') {
    return 'paid';
  }

  // 2. Explicit paid status or paid plan on subscription entitlements
  if (
    entitlements?.isPaid === true ||
    entitlements?.plan?.key === 'pro' ||
    entitlements?.plan?.key === 'premium' ||
    entitlements?.features?.['no_ads'] === true
  ) {
    return 'paid';
  }

  // Default: Genuine Free User
  return 'free';
}

/**
 * Centralized Ad Eligibility evaluation function.
 * Evaluates whether an advertisement can be displayed for a given user, placement, and runtime state.
 */
export function canShowAd({
  user,
  entitlements,
  placement,
  platform = Platform.OS,
  isDismissed = false,
  ignoreCooldown = false,
}: AdEligibilityOptions): AdEligibilityResult {
  // 1. Global killswitch
  if (!ADS_CONFIG.enabled) {
    return {
      eligible: false,
      userType: 'free',
      reason: 'AD_DISABLED',
      details: 'Global ads configuration is disabled in ADS_CONFIG',
    };
  }

  // 2. Resolve user type
  const userType = resolveUserType(user, entitlements);
  if (userType === 'paid') {
    return {
      eligible: false,
      userType: 'paid',
      reason: 'PREMIUM_USER',
      details: 'User has an active premium role or paid subscription plan',
    };
  }

  // 3. User dismissal check (e.g. cooldown on affiliate cards)
  if (isDismissed) {
    return {
      eligible: false,
      userType,
      reason: 'DISMISSED',
      details: 'User recently dismissed this advertisement (in cooldown)',
    };
  }

  // 4. Placement configuration check
  const placementConfig = ADS_CONFIG.placements[placement];
  if (!placementConfig || !placementConfig.enabled) {
    return {
      eligible: false,
      userType,
      reason: 'AD_DISABLED',
      details: `Placement "${placement}" is not configured or disabled in ADS_CONFIG`,
    };
  }

  // 5. Platform support check
  const format = placementConfig.format;
  if (platform === 'web') {
    // Interstitials & Native AdMob banners are mobile only; contextual travel & AdSense are supported on web
    if (format === 'interstitial' || format === 'rewarded') {
      return {
        eligible: false,
        userType,
        reason: 'PLATFORM_UNSUPPORTED',
        details: `Format "${format}" is not supported on web platform`,
      };
    }
  }

  // 6. Frequency & Cooldown check (for interstitials)
  if (!ignoreCooldown && format === 'interstitial') {
    const freqCheck = adFrequencyManager.canShowInterstitial(placement, false);
    if (!freqCheck.allowed) {
      return {
        eligible: false,
        userType,
        reason: 'COOLDOWN',
        details: freqCheck.reason || 'Placement or global cooldown is active',
      };
    }
  }

  // 7. SDK readiness check (on native mobile for native ad formats)
  if (
    platform !== 'web' &&
    (format === 'interstitial' || format === 'rewarded')
  ) {
    if (!isAdMobReady()) {
      return {
        eligible: false,
        userType,
        reason: 'SDK_NOT_READY',
        details: 'Google Mobile Ads SDK has not completed initialization yet',
      };
    }
  }

  // User is free and all checks passed
  return {
    eligible: true,
    userType,
  };
}
