import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { AvatarGroup } from '../ui/AvatarGroup';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface JoinedTripBannerProps {
  trip: any;
  onDismiss?: () => void;
}

export function JoinedTripBanner({ trip, onDismiss }: JoinedTripBannerProps) {
  const theme = useTheme();

  if (!trip) return null;

  const tripId = trip._id || trip.tripId || trip.id;
  const tripTitle = trip.title || 'Your Trip';
  const totalSpent = trip.totalSpent || 0;
  const memberCount =
    trip.memberCount || (trip.members && trip.members.length) || 1;
  const memberAvatars = (trip.memberPreviews || trip.members || [])
    .map((m: any) => m.photoURL || m.photo || m.avatar || '')
    .filter(Boolean);

  let dateRange = '';
  try {
    if (trip.startDate && trip.endDate) {
      dateRange = `${format(new Date(trip.startDate), 'MMM d')} – ${format(new Date(trip.endDate), 'MMM d, yyyy')}`;
    } else if (trip.startDate) {
      dateRange = `Starts ${format(new Date(trip.startDate), 'MMM d, yyyy')}`;
    }
  } catch {
    dateRange = '';
  }

  const handleOpenTrip = () => {
    haptics.light();
    router.push(`/(app)/trips/${tripId}` as any);
  };

  const handleAddExpense = () => {
    haptics.light();
    router.push(`/(app)/trips/${tripId}` as any);
  };

  const handleMeetCrew = () => {
    haptics.light();
    router.push(`/(app)/trips/${tripId}` as any);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={styles.container}
    >
      <GlassCard
        variant="prominent"
        padding="none"
        style={[
          styles.card,
          {
            borderColor: theme.isDark
              ? 'rgba(56, 189, 248, 0.3)'
              : 'rgba(37, 99, 235, 0.25)',
            backgroundColor: theme.isDark
              ? 'rgba(15, 23, 42, 0.85)'
              : 'rgba(255, 255, 255, 0.92)',
          },
        ]}
      >
        <LinearGradient
          colors={
            theme.isDark
              ? ['rgba(37, 99, 235, 0.18)', 'rgba(56, 189, 248, 0.04)']
              : ['rgba(37, 99, 235, 0.08)', 'rgba(255, 255, 255, 0)']
          }
          style={styles.gradientBg}
        >
          <View style={styles.content}>
            {/* Top Badge & Header */}
            <View style={styles.topRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: 'rgba(37, 99, 235, 0.15)' },
                ]}
              >
                <AppIcon name="sparkles" size={13} color="#2563EB" />
                <Text style={styles.badgeText}>INVITATION ACCEPTED</Text>
              </View>

              {onDismiss && (
                <Pressable
                  onPress={onDismiss}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.closeBtn}
                  accessibilityLabel="Dismiss banner"
                >
                  <AppIcon
                    name="x"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                </Pressable>
              )}
            </View>

            <View style={styles.heroSection}>
              <Text
                style={[
                  styles.heroHeading,
                  { color: theme.colors.textPrimary },
                ]}
              >
                You're in! 🎉
              </Text>
              <Text
                style={[styles.heroSub, { color: theme.colors.textSecondary }]}
              >
                You have successfully joined{' '}
                <Text
                  style={[
                    styles.tripHighlight,
                    { color: theme.colors.primary },
                  ]}
                >
                  {tripTitle}
                </Text>
              </Text>
            </View>

            {/* Trip Snapshot Stats Card */}
            <View
              style={[
                styles.statsCard,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)',
                  borderColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              {dateRange ? (
                <View style={styles.statRow}>
                  <AppIcon
                    name="calendar"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.statText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {dateRange}
                  </Text>
                </View>
              ) : null}

              <View style={styles.statRow}>
                <AppIcon name="receipt" size={14} color="#10B981" />
                <Text
                  style={[styles.statText, { color: theme.colors.textPrimary }]}
                >
                  ₹{totalSpent.toLocaleString('en-IN')} spent so far
                </Text>
              </View>

              <View style={styles.statRow}>
                <AppIcon name="users" size={14} color="#6366F1" />
                <Text
                  style={[styles.statText, { color: theme.colors.textPrimary }]}
                >
                  {memberCount} travel member{memberCount !== 1 ? 's' : ''}
                </Text>
                {memberAvatars.length > 0 && (
                  <View style={styles.avatarWrap}>
                    <AvatarGroup urls={memberAvatars} max={3} size={20} />
                  </View>
                )}
              </View>
            </View>

            {/* Primary & Secondary Action Cluster */}
            <View style={styles.actionsContainer}>
              <Pressable
                onPress={handleOpenTrip}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: theme.colors.primary },
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
              >
                <AppIcon name="compass" size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>View Trip</Text>
              </Pressable>

              <View style={styles.secondaryBtnRow}>
                <Pressable
                  onPress={handleAddExpense}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    {
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.1)',
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.02)',
                    },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <AppIcon
                    name="plus"
                    size={14}
                    color={theme.colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Add Expense
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleMeetCrew}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    {
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.1)',
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.02)',
                    },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <AppIcon
                    name="users"
                    size={14}
                    color={theme.colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Meet Crew
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </LinearGradient>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  gradientBg: {
    width: '100%',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.6,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 12,
  },
  heroSection: {
    gap: 4,
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  tripHighlight: {
    fontWeight: '800',
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  avatarWrap: {
    marginLeft: 'auto',
  },
  actionsContainer: {
    gap: 8,
    marginTop: 4,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' } as any,
    }),
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
