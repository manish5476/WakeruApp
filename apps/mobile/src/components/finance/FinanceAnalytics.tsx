import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';

import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { haptics } from '../../utils/haptics';

import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { AmountDisplay } from '../ui/AmountDisplay';
import { EmptyState } from '../ui/EmptyState';
import { Container } from '../ui/Container';
import { TabBar, TabItem } from '../ui/TabBar';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';

import {
  useAnalytics,
  useCategories,
  useFinanceDashboard,
  useSpendingTrends,
} from '../../hooks';

import type { Theme } from '../../theme';

// ─── Constants ───────────────────────────────────────────────
const WEB = Platform.OS === 'web';

interface FinanceAnalyticsProps {
  month: string;
  includeTripExpenses?: boolean;
  onToggleIncludeTripExpenses?: (val: boolean) => void;
}

// ─── Helpers ─────────────────────────────────────────────────
const isDataCorrupted = (value: number): boolean => {
  return (
    value == null || isNaN(value) || !isFinite(value) || Math.abs(value) > 1e15
  );
};

const formatYLabel = (y: string) => {
  const val = parseFloat(y);
  if (isDataCorrupted(val) || isNaN(val) || val === 0) return '0';
  if (val >= 10000000) return (val / 10000000).toFixed(1) + 'Cr';
  if (val >= 100000) return (val / 100000).toFixed(1) + 'L';
  if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
  return Math.round(val).toString();
};

// Upgraded from emojis to crisp AppIcon names for a premium look
const CATEGORY_ICONS: Record<string, string> = {
  food: 'utensils',
  health: 'heart-pulse',
  stay: 'hotel',
  transport: 'car',
  activity: 'zap',
  shopping: 'shopping-bag',
  other: 'tag',
  bills: 'file-text',
  entertainment: 'film',
  travel: 'plane',
  income: 'banknote',
  settlement: 'check-circle',
};

// ─── Category Filter Tab Bar ─────────────────────────────────
function CategoryFilterTabBar({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: any[];
  selectedCategory: string | undefined;
  onSelect: (category: string | undefined) => void;
}) {
  const theme = useTheme();

  if (categories.length === 0) return null;

  const tabs: TabItem[] = [
    { key: 'all', label: 'All Categories' },
    ...categories.map((cat: any) => ({
      key: cat.category,
      label: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    })),
  ];

  const activeKey = selectedCategory || 'all';

  return (
    <View style={{ marginBottom: theme.spacing[1] }}>
      <TabBar
        tabs={tabs}
        activeKey={activeKey}
        onTabChange={key => onSelect(key === 'all' ? undefined : key)}
        variant="segmented"
        scrollable
        size="sm"
      />
    </View>
  );
}

// ─── Bento Summary Stats (2-in-1) ───────────────────────────
function BentoSummaryStats({
  totalExpense,
  totalIncome,
}: {
  totalExpense: number;
  totalIncome: number;
}) {
  const theme = useTheme();

  const stats = [
    {
      icon: 'arrow-down-left',
      iconColor: theme.colors.danger,
      iconBgColor: theme.colors.dangerBg,
      label: 'Total Expense',
      amount: totalExpense,
      currency: 'INR',
    },
    {
      icon: 'arrow-up-right',
      iconColor: theme.colors.success,
      iconBgColor: theme.colors.successBg,
      label: 'Total Income',
      amount: totalIncome,
      currency: 'INR',
    },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(50).springify().damping(18)}>
      <GlassCard variant="medium" padding="xs">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            paddingVertical: theme.spacing[1],
          }}
        >
          {stats.map((stat, index) => (
            <React.Fragment key={stat.label}>
              {index > 0 && (
                <View
                  style={{
                    width: 1,
                    height: '70%',
                    backgroundColor: theme.colors.borderLight,
                  }}
                />
              )}
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: theme.spacing[1],
                  paddingHorizontal: theme.spacing[2],
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: stat.iconBgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon
                    name={stat.icon as any}
                    size={16}
                    color={stat.iconColor}
                  />
                </View>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textSecondary"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontSize: 9,
                  }}
                >
                  {stat.label}
                </Typography>
                <AmountDisplay
                  amount={stat.amount}
                  currency={stat.currency}
                  size="sm"
                  compact
                  variant="default"
                />
              </View>
            </React.Fragment>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Spending Intelligence Card ──────────────────────────────
function SpendingIntelligenceCard({
  analyticsOverview,
}: {
  analyticsOverview: any;
}) {
  const theme = useTheme();

  const metrics = [
    {
      icon: 'hash',
      label: 'Transactions',
      value: `${analyticsOverview.transactionCount || 0}`,
      isAmount: false,
    },
    {
      icon: 'credit-card',
      label: 'Avg / Transaction',
      amount: analyticsOverview.averagePerTransaction || 0,
      currency: 'INR',
      isAmount: true,
    },
    {
      icon: 'calendar',
      label: 'Daily Average',
      amount: analyticsOverview.averageDaily || 0,
      currency: 'INR',
      isAmount: true,
    },
  ];

  return (
    <Animated.View entering={FadeInUp.delay(150).springify().damping(18)}>
      <GlassCard variant="medium" padding="md">
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing[4],
          }}
        >
          <View style={{ flex: 1 }}>
            <Typography
              variant="h3"
              weight="extrabold"
              color="textPrimary"
              style={{ letterSpacing: -0.5 }}
            >
              Spending Intelligence
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              style={{ marginTop: theme.spacing[1] }}
            >
              Automated financial insights
            </Typography>
          </View>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: theme.borderRadius.full,
              backgroundColor: theme.colors.primaryBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="sparkles" size={16} color={theme.colors.primary} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
          {metrics.map(metric => (
            <View
              key={metric.label}
              style={{
                flex: 1,
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.03)',
                padding: theme.spacing[3],
                borderRadius: theme.borderRadius.lg,
                gap: theme.spacing[1],
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[1],
                }}
              >
                <AppIcon
                  name={metric.icon as any}
                  size={12}
                  color={theme.colors.textSecondary}
                />
                <Typography
                  variant="caption"
                  color="textSecondary"
                  numberOfLines={1}
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {metric.label}
                </Typography>
              </View>
              {metric.isAmount ? (
                <AmountDisplay
                  amount={metric.amount!}
                  currency={metric.currency!}
                  size="sm"
                  compact
                  variant="default"
                />
              ) : (
                <Typography
                  variant="body"
                  weight="extrabold"
                  color="textPrimary"
                >
                  {metric.value}
                </Typography>
              )}
            </View>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Chart Card Wrapper ──────────────────────────────────────
function ChartCard({
  title,
  subtitle,
  children,
  delay = 300,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().damping(18)}>
      <GlassCard variant="medium" padding="md">
        <View style={{ marginBottom: theme.spacing[4] }}>
          <Typography
            variant="h3"
            weight="extrabold"
            color="textPrimary"
            style={{ letterSpacing: -0.5 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              color="textSecondary"
              style={{ marginTop: theme.spacing[1] }}
            >
              {subtitle}
            </Typography>
          )}
        </View>
        {children}
      </GlassCard>
    </Animated.View>
  );
}

// ─── Pie Chart Section (Category Breakdown) ──────────────────
function PieChartSection({
  pieChartData,
  totalExpense,
  chartWidth,
  chartConfig,
}: {
  pieChartData: any[];
  totalExpense: number;
  chartWidth: number;
  chartConfig: any;
}) {
  const theme = useTheme();

  if (pieChartData.length === 0) {
    return (
      <ChartCard title="Category Breakdown" delay={250}>
        <View style={{ paddingVertical: theme.spacing[8] }}>
          <EmptyState
            icon="pie-chart"
            title="No Category Data Yet"
            description="Add transactions to see your spending breakdown."
          />
        </View>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Category Breakdown"
      subtitle="Distribution across expense categories"
      delay={250}
    >
      {/* Pie Visual with Donut Effect */}
      <View
        style={{
          alignItems: 'center',
          position: 'relative',
          marginVertical: theme.spacing[2],
        }}
      >
        <PieChart
          data={pieChartData}
          width={Math.min(chartWidth - 40, 360)}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
          center={[Math.min(chartWidth - 40, 360) / 4, 0]}
          absolute
          hasLegend={false}
        />
      </View>

      {/* Styled Legend Cards */}
      <View style={{ gap: theme.spacing[2], marginTop: theme.spacing[3] }}>
        {pieChartData.map((item: any) => {
          const percentNum =
            totalExpense > 0 ? (item.population / totalExpense) * 100 : 0;
          const percent = percentNum.toFixed(1);
          const iconName = CATEGORY_ICONS[item.name.toLowerCase()] || 'tag';

          return (
            <GlassCard
              key={item.name}
              variant="subtle"
              padding="xs"
              style={{ borderRadius: theme.borderRadius.md }}
            >
              <View
                style={{
                  paddingHorizontal: theme.spacing[2],
                  paddingVertical: theme.spacing[2],
                  gap: theme.spacing[2],
                }}
              >
                {/* Top Row: Icon + Name + Percentage + Amount */}
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
                      gap: theme.spacing[2],
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: theme.borderRadius.md,
                        backgroundColor: `${item.color}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AppIcon
                        name={iconName as any}
                        size={14}
                        color={item.color}
                      />
                    </View>
                    <Typography
                      variant="bodySm"
                      weight="semibold"
                      color="textPrimary"
                      numberOfLines={1}
                    >
                      {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                    </Typography>
                    <View
                      style={{
                        backgroundColor: `${item.color}25`,
                        paddingHorizontal: theme.spacing[2],
                        paddingVertical: 2,
                        borderRadius: theme.borderRadius.full,
                      }}
                    >
                      <Typography
                        variant="caption"
                        weight="bold"
                        style={{ color: item.color }}
                      >
                        {percent}%
                      </Typography>
                    </View>
                  </View>

                  <AmountDisplay
                    amount={item.population}
                    currency="INR"
                    size="sm"
                    compact
                    variant="default"
                  />
                </View>

                {/* Bottom Row: Progress Bar */}
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.colors.borderLight,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.min(percentNum, 100)}%`,
                      backgroundColor: item.color,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            </GlassCard>
          );
        })}
      </View>
    </ChartCard>
  );
}

// ─── Line Chart Section ──────────────────────────────────────
function LineChartSection({
  title,
  subtitle,
  data,
  chartWidth,
  chartConfig,
  delay,
}: {
  title: string;
  subtitle?: string;
  data: any;
  chartWidth: number;
  chartConfig: any;
  delay: number;
}) {
  const theme = useTheme();

  if (!data || !data.datasets[0].data.some((v: number) => v > 0)) return null;

  const actualWidth = Math.min(chartWidth - 32, 600);

  return (
    <ChartCard title={title} subtitle={subtitle} delay={delay}>
      <View
        style={{ overflow: 'hidden', alignItems: 'center', marginLeft: -20 }}
      >
        <LineChart
          data={data}
          width={actualWidth + 20}
          height={210}
          chartConfig={{
            ...chartConfig,
            propsForBackgroundLines: {
              stroke: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
              strokeWidth: 1,
              strokeDasharray: '4, 4',
            },
          }}
          formatYLabel={formatYLabel}
          bezier
          style={{ borderRadius: 16, paddingRight: 36, paddingLeft: 10 }}
          yAxisLabel="₹"
          yAxisSuffix=""
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          segments={4}
          fromZero
        />
      </View>
    </ChartCard>
  );
}

// ─── Bar Chart Section ───────────────────────────────────────
function BarChartSection({
  title,
  data,
  chartWidth,
  chartConfig,
  delay,
}: {
  title: string;
  data: any;
  chartWidth: number;
  chartConfig: any;
  delay: number;
}) {
  const theme = useTheme();

  if (!data || !data.datasets[0].data.some((v: number) => v > 0)) return null;

  const barWidth = Math.max(chartWidth - 48, data.labels.length * 70);

  return (
    <ChartCard title={title} delay={delay}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <BarChart
          data={data}
          width={barWidth}
          height={210}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => theme.colors.primary,
            labelColor: () => theme.colors.textSecondary,
            barPercentage: 0.5,
            formatYLabel,
          }}
          showBarTops={false}
          withInnerLines={false}
          yAxisLabel="₹"
          yAxisSuffix=""
          fromZero
          style={{ borderRadius: 16, paddingRight: 24 }}
        />
      </ScrollView>

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: theme.spacing[4],
          marginTop: theme.spacing[3],
        }}
      >
        {data.legend?.map((label: string, index: number) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[2],
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  index === 0 ? theme.colors.primary : theme.colors.secondary,
              }}
            />
            <Typography
              variant="caption"
              weight="semibold"
              color="textSecondary"
            >
              {label}
            </Typography>
          </View>
        ))}
      </View>
    </ChartCard>
  );
}

// ─── Trip vs Personal Card ───────────────────────────────────
function TripVsPersonalCard({ tripVsManual }: { tripVsManual: any }) {
  const theme = useTheme();

  if (!tripVsManual.tripExpenses && !tripVsManual.manualExpenses) return null;

  const tripPercent = Math.min(tripVsManual.tripPercent || 0, 100);
  const manualPercent = Math.min(tripVsManual.manualPercent || 0, 100);

  return (
    <Animated.View entering={FadeInUp.delay(600).springify().damping(18)}>
      <GlassCard variant="medium" padding="md">
        <Typography
          variant="h3"
          weight="extrabold"
          color="textPrimary"
          style={{ letterSpacing: -0.5, marginBottom: theme.spacing[4] }}
        >
          Trip vs Personal Spending
        </Typography>

        {/* Combined Progress Bar */}
        <View
          style={{
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.colors.borderLight,
            overflow: 'hidden',
            flexDirection: 'row',
            marginBottom: theme.spacing[4],
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.primary,
              width: `${tripPercent}%`,
              height: '100%',
            }}
          />
          <View
            style={{
              backgroundColor: theme.colors.secondary,
              width: `${manualPercent}%`,
              height: '100%',
            }}
          />
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: theme.spacing[1] }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[2],
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.primary,
                }}
              />
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
              >
                Trip-linked
              </Typography>
            </View>
            <AmountDisplay
              amount={tripVsManual.tripExpenses || 0}
              currency="INR"
              size="sm"
              variant="default"
            />
            <Typography variant="caption" weight="extrabold" color="primary">
              {tripVsManual.tripPercent || 0}%
            </Typography>
          </View>

          <View
            style={{ flex: 1, alignItems: 'flex-end', gap: theme.spacing[1] }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[2],
              }}
            >
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
              >
                Personal
              </Typography>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.secondary,
                }}
              />
            </View>
            <AmountDisplay
              amount={tripVsManual.manualExpenses || 0}
              currency="INR"
              size="sm"
              variant="default"
            />
            <Typography
              variant="caption"
              weight="extrabold"
              color="textSecondary"
            >
              {tripVsManual.manualPercent || 0}%
            </Typography>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Payment Methods Card ────────────────────────────────────
function PaymentMethodsCard({ paymentMethods }: { paymentMethods: any[] }) {
  const theme = useTheme();

  if (paymentMethods.length === 0) return null;

  return (
    <Animated.View entering={FadeInUp.delay(700).springify().damping(18)}>
      <GlassCard variant="medium" padding="md">
        <Typography
          variant="h3"
          weight="extrabold"
          color="textPrimary"
          style={{ letterSpacing: -0.5, marginBottom: theme.spacing[4] }}
        >
          Payment Methods
        </Typography>
        <View style={{ gap: theme.spacing[3] }}>
          {paymentMethods.map((method: any, index: number) => (
            <React.Fragment key={method.method}>
              {index > 0 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.colors.borderLight,
                  }}
                />
              )}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: theme.spacing[1],
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: theme.borderRadius.md,
                      backgroundColor: theme.colors.primaryBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon
                      name="credit-card"
                      size={14}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                  <Typography
                    variant="bodySm"
                    weight="semibold"
                    color="textPrimary"
                  >
                    {method.method}
                  </Typography>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AmountDisplay
                    amount={method.amount || 0}
                    currency="INR"
                    size="sm"
                    variant="default"
                  />
                  <Typography
                    variant="caption"
                    color="textTertiary"
                    style={{ marginTop: 2 }}
                  >
                    {method.percent || 0}%
                  </Typography>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function FinanceAnalytics({ month }: FinanceAnalyticsProps) {
  const theme = useTheme();
  const { isDesktop, width: screenWidth } = useResponsive();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );

  // Use full width on web, capped on mobile
  const chartWidth = WEB ? Math.min(screenWidth - 64, 1200) : screenWidth - 48;

  // ─── Queries ───
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = useFinanceDashboard({ month });
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useAnalytics({
    period: 'month',
    category: selectedCategory,
    type: 'expense',
  });
  const {
    data: trendsData,
    isLoading: trendsLoading,
    refetch: refetchTrends,
  } = useSpendingTrends({
    months: 6,
    category: selectedCategory,
  });
  const { data: categoriesData } = useCategories({ type: 'expense' });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([
      refetchDashboard(),
      refetchAnalytics(),
      refetchTrends(),
    ]);
    setRefreshing(false);
  }, [refetchDashboard, refetchAnalytics, refetchTrends]);

  const isLoading = dashboardLoading || analyticsLoading || trendsLoading;

  // ─── Safe Data Prep ───
  const dashboardData = useMemo(() => {
    if (!dashboard) return null;
    const totalExpense = dashboard?.monthlyOverview?.totalExpense || 0;
    if (isDataCorrupted(totalExpense)) return null;
    return dashboard;
  }, [dashboard]);

  // ─── Pie Chart Data (Vibrant Color Palette) ───
  const pieChartData = useMemo(() => {
    if (!dashboardData) return [];
    const categorySpending = dashboardData?.categoryBreakdown || [];
    const colorPalette = [
      '#F43F5E', // Rose
      '#06B6D4', // Cyan
      '#D4A03C', // Gold
      '#8B5CF6', // Violet
      '#10B981', // Green
      '#6366F1', // Indigo
      '#F59E0B', // Amber
      '#14B8A6', // Teal
    ];

    return categorySpending
      .map((cat: any, index: number) => ({
        name: cat.category,
        population: cat.spent,
        color: colorPalette[index % colorPalette.length],
        legendFontColor: theme.colors.textSecondary,
        legendFontSize: 11,
      }))
      .filter(
        (cat: any) => cat.population > 0 && !isDataCorrupted(cat.population),
      );
  }, [dashboardData, theme]);

  // ─── Line Chart Data (Daily) ───
  const lineChartData = useMemo(() => {
    if (!dashboardData) return null;
    const transactions = dashboardData?.recentTransactions || [];
    const expenses = transactions.filter((t: any) =>
      ['expense', 'trip_expense', 'settlement_paid'].includes(t.type),
    );

    const dailyTotals: Record<string, number> = {};
    expenses.forEach((t: any) => {
      const day = new Date(t.date).getDate().toString();
      const amount = isDataCorrupted(t.amount) ? 0 : t.amount;
      dailyTotals[day] = (dailyTotals[day] || 0) + amount;
    });

    const days = Object.keys(dailyTotals).sort(
      (a, b) => parseInt(a) - parseInt(b),
    );
    if (days.length === 0) {
      return {
        labels: ['1', '15', '30'],
        datasets: [
          {
            data: [0, 0, 0],
            color: (opacity = 1) => theme.colors.primary,
            strokeWidth: 2,
          },
        ],
      };
    }

    const step = Math.max(1, Math.floor(days.length / 6));
    const filteredDays = days.filter(
      (_, i) => i % step === 0 || i === days.length - 1,
    );

    return {
      labels: filteredDays,
      datasets: [
        {
          data: filteredDays.map(d => dailyTotals[d] || 0),
          color: (opacity = 1) => theme.colors.primary,
          strokeWidth: 2,
        },
      ],
    };
  }, [dashboardData, theme]);

  // ─── Bar Chart Data ───
  const barChartData = useMemo(() => {
    if (!dashboardData) return null;
    const categorySpending = dashboardData?.categoryBreakdown || [];
    const filtered = categorySpending.filter(
      (cat: any) => !isDataCorrupted(cat.spent),
    );
    if (filtered.length === 0) return null;

    const sorted = [...filtered].sort((a, b) => b.spent - a.spent).slice(0, 6);
    return {
      labels: sorted.map((cat: any) =>
        cat.category.length > 6
          ? cat.category.substring(0, 5) + '..'
          : cat.category,
      ),
      datasets: [
        { data: sorted.map((cat: any) => cat.spent) },
        { data: sorted.map((cat: any) => cat.budget || 0) },
      ],
      legend: ['Spent', 'Budget'],
    };
  }, [dashboardData]);

  // ─── Monthly Trend Data ───
  const monthlyTrendData = useMemo(() => {
    const trends = trendsData?.trends || [];
    const filteredTrends = trends.filter((t: any) => !isDataCorrupted(t.total));
    if (filteredTrends.length === 0) return null;

    return {
      labels: filteredTrends.map((t: any) => {
        const [year, monthNum] = t.month.split('-');
        return `${monthNum}/${year.slice(-2)}`;
      }),
      datasets: [
        {
          data: filteredTrends.map((t: any) => t.total),
          color: (opacity = 1) => theme.colors.primary,
          strokeWidth: 2,
        },
      ],
    };
  }, [trendsData, theme]);

  // ─── Chart Config ───
  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: 'transparent',
      backgroundGradientTo: 'transparent',
      color: (opacity = 1) =>
        theme.isDark
          ? `rgba(255, 255, 255, ${opacity})`
          : `rgba(0, 0, 0, ${opacity})`,
      labelColor: () => theme.colors.textSecondary,
      strokeWidth: 2,
      barPercentage: 0.5,
      useShadowColorFromDataset: false,
      propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: theme.colors.primary,
        fill: '#FFFFFF',
      },
      decimalPlaces: 0,
      style: { borderRadius: 16 },
      propsForLabels: {
        fontSize: 10,
        fontWeight: '600',
      },
    }),
    [theme],
  );

  // ─── Extracted data ───
  const totalExpense = isDataCorrupted(
    dashboardData?.monthlyOverview?.totalExpense,
  )
    ? 0
    : dashboardData?.monthlyOverview?.totalExpense || 0;
  const totalIncome = isDataCorrupted(
    dashboardData?.monthlyOverview?.totalIncome,
  )
    ? 0
    : dashboardData?.monthlyOverview?.totalIncome || 0;
  const categories = categoriesData || [];
  const analytics = analyticsData || {};
  const analyticsOverview = analytics.overview || {};
  const paymentMethods = analytics.paymentMethods || [];
  const tripVsManual = analytics.tripVsManual || {};

  // ─── Loading State ───
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
        <Typography
          variant="bodySm"
          color="textSecondary"
          style={{ marginTop: theme.spacing[3] }}
        >
          Loading analytics…
        </Typography>
      </View>
    );
  }

  // ─── Corrupted Data State ───
  if (!dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <EmptyState
          icon="alert-triangle"
          title="Data Error"
          description="The current data exceeds visual limits. Please refresh or contact support."
          actionLabel="Refresh"
          onAction={onRefresh}
        />
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: theme.spacing['5xl'] }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
          progressBackgroundColor={theme.colors.surface}
        />
      }
    >
      <Container maxWidth={WEB ? 1200 : undefined}>
        <View
          style={{ gap: theme.spacing[5], paddingBottom: theme.spacing[5] }}
        >
          {/* Summary Stats Bento */}
          <BentoSummaryStats
            totalExpense={totalExpense}
            totalIncome={totalIncome}
          />

          {/* Spending Intelligence */}
          <SpendingIntelligenceCard analyticsOverview={analyticsOverview} />

          {/* Category Filter Tab Bar */}
          <CategoryFilterTabBar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {/* Pie Chart */}
          <PieChartSection
            pieChartData={pieChartData}
            totalExpense={totalExpense}
            chartWidth={chartWidth}
            chartConfig={chartConfig}
          />

          {/* Monthly Trend Line */}
          {monthlyTrendData && (
            <LineChartSection
              title="Monthly Spending Trend"
              subtitle="6-month expenditure trajectory"
              data={monthlyTrendData}
              chartWidth={chartWidth}
              chartConfig={chartConfig}
              delay={400}
            />
          )}

          {/* Daily Trend Line */}
          {lineChartData && (
            <LineChartSection
              title="Daily Spending Pattern"
              subtitle="Day-by-day activity for selected period"
              data={lineChartData}
              chartWidth={chartWidth}
              chartConfig={chartConfig}
              delay={500}
            />
          )}

          {/* Bar Chart */}
          {barChartData && (
            <BarChartSection
              title="Category vs Budget"
              data={barChartData}
              chartWidth={chartWidth}
              chartConfig={chartConfig}
              delay={600}
            />
          )}

          {/* Trip vs Personal */}
          <TripVsPersonalCard tripVsManual={tripVsManual} />

          {/* Payment Methods */}
          <PaymentMethodsCard paymentMethods={paymentMethods} />
        </View>
      </Container>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});
