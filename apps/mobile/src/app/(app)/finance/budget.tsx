import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { useTheme } from '../../../providers/ThemeProvider';
import { useResponsive } from '../../../hooks/useResponsive';
import { useSetBudget, useFinanceDashboard } from '../../../hooks';
import { haptics } from '../../../utils/haptics';
import { safeFormatCurrency } from '../../../utils/formatters';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Typography } from '../../../components/ui/Typography';
import { AmountDisplay } from '../../../components/ui/AmountDisplay';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { InteractiveWrapper } from '../../../components/ui/InteractiveWrapper';
import { Container } from '../../../components/ui/Container';
import AppIcon from '../../../components/common/AppIcon';
import GlobalLoader from '../../../components/common/GlobalLoader';

import type { Theme } from '../../../theme';

// ─── Constants ───────────────────────────────────────────────
const WEB = Platform.OS === 'web';

const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'utensils', color: '#F43F5E' },
  { id: 'stay', name: 'Accommodation', icon: 'hotel', color: '#8B5CF6' },
  { id: 'transport', name: 'Transportation', icon: 'car', color: '#06B6D4' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#D4A03C' },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'film',
    color: '#8B5CF6',
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    icon: 'file-text',
    color: '#10B981',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: 'heart-pulse',
    color: '#F43F5E',
  },
  { id: 'education', name: 'Education', icon: 'book', color: '#14B8A6' },
  { id: 'travel', name: 'Travel', icon: 'plane', color: '#10B981' },
  { id: 'other', name: 'Other', icon: 'tag', color: '#71717A' },
];

// ─── Bento Hero Budget Card ──────────────────────────────────
function BentoHeroCard({
  totalBudget,
  setTotalBudget,
  currentSpent,
  currentTotalBudget,
  budgetUsedPercent,
  budgetRemaining,
  healthLabel,
  healthColor,
  formattedMonth,
}: {
  totalBudget: string;
  setTotalBudget: (v: string) => void;
  currentSpent: number;
  currentTotalBudget: number;
  budgetUsedPercent: number;
  budgetRemaining: number;
  healthLabel: string;
  healthColor: string;
  formattedMonth: string;
}) {
  const theme = useTheme();
  const styles = useMemo(() => heroStyles(theme), [theme]);

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)}>
      <GlassCard variant="prominent" padding="xl" style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[2],
            }}
          >
            <AppIcon
              name="calendar"
              size={16}
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
          {currentTotalBudget > 0 && (
            <Badge label={healthLabel} variant={healthColor as any} />
          )}
        </View>

        {/* Budget Input */}
        <View style={styles.inputSection}>
          <Typography
            variant="caption"
            weight="bold"
            color="textSecondary"
            style={{
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: theme.spacing[2],
            }}
          >
            Total Monthly Budget
          </Typography>
          <View style={styles.inputRow}>
            <Typography
              variant="h1"
              weight="black"
              color="textPrimary"
              style={{ lineHeight: theme.typography.fontSize['5xl'] }}
            >
              ₹
            </Typography>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={totalBudget}
              onChangeText={setTotalBudget}
              accessibilityLabel="Total budget amount"
            />
          </View>
        </View>

        {/* Metrics + Progress */}
        {currentTotalBudget > 0 && (
          <View style={{ gap: theme.spacing[5] }}>
            {/* Spent vs Remaining - Fixed overlapping */}
            <View style={styles.metricsRow}>
              <View style={styles.metricColumn}>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textTertiary"
                  style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Spent
                </Typography>
                <AmountDisplay
                  amount={currentSpent}
                  currency="INR"
                  size="md"
                  variant="default"
                />
              </View>
              <View style={styles.metricColumn}>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textTertiary"
                  style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  {budgetRemaining < 0 ? 'Over By' : 'Remaining'}
                </Typography>
                <AmountDisplay
                  amount={Math.abs(budgetRemaining)}
                  currency="INR"
                  size="md"
                  variant={budgetRemaining < 0 ? 'negative' : 'positive'}
                />
              </View>
            </View>

            {/* Progress */}
            <View style={{ gap: theme.spacing[2] }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textSecondary"
                >
                  Overall Progress
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
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

function heroStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing[4],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[6],
    },
    inputSection: {
      alignItems: 'center',
      marginBottom: theme.spacing[6],
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      fontSize: theme.typography.fontSize['5xl'], // 48px
      fontWeight: theme.typography.fontWeight.black,
      height: 60,
      padding: 0,
      minWidth: 120,
      textAlign: 'center',
      marginLeft: theme.spacing[1],
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily.sans,
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing[4],
    },
    metricColumn: {
      flex: 1,
      gap: theme.spacing[1],
      alignItems: 'center',
    },
  });
}

// ─── Top Spending Card ───────────────────────────────────────
function TopSpendingCard({
  categories,
  categoryMap,
  currentSpent,
}: {
  categories: typeof CATEGORIES;
  categoryMap: Record<string, { spent: number; budget: number }>;
  currentSpent: number;
}) {
  const theme = useTheme();

  const topCategories = categories
    .map(cat => ({
      ...cat,
      spent: categoryMap[cat.id]?.spent || 0,
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 2)
    .filter(cat => cat.spent > 0);

  if (topCategories.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
      <GlassCard variant="medium" padding="lg">
        <Typography
          variant="h3"
          weight="extrabold"
          color="textPrimary"
          style={{ letterSpacing: -0.5, marginBottom: theme.spacing[4] }}
        >
          Top Spending
        </Typography>
        <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
          {topCategories.map(category => {
            const percentOfTotal =
              currentSpent > 0
                ? ((category.spent / currentSpent) * 100).toFixed(0)
                : '0';
            return (
              <View key={category.id} style={{ flex: 1, minWidth: 0 }}>
                <GlassCard variant="subtle" padding="md">
                  <View style={{ gap: theme.spacing[3] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.spacing[3],
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: theme.borderRadius.full,
                          backgroundColor: `${category.color}20`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AppIcon
                          name={category.icon as any}
                          size={18}
                          color={category.color}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="bodySm"
                          weight="bold"
                          color="textPrimary"
                          numberOfLines={1}
                        >
                          {category.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {percentOfTotal}% of total
                        </Typography>
                      </View>
                    </View>
                    <AmountDisplay
                      amount={category.spent}
                      currency="INR"
                      size="md"
                      variant="default"
                    />
                  </View>
                </GlassCard>
              </View>
            );
          })}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Category Budget Card ────────────────────────────────────
function CategoryBudgetCard({
  category,
  categoryMap,
  categoryBudgets,
  onCategoryBudgetChange,
}: {
  category: (typeof CATEGORIES)[number];
  categoryMap: Record<string, { spent: number; budget: number }>;
  categoryBudgets: Record<string, string>;
  onCategoryBudgetChange: (categoryId: string, value: string) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => catStyles(theme), [theme]);

  const catData = categoryMap[category.id] || { spent: 0, budget: 0 };
  const spent = catData.spent;
  const budgetAmount = categoryBudgets[category.id] || '';
  const currentCategoryBudget = parseFloat(budgetAmount) || 0;
  const isOverBudget =
    currentCategoryBudget > 0 && spent > currentCategoryBudget;
  const percentUsed =
    currentCategoryBudget > 0 ? (spent / currentCategoryBudget) * 100 : 0;
  const isUnbudgeted = currentCategoryBudget === 0 && spent > 0;

  let healthColor: 'danger' | 'warning' | 'success' = 'success';
  if (isOverBudget) healthColor = 'danger';
  else if (isUnbudgeted || percentUsed > 85) healthColor = 'warning';

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      layout={Layout.springify()}
    >
      <GlassCard variant="medium" padding="lg">
        <View style={{ gap: theme.spacing[4] }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[3],
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: theme.borderRadius.full,
                backgroundColor: `${category.color}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon
                name={category.icon as any}
                size={24}
                color={category.color}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body"
                weight="bold"
                color="textPrimary"
                numberOfLines={1}
              >
                {category.name}
              </Typography>
              {spent > 0 && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  numberOfLines={1}
                >
                  Spent {safeFormatCurrency(spent)}
                  {currentCategoryBudget > 0
                    ? ` / ${safeFormatCurrency(currentCategoryBudget)}`
                    : ''}
                </Typography>
              )}
            </View>
            {currentCategoryBudget > 0 && (
              <Badge
                label={isOverBudget ? 'Over' : `${percentUsed.toFixed(0)}%`}
                variant={healthColor}
              />
            )}
          </View>

          {/* Input */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.colors.primaryBg,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Typography variant="body" weight="bold" color="textSecondary">
              ₹
            </Typography>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={budgetAmount}
              onChangeText={val => onCategoryBudgetChange(category.id, val)}
              accessibilityLabel={`${category.name} budget limit`}
            />
          </View>

          {/* Progress */}
          {currentCategoryBudget > 0 && (
            <View style={{ gap: theme.spacing[1] }}>
              <ProgressBar
                progress={Math.min(percentUsed / 100, 1)}
                height={6}
                variant={healthColor}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="caption" color="textTertiary">
                  {percentUsed.toFixed(0)}% used
                </Typography>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color={isOverBudget ? 'danger' : 'success'}
                >
                  {isOverBudget
                    ? `${safeFormatCurrency(spent - currentCategoryBudget)} over`
                    : `${safeFormatCurrency(currentCategoryBudget - spent)} left`}
                </Typography>
              </View>
            </View>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function catStyles(theme: Theme) {
  return StyleSheet.create({
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[3],
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
    },
    input: {
      flex: 1,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      height: 24,
      padding: 0,
      marginLeft: theme.spacing[2],
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily.sans,
    },
  });
}

// ─── Main Screen ─────────────────────────────────────────────
export default function BudgetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setBudgetMutation = useSetBudget();

  const currentMonth = new Date().toISOString().substring(0, 7);
  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useFinanceDashboard({ month: currentMonth });

  const [totalBudget, setTotalBudget] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<
    Record<string, string>
  >({});

  const dashboard = dashboardData?.data || dashboardData || {};
  const monthlyOverview = dashboard?.monthlyOverview || {};
  const categoryBreakdown = dashboard?.categoryBreakdown || [];

  const categoryMap = useMemo(() => {
    const map: Record<string, { spent: number; budget: number }> = {};
    categoryBreakdown.forEach((cat: any) => {
      const key = cat.category.toLowerCase();
      map[key] = {
        spent: cat.spent || 0,
        budget: cat.budget || 0,
      };
    });
    return map;
  }, [categoryBreakdown]);

  // Prefill from existing data
  useEffect(() => {
    if (dashboardData) {
      const budget = monthlyOverview?.budget;
      if (budget && budget > 0) {
        setTotalBudget(budget.toString());
      }
      const initial: Record<string, string> = {};
      categoryBreakdown.forEach((cat: any) => {
        if (cat.budget > 0) {
          initial[cat.category.toLowerCase()] = cat.budget.toString();
        }
      });
      if (Object.keys(initial).length > 0) {
        setCategoryBudgets(initial);
      }
    }
  }, [dashboardData, monthlyOverview?.budget, categoryBreakdown]);

  const currentSpent = monthlyOverview?.totalExpense || 0;
  const currentTotalBudget = parseFloat(totalBudget) || 0;
  const budgetUsedPercent =
    currentTotalBudget > 0 ? (currentSpent / currentTotalBudget) * 100 : 0;
  const budgetRemaining = currentTotalBudget - currentSpent;

  const handleSave = useCallback(async () => {
    if (!totalBudget || parseFloat(totalBudget) <= 0) {
      Alert.alert(
        'Invalid Budget',
        'Please enter a valid total budget amount.',
      );
      return;
    }

    const categoryBudgetArray = Object.entries(categoryBudgets)
      .filter(([_, amount]) => amount && parseFloat(amount) > 0)
      .map(([category, amount]) => ({
        category,
        amount: parseFloat(amount),
      }));

    const sumOfCategories = categoryBudgetArray.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );
    if (sumOfCategories > parseFloat(totalBudget)) {
      Alert.alert(
        'Budget Exceeded',
        `Category budgets total ${safeFormatCurrency(sumOfCategories)}, exceeding your overall budget of ${safeFormatCurrency(parseFloat(totalBudget))}.`,
      );
      return;
    }

    try {
      haptics.success();
      await setBudgetMutation.mutateAsync({
        month: currentMonth,
        totalBudget: parseFloat(totalBudget),
        categoryBudgets: categoryBudgetArray,
      });
      Alert.alert('Success', 'Budget updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      refetch();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update budget');
    }
  }, [
    totalBudget,
    categoryBudgets,
    setBudgetMutation,
    currentMonth,
    router,
    refetch,
  ]);

  const handleCategoryBudgetChange = useCallback(
    (categoryId: string, value: string) => {
      setCategoryBudgets(prev => ({ ...prev, [categoryId]: value }));
    },
    [],
  );

  // Health
  let healthLabel = 'Healthy';
  let healthColor: 'success' | 'warning' | 'danger' = 'success';
  if (budgetUsedPercent > 100) {
    healthLabel = 'Over Budget';
    healthColor = 'danger';
  } else if (budgetUsedPercent > 85) {
    healthLabel = 'Near Limit';
    healthColor = 'warning';
  }

  const formattedMonth = new Date(currentMonth + '-01').toLocaleString(
    'default',
    {
      month: 'long',
      year: 'numeric',
    },
  );

  if (isLoading) {
    return (
      <GlobalBackground>
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
            Loading budget…
          </Typography>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <GlobalBackground>
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header - Fixed to prevent overlapping */}
        <View style={styles.headerContainer}>
          <GlassCard
            variant="medium"
            padding="none"
            style={[styles.header, { paddingTop: insets.top }]}
            intensity={theme.isDark ? 20 : 15}
          >
            <View style={styles.headerInner}>
              <InteractiveWrapper
                onPress={() => {
                  haptics.light();
                  router.back();
                }}
                hoverElevation={false}
              >
                <View
                  style={[
                    styles.headerIconBtn,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <AppIcon
                    name="chevron-left"
                    size={20}
                    color={theme.colors.textPrimary}
                  />
                </View>
              </InteractiveWrapper>
              <Typography variant="h3" weight="bold" color="textPrimary">
                Edit Budget
              </Typography>
              <InteractiveWrapper
                onPress={handleSave}
                disabled={setBudgetMutation.isPending || !totalBudget}
                hoverElevation={false}
              >
                <View
                  style={[
                    styles.headerIconBtn,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  {setBudgetMutation.isPending ? (
                    <GlobalLoader
                      variant="inline"
                      size="small"
                      color={theme.colors.primary}
                    />
                  ) : (
                    <AppIcon
                      name="check"
                      size={20}
                      color={
                        totalBudget
                          ? theme.colors.primary
                          : theme.colors.textTertiary
                      }
                    />
                  )}
                </View>
              </InteractiveWrapper>
            </View>
          </GlassCard>
        </View>

        {/* Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: theme.spacing[4], // Reduced from spacing[20] to prevent large empty space
              paddingBottom: insets.bottom + theme.spacing['5xl'], // Reduced bottom padding
            }}
          >
            <Container maxWidth={WEB ? 800 : undefined}>
              <View
                style={{
                  paddingHorizontal: theme.spacing[5],
                  gap: theme.spacing[5],
                }}
              >
                {/* Hero Budget Card */}
                <BentoHeroCard
                  totalBudget={totalBudget}
                  setTotalBudget={setTotalBudget}
                  currentSpent={currentSpent}
                  currentTotalBudget={currentTotalBudget}
                  budgetUsedPercent={budgetUsedPercent}
                  budgetRemaining={budgetRemaining}
                  healthLabel={healthLabel}
                  healthColor={healthColor}
                  formattedMonth={formattedMonth}
                />

                {/* Top Spending */}
                <TopSpendingCard
                  categories={CATEGORIES}
                  categoryMap={categoryMap}
                  currentSpent={currentSpent}
                />

                {/* Category Budgets */}
                <View style={{ gap: theme.spacing[4] }}>
                  <View>
                    <Typography
                      variant="h3"
                      weight="extrabold"
                      color="textPrimary"
                      style={{ letterSpacing: -0.5 }}
                    >
                      Category Budgets
                    </Typography>
                    <Typography
                      variant="bodySm"
                      color="textTertiary"
                      style={{ marginTop: theme.spacing[1] }}
                    >
                      Allocate your limits effectively
                    </Typography>
                  </View>
                  <View style={{ gap: theme.spacing[3] }}>
                    {CATEGORIES.map(category => (
                      <CategoryBudgetCard
                        key={category.id}
                        category={category}
                        categoryMap={categoryMap}
                        categoryBudgets={categoryBudgets}
                        onCategoryBudgetChange={handleCategoryBudgetChange}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </Container>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </GlobalBackground>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  headerContainer: {
    position: 'relative',
    zIndex: 10,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderRadius: 0,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
