// app/(app)/(tabs)/finance.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Platform,
  Pressable,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../providers/ThemeProvider';
import { useFinanceDashboard } from '../../../hooks/useFinance';
import { haptics } from '../../../utils/haptics';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { TripTabs } from '../../../components/ui/TripTabs';
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
  { id: 'Overview', label: 'Overview', icon: 'home' },
  { id: 'Analytics', label: 'Analytics', icon: 'bar-chart-2' },
  { id: 'Budget', label: 'Budget', icon: 'pie-chart' },
  { id: 'Bills', label: 'Bills', icon: 'file-text' },
  { id: 'Goals', label: 'Goals', icon: 'target' },
  { id: 'Debts', label: 'Debts', icon: 'users' },
];

// Only these tabs read the selected month / trip lens. The others (Bills, Goals,
// Debts) take no such props, so the controls are hidden there.
const PERIOD_TABS = new Set(['Overview', 'Analytics', 'Budget']);

const TONE = {
  blue: '#2563EB',
  green: '#10B981',
  red: '#EF4444',
  amber: '#D97706',
};

// ─── Month helpers (timezone-safe: no toISOString / setMonth) ─
function currentYM(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

// One shared content width on web: header, KPI row and page content all line up.
// (FinanceOverview constrains itself to ~1200, so this matches it.)
const CONTENT_MAX = 1200;

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function hairlineFor(theme: Theme) {
  return theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)';
}

// ─── Stat tile ───────────────────────────────────────────────
function StatTile({
  icon,
  tone,
  label,
  value,
  valueColor,
  sub,
  progress,
  fluid,
  onPress,
}: {
  icon: string;
  tone: string;
  label: string;
  value: string;
  valueColor?: string;
  sub: string;
  /** 0–100. Renders a thin progress bar when provided. */
  progress?: number;
  /** Desktop: tile stretches to share the row instead of a fixed width. */
  fluid?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const s = useMemo(() => createTileStyles(theme), [theme]);

  return (
    <GlassCard
      pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={[s.tile, fluid && s.tileFluid]}
      intensity={theme.isDark ? 15 : 10}
      padding="none"
    >
      <View style={s.head}>
        <View style={[s.iconWrap, { backgroundColor: `${tone}1F` }]}>
          <AppIcon name={icon as any} size={13} color={tone} />
        </View>
        <Text
          style={[s.label, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>

      <Text
        style={[s.value, { color: valueColor || theme.colors.textPrimary }]}
        numberOfLines={1}
      >
        {value}
      </Text>

      {progress !== undefined ? (
        <View style={[s.track, { backgroundColor: `${tone}22` }]}>
          <View
            style={[
              s.fill,
              {
                width: `${Math.max(2, Math.min(progress, 100))}%`,
                backgroundColor: tone,
              },
            ]}
          />
        </View>
      ) : null}

      <Text
        style={[s.sub, { color: theme.colors.textTertiary }]}
        numberOfLines={1}
      >
        {sub}
      </Text>
    </GlassCard>
  );
}

function StatSkeleton({ fluid }: { fluid?: boolean }) {
  const theme = useTheme();
  const s = useMemo(() => createTileStyles(theme), [theme]);
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const bone = theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.07)';

  return (
    <Animated.View
      style={[
        { flexDirection: 'row', gap: fluid ? 12 : 10 },
        fluid && { flex: 1 },
        animated,
      ]}
    >
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            s.tile,
            fluid && s.tileFluid,
            { backgroundColor: theme.colors.surface, gap: 10 },
          ]}
        >
          <View
            style={{
              width: 70,
              height: 10,
              borderRadius: 5,
              backgroundColor: bone,
            }}
          />
          <View
            style={{
              width: 90,
              height: 20,
              borderRadius: 6,
              backgroundColor: bone,
            }}
          />
          <View
            style={{
              width: 60,
              height: 8,
              borderRadius: 4,
              backgroundColor: bone,
            }}
          />
        </View>
      ))}
    </Animated.View>
  );
}

// ─── Quick stats strip ───────────────────────────────────────
function QuickStats({
  dashboard,
  loading,
  isDesktop,
  onNavigateTab,
}: {
  dashboard: any;
  loading: boolean;
  isDesktop: boolean;
  onNavigateTab: (tab: string) => void;
}) {
  const theme = useTheme();
  const s = useMemo(() => createTileStyles(theme), [theme]);

  // Desktop: four tiles share the full content width. Mobile: horizontal strip.
  const wrap = (children: React.ReactNode) =>
    isDesktop ? (
      <View style={s.fluidRow}>{children}</View>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={s.row}
      >
        {children}
      </ScrollView>
    );

  if (!dashboard)
    return loading ? wrap(<StatSkeleton fluid={isDesktop} />) : null;

  const spent = Number(dashboard.monthlyOverview?.totalExpense || 0) || 0;
  const budget = Number(dashboard.monthlyOverview?.budget || 0) || 0;
  const hasBudget = budget > 0;
  const isOver = hasBudget && spent > budget;
  const left = Math.max(budget - spent, 0);
  const over = Math.max(spent - budget, 0);
  const percent = hasBudget ? (spent / budget) * 100 : 0;
  const txCount = Number(dashboard.stats?.transactionCount || 0) || 0;
  const debts =
    Number(
      dashboard.stats?.pendingDebtsCount || dashboard.debts?.length || 0,
    ) || 0;

  return wrap(
    <>
      <StatTile
        icon="credit-card"
        tone={isOver ? TONE.red : TONE.blue}
        label="Spent"
        value={inr(spent)}
        sub={
          hasBudget
            ? `${Math.round(percent)}% of ${inr(budget)}`
            : 'No budget set'
        }
        progress={hasBudget ? percent : undefined}
        fluid={isDesktop}
        onPress={() => onNavigateTab('Analytics')}
      />
      <StatTile
        icon="pie-chart"
        tone={isOver ? TONE.red : TONE.green}
        label={isOver ? 'Over budget' : 'Left to spend'}
        value={hasBudget ? inr(isOver ? over : left) : '—'}
        valueColor={isOver ? TONE.red : hasBudget ? TONE.green : undefined}
        sub={
          hasBudget
            ? isOver
              ? 'Above your monthly budget'
              : 'Until month end'
            : 'Set a budget'
        }
        fluid={isDesktop}
        onPress={() => onNavigateTab('Budget')}
      />
      <StatTile
        icon="file-text"
        tone={TONE.blue}
        label="Transactions"
        value={String(txCount)}
        sub="This month"
        fluid={isDesktop}
        onPress={() => onNavigateTab('Overview')}
      />
      <StatTile
        icon="users"
        tone={TONE.amber}
        label="Splits & debts"
        value={String(debts)}
        valueColor={debts > 0 ? TONE.amber : undefined}
        sub={debts > 0 ? 'Awaiting settlement' : 'All settled'}
        fluid={isDesktop}
        onPress={() => onNavigateTab('Debts')}
      />
    </>,
  );
}

// ─── Personal / With trips switch (same TripTabs as everywhere) ─
function LensSwitch({
  includeTrips,
  onChange,
  compact,
  style,
}: {
  includeTrips: boolean;
  onChange: (v: boolean) => void;
  compact: boolean;
  style?: any;
}) {
  return (
    <TripTabs<'personal' | 'trips'>
      tabs={[
        { id: 'personal', label: 'Personal' },
        { id: 'trips', label: compact ? '+ Trips' : 'Include trips' },
      ]}
      activeTab={includeTrips ? 'trips' : 'personal'}
      onChange={(id: 'personal' | 'trips') => onChange(id === 'trips')}
      variant="segmented"
      size="sm"
      style={style}
    />
  );
}

// ─── Month switcher ──────────────────────────────────────────
function MonthSwitcher({
  month,
  onShift,
  onReset,
  style,
}: {
  month: string;
  onShift: (delta: number) => void;
  onReset: () => void;
  style?: any;
}) {
  const theme = useTheme();
  const isCurrent = month === currentYM();

  return (
    <View
      style={[
        monthStyles.pill,
        {
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.85)',
          borderColor: hairlineFor(theme),
        },
        style,
      ]}
    >
      <Pressable
        onPress={() => onShift(-1)}
        style={monthStyles.arrow}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
      >
        <AppIcon
          name="chevron-left"
          size={15}
          color={theme.colors.textSecondary}
        />
      </Pressable>

      <Pressable
        onPress={onReset}
        disabled={isCurrent}
        style={monthStyles.label}
        accessibilityRole="button"
        accessibilityLabel={
          isCurrent
            ? monthLabel(month)
            : `${monthLabel(month)}. Go to current month`
        }
      >
        <Text
          style={[monthStyles.labelText, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {monthLabel(month)}
        </Text>
        {!isCurrent && (
          <View
            style={[monthStyles.dot, { backgroundColor: theme.colors.primary }]}
          />
        )}
      </Pressable>

      <Pressable
        onPress={() => onShift(1)}
        style={monthStyles.arrow}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Next month"
      >
        <AppIcon
          name="chevron-right"
          size={15}
          color={theme.colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const monthStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  labelText: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});

// ─── Main screen ─────────────────────────────────────────────
export default function FinanceDashboard() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [includeTripExpenses, setIncludeTripExpenses] = useState(false);
  const [month, setMonth] = useState<string>(currentYM);

  const {
    data: dashboard,
    isLoading,
    refetch,
  } = useFinanceDashboard({
    month,
    includeTripExpenses,
  });

  const [headerHeight, setHeaderHeight] = useState(
    Platform.OS === 'web' ? 140 : 180,
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const shift = useCallback((delta: number) => {
    haptics.light();
    setMonth(prev => shiftMonth(prev, delta));
  }, []);

  const resetMonth = useCallback(() => {
    haptics.light();
    setMonth(currentYM());
  }, []);

  const showPeriodControls = PERIOD_TABS.has(activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <FinanceOverview
            month={month}
            includeTripExpenses={includeTripExpenses}
            onToggleIncludeTripExpenses={setIncludeTripExpenses}
            onMonthChange={(m: string) => setMonth(m)}
            onNavigateTab={(tab: string) => setActiveTab(tab)}
          />
        );
      case 'Analytics':
        return (
          <FinanceAnalytics
            month={month}
            includeTripExpenses={includeTripExpenses}
            onToggleIncludeTripExpenses={setIncludeTripExpenses}
          />
        );
      case 'Budget':
        return (
          <FinanceBudget
            month={month}
            includeTripExpenses={includeTripExpenses}
            onToggleIncludeTripExpenses={setIncludeTripExpenses}
          />
        );
      case 'Bills':
        return <FinanceBills />;
      case 'Goals':
        return <FinanceGoals />;
      case 'Debts':
        return <FinanceDebts />;
      default:
        return null;
    }
  };

  const refreshBtn = (
    <Pressable
      onPress={onRefresh}
      disabled={refreshing}
      style={({ pressed }) => [
        styles.iconBtn,
        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Refresh"
    >
      <AppIcon
        name="refresh-cw"
        size={15}
        color={refreshing ? theme.colors.primary : theme.colors.textSecondary}
      />
    </Pressable>
  );

  const headerTopPadding =
    Platform.OS === 'web'
      ? 12
      : Math.max(
          insets.top,
          Platform.OS === 'android' ? (StatusBar.currentHeight ?? 38) : 24,
        ) + 8;

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Status bar shield: keeps scrolled content out of the notification area */}
      <View
        pointerEvents="none"
        style={[
          styles.shield,
          {
            height: headerTopPadding,
            backgroundColor: theme.colors.background,
          },
        ]}
      />

      {/* ─── Floating header ─── */}
      <View
        style={[styles.headerWrapper, { paddingTop: headerTopPadding }]}
        onLayout={e => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - headerHeight) > 2) setHeaderHeight(h);
        }}
      >
        <GlassCard
          intensity={theme.isDark ? 28 : 45}
          style={[
            styles.headerCard,
            {
              borderColor: hairlineFor(theme),
              backgroundColor: theme.isDark
                ? 'rgba(15, 23, 42, 0.68)'
                : 'rgba(255, 255, 255, 0.82)',
            },
          ]}
        >
          <View style={styles.headerInner}>
            {/* Title row */}
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.title, { color: theme.colors.textPrimary }]}
                >
                  Regular expenses
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.colors.textTertiary },
                  ]}
                  numberOfLines={1}
                >
                  Personal budgeting and trip splits
                </Text>
              </View>

              {isDesktop && showPeriodControls ? (
                <View style={styles.desktopControls}>
                  <LensSwitch
                    includeTrips={includeTripExpenses}
                    onChange={setIncludeTripExpenses}
                    compact={false}
                    style={{ width: 230 }}
                  />
                  <MonthSwitcher
                    month={month}
                    onShift={shift}
                    onReset={resetMonth}
                    style={{ width: 170 }}
                  />
                  {refreshBtn}
                </View>
              ) : (
                refreshBtn
              )}
            </View>

            {/* Mobile controls */}
            {!isDesktop && showPeriodControls && (
              <View style={styles.mobileControls}>
                <LensSwitch
                  includeTrips={includeTripExpenses}
                  onChange={setIncludeTripExpenses}
                  compact
                  style={{ flex: 1 }}
                />
                <MonthSwitcher
                  month={month}
                  onShift={shift}
                  onReset={resetMonth}
                  style={{ flex: 1 }}
                />
              </View>
            )}

            {/* Section tabs: same component as Trips and Companions */}
            <TripTabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="segmented"
              size="sm"
              scrollable={!isDesktop}
            />
          </View>
        </GlassCard>
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
          {
            paddingTop: headerHeight + 14,
            paddingBottom: Math.max(insets.bottom, 20) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressViewOffset={headerHeight + 8}
          />
        }
      >
        <View style={styles.mainLayout}>
          {activeTab === 'Overview' && (
            <QuickStats
              dashboard={dashboard}
              loading={isLoading}
              isDesktop={isDesktop}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* A short fade when the section changes (answers the tap) */}
          <Animated.View
            key={activeTab}
            entering={FadeIn.duration(160)}
            style={{ width: '100%' }}
          >
            {renderTabContent()}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flex: 1 },
    shield: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40 },

    headerWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 30,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    headerCard: {
      width: '100%',
      maxWidth: CONTENT_MAX,
      borderRadius: 22,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 12,
      ...Platform.select({
        web: { boxShadow: '0 8px 28px rgba(15, 23, 42, 0.08)' } as any,
        default: {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
      }),
    },
    headerInner: { width: '100%', gap: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    desktopControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mobileControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: hairlineFor(theme),
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.85)',
    },

    scrollContent: { paddingHorizontal: 16 },
    // +32 = the 16px side padding, so the inner width equals the header card's width.
    desktopScrollContent: {
      maxWidth: CONTENT_MAX + 32,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 16,
    },
    mainLayout: { width: '100%', gap: 16 },
  });
}

function createTileStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 2,
    },
    fluidRow: { flexDirection: 'row', gap: 12 },
    tileFluid: { flex: 1, width: 'auto', minWidth: 0, minHeight: 112 },
    tile: {
      width: 156,
      minHeight: 104,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      justifyContent: 'space-between',
      gap: 6,
      borderWidth: 1,
      borderColor: hairlineFor(theme),
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(255,255,255,0.78)',
      overflow: 'hidden',
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconWrap: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
    value: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    track: { height: 4, borderRadius: 2, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 2 },
    sub: { fontSize: 11, fontWeight: '500' },
  });
}
// // app/(app)/(tabs)/finance.tsx
// import React, { useState, useCallback, useMemo, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   RefreshControl,
//   ScrollView,
//   Platform,
//   Pressable,
//   useWindowDimensions,
//   StatusBar,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import Animated, {
//   Easing,
//   FadeIn,
//   cancelAnimation,
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withTiming,
// } from 'react-native-reanimated';

// import { useTheme } from '../../../providers/ThemeProvider';
// import { useFinanceDashboard } from '../../../hooks/useFinance';
// import { haptics } from '../../../utils/haptics';

// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import { TripTabs } from '../../../components/ui/TripTabs';
// import AppIcon from '../../../components/common/AppIcon';

// import { FinanceOverview } from '../../../components/finance/FinanceOverview';
// import { FinanceAnalytics } from '../../../components/finance/FinanceAnalytics';
// import { FinanceBudget } from '../../../components/finance/FinanceBudget';
// import { FinanceDebts } from '../../../components/finance/FinanceDebts';
// import { FinanceBills } from '../../../components/finance/FinanceBills';
// import { FinanceGoals } from '../../../components/finance/FinanceGoals';
// import type { Theme } from '../../../theme';

// // ─── Constants ───────────────────────────────────────────────
// const TABS = [
//   { id: 'Overview', label: 'Overview', icon: 'home' },
//   { id: 'Analytics', label: 'Analytics', icon: 'bar-chart-2' },
//   { id: 'Budget', label: 'Budget', icon: 'pie-chart' },
//   { id: 'Bills', label: 'Bills', icon: 'file-text' },
//   { id: 'Goals', label: 'Goals', icon: 'target' },
//   { id: 'Debts', label: 'Debts', icon: 'users' },
// ];

// // Only these tabs read the selected month / trip lens. The others (Bills, Goals,
// // Debts) take no such props, so the controls are hidden there.
// const PERIOD_TABS = new Set(['Overview', 'Analytics', 'Budget']);

// const TONE = {
//   blue: '#2563EB',
//   green: '#10B981',
//   red: '#EF4444',
//   amber: '#D97706',
// };

// // ─── Month helpers (timezone-safe: no toISOString / setMonth) ─
// function currentYM(): string {
//   const n = new Date();
//   return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
// }

// function shiftMonth(ym: string, delta: number): string {
//   const [y, m] = ym.split('-').map(Number);
//   const total = y * 12 + (m - 1) + delta;
//   const ny = Math.floor(total / 12);
//   const nm = (total % 12) + 1;
//   return `${ny}-${String(nm).padStart(2, '0')}`;
// }

// function monthLabel(ym: string): string {
//   const [y, m] = ym.split('-').map(Number);
//   return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
// }

// const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// function hairlineFor(theme: Theme) {
//   return theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)';
// }

// // ─── Stat tile ───────────────────────────────────────────────
// function StatTile({
//   icon,
//   tone,
//   label,
//   value,
//   valueColor,
//   sub,
//   progress,
//   onPress,
// }: {
//   icon: string;
//   tone: string;
//   label: string;
//   value: string;
//   valueColor?: string;
//   sub: string;
//   /** 0–100. Renders a thin progress bar when provided. */
//   progress?: number;
//   onPress: () => void;
// }) {
//   const theme = useTheme();
//   const s = useMemo(() => createTileStyles(theme), [theme]);

//   return (
//     <GlassCard
//       pressable
//       onPress={() => {
//         haptics.light();
//         onPress();
//       }}
//       style={s.tile}
//       intensity={theme.isDark ? 15 : 10}
//       padding="none"
//     >
//       <View style={s.head}>
//         <View style={[s.iconWrap, { backgroundColor: `${tone}1F` }]}>
//           <AppIcon name={icon as any} size={13} color={tone} />
//         </View>
//         <Text style={[s.label, { color: theme.colors.textSecondary }]} numberOfLines={1}>
//           {label}
//         </Text>
//       </View>

//       <Text style={[s.value, { color: valueColor || theme.colors.textPrimary }]} numberOfLines={1}>
//         {value}
//       </Text>

//       {progress !== undefined ? (
//         <View style={[s.track, { backgroundColor: `${tone}22` }]}>
//           <View
//             style={[
//               s.fill,
//               { width: `${Math.max(2, Math.min(progress, 100))}%`, backgroundColor: tone },
//             ]}
//           />
//         </View>
//       ) : null}

//       <Text style={[s.sub, { color: theme.colors.textTertiary }]} numberOfLines={1}>
//         {sub}
//       </Text>
//     </GlassCard>
//   );
// }

// function StatSkeleton() {
//   const theme = useTheme();
//   const s = useMemo(() => createTileStyles(theme), [theme]);
//   const pulse = useSharedValue(0.55);

//   useEffect(() => {
//     pulse.value = withRepeat(
//       withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
//       -1,
//       true
//     );
//     return () => cancelAnimation(pulse);
//   }, [pulse]);

//   const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
//   const bone = theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.07)';

//   return (
//     <Animated.View style={[{ flexDirection: 'row', gap: 10 }, animated]}>
//       {[0, 1, 2, 3].map((i) => (
//         <View key={i} style={[s.tile, { backgroundColor: theme.colors.surface, gap: 10 }]}>
//           <View style={{ width: 70, height: 10, borderRadius: 5, backgroundColor: bone }} />
//           <View style={{ width: 90, height: 20, borderRadius: 6, backgroundColor: bone }} />
//           <View style={{ width: 60, height: 8, borderRadius: 4, backgroundColor: bone }} />
//         </View>
//       ))}
//     </Animated.View>
//   );
// }

// // ─── Quick stats strip ───────────────────────────────────────
// function QuickStats({
//   dashboard,
//   loading,
//   onNavigateTab,
// }: {
//   dashboard: any;
//   loading: boolean;
//   onNavigateTab: (tab: string) => void;
// }) {
//   const theme = useTheme();
//   const s = useMemo(() => createTileStyles(theme), [theme]);

//   const wrap = (children: React.ReactNode) => (
//     <ScrollView
//       horizontal
//       showsHorizontalScrollIndicator={false}
//       style={{ marginHorizontal: -16 }}
//       contentContainerStyle={s.row}
//     >
//       {children}
//     </ScrollView>
//   );

//   if (!dashboard) return loading ? wrap(<StatSkeleton />) : null;

//   const spent = Number(dashboard.monthlyOverview?.totalExpense || 0) || 0;
//   const budget = Number(dashboard.monthlyOverview?.budget || 0) || 0;
//   const hasBudget = budget > 0;
//   const isOver = hasBudget && spent > budget;
//   const left = Math.max(budget - spent, 0);
//   const over = Math.max(spent - budget, 0);
//   const percent = hasBudget ? (spent / budget) * 100 : 0;
//   const txCount = Number(dashboard.stats?.transactionCount || 0) || 0;
//   const debts = Number(dashboard.stats?.pendingDebtsCount || dashboard.debts?.length || 0) || 0;

//   return wrap(
//     <>
//       <StatTile
//         icon="credit-card"
//         tone={isOver ? TONE.red : TONE.blue}
//         label="Spent"
//         value={inr(spent)}
//         sub={hasBudget ? `${Math.round(percent)}% of ${inr(budget)}` : 'No budget set'}
//         progress={hasBudget ? percent : undefined}
//         onPress={() => onNavigateTab('Analytics')}
//       />
//       <StatTile
//         icon="pie-chart"
//         tone={isOver ? TONE.red : TONE.green}
//         label={isOver ? 'Over budget' : 'Left to spend'}
//         value={hasBudget ? inr(isOver ? over : left) : '—'}
//         valueColor={isOver ? TONE.red : hasBudget ? TONE.green : undefined}
//         sub={hasBudget ? (isOver ? 'Above your monthly budget' : 'Until month end') : 'Set a budget'}
//         onPress={() => onNavigateTab('Budget')}
//       />
//       <StatTile
//         icon="file-text"
//         tone={TONE.blue}
//         label="Transactions"
//         value={String(txCount)}
//         sub="This month"
//         onPress={() => onNavigateTab('Overview')}
//       />
//       <StatTile
//         icon="users"
//         tone={TONE.amber}
//         label="Splits & debts"
//         value={String(debts)}
//         valueColor={debts > 0 ? TONE.amber : undefined}
//         sub={debts > 0 ? 'Awaiting settlement' : 'All settled'}
//         onPress={() => onNavigateTab('Debts')}
//       />
//     </>
//   );
// }

// // ─── Personal / With trips switch (same TripTabs as everywhere) ─
// function LensSwitch({
//   includeTrips,
//   onChange,
//   compact,
//   style,
// }: {
//   includeTrips: boolean;
//   onChange: (v: boolean) => void;
//   compact: boolean;
//   style?: any;
// }) {
//   return (
//     <TripTabs<'personal' | 'trips'>
//       tabs={[
//         { id: 'personal', label: 'Personal' },
//         { id: 'trips', label: compact ? '+ Trips' : 'Include trips' },
//       ]}
//       activeTab={includeTrips ? 'trips' : 'personal'}
//       onChange={(id) => onChange(id === 'trips')}
//       variant="segmented"
//       size="sm"
//       style={style}
//     />
//   );
// }

// // ─── Month switcher ──────────────────────────────────────────
// function MonthSwitcher({
//   month,
//   onShift,
//   onReset,
//   style,
// }: {
//   month: string;
//   onShift: (delta: number) => void;
//   onReset: () => void;
//   style?: any;
// }) {
//   const theme = useTheme();
//   const isCurrent = month === currentYM();

//   return (
//     <View
//       style={[
//         monthStyles.pill,
//         {
//           backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
//           borderColor: hairlineFor(theme),
//         },
//         style,
//       ]}
//     >
//       <Pressable
//         onPress={() => onShift(-1)}
//         style={monthStyles.arrow}
//         hitSlop={8}
//         accessibilityRole="button"
//         accessibilityLabel="Previous month"
//       >
//         <AppIcon name="chevron-left" size={15} color={theme.colors.textSecondary} />
//       </Pressable>

//       <Pressable
//         onPress={onReset}
//         disabled={isCurrent}
//         style={monthStyles.label}
//         accessibilityRole="button"
//         accessibilityLabel={isCurrent ? monthLabel(month) : `${monthLabel(month)}. Go to current month`}
//       >
//         <Text style={[monthStyles.labelText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
//           {monthLabel(month)}
//         </Text>
//         {!isCurrent && <View style={[monthStyles.dot, { backgroundColor: theme.colors.primary }]} />}
//       </Pressable>

//       <Pressable
//         onPress={() => onShift(1)}
//         style={monthStyles.arrow}
//         hitSlop={8}
//         accessibilityRole="button"
//         accessibilityLabel="Next month"
//       >
//         <AppIcon name="chevron-right" size={15} color={theme.colors.textSecondary} />
//       </Pressable>
//     </View>
//   );
// }

// const monthStyles = StyleSheet.create({
//   pill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     height: 36,
//     borderRadius: 999,
//     borderWidth: 1,
//     paddingHorizontal: 4,
//   },
//   arrow: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
//   label: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
//   labelText: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
//   dot: { width: 5, height: 5, borderRadius: 3 },
// });

// // ─── Main screen ─────────────────────────────────────────────
// export default function FinanceDashboard() {
//   const theme = useTheme();
//   const insets = useSafeAreaInsets();
//   const { width } = useWindowDimensions();
//   const isDesktop = width >= 860;
//   const styles = useMemo(() => createStyles(theme), [theme]);

//   const [refreshing, setRefreshing] = useState(false);
//   const [activeTab, setActiveTab] = useState('Overview');
//   const [includeTripExpenses, setIncludeTripExpenses] = useState(false);
//   const [month, setMonth] = useState<string>(currentYM);

//   const { data: dashboard, isLoading, refetch } = useFinanceDashboard({
//     month,
//     includeTripExpenses,
//   });

//   const [headerHeight, setHeaderHeight] = useState(Platform.OS === 'web' ? 140 : 180);

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     haptics.light();
//     await refetch();
//     setRefreshing(false);
//   }, [refetch]);

//   const shift = useCallback((delta: number) => {
//     haptics.light();
//     setMonth((prev) => shiftMonth(prev, delta));
//   }, []);

//   const resetMonth = useCallback(() => {
//     haptics.light();
//     setMonth(currentYM());
//   }, []);

//   const showPeriodControls = PERIOD_TABS.has(activeTab);

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'Overview':
//         return (
//           <FinanceOverview
//             month={month}
//             includeTripExpenses={includeTripExpenses}
//             onToggleIncludeTripExpenses={setIncludeTripExpenses}
//             onMonthChange={(m: string) => setMonth(m)}
//             onNavigateTab={(tab: string) => setActiveTab(tab)}
//           />
//         );
//       case 'Analytics':
//         return (
//           <FinanceAnalytics
//             month={month}
//             includeTripExpenses={includeTripExpenses}
//             onToggleIncludeTripExpenses={setIncludeTripExpenses}
//           />
//         );
//       case 'Budget':
//         return (
//           <FinanceBudget
//             month={month}
//             includeTripExpenses={includeTripExpenses}
//             onToggleIncludeTripExpenses={setIncludeTripExpenses}
//           />
//         );
//       case 'Bills':
//         return <FinanceBills />;
//       case 'Goals':
//         return <FinanceGoals />;
//       case 'Debts':
//         return <FinanceDebts />;
//       default:
//         return null;
//     }
//   };

//   const refreshBtn = (
//     <Pressable
//       onPress={onRefresh}
//       disabled={refreshing}
//       style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
//       hitSlop={8}
//       accessibilityRole="button"
//       accessibilityLabel="Refresh"
//     >
//       <AppIcon
//         name="refresh-cw"
//         size={15}
//         color={refreshing ? theme.colors.primary : theme.colors.textSecondary}
//       />
//     </Pressable>
//   );

//   const headerTopPadding =
//     Platform.OS === 'web'
//       ? 12
//       : Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 38 : 24) + 8;

//   return (
//     <View style={styles.root}>
//       <View style={StyleSheet.absoluteFill} pointerEvents="none">
//         <GlobalBackground />
//       </View>

//       {/* Status bar shield: keeps scrolled content out of the notification area */}
//       <View
//         pointerEvents="none"
//         style={[styles.shield, { height: headerTopPadding, backgroundColor: theme.colors.background }]}
//       />

//       {/* ─── Floating header ─── */}
//       <View
//         style={[styles.headerWrapper, { paddingTop: headerTopPadding }]}
//         onLayout={(e) => {
//           const h = e.nativeEvent.layout.height;
//           if (h > 0 && Math.abs(h - headerHeight) > 2) setHeaderHeight(h);
//         }}
//       >
//         <GlassCard
//           intensity={theme.isDark ? 28 : 45}
//           style={[
//             styles.headerCard,
//             {
//               borderColor: hairlineFor(theme),
//               backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.68)' : 'rgba(255, 255, 255, 0.82)',
//             },
//           ]}
//         >
//           <View style={styles.headerInner}>
//             {/* Title row */}
//             <View style={styles.titleRow}>
//               <View style={{ flex: 1 }}>
//                 <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
//                   Regular expenses
//                 </Text>
//                 <Text
//                   style={[styles.subtitle, { color: theme.colors.textTertiary }]}
//                   numberOfLines={1}
//                 >
//                   Personal budgeting and trip splits
//                 </Text>
//               </View>

//               {isDesktop && showPeriodControls ? (
//                 <View style={styles.desktopControls}>
//                   <LensSwitch
//                     includeTrips={includeTripExpenses}
//                     onChange={setIncludeTripExpenses}
//                     compact={false}
//                     style={{ width: 230 }}
//                   />
//                   <MonthSwitcher
//                     month={month}
//                     onShift={shift}
//                     onReset={resetMonth}
//                     style={{ width: 170 }}
//                   />
//                   {refreshBtn}
//                 </View>
//               ) : (
//                 refreshBtn
//               )}
//             </View>

//             {/* Mobile controls */}
//             {!isDesktop && showPeriodControls && (
//               <View style={styles.mobileControls}>
//                 <LensSwitch
//                   includeTrips={includeTripExpenses}
//                   onChange={setIncludeTripExpenses}
//                   compact
//                   style={{ flex: 1 }}
//                 />
//                 <MonthSwitcher month={month} onShift={shift} onReset={resetMonth} style={{ flex: 1 }} />
//               </View>
//             )}

//             {/* Section tabs: same component as Trips and Companions */}
//             <TripTabs
//               tabs={TABS}
//               activeTab={activeTab}
//               onChange={setActiveTab}
//               variant="segmented"
//               size="sm"
//               scrollable={!isDesktop}
//             />
//           </View>
//         </GlassCard>
//       </View>

//       {/* ─── Content ─── */}
//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={[
//           styles.scrollContent,
//           isDesktop && styles.desktopScrollContent,
//           {
//             paddingTop: headerHeight + 14,
//             paddingBottom: Math.max(insets.bottom, 20) + 100,
//           },
//         ]}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor={theme.colors.primary}
//             colors={[theme.colors.primary]}
//             progressViewOffset={headerHeight + 8}
//           />
//         }
//       >
//         <View style={styles.mainLayout}>
//           {activeTab === 'Overview' && (
//             <QuickStats
//               dashboard={dashboard}
//               loading={isLoading}
//               onNavigateTab={setActiveTab}
//             />
//           )}

//           {/* A short fade when the section changes (answers the tap) */}
//           <Animated.View key={activeTab} entering={FadeIn.duration(160)} style={{ width: '100%' }}>
//             {renderTabContent()}
//           </Animated.View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────
// function createStyles(theme: Theme) {
//   return StyleSheet.create({
//     root: { flex: 1, backgroundColor: 'transparent' },
//     scroll: { flex: 1 },
//     shield: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40 },

//     headerWrapper: {
//       position: 'absolute',
//       top: 0,
//       left: 0,
//       right: 0,
//       zIndex: 30,
//       paddingHorizontal: 16,
//       alignItems: 'center',
//     },
//     headerCard: {
//       width: '100%',
//       maxWidth: 1400,
//       borderRadius: 22,
//       borderWidth: 1,
//       paddingHorizontal: 14,
//       paddingTop: 12,
//       paddingBottom: 12,
//       ...Platform.select({
//         web: { boxShadow: '0 8px 28px rgba(15, 23, 42, 0.08)' } as any,
//         default: {
//           shadowColor: '#0F172A',
//           shadowOffset: { width: 0, height: 4 },
//           shadowOpacity: 0.08,
//           shadowRadius: 12,
//         },
//       }),
//     },
//     headerInner: { width: '100%', gap: 12 },
//     titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
//     title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
//     subtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
//     desktopControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//     mobileControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },

//     iconBtn: {
//       width: 36,
//       height: 36,
//       borderRadius: 12,
//       borderWidth: 1,
//       alignItems: 'center',
//       justifyContent: 'center',
//       borderColor: hairlineFor(theme),
//       backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
//     },

//     scrollContent: { paddingHorizontal: 16 },
//     desktopScrollContent: {
//       maxWidth: 1400,
//       alignSelf: 'center',
//       width: '100%',
//       paddingHorizontal: 24,
//     },
//     mainLayout: { width: '100%', gap: 16 },
//   });
// }

// function createTileStyles(theme: Theme) {
//   return StyleSheet.create({
//     row: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 2 },
//     tile: {
//       width: 156,
//       minHeight: 104,
//       borderRadius: 16,
//       paddingVertical: 12,
//       paddingHorizontal: 14,
//       justifyContent: 'space-between',
//       gap: 6,
//       borderWidth: 1,
//       borderColor: hairlineFor(theme),
//       backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.78)',
//       overflow: 'hidden',
//     },
//     head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//     iconWrap: {
//       width: 24,
//       height: 24,
//       borderRadius: 8,
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     label: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
//     value: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
//     track: { height: 4, borderRadius: 2, overflow: 'hidden' },
//     fill: { height: '100%', borderRadius: 2 },
//     sub: { fontSize: 11, fontWeight: '500' },
//   });
// }
// // // app/(app)/(tabs)/finance.tsx
// // import React, { useState, useCallback, useMemo } from 'react';
// // import {
// //   View, Text, StyleSheet, RefreshControl, ScrollView, Platform, Pressable, useWindowDimensions, StatusBar,
// // } from 'react-native';
// // import { useSafeAreaInsets } from 'react-native-safe-area-context';
// // import Animated, {
// //   useSharedValue,
// //   useAnimatedStyle,
// //   useAnimatedScrollHandler,
// //   withTiming,
// // } from 'react-native-reanimated';

// // import { useTheme } from '../../../providers/ThemeProvider';
// // import { useResponsive } from '../../../hooks/useResponsive';
// // import { useFinanceDashboard } from '../../../hooks/useFinance';
// // import { haptics } from '../../../utils/haptics';
// // import { safeFormatCurrency } from '../../../utils/formatters';

// // import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// // import { GlassCard } from '../../../components/ui/GlassCard';
// // import { TabBar, TabItem } from '../../../components/ui/TabBar';
// // import AppIcon from '../../../components/common/AppIcon';

// // import { FinanceOverview } from '../../../components/finance/FinanceOverview';
// // import { FinanceAnalytics } from '../../../components/finance/FinanceAnalytics';
// // import { FinanceBudget } from '../../../components/finance/FinanceBudget';
// // import { FinanceDebts } from '../../../components/finance/FinanceDebts';
// // import { FinanceBills } from '../../../components/finance/FinanceBills';
// // import { FinanceGoals } from '../../../components/finance/FinanceGoals';
// // import type { Theme } from '../../../theme';

// // // ─── Constants ───────────────────────────────────────────────
// // const TABS = [
// //   { key: 'Overview', label: 'Overview', icon: 'home' },
// //   { key: 'Analytics', label: 'Analytics', icon: 'bar-chart-2' },
// //   { key: 'Budget', label: 'Budget', icon: 'pie-chart' },
// //   { key: 'Bills', label: 'Bills', icon: 'file-text' },
// //   { key: 'Goals', label: 'Goals', icon: 'target' },
// //   { key: 'Debts', label: 'Debts', icon: 'users' },
// // ];

// // // ─── 4-Tile Bento Quick Stats Strip ─────────────────────────
// // function BentoQuickStats({
// //   dashboard,
// //   theme,
// //   onNavigateTab,
// // }: {
// //   dashboard: any;
// //   theme: Theme;
// //   onNavigateTab: (tab: string) => void;
// // }) {
// //   if (!dashboard) return null;

// //   const totalExpense = Number(dashboard.monthlyOverview?.totalExpense || 0) || 0;
// //   const budget = Number(dashboard.monthlyOverview?.budget || 0) || 0;
// //   const budgetLeft = Math.max(budget - totalExpense, 0);
// //   const overBudgetAmount = Math.max(totalExpense - budget, 0);
// //   const budgetPercent = budget > 0 ? (totalExpense / budget) * 100 : 0;
// //   const isOverBudget = totalExpense > budget && budget > 0;
// //   const transactionCount = Number(dashboard.stats?.transactionCount || 0) || 0;
// //   const activeDebtsCount = Number(dashboard.stats?.pendingDebtsCount || dashboard.debts?.length || 0);

// //   return (
// //     <ScrollView
// //       horizontal
// //       showsHorizontalScrollIndicator={false}
// //       style={{ marginHorizontal: -16 }}
// //       contentContainerStyle={statsStyles(theme).bentoRow}
// //     >
// //       {/* Tile 1: Total Spent */}
// //       <Pressable
// //         style={statsStyles(theme).tilePressable}
// //         onPress={() => {
// //           haptics.light();
// //           onNavigateTab('Analytics');
// //         }}
// //       >
// //         <GlassCard style={statsStyles(theme).bentoTile} intensity={theme.isDark ? 15 : 10}>
// //           <View style={statsStyles(theme).tileHeaderRow}>
// //             <View style={[statsStyles(theme).tileIconWrap, { backgroundColor: '#FEE2E2' }]}>
// //               <AppIcon name="credit-card" size={12} color="#EF4444" />
// //             </View>
// //             <Text style={[statsStyles(theme).tileCategoryLabel, { color: '#EF4444' }]}>TOTAL SPENT</Text>
// //           </View>
// //           <Text style={[statsStyles(theme).tileValue, { color: theme.colors.textPrimary }]}>
// //             ₹{totalExpense.toLocaleString('en-IN')}
// //           </Text>
// //           <Text style={[statsStyles(theme).tileSub, { color: theme.colors.textTertiary }]}>
// //             {budget > 0 ? `${budgetPercent.toFixed(0)}% of monthly budget` : 'Total expenses logged'}
// //           </Text>
// //         </GlassCard>
// //       </Pressable>

// //       {/* Tile 2: Budget Remaining */}
// //       <Pressable
// //         style={statsStyles(theme).tilePressable}
// //         onPress={() => {
// //           haptics.light();
// //           onNavigateTab('Budget');
// //         }}
// //       >
// //         <GlassCard style={statsStyles(theme).bentoTile} intensity={theme.isDark ? 15 : 10}>
// //           <View style={statsStyles(theme).tileHeaderRow}>
// //             <View
// //               style={[
// //                 statsStyles(theme).tileIconWrap,
// //                 { backgroundColor: isOverBudget ? '#FEE2E2' : '#ECFDF5' },
// //               ]}
// //             >
// //               <AppIcon
// //                 name="pie-chart"
// //                 size={12}
// //                 color={isOverBudget ? '#EF4444' : '#10B981'}
// //               />
// //             </View>
// //             <Text
// //               style={[
// //                 statsStyles(theme).tileCategoryLabel,
// //                 { color: isOverBudget ? '#EF4444' : '#10B981' },
// //               ]}
// //             >
// //               {isOverBudget ? 'OVER BUDGET' : 'BUDGET LEFT'}
// //             </Text>
// //           </View>
// //           <Text
// //             style={[
// //               statsStyles(theme).tileValue,
// //               { color: isOverBudget ? '#EF4444' : '#10B981' },
// //             ]}
// //           >
// //             ₹{(isOverBudget ? overBudgetAmount : budgetLeft).toLocaleString('en-IN')}
// //           </Text>
// //           <Text style={[statsStyles(theme).tileSub, { color: theme.colors.textTertiary }]}>
// //             {budget > 0
// //               ? isOverBudget
// //                 ? `Exceeded by ₹${overBudgetAmount.toLocaleString('en-IN')}`
// //                 : `₹${budgetLeft.toLocaleString('en-IN')} remaining of ₹${budget.toLocaleString('en-IN')}`
// //               : 'No budget configured'}
// //           </Text>
// //         </GlassCard>
// //       </Pressable>

// //       {/* Tile 3: Transactions */}
// //       <Pressable
// //         style={statsStyles(theme).tilePressable}
// //         onPress={() => {
// //           haptics.light();
// //           onNavigateTab('Overview');
// //         }}
// //       >
// //         <GlassCard style={statsStyles(theme).bentoTile} intensity={theme.isDark ? 15 : 10}>
// //           <View style={statsStyles(theme).tileHeaderRow}>
// //             <View style={[statsStyles(theme).tileIconWrap, { backgroundColor: '#EFF6FF' }]}>
// //               <AppIcon name="file-text" size={12} color="#2563EB" />
// //             </View>
// //             <Text style={[statsStyles(theme).tileCategoryLabel, { color: '#2563EB' }]}>ACTIVITY</Text>
// //           </View>
// //           <Text style={[statsStyles(theme).tileValue, { color: theme.colors.textPrimary }]}>
// //             {transactionCount}
// //           </Text>
// //           <Text style={[statsStyles(theme).tileSub, { color: theme.colors.textTertiary }]}>
// //             Transactions this month
// //           </Text>
// //         </GlassCard>
// //       </Pressable>

// //       {/* Tile 4: Active Debts / Bills */}
// //       <Pressable
// //         style={statsStyles(theme).tilePressable}
// //         onPress={() => {
// //           haptics.light();
// //           onNavigateTab('Debts');
// //         }}
// //       >
// //         <GlassCard style={statsStyles(theme).bentoTile} intensity={theme.isDark ? 15 : 10}>
// //           <View style={statsStyles(theme).tileHeaderRow}>
// //             <View style={[statsStyles(theme).tileIconWrap, { backgroundColor: '#FEF3C7' }]}>
// //               <AppIcon name="users" size={12} color="#D97706" />
// //             </View>
// //             <Text style={[statsStyles(theme).tileCategoryLabel, { color: '#D97706' }]}>DEBTS & SPLITS</Text>
// //           </View>
// //           <Text style={[statsStyles(theme).tileValue, { color: activeDebtsCount > 0 ? '#F59E0B' : theme.colors.textPrimary }]}>
// //             {activeDebtsCount}
// //           </Text>
// //           <Text style={[statsStyles(theme).tileSub, { color: theme.colors.textTertiary }]}>
// //             {activeDebtsCount > 0 ? 'Pending settlements' : 'All clear'}
// //           </Text>
// //         </GlassCard>
// //       </Pressable>
// //     </ScrollView>
// //   );
// // }

// // // ─── Main Screen ─────────────────────────────────────────────
// // export default function FinanceDashboard() {
// //   const theme = useTheme();
// //   const insets = useSafeAreaInsets();
// //   const { width } = useWindowDimensions();
// //   const isDesktop = width >= 860;

// //   const [refreshing, setRefreshing] = useState(false);
// //   const [activeTab, setActiveTab] = useState('Overview');

// //   const [includeTripExpenses, setIncludeTripExpenses] = useState(false);

// //   // Month state
// //   const [currentDate, setCurrentDate] = useState(new Date());
// //   const currentMonth = useMemo(
// //     () => currentDate.toISOString().substring(0, 7),
// //     [currentDate]
// //   );

// //   const { data: dashboard, isLoading, refetch } = useFinanceDashboard({
// //     month: currentMonth,
// //     includeTripExpenses,
// //   });

// //   const [headerHeight, setHeaderHeight] = useState(Platform.OS === 'web' ? 140 : 180);

// //   const scrollY = useSharedValue(0);
// //   const scrollHandler = useAnimatedScrollHandler({
// //     onScroll: (event) => {
// //       scrollY.value = event.contentOffset.y;
// //     },
// //   });

// //   const headerAnimatedStyle = useAnimatedStyle(() => ({
// //     transform: [
// //       {
// //         scale: withTiming(scrollY.value > 30 ? 0.985 : 1, { duration: 180 }),
// //       },
// //     ],
// //   }));

// //   const onRefresh = useCallback(async () => {
// //     setRefreshing(true);
// //     haptics.light();
// //     await refetch();
// //     setRefreshing(false);
// //   }, [refetch]);

// //   const changeMonth = useCallback((offset: number) => {
// //     haptics.light();
// //     setCurrentDate((prev) => {
// //       const newDate = new Date(prev);
// //       newDate.setMonth(newDate.getMonth() + offset);
// //       return newDate;
// //     });
// //   }, []);

// //   const formattedMonth = useMemo(
// //     () =>
// //       currentDate.toLocaleDateString('en-IN', {
// //         month: 'short',
// //         year: 'numeric',
// //       }),
// //     [currentDate]
// //   );

// //   const renderTabContent = useCallback(() => {
// //     switch (activeTab) {
// //       case 'Overview':
// //         return (
// //           <FinanceOverview
// //             month={currentMonth}
// //             includeTripExpenses={includeTripExpenses}
// //             onToggleIncludeTripExpenses={setIncludeTripExpenses}
// //             onMonthChange={(m) => setCurrentDate(new Date(`${m}-01`))}
// //             onNavigateTab={(tab) => setActiveTab(tab)}
// //           />
// //         );
// //       case 'Analytics':
// //         return (
// //           <FinanceAnalytics
// //             month={currentMonth}
// //             includeTripExpenses={includeTripExpenses}
// //             onToggleIncludeTripExpenses={setIncludeTripExpenses}
// //           />
// //         );
// //       case 'Budget':
// //         return (
// //           <FinanceBudget
// //             month={currentMonth}
// //             includeTripExpenses={includeTripExpenses}
// //             onToggleIncludeTripExpenses={setIncludeTripExpenses}
// //           />
// //         );
// //       case 'Bills':
// //         return <FinanceBills />;
// //       case 'Goals':
// //         return <FinanceGoals />;
// //       case 'Debts':
// //         return <FinanceDebts />;
// //       default:
// //         return null;
// //     }
// //   }, [activeTab, currentMonth, includeTripExpenses]);

// //   const tabs: TabItem[] = TABS.map((tab) => ({
// //     key: tab.key,
// //     label: tab.label,
// //     icon: tab.icon,
// //   }));

// //   const renderLensToggle = () => (
// //     <Pressable
// //       onPress={() => {
// //         haptics.light();
// //         setIncludeTripExpenses((prev) => !prev);
// //       }}
// //       style={[
// //         styles.lensToggleBtn,
// //         {
// //           backgroundColor: includeTripExpenses
// //             ? (theme.isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(99, 102, 241, 0.12)')
// //             : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
// //           borderColor: includeTripExpenses
// //             ? (theme.isDark ? 'rgba(99, 102, 241, 0.5)' : '#6366F1')
// //             : (theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
// //         },
// //       ]}
// //       hitSlop={8}
// //     >
// //       <AppIcon
// //         name={includeTripExpenses ? 'compass' : 'user'}
// //         size={12}
// //         color={includeTripExpenses ? '#6366F1' : theme.colors.textSecondary}
// //       />
// //       <Text
// //         style={[
// //           styles.lensToggleText,
// //           { color: includeTripExpenses ? (theme.isDark ? '#A5B4FC' : '#4F46E5') : theme.colors.textSecondary },
// //         ]}
// //       >
// //         {includeTripExpenses ? '+ Trips' : 'Personal'}
// //       </Text>
// //     </Pressable>
// //   );

// //   const renderMonthSelector = () => {
// //     if (activeTab === 'Debts') return null;
// //     return (
// //       <View
// //         style={[
// //           styles.monthSelectorPill,
// //           {
// //             backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
// //             borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
// //           },
// //         ]}
// //       >
// //         <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrowBtn} hitSlop={8}>
// //           <AppIcon name="chevron-left" size={14} color={theme.colors.textSecondary} />
// //         </Pressable>

// //         <View style={styles.monthLabelGroup}>
// //           <AppIcon name="calendar" size={13} color={theme.colors.primary} />
// //           <Text style={[styles.monthLabelText, { color: theme.colors.textPrimary }]}>
// //             {formattedMonth}
// //           </Text>
// //         </View>

// //         <Pressable onPress={() => changeMonth(1)} style={styles.monthArrowBtn} hitSlop={8}>
// //           <AppIcon name="chevron-right" size={14} color={theme.colors.textSecondary} />
// //         </Pressable>
// //       </View>
// //     );
// //   };

// //   const renderRefreshBtn = () => (
// //     <Pressable
// //       onPress={onRefresh}
// //       disabled={refreshing}
// //       style={({ pressed }) => [
// //         styles.navBtn,
// //         {
// //           backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
// //           borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
// //         },
// //         pressed && { opacity: 0.7 },
// //       ]}
// //       hitSlop={8}
// //     >
// //       <AppIcon
// //         name="refresh-cw"
// //         size={14}
// //         color={refreshing ? theme.colors.primary : theme.colors.textSecondary}
// //       />
// //     </Pressable>
// //   );

// //   const headerTopPadding = Platform.OS === 'web'
// //     ? 12
// //     : Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight ?? 38) : 24) + 8;

// //   return (
// //     <View style={styles.root}>
// //       <View style={StyleSheet.absoluteFill} pointerEvents="none">
// //         <GlobalBackground />
// //       </View>

// //       {/* ─── STATUS BAR SHIELD (Prevents content from scrolling into Android/iOS notification area) ─── */}
// //       <View
// //         pointerEvents="none"
// //         style={{
// //           position: 'absolute',
// //           top: 0,
// //           left: 0,
// //           right: 0,
// //           height: headerTopPadding,
// //           zIndex: 40,
// //           backgroundColor: theme.colors.background,
// //         }}
// //       />

// //       {/* ─── FLOATING CURVED HEADER ─── */}
// //       <Animated.View
// //         style={[
// //           styles.floatingHeaderWrapper,
// //           headerAnimatedStyle,
// //           { paddingTop: headerTopPadding },
// //         ]}
// //         onLayout={(e) => {
// //           const h = e.nativeEvent.layout.height;
// //           if (h > 0 && Math.abs(h - headerHeight) > 2) {
// //             setHeaderHeight(h);
// //           }
// //         }}
// //       >
// //         <GlassCard
// //           intensity={theme.isDark ? 28 : 45}
// //           style={[
// //             styles.floatingHeaderCard,
// //             {
// //               borderColor: theme.isDark
// //                 ? 'rgba(255, 255, 255, 0.12)'
// //                 : 'rgba(0, 0, 0, 0.08)',
// //               backgroundColor: theme.isDark
// //                 ? 'rgba(15, 23, 42, 0.65)'
// //                 : 'rgba(255, 255, 255, 0.78)',
// //             },
// //           ]}
// //         >
// //           <View style={[styles.headerContentWrapper, isDesktop && styles.desktopHeaderWrapper]}>
// //             {isDesktop ? (
// //               <View style={styles.headerTopRow}>
// //                 {/* Title Block */}
// //                 <View style={styles.titleBlock}>
// //                   <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
// //                     Regular Expenses
// //                   </Text>
// //                   <Text style={[styles.headerSub, { color: theme.colors.textTertiary }]}>
// //                     Personal budgeting & trip split analytics
// //                   </Text>
// //                 </View>

// //                 {/* Header Right Actions: Lens Switcher + Month Navigator + Refresh */}
// //                 <View style={styles.headerRightControls}>
// //                   {renderLensToggle()}
// //                   {renderMonthSelector()}
// //                   {renderRefreshBtn()}
// //                 </View>
// //               </View>
// //             ) : (
// //               <View style={styles.mobileHeaderWrapper}>
// //                 {/* Mobile Row 1: Title + Refresh */}
// //                 <View style={styles.headerTopRow}>
// //                   <View style={[styles.titleBlock, { flex: 1, marginRight: 8 }]}>
// //                     <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
// //                       Regular Expenses
// //                     </Text>
// //                     <Text style={[styles.headerSub, { color: theme.colors.textTertiary }]} numberOfLines={1}>
// //                       Personal budgeting & trip split analytics
// //                     </Text>
// //                   </View>
// //                   {renderRefreshBtn()}
// //                 </View>

// //                 {/* Mobile Row 2: Lens Switcher + Month Navigator */}
// //                 <View style={styles.mobileControlsRow}>
// //                   {renderLensToggle()}
// //                   <View style={{ flex: 1 }}>
// //                     {renderMonthSelector()}
// //                   </View>
// //                 </View>
// //               </View>
// //             )}

// //             {/* Sub-Tab Navigation Bar */}
// //             <View style={styles.tabBarWrap}>
// //               <TabBar
// //                 tabs={tabs}
// //                 activeKey={activeTab}
// //                 onTabChange={setActiveTab}
// //                 variant="pills"
// //                 scrollable
// //                 size="sm"
// //               />
// //             </View>
// //           </View>
// //         </GlassCard>
// //       </Animated.View>

// //       {/* ─── MAIN CONTENT BODY ─── */}
// //       <Animated.ScrollView
// //         style={styles.scrollView}
// //         contentContainerStyle={[
// //           styles.scrollContent,
// //           isDesktop && styles.desktopScrollContent,
// //           {
// //             paddingTop: headerHeight + 14,
// //             paddingBottom: Math.max(insets.bottom, 20) + 100,
// //           },
// //         ]}
// //         showsVerticalScrollIndicator={false}
// //         onScroll={scrollHandler}
// //         scrollEventThrottle={16}
// //         refreshControl={
// //           <RefreshControl
// //             refreshing={refreshing}
// //             onRefresh={onRefresh}
// //             tintColor={theme.colors.primary}
// //             colors={[theme.colors.primary]}
// //             progressViewOffset={headerHeight + 8}
// //           />
// //         }
// //       >
// //         <View style={styles.mainLayout}>
// //           {/* Bento Stats Strip (Rendered on Overview Tab) */}
// //           {activeTab === 'Overview' && (
// //             <BentoQuickStats
// //               dashboard={dashboard}
// //               theme={theme}
// //               onNavigateTab={(tab) => setActiveTab(tab)}
// //             />
// //           )}

// //           {/* Active Tab Subview */}
// //           <View style={styles.tabContentContainer}>
// //             {renderTabContent()}
// //           </View>
// //         </View>
// //       </Animated.ScrollView>
// //     </View>
// //   );
// // }

// // // ============================================================
// // // STYLES
// // // ============================================================

// // const styles = StyleSheet.create({
// //   root: { flex: 1, backgroundColor: 'transparent' },
// //   scrollView: { flex: 1 },

// //   floatingHeaderWrapper: {
// //     position: 'absolute',
// //     top: 0,
// //     left: 0,
// //     right: 0,
// //     zIndex: 30,
// //     paddingHorizontal: 16,
// //     alignItems: 'center',
// //   },
// //   floatingHeaderCard: {
// //     width: '100%',
// //     maxWidth: 1400,
// //     borderRadius: 24,
// //     borderWidth: 1,
// //     paddingHorizontal: 16,
// //     paddingTop: 12,
// //     paddingBottom: 10,

// //     ...Platform.select({
// //       web: {
// //         boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
// //       } as any,
// //       default: {
// //         shadowColor: '#000',
// //         shadowOffset: { width: 0, height: 4 },
// //         shadowOpacity: 0.1,
// //         shadowRadius: 12,
// //       },
// //     }),
// //   },
// //   headerContentWrapper: {
// //     width: '100%',
// //     alignSelf: 'center',
// //     gap: 10,
// //   },
// //   desktopHeaderWrapper: {
// //     maxWidth: 1400,
// //   },
// //   mobileHeaderWrapper: {
// //     width: '100%',
// //     gap: 10,
// //   },
// //   mobileControlsRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     width: '100%',
// //     gap: 8,
// //   },
// //   headerTopRow: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     width: '100%',
// //   },
// //   titleBlock: {
// //     gap: 2,
// //   },
// //   headerTitle: {
// //     fontSize: 20,
// //     fontWeight: '900',
// //     letterSpacing: -0.5,
// //   },
// //   headerSub: {
// //     fontSize: 11,
// //     fontWeight: '500',
// //   },
// //   headerRightControls: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 8,
// //   },
// //   lensToggleBtn: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 5,
// //     borderRadius: 14,
// //     borderWidth: 1,
// //     paddingHorizontal: 8,
// //     paddingVertical: 6,
// //   },
// //   lensToggleText: {
// //     fontSize: 11,
// //     fontWeight: '700',
// //     letterSpacing: -0.2,
// //   },
// //   monthSelectorPill: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     borderRadius: 16,
// //     borderWidth: 1,
// //     paddingHorizontal: 6,
// //     paddingVertical: 3,
// //   },
// //   monthArrowBtn: {
// //     padding: 4,
// //     borderRadius: 10,
// //   },
// //   monthLabelGroup: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 5,
// //     paddingHorizontal: 4,
// //   },
// //   monthLabelText: {
// //     fontSize: 12,
// //     fontWeight: '800',
// //     letterSpacing: -0.2,
// //   },
// //   navBtn: {
// //     width: 34,
// //     height: 34,
// //     borderRadius: 14,
// //     borderWidth: 1,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   tabBarWrap: {
// //     marginTop: 2,
// //   },
// //   scrollContent: {
// //     paddingHorizontal: 16,
// //   },
// //   desktopScrollContent: {
// //     maxWidth: 1400,
// //     alignSelf: 'center',
// //     width: '100%',
// //     paddingHorizontal: 24,
// //   },
// //   mainLayout: {
// //     width: '100%',
// //     gap: 16,
// //   },
// //   tabContentContainer: {
// //     width: '100%',
// //   },
// // });

// // function statsStyles(theme: Theme) {
// //   return StyleSheet.create({
// //     bentoRow: {
// //       flexDirection: 'row',
// //       gap: 10,
// //       paddingHorizontal: 16,
// //       marginBottom: 6,
// //     },
// //     tilePressable: {
// //       flexShrink: 0,
// //     },
// //     bentoTile: {
// //       width: 145,
// //       minHeight: 74,
// //       borderRadius: 18,
// //       paddingVertical: 10,
// //       paddingHorizontal: 12,
// //       justifyContent: 'space-between',
// //       backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.72)',
// //       borderWidth: 1,
// //       borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
// //       overflow: 'hidden',
// //     },
// //     tileHeaderRow: {
// //       flexDirection: 'row',
// //       alignItems: 'center',
// //       gap: 6,
// //     },
// //     tileIconWrap: {
// //       width: 22,
// //       height: 22,
// //       borderRadius: 6,
// //       alignItems: 'center',
// //       justifyContent: 'center',
// //     },
// //     tileCategoryLabel: {
// //       fontSize: 9,
// //       fontWeight: '800',
// //       letterSpacing: 0.5,
// //     },
// //     tileValue: {
// //       fontSize: 18,
// //       fontWeight: '900',
// //       letterSpacing: -0.4,
// //     },
// //     tileSub: {
// //       fontSize: 10,
// //       fontWeight: '600',
// //       marginTop: 2,
// //     },
// //   });
// // }
