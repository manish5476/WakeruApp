// app/(app)/insights.tsx
import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import {
  useInsightsData,
  useSpendingTrends,
  useTripComparison,
  useGroupComparison,
} from '../../hooks/useInsights';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

import AppIcon from '../../components/common/AppIcon';
import GlobalLoader from '../../components/common/GlobalLoader';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import type { Theme } from '../../theme';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F43F5E',
  stay: '#8B5CF6',
  transport: '#06B6D4',
  activity: '#10B981',
  shopping: '#F59E0B',
  health: '#EF4444',
  bills: '#6366F1',
  other: '#71717A',
};

export default function InsightsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const isDesktop = width >= 860;
  const isWide = width >= 1200;
  const styles = useMemo(
    () => createStyles(theme, isDesktop),
    [theme, isDesktop],
  );

  // Chart width calculation based on responsive columns
  const chartWidth = useMemo(() => {
    if (isDesktop) {
      const containerWidth = Math.min(width, 1400) - 48;
      return Math.floor(containerWidth * 0.58) - 40;
    }
    return width - 56;
  }, [width, isDesktop]);

  // Queries
  const {
    data: insightsData,
    isLoading: insightsLoading,
    refetch: refetchInsights,
  } = useInsightsData();

  const {
    data: trendsData,
    isLoading: trendsLoading,
    refetch: refetchTrends,
  } = useSpendingTrends();

  const { data: tripComparison, refetch: refetchTripComp } = useTripComparison(
    tripId || '',
  );

  const { data: groupComparison, refetch: refetchGroupComp } =
    useGroupComparison(tripId || '');

  const analytics = insightsData?.analytics;
  const quickStats = insightsData?.quickStats;
  const trends = trendsData?.data;
  const groupComp = groupComparison?.data;

  const isLoading = insightsLoading || trendsLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([
      refetchInsights(),
      refetchTrends(),
      tripId ? refetchTripComp() : Promise.resolve(),
      tripId ? refetchGroupComp() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [
    tripId,
    refetchInsights,
    refetchTrends,
    refetchTripComp,
    refetchGroupComp,
  ]);

  // AI Rule-Based Insights Synthesis
  const smartInsights = useMemo(() => {
    const list: { icon: string; color: string; title: string; desc: string }[] =
      [];

    if (quickStats) {
      if (quickStats.spendingChange > 15) {
        list.push({
          icon: 'trending-up',
          color: '#EF4444',
          title: 'Spending Acceleration',
          desc: `Monthly outflow is up by ${quickStats.spendingChange}% compared to last period.`,
        });
      } else if (quickStats.spendingChange < -15) {
        list.push({
          icon: 'trending-down',
          color: '#10B981',
          title: 'Optimized Outflow',
          desc: `Spending dropped ${Math.abs(quickStats.spendingChange)}% compared to last period. Great budget control!`,
        });
      }

      if (quickStats.topCategory) {
        list.push({
          icon: 'pie-chart',
          color: '#F59E0B',
          title: 'Dominant Category',
          desc: `Highest expenditure is "${quickStats.topCategory.category}" totaling ₹${(quickStats.topCategory.total || 0).toLocaleString('en-IN')}.`,
        });
      }

      if (quickStats.pendingSettlements > 0) {
        list.push({
          icon: 'alert-circle',
          color: '#F59E0B',
          title: 'Pending Settlements',
          desc: `You have ${quickStats.pendingSettlements} unsettled expense claim${quickStats.pendingSettlements > 1 ? 's' : ''} to resolve.`,
        });
      }
    }

    if (groupComp) {
      const diff = groupComp.mySpending - groupComp.averageSpending;
      if (Math.abs(diff) > 100) {
        list.push({
          icon: diff > 0 ? 'users' : 'shield-check',
          color: diff > 0 ? '#8B5CF6' : '#10B981',
          title: 'Group Baseline Variance',
          desc:
            diff > 0
              ? `Your contributions are ₹${Math.abs(diff).toLocaleString('en-IN')} above the group average.`
              : `Your contributions are ₹${Math.abs(diff).toLocaleString('en-IN')} below the group average.`,
        });
      }
    }

    list.push({
      icon: 'zap',
      color: '#38BDF8',
      title: 'Automated Reminders',
      desc: 'Set recurring settlement follow-ups to maintain zero-debt accountability.',
    });

    return list.slice(0, 4);
  }, [quickStats, groupComp]);

  const categories = analytics?.categories || [];
  const monthlyData = analytics?.monthlySpending || [];
  const dailyData = analytics?.dailySpending || [];
  const dayPattern = analytics?.dayOfWeekPattern || [];

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) =>
      theme.isDark
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(15, 23, 42, ${opacity})`,
    labelColor: () => theme.colors.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.55,
    useShadowColorFromDataset: false,
    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.colors.primary },
    decimalPlaces: 0,
    formatYLabel: (y: string) => {
      const val = parseInt(y, 10);
      if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
      if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
      return y;
    },
  };

  if (isLoading && !refreshing) {
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
            Analyzing expenditure telemetry…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <View style={styles.root}>
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
                Spending Analytics & Insights
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                Macro expenditure telemetry & group benchmarks
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
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.mainWrapper}>
          {/* ── TOP BENTO HERO: Benchmark Delta + 4 Quick Metric Tiles ── */}
          <View style={[styles.topHeroBento, !isDesktop && styles.stackLayout]}>
            {/* Group Benchmark Comparison Card */}
            {groupComp ? (
              <GlassCard
                intensity={theme.isDark ? 24 : 36}
                style={[styles.benchmarkCard, isDesktop && { flex: 1.3 }]}
              >
                <LinearGradient
                  colors={
                    theme.isDark
                      ? [
                          'rgba(15, 23, 42, 0.40)',
                          'rgba(30, 27, 75, 0.35)',
                          'rgba(30, 41, 59, 0.40)',
                        ]
                      : [
                          'rgba(255, 255, 255, 0.75)',
                          'rgba(241, 245, 249, 0.65)',
                          'rgba(255, 255, 255, 0.80)',
                        ]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.benchmarkHeader}>
                  <View style={styles.benchmarkTagRow}>
                    <View
                      style={[
                        styles.benchmarkPill,
                        { backgroundColor: 'rgba(56,189,248,0.15)' },
                      ]}
                    >
                      <AppIcon name="users" size={12} color="#38BDF8" />
                      <Text style={styles.benchmarkPillText}>
                        GROUP BENCHMARK
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.deltaBadge,
                      {
                        backgroundColor:
                          groupComp.difference > 0
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(16,185,129,0.2)',
                      },
                    ]}
                  >
                    <AppIcon
                      name={
                        groupComp.difference > 0
                          ? 'arrow-up-right'
                          : 'arrow-down-left'
                      }
                      size={12}
                      color={groupComp.difference > 0 ? '#EF4444' : '#10B981'}
                    />
                    <Text
                      style={[
                        styles.deltaBadgeText,
                        {
                          color:
                            groupComp.difference > 0 ? '#EF4444' : '#10B981',
                        },
                      ]}
                    >
                      {groupComp.difference > 0 ? '+' : '−'}
                      {(
                        (Math.abs(groupComp.difference) /
                          Math.max(groupComp.averageSpending, 1)) *
                        100
                      ).toFixed(0)}
                      % vs average
                    </Text>
                  </View>
                </View>

                <View style={styles.benchmarkValueBlock}>
                  <Text
                    style={[
                      styles.benchmarkValue,
                      {
                        color: theme.isDark
                          ? '#FFFFFF'
                          : theme.colors.textPrimary,
                      },
                    ]}
                  >
                    {groupComp.difference > 0 ? '+' : '−'}₹
                    {Math.abs(groupComp.difference).toLocaleString('en-IN')}
                  </Text>
                  <Text
                    style={[
                      styles.benchmarkSub,
                      {
                        color: theme.isDark
                          ? 'rgba(255,255,255,0.7)'
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {groupComp.difference > 0
                      ? 'You are currently contributing above the group baseline'
                      : 'You are currently contributing below the group baseline'}
                  </Text>
                </View>

                <View style={styles.benchmarkStatsRow}>
                  <View style={styles.benchmarkStatItem}>
                    <Text
                      style={[
                        styles.benchmarkStatLabel,
                        {
                          color: theme.isDark
                            ? 'rgba(255,255,255,0.5)'
                            : theme.colors.textTertiary,
                        },
                      ]}
                    >
                      YOUR SPEND
                    </Text>
                    <Text
                      style={[
                        styles.benchmarkStatVal,
                        {
                          color: theme.isDark
                            ? '#FFFFFF'
                            : theme.colors.textPrimary,
                        },
                      ]}
                    >
                      ₹{(groupComp.mySpending || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.benchmarkDivider} />
                  <View style={styles.benchmarkStatItem}>
                    <Text
                      style={[
                        styles.benchmarkStatLabel,
                        {
                          color: theme.isDark
                            ? 'rgba(255,255,255,0.5)'
                            : theme.colors.textTertiary,
                        },
                      ]}
                    >
                      CREW AVERAGE
                    </Text>
                    <Text
                      style={[
                        styles.benchmarkStatVal,
                        {
                          color: theme.isDark
                            ? '#FFFFFF'
                            : theme.colors.textPrimary,
                        },
                      ]}
                    >
                      ₹
                      {(groupComp.averageSpending || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            ) : (
              <GlassCard
                intensity={theme.isDark ? 24 : 36}
                style={[styles.benchmarkCard, isDesktop && { flex: 1.3 }]}
              >
                <LinearGradient
                  colors={
                    theme.isDark
                      ? [
                          'rgba(15, 23, 42, 0.40)',
                          'rgba(30, 27, 75, 0.35)',
                          'rgba(30, 41, 59, 0.40)',
                        ]
                      : [
                          'rgba(255, 255, 255, 0.75)',
                          'rgba(241, 245, 249, 0.65)',
                          'rgba(255, 255, 255, 0.80)',
                        ]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.benchmarkHeader}>
                  <View
                    style={[
                      styles.benchmarkPill,
                      { backgroundColor: 'rgba(56,189,248,0.15)' },
                    ]}
                  >
                    <AppIcon name="pie-chart" size={12} color="#38BDF8" />
                    <Text style={styles.benchmarkPillText}>
                      EXPENDITURE OVERVIEW
                    </Text>
                  </View>
                </View>
                <View style={styles.benchmarkValueBlock}>
                  <Text
                    style={[
                      styles.benchmarkValue,
                      {
                        color: theme.isDark
                          ? '#FFFFFF'
                          : theme.colors.textPrimary,
                      },
                    ]}
                  >
                    ₹
                    {(quickStats?.thisMonth?.total || 0).toLocaleString(
                      'en-IN',
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.benchmarkSub,
                      {
                        color: theme.isDark
                          ? 'rgba(255,255,255,0.7)'
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    Total logged expenses for the current active cycle
                  </Text>
                </View>
                <View style={styles.benchmarkStatsRow}>
                  <View style={styles.benchmarkStatItem}>
                    <Text
                      style={[
                        styles.benchmarkStatLabel,
                        {
                          color: theme.isDark
                            ? 'rgba(255,255,255,0.5)'
                            : theme.colors.textTertiary,
                        },
                      ]}
                    >
                      TRANSACTIONS
                    </Text>
                    <Text
                      style={[
                        styles.benchmarkStatVal,
                        {
                          color: theme.isDark
                            ? '#FFFFFF'
                            : theme.colors.textPrimary,
                        },
                      ]}
                    >
                      {quickStats?.thisMonth?.count || 0}
                    </Text>
                  </View>
                  <View style={styles.benchmarkDivider} />
                  <View style={styles.benchmarkStatItem}>
                    <Text
                      style={[
                        styles.benchmarkStatLabel,
                        {
                          color: theme.isDark
                            ? 'rgba(255,255,255,0.5)'
                            : theme.colors.textTertiary,
                        },
                      ]}
                    >
                      ACTIVE TRIPS
                    </Text>
                    <Text
                      style={[
                        styles.benchmarkStatVal,
                        {
                          color: theme.isDark
                            ? '#FFFFFF'
                            : theme.colors.textPrimary,
                        },
                      ]}
                    >
                      {quickStats?.activeTrips || 0}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* 4-Tile Quick Metric Cluster */}
            <View style={[styles.quickMetricsGrid, isDesktop && { flex: 1 }]}>
              {/* Tile 1: Monthly Total */}
              <GlassCard
                style={styles.metricTile}
                intensity={theme.isDark ? 16 : 28}
              >
                <View style={styles.metricTopRow}>
                  <View
                    style={[
                      styles.metricIconAura,
                      { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <AppIcon name="credit-card" size={14} color="#2563EB" />
                  </View>
                  <Text style={[styles.metricTag, { color: '#2563EB' }]}>
                    THIS MONTH
                  </Text>
                </View>
                <Text
                  style={[
                    styles.metricValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  ₹{(quickStats?.thisMonth?.total || 0).toLocaleString('en-IN')}
                </Text>
                <Text
                  style={[
                    styles.metricSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {quickStats?.thisMonth?.count || 0} entries
                </Text>
              </GlassCard>

              {/* Tile 2: Daily Burn Rate */}
              <GlassCard
                style={styles.metricTile}
                intensity={theme.isDark ? 16 : 28}
              >
                <View style={styles.metricTopRow}>
                  <View
                    style={[
                      styles.metricIconAura,
                      { backgroundColor: '#ECFDF5' },
                    ]}
                  >
                    <AppIcon name="activity" size={14} color="#10B981" />
                  </View>
                  <Text style={[styles.metricTag, { color: '#10B981' }]}>
                    BURN / DAY
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: '#10B981' }]}>
                  ₹
                  {Math.round(
                    analytics?.summary?.averagePerDay || 0,
                  ).toLocaleString('en-IN')}
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

              {/* Tile 3: Peak Transaction */}
              <GlassCard
                style={styles.metricTile}
                intensity={theme.isDark ? 16 : 28}
              >
                <View style={styles.metricTopRow}>
                  <View
                    style={[
                      styles.metricIconAura,
                      { backgroundColor: '#FEE2E2' },
                    ]}
                  >
                    <AppIcon name="arrow-up-right" size={14} color="#EF4444" />
                  </View>
                  <Text style={[styles.metricTag, { color: '#EF4444' }]}>
                    PEAK EXPENSE
                  </Text>
                </View>
                <Text
                  style={[
                    styles.metricValue,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {analytics?.highestExpense
                    ? `₹${analytics.highestExpense.amountBase.toLocaleString('en-IN')}`
                    : '—'}
                </Text>
                <Text
                  style={[
                    styles.metricSub,
                    { color: theme.colors.textTertiary },
                  ]}
                  numberOfLines={1}
                >
                  {analytics?.highestExpense?.title || 'No data'}
                </Text>
              </GlassCard>

              {/* Tile 4: Lowest Transaction */}
              <GlassCard
                style={styles.metricTile}
                intensity={theme.isDark ? 16 : 28}
              >
                <View style={styles.metricTopRow}>
                  <View
                    style={[
                      styles.metricIconAura,
                      { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <AppIcon name="arrow-down-left" size={14} color="#D97706" />
                  </View>
                  <Text style={[styles.metricTag, { color: '#D97706' }]}>
                    LOWEST EXPENSE
                  </Text>
                </View>
                <Text
                  style={[
                    styles.metricValue,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {analytics?.lowestExpense
                    ? `₹${analytics.lowestExpense.amountBase.toLocaleString('en-IN')}`
                    : '—'}
                </Text>
                <Text
                  style={[
                    styles.metricSub,
                    { color: theme.colors.textTertiary },
                  ]}
                  numberOfLines={1}
                >
                  {analytics?.lowestExpense?.title || 'No data'}
                </Text>
              </GlassCard>
            </View>
          </View>

          {/* ── RESPONSIVE DUAL-COLUMN BENTO SPLIT ── */}
          <View
            style={[styles.bentoSplitRow, !isDesktop && styles.stackLayout]}
          >
            {/* ── LEFT COLUMN: VISUAL TELEMETRY & CHARTS ── */}
            <View style={[styles.bentoCol, isDesktop && { flex: 1.4 }]}>
              {/* Category Breakdown Chart */}
              {categories.length > 0 && (
                <GlassCard
                  style={styles.chartPanel}
                  intensity={theme.isDark ? 16 : 28}
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
                    <View>
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
                        Proportional distribution across all categories
                      </Text>
                    </View>
                  </View>

                  <PieChart
                    data={categories.slice(0, 6).map((c: any, i: number) => ({
                      name: c.category,
                      population: c.totalAmount,
                      color:
                        CATEGORY_COLORS[c.category?.toLowerCase()] ||
                        ['#FF9F40', '#9966FF', '#4BC0C0'][i % 3],
                      legendFontColor: theme.colors.textSecondary,
                      legendFontSize: 11,
                    }))}
                    width={chartWidth}
                    height={210}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    center={[10, 0]}
                    absolute
                  />
                </GlassCard>
              )}

              {/* Monthly Trend Bar Chart */}
              {monthlyData.length > 0 && chartWidth > 0 && (
                <GlassCard
                  style={styles.chartPanel}
                  intensity={theme.isDark ? 16 : 28}
                >
                  <View style={styles.panelHeader}>
                    <View
                      style={[
                        styles.panelIconWrap,
                        { backgroundColor: '#EFF6FF' },
                      ]}
                    >
                      <AppIcon name="bar-chart-2" size={16} color="#2563EB" />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.panelTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        Monthly Spending Trend
                      </Text>
                      <Text
                        style={[
                          styles.panelSub,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Last 6 months expenditure cadence
                      </Text>
                    </View>
                  </View>

                  <BarChart
                    data={{
                      labels: monthlyData
                        .slice(-6)
                        .map(
                          (m: any) => m.monthName || m.month?.slice(5) || '',
                        ),
                      datasets: [
                        {
                          data: monthlyData
                            .slice(-6)
                            .map((m: any) => Number(m.totalAmount) || 0),
                        },
                      ],
                    }}
                    width={chartWidth}
                    height={210}
                    yAxisLabel="₹"
                    yAxisSuffix=""
                    chartConfig={{
                      ...chartConfig,
                      color: () => theme.colors.primary,
                    }}
                    style={styles.chartInnerStyle}
                    fromZero
                  />
                </GlassCard>
              )}

              {/* Daily Outflow Line Chart */}
              {dailyData.length > 0 && chartWidth > 0 && (
                <GlassCard
                  style={styles.chartPanel}
                  intensity={theme.isDark ? 16 : 28}
                >
                  <View style={styles.panelHeader}>
                    <View
                      style={[
                        styles.panelIconWrap,
                        { backgroundColor: '#ECFDF5' },
                      ]}
                    >
                      <AppIcon name="activity" size={16} color="#10B981" />
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.panelTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        Daily Expenditure Frequency
                      </Text>
                      <Text
                        style={[
                          styles.panelSub,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        14-day rolling activity
                      </Text>
                    </View>
                  </View>

                  {dailyData.length >= 2 ? (
                    <LineChart
                      data={{
                        labels: dailyData
                          .slice(-10)
                          .map((d: any) => d.date?.slice(5) || ''),
                        datasets: [
                          {
                            data: dailyData
                              .slice(-10)
                              .map((d: any) => Number(d.totalAmount) || 0),
                          },
                        ],
                      }}
                      width={chartWidth}
                      height={210}
                      chartConfig={{
                        ...chartConfig,
                        color: () => '#10B981',
                      }}
                      bezier
                      style={styles.chartInnerStyle}
                      yAxisLabel="₹"
                      yAxisSuffix=""
                      withDots={Platform.OS !== 'web'}
                    />
                  ) : (
                    <View
                      style={{
                        paddingVertical: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.textSecondary,
                          fontSize: 13,
                          fontWeight: '600',
                        }}
                      >
                        Recorded ₹
                        {Number(
                          dailyData[0]?.totalAmount || 0,
                        ).toLocaleString()}{' '}
                        on {dailyData[0]?.date || 'today'}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.textTertiary,
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
                        More daily spending records needed to chart rolling
                        frequency trends.
                      </Text>
                    </View>
                  )}
                </GlassCard>
              )}
            </View>

            {/* ── RIGHT COLUMN: SMART INSIGHTS & PATTERNS ── */}
            <View style={[styles.bentoCol, isDesktop && { flex: 1 }]}>
              {/* Intelligence Briefing Card */}
              <GlassCard
                style={styles.intelligencePanel}
                intensity={theme.isDark ? 16 : 28}
              >
                <View style={styles.intelligenceHeader}>
                  <View
                    style={[
                      styles.panelIconAura,
                      { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <AppIcon name="zap" size={16} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.panelTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Financial Intelligence
                    </Text>
                    <Text
                      style={[
                        styles.panelSub,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      Automated audit & behavior insights
                    </Text>
                  </View>
                </View>

                <View style={styles.insightsList}>
                  {smartInsights.map((insight, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.insightItem,
                        {
                          backgroundColor: theme.isDark
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(0,0,0,0.03)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.insightIconBadge,
                          { backgroundColor: `${insight.color}15` },
                        ]}
                      >
                        <AppIcon
                          name={insight.icon as any}
                          size={15}
                          color={insight.color}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[
                            styles.insightItemTitle,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {insight.title}
                        </Text>
                        <Text
                          style={[
                            styles.insightItemDesc,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {insight.desc}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </GlassCard>

              {/* Day of the Week Outflow Pattern */}
              {dayPattern.length > 0 && (
                <GlassCard
                  style={styles.chartPanel}
                  intensity={theme.isDark ? 16 : 28}
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
                    <View>
                      <Text
                        style={[
                          styles.panelTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        Day of Week Habits
                      </Text>
                      <Text
                        style={[
                          styles.panelSub,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Spending intensity by day
                      </Text>
                    </View>
                  </View>

                  <BarChart
                    data={{
                      labels: dayPattern.map((d: any) => d.day?.slice(0, 3)),
                      datasets: [
                        { data: dayPattern.map((d: any) => d.totalAmount) },
                      ],
                    }}
                    width={
                      isDesktop ? Math.floor(chartWidth * 0.72) : chartWidth
                    }
                    height={200}
                    yAxisLabel="₹"
                    yAxisSuffix=""
                    chartConfig={{
                      ...chartConfig,
                      color: () => '#F59E0B',
                    }}
                    style={styles.chartInnerStyle}
                    fromZero
                  />
                </GlassCard>
              )}
            </View>
          </View>
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
    loadingText: {
      fontSize: 13,
      fontWeight: '600',
    },
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

    // Bento Top Hero
    topHeroBento: {
      flexDirection: 'row',
      gap: 14,
    },
    stackLayout: {
      flexDirection: 'column',
    },
    benchmarkCard: {
      borderRadius: 22,
      overflow: 'hidden',
      padding: 22,
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
    },
    benchmarkHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    benchmarkTagRow: {
      flexDirection: 'row',
    },
    benchmarkPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    benchmarkPillText: {
      color: '#38BDF8',
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    deltaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    deltaBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    benchmarkValueBlock: {
      gap: 4,
    },
    benchmarkValue: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.8,
    },
    benchmarkSub: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '500',
    },
    benchmarkStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    benchmarkStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    benchmarkStatLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    benchmarkStatVal: {
      fontSize: 15,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    benchmarkDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },

    // Quick Metrics Grid
    quickMetricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metricTile: {
      flex: 1,
      minWidth: 140,
      padding: 14,
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

          shadowOffset: {
            width: 0,
            height: 4,
          },

          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4,
        },
      }),

      justifyContent: 'space-between',
      gap: 4,
    },
    metricTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    metricIconAura: {
      width: 24,
      height: 24,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricTag: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    metricValue: {
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    metricSub: {
      fontSize: 10,
      fontWeight: '500',
    },

    // Bento Split Layout
    bentoSplitRow: {
      flexDirection: 'row',
      gap: 14,
      alignItems: 'flex-start',
    },
    bentoCol: {
      width: '100%',
      gap: 14,
    },

    // Chart Panels
    chartPanel: {
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

      gap: 12,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    panelIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    panelSub: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
    },
    chartInnerStyle: {
      marginVertical: 4,
      borderRadius: 16,
      alignSelf: 'center',
    },

    // Intelligence Panel
    intelligencePanel: {
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
    intelligenceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    panelIconAura: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    insightsList: {
      gap: 8,
    },
    insightItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 12,
      borderRadius: 16,
    },
    insightIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    insightItemTitle: {
      fontSize: 13,
      fontWeight: '800',
    },
    insightItemDesc: {
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: '500',
    },
  });
}
