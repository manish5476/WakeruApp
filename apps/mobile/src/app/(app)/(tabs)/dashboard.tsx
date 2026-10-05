import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useQueryClient } from '@tanstack/react-query';
import GlobalLoader from '../../../components/common/GlobalLoader';
import { useDashboard } from '../../../hooks/useDashboard';
import { queryKeys } from '../../../hooks/queryKeys';
import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { useResponsive } from '../../../hooks/useResponsive';
import { haptics } from '../../../utils/haptics';
import { safeFormatCurrency } from '../../../utils/formatters';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Avatar } from '../../../components/ui/Avatar';
import { AvatarGroup } from '../../../components/ui/AvatarGroup';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SimpleBarChart } from '../../../components/charts/SimpleBarChart';
import AppIcon from '../../../components/common/AppIcon';
import { useUserJourneyState } from '../../../hooks/useUserJourneyState';
import { NewUserDashboard } from '../../../components/dashboard/NewUserDashboard';
import { JoinedTripBanner } from '../../../components/dashboard/JoinedTripBanner';
import { MoneyOverviewWidget } from '../../../components/dashboard/MoneyOverviewWidget';
import {
  getTripCoverImage,
  GUARANTEED_FALLBACK_COVER,
} from '../../../utils/tripImage';
import { BalanceBreakdownModal } from '../../../components/finance/BalanceBreakdownModal';
import {
  SearchFilterModal,
  SearchFilters,
} from '../../../components/trips/SearchFilterModal';
import { useAds } from '../../../hooks/useAds';
import { TravelAffiliateCard } from '../../../components/ads/TravelAffiliateCard';
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
    route: '/(app)/quick-actions',
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
  onPressExplain,
}: {
  totalOwed: number;
  totalLent: number;
  netBalance: number;
  currency: string;
  onPressExplain?: () => void;
}) {
  const theme = useTheme();
  const isPositive = netBalance >= 0;
  const isZero = netBalance === 0;
  const cs = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€';

  return (
    <GlassCard style={balanceStyles.card} intensity={theme.isDark ? 24 : 35}>
      {/* Top Net Balance Block */}
      <View style={balanceStyles.topRow}>
        <View>
          <Text
            style={[
              balanceStyles.label,
              {
                color: theme.isDark
                  ? 'rgba(255,255,255,0.7)'
                  : 'rgba(0,0,0,0.6)',
              },
            ]}
          >
            OVERALL NET BALANCE
          </Text>
          <Text
            style={[
              balanceStyles.netValue,
              {
                color: isZero
                  ? theme.colors.textPrimary
                  : isPositive
                    ? '#10B981'
                    : '#EF4444',
              },
            ]}
          >
            {isZero ? '' : isPositive ? '+' : '−'}
            {cs}
            {Math.abs(netBalance).toLocaleString('en-IN')}
          </Text>
          <Text
            style={[
              balanceStyles.subText,
              { color: theme.colors.textSecondary },
            ]}
          >
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
                ? 'rgba(16,185,129,0.15)'
                : 'rgba(239,68,68,0.15)',
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
      <View
        style={[
          balanceStyles.statsSplitRow,
          {
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.03)',
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.04)',
          },
        ]}
      >
        <View style={balanceStyles.statTile}>
          <View
            style={[balanceStyles.statDot, { backgroundColor: '#EF4444' }]}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                balanceStyles.statLabel,
                { color: theme.colors.textTertiary },
              ]}
            >
              YOU OWE
            </Text>
            <Text style={[balanceStyles.statAmount, { color: '#EF4444' }]}>
              {cs}
              {totalOwed.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View
          style={[
            balanceStyles.statDivider,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.08)',
            },
          ]}
        />

        <View style={balanceStyles.statTile}>
          <View
            style={[balanceStyles.statDot, { backgroundColor: '#10B981' }]}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                balanceStyles.statLabel,
                { color: theme.colors.textTertiary },
              ]}
            >
              OWED TO YOU
            </Text>
            <Text style={[balanceStyles.statAmount, { color: '#10B981' }]}>
              {cs}
              {totalLent.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Explain calculation link */}
      {onPressExplain && (
        <Pressable
          onPress={onPressExplain}
          style={[
            balanceStyles.explainRow,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.03)',
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.05)',
            },
          ]}
          hitSlop={6}
        >
          <View style={balanceStyles.explainLeft}>
            <AppIcon
              name="help-circle"
              size={13}
              color={theme.colors.primary}
            />
            <Text
              style={[
                balanceStyles.explainText,
                { color: theme.colors.textPrimary },
              ]}
            >
              How was this calculated?
            </Text>
          </View>
          <AppIcon
            name="arrow-right"
            size={13}
            color={theme.colors.textSecondary}
          />
        </Pressable>
      )}
    </GlassCard>
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

  const coverUri =
    getTripCoverImage({ ...trip, _id: trip.tripId }) ||
    GUARANTEED_FALLBACK_COVER;
  const [imgSrc, setImgSrc] = useState(coverUri);

  useEffect(() => {
    setImgSrc(coverUri);
  }, [coverUri]);

  return (
    <GlassCard
      pressable
      onPress={onPress}
      padding="none"
      style={tripStyles(theme).card}
      intensity={theme.isDark ? 20 : 40}
    >
      <View style={tripStyles(theme).imageWrap}>
        <Image
          source={{ uri: imgSrc }}
          style={tripStyles(theme).image}
          resizeMode="cover"
          onError={() => {
            if (imgSrc !== GUARANTEED_FALLBACK_COVER) {
              setImgSrc(GUARANTEED_FALLBACK_COVER);
            }
          }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          locations={[0.45, 1]}
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
    </GlassCard>
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
    <GlassCard
      style={categoryStyles(theme).card}
      intensity={theme.isDark ? 25 : 45}
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
    </GlassCard>
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
        return '/(app)/settlements?tab=payable';
      case 'view_analytics':
        return '/(app)/analytics';
      default:
        return '/(app)/settlements';
    }
  };

  return (
    <View style={actionStyles(theme).container}>
      <GlassCard
        style={[
          actionStyles(theme).innerCard,
          !isMobile && actionStyles(theme).desktopRow,
        ]}
        intensity={theme.isDark ? 20 : 35}
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
      </GlassCard>
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
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchName: '',
    searchUser: '',
    dateRange: 'all',
  });
  const user = useAuthStore((s: any) => s.user);
  const firstName = user?.displayName?.split(' ')[0] || 'Traveler';
  const { isAdFree } = useAds();

  const journey = useUserJourneyState();
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

  const queryClient = useQueryClient();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.all }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['finance', 'overview'] }),
    ]);
    setRefreshing(false);
  }, [refetch, queryClient]);

  if (isLoading && !refreshing && !data?.quickStats && !data?.balances) {
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
            paddingTop:
              Platform.OS === 'web'
                ? 20
                : Math.max(
                    insets.top,
                    Platform.OS === 'android'
                      ? (StatusBar.currentHeight ?? 38)
                      : 24,
                  ) + 14,
            paddingBottom: Math.max(insets.bottom, 20) + 100,
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
                onPress={() => {
                  haptics.light();
                  setIsSearchOpen(true);
                }}
                style={({ pressed }) => [
                  mainStyles(theme).iconBtn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.10)'
                      : 'rgba(0,0,0,0.07)',
                  },
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Search trips"
              >
                <AppIcon
                  name="search"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </Pressable>

              <Pressable
                onPress={onRefresh}
                style={({ pressed }) => [
                  mainStyles(theme).iconBtn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.10)'
                      : 'rgba(0,0,0,0.07)',
                  },
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

          {/* ── NEW USER SIMPLIFIED VIEW OR FULL POWER DASHBOARD ── */}
          {journey.isNewUser ? (
            <View style={{ gap: 20 }}>
              {journey.joinedTrip && (
                <JoinedTripBanner
                  trip={journey.joinedTrip}
                  onDismiss={journey.dismissOnboarding}
                />
              )}
              {journey.createdTrip && (
                <JoinedTripBanner
                  trip={journey.createdTrip}
                  onDismiss={journey.dismissOnboarding}
                />
              )}
              <NewUserDashboard
                firstName={firstName}
                checklist={journey.checklist}
                completedCount={journey.completedCount}
                totalChecklistCount={journey.totalChecklistCount}
                progressPercent={journey.progressPercent}
                hasTrips={journey.hasTrips}
                onDismiss={journey.dismissOnboarding}
              />
            </View>
          ) : (
            <>
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
                    onPressExplain={() => setShowBreakdownModal(true)}
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
                      <GlassCard
                        key={action.id}
                        pressable
                        onPress={() => {
                          haptics.light();
                          router.push(action.route as any);
                        }}
                        style={mainStyles(theme).quickTile}
                        intensity={theme.isDark ? 20 : 15}
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
                        <View
                          style={{ flex: 1, backgroundColor: 'transparent' }}
                        >
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
                      </GlassCard>
                    ))}
                  </View>
                </View>
              </View>

              {/* ── MONEY OVERVIEW WIDGET ──────────── */}
              <MoneyOverviewWidget />

              {/* ── CONTEXTUAL TRAVEL PARTNER SPOTLIGHT FOR FREE USERS ── */}
              {!isAdFree && (
                <View style={{ marginVertical: 6, width: '100%' }}>
                  <TravelAffiliateCard
                    compact
                    customTitle="Exclusive Travel Deals & Flight Offers"
                    customSubtitle="Compare 1,000+ booking providers with free cancellation on top stays"
                  />
                </View>
              )}

              {/* ── EXPEDITIONS CAROUSEL ───────────── */}
              {(activeTrips.length > 0 || recentlyCompleted.length > 0) && (
                <View style={mainStyles(theme).section}>
                  <SectionHeader
                    icon="map-pin"
                    title={
                      activeTrips.length > 0
                        ? 'Active Expeditions'
                        : 'Recent Trips'
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
                    {(activeTrips.length > 0
                      ? activeTrips
                      : recentlyCompleted
                    ).map((trip: any) => (
                      <View
                        key={trip.tripId}
                        style={mainStyles(theme).tripSlide}
                      >
                        <TripCardHorizontal
                          trip={trip}
                          onPress={() =>
                            router.push(`/(app)/trips/${trip.tripId}` as any)
                          }
                          isRecent={activeTrips.length === 0}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* ── LOCAL DISCOVERY SPOTLIGHT ────────── */}
              <GlassCard
                pressable
                onPress={() => {
                  haptics.light();
                  router.push('/(app)/explore' as any);
                }}
                style={{
                  marginVertical: 10,
                  padding: 14,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: theme.colors.borderLight,
                }}
                intensity={theme.isDark ? 20 : 35}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        backgroundColor: `${theme.colors.primary}18`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AppIcon
                        name="compass"
                        size={22}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '700',
                            color: theme.colors.textPrimary,
                          }}
                        >
                          Explore Local
                        </Text>
                        <Badge label="Verified" variant="verified" />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {activeTrips.length > 0 && activeTrips[0]?.destination
                          ? `Stays, dining & activities in ${activeTrips[0].destination}`
                          : 'Verified stays, cafes & activities around you'}
                      </Text>
                    </View>
                  </View>
                  <AppIcon
                    name="chevron-right"
                    size={18}
                    color={theme.colors.textTertiary}
                  />
                </View>
              </GlassCard>

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
                    <GlassCard
                      style={mainStyles(theme).cardPanel}
                      intensity={theme.isDark ? 25 : 45}
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
                    </GlassCard>
                  )}

                  {recentExpenses.length > 0 && (
                    <GlassCard
                      style={mainStyles(theme).cardPanel}
                      intensity={theme.isDark ? 25 : 45}
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
                                router.push(
                                  `/(app)/expenses/${expense._id}` as any,
                                )
                              }
                            />
                          ))}
                      </View>
                    </GlassCard>
                  )}
                </View>

                {/* Right Column: Category Breakdown & Quick Stats */}
                <View
                  style={[mainStyles(theme).column, isDesktop && { flex: 1 }]}
                >
                  {categories.length > 0 && (
                    <CategoryBreakdown categories={categories} />
                  )}

                  {quickStats.favoriteBuddy && (
                    <GlassCard
                      style={mainStyles(theme).cardPanel}
                      intensity={theme.isDark ? 25 : 45}
                    >
                      <SectionHeader
                        icon="users"
                        title="Travel Companion Highlight"
                      />
                      <View style={mainStyles(theme).buddyCard}>
                        <Avatar
                          url={quickStats.favoriteBuddy.photoURL || undefined}
                          fallback={
                            quickStats.favoriteBuddy.displayName?.charAt(0) ||
                            '?'
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
                    </GlassCard>
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
            </>
          )}
        </View>
      </ScrollView>

      <BalanceBreakdownModal
        visible={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
        currency={baseCurrency}
      />

      <SearchFilterModal
        visible={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        filters={searchFilters}
        onApply={applied => {
          setSearchFilters(applied);
          router.push({
            pathname: '/(app)/(tabs)/home',
            params: {
              searchName: applied.searchName,
              searchUser: applied.searchUser,
              dateRange: applied.dateRange,
              status: applied.status,
            },
          });
        }}
      />
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
    },
    quickTile: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 140,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
        } as any,

        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
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
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.03)',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
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
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.03)',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
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

        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
    }),

    gap: 16,
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
  explainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  explainLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  explainText: {
    fontSize: 12,
    fontWeight: '700',
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
    },
    imageWrap: {
      height: 130,
      position: 'relative',
      backgroundColor: theme.isDark ? '#1E293B' : '#CBD5E1',
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
