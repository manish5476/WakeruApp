import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  RefreshControl,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import GlobalLoader from '../../../components/common/GlobalLoader';
import { useDashboard } from '../../../hooks/useDashboard';
import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { useResponsive } from '../../../hooks/useResponsive';
import { haptics } from '../../../utils/haptics';
import { safeFormatCurrency } from '../../../utils/formatters';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Avatar } from '../../../components/ui/Avatar';
import { AvatarGroup } from '../../../components/ui/AvatarGroup';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SimpleBarChart } from '../../../components/charts/SimpleBarChart';
import AppIcon from '../../../components/common/AppIcon';
import type { Theme } from '../../../theme';

// ============================================================
// CONSTANTS
// ============================================================

const CATEGORY_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string; label: string }
> = {
  food: {
    icon: 'utensils',
    color: '#F43F5E',
    bg: '#FFE4E6',
    label: 'Food & Dining',
  },
  stay: {
    icon: 'hotel',
    color: '#10B981',
    bg: '#ECFDF5',
    label: 'Accommodation',
  },
  transport: {
    icon: 'car',
    color: '#06B6D4',
    bg: '#CFFAFE',
    label: 'Transport',
  },
  activity: {
    icon: 'zap',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    label: 'Activities',
  },
  shopping: {
    icon: 'shopping-bag',
    color: '#F59E0B',
    bg: '#FEF3C7',
    label: 'Shopping',
  },
  health: {
    icon: 'heart-pulse',
    color: '#EF4444',
    bg: '#FEE2E2',
    label: 'Health',
  },
  bills: { icon: 'file-text', color: '#6366F1', bg: '#EEF2FF', label: 'Bills' },
  other: { icon: 'tag', color: '#71717A', bg: '#F4F4F5', label: 'Other' },
};

const ACTION_CONFIG = [
  {
    id: 'expense',
    icon: 'plus-circle',
    label: 'Add Expense',
    sub: 'Log cost',
    route: '/(app)/expenses/new',
    gradient: ['#F43F5E', '#E11D48'],
  },
  {
    id: 'trip',
    icon: 'map',
    label: 'New Trip',
    sub: 'Plan trip',
    route: '/(app)/create-trip',
    gradient: ['#38BDF8', '#2563EB'],
  },
  {
    id: 'settle',
    icon: 'check-circle',
    label: 'Settle Up',
    sub: 'Balances',
    route: '/(app)/settlements',
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'analytics',
    icon: 'bar-chart-2',
    label: 'Analytics',
    sub: 'Reports',
    route: '/(app)/analytics',
    gradient: ['#8B5CF6', '#6D28D9'],
  },
];

// ============================================================
// HELPERS
// ============================================================

function getGreeting(): { emoji: string; text: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { emoji: '🌙', text: 'Good Night' };
  if (hour < 12) return { emoji: '🌅', text: 'Good Morning' };
  if (hour < 17) return { emoji: '☀️', text: 'Good Afternoon' };
  if (hour < 21) return { emoji: '🌇', text: 'Good Evening' };
  return { emoji: '🌙', text: 'Good Night' };
}

function formatDateRange(start?: string, end?: string): string {
  try {
    if (!start || !end) return '';
    return `${format(new Date(start), 'MMM d')} – ${format(new Date(end), 'MMM d')}`;
  } catch {
    return '';
  }
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function SectionHeader({
  icon,
  title,
  badge,
  action,
  onAction,
}: {
  icon: string;
  title: string;
  badge?: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={sectionStyles(theme).header}>
      <View style={sectionStyles(theme).left}>
        <View
          style={[
            sectionStyles(theme).iconWrap,
            { backgroundColor: `${theme.colors.primary}12` },
          ]}
        >
          <AppIcon name={icon as any} size={15} color={theme.colors.primary} />
        </View>
        <Text
          style={[
            sectionStyles(theme).title,
            { color: theme.colors.textPrimary },
          ]}
        >
          {title}
        </Text>
        {badge && (
          <View
            style={[
              sectionStyles(theme).badge,
              { backgroundColor: `${theme.colors.primary}15` },
            ]}
          >
            <Text
              style={[
                sectionStyles(theme).badgeText,
                { color: theme.colors.primary },
              ]}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
      {action && onAction && (
        <Pressable
          onPress={onAction}
          style={sectionStyles(theme).actionBtn}
          hitSlop={6}
        >
          <Text
            style={[
              sectionStyles(theme).actionText,
              { color: theme.colors.primary },
            ]}
          >
            {action}
          </Text>
          <AppIcon name="arrow-right" size={13} color={theme.colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

function ExecutiveBalanceCard({
  totalOwed,
  totalLent,
  netBalance,
  currency,
}: {
  totalOwed: number;
  totalLent: number;
  netBalance: number;
  currency: string;
}) {
  const isPositive = netBalance >= 0;
  const isZero = netBalance === 0;
  const cs = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€';

  return (
    <LinearGradient
      colors={['#0F172A', '#1E1B4B', '#1E293B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={balanceStyles.card}
    >
      {/* Top Net Balance Block */}
      <View style={balanceStyles.topRow}>
        <View>
          <Text style={balanceStyles.label}>OVERALL NET BALANCE</Text>
          <Text
            style={[
              balanceStyles.netValue,
              {
                color: isZero ? '#FFFFFF' : isPositive ? '#34D399' : '#F87171',
              },
            ]}
          >
            {isZero ? '' : isPositive ? '+' : '−'}
            {cs}
            {Math.abs(netBalance).toLocaleString('en-IN')}
          </Text>
          <Text style={balanceStyles.subText}>
            {isZero
              ? 'All balances settled up'
              : isPositive
                ? 'You are owed in total'
                : 'You owe in total'}
          </Text>
        </View>

        <View
          style={[
            balanceStyles.statusTag,
            {
              backgroundColor: isPositive
                ? 'rgba(16,185,129,0.2)'
                : 'rgba(239,68,68,0.2)',
            },
          ]}
        >
          <AppIcon
            name={isPositive ? 'arrow-up-right' : 'arrow-down-left'}
            size={14}
            color={isPositive ? '#10B981' : '#EF4444'}
          />
          <Text
            style={[
              balanceStyles.statusTagText,
              { color: isPositive ? '#10B981' : '#EF4444' },
            ]}
          >
            {isZero ? 'Settled' : isPositive ? 'In Credit' : 'In Debt'}
          </Text>
        </View>
      </View>

      {/* Dual Bottom Split Metrics */}
      <View style={balanceStyles.statsSplitRow}>
        <View style={balanceStyles.statTile}>
          <View
            style={[balanceStyles.statDot, { backgroundColor: '#EF4444' }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={balanceStyles.statLabel}>YOU OWE</Text>
            <Text style={[balanceStyles.statAmount, { color: '#FCA5A5' }]}>
              {cs}
              {totalOwed.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={balanceStyles.statDivider} />

        <View style={balanceStyles.statTile}>
          <View
            style={[balanceStyles.statDot, { backgroundColor: '#10B981' }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={balanceStyles.statLabel}>OWED TO YOU</Text>
            <Text style={[balanceStyles.statAmount, { color: '#6EE7B7' }]}>
              {cs}
              {totalLent.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

function TripCardHorizontal({
  trip,
  onPress,
  isRecent,
}: {
  trip: any;
  onPress: () => void;
  isRecent?: boolean;
}) {
  const theme = useTheme();
  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  const daysLeft =
    trip.daysLeft ??
    Math.ceil(
      (new Date(trip.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
  const isEnded = isRecent || daysLeft <= 0;
  const memberAvatars = (trip.memberPreviews || [])
    .map((m: any) => m.photoURL || '')
    .filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        tripStyles(theme).card,
        { backgroundColor: theme.colors.surface },
        pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
      ]}
    >
      <View style={tripStyles(theme).imageWrap}>
        <Image
          source={{
            uri:
              trip.coverImage ||
              `https://picsum.photos/seed/${trip.tripId}/400/300`,
          }}
          style={tripStyles(theme).image}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={tripStyles(theme).badge}>
          <Badge
            label={
              isEnded
                ? 'Completed'
                : daysLeft === 0
                  ? 'Last day'
                  : `${daysLeft}d left`
            }
            variant={
              isEnded ? 'neutral' : daysLeft <= 3 ? 'warning' : 'success'
            }
          />
        </View>

        <View style={tripStyles(theme).imageOverlay}>
          <Text style={tripStyles(theme).tripTitle} numberOfLines={1}>
            {trip.title}
          </Text>
          {dateRange ? (
            <Text style={tripStyles(theme).tripDates} numberOfLines={1}>
              {dateRange}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={tripStyles(theme).footer}>
        <View style={tripStyles(theme).stat}>
          <Text
            style={[
              tripStyles(theme).statLabel,
              { color: theme.colors.textTertiary },
            ]}
          >
            SPENT
          </Text>
          <Text
            style={[
              tripStyles(theme).statValue,
              { color: theme.colors.textPrimary },
            ]}
          >
            ₹{(trip.totalSpent || 0).toLocaleString('en-IN')}
          </Text>
        </View>

        <View
          style={[
            tripStyles(theme).divider,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.05)',
            },
          ]}
        />

        <View style={tripStyles(theme).stat}>
          <Text
            style={[
              tripStyles(theme).statLabel,
              { color: theme.colors.textTertiary },
            ]}
          >
            CREW
          </Text>
          {memberAvatars.length > 0 ? (
            <AvatarGroup urls={memberAvatars} max={3} size={20} />
          ) : (
            <Text
              style={[
                tripStyles(theme).statValue,
                { color: theme.colors.textPrimary },
              ]}
            >
              {trip.memberCount || 1}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function ExpenseRow({
  expense,
  onPress,
}: {
  expense: any;
  onPress: () => void;
}) {
  const theme = useTheme();
  const cat = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
  const isYouPaid = expense.direction === 'you_paid';

  let dateLabel = '';
  try {
    dateLabel = format(new Date(expense.date), 'MMM d');
  } catch {
    /* noop */
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        expenseStyles(theme).row,
        pressed && {
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(0,0,0,0.02)',
        },
      ]}
    >
      <View
        style={[
          expenseStyles(theme).iconWrap,
          { backgroundColor: `${cat.color}15` },
        ]}
      >
        <AppIcon name={cat.icon as any} size={16} color={cat.color} />
      </View>

      <View style={expenseStyles(theme).info}>
        <Text
          style={[
            expenseStyles(theme).title,
            { color: theme.colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {expense.title}
        </Text>
        <View style={expenseStyles(theme).meta}>
          <Text
            style={[
              expenseStyles(theme).metaText,
              { color: theme.colors.textTertiary },
            ]}
          >
            {expense.tripTitle || 'Trip'} · {dateLabel}
          </Text>
          <View
            style={[
              expenseStyles(theme).dot,
              { backgroundColor: theme.colors.textTertiary },
            ]}
          />
          <Text
            style={[
              expenseStyles(theme).metaTag,
              { color: isYouPaid ? '#10B981' : '#EF4444' },
            ]}
          >
            {isYouPaid ? 'You paid' : `${expense.paidByName || 'Other'} paid`}
          </Text>
        </View>
      </View>

      <Text
        style={[
          expenseStyles(theme).amount,
          { color: isYouPaid ? '#10B981' : theme.colors.textPrimary },
        ]}
      >
        {isYouPaid ? '+' : ''}₹
        {(expense.amountBase || expense.amountLocal || 0).toLocaleString(
          'en-IN',
        )}
      </Text>
    </Pressable>
  );
}

function CategoryBreakdown({ categories }: { categories: any[] }) {
  const theme = useTheme();

  return (
    <View
      style={[
        categoryStyles(theme).card,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <SectionHeader icon="pie-chart" title="Spending Breakdown" />

      <View style={categoryStyles(theme).list}>
        {categories.slice(0, 6).map((cat, i) => {
          const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.other;
          return (
            <View
              key={cat.category}
              style={[
                categoryStyles(theme).row,
                i < categories.length - 1 && categoryStyles(theme).rowBorder,
              ]}
            >
              <View
                style={[
                  categoryStyles(theme).iconAura,
                  { backgroundColor: `${config.color}15` },
                ]}
              >
                <AppIcon
                  name={config.icon as any}
                  size={15}
                  color={config.color}
                />
              </View>

              <View style={categoryStyles(theme).info}>
                <View style={categoryStyles(theme).topInfo}>
                  <Text
                    style={[
                      categoryStyles(theme).catLabel,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {config.label}
                  </Text>
                  <Text
                    style={[
                      categoryStyles(theme).catAmount,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    ₹{(cat.totalAmount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <ProgressBar
                  progress={cat.percentage / 100}
                  height={5}
                  variant={i === 0 ? 'accent' : 'default'}
                  animated
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PendingActions({ actions }: { actions: any[] }) {
  const theme = useTheme();
  const { isMobile } = useResponsive();

  if (!actions || actions.length === 0) return null;

  const getRoute = (actionType: string) => {
    switch (actionType) {
      case 'view_settlements':
        return '/(app)/settlements';
      case 'view_you_owe':
        return '/(app)/balances';
      case 'view_analytics':
        return '/(app)/analytics';
      default:
        return '/(app)/settlements';
    }
  };

  return (
    <View style={actionStyles(theme).container}>
      <View
        style={[
          actionStyles(theme).innerCard,
          { backgroundColor: theme.colors.surface },
          !isMobile && actionStyles(theme).desktopRow,
        ]}
      >
        {actions.map((action, i) => (
          <Pressable
            key={i}
            onPress={() => router.push(getRoute(action.actionType) as any)}
            style={({ pressed }) => [
              actionStyles(theme).item,
              pressed && { opacity: 0.8 },
            ]}
          >
            <View
              style={[
                actionStyles(theme).iconBox,
                {
                  backgroundColor:
                    action.priority === 'urgent'
                      ? 'rgba(239,68,68,0.12)'
                      : 'rgba(245,158,11,0.12)',
                },
              ]}
            >
              <AppIcon
                name={action.priority === 'urgent' ? 'alert-triangle' : 'bell'}
                size={16}
                color={action.priority === 'urgent' ? '#EF4444' : '#D97706'}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  actionStyles(theme).itemTitle,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {action.title}
              </Text>
              <Text
                style={[
                  actionStyles(theme).itemMessage,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {action.message}
              </Text>
            </View>

            {action.count > 0 && (
              <Badge
                label={action.count.toString()}
                variant={action.priority === 'urgent' ? 'danger' : 'warning'}
              />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ============================================================
// MAIN DASHBOARD SCREEN
// ============================================================

export default function DashboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((s: any) => s.user);
  const firstName = user?.displayName?.split(' ')[0] || 'Traveler';

  const greeting = getGreeting();
  const { data: dashboardData, isLoading, refetch } = useDashboard();
  const data = (dashboardData as any)?.data || dashboardData || {};

  const balances = data?.balances || {};
  const monthlyTrend = data?.monthlyTrend || [];
  const categories = data?.categories || [];
  const activeTrips = data?.activeTrips || [];
  const recentlyCompleted = data?.recentlyCompleted || [];
  const recentExpenses = data?.recentExpenses || [];
  const pendingActions = data?.pendingActions || [];
  const quickStats = data?.quickStats || {};

  const totalOwed = balances?.totalOwed || 0;
  const totalLent = balances?.totalLent || 0;
  const netBalance = balances?.netBalance || 0;
  const baseCurrency = balances?.baseCurrency || 'INR';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <GlobalBackground>
        <View style={mainStyles(theme).loadingContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[
              mainStyles(theme).loadingText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Loading your dashboard…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  const hasNoData =
    recentExpenses.length === 0 &&
    activeTrips.length === 0 &&
    recentlyCompleted.length === 0 &&
    totalOwed === 0 &&
    totalLent === 0;

  return (
    <View style={mainStyles(theme).root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      <ScrollView
        style={mainStyles(theme).scroll}
        contentContainerStyle={[
          mainStyles(theme).scrollContent,
          {
            paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10,
            paddingBottom: insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View
          style={[
            mainStyles(theme).container,
            isDesktop && mainStyles(theme).desktopContainer,
          ]}
        >
          {/* ── TOP GREETING & PROFILE HUB ─────── */}
          <View style={mainStyles(theme).header}>
            <View>
              <Text
                style={[
                  mainStyles(theme).greetingSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {greeting.text} {greeting.emoji}
              </Text>
              <Text
                style={[
                  mainStyles(theme).greetingName,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {firstName}
              </Text>
            </View>

            <View style={mainStyles(theme).headerActions}>
              <Pressable
                onPress={onRefresh}
                style={({ pressed }) => [
                  mainStyles(theme).iconBtn,
                  { backgroundColor: theme.colors.surface },
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
              >
                <AppIcon
                  name="refresh-cw"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </Pressable>

              <Pressable
                onPress={() => router.push('/(app)/profile' as any)}
                style={({ pressed }) => pressed && { opacity: 0.8 }}
              >
                <Avatar
                  url={user?.photoURL || undefined}
                  fallback={firstName.charAt(0)}
                  size="md"
                  online
                />
              </Pressable>
            </View>
          </View>

          {/* ── PENDING ACTIONS ALERT ──────────── */}
          <PendingActions actions={pendingActions} />

          {/* ── BENTO TOP: BALANCE COMMAND + QUICK ACTIONS ── */}
          <View
            style={[
              mainStyles(theme).bentoTopCluster,
              !isDesktop && mainStyles(theme).stackLayout,
            ]}
          >
            {/* Balance Executive Tile */}
            <View
              style={[
                mainStyles(theme).balanceBlock,
                isDesktop && { flex: 1.4 },
              ]}
            >
              <ExecutiveBalanceCard
                totalOwed={totalOwed}
                totalLent={totalLent}
                netBalance={netBalance}
                currency={baseCurrency}
              />
            </View>

            {/* 4 Quick Actions Bento Grid */}
            <View
              style={[
                mainStyles(theme).quickActionsBlock,
                isDesktop && { flex: 1 },
              ]}
            >
              <View style={mainStyles(theme).quickGrid}>
                {ACTION_CONFIG.map(action => (
                  <Pressable
                    key={action.id}
                    onPress={() => {
                      haptics.light();
                      router.push(action.route as any);
                    }}
                    style={({ pressed }) => [
                      mainStyles(theme).quickTile,
                      { backgroundColor: theme.colors.surface },
                      pressed && {
                        opacity: 0.85,
                        transform: [{ scale: 0.98 }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={action.gradient as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={mainStyles(theme).quickIconWrap}
                    >
                      <AppIcon
                        name={action.icon as any}
                        size={18}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          mainStyles(theme).quickLabel,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {action.label}
                      </Text>
                      <Text
                        style={[
                          mainStyles(theme).quickSub,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        {action.sub}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* ── EXPEDITIONS CAROUSEL ───────────── */}
          {(activeTrips.length > 0 || recentlyCompleted.length > 0) && (
            <View style={mainStyles(theme).section}>
              <SectionHeader
                icon="map-pin"
                title={
                  activeTrips.length > 0 ? 'Active Expeditions' : 'Recent Trips'
                }
                badge={(activeTrips.length > 0
                  ? activeTrips.length
                  : recentlyCompleted.length
                ).toString()}
                action="View All"
                onAction={() => router.push('/(app)/(tabs)/home' as any)}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={mainStyles(theme).tripScrollList}
              >
                {(activeTrips.length > 0 ? activeTrips : recentlyCompleted).map(
                  (trip: any) => (
                    <View key={trip.tripId} style={mainStyles(theme).tripSlide}>
                      <TripCardHorizontal
                        trip={trip}
                        onPress={() =>
                          router.push(`/(app)/trips/${trip.tripId}` as any)
                        }
                        isRecent={activeTrips.length === 0}
                      />
                    </View>
                  ),
                )}
              </ScrollView>
            </View>
          )}

          {/* ── 2-COLUMN DESKTOP SPLIT / STACK ON MOBILE ── */}
          <View
            style={[
              mainStyles(theme).bentoSplit,
              isDesktop && mainStyles(theme).desktopSplit,
            ]}
          >
            {/* Left Column: Spending Trend & Recent Transactions */}
            <View
              style={[mainStyles(theme).column, isDesktop && { flex: 1.3 }]}
            >
              {monthlyTrend.length > 0 && (
                <View
                  style={[
                    mainStyles(theme).cardPanel,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <SectionHeader
                    icon="trending-up"
                    title="Monthly Spending Trend"
                  />
                  <SimpleBarChart
                    data={monthlyTrend.slice(-6).map((m: any) => ({
                      label: m.monthName || m.month?.slice(5) || '',
                      value: m.total || 0,
                      color: theme.colors.primary,
                    }))}
                    height={160}
                  />
                </View>
              )}

              {recentExpenses.length > 0 && (
                <View
                  style={[
                    mainStyles(theme).cardPanel,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <SectionHeader
                    icon="file-text"
                    title="Recent Activity"
                    action="View All"
                    onAction={() =>
                      router.push('/(app)/(tabs)/expenses' as any)
                    }
                  />
                  <View style={mainStyles(theme).expenseList}>
                    {recentExpenses
                      .slice(0, 6)
                      .map((expense: any, i: number) => (
                        <ExpenseRow
                          key={expense._id || i}
                          expense={expense}
                          onPress={() =>
                            expense._id &&
                            router.push(`/(app)/expenses/${expense._id}` as any)
                          }
                        />
                      ))}
                  </View>
                </View>
              )}
            </View>

            {/* Right Column: Category Breakdown & Quick Stats */}
            <View style={[mainStyles(theme).column, isDesktop && { flex: 1 }]}>
              {categories.length > 0 && (
                <CategoryBreakdown categories={categories} />
              )}

              {quickStats.favoriteBuddy && (
                <View
                  style={[
                    mainStyles(theme).cardPanel,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <SectionHeader
                    icon="users"
                    title="Travel Companion Highlight"
                  />
                  <View style={mainStyles(theme).buddyCard}>
                    <Avatar
                      url={quickStats.favoriteBuddy.photoURL || undefined}
                      fallback={
                        quickStats.favoriteBuddy.displayName?.charAt(0) || '?'
                      }
                      size="md"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          mainStyles(theme).buddyName,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {quickStats.favoriteBuddy.displayName}
                      </Text>
                      <Text
                        style={[
                          mainStyles(theme).buddySub,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Most frequent expense collaborator
                      </Text>
                    </View>
                  </View>

                  {quickStats.mostExpensiveTrip && (
                    <View style={mainStyles(theme).topTripCard}>
                      <Text
                        style={[
                          mainStyles(theme).topTripLabel,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        HIGHEST EXPENDITURE TRIP
                      </Text>
                      <Text
                        style={[
                          mainStyles(theme).topTripTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {quickStats.mostExpensiveTrip.title}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* ── EMPTY STATE ──────────────────────── */}
          {hasNoData && (
            <EmptyState
              icon="🚀"
              title="Start Your Journey"
              description="Create a trip and invite friends to start tracking expenses together effortlessly."
              actionLabel="Create Your First Trip"
              onAction={() => router.push('/(app)/create-trip' as any)}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

function mainStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    loadingText: { fontSize: 13, fontWeight: '600' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16 },
    container: { width: '100%', gap: 16 },
    desktopContainer: {
      maxWidth: 1400,
      alignSelf: 'center',
      paddingHorizontal: 20,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    greetingSub: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    greetingName: {
      fontSize: 26,
      fontWeight: '900',
      letterSpacing: -0.6,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },

    // Bento Top Cluster
    bentoTopCluster: {
      flexDirection: 'row',
      gap: 14,
    },
    stackLayout: {
      flexDirection: 'column',
    },
    balanceBlock: {
      width: '100%',
    },
    quickActionsBlock: {
      width: '100%',
    },
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      height: '100%',
    },
    quickTile: {
      flex: 1,
      minWidth: 140,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
    quickIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickLabel: {
      fontSize: 12,
      fontWeight: '800',
    },
    quickSub: {
      fontSize: 10,
      fontWeight: '500',
      marginTop: 1,
    },

    // Trips Carousel
    section: {
      gap: 12,
    },
    tripScrollList: {
      gap: 12,
    },
    tripSlide: {
      width: 280,
    },

    // Bento Split Layout
    bentoSplit: {
      gap: 14,
    },
    desktopSplit: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    column: {
      gap: 14,
      width: '100%',
    },
    cardPanel: {
      padding: 18,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
    expenseList: {
      gap: 6,
    },

    // Buddy Highlight
    buddyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.background,
    },
    buddyName: {
      fontSize: 13,
      fontWeight: '800',
    },
    buddySub: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
    },
    topTripCard: {
      marginTop: 10,
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.background,
      gap: 2,
    },
    topTripLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    topTripTitle: {
      fontSize: 13,
      fontWeight: '800',
    },
  });
}

const balanceStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 20,
    justifyContent: 'space-between',

    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.15)',
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

    gap: 16,
    height: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.6)',
  },
  netValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statsSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.6)',
  },
  statAmount: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 12,
  },
});

function sectionStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    badge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '800',
    },
  });
}

function tripStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
    imageWrap: {
      height: 130,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    badge: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    imageOverlay: {
      position: 'absolute',
      bottom: 10,
      left: 12,
      right: 12,
    },
    tripTitle: {
      fontSize: 15,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    tripDates: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
      marginTop: 2,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    stat: {
      flex: 1,
      gap: 2,
    },
    statLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    statValue: {
      fontSize: 13,
      fontWeight: '900',
    },
    divider: {
      width: 1,
      height: 24,
      marginHorizontal: 8,
    },
  });
}

function expenseStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      gap: 10,
      borderRadius: 14,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 13,
      fontWeight: '800',
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 11,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
    },
    metaTag: {
      fontSize: 10,
      fontWeight: '700',
    },
    amount: {
      fontSize: 13,
      fontWeight: '900',
    },
  });
}

function categoryStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
    list: {
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 4,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.03)',
      paddingBottom: 8,
    },
    iconAura: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
      gap: 4,
    },
    topInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    catLabel: {
      fontSize: 12,
      fontWeight: '700',
    },
    catAmount: {
      fontSize: 12,
      fontWeight: '800',
    },
  });
}

function actionStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    innerCard: {
      borderRadius: 18,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      gap: 8,
    },
    desktopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    item: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 6,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemTitle: {
      fontSize: 12,
      fontWeight: '800',
    },
    itemMessage: {
      fontSize: 11,
      fontWeight: '500',
    },
  });
}
// import GlobalLoader from '../../../components/common/GlobalLoader';
// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   StyleSheet,
//   ScrollView,
//   Platform,
//   Pressable,
//   RefreshControl,
//   Image,
// } from 'react-native';
// import { router } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { format } from 'date-fns';

// import { useDashboard } from '../../../hooks/useDashboard';
// import { useTheme } from '../../../providers/ThemeProvider';
// import { useAuthStore } from '../../../stores/auth.store';
// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import { Typography } from '../../../components/ui/Typography';
// import { AmountDisplay } from '../../../components/ui/AmountDisplay';
// import { ProgressBar } from '../../../components/ui/ProgressBar';
// import { Avatar } from '../../../components/ui/Avatar';
// import { AvatarGroup } from '../../../components/ui/AvatarGroup';
// import { Badge } from '../../../components/ui/Badge';
// import { EmptyState } from '../../../components/ui/EmptyState';
// import { SimpleBarChart } from '../../../components/charts/SimpleBarChart';
// import { InteractiveWrapper } from '../../../components/ui/InteractiveWrapper';
// import { useResponsive } from '../../../hooks/useResponsive';
// import type { Theme } from '../../../theme';

// // ============================================================
// // CONSTANTS (Aligned with new premium palette)
// // ============================================================

// const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
//   food: { icon: '🍽️', color: '#F43F5E', label: 'Food & Dining' },   // rose 500
//   stay: { icon: '🏨', color: '#10B981', label: 'Accommodation' },    // green 500
//   transport: { icon: '🚗', color: '#06B6D4', label: 'Transport' },   // cyan 500
//   activity: { icon: '🎯', color: '#8B5CF6', label: 'Activities' },   // violet 500
//   shopping: { icon: '🛍️', color: '#D4A03C', label: 'Shopping' },    // gold 500
//   health: { icon: '💊', color: '#F43F5E', label: 'Health' },         // rose 500
//   other: { icon: '📌', color: '#71717A', label: 'Other' },           // neutral 500
// };

// const TIER_CONFIG: Record<string, { color: string; glow: string }> = {
//   bronze: { color: '#B45309', glow: 'rgba(180, 83, 9, 0.3)' },    // amber 700
//   silver: { color: '#71717A', glow: 'rgba(113, 113, 122, 0.3)' },  // neutral 500
//   gold: { color: '#D4A03C', glow: 'rgba(212, 160, 60, 0.4)' },     // gold 500
// };

// const ACTION_CONFIG = [
//   { id: 'expense', icon: '💳', label: 'Add Expense', route: '/(app)/expenses/new', gradient: 'success' as const },
//   { id: 'trip', icon: '✈️', label: 'New Trip', route: '/(app)/create-trip', gradient: 'ocean' as const },
//   { id: 'settle', icon: '🤝', label: 'Settle Up', route: '/(app)/settlements', gradient: 'gold' as const },
//   { id: 'analytics', icon: '📊', label: 'Analytics', route: '/(app)/analytics', gradient: 'aurora' as const },
// ];

// // ============================================================
// // HELPERS
// // ============================================================

// function getGreeting(): { emoji: string; text: string } {
//   const hour = new Date().getHours();
//   if (hour < 6) return { emoji: '🌙', text: 'Good Night' };
//   if (hour < 12) return { emoji: '🌅', text: 'Good Morning' };
//   if (hour < 17) return { emoji: '☀️', text: 'Good Afternoon' };
//   if (hour < 21) return { emoji: '🌇', text: 'Good Evening' };
//   return { emoji: '🌙', text: 'Good Night' };
// }

// function formatDateRange(start?: string, end?: string): string {
//   try {
//     if (!start || !end) return '';
//     return `${format(new Date(start), 'MMM d')} – ${format(new Date(end), 'MMM d')}`;
//   } catch {
//     return '';
//   }
// }

// // ============================================================
// // SUB-COMPONENTS
// // ============================================================

// function SectionHeader({
//   icon,
//   title,
//   badge,
//   action,
//   onAction,
// }: {
//   icon: string;
//   title: string;
//   badge?: string;
//   action?: string;
//   onAction?: () => void;
// }) {
//   const theme = useTheme();
//   return (
//     <View style={sectionStyles(theme).header}>
//       <View style={sectionStyles(theme).left}>
//         <Typography variant="body" style={{ fontSize: 18 }}>{icon}</Typography>
//         <Typography variant="h3" weight="bold" color="textPrimary">{title}</Typography>
//         {badge && <Badge label={badge} variant="accent" />}
//       </View>
//       {action && onAction && (
//         <InteractiveWrapper onPress={onAction} hoverElevation={false}>
//           <View style={sectionStyles(theme).actionBtn}>
//             <Typography variant="bodySm" weight="bold" color="primary">
//               {action} →
//             </Typography>
//           </View>
//         </InteractiveWrapper>
//       )}
//     </View>
//   );
// }

// function TripCardHorizontal({ trip, onPress, isRecent }: { trip: any; onPress: () => void; isRecent?: boolean }) {
//   const theme = useTheme();
//   const styles = tripStyles(theme);
//   const dateRange = formatDateRange(trip.startDate, trip.endDate);
//   const daysLeft = trip.daysLeft ?? Math.ceil((new Date(trip.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
//   const isEnded = isRecent || daysLeft <= 0;

//   const memberAvatars = (trip.memberPreviews || []).map((m: any) => m.photoURL || '').filter(Boolean);

//   return (
//     <InteractiveWrapper onPress={onPress} hoverElevation>
//       <GlassCard variant="medium" padding="none" style={styles.inner}>
//         <View style={styles.imageWrap}>
//           <Image
//             source={{ uri: trip.coverImage || `https://picsum.photos/seed/${trip.tripId}/400/300` }}
//             style={styles.image}
//             resizeMode="cover"
//           />
//           <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />

//           <View style={styles.badge}>
//             <Badge
//               label={isEnded ? 'Completed' : daysLeft === 0 ? 'Last day' : `${daysLeft}d left`}
//               variant={isEnded ? 'info' : daysLeft <= 3 ? 'warning' : 'success'}
//             />
//           </View>

//           <View style={styles.overlay}>
//             <Typography variant="h3" weight="extrabold" color="textInverse" numberOfLines={1}>
//               {trip.title}
//             </Typography>
//             {dateRange ? (
//               <Typography variant="caption" weight="medium" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
//                 {dateRange}
//               </Typography>
//             ) : null}
//           </View>
//         </View>

//         <View style={styles.footer}>
//           <View style={styles.stat}>
//             <Typography variant="caption" color="textTertiary" weight="semibold">SPENT</Typography>
//             <AmountDisplay amount={trip.totalSpent || 0} currency="INR" size="sm" compact />
//           </View>
//           <View style={styles.divider} />
//           <View style={styles.stat}>
//             <Typography variant="caption" color="textTertiary" weight="semibold">MEMBERS</Typography>
//             {memberAvatars.length > 0 ? (
//               <AvatarGroup urls={memberAvatars} max={3} size={20} />
//             ) : (
//               <Typography variant="bodySm" weight="bold" color="textPrimary">
//                 {trip.memberCount || 1}
//               </Typography>
//             )}
//           </View>
//           <View style={styles.divider} />
//           <View style={styles.stat}>
//             <Typography variant="caption" color="textTertiary" weight="semibold">STATUS</Typography>
//             <Typography variant="bodySm" weight="bold" color={isEnded ? 'textSecondary' : 'success'}>
//               {isEnded ? 'Ended' : 'Active'}
//             </Typography>
//           </View>
//         </View>
//       </GlassCard>
//     </InteractiveWrapper>
//   );
// }

// function ExpenseRow({ expense, onPress }: { expense: any; onPress: () => void }) {
//   const theme = useTheme();
//   const styles = expenseRowStyles(theme);
//   const cat = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
//   const isYouPaid = expense.direction === 'you_paid';

//   let dateLabel = '';
//   try { dateLabel = format(new Date(expense.date), 'MMM d'); } catch { /* noop */ }

//   return (
//     <InteractiveWrapper onPress={onPress} hoverElevation={false}>
//       <View style={styles.row}>
//         <View style={[styles.iconWrap, { backgroundColor: `${cat.color}18` }]}>
//           <Typography variant="body">{cat.icon}</Typography>
//         </View>

//         <View style={styles.info}>
//           <Typography variant="body" weight="semibold" color="textPrimary" numberOfLines={1}>
//             {expense.title}
//           </Typography>
//           <View style={styles.meta}>
//             <Typography variant="caption" color="textTertiary">
//               {expense.tripTitle || 'Trip'} · {dateLabel}
//             </Typography>
//             <View style={styles.dot} />
//             <Typography variant="caption" weight="semibold" color={isYouPaid ? 'success' : 'danger'}>
//               {isYouPaid ? 'You paid' : `${expense.paidByName || 'Other'} paid`}
//             </Typography>
//           </View>
//         </View>

//         <AmountDisplay
//           amount={expense.amountBase || expense.amountLocal || 0}
//           currency="INR"
//           size="sm"
//           compact
//           variant={isYouPaid ? 'positive' : 'default'}
//         />
//       </View>
//     </InteractiveWrapper>
//   );
// }

// function CategoryBreakdown({ categories }: { categories: any[] }) {
//   const theme = useTheme();
//   const styles = categoryStyles(theme);

//   return (
//     <GlassCard variant="medium" padding="lg" style={styles.card}>
//       <Typography variant="overline" color="textTertiary" weight="semibold" style={{ marginBottom: 16 }}>
//         SPENDING BREAKDOWN
//       </Typography>

//       {categories.slice(0, 6).map((cat, i) => {
//         const config = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.other;
//         return (
//           <View key={cat.category} style={[styles.row, i < categories.length - 1 && styles.rowBorder]}>
//             <View style={styles.iconWrap}>
//               <View style={[styles.iconBg, { backgroundColor: `${config.color}18` }]}>
//                 <Typography variant="bodySm">{config.icon}</Typography>
//               </View>
//             </View>
//             <View style={styles.info}>
//               <View style={styles.infoTop}>
//                 <Typography variant="bodySm" weight="semibold" color="textPrimary">
//                   {config.label}
//                 </Typography>
//                 <AmountDisplay amount={cat.totalAmount} currency="INR" size="sm" compact />
//               </View>
//               <ProgressBar progress={cat.percentage / 100} height={4} variant={i === 0 ? 'accent' : 'default'} animated />
//             </View>
//           </View>
//         );
//       })}
//     </GlassCard>
//   );
// }

// function BalanceSummary({ totalOwed, totalLent, netBalance, currency }: { totalOwed: number; totalLent: number; netBalance: number; currency: string; }) {
//   const theme = useTheme();
//   const styles = balanceStyles(theme);
//   const isPositive = netBalance >= 0;

//   return (
//     <GlassCard variant="prominent" padding="lg" style={styles.card}>
//       <View style={styles.hero}>
//         <Typography variant="overline" color="textTertiary" weight="semibold">NET BALANCE</Typography>
//         <AmountDisplay amount={Math.abs(netBalance)} currency={currency} size="xl" variant={isPositive ? 'positive' : 'negative'} showSign />
//         <Typography variant="caption" color="textTertiary" weight="medium">
//           {isPositive ? "You're owed overall" : 'You owe overall'}
//         </Typography>
//       </View>

//       <View style={styles.splitBar}>
//         <View style={styles.splitRow}>
//           <View style={styles.splitLeft}>
//             <View style={[styles.splitDot, { backgroundColor: theme.colors.danger }]} />
//             <Typography variant="bodySm" weight="semibold" color="textSecondary">You owe</Typography>
//           </View>
//           <AmountDisplay amount={totalOwed} currency={currency} size="sm" compact variant="negative" />
//         </View>
//         <View style={styles.splitRow}>
//           <View style={styles.splitLeft}>
//             <View style={[styles.splitDot, { backgroundColor: theme.colors.success }]} />
//             <Typography variant="bodySm" weight="semibold" color="textSecondary">Owed to you</Typography>
//           </View>
//           <AmountDisplay amount={totalLent} currency={currency} size="sm" compact variant="positive" />
//         </View>
//       </View>
//     </GlassCard>
//   );
// }

// function PendingActions({ actions }: { actions: any[] }) {
//   const theme = useTheme();
//   const { isMobile } = useResponsive();

//   if (!actions || actions.length === 0) return null;

//   const getRoute = (actionType: string) => {
//     switch (actionType) {
//       case 'view_settlements': return '/(app)/settlements';
//       case 'view_you_owe': return '/(app)/balances';
//       case 'view_analytics': return '/(app)/analytics';
//       default: return '/(app)/settlements';
//     }
//   };

//   return (
//     <View style={{ marginBottom: theme.spacing[5] }}>
//       <GlassCard variant="medium" padding="md">
//         <View
//           style={{
//             flexDirection: isMobile ? 'column' : 'row',
//             alignItems: isMobile ? 'stretch' : 'center',
//             gap: isMobile ? theme.spacing[3] : 0,
//           }}
//         >
//           {actions.map((action, i) => (
//             <React.Fragment key={i}>
//               {i > 0 && (
//                 isMobile ? (
//                   <View style={{ height: 1, backgroundColor: theme.colors.borderLight, marginVertical: theme.spacing[1] }} />
//                 ) : (
//                   <View style={{ width: 1, height: 40, backgroundColor: theme.colors.borderLight, marginHorizontal: theme.spacing[3] }} />
//                 )
//               )}
//               <InteractiveWrapper
//                 onPress={() => router.push(getRoute(action.actionType) as any)}
//                 hoverElevation
//                 style={{ flex: 1 }}
//               >
//                 <View
//                   style={{
//                     flexDirection: 'row',
//                     alignItems: 'center',
//                     gap: theme.spacing[3],
//                     paddingVertical: theme.spacing[2],
//                     paddingHorizontal: isMobile ? theme.spacing[2] : theme.spacing[1],
//                     borderRadius: theme.borderRadius.md,
//                   }}
//                 >
//                   <View style={{
//                     width: 36, height: 36, borderRadius: 18,
//                     backgroundColor: action.priority === 'urgent' ? `${theme.colors.danger}15` : `${theme.colors.warning}15`,
//                     alignItems: 'center', justifyContent: 'center'
//                   }}>
//                     <Typography variant="body">{action.icon}</Typography>
//                   </View>
//                   <View style={{ flex: 1 }}>
//                     <Typography variant="bodySm" weight="bold" color="textPrimary" numberOfLines={1}>
//                       {action.title}
//                     </Typography>
//                     <Typography variant="caption" color="textSecondary" numberOfLines={1}>
//                       {action.message}
//                     </Typography>
//                   </View>
//                   {action.count > 0 && (
//                     <Badge
//                       label={action.count.toString()}
//                       variant={action.priority === 'urgent' ? 'danger' : 'warning'}
//                     />
//                   )}
//                 </View>
//               </InteractiveWrapper>
//             </React.Fragment>
//           ))}
//         </View>
//       </GlassCard>
//     </View>
//   );
// }

// function AchievementChip({ achievement }: { achievement: any }) {
//   const theme = useTheme();
//   const tier = TIER_CONFIG[achievement.tier] || TIER_CONFIG.bronze;
//   const styles = achieveStyles(theme, tier);

//   return (
//     <View style={styles.chip}>
//       <View style={styles.iconWrap}>
//         <Typography variant="body">{achievement.icon}</Typography>
//       </View>
//       <View>
//         <Typography variant="bodySm" weight="bold" color="textPrimary">{achievement.name}</Typography>
//         <Typography variant="caption" color="textTertiary" style={{ textTransform: 'capitalize' }}>{achievement.tier} Tier</Typography>
//       </View>
//     </View>
//   );
// }

// // ============================================================
// // MAIN DASHBOARD SCREEN
// // ============================================================

// export default function DashboardScreen() {
//   const theme = useTheme();
//   const insets = useSafeAreaInsets();
//   const { isDesktop, isTablet } = useResponsive();
//   const [refreshing, setRefreshing] = useState(false);
//   const user = useAuthStore((s: any) => s.user);
//   const firstName = user?.displayName?.split(' ')[0] || 'Traveler';

//   const tripCardWidth = isDesktop ? 300 : isTablet ? 260 : 320;

//   const greeting = getGreeting();
//   const { data: dashboardData, isLoading, refetch } = useDashboard();
//   const data = (dashboardData as any)?.data || dashboardData || {};

//   const summary = data?.summary || {};
//   const balances = data?.balances || {};
//   const monthlyTrend = data?.monthlyTrend || [];
//   const categories = data?.categories || [];
//   const activeTrips = data?.activeTrips || [];
//   const recentlyCompleted = data?.recentlyCompleted || [];
//   const recentExpenses = data?.recentExpenses || [];
//   const pendingActions = data?.pendingActions || [];
//   const recentAchievements = data?.recentAchievements || [];
//   const quickStats = data?.quickStats || {};

//   const totalOwed = balances?.totalOwed || 0;
//   const totalLent = balances?.totalLent || 0;
//   const netBalance = balances?.netBalance || 0;
//   const baseCurrency = balances?.baseCurrency || 'INR';

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await refetch();
//     setRefreshing(false);
//   }, [refetch]);

//   if (isLoading && !refreshing) {
//     return (
//       <GlobalBackground>
//         <View style={mainStyles(theme).loadingContainer}>
//           <GlobalLoader variant="inline" size="large" color={theme.colors.primary} />
//           <Typography variant="bodySm" weight="medium" color="textSecondary" style={{ marginTop: 12 }}>
//             Loading your dashboard…
//           </Typography>
//         </View>
//       </GlobalBackground>
//     );
//   }

//   const hasNoData =
//     recentExpenses.length === 0 &&
//     activeTrips.length === 0 &&
//     recentlyCompleted.length === 0 &&
//     totalOwed === 0 &&
//     totalLent === 0;

//   return (
//     <GlobalBackground>
//       <ScrollView
//         style={mainStyles(theme).scroll}
//         contentContainerStyle={[
//           mainStyles(theme).scrollContent,
//           { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 },
//         ]}
//         showsVerticalScrollIndicator={false}
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
//       >
//         <View style={[mainStyles(theme).container, isDesktop && mainStyles(theme).containerDesktop]}>

//           {/* ── HEADER ──────────────────────────── */}
//           <View style={mainStyles(theme).header}>
//             <View>
//               <Typography variant="caption" weight="bold" color="textTertiary" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
//                 {greeting.text} {greeting.emoji}
//               </Typography>
//               <Typography variant="h1" weight="bold" color="textPrimary">{firstName}</Typography>
//             </View>
//             <InteractiveWrapper onPress={() => router.push('/(app)/profile' as any)} hoverElevation={false}>
//               <Avatar url={user?.photoURL || undefined} fallback={firstName.charAt(0)} size="lg" online />
//             </InteractiveWrapper>
//           </View>

//           {/* ── PENDING ACTIONS ──────────────────── */}
//           <PendingActions actions={pendingActions} />

//           {/* ── BALANCE SUMMARY ──────────────────── */}
//           <View style={mainStyles(theme).section}>
//             <BalanceSummary totalOwed={totalOwed} totalLent={totalLent} netBalance={netBalance} currency={baseCurrency} />
//           </View>

//           {/* ── QUICK ACTIONS ────────────────────── */}
//           <View style={mainStyles(theme).quickGrid}>
//             {ACTION_CONFIG.map((action) => (
//               <InteractiveWrapper key={action.id} onPress={() => router.push(action.route as any)} hoverElevation>
//                 <GlassCard variant="medium" padding="sm" style={mainStyles(theme).quickInner}>
//                   <LinearGradient colors={theme.gradients[action.gradient].slice(0, 2) as any} style={mainStyles(theme).quickGradient}>
//                     <Typography variant="h2">{action.icon}</Typography>
//                   </LinearGradient>
//                   <Typography variant="caption" weight="bold" color="textPrimary" align="center">
//                     {action.label}
//                   </Typography>
//                 </GlassCard>
//               </InteractiveWrapper>
//             ))}
//           </View>

//           {/* ── ACTIVE / RECENT TRIPS ────────────── */}
//           {(activeTrips.length > 0 || recentlyCompleted.length > 0) && (
//             <View style={mainStyles(theme).section}>
//               <SectionHeader
//                 icon={activeTrips.length > 0 ? "🧳" : "🕰️"}
//                 title={activeTrips.length > 0 ? "Active Trips" : "Recent Trips"}
//                 badge={(activeTrips.length > 0 ? activeTrips.length : recentlyCompleted.length).toString()}
//                 action="View All"
//                 onAction={() => router.push('/(app)/(tabs)/home' as any)}
//               />
//               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: theme.spacing[4] }} snapToInterval={tripCardWidth + theme.spacing[4]} decelerationRate="fast">
//                 {(activeTrips.length > 0 ? activeTrips : recentlyCompleted).map((trip: any) => (
//                   <View key={trip.tripId} style={{ width: tripCardWidth, marginRight: theme.spacing[4] }}>
//                     <TripCardHorizontal
//                       trip={trip}
//                       onPress={() => router.push(`/(app)/trips/${trip.tripId}` as any)}
//                       isRecent={activeTrips.length === 0}
//                     />
//                   </View>
//                 ))}
//               </ScrollView>
//             </View>
//           )}

//           {/* ── DESKTOP SPLIT LAYOUT ────────────── */}
//           <View style={[isDesktop && mainStyles(theme).desktopSplit]}>
//             {/* Left Column */}
//             <View style={isDesktop ? { flex: 1, minWidth: 0 } : undefined}>
//               {monthlyTrend.length > 0 && (
//                 <View style={mainStyles(theme).section}>
//                   <SectionHeader icon="📈" title="Spending Trend" />
//                   <GlassCard variant="medium" padding="lg" style={mainStyles(theme).chartCard}>
//                     <SimpleBarChart
//                       data={monthlyTrend.slice(-6).map((m: any) => ({
//                         label: m.monthName || m.month?.slice(5) || '',
//                         value: m.total || 0,
//                         color: theme.colors.primary,
//                       }))}
//                       height={160}
//                     />
//                   </GlassCard>
//                 </View>
//               )}

//               {recentExpenses.length > 0 && (
//                 <View style={mainStyles(theme).section}>
//                   <SectionHeader icon="📝" title="Recent Activity" action="View All" onAction={() => router.push('/(app)/(tabs)/expenses' as any)} />
//                   <GlassCard variant="medium" padding="xs" style={mainStyles(theme).listCard}>
//                     {recentExpenses.slice(0, 8).map((expense: any, i: number) => (
//                       <ExpenseRow key={expense._id || i} expense={expense} onPress={() => expense._id && router.push(`/(app)/expenses/${expense._id}` as any)} />
//                     ))}
//                   </GlassCard>
//                 </View>
//               )}
//             </View>

//             {/* Right Column (Desktop) */}
//             {isDesktop && (
//               <View style={mainStyles(theme).sidebar}>
//                 {categories.length > 0 && <CategoryBreakdown categories={categories} />}
//                 {recentAchievements.length > 0 && (
//                   <View style={mainStyles(theme).section}>
//                     <SectionHeader icon="🏆" title="Achievements" />
//                     <GlassCard variant="medium" padding="sm" style={mainStyles(theme).achieveCard}>
//                       {recentAchievements.slice(0, 3).map((a: any, i: number) => <AchievementChip key={i} achievement={a} />)}
//                     </GlassCard>
//                   </View>
//                 )}
//                 {quickStats.favoriteBuddy && (
//                   <View style={mainStyles(theme).section}>
//                     <SectionHeader icon="⭐" title="Quick Stats" />
//                     <GlassCard variant="medium" padding="md" style={mainStyles(theme).statsCard}>
//                       <View style={mainStyles(theme).statRow}>
//                         <Typography variant="caption" color="textTertiary">Favorite Buddy</Typography>
//                         <View style={mainStyles(theme).buddyRow}>
//                           <Avatar url={quickStats.favoriteBuddy.photoURL || undefined} fallback={quickStats.favoriteBuddy.displayName?.charAt(0) || '?'} size="sm" />
//                           <Typography variant="bodySm" weight="bold" color="textPrimary">
//                             {quickStats.favoriteBuddy.displayName}
//                           </Typography>
//                         </View>
//                       </View>
//                       {quickStats.mostExpensiveTrip && (
//                         <View style={mainStyles(theme).statRow}>
//                           <Typography variant="caption" color="textTertiary">Most Expensive Trip</Typography>
//                           <Typography variant="bodySm" weight="bold" color="textPrimary">
//                             {quickStats.mostExpensiveTrip.title}
//                           </Typography>
//                         </View>
//                       )}
//                     </GlassCard>
//                   </View>
//                 )}
//               </View>
//             )}
//           </View>

//           {/* Mobile: Categories & Achievements fold inline */}
//           {!isDesktop && (
//             <>
//               {categories.length > 0 && (
//                 <View style={mainStyles(theme).section}>
//                   <SectionHeader icon="📊" title="Spending Breakdown" />
//                   <CategoryBreakdown categories={categories} />
//                 </View>
//               )}
//               {recentAchievements.length > 0 && (
//                 <View style={mainStyles(theme).section}>
//                   <SectionHeader icon="🏆" title="Achievements" />
//                   <GlassCard variant="medium" padding="sm" style={mainStyles(theme).achieveCard}>
//                     {recentAchievements.slice(0, 3).map((a: any, i: number) => <AchievementChip key={i} achievement={a} />)}
//                   </GlassCard>
//                 </View>
//               )}
//             </>
//           )}

//           {/* ── EMPTY STATE ──────────────────────── */}
//           {hasNoData && (
//             <EmptyState
//               icon="🚀"
//               title="Start Your Journey"
//               description="Create a trip and invite friends to start tracking expenses together effortlessly."
//               actionLabel="Create Your First Trip"
//               onAction={() => router.push('/(app)/create-trip' as any)}
//             />
//           )}
//         </View>
//       </ScrollView>
//     </GlobalBackground>
//   );
// }

// // ============================================================
// // STYLES
// // ============================================================

// function mainStyles(theme: Theme) {
//   return StyleSheet.create({
//     loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//     scroll: { flex: 1 },
//     scrollContent: {},
//     container: { paddingHorizontal: theme.spacing[4], width: '100%' },
//     containerDesktop: { maxWidth: 1200, alignSelf: 'center', paddingHorizontal: theme.spacing[8] },
//     header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[5] },
//     section: { marginBottom: theme.spacing[6] },
//     quickGrid: { flexDirection: 'row', gap: theme.spacing[3], marginBottom: theme.spacing[6] },
//     quickInner: { flex: 1, justifyContent: 'center', borderRadius: theme.borderRadius.xl, padding: theme.spacing[3], alignItems: 'center', gap: theme.spacing[2] },
//     quickGradient: { width: 48, height: 48, borderRadius: theme.borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
//     chartCard: { borderRadius: theme.borderRadius['2xl'], padding: theme.spacing[5] },
//     listCard: { borderRadius: theme.borderRadius['2xl'], padding: theme.spacing[1] },
//     desktopSplit: { flexDirection: 'row', gap: theme.spacing[6], alignItems: 'flex-start' } as any,
//     sidebar: { width: 320, flexShrink: 0, gap: theme.spacing[6] },
//     achieveCard: { borderRadius: theme.borderRadius['2xl'], padding: theme.spacing[3], gap: theme.spacing[2] },
//     statsCard: { borderRadius: theme.borderRadius['2xl'], padding: theme.spacing[4], gap: theme.spacing[4] },
//     statRow: { gap: 4 },
//     buddyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
//   });
// }

// function sectionStyles(theme: Theme) {
//   return StyleSheet.create({
//     header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing[4] },
//     left: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
//     actionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
//   });
// }

// function tripStyles(theme: Theme) {
//   return StyleSheet.create({
//     inner: { borderRadius: theme.borderRadius['2xl'], overflow: 'hidden' },
//     imageWrap: { height: 150, position: 'relative' },
//     image: { width: '100%', height: '100%' },
//     badge: { position: 'absolute', top: 10, right: 10 },
//     overlay: { position: 'absolute', bottom: 10, left: 12, right: 12 },
//     footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
//     stat: { flex: 1, gap: 4 },
//     divider: { width: 1, height: 28, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', marginHorizontal: 10 },
//   });
// }

// function expenseRowStyles(theme: Theme) {
//   return StyleSheet.create({
//     row: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing[3], gap: theme.spacing[3], borderRadius: theme.borderRadius.lg },
//     iconWrap: { width: 40, height: 40, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
//     info: { flex: 1, gap: 2 },
//     meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
//     dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: theme.colors.textTertiary },
//   });
// }

// function categoryStyles(theme: Theme) {
//   return StyleSheet.create({
//     card: { borderRadius: theme.borderRadius['2xl'], padding: theme.spacing[5] },
//     row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[2] },
//     rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
//     iconWrap: {},
//     iconBg: { width: 36, height: 36, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
//     info: { flex: 1, gap: 6 },
//     infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   });
// }

// function balanceStyles(theme: Theme) {
//   return StyleSheet.create({
//     card: { borderRadius: theme.borderRadius['2xl'], padding: theme.spacing[6] },
//     hero: { alignItems: 'center', gap: 8, marginBottom: theme.spacing[5] },
//     splitBar: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: theme.borderRadius.xl, padding: theme.spacing[4], gap: theme.spacing[3] },
//     splitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//     splitLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//     splitDot: { width: 8, height: 8, borderRadius: 4 },
//   });
// }

// function achieveStyles(theme: Theme, tier: { color: string; glow: string }) {
//   return StyleSheet.create({
//     chip: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       gap: theme.spacing[3],
//       padding: theme.spacing[3],
//       borderRadius: theme.borderRadius.lg,
//       backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
//     },
//     iconWrap: {
//       width: 40,
//       height: 40,
//       borderRadius: 20,
//       alignItems: 'center',
//       justifyContent: 'center',
//       backgroundColor: `${tier.color}15`,
//       borderWidth: 1,
//       borderColor: `${tier.color}30`,
//       shadowColor: tier.glow,
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 1,
//       shadowRadius: 4,
//       elevation: 2
//     },
//   });
// }
