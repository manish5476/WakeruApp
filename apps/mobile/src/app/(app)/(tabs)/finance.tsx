// app/(app)/(tabs)/finance.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';

import { useTheme } from '../../../providers/ThemeProvider';
import { useResponsive } from '../../../hooks/useResponsive';
import { useFinanceDashboard } from '../../../hooks/useFinance';
import { haptics } from '../../../utils/haptics';
import { safeFormatCurrency } from '../../../utils/formatters';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { TabBar, TabItem } from '../../../components/ui/TabBar';
import AppIcon from '../../../components/common/AppIcon';

import { FinanceOverview } from '../../../components/finance/FinanceOverview';
import { FinanceAnalytics } from '../../../components/finance/FinanceAnalytics';
import { FinanceBudget } from '../../../components/finance/FinanceBudget';
import { FinanceDebts } from '../../../components/finance/FinanceDebts';
import { FinanceBills } from '../../../components/finance/FinanceBills';
import { FinanceGoals } from '../../../components/finance/FinanceGoals';
import type { Theme } from '../../../theme';

// ─── Constants ───────────────────────────────────────────────
const TABS = [
  { key: 'Overview', label: 'Overview', icon: 'home' },
  { key: 'Analytics', label: 'Analytics', icon: 'bar-chart-2' },
  { key: 'Budget', label: 'Budget', icon: 'pie-chart' },
  { key: 'Bills', label: 'Bills', icon: 'file-text' },
  { key: 'Goals', label: 'Goals', icon: 'target' },
  { key: 'Debts', label: 'Debts', icon: 'users' },
];

// ─── 4-Tile Bento Quick Stats Strip ─────────────────────────
function BentoQuickStats({
  dashboard,
  theme,
  onNavigateTab,
}: {
  dashboard: any;
  theme: Theme;
  onNavigateTab: (tab: string) => void;
}) {
  if (!dashboard) return null;

  const totalExpense =
    Number(dashboard.monthlyOverview?.totalExpense || 0) || 0;
  const budget = Number(dashboard.monthlyOverview?.budget || 0) || 0;
  const budgetLeft = Math.max(budget - totalExpense, 0);
  const budgetPercent =
    budget > 0 ? Math.min((totalExpense / budget) * 100, 100) : 0;
  const isOverBudget = totalExpense > budget && budget > 0;
  const transactionCount = Number(dashboard.stats?.transactionCount || 0) || 0;
  const activeDebtsCount = Number(
    dashboard.stats?.pendingDebtsCount || dashboard.debts?.length || 0,
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify().damping(18)}
      style={statsStyles(theme).bentoRow}
    >
      {/* Tile 1: Total Spent */}
      <Pressable
        onPress={() => {
          haptics.light();
          onNavigateTab('Analytics');
        }}
        style={[
          statsStyles(theme).bentoTile,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={statsStyles(theme).tileHeaderRow}>
          <View
            style={[
              statsStyles(theme).tileIconWrap,
              { backgroundColor: '#FEE2E2' },
            ]}
          >
            <AppIcon name="credit-card" size={15} color="#EF4444" />
          </View>
          <Text
            style={[statsStyles(theme).tileCategoryLabel, { color: '#EF4444' }]}
          >
            TOTAL SPENT
          </Text>
        </View>
        <Text
          style={[
            statsStyles(theme).tileValue,
            { color: theme.colors.textPrimary },
          ]}
        >
          ₹{totalExpense.toLocaleString('en-IN')}
        </Text>
        <Text
          style={[
            statsStyles(theme).tileSub,
            { color: theme.colors.textTertiary },
          ]}
        >
          {budget > 0
            ? `${budgetPercent.toFixed(0)}% of monthly budget`
            : 'Total expenses logged'}
        </Text>
      </Pressable>

      {/* Tile 2: Budget Remaining */}
      <Pressable
        onPress={() => {
          haptics.light();
          onNavigateTab('Budget');
        }}
        style={[
          statsStyles(theme).bentoTile,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={statsStyles(theme).tileHeaderRow}>
          <View
            style={[
              statsStyles(theme).tileIconWrap,
              { backgroundColor: isOverBudget ? '#FEE2E2' : '#ECFDF5' },
            ]}
          >
            <AppIcon
              name="pie-chart"
              size={15}
              color={isOverBudget ? '#EF4444' : '#10B981'}
            />
          </View>
          <Text
            style={[
              statsStyles(theme).tileCategoryLabel,
              { color: isOverBudget ? '#EF4444' : '#10B981' },
            ]}
          >
            {isOverBudget ? 'OVER BUDGET' : 'BUDGET LEFT'}
          </Text>
        </View>
        <Text
          style={[
            statsStyles(theme).tileValue,
            { color: isOverBudget ? '#EF4444' : '#10B981' },
          ]}
        >
          ₹{budgetLeft.toLocaleString('en-IN')}
        </Text>
        <Text
          style={[
            statsStyles(theme).tileSub,
            { color: theme.colors.textTertiary },
          ]}
        >
          {budget > 0
            ? `₹${budget.toLocaleString('en-IN')} allocated`
            : 'No budget configured'}
        </Text>
      </Pressable>

      {/* Tile 3: Transactions */}
      <Pressable
        onPress={() => {
          haptics.light();
          onNavigateTab('Overview');
        }}
        style={[
          statsStyles(theme).bentoTile,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={statsStyles(theme).tileHeaderRow}>
          <View
            style={[
              statsStyles(theme).tileIconWrap,
              { backgroundColor: '#EFF6FF' },
            ]}
          >
            <AppIcon name="file-text" size={15} color="#2563EB" />
          </View>
          <Text
            style={[statsStyles(theme).tileCategoryLabel, { color: '#2563EB' }]}
          >
            ACTIVITY
          </Text>
        </View>
        <Text
          style={[
            statsStyles(theme).tileValue,
            { color: theme.colors.textPrimary },
          ]}
        >
          {transactionCount}
        </Text>
        <Text
          style={[
            statsStyles(theme).tileSub,
            { color: theme.colors.textTertiary },
          ]}
        >
          Transactions this month
        </Text>
      </Pressable>

      {/* Tile 4: Active Debts / Bills */}
      <Pressable
        onPress={() => {
          haptics.light();
          onNavigateTab('Debts');
        }}
        style={[
          statsStyles(theme).bentoTile,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={statsStyles(theme).tileHeaderRow}>
          <View
            style={[
              statsStyles(theme).tileIconWrap,
              { backgroundColor: '#FEF3C7' },
            ]}
          >
            <AppIcon name="users" size={15} color="#D97706" />
          </View>
          <Text
            style={[statsStyles(theme).tileCategoryLabel, { color: '#D97706' }]}
          >
            DEBTS & SPLITS
          </Text>
        </View>
        <Text
          style={[
            statsStyles(theme).tileValue,
            {
              color:
                activeDebtsCount > 0 ? '#F59E0B' : theme.colors.textPrimary,
            },
          ]}
        >
          {activeDebtsCount}
        </Text>
        <Text
          style={[
            statsStyles(theme).tileSub,
            { color: theme.colors.textTertiary },
          ]}
        >
          {activeDebtsCount > 0 ? 'Pending settlements' : 'All clear'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function FinanceDashboard() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  // Month state
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = useMemo(
    () => currentDate.toISOString().substring(0, 7),
    [currentDate],
  );

  const {
    data: dashboard,
    isLoading,
    refetch,
  } = useFinanceDashboard({ month: currentMonth });

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scrollY.value < 60 ? 1 : 0.98, { duration: 150 }),
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const changeMonth = useCallback((offset: number) => {
    haptics.light();
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  }, []);

  const formattedMonth = useMemo(
    () =>
      currentDate.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      }),
    [currentDate],
  );

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'Overview':
        return (
          <FinanceOverview
            month={currentMonth}
            onMonthChange={m => setCurrentDate(new Date(`${m}-01`))}
            onNavigateTab={tab => setActiveTab(tab)}
          />
        );
      case 'Analytics':
        return <FinanceAnalytics month={currentMonth} />;
      case 'Budget':
        return <FinanceBudget month={currentMonth} />;
      case 'Bills':
        return <FinanceBills />;
      case 'Goals':
        return <FinanceGoals />;
      case 'Debts':
        return <FinanceDebts />;
      default:
        return null;
    }
  }, [activeTab, currentMonth]);

  const tabs: TabItem[] = TABS.map(tab => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
  }));

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* ─── STICKY HEADER ─── */}
      <Animated.View
        style={[
          styles.header,
          headerAnimatedStyle,
          {
            paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10,
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        <View
          style={[
            styles.headerContentWrapper,
            isDesktop && styles.desktopHeaderWrapper,
          ]}
        >
          <View style={styles.headerTopRow}>
            {/* Title Block */}
            <View style={styles.titleBlock}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Finance Center
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                Personal budgeting & trip split analytics
              </Text>
            </View>

            {/* Header Right Actions: Month Navigator + Refresh */}
            <View style={styles.headerRightControls}>
              {activeTab !== 'Debts' && (
                <View
                  style={[
                    styles.monthSelectorPill,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => changeMonth(-1)}
                    style={styles.monthArrowBtn}
                    hitSlop={8}
                  >
                    <AppIcon
                      name="chevron-left"
                      size={14}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>

                  <View style={styles.monthLabelGroup}>
                    <AppIcon
                      name="calendar"
                      size={13}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.monthLabelText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {formattedMonth}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => changeMonth(1)}
                    style={styles.monthArrowBtn}
                    hitSlop={8}
                  >
                    <AppIcon
                      name="chevron-right"
                      size={14}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                </View>
              )}

              <Pressable
                onPress={onRefresh}
                disabled={refreshing}
                style={({ pressed }) => [
                  styles.navBtn,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.05)',
                  },
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
              >
                <AppIcon
                  name="refresh-cw"
                  size={14}
                  color={
                    refreshing
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
              </Pressable>
            </View>
          </View>

          {/* Sub-Tab Navigation Bar */}
          <View style={styles.tabBarWrap}>
            <TabBar
              tabs={tabs}
              activeKey={activeTab}
              onTabChange={setActiveTab}
              variant="segmented"
              scrollable
              size="sm"
            />
          </View>
        </View>
      </Animated.View>

      {/* ─── MAIN CONTENT BODY ─── */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.mainLayout}>
          {/* Bento Stats Strip (Rendered on Overview Tab) */}
          {activeTab === 'Overview' && (
            <BentoQuickStats
              dashboard={dashboard}
              theme={theme}
              onNavigateTab={tab => setActiveTab(tab)}
            />
          )}

          {/* Active Tab Subview */}
          <View style={styles.tabContentContainer}>{renderTabContent()}</View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scrollView: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 20,

    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
  },
  headerContentWrapper: {
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  desktopHeaderWrapper: {
    maxWidth: 1400,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  titleBlock: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  monthArrowBtn: {
    padding: 4,
    borderRadius: 8,
  },
  monthLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  monthLabelText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarWrap: {
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  desktopScrollContent: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  mainLayout: {
    width: '100%',
    gap: 16,
  },
  tabContentContainer: {
    width: '100%',
  },
});

function statsStyles(theme: Theme) {
  return StyleSheet.create({
    bentoRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 8,
    },
    bentoTile: {
      flex: 1,
      minWidth: 155,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

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
    },
    tileHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    tileIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileCategoryLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    tileValue: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    tileSub: {
      fontSize: 10,
      fontWeight: '600',
      marginTop: 2,
    },
  });
}

// // app/(app)/(tabs)/finance.tsx
// import React, { useState, useCallback, useMemo } from 'react';
// import {
//   View,
//   StyleSheet,
//   RefreshControl,
//   ScrollView,
//   Platform,
//   Pressable,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   useAnimatedScrollHandler,
//   withTiming,
//   FadeInDown,
// } from 'react-native-reanimated';
// import { useRouter } from 'expo-router';

// import { useTheme } from '../../../providers/ThemeProvider';
// import { useResponsive } from '../../../hooks/useResponsive';
// import { useFinanceDashboard } from '../../../hooks/useFinance';
// import { haptics } from '../../../utils/haptics';

// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import { Typography } from '../../../components/ui/Typography';
// import { AmountDisplay } from '../../../components/ui/AmountDisplay';
// import { Badge } from '../../../components/ui/Badge';
// import { InteractiveWrapper } from '../../../components/ui/InteractiveWrapper';
// import { TabBar, TabItem } from '../../../components/ui/TabBar';

// import { FinanceOverview } from '../../../components/finance/FinanceOverview';
// import { FinanceAnalytics } from '../../../components/finance/FinanceAnalytics';
// import { FinanceBudget } from '../../../components/finance/FinanceBudget';
// import { FinanceDebts } from '../../../components/finance/FinanceDebts';
// import { FinanceBills } from '../../../components/finance/FinanceBills';
// import { FinanceGoals } from '../../../components/finance/FinanceGoals';
// import AppIcon from '../../../components/common/AppIcon';

// // ─── Constants ───────────────────────────────────────────────
// const TABS = [
//   { key: 'Overview', label: 'Overview', icon: 'home' },
//   { key: 'Analytics', label: 'Analytics', icon: 'bar-chart-2' },
//   { key: 'Budget', label: 'Budget', icon: 'pie-chart' },
//   { key: 'Bills', label: 'Bills', icon: 'file-text' },
//   { key: 'Goals', label: 'Goals', icon: 'target' },
//   { key: 'Debts', label: 'Debts', icon: 'users' },
// ];

// // ─── Filter Tab Bar ──────────────────────────────────────────
// function FilterTabBar({
//   activeKey,
//   onChange,
// }: {
//   activeKey: string;
//   onChange: (key: string) => void;
// }) {
//   const tabs: TabItem[] = TABS.map((tab) => ({
//     key: tab.key,
//     label: tab.label,
//     icon: tab.icon,
//   }));

//   return (
//     <TabBar
//       tabs={tabs}
//       activeKey={activeKey}
//       onTabChange={onChange}
//       variant="segmented"
//       scrollable
//       size="sm"
//     />
//   );
// }

// // ─── Bento Quick Stats (3-in-1) ──────────────────────────────
// function BentoQuickStats({ dashboard }: { dashboard: any }) {
//   const theme = useTheme();

//   if (!dashboard) return null;

//   const totalExpense = Number(dashboard.monthlyOverview?.totalExpense || 0) || 0;
//   const budget = Number(dashboard.monthlyOverview?.budget || 0) || 0;
//   const budgetLeft = Math.max(budget - totalExpense, 0);
//   const transactionCount = Number(dashboard.stats?.transactionCount || 0) || 0;

//   const stats = [
//     {
//       icon: 'credit-card',
//       iconColor: '#EF4444',
//       iconBgColor: 'rgba(239, 68, 68, 0.12)',
//       label: 'TOTAL SPENT',
//       amount: totalExpense,
//       currency: 'INR',
//       isAmount: true,
//     },
//     {
//       icon: 'pie-chart',
//       iconColor: '#10B981',
//       iconBgColor: 'rgba(16, 185, 129, 0.12)',
//       label: 'BUDGET REMAINING',
//       amount: budgetLeft,
//       currency: 'INR',
//       isAmount: true,
//     },
//     {
//       icon: 'file-text',
//       iconColor: '#3B82F6',
//       iconBgColor: 'rgba(59, 130, 246, 0.12)',
//       label: 'TRANSACTIONS',
//       value: `${transactionCount}`,
//     },
//   ];

//   return (
//     <Animated.View entering={FadeInDown.delay(50).springify().damping(18)} style={styles.quickStatsContainer}>
//       <GlassCard variant="prominent" padding="none" style={styles.quickStatsCard} intensity={theme.isDark ? 30 : 60}>
//         <View style={styles.quickStatsRow}>
//           {stats.map((stat, index) => (
//             <React.Fragment key={stat.label}>
//               {index > 0 && (
//                 <View
//                   style={[
//                     styles.statDivider,
//                     { backgroundColor: theme.colors.borderLight },
//                   ]}
//                 />
//               )}
//               <View style={styles.statCol}>
//                 <View style={[styles.statIconBox, { backgroundColor: stat.iconBgColor }]}>
//                   <AppIcon name={stat.icon as any} size={15} color={stat.iconColor} />
//                 </View>
//                 <Typography
//                   variant="caption"
//                   weight="bold"
//                   color="textSecondary"
//                   style={{ letterSpacing: 0.6, fontSize: 10 }}
//                 >
//                   {stat.label}
//                 </Typography>
//                 {stat.isAmount ? (
//                   <AmountDisplay
//                     amount={stat.amount!}
//                     currency={stat.currency!}
//                     size="md"
//                     compact
//                     variant="default"
//                   />
//                 ) : (
//                   <Typography variant="body" weight="extrabold" color="textPrimary" style={{ fontSize: 16 }}>
//                     {stat.value}
//                   </Typography>
//                 )}
//               </View>
//             </React.Fragment>
//           ))}
//         </View>
//       </GlassCard>
//     </Animated.View>
//   );
// }

// // ─── Main Screen ─────────────────────────────────────────────
// export default function FinanceDashboard() {
//   const theme = useTheme();
//   const insets = useSafeAreaInsets();
//   const { isDesktop } = useResponsive();

//   const [refreshing, setRefreshing] = useState(false);
//   const [activeTab, setActiveTab] = useState('Overview');

//   // Month state
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const currentMonth = useMemo(
//     () => currentDate.toISOString().substring(0, 7),
//     [currentDate]
//   );

//   const { data: dashboard, isLoading, refetch } = useFinanceDashboard({ month: currentMonth });

//   const scrollY = useSharedValue(0);
//   const scrollHandler = useAnimatedScrollHandler({
//     onScroll: (event) => {
//       scrollY.value = event.contentOffset.y;
//     },
//   });

//   const headerAnimatedStyle = useAnimatedStyle(() => ({
//     opacity: withTiming(scrollY.value < 80 ? 1 : 0.95, { duration: 150 }),
//   }));

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     haptics.light();
//     await refetch();
//     setRefreshing(false);
//   }, [refetch]);

//   const changeMonth = useCallback((offset: number) => {
//     haptics.light();
//     setCurrentDate((prev) => {
//       const newDate = new Date(prev);
//       newDate.setMonth(newDate.getMonth() + offset);
//       return newDate;
//     });
//   }, []);

//   const formattedMonth = useMemo(
//     () =>
//       currentDate.toLocaleDateString('en-IN', {
//         month: 'long',
//         year: 'numeric',
//       }),
//     [currentDate]
//   );

//   const isToday = useCallback(() => {
//     const today = new Date();
//     return (
//       currentDate.getMonth() === today.getMonth() &&
//       currentDate.getFullYear() === today.getFullYear()
//     );
//   }, [currentDate]);

//   const renderTabContent = useCallback(() => {
//     switch (activeTab) {
//       case 'Overview':
//         return (
//           <FinanceOverview
//             month={currentMonth}
//             onMonthChange={(m) => setCurrentDate(new Date(`${m}-01`))}
//             onNavigateTab={(tab) => setActiveTab(tab)}
//           />
//         );
//       case 'Analytics':
//         return <FinanceAnalytics month={currentMonth} />;
//       case 'Budget':
//         return <FinanceBudget month={currentMonth} />;
//       case 'Bills':
//         return <FinanceBills />;
//       case 'Goals':
//         return <FinanceGoals />;
//       case 'Debts':
//         return <FinanceDebts />;
//       default:
//         return null;
//     }
//   }, [activeTab, currentMonth]);

//   return (
//     <View style={styles.root}>
//       <View style={StyleSheet.absoluteFill} pointerEvents="none">
//         <GlobalBackground />
//       </View>

//       {/* ─── HEADER ─── */}
//       <Animated.View
//         style={[
//           styles.header,
//           headerAnimatedStyle,
//           {
//             paddingTop: insets.top + 8,
//             borderBottomColor: theme.colors.borderLight,
//           },
//         ]}
//       >
//         <View style={styles.headerContentWrapper}>
//           <View style={styles.headerTopRow}>
//             {/* Title & Badge */}
//             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
//               <Typography variant="h2" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5, fontSize: 22 }}>
//                 Finance
//               </Typography>
//               {/* <Badge label="Personal & Trips" variant="neutral" /> */}
//             </View>

//             {/* Header Right Actions & Month Navigator */}
//             <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
//               {activeTab !== 'Debts' && (
//                 <View style={[styles.monthSelectorPill, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: theme.colors.borderLight }]}>
//                   <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrowBtn} hitSlop={8}>
//                     <AppIcon name="chevron-left" size={14} color={theme.colors.textSecondary} />
//                   </Pressable>

//                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6 }}>
//                     <AppIcon name="calendar" size={12} color={theme.colors.primary} />
//                     <Typography variant="caption" weight="bold" color="textPrimary" style={{ fontSize: 12 }}>
//                       {formattedMonth}
//                     </Typography>
//                   </View>

//                   <Pressable onPress={() => changeMonth(1)} style={styles.monthArrowBtn} hitSlop={8}>
//                     <AppIcon name="chevron-right" size={14} color={theme.colors.textSecondary} />
//                   </Pressable>
//                 </View>
//               )}

//               <InteractiveWrapper onPress={onRefresh} disabled={refreshing}>
//                 <View style={[styles.navBtn, { borderColor: theme.colors.borderLight, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
//                   <AppIcon name="refresh-cw" size={14} color={theme.colors.textSecondary} />
//                 </View>
//               </InteractiveWrapper>
//             </View>
//           </View>

//           {/* Quick Stats Bento — Top Summary */}
//           {activeTab === 'Overview' && (
//             <BentoQuickStats dashboard={dashboard} />
//           )}

//           {/* Tab Navigation Bar */}
//           <View style={{ marginTop: 12 }}>
//             <FilterTabBar activeKey={activeTab} onChange={setActiveTab} />
//           </View>
//         </View>
//       </Animated.View>

//       {/* ─── MAIN CONTENT ─── */}
//       <Animated.ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={{
//           paddingTop: 16,
//           paddingHorizontal: 16,
//           paddingBottom: insets.bottom + 100,
//         }}
//         showsVerticalScrollIndicator={false}
//         onScroll={scrollHandler}
//         scrollEventThrottle={16}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor={theme.colors.primary}
//             colors={[theme.colors.primary]}
//             progressBackgroundColor={theme.colors.surface}
//           />
//         }
//       >
//         <View style={styles.mainLayout}>
//           {renderTabContent()}
//         </View>
//       </Animated.ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1 },
//   scrollView: { flex: 1 },
//   header: {
//     paddingHorizontal: 16,
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//   },
//   headerContentWrapper: {
//     width: '100%',
//     maxWidth: 1200,
//     alignSelf: 'center',
//   },
//   headerTopRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     width: '100%',
//   },
//   monthSelectorPill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 20,
//     borderWidth: 1,
//     paddingHorizontal: 4,
//     paddingVertical: 3,
//   },
//   monthArrowBtn: {
//     padding: 4,
//     borderRadius: 12,
//   },
//   navBtn: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     borderWidth: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   quickStatsContainer: {
//     marginTop: 12,
//     width: '100%',
//   },
//   quickStatsCard: {
//     borderRadius: 18,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: 'rgba(255, 255, 255, 0.08)',
//   },
//   quickStatsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: '100%',
//     paddingVertical: 12,
//   },
//   statDivider: {
//     width: 1,
//     height: '60%',
//   },
//   statCol: {
//     flex: 1,
//     alignItems: 'center',
//     gap: 3,
//     paddingHorizontal: 8,
//   },
//   statIconBox: {
//     width: 28,
//     height: 28,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   mainLayout: {
//     width: '100%',
//     maxWidth: 1200,
//     alignSelf: 'center',
//   },
// });
