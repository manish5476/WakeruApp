import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import { TabBar } from '../../../components/ui/TabBar';
import { Grid } from '../../../components/ui/Grid';
import { useInfiniteMyExpenses, useMyTrips } from '../../../hooks';
import { useDashboard } from '../../../hooks/useDashboard';
import { useAuthStore } from '../../../stores/auth.store';
import { useTheme } from '../../../providers/ThemeProvider';
import { useResponsive } from '../../../hooks/useResponsive';
import { haptics } from '../../../utils/haptics';
import AppIcon from '../../../components/common/AppIcon';
import { CustomDatePickerModal } from '../../../components/common/CustomDatePickerModal';
import { ExpenseDetailsModal } from '../../../components/trips/Expenses/ExpenseDetailsModal';
import { ExpenseCard } from '../../../components/ui/ExpenseCard';
import type { Theme } from '../../../theme';

const { width: windowWidth } = Dimensions.get('window');

// ============================================================
// HELPERS
// ============================================================

function safeDate(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return d instanceof Date && !isNaN(d.getTime()) ? d : null;
}

const toISODate = (d: Date) => d.toISOString().split('T')[0];

type DateFilterPreset =
  | 'all'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

function getPresetRange(
  preset: DateFilterPreset,
  customStart: Date | null,
  customEnd: Date | null,
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
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: toISODate(start), endDate: toISODate(end) };
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: toISODate(start), endDate: toISODate(now) };
    }
    case 'custom':
      return {
        startDate: customStart ? toISODate(customStart) : undefined,
        endDate: customEnd ? toISODate(customEnd) : undefined,
      };
    default:
      return {};
  }
}

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' as const },
  { label: 'You Owe', value: 'you_owe' as const },
  { label: 'You Paid', value: 'you_paid' as const },
  { label: 'Unsettled', value: 'unsettled' as const },
  { label: 'Settled', value: 'settled' as const },
];

const DATE_PRESETS: { key: DateFilterPreset; label: string; icon: string }[] = [
  { key: 'all', label: 'All Time', icon: 'globe' },
  { key: 'today', label: 'Today', icon: 'sun' },
  { key: 'this_week', label: 'This Week', icon: 'calendar' },
  { key: 'this_month', label: 'This Month', icon: 'calendar' },
  { key: 'last_month', label: 'Last Month', icon: 'clock' },
  { key: 'this_year', label: 'This Year', icon: 'compass' },
  { key: 'custom', label: 'Custom Range', icon: 'sliders' },
];

// ============================================================
// BENTO STATS SUMMARY
// ============================================================

function BentoStatsSummary({
  totalSpent,
  balances,
  pendingCount,
  theme,
  setFilterType,
}: {
  totalSpent: number;
  balances: { totalOwed: number; totalLent: number; netBalance: number };
  pendingCount: number;
  theme: Theme;
  setFilterType?: (v: string) => void;
}) {
  return (
    <View style={statsStyles(theme).bentoRow}>
      {/* Tile 1: Total Spent */}
      <Pressable
        onPress={() => {
          haptics.light();
          setFilterType?.('all');
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
            <AppIcon name="wallet" size={16} color="#2563EB" />
          </View>
          <Text style={statsStyles(theme).tileCategoryLabel}>TOTAL SPENT</Text>
        </View>
        <Text
          style={[
            statsStyles(theme).tileValue,
            { color: theme.colors.textPrimary },
          ]}
        >
          ₹{totalSpent.toLocaleString('en-IN')}
        </Text>
        <Text
          style={[
            statsStyles(theme).tileSub,
            { color: theme.colors.textTertiary },
          ]}
        >
          All transactions
        </Text>
      </Pressable>

      {/* Tile 2: You Lent */}
      <Pressable
        onPress={() => {
          haptics.light();
          setFilterType?.('you_paid');
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
              { backgroundColor: '#ECFDF5' },
            ]}
          >
            <AppIcon name="arrow-up-right" size={16} color="#10B981" />
          </View>
          <Text
            style={[statsStyles(theme).tileCategoryLabel, { color: '#059669' }]}
          >
            YOU LENT
          </Text>
        </View>
        <Text style={[statsStyles(theme).tileValue, { color: '#10B981' }]}>
          ₹{balances.totalLent.toLocaleString('en-IN')}
        </Text>
        <Text
          style={[
            statsStyles(theme).tileSub,
            { color: theme.colors.textTertiary },
          ]}
        >
          {balances.totalLent > 0 ? 'To collect' : 'No active loans'}
        </Text>
      </Pressable>

      {/* Tile 3: You Owe */}
      <Pressable
        onPress={() => {
          haptics.light();
          setFilterType?.('you_owe');
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
              { backgroundColor: '#FEF2F2' },
            ]}
          >
            <AppIcon name="arrow-down-left" size={16} color="#EF4444" />
          </View>
          <Text
            style={[statsStyles(theme).tileCategoryLabel, { color: '#DC2626' }]}
          >
            YOU OWE
          </Text>
        </View>
        <Text style={[statsStyles(theme).tileValue, { color: '#EF4444' }]}>
          ₹{balances.totalOwed.toLocaleString('en-IN')}
        </Text>
        <Text
          style={[
            statsStyles(theme).tileSub,
            { color: theme.colors.textTertiary },
          ]}
        >
          {balances.totalOwed > 0 ? 'To settle up' : 'All settled up'}
        </Text>
      </Pressable>

      {/* Tile 4: Pending Settlements */}
      <Pressable
        onPress={() => {
          haptics.light();
          setFilterType?.('unsettled');
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
            <AppIcon name="clock" size={16} color="#D97706" />
          </View>
          <Text
            style={[statsStyles(theme).tileCategoryLabel, { color: '#D97706' }]}
          >
            PENDING
          </Text>
        </View>
        <Text
          style={[
            statsStyles(theme).tileValue,
            { color: pendingCount > 0 ? '#F59E0B' : '#10B981' },
          ]}
        >
          {pendingCount}
        </Text>
        <Text
          style={[
            statsStyles(theme).tileSub,
            { color: theme.colors.textTertiary },
          ]}
        >
          {pendingCount > 0 ? `${pendingCount} to settle` : 'All clear'}
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================
// SEARCH / FILTER TOOLBAR
// ============================================================

function ExpensesToolbar({
  theme,
  searchQuery,
  setSearchQuery,
  isFocused,
  setIsFocused,
  dateFilterLabel,
  datePreset,
  onOpenDateModal,
  filterType,
  setFilterType,
  totalSpent,
  balances,
  pendingCount,
  showStats,
}: {
  theme: Theme;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  isFocused: boolean;
  setIsFocused: (v: boolean) => void;
  dateFilterLabel: string;
  datePreset: DateFilterPreset;
  onOpenDateModal: () => void;
  filterType: string;
  setFilterType: (v: string) => void;
  totalSpent: number;
  balances: any;
  pendingCount: number;
  showStats: boolean;
}) {
  return (
    <View style={toolbarStyles(theme).wrap}>
      {/* Search Input & Date Picker */}
      <View style={toolbarStyles(theme).searchRow}>
        <View
          style={[
            toolbarStyles(theme).searchBox,
            { backgroundColor: theme.colors.surface },
            isFocused && toolbarStyles(theme).searchBoxFocused,
          ]}
        >
          <AppIcon name="search" size={18} color={theme.colors.textTertiary} />
          <TextInput
            style={[
              toolbarStyles(theme).searchInput,
              { color: theme.colors.textPrimary },
            ]}
            placeholder="Search expenses by title, trip, category..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                haptics.light();
                setSearchQuery('');
              }}
              hitSlop={8}
            >
              <AppIcon name="x" size={16} color={theme.colors.textTertiary} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => {
            haptics.light();
            onOpenDateModal();
          }}
        >
          <View
            style={[
              toolbarStyles(theme).dateBtn,
              { backgroundColor: theme.colors.surface },
              datePreset !== 'all' && toolbarStyles(theme).dateBtnActive,
            ]}
          >
            <AppIcon
              name="calendar"
              size={16}
              color={
                datePreset !== 'all'
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                toolbarStyles(theme).dateBtnText,
                {
                  color:
                    datePreset !== 'all'
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                },
              ]}
            >
              {dateFilterLabel}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Filter Segment Tabs */}
      <TabBar
        tabs={FILTER_OPTIONS.map(opt => ({ key: opt.value, label: opt.label }))}
        activeKey={filterType}
        onTabChange={setFilterType}
        variant="segmented"
        scrollable={true}
        style={{ paddingVertical: 2 }}
      />

      {/* Bento Stats Row */}
      {showStats && (
        <BentoStatsSummary
          totalSpent={totalSpent}
          balances={balances}
          pendingCount={pendingCount}
          theme={theme}
          setFilterType={setFilterType}
        />
      )}
    </View>
  );
}

// ============================================================
// EXPENSE LIST
// ============================================================

function ExpensesList({
  groupedExpenses,
  groupBy,
  theme,
  selectedId,
  onSelect,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isRefetching,
  refetch,
  extraBottomPadding,
}: {
  groupedExpenses: {
    title: string;
    items: any[];
    total: number;
    count: number;
  }[];
  groupBy: string;
  theme: Theme;
  selectedId?: string | null;
  onSelect: (expense: any) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  isRefetching: boolean;
  refetch: () => void;
  extraBottomPadding?: number;
}) {
  const { isDesktop, isTablet } = useResponsive();

  return (
    <FlatList
      style={{ flex: 1 }}
      data={groupedExpenses}
      keyExtractor={(item, index) => `group-${index}-${item.title}`}
      renderItem={({ item: group }) => (
        <View style={listStyles(theme).section}>
          <View style={listStyles(theme).sectionHeader}>
            <View style={listStyles(theme).sectionHeaderLeft}>
              <Text
                style={[
                  listStyles(theme).groupTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {groupBy === 'date' && group.title !== 'Unknown Date'
                  ? format(
                      new Date(`${group.title}T00:00:00`),
                      'EEEE, MMMM d, yyyy',
                    )
                  : group.title}
              </Text>
              <View style={listStyles(theme).countBadge}>
                <Text style={listStyles(theme).countBadgeText}>
                  {group.count}
                </Text>
              </View>
            </View>
            <Text
              style={[
                listStyles(theme).groupTotalText,
                { color: theme.colors.textPrimary },
              ]}
            >
              ₹{group.total.toLocaleString('en-IN')}
            </Text>
          </View>

          <Grid cols={isDesktop ? 3 : isTablet ? 2 : 1} gap={theme.spacing.sm}>
            {group.items.map((expense: any, itemIdx: number) => (
              <ExpenseCard
                key={expense._id || `card-${itemIdx}`}
                expense={expense}
                isSelected={selectedId === expense._id}
                onPress={() => onSelect(expense)}
              />
            ))}
          </Grid>
        </View>
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[{ paddingBottom: extraBottomPadding || 80 }]}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={{ padding: 20 }}
          />
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="🧾"
          title="No Expenses Found"
          description="Try adjusting your filters or add a new expense to get started."
        />
      }
    />
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MyExpensesDashboard() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const { user } = useAuthStore();

  const [filterType, setFilterType] = useState<string>('all');
  const [groupBy, setGroupBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isTripSelectorVisible, setIsTripSelectorVisible] = useState(false);

  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'start' | 'end' | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  const resolvedDateRange = useMemo(
    () => getPresetRange(datePreset, customStartDate, customEndDate),
    [datePreset, customStartDate, customEndDate],
  );

  const dateFilterLabel = useMemo(() => {
    if (datePreset === 'custom') {
      if (customStartDate && customEndDate)
        return `${format(customStartDate, 'MMM d')} – ${format(customEndDate, 'MMM d')}`;
      return 'Custom Range';
    }
    return DATE_PRESETS.find(p => p.key === datePreset)?.label ?? 'All Time';
  }, [datePreset, customStartDate, customEndDate]);

  useEffect(() => {
    if (isDateModalVisible) {
      setTempStartDate(customStartDate);
      setTempEndDate(customEndDate);
    }
  }, [isDateModalVisible]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: tripsData } = useMyTrips({ status: 'active' });
  const activeTrips = useMemo(
    () => tripsData?.pages?.flatMap((p: any) => p.trips) || [],
    [tripsData],
  );

  const { data: dashboard } = useDashboard({
    type: filterType === 'all' ? undefined : filterType,
    isArchived: false,
    startDate: resolvedDateRange.startDate,
    endDate: resolvedDateRange.endDate,
  });

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMyExpenses({
    type: filterType === 'all' ? undefined : filterType,
    isArchived: false,
    sortBy: groupBy,
    search: debouncedSearchQuery,
    startDate: resolvedDateRange.startDate,
    endDate: resolvedDateRange.endDate,
  });

  const rawExpenses = useMemo(
    () => data?.pages?.flatMap((page: any) => page?.expenses || []) ?? [],
    [data],
  );

  const filteredExpenses = useMemo(() => {
    let filtered = rawExpenses;
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = rawExpenses.filter(
        (e: any) =>
          e.title?.toLowerCase().includes(q) ||
          e.tripId?.title?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q),
      );
    }
    return filtered.map((exp: any) => ({
      ...exp,
      currentUserId: user!._id,
      tripName: exp.tripId?.title || 'Untitled Trip',
    }));
  }, [rawExpenses, debouncedSearchQuery, user]);

  const dashboardData = dashboard?.data;
  const balances = dashboardData?.balances || {
    totalOwed: 0,
    totalLent: 0,
    netBalance: 0,
  };
  const totalSpent = data?.pages?.[0]?.totalAmount || 0;
  const pendingCount = rawExpenses.filter((e: any) => !e.isSettled).length;

  const handleDateSelect = useCallback(
    (date: Date) => {
      if (pickerType === 'start') {
        setTempStartDate(date);
        if (!tempEndDate || date > tempEndDate) setTempEndDate(date);
      } else if (pickerType === 'end') {
        setTempEndDate(date);
      }
      setPickerType(null);
    },
    [pickerType, tempEndDate],
  );

  const applyCustomRange = useCallback(() => {
    if (tempStartDate && tempEndDate) {
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate);
      setDatePreset('custom');
      setIsDateModalVisible(false);
      haptics.success();
    }
  }, [tempStartDate, tempEndDate]);

  const handleExpensePress = useCallback(
    (expense: any) => {
      if (isDesktop) {
        setSelectedExpense((prev: any) =>
          prev?._id === expense._id ? null : expense,
        );
      } else {
        setSelectedExpense(expense);
      }
      haptics.light();
    },
    [isDesktop],
  );

  const groupExpenses = useCallback((expenses: any[], groupByKey: string) => {
    if (!expenses || expenses.length === 0) return [];
    const groups: { [key: string]: any[] } = {};
    expenses.forEach((expense: any) => {
      let key: string;
      switch (groupByKey) {
        case 'date': {
          const d = safeDate(expense.date);
          key = d ? format(d, 'yyyy-MM-dd') : 'Unknown Date';
          break;
        }
        case 'tripId':
          key = expense.tripName || 'Untitled Trip';
          break;
        case 'paidBy':
          key = expense.paidByName || 'Unknown Payer';
          break;
        default:
          key = 'All';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(expense);
    });
    return Object.entries(groups)
      .sort(([a], [b]) =>
        groupByKey === 'date' ? b.localeCompare(a) : a.localeCompare(b),
      )
      .map(([title, items]) => ({
        title,
        items,
        total: items.reduce((s, i) => s + (i.amountLocal || 0), 0),
        count: items.length,
      }));
  }, []);

  const groupedExpenses = useMemo(() => {
    if (!filteredExpenses || filteredExpenses.length === 0) return [];
    return groupExpenses(filteredExpenses, groupBy);
  }, [filteredExpenses, groupBy, groupExpenses]);

  const toolbarProps = {
    theme,
    searchQuery,
    setSearchQuery,
    isFocused,
    setIsFocused,
    dateFilterLabel,
    datePreset,
    onOpenDateModal: () => setIsDateModalVisible(true),
    filterType,
    setFilterType,
    totalSpent,
    balances,
    pendingCount,
    showStats: filteredExpenses.length > 0,
  };

  const listProps = {
    groupedExpenses,
    groupBy,
    theme,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isRefetching,
    refetch,
  };

  if (isLoading) {
    return (
      <GlobalBackground>
        <View style={mainStyles(theme).loadingWrap}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              mainStyles(theme).loadingText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Loading your expenses…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <View style={mainStyles(theme).container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {isDesktop ? (
        <View
          style={[
            mainStyles(theme).desktopLayout,
            { paddingTop: insets.top + 16 },
          ]}
        >
          <View style={mainStyles(theme).desktopList}>
            <View style={mainStyles(theme).desktopListInner}>
              <ExpensesToolbar {...toolbarProps} />
              <ExpensesList
                {...listProps}
                selectedId={selectedExpense?._id}
                onSelect={handleExpensePress}
              />
            </View>
          </View>
          <ExpenseDetailsModal
            expense={selectedExpense}
            onClose={() => setSelectedExpense(null)}
          />
        </View>
      ) : (
        <View
          style={[
            mainStyles(theme).mobileLayout,
            { paddingTop: insets.top + 12 },
          ]}
        >
          <ExpensesToolbar {...toolbarProps} />
          <ExpensesList
            {...listProps}
            selectedId={null}
            onSelect={handleExpensePress}
            extraBottomPadding={100}
          />
          <ExpenseDetailsModal
            expense={selectedExpense}
            onClose={() => setSelectedExpense(null)}
          />
        </View>
      )}

      {/* Floating Action Button */}
      <Animated.View style={fabStyles(theme).container}>
        <Pressable
          onPress={() => {
            activeTrips.length === 0
              ? Alert.alert(
                  'No Active Trips',
                  'Please create a trip first to add an expense.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Create Trip',
                      onPress: () => router.push('/(app)/create-trip'),
                    },
                  ],
                )
              : setIsTripSelectorVisible(true);
          }}
          onPressIn={() => {
            haptics.light();
          }}
        >
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            style={fabStyles(theme).fab}
          >
            <AppIcon name="plus" size={26} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Trip Selector Modal */}
      <Modal
        visible={isTripSelectorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTripSelectorVisible(false)}
      >
        <View style={modalStyles(theme).overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsTripSelectorVisible(false)}
          />
          <Animated.View entering={FadeInDown.duration(300)}>
            <View
              style={[
                modalStyles(theme).content,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={modalStyles(theme).header}>
                <View style={modalStyles(theme).headerLeft}>
                  <View
                    style={[
                      modalStyles(theme).headerIconAura,
                      { backgroundColor: `${theme.colors.primary}15` },
                    ]}
                  >
                    <AppIcon
                      name="map"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        modalStyles(theme).modalTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Select Trip
                    </Text>
                    <Text
                      style={[
                        modalStyles(theme).modalSub,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Choose a trip to add an expense to
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setIsTripSelectorVisible(false);
                  }}
                  style={modalStyles(theme).closeBtn}
                >
                  <AppIcon
                    name="x"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>
              <ScrollView
                style={modalStyles(theme).scroll}
                showsVerticalScrollIndicator={false}
              >
                {activeTrips.map((trip: any) => (
                  <Pressable
                    key={trip._id}
                    onPress={() => {
                      setIsTripSelectorVisible(false);
                      router.push(`/(app)/trips/${trip._id}/add-expense`);
                    }}
                  >
                    <View
                      style={[
                        modalStyles(theme).tripOption,
                        { backgroundColor: theme.colors.background },
                      ]}
                    >
                      <Image
                        source={{
                          uri:
                            trip.coverImage ||
                            'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2',
                        }}
                        style={modalStyles(theme).tripImage}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            modalStyles(theme).tripTitle,
                            { color: theme.colors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {trip.title}
                        </Text>
                        <Text
                          style={[
                            modalStyles(theme).tripMeta,
                            { color: theme.colors.textTertiary },
                          ]}
                        >
                          {format(new Date(trip.startDate), 'MMM d, yyyy')} ·{' '}
                          {trip.members?.length || 1} members
                        </Text>
                      </View>
                      <AppIcon
                        name="chevron-right"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Date Filter Modal */}
      <Modal
        visible={isDateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsDateModalVisible(false);
          setPickerType(null);
        }}
      >
        <View style={modalStyles(theme).overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setIsDateModalVisible(false);
              setPickerType(null);
            }}
          />

          <Animated.View
            entering={FadeInDown.duration(280).springify().damping(18)}
            style={modalStyles(theme).animatedWrap}
          >
            <View
              style={[
                modalStyles(theme).content,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {/* Header */}
              <View style={modalStyles(theme).header}>
                <View style={modalStyles(theme).headerLeft}>
                  <View
                    style={[
                      modalStyles(theme).headerIconAura,
                      { backgroundColor: `${theme.colors.primary}15` },
                    ]}
                  >
                    <AppIcon
                      name="calendar"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        modalStyles(theme).modalTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Filter by Date
                    </Text>
                    <Text
                      style={[
                        modalStyles(theme).modalSub,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Choose timeframe or specify a custom range
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    haptics.light();
                    setIsDateModalVisible(false);
                    setPickerType(null);
                  }}
                  style={modalStyles(theme).closeBtn}
                  hitSlop={8}
                >
                  <AppIcon
                    name="x"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </Pressable>
              </View>

              {/* Scroll Body */}
              <ScrollView
                style={modalStyles(theme).scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={modalStyles(theme).scrollContent}
              >
                <Text
                  style={[
                    modalStyles(theme).sectionLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  QUICK TIMEFRAMES
                </Text>

                {/* 2-Column Bento Preset Grid */}
                <View style={modalStyles(theme).presetsGrid}>
                  {DATE_PRESETS.map(preset => {
                    const isActive = datePreset === preset.key;
                    const isCustom = preset.key === 'custom';

                    return (
                      <Pressable
                        key={preset.key}
                        style={({ pressed }) => [
                          modalStyles(theme).presetCard,
                          isCustom && modalStyles(theme).presetCardFull,
                          {
                            backgroundColor: isActive
                              ? `${theme.colors.primary}12`
                              : theme.colors.background,
                            borderColor: isActive
                              ? theme.colors.primary
                              : theme.isDark
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(15,23,42,0.05)',
                          },
                          pressed && {
                            opacity: 0.85,
                            transform: [{ scale: 0.985 }],
                          },
                        ]}
                        onPress={() => {
                          haptics.light();
                          if (isCustom) {
                            setDatePreset('custom');
                            if (!tempStartDate) setTempStartDate(new Date());
                            if (!tempEndDate) setTempEndDate(new Date());
                          } else {
                            setDatePreset(preset.key);
                            setCustomStartDate(null);
                            setCustomEndDate(null);
                            setTempStartDate(null);
                            setTempEndDate(null);
                            setIsDateModalVisible(false);
                          }
                        }}
                      >
                        <View style={modalStyles(theme).presetLeft}>
                          <View
                            style={[
                              modalStyles(theme).presetIconWrap,
                              {
                                backgroundColor: isActive
                                  ? theme.colors.primary
                                  : theme.isDark
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'rgba(0,0,0,0.04)',
                              },
                            ]}
                          >
                            <AppIcon
                              name={preset.icon}
                              size={14}
                              color={
                                isActive
                                  ? '#FFFFFF'
                                  : theme.colors.textSecondary
                              }
                            />
                          </View>
                          <Text
                            style={[
                              modalStyles(theme).presetLabel,
                              {
                                color: isActive
                                  ? theme.colors.primary
                                  : theme.colors.textPrimary,
                                fontWeight: isActive ? '800' : '600',
                              },
                            ]}
                          >
                            {preset.label}
                          </Text>
                        </View>

                        {isActive && (
                          <View
                            style={[
                              modalStyles(theme).activeRadioDot,
                              { backgroundColor: theme.colors.primary },
                            ]}
                          >
                            <AppIcon name="check" size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Custom Range Drawer */}
                {datePreset === 'custom' && (
                  <View style={modalStyles(theme).customSection}>
                    <View style={modalStyles(theme).customHeader}>
                      <Text
                        style={[
                          modalStyles(theme).sectionLabel,
                          { color: theme.colors.textTertiary, marginBottom: 0 },
                        ]}
                      >
                        SPECIFY DATE BOUNDARIES
                      </Text>
                      {tempStartDate && tempEndDate && (
                        <View style={modalStyles(theme).durationBadge}>
                          <Text style={modalStyles(theme).durationText}>
                            {Math.max(
                              1,
                              Math.ceil(
                                (tempEndDate.getTime() -
                                  tempStartDate.getTime()) /
                                  (1000 * 60 * 60 * 24),
                              ) + 1,
                            )}{' '}
                            Days
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Start / End Date Selectors */}
                    <View style={modalStyles(theme).datePickerRow}>
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          setPickerType('start');
                        }}
                        style={{ flex: 1 }}
                      >
                        <View
                          style={[
                            modalStyles(theme).dateCard,
                            { backgroundColor: theme.colors.background },
                          ]}
                        >
                          <Text
                            style={[
                              modalStyles(theme).dateCardLabel,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            START DATE
                          </Text>
                          <View style={modalStyles(theme).dateValueRow}>
                            <AppIcon
                              name="calendar"
                              size={13}
                              color={theme.colors.primary}
                            />
                            <Text
                              style={[
                                modalStyles(theme).dateValueText,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              {tempStartDate
                                ? format(tempStartDate, 'MMM d, yyyy')
                                : 'Set Start'}
                            </Text>
                          </View>
                        </View>
                      </Pressable>

                      <View style={modalStyles(theme).dateArrowWrap}>
                        <AppIcon
                          name="arrow-right"
                          size={14}
                          color={theme.colors.textTertiary}
                        />
                      </View>

                      <Pressable
                        onPress={() => {
                          haptics.light();
                          setPickerType('end');
                        }}
                        style={{ flex: 1 }}
                      >
                        <View
                          style={[
                            modalStyles(theme).dateCard,
                            { backgroundColor: theme.colors.background },
                          ]}
                        >
                          <Text
                            style={[
                              modalStyles(theme).dateCardLabel,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            END DATE
                          </Text>
                          <View style={modalStyles(theme).dateValueRow}>
                            <AppIcon
                              name="calendar"
                              size={13}
                              color={theme.colors.primary}
                            />
                            <Text
                              style={[
                                modalStyles(theme).dateValueText,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              {tempEndDate
                                ? format(tempEndDate, 'MMM d, yyyy')
                                : 'Set End'}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    </View>

                    {/* Action Buttons */}
                    <View style={modalStyles(theme).customActionRow}>
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          setDatePreset('all');
                          setCustomStartDate(null);
                          setCustomEndDate(null);
                          setTempStartDate(null);
                          setTempEndDate(null);
                        }}
                        style={[
                          modalStyles(theme).resetBtn,
                          { borderColor: theme.colors.borderLight },
                        ]}
                      >
                        <Text
                          style={[
                            modalStyles(theme).resetBtnText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Reset
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={applyCustomRange}
                        disabled={!tempStartDate || !tempEndDate}
                        style={[
                          modalStyles(theme).applyBtn,
                          {
                            backgroundColor:
                              !tempStartDate || !tempEndDate
                                ? `${theme.colors.primary}40`
                                : theme.colors.primary,
                          },
                        ]}
                      >
                        <Text style={modalStyles(theme).applyBtnText}>
                          Apply Custom Range
                        </Text>
                        <AppIcon name="check" size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <CustomDatePickerModal
        visible={pickerType !== null}
        onClose={() => setPickerType(null)}
        onSelectDate={handleDateSelect}
        currentDate={pickerType === 'start' ? tempStartDate : tempEndDate}
        title={pickerType === 'start' ? 'Select Start Date' : 'Select End Date'}
      />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

function mainStyles(theme: Theme) {
  return StyleSheet.create({
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    loadingText: { fontSize: 13, fontWeight: '600' },
    container: { flex: 1, backgroundColor: 'transparent' },
    desktopLayout: {
      flex: 1,
      flexDirection: 'row',
      width: '100%',
      maxWidth: 1400,
      alignSelf: 'center',
    },
    desktopList: { flex: 1 },
    desktopListInner: { flex: 1, paddingHorizontal: 24 },
    mobileLayout: { flex: 1, paddingHorizontal: 16 },
  });
}

function statsStyles(theme: Theme) {
  return StyleSheet.create({
    bentoRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginVertical: 4,
    },
    bentoTile: {
      flex: 1,
      minWidth: 160,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
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
      color: theme.colors.textSecondary,
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

function toolbarStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: { paddingBottom: 12, gap: 10 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      minHeight: 44,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    searchBoxFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      padding: 0,
    },
    dateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      minHeight: 44,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    dateBtnActive: {
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
    },
    dateBtnText: {
      fontSize: 12,
      fontWeight: '700',
    },
  });
}

function listStyles(theme: Theme) {
  return StyleSheet.create({
    section: { marginBottom: 20 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    groupTitle: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    countBadge: {
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
    },
    countBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textSecondary,
    },
    groupTotalText: {
      fontSize: 14,
      fontWeight: '800',
    },
  });
}

function fabStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: Platform.OS === 'web' ? 40 : 80,
      right: Platform.OS === 'web' ? 40 : 20,
      zIndex: 100,
    },
    fab: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.25)',
    },
  });
}

function modalStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    animatedWrap: {
      width: '100%',
      maxWidth: 460,
    },
    content: {
      width: '100%',
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      maxHeight: Platform.OS === 'web' ? ('85vh' as any) : '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    headerIconAura: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    modalSub: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 1,
    },
    closeBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
    },
    scroll: {
      maxHeight: 460,
    },
    scrollContent: {
      paddingBottom: 4,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 10,
    },

    // 2-Column Preset Grid
    presetsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    presetCard: {
      width: '48.8%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
    },
    presetCardFull: {
      width: '100%',
    },
    presetLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    presetIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetLabel: {
      fontSize: 12,
      letterSpacing: -0.2,
    },
    activeRadioDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Custom Range Section
    customSection: {
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
      gap: 12,
    },
    customHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    durationBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    durationText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#2563EB',
    },
    datePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dateCard: {
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      gap: 4,
    },
    dateCardLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    dateValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateValueText: {
      fontSize: 12,
      fontWeight: '800',
    },
    dateArrowWrap: {
      width: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customActionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    resetBtn: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetBtnText: {
      fontSize: 12,
      fontWeight: '700',
    },
    applyBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 14,
    },
    applyBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },

    // Trip Selector Modal options
    tripOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    },
    tripImage: {
      width: 44,
      height: 44,
      borderRadius: 12,
    },
    tripTitle: {
      fontSize: 13,
      fontWeight: '800',
    },
    tripMeta: {
      fontSize: 11,
      marginTop: 2,
    },
  });
}
// import React, { useState, useMemo, useCallback, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Platform,
//   Modal,
//   Pressable,
//   ScrollView,
//   Image,
//   Alert,
//   Dimensions,
//   TextInput,
//   FlatList,
//   ActivityIndicator,
// } from 'react-native';
// import { router } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { format } from 'date-fns';
// import { LinearGradient } from 'expo-linear-gradient';
// import Animated, { FadeInDown } from 'react-native-reanimated';

// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import { Badge } from '../../../components/ui/Badge';
// import { EmptyState } from '../../../components/ui/EmptyState';
// import { TabBar } from '../../../components/ui/TabBar';
// import { Grid } from '../../../components/ui/Grid';
// import { useInfiniteMyExpenses, useMyTrips } from '../../../hooks';
// import { useDashboard } from '../../../hooks/useDashboard';
// import { useAuthStore } from '../../../stores/auth.store';
// import { useTheme } from '../../../providers/ThemeProvider';
// import { useResponsive } from '../../../hooks/useResponsive';
// import { haptics } from '../../../utils/haptics';
// import { safeFormatCurrency } from '../../../utils/formatters';
// import AppIcon from '../../../components/common/AppIcon';
// import { CustomDatePickerModal } from '../../../components/common/CustomDatePickerModal';
// import { ExpenseDetailsModal } from '../../../components/trips/Expenses/ExpenseDetailsModal';
// import type { Theme } from '../../../theme';
// import { ExpenseCard } from '../../../components/ui/ExpenseCard';

// const { width: windowWidth } = Dimensions.get('window');

// // ============================================================
// // HELPERS
// // ============================================================

// function safeDate(value: any): Date | null {
//   if (!value) return null;
//   const d = new Date(value);
//   return d instanceof Date && !isNaN(d.getTime()) ? d : null;
// }

// const toISODate = (d: Date) => d.toISOString().split('T')[0];

// type DateFilterPreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

// function getPresetRange(preset: DateFilterPreset, customStart: Date | null, customEnd: Date | null) {
//   const now = new Date();
//   switch (preset) {
//     case 'today': return { startDate: toISODate(now), endDate: toISODate(now) };
//     case 'this_week': {
//       const start = new Date(now);
//       const day = start.getDay();
//       start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
//       return { startDate: toISODate(start), endDate: toISODate(now) };
//     }
//     case 'this_month': {
//       const start = new Date(now.getFullYear(), now.getMonth(), 1);
//       return { startDate: toISODate(start), endDate: toISODate(now) };
//     }
//     case 'last_month': {
//       const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//       const end = new Date(now.getFullYear(), now.getMonth(), 0);
//       return { startDate: toISODate(start), endDate: toISODate(end) };
//     }
//     case 'this_year': {
//       const start = new Date(now.getFullYear(), 0, 1);
//       return { startDate: toISODate(start), endDate: toISODate(now) };
//     }
//     case 'custom': return {
//       startDate: customStart ? toISODate(customStart) : undefined,
//       endDate: customEnd ? toISODate(customEnd) : undefined,
//     };
//     default: return {};
//   }
// }

// const FILTER_OPTIONS = [
//   { label: 'All', value: 'all' as const },
//   { label: 'You Owe', value: 'you_owe' as const },
//   { label: 'You Paid', value: 'you_paid' as const },
//   { label: 'Unsettled', value: 'unsettled' as const },
//   { label: 'Settled', value: 'settled' as const },
// ];

// const DATE_PRESETS: { key: DateFilterPreset; label: string }[] = [
//   { key: 'all', label: 'All Time' },
//   { key: 'today', label: 'Today' },
//   { key: 'this_week', label: 'This Week' },
//   { key: 'this_month', label: 'This Month' },
//   { key: 'last_month', label: 'Last Month' },
//   { key: 'this_year', label: 'This Year' },
//   { key: 'custom', label: 'Custom Range' },
// ];

// // ============================================================
// // BENTO STATS SUMMARY
// // ============================================================

// function BentoStatsSummary({
//   totalSpent,
//   balances,
//   pendingCount,
//   theme,
//   setFilterType,
// }: {
//   totalSpent: number;
//   balances: { totalOwed: number; totalLent: number; netBalance: number };
//   pendingCount: number;
//   theme: Theme;
//   setFilterType?: (v: string) => void;
// }) {
//   return (
//     <View style={statsStyles(theme).bentoRow}>
//       {/* Tile 1: Total Spent */}
//       <Pressable
//         onPress={() => { haptics.light(); setFilterType?.('all'); }}
//         style={[statsStyles(theme).bentoTile, { backgroundColor: theme.colors.surface }]}
//       >
//         <View style={statsStyles(theme).tileHeaderRow}>
//           <View style={[statsStyles(theme).tileIconWrap, { backgroundColor: '#EFF6FF' }]}>
//             <AppIcon name="wallet" size={16} color="#2563EB" />
//           </View>
//           <Text style={statsStyles(theme).tileCategoryLabel}>TOTAL SPENT</Text>
//         </View>
//         <Text style={[statsStyles(theme).tileValue, { color: theme.colors.textPrimary }]}>
//           ₹{totalSpent.toLocaleString('en-IN')}
//         </Text>
//         <Text style={[statsStyles(theme).tileSub, { color: theme.colors.textTertiary }]}>
//           All transactions
//         </Text>
//       </Pressable>

//       {/* Tile 2: You Lent */}
//       <Pressable
//         onPress={() => { haptics.light(); setFilterType?.('you_paid'); }}
//         style={[statsStyles(theme).bentoTile, { backgroundColor: theme.colors.surface }]}
//       >
//         <View style={statsStyles(theme).tileHeaderRow}>
//           <View style={[statsStyles(theme).tileIconWrap, { backgroundColor: '#ECFDF5' }]}>
//             <AppIcon name="arrow-up-right" size={16} color="#10B981" />
//           </View>
//           <Text style={[statsStyles(theme).tileCategoryLabel, { color: '#059669' }]}>YOU LENT</Text>
//         </View>
//         <Text style={[statsStyles(theme).tileValue, { color: '#10B981' }]}>
//           ₹{balances.totalLent.toLocaleString('en-IN')}
//         </Text>
//         <Text style={[statsStyles(theme).tileSub, { color: theme.colors.textTertiary }]}>
//           {balances.totalLent > 0 ? 'To collect' : 'No active loans'}
//         </Text>
//       </Pressable>

//       {/* Tile 3: You Owe */}
//       <Pressable
//         onPress={() => { haptics.light(); setFilterType?.('you_owe'); }}
//         style={[statsStyles(theme).bentoTile, { backgroundColor: theme.colors.surface }]}
//       >
//         <View style={statsStyles(theme).tileHeaderRow}>
//           <View style={[statsStyles(theme).tileIconWrap, { backgroundColor: '#FEF2F2' }]}>
//             <AppIcon name="arrow-down-left" size={16} color="#EF4444" />
//           </View>
//           <Text style={[statsStyles(theme).tileCategoryLabel, { color: '#DC2626' }]}>YOU OWE</Text>
//         </View>
//         <Text style={[statsStyles(theme).tileValue, { color: '#EF4444' }]}>
//           ₹{balances.totalOwed.toLocaleString('en-IN')}
//         </Text>
//         <Text style={[statsStyles(theme).tileSub, { color: theme.colors.textTertiary }]}>
//           {balances.totalOwed > 0 ? 'To settle up' : 'All settled up'}
//         </Text>
//       </Pressable>

//       {/* Tile 4: Pending Settlements */}
//       <Pressable
//         onPress={() => { haptics.light(); setFilterType?.('unsettled'); }}
//         style={[statsStyles(theme).bentoTile, { backgroundColor: theme.colors.surface }]}
//       >
//         <View style={statsStyles(theme).tileHeaderRow}>
//           <View style={[statsStyles(theme).tileIconWrap, { backgroundColor: '#FEF3C7' }]}>
//             <AppIcon name="clock" size={16} color="#D97706" />
//           </View>
//           <Text style={[statsStyles(theme).tileCategoryLabel, { color: '#D97706' }]}>PENDING</Text>
//         </View>
//         <Text style={[statsStyles(theme).tileValue, { color: pendingCount > 0 ? '#F59E0B' : '#10B981' }]}>
//           {pendingCount}
//         </Text>
//         <Text style={[statsStyles(theme).tileSub, { color: theme.colors.textTertiary }]}>
//           {pendingCount > 0 ? `${pendingCount} to settle` : 'All clear'}
//         </Text>
//       </Pressable>
//     </View>
//   );
// }

// // ============================================================
// // SEARCH / FILTER TOOLBAR
// // ============================================================

// function ExpensesToolbar({
//   theme,
//   searchQuery,
//   setSearchQuery,
//   isFocused,
//   setIsFocused,
//   dateFilterLabel,
//   datePreset,
//   onOpenDateModal,
//   filterType,
//   setFilterType,
//   totalSpent,
//   balances,
//   pendingCount,
//   showStats,
// }: {
//   theme: Theme;
//   searchQuery: string;
//   setSearchQuery: (v: string) => void;
//   isFocused: boolean;
//   setIsFocused: (v: boolean) => void;
//   dateFilterLabel: string;
//   datePreset: DateFilterPreset;
//   onOpenDateModal: () => void;
//   filterType: string;
//   setFilterType: (v: string) => void;
//   totalSpent: number;
//   balances: any;
//   pendingCount: number;
//   showStats: boolean;
// }) {
//   return (
//     <View style={toolbarStyles(theme).wrap}>
//       {/* Search Input & Date Picker */}
//       <View style={toolbarStyles(theme).searchRow}>
//         <View style={[
//           toolbarStyles(theme).searchBox,
//           { backgroundColor: theme.colors.surface },
//           isFocused && toolbarStyles(theme).searchBoxFocused
//         ]}>
//           <AppIcon name="search" size={18} color={theme.colors.textTertiary} />
//           <TextInput
//             style={[toolbarStyles(theme).searchInput, { color: theme.colors.textPrimary }]}
//             placeholder="Search expenses by title, trip, category..."
//             placeholderTextColor={theme.colors.textTertiary}
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             onFocus={() => setIsFocused(true)}
//             onBlur={() => setIsFocused(false)}
//           />
//           {searchQuery.length > 0 && (
//             <Pressable onPress={() => { haptics.light(); setSearchQuery(''); }} hitSlop={8}>
//               <AppIcon name="x" size={16} color={theme.colors.textTertiary} />
//             </Pressable>
//           )}
//         </View>

//         <Pressable onPress={() => { haptics.light(); onOpenDateModal(); }}>
//           <View style={[
//             toolbarStyles(theme).dateBtn,
//             { backgroundColor: theme.colors.surface },
//             datePreset !== 'all' && toolbarStyles(theme).dateBtnActive
//           ]}>
//             <AppIcon name="calendar" size={16} color={datePreset !== 'all' ? theme.colors.primary : theme.colors.textSecondary} />
//             <Text style={[
//               toolbarStyles(theme).dateBtnText,
//               { color: datePreset !== 'all' ? theme.colors.primary : theme.colors.textSecondary }
//             ]}>
//               {dateFilterLabel}
//             </Text>
//           </View>
//         </Pressable>
//       </View>

//       {/* Filter Segment Tabs */}
//       <TabBar
//         tabs={FILTER_OPTIONS.map(opt => ({ key: opt.value, label: opt.label }))}
//         activeKey={filterType}
//         onTabChange={setFilterType}
//         variant="segmented"
//         scrollable={true}
//         style={{ paddingVertical: 2 }}
//       />

//       {/* Bento Stats Row */}
//       {showStats && (
//         <BentoStatsSummary
//           totalSpent={totalSpent}
//           balances={balances}
//           pendingCount={pendingCount}
//           theme={theme}
//           setFilterType={setFilterType}
//         />
//       )}
//     </View>
//   );
// }

// // ============================================================
// // EXPENSE LIST
// // ============================================================

// function ExpensesList({
//   groupedExpenses,
//   groupBy,
//   theme,
//   selectedId,
//   onSelect,
//   hasNextPage,
//   isFetchingNextPage,
//   fetchNextPage,
//   isRefetching,
//   refetch,
//   extraBottomPadding,
// }: {
//   groupedExpenses: { title: string; items: any[]; total: number; count: number }[];
//   groupBy: string;
//   theme: Theme;
//   selectedId?: string | null;
//   onSelect: (expense: any) => void;
//   hasNextPage: boolean;
//   isFetchingNextPage: boolean;
//   fetchNextPage: () => void;
//   isRefetching: boolean;
//   refetch: () => void;
//   extraBottomPadding?: number;
// }) {
//   const { isDesktop, isTablet } = useResponsive();

//   return (
//     <FlatList
//       style={{ flex: 1 }}
//       data={groupedExpenses}
//       keyExtractor={(item, index) => `group-${index}-${item.title}`}
//       renderItem={({ item: group }) => (
//         <View style={listStyles(theme).section}>
//           <View style={listStyles(theme).sectionHeader}>
//             <View style={listStyles(theme).sectionHeaderLeft}>
//               <Text style={[listStyles(theme).groupTitle, { color: theme.colors.textPrimary }]}>
//                 {groupBy === 'date' && group.title !== 'Unknown Date'
//                   ? format(new Date(`${group.title}T00:00:00`), 'EEEE, MMMM d, yyyy')
//                   : group.title}
//               </Text>
//               <View style={listStyles(theme).countBadge}>
//                 <Text style={listStyles(theme).countBadgeText}>{group.count}</Text>
//               </View>
//             </View>
//             <Text style={[listStyles(theme).groupTotalText, { color: theme.colors.textPrimary }]}>
//               ₹{group.total.toLocaleString('en-IN')}
//             </Text>
//           </View>

//           <Grid cols={isDesktop ? 3 : isTablet ? 2 : 1} gap={theme.spacing.sm}>
//             {group.items.map((expense: any, itemIdx: number) => (
//               <ExpenseCard
//                 key={expense._id || `card-${itemIdx}`}
//                 expense={expense}
//                 isSelected={selectedId === expense._id}
//                 onPress={() => onSelect(expense)}
//               />
//             ))}
//           </Grid>
//         </View>
//       )}
//       showsVerticalScrollIndicator={false}
//       contentContainerStyle={[{ paddingBottom: extraBottomPadding || 80 }]}
//       onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
//       onEndReachedThreshold={0.5}
//       refreshing={isRefetching}
//       onRefresh={refetch}
//       ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={theme.colors.primary} style={{ padding: 20 }} /> : null}
//       ListEmptyComponent={
//         <EmptyState
//           icon="🧾"
//           title="No Expenses Found"
//           description="Try adjusting your filters or add a new expense to get started."
//         />
//       }
//     />
//   );
// }

// // ============================================================
// // MAIN COMPONENT
// // ============================================================

// export default function MyExpensesDashboard() {
//   const theme = useTheme();
//   const insets = useSafeAreaInsets();
//   const { isDesktop } = useResponsive();
//   const { user } = useAuthStore();

//   const [filterType, setFilterType] = useState<string>('all');
//   const [groupBy, setGroupBy] = useState('date');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
//   const [isFocused, setIsFocused] = useState(false);
//   const [isTripSelectorVisible, setIsTripSelectorVisible] = useState(false);

//   const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
//   const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
//   const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
//   const [isDateModalVisible, setIsDateModalVisible] = useState(false);
//   const [pickerType, setPickerType] = useState<'start' | 'end' | null>(null);
//   const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
//   const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

//   const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

//   const resolvedDateRange = useMemo(() => getPresetRange(datePreset, customStartDate, customEndDate), [datePreset, customStartDate, customEndDate]);

//   const dateFilterLabel = useMemo(() => {
//     if (datePreset === 'custom') {
//       if (customStartDate && customEndDate) return `${format(customStartDate, 'MMM d')} – ${format(customEndDate, 'MMM d')}`;
//       return 'Custom Range';
//     }
//     return DATE_PRESETS.find((p) => p.key === datePreset)?.label ?? 'All Time';
//   }, [datePreset, customStartDate, customEndDate]);

//   useEffect(() => {
//     if (isDateModalVisible) { setTempStartDate(customStartDate); setTempEndDate(customEndDate); }
//   }, [isDateModalVisible]);

//   useEffect(() => {
//     const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 400);
//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   const { data: tripsData } = useMyTrips({ status: 'active' });
//   const activeTrips = useMemo(() => tripsData?.pages?.flatMap((p: any) => p.trips) || [], [tripsData]);

//   const { data: dashboard } = useDashboard({
//     type: filterType === 'all' ? undefined : filterType,
//     isArchived: false,
//     startDate: resolvedDateRange.startDate,
//     endDate: resolvedDateRange.endDate,
//   });

//   const { data, isLoading, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteMyExpenses({
//     type: filterType === 'all' ? undefined : filterType,
//     isArchived: false,
//     sortBy: groupBy,
//     search: debouncedSearchQuery,
//     startDate: resolvedDateRange.startDate,
//     endDate: resolvedDateRange.endDate,
//   });

//   const rawExpenses = useMemo(() => data?.pages?.flatMap((page: any) => page?.expenses || []) ?? [], [data]);

//   const filteredExpenses = useMemo(() => {
//     let filtered = rawExpenses;
//     if (debouncedSearchQuery) {
//       const q = debouncedSearchQuery.toLowerCase();
//       filtered = rawExpenses.filter((e: any) =>
//         e.title?.toLowerCase().includes(q) ||
//         e.tripId?.title?.toLowerCase().includes(q) ||
//         e.category?.toLowerCase().includes(q)
//       );
//     }
//     return filtered.map((exp: any) => ({ ...exp, currentUserId: user!._id, tripName: exp.tripId?.title || 'Untitled Trip' }));
//   }, [rawExpenses, debouncedSearchQuery, user]);

//   const dashboardData = dashboard?.data;
//   const balances = dashboardData?.balances || { totalOwed: 0, totalLent: 0, netBalance: 0 };
//   const totalSpent = data?.pages?.[0]?.totalAmount || 0;
//   const pendingCount = rawExpenses.filter((e: any) => !e.isSettled).length;

//   const handleDateSelect = useCallback((date: Date) => {
//     if (pickerType === 'start') {
//       setTempStartDate(date);
//       if (!tempEndDate || date > tempEndDate) setTempEndDate(date);
//     } else if (pickerType === 'end') {
//       setTempEndDate(date);
//     }
//     setPickerType(null);
//   }, [pickerType, tempEndDate]);

//   const applyCustomRange = useCallback(() => {
//     if (tempStartDate && tempEndDate) {
//       setCustomStartDate(tempStartDate);
//       setCustomEndDate(tempEndDate);
//       setDatePreset('custom');
//       setIsDateModalVisible(false);
//       haptics.success();
//     }
//   }, [tempStartDate, tempEndDate]);

//   const handleExpensePress = useCallback((expense: any) => {
//     if (isDesktop) {
//       setSelectedExpense((prev: any) => (prev?._id === expense._id ? null : expense));
//     } else {
//       setSelectedExpense(expense);
//     }
//     haptics.light();
//   }, [isDesktop]);

//   const groupExpenses = useCallback((expenses: any[], groupByKey: string) => {
//     if (!expenses || expenses.length === 0) return [];
//     const groups: { [key: string]: any[] } = {};
//     expenses.forEach((expense: any) => {
//       let key: string;
//       switch (groupByKey) {
//         case 'date': {
//           const d = safeDate(expense.date);
//           key = d ? format(d, 'yyyy-MM-dd') : 'Unknown Date';
//           break;
//         }
//         case 'tripId': key = expense.tripName || 'Untitled Trip'; break;
//         case 'paidBy': key = expense.paidByName || 'Unknown Payer'; break;
//         default: key = 'All';
//       }
//       if (!groups[key]) groups[key] = [];
//       groups[key].push(expense);
//     });
//     return Object.entries(groups)
//       .sort(([a], [b]) => (groupByKey === 'date' ? b.localeCompare(a) : a.localeCompare(b)))
//       .map(([title, items]) => ({ title, items, total: items.reduce((s, i) => s + (i.amountLocal || 0), 0), count: items.length }));
//   }, []);

//   const groupedExpenses = useMemo(() => {
//     if (!filteredExpenses || filteredExpenses.length === 0) return [];
//     return groupExpenses(filteredExpenses, groupBy);
//   }, [filteredExpenses, groupBy, groupExpenses]);

//   const toolbarProps = {
//     theme, searchQuery, setSearchQuery, isFocused, setIsFocused,
//     dateFilterLabel, datePreset, onOpenDateModal: () => setIsDateModalVisible(true),
//     filterType, setFilterType,
//     totalSpent, balances, pendingCount, showStats: filteredExpenses.length > 0,
//   };

//   const listProps = {
//     groupedExpenses, groupBy, theme,
//     hasNextPage: !!hasNextPage, isFetchingNextPage, fetchNextPage, isRefetching, refetch,
//   };

//   if (isLoading) {
//     return (
//       <GlobalBackground>
//         <View style={mainStyles(theme).loadingWrap}>
//           <ActivityIndicator size="large" color={theme.colors.primary} />
//           <Text style={[mainStyles(theme).loadingText, { color: theme.colors.textSecondary }]}>
//             Loading your expenses…
//           </Text>
//         </View>
//       </GlobalBackground>
//     );
//   }

//   return (
//     <View style={mainStyles(theme).container}>
//       <View style={StyleSheet.absoluteFill} pointerEvents="none">
//         <GlobalBackground />
//       </View>

//       {isDesktop ? (
//         <View style={[mainStyles(theme).desktopLayout, { paddingTop: insets.top + 16 }]}>
//           <View style={mainStyles(theme).desktopList}>
//             <View style={mainStyles(theme).desktopListInner}>
//               <ExpensesToolbar {...toolbarProps} />
//               <ExpensesList {...listProps} selectedId={selectedExpense?._id} onSelect={handleExpensePress} />
//             </View>
//           </View>
//           <ExpenseDetailsModal
//             expense={selectedExpense}
//             onClose={() => setSelectedExpense(null)}
//           />
//         </View>
//       ) : (
//         <View style={[mainStyles(theme).mobileLayout, { paddingTop: insets.top + 12 }]}>
//           <ExpensesToolbar {...toolbarProps} />
//           <ExpensesList {...listProps} selectedId={null} onSelect={handleExpensePress} extraBottomPadding={100} />
//           <ExpenseDetailsModal
//             expense={selectedExpense}
//             onClose={() => setSelectedExpense(null)}
//           />
//         </View>
//       )}

//       {/* Floating Action Button */}
//       <Animated.View style={fabStyles(theme).container}>
//         <Pressable
//           onPress={() => {
//             activeTrips.length === 0
//               ? Alert.alert('No Active Trips', 'Please create a trip first to add an expense.', [
//                 { text: 'Cancel', style: 'cancel' },
//                 { text: 'Create Trip', onPress: () => router.push('/(app)/create-trip') },
//               ])
//               : setIsTripSelectorVisible(true);
//           }}
//           onPressIn={() => { haptics.light(); }}
//         >
//           <LinearGradient colors={['#2563EB', '#1D4ED8']} style={fabStyles(theme).fab}>
//             <AppIcon name="plus" size={26} color="#FFF" />
//           </LinearGradient>
//         </Pressable>
//       </Animated.View>

//       {/* Trip Selector Modal */}
//       <Modal visible={isTripSelectorVisible} transparent animationType="fade" onRequestClose={() => setIsTripSelectorVisible(false)}>
//         <View style={modalStyles(theme).overlay}>
//           <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsTripSelectorVisible(false)} />
//           <Animated.View entering={FadeInDown.duration(300)}>
//             <View style={[modalStyles(theme).content, { backgroundColor: theme.colors.surface }]}>
//               <View style={modalStyles(theme).header}>
//                 <Text style={[modalStyles(theme).modalTitle, { color: theme.colors.textPrimary }]}>Select Trip</Text>
//                 <Text style={[modalStyles(theme).modalSub, { color: theme.colors.textSecondary }]}>Choose a trip to add an expense to</Text>
//                 <Pressable onPress={() => { haptics.light(); setIsTripSelectorVisible(false); }} style={modalStyles(theme).closeBtn}>
//                   <AppIcon name="x" size={18} color={theme.colors.textSecondary} />
//                 </Pressable>
//               </View>
//               <ScrollView style={modalStyles(theme).scroll} showsVerticalScrollIndicator={false}>
//                 {activeTrips.map((trip: any) => (
//                   <Pressable key={trip._id} onPress={() => { setIsTripSelectorVisible(false); router.push(`/(app)/trips/${trip._id}/add-expense`); }}>
//                     <View style={[modalStyles(theme).tripOption, { backgroundColor: theme.colors.background }]}>
//                       <Image source={{ uri: trip.coverImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2' }} style={modalStyles(theme).tripImage} />
//                       <View style={{ flex: 1 }}>
//                         <Text style={[modalStyles(theme).tripTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>{trip.title}</Text>
//                         <Text style={[modalStyles(theme).tripMeta, { color: theme.colors.textTertiary }]}>
//                           {format(new Date(trip.startDate), 'MMM d, yyyy')} · {trip.members?.length || 1} members
//                         </Text>
//                       </View>
//                       <AppIcon name="chevron-right" size={16} color={theme.colors.textTertiary} />
//                     </View>
//                   </Pressable>
//                 ))}
//               </ScrollView>
//             </View>
//           </Animated.View>
//         </View>
//       </Modal>

//       <Modal visible={isDateModalVisible} transparent animationType="fade" onRequestClose={() => setIsDateModalVisible(false)}>
//         <View style={modalStyles(theme).overlay}>
//           <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsDateModalVisible(false)} />
//           <Animated.View entering={FadeInDown.duration(300)}>
//             <View style={[modalStyles(theme).content, { backgroundColor: theme.colors.surface }]}>
//               <View style={modalStyles(theme).header}>
//                 <Text style={[modalStyles(theme).modalTitle, { color: theme.colors.textPrimary }]}>Filter by Date</Text>
//                 <Text style={[modalStyles(theme).modalSub, { color: theme.colors.textSecondary }]}>Choose a time period</Text>
//                 <Pressable onPress={() => { haptics.light(); setIsDateModalVisible(false); setPickerType(null); }} style={modalStyles(theme).closeBtn}>
//                   <AppIcon name="x" size={18} color={theme.colors.textSecondary} />
//                 </Pressable>
//               </View>
//               <ScrollView style={modalStyles(theme).scroll} showsVerticalScrollIndicator={false}>
//                 {DATE_PRESETS.map((preset) => {
//                   const isActive = datePreset === preset.key;
//                   return (
//                     <Pressable
//                       key={preset.key}
//                       onPress={() => {
//                         haptics.light();
//                         if (preset.key === 'custom') {
//                           setDatePreset('custom');
//                           if (!tempStartDate) setTempStartDate(new Date());
//                           if (!tempEndDate) setTempEndDate(new Date());
//                         } else {
//                           setDatePreset(preset.key);
//                           setCustomStartDate(null); setCustomEndDate(null);
//                           setTempStartDate(null); setTempEndDate(null);
//                           setIsDateModalVisible(false);
//                         }
//                       }}
//                     >
//                       <View style={[
//                         modalStyles(theme).presetRow,
//                         { backgroundColor: theme.colors.background },
//                         isActive && modalStyles(theme).presetRowActive
//                       ]}>
//                         <Text style={[
//                           modalStyles(theme).presetLabel,
//                           { color: isActive ? theme.colors.primary : theme.colors.textPrimary }
//                         ]}>
//                           {preset.label}
//                         </Text>
//                         {isActive && <AppIcon name="check" size={18} color={theme.colors.primary} />}
//                       </View>
//                     </Pressable>
//                   );
//                 })}
//                 {datePreset === 'custom' && (
//                   <View style={modalStyles(theme).customRange}>
//                     <View style={modalStyles(theme).customRangeRow}>
//                       <Pressable onPress={() => { haptics.light(); setPickerType('start'); }} style={{ flex: 1 }}>
//                         <View style={[modalStyles(theme).datePickerBtn, { backgroundColor: theme.colors.background }]}>
//                           <Text style={[modalStyles(theme).datePickerText, { color: theme.colors.textPrimary }]}>
//                             {tempStartDate ? format(tempStartDate, 'MMM d, yyyy') : 'Start date'}
//                           </Text>
//                         </View>
//                       </Pressable>
//                       <Text style={{ color: theme.colors.textTertiary, fontWeight: '700' }}>–</Text>
//                       <Pressable onPress={() => { haptics.light(); setPickerType('end'); }} style={{ flex: 1 }}>
//                         <View style={[modalStyles(theme).datePickerBtn, { backgroundColor: theme.colors.background }]}>
//                           <Text style={[modalStyles(theme).datePickerText, { color: theme.colors.textPrimary }]}>
//                             {tempEndDate ? format(tempEndDate, 'MMM d, yyyy') : 'End date'}
//                           </Text>
//                         </View>
//                       </Pressable>
//                     </View>
//                     <View style={modalStyles(theme).customRangeActions}>
//                       <Pressable
//                         onPress={applyCustomRange}
//                         disabled={!tempStartDate || !tempEndDate}
//                         style={[
//                           modalStyles(theme).applyBtn,
//                           { backgroundColor: (!tempStartDate || !tempEndDate) ? `${theme.colors.primary}50` : theme.colors.primary }
//                         ]}
//                       >
//                         <Text style={modalStyles(theme).applyBtnText}>Apply Range</Text>
//                       </Pressable>
//                     </View>
//                   </View>
//                 )}
//               </ScrollView>
//             </View>
//           </Animated.View>
//         </View>
//       </Modal>

//       <CustomDatePickerModal
//         visible={pickerType !== null}
//         onClose={() => setPickerType(null)}
//         onSelectDate={handleDateSelect}
//         currentDate={pickerType === 'start' ? tempStartDate : tempEndDate}
//         title={pickerType === 'start' ? 'Select Start Date' : 'Select End Date'}
//       />
//     </View>
//   );
// }

// // ============================================================
// // STYLES
// // ============================================================

// function mainStyles(theme: Theme) {
//   return StyleSheet.create({
//     loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
//     loadingText: { fontSize: 13, fontWeight: '600' },
//     container: { flex: 1, backgroundColor: 'transparent' },
//     desktopLayout: { flex: 1, flexDirection: 'row', width: '100%', maxWidth: 1400, alignSelf: 'center' },
//     desktopList: { flex: 1 },
//     desktopListInner: { flex: 1, paddingHorizontal: 24 },
//     mobileLayout: { flex: 1, paddingHorizontal: 16 },
//   });
// }

// function statsStyles(theme: Theme) {
//   return StyleSheet.create({
//     bentoRow: {
//       flexDirection: 'row',
//       flexWrap: 'wrap',
//       gap: 10,
//       marginVertical: 4,
//     },
//     bentoTile: {
//       flex: 1,
//       minWidth: 160,
//       borderRadius: 18,
//       padding: 14,
//       borderWidth: 1,
//       borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
//       boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
//       justifyContent: 'space-between',
//     },
//     tileHeaderRow: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       gap: 8,
//       marginBottom: 8,
//     },
//     tileIconWrap: {
//       width: 28,
//       height: 28,
//       borderRadius: 9,
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     tileCategoryLabel: {
//       fontSize: 10,
//       fontWeight: '800',
//       letterSpacing: 0.6,
//       color: theme.colors.textSecondary,
//     },
//     tileValue: {
//       fontSize: 18,
//       fontWeight: '900',
//       letterSpacing: -0.4,
//     },
//     tileSub: {
//       fontSize: 10,
//       fontWeight: '600',
//       marginTop: 2,
//     },
//   });
// }

// function toolbarStyles(theme: Theme) {
//   return StyleSheet.create({
//     wrap: { paddingBottom: 12, gap: 10 },
//     searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
//     searchBox: {
//       flex: 1,
//       flexDirection: 'row',
//       alignItems: 'center',
//       gap: 10,
//       paddingHorizontal: 14,
//       paddingVertical: 10,
//       borderRadius: 16,
//       minHeight: 44,
//       borderWidth: 1,
//       borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
//       boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
//     },
//     searchBoxFocused: {
//       borderColor: theme.colors.primary,
//       borderWidth: 1.5
//     },
//     searchInput: {
//       flex: 1,
//       fontSize: 13,
//       fontWeight: '500',
//       padding: 0
//     },
//     dateBtn: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       gap: 8,
//       paddingHorizontal: 14,
//       paddingVertical: 10,
//       borderRadius: 16,
//       minHeight: 44,
//       borderWidth: 1,
//       borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
//       boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
//     },
//     dateBtnActive: {
//       borderColor: theme.colors.primary,
//       borderWidth: 1.5
//     },
//     dateBtnText: {
//       fontSize: 12,
//       fontWeight: '700',
//     },
//   });
// }

// function listStyles(theme: Theme) {
//   return StyleSheet.create({
//     section: { marginBottom: 20 },
//     sectionHeader: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: 10,
//       paddingHorizontal: 2
//     },
//     sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//     groupTitle: {
//       fontSize: 14,
//       fontWeight: '800',
//       letterSpacing: -0.2,
//     },
//     countBadge: {
//       backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
//       paddingHorizontal: 7,
//       paddingVertical: 2,
//       borderRadius: 999,
//     },
//     countBadgeText: {
//       fontSize: 10,
//       fontWeight: '800',
//       color: theme.colors.textSecondary,
//     },
//     groupTotalText: {
//       fontSize: 14,
//       fontWeight: '800',
//     },
//   });
// }

// function fabStyles(theme: Theme) {
//   return StyleSheet.create({
//     container: {
//       position: 'absolute',
//       bottom: Platform.OS === 'web' ? 40 : 80,
//       right: Platform.OS === 'web' ? 40 : 20,
//       zIndex: 100,
//     },
//     fab: {
//       width: 54,
//       height: 54,
//       borderRadius: 27,
//       alignItems: 'center',
//       justifyContent: 'center',
//       borderWidth: 1.5,
//       borderColor: 'rgba(255,255,255,0.25)',
//       boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
//     },
//   });
// }

// function modalStyles(theme: Theme) {
//   return StyleSheet.create({
//     overlay: {
//       flex: 1,
//       backgroundColor: 'rgba(0,0,0,0.65)',
//       justifyContent: 'center',
//       alignItems: 'center',
//       padding: 16,
//     },
//     content: {
//       width: '100%',
//       maxWidth: Math.min(460, windowWidth - 32),
//       borderRadius: 24,
//       padding: 22,
//       maxHeight: '85%',
//       borderWidth: 1,
//       borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
//       boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
//     },
//     header: { marginBottom: 16, position: 'relative' },
//     modalTitle: {
//       fontSize: 18,
//       fontWeight: '800',
//     },
//     modalSub: {
//       fontSize: 12,
//       fontWeight: '500',
//       marginTop: 2,
//     },
//     closeBtn: {
//       position: 'absolute',
//       top: 0,
//       right: 0,
//       width: 32,
//       height: 32,
//       alignItems: 'center',
//       justifyContent: 'center',
//       borderRadius: 16,
//       backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
//     },
//     scroll: { maxHeight: 420 },
//     tripOption: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       gap: 12,
//       padding: 12,
//       borderRadius: 16,
//       marginBottom: 8,
//       borderWidth: 1,
//       borderColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
//     },
//     tripImage: { width: 44, height: 44, borderRadius: 12 },
//     tripTitle: {
//       fontSize: 13,
//       fontWeight: '800',
//     },
//     tripMeta: {
//       fontSize: 11,
//       marginTop: 2,
//     },
//     presetRow: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'space-between',
//       padding: 14,
//       borderRadius: 14,
//       marginBottom: 8,
//       borderWidth: 1,
//       borderColor: 'transparent',
//     },
//     presetRowActive: {
//       borderColor: theme.colors.primary,
//       backgroundColor: `${theme.colors.primary}12`,
//     },
//     presetLabel: {
//       fontSize: 13,
//       fontWeight: '700',
//     },
//     customRange: {
//       marginTop: 12,
//       paddingTop: 12,
//       borderTopWidth: 1,
//       borderTopColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
//     },
//     customRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
//     datePickerBtn: {
//       paddingHorizontal: 12,
//       paddingVertical: 10,
//       borderRadius: 12,
//       alignItems: 'center',
//       borderWidth: 1,
//       borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
//     },
//     datePickerText: {
//       fontSize: 12,
//       fontWeight: '600',
//     },
//     customRangeActions: { marginTop: 4 },
//     applyBtn: {
//       paddingVertical: 12,
//       borderRadius: 14,
//       alignItems: 'center',
//     },
//     applyBtnText: {
//       color: '#FFFFFF',
//       fontSize: 13,
//       fontWeight: '800',
//     },
//   });
// }
