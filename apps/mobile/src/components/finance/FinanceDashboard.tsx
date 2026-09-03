import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { haptics } from '../../utils/haptics';
import {
  useFinanceDashboard,
  useSyncTripExpenses,
} from '../../hooks/useFinance';
import { safeFormatCurrency, formatDate } from '../../utils/formatters';

import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { AmountDisplay } from '../ui/AmountDisplay';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { EmptyState } from '../ui/EmptyState';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { Container } from '../ui/Container';
import { Grid } from '../ui/Grid';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';

import type { Theme } from '../../theme';

// ─── Constants ───────────────────────────────────────────────
const WEB = Platform.OS === 'web';

interface FinanceDashboardProps {
  month?: string;
  onMonthChange?: (month: string) => void;
}

// ─── Category Helpers ────────────────────────────────────────
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    food: '#F43F5E', // Rose
    transport: '#06B6D4', // Cyan
    stay: '#8B5CF6', // Violet
    activities: '#F43F5E', // Rose
    shopping: '#D4A03C', // Gold
    health: '#10B981', // Green
    other: '#71717A', // Neutral
  };
  return colors[category?.toLowerCase()] || '#71717A';
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    food: 'utensils',
    transport: 'car',
    stay: 'hotel',
    activities: 'zap',
    shopping: 'shopping-bag',
    health: 'heart-pulse',
    other: 'tag',
  };
  return icons[category?.toLowerCase()] || 'tag';
}

// ─── Month Selector ──────────────────────────────────────────
function MonthSelector({
  currentMonth,
  onMonthChange,
}: {
  currentMonth: string;
  onMonthChange: (month: string) => void;
}) {
  const theme = useTheme();
  const [year, month] = currentMonth.split('-').map(Number);
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const goToPrevious = () => {
    haptics.light();
    const newDate = new Date(year, month - 2);
    onMonthChange(newDate.toISOString().substring(0, 7));
  };

  const goToNext = () => {
    haptics.light();
    const newDate = new Date(year, month);
    onMonthChange(newDate.toISOString().substring(0, 7));
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[4],
      }}
    >
      <InteractiveWrapper onPress={goToPrevious} hoverElevation={false}>
        <View
          style={[navStyles(theme).btn, { borderColor: theme.colors.border }]}
        >
          <AppIcon
            name="chevron-left"
            size={18}
            color={theme.colors.textSecondary}
          />
        </View>
      </InteractiveWrapper>
      <Typography variant="h3" weight="bold" color="textPrimary">
        {monthNames[month - 1]} {year}
      </Typography>
      <InteractiveWrapper onPress={goToNext} hoverElevation={false}>
        <View
          style={[navStyles(theme).btn, { borderColor: theme.colors.border }]}
        >
          <AppIcon
            name="chevron-right"
            size={18}
            color={theme.colors.textSecondary}
          />
        </View>
      </InteractiveWrapper>
    </View>
  );
}

// ─── Quick Stat Card ─────────────────────────────────────────
function QuickStatCard({
  icon,
  label,
  value,
  subtitle,
  change,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  subtitle?: string;
  change?: number;
  color: string;
}) {
  const theme = useTheme();
  const isPositive = change !== undefined && change > 0;

  return (
    <GlassCard
      variant="subtle"
      padding="md"
      style={{ flex: 1, minWidth: '45%' }}
    >
      <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
        {/* Icon */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: theme.borderRadius.md,
            backgroundColor: `${color}20`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name={icon as any} size={16} color={color} />
        </View>

        {/* Value */}
        <Typography
          variant="h3"
          weight="extrabold"
          color="textPrimary"
          align="center"
          style={{ letterSpacing: -0.5 }}
        >
          {value}
        </Typography>

        {/* Label */}
        <Typography
          variant="caption"
          weight="semibold"
          color="textSecondary"
          align="center"
          style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          {label}
        </Typography>

        {/* Change Badge */}
        {change !== undefined && change !== 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[1],
              paddingHorizontal: theme.spacing[2],
              paddingVertical: 2,
              borderRadius: theme.borderRadius.full,
              backgroundColor: isPositive
                ? `${theme.colors.success}20`
                : `${theme.colors.danger}20`,
            }}
          >
            <AppIcon
              name={isPositive ? 'arrow-up' : 'arrow-down'}
              size={10}
              color={isPositive ? theme.colors.success : theme.colors.danger}
            />
            <Typography
              variant="caption"
              weight="bold"
              color={isPositive ? 'success' : 'danger'}
            >
              {Math.abs(change)}%
            </Typography>
          </View>
        )}

        {/* Subtitle */}
        {subtitle && (
          <Typography variant="caption" color="textTertiary" align="center">
            {subtitle}
          </Typography>
        )}
      </View>
    </GlassCard>
  );
}

// ─── Category Row ────────────────────────────────────────────
function CategoryRow({
  category,
  index,
  isLast,
}: {
  category: any;
  index: number;
  isLast: boolean;
}) {
  const theme = useTheme();
  const color = getCategoryColor(category.category);
  const iconName = getCategoryIcon(category.category);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .springify()
        .damping(18)}
    >
      <View
        style={[
          catRowStyles(theme).row,
          !isLast && {
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[3],
            flex: 1,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: theme.borderRadius.md,
              backgroundColor: `${color}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name={iconName as any} size={16} color={color} />
          </View>
          <View>
            <Typography
              variant="bodySm"
              weight="semibold"
              color="textPrimary"
              style={{ textTransform: 'capitalize' }}
            >
              {category.category}
            </Typography>
            <Typography variant="caption" color="textTertiary">
              {category.percentOfTotal}% of total
            </Typography>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: theme.spacing[1] }}>
          <AmountDisplay
            amount={category.spent}
            currency="INR"
            size="sm"
            compact
            variant="default"
          />
          {category.isOverBudget && (
            <Badge label="Over Budget" variant="danger" />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Goal Row ────────────────────────────────────────────────
function GoalRow({ goal }: { goal: any }) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <GlassCard variant="medium" padding="lg">
        <View style={{ gap: theme.spacing[3] }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
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
                  width: 36,
                  height: 36,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: `${theme.colors.primary}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="target" size={18} color={theme.colors.primary} />
              </View>
              <View>
                <Typography
                  variant="body"
                  weight="semibold"
                  color="textPrimary"
                >
                  {goal.title}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {safeFormatCurrency(goal.savedAmount)} /{' '}
                  {safeFormatCurrency(goal.targetAmount)}
                </Typography>
              </View>
            </View>
            <Badge label={`${goal.progress}%`} variant="primary" />
          </View>

          {/* Progress */}
          <ProgressBar
            progress={Math.min((goal.progress || 0) / 100, 1)}
            height={6}
            variant="accent"
          />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Bill Row ────────────────────────────────────────────────
function BillRow({ bill }: { bill: any }) {
  const theme = useTheme();
  const dueDate = new Date(bill.dueDate);
  const now = new Date();
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isOverdue = daysUntilDue < 0;

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <GlassCard variant="medium" padding="md">
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[3],
              flex: 1,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.dangerBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="file-text" size={16} color={theme.colors.danger} />
            </View>
            <View>
              <Typography
                variant="bodySm"
                weight="semibold"
                color="textPrimary"
              >
                {bill.title}
              </Typography>
              <Typography
                variant="caption"
                color={isOverdue ? 'danger' : 'textTertiary'}
              >
                Due{' '}
                {isOverdue
                  ? `${Math.abs(daysUntilDue)}d ago`
                  : `in ${daysUntilDue}d`}
              </Typography>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: theme.spacing[1] }}>
            <AmountDisplay
              amount={bill.amount}
              currency={bill.currency || 'INR'}
              size="sm"
              compact
              variant="default"
            />
            <Badge label={bill.frequency} variant="neutral" />
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Transaction Row ─────────────────────────────────────────
function TransactionRow({ transaction }: { transaction: any }) {
  const theme = useTheme();
  const router = useRouter();
  const isIncome =
    transaction.type === 'income' || transaction.type === 'settlement_received';
  const isExpense = ['expense', 'trip_expense', 'settlement_paid'].includes(
    transaction.type,
  );

  let icon = 'arrow-right';
  let iconBgColor = theme.colors.primaryBg;
  let iconColor = theme.colors.textSecondary;

  if (isIncome) {
    icon = 'arrow-down';
    iconBgColor = theme.colors.successBg;
    iconColor = theme.colors.success;
  }
  if (isExpense) {
    icon = 'arrow-up';
    iconBgColor = theme.colors.dangerBg;
    iconColor = theme.colors.danger;
  }
  if (transaction.type === 'trip_expense') {
    icon = 'users';
    iconBgColor = 'rgba(139, 92, 246, 0.12)'; // Violet 500 with 12% opacity
    iconColor = '#8B5CF6';
  }

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <InteractiveWrapper
        onPress={() => {
          haptics.light();
          router.push(`/finance/transaction/${transaction._id}` as any);
        }}
      >
        <GlassCard variant="subtle" padding="md">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[3],
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: theme.borderRadius.lg,
                backgroundColor: iconBgColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name={icon as any} size={18} color={iconColor} />
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Typography
                variant="bodySm"
                weight="semibold"
                color="textPrimary"
                numberOfLines={1}
              >
                {transaction.title}
              </Typography>
              <Typography
                variant="caption"
                color="textTertiary"
                numberOfLines={1}
              >
                {transaction.category} • {formatDate(transaction.date)}
                {transaction.tripName && ` • ${transaction.tripName}`}
              </Typography>
            </View>

            {/* Amount */}
            <AmountDisplay
              amount={transaction.amount}
              currency={transaction.currency || 'INR'}
              size="sm"
              variant={
                isIncome ? 'positive' : isExpense ? 'negative' : 'neutral'
              }
              showSign
            />
          </View>
        </GlassCard>
      </InteractiveWrapper>
    </Animated.View>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function FinanceDashboard({
  month,
  onMonthChange,
}: FinanceDashboardProps) {
  const theme = useTheme();
  const router = useRouter();
  const { isDesktop, width } = useResponsive();
  const styles = dashboardStyles(theme);

  const {
    data: dashboard,
    isLoading,
    refetch,
  } = useFinanceDashboard({ month });
  const { mutate: syncExpenses, isPending: isSyncing } = useSyncTripExpenses();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    month || new Date().toISOString().substring(0, 7),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleMonthChange = useCallback(
    (newMonth: string) => {
      setSelectedMonth(newMonth);
      onMonthChange?.(newMonth);
    },
    [onMonthChange],
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
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
          Loading dashboard…
        </Typography>
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          icon="pie-chart"
          title="No Data Available"
          description="Sync your trip expenses to see your financial overview."
          actionLabel="Sync Trip Expenses"
          onAction={() => {
            haptics.medium();
            syncExpenses({} as any);
          }}
        />
      </View>
    );
  }

  const {
    monthlyOverview,
    categoryBreakdown,
    recentTransactions,
    goals,
    bills,
  } = dashboard;
  const gridCols = isDesktop ? (width >= 1200 ? 4 : 2) : 2;

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
      <Container maxWidth={WEB ? 800 : undefined}>
        <View style={{ gap: theme.spacing['3xl'] }}>
          {/* Month Selector */}
          <MonthSelector
            currentMonth={selectedMonth}
            onMonthChange={handleMonthChange}
          />

          {/* Quick Stats */}
          <Grid cols={gridCols} gap={theme.spacing.md}>
            <QuickStatCard
              icon="arrow-down"
              label="Income"
              value={safeFormatCurrency(monthlyOverview.totalIncome)}
              change={monthlyOverview.comparedToLastMonth?.incomeChange}
              color={theme.colors.success}
            />
            <QuickStatCard
              icon="arrow-up"
              label="Expenses"
              value={safeFormatCurrency(monthlyOverview.totalExpense)}
              change={monthlyOverview.comparedToLastMonth?.expensesChange}
              color={theme.colors.danger}
            />
            <QuickStatCard
              icon="briefcase"
              label="Savings"
              value={safeFormatCurrency(monthlyOverview.netSavings)}
              change={monthlyOverview.comparedToLastMonth?.savingsChange}
              color={theme.colors.info}
            />
            <QuickStatCard
              icon="pie-chart"
              label="Budget Used"
              value={`${monthlyOverview.budgetUsedPercent}%`}
              subtitle={`${safeFormatCurrency(monthlyOverview.budgetSpent)} / ${safeFormatCurrency(monthlyOverview.budget)}`}
              color={theme.colors.warning}
            />
          </Grid>

          {/* Budget Progress */}
          <Animated.View entering={FadeInUp.delay(100).springify().damping(18)}>
            <GlassCard variant="medium" padding="lg">
              <View style={{ gap: theme.spacing[3] }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body" weight="bold" color="textPrimary">
                    Monthly Budget
                  </Typography>
                  <Typography
                    variant="bodySm"
                    weight="semibold"
                    color="textSecondary"
                  >
                    Remaining:{' '}
                    {safeFormatCurrency(monthlyOverview.budgetRemaining)}
                  </Typography>
                </View>
                <View style={{ gap: theme.spacing[1] }}>
                  <ProgressBar
                    progress={Math.min(
                      monthlyOverview.budgetUsedPercent / 100,
                      1,
                    )}
                    height={8}
                    variant={
                      monthlyOverview.budgetUsedPercent > 90
                        ? 'danger'
                        : monthlyOverview.budgetUsedPercent > 70
                          ? 'warning'
                          : 'success'
                    }
                  />
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color="textSecondary"
                    align="right"
                  >
                    {Math.min(monthlyOverview.budgetUsedPercent, 100)}%
                  </Typography>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <View style={{ gap: theme.spacing[3] }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="h3"
                  weight="extrabold"
                  color="textPrimary"
                  style={{ letterSpacing: -0.5 }}
                >
                  Spending by Category
                </Typography>
                <InteractiveWrapper
                  onPress={() => {
                    haptics.light();
                    router.push('/(app)/analytics' as any);
                  }}
                >
                  <Typography variant="bodySm" weight="bold" color="primary">
                    See All →
                  </Typography>
                </InteractiveWrapper>
              </View>
              <GlassCard variant="medium" padding="lg">
                {categoryBreakdown
                  .slice(0, 5)
                  .map((category: any, index: number) => (
                    <CategoryRow
                      key={category.category}
                      category={category}
                      index={index}
                      isLast={
                        index === Math.min(categoryBreakdown.length, 5) - 1
                      }
                    />
                  ))}
              </GlassCard>
            </View>
          )}

          {/* Goals */}
          {goals?.items?.length > 0 && (
            <View style={{ gap: theme.spacing[3] }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="h3"
                  weight="extrabold"
                  color="textPrimary"
                  style={{ letterSpacing: -0.5 }}
                >
                  Goals Progress
                </Typography>
                <InteractiveWrapper
                  onPress={() => {
                    haptics.light();
                    router.push('/(app)/(tabs)/finance' as any);
                  }}
                >
                  <Typography variant="bodySm" weight="bold" color="primary">
                    View All →
                  </Typography>
                </InteractiveWrapper>
              </View>
              <View style={{ gap: theme.spacing[3] }}>
                {goals.items.slice(0, 3).map((goal: any) => (
                  <GoalRow key={goal._id} goal={goal} />
                ))}
              </View>
            </View>
          )}

          {/* Upcoming Bills */}
          {bills?.upcoming?.length > 0 && (
            <View style={{ gap: theme.spacing[3] }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="h3"
                  weight="extrabold"
                  color="textPrimary"
                  style={{ letterSpacing: -0.5 }}
                >
                  Upcoming Bills
                </Typography>
                <InteractiveWrapper
                  onPress={() => {
                    haptics.light();
                    router.push('/(app)/(tabs)/finance' as any);
                  }}
                >
                  <Typography variant="bodySm" weight="bold" color="primary">
                    View All →
                  </Typography>
                </InteractiveWrapper>
              </View>
              <View style={{ gap: theme.spacing[3] }}>
                {bills.upcoming.slice(0, 3).map((bill: any) => (
                  <BillRow key={bill._id} bill={bill} />
                ))}
              </View>
            </View>
          )}

          {/* Recent Transactions */}
          <View style={{ gap: theme.spacing[3] }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="h3"
                weight="extrabold"
                color="textPrimary"
                style={{ letterSpacing: -0.5 }}
              >
                Recent Transactions
              </Typography>
              <InteractiveWrapper
                onPress={() => {
                  haptics.light();
                  router.push('/finance/transactions' as any);
                }}
              >
                <Typography variant="bodySm" weight="bold" color="primary">
                  See All →
                </Typography>
              </InteractiveWrapper>
            </View>
            <View style={{ gap: theme.spacing[2] }}>
              {recentTransactions.slice(0, 5).map((transaction: any) => (
                <TransactionRow
                  key={transaction._id}
                  transaction={transaction}
                />
              ))}
            </View>
          </View>
        </View>
      </Container>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
function dashboardStyles(theme: Theme) {
  return StyleSheet.create({
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing[10],
    },
  });
}

function navStyles(theme: Theme) {
  return StyleSheet.create({
    btn: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

function catRowStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing[3],
    },
  });
}
