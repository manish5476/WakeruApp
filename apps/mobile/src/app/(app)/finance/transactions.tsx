// app/(app)/transactions.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  TextInput,
  Pressable,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
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
import { format, isThisYear, isToday, isYesterday, parseISO } from 'date-fns';

import { useTheme } from '../../../providers/ThemeProvider';
import { useInfiniteTransactions } from '../../../hooks/useFinance';
import { haptics } from '../../../utils/haptics';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import AppIcon from '../../../components/common/AppIcon';
import { CustomDatePickerModal } from '../../../components/common/CustomDatePickerModal';
import { GlassCard } from '../../../components/ui/GlassCard';
import { TripTabs } from '../../../components/ui/TripTabs';
import { TransactionCard } from '../../../components/ui/TransactionCard';
import type { Theme } from '../../../theme';

// ─── Types ───────────────────────────────────────────────────
type TransactionType =
  'all' | 'regular' | 'trip_expense' | 'income' | 'lent' | 'borrowed';
type DateFilterPreset =
  'all' | 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

interface Transaction {
  localCurrency?: string;
  currency?: string;
  _id: string;
  id?: string;
  title: string;
  type: string;
  category: string;
  amount: number;
  myShare?: number;
  totalExpenseAmount?: number;
  date: string;
  paymentMethod?: string;
  tripId?: { _id: string; title: string; coverImage?: string };
  tripName?: string;
  splitWith?: string[];
  notes?: string;
  paidByName?: string;
  relationshipId?: string;
  personName?: string;
  personPhone?: string;
  personUserId?: string;
}

const TYPE_TABS: { id: TransactionType; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'layers' },
  { id: 'regular', label: 'Regular', icon: 'wallet' },
  { id: 'trip_expense', label: 'Trips', icon: 'map' },
  { id: 'income', label: 'Income', icon: 'arrow-up-right' },
  { id: 'lent', label: 'Lent', icon: 'arrow-up-right' },
  { id: 'borrowed', label: 'Borrowed', icon: 'arrow-down-left' },
];

const DATE_TABS: { id: DateFilterPreset; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
  { id: 'this_year', label: 'This year' },
  { id: 'custom', label: 'Custom' },
];

const DATE_LABELS: Record<DateFilterPreset, string> = {
  all: 'all time',
  today: 'today',
  this_week: 'this week',
  this_month: 'this month',
  this_year: 'this year',
  custom: 'custom range',
};

// Same shared content width as the Finance screen so both pages line up.
const CONTENT_MAX = 1200;
const GRID_GAP = 12;

const TONE = {
  red: '#EF4444',
  green: '#10B981',
  blue: '#3B82F6',
  amber: '#F59E0B',
  pink: '#EC4899',
};

// ─── Helpers ─────────────────────────────────────────────────
const toISODate = (d: Date) => format(d, 'yyyy-MM-dd');
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const hairlineFor = (theme: Theme) =>
  theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';

function getPresetRange(
  preset: DateFilterPreset,
  customStart: string,
  customEnd: string,
) {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { startDate: toISODate(now), endDate: toISODate(now) };
    case 'this_week': {
      const start = new Date(now);
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
      return { startDate: toISODate(start), endDate: toISODate(now) };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toISODate(start), endDate: toISODate(end) };
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { startDate: toISODate(start), endDate: toISODate(end) };
    }
    case 'custom':
      return {
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
      };
    default:
      return {};
  }
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split('')
        .map(c => c + c)
        .join('');
    if (hex.length >= 6) {
      const a = Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0');
      return `#${hex.slice(0, 6)}${a}`;
    }
  }
  return color;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 'unknown' : format(d, 'yyyy-MM-dd');
}

function dayLabel(key: string): string {
  if (key === 'unknown') return 'Undated';
  const d = parseISO(key);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, isThisYear(d) ? 'EEEE, MMM d' : 'MMM d, yyyy');
}

const NON_SPENDING = new Set([
  'income',
  'settlement_received',
  'lent',
  'borrowed',
  'repayment',
]);

// ─── Summary tiles ───────────────────────────────────────────
interface TileSpec {
  key: string;
  icon: string;
  tone: string;
  label: string;
  value: string;
  sub: string;
}

function buildTiles(filterType: TransactionType, s: any): TileSpec[] {
  const expense = Number(s.totalExpense || 0);
  const income = Number(s.totalIncome || 0);
  const net = Number(s.netAmount ?? income - expense);
  const lent = Number(s.totalLent || 0);
  const borrowed = Number(s.totalBorrowed || 0);
  const repaid = Number(s.totalRepaid || 0);

  if (filterType === 'lent') {
    return [
      {
        key: 'lent',
        icon: 'arrow-up-right',
        tone: TONE.amber,
        label: 'Total lent',
        value: inr(lent),
        sub: 'Given to contacts',
      },
      {
        key: 'repaid',
        icon: 'check-circle',
        tone: TONE.green,
        label: 'Repaid',
        value: inr(repaid),
        sub: 'Collected back',
      },
      {
        key: 'out',
        icon: 'clock',
        tone: TONE.blue,
        label: 'Outstanding',
        value: inr(Math.max(0, lent - repaid)),
        sub: 'Still owed to you',
      },
    ];
  }
  if (filterType === 'borrowed') {
    return [
      {
        key: 'borrowed',
        icon: 'arrow-down-left',
        tone: TONE.pink,
        label: 'Total borrowed',
        value: inr(borrowed),
        sub: 'Money you took',
      },
      {
        key: 'repaid',
        icon: 'check-circle',
        tone: TONE.green,
        label: 'You repaid',
        value: inr(repaid),
        sub: 'Paid back by you',
      },
      {
        key: 'out',
        icon: 'alert-circle',
        tone: TONE.red,
        label: 'Outstanding',
        value: inr(Math.max(0, borrowed - repaid)),
        sub: 'Still to pay back',
      },
    ];
  }
  const positive = net >= 0;
  return [
    {
      key: 'exp',
      icon: 'arrow-down-right',
      tone: TONE.red,
      label: 'Expenses',
      value: inr(expense),
      sub: 'Money out',
    },
    {
      key: 'inc',
      icon: 'arrow-up-right',
      tone: TONE.green,
      label: 'Income',
      value: inr(income),
      sub: 'Money in',
    },
    {
      key: 'net',
      icon: 'activity',
      tone: positive ? TONE.green : TONE.red,
      label: 'Net cashflow',
      value: `${positive ? '+' : '−'}${inr(Math.abs(net))}`,
      sub: positive ? 'Surplus for this period' : 'Deficit for this period',
    },
  ];
}

function SummaryTile({ spec, fluid }: { spec: TileSpec; fluid: boolean }) {
  const theme = useTheme();
  const s = useMemo(() => createTileStyles(theme), [theme]);

  return (
    <GlassCard
      style={[s.tile, fluid && s.tileFluid]}
      intensity={theme.isDark ? 15 : 10}
      padding="none"
    >
      <View style={s.head}>
        <View
          style={[s.iconWrap, { backgroundColor: withAlpha(spec.tone, 0.14) }]}
        >
          <AppIcon name={spec.icon as any} size={13} color={spec.tone} />
        </View>
        <Text
          style={[s.label, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {spec.label}
        </Text>
      </View>
      <Text style={[s.value, { color: spec.tone }]} numberOfLines={1}>
        {spec.value}
      </Text>
      <Text
        style={[s.sub, { color: theme.colors.textTertiary }]}
        numberOfLines={1}
      >
        {spec.sub}
      </Text>
    </GlassCard>
  );
}

function SummaryStrip({
  summary,
  filterType,
  isDesktop,
}: {
  summary: any;
  filterType: TransactionType;
  isDesktop: boolean;
}) {
  const theme = useTheme();
  const s = useMemo(() => createTileStyles(theme), [theme]);
  if (!summary) return null;

  const tiles = buildTiles(filterType, summary);

  // Desktop: the three tiles share the full content width. Mobile: scrollable strip.
  if (isDesktop) {
    return (
      <View style={s.fluidRow}>
        {tiles.map(t => (
          <SummaryTile key={t.key} spec={t} fluid />
        ))}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16 }}
      contentContainerStyle={s.row}
    >
      {tiles.map(t => (
        <SummaryTile key={t.key} spec={t} fluid={false} />
      ))}
    </ScrollView>
  );
}

// ─── Search field ────────────────────────────────────────────
function SearchField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (t: string) => void;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        fieldStyles.box,
        {
          backgroundColor: theme.isDark
            ? 'rgba(30, 41, 59, 0.6)'
            : 'rgba(241, 245, 249, 0.9)',
          borderColor: focused ? theme.colors.primary : hairlineFor(theme),
        },
      ]}
    >
      <AppIcon
        name="search"
        size={16}
        color={focused ? theme.colors.primary : theme.colors.textTertiary}
      />
      <TextInput
        style={[
          fieldStyles.input,
          { color: theme.colors.textPrimary },
          Platform.select({ web: { outlineStyle: 'none' } as any }),
        ]}
        placeholder="Search by title, trip or category"
        placeholderTextColor={theme.colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel="Search transactions"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <AppIcon name="x" size={14} color={theme.colors.textTertiary} />
        </Pressable>
      )}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
});

// ─── Loading skeleton (matches the card grid) ────────────────
function SkeletonGrid({ cols }: { cols: number }) {
  const theme = useTheme();
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
  const count = cols * 2;

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -GRID_GAP / 2,
        },
        animated,
      ]}
      accessibilityLabel="Loading transactions"
    >
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{ width: `${100 / cols}%`, padding: GRID_GAP / 2 }}
        >
          <View
            style={[
              skeletonStyles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: hairlineFor(theme),
              },
            ]}
          >
            <View style={[skeletonStyles.lead, { backgroundColor: bone }]} />
            <View style={{ flex: 1, gap: 9 }}>
              <View
                style={[
                  skeletonStyles.line,
                  { width: '60%', backgroundColor: bone },
                ]}
              />
              <View
                style={[
                  skeletonStyles.line,
                  { width: '40%', height: 9, backgroundColor: bone },
                ]}
              />
              <View
                style={[
                  skeletonStyles.line,
                  {
                    width: 70,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: bone,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  lead: { width: 52, height: 52, borderRadius: 16 },
  line: { height: 12, borderRadius: 6 },
});

// ─── Main screen ─────────────────────────────────────────────
export default function TransactionsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 860;
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Filter state
  const [filterType, setFilterType] = useState<TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(
    null,
  );

  useEffect(() => {
    const handler = setTimeout(
      () => setDebouncedSearch(searchQuery.trim()),
      350,
    );
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const resolvedDateRange = useMemo(
    () => getPresetRange(datePreset, customStartDate, customEndDate),
    [datePreset, customStartDate, customEndDate],
  );

  const apiFilterType = filterType === 'all' ? undefined : filterType;

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions({
    type: apiFilterType,
    search: debouncedSearch || undefined,
    startDate: resolvedDateRange.startDate,
    endDate: resolvedDateRange.endDate,
  } as any);

  const transactions: Transaction[] = useMemo(() => {
    const raw: Transaction[] =
      data?.pages.flatMap((page: any) => page?.transactions || []) || [];
    switch (filterType) {
      case 'regular':
        return raw.filter(
          t =>
            (t.type === 'expense' || t.type === 'regular') &&
            !t.tripId &&
            !t.tripName,
        );
      case 'trip_expense':
        return raw.filter(
          t =>
            t.type === 'trip_expense' ||
            Boolean(t.tripId) ||
            Boolean(t.tripName),
        );
      case 'income':
        return raw.filter(
          t => t.type === 'income' || t.type === 'settlement_received',
        );
      case 'lent':
        return raw.filter(t => t.type === 'lent');
      case 'borrowed':
        return raw.filter(t => t.type === 'borrowed');
      default:
        return raw;
    }
  }, [data, filterType]);

  const rawSummary = data?.pages?.[0]?.summary;

  const computedSummary = useMemo(() => {
    if (filterType === 'all') {
      return rawSummary || { totalExpense: 0, totalIncome: 0, netAmount: 0 };
    }
    let exp = 0,
      inc = 0,
      lent = 0,
      borrowed = 0,
      repaid = 0;
    transactions.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'income' || t.type === 'settlement_received') inc += amt;
      else if (t.type === 'lent') lent += amt;
      else if (t.type === 'borrowed') borrowed += amt;
      else if (t.type === 'repayment') repaid += amt;
      else exp += amt;
    });
    return {
      totalExpense: exp,
      totalIncome: inc,
      totalLent: lent,
      totalBorrowed: borrowed,
      totalRepaid: repaid,
      netAmount: inc - exp,
    };
  }, [rawSummary, filterType, transactions]);

  // Group by day (Today / Yesterday / date) with a per-day spending total
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach(t => {
      const key = dayKey(t.date);
      const list = map.get(key);
      if (list) list.push(t);
      else map.set(key, [t]);
    });
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: dayLabel(key),
      items,
      spent: items
        .filter(t => !NON_SPENDING.has(t.type))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    }));
  }, [transactions]);

  const rangeLabel =
    datePreset === 'custom' && customStartDate && customEndDate
      ? `${customStartDate} to ${customEndDate}`
      : DATE_LABELS[datePreset];

  const hasActiveFilters =
    filterType !== 'all' ||
    datePreset !== 'all' ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    haptics.light();
    setFilterType('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchQuery('');
  };

  // Grid columns follow the real content width, so cards never stretch oddly
  const contentWidth = Math.min(width, CONTENT_MAX + 32) - 32;
  const cols = contentWidth >= 960 ? 3 : contentWidth >= 660 ? 2 : 1;

  const openAdd = () => {
    haptics.light();
    router.push({
      pathname: '/finance/add',
      params:
        filterType === 'lent' || filterType === 'borrowed'
          ? { type: filterType }
          : {},
    } as any);
  };

  const headerTop =
    Platform.OS === 'web'
      ? 16
      : Math.max(
          insets.top,
          Platform.OS === 'android' ? (StatusBar.currentHeight ?? 38) : 24,
        ) + 10;

  const count = transactions.length;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* ─── Header ─── */}
      <View style={[styles.headerBar, { paddingTop: headerTop }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                haptics.light();
                router.back();
              }}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <AppIcon
                name="arrow-left"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>

            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Transactions
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                {`${count} ${count === 1 ? 'record' : 'records'}, ${rangeLabel}`}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                haptics.light();
                refetch();
              }}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Refresh"
            >
              <AppIcon
                name="refresh-cw"
                size={15}
                color={
                  isRefetching
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
            </Pressable>

            <Pressable
              onPress={openAdd}
              style={({ pressed }) => [
                styles.addBtn,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add transaction"
            >
              <AppIcon name="plus" size={15} color="#FFFFFF" />
              <Text style={styles.addBtnText}>
                {isDesktop ? 'Add transaction' : 'Add'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ─── Body ─── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              haptics.light();
              refetch();
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.mainWrapper}>
          <SummaryStrip
            summary={computedSummary}
            filterType={filterType}
            isDesktop={isDesktop}
          />

          {/* Toolbar: search, type, period */}
          <GlassCard
            style={styles.toolbarCard}
            intensity={theme.isDark ? 15 : 10}
            padding="none"
          >
            <SearchField value={searchQuery} onChangeText={setSearchQuery} />

            <TripTabs<TransactionType>
              tabs={TYPE_TABS}
              activeTab={filterType}
              onChange={setFilterType}
              variant="segmented"
              size="sm"
              scrollable
            />

            <View style={styles.periodRow}>
              <View style={{ flex: 1 }}>
                <TripTabs<DateFilterPreset>
                  tabs={DATE_TABS}
                  activeTab={datePreset}
                  onChange={(id: DateFilterPreset) => {
                    setDatePreset(id);
                    if (id !== 'custom') {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }
                  }}
                  variant="underline"
                  size="sm"
                  scrollable
                />
              </View>
              {hasActiveFilters && (
                <Pressable
                  onPress={resetFilters}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all filters"
                >
                  <Text
                    style={[styles.clearText, { color: theme.colors.primary }]}
                  >
                    Clear
                  </Text>
                </Pressable>
              )}
            </View>

            {datePreset === 'custom' && (
              <View style={styles.customRangeRow}>
                {(['start', 'end'] as const).map((which, i) => {
                  const value =
                    which === 'start' ? customStartDate : customEndDate;
                  return (
                    <React.Fragment key={which}>
                      {i === 1 && (
                        <AppIcon
                          name="arrow-right"
                          size={12}
                          color={theme.colors.textTertiary}
                        />
                      )}
                      <Pressable
                        onPress={() => setShowDatePicker(which)}
                        style={[
                          styles.dateRangeBtn,
                          {
                            backgroundColor: theme.colors.background,
                            borderColor: hairlineFor(theme),
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${which === 'start' ? 'Start' : 'End'} date`}
                      >
                        <AppIcon
                          name="calendar"
                          size={13}
                          color={theme.colors.primary}
                        />
                        <Text
                          style={[
                            styles.dateRangeBtnText,
                            {
                              color: value
                                ? theme.colors.textPrimary
                                : theme.colors.textTertiary,
                            },
                          ]}
                        >
                          {value ||
                            (which === 'start' ? 'Start date' : 'End date')}
                        </Text>
                      </Pressable>
                    </React.Fragment>
                  );
                })}
              </View>
            )}
          </GlassCard>

          {/* Feed */}
          <View style={styles.listSection}>
            {isLoading ? (
              <SkeletonGrid cols={cols} />
            ) : transactions.length === 0 ? (
              <EmptyState
                icon="💳"
                title={
                  hasActiveFilters
                    ? 'No matching transactions'
                    : 'No transactions yet'
                }
                description={
                  hasActiveFilters
                    ? 'Nothing matches these filters. Try a wider period or clear the search.'
                    : 'Add your first expense or income to start building your ledger.'
                }
                actionLabel={
                  hasActiveFilters ? 'Clear filters' : 'Add transaction'
                }
                onAction={hasActiveFilters ? resetFilters : openAdd}
                secondaryActionLabel={
                  hasActiveFilters ? 'Add transaction' : undefined
                }
                onSecondaryAction={hasActiveFilters ? openAdd : undefined}
              />
            ) : (
              <Animated.View
                key={`${filterType}-${datePreset}`}
                entering={FadeIn.duration(160)}
                style={{ gap: 18 }}
              >
                {groups.map(group => (
                  <View key={group.key} style={{ gap: 10 }}>
                    <View style={styles.dayHeader}>
                      <Text
                        style={[
                          styles.dayLabel,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {group.label}
                      </Text>
                      {group.spent > 0 && (
                        <Text
                          style={[
                            styles.daySpent,
                            { color: theme.colors.textTertiary },
                          ]}
                        >
                          {inr(group.spent)} spent
                        </Text>
                      )}
                    </View>

                    <View
                      style={[styles.grid, { marginHorizontal: -GRID_GAP / 2 }]}
                    >
                      {group.items.map((tx, index) => (
                        <View
                          key={tx._id || tx.id || `${group.key}-${index}`}
                          style={{
                            width: `${100 / cols}%`,
                            padding: GRID_GAP / 2,
                          }}
                        >
                          <TransactionCard
                            transaction={{
                              ...tx,
                              currency:
                                tx.currency || tx.localCurrency || 'INR',
                            }}
                            onPress={() => {
                              haptics.light();
                              router.push(
                                `/finance/transaction/${tx._id || tx.id}` as any,
                              );
                            }}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}

            {hasNextPage && !isLoading && (
              <View style={styles.loadMoreWrap}>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    fetchNextPage();
                  }}
                  disabled={isFetchingNextPage}
                  style={({ pressed }) => [
                    styles.loadMoreBtn,
                    { borderColor: hairlineFor(theme) },
                    pressed && { opacity: 0.75 },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.loadMoreText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {isFetchingNextPage
                      ? 'Loading…'
                      : 'Load older transactions'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <CustomDatePickerModal
        visible={!!showDatePicker}
        onClose={() => setShowDatePicker(null)}
        onSelectDate={date => {
          if (!date) return setShowDatePicker(null);
          // Local date, not toISOString(): UTC conversion shifts the day back in IST.
          const formatted = format(new Date(date), 'yyyy-MM-dd');
          if (showDatePicker === 'start') setCustomStartDate(formatted);
          else if (showDatePicker === 'end') setCustomEndDate(formatted);
          setShowDatePicker(null);
        }}
        currentDate={new Date()}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
function createStyles(theme: Theme) {
  const hairline = hairlineFor(theme);

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },

    headerBar: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: hairline,
      zIndex: 10,
    },
    headerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: CONTENT_MAX,
      alignSelf: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flexShrink: 1,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: hairline,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.85)',
    },
    headerTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
    headerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
    },
    addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

    scrollContent: { paddingTop: 16, paddingHorizontal: 16 },
    // +32 = side padding, so the inner width equals the header's width.
    desktopScrollContent: {
      maxWidth: CONTENT_MAX + 32,
      alignSelf: 'center',
      width: '100%',
    },
    mainWrapper: { gap: 16 },

    toolbarCard: {
      borderRadius: 20,
      padding: 12,
      borderWidth: 1,
      borderColor: hairline,
      gap: 12,
    },
    periodRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    clearText: { fontSize: 13, fontWeight: '700' },
    customRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateRangeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 42,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    dateRangeBtnText: { fontSize: 13, fontWeight: '600', flex: 1 },

    listSection: { gap: 10 },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    dayLabel: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
    daySpent: { fontSize: 12, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },

    loadMoreWrap: { paddingVertical: 20, alignItems: 'center' },
    loadMoreBtn: {
      paddingHorizontal: 20,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      borderWidth: 1,
    },
    loadMoreText: { fontSize: 13, fontWeight: '700' },
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
    tile: {
      width: 156,
      minHeight: 96,
      borderRadius: 18,
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
    tileFluid: { flex: 1, width: 'auto', minWidth: 0, minHeight: 104 },
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
    sub: { fontSize: 11, fontWeight: '500' },
  });
}
// // app/(app)/transactions.tsx
// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { View, Text, ScrollView, StyleSheet, Platform, StatusBar, TextInput, Pressable, useWindowDimensions, RefreshControl } from 'react-native';
// import { router, Stack } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import Animated, {
//   FadeInDown,
//   FadeInUp,
//   Layout,
// } from 'react-native-reanimated';
// import { format } from 'date-fns';

// import { useTheme } from '../../../providers/ThemeProvider';
// import { useInfiniteTransactions } from '../../../hooks/useFinance';
// import { haptics } from '../../../utils/haptics';

// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { EmptyState } from '../../../components/ui/EmptyState';
// import AppIcon from '../../../components/common/AppIcon';
// import GlobalLoader from '../../../components/common/GlobalLoader';
// import { CustomDatePickerModal } from '../../../components/common/CustomDatePickerModal';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import type { Theme } from '../../../theme';
// import { TransactionCard } from '../../../components/ui/TransactionCard';

// // ─── Types ───────────────────────────────────────────────────
// type TransactionType = 'all' | 'regular' | 'trip_expense' | 'income' | 'lent' | 'borrowed';
// type DateFilterPreset = 'all' | 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

// interface Transaction {
//   localCurrency?: string;
//   currency?: string;
//   _id: string;
//   id?: string;
//   title: string;
//   type: string;
//   category: string;
//   amount: number;
//   myShare?: number;
//   totalExpenseAmount?: number;
//   date: string;
//   paymentMethod?: string;
//   tripId?: { _id: string; title: string; coverImage?: string };
//   tripName?: string;
//   splitWith?: string[];
//   notes?: string;
//   paidByName?: string;
//   relationshipId?: string;
//   personName?: string;
//   personPhone?: string;
//   personUserId?: string;
// }

// const FILTER_OPTIONS: { id: TransactionType; label: string; icon: string }[] = [
//   { id: 'all', label: 'All', icon: 'layers' },
//   { id: 'regular', label: 'Regular Expenses', icon: 'wallet' },
//   { id: 'trip_expense', label: 'Trip Expenses', icon: 'map' },
//   { id: 'income', label: 'Income', icon: 'arrow-up-right' },
//   { id: 'lent', label: 'Money Lent', icon: 'arrow-up-right' },
//   { id: 'borrowed', label: 'Borrowed', icon: 'arrow-down-left' },
// ];

// const DATE_PRESETS: { key: DateFilterPreset; label: string; icon: string }[] = [
//   { key: 'all', label: 'All Time', icon: 'globe' },
//   { key: 'today', label: 'Today', icon: 'zap' },
//   { key: 'this_week', label: 'This Week', icon: 'calendar' },
//   { key: 'this_month', label: 'This Month', icon: 'activity' },
//   { key: 'this_year', label: 'This Year', icon: 'compass' },
//   { key: 'custom', label: 'Custom Range', icon: 'sliders' },
// ];

// // ─── Helpers ─────────────────────────────────────────────────
// const toISODate = (d: Date) => format(d, 'yyyy-MM-dd');

// function getPresetRange(preset: DateFilterPreset, customStart: string, customEnd: string) {
//   const now = new Date();
//   switch (preset) {
//     case 'today':
//       return { startDate: toISODate(now), endDate: toISODate(now) };
//     case 'this_week': {
//       const start = new Date(now);
//       const day = start.getDay();
//       start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
//       return { startDate: toISODate(start), endDate: toISODate(now) };
//     }
//     case 'this_month': {
//       const start = new Date(now.getFullYear(), now.getMonth(), 1);
//       const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
//       return { startDate: toISODate(start), endDate: toISODate(end) };
//     }
//     case 'this_year': {
//       const start = new Date(now.getFullYear(), 0, 1);
//       const end = new Date(now.getFullYear(), 11, 31);
//       return { startDate: toISODate(start), endDate: toISODate(end) };
//     }
//     case 'custom':
//       return {
//         startDate: customStart || undefined,
//         endDate: customEnd || undefined,
//       };
//     default:
//       return {};
//   }
// }

// // ─── Sub-Components ──────────────────────────────────────────

// function BentoSummaryStrip({ summary, theme, filterType }: { summary: any; theme: Theme; filterType: TransactionType }) {
//   if (!summary) return null;

//   const totalExpense = Number(summary.totalExpense || 0);
//   const totalIncome = Number(summary.totalIncome || 0);
//   const netAmount = Number(summary.netAmount || totalIncome - totalExpense);
//   const totalLent = Number(summary.totalLent || 0);
//   const totalBorrowed = Number(summary.totalBorrowed || 0);
//   const totalRepaid = Number(summary.totalRepaid || 0);
//   const isNetPositive = netAmount >= 0;

//   if (filterType === 'lent') {
//     return (
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.bentoScrollContent}
//         style={styles.bentoScrollWrap}
//       >
//         <GlassCard style={styles.bentoSummaryTile} intensity={theme.isDark ? 15 : 10}>
//           <View style={styles.summaryTopRow}>
//             <View style={[styles.summaryIconWrap, { backgroundColor: '#FEF3C7' }]}>
//               <AppIcon name="arrow-up-right" size={12} color="#F59E0B" />
//             </View>
//             <Text style={[styles.summaryCategoryText, { color: '#F59E0B' }]}>TOTAL LENT</Text>
//           </View>
//           <Text style={[styles.summaryAmountText, { color: '#F59E0B' }]}>
//             ₹{totalLent.toLocaleString('en-IN')}
//           </Text>
//           <Text style={[styles.summarySubText, { color: theme.colors.textTertiary }]}>
//             Money given to contacts
//           </Text>
//         </GlassCard>

//         <GlassCard style={styles.bentoSummaryTile} intensity={theme.isDark ? 15 : 10}>
//           <View style={styles.summaryTopRow}>
//             <View style={[styles.summaryIconWrap, { backgroundColor: '#ECFDF5' }]}>
//               <AppIcon name="check-circle" size={12} color="#10B981" />
//             </View>
//             <Text style={[styles.summaryCategoryText, { color: '#10B981' }]}>REPAID</Text>
//           </View>
//           <Text style={[styles.summaryAmountText, { color: '#10B981' }]}>
//             ₹{totalRepaid.toLocaleString('en-IN')}
//           </Text>
//           <Text style={[styles.summarySubText, { color: theme.colors.textTertiary }]}>
//             Collected back
//           </Text>
//         </GlassCard>

//         <GlassCard style={styles.bentoSummaryTile} intensity={theme.isDark ? 15 : 10}>
//           <View style={styles.summaryTopRow}>
//             <View style={[styles.summaryIconWrap, { backgroundColor: '#EFF6FF' }]}>
//               <AppIcon name="clock" size={12} color="#3B82F6" />
//             </View>
//             <Text style={[styles.summaryCategoryText, { color: '#3B82F6' }]}>OUTSTANDING</Text>
//           </View>
//           <Text style={[styles.summaryAmountText, { color: '#3B82F6' }]}>
//             ₹{Math.max(0, totalLent - totalRepaid).toLocaleString('en-IN')}
//           </Text>
//           <Text style={[styles.summarySubText, { color: theme.colors.textTertiary }]}>
//             Still owed to you
//           </Text>
//         </GlassCard>
//       </ScrollView>
//     );
//   }

//   if (filterType === 'borrowed') {
//     return (
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.bentoScrollContent}
//         style={styles.bentoScrollWrap}
//       >
//         <GlassCard style={styles.bentoSummaryTile} intensity={theme.isDark ? 15 : 10}>
//           <View style={styles.summaryTopRow}>
//             <View style={[styles.summaryIconWrap, { backgroundColor: '#FCE7F3' }]}>
//               <AppIcon name="arrow-down-left" size={12} color="#EC4899" />
//             </View>
//             <Text style={[styles.summaryCategoryText, { color: '#EC4899' }]}>TOTAL BORROWED</Text>
//           </View>
//           <Text style={[styles.summaryAmountText, { color: '#EC4899' }]}>
//             ₹{totalBorrowed.toLocaleString('en-IN')}
//           </Text>
//           <Text style={[styles.summarySubText, { color: theme.colors.textTertiary }]}>
//             Money you took
//           </Text>
//         </GlassCard>

//         <GlassCard style={styles.bentoSummaryTile} intensity={theme.isDark ? 15 : 10}>
//           <View style={styles.summaryTopRow}>
//             <View style={[styles.summaryIconWrap, { backgroundColor: '#ECFDF5' }]}>
//               <AppIcon name="check-circle" size={12} color="#10B981" />
//             </View>
//             <Text style={[styles.summaryCategoryText, { color: '#10B981' }]}>YOU REPAID</Text>
//           </View>
//           <Text style={[styles.summaryAmountText, { color: '#10B981' }]}>
//             ₹{totalRepaid.toLocaleString('en-IN')}
//           </Text>
//           <Text style={[styles.summarySubText, { color: theme.colors.textTertiary }]}>
//             Paid back by you
//           </Text>
//         </GlassCard>

//         <GlassCard style={styles.bentoSummaryTile} intensity={theme.isDark ? 15 : 10}>
//           <View style={styles.summaryTopRow}>
//             <View style={[styles.summaryIconWrap, { backgroundColor: '#FEE2E2' }]}>
//               <AppIcon name="alert-circle" size={12} color="#EF4444" />
//             </View>
//             <Text style={[styles.summaryCategoryText, { color: '#EF4444' }]}>OUTSTANDING</Text>
//           </View>
//           <Text style={[styles.summaryAmountText, { color: '#EF4444' }]}>
//             ₹{Math.max(0, totalBorrowed - totalRepaid).toLocaleString('en-IN')}
//           </Text>
//           <Text style={[styles.summarySubText, { color: theme.colors.textTertiary }]}>
//             Still to pay back
//           </Text>
//         </GlassCard>
//       </ScrollView>
//     );
//   }

//   return (
//     <ScrollView
//       horizontal
//       showsHorizontalScrollIndicator={false}
//       contentContainerStyle={styles.bentoScrollContent}
//       style={styles.bentoScrollWrap}
//     >
//       {/* Total Expenses */}
//       <GlassCard style={styles.bentoSummaryTile} intensity={theme.isDark ? 15 : 10}>
//         <View style={styles.summaryTopRow}>
//           <View style={[styles.summaryIconWrap, { backgroundColor: '#FEE2E2' }]}>
//             <AppIcon name="arrow-down-right" size={12} color="#EF4444" />
//           </View>
//           <Text style={[styles.summaryCategoryText, { color: '#EF4444' }]}>EXPENSES</Text>
//         </View>
//         <Text style={[styles.summaryAmountText, { color: '#EF4444' }]}>
//           ₹{totalExpense.toLocaleString('en-IN')}
//         </Text>
//         <Text style={[styles.summarySubText, { color: theme.colors.textTertiary }]}>
//           Total money out
//         </Text>
//       </GlassCard>

//       {/* Total Income */}
//       <GlassCard style={styles.bentoSummaryTile} intensity={theme.isDark ? 15 : 10}>
//         <View style={styles.summaryTopRow}>
//           <View style={[styles.summaryIconWrap, { backgroundColor: '#ECFDF5' }]}>
//             <AppIcon name="arrow-up-right" size={12} color="#10B981" />
//           </View>
//           <Text style={[styles.summaryCategoryText, { color: '#10B981' }]}>INCOME</Text>
//         </View>
//         <Text style={[styles.summaryAmountText, { color: '#10B981' }]}>
//           ₹{totalIncome.toLocaleString('en-IN')}
//         </Text>
//         <Text style={[styles.summarySubText, { color: theme.colors.textTertiary }]}>
//           Total money in
//         </Text>
//       </GlassCard>

//       {/* Net Balance */}
//       <GlassCard style={styles.bentoSummaryTile} intensity={theme.isDark ? 15 : 10}>
//         <View style={styles.summaryTopRow}>
//           <View
//             style={[
//               styles.summaryIconWrap,
//               { backgroundColor: isNetPositive ? '#ECFDF5' : '#FEF2F2' },
//             ]}
//           >
//             <AppIcon
//               name="activity"
//               size={12}
//               color={isNetPositive ? '#10B981' : '#EF4444'}
//             />
//           </View>
//           <Text
//             style={[
//               styles.summaryCategoryText,
//               { color: isNetPositive ? '#10B981' : '#EF4444' },
//             ]}
//           >
//             NET CASHFLOW
//           </Text>
//         </View>
//         <Text
//           style={[
//             styles.summaryAmountText,
//             { color: isNetPositive ? '#10B981' : '#EF4444' },
//           ]}
//         >
//           {isNetPositive ? '+' : '−'}₹{Math.abs(netAmount).toLocaleString('en-IN')}
//         </Text>
//         <Text style={[styles.summarySubText, { color: theme.colors.textTertiary }]}>
//           {isNetPositive ? 'Positive surplus' : 'Deficit period'}
//         </Text>
//       </GlassCard>
//     </ScrollView>
//   );
// }

// // ─── Main Screen ─────────────────────────────────────────────

// export default function TransactionsScreen() {
//   const theme = useTheme();
//   const { width } = useWindowDimensions();
//   const insets = useSafeAreaInsets();
//   const isDesktop = width >= 860;

//   // Filter states
//   const [filterType, setFilterType] = useState<TransactionType>('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [debouncedSearch, setDebouncedSearch] = useState('');
//   const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
//   const [customStartDate, setCustomStartDate] = useState('');
//   const [customEndDate, setCustomEndDate] = useState('');
//   const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

//   useEffect(() => {
//     const handler = setTimeout(() => setDebouncedSearch(searchQuery), 350);
//     return () => clearTimeout(handler);
//   }, [searchQuery]);

//   const resolvedDateRange = useMemo(
//     () => getPresetRange(datePreset, customStartDate, customEndDate),
//     [datePreset, customStartDate, customEndDate]
//   );

//   const apiFilterType = useMemo(() => {
//     if (filterType === 'regular') return 'regular';
//     if (filterType === 'trip_expense') return 'trip_expense';
//     if (filterType === 'income') return 'income';
//     if (filterType === 'lent') return 'lent';
//     if (filterType === 'borrowed') return 'borrowed';
//     return undefined;
//   }, [filterType]);

//   const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
//     useInfiniteTransactions({
//       type: apiFilterType,
//       search: debouncedSearch || undefined,
//       startDate: resolvedDateRange.startDate,
//       endDate: resolvedDateRange.endDate,
//     } as any);

//   const transactions: Transaction[] = useMemo(() => {
//     const raw = data?.pages.flatMap((page: any) => page?.transactions || []) || [];
//     if (filterType === 'regular') {
//       return raw.filter((t: any) => (t.type === 'expense' || t.type === 'regular') && !t.tripId && !t.tripName);
//     }
//     if (filterType === 'trip_expense') {
//       return raw.filter((t: any) => t.type === 'trip_expense' || Boolean(t.tripId) || Boolean(t.tripName));
//     }
//     if (filterType === 'income') {
//       return raw.filter((t: any) => t.type === 'income' || t.type === 'settlement_received');
//     }
//     if (filterType === 'lent') {
//       return raw.filter((t: any) => t.type === 'lent');
//     }
//     if (filterType === 'borrowed') {
//       return raw.filter((t: any) => t.type === 'borrowed');
//     }
//     return raw;
//   }, [data, filterType]);

//   const rawSummary = data?.pages?.[0]?.summary;

//   const computedSummary = useMemo(() => {
//     if (filterType === 'all') {
//       return rawSummary || { totalExpense: 0, totalIncome: 0, netAmount: 0 };
//     }
//     let exp = 0;
//     let inc = 0;
//     let lent = 0;
//     let borrowed = 0;
//     let repaid = 0;
//     transactions.forEach((t) => {
//       const amt = Number(t.amount || 0);
//       if (t.type === 'income' || t.type === 'settlement_received') {
//         inc += amt;
//       } else if (t.type === 'lent') {
//         lent += amt;
//       } else if (t.type === 'borrowed') {
//         borrowed += amt;
//       } else if (t.type === 'repayment') {
//         repaid += amt;
//       } else {
//         exp += amt;
//       }
//     });
//     return {
//       totalExpense: exp,
//       totalIncome: inc,
//       totalLent: lent,
//       totalBorrowed: borrowed,
//       totalRepaid: repaid,
//       netAmount: inc - exp,
//     };
//   }, [rawSummary, filterType, transactions]);

//   const dateFilterLabel = useMemo(() => {
//     switch (datePreset) {
//       case 'all':
//         return 'All Time';
//       case 'today':
//         return 'Today';
//       case 'this_week':
//         return 'This Week';
//       case 'this_month':
//         return 'This Month';
//       case 'this_year':
//         return 'This Year';
//       case 'custom':
//         return customStartDate && customEndDate ? `${customStartDate} – ${customEndDate}` : 'Custom Range';
//       default:
//         return 'Timeframe';
//     }
//   }, [datePreset, customStartDate, customEndDate]);

//   return (
//     <View style={styles.root}>
//       <Stack.Screen options={{ headerShown: false }} />
//       <View style={StyleSheet.absoluteFill} pointerEvents="none">
//         <GlobalBackground />
//       </View>

//       {/* Sticky Top Header */}
//       <View style={[styles.headerBar, {
//         paddingTop: Platform.OS === 'web'
//           ? 16
//           : Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight ?? 38) : 24) + 10,
//       }]}>
//         <View style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}>
//           <View style={styles.headerLeft}>
//             <Pressable
//               onPress={() => {
//                 haptics.light();
//                 router.back();
//               }}
//               style={({ pressed }) => [
//                 styles.headerBtn,
//                 { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' },
//                 pressed && { opacity: 0.7 },
//               ]}
//               hitSlop={8}
//             >
//               <AppIcon name="arrow-left" size={18} color={theme.colors.textPrimary} />
//             </Pressable>

//             <View>
//               <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
//                 Transaction Ledger
//               </Text>
//               <Text style={[styles.headerSub, { color: theme.colors.textTertiary }]}>
//                 {dateFilterLabel} · {transactions.length} record{transactions.length !== 1 ? 's' : ''}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.headerActions}>
//             <Pressable
//               onPress={() => {
//                 haptics.light();
//                 refetch();
//               }}
//               style={({ pressed }) => [
//                 styles.headerBtn,
//                 { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' },
//                 pressed && { opacity: 0.7 },
//               ]}
//               hitSlop={8}
//             >
//               <AppIcon name="refresh-cw" size={15} color={theme.colors.textSecondary} />
//             </Pressable>

//             <Pressable
//               onPress={() => {
//                 haptics.light();
//                 router.push({
//                   pathname: '/finance/add',
//                   params: (filterType === 'lent' || filterType === 'borrowed') ? { type: filterType } : {}
//                 } as any);
//               }}
//               style={styles.addBtn}
//             >
//               <AppIcon name="plus" size={15} color="#FFFFFF" />
//               <Text style={styles.addBtnText}>Log New</Text>
//             </Pressable>
//           </View>
//         </View>
//       </View>

//       {/* Main Content Body */}
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={[
//           styles.scrollContent,
//           isDesktop && styles.desktopScrollContent,
//           { paddingBottom: insets.bottom + 90 },
//         ]}
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefetching}
//             onRefresh={() => {
//               haptics.light();
//               refetch();
//             }}
//             tintColor={theme.colors.primary}
//             colors={[theme.colors.primary]}
//           />
//         }
//       >
//         <View style={styles.mainWrapper}>
//           {/* ── BENTO SUMMARY METRICS STRIP ── */}
//           <BentoSummaryStrip summary={computedSummary} theme={theme} filterType={filterType} />

//           {/* ── TOOLBAR: SEARCH & CATEGORY FILTER PILLS ── */}
//           <GlassCard style={styles.toolbarCard} intensity={theme.isDark ? 15 : 10}>
//             {/* Search Input */}
//             <View style={[styles.searchRow, { backgroundColor: theme.colors.background }]}>
//               <AppIcon name="search" size={16} color={theme.colors.textTertiary} />
//               <TextInput
//                 style={[styles.searchInput, { color: theme.colors.textPrimary }]}
//                 placeholder="Search description, trip, category..."
//                 placeholderTextColor={theme.colors.textTertiary}
//                 value={searchQuery}
//                 onChangeText={setSearchQuery}
//               />
//               {searchQuery.length > 0 && (
//                 <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
//                   <AppIcon name="x" size={14} color={theme.colors.textTertiary} />
//                 </Pressable>
//               )}
//             </View>

//             {/* Type Filter Pills */}
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={styles.filterPillsScroll}
//             >
//               {FILTER_OPTIONS.map((opt) => {
//                 const isActive = filterType === opt.id;
//                 return (
//                   <Pressable
//                     key={opt.id}
//                     onPress={() => {
//                       haptics.light();
//                       setFilterType(opt.id);
//                     }}
//                     style={[
//                       styles.filterPill,
//                       isActive
//                         ? { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.16)' : theme.colors.primary, borderWidth: 1, borderColor: theme.isDark ? 'rgba(255,255,255,0.22)' : theme.colors.primary }
//                         : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderWidth: 1, borderColor: 'transparent' },
//                     ]}
//                   >
//                     <AppIcon
//                       name={opt.icon as any}
//                       size={12}
//                       color={isActive ? (theme.isDark ? (theme.colors.fontColor || '#FFFFFF') : theme.colors.textInverse) : theme.colors.textSecondary}
//                     />
//                     <Text
//                       style={[
//                         styles.filterPillText,
//                         {
//                           color: isActive ? (theme.isDark ? (theme.colors.fontColor || '#FFFFFF') : theme.colors.textInverse) : theme.colors.textSecondary,
//                           fontWeight: isActive ? '700' : '500',
//                         },
//                       ]}
//                     >
//                       {opt.label}
//                     </Text>
//                   </Pressable>
//                 );
//               })}
//             </ScrollView>

//             {/* Date Preset Pills */}
//             <View style={styles.filterSectionLabel}>
//               <AppIcon name="calendar" size={11} color={theme.colors.textTertiary} />
//               <Text style={[styles.filterSectionLabelText, { color: theme.colors.textTertiary }]}>Timeframe</Text>
//             </View>
//             <ScrollView
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={styles.filterPillsScroll}
//             >
//               {DATE_PRESETS.map((preset) => {
//                 const isActive = datePreset === preset.key;
//                 return (
//                   <Pressable
//                     key={preset.key}
//                     onPress={() => {
//                       haptics.light();
//                       setDatePreset(preset.key);
//                       if (preset.key !== 'custom') {
//                         setCustomStartDate('');
//                         setCustomEndDate('');
//                       }
//                     }}
//                     style={[
//                       styles.filterPill,
//                       isActive
//                         ? { backgroundColor: theme.isDark ? 'rgba(99,102,241,0.9)' : '#6366F1' }
//                         : { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
//                     ]}
//                   >
//                     <AppIcon
//                       name={preset.icon as any}
//                       size={12}
//                       color={isActive ? theme.colors.textInverse : theme.colors.textSecondary}
//                     />
//                     <Text
//                       style={[
//                         styles.filterPillText,
//                         {
//                           color: isActive ? theme.colors.textInverse : theme.colors.textSecondary,
//                           fontWeight: isActive ? '700' : '500',
//                         },
//                       ]}
//                     >
//                       {preset.label}
//                     </Text>
//                   </Pressable>
//                 );
//               })}
//             </ScrollView>

//             {/* Custom Date Range — shown only when 'custom' preset is active */}
//             {datePreset === 'custom' && (
//               <View style={styles.customRangeRow}>
//                 <Pressable
//                   onPress={() => setShowDatePicker('start')}
//                   style={[styles.dateRangeBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.borderLight }]}
//                 >
//                   <AppIcon name="calendar" size={12} color={theme.colors.primary} />
//                   <Text style={[styles.dateRangeBtnText, { color: customStartDate ? theme.colors.textPrimary : theme.colors.textTertiary }]}>
//                     {customStartDate || 'Start date'}
//                   </Text>
//                 </Pressable>
//                 <AppIcon name="arrow-right" size={12} color={theme.colors.textTertiary} />
//                 <Pressable
//                   onPress={() => setShowDatePicker('end')}
//                   style={[styles.dateRangeBtn, { backgroundColor: theme.colors.background, borderColor: theme.colors.borderLight }]}
//                 >
//                   <AppIcon name="calendar" size={12} color={theme.colors.primary} />
//                   <Text style={[styles.dateRangeBtnText, { color: customEndDate ? theme.colors.textPrimary : theme.colors.textTertiary }]}>
//                     {customEndDate || 'End date'}
//                   </Text>
//                 </Pressable>
//               </View>
//             )}
//           </GlassCard>

//           {/* ── TRANSACTIONS FEED USING REUSABLE TRANSACTION CARD ── */}
//           <View style={styles.listSection}>
//             {isLoading ? (
//               <View style={styles.loadingContainer}>
//                 <GlobalLoader variant="inline" size="large" color={theme.colors.primary} />
//                 <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
//                   Fetching transaction records…
//                 </Text>
//               </View>
//             ) : transactions.length === 0 ? (
//               <Animated.View entering={FadeInUp.delay(100).springify()}>
//                 <EmptyState
//                   icon="💳"
//                   title="No Transactions Found"
//                   description="Adjust your search filters or record a new transaction to begin tracking."
//                   actionLabel="Log Transaction"
//                   onAction={() => router.push('/finance/add' as any)}
//                 />
//               </Animated.View>
//             ) : (
//               <View style={styles.cardsGrid}>
//                 {transactions.map((tx, index) => (
//                   <Animated.View
//                     key={tx._id || tx.id || String(index)}
//                     entering={FadeInDown.delay(index * 25).springify().damping(20)}
//                     layout={Layout.springify()}
//                     style={styles.cardCol}
//                   >
//                     <TransactionCard
//                       transaction={{
//                         ...tx,
//                         currency: tx.currency || tx.localCurrency || 'INR',
//                       }}
//                       onPress={() => {
//                         haptics.light();
//                         router.push(`/finance/transaction/${tx._id || tx.id}` as any);
//                       }}
//                     />
//                   </Animated.View>
//                 ))}
//               </View>
//             )}

//             {hasNextPage && (
//               <View style={styles.loadMoreWrap}>
//                 {isFetchingNextPage ? (
//                   <GlobalLoader variant="inline" size="small" color={theme.colors.primary} />
//                 ) : (
//                   <Pressable
//                     onPress={() => {
//                       haptics.light();
//                       fetchNextPage();
//                     }}
//                     style={[styles.loadMoreBtn, { borderColor: theme.colors.borderLight }]}
//                   >
//                     <Text style={[styles.loadMoreText, { color: theme.colors.textPrimary }]}>
//                       Load Older Transactions
//                     </Text>
//                   </Pressable>
//                 )}
//               </View>
//             )}
//           </View>
//         </View>
//       </ScrollView>

//       {/* Date Picker Modal for custom range */}
//       <CustomDatePickerModal
//         visible={!!showDatePicker}
//         onClose={() => setShowDatePicker(null)}
//         onSelectDate={(date) => {
//           if (!date) return setShowDatePicker(null);
//           const formatted = new Date(date).toISOString().split('T')[0];
//           if (showDatePicker === 'start') setCustomStartDate(formatted);
//           else if (showDatePicker === 'end') setCustomEndDate(formatted);
//           setShowDatePicker(null);
//         }}
//         currentDate={new Date()}
//       />
//     </View>
//   );
// }

// // ─── STYLES ──────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   root: { flex: 1, backgroundColor: 'transparent' },
//   loadingContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//     gap: 10,
//   },
//   loadingText: { fontSize: 13, fontWeight: '600' },

//   // Header Bar
//   headerBar: {
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(15,23,42,0.06)',
//     zIndex: 10,
//   },
//   headerInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     width: '100%',
//   },
//   desktopHeaderInner: {
//     maxWidth: 1300,
//     alignSelf: 'center',
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   headerBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(15,23,42,0.06)',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '900',
//     letterSpacing: -0.4,
//   },
//   headerSub: {
//     fontSize: 12,
//     fontWeight: '500',
//     marginTop: 1,
//   },
//   headerActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   addBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#2563EB',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 12,
//   },
//   addBtnText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '800',
//   },

//   // Main Scroll Body
//   scrollContent: {
//     paddingTop: 16,
//     paddingHorizontal: 16,
//   },
//   desktopScrollContent: {
//     maxWidth: 1300,
//     alignSelf: 'center',
//     width: '100%',
//     paddingHorizontal: 24,
//   },
//   mainWrapper: {
//     gap: 16,
//   },

//   // Bento Summary Strip
//   bentoScrollWrap: {
//     marginHorizontal: -16,
//   },
//   bentoScrollContent: {
//     paddingHorizontal: 16,
//     gap: 10,
//     flexDirection: 'row',
//   },
//   bentoSummaryTile: {
//     width: 145,
//     minHeight: 74,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.08)',
//     justifyContent: 'space-between',
//   },
//   summaryTopRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   summaryIconWrap: {
//     width: 22,
//     height: 22,
//     borderRadius: 6,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   summaryCategoryText: {
//     fontSize: 9,
//     fontWeight: '800',
//     letterSpacing: 0.5,
//   },
//   summaryAmountText: {
//     fontSize: 16,
//     fontWeight: '900',
//     letterSpacing: -0.3,
//     marginTop: 4,
//   },
//   summarySubText: {
//     fontSize: 9.5,
//     fontWeight: '500',
//     marginTop: 1,
//   },

//   // Toolbar
//   toolbarCard: {
//     borderRadius: 18,
//     padding: 10,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.08)',
//     gap: 8,
//   },
//   searchRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 12,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 13,
//     fontWeight: '500',
//     padding: 0,
//   },
//   filterPillsScroll: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingVertical: 2,
//   },
//   filterPill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     minHeight: 32,
//   },
//   filterPillText: {
//     fontSize: 11.5,
//     letterSpacing: -0.2,
//   },

//   // Transaction List & Cards
//   listSection: {
//     gap: 10,
//   },
//   cardsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//   },
//   cardCol: {
//     flex: 1,
//     minWidth: Platform.OS === 'web' ? 360 : '100%',
//   },

//   // Load More
//   loadMoreWrap: {
//     paddingVertical: 20,
//     alignItems: 'center',
//   },
//   loadMoreBtn: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 14,
//     borderWidth: 1,
//   },
//   loadMoreText: {
//     fontSize: 13,
//     fontWeight: '700',
//   },

//   // Filter section label
//   filterSectionLabel: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 5,
//     paddingTop: 2,
//     paddingBottom: 0,
//   },
//   filterSectionLabelText: {
//     fontSize: 10,
//     fontWeight: '700',
//     letterSpacing: 0.4,
//     textTransform: 'uppercase',
//   },

//   // Custom date range row
//   customRangeRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     paddingTop: 4,
//   },
//   dateRangeBtn: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 10,
//     borderWidth: 1,
//   },
//   dateRangeBtnText: {
//     fontSize: 12,
//     fontWeight: '600',
//     flex: 1,
//   },
// });
