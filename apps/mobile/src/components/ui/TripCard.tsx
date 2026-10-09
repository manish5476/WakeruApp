// src/components/trips/TripCard.tsx
import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { AmountDisplay } from '../ui/AmountDisplay';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { InteractiveWrapper } from './InteractiveWrapper';
import { getTripCoverImage } from '../../utils/tripImage';

interface TripCardProps {
  trip: {
    _id: string;
    title: string;
    coverImage?: string;
    startDate: string;
    endDate: string;
    status: string;
    baseCurrency: string;
    totalBudget?: number;
    totalSpentBase: number;
    stops?: any[];
    members: {
      userId: string;
      displayName: string;
      photoURL?: string;
      isActive?: boolean;
    }[];
  };
  onPress: () => void;
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const theme = useTheme();

  // Derived stats
  const activeMembers = trip.members?.filter(m => m.isActive !== false) || [];
  const stopCount = trip.stops?.length || 0;
  const expenseCount =
    trip.stops?.reduce((acc, s) => acc + (s.expenseCount || 0), 0) || 0;

  // Only calculate daysLeft if the trip is NOT completed/archived
  const isActive = trip.status === 'active' || trip.status === 'planning';
  const daysLeft = isActive
    ? Math.max(
        0,
        Math.ceil(
          (new Date(trip.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  // Status Mapping
  const statusMap: Record<
    string,
    {
      label: string;
      variant: 'success' | 'info' | 'warning' | 'neutral' | 'primary';
    }
  > = {
    active: { label: '🟢 Live', variant: 'success' },
    planning: { label: '📅 Planning', variant: 'info' },
    completed: { label: '✅ Completed', variant: 'primary' },
    archived: { label: 'Archived', variant: 'neutral' },
  };
  const status = statusMap[trip.status] || {
    label: trip.status,
    variant: 'neutral',
  };

  // Smart diverse travel image resolver
  const coverUri = getTripCoverImage(trip);
  const [imageUri, setImageUri] = React.useState(coverUri);

  React.useEffect(() => {
    setImageUri(coverUri);
  }, [coverUri]);

  return (
    <InteractiveWrapper onPress={onPress} hoverElevation>
      <GlassCard variant="medium" padding="none" style={styles.card}>
        {/* HEIGHT IS EXPLICITLY DEFINED HERE TO FIX THE LAYOUT COLLAPSE */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              const fallback =
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
              if (imageUri !== fallback) {
                setImageUri(fallback);
              }
            }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            locations={[0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Badges */}
          <View style={styles.badgeRow}>
            <Badge label={status.label} variant={status.variant} />
            {isActive && daysLeft > 0 && daysLeft <= 30 && (
              <View style={styles.countdownPill}>
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: '#FFFFFF' }}
                >
                  ⏳ {daysLeft}d left
                </Typography>
              </View>
            )}
          </View>

          {/* Content Overlay */}
          <View style={styles.contentOverlay}>
            <Typography
              variant="h2"
              weight="extrabold"
              style={styles.tripTitle}
              numberOfLines={1}
            >
              {trip.title}
            </Typography>
            <Typography variant="caption" style={styles.subText}>
              {new Date(trip.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              –{' '}
              {new Date(trip.endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Typography>

            <View style={styles.statsFooter}>
              <AmountDisplay
                amount={trip.totalSpentBase}
                currency={trip.baseCurrency}
                size="sm"
                compact
                color="#FFFFFF"
              />
              <View style={styles.footerMeta}>
                <Typography variant="caption" style={styles.metaText}>
                  👥 {activeMembers.length}
                </Typography>
                <Typography variant="caption" style={styles.metaText}>
                  📍 {stopCount}
                </Typography>
                <Typography variant="caption" style={styles.metaText}>
                  🧾 {expenseCount}
                </Typography>
              </View>
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
    // No aspectRatio here! It will expand to fit its parent.
  },
  imageWrap: {
    // CRITICAL FIX: This explicit height guarantees content renders inside.
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
    zIndex: 2,
  },
  countdownPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  tripTitle: {
    color: '#FFFFFF',
    ...Platform.select({
      web: {
        textShadow: '0px 1px 3px rgba(0,0,0,0.8)',
      } as any,
      default: {
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  subText: {
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
    ...Platform.select({
      web: {
        textShadow: '0px 1px 2px rgba(0,0,0,0.8)',
      } as any,
      default: {
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  metaText: {
    color: 'rgba(255,255,255,0.92)',
    ...Platform.select({
      web: {
        textShadow: '0px 1px 2px rgba(0,0,0,0.8)',
      } as any,
      default: {
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
});
