import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
// app/(app)/trips/[id]/expenses.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
  Platform,
  Pressable,
  PressableStateCallbackType,
  Image,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
// Hooks & Providers
import { useInfiniteTripExpenses, useTrip } from '../../../../hooks';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useResponsive } from '../../../../hooks/useResponsive';
import { haptics } from '../../../../utils/haptics';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { Badge } from '../../../../components/ui/Badge';

// Safe web pressable type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CATEGORIES = [
  'all',
  'food',
  'stay',
  'transport',
  'activity',
  'shopping',
  'health',
  'other',
];
const CATEGORY_EMOJIS: Record<string, string> = {
  all: '📋',
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📌',
};

type ExpenseCategory =
  'food' | 'transport' | 'stay' | 'health' | 'shopping' | 'activity' | 'other';
type ExpenseStatus = 'paid' | 'pending' | 'settled';

interface CategoryConfig {
  icon: string;
  label: string;
  gradientKey:
    'sunset' | 'ocean' | 'aurora' | 'roseGold' | 'emerald' | 'gold' | 'primary';
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  food: { icon: 'coffee', label: 'Food & Drinks', gradientKey: 'sunset' },
  transport: { icon: 'map', label: 'Transport', gradientKey: 'ocean' },
  stay: { icon: 'home', label: 'Accommodation', gradientKey: 'aurora' },
  health: { icon: 'heart', label: 'Health', gradientKey: 'roseGold' },
  shopping: { icon: 'shopping-bag', label: 'Shopping', gradientKey: 'emerald' },
  activity: { icon: 'film', label: 'Activity', gradientKey: 'gold' },
  other: { icon: 'more-horizontal', label: 'Other', gradientKey: 'primary' },
};

const formatINR = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (absAmount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (absAmount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// ── STATUS BADGE ─────────────────────────────────────────────

interface StatusBadgeProps {
  status: ExpenseStatus;
  theme: any;
}

function StatusBadge({ status, theme }: StatusBadgeProps) {
  const config: Record<
    ExpenseStatus,
    { icon: string; color: string; bg: string; label: string }
  > = {
    paid: {
      icon: 'check-circle',
      color: theme.colors.success,
      bg: theme.colors.successBg,
      label: 'Paid',
    },
    pending: {
      icon: 'clock',
      color: theme.colors.warning,
      bg: theme.colors.warningBg,
      label: 'Pending',
    },
    settled: {
      icon: 'check',
      color: theme.colors.success,
      bg: theme.colors.successBg,
      label: 'Settled',
    },
  };
  const c = config[status] || config.pending;

  return (
    <View
      style={[
        badgeStyles.container,
        { backgroundColor: c.bg, borderColor: c.color + '30' },
      ]}
    >
      <View style={[badgeStyles.dot, { backgroundColor: c.color }]} />
      <Text style={[badgeStyles.text, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

// ── AVATAR GROUP ─────────────────────────────────────────────

interface AvatarGroupProps {
  members: Array<{ userId: string; displayName: string; photoURL?: string }>;
  max?: number;
  theme: any;
}

function AvatarGroup({ members, max = 3, theme }: AvatarGroupProps) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <View style={avatarGroupStyles.container}>
      {visible.map((member, i) => (
        <View
          key={member.userId + i.toString()}
          style={[
            avatarGroupStyles.avatarWrapper,
            { marginLeft: i > 0 ? -10 : 0, zIndex: visible.length - i },
          ]}
        >
          {member.photoURL ? (
            <Image
              source={{ uri: member.photoURL }}
              style={[
                avatarGroupStyles.avatar,
                { borderColor: theme.colors.background },
              ]}
            />
          ) : (
            <View
              style={[
                avatarGroupStyles.avatarPlaceholder,
                {
                  backgroundColor: theme.colors.primaryBg,
                  borderColor: theme.colors.background,
                },
              ]}
            >
              <Text
                style={[
                  avatarGroupStyles.avatarText,
                  { color: theme.colors.primary },
                ]}
              >
                {member.displayName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            avatarGroupStyles.remainingBadge,
            {
              backgroundColor: theme.colors.neutralBg,
              borderColor: theme.colors.background,
            },
          ]}
        >
          <Text
            style={[
              avatarGroupStyles.remainingText,
              { color: theme.colors.textSecondary },
            ]}
          >
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const avatarGroupStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderRadius: 999,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  remainingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    zIndex: 0,
  },
  remainingText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

// ============================================================
// Premium Expense Card (Match Global Design)
// ============================================================

function ExpenseCard({ expense, index }: { expense: any; index: number }) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const categoryConfig =
    CATEGORY_CONFIG[expense.category as string] || CATEGORY_CONFIG.other;

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { stiffness: 400, damping: 25 });
    haptics.light();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 25 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const amount = expense.amountLocal || 0;
  const yourShare = expense.yourShare?.amountLocal || 0;
  const isYouPayer = expense.youArePayer;
  const status: ExpenseStatus = expense.isSettled
    ? 'settled'
    : expense.yourShare?.isPaid
      ? 'paid'
      : 'pending';
  const splitMembers = (expense.splits || []).map((s: any) => ({
    userId: s.userId,
    displayName: s.displayName || s.user?.displayName || 'Unknown',
    photoURL: s.user?.photoURL || '',
  }));

  const animationDelay = Math.min(index * 50, 500);

  return (
    <Animated.View
      style={animatedStyle}
      entering={FadeInDown.delay(animationDelay).duration(400).springify()}
    >
      <Pressable
        onPress={() => router.push(`/(app)/expenses/${expense._id}`)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ hovered }: WebPressableState) => [
          Platform.OS === 'web' &&
            hovered &&
            ({ transform: [{ translateY: -2 }] } as any),
        ]}
      >
        <GlassCard intensity={12} style={cardStyles.card}>
          {/* Category Accent Bar */}
          <LinearGradient
            colors={
              theme.gradients[categoryConfig.gradientKey] as readonly [
                string,
                string,
                string,
              ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={cardStyles.accentBar}
          />

          <View style={cardStyles.content}>
            {/* Left: Category Icon */}
            <View
              style={[
                cardStyles.categoryIconContainer,
                { backgroundColor: theme.colors.primaryBg },
              ]}
            >
              <AppIcon
                name={categoryConfig.icon}
                size={16}
                color={theme.colors.primary}
              />
            </View>

            {/* Middle: Title + Payer & Date meta */}
            <View style={cardStyles.middleSection}>
              <Text
                style={[cardStyles.title, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {expense.title || categoryConfig.label}
              </Text>
              <View style={cardStyles.metaRow}>
                <Text
                  style={[
                    cardStyles.metaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {isYouPayer
                    ? 'You paid'
                    : `Paid by ${expense.paidByName ? expense.paidByName.split(' ')[0] : 'User'}`}
                </Text>
                <Text
                  style={[
                    cardStyles.metaDot,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    cardStyles.metaText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {categoryConfig.label}
                </Text>
                <Text
                  style={[
                    cardStyles.metaDot,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    cardStyles.metaText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {expense.date
                    ? format(new Date(expense.date), 'MMM d')
                    : 'Recently'}
                </Text>
              </View>
            </View>

            {/* Right: Amount + Status */}
            <View style={cardStyles.rightSection}>
              <Text
                style={[cardStyles.amount, { color: theme.colors.textPrimary }]}
              >
                {formatINR(amount)}
              </Text>
              <View style={cardStyles.rightBottomRow}>
                <StatusBadge status={status} theme={theme} />
                {splitMembers && splitMembers.length > 0 && (
                  <AvatarGroup members={splitMembers} max={2} theme={theme} />
                )}
              </View>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  accentBar: {
    height: 2.5,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 10,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  rightBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

// ============================================================
// Load-More Footer Spinner
// ============================================================

function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  total,
  loaded,
}: {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  total: number;
  loaded: number;
}) {
  const theme = useTheme();
  const styles = useStyles();

  if (isFetchingNextPage) {
    return (
      <View style={styles.footerLoader}>
        <GlobalLoader
          variant="inline"
          size="small"
          color={theme.colors.primary}
        />
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          Loading more…
        </Text>
      </View>
    );
  }
  if (!hasNextPage && total > 0) {
    return (
      <View style={styles.footerEnd}>
        <AppIcon name="check-circle" size={14} color={theme.colors.success} />
        <Text
          style={[styles.footerEndText, { color: theme.colors.textTertiary }]}
        >
          All {total} expenses loaded
        </Text>
      </View>
    );
  }
  return null;
}

// ============================================================
// Main Screen
// ============================================================

export default function TripExpensesScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { isDesktop } = useResponsive();

  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<
    'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  >('date_desc');

  const { data: trip } = useTrip(id as string);
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTripExpenses(
    id as string,
    category !== 'all' ? { category } : undefined,
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const expenses = useMemo(() => {
    const list =
      data?.pages?.flatMap((page: any) => page?.expenses || []) ?? [];
    return list.sort((a: any, b: any) => {
      if (sortBy === 'date_desc')
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc')
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return b.amountLocal - a.amountLocal;
      if (sortBy === 'amount_asc') return a.amountLocal - b.amountLocal;
      return 0;
    });
  }, [data, sortBy]);

  const total: number =
    data?.pages?.[data.pages.length - 1]?.pagination?.total ?? 0;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCategoryChange = (cat: string) => {
    haptics.light();
    setCategory(cat);
  };

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum: number, exp: any) => sum + exp.amountLocal, 0);
  }, [expenses]);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      <View style={[styles.webWrapper, isDesktop && styles.webDesktopContent]}>
        {/* STICKY HEADER AREA */}
        <View style={{ zIndex: 10 }}>
          {/* Premium Header */}
          <View
            style={[
              styles.header,
              {
                paddingTop: insets.top + 16,
                borderBottomColor: theme.colors.borderLight,
                backgroundColor: 'transparent',
              },
            ]}
          >
            <Pressable
              style={({ hovered }: WebPressableState) => [
                styles.headerBtn,
                Platform.OS === 'web' && hovered && ({ opacity: 0.6 } as any),
              ]}
              onPress={() => {
                haptics.light();
                router.back();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppIcon
                name="arrow-left"
                size={24}
                color={theme.colors.textPrimary}
              />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                All Expenses
              </Text>
              {total > 0 && (
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {total} expenses · ₹{totalAmount.toLocaleString()}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <Pressable
                style={({ hovered }: WebPressableState) => [
                  styles.headerIconBtn,
                  hovered && styles.headerIconBtnHover,
                ]}
                onPress={() => refetch()}
              >
                <AppIcon
                  name="refresh-cw"
                  size={20}
                  color={theme.colors.textPrimary}
                />
              </Pressable>
              <Pressable
                style={({ hovered, pressed }: WebPressableState) => [
                  styles.headerBtnEnd,
                  { backgroundColor: theme.colors.primary },
                  Platform.OS === 'web' && hovered && ({ opacity: 0.8 } as any),
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
                onPress={() => {
                  haptics.medium();
                  router.push(`/(app)/trips/${id}/add-expense`);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <AppIcon name="plus" size={22} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {/* Filter Bar */}
          <View
            style={[
              styles.filterBarContainer,
              {
                borderBottomColor: theme.colors.borderLight,
                backgroundColor: 'transparent',
              },
            ]}
          >
            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ backgroundColor: 'transparent' }}
              contentContainerStyle={[
                styles.filterContent,
                { backgroundColor: 'transparent' },
              ]}
            >
              {CATEGORIES.map(cat => {
                const isActive = category === cat;
                return (
                  <Pressable
                    key={cat}
                    style={({ hovered }: WebPressableState) => [
                      styles.filterChip,
                      {
                        borderColor: isActive
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        backgroundColor: isActive
                          ? theme.colors.primary
                          : 'transparent',
                      },
                      Platform.OS === 'web' &&
                        hovered &&
                        !isActive &&
                        ({ backgroundColor: theme.colors.primaryBg } as any),
                    ]}
                    onPress={() => handleCategoryChange(cat)}
                  >
                    <Text style={styles.filterEmoji}>
                      {CATEGORY_EMOJIS[cat]}
                    </Text>
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: isActive ? '#FFF' : theme.colors.textSecondary,
                        },
                        isActive && styles.filterTextActive,
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Sorting UI */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterContent, { paddingTop: 10 }]}
            >
              {[
                { id: 'date_desc', label: 'Newest First' },
                { id: 'date_asc', label: 'Oldest First' },
                { id: 'amount_desc', label: 'Highest Amount' },
                { id: 'amount_asc', label: 'Lowest Amount' },
              ].map(sortOption => {
                const isActive = sortBy === sortOption.id;
                return (
                  <Pressable
                    key={sortOption.id}
                    style={({ hovered }: WebPressableState) => [
                      styles.sortChip,
                      {
                        borderColor: isActive
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        backgroundColor: isActive
                          ? theme.colors.primary + '15'
                          : 'transparent',
                      },
                      Platform.OS === 'web' &&
                        hovered &&
                        !isActive &&
                        ({ backgroundColor: theme.colors.primaryBg } as any),
                    ]}
                    onPress={() => {
                      haptics.light();
                      setSortBy(sortOption.id as any);
                    }}
                  >
                    <Text
                      style={[
                        styles.sortText,
                        {
                          color: isActive
                            ? theme.colors.primary
                            : theme.colors.textSecondary,
                        },
                        isActive && styles.sortTextActive,
                      ]}
                    >
                      {sortOption.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* SCROLLABLE CONTENT */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <GlobalLoader
              variant="inline"
              size="large"
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Loading expenses…
            </Text>
          </View>
        ) : (
          <FlatList
            key={!isDesktop ? 'list' : 'grid'}
            numColumns={!isDesktop ? 1 : 2}
            columnWrapperStyle={isDesktop ? { gap: 16 } : undefined}
            data={expenses}
            keyExtractor={item => item._id}
            renderItem={({ item, index }) => (
              <ExpenseCard expense={item} index={index} />
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 40 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching && !isFetchingNextPage}
                onRefresh={refetch}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              <ListFooter
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={!!hasNextPage}
                total={total}
                loaded={expenses.length}
              />
            }
            ListEmptyComponent={
              <Animated.View
                entering={FadeInDown.duration(500).springify()}
                style={styles.emptyContainer}
              >
                <GlassCard
                  style={styles.emptyCard}
                  intensity={theme.isDark ? 15 : 8}
                >
                  <View style={styles.emptyIconWrap}>
                    <AppIcon
                      name="credit-card"
                      size={40}
                      color={theme.colors.textTertiary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    No Expenses Found
                  </Text>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {category === 'all'
                      ? "You haven't added any expenses yet."
                      : `No expenses found in the ${category} category.`}
                  </Text>

                  {category === 'all' && (
                    <Pressable
                      style={({ hovered, pressed }: WebPressableState) => [
                        styles.emptyAddBtn,
                        { backgroundColor: theme.colors.primary },
                        Platform.OS === 'web' && hovered && styles.hoverLift,
                        pressed && { transform: [{ scale: 0.95 }] },
                      ]}
                      onPress={() => {
                        haptics.medium();
                        router.push(`/(app)/trips/${id}/add-expense`);
                      }}
                    >
                      <AppIcon name="plus" size={16} color="#FFF" />
                      <Text style={styles.emptyAddBtnText}>
                        Add Your First Expense
                      </Text>
                    </Pressable>
                  )}
                </GlassCard>
              </Animated.View>
            }
          />
        )}
      </View>
    </View>
  );
}

// ============================================================
// Premium Scaled Styles
// ============================================================

const useStyles = () => {
  const theme = useTheme();
  const { isDesktop } = useResponsive();

  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        webWrapper: { flex: 1, width: '100%' },
        webDesktopContent: {
          maxWidth: 700,
          alignSelf: 'center',
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: theme.colors.borderLight,
        },

        hoverLift: {
          transform: [{ translateY: -2 }],
          ...(Platform.OS === 'web'
            ? { transition: 'transform 0.2s ease', cursor: 'pointer' }
            : {}),
        } as any,

        // Header
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderBottomWidth: 1,
        },
        headerBtn: {
          width: 40,
          alignItems: 'flex-start',
          justifyContent: 'center',
        },
        headerCenter: {
          alignItems: 'center',
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        headerIconBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.overlayLight,
          ...(Platform.OS === 'web'
            ? { transition: 'background-color 0.2s ease' }
            : {}),
        },
        headerIconBtnHover: {
          backgroundColor: theme.colors.borderLight,
        },
        headerBtnEnd: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          fontSize: 16,
          fontWeight: '800',
          letterSpacing: -0.2,
        },
        headerSubtitle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },

        // Filter Bar
        filterBarContainer: {
          borderBottomWidth: 1,
          paddingVertical: 12,
        },
        filterContent: {
          paddingHorizontal: 20,
          gap: 8,
        },
        filterChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
        },
        filterEmoji: { fontSize: 13 },
        filterText: { fontSize: 12, fontWeight: '700' },
        filterTextActive: { fontWeight: '800' },

        sortChip: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          borderWidth: 1,
        },
        sortText: { fontSize: 11, fontWeight: '600' },
        sortTextActive: { fontWeight: '800' },

        // List
        listContent: {
          paddingHorizontal: 20,
          paddingTop: 16,
        },

        // Loading & Empty States
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
        },
        loadingText: {
          fontSize: 13,
          fontWeight: '600',
        },
        emptyContainer: {
          alignItems: 'center',
          paddingTop: 60,
          paddingHorizontal: 24,
        },
        emptyCard: {
          padding: 40,
          borderRadius: 24,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
          width: '100%',
        },
        emptyIconWrap: {
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: theme.colors.overlayLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: '900',
          marginBottom: 6,
          letterSpacing: -0.5,
        },
        emptyText: {
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 24,
        },
        emptyAddBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 16,
        },
        emptyAddBtnText: {
          color: '#FFF',
          fontSize: 14,
          fontWeight: '800',
        },

        // Pagination Footer
        footerLoader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingVertical: 20,
        },
        footerText: {
          fontSize: 13,
          fontWeight: '600',
        },
        footerEnd: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 20,
        },
        footerEndText: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }),
    [theme, isDesktop],
  );
};
