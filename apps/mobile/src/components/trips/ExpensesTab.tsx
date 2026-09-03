// components/trips/ExpensesTab.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Hooks & Stores
import { useInfiniteTripExpenses, useTrip } from '../../hooks';
import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { haptics } from '../../utils/haptics';
import { useAuthStore } from '../../stores/auth.store';

// UI Components
import GlobalLoader from '../common/GlobalLoader';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';

import { generateDashboardUI } from './Expenses/ExpenseMappers';
import { SortOption } from './Expenses/ExpenseMappers';
import { TripFinancialHero } from './Expenses/TripFinancialHero';
import { SettlementOverview } from './Expenses/SettlementOverview';
import { CategoryFilters } from './Expenses/CategoryFilters';
import { CategoryAnalytics } from './Expenses/CategoryAnalytics';
import { ExpenseTimeline } from './Expenses/ExpenseTimeline';
import type { Theme } from '../../theme';

function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  total,
}: {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  total: number;
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
        <Typography variant="caption" weight="bold" color="textSecondary">
          Loading more…
        </Typography>
      </View>
    );
  }
  if (!hasNextPage && total > 0) {
    return (
      <View style={styles.footerEnd}>
        {/* FIX: was AppIcon name="check-circle" — rendered as a blank
                    box in earlier screens because AppIcon's glyph wasn't
                    loading. Typography+emoji always renders. */}
        <Typography variant="caption" color="success">
          ✅
        </Typography>
        <Typography
          variant="caption"
          weight="bold"
          color="textTertiary"
          style={{ letterSpacing: 0.5 }}
        >
          All {total} expenses loaded
        </Typography>
      </View>
    );
  }
  return null;
}

export default function ExpensesTab({ tripId }: { tripId: string }) {
  const theme = useTheme();
  const styles = useStyles();
  const { isMobile } = useResponsive();
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const currentUser = useAuthStore(state => state.user);

  const { data: trip } = useTrip(tripId);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTripExpenses(tripId, {
    ...(category !== 'all' && category !== 'archived' ? { category } : {}),
    ...(category === 'archived' ? { isArchived: true } : {}),
  });

  const expenses = useMemo(
    () => data?.pages?.flatMap((page: any) => page?.expenses || []) ?? [],
    [data],
  );

  const dashboard = useMemo(() => {
    return generateDashboardUI(expenses, trip, currentUser?._id, sortBy);
  }, [expenses, trip, currentUser, sortBy]);

  const total: number =
    data?.pages?.[data.pages.length - 1]?.pagination?.total ?? 0;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading && !isRefetching) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}
      >
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
        <Typography
          variant="bodySm"
          weight="bold"
          color="textSecondary"
          style={{ letterSpacing: 0.5 }}
        >
          Analyzing finances…
        </Typography>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <TripFinancialHero hero={dashboard.hero} />
      <SettlementOverview settlement={dashboard.settlement} />
      {category === 'all' && dashboard.analytics.length > 0 && (
        <CategoryAnalytics analytics={dashboard.analytics} />
      )}
      <CategoryFilters
        selectedCategory={category}
        onSelectCategory={setCategory}
        sortBy={sortBy}
        onSelectSort={setSortBy}
      />
    </View>
  );

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      style={styles.emptyContainer}
    >
      <GlassCard
        variant="subtle"
        intensity={theme.isDark ? 15 : 8}
        style={styles.emptyCard}
      >
        <View
          style={[
            styles.emptyIconWrap,
            { backgroundColor: theme.colors.overlayLight },
          ]}
        >
          {/* FIX: was AppIcon name="credit-card" — same blank-glyph issue */}
          <Typography variant="h1">💳</Typography>
        </View>
        <Typography
          variant="h3"
          weight="extrabold"
          color="textPrimary"
          style={{ marginBottom: theme.spacing[2], letterSpacing: -0.5 }}
        >
          No Expenses Found
        </Typography>
        <Typography
          variant="body"
          color="textSecondary"
          align="center"
          style={{ marginBottom: theme.spacing[8], lineHeight: 24 }}
        >
          {category === 'all'
            ? "You haven't added any expenses yet."
            : `No expenses found in the ${category} category.`}
        </Typography>
        {category === 'all' && (
          <InteractiveWrapper
            onPress={() => {
              haptics.medium();
              router.push(`/(app)/trips/${tripId}/add-expense`);
            }}
            hoverElevation
          >
            <View
              style={[
                styles.emptyAddBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Typography variant="body" color="textInverse">
                ➕
              </Typography>
              <Typography
                variant="bodySm"
                weight="extrabold"
                color="textInverse"
                style={{ letterSpacing: 0.5 }}
              >
                Add Your First Expense
              </Typography>
            </View>
          </InteractiveWrapper>
        )}
      </GlassCard>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <FlatList
        data={dashboard.isEmpty ? [] : [{ key: 'timeline' }]}
        keyExtractor={item => item.key}
        renderItem={() => <ExpenseTimeline groups={dashboard.groups} />}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmptyState()}
        contentContainerStyle={styles.listContent}
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
          />
        }
      />
    </View>
  );
}

const useStyles = () => {
  const theme: Theme = useTheme();
  const { isMobile } = useResponsive();

  return StyleSheet.create({
    container: { flex: 1 },
    listContent: {
      paddingHorizontal: isMobile ? theme.spacing[4] : theme.spacing[6],
      paddingTop: theme.spacing[6],
      paddingBottom: 100,
      width: '100%',
      maxWidth: 800,
      alignSelf: 'center',
    },
    headerSection: {
      marginBottom: theme.spacing[2],
    },

    // Loading & Empty States
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing[4],
      paddingVertical: 100,
    },
    emptyContainer: {
      paddingVertical: theme.spacing[10],
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: theme.spacing[14],
      paddingHorizontal: theme.spacing[6],
      borderRadius: theme.borderRadius['4xl'],
      borderWidth: 1,
      borderColor: theme.glass.borderTopColor,
    },
    emptyIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing[5],
    },
    emptyAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
      paddingHorizontal: theme.spacing[7],
      paddingVertical: theme.spacing[4],
      borderRadius: theme.borderRadius.full,
      ...theme.shadows.md,
    },

    // Pagination Footer
    footerLoader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[3],
      paddingVertical: theme.spacing[8],
    },
    footerEnd: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2],
      paddingVertical: theme.spacing[8],
    },
  });
};

// // components/trips/ExpensesTab.tsx
// import React, { useState, useMemo, useCallback } from 'react';
// import { View, Text, StyleSheet, FlatList, RefreshControl, Platform, Pressable, PressableStateCallbackType } from 'react-native';
// import { router } from 'expo-router';
// import Animated, { FadeInDown } from 'react-native-reanimated';

// // Hooks & Stores
// import { useInfiniteTripExpenses, useTrip } from '../../hooks';
// import { useTheme } from '../../providers/ThemeProvider';
// import { useResponsive } from '../../hooks/useResponsive';
// import { haptics } from '../../utils/haptics';
// import { useAuthStore } from '../../stores/auth.store';

// // UI Components
// import GlobalLoader from '../common/GlobalLoader';
// import AppIcon  from '../common/AppIcon';
// import { GlassCard } from '../ui/GlassCard';

// import { generateDashboardUI } from './Expenses/ExpenseMappers';
// import { SortOption } from './Expenses/ExpenseMappers';
// import { TripFinancialHero } from './Expenses/TripFinancialHero';
// import { SettlementOverview } from './Expenses/SettlementOverview';
// import { CategoryFilters } from './Expenses/CategoryFilters';
// import { CategoryAnalytics } from './Expenses/CategoryAnalytics';
// import { ExpenseTimeline } from './Expenses/ExpenseTimeline';

// type WebPressableState = PressableStateCallbackType & { hovered?: boolean, pressed?: boolean };

// function ListFooter({ isFetchingNextPage, hasNextPage, total }: {
//     isFetchingNextPage: boolean;
//     hasNextPage: boolean;
//     total: number;
// }) {
//     const theme = useTheme();
//     const styles = useStyles();

//     if (isFetchingNextPage) {
//         return (
//             <View style={styles.footerLoader}>
//                 <GlobalLoader variant="inline" size="small" color={theme.colors.primary}  />
//                 <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Loading more…</Text>
//             </View>
//         );
//     }
//     if (!hasNextPage && total > 0) {
//         return (
//             <View style={styles.footerEnd}>
//                 <AppIcon name="check-circle" size={14} color={theme.colors.success} />
//                 <Text style={[styles.footerEndText, { color: theme.colors.textTertiary }]}>
//                     All {total} expenses loaded
//                 </Text>
//             </View>
//         );
//     }
//     return null;
// }

// export default function ExpensesTab({ tripId }: { tripId: string }) {
//     const theme = useTheme();
//     const styles = useStyles();
//     const { isMobile } = useResponsive();
//     const [category, setCategory] = useState('all');
//     const [sortBy, setSortBy] = useState<SortOption>('date_desc');
//     const currentUser = useAuthStore(state => state.user);

//     const { data: trip } = useTrip(tripId);

//     const {
//         data,
//         isLoading,
//         isRefetching,
//         refetch,
//         fetchNextPage,
//         hasNextPage,
//         isFetchingNextPage,
//     } = useInfiniteTripExpenses(
//         tripId,
//         {
//             ...(category !== 'all' && category !== 'archived' ? { category } : {}),
//             ...(category === 'archived' ? { isArchived: true } : {})
//         }
//     );

//     const expenses = useMemo(
//         () => data?.pages?.flatMap((page: any) => page?.expenses || []) ?? [],
//         [data]
//     );

//     const dashboard = useMemo(() => {
//         return generateDashboardUI(expenses, trip, currentUser?._id, sortBy);
//     }, [expenses, trip, currentUser, sortBy]);

//     const total: number = data?.pages?.[data.pages.length - 1]?.pagination?.total ?? 0;

//     const handleEndReached = useCallback(() => {
//         if (hasNextPage && !isFetchingNextPage) {
//             fetchNextPage();
//         }
//     }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

//     if (isLoading && !isRefetching) {
//         return (
//             <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
//                 <GlobalLoader variant="inline" size="large" color={theme.colors.primary}  />
//                 <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Analyzing finances…</Text>
//             </View>
//         );
//     }

//     const renderHeader = () => (
//         <View style={styles.headerSection}>
//             <TripFinancialHero hero={dashboard.hero} />
//             <SettlementOverview settlement={dashboard.settlement} />
//             {category === 'all' && dashboard.analytics.length > 0 && (
//                 <CategoryAnalytics analytics={dashboard.analytics} />
//             )}
//             <CategoryFilters
//                 selectedCategory={category}
//                 onSelectCategory={setCategory}
//                 sortBy={sortBy}
//                 onSelectSort={setSortBy}
//             />
//         </View>
//     );

//     const renderEmptyState = () => (
//         <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.emptyContainer}>
//             <GlassCard intensity={theme.isDark ? 15 : 8} style={styles.emptyCard}>
//                 <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.overlayLight }]}>
//                     <AppIcon name="credit-card" size={36} color={theme.colors.textTertiary} />
//                 </View>
//                 <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
//                     No Expenses Found
//                 </Text>
//                 <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
//                     {category === 'all'
//                         ? "You haven't added any expenses yet."
//                         : `No expenses found in the ${category} category.`}
//                 </Text>
//                 {category === 'all' && (
//                     <Pressable
//                         style={({ hovered, pressed }: WebPressableState) => [
//                             styles.emptyAddBtn,
//                             { backgroundColor: theme.colors.primary },
//                             Platform.OS === 'web' && hovered && styles.hoverLift,
//                             pressed && { transform: [{ scale: 0.95 }] }
//                         ]}
//                         onPress={() => { haptics.medium(); router.push(`/(app)/trips/${tripId}/add-expense`); }}
//                     >
//                         <AppIcon name="plus" size={16} color="#FFF" />
//                         <Text style={[styles.emptyAddBtnText, { color: '#FFF' }]}>Add Your First Expense</Text>
//                     </Pressable>
//                 )}
//             </GlassCard>
//         </Animated.View>
//     );

//     return (
//         <View style={[styles.container, { backgroundColor: 'transparent' }]}>
//             <FlatList
//                 data={dashboard.isEmpty ? [] : [{ key: 'timeline' }]}
//                 keyExtractor={(item) => item.key}
//                 renderItem={() => <ExpenseTimeline groups={dashboard.groups} />}
//                 ListHeaderComponent={renderHeader()}
//                 ListEmptyComponent={renderEmptyState()}
//                 contentContainerStyle={styles.listContent}
//                 showsVerticalScrollIndicator={false}
//                 refreshControl={
//                     <RefreshControl
//                         refreshing={isRefetching && !isFetchingNextPage}
//                         onRefresh={refetch}
//                         tintColor={theme.colors.primary}
//                         colors={[theme.colors.primary]}
//                     />
//                 }
//                 onEndReached={handleEndReached}
//                 onEndReachedThreshold={0.3}
//                 ListFooterComponent={
//                     <ListFooter
//                         isFetchingNextPage={isFetchingNextPage}
//                         hasNextPage={!!hasNextPage}
//                         total={total}
//                     />
//                 }
//             />
//         </View>
//     );
// }

// const useStyles = () => {
//     const theme = useTheme();
//     const { isMobile } = useResponsive();

//     return StyleSheet.create({
//         container: { flex: 1 },
//         listContent: {
//             paddingHorizontal: isMobile ? 16 : 24,
//             paddingTop: 24,
//             paddingBottom: 100,
//             width: '100%',
//             maxWidth: 800,
//             alignSelf: 'center',
//         },
//         headerSection: {
//             marginBottom: 8,
//         },
//         hoverLift: {
//             transform: [{ translateY: -2 }],
//             ...(Platform.OS === 'web' ? { transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' } : {}),
//         } as any,

//         // Loading & Empty States
//         loadingContainer: {
//             flex: 1,
//             justifyContent: 'center',
//             alignItems: 'center',
//             gap: 16,
//             paddingVertical: 100,
//         },
//         loadingText: {
//             fontSize: 14,
//             fontWeight: '700',
//             letterSpacing: 0.5,
//         },
//         emptyContainer: {
//             paddingVertical: 40,
//         },
//         emptyCard: {
//             alignItems: 'center',
//             paddingVertical: 60,
//             paddingHorizontal: 24,
//             borderRadius: 32,
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
//         },
//         emptyIconWrap: {
//             width: 80,
//             height: 80,
//             borderRadius: 40,
//             alignItems: 'center',
//             justifyContent: 'center',
//             marginBottom: 20
//         },
//         emptyTitle: {
//             fontSize: 22,
//             fontWeight: '900',
//             marginBottom: 8,
//             letterSpacing: -0.5
//         },
//         emptyText: {
//             fontSize: 15,
//             textAlign: 'center',
//             lineHeight: 24,
//             marginBottom: 32
//         },
//         emptyAddBtn: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 10,
//             paddingHorizontal: 28,
//             paddingVertical: 16,
//             borderRadius: 100,
//         },
//         emptyAddBtnText: {
//             fontSize: 15,
//             fontWeight: '800',
//             letterSpacing: 0.5,
//         },

//         // Pagination Footer
//         footerLoader: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             justifyContent: 'center',
//             gap: 12,
//             paddingVertical: 32,
//         },
//         footerText: {
//             fontSize: 13,
//             fontWeight: '700'
//         },
//         footerEnd: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             justifyContent: 'center',
//             gap: 8,
//             paddingVertical: 32
//         },
//         footerEndText: {
//             fontSize: 12,
//             fontWeight: '700',
//             letterSpacing: 0.5
//         },
//     });
// };
