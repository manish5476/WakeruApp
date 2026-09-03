import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { haptics } from '../../utils/haptics';
import { useDebtSummary, useDebtDetails } from '../../hooks/useFinance';
import { safeFormatCurrency } from '../../utils/formatters';

import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { AmountDisplay } from '../ui/AmountDisplay';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { Container } from '../ui/Container';
import { Grid } from '../ui/Grid';
import { Avatar } from '../ui/Avatar';
import { ProgressBar } from '../ui/ProgressBar';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import { AddDebtModal } from './AddDebtModal';

import type { Theme } from '../../theme';

// ─── Constants ───────────────────────────────────────────────
const WEB = Platform.OS === 'web';

type DebtStatus =
  'pending' | 'initiated' | 'confirmed' | 'disputed' | 'settled';

const STATUS_CONFIG: Record<
  DebtStatus,
  { label: string; variant: 'warning' | 'info' | 'success' | 'danger' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  initiated: { label: 'Initiated', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  disputed: { label: 'Disputed', variant: 'danger' },
  settled: { label: 'Settled', variant: 'success' },
};

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'initiated', label: 'Initiated' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'settled', label: 'Settled' },
];

// ─── Filter Tab Bar ──────────────────────────────────────────
function FilterTabBar({
  options,
  activeKey,
  onChange,
}: {
  options: { key: string; label: string }[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  const theme = useTheme();

  return (
    <GlassCard variant="subtle" padding="xs" intensity={theme.isDark ? 20 : 30}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing[1],
          paddingHorizontal: theme.spacing[1],
        }}
      >
        {options.map(opt => {
          const isActive = activeKey === opt.key;
          return (
            <InteractiveWrapper
              key={opt.key}
              onPress={() => {
                haptics.light();
                onChange(opt.key);
              }}
              style={{ minWidth: 70 }}
            >
              <View
                style={[
                  tabBarStyles(theme).tabItem,
                  isActive && tabBarStyles(theme).tabItemActive,
                ]}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  color={isActive ? 'textInverse' : 'textSecondary'}
                  numberOfLines={1}
                >
                  {opt.label}
                </Typography>
              </View>
            </InteractiveWrapper>
          );
        })}
      </ScrollView>
    </GlassCard>
  );
}

// ─── Bento Summary Cards (3-in-1) ───────────────────────────
function BentoSummaryCards({
  netBalance,
  totalOwed,
  totalOwing,
  pendingOwed,
  pendingOwing,
}: {
  netBalance: number;
  totalOwed: number;
  totalOwing: number;
  pendingOwed: number;
  pendingOwing: number;
}) {
  const theme = useTheme();
  const { isMobile } = useResponsive();

  const stats = [
    {
      icon: 'banknote',
      iconBg: theme.colors.primaryBg,
      iconColor: theme.colors.primary,
      label: 'Net Balance',
      amount: Math.abs(netBalance),
      variant: netBalance >= 0 ? ('positive' as const) : ('negative' as const),
      subtitle:
        netBalance >= 0 ? 'You are owed this amount' : 'You owe this amount',
    },
    {
      icon: 'arrow-down',
      iconBg: theme.colors.successBg,
      iconColor: theme.colors.success,
      label: 'You are Owed',
      amount: totalOwed,
      variant: 'positive' as const,
      subtitle:
        pendingOwed > 0
          ? `${safeFormatCurrency(pendingOwed)} pending`
          : 'All cleared',
    },
    {
      icon: 'arrow-up',
      iconBg: theme.colors.dangerBg,
      iconColor: theme.colors.danger,
      label: 'You Owe',
      amount: totalOwing,
      variant: 'negative' as const,
      subtitle:
        pendingOwing > 0
          ? `${safeFormatCurrency(pendingOwing)} pending`
          : 'All cleared',
    },
  ];

  const renderStat = (stat: any, index: number) => (
    <React.Fragment key={stat.label}>
      {index > 0 &&
        (isMobile ? (
          <View
            style={{
              height: 1,
              backgroundColor: theme.colors.border,
              marginVertical: theme.spacing[2],
            }}
          />
        ) : (
          <View
            style={{
              width: 1,
              alignSelf: 'stretch',
              backgroundColor: theme.colors.border,
              marginHorizontal: theme.spacing[4],
            }}
          />
        ))}
      <View style={{ flex: 1, gap: theme.spacing[2] }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[2],
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: theme.borderRadius.full,
              backgroundColor: stat.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name={stat.icon as any} size={16} color={stat.iconColor} />
          </View>
          <Typography
            variant="caption"
            weight="semibold"
            color="textSecondary"
            style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            {stat.label}
          </Typography>
        </View>
        <View style={{ paddingLeft: 44 }}>
          <AmountDisplay
            amount={stat.amount}
            currency="INR"
            size="lg"
            variant={stat.variant}
            showSign
          />
          <Typography
            variant="caption"
            color="textTertiary"
            style={{ marginTop: theme.spacing[1] }}
          >
            {stat.subtitle}
          </Typography>
        </View>
      </View>
    </React.Fragment>
  );

  if (isMobile) {
    return (
      <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
        <GlassCard variant="medium" padding="lg">
          <View style={{ gap: theme.spacing[2] }}>
            {stats.map((stat, index) => renderStat(stat, index))}
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
      <GlassCard variant="medium" padding="lg">
        <View
          style={{ flexDirection: 'row', alignItems: 'stretch', width: '100%' }}
        >
          {stats.map((stat, index) => renderStat(stat, index))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Trip Balance Card ───────────────────────────────────────
function TripBalanceCard({
  trip,
  isSelected,
  onPress,
}: {
  trip: any;
  isSelected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const netTrip = trip.owed - trip.owing;
  const totalActivity = trip.owed + trip.owing;
  const progress = totalActivity > 0 ? (trip.owed / totalActivity) * 100 : 50;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      layout={Layout.springify()}
    >
      <InteractiveWrapper onPress={onPress}>
        <GlassCard
          variant="medium"
          padding="lg"
          style={
            isSelected
              ? { borderWidth: 1.5, borderColor: theme.colors.primary }
              : undefined
          }
        >
          <View style={{ gap: theme.spacing[3] }}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[3],
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: theme.borderRadius.xl,
                  backgroundColor: `${theme.colors.primary}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon name="map" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography
                  variant="body"
                  weight="bold"
                  color="textPrimary"
                  numberOfLines={1}
                >
                  {trip.tripName || 'Unnamed Trip'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {trip.transactionCount || 0} transactions
                </Typography>
              </View>
              <AmountDisplay
                amount={Math.abs(netTrip)}
                currency="INR"
                size="md"
                variant={netTrip >= 0 ? 'positive' : 'negative'}
                showSign
              />
            </View>

            {/* Progress */}
            <View style={{ gap: theme.spacing[1] }}>
              <ProgressBar
                progress={progress / 100}
                height={6}
                variant={netTrip >= 0 ? 'success' : 'danger'}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <AmountDisplay
                  amount={trip.owed}
                  currency="INR"
                  size="sm"
                  compact
                  variant="positive"
                />
                <AmountDisplay
                  amount={trip.owing}
                  currency="INR"
                  size="sm"
                  compact
                  variant="negative"
                />
              </View>
            </View>
          </View>
        </GlassCard>
      </InteractiveWrapper>
    </Animated.View>
  );
}

// ─── Person Card ─────────────────────────────────────────────
function PersonCard({ user }: { user: any }) {
  const theme = useTheme();
  const router = useRouter();
  const netUser = user.owes - user.owed;
  const isOwed = netUser >= 0;
  const absNet = Math.abs(netUser);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      layout={Layout.springify()}
    >
      <GlassCard variant="medium" padding="lg">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[3],
          }}
        >
          <Avatar
            url={user.photoURL}
            fallback={user.name?.charAt(0).toUpperCase() || '?'}
            size="lg"
          />
          <View style={{ flex: 1 }}>
            <Typography
              variant="body"
              weight="bold"
              color="textPrimary"
              numberOfLines={1}
            >
              {user.name || 'Unknown'}
            </Typography>
            <Typography
              variant="bodySm"
              weight="semibold"
              color={isOwed ? 'success' : 'danger'}
            >
              {isOwed ? 'Owes you ' : 'You owe '} {safeFormatCurrency(absNet)}
            </Typography>
          </View>
          {absNet > 0 && (
            <Button
              title={isOwed ? 'Remind' : 'Settle'}
              variant={isOwed ? 'outline' : 'primary'}
              size="sm"
              onPress={() => {
                haptics.medium();
                router.push('/(app)/settlements' as any);
              }}
            />
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Transaction Card ────────────────────────────────────────
function TransactionCard({ debt }: { debt: any }) {
  const theme = useTheme();
  const isFromUser = debt.fromName === 'You';
  const isToUser = debt.toName === 'You';
  const lentFlag = debt.type ? debt.type === 'lent' : isToUser;

  let otherPersonName = debt.name;
  if (isFromUser) otherPersonName = debt.toName;
  else if (isToUser) otherPersonName = debt.fromName;
  else otherPersonName = lentFlag ? debt.fromName : debt.toName;

  const amount = debt.amountBase || debt.amount;
  const status = debt.status as DebtStatus;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const title =
    debt.reason || debt.tripId?.title || debt.tripTitle || 'Independent Debt';

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      layout={Layout.springify()}
    >
      <GlassCard variant="medium" padding="lg">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[3],
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.borderRadius.full,
              backgroundColor: lentFlag
                ? theme.colors.successBg
                : theme.colors.dangerBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon
              name={lentFlag ? 'arrow-down-left' : 'arrow-up-right'}
              size={20}
              color={lentFlag ? theme.colors.success : theme.colors.danger}
            />
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Typography
              variant="body"
              weight="bold"
              color="textPrimary"
              numberOfLines={1}
            >
              {otherPersonName || 'Unknown'}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              numberOfLines={1}
            >
              {title}
            </Typography>
          </View>

          {/* Amount + Status */}
          <View style={{ alignItems: 'flex-end', gap: theme.spacing[1] }}>
            <AmountDisplay
              amount={amount}
              currency="INR"
              size="sm"
              variant={lentFlag ? 'positive' : 'negative'}
              showSign
            />
            <Badge label={statusConfig.label} variant={statusConfig.variant} />
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function FinanceDebts() {
  const theme = useTheme();
  const { isDesktop, width } = useResponsive();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<string | undefined>(
    undefined,
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [includeTrips, setIncludeTrips] = useState(true);

  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useDebtSummary({ includeTrips });
  const {
    data: detailsData,
    isLoading: detailsLoading,
    refetch: refetchDetails,
  } = useDebtDetails({
    tripId: selectedTrip,
    status:
      selectedStatus === 'all' ? undefined : (selectedStatus as DebtStatus),
    includeTrips,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([refetchSummary(), refetchDetails()]);
    setRefreshing(false);
  }, [refetchSummary, refetchDetails]);

  const summary = summaryData || {};
  const details = detailsData || {};
  const transactions = details?.transactions || [];
  const totalOwed = summary?.totalOwed || 0;
  const totalOwing = summary?.totalOwing || 0;
  const byTrip = summary?.byTrip || [];
  const byUser = summary?.byUser || [];
  const netBalance = totalOwed - totalOwing;
  const hasDebts = totalOwed > 0 || totalOwing > 0;

  const isLoading = summaryLoading || detailsLoading;
  const gridCols = isDesktop ? (width >= 1200 ? 3 : 2) : 1;

  if (isLoading) {
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
          Loading balances…
        </Typography>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing['5xl'] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        <Container maxWidth={WEB ? 1200 : undefined}>
          <View style={{ gap: theme.spacing[6] }}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View>
                <Typography
                  variant="h2"
                  weight="extrabold"
                  color="textPrimary"
                  style={{ letterSpacing: -0.5 }}
                >
                  Debts
                </Typography>
                <Typography
                  variant="bodySm"
                  color="textSecondary"
                  style={{ marginTop: theme.spacing[1] }}
                >
                  {hasDebts
                    ? 'Track what you owe and are owed'
                    : 'All settled up!'}
                </Typography>
              </View>
              <Button
                title="Add Debt"
                variant="primary"
                size="md"
                onPress={() => {
                  haptics.light();
                  setShowAddDebtModal(true);
                }}
                leftIcon={
                  <AppIcon
                    name="plus"
                    size={16}
                    color={theme.colors.textInverse}
                  />
                }
              />
            </View>

            {/* Toggle */}
            <GlassCard variant="subtle" padding="md">
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: theme.borderRadius.full,
                      backgroundColor: theme.colors.primaryBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppIcon
                      name="map"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View>
                    <Typography
                      variant="bodySm"
                      weight="semibold"
                      color="textPrimary"
                    >
                      Include Trip Expenses
                    </Typography>
                    <Typography variant="caption" color="textTertiary">
                      Show trip-related debts
                    </Typography>
                  </View>
                </View>
                <Switch
                  value={includeTrips}
                  onValueChange={val => {
                    haptics.light();
                    setIncludeTrips(val);
                  }}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                  thumbColor="#FFF"
                />
              </View>
            </GlassCard>

            {/* Summary Cards */}
            <BentoSummaryCards
              netBalance={netBalance}
              totalOwed={totalOwed}
              totalOwing={totalOwing}
              pendingOwed={summary?.pendingOwed || 0}
              pendingOwing={summary?.pendingOwing || 0}
            />

            {/* Trip Balances */}
            {byTrip.length > 0 && (
              <View style={{ gap: theme.spacing[3] }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="h3"
                    weight="extrabold"
                    color="textPrimary"
                    style={{ letterSpacing: -0.5 }}
                  >
                    Trip Balances
                  </Typography>
                  {selectedTrip && (
                    <InteractiveWrapper
                      onPress={() => {
                        haptics.light();
                        setSelectedTrip(undefined);
                      }}
                    >
                      <View
                        style={{
                          paddingVertical: theme.spacing[1],
                          paddingHorizontal: theme.spacing[2],
                        }}
                      >
                        <Typography
                          variant="bodySm"
                          weight="bold"
                          color="primary"
                        >
                          Clear Filter
                        </Typography>
                      </View>
                    </InteractiveWrapper>
                  )}
                </View>
                <Grid cols={gridCols} gap={theme.spacing[3]}>
                  {byTrip.map((trip: any) => (
                    <TripBalanceCard
                      key={trip.tripId}
                      trip={trip}
                      isSelected={selectedTrip === trip.tripId}
                      onPress={() => {
                        haptics.light();
                        setSelectedTrip(
                          selectedTrip === trip.tripId
                            ? undefined
                            : trip.tripId,
                        );
                      }}
                    />
                  ))}
                </Grid>
              </View>
            )}

            {/* People */}
            {byUser.length > 0 && (
              <View style={{ gap: theme.spacing[3] }}>
                <Typography
                  variant="h3"
                  weight="extrabold"
                  color="textPrimary"
                  style={{ letterSpacing: -0.5 }}
                >
                  People
                </Typography>
                <View style={{ gap: theme.spacing[3] }}>
                  {byUser.map((user: any) => (
                    <PersonCard key={user.userId} user={user} />
                  ))}
                </View>
              </View>
            )}

            {/* Transactions */}
            {transactions.length > 0 && (
              <View style={{ gap: theme.spacing[3] }}>
                <Typography
                  variant="h3"
                  weight="extrabold"
                  color="textPrimary"
                  style={{ letterSpacing: -0.5 }}
                >
                  Transactions ({transactions.length})
                </Typography>
                <FilterTabBar
                  options={STATUS_FILTERS}
                  activeKey={selectedStatus}
                  onChange={setSelectedStatus}
                />
                <View style={{ gap: theme.spacing[3] }}>
                  {transactions.map((debt: any) => (
                    <TransactionCard key={debt._id} debt={debt} />
                  ))}
                </View>
              </View>
            )}

            {/* Empty State */}
            {!hasDebts && (
              <Animated.View
                entering={FadeInUp.delay(200).springify().damping(18)}
              >
                <EmptyState
                  icon="check-circle"
                  title="All Settled Up!"
                  description="You have no pending debts. Keep it up!"
                  actionLabel="Add Debt"
                  onAction={() => {
                    haptics.light();
                    setShowAddDebtModal(true);
                  }}
                />
              </Animated.View>
            )}
          </View>
        </Container>
      </ScrollView>

      <AddDebtModal
        visible={showAddDebtModal}
        onClose={() => setShowAddDebtModal(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});

// ─── Tab Bar Styles ──────────────────────────────────────────
function tabBarStyles(theme: Theme) {
  return StyleSheet.create({
    tabItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2],
      paddingVertical: theme.spacing[2],
      paddingHorizontal: theme.spacing[4],
      borderRadius: theme.borderRadius.lg,
    },
    tabItemActive: {
      backgroundColor: theme.colors.primary,
    },
  });
}
