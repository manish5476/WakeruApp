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
import { ExpenseCard } from '../../../../components/ui/ExpenseCard';
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

function ListFooter({ isFetchingNextPage, hasNextPage, total, loaded }: {
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    total: number;
    loaded?: number;
}) {
    const theme = useTheme();
    const styles = useStyles();

    if (isFetchingNextPage) {
        return (
            <View style={styles.footerLoader}>
                <GlobalLoader variant="inline" size="small" color={theme.colors.primary} />
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Loading more…</Text>
            </View>
        );
    }
    if (!hasNextPage && total > 0) {
        return (
            <View style={styles.footerEnd}>
                <AppIcon name="check" size={14} color={theme.colors.success} />
                <Text style={[styles.footerEndText, { color: theme.colors.textTertiary }]}>All {total} expenses loaded</Text>
            </View>
        );
    }
    return null;
}

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
            renderItem={({ item }) => (
                        <ExpenseCard
                            expense={item}
                            onPress={() => router.push(`/(app)/expenses/${item._id}`)}
                        />
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
