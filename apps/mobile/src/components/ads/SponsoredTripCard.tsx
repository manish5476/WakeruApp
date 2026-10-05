// src/components/ads/SponsoredTripCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  Pressable,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../providers/ThemeProvider';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import AppIcon from '../common/AppIcon';
import { getBannerAdUnitId } from '../../services/ads/admob.service';
import { getFlightDealUrl } from '../../utils/affiliateLinks';

interface SponsoredTripCardProps {
  onPress?: () => void;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  destinationUrl?: string;
}

const DEFAULT_SPONSORED_IMAGE =
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80'; // Airplane / travel sky

export function SponsoredTripCard({
  onPress,
  title = 'Exclusive Travel & Flight Deals',
  subtitle = 'Save up to 25% on group hotel & flight bookings',
  imageUrl = DEFAULT_SPONSORED_IMAGE,
  ctaText = 'Explore Deals →',
  destinationUrl = getFlightDealUrl(),
}: SponsoredTripCardProps) {
  const theme = useTheme();
  const [imgUri, setImgUri] = useState(imageUrl);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (destinationUrl) {
      Linking.openURL(destinationUrl).catch(() => {});
    }
  };

  return (
    <InteractiveWrapper onPress={handlePress} hoverElevation>
      <GlassCard variant="medium" padding="none" style={styles.card}>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imgUri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImgUri(DEFAULT_SPONSORED_IMAGE)}
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)']}
            locations={[0.25, 0.65, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Header Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredText}>SPONSORED</Text>
            </View>
            <View style={styles.partnerPill}>
              <AppIcon name="sparkles" size={11} color="#FBBF24" />
              <Text style={styles.partnerText}>Featured Partner</Text>
            </View>
          </View>

          {/* Content Overlay */}
          <View style={styles.contentOverlay}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>

            <View style={styles.footerRow}>
              <View style={styles.ctaPill}>
                <Text style={styles.ctaText}>{ctaText}</Text>
              </View>
              <Text style={styles.adDisclosure}>Ad</Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </InteractiveWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  imageWrap: {
    height: 200,
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
    zIndex: 2,
  },
  sponsoredBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sponsoredText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.6,
  },
  partnerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  partnerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FDE68A',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 2,
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
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
