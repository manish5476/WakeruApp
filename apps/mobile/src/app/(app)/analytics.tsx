import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import {
  useQuickStats,
  useUserAnalytics,
  useYearlySummary,
} from '../../hooks/useAnalytics';
import { useDashboard } from '../../hooks/useDashboard';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

import AppIcon from '../../components/common/AppIcon';
import GlobalLoader from '../../components/common/GlobalLoader';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { EmptyState } from '../../components/ui/EmptyState';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAds } from '../../hooks/useAds';
import { useAdPlacement } from '../../hooks/useAdPlacement';
import { TravelAffiliateCard } from '../../components/ads/TravelAffiliateCard';
import { AdMobBanner } from '../../components/ads/AdMobBanner';
import type { Theme } from '../../theme';

// ─── Category Configuration ──────────────────────────────────
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
    color: '#8B5CF6',
    bg: '#EDE9FE',
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
    color: '#10B981',
    bg: '#ECFDF5',
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

function getStartDate(range: '1M' | '3M' | '6M' | '1Y' | 'ALL'): string {
  const now = new Date();
  switch (range) {
    case '1M':
      return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    case '3M':
      return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    case '6M':
      return new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();
    case '1Y':
      return new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
    default:
      return '';
  }
}

// ============================================================
// MAIN SCREEN
// ============================================================

export default function AnalyticsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 860;
  const styles = useMemo(
    () => createStyles(theme, isDesktop),
    [theme, isDesktop],
  );

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>(
    '3M',
  );
  const [refreshing, setRefreshing] = useState(false);

  // Ads & Placement Lifecycle
  const { isAdFree } = useAds();

  // Trigger interstitial ad controlled by session frequency manager on entrance
  useAdPlacement('analytics', { autoTriggerOnMount: true, delayMs: 600 });

  // Queries
  const { data: rawDashboard, refetch: refetchDashboard } = useDashboard();

  const {
    data: rawAnalyticsData,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
    isRefetching: analyticsRefetching,
  } = useUserAnalytics({
    groupBy: 'month',
    ...(timeRange !== 'ALL' && { startDate: getStartDate(timeRange) }),
  });

  const { data: rawYearlyData, refetch: refetchYearly } =
    useYearlySummary(selectedYear);

  // ── Safe Data Normalization ────────────────────────────────
  const analytics = useMemo(() => {
    return rawAnalyticsData?.data || rawAnalyticsData || {};
  }, [rawAnalyticsData]);

  const yearly = useMemo(() => {
    return rawYearlyData?.data || rawYearlyData || {};
  }, [rawYearlyData]);

  const dashboard = useMemo(() => {
    return rawDashboard?.data || rawDashboard || {};
  }, [rawDashboard]);

  const summary = analytics?.summary || {};
  const categories = analytics?.categories || yearly?.categories || [];
  const monthlySpending =
    analytics?.monthlySpending || yearly?.monthlyBreakdown || [];
  const dailySpending = analytics?.dailySpending || [];
  const tripBreakdown = analytics?.tripBreakdown || [];
  const dayPattern = analytics?.dayOfWeekPattern || [];
  const highestExpense = analytics?.highestExpense;
  const lowestExpense = analytics?.lowestExpense;

  const totalSpent = summary?.totalSpent || yearly?.totalSpent || 0;
  const totalTransactions =
    summary?.totalExpenses || yearly?.totalExpenses || 0;
  const avgPerDay = summary?.averagePerDay || totalSpent / 30;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([
      refetchAnalytics(),
      refetchYearly(),
      refetchDashboard(),
    ]);
    setRefreshing(false);
  }, [refetchAnalytics, refetchYearly, refetchDashboard]);

  // Max spend for proportional scaling
  const maxMonthSpend = useMemo(() => {
    if (!monthlySpending.length) return 1;
    return Math.max(
      ...monthlySpending.map((m: any) => Number(m.totalAmount) || 0),
      1,
    );
  }, [monthlySpending]);

  const maxDayPatternSpend = useMemo(() => {
    if (!dayPattern.length) return 1;
    return Math.max(
      ...dayPattern.map((d: any) => Number(d.totalAmount) || 0),
      1,
    );
  }, [dayPattern]);

  const hasData =
    totalSpent > 0 || categories.length > 0 || monthlySpending.length > 0;

  if (analyticsLoading && !refreshing && !hasData) {
    return (
      <GlobalBackground>
        <View style={styles.loadingContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Synthesizing spending intelligence…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Sticky Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10 },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                haptics.light();
                router.back();
              }}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="arrow-left"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>

            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Financial Intelligence
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                Macro spending telemetry & trip breakdown
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onRefresh}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.colors.surface },
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={8}
          >
            <AppIcon
              name="refresh-cw"
              size={15}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      {/* Main Content Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || analyticsRefetching}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.mainWrapper}>
          {/* Timeframe Filter Pills */}
          <GlassCard
            style={styles.filterBarCard}
            intensity={theme.isDark ? 16 : 24}
          >
            <Text
              style={[
                styles.filterBarLabel,
                { color: theme.colors.textTertiary },
              ]}
            >
              TIMEFRAME
            </Text>
            <View style={styles.filterPillsRow}>
              {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map(range => {
                const isActive = timeRange === range;
                return (
                  <Pressable
                    key={range}
                    onPress={() => {
                      haptics.light();
                      setTimeRange(range);
                    }}
                    style={[
                      styles.filterPill,
                      isActive
                        ? { backgroundColor: theme.colors.primary }
                        : {
                            backgroundColor: theme.isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.04)',
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: isActive
                            ? theme.colors.textInverse
                            : theme.colors.textSecondary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                    >
                      {range}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>

          {/* AdMob Banner Slot for Free Users */}
          {!isAdFree && (
            <AdMobBanner
              placementId="analytics_top_banner"
              style={{ marginVertical: 4 }}
            />
          )}

          {!hasData ? (
            <EmptyState
              icon="📊"
              title="No Analytics Available"
              description="Record some trip expenses to populate your visual telemetry and breakdowns."
              actionLabel="Log Expense"
              onAction={() => router.push('/(app)/expenses/new' as any)}
            />
          ) : (
            <>
              {/* ── TOP BENTO EXECUTIVE STRIP ── */}
              <View
                style={[
                  styles.bentoTopStrip,
                  isDesktop && styles.desktopBentoStrip,
                ]}
              >
                <View style={styles.metricsRow}>
                  {/* Tile 1: Total Spent */}
                  <GlassCard
                    style={styles.metricTile}
                    intensity={theme.isDark ? 16 : 24}
                  >
                    <View style={styles.metricHeaderRow}>
                      <View
                        style={[
                          styles.iconAura,
                          { backgroundColor: '#FEE2E2' },
                        ]}
                      >
                        <AppIcon name="credit-card" size={15} color="#EF4444" />
                      </View>
                      <Text style={[styles.metricTag, { color: '#EF4444' }]}>
                        TOTAL OUTFLOW
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      ₹{totalSpent.toLocaleString('en-IN')}
                    </Text>
                    <Text
                      style={[
                        styles.metricSub,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      {totalTransactions} total entries
                    </Text>
                  </GlassCard>

                  {/* Tile 2: Daily Burn Rate */}
                  <GlassCard
                    style={styles.metricTile}
                    intensity={theme.isDark ? 16 : 24}
                  >
                    <View style={styles.metricHeaderRow}>
                      <View
                        style={[
                          styles.iconAura,
                          { backgroundColor: '#ECFDF5' },
                        ]}
                      >
                        <AppIcon name="activity" size={15} color="#10B981" />
                      </View>
                      <Text style={[styles.metricTag, { color: '#10B981' }]}>
                        BURN RATE / DAY
                      </Text>
                    </View>
                    <Text style={[styles.metricValue, { color: '#10B981' }]}>
                      ₹{Math.round(avgPerDay).toLocaleString('en-IN')}
                    </Text>
                    <Text
                      style={[
                        styles.metricSub,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      Daily average
                    </Text>
                  </GlassCard>
                </View>

                <View style={styles.metricsRow}>
                  {/* Tile 3: Peak Single Expense */}
                  <GlassCard
                    style={styles.metricTile}
                    intensity={theme.isDark ? 16 : 24}
                  >
                    <View style={styles.metricHeaderRow}>
                      <View
                        style={[
                          styles.iconAura,
                          { backgroundColor: '#EFF6FF' },
                        ]}
                      >
                        <AppIcon
                          name="arrow-up-right"
                          size={15}
                          color="#2563EB"
                        />
                      </View>
                      <Text style={[styles.metricTag, { color: '#2563EB' }]}>
                        PEAK SINGLE COST
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: theme.colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      ₹
                      {(highestExpense?.amountBase || 0).toLocaleString(
                        'en-IN',
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.metricSub,
                        { color: theme.colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {highestExpense?.title || 'No single peak recorded'}
                    </Text>
                  </GlassCard>

                  {/* Tile 4: Lowest Transaction */}
                  <GlassCard
                    style={styles.metricTile}
                    intensity={theme.isDark ? 16 : 24}
                  >
                    <View style={styles.metricHeaderRow}>
                      <View
                        style={[
                          styles.iconAura,
                          { backgroundColor: '#FEF3C7' },
                        ]}
                      >
                        <AppIcon
                          name="arrow-down-left"
                          size={15}
                          color="#D97706"
                        />
                      </View>
                      <Text style={[styles.metricTag, { color: '#D97706' }]}>
                        MIN TRANSACTION
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.metricValue,
                        { color: theme.colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      ₹
                      {(lowestExpense?.amountBase || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text
                      style={[
                        styles.metricSub,
                        { color: theme.colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {lowestExpense?.title || 'Base entry'}
                    </Text>
                  </GlassCard>
                </View>
              </View>

              {/* ── 2-COLUMN RESPONSIVE BENTO SPLIT ── */}
              <View
                style={[styles.bentoSplit, isDesktop && styles.desktopSplit]}
              >
                {/* ── LEFT COLUMN: CATEGORY MATRIX & MONTHLY CADENCE ── */}
                <View style={[styles.bentoColumn, isDesktop && { flex: 1.25 }]}>
                  {/* Category Breakdown Panel */}
                  {categories.length > 0 && (
                    <GlassCard
                      style={styles.panelCard}
                      intensity={theme.isDark ? 18 : 30}
                    >
                      <View style={styles.panelHeader}>
                        <View
                          style={[
                            styles.panelIconWrap,
                            { backgroundColor: '#EDE9FE' },
                          ]}
                        >
                          <AppIcon name="pie-chart" size={16} color="#8B5CF6" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.panelTitle,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            Spending by Category
                          </Text>
                          <Text
                            style={[
                              styles.panelSub,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            Categorical allocation across trips
                          </Text>
                        </View>
                      </View>

                      <View style={styles.categoryList}>
                        {categories.map((c: any) => {
                          const config =
                            CATEGORY_CONFIG[c.category?.toLowerCase()] ||
                            CATEGORY_CONFIG.other;
                          const percent = Number(c.percentage || 0);

                          return (
                            <View key={c.category} style={styles.categoryRow}>
                              <View style={styles.categoryTopLine}>
                                <View style={styles.categoryLabelGroup}>
                                  <View
                                    style={[
                                      styles.catIconWrap,
                                      { backgroundColor: `${config.color}15` },
                                    ]}
                                  >
                                    <AppIcon
                                      name={config.icon as any}
                                      size={14}
                                      color={config.color}
                                    />
                                  </View>
                                  <Text
                                    style={[
                                      styles.categoryName,
                                      { color: theme.colors.textPrimary },
                                    ]}
                                  >
                                    {config.label}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.categoryCount,
                                      { color: theme.colors.textTertiary },
                                    ]}
                                  >
                                    ({c.count} tx)
                                  </Text>
                                </View>

                                <View style={styles.categoryAmountGroup}>
                                  <Text
                                    style={[
                                      styles.categoryAmount,
                                      { color: theme.colors.textPrimary },
                                    ]}
                                  >
                                    ₹
                                    {Number(c.totalAmount || 0).toLocaleString(
                                      'en-IN',
                                    )}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.categoryPercent,
                                      { color: config.color },
                                    ]}
                                  >
                                    {percent.toFixed(1)}%
                                  </Text>
                                </View>
                              </View>

                              {/* Progress Track */}
                              <View
                                style={[
                                  styles.progressTrack,
                                  {
                                    backgroundColor: theme.isDark
                                      ? 'rgba(255,255,255,0.06)'
                                      : 'rgba(0,0,0,0.05)',
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.progressFill,
                                    {
                                      width: `${Math.max(percent, 2)}%`,
                                      backgroundColor: config.color,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </GlassCard>
                  )}

                  {/* Monthly Outflow Rhythm (Custom Flex Bars) */}
                  {monthlySpending.length > 0 && (
                    <GlassCard
                      style={styles.panelCard}
                      intensity={theme.isDark ? 18 : 30}
                    >
                      <View style={styles.panelHeader}>
                        <View
                          style={[
                            styles.panelIconWrap,
                            { backgroundColor: '#EFF6FF' },
                          ]}
                        >
                          <AppIcon
                            name="bar-chart-2"
                            size={16}
                            color="#2563EB"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.panelTitle,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            Monthly Outflow Rhythm
                          </Text>
                          <Text
                            style={[
                              styles.panelSub,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            Recorded monthly volume
                          </Text>
                        </View>
                      </View>

                      <View style={styles.barsContainer}>
                        {monthlySpending.slice(-6).map((m: any, i: number) => {
                          const val = Number(m.totalAmount || 0);
                          const heightPct = Math.max(
                            (val / maxMonthSpend) * 100,
                            4,
                          );

                          return (
                            <View key={m.month || i} style={styles.barColumn}>
                              <Text
                                style={[
                                  styles.barValueText,
                                  { color: theme.colors.textSecondary },
                                ]}
                              >
                                {val >= 1000
                                  ? `${(val / 1000).toFixed(0)}k`
                                  : val}
                              </Text>

                              <View
                                style={[
                                  styles.barTrack,
                                  {
                                    backgroundColor: theme.isDark
                                      ? 'rgba(255,255,255,0.06)'
                                      : 'rgba(0,0,0,0.05)',
                                  },
                                ]}
                              >
                                <LinearGradient
                                  colors={['#38BDF8', '#2563EB']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 0, y: 1 }}
                                  style={[
                                    styles.barFill,
                                    { height: `${heightPct}%` },
                                  ]}
                                />
                              </View>

                              <Text
                                style={[
                                  styles.barLabelText,
                                  { color: theme.colors.textTertiary },
                                ]}
                              >
                                {m.monthName ||
                                  m.month?.slice(5) ||
                                  `M${i + 1}`}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </GlassCard>
                  )}
                </View>

                {/* ── RIGHT COLUMN: TRIP BREAKDOWN & HABITS ── */}
                <View style={[styles.bentoColumn, isDesktop && { flex: 1 }]}>
                  {/* Trip Breakdown Panel */}
                  {tripBreakdown.length > 0 && (
                    <GlassCard
                      style={styles.panelCard}
                      intensity={theme.isDark ? 18 : 30}
                    >
                      <View style={styles.panelHeader}>
                        <View
                          style={[
                            styles.panelIconWrap,
                            { backgroundColor: '#ECFDF5' },
                          ]}
                        >
                          <AppIcon name="map" size={16} color="#10B981" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.panelTitle,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            Spending by Expedition
                          </Text>
                          <Text
                            style={[
                              styles.panelSub,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            Active & completed trip distribution
                          </Text>
                        </View>
                      </View>

                      <View style={styles.tripList}>
                        {tripBreakdown.map((t: any) => (
                          <Pressable
                            key={t.tripId}
                            onPress={() =>
                              router.push(`/(app)/trips/${t.tripId}` as any)
                            }
                            style={[
                              styles.tripItem,
                              {
                                backgroundColor: theme.isDark
                                  ? 'rgba(255,255,255,0.04)'
                                  : 'rgba(0,0,0,0.03)',
                              },
                            ]}
                          >
                            <View style={styles.tripLeft}>
                              <Text
                                style={[
                                  styles.tripTitle,
                                  { color: theme.colors.textPrimary },
                                ]}
                                numberOfLines={1}
                              >
                                {t.tripTitle || 'Expedition'}
                              </Text>
                              <Text
                                style={[
                                  styles.tripMeta,
                                  { color: theme.colors.textTertiary },
                                ]}
                              >
                                {t.count} expenses · {t.memberCount || 2}{' '}
                                members
                              </Text>
                            </View>

                            <View style={styles.tripRight}>
                              <Text
                                style={[
                                  styles.tripAmount,
                                  { color: theme.colors.textPrimary },
                                ]}
                              >
                                ₹
                                {Number(t.totalAmount || 0).toLocaleString(
                                  'en-IN',
                                )}
                              </Text>
                              <Text
                                style={[
                                  styles.tripPercent,
                                  { color: theme.colors.primary },
                                ]}
                              >
                                {Number(t.percentage || 0).toFixed(0)}% of total
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </GlassCard>
                  )}

                  {/* Day of Week Habits */}
                  {dayPattern.length > 0 && (
                    <GlassCard
                      style={styles.panelCard}
                      intensity={theme.isDark ? 18 : 30}
                    >
                      <View style={styles.panelHeader}>
                        <View
                          style={[
                            styles.panelIconWrap,
                            { backgroundColor: '#FEF3C7' },
                          ]}
                        >
                          <AppIcon name="calendar" size={16} color="#D97706" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.panelTitle,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            Weekly Spending Habits
                          </Text>
                          <Text
                            style={[
                              styles.panelSub,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            Intensity by day of the week
                          </Text>
                        </View>
                      </View>

                      <View style={styles.dayBarsRow}>
                        {dayPattern.map((d: any, i: number) => {
                          const val = Number(d.totalAmount || 0);
                          const heightPct = Math.max(
                            (val / maxDayPatternSpend) * 100,
                            4,
                          );

                          return (
                            <View key={d.day || i} style={styles.dayBarCol}>
                              <View
                                style={[
                                  styles.dayBarTrack,
                                  {
                                    backgroundColor: theme.isDark
                                      ? 'rgba(255,255,255,0.06)'
                                      : 'rgba(0,0,0,0.05)',
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.dayBarFill,
                                    {
                                      height: `${heightPct}%`,
                                      backgroundColor:
                                        val > 0
                                          ? '#F59E0B'
                                          : theme.colors.borderLight,
                                    },
                                  ]}
                                />
                              </View>
                              <Text
                                style={[
                                  styles.dayLabel,
                                  { color: theme.colors.textSecondary },
                                ]}
                              >
                                {d.day?.slice(0, 3)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </GlassCard>
                  )}

                  {/* Year-over-Year Delta Tile */}
                  {yearly?.yearOverYear && (
                    <GlassCard
                      style={styles.panelCard}
                      intensity={theme.isDark ? 18 : 30}
                    >
                      <View style={styles.panelHeader}>
                        <View
                          style={[
                            styles.panelIconWrap,
                            { backgroundColor: '#EFF6FF' },
                          ]}
                        >
                          <AppIcon
                            name="trending-up"
                            size={16}
                            color="#2563EB"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.panelTitle,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            Year-over-Year Velocity
                          </Text>
                          <Text
                            style={[
                              styles.panelSub,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            Comparison vs previous calendar year
                          </Text>
                        </View>
                      </View>

                      <View style={styles.yoyBlock}>
                        <View style={styles.yoyDeltaRow}>
                          <Text
                            style={[styles.yoyDeltaValue, { color: '#10B981' }]}
                          >
                            {yearly.yearOverYear.trend === 'up' ? '↑' : '↓'}
                            {yearly.yearOverYear.changePercent}%
                          </Text>
                          <Text
                            style={[
                              styles.yoyDeltaLabel,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            relative pace change in {selectedYear}
                          </Text>
                        </View>
                      </View>
                    </GlassCard>
                  )}

                  {/* Contextual Affiliate Banner & Pro Upgrade for Free Users */}
                  {!isAdFree && (
                    <View style={{ marginTop: 14 }}>
                      <AdMobBanner
                        placementId="analytics_bottom_banner"
                        style={{ marginBottom: 10 }}
                      />
                      <TravelAffiliateCard compact />

                      <GlassCard
                        style={{ marginTop: 14, padding: 16, borderRadius: 16 }}
                        intensity={theme.isDark ? 20 : 30}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12,
                          }}
                        >
                          <View style={{ flex: 1, minWidth: 200 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 4,
                              }}
                            >
                              <AppIcon
                                name="sparkles"
                                size={14}
                                color="#8B5CF6"
                              />
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: '800',
                                  color: '#8B5CF6',
                                }}
                              >
                                TRIPSPLIT PRO
                              </Text>
                            </View>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: '700',
                                color: theme.colors.textPrimary,
                              }}
                            >
                              Enjoy 100% Ad-Free Intelligence
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: theme.colors.textSecondary,
                                marginTop: 2,
                              }}
                            >
                              Get unlimited AI receipt scanning, custom export
                              reports, and zero advertisements forever.
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => router.push('/(app)/plans' as any)}
                            style={({ pressed }) => [
                              {
                                paddingVertical: 10,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                backgroundColor: theme.colors.primary,
                                opacity: pressed ? 0.85 : 1,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: theme.colors.textInverse,
                                fontWeight: '700',
                                fontSize: 13,
                              }}
                            >
                              Upgrade →
                            </Text>
                          </Pressable>
                        </View>
                      </GlassCard>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

function createStyles(theme: Theme, isDesktop: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 10,
    },
    loadingText: { fontSize: 13, fontWeight: '600' },
    scrollView: { flex: 1 },
    scrollContent: {
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    mainWrapper: {
      maxWidth: 1400,
      alignSelf: 'center',
      width: '100%',
      gap: 16,
    },

    // Header Bar
    headerBar: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
      zIndex: 10,
    },
    headerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: 1400,
      alignSelf: 'center',
      width: '100%',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    headerSub: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 1,
    },

    // Timeframe Filter Bar
    filterBarCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
      gap: 10,
    },
    filterBarLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    filterPillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    filterPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    filterPillText: {
      fontSize: 11.5,
    },

    // Bento Top Strip (4-Tile)
    bentoTopStrip: {
      gap: 10,
    },
    desktopBentoStrip: {
      flexDirection: 'row',
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 10,
      flex: 1,
    },
    metricTile: {
      flex: 1,
      padding: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
        } as any,

        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4,
        },
      }),

      justifyContent: 'space-between',
      gap: 4,
    },
    metricHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    iconAura: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricTag: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    metricSub: {
      fontSize: 10,
      fontWeight: '500',
    },

    // Bento Split Layout
    bentoSplit: {
      gap: 16,
    },
    desktopSplit: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bentoColumn: {
      gap: 16,
      width: '100%',
    },

    // Panels
    panelCard: {
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

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

      gap: 14,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    panelIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    panelSub: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
    },

    // Category List
    categoryList: {
      gap: 12,
    },
    categoryRow: {
      gap: 6,
    },
    categoryTopLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryLabelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    catIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryName: {
      fontSize: 13,
      fontWeight: '700',
    },
    categoryCount: {
      fontSize: 11,
      fontWeight: '500',
    },
    categoryAmountGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    categoryAmount: {
      fontSize: 13,
      fontWeight: '800',
    },
    categoryPercent: {
      fontSize: 11,
      fontWeight: '800',
      minWidth: 40,
      textAlign: 'right',
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },

    // Monthly Bars
    barsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 160,
      paddingTop: 10,
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
      height: '100%',
      justifyContent: 'flex-end',
      gap: 6,
    },
    barValueText: {
      fontSize: 9.5,
      fontWeight: '700',
    },
    barTrack: {
      width: '60%',
      maxWidth: 32,
      flex: 1,
      borderRadius: 6,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: {
      width: '100%',
      borderRadius: 6,
    },
    barLabelText: {
      fontSize: 11,
      fontWeight: '700',
    },

    // Trip Breakdown
    tripList: {
      gap: 8,
    },
    tripItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    },
    tripLeft: {
      flex: 1,
      gap: 2,
    },
    tripTitle: {
      fontSize: 13,
      fontWeight: '800',
    },
    tripMeta: {
      fontSize: 11,
    },
    tripRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    tripAmount: {
      fontSize: 13,
      fontWeight: '800',
    },
    tripPercent: {
      fontSize: 10.5,
      fontWeight: '700',
    },

    // Day of Week Bars
    dayBarsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 120,
      paddingTop: 10,
    },
    dayBarCol: {
      flex: 1,
      alignItems: 'center',
      height: '100%',
      justifyContent: 'flex-end',
      gap: 6,
    },
    dayBarTrack: {
      width: '60%',
      maxWidth: 24,
      flex: 1,
      borderRadius: 4,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    dayBarFill: {
      width: '100%',
      borderRadius: 4,
    },
    dayLabel: {
      fontSize: 10,
      fontWeight: '700',
    },

    // YoY
    yoyBlock: {
      padding: 12,
      borderRadius: 16,
    },
    yoyDeltaRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    yoyDeltaValue: {
      fontSize: 24,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    yoyDeltaLabel: {
      fontSize: 12,
      fontWeight: '500',
    },

    // Pro Locked Gateway Styles
    lockedContainer: {
      paddingVertical: 12,
      alignItems: 'center',
      width: '100%',
    },
    lockedCard: {
      width: '100%',
      maxWidth: 640,
      padding: 28,
      borderRadius: 28,
      alignItems: 'center',
      gap: 20,
    },
    lockedIconWrap: {
      marginBottom: 4,
    },
    lockedIconGrad: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    lockedTextWrap: {
      alignItems: 'center',
      gap: 8,
    },
    proTagBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
    },
    proTagText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#8B5CF6',
      letterSpacing: 0.6,
    },
    lockedTitle: {
      fontSize: 22,
      fontWeight: '900',
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    lockedDesc: {
      fontSize: 13.5,
      lineHeight: 20,
      textAlign: 'center',
      maxWidth: 480,
    },
    lockedButtonsRow: {
      width: '100%',
      gap: 12,
      marginTop: 4,
    },
    watchAdBtn: {
      borderRadius: 16,
      borderWidth: 1.5,
      overflow: 'hidden',
    },
    watchAdBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 8,
    },
    watchAdBtnText: {
      fontSize: 14.5,
      fontWeight: '700',
    },
    upgradePlanBtn: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    upgradePlanGrad: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      gap: 8,
    },
    upgradePlanText: {
      color: '#FFFFFF',
      fontSize: 14.5,
      fontWeight: '700',
    },
    lockedAdPreview: {
      width: '100%',
      marginTop: 8,
    },
  });
}
