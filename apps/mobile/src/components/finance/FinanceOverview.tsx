import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import GlobalLoader from '../common/GlobalLoader';
import { GlobalErrorState } from '../common/GlobalErrorState';
import { FinanceStreakCard } from './FinanceStreakCard';
import { haptics } from '../../utils/haptics';
import { useResponsive } from '../../hooks/useResponsive';
import {
  useFinanceDashboard,
  useSyncTripExpenses,
} from '../../hooks/useFinance';
import { formatDate } from '../../utils/formatters';
import AppIcon from '../common/AppIcon';

interface FinanceOverviewProps {
  month: string;
  onMonthChange?: (month: string) => void;
  onNavigateTab?: (tab: string) => void;
}

// Aligned with the new premium palette: Rose, Violet, Cyan, Gold, Green, Neutral
const CATEGORY_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  food: { icon: 'utensils', color: '#F43F5E', label: 'Food & Dining' },
  stay: { icon: 'hotel', color: '#8B5CF6', label: 'Accommodation' },
  transport: { icon: 'car', color: '#06B6D4', label: 'Transportation' },
  activity: { icon: 'zap', color: '#F43F5E', label: 'Activities' },
  shopping: { icon: 'shopping-bag', color: '#D4A03C', label: 'Shopping' },
  health: { icon: 'heart-pulse', color: '#F43F5E', label: 'Healthcare' },
  other: { icon: 'tag', color: '#71717A', label: 'Other' },
  entertainment: { icon: 'film', color: '#8B5CF6', label: 'Entertainment' },
  bills: { icon: 'file-text', color: '#6366F1', label: 'Bills & Utilities' },
  education: { icon: 'book', color: '#14B8A6', label: 'Education' },
  rent: { icon: 'home', color: '#8B5CF6', label: 'Rent' },
  travel: { icon: 'plane', color: '#10B981', label: 'Travel' },
  income: { icon: 'banknote', color: '#10B981', label: 'Income' },
  settlement: { icon: 'check-circle', color: '#10B981', label: 'Settlement' },
};

function getCategoryConfig(category: string) {
  const key = category?.toLowerCase() || 'other';
  return CATEGORY_CONFIG[key] || CATEGORY_CONFIG.other;
}

export function FinanceOverview({
  month,
  onMonthChange,
  onNavigateTab,
}: FinanceOverviewProps) {
  const theme = useTheme();
  const { width } = useResponsive();

  const [includeTripExpenses, setIncludeTripExpenses] = useState(true);

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useFinanceDashboard({
    month,
    includeTripExpenses,
  });

  const { mutate: syncTrips, isPending: isSyncing } = useSyncTripExpenses();

  const handleSync = useCallback(() => {
    syncTrips(undefined, {
      onSuccess: () => {
        Alert.alert('Success', 'Trip expenses synced successfully');
        refetch();
      },
      onError: (err: any) => {
        Alert.alert('Error', err?.message || 'Failed to sync trip expenses');
      },
    });
  }, [syncTrips, refetch]);

  const dashboard = dashboardData || {};
  const monthlyOverview = dashboard?.monthlyOverview || {};
  const categoryBreakdown = dashboard?.categoryBreakdown || [];
  const recentTransactions = dashboard?.recentTransactions || [];
  const stats = dashboard?.stats || {};

  const spent = monthlyOverview?.totalExpense || 0;
  const income = monthlyOverview?.totalIncome || 0;
  const budget = monthlyOverview?.budget || 0;
  const budgetUsedPercent = Math.max(
    0,
    Math.min(monthlyOverview?.budgetUsedPercent || 0, 100),
  );
  const averageDaily = monthlyOverview?.averageDailyExpense || 0;
  const netSavings = monthlyOverview?.netSavings || 0;
  const tripExpenses = monthlyOverview?.tripExpenses || 0;
  const manualExpenses = monthlyOverview?.manualExpenses || 0;

  const healthScore = useMemo(() => {
    if (budget === 0) return 50;
    const ratio = spent / budget;
    if (ratio <= 0.7) return 92;
    if (ratio <= 0.85) return 78;
    if (ratio <= 1) return 60;
    return 40;
  }, [spent, budget]);

  const isWide = width >= 768;

  if (isLoading && !dashboardData) {
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
          Loading financial overview…
        </Typography>
      </View>
    );
  }

  if (isError && !dashboardData) {
    return (
      <View style={styles.centerContainer}>
        <GlobalErrorState
          title="Couldn't load dashboard"
          message={
            error?.message || 'Please check your connection and try again.'
          }
          onRetry={refetch}
        />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* ── 1. Quick Actions Row ── */}
      <View style={styles.quickActionsGrid}>
        {[
          {
            icon: 'plus',
            label: 'Add Expense',
            sub: 'Manual entry',
            color: '#06B6D4',
            onPress: () => router.push('/finance/add' as any),
          },
          {
            icon: 'pie-chart',
            label: 'Set Budget',
            sub: 'Monthly limit',
            color: '#8B5CF6',
            onPress: () => router.push('/finance/budget' as any),
          },
          {
            icon: isSyncing ? 'clock' : 'refresh-cw',
            label: isSyncing ? 'Syncing...' : 'Sync Trips',
            sub: 'Pull trip splits',
            color: '#10B981',
            onPress: handleSync,
          },
          {
            icon: 'arrow-left-right',
            label: 'Settle Up',
            sub: 'Debt balances',
            color: '#D4A03C',
            onPress: () => router.push('/settlements' as any),
          },
        ].map((action, i) => (
          <Pressable
            key={i}
            onPress={() => {
              haptics.light();
              action.onPress();
            }}
            style={({ pressed }) => [
              styles.actionCardWrap,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <GlassCard
              variant="prominent"
              padding="none"
              style={styles.actionCard}
              intensity={theme.isDark ? 30 : 60}
            >
              <View style={styles.actionCardInner}>
                <View
                  style={[
                    styles.actionIconBubble,
                    {
                      backgroundColor: `${action.color}18`,
                      borderColor: `${action.color}35`,
                    },
                  ]}
                >
                  <AppIcon
                    name={action.icon as any}
                    size={18}
                    color={action.color}
                  />
                </View>
                <View style={styles.actionTextWrap}>
                  <Typography
                    variant="bodySm"
                    weight="bold"
                    color="textPrimary"
                    numberOfLines={1}
                  >
                    {action.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textTertiary"
                    numberOfLines={1}
                  >
                    {action.sub}
                  </Typography>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </View>

      {/* ── 2. Financial Health & Monthly Budget Hero ── */}
      {budget > 0 ? (
        <GlassCard
          variant="prominent"
          padding="none"
          style={styles.heroCard}
          intensity={theme.isDark ? 35 : 70}
        >
          <LinearGradient
            colors={
              theme.isDark
                ? ['rgba(212, 160, 60, 0.12)', 'rgba(212, 160, 60, 0.03)']
                : ['rgba(212, 160, 60, 0.08)', 'rgba(255, 255, 255, 0.6)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardInner}
          >
            {/* Top row: Label + Status Badge + Health Score Badge */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroTitleBlock}>
                <Typography
                  variant="caption"
                  weight="black"
                  color="primary"
                  style={{ letterSpacing: 0.8 }}
                >
                  MONTHLY BUDGET
                </Typography>
                <Badge
                  label={spent > budget ? 'OVER BUDGET' : 'ON TRACK'}
                  variant={spent > budget ? 'danger' : 'success'}
                />
              </View>

              <View
                style={[
                  styles.healthBadge,
                  {
                    backgroundColor: `${healthScore >= 75 ? '#10B981' : healthScore >= 60 ? '#D4A03C' : '#F43F5E'}18`,
                    borderColor: `${healthScore >= 75 ? '#10B981' : healthScore >= 60 ? '#D4A03C' : '#F43F5E'}35`,
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  weight="extrabold"
                  style={{
                    color:
                      healthScore >= 75
                        ? '#10B981'
                        : healthScore >= 60
                          ? '#D4A03C'
                          : '#F43F5E',
                  }}
                >
                  {healthScore}% Health
                </Typography>
              </View>
            </View>

            {/* Spent / Budget Amount Row */}
            <View style={styles.heroAmountRow}>
              <Typography
                variant="h1"
                weight="black"
                color="textPrimary"
                style={{ letterSpacing: -1, fontSize: 28 }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {'\u20B9'}
                {spent.toLocaleString('en-IN')}
              </Typography>
              <Typography
                variant="bodySm"
                weight="semibold"
                color="textTertiary"
                style={{ paddingBottom: 4 }}
              >
                / {'\u20B9'}
                {budget.toLocaleString('en-IN')} limit
              </Typography>
            </View>

            {/* Progress Bar */}
            <View
              style={[
                styles.progressTrack,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <LinearGradient
                colors={
                  spent > budget
                    ? ['#F43F5E', '#BE123C']
                    : ['#D4A03C', '#B8862D']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  { width: `${Math.min(budgetUsedPercent, 100)}%` },
                ]}
              />
            </View>

            {/* Sub Stats Row */}
            <View style={styles.heroStatsFooter}>
              <View style={styles.footerStatItem}>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textTertiary"
                  numberOfLines={1}
                >
                  Net Savings
                </Typography>
                <Typography
                  variant="bodySm"
                  weight="bold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ color: netSavings >= 0 ? '#10B981' : '#F43F5E' }}
                >
                  {netSavings >= 0 ? '+' : ''}
                  {'\u20B9'}
                  {netSavings.toLocaleString('en-IN')}
                </Typography>
              </View>

              <View style={[styles.footerStatItem, { alignItems: 'center' }]}>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textTertiary"
                  numberOfLines={1}
                >
                  Daily Avg
                </Typography>
                <Typography
                  variant="bodySm"
                  weight="bold"
                  color="textPrimary"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {'\u20B9'}
                  {Math.round(averageDaily).toLocaleString('en-IN')}/day
                </Typography>
              </View>

              <View style={[styles.footerStatItem, { alignItems: 'flex-end' }]}>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textTertiary"
                  numberOfLines={1}
                >
                  Remaining
                </Typography>
                <Typography
                  variant="bodySm"
                  weight="bold"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    color:
                      Math.max(budget - spent, 0) > 0 ? '#10B981' : '#F43F5E',
                  }}
                >
                  {'\u20B9'}
                  {Math.max(budget - spent, 0).toLocaleString('en-IN')}
                </Typography>
              </View>
            </View>
          </LinearGradient>
        </GlassCard>
      ) : (
        <GlassCard variant="prominent" padding="lg" style={styles.noBudgetCard}>
          <View style={styles.noBudgetInner}>
            <View
              style={[
                styles.noBudgetIconBubble,
                {
                  backgroundColor: `${theme.colors.primary}18`,
                  borderColor: `${theme.colors.primary}30`,
                },
              ]}
            >
              <AppIcon
                name="pie-chart"
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <View style={{ flex: 1, gap: theme.spacing[1] }}>
              <Typography variant="body" weight="bold" color="textPrimary">
                No Monthly Budget Set
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Set a spending limit for this month to monitor health and
                overspending alerts.
              </Typography>
            </View>
            <Pressable
              onPress={() => {
                haptics.light();
                router.push('/finance/budget' as any);
              }}
              style={[
                styles.setBudgetBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Typography variant="caption" weight="bold" color="textInverse">
                Set Budget
              </Typography>
            </Pressable>
          </View>
        </GlassCard>
      )}

      {/* ── 3. 4-Card Bento Grid ── */}
      <View style={styles.metricsGrid}>
        {/* Total Spent */}
        <View style={styles.metricGridItem}>
          <GlassCard variant="prominent" padding="md" style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View
                style={[
                  styles.metricIconBox,
                  { backgroundColor: 'rgba(244, 63, 94, 0.12)' },
                ]}
              >
                <AppIcon name="credit-card" size={16} color="#F43F5E" />
              </View>
              <Badge label="TOTAL SPENT" variant="danger" />
            </View>
            <Typography
              variant="h2"
              weight="extrabold"
              color="textPrimary"
              style={{ letterSpacing: -0.5 }}
            >
              {'\u20B9'}
              {spent.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" color="textTertiary">
              {stats?.transactionCount || 0} total transactions
            </Typography>
          </GlassCard>
        </View>

        {/* Net Savings */}
        <View style={styles.metricGridItem}>
          <GlassCard variant="prominent" padding="md" style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View
                style={[
                  styles.metricIconBox,
                  { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
                ]}
              >
                <AppIcon name="trending-up" size={16} color="#10B981" />
              </View>
              <Badge label="NET SAVINGS" variant="success" />
            </View>
            <Typography
              variant="h2"
              weight="extrabold"
              style={{
                letterSpacing: -0.5,
                color: netSavings >= 0 ? '#10B981' : '#F43F5E',
              }}
            >
              {netSavings >= 0 ? '+' : ''}
              {'\u20B9'}
              {netSavings.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" color="textTertiary">
              Income: {'\u20B9'}
              {income.toLocaleString('en-IN')}
            </Typography>
          </GlassCard>
        </View>

        {/* Trip Expenses */}
        <View style={styles.metricGridItem}>
          <GlassCard variant="prominent" padding="md" style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View
                style={[
                  styles.metricIconBox,
                  { backgroundColor: 'rgba(6, 182, 212, 0.12)' },
                ]}
              >
                <AppIcon name="plane" size={16} color="#06B6D4" />
              </View>
              <Badge label="TRIP EXPENSES" variant="info" />
            </View>
            <Typography
              variant="h2"
              weight="extrabold"
              color="textPrimary"
              style={{ letterSpacing: -0.5 }}
            >
              {'\u20B9'}
              {tripExpenses.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" color="textTertiary">
              Synced from trip stops
            </Typography>
          </GlassCard>
        </View>

        {/* Manual / Direct */}
        <View style={styles.metricGridItem}>
          <GlassCard variant="prominent" padding="md" style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <View
                style={[
                  styles.metricIconBox,
                  { backgroundColor: 'rgba(212, 160, 60, 0.12)' },
                ]}
              >
                <AppIcon name="file-text" size={16} color="#D4A03C" />
              </View>
              <Badge label="PERSONAL / MANUAL" variant="warning" />
            </View>
            <Typography
              variant="h2"
              weight="extrabold"
              color="textPrimary"
              style={{ letterSpacing: -0.5 }}
            >
              {'\u20B9'}
              {manualExpenses.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" color="textTertiary">
              Direct expense entries
            </Typography>
          </GlassCard>
        </View>
      </View>

      {/* ── 4. Spending Toggle & Streak Card ── */}
      <View style={styles.streakRow}>
        <GlassCard variant="subtle" padding="sm" style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <View
              style={[
                styles.toggleIconWrap,
                { backgroundColor: `${theme.colors.primary}18` },
              ]}
            >
              <AppIcon name="plane" size={15} color={theme.colors.primary} />
            </View>
            <View>
              <Typography variant="bodySm" weight="bold" color="textPrimary">
                Include Trip Expenses
              </Typography>
              <Typography variant="caption" color="textTertiary">
                Show shared trip expenses in monthly totals
              </Typography>
            </View>
          </View>
          <Switch
            value={includeTripExpenses}
            onValueChange={val => {
              haptics.light();
              setIncludeTripExpenses(val);
            }}
            trackColor={{
              false: theme.colors.borderLight,
              true: theme.colors.primary,
            }}
            thumbColor="#FFF"
          />
        </GlassCard>

        <FinanceStreakCard limit={100} />
      </View>

      {/* ── 5. Category Breakdown & Recent Transactions ── */}
      <View
        style={[
          styles.bottomSectionGrid,
          isWide && styles.bottomSectionGridWide,
        ]}
      >
        {/* Category Breakdown */}
        <View style={styles.sectionCol}>
          <GlassCard
            variant="prominent"
            padding="md"
            style={styles.sectionCard}
          >
            <View style={styles.sectionHeaderRow}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                }}
              >
                <AppIcon
                  name="pie-chart"
                  size={16}
                  color={theme.colors.primary}
                />
                <Typography variant="body" weight="bold" color="textPrimary">
                  Category Spending
                </Typography>
              </View>
              <Pressable
                onPress={() => {
                  haptics.light();
                  if (onNavigateTab) {
                    onNavigateTab('Analytics');
                  } else {
                    router.push('/(app)/analytics' as any);
                  }
                }}
              >
                <Typography variant="caption" weight="bold" color="primary">
                  View All →
                </Typography>
              </Pressable>
            </View>

            {categoryBreakdown.length === 0 ? (
              <EmptyState
                icon="pie-chart"
                title="No Categorized Spending"
                description="Expenses added this month will automatically appear here."
              />
            ) : (
              <View
                style={{ gap: theme.spacing[3], marginTop: theme.spacing[3] }}
              >
                {categoryBreakdown.slice(0, 5).map((cat: any, i: number) => {
                  const config = getCategoryConfig(cat.category);
                  // ✅ FIX: Use cat.spent and cat.percentOfTotal from the API response
                  const catAmount = cat.spent || 0;
                  const catPercent =
                    cat.percentOfTotal ||
                    (spent > 0 ? Math.round((catAmount / spent) * 100) : 0);

                  return (
                    <View key={i} style={styles.categoryRow}>
                      <View
                        style={[
                          styles.catIconWrap,
                          { backgroundColor: `${config.color}18` },
                        ]}
                      >
                        <AppIcon
                          name={config.icon as any}
                          size={14}
                          color={config.color}
                        />
                      </View>
                      <View style={{ flex: 1, gap: theme.spacing[1] }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography
                            variant="bodySm"
                            weight="semibold"
                            color="textPrimary"
                          >
                            {config.label}
                          </Typography>
                          <Typography
                            variant="bodySm"
                            weight="bold"
                            color="textPrimary"
                          >
                            {'\u20B9'}
                            {Number(catAmount).toLocaleString('en-IN')} (
                            {catPercent}%)
                          </Typography>
                        </View>
                        <View
                          style={[
                            styles.catTrack,
                            {
                              backgroundColor: theme.isDark
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(0,0,0,0.05)',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.catFill,
                              {
                                width: `${catPercent}%`,
                                backgroundColor: config.color,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </GlassCard>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionCol}>
          <GlassCard
            variant="prominent"
            padding="md"
            style={styles.sectionCard}
          >
            <View style={styles.sectionHeaderRow}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                }}
              >
                <AppIcon name="clock" size={16} color={theme.colors.info} />
                <Typography variant="body" weight="bold" color="textPrimary">
                  Recent Activity
                </Typography>
              </View>
              <Pressable
                onPress={() => {
                  haptics.light();
                  router.push('/finance/transactions' as any);
                }}
              >
                <Typography variant="caption" weight="bold" color="primary">
                  History →
                </Typography>
              </Pressable>
            </View>

            {recentTransactions.length === 0 ? (
              <EmptyState
                icon="file-text"
                title="No Transactions"
                description="Add expenses or sync trips to track your transaction feed."
              />
            ) : (
              <View
                style={{ gap: theme.spacing[2], marginTop: theme.spacing[3] }}
              >
                {recentTransactions
                  .slice(0, 6)
                  .map((tx: any, index: number) => {
                    const isIncome =
                      tx.type === 'income' || tx.type === 'settlement_received';
                    const isTrip = tx.type === 'trip_expense';
                    const config = getCategoryConfig(tx.category);

                    return (
                      <Pressable
                        key={tx._id || index}
                        onPress={() => {
                          haptics.light();
                          router.push(`/finance/transaction/${tx._id}` as any);
                        }}
                        style={[
                          styles.txItemRow,
                          { borderBottomColor: theme.colors.borderLight },
                          index === 5 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View
                          style={[
                            styles.txIconBox,
                            {
                              backgroundColor: isTrip
                                ? 'rgba(6, 182, 212, 0.12)'
                                : `${config.color}18`,
                            },
                          ]}
                        >
                          <AppIcon
                            name={isTrip ? 'plane' : (config.icon as any)}
                            size={14}
                            color={isTrip ? '#06B6D4' : config.color}
                          />
                        </View>

                        <View style={{ flex: 1, gap: 2 }}>
                          <Typography
                            variant="bodySm"
                            weight="semibold"
                            color="textPrimary"
                            numberOfLines={1}
                          >
                            {tx.title || 'Expense'}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textTertiary"
                            numberOfLines={1}
                          >
                            {isTrip
                              ? `Trip: ${tx.tripName || 'Travel'}`
                              : config.label}{' '}
                            • {formatDate(tx.date) || 'Unknown Date'}
                          </Typography>
                        </View>

                        <Typography
                          variant="bodySm"
                          weight="bold"
                          style={{
                            color: isIncome
                              ? '#10B981'
                              : theme.colors.textPrimary,
                          }}
                        >
                          {isIncome ? '+' : ''}
                          {'\u20B9'}
                          {Number(tx.amount || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Pressable>
                    );
                  })}
              </View>
            )}
          </GlassCard>
        </View>
      </View>
    </Animated.View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    gap: 16,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCardWrap: {
    flex: 1,
    minWidth: 140,
  },
  actionCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  actionIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    // ✅ FIX: Replaced invalid boxShadow string with RN-compatible shadow properties
    shadowColor: '#D4A03C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
  },
  heroCardInner: {
    padding: 18,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroStatsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    gap: 8,
  },
  footerStatItem: {
    flex: 1,
    gap: 2,
  },
  noBudgetCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  noBudgetInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  noBudgetIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBudgetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricGridItem: {
    flex: 1,
    minWidth: 200,
  },
  metricCard: {
    borderRadius: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakRow: {
    gap: 12,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSectionGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  bottomSectionGridWide: {
    flexDirection: 'row',
  },
  sectionCol: {
    flex: 1,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  txItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
