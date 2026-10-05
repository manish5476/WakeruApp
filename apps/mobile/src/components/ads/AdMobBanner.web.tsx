// src/components/ads/AdMobBanner.web.tsx
// Web platform fallback — avoids native AdMob imports, falls back to travel affiliate card

import React from 'react';
import { View } from 'react-native';
import { useAds } from '../../hooks/useAds';
import { TravelAffiliateCard } from './TravelAffiliateCard';

interface AdMobBannerProps {
  size?: any;
  fallbackToAffiliate?: boolean;
  style?: any;
}

export function AdMobBanner({
  fallbackToAffiliate = true,
  style,
}: AdMobBannerProps) {
  const { isAdFree } = useAds();

  if (isAdFree) return null;

  if (fallbackToAffiliate) {
    return (
      <View style={style}>
        <TravelAffiliateCard compact />
      </View>
    );
  }

  return null;
}
