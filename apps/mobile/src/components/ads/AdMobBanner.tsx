// src/components/ads/AdMobBanner.tsx
// Production AdMob Banner Component with automatic sizing, error handling, and silent affiliate fallback

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { getBannerAdUnitId } from '../../services/ads/admob.service';
import { useAds } from '../../hooks/useAds';
import { TravelAffiliateCard } from './TravelAffiliateCard';
import {
  logAdDiagnostic,
  trackAdEvent,
  AdLifecycleState,
} from '../../services/ads/adDiagnostics';
import { AdErrorBoundary } from './AdErrorBoundary';

let BannerAdComponent: any = null;
let bannerSizes: any = { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' };
let defaultTestIds: any = { BANNER: 'ca-app-pub-3940256099942544/6300978111' };

try {
  const gma = require('react-native-google-mobile-ads');
  BannerAdComponent = gma.BannerAd;
  if (gma.BannerAdSize) bannerSizes = gma.BannerAdSize;
  if (gma.TestIds) defaultTestIds = gma.TestIds;
} catch {
  // Mobile ads not linked or available
}

interface AdMobBannerProps {
  placementId?: string;
  size?: any;
  fallbackToAffiliate?: boolean;
  style?: any;
}

function AdMobBannerInner({
  placementId = 'banner_inline',
  size = bannerSizes.ANCHORED_ADAPTIVE_BANNER,
  fallbackToAffiliate = true,
  style,
}: AdMobBannerProps) {
  const { isAdFree, userType } = useAds();
  const [lifecycleState, setLifecycleState] =
    useState<AdLifecycleState>('IDLE');
  const [hasError, setHasError] = useState(false);

  const adUnitId = getBannerAdUnitId() || defaultTestIds.BANNER;

  useEffect(() => {
    if (isAdFree) return;
    setLifecycleState('LOADING');
    logAdDiagnostic('REQUEST', {
      placement: placementId,
      userType,
      eligible: true,
      sdkReady: true,
      adUnitConfigured: !!adUnitId,
      requestStarted: true,
    });
    trackAdEvent('ad_request', {
      placement: placementId,
      format: 'banner',
    });
  }, [placementId, userType, adUnitId, isAdFree]);

  // Paid, Premium, or Ad-Free users see no ads
  // CRITICAL: Placed strictly after all React hooks to preserve exact hook ordering
  if (isAdFree) return null;

  if (hasError || !BannerAdComponent) {
    if (fallbackToAffiliate) {
      return <TravelAffiliateCard compact />;
    }
    return null;
  }

  const Banner = BannerAdComponent;

  return (
    <View
      style={[styles.container, style]}
      onStartShouldSetResponder={() => true}
    >
      <Banner
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setLifecycleState('LOADED');
          setHasError(false);
          trackAdEvent('ad_loaded', {
            placement: placementId,
            format: 'banner',
          });
        }}
        onAdFailedToLoad={(error: any) => {
          setLifecycleState('FAILED');
          setHasError(true);
          logAdDiagnostic('FAILURE', {
            placement: placementId,
            loaded: false,
            errorCode: error?.code,
            errorMessage: error?.message,
          });
          trackAdEvent('ad_failed', {
            placement: placementId,
            format: 'banner',
            errorCode: error?.code,
            errorMessage: error?.message,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    overflow: 'hidden',
  },
});

export function AdMobBanner(props: AdMobBannerProps) {
  return (
    <AdErrorBoundary placement={props.placementId || 'banner_inline'}>
      <AdMobBannerInner {...props} />
    </AdErrorBoundary>
  );
}
