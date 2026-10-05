import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { Business } from '../../types/local.types';
import { formatAmount } from '../../utils/formatters';

interface BusinessCardProps {
  business: Business;
  onPress: () => void;
  showDistance?: boolean;
}

export function BusinessCard({
  business,
  onPress,
  showDistance = true,
}: BusinessCardProps) {
  const theme = useTheme();

  const coverMedia =
    business.media?.find(
      m => m.mediaType === 'cover' || m.moderationStatus === 'APPROVED',
    ) || business.media?.[0];
  const imageUrl =
    coverMedia?.url ||
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.touchable}
    >
      <GlassCard variant="subtle" padding="none" style={styles.card}>
        {/* Cover Image & Badges */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.badgeOverlay}>
            <View style={styles.badgeRow}>
              {business.isSponsored && (
                <Badge label="Sponsored" variant="sponsored" />
              )}
              {business.verificationStatus === 'VERIFIED' && (
                <Badge label="✓ Verified" variant="verified" />
              )}
            </View>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: theme.colors.primary }}
              >
                {business.category}
              </Typography>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, { padding: theme.spacing[3] }]}>
          <View style={styles.headerRow}>
            <Typography
              variant="body"
              weight="bold"
              numberOfLines={1}
              style={{ flex: 1, color: theme.colors.textPrimary }}
            >
              {business.businessName}
            </Typography>
            {business.rating !== undefined && (
              <View style={styles.ratingRow}>
                <AppIcon name="star" size={14} color="#F59E0B" />
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary, marginLeft: 3 }}
                >
                  {business.rating.toFixed(1)}
                </Typography>
                {business.reviewCount !== undefined && (
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textTertiary, marginLeft: 2 }}
                  >
                    ({business.reviewCount})
                  </Typography>
                )}
              </View>
            )}
          </View>

          <Typography
            variant="caption"
            numberOfLines={1}
            style={{ color: theme.colors.textSecondary, marginTop: 2 }}
          >
            {business.city}, {business.country}
            {showDistance && business.distanceKm !== undefined
              ? ` · ${business.distanceKm.toFixed(1)} km away`
              : ''}
          </Typography>

          {/* Pricing & Amenities snapshot */}
          <View
            style={[
              styles.footerRow,
              {
                marginTop: theme.spacing[3],
                borderTopWidth: 1,
                borderTopColor: theme.colors.borderLight,
              },
            ]}
          >
            {business.priceMinor ? (
              <Typography
                variant="caption"
                weight="bold"
                style={{ color: theme.colors.primary }}
              >
                {formatAmount(
                  business.priceMinor / 100,
                  business.currency || 'INR',
                )}
                <Typography
                  variant="caption"
                  style={{
                    color: theme.colors.textTertiary,
                    fontWeight: 'normal',
                  }}
                >
                  {' '}
                  / unit
                </Typography>
              </Typography>
            ) : (
              <Typography
                variant="caption"
                style={{ color: theme.colors.textTertiary }}
              >
                Contact for pricing
              </Typography>
            )}

            <View style={styles.viewDetailsRow}>
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: theme.colors.primary }}
              >
                View Details
              </Typography>
              <AppIcon
                name="chevron-right"
                size={14}
                color={theme.colors.primary}
              />
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: '#E4E4E7',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRow: {
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
