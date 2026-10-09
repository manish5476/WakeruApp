// app/(app)/trips/[id]/stops/[stopId].tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Platform,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { format } from 'date-fns';
// ✅ FIX: Import Animated from react-native-reanimated (NOT react-native)
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Hooks & Stores
import {
  useTripSummary,
  useInfiniteStopExpenses,
  useStopExpenseSummary,
  useArchiveExpense,
  useUpdateStopRate,
  useDeleteStop,
  useTrip,
} from '../../../../../hooks';
import { useAuthStore } from '../../../../../stores/auth.store';
import { haptics } from '../../../../../utils/haptics';
import { showToast } from '../../../../../utils/toast';
import { getStopCoverImage } from '../../../../../utils/tripImage';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { Badge } from '../../../../../components/ui/Badge';
import { GlassCard } from '../../../../../components/ui/GlassCard';
import { GlobalBackground } from '../../../../../components/ui/GlobalBackground';
import AppIcon from '../../../../../components/common/AppIcon';
import GlobalLoader from '../../../../../components/common/GlobalLoader';

import { StopHero } from '../../../../../components/trips/StopDetails/StopHero';
import { FinancialSummary } from '../../../../../components/trips/StopDetails/FinancialSummary';
import { MiniMapCard } from '../../../../../components/trips/StopDetails/MiniMapCard';
import { PeopleOverview } from '../../../../../components/trips/StopDetails/PeopleOverview';
import { CategoryBreakdown } from '../../../../../components/trips/StopDetails/CategoryBreakdown';
import { ExpenseCard } from '../../../../../components/ui/ExpenseCard';
import { QuickActions } from '../../../../../components/trips/StopDetails/QuickActions';
import {
  mapStopToHeroUI,
  mapStopToSummaryUI,
  mapStopToLocationUI,
  mapContributorsUI,
  mapCategoriesUI,
} from '../../../../../components/trips/StopDetails/StopMappers';
import { ExpenseDetailsModal } from '../../../../../components/trips/Expenses/ExpenseDetailsModal';
import { mapExpensesToGroups } from '../../../../../components/trips/Expenses/ExpenseMappers';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1517760442158-2ba8d69e4b35';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// ── SAFE NUMBER FORMATTER ──────────────────────────────────
// Fixes the "500,000,000,000,000" crash by formatting large numbers safely
const safeFormatNumber = (value: number): string => {
  if (!value || isNaN(value) || !isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e15) return `${(abs / 1e15).toFixed(1)}Q`; // Quadrillion
  if (abs >= 1e12) return `${(abs / 1e12).toFixed(1)}T`; // Trillion
  if (abs >= 1e9) return `${(abs / 1e9).toFixed(1)}B`; // Billion
  if (abs >= 1e7) return `${(abs / 1e7).toFixed(1)}Cr`; // Crore
  if (abs >= 1e5) return `${(abs / 1e5).toFixed(1)}L`; // Lakh
  if (abs >= 1e3) return `${(abs / 1e3).toFixed(1)}K`; // Thousand
  return value.toLocaleString();
};

// ============================================================
// Glass icon button
// ============================================================
function GlassIconButton({
  icon,
  onPress,
}: {
  icon: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {({ hovered }: WebPressableState) => (
        <GlassCard
          style={[
            {
              width: 40,
              height: 40,
              borderRadius: theme.borderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.2)',
            },
            Platform.OS === 'web' && hovered
              ? { transform: [{ translateY: -2 }] }
              : null,
          ]}
          intensity={theme.isDark ? 20 : 10}
        >
          <AppIcon name={icon} size={18} color={theme.colors.textPrimary} />
        </GlassCard>
      )}
    </Pressable>
  );
}

// ============================================================
// Update Rate Modal
// ============================================================
function UpdateRateModal({
  visible,
  currentRate,
  currency,
  baseCurrency,
  onClose,
  onSave,
  isPending,
}: {
  visible: boolean;
  currentRate: number;
  currency: string;
  baseCurrency: string;
  onClose: () => void;
  onSave: (rate: number) => void;
  isPending: boolean;
}) {
  const theme = useTheme();
  const styles = useStyles();
  const [newRate, setNewRate] = useState(currentRate.toString());

  if (!visible) return null;

  return (
    <View
      style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
    >
      <GlassCard style={styles.modalContent} intensity={theme.isDark ? 20 : 10}>
        <View style={styles.modalHeader}>
          <View
            style={[
              styles.modalIconWrap,
              { backgroundColor: theme.colors.primaryBg },
            ]}
          >
            <AppIcon name="refresh-cw" size={24} color={theme.colors.primary} />
          </View>
          <Text
            style={[styles.modalTitle, { color: theme.colors.textPrimary }]}
          >
            Update Exchange Rate
          </Text>
          <Text
            style={[
              styles.modalSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            New expenses will use this rate. Existing expenses remain
            unaffected.
          </Text>
        </View>

        <View
          style={[
            styles.rateContainer,
            {
              backgroundColor: theme.colors.secondaryBg,
              borderColor: theme.colors.borderLight,
            },
          ]}
        >
          <Text
            style={[styles.rateLabel, { color: theme.colors.textSecondary }]}
          >
            1 {currency} =
          </Text>
          <TextInput
            style={[styles.rateInput, { color: theme.colors.textPrimary }]}
            value={newRate}
            onChangeText={setNewRate}
            keyboardType="decimal-pad"
            placeholder={currentRate.toString()}
            placeholderTextColor={theme.colors.textTertiary}
          />
          <Text
            style={[styles.rateLabel, { color: theme.colors.textSecondary }]}
          >
            {baseCurrency}
          </Text>
        </View>
        <Text style={[styles.rateHint, { color: theme.colors.textTertiary }]}>
          Current active rate: {currentRate}
        </Text>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[
              styles.modalCancelBtn,
              { backgroundColor: theme.colors.secondaryBg },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modalCancelText,
                { color: theme.colors.textPrimary },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalSaveBtn,
              { backgroundColor: theme.colors.secondary },
              isPending && styles.modalSaveBtnDisabled,
            ]}
            onPress={() => onSave(parseFloat(newRate) || currentRate)}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <GlobalLoader variant="inline" color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.modalSaveText}>Update Rate</Text>
            )}
          </TouchableOpacity>
        </View>
      </GlassCard>
    </View>
  );
}

// ============================================================
// Main Screen
// ============================================================
export default function StopDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const styles = useStyles(isWebDesktop);
  const { id: tripId, stopId } = useLocalSearchParams<{
    id: string;
    stopId: string;
  }>();
  const [showRateModal, setShowRateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null,
  );
  const [hasScrolled, setHasScrolled] = useState(false);

  // Hooks
  const {
    data: trip,
    refetch: refetchTrip,
    isLoading: isTripLoading,
  } = useTrip(tripId);
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useStopExpenseSummary(stopId);
  const {
    data: expensesData,
    isLoading: isExpensesLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteStopExpenses(stopId);
  const { mutate: archiveExpense } = useArchiveExpense();
  const { mutate: updateRate, isPending: isRatePending } = useUpdateStopRate();
  const { mutate: deleteStop } = useDeleteStop();
  const user = useAuthStore(s => s.user);
  const currentUserId = user?._id || (user as any)?.id;

  const stop = trip?.stops?.find(
    (s: any) =>
      s === stopId ||
      s._id === stopId ||
      s.id === stopId ||
      s.stopId === stopId,
  );
  const expenses = useMemo(
    () =>
      expensesData?.pages?.flatMap((page: any) => page?.expenses || []) ?? [],
    [expensesData],
  );

  const selectedRawExpense = expenses.find(
    (e: any) => e._id === selectedExpenseId,
  );
  const expenseForModal = useMemo(() => {
    if (!selectedRawExpense) return null;
    const yourSplit = selectedRawExpense.splits?.find(
      (s: any) => s.userId === currentUserId,
    );
    return {
      ...selectedRawExpense,
      currentUserId: currentUserId,
      yourShare: yourSplit,
    };
  }, [selectedRawExpense, currentUserId]);

  const totalExpenses: number =
    expensesData?.pages?.[0]?.pagination?.total ?? 0;
  const currency = stop?.currency || 'INR';
  const baseCurrency = trip?.baseCurrency || 'INR';
  const isForeign = currency !== baseCurrency;

  const handleDeleteExpense = (expenseId: string) => {
    haptics.warning();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (
        window.confirm('This will reverse all related balances. Are you sure?')
      ) {
        archiveExpense(expenseId);
      }
    } else {
      Alert.alert(
        'Archive Expense',
        'This will reverse all related balances. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive',
            style: 'destructive',
            onPress: () => archiveExpense(expenseId),
          },
        ],
      );
    }
  };

  const handleUpdateRate = (newRate: number) => {
    updateRate(
      { tripId, stopId, data: { currentExchangeRate: newRate } },
      {
        onSuccess: () => {
          setShowRateModal(false);
          refetchTrip();
        },
      },
    );
  };

  const handleDeleteStop = () => {
    haptics.warning();
    const expenseCount = totalExpenses || expenses.length;
    if (expenseCount > 0) {
      Alert.alert(
        'Cannot Delete Stop',
        `This stop has ${expenseCount} expense${expenseCount !== 1 ? 's' : ''}. To protect your trip financial balances, please delete all expenses in this stop first before deleting the stop.`,
        [{ text: 'OK', style: 'default' }],
      );
      return;
    }

    const confirmMsg =
      'Are you sure you want to delete this stop? This action cannot be undone.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(confirmMsg)) {
        deleteStop(
          { tripId, stopId },
          {
            onSuccess: () => router.back(),
            onError: (err: any) =>
              showToast.fromError(err, 'Failed to delete stop'),
          },
        );
      }
    } else {
      Alert.alert('Delete Stop', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Stop',
          style: 'destructive',
          onPress: () =>
            deleteStop(
              { tripId, stopId },
              {
                onSuccess: () => router.back(),
                onError: (err: any) =>
                  showToast.fromError(err, 'Failed to delete stop'),
              },
            ),
        },
      ]);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchTrip(), refetchSummary()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, refetchTrip]);

  if (isTripLoading || isExpensesLoading) {
    return (
      <GlobalBackground>
        <View style={styles.loadingContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.secondary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading stop details...
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  if (!stop) {
    return (
      <GlobalBackground>
        <View style={styles.loadingContainer}>
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Stop not found in this trip.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 20, padding: 10 }}
          >
            <Text style={{ color: theme.colors.textLink, fontWeight: '600' }}>
              ← Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </GlobalBackground>
    );
  }

  const budgetPercent = stop.budget
    ? Math.min((stop.totalSpentLocal / stop.budget) * 100, 100)
    : 0;
  const progressColor =
    budgetPercent > 90
      ? theme.colors.danger
      : budgetPercent > 75
        ? theme.colors.warning
        : theme.colors.success;
  const coverImage = getStopCoverImage(stop, trip?.title);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: stop?.name || 'Stop Details',
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            color: theme.colors.textPrimary,
            fontWeight: '800',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={handleDeleteStop}
              style={{ marginRight: 16 }}
            >
              <AppIcon name="trash-2" size={22} color={theme.colors.danger} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
        <GlobalBackground />
      </View>

      <View
        style={[
          styles.webDesktopContent,
          isWebDesktop && styles.webDesktopContentCentered,
        ]}
      >
        <FlatList
          data={expenses}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ExpenseCard
              expense={item}
              onPress={() => setSelectedExpenseId(item._id)}
            />
          )}
          ListHeaderComponent={() => {
            const heroUI = mapStopToHeroUI(stop, trip);
            const summaryUI = mapStopToSummaryUI(stop, trip);
            const locationUI = mapStopToLocationUI(stop);

            const contributors = mapContributorsUI(
              summaryData?.payerBreakdown || [],
              currency,
            );
            const categories = mapCategoriesUI(
              summaryData?.categoryBreakdown || [],
              currency,
            );

            const actions: any[] = [
              {
                icon: 'plus',
                label: 'Add Expense',
                variant: 'primary' as const,
                onPress: () =>
                  router.push(
                    `/(app)/trips/${tripId}/add-expense?stopId=${stopId}`,
                  ),
              },
              ...(isForeign
                ? [
                    {
                      icon: 'refresh-cw',
                      label: 'Update Rate',
                      onPress: () => setShowRateModal(true),
                    },
                  ]
                : []),
              { icon: 'share', label: 'Share', onPress: () => {} },
              {
                icon: 'edit',
                label: 'Edit',
                onPress: () =>
                  router.push(
                    `/(app)/trips/${tripId}/edit-stop?stopId=${stopId}`,
                  ),
              },
              {
                icon: 'trash',
                label: 'Delete',
                onPress: handleDeleteStop,
                variant: 'danger',
              },
            ];

            return (
              <Animated.View entering={FadeIn.duration(500)}>
                <StopHero data={heroUI} />
                <FinancialSummary data={summaryUI} />
                {locationUI && (
                  <MiniMapCard
                    data={locationUI}
                    onPressMap={() =>
                      router.push(
                        `/(app)/trips/${tripId}/map?lat=${locationUI.coordinates.lat}&lng=${locationUI.coordinates.lng}`,
                      )
                    }
                    onPressNavigate={() => {}}
                  />
                )}
                <PeopleOverview contributors={contributors} />
                <CategoryBreakdown categories={categories} />
                <QuickActions actions={actions} />

                <View style={styles.listHeader}>
                  <View style={styles.listHeaderLeft}>
                    <AppIcon
                      name="receipt"
                      size={16}
                      color={theme.colors.secondary}
                    />
                    <Text
                      style={[
                        styles.listTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      All Expenses
                    </Text>
                    <Badge label={`${totalExpenses}`} variant="neutral" />
                  </View>
                  <TouchableOpacity
                    style={styles.headerAddBtn}
                    onPress={() =>
                      router.push(
                        `/(app)/trips/${tripId}/add-expense?stopId=${stopId}`,
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <AppIcon name="plus" size={13} color="#FFFFFF" />
                    <Text style={styles.headerAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          }}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.secondary]}
              tintColor={theme.colors.secondary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <Animated.View
              entering={FadeInDown.duration(400).springify()}
              style={styles.emptyContainer}
            >
              <View
                style={[
                  styles.emptyIconWrap,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.borderLight,
                    ...theme.shadows.sm,
                  },
                ]}
              >
                <AppIcon
                  name="credit-card"
                  size={40}
                  color={theme.colors.textTertiary}
                />
              </View>
              <Text
                style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}
              >
                No Expenses Yet
              </Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Start adding expenses to this stop to track your spending.
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyBtn,
                  { backgroundColor: theme.colors.secondary },
                ]}
                onPress={() =>
                  router.push(
                    `/(app)/trips/${tripId}/add-expense?stopId=${stopId}`,
                  )
                }
              >
                <AppIcon name="plus" size={16} color="#FFF" />
                <Text style={styles.emptyBtnText}>Add First Expense</Text>
              </TouchableOpacity>
            </Animated.View>
          }
          onScrollBeginDrag={() => setHasScrolled(true)}
          onMomentumScrollBegin={() => setHasScrolled(true)}
          onEndReached={() => {
            if (hasScrolled && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 16,
                }}
              >
                <GlobalLoader
                  variant="inline"
                  size="small"
                  color={theme.colors.secondary}
                />
                <Text
                  style={{ color: theme.colors.textSecondary, fontSize: 13 }}
                >
                  Loading more…
                </Text>
              </View>
            ) : !hasNextPage && totalExpenses > 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <AppIcon
                    name="check-circle"
                    size={14}
                    color={theme.colors.success}
                  />
                  <Text
                    style={{
                      color: theme.colors.textTertiary,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    All {totalExpenses} expenses loaded
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={[
            styles.fab,
            {
              bottom: insets.bottom + 24,
              backgroundColor: theme.colors.secondary,
            },
          ]}
          onPress={() =>
            router.push(`/(app)/trips/${tripId}/add-expense?stopId=${stopId}`)
          }
          activeOpacity={0.85}
        >
          <AppIcon name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Rate Modal */}
        <UpdateRateModal
          visible={showRateModal}
          currentRate={stop.currentExchangeRate}
          currency={currency}
          baseCurrency={baseCurrency}
          onClose={() => setShowRateModal(false)}
          onSave={handleUpdateRate}
          isPending={isRatePending}
        />

        {/* Expense Details Modal */}
        <ExpenseDetailsModal
          expense={expenseForModal}
          onClose={() => setSelectedExpenseId(null)}
        />
      </View>
    </View>
  );
}

// ============================================================
// Styles (Strictly Theme-Compliant)
// ============================================================
const useStyles = (isWebDesktop: boolean = false) => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: 'transparent' },
        listContent: {
          paddingHorizontal: isWebDesktop ? 0 : 16,
          paddingTop: 8,
        },
        webDesktopContent: { flex: 1, width: '100%' },
        webDesktopContentCentered: {
          maxWidth: 960,
          width: '92%',
          alignSelf: 'center',
          marginTop: 12,
        },

        gridContainer: {
          flexDirection: isWebDesktop ? 'row' : 'column',
          gap: 24,
          width: '100%',
          alignItems: 'flex-start',
          marginBottom: 20,
        },
        gridItem: {
          flex: isWebDesktop ? 1 : undefined,
          width: isWebDesktop ? undefined : '100%',
        },

        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          backgroundColor: 'transparent',
        },
        loadingText: {
          fontSize: 14,
          fontWeight: '500',
          color: theme.colors.textSecondary,
        },

        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingBottom: 16,
        },
        headerTitle: {
          flex: 1,
          textAlign: 'center',
          fontSize: 17,
          fontWeight: '700',
          marginHorizontal: 12,
          color: theme.colors.textPrimary,
        },

        // Hero Section
        heroSection: { marginBottom: 20 },
        heroCard: {
          borderRadius: theme.borderRadius['2xl'],
          padding: theme.spacing['5'],
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },
        heroHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
        },
        heroEmoji: {
          fontSize: 32,
          marginRight: 12,
        },
        heroInfo: {
          flex: 1,
        },
        heroTitle: {
          fontSize: 20,
          fontWeight: '800',
          letterSpacing: -0.3,
        },
        heroCountry: {
          fontSize: 13,
          fontWeight: '500',
          marginTop: 2,
        },

        statsGrid: {
          flexDirection: 'row',
          borderRadius: theme.borderRadius.lg,
          paddingVertical: 16,
          marginBottom: 16,
          backgroundColor: theme.colors.secondaryBg,
        },
        statBox: {
          flex: 1,
          alignItems: 'center',
        },
        statLabel: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
          color: theme.colors.textSecondary,
        },
        statValue: {
          fontSize: 18,
          fontWeight: '800',
          color: theme.colors.textPrimary,
        },
        statCurrency: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.textSecondary,
        },
        statDivider: {
          width: 1,
          backgroundColor: theme.colors.borderLight,
        },

        locationCard: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          marginBottom: 12,
          gap: 10,
        },
        locationText: {
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
        },

        rateActionBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 16,
          gap: 10,
          backgroundColor: theme.colors.primaryBg,
          borderRadius: theme.borderRadius.md,
        },
        rateActionText: {
          flex: 1,
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.primary,
        },
        rateActionChevron: {
          fontSize: 12,
          fontWeight: '700',
          color: theme.colors.textLink,
        },

        budgetWrap: {
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
        },
        budgetHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        budgetLabel: {
          fontSize: 12,
          fontWeight: '600',
          color: theme.colors.textSecondary,
        },
        budgetPercent: {
          fontSize: 12,
          fontWeight: '800',
        },
        progressBar: {
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 8,
          backgroundColor: theme.colors.borderLight,
        },
        progressFill: {
          height: '100%',
          borderRadius: 3,
        },
        budgetAmount: {
          fontSize: 12,
          fontWeight: '600',
          textAlign: 'right',
          color: theme.colors.textSecondary,
        },

        // Summary Section
        summaryContainer: { marginBottom: 20 },
        summaryHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        },
        summaryTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.colors.textPrimary,
        },
        summaryCard: {
          borderRadius: theme.borderRadius['2xl'],
          padding: theme.spacing['4'],
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },
        summaryRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
        },
        summaryAvatar: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          backgroundColor: theme.colors.primaryBg,
        },
        summaryAvatarText: {
          fontSize: 13,
          fontWeight: '800',
          color: theme.colors.primary,
        },
        summaryName: {
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.textPrimary,
        },
        summaryAmountWrap: {
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: 4,
        },
        summaryAmount: {
          fontSize: 14,
          fontWeight: '800',
          color: theme.colors.textPrimary,
        },
        summaryCurrency: {
          fontSize: 11,
          fontWeight: '600',
          color: theme.colors.textSecondary,
        },
        summaryRowCol: {
          paddingVertical: 10,
        },
        categoryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        },
        categoryLabelWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        categoryDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        summaryCatName: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.textPrimary,
        },
        summaryCatAmount: {
          fontSize: 13,
          fontWeight: '600',
          color: theme.colors.textSecondary,
        },
        catProgressBar: {
          height: 4,
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: theme.colors.borderLight,
        },
        catProgressFill: {
          height: '100%',
          borderRadius: 2,
          backgroundColor: theme.colors.secondary,
        },

        // List Header
        listHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 20,
          marginBottom: 14,
        },
        listHeaderLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        listTitle: {
          fontSize: 16,
          fontWeight: '800',
          color: theme.colors.textPrimary,
        },
        headerAddBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.secondary,
        },
        headerAddBtnText: {
          fontSize: 12,
          fontWeight: '700',
          color: '#FFFFFF',
        },

        statusPill: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: theme.borderRadius.sm,
          gap: 6,
        },
        statusDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        statusText: {
          fontSize: 11,
          fontWeight: '700',
        },
        footerRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        splitMethodBadge: {
          paddingHorizontal: 6,
          paddingVertical: 2,
        },

        splitAvatars: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        splitAvatar: {
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
        },
        splitAvatarText: {
          fontSize: 10,
          fontWeight: '800',
        },
        splitAvatarMore: {
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
        },
        splitAvatarMoreText: {
          fontSize: 9,
          fontWeight: '700',
          color: theme.colors.textTertiary,
        },

        emptyContainer: {
          alignItems: 'center',
          paddingVertical: 60,
        },
        emptyIconWrap: {
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          backgroundColor: theme.colors.surface,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: '800',
          marginBottom: 6,
          color: theme.colors.textPrimary,
        },
        emptyText: {
          fontSize: 14,
          textAlign: 'center',
          color: theme.colors.textSecondary,
          marginBottom: 24,
        },
        emptyBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: theme.borderRadius.full,
        },
        emptyBtnText: {
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: '700',
        },

        fab: {
          position: 'absolute',
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.secondary,
          ...theme.shadows.lg,
        },

        // Modal
        modalOverlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          padding: 24,
          zIndex: 1000,
          backgroundColor: theme.colors.overlay,
        },
        modalContent: {
          borderRadius: theme.borderRadius['2xl'],
          padding: 24,
          ...theme.shadows.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
        },
        modalHeader: {
          alignItems: 'center',
          marginBottom: 20,
        },
        modalIconWrap: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        },
        modalTitle: {
          fontSize: 20,
          fontWeight: '800',
          marginBottom: 6,
          textAlign: 'center',
          color: theme.colors.textPrimary,
        },
        modalSubtitle: {
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 20,
          color: theme.colors.textSecondary,
        },

        rateContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: theme.borderRadius.lg,
          paddingHorizontal: 16,
          marginBottom: 12,
          borderColor: theme.colors.borderLight,
          backgroundColor: theme.colors.secondaryBg,
        },
        rateLabel: {
          fontSize: 16,
          fontWeight: '700',
          color: theme.colors.textSecondary,
        },
        rateInput: {
          flex: 1,
          fontSize: 24,
          fontWeight: '800',
          textAlign: 'center',
          paddingVertical: 16,
          color: theme.colors.textPrimary,
        },
        rateHint: {
          fontSize: 12,
          textAlign: 'center',
          marginBottom: 24,
          fontWeight: '500',
          color: theme.colors.textTertiary,
        },

        modalButtons: {
          flexDirection: 'row',
          gap: 12,
        },
        modalCancelBtn: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: theme.borderRadius.lg,
          alignItems: 'center',
          backgroundColor: theme.colors.secondaryBg,
        },
        modalCancelText: {
          fontSize: 15,
          fontWeight: '700',
          color: theme.colors.textPrimary,
        },
        modalSaveBtn: {
          flex: 1,
          paddingVertical: 14,
          borderRadius: theme.borderRadius.lg,
          alignItems: 'center',
          backgroundColor: theme.colors.secondary,
        },
        modalSaveBtnDisabled: {
          opacity: 0.7,
        },
        modalSaveText: {
          color: '#FFFFFF',
          fontSize: 15,
          fontWeight: '700',
        },
      }),
    [theme],
  );
};
