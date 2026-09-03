// components/finance/FinanceGoals.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { haptics } from '../../utils/haptics';
import {
  useGoals,
  useContributeToGoal,
  useCreateGoal,
  useDeleteGoal,
} from '../../hooks/useFinance';
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
import { Grid } from '../ui/Grid';
import { IconButton } from '../ui/IconButton';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';

import type { Theme } from '../../theme';

// ─── Constants ───────────────────────────────────────────────
const WEB = Platform.OS === 'web';

const GOAL_ICONS = [
  { icon: '🏠', label: 'House' },
  { icon: '🚗', label: 'Car' },
  { icon: '✈️', label: 'Travel' },
  { icon: '📚', label: 'Education' },
  { icon: '💼', label: 'Business' },
  { icon: '🏦', label: 'Savings' },
  { icon: '🎓', label: 'College' },
  { icon: '💍', label: 'Wedding' },
];

const GOAL_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#EF4444',
  '#14B8A6',
];

const GOAL_CATEGORIES = [
  { value: 'savings', label: 'Savings' },
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'travel', label: 'Travel' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
];

// ─── Filter Tab Bar ──────────────────────────────────────────
function FilterTabBar({
  activeKey,
  onChange,
  activeCount,
  completedCount,
}: {
  activeKey: 'active' | 'completed';
  onChange: (key: 'active' | 'completed') => void;
  activeCount: number;
  completedCount: number;
}) {
  const theme = useTheme();

  return (
    <GlassCard variant="subtle" padding="xs" intensity={theme.isDark ? 20 : 30}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 4,
        }}
      >
        <InteractiveWrapper
          onPress={() => {
            haptics.light();
            onChange('active');
          }}
          style={{ flex: 1 }}
        >
          <View
            style={[
              tabBarStyles(theme).tabItem,
              activeKey === 'active' && tabBarStyles(theme).tabItemActive,
            ]}
          >
            <Typography
              variant="caption"
              weight="semibold"
              color={activeKey === 'active' ? 'textInverse' : 'textSecondary'}
            >
              Active ({activeCount})
            </Typography>
          </View>
        </InteractiveWrapper>
        <InteractiveWrapper
          onPress={() => {
            haptics.light();
            onChange('completed');
          }}
          style={{ flex: 1 }}
        >
          <View
            style={[
              tabBarStyles(theme).tabItem,
              activeKey === 'completed' && tabBarStyles(theme).tabItemActive,
            ]}
          >
            <Typography
              variant="caption"
              weight="semibold"
              color={
                activeKey === 'completed' ? 'textInverse' : 'textSecondary'
              }
            >
              Completed ({completedCount})
            </Typography>
          </View>
        </InteractiveWrapper>
      </View>
    </GlassCard>
  );
}

// ─── Bento Summary Card ──────────────────────────────────────
function BentoSummaryCard({
  totalSaved,
  totalTarget,
  overallProgress,
}: {
  totalSaved: number;
  totalTarget: number;
  overallProgress: number;
}) {
  const theme = useTheme();
  const { isMobile } = useResponsive();

  if (totalTarget === 0) return null;

  if (isMobile) {
    return (
      <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
        <GlassCard variant="medium" padding="md">
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <View
              style={{ flex: 1, alignItems: 'center', gap: theme.spacing.xs }}
            >
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Total Saved
              </Typography>
              <AmountDisplay
                amount={totalSaved}
                currency="INR"
                size="md"
                variant="default"
              />
            </View>
            <View
              style={{ width: 1, backgroundColor: theme.colors.borderLight }}
            />
            <View
              style={{ flex: 1, alignItems: 'center', gap: theme.spacing.xs }}
            >
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Progress
              </Typography>
              <Typography
                variant="h2"
                weight="extrabold"
                color="textPrimary"
                style={{ letterSpacing: -0.5 }}
              >
                {overallProgress.toFixed(0)}%
              </Typography>
            </View>
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <ProgressBar
              progress={Math.min(overallProgress / 100, 1)}
              height={6}
              variant="accent"
            />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
      <GlassCard variant="medium" padding="lg">
        <View
          style={{ flexDirection: 'row', alignItems: 'stretch', width: '100%' }}
        >
          <View
            style={{ flex: 1, alignItems: 'center', gap: theme.spacing.sm }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              color="textSecondary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Total Saved
            </Typography>
            <AmountDisplay
              amount={totalSaved}
              currency="INR"
              size="lg"
              variant="default"
            />
          </View>
          <View
            style={{
              width: 1,
              alignSelf: 'stretch',
              backgroundColor: theme.colors.borderLight,
              marginHorizontal: theme.spacing.lg,
            }}
          />
          <View
            style={{ flex: 1, alignItems: 'center', gap: theme.spacing.sm }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              color="textSecondary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Overall Progress
            </Typography>
            <Typography
              variant="h2"
              weight="extrabold"
              color="textPrimary"
              style={{ letterSpacing: -0.5 }}
            >
              {overallProgress.toFixed(0)}%
            </Typography>
          </View>
          <View
            style={{
              width: 1,
              alignSelf: 'stretch',
              backgroundColor: theme.colors.borderLight,
              marginHorizontal: theme.spacing.lg,
            }}
          />
          <View
            style={{ flex: 1, alignItems: 'center', gap: theme.spacing.sm }}
          >
            <Typography
              variant="caption"
              weight="semibold"
              color="textSecondary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Target
            </Typography>
            <AmountDisplay
              amount={totalTarget}
              currency="INR"
              size="lg"
              variant="default"
            />
          </View>
        </View>
        <View style={{ marginTop: theme.spacing.lg }}>
          <ProgressBar
            progress={Math.min(overallProgress / 100, 1)}
            height={6}
            variant="accent"
          />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Goal Card ───────────────────────────────────────────────
function GoalCard({
  goal,
  isCompleted,
  onContribute,
  onDelete,
}: {
  goal: any;
  isCompleted: boolean;
  onContribute: (goal: any) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const theme = useTheme();
  const progress =
    goal.progress || (goal.savedAmount / goal.targetAmount) * 100 || 0;
  const progressClamped = Math.min(Math.max(progress, 0), 100);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      layout={Layout.springify()}
    >
      <GlassCard
        variant="medium"
        padding="lg"
        style={isCompleted && { opacity: 0.7 }}
      >
        <View style={{ gap: theme.spacing.md }}>
          {/* Icon + Title */}
          <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: (goal.color || theme.colors.primary) + '20',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h2">{goal.icon || '🎯'}</Typography>
            </View>
            <Typography
              variant="h3"
              weight="bold"
              color="textPrimary"
              numberOfLines={1}
              align="center"
            >
              {goal.title}
            </Typography>

            {/* Chips */}
            <View
              style={{
                flexDirection: 'row',
                gap: theme.spacing.xs,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {goal.category && (
                <Badge label={goal.category} variant="primary" />
              )}
              {goal.targetDate && (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <AppIcon
                    name="calendar"
                    size={10}
                    color={theme.colors.textSecondary}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(goal.targetDate)}
                  </Typography>
                </View>
              )}
            </View>
          </View>

          {/* Amount + Progress */}
          <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: theme.spacing.xs,
              }}
            >
              <AmountDisplay
                amount={goal.savedAmount}
                currency="INR"
                size="lg"
                variant={isCompleted ? 'positive' : 'default'}
              />
              <Typography variant="bodySm" color="textTertiary">
                / {safeFormatCurrency(goal.targetAmount)}
              </Typography>
            </View>

            <View style={{ width: '100%', gap: theme.spacing.xs }}>
              <ProgressBar
                progress={progressClamped / 100}
                height={8}
                variant={isCompleted ? 'success' : 'accent'}
              />
              <Typography variant="caption" color="textTertiary" align="center">
                {progressClamped.toFixed(1)}% completed
              </Typography>
            </View>
          </View>

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: theme.spacing.sm,
            }}
          >
            {!isCompleted ? (
              <>
                <Button
                  title="Add Funds"
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    haptics.medium();
                    onContribute(goal);
                  }}
                  leftIcon={
                    <AppIcon
                      name="plus"
                      size={14}
                      color={theme.colors.textInverse}
                    />
                  }
                />
                <InteractiveWrapper
                  onPress={() => {
                    haptics.light();
                    onDelete(goal._id, goal.title);
                  }}
                >
                  <View
                    style={[
                      actionStyles(theme).iconBtn,
                      { borderColor: theme.colors.borderLight },
                    ]}
                  >
                    <AppIcon
                      name="trash-2"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                </InteractiveWrapper>
              </>
            ) : (
              <Badge label="Goal Met! 🎉" variant="success" />
            )}
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Contribute Modal ────────────────────────────────────────
function ContributeModal({
  visible,
  goal,
  amount,
  setAmount,
  isPending,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  goal: any;
  amount: string;
  setAmount: (v: string) => void;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  if (!visible || !goal) return null;

  const remaining = (goal.targetAmount || 0) - (goal.savedAmount || 0);
  const isValid =
    amount.trim().length > 0 &&
    !isNaN(Number(amount)) &&
    Number(amount) > 0 &&
    Number(amount) <= remaining;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles(theme).overlay} onPress={onClose}>
        <Animated.View
          entering={FadeInUp.springify().damping(20)}
          style={[
            modalStyles(theme).content,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.borderRadius['3xl'],
              borderTopRightRadius: theme.borderRadius['3xl'],
            },
          ]}
        >
          <View style={modalStyles(theme).handleContainer}>
            <View
              style={[
                modalStyles(theme).handle,
                { backgroundColor: theme.colors.borderStrong },
              ]}
            />
          </View>

          <View style={modalStyles(theme).header}>
            <View>
              <Typography variant="h3" weight="bold" color="textPrimary">
                Add Contribution
              </Typography>
              <Typography
                variant="bodySm"
                color="textSecondary"
                style={{ marginTop: 2 }}
              >
                {goal.icon} {goal.title}
              </Typography>
            </View>
            <IconButton
              icon={
                <AppIcon name="x" size={20} color={theme.colors.textPrimary} />
              }
              size="sm"
              variant="ghost"
              onPress={onClose}
            />
          </View>

          <View style={{ gap: theme.spacing.lg }}>
            {/* Goal Info */}
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <View>
                <Typography variant="caption" color="textTertiary">
                  Saved
                </Typography>
                <AmountDisplay
                  amount={goal.savedAmount || 0}
                  currency="INR"
                  size="sm"
                  variant="default"
                />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Typography variant="caption" color="textTertiary">
                  Remaining
                </Typography>
                <AmountDisplay
                  amount={remaining}
                  currency="INR"
                  size="sm"
                  variant="default"
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={{ gap: theme.spacing.xs }}>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Amount
              </Typography>
              <TextInput
                style={inputStyles(theme).input}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={theme.colors.textTertiary}
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            <Button
              title={isPending ? 'Saving…' : 'Confirm Contribution'}
              variant="primary"
              size="lg"
              fullWidth
              onPress={onConfirm}
              disabled={!isValid || isPending}
              loading={isPending}
            />
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Create Goal Modal ───────────────────────────────────────
function CreateGoalModal({
  visible,
  onClose,
  onCreate,
  isPending,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  isPending: boolean;
}) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [category, setCategory] = useState('savings');

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    if (!target || isNaN(Number(target)) || Number(target) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    const defaultTargetDate = new Date();
    defaultTargetDate.setFullYear(defaultTargetDate.getFullYear() + 1);

    onCreate({
      title: title.trim(),
      targetAmount: Number(target),
      category,
      targetDate: targetDate || defaultTargetDate.toISOString().split('T')[0],
      icon: selectedIcon,
      color: selectedColor,
      description: description.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setTarget('');
    setDescription('');
    setTargetDate('');
    setSelectedIcon('🎯');
    setSelectedColor(GOAL_COLORS[0]);
    setCategory('savings');
  };

  if (!visible) return null;

  const isValid =
    title.trim().length > 0 && target.trim().length > 0 && Number(target) > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles(theme).overlay} onPress={onClose}>
        <Animated.View
          entering={FadeInUp.springify().damping(20)}
          style={[
            modalStyles(theme).content,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.borderRadius['3xl'],
              borderTopRightRadius: theme.borderRadius['3xl'],
            },
          ]}
        >
          <View style={modalStyles(theme).handleContainer}>
            <View
              style={[
                modalStyles(theme).handle,
                { backgroundColor: theme.colors.borderStrong },
              ]}
            />
          </View>

          <View style={modalStyles(theme).header}>
            <View>
              <Typography variant="h3" weight="bold" color="textPrimary">
                Create New Goal
              </Typography>
              <Typography
                variant="bodySm"
                color="textSecondary"
                style={{ marginTop: 2 }}
              >
                Set a target and start saving
              </Typography>
            </View>
            <IconButton
              icon={
                <AppIcon name="x" size={20} color={theme.colors.textPrimary} />
              }
              size="sm"
              variant="ghost"
              onPress={onClose}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: theme.spacing.lg,
              paddingBottom: theme.spacing.xl,
            }}
          >
            {/* Icon Selection */}
            <View style={{ gap: theme.spacing.sm }}>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Choose Icon
              </Typography>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing.sm,
                }}
              >
                {GOAL_ICONS.map(item => {
                  const isActive = selectedIcon === item.icon;
                  return (
                    <InteractiveWrapper
                      key={item.icon}
                      onPress={() => {
                        haptics.light();
                        setSelectedIcon(item.icon);
                      }}
                    >
                      <View
                        style={[
                          selectStyles(theme).iconOption,
                          isActive && selectStyles(theme).iconOptionActive,
                        ]}
                      >
                        <Typography variant="h3">{item.icon}</Typography>
                      </View>
                    </InteractiveWrapper>
                  );
                })}
              </View>
            </View>

            {/* Color Selection */}
            <View style={{ gap: theme.spacing.sm }}>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Choose Color
              </Typography>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing.sm,
                }}
              >
                {GOAL_COLORS.map(color => {
                  const isActive = selectedColor === color;
                  return (
                    <InteractiveWrapper
                      key={color}
                      onPress={() => {
                        haptics.light();
                        setSelectedColor(color);
                      }}
                    >
                      <View
                        style={[
                          selectStyles(theme).colorOption,
                          { backgroundColor: color },
                          isActive && selectStyles(theme).colorOptionActive,
                        ]}
                      />
                    </InteractiveWrapper>
                  );
                })}
              </View>
            </View>

            {/* Category */}
            <View style={{ gap: theme.spacing.sm }}>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Category
              </Typography>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing.sm,
                }}
              >
                {GOAL_CATEGORIES.map(cat => {
                  const isActive = category === cat.value;
                  return (
                    <InteractiveWrapper
                      key={cat.value}
                      onPress={() => {
                        haptics.light();
                        setCategory(cat.value);
                      }}
                    >
                      <View
                        style={[
                          selectStyles(theme).chip,
                          isActive && selectStyles(theme).chipActive,
                        ]}
                      >
                        <Typography
                          variant="caption"
                          weight="semibold"
                          color={isActive ? 'textInverse' : 'textSecondary'}
                        >
                          {cat.label}
                        </Typography>
                      </View>
                    </InteractiveWrapper>
                  );
                })}
              </View>
            </View>

            {/* Title */}
            <View style={{ gap: theme.spacing.xs }}>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Goal Title
              </Typography>
              <TextInput
                style={inputStyles(theme).input}
                placeholder="e.g. New Car"
                placeholderTextColor={theme.colors.textTertiary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Target Amount */}
            <View style={{ gap: theme.spacing.xs }}>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Target Amount
              </Typography>
              <TextInput
                style={inputStyles(theme).input}
                keyboardType="numeric"
                placeholder="e.g. 100000"
                placeholderTextColor={theme.colors.textTertiary}
                value={target}
                onChangeText={setTarget}
              />
            </View>

            {/* Description */}
            <View style={{ gap: theme.spacing.xs }}>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Description (Optional)
              </Typography>
              <TextInput
                style={[
                  inputStyles(theme).input,
                  { minHeight: 60, textAlignVertical: 'top' },
                ]}
                placeholder="Add a description…"
                placeholderTextColor={theme.colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Target Date */}
            <View style={{ gap: theme.spacing.xs }}>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Target Date (Optional)
              </Typography>
              <TextInput
                style={inputStyles(theme).input}
                placeholder="YYYY-MM-DD (defaults to 1 year)"
                placeholderTextColor={theme.colors.textTertiary}
                value={targetDate}
                onChangeText={setTargetDate}
              />
            </View>

            {/* Submit */}
            <Button
              title={isPending ? 'Creating…' : 'Create Goal'}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleCreate}
              disabled={!isValid || isPending}
              loading={isPending}
            />
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function FinanceGoals() {
  const theme = useTheme();
  const { isDesktop, width } = useResponsive();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [contributeModalVisible, setContributeModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const { data, isLoading, refetch } = useGoals({ isCompleted: false });
  const { data: completedGoalsData, refetch: refetchCompleted } = useGoals({
    isCompleted: true,
  });
  const { mutate: contribute, isPending: isContributing } =
    useContributeToGoal();
  const { mutate: createGoal, isPending: isCreating } = useCreateGoal();
  const { mutate: deleteGoal } = useDeleteGoal();

  const goals = Array.isArray(data) ? data : data?.goals || [];
  const completedGoals = Array.isArray(completedGoalsData)
    ? completedGoalsData
    : completedGoalsData?.goals || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([refetch(), refetchCompleted()]);
    setRefreshing(false);
  }, [refetch, refetchCompleted]);

  const handleContribute = useCallback(() => {
    if (!selectedGoal) return;
    const amount = Number(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (amount > selectedGoal.targetAmount - selectedGoal.savedAmount) {
      Alert.alert('Error', 'Amount exceeds remaining target');
      return;
    }

    haptics.medium();
    contribute(
      { id: selectedGoal._id, data: { amount } },
      {
        onSuccess: () => {
          setContributeModalVisible(false);
          setContributionAmount('');
          setSelectedGoal(null);
          refetch();
          refetchCompleted();
          Alert.alert('Success', 'Contribution added successfully!');
        },
        onError: (error: any) => {
          Alert.alert('Error', error?.message || 'Failed to add contribution.');
        },
      },
    );
  }, [selectedGoal, contributionAmount, contribute, refetch, refetchCompleted]);

  const handleCreateGoal = useCallback(
    (goalData: any) => {
      haptics.medium();
      createGoal(goalData, {
        onSuccess: () => {
          setCreateModalVisible(false);
          refetch();
          Alert.alert('Success', 'Goal created successfully!');
        },
        onError: (error: any) => {
          Alert.alert('Error', error?.message || 'Failed to create goal');
        },
      });
    },
    [createGoal, refetch],
  );

  const handleDeleteGoal = useCallback(
    (goalId: string, goalTitle: string) => {
      Alert.alert('Delete Goal', `Delete "${goalTitle}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            haptics.light();
            deleteGoal(goalId, {
              onSuccess: () => {
                refetch();
                Alert.alert('Success', 'Goal deleted');
              },
              onError: () => Alert.alert('Error', 'Failed to delete goal'),
            });
          },
        },
      ]);
    },
    [deleteGoal, refetch],
  );

  const totalSaved = goals.reduce(
    (sum: number, goal: any) => sum + goal.savedAmount,
    0,
  );
  const totalTarget = goals.reduce(
    (sum: number, goal: any) => sum + goal.targetAmount,
    0,
  );
  const overallProgress =
    totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const gridCols = isDesktop ? (width >= 1200 ? 3 : 2) : 1;

  const displayGoals = activeTab === 'active' ? goals : completedGoals;

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
          style={{ marginTop: 12 }}
        >
          Loading goals…
        </Typography>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
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
          <View style={{ gap: theme.spacing['3xl'] }}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View>
                <Typography
                  variant="h2"
                  weight="extrabold"
                  color="textPrimary"
                  style={{ letterSpacing: -0.5 }}
                >
                  Savings Goals
                </Typography>
                <Typography
                  variant="bodySm"
                  color="textTertiary"
                  style={{ marginTop: 2 }}
                >
                  {goals.length} active {goals.length === 1 ? 'goal' : 'goals'}
                </Typography>
              </View>
              <Button
                title="New Goal"
                variant="primary"
                size="md"
                onPress={() => {
                  haptics.light();
                  setCreateModalVisible(true);
                }}
                leftIcon={
                  <AppIcon
                    name="plus"
                    size={16}
                    color={theme.colors.textInverse}
                  />
                }
              />
            </View>

            {/* Summary */}
            {goals.length > 0 && (
              <BentoSummaryCard
                totalSaved={totalSaved}
                totalTarget={totalTarget}
                overallProgress={overallProgress}
              />
            )}

            {/* Tab Bar */}
            <FilterTabBar
              activeKey={activeTab}
              onChange={setActiveTab}
              activeCount={goals.length}
              completedCount={completedGoals.length}
            />

            {/* Goals Grid */}
            {displayGoals.length === 0 ? (
              <Animated.View entering={FadeInUp.delay(200).springify()}>
                <EmptyState
                  icon="🎯"
                  title={
                    activeTab === 'active'
                      ? 'No active goals'
                      : 'No completed goals yet'
                  }
                  description={
                    activeTab === 'active'
                      ? 'Create a goal to start tracking your progress.'
                      : "Keep saving and you'll see completed goals here."
                  }
                  actionLabel={
                    activeTab === 'active' ? 'Create Goal' : undefined
                  }
                  onAction={
                    activeTab === 'active'
                      ? () => setCreateModalVisible(true)
                      : undefined
                  }
                />
              </Animated.View>
            ) : (
              <Grid cols={gridCols} gap={theme.spacing.md}>
                {displayGoals.map((goal: any) => (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    isCompleted={activeTab === 'completed'}
                    onContribute={g => {
                      setSelectedGoal(g);
                      setContributeModalVisible(true);
                    }}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </Grid>
            )}
          </View>
        </Container>
      </ScrollView>

      {/* Contribute Modal */}
      <ContributeModal
        visible={contributeModalVisible}
        goal={selectedGoal}
        amount={contributionAmount}
        setAmount={setContributionAmount}
        isPending={isContributing}
        onConfirm={handleContribute}
        onClose={() => {
          setContributeModalVisible(false);
          setContributionAmount('');
          setSelectedGoal(null);
        }}
      />

      {/* Create Goal Modal */}
      <CreateGoalModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreateGoal}
        isPending={isCreating}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});

// ─── Tab Bar Styles ──────────────────────────────────────────
function tabBarStyles(theme: Theme) {
  return StyleSheet.create({
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: theme.borderRadius.lg,
    },
    tabItemActive: {
      backgroundColor: theme.colors.primary,
    },
  });
}

// ─── Action Styles ───────────────────────────────────────────
function actionStyles(theme: Theme) {
  return StyleSheet.create({
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

// ─── Modal Styles ────────────────────────────────────────────
function modalStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
      alignItems: WEB ? 'center' : 'stretch',
    },
    content: {
      width: WEB ? 520 : '100%',
      padding: 24,
      paddingBottom: 40,
      maxHeight: '85%',
      ...(WEB ? { marginBottom: 20, borderRadius: 24 } : {}),
    },
    handleContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    handle: {
      width: 40,
      height: 5,
      borderRadius: 3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
  });
}

// ─── Input Styles ────────────────────────────────────────────
function inputStyles(theme: Theme) {
  return StyleSheet.create({
    input: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      fontWeight: '500',
      borderColor: theme.colors.borderLight,
      backgroundColor: theme.colors.primaryBg,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily.sans,
    },
  });
}

// ─── Select Styles ───────────────────────────────────────────
function selectStyles(theme: Theme) {
  return StyleSheet.create({
    iconOption: {
      width: 52,
      height: 52,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.colors.borderLight,
      backgroundColor: theme.colors.primaryBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryBg,
    },
    colorOption: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    colorOptionActive: {
      borderWidth: 3,
      borderColor: theme.colors.textInverse,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primaryBg,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
  });
}
