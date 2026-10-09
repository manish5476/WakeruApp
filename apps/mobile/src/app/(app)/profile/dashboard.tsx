import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  Pressable,
  RefreshControl,
  ImageBackground,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, formatDistanceToNow } from 'date-fns';

import { useDashboard } from '../../../hooks/useDashboard';
import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { SimpleBarChart } from '../../../components/charts/SimpleBarChart';

// ============================================================
// CONSTANTS
// ============================================================

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📦',
};

function getCategoryColor(theme: any, category: string): string {
  switch (category) {
    case 'food':
      return theme.colors.warning;
    case 'stay':
      return theme.colors.purple;
    case 'transport':
      return theme.colors.info;
    case 'activity':
      return theme.colors.success;
    case 'shopping':
      return theme.colors.warm;
    case 'health':
      return theme.colors.danger;
    default:
      return theme.colors.textTertiary;
  }
}

const ACTION_ICONS: Record<string, string> = {
  pending_settlements: '⚠️',
  you_owe: '💸',
  friend_requests: '🤝',
  trip_invites: '🧳',
  bills_due: '📋',
  trip_ending: '🏁',
  goal_near: '🎯',
};

// ============================================================
// HELPERS
// ============================================================

// Indian numbering tiers, largest first. A single "Cr" cutoff lets an
// unusually large amount keep growing forever (e.g. "50000020.0Cr"). Walking
// through Cr → Arab → Kharab and locale-grouping the mantissa keeps every
// value short and readable, no matter how large the underlying number is.
const INR_TIERS: { value: number; suffix: string }[] = [
  { value: 1_000_00_00_00_000, suffix: 'Kh' }, // 1 Kharab = 100 Arab
  { value: 1_00_00_00_00_000, suffix: 'Ar' }, // 1 Arab   = 100 Cr
  { value: 1_00_00_000, suffix: 'Cr' }, // 1 Crore
  { value: 1_00_000, suffix: 'L' }, // 1 Lakh
  { value: 1_000, suffix: 'K' },
];

function formatCurrency(amount: number | null | undefined): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '₹0';

  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  for (const tier of INR_TIERS) {
    if (abs >= tier.value) {
      const scaled = abs / tier.value;
      const formatted = scaled.toLocaleString('en-IN', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      return `${sign}₹${formatted}${tier.suffix}`;
    }
  }

  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

function getGreeting(): { emoji: string; text: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { emoji: '🌙', text: 'Good Night' };
  if (hour < 12) return { emoji: '🌅', text: 'Good Morning' };
  if (hour < 17) return { emoji: '☀️', text: 'Good Afternoon' };
  if (hour < 21) return { emoji: '🌇', text: 'Good Evening' };
  return { emoji: '🌙', text: 'Good Night' };
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

/** Quick Stat Card */
function QuickStat({
  icon,
  label,
  value,
  color,
  onPress,
  flexible,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  onPress?: () => void;
  flexible?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.quickStat,
        flexible && styles.quickStatFlexible,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
        },
        Platform.OS === 'web' &&
          hovered && {
            transform: 'translateY(-2px)',

            ...Platform.select({
              web: {
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
              } as any,

              default: {
                shadowColor: '#000',

                shadowOffset: {
                  width: 0,
                  height: 4,
                },

                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
              },
            }),
          },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.quickStatIcon}>{icon}</Text>
      <Text
        style={[styles.quickStatValue, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
      <Text
        style={[styles.quickStatLabel, { color: theme.colors.textTertiary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Person Row — Who owes you / You owe */
function PersonRow({
  name,
  photoURL,
  amount,
  type,
  expenseCount,
  onPress,
}: {
  name: string;
  photoURL?: string;
  amount: number;
  type: 'owe' | 'owed';
  expenseCount: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const isOwe = type === 'owe';
  const initials =
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.personRow,
        { borderBottomColor: theme.colors.borderLight },
        Platform.OS === 'web' &&
          hovered && { backgroundColor: theme.colors.primaryBg },
      ]}
      onPress={onPress}
    >
      {photoURL ? (
        <Image source={{ uri: photoURL }} style={styles.personAvatar} />
      ) : (
        <View
          style={[
            styles.personAvatarPlaceholder,
            { backgroundColor: isOwe ? '#FEE2E2' : '#D1FAE5' },
          ]}
        >
          <Text
            style={[
              styles.personAvatarText,
              { color: isOwe ? '#DC2626' : '#059669' },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
      <View style={styles.personInfo}>
        <Text
          style={[styles.personName, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={[styles.personMeta, { color: theme.colors.textTertiary }]}
          numberOfLines={1}
        >
          {expenseCount} expense{expenseCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.personAmountWrap}>
        <Text
          style={[
            styles.personAmount,
            { color: isOwe ? '#DC2626' : '#059669' },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {isOwe ? '-' : '+'}
          {formatCurrency(amount)}
        </Text>
        <Text style={[styles.personAction, { color: theme.colors.primary }]}>
          {isOwe ? 'Pay' : 'Remind'} →
        </Text>
      </View>
    </Pressable>
  );
}

/** Expense Row */
function ExpenseRow({
  expense,
  onPress,
}: {
  expense: any;
  onPress: () => void;
}) {
  const theme = useTheme();
  const emoji = CATEGORY_EMOJIS[expense.category] || '📦';

  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.expenseRow,
        { borderBottomColor: theme.colors.borderLight },
        Platform.OS === 'web' &&
          hovered && { backgroundColor: theme.colors.primaryBg },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.expenseEmoji,
          { backgroundColor: theme.colors.primaryBg },
        ]}
      >
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={styles.expenseInfo}>
        <Text
          style={[styles.expenseTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {expense.title}
        </Text>
        <Text
          style={[styles.expenseMeta, { color: theme.colors.textTertiary }]}
          numberOfLines={1}
        >
          {expense.tripTitle || 'No trip'} ·{' '}
          {format(new Date(expense.date), 'MMM d, h:mm a')}
        </Text>
      </View>
      <Text
        style={[styles.expenseAmount, { color: theme.colors.textPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {formatCurrency(expense.amountBase)}
      </Text>
    </Pressable>
  );
}

/** Trip Card */
function TripCard({ trip, onPress }: { trip: any; onPress: () => void }) {
  const theme = useTheme();
  const isActive = trip.status === 'active';
  const daysLeft = trip.daysLeft || trip.daysUntilStart || 0;
  const daysLabel = trip.status === 'planning' ? 'starts in' : 'left';

  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.tripCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
        },
        Platform.OS === 'web' &&
          hovered && {
            transform: 'translateY(-3px)',

            ...Platform.select({
              web: {
                boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
              } as any,

              default: {
                shadowColor: '#000',

                shadowOffset: {
                  width: 0,
                  height: 4,
                },

                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
              },
            }),
          },
      ]}
      onPress={onPress}
    >
      <ImageBackground
        source={trip.coverImage ? { uri: trip.coverImage } : undefined}
        style={styles.tripCardImage}
        imageStyle={{ borderRadius: 16 }}
      >
        {!trip.coverImage && (
          <View style={styles.tripCardPlaceholder}>
            <Text style={{ fontSize: 32 }}>✈️</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          locations={[0.45, 1]}
          style={styles.tripCardGradient}
        />
        <View style={styles.tripCardOverlay}>
          <View style={styles.tripCardBadges}>
            <View
              style={[
                styles.tripStatusBadge,
                { backgroundColor: isActive ? '#10B981' : '#F59E0B' },
              ]}
            >
              {isActive && <View style={styles.liveDot} />}
              <Text style={styles.tripStatusText}>
                {isActive ? 'LIVE' : 'PLANNING'}
              </Text>
            </View>
            {trip.memberCount > 0 && (
              <View style={styles.tripMemberBadge}>
                <Text style={{ fontSize: 11, color: '#FFF' }}>
                  👥 {trip.memberCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.tripCardTitle} numberOfLines={1}>
            {trip.title}
          </Text>
          <View style={styles.tripCardFooter}>
            <Text
              style={styles.tripCardAmount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatCurrency(trip.totalSpent || 0)}
            </Text>
            {daysLeft > 0 && (
              <Text style={styles.tripCardDays}>
                {daysLeft}d {daysLabel}
              </Text>
            )}
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

/** Section Header */
function SectionHeader({
  icon,
  title,
  action,
  onAction,
}: {
  icon: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          {title}
        </Text>
      </View>
      {action && onAction && (
        <Pressable
          style={({ hovered }: any) => [
            styles.sectionAction,
            Platform.OS === 'web' && hovered && { opacity: 0.7 },
          ]}
          onPress={onAction}
        >
          <Text
            style={[styles.sectionActionText, { color: theme.colors.primary }]}
          >
            {action}
          </Text>
          <AppIcon
            name="chevron-right"
            size={14}
            color={theme.colors.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DashboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((s: any) => s.user);
  const firstName = user?.displayName?.split(' ')[0] || 'Traveler';

  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const isTablet = Platform.OS === 'web' && width >= 768 && width < 1024;
  const isWideDesktop = isDesktop && width >= 1280;

  const { data: dashboardData, isLoading, refetch } = useDashboard();
  const data = (dashboardData as any)?.data || dashboardData;

  const greeting = getGreeting();
  const summary = data?.summary || {};
  const balances = data?.balances || {};
  const categories = data?.categories || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const youOwe = data?.youOwe || [];
  const youAreOwed = data?.youAreOwed || [];
  const recentExpenses = data?.recentExpenses || [];
  const activeTrips = data?.activeTrips || [];
  const recentlyCompleted = data?.recentlyCompleted || [];
  const pendingActions = data?.pendingActions || [];
  const quickStats = data?.quickStats || {};
  const upcomingBills = data?.upcomingBills || [];
  const activeGoals = data?.activeGoals || [];
  const recentAchievements = data?.recentAchievements || [];

  const totalOwed = youOwe.reduce(
    (s: number, p: any) => s + (p.totalAmount || 0),
    0,
  );
  const totalOwedToYou = youAreOwed.reduce(
    (s: number, p: any) => s + (p.totalAmount || 0),
    0,
  );
  const netBalance = balances.netBalance || totalOwedToYou - totalOwed;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Loading State
  if (isLoading && !refreshing) {
    return (
      <GlobalBackground>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Crunching your numbers...
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  const hasNoData =
    recentExpenses.length === 0 &&
    activeTrips.length === 0 &&
    youOwe.length === 0 &&
    youAreOwed.length === 0;

  const quickStatEntries = [
    {
      icon: '✈️',
      label: 'Total Trips',
      value: `${quickStats?.totalTrips || 0}`,
      color: theme.colors.primary,
    },
    {
      icon: '💸',
      label: 'Biggest Expense',
      value: formatCurrency(quickStats?.mostExpensiveTrip?.amount || 0),
      color: theme.colors.danger,
    },
    {
      icon: '📅',
      label: 'Longest Trip',
      value: `${quickStats?.longestTrip?.days || 0}d`,
      color: theme.colors.warning,
    },
    {
      icon: '👥',
      label: 'Friends',
      value: `${quickStats?.favoriteBuddy?.displayName || 'None'}`,
      color: theme.colors.success,
    },
  ];

  return (
    <GlobalBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 },
          isDesktop && styles.contentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* ── HEADER ──────────────────────────────────── */}
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              style={({ hovered }: any) => [
                styles.iconBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' &&
                  hovered && { transform: 'scale(1.05)' },
              ]}
              onPress={() => router.back()}
            >
              <AppIcon
                name="arrow-left"
                size={20}
                color={theme.colors.textPrimary}
              />
            </Pressable>
            <View>
              <Text style={[styles.greetingEmoji]}>{greeting.emoji}</Text>
              <Text
                style={[
                  styles.greetingText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {greeting.text}
              </Text>
              <Text
                style={[styles.headerName, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {firstName} 👋
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={({ hovered }: any) => [
                styles.iconBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' &&
                  hovered && { transform: 'scale(1.05)' },
              ]}
              onPress={() => router.push('/(app)/notifications' as any)}
            >
              <AppIcon name="bell" size={20} color={theme.colors.textPrimary} />
              {pendingActions.length > 0 && (
                <View
                  style={[styles.notifBadge, { backgroundColor: '#EF4444' }]}
                >
                  <Text style={styles.notifBadgeText}>
                    {pendingActions.length}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={({ hovered }: any) => [
                styles.iconBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' &&
                  hovered && { transform: 'scale(1.05)' },
              ]}
              onPress={() => router.push('/(app)/(tabs)/profile' as any)}
            >
              <AppIcon name="user" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* ── QUICK STATS ROW ────────────────────────── */}
        {isWideDesktop ? (
          <View style={styles.quickStatsGrid}>
            {quickStatEntries.map((stat, i) => (
              <QuickStat key={i} {...stat} flexible />
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickStatsScroll}
            contentContainerStyle={styles.quickStatsContent}
          >
            {quickStatEntries.map((stat, i) => (
              <QuickStat key={i} {...stat} />
            ))}
          </ScrollView>
        )}

        {/* ── NET BALANCE HERO ───────────────────────── */}
        <LinearGradient
          colors={
            netBalance >= 0 ? ['#059669', '#047857'] : ['#DC2626', '#B91C1C']
          }
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroLabel}>NET BALANCE</Text>
          <Text
            style={styles.heroAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {netBalance >= 0 ? '+' : '-'}
            {formatCurrency(Math.abs(netBalance))}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroItem}>
              <Text
                style={styles.heroItemValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {formatCurrency(totalOwed)}
              </Text>
              <Text style={styles.heroItemLabel}>You Owe</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroItem}>
              <Text
                style={styles.heroItemValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {formatCurrency(totalOwedToYou)}
              </Text>
              <Text style={styles.heroItemLabel}>Owed to You</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroItem}>
              <Text
                style={styles.heroItemValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {summary?.activeTrips || 0}
              </Text>
              <Text style={styles.heroItemLabel}>Active Trips</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── PENDING ACTIONS ────────────────────────── */}
        {pendingActions.length > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="⚡" title="Needs Attention" />
            {pendingActions.map((action: any, i: number) => (
              <Pressable
                key={i}
                style={({ hovered }: any) => [
                  styles.actionCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.borderLight,
                    borderLeftColor:
                      action.priority === 'urgent' ? '#EF4444' : '#F59E0B',
                  },
                  Platform.OS === 'web' &&
                    hovered && { transform: 'translateX(4px)' },
                ]}
                onPress={() => {
                  if (action.actionType === 'view_settlements')
                    router.push('/(app)/settlements' as any);
                  else if (action.actionType === 'view_friend_requests')
                    router.push('/(app)/friends' as any);
                  else router.push('/(app)/(tabs)/home' as any);
                }}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <View style={styles.actionInfo}>
                  <Text
                    style={[
                      styles.actionTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {action.title}
                  </Text>
                  <Text
                    style={[
                      styles.actionMessage,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {action.message}
                  </Text>
                </View>
                <Badge
                  label={action.count.toString()}
                  variant={action.priority === 'urgent' ? 'danger' : 'warning'}
                />
              </Pressable>
            ))}
          </View>
        )}

        {/* ── ACTIVE TRIPS ───────────────────────────── */}
        {(activeTrips.length > 0 || recentlyCompleted.length > 0) && (
          <View style={styles.section}>
            <SectionHeader
              icon="✈️"
              title="Your Trips"
              action="View All"
              onAction={() => router.push('/(app)/(tabs)/home' as any)}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tripsScrollContent}
            >
              {activeTrips.map((trip: any) => (
                <TripCard
                  key={trip.tripId}
                  trip={trip}
                  onPress={() => router.push(`/(app)/trips/${trip.tripId}`)}
                />
              ))}
              {recentlyCompleted.slice(0, 2).map((trip: any) => (
                <TripCard
                  key={trip.tripId}
                  trip={{ ...trip, status: 'completed', daysLeft: 0 }}
                  onPress={() => router.push(`/(app)/trips/${trip.tripId}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── PEOPLE: OWED TO YOU ────────────────────── */}
        {youAreOwed.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              icon="💚"
              title="People Owe You"
              action={`${youAreOwed.length} people`}
            />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              {youAreOwed.slice(0, 5).map((person: any, i: number) => (
                <PersonRow
                  key={i}
                  name={person.name}
                  amount={person.totalAmount}
                  type="owed"
                  expenseCount={person.expenseCount}
                  onPress={() => router.push(`/(app)/person/${person.userId}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── PEOPLE: YOU OWE ────────────────────────── */}
        {youOwe.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              icon="💔"
              title="You Owe"
              action={`${youOwe.length} people`}
            />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              {youOwe.slice(0, 5).map((person: any, i: number) => (
                <PersonRow
                  key={i}
                  name={person.name}
                  amount={person.totalAmount}
                  type="owe"
                  expenseCount={person.expenseCount}
                  onPress={() => router.push(`/(app)/person/${person.userId}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── MONTHLY TREND ──────────────────────────── */}
        {monthlyTrend.length > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="📈" title="Spending Trend" />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <SimpleBarChart
                data={monthlyTrend.map((m: any) => ({
                  label: m.monthName || m.month?.slice(5) || '',
                  value: m.total || 0,
                  color: theme.colors.primary,
                }))}
                height={160}
              />
            </View>
          </View>
        )}

        {/* ── CATEGORIES ─────────────────────────────── */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="🎨" title="By Category" />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              {categories.slice(0, 5).map((cat: any) => (
                <View key={cat.category} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <Text style={styles.categoryEmoji}>
                      {CATEGORY_EMOJIS[cat.category] || '📦'}
                    </Text>
                    <Text
                      style={[
                        styles.categoryName,
                        { color: theme.colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.category}
                    </Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text
                      style={[
                        styles.categoryAmount,
                        { color: theme.colors.textPrimary },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {formatCurrency(cat.totalAmount)}
                    </Text>
                    <View
                      style={[
                        styles.categoryBar,
                        { backgroundColor: theme.colors.borderLight },
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryBarFill,
                          {
                            width: `${Math.min(cat.percentage, 100)}%` as any,
                            backgroundColor: getCategoryColor(
                              theme,
                              cat.category,
                            ),
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── RECENT EXPENSES ────────────────────────── */}
        {recentExpenses.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              icon="📝"
              title="Recent Expenses"
              action="View All"
              onAction={() => router.push('/(app)/(tabs)/expenses' as any)}
            />
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              {recentExpenses.slice(0, isDesktop ? 8 : 5).map((exp: any) => (
                <ExpenseRow
                  key={exp._id}
                  expense={exp}
                  onPress={() => router.push(`/(app)/expenses/${exp._id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── ACHIEVEMENTS ───────────────────────────── */}
        {recentAchievements.length > 0 && (
          <View style={styles.section}>
            <SectionHeader icon="🏆" title="Recent Achievements" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {recentAchievements.map((ach: any) => (
                <View
                  key={ach.achievementId}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                >
                  <Text style={styles.achievementIcon}>{ach.icon}</Text>
                  <Text
                    style={[
                      styles.achievementName,
                      { color: theme.colors.textPrimary },
                    ]}
                    numberOfLines={2}
                  >
                    {ach.name}
                  </Text>
                  <Text
                    style={[
                      styles.achievementTier,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {ach.tier}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── EMPTY STATE ────────────────────────────── */}
        {hasNoData && (
          <View
            style={[
              styles.emptyState,
              { borderColor: theme.colors.borderLight },
            ]}
          >
            <Text style={styles.emptyEmoji}>🚀</Text>
            <Text
              style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}
            >
              Start Your Journey!
            </Text>
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              Create a trip and invite friends to start tracking expenses
              together.
            </Text>
            <Pressable
              style={({ hovered }: any) => [
                styles.emptyBtn,
                { backgroundColor: theme.colors.primary },
                Platform.OS === 'web' &&
                  hovered && { opacity: 0.9, transform: 'scale(1.03)' },
              ]}
              onPress={() => router.push('/(app)/create-trip' as any)}
            >
              <AppIcon name="plus" size={18} color="#FFF" />
              <Text style={styles.emptyBtnText}>Create Your First Trip</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </GlobalBackground>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { paddingHorizontal: 16 },
  contentDesktop: { width: '100%', paddingHorizontal: 40 },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 15, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerDesktop: { marginBottom: 32 },
  greetingEmoji: { fontSize: 32, marginBottom: 4 },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerName: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? { cursor: 'pointer', transition: 'transform 0.2s ease' }
      : {}),
  } as any,
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  notifBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  // Quick Stats (mobile / narrow desktop: horizontal scroll strip)
  quickStatsScroll: { marginBottom: 20, marginHorizontal: -16 },
  quickStatsContent: { paddingHorizontal: 16, gap: 12 },
  quickStat: {
    width: 120,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }
      : {}),
  } as any,

  // Quick Stats (wide desktop: flex grid using the full width)
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  } as any,
  quickStatFlexible: { flex: 1, minWidth: 170, width: undefined },

  quickStatIcon: { fontSize: 24 },
  quickStatValue: { fontSize: 18, fontWeight: '900', maxWidth: '100%' },
  quickStatLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Hero Card
  heroCard: { borderRadius: 24, padding: 24, marginBottom: 28 },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -2,
    marginBottom: 20,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  heroDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroItemValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    maxWidth: '100%',
  },
  heroItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Sections
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  } as any,
  sectionActionText: { fontSize: 13, fontWeight: '700' },

  // Card
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },

  // Action Cards
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 10,
    ...(Platform.OS === 'web'
      ? { cursor: 'pointer', transition: 'transform 0.2s ease' }
      : {}),
  } as any,
  actionIcon: { fontSize: 24 },
  actionInfo: { flex: 1, minWidth: 0 },
  actionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  actionMessage: { fontSize: 12, fontWeight: '500' },

  // Trip Cards
  tripsScrollContent: { gap: 14, paddingVertical: 4 },
  tripCard: {
    width: 220,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }
      : {}),
  } as any,
  tripCardImage: { width: '100%', height: '100%' },
  tripCardPlaceholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 16,
  },
  tripCardGradient: { ...StyleSheet.absoluteFill },
  tripCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  tripCardBadges: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tripStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  tripStatusText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  tripMemberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  tripCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  tripCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  tripCardAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    flexShrink: 1,
  },
  tripCardDays: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },

  // Person Row
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === 'web'
      ? { cursor: 'pointer', transition: 'background-color 0.15s ease' }
      : {}),
  } as any,
  personAvatar: { width: 44, height: 44, borderRadius: 22 },
  personAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personAvatarText: { fontSize: 16, fontWeight: '800' },
  personInfo: { flex: 1, marginLeft: 12, minWidth: 0 },
  personName: { fontSize: 15, fontWeight: '600' },
  personMeta: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  personAmountWrap: { alignItems: 'flex-end', maxWidth: 150 },
  personAmount: { fontSize: 16, fontWeight: '800', maxWidth: '100%' },
  personAction: { fontSize: 11, fontWeight: '700', marginTop: 3 },

  // Expense Row
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === 'web'
      ? { cursor: 'pointer', transition: 'background-color 0.15s ease' }
      : {}),
  } as any,
  expenseEmoji: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: { flex: 1, marginLeft: 12, marginRight: 12, minWidth: 0 },
  expenseTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  expenseMeta: { fontSize: 11, fontWeight: '500' },
  expenseAmount: { fontSize: 14, fontWeight: '700', maxWidth: 140 },

  // Categories
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 100,
  },
  categoryEmoji: { fontSize: 18 },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryRight: { flex: 1 },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    maxWidth: '100%',
  },
  categoryBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 3 },

  // Achievements
  achievementsScroll: { gap: 12, paddingVertical: 4 },
  achievementCard: {
    width: 130,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  achievementIcon: { fontSize: 32 },
  achievementName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  achievementTier: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  } as any,
  emptyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
