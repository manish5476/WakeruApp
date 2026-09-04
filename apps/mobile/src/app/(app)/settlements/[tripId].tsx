// app/(app)/settlements.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  Pressable,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { Avatar } from '../../../components/ui/Avatar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { useSocket } from '../../../hooks/useSocket';
import {
  useSettlement,
  useCalculateSettlement,
  useInitiatePayment,
  useConfirmTransaction,
  useDisputePayment,
  useSettleSingle,
  useRejectPayment,
  useRemindPayer,
  useTrip,
  useTripExpenses,
  useTripSummary,
  useSettlementHistory,
  useSettleAll,
} from '../../../hooks';
import { formatCurrency } from '../../../utils/formatters';
import { haptics } from '../../../utils/haptics';
import { openUPIApp } from '../../../utils/upi';
import { settlementsApi } from '../../../services/api/settlements.api';
import type { Theme } from '../../../theme';

const CATEGORY_ICONS: Record<string, string> = {
  food: 'utensils',
  stay: 'hotel',
  transport: 'car',
  activity: 'compass',
  shopping: 'shopping-bag',
  health: 'heart-pulse',
  other: 'file-text',
};

export default function SettlementScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { user, firebaseUser } = useAuthStore();
  const { subscribeToTrip, unsubscribeFromTrip } = useSocket();

  const isDesktop = width >= 860;
  const styles = useMemo(
    () => createStyles(theme, isDesktop),
    [theme, isDesktop],
  );

  React.useEffect(() => {
    if (tripId) {
      subscribeToTrip(tripId);
      return () => unsubscribeFromTrip(tripId);
    }
  }, [tripId, subscribeToTrip, unsubscribeFromTrip]);

  // Queries
  const { data: trip } = useTrip(tripId);
  const { data: summaryData, refetch: refetchSummary } = useTripSummary(tripId);
  const {
    data: settlementData,
    isLoading,
    refetch: refetchSettlement,
  } = useSettlement(tripId);
  const { data: expensesData, refetch: refetchExpenses } = useTripExpenses(
    tripId,
    { isSettled: 'false' },
  );

  const { mutate: calculateSettlement, isPending: isCalculating } =
    useCalculateSettlement();
  const { mutate: initiatePayment } = useInitiatePayment();
  const { mutate: confirmTransaction } = useConfirmTransaction();
  const { mutate: disputePayment } = useDisputePayment();
  const { mutate: settleAll, isPending: isSettlingAll } = useSettleAll();
  const { mutate: settleSingle } = useSettleSingle();
  const { mutate: rejectPayment } = useRejectPayment();
  const { mutate: remindPayer } = useRemindPayer();

  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedTxn, setExpandedTxn] = useState<string | null>(null);

  // Rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingTxnId, setRejectingTxnId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: historyData, isLoading: isLoadingHistory } =
    useSettlementHistory(tripId, { enabled: showHistory });
  const settlementHistory = useMemo(() => {
    if (Array.isArray(historyData)) return historyData;
    if (Array.isArray((historyData as any)?.data))
      return (historyData as any).data;
    if (Array.isArray((historyData as any)?.history))
      return (historyData as any).history;
    return [];
  }, [historyData]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    haptics.selection();
    try {
      await Promise.all([
        refetchSettlement(),
        refetchSummary(),
        refetchExpenses(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchSettlement, refetchSummary, refetchExpenses]);

  const settlement = settlementData?.settlement;
  const transactions = settlement?.transactions || [];
  const allExpenses =
    (expensesData as any)?.expenses ||
    (Array.isArray(expensesData) ? expensesData : []);
  const summaryMembers = summaryData?.summary?.members || [];
  const baseCurrency = settlement?.baseCurrency || trip?.baseCurrency || 'INR';

  // Identity resolution
  const currentUids = useMemo(
    () =>
      new Set(
        [
          user?.firebaseUid,
          user?._id,
          (user as any)?.uid,
          (user as any)?.id,
          firebaseUser?.uid,
        ]
          .filter(Boolean)
          .map(id => String(id).trim()),
      ),
    [user, firebaseUser],
  );

  const currentDisplayName = user?.displayName?.trim().toLowerCase() || '';

  const getParticipantId = (p: any): string => {
    if (!p) return '';
    if (typeof p === 'string') return p.trim();
    return String(
      p.firebaseUid || p.userId || p._id || p.uid || p.id || '',
    ).trim();
  };

  const isToMe = useCallback(
    (t: any): boolean => {
      const toId = getParticipantId(t.to);
      if (toId && currentUids.has(toId)) return true;
      if (
        t.toName &&
        currentDisplayName &&
        String(t.toName).trim().toLowerCase() === currentDisplayName
      ) {
        return true;
      }
      return false;
    },
    [currentUids, currentDisplayName],
  );

  const isFromMe = useCallback(
    (t: any): boolean => {
      const fromId = getParticipantId(t.from);
      if (fromId && currentUids.has(fromId)) return true;
      if (
        t.fromName &&
        currentDisplayName &&
        String(t.fromName).trim().toLowerCase() === currentDisplayName
      ) {
        return true;
      }
      return false;
    },
    [currentUids, currentDisplayName],
  );

  const youPay = useMemo(
    () => transactions.filter((t: any) => isFromMe(t)),
    [transactions, isFromMe],
  );
  const youReceive = useMemo(
    () => transactions.filter((t: any) => isToMe(t)),
    [transactions, isToMe],
  );
  const others = useMemo(
    () => transactions.filter((t: any) => !isFromMe(t) && !isToMe(t)),
    [transactions, isFromMe, isToMe],
  );

  const totalYouPay = useMemo(
    () => youPay.reduce((s: number, t: any) => s + t.amountBase, 0),
    [youPay],
  );
  const totalYouReceive = useMemo(
    () => youReceive.reduce((s: number, t: any) => s + t.amountBase, 0),
    [youReceive],
  );
  const netBalance = totalYouReceive - totalYouPay;

  // Breakdown mapping
  const breakdownsByTxnKey = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        title: string;
        category: string;
        amount: number;
        date: string;
        stopName: string;
      }>
    >();
    if (!allExpenses.length || !transactions.length) return map;

    for (const txn of transactions) {
      const list = allExpenses
        .filter((exp: any) => {
          const toId = getParticipantId(txn.to);
          const fromId = getParticipantId(txn.from);
          const isPayer = getParticipantId(exp.paidBy) === toId;
          const isDebtor = exp.splits?.some(
            (s: any) => getParticipantId(s.userId) === fromId && !s.isPaid,
          );
          return isPayer && isDebtor;
        })
        .map((exp: any) => {
          const fromId = getParticipantId(txn.from);
          const split = exp.splits?.find(
            (s: any) => getParticipantId(s.userId) === fromId,
          );
          const stop = trip?.stops?.find((s: any) => s._id === exp.stopId);
          return {
            title: exp.title,
            category: exp.category,
            amount: split?.amountBase || 0,
            date: exp.date,
            stopName: stop?.name || '',
          };
        });
      map.set(`${txn.from}:${txn.to}`, list);
    }
    return map;
  }, [allExpenses, transactions, trip?.stops]);

  const getBreakdown = useCallback(
    (txn: any) => {
      return breakdownsByTxnKey.get(`${txn.from}:${txn.to}`) || [];
    },
    [breakdownsByTxnKey],
  );

  // Actions
  const handleCalculate = () => {
    haptics.selection();
    calculateSettlement(tripId, {
      onSuccess: () => refreshData(),
    });
  };

  const handlePay = (txnId: string) => {
    haptics.success();
    initiatePayment(
      { tripId, transactionId: txnId },
      {
        onSuccess: (data: any) => {
          refreshData();
          if (data?.upiDeepLink) {
            Alert.alert('Open UPI', 'Complete payment via preferred UPI app?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Pay Now', onPress: () => openUPIApp(data.upiDeepLink) },
            ]);
          }
        },
        onError: (error: any) => {
          Alert.alert(
            'Payment Notice',
            error.message || 'Could not launch payment gateway.',
          );
        },
      },
    );
  };

  const handleMarkPaid = (txnId: string) => {
    haptics.success();
    settleSingle(
      { tripId, transactionId: txnId },
      {
        onSuccess: () => {
          refreshData();
          Alert.alert(
            'Payment Marked',
            'Payment marked as sent. Waiting for confirmation.',
          );
        },
        onError: (error: any) => {
          Alert.alert(
            'Notice',
            error.message || 'Failed to update payment status.',
          );
        },
      },
    );
  };

  const handleConfirm = (txnId: string) => {
    haptics.success();
    confirmTransaction(
      { tripId, transactionId: txnId },
      {
        onSuccess: () => {
          refreshData();
          Alert.alert('Confirmed', 'Transfer confirmed and balance cleared.');
        },
        onError: (error: any) => {
          Alert.alert('Notice', error.message || 'Failed to confirm transfer.');
        },
      },
    );
  };

  const promptReject = (txnId: string) => {
    setRejectingTxnId(txnId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleExecuteReject = () => {
    if (!rejectingTxnId) return;
    const reason =
      rejectReason.trim() || 'Payment not verified in bank account';
    setRejectModalVisible(false);
    haptics.warning();

    rejectPayment(
      { tripId, transactionId: rejectingTxnId, reason },
      {
        onSuccess: () => {
          refreshData();
          Alert.alert('Payment Rejected', 'Payer notified to retry payment.');
        },
        onError: (error: any) => {
          Alert.alert('Notice', error.message || 'Failed to reject payment.');
        },
      },
    );
  };

  const handleRemind = (txnId: string) => {
    haptics.selection();
    remindPayer(
      { tripId, transactionId: txnId },
      {
        onSuccess: () => {
          Alert.alert(
            'Reminder Dispatched',
            'A gentle reminder was sent to the payer.',
          );
        },
        onError: (error: any) => {
          Alert.alert(
            'Cooldown Active',
            error.message || 'Please wait before sending another ping.',
          );
        },
      },
    );
  };

  const handleSettleAll = () => {
    haptics.success();
    const msg =
      'Mark all your outstanding payments as sent? Recipients will be notified to confirm.';

    const execute = () => {
      settleAll(
        { tripId },
        {
          onSuccess: () => {
            refreshData();
            Alert.alert('Success', 'All transfers marked as sent.');
          },
          onError: (error: any) => {
            Alert.alert(
              'Notice',
              error.message || 'Failed to initiate bulk settlement.',
            );
          },
        },
      );
    };

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) execute();
    } else {
      Alert.alert('Settle All Balances', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: execute },
      ]);
    }
  };

  const handleDispute = (txnId: string) => {
    haptics.warning();
    Alert.alert(
      'Dispute Settlement',
      'Flag this calculation for manual review by the group admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag Dispute',
          style: 'destructive',
          onPress: () =>
            disputePayment(
              { tripId, transactionId: txnId },
              {
                onSuccess: () => refreshData(),
                onError: (error: any) =>
                  Alert.alert(
                    'Notice',
                    error.message || 'Could not flag dispute.',
                  ),
              },
            ),
        },
      ],
    );
  };

  const handleExport = async () => {
    haptics.selection();
    try {
      const res = await settlementsApi.exportSettlement(tripId, 'csv');
      if (Platform.OS === 'web') {
        if (res.data?.url) {
          window.open(res.data.url, '_blank');
        } else if (res.data) {
          const blob = new Blob([res.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `trip_${tripId}_settlements.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      } else {
        Alert.alert(
          'Export Ready',
          'Your settlement CSV report has been generated.',
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Notice',
        err.message || 'Could not generate settlement export.',
      );
    }
  };

  if (isLoading) {
    return (
      <GlobalBackground>
        <View style={styles.loadingContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Computing debt-minimization settlement paths…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  const memberCount = trip?.members?.filter((m: any) => m.isActive).length || 0;
  const maxTransfers = Math.max(0, memberCount - 1);
  const hasUninitiatedOutgoing = youPay.some(
    (t: any) => t.status === 'pending' || t.status === 'rejected',
  );

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Sticky Header Bar */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10 },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.iconBtn,
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
                Trip Settlements
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                {trip?.title || 'Trip'} · Optimal transfer matrix
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowHistory(true)}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="clock"
                size={15}
                color={theme.colors.textSecondary}
              />
            </Pressable>

            <Pressable
              onPress={handleExport}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="download"
                size={15}
                color={theme.colors.textSecondary}
              />
            </Pressable>

            <Pressable
              onPress={refreshData}
              disabled={isRefreshing || isCalculating}
              style={({ pressed }) => [
                styles.iconBtn,
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
          </View>
        </View>
      </View>

      {/* Main Content Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.mainWrapper}>
          {/* ── 2-COLUMN DESKTOP SPLIT / STACK ON MOBILE ── */}
          <View
            style={[styles.bentoSplitRow, !isDesktop && styles.stackLayout]}
          >
            {/* ── LEFT COLUMN: BALANCE SUMMARY & GROUP STANDINGS ── */}
            <View style={[styles.bentoCol, isDesktop && { flex: 1.1 }]}>
              {/* Executive Net Balance Hero Card */}
              <LinearGradient
                colors={['#0F172A', '#1E1B4B', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceHeroCard}
              >
                <View style={styles.balanceTopRow}>
                  <View>
                    <Text style={styles.balanceHeroLabel}>
                      PERSONAL STANDING
                    </Text>
                    <Text
                      style={[
                        styles.balanceHeroAmount,
                        {
                          color:
                            netBalance === 0
                              ? '#FFFFFF'
                              : netBalance > 0
                                ? '#34D399'
                                : '#F87171',
                        },
                      ]}
                    >
                      {netBalance === 0 ? '' : netBalance > 0 ? '+' : '−'}
                      {formatCurrency(Math.abs(netBalance), baseCurrency)}
                    </Text>
                    <Text style={styles.balanceHeroSub}>
                      {netBalance === 0
                        ? 'All personal balances are cleared'
                        : netBalance > 0
                          ? 'Total amount to be received'
                          : 'Total amount you owe to the crew'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.standingPill,
                      {
                        backgroundColor:
                          netBalance === 0
                            ? 'rgba(255,255,255,0.1)'
                            : netBalance > 0
                              ? 'rgba(16,185,129,0.2)'
                              : 'rgba(239,68,68,0.2)',
                      },
                    ]}
                  >
                    <AppIcon
                      name={
                        netBalance === 0
                          ? 'check-circle'
                          : netBalance > 0
                            ? 'arrow-up-right'
                            : 'arrow-down-left'
                      }
                      size={12}
                      color={
                        netBalance === 0
                          ? '#FFF'
                          : netBalance > 0
                            ? '#10B981'
                            : '#EF4444'
                      }
                    />
                    <Text
                      style={[
                        styles.standingPillText,
                        {
                          color:
                            netBalance === 0
                              ? '#FFF'
                              : netBalance > 0
                                ? '#10B981'
                                : '#EF4444',
                        },
                      ]}
                    >
                      {netBalance === 0
                        ? 'Settled'
                        : netBalance > 0
                          ? 'To Receive'
                          : 'To Pay'}
                    </Text>
                  </View>
                </View>

                {/* Settle All Action */}
                {hasUninitiatedOutgoing && (
                  <Pressable
                    onPress={handleSettleAll}
                    disabled={isSettlingAll}
                    style={styles.settleAllBtn}
                  >
                    <AppIcon name="send" size={14} color="#FFFFFF" />
                    <Text style={styles.settleAllBtnText}>
                      {isSettlingAll
                        ? 'Processing Transfers...'
                        : 'Mark All My Outgoing Payments as Sent'}
                    </Text>
                  </Pressable>
                )}
              </LinearGradient>

              {/* Group Balances Horizontal Strip */}
              {summaryMembers.length > 0 && (
                <View
                  style={[
                    styles.panelCard,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <View style={styles.panelHeader}>
                    <View
                      style={[
                        styles.panelIconWrap,
                        { backgroundColor: '#EFF6FF' },
                      ]}
                    >
                      <AppIcon name="users" size={16} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.panelTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        Group Standings
                      </Text>
                      <Text
                        style={[
                          styles.panelSub,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Crew balances before optimization
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.groupScroll}
                  >
                    {summaryMembers.map((m: any) => {
                      const isPositive = m.netBalance >= 0;
                      return (
                        <View
                          key={m.userId}
                          style={[
                            styles.memberTile,
                            { backgroundColor: theme.colors.background },
                          ]}
                        >
                          <Avatar
                            fallback={
                              m.displayName
                                ? m.displayName.charAt(0).toUpperCase()
                                : '?'
                            }
                            size="md"
                          />
                          <Text
                            style={[
                              styles.memberName,
                              { color: theme.colors.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {m.displayName || 'Member'}
                          </Text>
                          <Text
                            style={[
                              styles.memberAmount,
                              { color: isPositive ? '#10B981' : '#EF4444' },
                            ]}
                          >
                            {isPositive ? '+' : ''}
                            {formatCurrency(
                              Math.abs(m.netBalance),
                              baseCurrency,
                            )}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Algorithm Explanation Panel */}
              <View
                style={[
                  styles.panelCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Pressable
                  onPress={() => setShowHowItWorks(!showHowItWorks)}
                  style={styles.helpToggleRow}
                >
                  <View
                    style={[
                      styles.panelIconWrap,
                      { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <AppIcon name="help-circle" size={16} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.panelTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Debt Minimization Engine
                    </Text>
                    <Text
                      style={[
                        styles.panelSub,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      How settlements are calculated
                    </Text>
                  </View>
                  <AppIcon
                    name={showHowItWorks ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                </Pressable>

                {showHowItWorks && (
                  <View
                    style={[
                      styles.helpContent,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.helpText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Rather than having {memberCount} travelers exchange dozens
                      of micro-transactions, our algorithm computes the
                      mathematical minimum required transfers.
                    </Text>
                    <Text
                      style={[
                        styles.helpText,
                        { color: theme.colors.textSecondary, marginTop: 6 },
                      ]}
                    >
                      This trip is completely settled with at most{' '}
                      <Text
                        style={{
                          fontWeight: '800',
                          color: theme.colors.primary,
                        }}
                      >
                        {maxTransfers} direct transfer
                        {maxTransfers !== 1 ? 's' : ''}
                      </Text>
                      .
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── RIGHT COLUMN: OPTIMIZED TRANSFER PATHS ── */}
            <View style={[styles.bentoCol, isDesktop && { flex: 1.4 }]}>
              {/* YOU NEED TO PAY */}
              {youPay.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionHeading, { color: '#EF4444' }]}>
                    YOUR OUTGOING PAYMENTS ({youPay.length})
                  </Text>
                  {youPay.map((txn: any, idx: number) => (
                    <Animated.View
                      key={txn._id}
                      entering={FadeInDown.delay(idx * 30)
                        .springify()
                        .damping(18)}
                      layout={Layout.springify()}
                    >
                      <BentoPaymentCard
                        txn={txn}
                        type="pay"
                        breakdown={getBreakdown(txn)}
                        expanded={expandedTxn === txn._id}
                        onToggle={() =>
                          setExpandedTxn(
                            expandedTxn === txn._id ? null : txn._id,
                          )
                        }
                        onPay={() => handlePay(txn._id)}
                        onMarkPaid={() => handleMarkPaid(txn._id)}
                        onConfirm={() => {}}
                        onReject={() => {}}
                        onRemind={() => {}}
                        onDispute={() => handleDispute(txn._id)}
                        baseCurrency={baseCurrency}
                        styles={styles}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* YOU WILL RECEIVE */}
              {youReceive.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionHeading, { color: '#10B981' }]}>
                    INCOMING PAYMENTS TO CONFIRM ({youReceive.length})
                  </Text>
                  {youReceive.map((txn: any, idx: number) => (
                    <Animated.View
                      key={txn._id}
                      entering={FadeInDown.delay(idx * 30)
                        .springify()
                        .damping(18)}
                      layout={Layout.springify()}
                    >
                      <BentoPaymentCard
                        txn={txn}
                        type="receive"
                        breakdown={getBreakdown(txn)}
                        expanded={expandedTxn === txn._id}
                        onToggle={() =>
                          setExpandedTxn(
                            expandedTxn === txn._id ? null : txn._id,
                          )
                        }
                        onPay={() => {}}
                        onMarkPaid={() => {}}
                        onConfirm={() => handleConfirm(txn._id)}
                        onReject={() => promptReject(txn._id)}
                        onRemind={() => handleRemind(txn._id)}
                        onDispute={() => handleDispute(txn._id)}
                        baseCurrency={baseCurrency}
                        styles={styles}
                      />
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* OTHER GROUP TRANSFERS */}
              {others.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text
                    style={[
                      styles.sectionHeading,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    OTHER CREW TRANSFERS ({others.length})
                  </Text>
                  <View
                    style={[
                      styles.othersPanel,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    {others.map((txn: any) => (
                      <View key={txn._id} style={styles.otherRow}>
                        <View style={styles.otherFlowGroup}>
                          <Text
                            style={[
                              styles.otherParticipant,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            {txn.fromName
                              ? txn.fromName.split(' ')[0]
                              : 'Member'}
                          </Text>
                          <AppIcon
                            name="arrow-right"
                            size={13}
                            color={theme.colors.textTertiary}
                          />
                          <Text
                            style={[
                              styles.otherParticipant,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            {txn.toName ? txn.toName.split(' ')[0] : 'Member'}
                          </Text>
                        </View>

                        <View style={styles.otherRightGroup}>
                          <Text
                            style={[
                              styles.otherAmountText,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            {formatCurrency(
                              txn.amountBase,
                              txn.baseCurrency || baseCurrency,
                            )}
                          </Text>
                          <View
                            style={[
                              styles.statusPill,
                              {
                                backgroundColor:
                                  txn.status === 'confirmed'
                                    ? 'rgba(16,185,129,0.12)'
                                    : txn.status === 'initiated'
                                      ? 'rgba(245,158,11,0.12)'
                                      : 'rgba(113,113,122,0.1)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                {
                                  color:
                                    txn.status === 'confirmed'
                                      ? '#059669'
                                      : txn.status === 'initiated'
                                        ? '#D97706'
                                        : theme.colors.textSecondary,
                                },
                              ]}
                            >
                              {txn.status === 'initiated' ? 'Sent' : txn.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* EMPTY STATE */}
              {transactions.length === 0 && (
                <EmptyState
                  icon="🎉"
                  title="All Balances Settled"
                  description="No outstanding settlement transfers required for this expedition."
                  actionLabel="Recalculate Balances"
                  onAction={handleCalculate}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* REJECT PAYMENT MODAL */}
      <Modal
        visible={rejectModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: theme.colors.textPrimary }]}
            >
              Reject Payment Claim
            </Text>
            <Text
              style={[styles.modalSub, { color: theme.colors.textSecondary }]}
            >
              Let the payer know why this payment wasn't confirmed so they can
              retry.
            </Text>

            <TextInput
              style={[
                styles.reasonInput,
                {
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background,
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
              placeholder="e.g. Funds not reflected in bank account yet..."
              placeholderTextColor={theme.colors.textTertiary}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setRejectModalVisible(false)}
                style={[
                  styles.modalCancelBtn,
                  { borderColor: theme.colors.borderLight },
                ]}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleExecuteReject}
                style={[styles.modalConfirmBtn, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.modalConfirmText}>Reject Claim</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* TIMELINE HISTORY MODAL */}
      <Modal
        visible={showHistory}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowHistory(false)}
          />
          <View
            style={[
              styles.historyModalCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.historyModalHeader}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <View
                  style={[styles.panelIconWrap, { backgroundColor: '#EFF6FF' }]}
                >
                  <AppIcon name="clock" size={16} color="#2563EB" />
                </View>
                <View>
                  <Text
                    style={[
                      styles.panelTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Settlement Timeline
                  </Text>
                  <Text
                    style={[
                      styles.panelSub,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {settlementHistory.length} recorded audit events
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setShowHistory(false)}
                hitSlop={8}
                style={styles.modalCloseCircle}
              >
                <AppIcon
                  name="x"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.historyScroll}
            >
              {isLoadingHistory ? (
                <View style={styles.historyLoadingBox}>
                  <GlobalLoader
                    variant="inline"
                    size="small"
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{ fontSize: 13, color: theme.colors.textSecondary }}
                  >
                    Fetching event timeline...
                  </Text>
                </View>
              ) : settlementHistory.length === 0 ? (
                <View style={styles.historyEmptyBox}>
                  <AppIcon
                    name="calendar"
                    size={28}
                    color={theme.colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: theme.colors.textPrimary, marginTop: 8 },
                    ]}
                  >
                    No Settlement Events
                  </Text>
                  <Text
                    style={[
                      styles.emptySub,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    Transfers, confirmations, and re-calculations will appear
                    here.
                  </Text>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {settlementHistory.map((h: any, idx: number) => {
                    const isConfirmed = h.action === 'payment_confirmed';
                    const isInitiated =
                      h.action === 'payment_initiated' ||
                      h.action === 'settle_all_initiated';
                    const isRejected = h.action === 'payment_rejected';
                    const isDisputed = h.action === 'payment_disputed';
                    const isCalculated = h.action === 'calculated';

                    const iconName = isConfirmed
                      ? 'check-circle'
                      : isInitiated
                        ? 'send'
                        : isRejected
                          ? 'x-circle'
                          : isDisputed
                            ? 'alert-triangle'
                            : isCalculated
                              ? 'zap'
                              : 'clock';

                    const iconColor = isConfirmed
                      ? '#10B981'
                      : isInitiated
                        ? '#2563EB'
                        : isRejected
                          ? '#EF4444'
                          : isDisputed
                            ? '#F59E0B'
                            : isCalculated
                              ? '#06B6D4'
                              : theme.colors.textSecondary;

                    const actionLabel =
                      h.action === 'calculated'
                        ? 'Balances Recalculated'
                        : h.action === 'payment_initiated'
                          ? 'Payment Dispatched'
                          : h.action === 'settle_all_initiated'
                            ? 'Bulk Payments Dispatched'
                            : h.action === 'payment_confirmed'
                              ? 'Payment Confirmed'
                              : h.action === 'payment_rejected'
                                ? 'Payment Rejected'
                                : h.action === 'payment_disputed'
                                  ? 'Dispute Flagged'
                                  : h.action;

                    return (
                      <View key={idx} style={styles.timelineItem}>
                        <View
                          style={[
                            styles.timelineIconAura,
                            { backgroundColor: `${iconColor}15` },
                          ]}
                        >
                          <AppIcon
                            name={iconName as any}
                            size={13}
                            color={iconColor}
                          />
                        </View>
                        <View
                          style={[
                            styles.timelineCard,
                            { backgroundColor: theme.colors.background },
                          ]}
                        >
                          <View style={styles.timelineCardTop}>
                            <Text
                              style={[
                                styles.timelineActionTitle,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              {actionLabel}
                            </Text>
                            {h.amount ? (
                              <Text
                                style={[
                                  styles.timelineAmountText,
                                  { color: iconColor },
                                ]}
                              >
                                {formatCurrency(
                                  Number(h.amount) || 0,
                                  baseCurrency,
                                )}
                              </Text>
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.timelineDateText,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            By {h.actorName || 'System'} ·{' '}
                            {h.timestamp
                              ? format(new Date(h.timestamp), 'MMM d, h:mm a')
                              : 'Recent'}
                          </Text>
                          {h.metadata?.reason ? (
                            <Text
                              style={[
                                styles.timelineReasonText,
                                { color: theme.colors.danger },
                              ]}
                            >
                              Reason: {h.metadata.reason}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Bento Payment Card Sub-Component ────────────────────────
function BentoPaymentCard({
  txn,
  type,
  breakdown,
  expanded,
  onToggle,
  onPay,
  onMarkPaid,
  onConfirm,
  onReject,
  onRemind,
  onDispute,
  baseCurrency,
  styles,
}: {
  txn: any;
  type: 'pay' | 'receive';
  breakdown: any[];
  expanded: boolean;
  onToggle: () => void;
  onPay: () => void;
  onMarkPaid: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onRemind: () => void;
  onDispute: () => void;
  baseCurrency: string;
  styles: any;
}) {
  const theme = useTheme();
  const personName = type === 'pay' ? txn.toName : txn.fromName;
  const isPending = txn.status === 'pending';
  const isInitiated = txn.status === 'initiated';
  const isConfirmed = txn.status === 'confirmed';
  const isDisputed = txn.status === 'disputed';
  const isRejected =
    txn.status === 'rejected' || (txn.rejectedAt && txn.status === 'pending');

  const themeColor = type === 'pay' ? '#EF4444' : '#10B981';

  return (
    <View
      style={[
        styles.paymentCard,
        { backgroundColor: theme.colors.surface },
        isConfirmed && { opacity: 0.6 },
      ]}
    >
      {/* Top Main Row */}
      <Pressable onPress={onToggle} style={styles.paymentCardHeader}>
        <View style={styles.payerLeftGroup}>
          <Avatar
            fallback={personName ? personName.charAt(0).toUpperCase() : '?'}
            size="md"
          />
          <View style={{ gap: 2, flex: 1 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text
                style={[
                  styles.payerNameText,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {personName || 'Traveler'}
              </Text>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor: isConfirmed
                      ? 'rgba(16,185,129,0.12)'
                      : isInitiated
                        ? 'rgba(245,158,11,0.12)'
                        : isDisputed
                          ? 'rgba(239,68,68,0.12)'
                          : 'rgba(113,113,122,0.1)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    {
                      color: isConfirmed
                        ? '#059669'
                        : isInitiated
                          ? '#D97706'
                          : isDisputed
                            ? '#EF4444'
                            : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {isInitiated
                    ? 'Sent (Pending Confirmation)'
                    : isConfirmed
                      ? 'Confirmed'
                      : isDisputed
                        ? 'Disputed'
                        : 'Unsettled'}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.payerActionSub,
                { color: theme.colors.textTertiary },
              ]}
            >
              {type === 'pay'
                ? 'Direct transfer to companion'
                : 'Incoming reimbursement'}
            </Text>
          </View>
        </View>

        <View style={styles.payerRightGroup}>
          <Text style={[styles.transferAmount, { color: themeColor }]}>
            {type === 'pay' ? '−' : '+'}
            {formatCurrency(txn.amountBase, txn.baseCurrency || baseCurrency)}
          </Text>

          {breakdown.length > 0 && (
            <View
              style={[
                styles.detailChevronPill,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text
                style={[
                  styles.detailChevronText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {expanded ? 'Hide Details' : 'View Split'}
              </Text>
              <AppIcon
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={11}
                color={theme.colors.textSecondary}
              />
            </View>
          )}
        </View>
      </Pressable>

      {/* Rejection Notice */}
      {isRejected && txn.rejectionReason && !isConfirmed && (
        <View
          style={[
            styles.rejectionNoticeBox,
            { backgroundColor: 'rgba(239,68,68,0.1)' },
          ]}
        >
          <AppIcon name="alert-triangle" size={14} color="#EF4444" />
          <Text style={[styles.rejectionNoticeText, { color: '#EF4444' }]}>
            Verification rejected: "{txn.rejectionReason}". Payer can
            re-dispatch transfer.
          </Text>
        </View>
      )}

      {/* Actions */}
      {!isConfirmed && !isDisputed && (
        <View style={styles.actionClusterRow}>
          <Pressable
            onPress={onDispute}
            style={[
              styles.disputeIconBtn,
              { borderColor: theme.colors.borderLight },
            ]}
          >
            <AppIcon name="flag" size={15} color="#EF4444" />
          </Pressable>

          {/* PAYER CONTROLS */}
          {type === 'pay' && (isPending || isRejected) && (
            <>
              <Pressable
                onPress={onMarkPaid}
                style={[
                  styles.actionBtnSecondary,
                  { borderColor: theme.colors.borderLight },
                ]}
              >
                <Text
                  style={[
                    styles.actionBtnSecondaryText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Mark as Paid
                </Text>
              </Pressable>
              <Pressable
                onPress={onPay}
                style={[
                  styles.actionBtnPrimary,
                  { backgroundColor: '#2563EB' },
                ]}
              >
                <AppIcon name="zap" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnPrimaryText}>Pay via UPI</Text>
              </Pressable>
            </>
          )}

          {type === 'pay' && isInitiated && (
            <View style={styles.awaitingConfirmationWrap}>
              <AppIcon name="clock" size={13} color="#D97706" />
              <Text
                style={[
                  styles.awaitingConfirmationText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Awaiting confirmation from {personName}
              </Text>
            </View>
          )}

          {/* RECEIVER CONTROLS */}
          {type === 'receive' && (isPending || isRejected) && (
            <>
              <Pressable
                onPress={onRemind}
                style={[
                  styles.actionBtnSecondary,
                  { borderColor: theme.colors.borderLight },
                ]}
              >
                <AppIcon
                  name="bell"
                  size={13}
                  color={theme.colors.textPrimary}
                />
                <Text
                  style={[
                    styles.actionBtnSecondaryText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Ping Payer
                </Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                style={[
                  styles.actionBtnPrimary,
                  { backgroundColor: '#10B981' },
                ]}
              >
                <AppIcon name="check" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnPrimaryText}>
                  Confirm Received
                </Text>
              </Pressable>
            </>
          )}

          {type === 'receive' && isInitiated && (
            <>
              <Pressable
                onPress={onReject}
                style={[
                  styles.actionBtnDanger,
                  { borderColor: 'rgba(239,68,68,0.2)' },
                ]}
              >
                <AppIcon name="x" size={13} color="#EF4444" />
                <Text
                  style={[styles.actionBtnDangerText, { color: '#EF4444' }]}
                >
                  Reject
                </Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                style={[
                  styles.actionBtnPrimary,
                  { backgroundColor: '#10B981' },
                ]}
              >
                <AppIcon name="check" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnPrimaryText}>
                  Confirm Received
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {/* Expanded Expense Breakdown */}
      {expanded && breakdown.length > 0 && (
        <View
          style={[
            styles.breakdownCard,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[
              styles.breakdownHeading,
              { color: theme.colors.textTertiary },
            ]}
          >
            LINKED EXPENSE BREAKDOWN
          </Text>
          {breakdown.map((item, i) => (
            <View key={i} style={styles.breakdownRow}>
              <View
                style={[
                  styles.breakdownIconWrap,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <AppIcon
                  name={CATEGORY_ICONS[item.category] || ('file-text' as any)}
                  size={13}
                  color={theme.colors.textPrimary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.breakdownTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.breakdownMeta,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {item.stopName ? `${item.stopName} · ` : ''}
                  {format(new Date(item.date), 'MMM d')}
                </Text>
              </View>
              <Text
                style={[
                  styles.breakdownAmount,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {formatCurrency(item.amount, txn.baseCurrency || baseCurrency)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

function createStyles(theme: Theme, isDesktop: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 10,
    },
    loadingText: { fontSize: 13, fontWeight: '600' },
    scrollView: { flex: 1 },
    scrollContent: {
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    mainWrapper: {
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
      gap: 16,
    },

    // Header Bar
    headerBar: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
      zIndex: 10,
    },
    headerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
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

    // Bento Split Grid
    bentoSplitRow: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'flex-start',
    },
    stackLayout: {
      flexDirection: 'column',
    },
    bentoCol: {
      gap: 14,
      width: '100%',
    },

    // Hero Balance Card
    balanceHeroCard: {
      borderRadius: 22,
      padding: 20,
      gap: 16,

      ...Platform.select({
        web: {
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.15)',
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
    balanceTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    balanceHeroLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: 'rgba(255,255,255,0.6)',
    },
    balanceHeroAmount: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -0.8,
      marginTop: 2,
    },
    balanceHeroSub: {
      fontSize: 11.5,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '500',
      marginTop: 2,
    },
    standingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    standingPillText: {
      fontSize: 10,
      fontWeight: '800',
    },
    settleAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#2563EB',
      paddingVertical: 12,
      borderRadius: 14,
    },
    settleAllBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },

    // Panels
    panelCard: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

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
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    panelIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    panelSub: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
    },

    // Group Standings
    groupScroll: {
      gap: 10,
      paddingVertical: 2,
    },
    memberTile: {
      alignItems: 'center',
      padding: 12,
      borderRadius: 16,
      minWidth: 100,
      gap: 4,
    },
    memberName: {
      fontSize: 12,
      fontWeight: '700',
      maxWidth: 80,
      textAlign: 'center',
    },
    memberAmount: {
      fontSize: 13,
      fontWeight: '900',
    },

    // Help Box
    helpToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    helpContent: {
      padding: 12,
      borderRadius: 14,
      marginTop: 2,
    },
    helpText: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '500',
    },

    // Sections
    sectionBlock: {
      gap: 8,
    },
    sectionHeading: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      paddingLeft: 2,
    },

    // Others Table
    othersPanel: {
      borderRadius: 18,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
      gap: 8,
    },
    otherRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    otherFlowGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    otherParticipant: {
      fontSize: 13,
      fontWeight: '700',
    },
    otherRightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    otherAmountText: {
      fontSize: 13,
      fontWeight: '800',
    },
    statusPill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    statusPillText: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.4,
    },

    // Payment Row Card
    paymentCard: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

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
    paymentCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    payerLeftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    payerNameText: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    statusTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    statusTagText: {
      fontSize: 9,
      fontWeight: '800',
    },
    payerActionSub: {
      fontSize: 11,
      fontWeight: '500',
    },
    payerRightGroup: {
      alignItems: 'flex-end',
      gap: 4,
    },
    transferAmount: {
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    detailChevronPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    detailChevronText: {
      fontSize: 10,
      fontWeight: '700',
    },
    rejectionNoticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 12,
    },
    rejectionNoticeText: {
      fontSize: 11.5,
      fontWeight: '600',
      flex: 1,
      lineHeight: 16,
    },
    actionClusterRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    disputeIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    actionBtnPrimary: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
    },
    actionBtnPrimaryText: {
      color: '#FFFFFF',
      fontSize: 12.5,
      fontWeight: '800',
    },
    actionBtnSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    actionBtnSecondaryText: {
      fontSize: 12.5,
      fontWeight: '800',
    },
    actionBtnDanger: {
      flex: 0.8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    actionBtnDangerText: {
      fontSize: 12,
      fontWeight: '800',
    },
    awaitingConfirmationWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
    },
    awaitingConfirmationText: {
      fontSize: 12,
      fontWeight: '600',
      fontStyle: 'italic',
    },
    breakdownCard: {
      padding: 12,
      borderRadius: 16,
      gap: 8,
    },
    breakdownHeading: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
      marginBottom: 2,
    },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    breakdownIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    breakdownTitle: {
      fontSize: 12.5,
      fontWeight: '700',
    },
    breakdownMeta: {
      fontSize: 10.5,
    },
    breakdownAmount: {
      fontSize: 12.5,
      fontWeight: '800',
    },

    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalCard: {
      width: '100%',
      maxWidth: 440,
      borderRadius: 22,
      padding: 20,
      gap: 12,

      ...Platform.select({
        web: {
          boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
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
    modalTitle: {
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    modalSub: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 17,
    },
    reasonInput: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 12,
      fontSize: 13,
      minHeight: 70,
      textAlignVertical: 'top',
    },
    modalActionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    modalCancelBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
    },
    modalCancelText: {
      fontSize: 13,
      fontWeight: '700',
    },
    modalConfirmBtn: {
      flex: 1.2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
    },
    modalConfirmText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },

    // History Modal
    historyModalCard: {
      width: '100%',
      maxWidth: 540,
      maxHeight: '85%',
      borderRadius: 24,
      padding: 20,
      gap: 14,

      ...Platform.select({
        web: {
          boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
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
    historyModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.04)',
    },
    modalCloseCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.03)',
    },
    historyScroll: {
      paddingBottom: 10,
    },
    historyLoadingBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 36,
      gap: 10,
    },
    historyEmptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 36,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '800',
    },
    emptySub: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 2,
    },
    timelineList: {
      gap: 10,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    timelineIconAura: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    timelineCard: {
      flex: 1,
      padding: 12,
      borderRadius: 14,
      gap: 2,
    },
    timelineCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timelineActionTitle: {
      fontSize: 13,
      fontWeight: '800',
    },
    timelineAmountText: {
      fontSize: 13,
      fontWeight: '900',
    },
    timelineDateText: {
      fontSize: 11,
      fontWeight: '500',
    },
    timelineReasonText: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
  });
} // import GlobalLoader from '../../../components/common/GlobalLoader';
// import AppIcon from '../../../components/common/AppIcon';
// import React, { useState, useMemo, useCallback } from 'react';
// import {
//     View, Text, StyleSheet, ScrollView, Alert, Platform,
//     useWindowDimensions, Pressable, PressableStateCallbackType, Modal, TextInput,
//     RefreshControl
// } from 'react-native';
// import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
// import { useSocket } from '../../../hooks/useSocket';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import {
//     useSettlement, useCalculateSettlement,
//     useInitiatePayment, useConfirmPayment, useConfirmTransaction,
//     useDisputePayment, useSettleSingle, useRejectPayment, useRemindPayer,
//     useTrip, useTripExpenses, useTripSummary, useSettlementHistory,
//     useSettleAll
// } from '../../../hooks';
// import { useAuthStore } from '../../../stores/auth.store';
// import { format } from 'date-fns';
// import { formatCurrency } from '../../../utils/formatters';
// import { haptics } from '../../../utils/haptics';
// import { openUPIApp } from '../../../utils/upi';
// import { useTheme } from '../../../providers/ThemeProvider';
// import { useGlobalStyles } from '../../../hooks/useGlobalStyles';
// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import { settlementsApi } from '../../../services/api/settlements.api';

// // Safe web pressable type
// type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// const CATEGORY_ICONS: Record<string, string> = {
//     food: 'utensils',
//     stay: 'hotel',
//     transport: 'car',
//     activity: 'compass',
//     shopping: 'shopping-bag',
//     health: 'heart-pulse',
//     other: 'file-text',
// };

// // ============================================================
// // MAIN SCREEN
// // ============================================================

// export default function SettlementScreen() {
//     const theme = useTheme();
//     const globalStyles = useGlobalStyles();
//     const styles = useStyles();
//     const { width } = useWindowDimensions();
//     const { tripId } = useLocalSearchParams<{ tripId: string }>();
//     const insets = useSafeAreaInsets();
//     const { user, firebaseUser } = useAuthStore();
//     const { subscribeToTrip, unsubscribeFromTrip } = useSocket();

//     React.useEffect(() => {
//         if (tripId) {
//             subscribeToTrip(tripId);
//             return () => unsubscribeFromTrip(tripId);
//         }
//     }, [tripId, subscribeToTrip, unsubscribeFromTrip]);

//     const isWebDesktop = Platform.OS === 'web' && width > 768;
//     const isMobile = width < 768;

//     // 1. Extract refetch methods from queries
//     const { data: trip } = useTrip(tripId);
//     const { data: summaryData, refetch: refetchSummary } = useTripSummary(tripId);
//     const { data: settlementData, isLoading, refetch: refetchSettlement } = useSettlement(tripId);
//     const { data: expensesData, refetch: refetchExpenses } = useTripExpenses(tripId, { isSettled: 'false' });

//     const { mutate: calculateSettlement, isPending: isCalculating } = useCalculateSettlement();
//     const { mutate: initiatePayment } = useInitiatePayment();
//     const { mutate: confirmPayment } = useConfirmPayment();
//     const { mutate: confirmTransaction } = useConfirmTransaction();
//     const { mutate: disputePayment } = useDisputePayment();
//     const { mutate: settleAll, isPending: isSettlingAll } = useSettleAll();
//     const { mutate: settleSingle } = useSettleSingle();
//     const { mutate: rejectPayment } = useRejectPayment();
//     const { mutate: remindPayer } = useRemindPayer();

//     const [showHowItWorks, setShowHowItWorks] = useState(false);
//     const [showHistory, setShowHistory] = useState(false);
//     const [expandedTxn, setExpandedTxn] = useState<string | null>(null);

//     // Rejection prompt modal state
//     const [rejectModalVisible, setRejectModalVisible] = useState(false);
//     const [rejectingTxnId, setRejectingTxnId] = useState<string | null>(null);
//     const [rejectReason, setRejectReason] = useState('');

//     const { data: historyData, isLoading: isLoadingHistory } = useSettlementHistory(tripId, { enabled: showHistory });
//     const settlementHistory = useMemo(() => {
//         if (Array.isArray(historyData)) return historyData;
//         if (Array.isArray((historyData as any)?.data)) return (historyData as any).data;
//         if (Array.isArray((historyData as any)?.history)) return (historyData as any).history;
//         return [];
//     }, [historyData]);

//     const [isRefreshing, setIsRefreshing] = useState(false);

//     // Manual / action-triggered refresh helper
//     const refreshData = useCallback(async () => {
//         setIsRefreshing(true);
//         haptics.selection();
//         try {
//             await Promise.all([
//                 refetchSettlement(),
//                 refetchSummary(),
//                 refetchExpenses(),
//             ]);
//         } finally {
//             setIsRefreshing(false);
//         }
//     }, [refetchSettlement, refetchSummary, refetchExpenses]);

//     const settlement = settlementData?.settlement;
//     const transactions = settlement?.transactions || [];
//     const allExpenses = expensesData?.expenses || [];
//     const summaryMembers = summaryData?.summary?.members || [];
//     const baseCurrency = settlement?.baseCurrency || trip?.baseCurrency || 'INR';

//     // Current user identifier set for normalized safe comparison
//     const currentUids = useMemo(() => new Set(
//         [
//             user?.firebaseUid,
//             user?._id,
//             (user as any)?.uid,
//             (user as any)?.id,
//             firebaseUser?.uid,
//         ]
//             .filter(Boolean)
//             .map((id) => String(id).trim())
//     ), [user, firebaseUser]);

//     const currentDisplayName = user?.displayName?.trim().toLowerCase() || '';

//     const getParticipantId = (p: any): string => {
//         if (!p) return '';
//         if (typeof p === 'string') return p.trim();
//         return String(p.firebaseUid || p.userId || p._id || p.uid || p.id || '').trim();
//     };

//     const isToMe = useCallback((t: any): boolean => {
//         const toId = getParticipantId(t.to);
//         if (toId && currentUids.has(toId)) return true;
//         if (t.toName && currentDisplayName && String(t.toName).trim().toLowerCase() === currentDisplayName) {
//             return true;
//         }
//         return false;
//     }, [currentUids, currentDisplayName]);

//     const isFromMe = useCallback((t: any): boolean => {
//         const fromId = getParticipantId(t.from);
//         if (fromId && currentUids.has(fromId)) return true;
//         if (t.fromName && currentDisplayName && String(t.fromName).trim().toLowerCase() === currentDisplayName) {
//             return true;
//         }
//         return false;
//     }, [currentUids, currentDisplayName]);

//     // Split transactions
//     const youPay = useMemo(() => transactions.filter((t: any) => isFromMe(t)), [transactions, isFromMe]);
//     const youReceive = useMemo(() => transactions.filter((t: any) => isToMe(t)), [transactions, isToMe]);
//     const others = useMemo(() => transactions.filter((t: any) => !isFromMe(t) && !isToMe(t)), [transactions, isFromMe, isToMe]);

//     const totalYouPay = useMemo(() => youPay.reduce((s: number, t: any) => s + t.amountBase, 0), [youPay]);
//     const totalYouReceive = useMemo(() => youReceive.reduce((s: number, t: any) => s + t.amountBase, 0), [youReceive]);
//     const netBalance = totalYouReceive - totalYouPay;

//     // Memoize expense breakdowns to avoid O(N*M) array filtering on every render
//     const breakdownsByTxnKey = useMemo(() => {
//         const map = new Map<string, Array<{ title: string; category: string; amount: number; date: string; stopName: string }>>();
//         if (!allExpenses.length || !transactions.length) return map;

//         for (const txn of transactions) {
//             const list = allExpenses
//                 .filter((exp: any) => {
//                     const toId = getParticipantId(txn.to);
//                     const fromId = getParticipantId(txn.from);
//                     const isPayer = getParticipantId(exp.paidBy) === toId;
//                     const isDebtor = exp.splits?.some((s: any) => getParticipantId(s.userId) === fromId && !s.isPaid);
//                     return isPayer && isDebtor;
//                 })
//                 .map((exp: any) => {
//                     const fromId = getParticipantId(txn.from);
//                     const split = exp.splits?.find((s: any) => getParticipantId(s.userId) === fromId);
//                     const stop = trip?.stops?.find((s: any) => s._id === exp.stopId);
//                     return {
//                         title: exp.title,
//                         category: exp.category,
//                         amount: split?.amountBase || 0,
//                         date: exp.date,
//                         stopName: stop?.name || '',
//                     };
//                 });
//             map.set(`${txn.from}:${txn.to}`, list);
//         }
//         return map;
//     }, [allExpenses, transactions, trip?.stops]);

//     const getBreakdown = useCallback((txn: any) => {
//         return breakdownsByTxnKey.get(`${txn.from}:${txn.to}`) || [];
//     }, [breakdownsByTxnKey]);

//     const handleCalculate = () => {
//         haptics.selection();
//         calculateSettlement(tripId, {
//             onSuccess: () => refreshData()
//         });
//     };

//     const handlePay = (txnId: string) => {
//         haptics.success();
//         initiatePayment({ tripId, transactionId: txnId }, {
//             onSuccess: (data: any) => {
//                 refreshData();
//                 if (data?.upiDeepLink) {
//                     Alert.alert('Open UPI', 'Complete payment via UPI app?', [
//                         { text: 'Cancel', style: 'cancel' },
//                         { text: 'Pay Now', onPress: () => openUPIApp(data.upiDeepLink) },
//                     ]);
//                 }
//             },
//             onError: (error: any) => {
//                 Alert.alert('Payment Failed', error.message || 'An error occurred while initiating payment.');
//             }
//         });
//     };

//     // Payer marks single transaction as paid (initiates transaction)
//     const handleMarkPaid = (txnId: string) => {
//         haptics.success();
//         settleSingle({ tripId, transactionId: txnId }, {
//             onSuccess: () => {
//                 refreshData();
//                 const msg = 'Payment marked as paid! Waiting for recipient to confirm.';
//                 if (Platform.OS === 'web') alert(msg);
//                 else Alert.alert('Payment Sent', msg);
//             },
//             onError: (error: any) => {
//                 const errorMsg = error.message || 'Failed to mark payment as paid.';
//                 if (Platform.OS === 'web') alert(errorMsg);
//                 else Alert.alert('Error', errorMsg);
//             }
//         });
//     };

//     // Receiver confirms payment
//     const handleConfirm = (txnId: string) => {
//         haptics.success();
//         confirmTransaction({ tripId, transactionId: txnId }, {
//             onSuccess: () => {
//                 refreshData();
//                 if (Platform.OS === 'web') alert('Payment confirmed!');
//                 else Alert.alert('Done!', 'Payment confirmed');
//             },
//             onError: (error: any) => {
//                 Alert.alert('Error', error.message || 'Failed to confirm payment.');
//             }
//         });
//     };

//     // Receiver rejects payment claim
//     const promptReject = (txnId: string) => {
//         setRejectingTxnId(txnId);
//         setRejectReason('');
//         setRejectModalVisible(true);
//     };

//     const handleExecuteReject = () => {
//         if (!rejectingTxnId) return;
//         const reason = rejectReason.trim() || 'Payment not received in account';
//         setRejectModalVisible(false);
//         haptics.warning();

//         rejectPayment({ tripId, transactionId: rejectingTxnId, reason }, {
//             onSuccess: () => {
//                 refreshData();
//                 if (Platform.OS === 'web') alert('Payment rejected. The payer has been notified.');
//                 else Alert.alert('Payment Rejected', 'The payer has been notified and can retry.');
//             },
//             onError: (error: any) => {
//                 Alert.alert('Error', error.message || 'Failed to reject payment.');
//             }
//         });
//     };

//     // Receiver sends reminder to payer
//     const handleRemind = (txnId: string) => {
//         haptics.selection();
//         remindPayer({ tripId, transactionId: txnId }, {
//             onSuccess: () => {
//                 if (Platform.OS === 'web') alert('Reminder sent!');
//                 else Alert.alert('Reminder Sent', 'The payer has been notified.');
//             },
//             onError: (error: any) => {
//                 const errorMsg = error.message || 'Could not send reminder.';
//                 if (Platform.OS === 'web') alert(errorMsg);
//                 else Alert.alert('Reminder Cooldown', errorMsg);
//             }
//         });
//     };

//     // Payer initiates all pending payments
//     const handleSettleAll = () => {
//         haptics.success();
//         const msg = 'Mark all your outstanding payments as sent? Recipients will be asked to confirm.';

//         const execute = () => {
//             settleAll({ tripId }, {
//                 onSuccess: () => {
//                     refreshData();
//                     if (Platform.OS === 'web') alert('All payments marked as initiated!');
//                     else Alert.alert('Success', 'All payments marked as initiated! Waiting for recipients to confirm.');
//                 },
//                 onError: (error: any) => {
//                     const errorMsg = error.message || 'Failed to initiate settlements.';
//                     if (Platform.OS === 'web') alert(errorMsg);
//                     else Alert.alert('Error', errorMsg);
//                 }
//             });
//         };

//         if (Platform.OS === 'web') {
//             if (window.confirm(msg)) execute();
//         } else {
//             Alert.alert('Settle All', msg, [
//                 { text: 'Cancel', style: 'cancel' },
//                 { text: 'Confirm', onPress: execute }
//             ]);
//         }
//     };

//     const handleDispute = (txnId: string) => {
//         haptics.warning();
//         Alert.alert('Dispute Payment?', 'Flag this payment for review by the group?', [
//             { text: 'Cancel', style: 'cancel' },
//             {
//                 text: 'Dispute', style: 'destructive', onPress: () => disputePayment({ tripId, transactionId: txnId }, {
//                     onSuccess: () => refreshData(),
//                     onError: (error: any) => Alert.alert('Error', error.message || 'Failed to dispute payment.')
//                 })
//             },
//         ]);
//     };

//     const handleExport = async () => {
//         haptics.selection();
//         try {
//             const res = await settlementsApi.exportSettlement(tripId, 'csv');
//             if (Platform.OS === 'web') {
//                 if (res.data?.url) {
//                     window.open(res.data.url, '_blank');
//                 } else if (res.data) {
//                     const blob = new Blob([res.data], { type: 'text/csv' });
//                     const url = window.URL.createObjectURL(blob);
//                     const a = document.createElement('a');
//                     a.href = url;
//                     a.download = `trip_${tripId}_settlements.csv`;
//                     a.click();
//                     window.URL.revokeObjectURL(url);
//                 }
//             } else {
//                 Alert.alert('Export Successful', 'Your export has been generated.');
//             }
//         } catch (err: any) {
//             Alert.alert('Export Failed', err.message || 'Could not export settlements.');
//         }
//     };

//     if (isLoading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <GlobalLoader variant="inline" size="large" color={theme.colors.primary} />
//                 <Text style={styles.loadingText}>Calculating optimal settlements...</Text>
//             </View>
//         );
//     }

//     const memberCount = trip?.members?.filter((m: any) => m.isActive).length || 0;
//     const maxTransfers = Math.max(0, memberCount - 1);
//     const hasUninitiatedOutgoing = youPay.some((t: any) => t.status === 'pending' || t.status === 'rejected');

//     return (
//         <View style={styles.container}>
//             {/* Global Gradient Background */}
//             <View style={StyleSheet.absoluteFill} pointerEvents="none">
//                 <GlobalBackground />
//             </View>
//             <View style={[styles.webDesktopContent, isWebDesktop && styles.webDesktopContentCentered]}>

//                 {/* Premium Header */}
//                 <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? theme.spacing['4'] : insets.top + 16 }]}>
//                     <Pressable
//                         onPress={() => router.back()}
//                         style={({ hovered }: WebPressableState) => [
//                             styles.backBtnWrap,
//                             Platform.OS === 'web' && hovered && ({ opacity: 0.6 } as any)
//                         ]}
//                         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                     >
//                         <AppIcon name="arrow-left" size={22} color={theme.colors.textPrimary} />
//                     </Pressable>
//                     <Text style={styles.headerTitle}>Settle Up</Text>
//                     <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
//                         <Pressable
//                             onPress={() => setShowHistory(true)}
//                             style={({ hovered, pressed }: WebPressableState) => [
//                                 styles.refreshBtnWrap,
//                                 Platform.OS === 'web' && hovered && ({ opacity: 0.8 } as any),
//                                 pressed && styles.pressedState
//                             ]}
//                             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                         >
//                             <AppIcon name="clock" size={18} color={theme.colors.textPrimary} />
//                         </Pressable>
//                         <Pressable
//                             onPress={handleExport}
//                             style={({ hovered, pressed }: WebPressableState) => [
//                                 styles.refreshBtnWrap,
//                                 Platform.OS === 'web' && hovered && ({ opacity: 0.8 } as any),
//                                 pressed && styles.pressedState
//                             ]}
//                             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                         >
//                             <AppIcon name="download" size={18} color={theme.colors.textPrimary} />
//                         </Pressable>
//                         <Pressable
//                             onPress={refreshData}
//                             disabled={isRefreshing || isCalculating}
//                             style={({ hovered, pressed }: WebPressableState) => [
//                                 styles.refreshBtnWrap,
//                                 Platform.OS === 'web' && hovered && !isRefreshing && !isCalculating && ({ opacity: 0.8 } as any),
//                                 pressed && !isRefreshing && !isCalculating && styles.pressedState
//                             ]}
//                             hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                             accessibilityLabel="Refresh Settlement Data"
//                         >
//                             {isRefreshing || isCalculating ? (
//                                 <GlobalLoader variant="inline" size="small" color={theme.colors.textPrimary} />
//                             ) : (
//                                 <AppIcon name="rotate-cw" size={18} color={theme.colors.textPrimary} />
//                             )}
//                         </Pressable>
//                     </View>
//                 </View>

//                 <ScrollView
//                     contentContainerStyle={[
//                         styles.scroll,
//                         {
//                             paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 60,
//                             paddingTop: isMobile ? 12 : 20,
//                         },
//                         isWebDesktop && styles.desktopScrollContent,
//                     ]}
//                     showsVerticalScrollIndicator={false}
//                     refreshControl={
//                         <RefreshControl
//                             refreshing={isRefreshing}
//                             onRefresh={refreshData}
//                             tintColor={theme.colors.primary}
//                             colors={[theme.colors.primary]}
//                         />
//                     }
//                 >
//                     <View style={[styles.mainLayout, isWebDesktop && styles.mainLayoutDesktop]}>

//                         {/* LEFT COLUMN: Net Balance, Settle All & Group Standings */}
//                         <View style={[styles.leftCol, isWebDesktop && styles.leftColDesktop]}>
//                             {/* NET BALANCE HERO CARD */}
//                             {transactions.length > 0 && (
//                                 <>
//                                     <View style={[styles.balanceCard, { borderColor: netBalance >= 0 ? theme.colors.successLight : theme.colors.dangerLight }]}>
//                                         <View style={styles.balanceHeader}>
//                                             <View style={[styles.balanceIconWrap, { backgroundColor: netBalance >= 0 ? theme.colors.successBg : theme.colors.dangerBg }]}>
//                                                 <AppIcon
//                                                     name={netBalance >= 0 ? 'arrow-up-right' : 'arrow-down-left'}
//                                                     size={20}
//                                                     color={netBalance >= 0 ? theme.colors.success : theme.colors.danger}
//                                                 />
//                                             </View>
//                                             <Text style={[styles.balanceLabel, { color: netBalance >= 0 ? theme.colors.success : theme.colors.danger }]}>
//                                                 {netBalance === 0 ? 'ALL SQUARE' : netBalance > 0 ? 'YOU ARE OWED' : 'YOU OWE'}
//                                             </Text>
//                                         </View>
//                                         <Text style={[styles.balanceAmount, { color: netBalance >= 0 ? theme.colors.success : theme.colors.danger }]}>
//                                             {formatCurrency(Math.abs(netBalance), baseCurrency)}
//                                         </Text>
//                                     </View>
//                                     {hasUninitiatedOutgoing && (
//                                         <View style={{ marginBottom: 20, marginTop: -12, paddingHorizontal: 2 }}>
//                                             <Pressable
//                                                 style={({ hovered, pressed }: WebPressableState) => [
//                                                     styles.primaryButton,
//                                                     Platform.OS === 'web' && hovered && styles.primaryButtonHovered,
//                                                     pressed && styles.pressedState
//                                                 ]}
//                                                 disabled={isSettlingAll}
//                                                 onPress={handleSettleAll}
//                                             >
//                                                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
//                                                     <AppIcon name="send" size={16} color={theme.colors.surface} />
//                                                     <Text style={styles.primaryButtonText}>
//                                                         {isSettlingAll ? 'Initiating...' : 'Mark All My Payments as Paid'}
//                                                     </Text>
//                                                 </View>
//                                             </Pressable>
//                                         </View>
//                                     )}
//                                 </>
//                             )}

//                             {/* GROUP BALANCES */}
//                             {summaryMembers.length > 0 && (
//                                 <View style={styles.groupBalancesSection}>
//                                     <Text style={[styles.sectionSubtitle, isMobile && styles.sectionSubtitleMobile]}>Group Balances</Text>
//                                     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupBalancesScroll}>
//                                         {summaryMembers.map((m: any) => {
//                                             const isPositive = m.netBalance >= 0;
//                                             return (
//                                                 <View key={m.userId} style={styles.groupBalanceCard}>
//                                                     <View style={[styles.gbAvatar, { backgroundColor: isPositive ? theme.colors.successBg : theme.colors.dangerBg }]}>
//                                                         <Text style={[styles.gbAvatarText, { color: isPositive ? theme.colors.success : theme.colors.danger }]}>
//                                                             {m.displayName ? m.displayName.charAt(0).toUpperCase() : '?'}
//                                                         </Text>
//                                                     </View>
//                                                     <Text style={styles.gbName} numberOfLines={1}>{m.displayName || 'Member'}</Text>
//                                                     <Text style={[styles.gbAmount, { color: isPositive ? theme.colors.success : theme.colors.danger }]}>
//                                                         {isPositive ? '+' : ''}{formatCurrency(Math.abs(m.netBalance), baseCurrency)}
//                                                     </Text>
//                                                 </View>
//                                             );
//                                         })}
//                                     </ScrollView>
//                                 </View>
//                             )}

//                             {/* HOW IT WORKS */}
//                             <Pressable
//                                 style={({ hovered }: WebPressableState) => [
//                                     styles.helpToggle,
//                                     Platform.OS === 'web' && hovered && ({ opacity: 0.7, cursor: 'pointer' } as any)
//                                 ]}
//                                 onPress={() => setShowHowItWorks(!showHowItWorks)}
//                             >
//                                 <Text style={styles.helpToggleText}>
//                                     {showHowItWorks ? 'Hide Explanation' : 'How does TripSplit calculate this?'}
//                                 </Text>
//                                 <AppIcon name={showHowItWorks ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.textSecondary} />
//                             </Pressable>

//                             {showHowItWorks && (
//                                 <View style={styles.helpBox}>
//                                     <AppIcon name="info" size={18} color={theme.colors.primary} style={{ marginRight: 10, marginTop: 2 }} />
//                                     <View style={styles.helpTextWrap}>
//                                         <Text style={styles.helpText}>
//                                             Instead of <Text style={styles.bold}>{memberCount}</Text> people sending dozens of small payments back and forth, TripSplit calculates the <Text style={styles.bold}>minimum number of transfers</Text> needed.
//                                         </Text>
//                                         <Text style={styles.helpText}>
//                                             For your group, everyone can be settled with at most <Text style={styles.bold}>{maxTransfers} transfers</Text>.
//                                         </Text>
//                                     </View>
//                                 </View>
//                             )}
//                         </View>

//                         {/* RIGHT COLUMN: Actionable Transfers & Settlements */}
//                         <View style={[styles.rightCol, isWebDesktop && styles.rightColDesktop]}>
//                             {/* TRANSACTIONS LISTS */}

//                             {youPay.length > 0 && <Text style={[styles.sectionSubtitle, isMobile && styles.sectionSubtitleMobile]}>You Need To Pay</Text>}
//                             {youPay.map((txn: any) => (
//                                 <PaymentRow
//                                     key={txn._id}
//                                     txn={txn}
//                                     type="pay"
//                                     breakdown={getBreakdown(txn)}
//                                     expanded={expandedTxn === txn._id}
//                                     onToggle={() => setExpandedTxn(expandedTxn === txn._id ? null : txn._id)}
//                                     onPay={() => handlePay(txn._id)}
//                                     onMarkPaid={() => handleMarkPaid(txn._id)}
//                                     onConfirm={() => { }}
//                                     onReject={() => { }}
//                                     onRemind={() => { }}
//                                     onDispute={() => handleDispute(txn._id)}
//                                     isMobile={isMobile}
//                                 />
//                             ))}

//                             {youReceive.length > 0 && <Text style={[styles.sectionSubtitle, isMobile && styles.sectionSubtitleMobile]}>You Will Receive</Text>}
//                             {youReceive.map((txn: any) => (
//                                 <PaymentRow
//                                     key={txn._id}
//                                     txn={txn}
//                                     type="receive"
//                                     breakdown={getBreakdown(txn)}
//                                     expanded={expandedTxn === txn._id}
//                                     onToggle={() => setExpandedTxn(expandedTxn === txn._id ? null : txn._id)}
//                                     onPay={() => { }}
//                                     onMarkPaid={() => { }}
//                                     onConfirm={() => handleConfirm(txn._id)}
//                                     onReject={() => promptReject(txn._id)}
//                                     onRemind={() => handleRemind(txn._id)}
//                                     onDispute={() => handleDispute(txn._id)}
//                                     isMobile={isMobile}
//                                 />
//                             ))}

//                             {others.length > 0 && <Text style={[styles.sectionSubtitle, isMobile && styles.sectionSubtitleMobile]}>Other Group Transfers</Text>}
//                             {others.map((txn: any) => (
//                                 <View key={txn._id} style={[styles.otherRow, isMobile && styles.otherRowMobile]}>
//                                     <View style={styles.otherFlow}>
//                                         <Text style={styles.otherName}>{txn.fromName ? txn.fromName.split(' ')[0] : 'User'}</Text>
//                                         <View style={styles.otherArrowWrap}>
//                                             <Text style={styles.otherArrowText}>pays</Text>
//                                             <Text style={styles.otherArrowAmount}>{formatCurrency(txn.amountBase, txn.baseCurrency || baseCurrency)}</Text>
//                                         </View>
//                                         <Text style={styles.otherName}>{txn.toName ? txn.toName.split(' ')[0] : 'User'}</Text>
//                                     </View>
//                                     <View style={[styles.statusBadge, {
//                                         backgroundColor: txn.status === 'confirmed' ? theme.colors.successLight
//                                             : txn.status === 'initiated' ? theme.colors.warningLight
//                                                 : txn.status === 'disputed' ? theme.colors.dangerLight
//                                                     : theme.colors.borderLight
//                                     }]}>
//                                         <Text style={[styles.statusBadgeText, {
//                                             color: txn.status === 'confirmed' ? theme.colors.success
//                                                 : txn.status === 'initiated' ? theme.colors.warning
//                                                     : txn.status === 'disputed' ? theme.colors.danger
//                                                         : theme.colors.textSecondary
//                                         }]}>
//                                             {txn.status === 'initiated' ? 'Sent' : txn.status}
//                                         </Text>
//                                     </View>
//                                 </View>
//                             ))}

//                             {/* EMPTY STATE */}
//                             {transactions.length === 0 && (
//                                 <View style={[styles.emptyBox, isMobile && styles.emptyBoxMobile]}>
//                                     <View style={styles.emptyIconWrap}>
//                                         <AppIcon name="check-circle-2" size={36} color={theme.colors.success} />
//                                     </View>
//                                     <Text style={styles.emptyTitle}>All Settled Up!</Text>
//                                     <Text style={styles.emptySub}>No pending transfers found.</Text>
//                                     <Pressable
//                                         style={({ hovered, pressed }: WebPressableState) => [
//                                             styles.primaryButton,
//                                             Platform.OS === 'web' && hovered && styles.primaryButtonHovered,
//                                             pressed && styles.pressedState
//                                         ]}
//                                         onPress={handleCalculate}
//                                     >
//                                         <Text style={styles.primaryButtonText}>Recalculate Balances</Text>
//                                     </Pressable>
//                                 </View>
//                             )}
//                         </View>
//                     </View>
//                 </ScrollView>

//                 {/* REJECT PAYMENT MODAL */}
//                 <Modal visible={rejectModalVisible} animationType="fade" transparent={true} onRequestClose={() => setRejectModalVisible(false)}>
//                     <View style={styles.modalOverlay}>
//                         <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, maxWidth: 440, alignSelf: 'center', width: '90%' }]}>
//                             <Text style={[styles.modalTitle, { marginBottom: 8 }]}>Reject Payment Claim</Text>
//                             <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16 }}>
//                                 Let the payer know why this payment wasn't confirmed so they can fix it.
//                             </Text>
//                             <TextInput
//                                 style={styles.reasonInput}
//                                 placeholder="e.g. Haven't received money in bank yet"
//                                 placeholderTextColor={theme.colors.textTertiary}
//                                 value={rejectReason}
//                                 onChangeText={setRejectReason}
//                                 multiline
//                                 numberOfLines={3}
//                             />
//                             <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
//                                 <Pressable
//                                     style={[styles.modalBtn, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderLight }]}
//                                     onPress={() => setRejectModalVisible(false)}
//                                 >
//                                     <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Cancel</Text>
//                                 </Pressable>
//                                 <Pressable
//                                     style={[styles.modalBtn, { backgroundColor: theme.colors.danger }]}
//                                     onPress={handleExecuteReject}
//                                 >
//                                     <Text style={{ color: '#fff', fontWeight: '700' }}>Reject Claim</Text>
//                                 </Pressable>
//                             </View>
//                         </View>
//                     </View>
//                 </Modal>

//                 {/* HISTORY MODAL */}
//                 <Modal visible={showHistory} animationType="fade" transparent={true} onRequestClose={() => setShowHistory(false)}>
//                     <View style={styles.modalOverlay}>
//                         <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowHistory(false)} />
//                         <GlassCard
//                             style={styles.modalContent}
//                             variant="prominent"
//                             intensity={theme.isDark ? 25 : 18}
//                         >
//                             {/* Modal Header */}
//                             <View style={styles.modalHeader}>
//                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
//                                     <View style={styles.historyHeaderIconWrap}>
//                                         <AppIcon name="clock" size={20} color={theme.colors.primary} />
//                                     </View>
//                                     <View>
//                                         <Text style={styles.modalTitle}>Settlement History</Text>
//                                         <Text style={styles.modalSubtitle}>
//                                             {trip?.title || 'Trip'} • {settlementHistory.length} event{settlementHistory.length !== 1 ? 's' : ''}
//                                         </Text>
//                                     </View>
//                                 </View>
//                                 <Pressable
//                                     onPress={() => setShowHistory(false)}
//                                     style={styles.modalCloseBtn}
//                                     hitSlop={12}
//                                 >
//                                     <AppIcon name="x" size={20} color={theme.colors.textPrimary} />
//                                 </Pressable>
//                             </View>

//                             <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
//                                 {isLoadingHistory ? (
//                                     <View style={styles.historyLoadingBox}>
//                                         <GlobalLoader variant="inline" size="small" color={theme.colors.primary} />
//                                         <Text style={styles.historyLoadingText}>Loading timeline...</Text>
//                                     </View>
//                                 ) : settlementHistory.length === 0 ? (
//                                     <View style={styles.historyEmptyBox}>
//                                         <View style={styles.historyEmptyIconCircle}>
//                                             <AppIcon name="calendar" size={28} color={theme.colors.textTertiary} />
//                                         </View>
//                                         <Text style={styles.historyEmptyTitle}>No Activity Yet</Text>
//                                         <Text style={styles.historyEmptySub}>
//                                             Payments, confirmations, and calculation events will appear here chronologically.
//                                         </Text>
//                                     </View>
//                                 ) : (
//                                     <View style={styles.timelineContainer}>
//                                         {settlementHistory.map((h: any, idx: number) => {
//                                             const isConfirmed = h.action === 'payment_confirmed';
//                                             const isInitiated = h.action === 'payment_initiated' || h.action === 'settle_all_initiated';
//                                             const isRejected = h.action === 'payment_rejected';
//                                             const isDisputed = h.action === 'payment_disputed';
//                                             const isCalculated = h.action === 'calculated';

//                                             const iconName = isConfirmed ? 'check-circle-2' :
//                                                 isInitiated ? 'send' :
//                                                 isRejected ? 'x-circle' :
//                                                 isDisputed ? 'alert-triangle' :
//                                                 isCalculated ? 'zap' : 'clock';

//                                             const iconColor = isConfirmed ? theme.colors.success :
//                                                 isInitiated ? theme.colors.primary :
//                                                 isRejected ? theme.colors.danger :
//                                                 isDisputed ? theme.colors.warning :
//                                                 isCalculated ? (theme.colors.info || '#06B6D4') : theme.colors.textSecondary;

//                                             const iconBg = isConfirmed ? (theme.colors.successBg || theme.colors.success + '18') :
//                                                 isInitiated ? (theme.colors.primaryBg || theme.colors.primary + '18') :
//                                                 isRejected ? (theme.colors.dangerBg || theme.colors.danger + '18') :
//                                                 isDisputed ? (theme.colors.warningBg || theme.colors.warning + '18') :
//                                                 (theme.colors.surface || 'rgba(255,255,255,0.08)');

//                                             const actionLabel = h.action === 'calculated' ? 'Balances Recalculated' :
//                                                 h.action === 'payment_initiated' ? 'Payment Sent' :
//                                                 h.action === 'settle_all_initiated' ? 'All Payments Sent' :
//                                                 h.action === 'payment_confirmed' ? 'Payment Confirmed' :
//                                                 h.action === 'payment_rejected' ? 'Payment Rejected' :
//                                                 h.action === 'payment_disputed' ? 'Payment Disputed' :
//                                                 h.action === 'payment_retried' ? 'Payment Retried' : h.action;

//                                             const isLast = idx === settlementHistory.length - 1;

//                                             return (
//                                                 <View key={idx} style={styles.timelineItem}>
//                                                     {/* Timeline Track */}
//                                                     <View style={styles.timelineTrack}>
//                                                         <View style={[styles.timelineIconBadge, { backgroundColor: iconBg }]}>
//                                                             <AppIcon name={iconName} size={14} color={iconColor} />
//                                                         </View>
//                                                         {!isLast && <View style={[styles.timelineConnector, { backgroundColor: theme.colors.borderLight }]} />}
//                                                     </View>

//                                                     {/* Timeline Content */}
//                                                     <View style={[styles.timelineCard, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.borderLight }]}>
//                                                         <View style={styles.timelineCardHeader}>
//                                                             <Text style={[styles.timelineActionTitle, { color: theme.colors.textPrimary }]}>{actionLabel}</Text>
//                                                             {h.amount ? (
//                                                                 <View style={[styles.timelineAmountBadge, { backgroundColor: iconBg }]}>
//                                                                     <Text style={[styles.timelineAmountText, { color: iconColor }]}>
//                                                                         {formatCurrency(Number(h.amount) || 0, settlement?.baseCurrency || baseCurrency)}
//                                                                     </Text>
//                                                                 </View>
//                                                             ) : null}
//                                                         </View>

//                                                         <View style={styles.timelineMetaRow}>
//                                                             <Text style={[styles.timelineActorText, { color: theme.colors.textSecondary }]}>
//                                                                 By <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>{h.actorName || 'System'}</Text>
//                                                             </Text>
//                                                             <Text style={[styles.timelineDotSep, { color: theme.colors.textTertiary }]}>•</Text>
//                                                             <Text style={[styles.timelineDateText, { color: theme.colors.textTertiary }]}>
//                                                                 {h.timestamp ? format(new Date(h.timestamp), 'MMM d, h:mm a') : 'Recent'}
//                                                             </Text>
//                                                         </View>

//                                                         {h.metadata?.reason ? (
//                                                             <View style={[styles.timelineReasonBox, { backgroundColor: theme.colors.dangerBg }]}>
//                                                                 <Text style={[styles.timelineReasonText, { color: theme.colors.danger }]}>
//                                                                     Reason: {h.metadata.reason}
//                                                                 </Text>
//                                                             </View>
//                                                         ) : null}
//                                                     </View>
//                                                 </View>
//                                             );
//                                         })}
//                                     </View>
//                                 )}
//                             </ScrollView>
//                         </GlassCard>
//                     </View>
//                 </Modal>
//             </View>
//         </View>
//     );
// }

// // ============================================================
// // PAYMENT ROW — Premium Expandable Card
// // ============================================================

// function PaymentRow({
//     txn, type, breakdown, expanded, onToggle, onPay, onMarkPaid, onConfirm, onReject, onRemind, onDispute, isMobile,
// }: {
//     txn: any;
//     type: 'pay' | 'receive';
//     breakdown: any[];
//     expanded: boolean;
//     onToggle: () => void;
//     onPay: () => void;
//     onMarkPaid: () => void;
//     onConfirm: () => void;
//     onReject: () => void;
//     onRemind: () => void;
//     onDispute: () => void;
//     isMobile?: boolean;
// }) {
//     const theme = useTheme();
//     const styles = useStyles();
//     const personName = type === 'pay' ? txn.toName : txn.fromName;
//     const personEmail = type === 'pay'
//         ? (txn.toEmail || txn.toUser?.email || txn.to?.email || txn.toEmailAddress || txn.toUserEmail || '')
//         : (txn.fromEmail || txn.fromUser?.email || txn.from?.email || txn.fromEmailAddress || txn.fromUserEmail || '');
//     const isPending = txn.status === 'pending';
//     const isInitiated = txn.status === 'initiated';
//     const isConfirmed = txn.status === 'confirmed';
//     const isDisputed = txn.status === 'disputed';
//     const isRejected = txn.status === 'rejected' || (txn.rejectedAt && txn.status === 'pending');

//     const themeColor = type === 'pay' ? theme.colors.danger : theme.colors.success;
//     const themeBg = type === 'pay' ? theme.colors.dangerBg : theme.colors.successBg;

//     return (
//         <View style={[styles.payCard, isMobile && styles.payCardMobile, isConfirmed && styles.payCardDone]}>
//             {/* Main Clickable Row */}
//             <Pressable
//                 onPress={onToggle}
//                 style={({ hovered }: WebPressableState) => [
//                     styles.payRowMain,
//                     Platform.OS === 'web' && hovered && ({ opacity: 0.8, cursor: 'pointer' } as any)
//                 ]}
//             >
//                 <View style={styles.payPersonInfo}>
//                     <View style={[styles.payAvatar, isMobile && styles.payAvatarMobile, { backgroundColor: themeBg }]}>
//                         <Text style={[styles.payAvatarText, isMobile && styles.payAvatarTextMobile, { color: themeColor }]}>
//                             {personName ? personName.charAt(0).toUpperCase() : '?'}
//                         </Text>
//                     </View>
//                     <View>
//                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
//                             <Text style={[styles.payName, isMobile && styles.payNameMobile]}>{personName || 'User'}</Text>
//                             {personEmail ? (
//                                 <View style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
//                                     <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontWeight: '500' }}>
//                                         {personEmail}
//                                     </Text>
//                                 </View>
//                             ) : null}
//                         </View>
//                         <View style={styles.payStatusRow}>
//                             <Text style={[styles.payActionText, isMobile && styles.payActionTextMobile]}>
//                                 {type === 'pay' ? 'You pay' : 'Pays you'}
//                             </Text>
//                             {isConfirmed && (
//                                 <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, gap: 2 }}>
//                                     <AppIcon name="check-circle-2" size={12} color={theme.colors.success} />
//                                     <Text style={[styles.statusBadgeIcon, { color: theme.colors.success }]}>Confirmed</Text>
//                                 </View>
//                             )}
//                             {isInitiated && (
//                                 <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, gap: 2 }}>
//                                     <AppIcon name="clock" size={12} color={theme.colors.warning} />
//                                     <Text style={[styles.statusBadgeIcon, { color: theme.colors.warning }]}>Sent</Text>
//                                 </View>
//                             )}
//                             {isDisputed && (
//                                 <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, gap: 2 }}>
//                                     <AppIcon name="flag" size={12} color={theme.colors.danger} />
//                                     <Text style={[styles.statusBadgeIcon, { color: theme.colors.danger }]}>Disputed</Text>
//                                 </View>
//                             )}
//                         </View>
//                     </View>
//                 </View>

//                 <View style={styles.payAmountWrap}>
//                     <Text style={[styles.payAmount, isMobile && styles.payAmountMobile, { color: themeColor }]}>
//                         {formatCurrency(txn.amountBase, txn.baseCurrency || 'INR')}
//                     </Text>
//                     {breakdown.length > 0 && (
//                         <View style={[styles.expandPill, isMobile && styles.expandPillMobile]}>
//                             <Text style={[styles.expandText, isMobile && styles.expandTextMobile]}>{expanded ? 'Hide' : 'Details'}</Text>
//                             <AppIcon name={expanded ? 'chevron-up' : 'chevron-down'} size={10} color={theme.colors.textSecondary} />
//                         </View>
//                     )}
//                 </View>
//             </Pressable>

//             {/* Rejection notice banner if recently rejected */}
//             {isRejected && txn.rejectionReason && !isConfirmed && (
//                 <View style={[styles.rejectionBanner, { backgroundColor: theme.colors.dangerBg }]}>
//                     <Text style={[styles.rejectionText, { color: theme.colors.danger }]}>
//                         Payment was not confirmed: "{txn.rejectionReason}". You can pay again.
//                     </Text>
//                 </View>
//             )}

//             {/* Actions Array */}
//             {!isConfirmed && !isDisputed && (
//                 <View style={[styles.actionsContainer, isMobile && styles.actionsContainerMobile]}>
//                     <Pressable
//                         style={({ hovered, pressed }: WebPressableState) => [
//                             styles.disputeBtn,
//                             Platform.OS === 'web' && hovered && ({ backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerLight } as any),
//                             pressed && styles.pressedState
//                         ]}
//                         onPress={onDispute}
//                     >
//                         <AppIcon name="flag" size={16} color={theme.colors.danger} />
//                     </Pressable>

//                     {/* PAYER ACTIONS */}
//                     {type === 'pay' && (isPending || isRejected) && (
//                         <>
//                             <Pressable
//                                 style={({ hovered, pressed }: WebPressableState) => [
//                                     styles.actionBtn,
//                                     { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderLight },
//                                     Platform.OS === 'web' && hovered && ({ opacity: 0.9, cursor: 'pointer' } as any),
//                                     pressed && styles.pressedState
//                                 ]}
//                                 onPress={onMarkPaid}
//                             >
//                                 <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>Mark Paid</Text>
//                             </Pressable>
//                             <Pressable
//                                 style={({ hovered, pressed }: WebPressableState) => [
//                                     styles.actionBtn,
//                                     { backgroundColor: theme.colors.textPrimary },
//                                     Platform.OS === 'web' && hovered && ({ opacity: 0.9, cursor: 'pointer' } as any),
//                                     pressed && styles.pressedState
//                                 ]}
//                                 onPress={onPay}
//                             >
//                                 <Text style={[styles.actionBtnText, { color: theme.colors.surface }]}>Pay via UPI</Text>
//                             </Pressable>
//                         </>
//                     )}

//                     {type === 'pay' && isInitiated && (
//                         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }}>
//                             <Text style={{ fontSize: 12, color: theme.colors.textSecondary, fontStyle: 'italic' }}>
//                                 Waiting for {personName} to confirm receipt
//                             </Text>
//                         </View>
//                     )}

//                     {/* RECEIVER ACTIONS */}
//                     {type === 'receive' && (isPending || isRejected) && (
//                         <>
//                             <Pressable
//                                 style={({ hovered, pressed }: WebPressableState) => [
//                                     styles.actionBtn,
//                                     { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderLight },
//                                     Platform.OS === 'web' && hovered && ({ opacity: 0.9, cursor: 'pointer' } as any),
//                                     pressed && styles.pressedState
//                                 ]}
//                                 onPress={onRemind}
//                             >
//                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
//                                     <AppIcon name="bell" size={14} color={theme.colors.textPrimary} />
//                                     <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>Remind</Text>
//                                 </View>
//                             </Pressable>
//                             <Pressable
//                                 style={({ hovered, pressed }: WebPressableState) => [
//                                     styles.actionBtn,
//                                     { backgroundColor: theme.colors.success },
//                                     Platform.OS === 'web' && hovered && ({ opacity: 0.9, cursor: 'pointer' } as any),
//                                     pressed && styles.pressedState
//                                 ]}
//                                 onPress={onConfirm}
//                             >
//                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
//                                     <AppIcon name="check" size={14} color="#fff" />
//                                     <Text style={[styles.actionBtnText, { color: theme.colors.surface }]}>Confirm Received</Text>
//                                 </View>
//                             </Pressable>
//                         </>
//                     )}

//                     {type === 'receive' && isInitiated && (
//                         <>
//                             <Pressable
//                                 style={({ hovered, pressed }: WebPressableState) => [
//                                     styles.actionBtn,
//                                     { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.dangerLight },
//                                     Platform.OS === 'web' && hovered && ({ opacity: 0.9, cursor: 'pointer' } as any),
//                                     pressed && styles.pressedState
//                                 ]}
//                                 onPress={onReject}
//                             >
//                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
//                                     <AppIcon name="x" size={14} color={theme.colors.danger} />
//                                     <Text style={[styles.actionBtnText, { color: theme.colors.danger }]}>Reject</Text>
//                                 </View>
//                             </Pressable>
//                             <Pressable
//                                 style={({ hovered, pressed }: WebPressableState) => [
//                                     styles.actionBtn,
//                                     { backgroundColor: theme.colors.success },
//                                     Platform.OS === 'web' && hovered && ({ opacity: 0.9, cursor: 'pointer' } as any),
//                                     pressed && styles.pressedState
//                                 ]}
//                                 onPress={onConfirm}
//                             >
//                                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
//                                     <AppIcon name="check" size={14} color="#fff" />
//                                     <Text style={[styles.actionBtnText, { color: theme.colors.surface }]}>Confirm Received</Text>
//                                 </View>
//                             </Pressable>
//                         </>
//                     )}
//                 </View>
//             )}

//             {/* Receipt Breakdown */}
//             {expanded && breakdown.length > 0 && (
//                 <View style={[styles.breakdownContainer, isMobile && styles.breakdownContainerMobile]}>
//                     <Text style={[styles.breakdownHeader, isMobile && styles.breakdownHeaderMobile]}>Expense Breakdown</Text>
//                     {breakdown.map((item, i) => (
//                         <View key={i} style={[styles.breakRow, isMobile && styles.breakRowMobile, i === breakdown.length - 1 && { borderBottomWidth: 0 }]}>
//                             <View style={[styles.breakEmojiWrap, isMobile && styles.breakEmojiWrapMobile]}>
//                                 <AppIcon name={CATEGORY_ICONS[item.category] || 'file-text'} size={14} color={theme.colors.textPrimary} />
//                             </View>
//                             <View style={styles.breakInfo}>
//                                 <Text style={[styles.breakTitle, isMobile && styles.breakTitleMobile]} numberOfLines={1}>{item.title}</Text>
//                                 <Text style={[styles.breakMeta, isMobile && styles.breakMetaMobile]}>{item.stopName} • {format(new Date(item.date), 'MMM d')}</Text>
//                             </View>
//                             <Text style={[styles.breakAmount, isMobile && styles.breakAmountMobile]}>{formatCurrency(item.amount, txn.baseCurrency || "INR")}</Text>
//                         </View>
//                     ))}
//                 </View>
//             )}
//         </View>
//     );
// }

// // ============================================================
// // Premium Styles
// // ============================================================

// const useStyles = () => {
//     const theme = useTheme();
//     return useMemo(() => StyleSheet.create({
//         container: { flex: 1, backgroundColor: 'transparent' },

//         // Widescreen wrapper
//         webDesktopContent: { flex: 1, width: '100%' },
//         webDesktopContentCentered: { maxWidth: 1280, alignSelf: 'center', backgroundColor: 'transparent', width: '100%' },
//         desktopScrollContent: {
//             maxWidth: 1280,
//             alignSelf: 'center',
//             width: '100%',
//             paddingHorizontal: 24,
//         },
//         mainLayout: {
//             flexDirection: 'column',
//             gap: 20,
//         },
//         mainLayoutDesktop: {
//             flexDirection: 'row',
//             alignItems: 'flex-start',
//             gap: 32,
//         },
//         leftCol: {
//             width: '100%',
//         },
//         leftColDesktop: {
//             width: 400,
//             position: 'sticky' as any,
//             top: 20,
//         },
//         rightCol: {
//             flex: 1,
//             width: '100%',
//         },
//         rightColDesktop: {
//             flex: 1,
//         },

//         // Web Interaction Helpers
//         pressedState: { transform: [{ translateY: 0 }], opacity: 0.8 },

//         // Loading
//         loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', gap: 12 },
//         loadingText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },

//         // Header
//         header: {
//             flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//             paddingHorizontal: 20, paddingBottom: 16, backgroundColor: 'transparent',
//             borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight
//         },
//         backBtnWrap: { width: 40, alignItems: 'flex-start' },
//         headerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary },
//         refreshBtnWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderLight },

//         scroll: { paddingHorizontal: 20 },
//         sectionSubtitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
//         sectionSubtitleMobile: { fontSize: 11, marginBottom: 8, marginTop: 4 },

//         // Net Balance Hero Card
//         balanceCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, ...theme.shadows.sm, shadowOpacity: 0.04 },
//         balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
//         balanceIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
//         balanceLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
//         balanceAmount: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },

//         // Group Balances
//         groupBalancesSection: { marginBottom: 20, marginHorizontal: -20 },
//         groupBalancesScroll: { paddingHorizontal: 20, gap: 10 },
//         groupBalanceCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', minWidth: 100, borderWidth: 1, borderColor: theme.colors.borderLight, ...theme.shadows.sm, shadowOpacity: 0.02 },
//         gbAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
//         gbAvatarText: { fontSize: 16, fontWeight: '800' },
//         gbName: { fontSize: 12, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4, maxWidth: 80, textAlign: 'center' },
//         gbAmount: { fontSize: 14, fontWeight: '800' },

//         // Payment Row Card
//         payCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.borderLight, ...theme.shadows.sm, shadowOpacity: 0.03 },
//         payCardMobile: { padding: 14, borderRadius: 16, marginBottom: 10 },
//         payCardDone: { opacity: 0.6 },
//         payRowMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//         payPersonInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
//         payAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
//         payAvatarMobile: { width: 40, height: 40, borderRadius: 12 },
//         payAvatarText: { fontSize: 20, fontWeight: '800' },
//         payAvatarTextMobile: { fontSize: 16 },
//         payName: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 1 },
//         payNameMobile: { fontSize: 13 },
//         payStatusRow: { flexDirection: 'row', alignItems: 'center' },
//         payActionText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
//         payActionTextMobile: { fontSize: 11 },
//         statusBadgeIcon: { fontSize: 11, marginLeft: 2, fontWeight: '600' },
//         payAmountWrap: { alignItems: 'flex-end' },
//         payAmount: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
//         payAmountMobile: { fontSize: 16, marginBottom: 3 },
//         expandPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface || 'transparent', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 3 },
//         expandPillMobile: { paddingHorizontal: 5, paddingVertical: 2, gap: 2 },
//         expandText: { fontSize: 10, fontWeight: '600', color: theme.colors.textSecondary },
//         expandTextMobile: { fontSize: 9 },

//         rejectionBanner: { borderRadius: 10, padding: 10, marginTop: 10 },
//         rejectionText: { fontSize: 12, fontWeight: '600', lineHeight: 16 },

//         // Actions
//         actionsContainer: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.borderLight },
//         actionsContainerMobile: { gap: 8, marginTop: 10, paddingTop: 10 },
//         actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
//         actionBtnText: { fontSize: 13, fontWeight: '700' },
//         disputeBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.borderDefault, ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } : {}) } as any,

//         // Receipt Breakdown
//         breakdownContainer: { backgroundColor: theme.colors.surface || 'transparent', borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: theme.colors.borderLight },
//         breakdownContainerMobile: { padding: 12, borderRadius: 12, marginTop: 10 },
//         breakdownHeader: { fontSize: 11, fontWeight: '700', color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
//         breakdownHeaderMobile: { fontSize: 10, marginBottom: 8 },
//         breakRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.borderDefault },
//         breakRowMobile: { gap: 8, paddingVertical: 8 },
//         breakEmojiWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
//         breakEmojiWrapMobile: { width: 28, height: 28 },
//         breakInfo: { flex: 1 },
//         breakTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 1 },
//         breakTitleMobile: { fontSize: 12 },
//         breakMeta: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '500' },
//         breakMetaMobile: { fontSize: 9 },
//         breakAmount: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
//         breakAmountMobile: { fontSize: 12 },

//         // Others Compact Row
//         otherRow: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//         otherRowMobile: { padding: 12, borderRadius: 12, marginBottom: 8 },
//         otherFlow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
//         otherName: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
//         otherArrowWrap: { alignItems: 'center', paddingHorizontal: 6 },
//         otherArrowText: { fontSize: 9, color: theme.colors.textTertiary, fontWeight: '600', marginBottom: 1 },
//         otherArrowAmount: { fontSize: 12, color: theme.colors.textPrimary, fontWeight: '800' },
//         statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
//         statusBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },

//         // Empty
//         emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 },
//         emptyBoxMobile: { paddingVertical: 30 },
//         emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...theme.shadows.sm, borderWidth: 1, borderColor: theme.colors.borderLight },
//         emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 6 },
//         emptySub: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 20 },
//         primaryButton: {
//             backgroundColor: theme.colors.textPrimary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14,
//             ...(Platform.OS === 'web' ? { transition: 'opacity 0.2s ease', cursor: 'pointer' } : {}),
//         } as any,
//         primaryButtonHovered: { opacity: 0.9 },
//         primaryButtonText: { color: theme.colors.surface, fontSize: 13, fontWeight: '700', textAlign: 'center' },

//         // Help
//         helpToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 6 },
//         helpToggleText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
//         helpBox: { flexDirection: 'row', backgroundColor: theme.colors.primaryBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.borderDefault, marginBottom: 16 },
//         helpTextWrap: { flex: 1 },
//         helpText: { fontSize: 12, color: theme.colors.textPrimary, lineHeight: 18, marginBottom: 6 },
//         bold: { fontWeight: '700' },

//         // Modal
//         modalOverlay: {
//             flex: 1,
//             backgroundColor: 'rgba(0,0,0,0.65)',
//             justifyContent: 'center',
//             alignItems: 'center',
//             padding: 16,
//         },
//         modalContent: {
//             borderRadius: 24,
//             width: '100%',
//             maxWidth: 520,
//             maxHeight: '85%',
//             padding: 22,
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
//             ...theme.shadows.lg,
//         },
//         modalHeader: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             marginBottom: 18,
//             paddingBottom: 14,
//             borderBottomWidth: 1,
//             borderBottomColor: theme.colors.borderLight,
//         },
//         historyHeaderIconWrap: {
//             width: 38,
//             height: 38,
//             borderRadius: 19,
//             backgroundColor: theme.colors.primaryBg || `${theme.colors.primary}18`,
//             alignItems: 'center',
//             justifyContent: 'center',
//         },
//         modalTitle: {
//             fontSize: 17,
//             fontWeight: '800',
//             color: theme.colors.textPrimary,
//             letterSpacing: -0.3,
//         },
//         modalSubtitle: {
//             fontSize: 12,
//             fontWeight: '500',
//             color: theme.colors.textTertiary,
//             marginTop: 2,
//         },
//         modalCloseBtn: {
//             width: 34,
//             height: 34,
//             borderRadius: 17,
//             backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
//             alignItems: 'center',
//             justifyContent: 'center',
//         },
//         modalScroll: {
//             flexGrow: 0,
//         },
//         modalScrollContent: {
//             paddingBottom: 10,
//         },

//         // Loading State
//         historyLoadingBox: {
//             alignItems: 'center',
//             justifyContent: 'center',
//             paddingVertical: 40,
//             gap: 10,
//         },
//         historyLoadingText: {
//             fontSize: 13,
//             fontWeight: '600',
//             color: theme.colors.textSecondary,
//         },

//         // Empty State
//         historyEmptyBox: {
//             alignItems: 'center',
//             justifyContent: 'center',
//             paddingVertical: 36,
//             paddingHorizontal: 20,
//         },
//         historyEmptyIconCircle: {
//             width: 56,
//             height: 56,
//             borderRadius: 28,
//             backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
//             alignItems: 'center',
//             justifyContent: 'center',
//             marginBottom: 12,
//         },
//         historyEmptyTitle: {
//             fontSize: 16,
//             fontWeight: '800',
//             color: theme.colors.textPrimary,
//             marginBottom: 4,
//         },
//         historyEmptySub: {
//             fontSize: 13,
//             color: theme.colors.textSecondary,
//             textAlign: 'center',
//             lineHeight: 18,
//             maxWidth: 320,
//         },

//         // Timeline
//         timelineContainer: {
//             paddingTop: 6,
//         },
//         timelineItem: {
//             flexDirection: 'row',
//             gap: 14,
//             marginBottom: 14,
//         },
//         timelineTrack: {
//             alignItems: 'center',
//             width: 28,
//         },
//         timelineIconBadge: {
//             width: 28,
//             height: 28,
//             borderRadius: 14,
//             alignItems: 'center',
//             justifyContent: 'center',
//         },
//         timelineConnector: {
//             width: 2,
//             flex: 1,
//             marginTop: 4,
//             marginBottom: -4,
//         },
//         timelineCard: {
//             flex: 1,
//             padding: 12,
//             borderRadius: 14,
//             borderWidth: 1,
//             gap: 6,
//         },
//         timelineCardHeader: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             gap: 8,
//         },
//         timelineActionTitle: {
//             fontSize: 14,
//             fontWeight: '700',
//             flex: 1,
//         },
//         timelineAmountBadge: {
//             paddingHorizontal: 8,
//             paddingVertical: 3,
//             borderRadius: 8,
//         },
//         timelineAmountText: {
//             fontSize: 12,
//             fontWeight: '800',
//         },
//         timelineMetaRow: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 6,
//         },
//         timelineActorText: {
//             fontSize: 12,
//         },
//         timelineDotSep: {
//             fontSize: 12,
//         },
//         timelineDateText: {
//             fontSize: 11,
//             fontWeight: '500',
//         },
//         timelineReasonBox: {
//             paddingHorizontal: 8,
//             paddingVertical: 4,
//             borderRadius: 6,
//             marginTop: 2,
//         },
//         timelineReasonText: {
//             fontSize: 11,
//             fontWeight: '600',
//         },

//         reasonInput: {
//             borderWidth: 1,
//             borderColor: theme.colors.borderLight,
//             borderRadius: 12,
//             padding: 12,
//             fontSize: 14,
//             color: theme.colors.textPrimary,
//             backgroundColor: theme.colors.background,
//             textAlignVertical: 'top',
//         },
//         modalBtn: {
//             flex: 1,
//             paddingVertical: 12,
//             borderRadius: 12,
//             alignItems: 'center',
//             justifyContent: 'center',
//         },
//     }), [theme]);
// };
