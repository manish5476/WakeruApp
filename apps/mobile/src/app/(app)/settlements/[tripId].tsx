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
  useRevertPayment,
  useRemindPayer,
  useTrip,
  useInfiniteTripExpenses,
  useTripSummary,
  useSettlementHistory,
  useSettleAll,
} from '../../../hooks';
import { formatCurrency } from '../../../utils/formatters';
import { haptics } from '../../../utils/haptics';
import { openUPIApp } from '../../../utils/upi';
import { settlementsApi } from '../../../services/api/settlements.api';
import { showToast } from '../../../utils/toast';
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
  const {
    data: expensesData,
    refetch: refetchExpenses,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTripExpenses(tripId, { isSettled: 'false' });

  const { mutate: calculateSettlement, isPending: isCalculating } =
    useCalculateSettlement();
  const { mutate: initiatePayment } = useInitiatePayment();
  const { mutate: confirmTransaction } = useConfirmTransaction();
  const { mutate: disputePayment } = useDisputePayment();
  const { mutate: settleAll, isPending: isSettlingAll } = useSettleAll();
  const { mutate: settleSingle } = useSettleSingle();
  const { mutate: rejectPayment } = useRejectPayment();
  const { mutate: revertPayment } = useRevertPayment();
  const { mutate: remindPayer } = useRemindPayer();

  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedTxn, setExpandedTxn] = useState<string | null>(null);
  const [activeTxnId, setActiveTxnId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingTxnId, setRejectingTxnId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Premium Notice / Confirmation Modal
  const [noticeModal, setNoticeModal] = useState<{
    visible: boolean;
    type: 'warning' | 'upi' | 'confirm' | 'dispute';
    title: string;
    message: string;
    subMessage?: string;
    primaryActionText: string;
    secondaryActionText?: string;
    onPrimary: () => void;
    onSecondary?: () => void;
  } | null>(null);

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

  React.useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

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
  const allExpenses = useMemo(
    () => (expensesData?.pages || []).flatMap((page: any) => page.expenses),
    [expensesData],
  );
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

  const isTripAdmin = useMemo(() => {
    if (!trip || !currentUids.size) return false;
    const currentMember = trip.members?.find((m: any) =>
      currentUids.has(getParticipantId(m.userId)),
    );
    return (
      currentMember?.role === 'admin' ||
      currentUids.has(getParticipantId(trip.createdBy))
    );
  }, [trip, currentUids]);

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
      onError: (err: any) => {
        showToast.error(
          'Settlement Notice',
          err?.message || 'Could not recalculate settlement',
        );
        refreshData();
      },
    });
  };

  const handlePay = (txnId: string) => {
    setActiveTxnId(txnId);
    setActiveAction('pay');
    haptics.selection();
    initiatePayment(
      { tripId, transactionId: txnId },
      {
        onSettled: () => {
          setActiveTxnId(null);
          setActiveAction(null);
        },
        onSuccess: (data: any) => {
          refreshData();
          if (data?.upiDeepLink) {
            setNoticeModal({
              visible: true,
              type: 'upi',
              title: 'Open UPI App',
              message:
                'Proceed to complete payment with your preferred UPI app?',
              primaryActionText: 'Pay via UPI',
              secondaryActionText: 'Cancel',
              onPrimary: () => {
                setNoticeModal(null);
                openUPIApp(data.upiDeepLink);
              },
              onSecondary: () => setNoticeModal(null),
            });
          }
        },
        onError: (error: any) => {
          const errMsg = error?.message || 'Could not launch payment gateway.';
          const isUpiMissing = errMsg.toLowerCase().includes('upi');
          setNoticeModal({
            visible: true,
            type: 'warning',
            title: isUpiMissing ? 'UPI Not Configured' : 'Payment Notice',
            message: errMsg,
            subMessage: isUpiMissing
              ? 'The recipient has not set up their UPI ID yet. You can remind them to add it in Profile Settings, or pay via Cash / Bank and record it as paid.'
              : undefined,
            primaryActionText: isUpiMissing
              ? 'Mark as Paid in Cash'
              : 'Understood',
            secondaryActionText: isUpiMissing ? 'Dismiss' : undefined,
            onPrimary: () => {
              setNoticeModal(null);
              if (isUpiMissing) {
                handleMarkPaid(txnId);
              }
            },
            onSecondary: isUpiMissing ? () => setNoticeModal(null) : undefined,
          });
        },
      },
    );
  };

  const handleMarkPaid = (txnId: string) => {
    setActiveTxnId(txnId);
    setActiveAction('mark_paid');
    haptics.selection();
    settleSingle(
      { tripId, transactionId: txnId },
      {
        onSettled: () => {
          setActiveTxnId(null);
          setActiveAction(null);
        },
        onSuccess: () => {
          refreshData();
        },
      },
    );
  };

  const handleConfirm = (txnId: string) => {
    setActiveTxnId(txnId);
    setActiveAction('confirm');
    haptics.selection();
    confirmTransaction(
      { tripId, transactionId: txnId },
      {
        onSettled: () => {
          setActiveTxnId(null);
          setActiveAction(null);
        },
        onSuccess: () => {
          refreshData();
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
        },
      },
    );
  };

  const handleRevertPayment = (txnId: string, currentStatus?: string) => {
    haptics.warning();
    const isConf = currentStatus === 'confirmed';
    const isDisp = currentStatus === 'disputed';
    const title = isConf
      ? 'Undo Confirmed Settlement?'
      : isDisp
        ? 'Clear Dispute & Revert?'
        : 'Undo Payment Claim?';
    const message = isConf
      ? 'This will reset the transaction back to pending and restore the unsettled balance across linked trip expenses.'
      : isDisp
        ? 'This will reset this disputed transfer back to pending status for a fresh payment or calculation.'
        : 'This will reset the payment status back to pending, allowing you to re-initiate or adjust the transfer.';

    const execute = () => {
      revertPayment(
        { tripId, transactionId: txnId },
        {
          onSuccess: () => {
            refreshData();
          },
        },
      );
    };

    setNoticeModal({
      visible: true,
      type: 'dispute',
      title,
      message,
      primaryActionText: 'Revert',
      secondaryActionText: 'Cancel',
      onPrimary: () => {
        setNoticeModal(null);
        execute();
      },
      onSecondary: () => setNoticeModal(null),
    });
  };

  const handleRemind = (txnId: string) => {
    setActiveTxnId(txnId);
    setActiveAction('remind');
    haptics.selection();
    remindPayer(
      { tripId, transactionId: txnId },
      {
        onSettled: () => {
          setActiveTxnId(null);
          setActiveAction(null);
        },
        onError: (error: any) => {
          showToast.fromError(
            error,
            'Please wait before sending another ping.',
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
          },
        },
      );
    };

    setNoticeModal({
      visible: true,
      type: 'confirm',
      title: 'Settle All Balances',
      message: msg,
      primaryActionText: 'Settle All',
      secondaryActionText: 'Cancel',
      onPrimary: () => {
        setNoticeModal(null);
        execute();
      },
      onSecondary: () => setNoticeModal(null),
    });
  };

  const handleDispute = (txnId: string) => {
    haptics.warning();
    setNoticeModal({
      visible: true,
      type: 'dispute',
      title: 'Dispute Settlement',
      message: 'Flag this calculation for manual review by the group admin?',
      primaryActionText: 'Flag Dispute',
      secondaryActionText: 'Cancel',
      onPrimary: () => {
        setNoticeModal(null);
        disputePayment(
          { tripId, transactionId: txnId },
          {
            onSuccess: () => refreshData(),
          },
        );
      },
      onSecondary: () => setNoticeModal(null),
    });
  };

  const handleExport = async () => {
    haptics.selection();
    try {
      const res = await settlementsApi.exportSettlement(tripId, 'csv');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
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
        showToast.success('Export Ready 📄', 'Settlement CSV downloaded.');
      } else {
        showToast.success(
          'Export Ready 📄',
          'Your settlement CSV report has been generated.',
        );
      }
    } catch (err: any) {
      showToast.fromError(err, 'Could not generate settlement export');
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
                        onRevert={() =>
                          handleRevertPayment(txn._id, txn.status)
                        }
                        onDispute={() => handleDispute(txn._id)}
                        baseCurrency={baseCurrency}
                        styles={styles}
                        activeTxnId={activeTxnId}
                        activeAction={activeAction}
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
                        onRevert={() =>
                          handleRevertPayment(txn._id, txn.status)
                        }
                        onDispute={() => handleDispute(txn._id)}
                        baseCurrency={baseCurrency}
                        styles={styles}
                        activeTxnId={activeTxnId}
                        activeAction={activeAction}
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
                          {isTripAdmin &&
                            (txn.status === 'initiated' ||
                              txn.status === 'confirmed' ||
                              txn.status === 'disputed') && (
                              <Pressable
                                onPress={() =>
                                  handleRevertPayment(txn._id, txn.status)
                                }
                                hitSlop={8}
                                style={({ pressed }) => [
                                  {
                                    padding: 4,
                                    borderRadius: 6,
                                    backgroundColor: theme.colors.background,
                                    marginLeft: 6,
                                  },
                                  pressed && { opacity: 0.6 },
                                ]}
                              >
                                <AppIcon
                                  name="rotate-ccw"
                                  size={12}
                                  color={theme.colors.textSecondary}
                                />
                              </Pressable>
                            )}
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
                    const isReverted = h.action === 'payment_reverted';

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
                              : isReverted
                                ? 'rotate-ccw'
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
                              : isReverted
                                ? '#8B5CF6'
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
                                  : h.action === 'payment_reverted'
                                    ? 'Payment Reverted'
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

      {/* PREMIUM NOTICE / CONFIRMATION MODAL */}
      <Modal
        visible={!!noticeModal?.visible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNoticeModal(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setNoticeModal(null)}
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.08)',
                borderWidth: 1,
                padding: 24,
                borderRadius: 24,
                maxWidth: 400,
                alignSelf: 'center',
              },
            ]}
          >
            {/* Top Icon Badge */}
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor:
                  noticeModal?.type === 'warning'
                    ? 'rgba(245,158,11,0.15)'
                    : noticeModal?.type === 'upi'
                      ? 'rgba(16,185,129,0.15)'
                      : noticeModal?.type === 'dispute'
                        ? 'rgba(239,68,68,0.15)'
                        : 'rgba(59,130,246,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                alignSelf: 'center',
              }}
            >
              <AppIcon
                name={
                  noticeModal?.type === 'warning'
                    ? 'alert-circle'
                    : noticeModal?.type === 'upi'
                      ? 'smartphone'
                      : noticeModal?.type === 'dispute'
                        ? 'alert-triangle'
                        : 'check-circle'
                }
                size={26}
                color={
                  noticeModal?.type === 'warning'
                    ? '#F59E0B'
                    : noticeModal?.type === 'upi'
                      ? '#10B981'
                      : noticeModal?.type === 'dispute'
                        ? '#EF4444'
                        : '#3B82F6'
                }
              />
            </View>

            <Text
              style={[
                styles.modalTitle,
                {
                  color: theme.colors.textPrimary,
                  textAlign: 'center',
                  fontSize: 18,
                  marginBottom: 8,
                },
              ]}
            >
              {noticeModal?.title}
            </Text>

            <Text
              style={[
                styles.modalSub,
                {
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  fontSize: 14,
                  lineHeight: 20,
                  marginBottom: noticeModal?.subMessage ? 12 : 20,
                },
              ]}
            >
              {noticeModal?.message}
            </Text>

            {noticeModal?.subMessage ? (
              <View
                style={{
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.03)',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                }}
              >
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    lineHeight: 18,
                    textAlign: 'center',
                  }}
                >
                  💡 {noticeModal.subMessage}
                </Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={{ gap: 10, width: '100%' }}>
              <Pressable
                onPress={() => {
                  haptics.selection();
                  noticeModal?.onPrimary();
                }}
                style={({ pressed }) => [
                  {
                    backgroundColor:
                      noticeModal?.type === 'dispute'
                        ? '#EF4444'
                        : theme.colors.primary,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text
                  style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}
                >
                  {noticeModal?.primaryActionText}
                </Text>
              </Pressable>

              {noticeModal?.secondaryActionText ? (
                <Pressable
                  onPress={() => {
                    haptics.light();
                    if (noticeModal?.onSecondary) {
                      noticeModal.onSecondary();
                    } else {
                      setNoticeModal(null);
                    }
                  }}
                  style={({ pressed }) => [
                    {
                      paddingVertical: 12,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.1)',
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontWeight: '600',
                      fontSize: 13,
                    }}
                  >
                    {noticeModal.secondaryActionText}
                  </Text>
                </Pressable>
              ) : null}
            </View>
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
  onRevert,
  onDispute,
  baseCurrency,
  styles,
  activeTxnId,
  activeAction,
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
  onRevert?: () => void;
  onDispute: () => void;
  baseCurrency: string;
  styles: any;
  activeTxnId?: string | null;
  activeAction?: string | null;
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
                disabled={activeTxnId === txn._id}
                style={({ pressed }) => [
                  styles.actionBtnSecondary,
                  { borderColor: theme.colors.borderLight },
                  activeTxnId === txn._id && { opacity: 0.6 },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
              >
                {activeTxnId === txn._id && activeAction === 'mark_paid' ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <GlobalLoader
                      variant="inline"
                      size="small"
                      color={theme.colors.textPrimary}
                    />
                    <Text
                      style={[
                        styles.actionBtnSecondaryText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Recording…
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.actionBtnSecondaryText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Mark as Paid
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={onPay}
                disabled={activeTxnId === txn._id}
                style={({ pressed }) => [
                  styles.actionBtnPrimary,
                  { backgroundColor: '#2563EB' },
                  activeTxnId === txn._id && { opacity: 0.6 },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
              >
                {activeTxnId === txn._id && activeAction === 'pay' ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <GlobalLoader
                      variant="inline"
                      size="small"
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionBtnPrimaryText}>Launching…</Text>
                  </View>
                ) : (
                  <>
                    <AppIcon name="zap" size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnPrimaryText}>Pay via UPI</Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {type === 'pay' && isInitiated && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: 1,
                gap: 8,
              }}
            >
              <View style={[styles.awaitingConfirmationWrap, { flex: 1 }]}>
                <AppIcon name="clock" size={13} color="#D97706" />
                <Text
                  style={[
                    styles.awaitingConfirmationText,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  Awaiting confirmation from {personName}
                </Text>
              </View>
              {onRevert && (
                <Pressable
                  onPress={onRevert}
                  disabled={activeTxnId === txn._id}
                  style={({ pressed }) => [
                    styles.actionBtnSecondary,
                    {
                      borderColor: theme.colors.borderLight,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    },
                    activeTxnId === txn._id && { opacity: 0.6 },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <AppIcon
                    name="rotate-ccw"
                    size={12}
                    color={theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.actionBtnSecondaryText,
                      { color: theme.colors.textSecondary, fontSize: 12 },
                    ]}
                  >
                    Undo
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* RECEIVER CONTROLS */}
          {type === 'receive' && (isPending || isRejected) && (
            <>
              <Pressable
                onPress={onRemind}
                disabled={activeTxnId === txn._id}
                style={({ pressed }) => [
                  styles.actionBtnSecondary,
                  { borderColor: theme.colors.borderLight },
                  activeTxnId === txn._id && { opacity: 0.6 },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
              >
                {activeTxnId === txn._id && activeAction === 'remind' ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <GlobalLoader
                      variant="inline"
                      size="small"
                      color={theme.colors.textPrimary}
                    />
                    <Text
                      style={[
                        styles.actionBtnSecondaryText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Pinging…
                    </Text>
                  </View>
                ) : (
                  <>
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
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={onConfirm}
                disabled={activeTxnId === txn._id}
                style={({ pressed }) => [
                  styles.actionBtnPrimary,
                  { backgroundColor: '#10B981' },
                  activeTxnId === txn._id && { opacity: 0.6 },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
              >
                {activeTxnId === txn._id && activeAction === 'confirm' ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <GlobalLoader
                      variant="inline"
                      size="small"
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionBtnPrimaryText}>Confirming…</Text>
                  </View>
                ) : (
                  <>
                    <AppIcon name="check" size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnPrimaryText}>
                      Confirm Received
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          {type === 'receive' && isInitiated && (
            <>
              <Pressable
                onPress={onReject}
                disabled={activeTxnId === txn._id}
                style={({ pressed }) => [
                  styles.actionBtnDanger,
                  { borderColor: 'rgba(239,68,68,0.2)' },
                  activeTxnId === txn._id && { opacity: 0.6 },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
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
                disabled={activeTxnId === txn._id}
                style={({ pressed }) => [
                  styles.actionBtnPrimary,
                  { backgroundColor: '#10B981' },
                  activeTxnId === txn._id && { opacity: 0.6 },
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
              >
                {activeTxnId === txn._id && activeAction === 'confirm' ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <GlobalLoader
                      variant="inline"
                      size="small"
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionBtnPrimaryText}>Confirming…</Text>
                  </View>
                ) : (
                  <>
                    <AppIcon name="check" size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnPrimaryText}>
                      Confirm Received
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </View>
      )}

      {/* Confirmed Settlement Actions */}
      {isConfirmed && onRevert && (
        <View
          style={[
            styles.actionClusterRow,
            { justifyContent: 'flex-end', paddingTop: 6 },
          ]}
        >
          <Pressable
            onPress={onRevert}
            style={({ pressed }) => [
              styles.actionBtnSecondary,
              {
                borderColor: theme.colors.borderLight,
                paddingHorizontal: 12,
                paddingVertical: 6,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <AppIcon
              name="rotate-ccw"
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.actionBtnSecondaryText,
                { color: theme.colors.textSecondary, fontSize: 12 },
              ]}
            >
              Undo Settlement
            </Text>
          </Pressable>
        </View>
      )}

      {/* Disputed Settlement Actions */}
      {isDisputed && onRevert && (
        <View
          style={[
            styles.actionClusterRow,
            { justifyContent: 'flex-end', paddingTop: 6 },
          ]}
        >
          <Pressable
            onPress={onRevert}
            style={({ pressed }) => [
              styles.actionBtnSecondary,
              {
                borderColor: theme.colors.borderLight,
                paddingHorizontal: 12,
                paddingVertical: 6,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <AppIcon
              name="rotate-ccw"
              size={12}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.actionBtnSecondaryText,
                { color: theme.colors.textSecondary, fontSize: 12 },
              ]}
            >
              Reset Dispute
            </Text>
          </Pressable>
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
}
