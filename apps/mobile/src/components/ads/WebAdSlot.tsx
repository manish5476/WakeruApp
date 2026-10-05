// src/components/ads/WebAdSlot.tsx
// Smart Hybrid Ad Component for Web & Native
// Attempts Google AdSense on web with automatic silent fallback to TravelAffiliateCard if blocked or empty.

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useAds } from '../../hooks/useAds';
import { loadAdSenseScript } from '../../services/ads/adsense.service';
import { AFFILIATE_CONFIG } from '../../config/affiliates.config';
import { TravelAffiliateCard, TravelDealType } from './TravelAffiliateCard';
import { SponsoredTripCard } from './SponsoredTripCard';
import { AdErrorBoundary } from './AdErrorBoundary';

interface WebAdSlotProps {
  destination?: string;
  type?: TravelDealType;
  height?: number;
}

function WebAdSlotInner({
  destination,
  type = 'hotel',
  height = 200,
}: WebAdSlotProps) {
  const { isAdFree } = useAds();
  const [adSenseError, setAdSenseError] = useState(false);

  useEffect(() => {
    if (isAdFree) return;
    if (Platform.OS === 'web') {
      loadAdSenseScript();
      try {
        // Trigger AdSense render if script is available
        const win = window as any;
        if (win && win.adsbygoogle) {
          win.adsbygoogle.push({});
        }
      } catch (e) {
        // AdSense failed or blocked -> trigger affiliate fallback
        setAdSenseError(true);
      }
    }
  }, [isAdFree]);

  // If user is paid / premium, render nothing
  // CRITICAL: Placed strictly after all React hooks
  if (isAdFree) return null;

  // On Native devices (Android / iOS), render the native sponsored travel card
  if (Platform.OS !== 'web') {
    return <TravelAffiliateCard destination={destination} type={type} />;
  }

  // On Web: If AdSense is errored, blocked, or in development mode, show the high-converting affiliate card
  if (
    adSenseError ||
    !AFFILIATE_CONFIG.ADSENSE.publisherId.startsWith('ca-pub-') ||
    AFFILIATE_CONFIG.ADSENSE.publisherId.includes('3940256099942544')
  ) {
    return <TravelAffiliateCard destination={destination} type={type} />;
  }

  // AdSense Container for Web
  return (
    <View style={[styles.adContainer, { minHeight: height }]}>
      {/* Google AdSense Responsive Unit */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' } as any}
        data-ad-client={AFFILIATE_CONFIG.ADSENSE.publisherId}
        data-ad-slot={AFFILIATE_CONFIG.ADSENSE.feedSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </View>
  );
}

export function WebAdSlot(props: WebAdSlotProps) {
  return (
    <AdErrorBoundary placement={`web_ad_slot_${props.type || 'hotel'}`}>
      <WebAdSlotInner {...props} />
    </AdErrorBoundary>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
});
