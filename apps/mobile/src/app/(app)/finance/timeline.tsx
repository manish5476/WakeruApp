import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import { EmptyState } from '../../../components/common/EmptyState';
// app/finance/timeline.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../providers/ThemeProvider';
import { Card } from '../../../components/ui/Card';
import { GlassCard } from '../../../components/ui/GlassCard';
import {
  useTransactions,
  useInfiniteTransactions,
} from '../../../hooks/useFinance';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'income', label: 'Income' },
] as const;

type TransactionFilter = (typeof FILTERS)[number]['key'];

export default function FinanceTimelineScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const {
    data,
    isLoading,
    refetch,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteTransactions({
    type: activeFilter === 'all' ? undefined : activeFilter,
    search: debouncedQuery || undefined,
  });

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const transactions =
    data?.pages.flatMap(page => page?.transactions || []) || [];

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    transactions.forEach((t: any) => {
      const date = new Date(t.date);
      const dateStr = date.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(t);
    });
    return Object.entries(groups).sort((a, b) => {
      // Sort dates descending (newest first)
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions]);

  // Handle search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const totalExpense = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  return (
    <GlobalBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <AppIcon
              name="arrow-left"
              size={24}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          >
            Transactions
          </Text>
          <TouchableOpacity onPress={() => router.push('/finance/add')}>
            <AppIcon name="plus" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <GlassCard style={[styles.searchCard, { marginHorizontal: 20 }]}>
          <View style={styles.searchContainer}>
            <AppIcon
              name="search"
              size={18}
              color={theme.colors.textTertiary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              placeholder="Search transactions..."
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <AppIcon
                  name="x-circle"
                  size={16}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card
            style={[
              styles.summaryCard,
              { borderLeftColor: theme.colors.danger, borderLeftWidth: 4 },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Total Expenses
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.danger }]}>
              {formatCurrency(totalExpense)}
            </Text>
          </Card>
          <Card
            style={[
              styles.summaryCard,
              { borderLeftColor: theme.colors.success, borderLeftWidth: 4 },
            ]}
          >
            <Text
              style={[
                styles.summaryLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Total Income
            </Text>
            <Text
              style={[styles.summaryValue, { color: theme.colors.success }]}
            >
              {formatCurrency(totalIncome)}
            </Text>
          </Card>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterBtn,
                activeFilter === filter.key && {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === filter.key
                        ? '#FFF'
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions List */}
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          onMomentumScrollEnd={e => {
            const isCloseToBottom =
              e.nativeEvent.layoutMeasurement.height +
                e.nativeEvent.contentOffset.y >=
              e.nativeEvent.contentSize.height - 50;
            if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
        >
          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <GlobalLoader
                  variant="inline"
                  size="large"
                  color={theme.colors.primary}
                />
              </View>
            ) : groupedTransactions.length === 0 ? (
              <EmptyState
                title="No transactions found"
                description={
                  searchQuery
                    ? 'Try adjusting your search.'
                    : 'Start adding your first transaction.'
                }
                icon="receipt-text"
                actionLabel={searchQuery ? undefined : 'Add transaction'}
                onAction={
                  searchQuery ? undefined : () => router.push('/finance/add')
                }
              />
            ) : (
              groupedTransactions.map(([date, txs]) => (
                <View key={date} style={styles.dateGroup}>
                  <View style={styles.dateHeaderRow}>
                    <View
                      style={[
                        styles.dateLine,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dateHeader,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {date}
                    </Text>
                    <View
                      style={[
                        styles.dateLine,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                  </View>
                  {txs.map((t: any) => (
                    <TouchableOpacity
                      key={t._id}
                      onPress={() =>
                        router.push(`/finance/transaction/${t._id}`)
                      }
                    >
                      <Card style={styles.transactionCard}>
                        <View style={styles.txRow}>
                          <View
                            style={[
                              styles.categoryIcon,
                              {
                                backgroundColor:
                                  t.type === 'income'
                                    ? theme.colors.successBg
                                    : theme.colors.dangerBg,
                              },
                            ]}
                          >
                            <AppIcon
                              name={
                                t.type === 'income' ? 'arrow-down' : 'arrow-up'
                              }
                              size={18}
                              color={
                                t.type === 'income'
                                  ? theme.colors.success
                                  : theme.colors.danger
                              }
                            />
                          </View>
                          <View style={styles.txDetails}>
                            <Text
                              style={[
                                styles.txTitle,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              {t.title}
                            </Text>
                            <View style={styles.txMeta}>
                              <Text
                                style={[
                                  styles.txCategory,
                                  { color: theme.colors.textSecondary },
                                ]}
                              >
                                {t.category}
                              </Text>
                              <View
                                style={[
                                  styles.txDot,
                                  { backgroundColor: theme.colors.border },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.txPayment,
                                  { color: theme.colors.textSecondary },
                                ]}
                              >
                                {t.paymentMethod}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.txAmount,
                              {
                                color:
                                  t.type === 'income'
                                    ? theme.colors.success
                                    : theme.colors.textPrimary,
                              },
                            ]}
                          >
                            {t.type === 'income' ? '+' : '-'}
                            {formatCurrency(t.amount)}
                          </Text>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
            {isFetchingNextPage && (
              <View style={styles.loadingMoreContainer}>
                <GlobalLoader
                  variant="inline"
                  size="small"
                  color={theme.colors.primary}
                />
              </View>
            )}
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  searchCard: {
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  dateGroup: { marginBottom: 20 },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  transactionCard: {
    padding: 14,
    marginBottom: 10,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  txDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  txPayment: {
    fontSize: 12,
    fontWeight: '500',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
