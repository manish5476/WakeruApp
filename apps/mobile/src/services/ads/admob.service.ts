// src/services/ads/admob.service.ts
// Production AdMob Service with promise-based initialization, non-blocking requests,
// automated fallback to test IDs, and comprehensive diagnostics.

import { Platform } from 'react-native';
import { AD_UNIT_IDS, AdPlacementId } from './adConfig';
import { adFrequencyManager } from './adFrequencyManager';
import { logAdDiagnostic, trackAdEvent } from './adDiagnostics';

export { AD_UNIT_IDS };

export const getBannerAdUnitId = (): string => {
  return Platform.select({
    ios: AD_UNIT_IDS.IOS_BANNER,
    android: AD_UNIT_IDS.ANDROID_BANNER,
    default: AD_UNIT_IDS.ANDROID_BANNER,
  });
};

export const getInterstitialAdUnitId = (): string => {
  return Platform.select({
    ios: AD_UNIT_IDS.IOS_INTERSTITIAL,
    android: AD_UNIT_IDS.ANDROID_INTERSTITIAL,
    default: AD_UNIT_IDS.ANDROID_INTERSTITIAL,
  });
};

export const getRewardedAdUnitId = (): string => {
  return Platform.select({
    ios: AD_UNIT_IDS.IOS_REWARDED,
    android: AD_UNIT_IDS.ANDROID_REWARDED,
    default: AD_UNIT_IDS.ANDROID_REWARDED,
  });
};

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;
let interstitialInstance: any = null;
let isInterstitialLoaded = false;
let isPreloading = false;

/**
 * Checks whether the AdMob SDK is initialized and ready on native platforms.
 */
export function isAdMobReady(): boolean {
  if (Platform.OS === 'web') return true;
  return isInitialized;
}

/**
 * Ensures AdMob initialization has completed before executing an ad request.
 * Resolves immediately if already initialized. Prevents race conditions.
 */
export async function ensureAdMobInitialized(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  if (isInitialized) return true;
  if (initPromise) return await initPromise;
  return await initializeAdMob();
}

/**
 * Gathers user consent via Google User Messaging Platform (UMP) on supported platforms.
 */
export async function gatherConsentIfRequired(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const {
      AdsConsent,
      AdsConsentStatus,
    } = require('react-native-google-mobile-ads');
    const consentInfo = await AdsConsent.requestInfoUpdate();

    if (
      consentInfo.status === AdsConsentStatus.REQUIRED ||
      consentInfo.status === AdsConsentStatus.UNKNOWN
    ) {
      await AdsConsent.loadAndShowConsentFormIfRequired();
      console.log('[AdMobService] Consent form handled.');
    }
  } catch (error) {
    console.warn('[AdMobService] Non-blocking consent check warning:', error);
  }
}

/**
 * Initializes the AdMob SDK safely on native platforms.
 * Single application lifecycle entry point.
 */
export async function initializeAdMob(): Promise<boolean> {
  if (Platform.OS === 'web') {
    isInitialized = true;
    return true;
  }
  if (isInitialized) return true;
  if (initPromise) return await initPromise;

  initPromise = (async () => {
    try {
      const mobileAds = require('react-native-google-mobile-ads').default;
      await mobileAds().initialize();
      isInitialized = true;
      console.log('[AdMobService] AdMob SDK initialized successfully.');

      // Asynchronously gather consent if required (non-blocking)
      gatherConsentIfRequired().catch(() => {});

      // Preload first interstitial into memory
      preloadInterstitial();
      return true;
    } catch (error) {
      console.warn('[AdMobService] Failed to initialize Google AdMob:', error);
      isInitialized = false;
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return await initPromise;
}

/**
 * Preloads an interstitial ad in the background.
 */
export function preloadInterstitial(): void {
  if (Platform.OS === 'web' || isPreloading || isInterstitialLoaded) return;

  try {
    isPreloading = true;
    const {
      InterstitialAd,
      AdEventType,
    } = require('react-native-google-mobile-ads');
    const adUnitId = getInterstitialAdUnitId();

    trackAdEvent('ad_request', {
      placement: 'interstitial_preload',
      format: 'interstitial',
    });

    interstitialInstance = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubLoaded = interstitialInstance.addAdEventListener(
      AdEventType.LOADED,
      () => {
        isInterstitialLoaded = true;
        isPreloading = false;
        console.log(
          '[AdMobService] Interstitial ad loaded and ready in memory.',
        );
        trackAdEvent('ad_loaded', {
          placement: 'interstitial_preload',
          format: 'interstitial',
        });
      },
    );

    const unsubClosed = interstitialInstance.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        isInterstitialLoaded = false;
        isPreloading = false;
        try {
          unsubLoaded?.();
          unsubClosed?.();
        } catch (_) {}
        console.log('[AdMobService] Interstitial closed by user.');
        trackAdEvent('ad_closed', {
          placement: 'interstitial_preload',
          format: 'interstitial',
        });
        // Preload next one after a short delay
        setTimeout(() => preloadInterstitial(), 3000);
      },
    );

    const unsubError = interstitialInstance.addAdEventListener(
      AdEventType.ERROR,
      (error: any) => {
        isInterstitialLoaded = false;
        isPreloading = false;
        try {
          unsubLoaded?.();
          unsubClosed?.();
          unsubError?.();
        } catch (_) {}
        console.warn('[AdMobService] Interstitial ad failed to load:', error);

        trackAdEvent('ad_failed', {
          placement: 'interstitial_preload',
          format: 'interstitial',
          errorCode: error?.code,
          errorMessage: error?.message,
        });

        // If production ad unit failed or returned no fill, attempt test ID fallback
        const testId = 'ca-app-pub-3940256099942544/1033173712';
        if (adUnitId !== testId) {
          console.log(
            '[AdMobService] Attempting fallback test interstitial...',
          );
          try {
            interstitialInstance = InterstitialAd.createForAdRequest(testId, {
              requestNonPersonalizedAdsOnly: true,
            });
            interstitialInstance.addAdEventListener(AdEventType.LOADED, () => {
              isInterstitialLoaded = true;
              console.log('[AdMobService] Fallback test interstitial loaded.');
            });
            interstitialInstance.load();
          } catch (_) {}
        }
      },
    );

    interstitialInstance.load();
  } catch (error) {
    isPreloading = false;
    console.warn('[AdMobService] Failed to preload interstitial:', error);
  }
}

/**
 * Shows an interstitial ad with frequency management, lifecycle diagnostics, and session capping.
 * Returns true if an ad was displayed, false if skipped or not available.
 * Non-blocking: will never hang the calling screen.
 */
export async function showInterstitialIfAllowed(
  isAdFree: boolean = false,
  placementId: AdPlacementId = 'analytics',
  force: boolean = false,
): Promise<boolean> {
  if (isAdFree || Platform.OS === 'web') return false;

  // 1. Ensure SDK is initialized (handles race conditions on cold navigation)
  await ensureAdMobInitialized();

  // 2. Check eligibility with frequency manager
  if (!force) {
    const eligibility = adFrequencyManager.canShowInterstitial(
      placementId,
      isAdFree,
    );
    if (!eligibility.allowed) {
      logAdDiagnostic('BLOCKED', {
        placement: placementId,
        userType: 'free',
        eligible: false,
        errorCode: eligibility.reason,
      });
      return false;
    }
  }

  // Diagnostic: Log valid ad request attempt
  logAdDiagnostic('REQUEST', {
    placement: placementId,
    userType: 'free',
    eligible: true,
    sdkReady: isInitialized,
    adUnitConfigured: true,
    requestStarted: true,
  });

  // Lock placement in flight
  adFrequencyManager.setInFlight(placementId, true);

  // 3. If already loaded in memory, show immediately
  if (interstitialInstance && isInterstitialLoaded) {
    try {
      console.log(
        `[AdMobService] Showing loaded interstitial ad for placement "${placementId}".`,
      );
      await interstitialInstance.show();
      adFrequencyManager.recordInterstitialShown(placementId);
      trackAdEvent('ad_impression', {
        placement: placementId,
        format: 'interstitial',
        result: 'success',
      });
      return true;
    } catch (e: any) {
      adFrequencyManager.setInFlight(placementId, false);
      console.warn('[AdMobService] Failed to display interstitial:', e);
      logAdDiagnostic('FAILURE', {
        placement: placementId,
        loaded: false,
        errorCode: e?.code || 'SHOW_FAILED',
        errorMessage: e?.message || String(e),
      });
      return false;
    }
  }

  // 4. If load is currently in-flight, wait briefly (up to 2.5s) before giving up
  if (interstitialInstance && !isInterstitialLoaded) {
    console.log(
      `[AdMobService] Interstitial not ready yet for "${placementId}", awaiting in-flight load...`,
    );

    const isReady = await new Promise<boolean>(resolve => {
      let resolved = false;
      try {
        const { AdEventType } = require('react-native-google-mobile-ads');
        const unsubLoaded = interstitialInstance.addAdEventListener(
          AdEventType.LOADED,
          () => {
            if (!resolved) {
              resolved = true;
              resolve(true);
            }
          },
        );
        const unsubError = interstitialInstance.addAdEventListener(
          AdEventType.ERROR,
          () => {
            if (!resolved) {
              resolved = true;
              resolve(false);
            }
          },
        );

        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            try {
              unsubLoaded?.();
              unsubError?.();
            } catch (_) {}
            resolve(false);
          }
        }, 2500);
      } catch (_) {
        resolve(false);
      }
    });

    if (isReady && isInterstitialLoaded) {
      try {
        console.log(
          `[AdMobService] Showing interstitial after in-flight load completed for "${placementId}".`,
        );
        await interstitialInstance.show();
        adFrequencyManager.recordInterstitialShown(placementId);
        trackAdEvent('ad_impression', {
          placement: placementId,
          format: 'interstitial',
          result: 'success',
        });
        return true;
      } catch (e: any) {
        adFrequencyManager.setInFlight(placementId, false);
        console.warn(
          '[AdMobService] Failed to display interstitial after waiting:',
          e,
        );
        logAdDiagnostic('FAILURE', {
          placement: placementId,
          loaded: false,
          errorCode: e?.code || 'SHOW_AFTER_WAIT_FAILED',
          errorMessage: e?.message || String(e),
        });
        return false;
      }
    }
  }

  // Fallback: Ad not ready, unlock in-flight and trigger background preload for next opportunity
  adFrequencyManager.setInFlight(placementId, false);
  console.log(
    `[AdMobService] Interstitial not available for "${placementId}". Preloading for next opportunity.`,
  );
  preloadInterstitial();
  return false;
}

/**
 * Loads and shows a Rewarded Video Ad on native platforms.
 */
export async function showRewardedAd(
  onEarnedReward?: () => void,
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  await ensureAdMobInitialized();

  try {
    const {
      RewardedAd,
      RewardedAdEventType,
    } = require('react-native-google-mobile-ads');
    const adUnitId = getRewardedAdUnitId();

    return await new Promise<boolean>(resolve => {
      let rewarded = false;
      const rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubLoaded = rewardedAd.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          rewardedAd.show().catch((err: any) => {
            console.warn('[AdMobService] Error displaying rewarded ad:', err);
            resolve(false);
          });
        },
      );

      const unsubEarned = rewardedAd.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          rewarded = true;
          try {
            onEarnedReward?.();
          } catch (_) {}
        },
      );

      const unsubClosed = rewardedAd.addAdEventListener(
        RewardedAdEventType.CLOSED,
        () => {
          try {
            unsubLoaded();
            unsubEarned();
            unsubClosed();
          } catch (_) {}
          resolve(rewarded);
        },
      );

      const unsubError = rewardedAd.addAdEventListener(
        RewardedAdEventType.ERROR,
        (err: any) => {
          console.warn('[AdMobService] Rewarded ad failed to load:', err);
          try {
            unsubLoaded();
            unsubEarned();
            unsubClosed();
            unsubError();
          } catch (_) {}
          resolve(false);
        },
      );

      rewardedAd.load();
    });
  } catch (err) {
    console.warn('[AdMobService] Failed to initialize rewarded ad:', err);
    return false;
  }
}
