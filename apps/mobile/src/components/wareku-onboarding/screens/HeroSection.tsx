import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

import {
  colors,
  spacing,
  radius,
  typography,
  layout,
  shadow,
} from '../theme/tokens';

import { useResponsive } from '../theme/useResponsive';

import { IconPin, IconArrowRight, TripSplitLogo } from '../icons/LandingIcons';

const DESTS = [
  {
    id: 'bali',
    name: 'Bali Escape',
    emoji: '🌴',
    location: 'Bali, Indonesia',
    meta: '6 travelers · 7 days',
    total: '₹86,420',
    per: '₹14,403',
    image:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=85',
    expenses: [
      {
        icon: '🏨',
        title: 'Villa Stay',
        amount: '₹36,000',
        by: 'Arjun',
      },
      {
        icon: '🍜',
        title: 'Dinner Club',
        amount: '₹4,820',
        by: 'Sarah',
      },
      {
        icon: '🚕',
        title: 'Airport Transfer',
        amount: '₹1,850',
        by: 'Nehal',
      },
    ],
  },
  {
    id: 'santorini',
    name: 'Santorini Days',
    emoji: '🏛️',
    location: 'Santorini, Greece',
    meta: '4 travelers · 6 days',
    total: '₹1,18,650',
    per: '₹29,663',
    image:
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=85',
    expenses: [
      {
        icon: '🏨',
        title: 'Cliff Suite',
        amount: '₹52,400',
        by: 'Sarah',
      },
      {
        icon: '⛵',
        title: 'Catamaran',
        amount: '₹9,600',
        by: 'Alex',
      },
      {
        icon: '🍷',
        title: 'Sunset Dinner',
        amount: '₹7,250',
        by: 'Nehal',
      },
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo Neon',
    emoji: '🏮',
    location: 'Tokyo, Japan',
    meta: '5 travelers · 6 days',
    total: '₹1,42,300',
    per: '₹28,460',
    image:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1600&q=85',
    expenses: [
      {
        icon: '🍣',
        title: 'Omakase',
        amount: '₹9,400',
        by: 'Mike',
      },
      {
        icon: '🚆',
        title: 'Rail Pass',
        amount: '₹14,500',
        by: 'Emma',
      },
      {
        icon: '🏨',
        title: 'City Hotel',
        amount: '₹28,000',
        by: 'Nehal',
      },
    ],
  },
] as const;

type HeroSectionProps = {
  onStartTrip: () => void;
};

export function HeroSection({ onStartTrip }: HeroSectionProps) {
  const { isDesktop } = useResponsive();

  const [activeIdx, setActiveIdx] = useState(0);
  const activeDest = DESTS[activeIdx] || DESTS[0]!;

  const floatY = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
        withTiming(7, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    return () => {
      cancelAnimation(floatY);
      cancelAnimation(glowScale);
    };
  }, [floatY, glowScale]);

  const floatingCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: activeDest.image }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <LinearGradient
        colors={colors.gradientHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.backgroundGlow, glowStyle]}
      />

      <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
        {/* LEFT SIDE */}
        <View
          style={[styles.copyColumn, isDesktop && styles.copyColumnDesktop]}
        >
          <Animated.View
            entering={FadeInDown.duration(650)}
            style={styles.badge}
          >
            <TripSplitLogo size={18} />
            <Text style={styles.badgeText}>
              THE SMARTER WAY TO TRAVEL TOGETHER
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(700)}>
            <Text
              style={[
                styles.heading,
                isDesktop ? styles.headingDesktop : styles.headingMobile,
              ]}
            >
              Your trip.{'\n'}Your people.{'\n'}
              <Text style={styles.headingAccent}>Expenses sorted.</Text>
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(700)}>
            <Text style={styles.subheading}>
              Plan your journey, track every expense, split costs fairly, and
              settle up with your crew — all in one beautifully simple place.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(260).duration(700)}
            style={[styles.actionsRow, !isDesktop && styles.actionsRowMobile]}
          >
            <Pressable
              onPress={onStartTrip}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <LinearGradient
                colors={colors.gradientBrand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Create Your Trip</Text>
                <View style={styles.buttonIcon}>
                  <IconArrowRight size={17} color={colors.textOnLight} />
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.secondaryButtonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Explore TripSplit</Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(340).duration(700)}
            style={styles.trustRow}
          >
            <View style={styles.trustAvatars}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.oceanBlue, marginLeft: 0 },
                ]}
              >
                <Text style={styles.avatarText}>N</Text>
              </View>
              <View
                style={[styles.avatar, { backgroundColor: colors.travelCyan }]}
              >
                <Text style={styles.avatarText}>S</Text>
              </View>
              <View
                style={[styles.avatar, { backgroundColor: colors.emerald }]}
              >
                <Text style={styles.avatarText}>R</Text>
              </View>
              <View style={[styles.avatar, styles.avatarMore]}>
                <Text style={styles.moreText}>+</Text>
              </View>
            </View>

            <View>
              <Text style={styles.trustTitle}>Built for better trips</Text>
              <Text style={styles.trustSubtitle}>
                Friends · Couples · Families · Travel crews
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* RIGHT SIDE — PRODUCT PREVIEW */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(900)}
          style={[
            styles.previewColumn,
            isDesktop && styles.previewColumnDesktop,
            floatingCardStyle,
          ]}
        >
          <View style={styles.previewGlow} />

          <LinearGradient
            colors={colors.gradientBrand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dashboardBorder}
          >
            <View style={styles.dashboard}>
              <View style={styles.dashboardHeader}>
                <View style={styles.tripIdentity}>
                  <View style={styles.tripIcon}>
                    <Text style={styles.tripIconText}>{activeDest.emoji}</Text>
                  </View>

                  <View style={styles.tripTitleArea}>
                    <Text style={styles.dashboardTitle}>{activeDest.name}</Text>
                    <View style={styles.locationRow}>
                      <IconPin size={12} color={colors.brand.primary} />
                      <Text style={styles.locationText}>
                        {activeDest.location}
                      </Text>
                    </View>
                    <Text style={styles.tripMeta}>{activeDest.meta}</Text>
                  </View>
                </View>

                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>

              <View style={styles.destinationTabs}>
                {DESTS.map((destination, index) => {
                  const isActive = index === activeIdx;
                  return (
                    <Pressable
                      key={destination.id}
                      onPress={() => setActiveIdx(index)}
                      style={[
                        styles.destinationTab,
                        isActive && styles.destinationTabActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.destinationTabText,
                          isActive && styles.destinationTabTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {destination.emoji} {destination.name.split(' ')[0]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.primaryStat}>
                  <Text style={styles.statLabel}>TOTAL TRIP SPEND</Text>
                  <Text style={styles.primaryStatValue}>
                    {activeDest.total}
                  </Text>
                  <Text style={styles.statHint}>Across the whole trip</Text>
                </View>

                <View style={styles.secondaryStat}>
                  <Text style={styles.statLabel}>PER PERSON</Text>
                  <Text style={styles.secondaryStatValue}>
                    {activeDest.per}
                  </Text>
                  <View style={styles.underBudgetPill}>
                    <Text style={styles.underBudgetText}>On track</Text>
                  </View>
                </View>
              </View>

              <View style={styles.expenseHeader}>
                <View>
                  <Text style={styles.expenseHeading}>Recent expenses</Text>
                  <Text style={styles.expenseSubheading}>
                    Everything stays in sync
                  </Text>
                </View>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {activeDest.expenses.length}
                  </Text>
                </View>
              </View>

              <View style={styles.expenses}>
                {activeDest.expenses.map((expense, index) => (
                  <View
                    key={`${activeDest.id}-${expense.title}`}
                    style={[
                      styles.expenseItem,
                      index === activeDest.expenses.length - 1 &&
                        styles.expenseItemLast,
                    ]}
                  >
                    <View style={styles.expenseIconContainer}>
                      <Text style={styles.expenseIcon}>{expense.icon}</Text>
                    </View>

                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      <Text style={styles.expensePayer}>
                        Paid by {expense.by}
                      </Text>
                    </View>

                    <Text style={styles.expenseAmount}>{expense.amount}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.settlementFooter}>
                <View>
                  <Text style={styles.settlementLabel}>GROUP BALANCE</Text>
                  <Text style={styles.settlementValue}>
                    3 people need to settle
                  </Text>
                </View>

                <Pressable
                  onPress={onStartTrip}
                  style={({ pressed }) => [
                    styles.settleButton,
                    pressed && styles.settleButtonPressed,
                  ]}
                >
                  <Text style={styles.settleButtonText}>Settle Up</Text>
                  <IconArrowRight size={14} color={colors.textOnLight} />
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.destinationIndicator}>
        {DESTS.map((destination, index) => (
          <Pressable
            key={destination.id}
            onPress={() => setActiveIdx(index)}
            style={[
              styles.indicator,
              index === activeIdx && styles.indicatorActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 760,
    backgroundColor: colors.backgroundDark,
    overflow: 'hidden',
    position: 'relative',
  },
  inner: {
    width: '100%',
    maxWidth: layout.maxWideContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xxxl : spacing.xxl,
    paddingBottom: spacing.sectionLg,
    flexDirection: 'column',
  },
  innerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sectionLg,
    paddingTop: 110,
    paddingBottom: 110,
    minHeight: 760,
  },

  // BACKGROUND
  backgroundGlow: {
    position: 'absolute',
    width: 560,
    height: 560,
    borderRadius: 280,
    backgroundColor: 'rgba(37,99,235,0.16)',
    top: -240,
    right: -160,
  },

  // LEFT CONTENT
  copyColumn: {
    width: '100%',
    alignItems: 'flex-start',
  },
  copyColumnDesktop: {
    width: '48%',
    maxWidth: 610,
    paddingRight: spacing.xxl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginBottom: spacing.xl,
  },
  badgeText: {
    color: colors.textOnLight,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginLeft: spacing.sm,
  },
  heading: {
    color: colors.textOnLight,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  headingMobile: {
    fontSize: 42,
    lineHeight: 48,
  },
  headingDesktop: {
    fontSize: 66,
    lineHeight: 70,
    letterSpacing: -2.8,
  },
  headingAccent: {
    color: colors.brand.cyan,
  },
  subheading: {
    maxWidth: 580,
    color: 'rgba(248,250,252,0.74)',
    fontSize: 17,
    lineHeight: 28,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  actionsRowMobile: {
    flexWrap: 'wrap',
  },
  primaryButton: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    ...shadow.glowBlue,
  },
  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonGradient: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: spacing.xxl,
    paddingRight: 8,
    borderRadius: radius.pill,
  },
  primaryButtonText: {
    color: colors.textOnLight,
    fontSize: 16,
    fontWeight: '800',
    marginRight: spacing.md,
  },
  buttonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  secondaryButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  secondaryButtonText: {
    color: colors.textOnLight,
    fontSize: 15,
    fontWeight: '700',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustAvatars: {
    flexDirection: 'row',
    marginRight: spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(15,23,42,0.70)',
    marginLeft: -7,
  },
  avatarMore: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  moreText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    fontWeight: '700',
  },
  trustTitle: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  trustSubtitle: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 11,
  },

  // PRODUCT PREVIEW (CONTRAST FIXED)
  previewColumn: {
    width: '100%',
    marginTop: spacing.xxxl,
    alignSelf: 'center',
    position: 'relative',
  },
  previewColumnDesktop: {
    width: '52%',
    maxWidth: 650,
    marginTop: 0,
    paddingLeft: spacing.xxl,
  },
  previewGlow: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    alignSelf: 'center',
    top: '10%',
    borderRadius: 100,
    backgroundColor: 'rgba(37,99,235,0.20)',
  },
  dashboardBorder: {
    borderRadius: radius.xl,
    padding: 1.5,
    ...shadow.glowBlue,
  },
  dashboard: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.cardHover,
  },

  // DASHBOARD HEADER
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  tripIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  tripIconText: {
    fontSize: 24,
  },
  tripTitleArea: {
    flex: 1,
  },
  dashboardTitle: {
    ...typography.heading3.mobile,
    color: colors.light.textPrimary,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    marginLeft: 4,
  },
  tripMeta: {
    ...typography.label,
    color: colors.light.textMuted,
    marginTop: 4,
    letterSpacing: 0,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.emeraldSoft,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.16)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    marginLeft: spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.emerald,
    marginRight: 5,
  },
  liveText: {
    color: colors.brand.emerald,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // DESTINATION TABS
  destinationTabs: {
    flexDirection: 'row',
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.xl,
  },
  destinationTab: {
    flex: 1,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: radius.pill,
  },
  destinationTabActive: {
    backgroundColor: colors.brand.primary,
    ...shadow.soft,
  },
  destinationTabText: {
    ...typography.label,
    color: colors.light.textSecondary,
  },
  destinationTabTextActive: {
    color: colors.brand.white,
  },

  // STATS
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  primaryStat: {
    flex: 1,
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.08)',
  },
  secondaryStat: {
    flex: 1,
    backgroundColor: colors.brand.emeraldSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.08)',
  },
  statLabel: {
    ...typography.label,
    color: colors.light.textMuted,
    marginBottom: spacing.sm,
  },
  primaryStatValue: {
    ...typography.heading2.mobile,
    color: colors.light.textPrimary,
  },
  secondaryStatValue: {
    ...typography.heading2.mobile,
    color: colors.brand.emerald,
  },
  statHint: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  underBudgetPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  underBudgetText: {
    color: colors.brand.emerald,
    fontSize: 10,
    fontWeight: '800',
  },

  // EXPENSES
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  expenseHeading: {
    ...typography.body.mobile,
    color: colors.light.textPrimary,
    fontWeight: '800',
  },
  expenseSubheading: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.light.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    color: colors.light.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  expenses: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  expenseItemLast: {
    borderBottomWidth: 0,
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.light.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  expenseIcon: {
    fontSize: 18,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    ...typography.bodySmall,
    color: colors.light.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  expensePayer: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.light.textSecondary,
  },
  expenseAmount: {
    ...typography.body.mobile,
    color: colors.light.textPrimary,
    fontWeight: '800',
    marginLeft: spacing.sm,
  },

  // SETTLEMENT
  settlementFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  settlementLabel: {
    ...typography.label,
    color: colors.light.textMuted,
  },
  settlementValue: {
    ...typography.bodySmall,
    color: colors.light.textPrimary,
    fontWeight: '700',
    marginTop: 4,
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  settleButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  settleButtonText: {
    color: colors.textOnLight,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
  },

  // DESTINATION INDICATOR
  destinationIndicator: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    width: 42,
    backgroundColor: colors.brand.cyan,
  },
});
