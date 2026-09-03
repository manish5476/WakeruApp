// app/(app)/transactions.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  Pressable,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import { format } from 'date-fns';

import { useTheme } from '../../../providers/ThemeProvider';
import { useResponsive } from '../../../hooks/useResponsive';
import { useInfiniteTransactions } from '../../../hooks/useFinance';
import { haptics } from '../../../utils/haptics';
import { safeFormatCurrency } from '../../../utils/formatters';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Avatar } from '../../../components/ui/Avatar';
import AppIcon from '../../../components/common/AppIcon';
import GlobalLoader from '../../../components/common/GlobalLoader';
import { CustomDatePickerModal } from '../../../components/common/CustomDatePickerModal';
import type { Theme } from '../../../theme';

// ─── Types ───────────────────────────────────────────────────
type TransactionType = 'all' | 'expense' | 'income' | 'trip_expense';
type DateFilterPreset =
  'all' | 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

interface Transaction {
  localCurrency?: string;
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
}

const WEB = Platform.OS === 'web';

const FILTER_OPTIONS: { id: TransactionType; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'layers' },
  { id: 'expense', label: 'Expenses', icon: 'arrow-down-right' },
  { id: 'income', label: 'Income', icon: 'arrow-up-right' },
  { id: 'trip_expense', label: 'Trip Expenses', icon: 'map' },
];

const CATEGORY_CONFIG: Record<
  string,
  { icon: string; color: string; bg: string; label: string }
> = {
  food: {
    icon: 'utensils',
    color: '#F43F5E',
    bg: '#FFE4E6',
    label: 'Food & Dining',
  },
  transport: {
    icon: 'car',
    color: '#06B6D4',
    bg: '#CFFAFE',
    label: 'Transportation',
  },
  stay: {
    icon: 'hotel',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    label: 'Accommodation',
  },
  accommodation: {
    icon: 'hotel',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    label: 'Accommodation',
  },
  health: {
    icon: 'heart-pulse',
    color: '#EF4444',
    bg: '#FEE2E2',
    label: 'Healthcare',
  },
  shopping: {
    icon: 'shopping-bag',
    color: '#F59E0B',
    bg: '#FEF3C7',
    label: 'Shopping',
  },
  entertainment: {
    icon: 'film',
    color: '#8B5CF6',
    bg: '#EDE9FE',
    label: 'Entertainment',
  },
  activity: {
    icon: 'zap',
    color: '#10B981',
    bg: '#ECFDF5',
    label: 'Activities',
  },
  bills: {
    icon: 'file-text',
    color: '#6366F1',
    bg: '#EEF2FF',
    label: 'Bills & Utilities',
  },
  income: {
    icon: 'dollar-sign',
    color: '#10B981',
    bg: '#ECFDF5',
    label: 'Income',
  },
  other: { icon: 'tag', color: '#71717A', bg: '#F4F4F5', label: 'General' },
};

// ─── Helpers ─────────────────────────────────────────────────
const toISODate = (d: Date) => d.toISOString().split('T')[0];

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
      return { startDate: toISODate(start), endDate: toISODate(now) };
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: toISODate(start), endDate: toISODate(now) };
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

const getCurrencySymbol = (currencyCode?: string) => {
  switch (currencyCode?.toUpperCase()) {
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'INR':
    default:
      return '₹';
  }
};

// ─── Sub-Components ──────────────────────────────────────────

function BentoSummaryStrip({ summary, theme }: { summary: any; theme: Theme }) {
  if (!summary) return null;

  const totalExpense = Number(summary.totalExpense || 0);
  const totalIncome = Number(summary.totalIncome || 0);
  const netAmount = Number(summary.netAmount || totalIncome - totalExpense);
  const isNetPositive = netAmount >= 0;

  return (
    <View style={styles.bentoSummaryRow}>
      {/* Total Expenses */}
      <View
        style={[
          styles.bentoSummaryTile,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.summaryTopRow}>
          <View
            style={[styles.summaryIconWrap, { backgroundColor: '#FEE2E2' }]}
          >
            <AppIcon name="arrow-down-right" size={15} color="#EF4444" />
          </View>
          <Text style={[styles.summaryCategoryText, { color: '#EF4444' }]}>
            EXPENSES
          </Text>
        </View>
        <Text style={[styles.summaryAmountText, { color: '#EF4444' }]}>
          ₹{totalExpense.toLocaleString('en-IN')}
        </Text>
        <Text
          style={[styles.summarySubText, { color: theme.colors.textTertiary }]}
        >
          Total money out
        </Text>
      </View>

      {/* Total Income */}
      <View
        style={[
          styles.bentoSummaryTile,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.summaryTopRow}>
          <View
            style={[styles.summaryIconWrap, { backgroundColor: '#ECFDF5' }]}
          >
            <AppIcon name="arrow-up-right" size={15} color="#10B981" />
          </View>
          <Text style={[styles.summaryCategoryText, { color: '#10B981' }]}>
            INCOME
          </Text>
        </View>
        <Text style={[styles.summaryAmountText, { color: '#10B981' }]}>
          ₹{totalIncome.toLocaleString('en-IN')}
        </Text>
        <Text
          style={[styles.summarySubText, { color: theme.colors.textTertiary }]}
        >
          Total money in
        </Text>
      </View>

      {/* Net Balance */}
      <View
        style={[
          styles.bentoSummaryTile,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.summaryTopRow}>
          <View
            style={[
              styles.summaryIconWrap,
              { backgroundColor: isNetPositive ? '#ECFDF5' : '#FEF2F2' },
            ]}
          >
            <AppIcon
              name="activity"
              size={15}
              color={isNetPositive ? '#10B981' : '#EF4444'}
            />
          </View>
          <Text
            style={[
              styles.summaryCategoryText,
              { color: isNetPositive ? '#10B981' : '#EF4444' },
            ]}
          >
            NET CASHFLOW
          </Text>
        </View>
        <Text
          style={[
            styles.summaryAmountText,
            { color: isNetPositive ? '#10B981' : '#EF4444' },
          ]}
        >
          {isNetPositive ? '+' : '−'}₹
          {Math.abs(netAmount).toLocaleString('en-IN')}
        </Text>
        <Text
          style={[styles.summarySubText, { color: theme.colors.textTertiary }]}
        >
          {isNetPositive ? 'Positive surplus' : 'Deficit this period'}
        </Text>
      </View>
    </View>
  );
}

function TransactionCardItem({ tx }: { tx: Transaction }) {
  const theme = useTheme();

  const isIncome = tx.type === 'income';
  const isTripExpense = tx.type === 'trip_expense';
  const shareAmount = tx.myShare ?? tx.amount;

  const categoryKey =
    tx.type === 'income' ? 'income' : tx.category?.toLowerCase() || 'other';
  const cat = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.other;

  const tripLabel = tx.tripName || tx.tripId?.title || 'General Activity';
  const currencySymbol = getCurrencySymbol(tx.localCurrency);

  let formattedDateStr = '';
  try {
    formattedDateStr = format(new Date(tx.date), 'MMM d, yyyy');
  } catch {
    formattedDateStr = tx.date;
  }

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        router.push(`/finance/transaction/${tx._id || tx.id}` as any);
      }}
      style={({ pressed }) => [
        styles.txCard,
        { backgroundColor: theme.colors.surface },
        isTripExpense && {
          borderColor: theme.isDark
            ? 'rgba(37,99,235,0.3)'
            : 'rgba(37,99,235,0.2)',
        },
        pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
      ]}
    >
      {/* Category Aura */}
      <View
        style={[
          styles.iconAura,
          {
            backgroundColor: theme.isDark ? `${cat.color}18` : cat.bg,
          },
        ]}
      >
        <AppIcon name={cat.icon as any} size={20} color={cat.color} />
      </View>

      {/* Middle Details */}
      <View style={styles.txDetailsWrap}>
        <View style={styles.txTopRow}>
          <Text
            style={[styles.txTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {tx.title || 'Untitled Transaction'}
          </Text>

          <View
            style={[
              styles.txTypeTag,
              {
                backgroundColor: isIncome
                  ? 'rgba(16,185,129,0.12)'
                  : isTripExpense
                    ? 'rgba(37,99,235,0.12)'
                    : 'rgba(113,113,122,0.1)',
              },
            ]}
          >
            <Text
              style={[
                styles.txTypeTagText,
                {
                  color: isIncome
                    ? '#059669'
                    : isTripExpense
                      ? '#2563EB'
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {isIncome
                ? 'INCOME'
                : isTripExpense
                  ? 'TRIP EXPENSE'
                  : 'PERSONAL'}
            </Text>
          </View>
        </View>

        <View style={styles.txSubRow}>
          <Text
            style={[styles.txSubtitle, { color: theme.colors.textTertiary }]}
            numberOfLines={1}
          >
            {tripLabel} · {formattedDateStr}
          </Text>
        </View>
      </View>

      {/* Right Amount & Arrow */}
      <View style={styles.txAmountBlock}>
        <Text
          style={[
            styles.txAmountText,
            { color: isIncome ? '#10B981' : theme.colors.textPrimary },
          ]}
        >
          {isIncome ? '+' : '−'}
          {currencySymbol}
          {shareAmount.toLocaleString('en-IN', {
            minimumFractionDigits: shareAmount % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
          })}
        </Text>

        <View
          style={[
            styles.txActionCircle,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <AppIcon
            name="chevron-right"
            size={14}
            color={theme.colors.textTertiary}
          />
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────

export default function TransactionsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 860;

  // Filter states
  const [filterType, setFilterType] = useState<TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(
    null,
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const resolvedDateRange = useMemo(
    () => getPresetRange(datePreset, customStartDate, customEndDate),
    [datePreset, customStartDate, customEndDate],
  );

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions({
    type: filterType === 'all' ? undefined : (filterType as any),
    search: debouncedSearch || undefined,
    startDate: resolvedDateRange.startDate,
    endDate: resolvedDateRange.endDate,
  } as any);

  const transactions: Transaction[] = useMemo(
    () => data?.pages.flatMap((page: any) => page?.transactions || []) || [],
    [data],
  );
  const summary = data?.pages?.[0]?.summary;

  const dateFilterLabel = useMemo(() => {
    switch (datePreset) {
      case 'all':
        return 'All Time';
      case 'today':
        return 'Today';
      case 'this_week':
        return 'This Week';
      case 'this_month':
        return 'This Month';
      case 'this_year':
        return 'This Year';
      case 'custom':
        return customStartDate && customEndDate
          ? `${customStartDate} – ${customEndDate}`
          : 'Custom Range';
      default:
        return 'Timeframe';
    }
  }, [datePreset, customStartDate, customEndDate]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Sticky Top Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10 },
        ]}
      >
        <View
          style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}
        >
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                haptics.light();
                router.back();
              }}
              style={({ pressed }) => [
                styles.headerBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
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
                Transaction Ledger
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                {dateFilterLabel} · {transactions.length} record
                {transactions.length !== 1 ? 's' : ''}
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
                styles.headerBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="refresh-cw"
                size={15}
                color={theme.colors.textSecondary}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.light();
                router.push('/finance/add' as any);
              }}
              style={styles.addBtn}
            >
              <AppIcon name="plus" size={15} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Log New</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Content Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
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
          {/* ── BENTO SUMMARY METRICS STRIP ── */}
          <BentoSummaryStrip summary={summary} theme={theme} />

          {/* ── TOOLBAR: SEARCH & CATEGORY FILTER PILLS ── */}
          <View
            style={[
              styles.toolbarCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {/* Search Input */}
            <View
              style={[
                styles.searchRow,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <AppIcon
                name="search"
                size={16}
                color={theme.colors.textTertiary}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: theme.colors.textPrimary },
                ]}
                placeholder="Search description, trip, category..."
                placeholderTextColor={theme.colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <AppIcon
                    name="x"
                    size={14}
                    color={theme.colors.textTertiary}
                  />
                </Pressable>
              )}
            </View>

            {/* Type Filter Pills */}
            <View style={styles.filterPillsRow}>
              {FILTER_OPTIONS.map(opt => {
                const isActive = filterType === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      haptics.light();
                      setFilterType(opt.id);
                    }}
                    style={[
                      styles.filterPill,
                      isActive
                        ? { backgroundColor: theme.colors.primary }
                        : { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <AppIcon
                      name={opt.icon as any}
                      size={12}
                      color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: isActive
                            ? '#FFFFFF'
                            : theme.colors.textSecondary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── TRANSACTIONS FEED ── */}
          <View style={styles.listSection}>
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
                  Fetching transaction records…
                </Text>
              </View>
            ) : transactions.length === 0 ? (
              <Animated.View entering={FadeInUp.delay(100).springify()}>
                <EmptyState
                  icon="💳"
                  title="No Transactions Found"
                  description="Adjust your search filters or record a new transaction to begin tracking."
                  actionLabel="Log Transaction"
                  onAction={() => router.push('/finance/add' as any)}
                />
              </Animated.View>
            ) : (
              <View style={styles.cardsGrid}>
                {transactions.map((tx, index) => (
                  <Animated.View
                    key={tx._id || tx.id || String(index)}
                    entering={FadeInDown.delay(index * 25)
                      .springify()
                      .damping(20)}
                    layout={Layout.springify()}
                    style={styles.cardCol}
                  >
                    <TransactionCardItem tx={tx} />
                  </Animated.View>
                ))}
              </View>
            )}

            {hasNextPage && (
              <View style={styles.loadMoreWrap}>
                {isFetchingNextPage ? (
                  <GlobalLoader
                    variant="inline"
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : (
                  <Pressable
                    onPress={() => {
                      haptics.light();
                      fetchNextPage();
                    }}
                    style={[
                      styles.loadMoreBtn,
                      { borderColor: theme.colors.borderLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.loadMoreText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Load Older Transactions
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal for custom range */}
      <CustomDatePickerModal
        visible={!!showDatePicker}
        onClose={() => setShowDatePicker(null)}
        onSelectDate={date => {
          if (!date) return setShowDatePicker(null);
          const formatted = new Date(date).toISOString().split('T')[0];
          if (showDatePicker === 'start') setCustomStartDate(formatted);
          else if (showDatePicker === 'end') setCustomEndDate(formatted);
          setShowDatePicker(null);
        }}
        currentDate={new Date()}
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  loadingText: { fontSize: 13, fontWeight: '600' },

  // Header Bar
  headerBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,42,0.06)',
    zIndex: 10,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  desktopHeaderInner: {
    maxWidth: 1300,
    alignSelf: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Main Scroll Body
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  desktopScrollContent: {
    maxWidth: 1300,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  mainWrapper: {
    gap: 16,
  },

  // Bento Summary Strip
  bentoSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bentoSummaryTile: {
    flex: 1,
    minWidth: 150,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',

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
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCategoryText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  summaryAmountText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  summarySubText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },

  // Toolbar
  toolbarCard: {
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
    gap: 10,

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
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    padding: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterPillText: {
    fontSize: 11,
  },

  // Transaction List & Cards
  listSection: {
    gap: 10,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardCol: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 360 : '100%',
  },

  // Transaction Card
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',

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

    gap: 12,
  },
  iconAura: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txDetailsWrap: {
    flex: 1,
    gap: 3,
  },
  txTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  txTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txTypeTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  txSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  txAmountBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmountText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  txActionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Load More
  loadMoreWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
// // app/(app)/transactions.tsx
// import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import {
//   View,
//   ScrollView,
//   StyleSheet,
//   Platform,
//   TextInput,
//   Modal,
//   Pressable,
// } from 'react-native';
// import { router, Stack } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import Animated, {
//   FadeInDown,
//   FadeInUp,
//   Layout,
// } from 'react-native-reanimated';
// import { LinearGradient } from 'expo-linear-gradient';

// import { useTheme } from '../../../providers/ThemeProvider';
// import { useResponsive } from '../../../hooks/useResponsive';
// import { useInfiniteTransactions } from '../../../hooks/useFinance';
// import { haptics } from '../../../utils/haptics';

// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { Typography } from '../../../components/ui/Typography';
// import { Badge } from '../../../components/ui/Badge';
// import { Button } from '../../../components/ui/Button';
// import { InteractiveWrapper } from '../../../components/ui/InteractiveWrapper';
// import { Container } from '../../../components/ui/Container';
// import { Grid } from '../../../components/ui/Grid';
// import { EmptyState } from '../../../components/ui/EmptyState';
// import { AmountDisplay } from '../../../components/ui/AmountDisplay';
// import { Avatar } from '../../../components/ui/Avatar';
// import { IconButton } from '../../../components/ui/IconButton';
// import AppIcon from '../../../components/common/AppIcon';
// import GlobalLoader from '../../../components/common/GlobalLoader';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import { CustomDatePickerModal } from '../../../components/common/CustomDatePickerModal';

// // ─── Types ───────────────────────────────────────────────────
// type TransactionType = 'all' | 'expense' | 'income' | 'trip_expense';
// type DateFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

// interface Transaction {
//   localCurrency: string;
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
// }

// // ─── Constants ───────────────────────────────────────────────
// const WEB = Platform.OS === 'web';

// const MONTHS = [
//   { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' },
//   { value: '3', label: 'Mar' }, { value: '4', label: 'Apr' },
//   { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
//   { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' },
//   { value: '9', label: 'Sep' }, { value: '10', label: 'Oct' },
//   { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
// ];

// const getYearOptions = () => {
//   const currentYear = new Date().getFullYear();
//   return Array.from({ length: 11 }, (_, i) => ({
//     value: String(currentYear - 10 + i),
//     label: String(currentYear - 10 + i),
//   }));
// };

// const FILTER_OPTIONS: { id: TransactionType; label: string }[] = [
//   { id: 'all', label: 'All' },
//   { id: 'expense', label: 'Expenses' },
//   { id: 'income', label: 'Income' },
//   { id: 'trip_expense', label: 'Trip Expenses' },
// ];

// // ─── Helpers ─────────────────────────────────────────────────
// const formatDate = (dateString: string) => {
//   const date = new Date(dateString);
//   const now = new Date();
//   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   const yesterday = new Date(today);
//   yesterday.setDate(yesterday.getDate() - 1);

//   if (date >= today) return 'Today';
//   if (date >= yesterday) return 'Yesterday';
//   return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
// };

// const formatTime = (dateString: string) =>
//   new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

// const getCurrencySymbol = (currencyCode: string | undefined) => {
//   switch (currencyCode?.toUpperCase()) {
//     case 'INR': return '₹';
//     case 'USD': return '$';
//     case 'EUR': return '€';
//     case 'GBP': return '£';
//     default: return currencyCode || '₹';
//   }
// };

// // ─── Tab Bar Filter ──────────────────────────────────────────

// function FilterTabBar({ selectedId, onSelect }: { selectedId: TransactionType; onSelect: (id: TransactionType) => void; }) {
//   const theme = useTheme();

//   return (
//     <LinearGradient
//       colors={theme.gradients.glassWipe}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={[styles.segmentedControl, { borderColor: theme.colors.borderLight }]}
//     >
//       {FILTER_OPTIONS.map((option) => {
//         const isActive = selectedId === option.id;
//         return (
//           <InteractiveWrapper
//             key={option.id}
//             onPress={() => {
//               haptics.light();
//               onSelect(option.id);
//             }}
//             style={{ flex: 1 }}
//           >
//             <View
//               style={[
//                 styles.segmentItem,
//                 isActive && { backgroundColor: theme.colors.primaryBg, borderRadius: theme.borderRadius.md },
//               ]}
//             >
//               <Typography
//                 variant="caption"
//                 weight={isActive ? 'bold' : 'medium'}
//                 color={isActive ? 'primary' : 'textSecondary'}
//                 align="center"
//               >
//                 {option.label}
//               </Typography>
//             </View>
//           </InteractiveWrapper>
//         );
//       })}
//     </LinearGradient>
//   );
// }

// // ─── Filter Modal ────────────────────────────────────────────

// function FilterModal({
//   visible, onClose, selectedDateFilter, setSelectedDateFilter,
//   selectedMonth, setSelectedMonth, selectedYear, setSelectedYear,
//   customStartDate, customEndDate, onShowDatePicker
// }: {
//   visible: boolean; onClose: () => void;
//   selectedDateFilter: DateFilter; setSelectedDateFilter: (v: DateFilter) => void;
//   selectedMonth: string; setSelectedMonth: (v: string) => void;
//   selectedYear: string; setSelectedYear: (v: string) => void;
//   customStartDate: string; customEndDate: string;
//   onShowDatePicker: (type: 'start' | 'end') => void;
// }) {
//   const theme = useTheme();

//   if (!visible) return null;

//   const DATE_FILTERS: { id: DateFilter; label: string }[] = [
//     { id: 'today', label: 'Today' }, { id: 'week', label: 'This Week' },
//     { id: 'month', label: 'This Month' }, { id: 'year', label: 'This Year' },
//     { id: 'custom', label: 'Custom' },
//   ];

//   return (
//     <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
//       <Pressable style={styles.modalOverlay} onPress={onClose}>
//         <Pressable>
//           <Animated.View entering={FadeInUp.springify().damping(20)} style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.borderRadius['3xl'], borderTopRightRadius: theme.borderRadius['3xl'] }]}>
//             <View style={styles.modalHandleContainer}>
//               <View style={[styles.modalHandle, { backgroundColor: theme.colors.borderStrong }]} />
//             </View>
//             <View style={styles.modalHeader}>
//               <Typography variant="h3" weight="bold" color="textPrimary">Date Filter</Typography>
//               <IconButton icon={<AppIcon name="x" size={20} color={theme.colors.textPrimary} />} size="sm" variant="ghost" onPress={onClose} />
//             </View>
//             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.xl, paddingBottom: theme.spacing.xl }}>

//               <View style={{ gap: theme.spacing.sm }}>
//                 <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Select</Typography>
//                 <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
//                   {DATE_FILTERS.map((filter) => {
//                     const isActive = selectedDateFilter === filter.id;
//                     return (
//                       <InteractiveWrapper key={filter.id} onPress={() => { haptics.light(); setSelectedDateFilter(filter.id); }}>
//                         <View style={[styles.pillChip, { backgroundColor: isActive ? theme.colors.primary : theme.colors.primaryBg, borderWidth: 1, borderColor: isActive ? theme.colors.primary : theme.colors.borderLight, borderRadius: theme.borderRadius.full }]}>
//                           <Typography variant="caption" weight="semibold" color={isActive ? 'textInverse' : 'textSecondary'}>{filter.label}</Typography>
//                         </View>
//                       </InteractiveWrapper>
//                     );
//                   })}
//                 </View>
//               </View>

//               {(selectedDateFilter === 'month' || selectedDateFilter === 'year') && (
//                 <View style={{ gap: theme.spacing.lg }}>
//                   {selectedDateFilter === 'month' && (
//                     <View style={{ gap: theme.spacing.sm }}>
//                       <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Month</Typography>
//                       <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
//                         {MONTHS.map((month) => {
//                           const isActive = selectedMonth === month.value;
//                           return (
//                             <InteractiveWrapper key={month.value} onPress={() => { haptics.light(); setSelectedMonth(month.value); }}>
//                               <View style={[styles.pillChip, { backgroundColor: isActive ? theme.colors.primary : theme.colors.primaryBg, borderWidth: 1, borderColor: isActive ? theme.colors.primary : theme.colors.borderLight, borderRadius: theme.borderRadius.full }]}>
//                                 <Typography variant="caption" weight="semibold" color={isActive ? 'textInverse' : 'textSecondary'}>{month.label}</Typography>
//                               </View>
//                             </InteractiveWrapper>
//                           );
//                         })}
//                       </View>
//                     </View>
//                   )}
//                   <View style={{ gap: theme.spacing.sm }}>
//                     <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Year</Typography>
//                     <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
//                       {getYearOptions().map((year) => {
//                         const isActive = selectedYear === year.value;
//                         return (
//                           <InteractiveWrapper key={year.value} onPress={() => { haptics.light(); setSelectedYear(year.value); }}>
//                             <View style={[styles.pillChip, { backgroundColor: isActive ? theme.colors.primary : theme.colors.primaryBg, borderWidth: 1, borderColor: isActive ? theme.colors.primary : theme.colors.borderLight, borderRadius: theme.borderRadius.full }]}>
//                               <Typography variant="caption" weight="semibold" color={isActive ? 'textInverse' : 'textSecondary'}>{year.label}</Typography>
//                             </View>
//                           </InteractiveWrapper>
//                         );
//                       })}
//                     </View>
//                   </View>
//                 </View>
//               )}

//               {selectedDateFilter === 'custom' && (
//                 <View style={{ gap: theme.spacing.md }}>
//                   <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Custom Range</Typography>
//                   <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
//                     <View style={{ flex: 1, gap: theme.spacing.xs }}>
//                       <Typography variant="caption" color="textTertiary">Start Date</Typography>
//                       <Pressable onPress={() => onShowDatePicker('start')}>
//                         <View style={[styles.dateInput, { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.borderLight, borderRadius: theme.borderRadius.lg }]}>
//                           <Typography style={{ fontSize: 14, fontWeight: '500' }} color={customStartDate ? 'textPrimary' : 'textTertiary'}>{customStartDate || 'YYYY-MM-DD'}</Typography>
//                         </View>
//                       </Pressable>
//                     </View>
//                     <View style={{ flex: 1, gap: theme.spacing.xs }}>
//                       <Typography variant="caption" color="textTertiary">End Date</Typography>
//                       <Pressable onPress={() => onShowDatePicker('end')}>
//                         <View style={[styles.dateInput, { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.borderLight, borderRadius: theme.borderRadius.lg }]}>
//                           <Typography style={{ fontSize: 14, fontWeight: '500' }} color={customEndDate ? 'textPrimary' : 'textTertiary'}>{customEndDate || 'YYYY-MM-DD'}</Typography>
//                         </View>
//                       </Pressable>
//                     </View>
//                   </View>
//                 </View>
//               )}

//               <Button title="Apply Filters" variant="primary" size="lg" fullWidth onPress={() => { haptics.medium(); onClose(); }} />
//             </ScrollView>
//           </Animated.View>
//         </Pressable>
//       </Pressable>
//     </Modal>
//   );
// }

// // ─── Summary Section ─────────────────────────────────────────

// function SummarySection({ summary }: { summary: any }) {
//   const theme = useTheme();
//   const { isMobile, width } = useResponsive();

//   if (!summary) return null;

//   const cards = [
//     { title: 'Expenses', amount: summary.totalExpense || 0, currency: 'INR', variant: 'danger' as const, icon: 'arrow-down' },
//     { title: 'Income', amount: summary.totalIncome || 0, currency: 'INR', variant: 'success' as const, icon: 'arrow-up' },
//     { title: 'Net Balance', amount: Math.abs(summary.netAmount || 0), currency: 'INR', variant: (summary.netAmount || 0) >= 0 ? ('success' as const) : ('danger' as const), icon: 'activity', showSign: true, isPositive: (summary.netAmount || 0) >= 0 },
//   ];

//   return (
//     <View style={{ paddingTop: theme.spacing.lg }}>
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}
//         snapToInterval={isMobile ? (width * 0.75) + theme.spacing.md : undefined}
//         decelerationRate="fast"
//       >
//         {cards.map((card, index) => (
//           <Animated.View key={card.title} entering={FadeInDown.delay(index * 100).springify().damping(18)} style={{ width: isMobile ? width * 0.75 : 300 }}>
//             <LinearGradient
//               colors={theme.gradients.glassWipe}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={[
//                 styles.glassCard,
//                 theme.shadows.sm,
//                 { borderColor: theme.colors.borderLight, borderRadius: theme.borderRadius.xl, height: '100%' }
//               ]}
//             >
//               <View style={{ gap: theme.spacing.sm }}>
//                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
//                   <View style={[styles.iconCircle, { backgroundColor: theme.colors[`${card.variant}Bg`] || theme.colors.primaryBg }]}>
//                     <AppIcon name={card.icon as any} size={16} color={theme.colors[card.variant]} />
//                   </View>
//                   <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     {card.title}
//                   </Typography>
//                 </View>
//                 <AmountDisplay amount={card.amount} currency={card.currency} size="xl" variant={card.variant === 'danger' ? 'negative' : card.variant === 'success' ? 'positive' : 'default'} showSign={card.showSign} />
//                 {card.title === 'Net Balance' && (
//                   <Typography variant="caption" color={card.isPositive ? 'success' : 'danger'}>
//                     {card.isPositive ? "You're in the green" : "You're in the red"}
//                   </Typography>
//                 )}
//               </View>
//             </LinearGradient>
//           </Animated.View>
//         ))}
//       </ScrollView>
//     </View>
//   );
// }

// // ─── Transaction Card ────────────────────────────────────────

// function TransactionCard({ tx, numColumns }: { tx: Transaction; numColumns: number; }) {
//   const theme = useTheme();

//   const categoryMeta = useMemo(() => {
//     const meta: Record<string, { icon: string; color: string; bg: string }> = {
//       food: { icon: 'coffee', color: theme.colors.warningDark, bg: theme.colors.warningBg },
//       transport: { icon: 'truck', color: theme.colors.infoDark, bg: theme.colors.infoBg },
//       stay: { icon: 'home', color: theme.colors.purple, bg: theme.colors.secondaryBg },
//       health: { icon: 'heart', color: theme.colors.dangerDark, bg: theme.colors.dangerBg },
//       shopping: { icon: 'shopping-bag', color: theme.colors.successDark, bg: theme.colors.successBg },
//       entertainment: { icon: 'film', color: theme.colors.dangerDark, bg: theme.colors.dangerBg },
//       activity: { icon: 'activity', color: theme.colors.infoDark, bg: theme.colors.infoBg },
//       other: { icon: 'file-text', color: theme.colors.textSecondary, bg: theme.colors.neutralBg },
//     };
//     return meta[tx.category?.toLowerCase()] || meta.other;
//   }, [tx.category, theme]);

//   const isExpense = tx.type === 'expense' || tx.type === 'trip_expense';
//   const isTripExpense = tx.type === 'trip_expense';
//   const shareAmount = tx.myShare ?? tx.amount;

//   const locationOrTrip = tx.tripName || tx.category || 'General';
//   const paidByText = tx.splitWith && tx.splitWith.length > 0 ? 'Paid by You' : 'Direct';
//   const subtitleText = `${locationOrTrip} • ${paidByText}`;

//   return (
//     <InteractiveWrapper onPress={() => { haptics.light(); router.push(`/finance/transaction/${tx._id || tx.id}`); }} style={{ width: '100%' }}>
//       <LinearGradient
//         colors={theme.gradients.glassWipe}
//         start={{ x: 0, y: 0.5 }}
//         end={{ x: 1, y: 0.5 }}
//         style={[
//           styles.glassCard,
//           theme.shadows.sm,
//           {
//             // Differentiating trip expenses with a highlight border
//             borderColor: isTripExpense ? theme.colors.primary : theme.colors.borderLight,
//             borderWidth: isTripExpense ? 2 : 1,
//             borderRadius: theme.borderRadius.xl
//           }
//         ]}
//       >
//         <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>

//           {/* Left Large Icon Container */}
//           {isTripExpense && tx.tripId?.coverImage ? (
//             <View style={[styles.largeIconSquare, { backgroundColor: theme.colors.neutralBg }]}>
//               <Avatar url={tx.tripId.coverImage} size="lg" fallback={tx.tripId.title?.charAt(0) || 'T'} />
//             </View>
//           ) : (
//             <View style={[styles.largeIconSquare, { backgroundColor: categoryMeta.bg }]}>
//               <AppIcon name={categoryMeta.icon as any} size={32} color={categoryMeta.color} />
//             </View>
//           )}

//           {/* Right Content Column */}
//           <View style={{ flex: 1, justifyContent: 'space-between' }}>

//             <View>
//               {/* Title & Badge Row */}
//               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//                 <Typography variant="body" weight="bold" color="textPrimary" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
//                   {tx.title || 'Untitled'}
//                 </Typography>

//                 {/* Status/Split Pill */}
//                 <View style={[styles.pillBadge, { backgroundColor: theme.colors.warningBg }]}>
//                   <Typography variant="caption" weight="bold" style={{ color: theme.colors.warningDark, fontSize: 10 }}>
//                     {tx.splitWith && tx.splitWith.length > 0 ? `1/${tx.splitWith.length + 1} Paid` : (isExpense ? 'Expense' : 'Income')}
//                   </Typography>
//                 </View>
//               </View>

//               {/* Subtitle Row */}
//               <Typography variant="caption" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>
//                 {subtitleText}
//               </Typography>
//             </View>

//             {/* Amount & Action Button Row */}
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
//               <Typography variant="h3" weight="bold" style={{ color: theme.colors.foreign }}>
//                 {getCurrencySymbol(tx.localCurrency)}{shareAmount.toFixed(2)}
//               </Typography>

//               <View style={[styles.circularActionBtn, { backgroundColor: theme.colors.foreign }]}>
//                 <AppIcon name="arrow-right" size={16} color="#FFF" />
//               </View>
//             </View>

//           </View>

//         </View>
//       </LinearGradient>
//     </InteractiveWrapper>
//   );
// }

// // ─── Main Screen ─────────────────────────────────────────────

// export default function TransactionsScreen() {
//   const theme = useTheme();
//   const { isMobile, width } = useResponsive();
//   const insets = useSafeAreaInsets();

//   // Filter states
//   const [filterType, setFilterType] = useState<TransactionType>('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [debouncedSearch, setDebouncedSearch] = useState('');
//   const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('month');
//   const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
//   const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
//   const [customStartDate, setCustomStartDate] = useState('');
//   const [customEndDate, setCustomEndDate] = useState('');
//   const [showFilterModal, setShowFilterModal] = useState(false);
//   const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

//   useEffect(() => {
//     const handler = setTimeout(() => setDebouncedSearch(searchQuery), 400);
//     return () => clearTimeout(handler);
//   }, [searchQuery]);

//   const getDateFilters = useCallback(() => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = now.getMonth();
//     const day = now.getDate();

//     switch (selectedDateFilter) {
//       case 'today':
//         return { startDate: new Date(year, month, day).toISOString().split('T')[0], endDate: new Date(year, month, day).toISOString().split('T')[0] };
//       case 'week': {
//         const startOfWeek = new Date(year, month, day - now.getDay());
//         const endOfWeek = new Date(year, month, day - now.getDay() + 6);
//         return { startDate: startOfWeek.toISOString().split('T')[0], endDate: endOfWeek.toISOString().split('T')[0] };
//       }
//       case 'month': return { month: selectedMonth, year: parseInt(selectedYear) };
//       case 'year': return { year: parseInt(selectedYear) };
//       case 'custom': return { startDate: customStartDate || undefined, endDate: customEndDate || undefined };
//       default: return { month: selectedMonth, year: parseInt(selectedYear) };
//     }
//   }, [selectedDateFilter, selectedMonth, selectedYear, customStartDate, customEndDate]);

//   const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteTransactions({
//     type: filterType === 'all' ? undefined : (filterType as any),
//     search: debouncedSearch || undefined,
//     ...getDateFilters(),
//   });

//   const transactions: Transaction[] = useMemo(() => data?.pages.flatMap((page: any) => page?.transactions || []) || [], [data]);
//   const summary = data?.pages?.[0]?.summary;

//   let numColumns = 1;
//   if (WEB) {
//     if (width >= 1400) numColumns = 4;
//     else if (width >= 1100) numColumns = 3;
//     else if (width >= 768) numColumns = 2;
//   }

//   const activeFilterLabel = selectedDateFilter === 'month'
//     ? `${MONTHS.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`
//     : selectedDateFilter === 'year'
//     ? selectedYear
//     : selectedDateFilter === 'custom'
//     ? `${customStartDate || '...'} – ${customEndDate || '...'}`
//     : selectedDateFilter.charAt(0).toUpperCase() + selectedDateFilter.slice(1);

//   return (
//     <View style={styles.root}>
//       <Stack.Screen options={{ headerShown: false }} />
//       <View style={StyleSheet.absoluteFill} pointerEvents="none">
//         <GlobalBackground />
//       </View>

//       {/* Floating Curved Glass Header */}
//       <View style={[
//         styles.floatingHeaderContainer,
//         { paddingTop: Platform.OS === 'web' ? theme.spacing.md : insets.top + theme.spacing.xs }
//       ]}>
//         <GlassCard
//           variant="prominent"
//           intensity={theme.isDark ? 25 : 18}
//           style={styles.floatingHeaderCard}
//         >
//           <View style={styles.headerInner}>
//             <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
//               <InteractiveWrapper onPress={() => { haptics.light(); router.back(); }}>
//                 <View style={[styles.headerIconBtn, { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.borderLight }]}>
//                   <AppIcon name="arrow-left" size={18} color={theme.colors.textPrimary} />
//                 </View>
//               </InteractiveWrapper>
//               <View>
//                 <Typography variant="h2" weight="bold" color="textPrimary" style={{ fontSize: 20, letterSpacing: -0.5 }}>
//                   Transactions
//                 </Typography>
//                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
//                   <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary }} />
//                   <Typography variant="caption" weight="medium" color="textSecondary" style={{ fontSize: 11 }}>
//                     {activeFilterLabel}
//                   </Typography>
//                 </View>
//               </View>
//             </View>

//             <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
//               <InteractiveWrapper onPress={() => { haptics.light(); setShowFilterModal(true); }}>
//                 <View style={[styles.headerIconBtn, { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.borderLight }]}>
//                   <AppIcon name="calendar" size={18} color={theme.colors.textPrimary} />
//                 </View>
//               </InteractiveWrapper>
//               <InteractiveWrapper onPress={() => { haptics.light(); router.push('/finance/add'); }}>
//                 <View style={[styles.headerIconBtn, { backgroundColor: theme.colors.primary, borderColor: 'transparent' }]}>
//                   <AppIcon name="plus" size={18} color="#FFF" />
//                 </View>
//               </InteractiveWrapper>
//             </View>
//           </View>
//         </GlassCard>
//       </View>

//       <Container maxWidth={WEB ? 1400 : undefined} style={{ flex: 1 }}>
//         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + theme.spacing['5xl'] }}>

//           <SummarySection summary={summary} />

//           <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl, gap: theme.spacing.md }}>
//             <LinearGradient
//               colors={theme.gradients.glassWipe}
//               start={{ x: 0, y: 0.5 }}
//               end={{ x: 1, y: 0.5 }}
//               style={[styles.searchWrapper, { borderColor: theme.colors.borderLight }]}
//             >
//               <AppIcon name="search" size={18} color={theme.colors.textTertiary} style={{ marginRight: 8 }} />
//               <TextInput
//                 style={[styles.searchInput, { color: theme.colors.textPrimary }]}
//                 placeholder="Search transactions..."
//                 placeholderTextColor={theme.colors.textTertiary}
//                 value={searchQuery}
//                 onChangeText={setSearchQuery}
//               />
//             </LinearGradient>
//             <FilterTabBar selectedId={filterType} onSelect={setFilterType} />
//           </View>

//           <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xl }}>
//             {isLoading ? (
//               <View style={styles.loadingContainer}>
//                 <GlobalLoader variant="inline" size="large" color={theme.colors.primary} />
//               </View>
//             ) : transactions.length === 0 ? (
//               <Animated.View entering={FadeInUp.delay(200).springify()}>
//                 <EmptyState icon="📋" title="No Transactions Found" description="Try adjusting your filters or create your first transaction to start tracking." actionLabel="Add Transaction" onAction={() => router.push('/finance/add')} />
//               </Animated.View>
//             ) : WEB && numColumns > 1 ? (
//               <>
//                 <Grid cols={numColumns} gap={theme.spacing.md}>
//                   {transactions.map((tx, index) => (
//                     <Animated.View key={tx._id || tx.id} entering={FadeInDown.delay(index * 40).springify().damping(20)} layout={Layout.springify()} style={{ minWidth: 0 }}>
//                       <TransactionCard tx={tx} numColumns={numColumns} />
//                     </Animated.View>
//                   ))}
//                 </Grid>
//                 {hasNextPage && (
//                   <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
//                     {isFetchingNextPage ? <GlobalLoader variant="inline" size="small" color={theme.colors.primary} /> : <Button title="Load More" variant="outline" size="md" onPress={() => fetchNextPage()} />}
//                   </View>
//                 )}
//               </>
//             ) : (
//               <View style={{ gap: theme.spacing.md }}>
//                 {transactions.map((tx, index) => (
//                   <Animated.View key={tx._id || tx.id} entering={FadeInDown.delay(index * 40).springify().damping(20)} layout={Layout.springify()}>
//                     <TransactionCard tx={tx} numColumns={1} />
//                   </Animated.View>
//                 ))}
//                 {hasNextPage && (
//                   <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
//                     {isFetchingNextPage ? <GlobalLoader variant="inline" size="small" color={theme.colors.primary} /> : <Button title="Load More" variant="outline" size="md" onPress={() => fetchNextPage()} />}
//                   </View>
//                 )}
//               </View>
//             )}
//           </View>
//         </ScrollView>
//       </Container>

//       <FilterModal
//         visible={showFilterModal}
//         onClose={() => setShowFilterModal(false)}
//         selectedDateFilter={selectedDateFilter} setSelectedDateFilter={setSelectedDateFilter}
//         selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
//         selectedYear={selectedYear} setSelectedYear={setSelectedYear}
//         customStartDate={customStartDate} customEndDate={customEndDate}
//         onShowDatePicker={setShowDatePicker}
//       />

//       <CustomDatePickerModal
//         visible={!!showDatePicker}
//         onClose={() => setShowDatePicker(null)}
//         onSelectDate={(date) => {
//           if (!date) return setShowDatePicker(null);
//           const formattedDate = new Date(date).toISOString().split('T')[0];
//           if (showDatePicker === 'start') setCustomStartDate(formattedDate);
//           else if (showDatePicker === 'end') setCustomEndDate(formattedDate);
//           setShowDatePicker(null);
//         }}
//         currentDate={new Date()}
//       />
//     </View>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────

// const styles :any = StyleSheet.create({
//   root: { flex: 1 },

//   // Header
//   floatingHeaderContainer: {
//     paddingHorizontal: 16,
//     paddingBottom: 8,
//     width: '100%',
//     maxWidth: 1400,
//     alignSelf: 'center',
//     zIndex: 20,
//   },
//   floatingHeaderCard: {
//     borderRadius: 22,
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderWidth: 1,
//   },
//   headerInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   headerIconBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     ...(WEB ? { cursor: 'pointer' } : {}),
//   },

//   // Base Glass Card Layout
//   glassCard: {
//     padding: 16,
//     borderWidth: 1,
//   },
//   iconCircle: {
//     width: 34,
//     height: 34,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   // New Layout Specific Styles
//   largeIconSquare: {
//     width: 76,
//     height: 76,
//     borderRadius: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   pillBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   circularActionBtn: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   // Controls (Search & Tabs)
//   searchWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     height: 52,
//     borderRadius: 16,
//     borderWidth: 1,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     fontWeight: '500',
//     // outlineStyle: 'none',
//   },
//   segmentedControl: {
//     flexDirection: 'row',
//     padding: 6,
//     borderRadius: 16,
//     borderWidth: 1,
//   },
//   segmentItem: {
//     paddingVertical: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   // Filter Modal
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.55)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     padding: 24,
//     paddingBottom: 40,
//     maxHeight: '85%',
//   },
//   modalHandleContainer: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalHandle: {
//     width: 40,
//     height: 5,
//     borderRadius: 3,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   pillChip: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   dateInput: {
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderWidth: 1,
//     minHeight: 48,
//     justifyContent: 'center',
//   },

//   // Loading
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 80,
//   },
// });
