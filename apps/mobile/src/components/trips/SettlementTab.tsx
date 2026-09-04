import GlobalLoader from '../common/GlobalLoader';
import AppIcon from '../common/AppIcon';
// components/trips/SettlementTab.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  useSettlement,
  useCalculateSettlement,
  useInitiatePayment,
  useConfirmPayment,
  useDisputePayment,
  useTrip,
  useTripExpenses,
  useTripSummary,
} from '../../hooks';
import { useAuthStore } from '../../stores/auth.store';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import { haptics } from '../../utils/haptics';
import { openUPIApp } from '../../utils/upi';
import { useTheme } from '../../providers/ThemeProvider';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useCreateSettlementReminder } from '../../hooks/useReminders';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

import { LinearGradient } from 'expo-linear-gradient';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📌',
};

function StatusPill({
  status,
}: {
  status: 'pending' | 'initiated' | 'confirmed' | 'disputed';
}) {
  const theme = useTheme();

  let label = 'Pending';
  let variant: 'warning' | 'success' | 'info' | 'danger' = 'warning';

  if (status === 'confirmed') {
    label = 'Completed';
    variant = 'success';
  }
  if (status === 'initiated') {
    label = 'Processing';
    variant = 'info';
  }
  if (status === 'disputed') {
    label = 'Disputed';
    variant = 'danger';
  }

  return <Badge label={label} variant={variant} />;
}

export default function SettlementTab({ tripId }: { tripId: string }) {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const currentUserId = user?.firebaseUid || user?._id || '';

  const isWebDesktop = Platform.OS === 'web' && width > 768;

  const { data: trip } = useTrip(tripId);
  const { data: summaryData } = useTripSummary(tripId);
  const { data: settlementData, isLoading } = useSettlement(tripId);
  const { data: expensesData } = useTripExpenses(tripId, {
    isSettled: 'false',
  });
  const { mutate: calculateSettlement, isPending: isCalculating } =
    useCalculateSettlement();
  const { mutate: initiatePayment, isPending: isInitiating } =
    useInitiatePayment();
  const { mutate: confirmPayment, isPending: isConfirming } =
    useConfirmPayment();
  const { mutate: disputePayment, isPending: isDisputing } =
    useDisputePayment();
  const { mutate: createSettlementReminder, isPending: isPinging } =
    useCreateSettlementReminder();

  const isProcessing = isInitiating || isConfirming || isDisputing || isPinging;

  const [expandedTxn, setExpandedTxn] = useState<string | null>(null);

  const settlement = settlementData?.settlement;
  const transactions = settlement?.transactions || [];
  const allExpenses =
    (expensesData as any)?.expenses ||
    (Array.isArray(expensesData) ? expensesData : []);
  const summaryMembers = summaryData?.summary?.members || [];
  const baseCurrency = settlement?.baseCurrency || trip?.baseCurrency || 'INR';

  const pendingTxns = useMemo(
    () =>
      transactions.filter(
        (t: any) =>
          t.status === 'pending' ||
          t.status === 'initiated' ||
          t.status === 'disputed',
      ),
    [transactions],
  );
  const completedTxns = useMemo(
    () => transactions.filter((t: any) => t.status === 'confirmed'),
    [transactions],
  );

  const youPay = useMemo(
    () => transactions.filter((t: any) => t.from === currentUserId),
    [transactions, currentUserId],
  );
  const youReceive = useMemo(
    () => transactions.filter((t: any) => t.to === currentUserId),
    [transactions, currentUserId],
  );

  const totalYouPay = useMemo(
    () =>
      youPay.reduce(
        (s: number, t: any) =>
          s + (t.amountBase || t.amountLocal || t.amount || 0),
        0,
      ),
    [youPay],
  );
  const totalYouReceive = useMemo(
    () =>
      youReceive.reduce(
        (s: number, t: any) =>
          s + (t.amountBase || t.amountLocal || t.amount || 0),
        0,
      ),
    [youReceive],
  );
  const netBalance = totalYouReceive - totalYouPay;
  const isAllSettled = transactions.length === 0;

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
          const isPayer = exp.paidBy === txn.to;
          const isDebtor = exp.splits?.some(
            (s: any) => s.userId === txn.from && !s.isPaid,
          );
          return isPayer && isDebtor;
        })
        .map((exp: any) => {
          const split = exp.splits?.find((s: any) => s.userId === txn.from);
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

  const getBreakdown = (txn: any) => {
    return breakdownsByTxnKey.get(`${txn.from}:${txn.to}`) || [];
  };

  const handlePay = (txnId: string) => {
    haptics.success();
    initiatePayment(
      { tripId, transactionId: txnId },
      {
        onSuccess: (data: any) => {
          if (data?.upiDeepLink) {
            Alert.alert('Open UPI', 'Complete payment via UPI app?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Pay Now', onPress: () => openUPIApp(data.upiDeepLink) },
            ]);
          }
        },
        onError: (error: any) =>
          Alert.alert(
            'Payment Failed',
            error.message || 'An error occurred while initiating payment.',
          ),
      },
    );
  };

  const handleConfirm = (txnId: string) => {
    haptics.success();
    confirmPayment(
      { tripId, transactionId: txnId },
      {
        onSuccess: () => Alert.alert('Done! ✅', 'Payment confirmed'),
        onError: (error: any) =>
          Alert.alert('Error', error.message || 'Failed to confirm payment.'),
      },
    );
  };

  const handleDispute = (txnId: string) => {
    haptics.warning();
    Alert.alert(
      'Dispute Payment?',
      'Flag this payment for review by the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispute',
          style: 'destructive',
          onPress: () =>
            disputePayment(
              { tripId, transactionId: txnId },
              {
                onError: (error: any) =>
                  Alert.alert(
                    'Error',
                    error.message || 'Failed to dispute payment.',
                  ),
              },
            ),
        },
      ],
    );
  };

  const handlePing = (txn: any) => {
    haptics.success();
    createSettlementReminder(
      {
        toUserId: txn.from,
        amount: txn.amountBase,
        tripId: tripId,
      },
      {
        onSuccess: () =>
          Alert.alert('Sent! 🔔', 'Persistent settlement reminder sent.'),
        onError: (error: any) =>
          Alert.alert('Error', error.message || 'Failed to send reminder.'),
      },
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          globalStyles.loadingContainer,
          { backgroundColor: 'transparent' },
        ]}
      >
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
        <Text
          style={[
            globalStyles.loadingText,
            { color: theme.colors.textSecondary },
          ]}
        >
          Calculating optimal settlements...
        </Text>
      </View>
    );
  }

  const renderContent = () => (
    <View
      style={[
        styles.scroll,
        {
          paddingBottom:
            Platform.OS === 'web'
              ? theme.spacing?.['24'] || 96
              : insets.bottom + (theme.spacing?.['24'] || 96),
        },
      ]}
    >
      {/* SETTLEMENT SUMMARY */}
      <Animated.View entering={FadeInDown.duration(600).springify()}>
        <GlassCard style={styles.summaryCard} intensity={theme.isDark ? 15 : 8}>
          <View style={styles.summaryHeader}>
            <Text
              style={[
                styles.summaryTitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Overall Settlement
            </Text>
            <StatusPill status={isAllSettled ? 'confirmed' : 'pending'} />
          </View>
          <View style={styles.summaryBalanceRow}>
            <Text
              style={[
                styles.summaryBalance,
                {
                  color:
                    netBalance >= 0
                      ? theme.colors.success
                      : theme.colors.danger,
                },
              ]}
            >
              ₹{Math.abs(netBalance).toLocaleString()}
            </Text>
          </View>
          <View
            style={[
              styles.summaryDivider,
              { backgroundColor: theme.colors.borderLight },
            ]}
          />
          <View style={styles.summaryGrid}>
            <View style={styles.summaryStat}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Pending
              </Text>
              <Text
                style={[styles.statValue, { color: theme.colors.textPrimary }]}
              >
                {pendingTxns.length}
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Completed
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {completedTxns.length}
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <Text
                style={[
                  styles.statLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Participants
              </Text>
              <Text
                style={[styles.statValue, { color: theme.colors.textPrimary }]}
              >
                {summaryMembers.length}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* SMART INSIGHTS */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(600).springify()}
        style={styles.insightsRow}
      >
        <GlassCard style={styles.insightCard} intensity={theme.isDark ? 10 : 5}>
          <Text style={styles.insightEmoji}>
            {netBalance === 0 ? '🎉' : netBalance > 0 ? '💰' : '💸'}
          </Text>
          <Text
            style={[styles.insightText, { color: theme.colors.textPrimary }]}
          >
            {netBalance === 0
              ? 'You have nothing to pay!'
              : netBalance > 0
                ? `You are owed ${formatCurrency(Math.abs(netBalance), baseCurrency)}`
                : `You owe ${formatCurrency(Math.abs(netBalance), baseCurrency)}`}
          </Text>
        </GlassCard>
        {pendingTxns.length > 0 && (
          <GlassCard
            style={styles.insightCard}
            intensity={theme.isDark ? 10 : 5}
          >
            <Text style={styles.insightEmoji}>⏱️</Text>
            <Text
              style={[styles.insightText, { color: theme.colors.textPrimary }]}
            >
              {pendingTxns.length} settlements remain.
            </Text>
          </GlassCard>
        )}
      </Animated.View>

      {/* TRANSACTIONS */}
      {isAllSettled ? (
        <Animated.View
          entering={FadeIn.delay(300).duration(800)}
          style={styles.emptyStateContainer}
        >
          <View
            style={[
              styles.emptyStateIconWrap,
              { backgroundColor: theme.colors.successBg },
            ]}
          >
            <AppIcon
              name="check-circle"
              size={64}
              color={theme.colors.success}
            />
          </View>
          <Text
            style={[
              styles.emptyStateTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            Everyone is Settled!
          </Text>
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.colors.textSecondary },
            ]}
          >
            All balances are cleared. Time to plan your next trip!
          </Text>
        </Animated.View>
      ) : (
        <>
          {pendingTxns.length > 0 && (
            <View style={styles.transactionSection}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Pending
                </Text>
                <Badge
                  label={pendingTxns.length.toString()}
                  variant="warning"
                />
              </View>
              <View style={isWebDesktop ? styles.webGrid : {}}>
                {pendingTxns.map((txn: any, idx: number) => (
                  <PaymentRow
                    key={txn._id}
                    txn={txn}
                    breakdown={getBreakdown(txn)}
                    expanded={expandedTxn === txn._id}
                    onToggle={() =>
                      setExpandedTxn(expandedTxn === txn._id ? null : txn._id)
                    }
                    onPay={() => handlePay(txn._id)}
                    onConfirm={() => handleConfirm(txn._id)}
                    onDispute={() => handleDispute(txn._id)}
                    onPing={() => handlePing(txn)}
                    currentUserId={currentUserId}
                    isProcessing={isProcessing}
                    index={idx}
                  />
                ))}
              </View>
            </View>
          )}

          {completedTxns.length > 0 && (
            <View style={styles.transactionSection}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Completed
                </Text>
                <Badge
                  label={completedTxns.length.toString()}
                  variant="success"
                />
              </View>
              <View style={isWebDesktop ? styles.webGrid : {}}>
                {completedTxns.map((txn: any, idx: number) => (
                  <PaymentRow
                    key={txn._id}
                    txn={txn}
                    breakdown={getBreakdown(txn)}
                    expanded={expandedTxn === txn._id}
                    onToggle={() =>
                      setExpandedTxn(expandedTxn === txn._id ? null : txn._id)
                    }
                    onPay={() => {}}
                    onConfirm={() => {}}
                    onDispute={() => {}}
                    onPing={() => {}}
                    currentUserId={currentUserId}
                    isProcessing={isProcessing}
                    index={idx}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View
        style={[
          styles.contentWrapper,
          isWebDesktop && styles.webDesktopContent,
        ]}
      >
        {/* Sticky Action Bar */}
        <GlassCard
          style={styles.stickyActionBar}
          intensity={theme.isDark ? 15 : 8}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionBarScroll}
          >
            <Pressable
              style={({ hovered }: WebPressableState) => [
                styles.actionItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' &&
                  hovered &&
                  ({ backgroundColor: theme.colors.overlayLight } as any),
              ]}
              onPress={() => calculateSettlement(tripId)}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <GlobalLoader
                  variant="inline"
                  size="small"
                  color={theme.colors.primary}
                />
              ) : (
                <AppIcon
                  name="refresh-cw"
                  size={16}
                  color={theme.colors.primary}
                />
              )}
              <Text
                style={[styles.actionItemText, { color: theme.colors.primary }]}
              >
                Refresh
              </Text>
            </Pressable>
            <Pressable
              style={({ hovered }: WebPressableState) => [
                styles.actionItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' &&
                  hovered &&
                  ({ backgroundColor: theme.colors.overlayLight } as any),
              ]}
              onPress={() => Alert.alert('Export', 'Coming Soon!')}
            >
              <AppIcon
                name="download"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionItemText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Export
              </Text>
            </Pressable>
            <Pressable
              style={({ hovered }: WebPressableState) => [
                styles.actionItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' &&
                  hovered &&
                  ({ backgroundColor: theme.colors.overlayLight } as any),
              ]}
              onPress={() => Alert.alert('History', 'Coming Soon!')}
            >
              <AppIcon
                name="clock"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.actionItemText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                History
              </Text>
            </Pressable>
          </ScrollView>
        </GlassCard>
        {renderContent()}
      </View>
    </View>
  );
}

// ============================================================
// REDESIGNED PAYMENT ROW
// ============================================================
function PaymentRow({
  txn,
  breakdown,
  expanded,
  onToggle,
  onPay,
  onConfirm,
  onDispute,
  onPing,
  currentUserId,
  isProcessing,
  index,
}: {
  txn: any;
  breakdown: any[];
  expanded: boolean;
  onToggle: () => void;
  onPay: () => void;
  onConfirm: () => void;
  onDispute: () => void;
  onPing: () => void;
  currentUserId: string;
  isProcessing?: boolean;
  index: number;
}) {
  const theme = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const cardScale = useSharedValue(1);

  const isConfirmed = txn.status === 'confirmed';
  const isPending = txn.status === 'pending';
  const isInitiated = txn.status === 'initiated';

  const amIPaying = txn.from === currentUserId;
  const amIReceiving = txn.to === currentUserId;

  const handlePressIn = () => {
    cardScale.value = withSpring(0.98);
  };
  const handlePressOut = () => {
    cardScale.value = withSpring(1);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .duration(500)
        .springify()}
      style={isWebDesktop ? { height: '100%' } : {}}
    >
      <AnimatedPressable
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ hovered }: WebPressableState) => [
          styles.transferCardContainer,
          Platform.OS === 'web' && hovered && styles.hoverLift,
          { transform: [{ scale: cardScale }] },
        ]}
      >
        <GlassCard
          style={[styles.transferCard, isConfirmed && { opacity: 0.7 }]}
          intensity={theme.isDark ? 15 : 8}
        >
          <View style={styles.transferHeader}>
            <Text
              style={[
                styles.transferDate,
                { color: theme.colors.textTertiary },
              ]}
            >
              {format(new Date(), 'MMM d, yyyy')}
            </Text>
            <StatusPill status={txn.status} />
          </View>

          <View style={styles.transferFlow}>
            <View style={styles.avatarNode}>
              <View
                style={[
                  styles.graphAvatar,
                  { backgroundColor: theme.colors.dangerBg },
                ]}
              >
                <Text
                  style={[
                    styles.graphAvatarText,
                    { color: theme.colors.danger },
                  ]}
                >
                  {txn.fromName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                style={[styles.graphName, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {amIPaying ? 'You' : txn.fromName.split(' ')[0]}
              </Text>
            </View>

            <View style={styles.flowArrowContainer}>
              <Text
                style={[styles.flowAmount, { color: theme.colors.textPrimary }]}
              >
                ₹{txn.amountBase.toLocaleString()}
              </Text>
              <View style={styles.flowLine}>
                <View
                  style={[
                    styles.flowLineDash,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
                <AppIcon
                  name="chevron-right"
                  size={12}
                  color={theme.colors.border}
                  style={styles.flowArrowHead}
                />
              </View>
            </View>

            <View style={styles.avatarNode}>
              <View
                style={[
                  styles.graphAvatar,
                  { backgroundColor: theme.colors.successBg },
                ]}
              >
                <Text
                  style={[
                    styles.graphAvatarText,
                    { color: theme.colors.success },
                  ]}
                >
                  {txn.toName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                style={[styles.graphName, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {amIReceiving ? 'You' : txn.toName.split(' ')[0]}
              </Text>
            </View>
          </View>

          {!isConfirmed && (amIPaying || amIReceiving) && (
            <View style={styles.transferActions}>
              <Pressable
                style={[
                  styles.iconButton,
                  {
                    borderColor: theme.colors.borderLight,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                onPress={onDispute}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <GlobalLoader
                    variant="inline"
                    size="small"
                    color={theme.colors.textSecondary}
                  />
                ) : (
                  <AppIcon
                    name="flag"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                )}
              </Pressable>

              {amIPaying && isPending && (
                <Pressable
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={onPay}
                  disabled={isProcessing}
                >
                  <Text style={styles.primaryButtonText}>Pay via UPI</Text>
                </Pressable>
              )}

              {amIReceiving && isPending && (
                <Pressable
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.colors.warning },
                  ]}
                  onPress={onPing}
                  disabled={isProcessing}
                >
                  <Text style={styles.primaryButtonText}>Remind</Text>
                </Pressable>
              )}

              {amIReceiving && isInitiated && (
                <Pressable
                  style={[
                    styles.primaryButton,
                    { backgroundColor: theme.colors.success },
                  ]}
                  onPress={onConfirm}
                  disabled={isProcessing}
                >
                  <Text style={styles.primaryButtonText}>Confirm Receipt</Text>
                </Pressable>
              )}
            </View>
          )}

          {expanded && breakdown.length > 0 && (
            <View style={styles.breakdownWrap}>
              <View
                style={[
                  styles.breakdownDivider,
                  { backgroundColor: theme.colors.borderLight },
                ]}
              />
              <Text
                style={[
                  styles.breakdownHeader,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Expense Breakdown
              </Text>
              {breakdown.map((item, i) => (
                <View key={i} style={styles.breakRow}>
                  <View
                    style={[
                      styles.breakEmojiWrap,
                      { backgroundColor: theme.colors.primaryBg },
                    ]}
                  >
                    <Text style={styles.breakEmoji}>
                      {CATEGORY_EMOJIS[item.category] || '📌'}
                    </Text>
                  </View>
                  <View style={styles.breakInfo}>
                    <Text
                      style={[
                        styles.breakTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.breakMeta,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {item.stopName} • {format(new Date(item.date), 'MMM d')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.breakAmount,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    ₹{item.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      </AnimatedPressable>
    </Animated.View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        contentWrapper: { flex: 1, width: '100%' },
        webDesktopContent: { maxWidth: 1024, alignSelf: 'center' },
        scroll: { padding: isMobile ? 16 : 24 },

        stickyActionBar: {
          paddingVertical: 10,
          paddingHorizontal: isMobile ? 16 : 24,
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: isMobile ? 12 : 16,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },
        actionBarScroll: { gap: 10, alignItems: 'center' },
        actionItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 100,
          borderWidth: 1,
        },
        actionItemText: { fontSize: 12, fontWeight: '700' },

        // Summary Dashboard
        summaryCard: {
          padding: isMobile ? 20 : 24,
          marginBottom: isMobile ? 12 : 16,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },
        summaryHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        },
        summaryTitle: {
          fontSize: 14,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        summaryBalanceRow: {
          alignItems: 'center',
          marginBottom: 20,
        },
        summaryBalance: {
          fontSize: 42,
          fontWeight: '900',
          letterSpacing: -1.5,
        },
        summaryDivider: {
          height: 1,
          marginBottom: 20,
        },
        summaryGrid: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        summaryStat: {
          flex: 1,
          alignItems: 'center',
        },
        statLabel: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        statValue: {
          fontSize: 20,
          fontWeight: '800',
        },

        // Insights
        insightsRow: {
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12,
          marginBottom: isMobile ? 16 : 24,
        },
        insightCard: {
          flex: 1,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },
        insightEmoji: { fontSize: 20 },
        insightText: { fontSize: 14, fontWeight: '600', flex: 1 },

        // Lists
        transactionSection: { marginBottom: isMobile ? 16 : 24 },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        },
        sectionTitle: {
          fontSize: 20,
          fontWeight: '800',
        },

        webGrid: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        } as any,

        // Transfer Cards
        transferCardContainer: {
          ...(!isMobile && Platform.OS === 'web'
            ? { height: '100%', display: 'flex', flexDirection: 'column' }
            : { width: '100%', marginBottom: 12 }),
          ...(Platform.OS === 'web'
            ? {
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }
            : {}),
        } as any,
        hoverLift: { transform: [{ translateY: -2 }] } as any,
        transferCard: {
          padding: 20,
          flex: 1,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },

        transferHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        },
        transferDate: {
          fontSize: 12,
          fontWeight: '600',
        },

        transferFlow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        },
        avatarNode: {
          alignItems: 'center',
          width: 60,
        },
        graphAvatar: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        },
        graphAvatarText: {
          fontSize: 18,
          fontWeight: '800',
        },
        graphName: {
          fontSize: 12,
          fontWeight: '700',
        },

        flowArrowContainer: {
          flex: 1,
          alignItems: 'center',
          paddingHorizontal: 12,
        },
        flowAmount: {
          fontSize: 16,
          fontWeight: '800',
          marginBottom: 4,
        },
        flowLine: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
        },
        flowLineDash: {
          flex: 1,
          height: 2,
          borderRadius: 1,
        },
        flowArrowHead: {
          marginLeft: -4,
        },

        transferActions: {
          flexDirection: 'row',
          gap: 10,
        },
        iconButton: {
          width: 40,
          height: 40,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        primaryButton: {
          flex: 1,
          height: 40,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        primaryButtonText: {
          fontSize: 13,
          fontWeight: '700',
          color: '#FFFFFF',
        },

        breakdownWrap: {
          marginTop: 16,
        },
        breakdownDivider: {
          height: 1,
          marginBottom: 16,
        },
        breakdownHeader: {
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        },
        breakRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        },
        breakEmojiWrap: {
          width: 28,
          height: 28,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
        breakEmoji: {
          fontSize: 14,
        },
        breakInfo: {
          flex: 1,
        },
        breakTitle: {
          fontSize: 13,
          fontWeight: '700',
        },
        breakMeta: {
          fontSize: 11,
          fontWeight: '500',
        },
        breakAmount: {
          fontSize: 13,
          fontWeight: '800',
        },

        // Empty State
        emptyStateContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 60,
          paddingHorizontal: 24,
        },
        emptyStateIconWrap: {
          width: 100,
          height: 100,
          borderRadius: 50,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        },
        emptyStateTitle: {
          fontSize: 24,
          fontWeight: '900',
          marginBottom: 12,
        },
        emptyStateText: {
          fontSize: 15,
          textAlign: 'center',
          lineHeight: 24,
        },
      }),
    [theme, isMobile],
  );
};
