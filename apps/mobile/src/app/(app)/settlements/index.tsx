// app/(app)/settlements.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { useMySettlements } from '../../../hooks';
import { formatCompactCurrency } from '../../../formatters/currency';
import { haptics } from '../../../utils/haptics';
import type { Theme } from '../../../theme';

type TabType = 'receivable' | 'payable';

// ============================================================
// PRESENTATION MODELS
// ============================================================

interface SettlementUI {
  id: string;
  tripId: string;
  personName: string;
  personEmail?: string;
  personInitials: string;
  tripName: string;
  reason: string;
  amountFormatted: string;
  amountRaw: number;
  isReceivable: boolean;
  statusLabel: string;
  statusColor: string;
  statusIcon: string;
  actionLabel: string;
  isPending: boolean;
}

interface SummaryUI {
  totalNetFormatted: string;
  isPositiveNet: boolean;
  totalReceivableFormatted: string;
  totalPayableFormatted: string;
  pendingCount: number;
  confirmedCount: number;
}

// ============================================================
// MAPPERS
// ============================================================

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    colorKey: 'success' | 'warning' | 'danger' | 'info';
    icon: string;
  }
> = {
  pending: { label: 'Pending', colorKey: 'warning', icon: 'clock' },
  initiated: { label: 'Initiated', colorKey: 'info', icon: 'send' },
  confirmed: { label: 'Confirmed', colorKey: 'success', icon: 'check-circle' },
  disputed: { label: 'Disputed', colorKey: 'danger', icon: 'alert-triangle' },
  rejected: { label: 'Rejected', colorKey: 'danger', icon: 'alert-circle' },
};

function mapSettlementToUI(
  transaction: any,
  isReceivable: boolean,
  theme: any,
): SettlementUI {
  const statusKey = transaction.status?.toLowerCase() || 'pending';
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const personName = isReceivable ? transaction.fromName : transaction.toName;
  const personEmail = isReceivable
    ? transaction.fromEmail ||
      transaction.fromUser?.email ||
      transaction.from?.email ||
      transaction.fromEmailAddress ||
      transaction.fromUserEmail ||
      ''
    : transaction.toEmail ||
      transaction.toUser?.email ||
      transaction.to?.email ||
      transaction.toEmailAddress ||
      transaction.toUserEmail ||
      '';
  const initials =
    personName
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  return {
    id: transaction._id || Math.random().toString(),
    tripId: transaction.tripId?._id || transaction.tripId,
    personName: personName || 'Member',
    personEmail: personEmail || undefined,
    personInitials: initials,
    tripName: transaction.tripTitle || 'Trip',
    reason: transaction.explanation?.[0] || 'Settlement balance',
    amountFormatted: formatCompactCurrency(
      transaction.amountBase,
      transaction.baseCurrency || 'INR',
    ),
    amountRaw: transaction.amountBase,
    isReceivable,
    statusLabel: config.label,
    statusColor: theme.colors[config.colorKey] || theme.colors.warning,
    statusIcon: config.icon,
    actionLabel: statusKey === 'pending' ? 'Settle Now' : 'View Details',
    isPending: statusKey === 'pending',
  };
}

function mapSummaryToUI(summary: any, baseCurrency: string = 'INR'): SummaryUI {
  const receivable = summary?.totalReceivable || 0;
  const payable = summary?.totalOwed || 0;
  const net = receivable - payable;

  return {
    totalNetFormatted: formatCompactCurrency(Math.abs(net), baseCurrency),
    isPositiveNet: net >= 0,
    totalReceivableFormatted: formatCompactCurrency(receivable, baseCurrency),
    totalPayableFormatted: formatCompactCurrency(payable, baseCurrency),
    pendingCount: summary?.totalPending || 0,
    confirmedCount: summary?.totalConfirmed || 0,
  };
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function PremiumSettlementCard({
  ui,
  onPress,
}: {
  ui: SettlementUI;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, false), [theme]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.transactionCardContainer,
        pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.transactionCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.txHeader}>
          {/* Avatar & Info */}
          <View style={styles.txPersonRow}>
            <View
              style={[
                styles.txAvatar,
                {
                  backgroundColor: ui.isReceivable
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(239,68,68,0.12)',
                },
              ]}
            >
              <Text
                style={[
                  styles.txAvatarText,
                  { color: ui.isReceivable ? '#059669' : '#DC2626' },
                ]}
              >
                {ui.personInitials}
              </Text>
            </View>
            <View style={styles.txInfo}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <Text
                  style={[
                    styles.txPersonName,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {ui.isReceivable ? 'From ' : 'To '}
                  <Text style={{ fontWeight: '900' }}>{ui.personName}</Text>
                </Text>
                {ui.personEmail ? (
                  <View
                    style={[
                      styles.emailPill,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(15,23,42,0.04)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.emailPillText,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {ui.personEmail}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[
                  styles.txTripName,
                  { color: theme.colors.textTertiary },
                ]}
                numberOfLines={1}
              >
                🧳 {ui.tripName} · {ui.reason}
              </Text>
            </View>
          </View>

          {/* Amount & Status */}
          <View style={styles.txAmountContainer}>
            <Text
              style={[
                styles.txAmount,
                { color: ui.isReceivable ? '#10B981' : '#EF4444' },
              ]}
            >
              {ui.isReceivable ? '+' : '−'}
              {ui.amountFormatted}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${ui.statusColor}18` },
              ]}
            >
              <AppIcon
                name={ui.statusIcon as any}
                size={11}
                color={ui.statusColor}
              />
              <Text style={[styles.statusText, { color: ui.statusColor }]}>
                {ui.statusLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button */}
        {ui.isPending && (
          <View
            style={[
              styles.txActionBtn,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.txActionBtnText}>{ui.actionLabel}</Text>
            <AppIcon name="arrow-right" size={14} color="#FFF" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function NetPositionHero({ ui }: { ui: SummaryUI }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, false), [theme]);

  return (
    <LinearGradient
      colors={['#0F172A', '#1E1B4B', '#1E293B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <View style={styles.heroTopRow}>
        <View
          style={[
            styles.heroPill,
            { backgroundColor: 'rgba(56,189,248,0.15)' },
          ]}
        >
          <AppIcon name="shield" size={12} color="#38BDF8" />
          <Text style={styles.heroPillText}>EXECUTIVE SETTLEMENT</Text>
        </View>
      </View>

      <Text style={styles.heroLabel}>Net Position</Text>

      <View style={styles.heroAmountRow}>
        <Text
          style={[
            styles.heroNetAmount,
            { color: ui.isPositiveNet ? '#34D399' : '#F87171' },
          ]}
        >
          {ui.isPositiveNet ? '+' : '−'}
          {ui.totalNetFormatted}
        </Text>
      </View>

      <View style={styles.heroDivider} />

      <View style={styles.heroMetricsRow}>
        <View style={styles.heroMetric}>
          <Text style={styles.metricLabel}>YOU'LL RECEIVE</Text>
          <Text style={[styles.metricValue, { color: '#34D399' }]}>
            {ui.totalReceivableFormatted}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.heroMetric}>
          <Text style={styles.metricLabel}>YOU OWE</Text>
          <Text style={[styles.metricValue, { color: '#F87171' }]}>
            {ui.totalPayableFormatted}
          </Text>
        </View>
      </View>

      {ui.pendingCount > 0 && (
        <View style={styles.heroFooter}>
          <AppIcon name="clock" size={13} color="#FBBF24" />
          <Text style={styles.heroFooterText}>
            {ui.pendingCount} Pending Settlement
            {ui.pendingCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

function PremiumSegmentedControl({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, false), [theme]);

  return (
    <View
      style={[
        styles.segmentContainer,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <Pressable
        style={[
          styles.segmentTab,
          activeTab === 'receivable' && styles.segmentActive,
        ]}
        onPress={() => {
          haptics.light();
          onTabChange('receivable');
        }}
      >
        <Text
          style={[
            styles.segmentText,
            {
              color:
                activeTab === 'receivable'
                  ? '#FFFFFF'
                  : theme.colors.textSecondary,
            },
          ]}
        >
          To Receive
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.segmentTab,
          activeTab === 'payable' && styles.segmentActive,
        ]}
        onPress={() => {
          haptics.light();
          onTabChange('payable');
        }}
      >
        <Text
          style={[
            styles.segmentText,
            {
              color:
                activeTab === 'payable'
                  ? '#FFFFFF'
                  : theme.colors.textSecondary,
            },
          ]}
        >
          To Pay
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function GlobalSettlementsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, firebaseUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('receivable');
  const [refreshing, setRefreshing] = useState(false);

  const isDesktop = width >= 860;
  const styles = useMemo(
    () => createStyles(theme, isDesktop),
    [theme, isDesktop],
  );

  const { data: response, isLoading, error, refetch } = useMySettlements();

  const data = (response as any)?.data || response || {};
  const transactions: any[] = data?.transactions || [];
  const summaryData = data?.summary || {};
  const primaryCurrency = transactions[0]?.baseCurrency || 'INR';

  const summaryUI = useMemo(
    () => mapSummaryToUI(summaryData, primaryCurrency),
    [summaryData, primaryCurrency],
  );

  const { receivableUI, payableUI } = useMemo(() => {
    const receivableList: SettlementUI[] = [];
    const payableList: SettlementUI[] = [];

    const currentUids = new Set(
      [
        user?.firebaseUid,
        user?._id,
        (user as any)?.uid,
        (user as any)?.id,
        firebaseUser?.uid,
      ]
        .filter(Boolean)
        .map(id => String(id).trim()),
    );

    const currentDisplayName = user?.displayName?.trim().toLowerCase() || '';

    const getParticipantId = (p: any): string => {
      if (!p) return '';
      if (typeof p === 'string') return p.trim();
      return String(
        p.firebaseUid || p.userId || p._id || p.uid || p.id || '',
      ).trim();
    };

    const isToMe = (t: any): boolean => {
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
    };

    const isFromMe = (t: any): boolean => {
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
    };

    transactions.forEach((t: any) => {
      if (!t || t.status === 'confirmed') return;

      if (isToMe(t)) {
        receivableList.push(mapSettlementToUI(t, true, theme));
      } else if (isFromMe(t)) {
        payableList.push(mapSettlementToUI(t, false, theme));
      }
    });

    return { receivableUI: receivableList, payableUI: payableList };
  }, [transactions, user, firebaseUser, theme]);

  const activeData = activeTab === 'receivable' ? receivableUI : payableUI;

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <GlobalBackground>
        <View style={styles.centerContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading settlements…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  if (error) {
    return (
      <GlobalBackground>
        <View style={styles.centerContainer}>
          <AppIcon
            name="alert-triangle"
            size={48}
            color={theme.colors.danger}
          />
          <Text style={[styles.errorText, { color: theme.colors.textPrimary }]}>
            Failed to load settlements
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </GlobalBackground>
    );
  }

  const hasData = transactions.length > 0;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
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
                Settlements Dashboard
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                Global incoming and outgoing obligations
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onRefresh}
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

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
            {/* ── LEFT COLUMN: NET POSITION & SEGMENT TABS ── */}
            <View style={[styles.bentoCol, isDesktop && { flex: 1.1 }]}>
              <NetPositionHero ui={summaryUI} />
              <PremiumSegmentedControl
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </View>

            {/* ── RIGHT COLUMN: SETTLEMENT CARDS ── */}
            <View style={[styles.bentoCol, isDesktop && { flex: 1.4 }]}>
              <View style={styles.sectionHeaderRow}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {activeTab === 'receivable'
                    ? 'Incoming Payments'
                    : 'Outgoing Payments'}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {activeData.length} ACTIVE
                  </Text>
                </View>
              </View>

              {hasData && activeData.length > 0 ? (
                <View style={styles.list}>
                  {activeData.map(ui => (
                    <PremiumSettlementCard
                      key={ui.id}
                      ui={ui}
                      onPress={() => {
                        if (ui.tripId)
                          router.push(`/(app)/settlements/${ui.tripId}` as any);
                      }}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="🎉"
                  title="You're All Settled!"
                  description={
                    activeTab === 'receivable'
                      ? 'No pending incoming payments to collect.'
                      : 'No pending outgoing payments to clear.'
                  }
                  actionLabel="Explore Trips"
                  onAction={() => router.replace('/(app)/(tabs)/home')}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme, isDesktop: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      padding: 32,
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

    // Bento Split Layout
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

    // Hero Net Position Card
    heroCard: {
      borderRadius: 22,
      padding: 20,
      gap: 14,

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
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    heroPillText: {
      color: '#38BDF8',
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    heroLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: 'rgba(255,255,255,0.6)',
    },
    heroAmountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    heroNetAmount: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -0.8,
    },
    heroDivider: {
      height: 1,
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    heroMetricsRow: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    heroMetric: {
      alignItems: 'center',
      gap: 2,
    },
    metricDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    metricLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: 0.6,
    },
    metricValue: {
      fontSize: 16,
      fontWeight: '900',
    },
    heroFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    heroFooterText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FBBF24',
    },

    // Segmented Control
    segmentContainer: {
      flexDirection: 'row',
      borderRadius: 16,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

      ...Platform.select({
        web: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
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
    segmentTab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 12,
    },
    segmentActive: {
      backgroundColor: '#2563EB',

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
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
    segmentText: {
      fontSize: 13,
      fontWeight: '800',
    },

    // Section Header
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingLeft: 2,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    countBadge: {
      backgroundColor: theme.isDark ? 'rgba(37,99,235,0.15)' : '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    countBadgeText: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#2563EB',
      letterSpacing: 0.5,
    },

    // Transaction Card
    list: {
      gap: 10,
    },
    transactionCardContainer: {
      ...(Platform.OS === 'web'
        ? { transition: 'transform 0.2s ease', cursor: 'pointer' }
        : {}),
    },
    transactionCard: {
      padding: 16,
      borderRadius: 20,
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
    txHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    txPersonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
      paddingRight: 8,
    },
    txAvatar: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txAvatarText: {
      fontSize: 15,
      fontWeight: '800',
    },
    txInfo: {
      flex: 1,
      gap: 2,
    },
    txPersonName: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    emailPill: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    emailPillText: {
      fontSize: 10,
      fontWeight: '500',
    },
    txTripName: {
      fontSize: 11.5,
      fontWeight: '500',
    },
    txAmountContainer: {
      alignItems: 'flex-end',
      gap: 4,
    },
    txAmount: {
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
    },
    statusText: {
      fontSize: 9,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    txActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 4,
      paddingVertical: 10,
      borderRadius: 12,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
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
    txActionBtnText: {
      color: '#FFF',
      fontSize: 12.5,
      fontWeight: '800',
    },

    // Error & Loading States
    errorText: {
      marginTop: 8,
      fontSize: 15,
      fontWeight: '700',
    },
    retryBtn: {
      marginTop: 14,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
    },
    retryBtnText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '800',
    },
  });
}
