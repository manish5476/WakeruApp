// src/components/ads/TravelAffiliateCard.tsx
// Contextual Travel Deal Card (Booking.com, Skyscanner, Forex, Tours)
// Features destination-aware deep links, clean typography, and Ad-Free bypass

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { useAds } from '../../hooks/useAds';
import { showToast } from '../../utils/toast';
import { storage } from '../../utils/storage';
import {
  logAdDiagnostic,
  trackAdEvent,
} from '../../services/ads/adDiagnostics';
import {
  getHotelDealUrl,
  getFlightDealUrl,
  getForexCardDealUrl,
  getActivityDealUrl,
} from '../../utils/affiliateLinks';
import { AdErrorBoundary } from './AdErrorBoundary';

export type TravelDealType = 'hotel' | 'flight' | 'forex' | 'activity';

interface TravelAffiliateCardProps {
  destination?: string;
  type?: TravelDealType;
  customTitle?: string;
  customSubtitle?: string;
  compact?: boolean;
}

const DEAL_ASSETS: Record<
  TravelDealType,
  {
    image: string;
    icon: string;
    badge: string;
    defaultTitle: (dest?: string) => string;
    defaultSubtitle: string;
    cta: string;
    getUrl: (dest?: string) => string;
  }
> = {
  hotel: {
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', // Luxury hotel pool
    icon: 'hotel',
    badge: 'Stays & Hotels',
    defaultTitle: dest =>
      dest ? `Top Stays in ${dest}` : 'Compare Stays & Resorts',
    defaultSubtitle: 'Save up to 25% with free cancellation via Booking.com',
    cta: 'Find Stays →',
    getUrl: dest => getHotelDealUrl(dest),
  },
  flight: {
    image:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80', // Airplane wing in clouds
    icon: 'plane',
    badge: 'Flight Deals',
    defaultTitle: dest =>
      dest ? `Cheap Flights to ${dest}` : 'Compare Global Flights',
    defaultSubtitle: 'Search 1,000+ airlines for the best group fares',
    cta: 'Compare Fares →',
    getUrl: dest => getFlightDealUrl(dest),
  },
  forex: {
    image:
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80', // Credit cards / travel money
    icon: 'credit-card',
    badge: '0% Forex Markup',
    defaultTitle: () => 'Zero-Fee Forex Travel Card',
    defaultSubtitle:
      'Save 3.5% on international currency exchange on this trip',
    cta: 'Get Card →',
    getUrl: () => getForexCardDealUrl(),
  },
  activity: {
    image:
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80', // Adventure / sightseeing
    icon: 'compass',
    badge: 'Tours & Experiences',
    defaultTitle: dest =>
      dest ? `Must-Do Activities in ${dest}` : 'Book Local Tours & Day Trips',
    defaultSubtitle: 'Skip the ticket lines with top-rated guided tours',
    cta: 'Explore Tours →',
    getUrl: dest => getActivityDealUrl(dest),
  },
};

function TravelAffiliateCardInner({
  destination,
  type = 'hotel',
  customTitle,
  customSubtitle,
  compact = false,
}: TravelAffiliateCardProps) {
  const theme = useTheme();
  const { isAdFree } = useAds();
  const DISMISS_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours cooldown
  const dismissKey = `@ad_dismissed_${type}_${destination || 'general'}`;
  const [dismissed, setDismissed] = useState(() => {
    // Clear legacy permanent boolean lock if present
    if (storage.getBoolean(dismissKey)) {
      storage.delete(dismissKey);
      return false;
    }
    const dismissedAt = storage.getNumber(dismissKey);
    if (!dismissedAt) return false;
    return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  });

  const config = DEAL_ASSETS[type] || DEAL_ASSETS.hotel;
  const [imgUri, setImgUri] = useState(config.image);

  // Synchronize image if deal type changes
  React.useEffect(() => {
    setImgUri(config.image);
  }, [config.image]);

  const title = customTitle || config.defaultTitle(destination);
  const subtitle = customSubtitle || config.defaultSubtitle;
  const url = config.getUrl(destination);

  React.useEffect(() => {
    if (isAdFree || dismissed) return;
    logAdDiagnostic('REQUEST', {
      placement: `travel_affiliate_${type}`,
      userType: 'free',
      eligible: true,
      sdkReady: true,
      adUnitConfigured: true,
      requestStarted: true,
    });
    trackAdEvent('ad_impression', {
      placement: `travel_affiliate_${type}`,
      format: 'contextual_travel',
    });
  }, [type, isAdFree, dismissed]);

  // If user is paid or dismissed, don't show affiliate promos
  // CRITICAL: Placed strictly after all React hooks to preserve exact hook ordering on re-renders
  if (isAdFree || dismissed) return null;

  const handlePress = async () => {
    trackAdEvent('ad_clicked', {
      placement: `travel_affiliate_${type}`,
      format: 'contextual_travel',
    });
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn('[TravelAffiliateCard] URL not supported:', url);
        showToast.info('Partner offer link is currently unavailable');
      }
    } catch (err) {
      console.warn('[TravelAffiliateCard] Failed to open URL safely:', err);
      showToast.info('Could not open partner link');
    }
  };

  const handleDismiss = (e?: any) => {
    try {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      setDismissed(true);
      storage.setNumber(dismissKey, Date.now());
      trackAdEvent('ad_dismissed', {
        placement: `travel_affiliate_${type}`,
        format: 'contextual_travel',
      });
    } catch (err) {
      console.warn('[TravelAffiliateCard] Dismiss error:', err);
      setDismissed(true);
    }
  };

  if (compact) {
    return (
      <GlassCard variant="soft" padding="sm" style={styles.compactCard}>
        <View style={styles.compactRow}>
          <Pressable
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={title}
          >
            <View
              style={[
                styles.compactIconWrap,
                { backgroundColor: `${theme.colors.primary}18` },
              ]}
            >
              <AppIcon
                name={config.icon as any}
                size={18}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.compactInfo}>
              <Text
                style={[
                  styles.compactTitle,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Text
                style={[
                  styles.compactSub,
                  { color: theme.colors.textTertiary },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </View>
            <View style={styles.compactCta}>
              <Text
                style={[styles.compactCtaText, { color: theme.colors.primary }]}
              >
                {config.cta}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            style={{ marginLeft: 8, padding: 4 }}
            accessibilityLabel="Dismiss recommendation"
          >
            <AppIcon name="x" size={13} color={theme.colors.textTertiary} />
          </Pressable>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="medium" padding="none" style={styles.card}>
      <View style={styles.imageWrap}>
        {/* Background Image & Gradient (Clickable surface) */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={title}
        >
          <Image
            source={{ uri: imgUri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImgUri(DEAL_ASSETS.hotel.image)}
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)']}
            locations={[0.2, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Pressable>

        {/* Badges & Non-Intrusive Dismiss (Independent overlay, outside Pressable) */}
        <View style={styles.badgeRow} pointerEvents="box-none">
          <View style={styles.badgeGroup}>
            <View style={styles.partnerBadge}>
              <AppIcon name={config.icon as any} size={11} color="#FDE68A" />
              <Text style={styles.partnerText}>{config.badge}</Text>
            </View>
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredText}>TRAVEL PARTNER</Text>
            </View>
          </View>
          <Pressable
            onPress={handleDismiss}
            hitSlop={14}
            style={styles.closeBtn}
            accessibilityLabel="Dismiss recommendation"
          >
            <AppIcon name="x" size={12} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Overlay Content (Clickable CTA & Info) */}
        <Pressable
          style={styles.contentOverlay}
          onPress={handlePress}
          accessibilityRole="button"
        >
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.ctaPill}>
              <Text style={styles.ctaText}>{config.cta}</Text>
            </View>
            <Text style={styles.adDisclosure}>Partner Offer</Text>
          </View>
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 4,
  },
  imageWrap: {
    height: 190,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  partnerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FDE68A',
  },
  sponsoredBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sponsoredText: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    zIndex: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  ctaPill: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adDisclosure: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },

  // Compact Style
  compactCard: {
    borderRadius: 14,
    marginVertical: 4,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  compactSub: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
  },
  compactCta: {
    paddingHorizontal: 6,
  },
  compactCtaText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export function TravelAffiliateCard(props: TravelAffiliateCardProps) {
  return (
    <AdErrorBoundary placement={`travel_affiliate_${props.type || 'hotel'}`}>
      <TravelAffiliateCardInner {...props} />
    </AdErrorBoundary>
  );
}
