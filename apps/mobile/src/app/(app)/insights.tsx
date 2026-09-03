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
              <LinearGradient
                colors={['#0F172A', '#1E1B4B', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.benchmarkCard, isDesktop && { flex: 1.3 }]}
              >
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
                  <Text style={styles.benchmarkValue}>
                    {groupComp.difference > 0 ? '+' : '−'}₹
                    {Math.abs(groupComp.difference).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.benchmarkSub}>
                    {groupComp.difference > 0
                      ? 'You are currently contributing above the group baseline'
                      : 'You are currently contributing below the group baseline'}
                  </Text>
                </View>

                <View style={styles.benchmarkStatsRow}>
                  <View style={styles.benchmarkStatItem}>
                    <Text style={styles.benchmarkStatLabel}>YOUR SPEND</Text>
                    <Text style={styles.benchmarkStatVal}>
                      ₹{(groupComp.mySpending || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.benchmarkDivider} />
                  <View style={styles.benchmarkStatItem}>
                    <Text style={styles.benchmarkStatLabel}>CREW AVERAGE</Text>
                    <Text style={styles.benchmarkStatVal}>
                      ₹
                      {(groupComp.averageSpending || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={['#0F172A', '#1E1B4B', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.benchmarkCard, isDesktop && { flex: 1.3 }]}
              >
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
                  <Text style={styles.benchmarkValue}>
                    ₹
                    {(quickStats?.thisMonth?.total || 0).toLocaleString(
                      'en-IN',
                    )}
                  </Text>
                  <Text style={styles.benchmarkSub}>
                    Total logged expenses for the current active cycle
                  </Text>
                </View>
                <View style={styles.benchmarkStatsRow}>
                  <View style={styles.benchmarkStatItem}>
                    <Text style={styles.benchmarkStatLabel}>TRANSACTIONS</Text>
                    <Text style={styles.benchmarkStatVal}>
                      {quickStats?.thisMonth?.count || 0}
                    </Text>
                  </View>
                  <View style={styles.benchmarkDivider} />
                  <View style={styles.benchmarkStatItem}>
                    <Text style={styles.benchmarkStatLabel}>ACTIVE TRIPS</Text>
                    <Text style={styles.benchmarkStatVal}>
                      {quickStats?.activeTrips || 0}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            )}

            {/* 4-Tile Quick Metric Cluster */}
            <View style={[styles.quickMetricsGrid, isDesktop && { flex: 1 }]}>
              {/* Tile 1: Monthly Total */}
              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.colors.surface },
                ]}
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
              </View>

              {/* Tile 2: Daily Burn Rate */}
              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.colors.surface },
                ]}
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
              </View>

              {/* Tile 3: Peak Transaction */}
              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.colors.surface },
                ]}
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
              </View>

              {/* Tile 4: Lowest Transaction */}
              <View
                style={[
                  styles.metricTile,
                  { backgroundColor: theme.colors.surface },
                ]}
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
              </View>
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
                <View
                  style={[
                    styles.chartPanel,
                    { backgroundColor: theme.colors.surface },
                  ]}
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
                </View>
              )}

              {/* Monthly Trend Bar Chart */}
              {monthlyData.length > 0 && (
                <View
                  style={[
                    styles.chartPanel,
                    { backgroundColor: theme.colors.surface },
                  ]}
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
                            .map((m: any) => m.totalAmount),
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
                </View>
              )}

              {/* Daily Outflow Line Chart */}
              {dailyData.length > 0 && (
                <View
                  style={[
                    styles.chartPanel,
                    { backgroundColor: theme.colors.surface },
                  ]}
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

                  <LineChart
                    data={{
                      labels: dailyData
                        .slice(-10)
                        .map((d: any) => d.date?.slice(5) || ''),
                      datasets: [
                        {
                          data: dailyData
                            .slice(-10)
                            .map((d: any) => d.totalAmount),
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
                  />
                </View>
              )}
            </View>

            {/* ── RIGHT COLUMN: SMART INSIGHTS & PATTERNS ── */}
            <View style={[styles.bentoCol, isDesktop && { flex: 1 }]}>
              {/* Intelligence Briefing Card */}
              <View
                style={[
                  styles.intelligencePanel,
                  { backgroundColor: theme.colors.surface },
                ]}
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
                        { backgroundColor: theme.colors.background },
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
              </View>

              {/* Day of the Week Outflow Pattern */}
              {dayPattern.length > 0 && (
                <View
                  style={[
                    styles.chartPanel,
                    { backgroundColor: theme.colors.surface },
                  ]}
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
                </View>
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

// import AppIcon  from '../../components/common/AppIcon';
// // app/(app)/insights.tsx
// import React, { useMemo, useCallback, useState } from 'react';
// import {
//     View, Text, StyleSheet, ScrollView,
//     Dimensions, RefreshControl, Platform, useWindowDimensions,
//     Pressable, PressableStateCallbackType
// } from 'react-native';
// import { router, useLocalSearchParams } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useInsightsData, useSpendingTrends, useTripComparison, useGroupComparison } from '../../hooks/useInsights';
// import { useAuthStore } from '../../stores/auth.store';
// import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';
// import { format } from 'date-fns';
// import { useTheme } from '../../providers/ThemeProvider';
// import { useGlobalStyles } from '../../hooks/useGlobalStyles';
// import { GlassCard } from '../../components/ui/GlassCard';
// import { Badge } from '../../components/ui/Badge';
// import { GlobalBackground } from "../../components/ui/GlobalBackground";

// type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// // ============================================================
// // Insight Card
// // ============================================================

// function InsightCard({ icon, title, value, subtitle, color, trend }: {
//     icon: string;
//     title: string;
//     value: string;
//     subtitle: string;
//     color?: string;
//     trend?: string;
// }) {
//     const theme = useTheme();
//     const styles = useStyles();

//     return (
//         <GlassCard style={styles.insightCard} intensity={theme.isDark ? 10 : 5}>
//             <View style={[styles.iconWrapper, { backgroundColor: color ? `${color}20` : theme.colors.primaryBg }]}>
//                 <AppIcon name={icon} size={20} color={color || theme.colors.primary} />
//             </View>
//             <Text style={[styles.insightTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
//             <Text style={[styles.insightValue, color ? { color } : { color: theme.colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
//                 {value}
//             </Text>
//             <Text style={[styles.insightSubtitle, { color: theme.colors.textTertiary }]}>{subtitle}</Text>
//             {trend && (
//                 <View style={[
//                     styles.trendBadge,
//                     {
//                         backgroundColor: trend === 'up' ? theme.colors.dangerBg : theme.colors.successBg
//                     }
//                 ]}>
//                     <Text style={[
//                         styles.trendText,
//                         { color: trend === 'up' ? theme.colors.danger : theme.colors.success }
//                     ]}>
//                         {trend === 'up' ? '↑' : '↓'}
//                     </Text>
//                 </View>
//             )}
//         </GlassCard>
//     );
// }

// // ============================================================
// // Smart Insight Row (rule-based spending analysis)
// // ============================================================

// function SmartInsight({ emoji, text }: { emoji: string; text: string }) {
//     const theme = useTheme();
//     const styles = useStyles();
//     return (
//         <View style={styles.aiRow}>
//             <Text style={styles.aiEmoji}>{emoji}</Text>
//             <Text style={[styles.aiText, { color: theme.colors.textSecondary }]}>{text}</Text>
//         </View>
//     );
// }

// // ============================================================
// // Main Screen
// // ============================================================

// export default function InsightsScreen() {
//     const theme = useTheme();
//     const globalStyles = useGlobalStyles();
//     const styles = useStyles();
//     const insets = useSafeAreaInsets();
//     const { width } = useWindowDimensions();
//     const { tripId } = useLocalSearchParams<{ tripId?: string }>();
//     const { user } = useAuthStore();
//     const [refreshing, setRefreshing] = useState(false);

//     const isWebDesktop = Platform.OS === 'web' && width > 768;
//     const chartWidth = isWebDesktop ? Math.min(width - 80, 1024 - 80) : width - 64;

//     const CATEGORY_COLORS: Record<string, string> = useMemo(() => ({
//         food: '#F59E0B',
//         stay: '#8B5CF6',
//         transport: '#3B82F6',
//         activity: '#10B981',
//         shopping: '#EC4899',
//         health: '#EF4444',
//         other: '#6B7280',
//     }), []);

//     const {
//         data: insightsData,
//         isLoading: insightsLoading,
//         refetch: refetchInsights,
//         isRefetching: insightsRefetching,
//     } = useInsightsData();

//     const {
//         data: trendsData,
//         isLoading: trendsLoading,
//         refetch: refetchTrends,
//     } = useSpendingTrends();

//     const {
//         data: tripComparison,
//         isLoading: tripCompLoading,
//         refetch: refetchTripComp,
//     } = useTripComparison(tripId || '');

//     const {
//         data: groupComparison,
//         isLoading: groupCompLoading,
//         refetch: refetchGroupComp,
//     } = useGroupComparison(tripId || '');

//     const analytics = insightsData?.analytics;
//     const quickStats = insightsData?.quickStats;
//     const trends = trendsData?.data;
//     const tripComp = tripComparison?.data;
//     const groupComp = groupComparison?.data;

//     const isLoading = insightsLoading || trendsLoading;
//     const isRefetching = insightsRefetching;

//     const onRefresh = useCallback(async () => {
//         setRefreshing(true);
//         await Promise.all([
//             refetchInsights(),
//             refetchTrends(),
//             tripId ? refetchTripComp() : Promise.resolve(),
//             tripId ? refetchGroupComp() : Promise.resolve(),
//         ]);
//         setRefreshing(false);
//     }, [tripId, refetchInsights, refetchTrends, refetchTripComp, refetchGroupComp]);

//     const aiInsights = useMemo(() => {
//         const insights: { emoji: string; text: string }[] = [];
//         if (quickStats) {
//             if (quickStats.spendingChange > 20) {
//                 insights.push({ emoji: '📈', text: `Your spending is up ${quickStats.spendingChange}% compared to last month. Consider reviewing your expenses.` });
//             } else if (quickStats.spendingChange < -20) {
//                 insights.push({ emoji: '📉', text: `Great job! Your spending is down ${Math.abs(quickStats.spendingChange)}% vs last month. Keep it up! 🎉` });
//             } else if (quickStats.spendingChange !== 0) {
//                 insights.push({ emoji: '📊', text: `Your spending is ${quickStats.spendingChange > 0 ? 'up' : 'down'} ${Math.abs(quickStats.spendingChange)}% vs last month.` });
//             }
//             if (quickStats.pendingSettlements > 0) {
//                 insights.push({ emoji: '⚠️', text: `You have ${quickStats.pendingSettlements} pending settlement${quickStats.pendingSettlements > 1 ? 's' : ''}. Clear them to stay on top of your finances!` });
//             }
//             if (quickStats.topCategory) {
//                 insights.push({ emoji: '🔥', text: `Your top category is "${quickStats.topCategory.category}" — ₹${quickStats.topCategory.total?.toLocaleString() || 0} spent this month.` });
//             }
//             if (quickStats.activeTrips > 0) {
//                 insights.push({ emoji: '✈️', text: `You have ${quickStats.activeTrips} active trip${quickStats.activeTrips > 1 ? 's' : ''}. Happy travels!` });
//             }
//         }
//         if (trends?.overallTrend === 'rising') {
//             insights.push({ emoji: '📊', text: 'Your monthly spending has been trending upward. Consider setting a budget to keep it in check.' });
//         } else if (trends?.overallTrend === 'falling') {
//             insights.push({ emoji: '🎯', text: 'Your spending trend is going down. You\'re getting better at managing your finances!' });
//         }
//         if (groupComp) {
//             const diff = groupComp.mySpending - groupComp.averageSpending;
//             if (Math.abs(diff) > 100) {
//                 if (diff > 0) {
//                     insights.push({ emoji: '👑', text: `You spend ₹${Math.abs(diff).toLocaleString()} more than the group average. You're the big spender!` });
//                 } else {
//                     insights.push({ emoji: '🌱', text: `You spend ₹${Math.abs(diff).toLocaleString()} less than the group average. Frugal traveler!` });
//                 }
//             }
//         }
//         insights.push({ emoji: '💡', text: 'Tip: Use the "Reminders" feature to never forget a settlement payment.' });
//         insights.push({ emoji: '💡', text: 'Tip: Create trip templates for your frequent destinations to save time.' });
//         return insights.slice(0, 6);
//     }, [quickStats, trends, groupComp]);

//     if (isLoading && !refreshing) {
//         return (
//             <GlobalBackground>
//                 <View style={[styles.container, { backgroundColor: 'transparent' }]}>
//                     <View style={[styles.webDesktopContent, isWebDesktop && styles.webDesktopContentCentered]}>
//                         <View style={[styles.header, {
//                             paddingTop: Platform.OS === 'web' ? theme.spacing['4'] : insets.top + theme.spacing['3'],
//                             borderBottomColor: theme.colors.borderLight,
//                             backgroundColor: theme.colors.surface
//                         }]}>
//                             <Pressable
//                                 onPress={() => router.back()}
//                                 style={({ hovered }: WebPressableState) => [
//                                     styles.backBtnWrap,
//                                     Platform.OS === 'web' && hovered && { opacity: 0.7, cursor: 'pointer' } as any
//                                 ]}
//                             >
//                                 <AppIcon name="arrow-left" size={24} color={theme.colors.textPrimary} />
//                             </Pressable>
//                             <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Spending Insights</Text>
//                             <View style={{ width: 40 }} />
//                         </View>
//                         <View style={styles.loadingContainer}>
//                             <AppIcon name="bar-chart-2" size={48} color={theme.colors.textTertiary} />
//                             <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
//                                 Loading your insights...
//                             </Text>
//                         </View>
//                     </View>
//                 </View>
//             </GlobalBackground>
//         );
//     }

//     const categories = analytics?.categories || [];
//     const monthlyData = analytics?.monthlySpending || [];
//     const dailyData = analytics?.dailySpending || [];
//     const dayPattern = analytics?.dayOfWeekPattern || [];
//     const totalSpent = analytics?.summary?.totalSpent || 0;

//     const chartConfig = {
//         backgroundGradientFrom: theme.colors.card,
//         backgroundGradientTo: theme.colors.card,
//         color: (opacity = 1) => theme.isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
//         labelColor: (opacity = 1) => theme.colors.textSecondary,
//         strokeWidth: 2,
//         barPercentage: 0.5,
//         useShadowColorFromDataset: false,
//         propsForDots: { r: "4", strokeWidth: "2", stroke: theme.colors.primary },
//         decimalPlaces: 0,
//         formatYLabel: (y: string) => {
//             const val = parseInt(y);
//             if (val >= 10000000) return (val / 10000000).toFixed(1) + 'Cr';
//             if (val >= 100000) return (val / 100000).toFixed(1) + 'L';
//             if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
//             return y;
//         }
//     };

//     return (
//         <GlobalBackground>
//             <View style={[styles.container, { backgroundColor: 'transparent' }]}>
//                 <View style={[styles.webDesktopContent, isWebDesktop && styles.webDesktopContentCentered]}>
//                     <View style={[styles.header, {
//                         paddingTop: Platform.OS === 'web' ? theme.spacing['4'] : insets.top + theme.spacing['3'],
//                         borderBottomColor: theme.colors.borderLight,
//                         backgroundColor: theme.colors.surface
//                     }]}>
//                         <Pressable
//                             onPress={() => router.back()}
//                             style={({ hovered }: WebPressableState) => [
//                                 styles.backBtnWrap,
//                                 Platform.OS === 'web' && hovered && { opacity: 0.7, cursor: 'pointer' } as any
//                             ]}
//                         >
//                             <AppIcon name="arrow-left" size={24} color={theme.colors.textPrimary} />
//                         </Pressable>
//                         <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Spending Insights</Text>
//                         <Pressable
//                             onPress={onRefresh}
//                             style={({ hovered, pressed }: WebPressableState) => [
//                                 styles.refreshBtnWrap,
//                                 Platform.OS === 'web' && hovered && { opacity: 0.7, cursor: 'pointer' } as any,
//                                 pressed && styles.pressedState
//                             ]}
//                         >
//                             <AppIcon name="refresh-cw" size={20} color={theme.colors.textPrimary} />
//                         </Pressable>
//                     </View>

//                     <ScrollView
//                         style={{ flex: 1 }}
//                         contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 40 }]}
//                         showsVerticalScrollIndicator={false}
//                         refreshControl={
//                             <RefreshControl
//                                 refreshing={refreshing}
//                                 onRefresh={onRefresh}
//                                 colors={[theme.colors.primary]}
//                                 tintColor={theme.colors.primary}
//                             />
//                         }
//                     >
//                         <Text style={[styles.lastUpdated, { color: theme.colors.textTertiary }]}>
//                             Last updated: {format(new Date(), 'MMM d, h:mm a')}
//                             {isRefetching && ' (refreshing...)'}
//                         </Text>

//                         {groupComp && (
//                             <LinearGradient
//                                 colors={groupComp.difference > 0 ? [theme.colors.danger, theme.colors.danger || '#B91C1C'] : [theme.colors.success, theme.colors.successBorder || '#047857']}
//                                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//                                 style={styles.comparisonCard}
//                             >
//                                 <Text style={styles.compLabel}>Your Spending vs Group Average</Text>
//                                 <Text style={styles.compValue}>
//                                     {groupComp.difference > 0 ? '+' : ''}₹{Math.abs(groupComp.difference).toLocaleString()}
//                                 </Text>
//                                 <Text style={styles.compSub}>
//                                     {groupComp.difference > 0
//                                         ? `You spend ${((groupComp.difference / Math.max(groupComp.averageSpending, 1)) * 100).toFixed(0)}% more than average`
//                                         : `You spend ${((Math.abs(groupComp.difference) / Math.max(groupComp.averageSpending, 1)) * 100).toFixed(0)}% less than average`}
//                                 </Text>
//                             </LinearGradient>
//                         )}

//                         <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Overview</Text>
//                         <View style={styles.statsRow}>
//                             <InsightCard
//                                 icon="credit-card"
//                                 title="This Month"
//                                 value={`₹${(quickStats?.thisMonth?.total || 0).toLocaleString()}`}
//                                 subtitle={`${quickStats?.thisMonth?.count || 0} expenses`}
//                                 color={theme.colors.primary}
//                                 trend={quickStats?.spendingChange > 0 ? 'up' : 'down'}
//                             />
//                             <InsightCard
//                                 icon="bar-chart-2"
//                                 title="Average/Day"
//                                 value={`₹${Math.round(analytics?.summary?.averagePerDay || 0).toLocaleString()}`}
//                                 subtitle="daily avg"
//                                 color={theme.colors.success}
//                             />
//                             <InsightCard
//                                 icon="trending-up"
//                                 title="Highest"
//                                 value={analytics?.highestExpense ? `₹${analytics.highestExpense.amountBase.toLocaleString()}` : '—'}
//                                 subtitle={analytics?.highestExpense?.title || 'No data'}
//                                 color={theme.colors.danger}
//                             />
//                             <InsightCard
//                                 icon="trending-down"
//                                 title="Lowest"
//                                 value={analytics?.lowestExpense ? `₹${analytics.lowestExpense.amountBase.toLocaleString()}` : '—'}
//                                 subtitle={analytics?.lowestExpense?.title || 'No data'}
//                                 color={theme.colors.warning}
//                             />
//                         </View>

//                         {categories.length > 0 && (
//                             <GlassCard style={styles.chartCard} intensity={theme.isDark ? 10 : 5}>
//                                 <View style={styles.chartHeader}>
//                                     <AppIcon name="pie-chart" size={16} color={theme.colors.secondary} />
//                                     <Text style={[styles.chartTitle, { color: theme.colors.textPrimary }]}>Spending by Category</Text>
//                                 </View>
//                                 <PieChart
//                                     data={categories.slice(0, 6).map((c: any, i: number) => ({
//                                         name: c.category,
//                                         population: c.totalAmount,
//                                         color: CATEGORY_COLORS[c.category] || ['#FF9F40', '#9966FF', '#4BC0C0'][i % 3],
//                                         legendFontColor: theme.colors.textSecondary,
//                                         legendFontSize: 12,
//                                     }))}
//                                     width={chartWidth}
//                                     height={220}
//                                     chartConfig={chartConfig}
//                                     accessor={"population"}
//                                     backgroundColor={"transparent"}
//                                     paddingLeft={"15"}
//                                     center={[10, 0]}
//                                     absolute
//                                 />
//                             </GlassCard>
//                         )}

//                         {monthlyData.length > 0 && (
//                             <GlassCard style={styles.chartCard} intensity={theme.isDark ? 10 : 5}>
//                                 <View style={styles.chartHeader}>
//                                     <AppIcon name="bar-chart-2" size={16} color={theme.colors.primary} />
//                                     <Text style={[styles.chartTitle, { color: theme.colors.textPrimary }]}>Monthly Spending Trend</Text>
//                                 </View>
//                                 <BarChart
//                                     data={{
//                                         labels: monthlyData.slice(-6).map((m: any) => m.monthName || m.month?.slice(5) || ''),
//                                         datasets: [{ data: monthlyData.slice(-6).map((m: any) => m.totalAmount) }]
//                                     }}
//                                     width={chartWidth}
//                                     height={220}
//                                     yAxisLabel="₹"
//                                     yAxisSuffix=""
//                                     chartConfig={{
//                                         ...chartConfig,
//                                         color: (opacity = 1) => theme.colors.primary,
//                                     }}
//                                     style={{ marginVertical: 8, borderRadius: 16 }}
//                                     fromZero
//                                 />
//                             </GlassCard>
//                         )}

//                         {dailyData.length > 0 && (
//                             <GlassCard style={styles.chartCard} intensity={theme.isDark ? 10 : 5}>
//                                 <View style={styles.chartHeader}>
//                                     <AppIcon name="activity" size={16} color={theme.colors.success} />
//                                     <Text style={[styles.chartTitle, { color: theme.colors.textPrimary }]}>Daily Spending</Text>
//                                 </View>
//                                 <LineChart
//                                     data={{
//                                         labels: dailyData.slice(-14).map((d: any) => d.date?.slice(5) || ''),
//                                         datasets: [{ data: dailyData.slice(-14).map((d: any) => d.totalAmount) }]
//                                     }}
//                                     width={chartWidth}
//                                     height={220}
//                                     chartConfig={{
//                                         ...chartConfig,
//                                         color: (opacity = 1) => theme.colors.secondary,
//                                     }}
//                                     bezier
//                                     style={{ marginVertical: 8, borderRadius: 16 }}
//                                     yAxisLabel="₹"
//                                     yAxisSuffix=""
//                                 />
//                             </GlassCard>
//                         )}

//                         {dayPattern.length > 0 && (
//                             <GlassCard style={styles.chartCard} intensity={theme.isDark ? 10 : 5}>
//                                 <View style={styles.chartHeader}>
//                                     <AppIcon name="calendar" size={16} color={theme.colors.warning} />
//                                     <Text style={[styles.chartTitle, { color: theme.colors.textPrimary }]}>Spending by Day of Week</Text>
//                                 </View>
//                                 <BarChart
//                                     data={{
//                                         labels: dayPattern.map((d: any) => d.day),
//                                         datasets: [{ data: dayPattern.map((d: any) => d.totalAmount) }]
//                                     }}
//                                     width={chartWidth}
//                                     height={220}
//                                     yAxisLabel="₹"
//                                     yAxisSuffix=""
//                                     chartConfig={{
//                                         ...chartConfig,
//                                         color: (opacity = 1) => theme.colors.success,
//                                     }}
//                                     style={{ marginVertical: 8, borderRadius: 16 }}
//                                     fromZero
//                                 />
//                             </GlassCard>
//                         )}

//                         {aiInsights.length > 0 && (
//                             <GlassCard style={[styles.aiCard, { borderColor: theme.colors.primary + '25' }]} intensity={theme.isDark ? 10 : 5}>
//                                 <View style={styles.aiHeader}>
//                                     <AppIcon name="zap" size={20} color={theme.colors.primary} />
//                                     <Text style={[styles.aiTitle, { color: theme.colors.primary }]}>Spending Tips &amp; Highlights</Text>
//                                     <Badge label="Beta" variant="primary" />
//                                 </View>
//                                 {aiInsights.map((insight, index) => (
//                                     <SmartInsight key={index} emoji={insight.emoji} text={insight.text} />
//                                 ))}
//                             </GlassCard>
//                         )}

//                     </ScrollView>
//                 </View>
//             </View>
//         </GlobalBackground>
//     );
// }

// const useStyles = () => {
//     const theme = useTheme();
//     return useMemo(() => StyleSheet.create({
//         container: { flex: 1 },
//         webDesktopContent: { flex: 1, width: '100%' },
//         webDesktopContentCentered: { maxWidth: 1024, alignSelf: 'center' },
//         pressedState: { opacity: 0.8, transform: [{ scale: 0.98 }] },

//         header: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             paddingHorizontal: 20,
//             paddingBottom: 16,
//             borderBottomWidth: 1,
//         },
//         backBtnWrap: {
//             alignItems: 'flex-start',
//             width: 40
//         },
//         headerTitle: {
//             fontSize: 20,
//             fontWeight: '700'
//         },
//         refreshBtnWrap: {
//             alignItems: 'flex-end',
//             width: 40
//         },

//         content: {
//             padding: 16
//         },
//         lastUpdated: {
//             fontSize: 10,
//             textAlign: 'center',
//             marginBottom: 24
//         },

//         loadingContainer: {
//             flex: 1,
//             justifyContent: 'center',
//             alignItems: 'center',
//             gap: 16,
//         },
//         loadingText: {
//             fontSize: 14,
//             fontWeight: '500'
//         },

//         sectionTitle: {
//             fontSize: 18,
//             fontWeight: '700',
//             marginBottom: 16,
//             marginTop: 8
//         },

//         comparisonCard: {
//             borderRadius: 16,
//             padding: 20,
//             alignItems: 'center',
//             marginBottom: 24
//         },
//         compLabel: {
//             fontSize: 11,
//             color: '#fff',
//             textTransform: 'uppercase',
//             letterSpacing: 1
//         },
//         compValue: {
//             fontSize: 36,
//             fontWeight: 'bold',
//             color: '#fff',
//             marginTop: 8
//         },
//         compSub: {
//             fontSize: 14,
//             color: '#fff',
//             marginTop: 4
//         },

//         statsRow: {
//             flexDirection: 'row',
//             flexWrap: 'wrap',
//             gap: 12,
//             marginBottom: 24
//         },
//         insightCard: {
//             flex: 1,
//             minWidth: 150,
//             alignItems: 'center',
//             position: 'relative',
//             padding: 16,
//             borderRadius: 16,
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
//         },
//         iconWrapper: {
//             width: 44,
//             height: 44,
//             borderRadius: 22,
//             alignItems: 'center',
//             justifyContent: 'center',
//             marginBottom: 10,
//         },
//         insightTitle: {
//             fontSize: 11,
//             fontWeight: '600',
//             textTransform: 'uppercase',
//             letterSpacing: 0.5
//         },
//         insightValue: {
//             fontSize: 20,
//             fontWeight: '800',
//             marginTop: 2
//         },
//         insightSubtitle: {
//             fontSize: 10,
//             marginTop: 2,
//             textAlign: 'center'
//         },
//         trendBadge: {
//             position: 'absolute',
//             top: 10,
//             right: 10,
//             paddingHorizontal: 6,
//             paddingVertical: 2,
//             borderRadius: 10
//         },
//         trendText: {
//             fontSize: 10,
//             fontWeight: 'bold'
//         },

//         chartCard: {
//             padding: 16,
//             marginBottom: 16,
//             borderRadius: 16,
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
//             alignItems: 'center',
//         },
//         chartHeader: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 8,
//             marginBottom: 16,
//             alignSelf: 'flex-start',
//         },
//         chartTitle: {
//             fontSize: 15,
//             fontWeight: '700'
//         },

//         aiCard: {
//             padding: 16,
//             marginBottom: 24,
//             borderRadius: 16,
//             borderWidth: 1,
//         },
//         aiHeader: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 8,
//             marginBottom: 16,
//         },
//         aiTitle: {
//             fontSize: 16,
//             fontWeight: '700',
//             flex: 1,
//         },
//         aiRow: {
//             flexDirection: 'row',
//             gap: 10,
//             marginBottom: 10,
//             alignItems: 'flex-start'
//         },
//         aiEmoji: {
//             fontSize: 16,
//             marginTop: 1
//         },
//         aiText: {
//             flex: 1,
//             fontSize: 13,
//             lineHeight: 20
//         },
//     }), [theme]);
// };
