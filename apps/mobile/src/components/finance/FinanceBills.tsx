import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { haptics } from '../../utils/haptics';
import {
  useInfiniteBills,
  usePayBill,
  useDeleteBill,
} from '../../hooks/useFinance';

import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { SearchBar } from '../ui/SearchBar';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import { AddBillModal } from './AddBillModal';
import { format, differenceInDays } from 'date-fns';
import type { Theme } from '../../theme';

const WEB = Platform.OS === 'web';

// Aligned with the new premium palette: Rose, Violet, Cyan, Amber, Green, Neutral
const CATEGORY_MAP: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  Utilities: { icon: 'zap', color: '#F59E0B', label: 'Utilities' },
  Subscriptions: { icon: 'tv', color: '#8B5CF6', label: 'Subscriptions' },
  Rent: { icon: 'home', color: '#06B6D4', label: 'Rent & Housing' },
  Food: { icon: 'utensils', color: '#F43F5E', label: 'Food & Dining' },
  Transport: { icon: 'car', color: '#06B6D4', label: 'Transport' },
  Insurance: { icon: 'shield', color: '#10B981', label: 'Insurance' },
  Other: { icon: 'file-text', color: '#71717A', label: 'Other' },
};

function getCategoryMeta(category?: string) {
  if (!category) return CATEGORY_MAP.Other;
  const lowerCat = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_MAP)) {
    if (lowerCat.includes(k.toLowerCase())) return v;
  }
  return CATEGORY_MAP.Other;
}

export function FinanceBills() {
  const theme = useTheme();
  const styles = billStyles(theme);
  const { isDesktop, width } = useResponsive();

  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'paid'>(
    'all',
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteBills({
    isActive: true,
    isPaid:
      statusFilter === 'paid'
        ? true
        : statusFilter === 'upcoming'
          ? false
          : undefined,
    category: categoryFilter === 'All' ? undefined : categoryFilter,
    search: debouncedSearch,
  });

  const { mutate: payBill, isPending: isPaying } = usePayBill();
  const { mutate: deleteBill } = useDeleteBill();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const bills: any[] = useMemo(() => {
    return (
      data?.pages?.flatMap(
        (page: any) => page?.bills || (Array.isArray(page) ? page : []),
      ) || []
    );
  }, [data]);

  const { totalMonthlyDue, pendingTotal, pendingCount, paidTotal, paidCount } =
    useMemo(() => {
      let monthlyDue = 0;
      let pending = 0;
      let pendingC = 0;
      let paid = 0;
      let paidC = 0;

      bills.forEach(b => {
        const amt = Number(b.amount) || 0;
        monthlyDue += amt;
        if (b.isPaid) {
          paid += amt;
          paidC += 1;
        } else {
          pending += amt;
          pendingC += 1;
        }
      });

      return {
        totalMonthlyDue: monthlyDue,
        pendingTotal: pending,
        pendingCount: pendingC,
        paidTotal: paid,
        paidCount: paidC,
      };
    }, [bills]);

  const handleAdd = useCallback(() => {
    setSelectedBill(null);
    setIsAddModalVisible(true);
    haptics.light();
  }, []);

  const handleEdit = useCallback((bill: any) => {
    setSelectedBill(bill);
    setIsAddModalVisible(true);
    haptics.light();
  }, []);

  const handlePay = useCallback(
    (id: string, title: string) => {
      if (WEB) {
        if (window.confirm(`Mark "${title}" as paid?`)) {
          payBill(
            { id },
            {
              onSuccess: () => {
                refetch();
              },
              onError: () => alert('Failed to mark bill as paid'),
            },
          );
        }
        return;
      }
      Alert.alert('Mark as Paid', `Did you pay "${title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            payBill(
              { id },
              {
                onSuccess: () => {
                  refetch();
                },
                onError: () =>
                  Alert.alert('Error', 'Failed to mark bill as paid'),
              },
            );
          },
        },
      ]);
    },
    [payBill, refetch],
  );

  const handleDelete = useCallback(
    (id: string, title: string) => {
      if (WEB) {
        if (window.confirm(`Delete "${title}"?`)) {
          deleteBill(id, { onSuccess: () => refetch() });
        }
        return;
      }
      Alert.alert('Delete Bill', `Delete "${title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBill(id, {
              onSuccess: () => {
                refetch();
              },
              onError: () => Alert.alert('Error', 'Failed to delete bill'),
            });
          },
        },
      ]);
    },
    [deleteBill, refetch],
  );

  const categories = [
    'All',
    'Utilities',
    'Subscriptions',
    'Rent',
    'Food',
    'Transport',
    'Insurance',
    'Other',
  ];

  if (isLoading && !refreshing) {
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
          style={{ marginTop: theme.spacing[3] }}
        >
          Loading recurring bills…
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 1. Top Summary Banner ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kpiGrid}
        style={{ marginVertical: theme.spacing[1] }}
      >
        <GlassCard
          variant="prominent"
          padding="md"
          style={styles.kpiCard}
          intensity={theme.isDark ? 30 : 60}
        >
          <View style={styles.kpiTopRow}>
            <View
              style={[
                styles.kpiIconBubble,
                { backgroundColor: 'rgba(6, 182, 212, 0.12)' },
              ]}
            >
              <AppIcon name="file-text" size={15} color="#06B6D4" />
            </View>
            <Badge label="TOTAL BILLS" variant="info" />
          </View>
          <Typography
            variant="h2"
            weight="extrabold"
            color="textPrimary"
            style={{ letterSpacing: -0.5 }}
          >
            {'\u20B9'}
            {totalMonthlyDue.toLocaleString('en-IN')}
          </Typography>
          <Typography variant="caption" color="textTertiary">
            {bills.length} active recurring bills
          </Typography>
        </GlassCard>

        <GlassCard
          variant="prominent"
          padding="md"
          style={styles.kpiCard}
          intensity={theme.isDark ? 30 : 60}
        >
          <View style={styles.kpiTopRow}>
            <View
              style={[
                styles.kpiIconBubble,
                { backgroundColor: 'rgba(244, 63, 94, 0.12)' },
              ]}
            >
              <AppIcon name="clock" size={15} color="#F43F5E" />
            </View>
            <Badge label="PENDING DUE" variant="danger" />
          </View>
          <Typography
            variant="h2"
            weight="extrabold"
            style={{
              letterSpacing: -0.5,
              color: pendingTotal > 0 ? '#F43F5E' : theme.colors.textPrimary,
            }}
          >
            {'\u20B9'}
            {pendingTotal.toLocaleString('en-IN')}
          </Typography>
          <Typography variant="caption" color="textTertiary">
            {pendingCount} bills pending payment
          </Typography>
        </GlassCard>

        <GlassCard
          variant="prominent"
          padding="md"
          style={styles.kpiCard}
          intensity={theme.isDark ? 30 : 60}
        >
          <View style={styles.kpiTopRow}>
            <View
              style={[
                styles.kpiIconBubble,
                { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
              ]}
            >
              <AppIcon name="check-circle" size={15} color="#10B981" />
            </View>
            <Badge label="CLEARED THIS CYCLE" variant="success" />
          </View>
          <Typography
            variant="h2"
            weight="extrabold"
            style={{ letterSpacing: -0.5, color: '#10B981' }}
          >
            {'\u20B9'}
            {paidTotal.toLocaleString('en-IN')}
          </Typography>
          <Typography variant="caption" color="textTertiary">
            {paidCount} bills marked as paid
          </Typography>
        </GlassCard>
      </ScrollView>

      {/* ─── 2. Action & Filter Bar ─── */}
      <View style={styles.toolbarRow}>
        {/* Status Pill Filters */}
        <View
          style={[
            styles.segmentedPillGroup,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
              borderWidth: 1,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          {(['all', 'upcoming', 'paid'] as const).map(st => {
            const isActive = statusFilter === st;
            return (
              <Pressable
                key={st}
                onPress={() => {
                  haptics.light();
                  setStatusFilter(st);
                }}
                style={[
                  styles.segmentBtn,
                  isActive && {
                    backgroundColor: '#2563EB',
                    shadowColor: '#2563EB',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  weight={isActive ? 'bold' : 'semibold'}
                  style={{
                    color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                  }}
                >
                  {st === 'all'
                    ? 'All Bills'
                    : st === 'upcoming'
                      ? 'Pending Due'
                      : 'Paid'}
                </Typography>
              </Pressable>
            );
          })}
        </View>

        {/* Add Bill Button */}
        <Pressable
          onPress={handleAdd}
          style={[
            styles.addBtn,
            {
              backgroundColor: '#2563EB',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
        >
          <AppIcon name="plus" size={15} color="#FFF" />
          <Typography
            variant="caption"
            weight="bold"
            style={{ color: '#FFFFFF' }}
          >
            Add Bill
          </Typography>
        </Pressable>
      </View>

      {/* ─── 3. Category Horizontal Pills ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map(cat => {
          const selected = categoryFilter === cat;
          const meta = getCategoryMeta(cat);
          return (
            <Pressable
              key={cat}
              onPress={() => {
                haptics.light();
                setCategoryFilter(cat);
              }}
              style={[
                styles.categoryChip,
                selected
                  ? {
                      backgroundColor: '#2563EB',
                      borderColor: '#1D4ED8',
                      shadowColor: '#2563EB',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2,
                    }
                  : {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.03)',
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                    },
              ]}
            >
              {cat !== 'All' && (
                <AppIcon
                  name={meta.icon as any}
                  size={12}
                  color={selected ? '#FFFFFF' : theme.colors.textSecondary}
                />
              )}
              <Typography
                variant="caption"
                weight={selected ? 'bold' : 'semibold'}
                style={{
                  color: selected ? '#FFFFFF' : theme.colors.textSecondary,
                }}
              >
                {cat}
              </Typography>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ─── 4. Search Bar ─── */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
        placeholder="Search by bill name or category..."
      />

      {/* ─── 5. Bills List Grid ─── */}
      {bills.length === 0 ? (
        <EmptyState
          icon="file-text"
          title="No Bills Found"
          description="Create your recurring subscriptions, utilities, and rent to keep track of payment deadlines."
          actionLabel="Add First Bill"
          onAction={handleAdd}
        />
      ) : (
        <View style={styles.billsListGrid}>
          {bills.map((bill, index) => {
            const meta = getCategoryMeta(bill.category);
            const isOverdue =
              !bill.isPaid && new Date(bill.dueDate) < new Date();
            const daysLeft = differenceInDays(
              new Date(bill.dueDate),
              new Date(),
            );

            let dueLabel = '';
            let dueColor = theme.colors.textTertiary;
            if (bill.isPaid) {
              dueLabel = `Paid (${bill.paidAt ? format(new Date(bill.paidAt), 'MMM d') : 'Cleared'})`;
              dueColor = theme.colors.success;
            } else if (isOverdue) {
              dueLabel = `Overdue by ${Math.abs(daysLeft)} days`;
              dueColor = theme.colors.danger;
            } else if (daysLeft === 0) {
              dueLabel = 'Due Today';
              dueColor = theme.colors.warning;
            } else {
              dueLabel = `Due in ${daysLeft} days (${format(new Date(bill.dueDate), 'MMM d')})`;
              dueColor =
                daysLeft <= 3
                  ? theme.colors.warning
                  : theme.colors.textSecondary;
            }

            return (
              <Animated.View
                key={bill._id || index}
                entering={FadeInDown.delay(index * 30)}
                layout={Layout.springify()}
                style={styles.billCardWrap}
              >
                <GlassCard
                  variant="prominent"
                  padding="none"
                  style={styles.billCard}
                  intensity={theme.isDark ? 30 : 60}
                >
                  <View style={styles.billCardInner}>
                    {/* Top Row: Icon + Title + Status */}
                    <View style={styles.billTopRow}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing[3],
                          flex: 1,
                        }}
                      >
                        <View
                          style={[
                            styles.billIconBox,
                            {
                              backgroundColor: `${meta.color}18`,
                              borderColor: `${meta.color}35`,
                            },
                          ]}
                        >
                          <AppIcon
                            name={meta.icon as any}
                            size={16}
                            color={meta.color}
                          />
                        </View>
                        <View style={{ flex: 1, gap: theme.spacing[1] }}>
                          <Typography
                            variant="body"
                            weight="bold"
                            color="textPrimary"
                            numberOfLines={1}
                          >
                            {bill.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textTertiary"
                            numberOfLines={1}
                          >
                            {meta.label} •{' '}
                            {bill.frequency
                              ? bill.frequency.toUpperCase()
                              : 'MONTHLY'}
                          </Typography>
                        </View>
                      </View>

                      <Badge
                        label={
                          bill.isPaid
                            ? 'PAID'
                            : isOverdue
                              ? 'OVERDUE'
                              : 'UPCOMING'
                        }
                        variant={
                          bill.isPaid
                            ? 'success'
                            : isOverdue
                              ? 'danger'
                              : 'warning'
                        }
                      />
                    </View>

                    {/* Middle Row: Amount & Due Date */}
                    <View style={styles.billMiddleRow}>
                      <View>
                        <Typography
                          variant="h3"
                          weight="extrabold"
                          style={{
                            letterSpacing: -0.5,
                            color: bill.isPaid
                              ? theme.colors.success
                              : theme.colors.textPrimary,
                          }}
                        >
                          {'\u20B9'}
                          {Number(bill.amount || 0).toLocaleString('en-IN')}
                        </Typography>
                        <Typography
                          variant="caption"
                          weight="semibold"
                          style={{
                            color: dueColor,
                            marginTop: theme.spacing[1],
                          }}
                        >
                          {dueLabel}
                        </Typography>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.billActionsRow}>
                        {!bill.isPaid && (
                          <Pressable
                            onPress={() => handlePay(bill._id, bill.title)}
                            style={[
                              styles.payBtn,
                              { backgroundColor: theme.colors.primary },
                            ]}
                          >
                            <AppIcon name="check" size={13} color="#FFF" />
                            <Typography
                              variant="caption"
                              weight="bold"
                              color="textInverse"
                            >
                              Pay
                            </Typography>
                          </Pressable>
                        )}

                        <Pressable
                          onPress={() => handleEdit(bill)}
                          style={[
                            styles.iconActionBtn,
                            {
                              backgroundColor: theme.isDark
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(0,0,0,0.04)',
                            },
                          ]}
                          hitSlop={8}
                        >
                          <AppIcon
                            name="pencil"
                            size={13}
                            color={theme.colors.textSecondary}
                          />
                        </Pressable>

                        <Pressable
                          onPress={() => handleDelete(bill._id, bill.title)}
                          style={[
                            styles.iconActionBtn,
                            { backgroundColor: 'rgba(244, 63, 94, 0.12)' },
                          ]}
                          hitSlop={8}
                        >
                          <AppIcon name="trash-2" size={13} color="#F43F5E" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Add / Edit Bill Modal */}
      {isAddModalVisible && (
        <AddBillModal
          visible={isAddModalVisible}
          onClose={() => setIsAddModalVisible(false)}
          initialBill={selectedBill}
          onSuccess={() => {
            setIsAddModalVisible(false);
            refetch();
          }}
        />
      )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

function billStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing[4],
      width: '100%',
    },
    centerContainer: {
      padding: theme.spacing[10],
      alignItems: 'center',
      justifyContent: 'center',
    },
    kpiGrid: {
      flexDirection: 'row',
      gap: theme.spacing[3],
      paddingRight: theme.spacing[4],
      paddingVertical: theme.spacing[1],
    },
    kpiCard: {
      minWidth: 260,
      flex: 1,
      borderRadius: theme.borderRadius['2xl'],
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      paddingHorizontal: 20,
      paddingVertical: 16,
      justifyContent: 'space-between',
      gap: theme.spacing[2],

      ...Platform.select({
        web: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
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
    kpiTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 2,
    },
    kpiIconBubble: {
      width: 34,
      height: 34,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolbarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing[3],
    },
    segmentedPillGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing[1],
      gap: theme.spacing[1],
    },
    segmentBtn: {
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      borderRadius: theme.borderRadius.md,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      borderRadius: theme.borderRadius.lg,
    },
    categoryScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
      paddingVertical: theme.spacing[1],
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      gap: theme.spacing[2],
    },
    billsListGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[3],
    },
    billCardWrap: {
      width: '100%',
    },
    billCard: {
      borderRadius: theme.borderRadius['2xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(255,255,255,0.2)',
    },
    billCardInner: {
      padding: theme.spacing[4],
      gap: theme.spacing[4],
    },
    billTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    billIconBox: {
      width: 36,
      height: 36,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    billMiddleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingTop: theme.spacing[3],
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    billActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
    },
    payBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[1],
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      borderRadius: theme.borderRadius.md,
    },
    iconActionBtn: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
