// components/finance/FinanceBudget.tsx
import React, { useState, useMemo } from 'react';
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
import { useBudget, useFinanceDashboard } from '../../hooks/useFinance';
import { haptics } from '../../utils/haptics';
import { safeFormatCurrency } from '../../utils/formatters';

import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { AmountDisplay } from '../ui/AmountDisplay';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { EmptyState } from '../ui/EmptyState';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { Container } from '../ui/Container';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';

import type { Theme } from '../../theme';

// ─── Constants ───────────────────────────────────────────────
const WEB = Platform.OS === 'web';

const CATEGORY_EMOJIS: Record<string, string> = {
  stay: '🏠',
  food: '🍔',
  transport: '🚗',
  Transport: '🚗',
  other: '✨',
  Food: '🍕',
  shopping: '🛍️',
  activities: '🎫',
  flights: '✈️',
  drinks: '🍻',
  entertainment: '🎬',
  bills: '⚡',
  healthcare: '❤️',
  education: '📚',
  travel: '✈️',
};

interface FinanceBudgetProps {
  month: string;
  includeTripExpenses?: boolean;
  onToggleIncludeTripExpenses?: (val: boolean) => void;
}

// ─── Bento Hero Budget Card ──────────────────────────────────
function BentoHeroCard({
  currentBudget,
  budgetSpent,
  budgetRemaining,
  budgetUsedPercent,
  isOverBudgetOverall,
  healthLabel,
  healthColor,
  formattedMonth,
  onEdit,
}: {
  currentBudget: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetUsedPercent: number;
  isOverBudgetOverall: boolean;
  healthLabel: string;
  healthColor: string;
  formattedMonth: string;
  onEdit: () => void;
}) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <GlassCard variant="prominent" padding="xl">
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.xl,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}
          >
            <AppIcon
              name="calendar"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Typography
              variant="bodySm"
              weight="semibold"
              color="textSecondary"
            >
              {formattedMonth}
            </Typography>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
            }}
          >
            <Badge label={healthLabel} variant={healthColor as any} />
            <InteractiveWrapper onPress={onEdit}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.colors.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="edit-2" size={16} color={theme.colors.primary} />
              </View>
            </InteractiveWrapper>
          </View>
        </View>

        {/* Amount */}
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <AmountDisplay amount={currentBudget} currency="INR" size="display" />
          <Typography
            variant="bodySm"
            weight="medium"
            color="textSecondary"
            style={{ marginTop: theme.spacing.sm }}
          >
            Total Budgets
          </Typography>
        </View>

        {/* Metrics - UPDATED to separate rows */}
        <View
          style={{
            flexDirection: 'column',
            gap: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          }}
        >
          <View style={{ gap: theme.spacing.xs }}>
            <Typography
              variant="caption"
              weight="semibold"
              color="textTertiary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Spent
            </Typography>
            <AmountDisplay
              amount={budgetSpent}
              currency="INR"
              size="lg"
              variant="default"
            />
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Typography
              variant="caption"
              weight="semibold"
              color="textTertiary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {isOverBudgetOverall ? 'Over By' : 'Remaining'}
            </Typography>
            <AmountDisplay
              amount={Math.abs(budgetRemaining)}
              currency="INR"
              size="lg"
              variant={isOverBudgetOverall ? 'negative' : 'positive'}
            />
          </View>
        </View>

        {/* Progress */}
        <View style={{ gap: theme.spacing.sm }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              color="textSecondary"
            >
              Progress
            </Typography>
            <Typography variant="caption" weight="bold" color="textPrimary">
              {Math.min(budgetUsedPercent, 100).toFixed(0)}% Used
            </Typography>
          </View>
          <ProgressBar
            progress={Math.min(budgetUsedPercent / 100, 1)}
            height={8}
            variant={healthColor as any}
          />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Category Row ────────────────────────────────────────────
function CategoryRow({ cat, index }: { cat: any; index: number }) {
  const theme = useTheme();
  const catBudget = Number(cat.budget || 0);
  const catSpent = Number(cat.spent ?? cat.amount ?? cat.total ?? 0);
  const catIsOver = cat.isOverBudget || (catBudget > 0 && catSpent > catBudget);
  const percentUsed =
    catBudget > 0 ? (catSpent / catBudget) * 100 : catSpent > 0 ? 100 : 0;
  const isUnbudgeted = catBudget === 0 && catSpent > 0;

  let catHealthColor: 'danger' | 'warning' | 'success' = 'success';
  if (catIsOver) catHealthColor = 'danger';
  else if (isUnbudgeted || percentUsed > 85) catHealthColor = 'warning';

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 60)
        .springify()
        .damping(18)}
    >
      <GlassCard variant="medium" padding="lg">
        <View style={{ gap: theme.spacing.md }}>
          {/* Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.md,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${theme.colors.primary}10`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body">
                {CATEGORY_EMOJIS[cat.category] || '📦'}
              </Typography>
            </View>
            <View style={{ flex: 1 }}>
              <Typography
                variant="body"
                weight="bold"
                color="textPrimary"
                style={{ textTransform: 'capitalize' }}
              >
                {cat.category}
              </Typography>
              {isUnbudgeted ? (
                <Typography variant="caption" weight="semibold" color="warning">
                  Unbudgeted
                </Typography>
              ) : (
                <Typography variant="caption" color="textSecondary">
                  {safeFormatCurrency(catSpent)} /{' '}
                  {safeFormatCurrency(catBudget)}
                </Typography>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
              <Typography
                variant="bodySm"
                weight="bold"
                color={catIsOver ? 'danger' : 'textPrimary'}
              >
                {Math.min(percentUsed, 100).toFixed(0)}%
              </Typography>
              <ProgressBar
                progress={Math.min(percentUsed / 100, 1)}
                height={5}
                variant={catHealthColor}
              />
            </View>
          </View>

          {/* Footer */}
          {!isUnbudgeted && (
            <View
              style={{
                paddingTop: theme.spacing.sm,
                borderTopWidth: 1,
                borderTopColor: theme.colors.borderLight,
              }}
            >
              <Typography
                variant="caption"
                weight="medium"
                color={catIsOver ? 'danger' : 'textTertiary'}
              >
                {catIsOver
                  ? `${safeFormatCurrency(catSpent - catBudget)} over limit`
                  : `${safeFormatCurrency(catBudget - catSpent)} left`}
              </Typography>
            </View>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function FinanceBudget({ month }: FinanceBudgetProps) {
  const theme = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: rawDashboardData,
    isLoading: isDashLoading,
    refetch: refetchDash,
  } = useFinanceDashboard({ month });
  const {
    data: rawBudgetData,
    isLoading: isBudgetLoading,
    refetch: refetchBudget,
  } = useBudget({ month });

  const dashboardData = (rawDashboardData as any)?.data || rawDashboardData;
  const budgetData = (rawBudgetData as any)?.data || rawBudgetData;
  const isLoading = isDashLoading || isBudgetLoading;

  const monthlyOverview = dashboardData?.monthlyOverview || {};
  const categoryBreakdown = dashboardData?.categoryBreakdown || [];

  const currentBudget = monthlyOverview.budget || budgetData?.totalBudget || 0;
  const budgetSpent = monthlyOverview.budgetSpent || 0;
  const budgetRemaining = monthlyOverview.budgetRemaining || 0;
  const budgetUsedPercent = monthlyOverview.budgetUsedPercent || 0;
  const isOverBudgetOverall = budgetUsedPercent > 100;

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([refetchDash(), refetchBudget()]);
    setRefreshing(false);
  };

  const navigateToEdit = () => {
    haptics.light();
    router.push('/(app)/finance/budget');
  };

  let healthLabel = 'Healthy';
  let healthColor: 'success' | 'warning' | 'danger' = 'success';
  if (isOverBudgetOverall) {
    healthLabel = 'Over Budget';
    healthColor = 'danger';
  } else if (budgetUsedPercent > 85) {
    healthLabel = 'Near Limit';
    healthColor = 'warning';
  }

  const formattedMonth = new Date(month + '-01').toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  if (isLoading && !refreshing) {
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
          style={{ marginTop: 12 }}
        >
          Loading budget…
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
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
          {currentBudget > 0 ? (
            <>
              {/* Hero Card */}
              <BentoHeroCard
                currentBudget={currentBudget}
                budgetSpent={budgetSpent}
                budgetRemaining={budgetRemaining}
                budgetUsedPercent={budgetUsedPercent}
                isOverBudgetOverall={isOverBudgetOverall}
                healthLabel={healthLabel}
                healthColor={healthColor}
                formattedMonth={formattedMonth}
                onEdit={navigateToEdit}
              />

              {/* Category Breakdown */}
              {categoryBreakdown.length > 0 && (
                <View style={{ gap: theme.spacing.md }}>
                  <Typography
                    variant="h3"
                    weight="extrabold"
                    color="textPrimary"
                    style={{ letterSpacing: -0.5 }}
                  >
                    By Category
                  </Typography>
                  {categoryBreakdown.map((cat: any, i: number) => (
                    <CategoryRow
                      key={`${cat.category}-${i}`}
                      cat={cat}
                      index={i}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <Animated.View entering={FadeInUp.springify().damping(18)}>
              <GlassCard variant="medium" padding="xl">
                <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: theme.colors.primaryBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h1">🎯</Typography>
                  </View>
                  <Typography
                    variant="h3"
                    weight="extrabold"
                    color="textPrimary"
                  >
                    No Budget Set
                  </Typography>
                  <Typography
                    variant="body"
                    color="textSecondary"
                    align="center"
                  >
                    Set a budget to track your spending and achieve your
                    financial goals.
                  </Typography>
                  <Button
                    title="Create Budget"
                    variant="primary"
                    size="lg"
                    onPress={navigateToEdit}
                    leftIcon={
                      <AppIcon
                        name="target"
                        size={16}
                        color={theme.colors.textInverse}
                      />
                    }
                  />
                </View>
              </GlassCard>
            </Animated.View>
          )}
        </View>
      </Container>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});
