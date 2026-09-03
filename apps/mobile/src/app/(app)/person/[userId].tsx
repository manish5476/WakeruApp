import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  Pressable,
  RefreshControl,
  Image,
  Alert,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, formatDistanceToNow } from 'date-fns';

import {
  usePersonProfile,
  useSharedExpenses,
  useSettlementOptions,
  usePersonActivity,
} from '../../../hooks/usePerson';
import { useTheme } from '../../../providers/ThemeProvider';
import { Badge } from '../../../components/ui/Badge';
import { haptics } from '../../../utils/haptics';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';

// ============================================================
// CONSTANTS
// ============================================================

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',
  stay: '#8B5CF6',
  transport: '#3B82F6',
  activity: '#10B981',
  shopping: '#EC4899',
  health: '#EF4444',
  other: '#6366F1',
};

const FRIENDSHIP_LABELS: Record<
  string,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  friend: {
    label: 'Friend',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'users',
  },
  pending_sent: {
    label: 'Request Sent',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'clock',
  },
  pending_received: {
    label: 'Wants to be friends',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: 'user-plus',
  },
  blocked: {
    label: 'Blocked',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'slash',
  },
  none: {
    label: 'Not connected',
    color: '#4B5563',
    bgColor: '#F3F4F6',
    icon: 'user',
  },
  self: { label: 'You', color: '#6366F1', bgColor: '#E0E7FF', icon: 'user' },
};

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getInitials(name: string): string {
  return (
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function ExpenseRow({ expense }: { expense: any }) {
  const theme = useTheme();
  const emoji = CATEGORY_EMOJIS[expense.category] || '📦';
  const isSettled = expense.isSettled;
  const direction = expense.direction;

  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.itemCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
        },
        Platform.OS === 'web' &&
          hovered && { transform: [{ translateY: -2 }], shadowOpacity: 0.1 },
      ]}
      onPress={() => router.push(`/(app)/expenses/${expense._id}`)}
    >
      <View style={[styles.itemEmojiWrap, { backgroundColor: 'transparent' }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text
          style={[styles.itemTitle, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {expense.title}
        </Text>
        <Text
          style={[styles.itemMeta, { color: theme.colors.textTertiary }]}
          numberOfLines={1}
        >
          {format(new Date(expense.date), 'MMM d, yyyy')}{' '}
          {expense.tripName ? `· ${expense.tripName}` : ''}
        </Text>
      </View>
      <View style={styles.expRight}>
        <Text
          style={[
            styles.expAmount,
            {
              color:
                direction === 'you_paid'
                  ? '#DC2626'
                  : isSettled
                    ? theme.colors.textTertiary
                    : '#059669',
            },
          ]}
        >
          {direction === 'you_paid' ? '-' : '+'}
          {formatCurrency(expense.amountBase)}
        </Text>
        <View
          style={[
            styles.directionBadge,
            {
              backgroundColor: direction === 'you_paid' ? '#FEE2E2' : '#D1FAE5',
            },
          ]}
        >
          <Text
            style={[
              styles.directionText,
              {
                color: direction === 'you_paid' ? '#DC2626' : '#059669',
              },
            ]}
          >
            {direction === 'you_paid' ? 'PAID' : 'OWES'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function ActivityRow({ activity }: { activity: any }) {
  const theme = useTheme();
  const categoryEmoji = CATEGORY_EMOJIS[activity.category] || '📦';

  return (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
        },
      ]}
    >
      <View style={[styles.itemEmojiWrap, { backgroundColor: 'transparent' }]}>
        <Text style={{ fontSize: 18 }}>{categoryEmoji}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text
          style={[
            styles.itemTitle,
            { color: theme.colors.textPrimary, fontWeight: '500' },
          ]}
          numberOfLines={2}
        >
          {activity.description}
        </Text>
        <View style={styles.activityMeta}>
          <Text style={[styles.itemMeta, { color: theme.colors.textTertiary }]}>
            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
          </Text>
          {activity.tripName && (
            <Text
              style={[styles.activityTrip, { color: theme.colors.primary }]}
            >
              · {activity.tripName}
            </Text>
          )}
        </View>
      </View>
      <Text
        style={[styles.activityAmount, { color: theme.colors.textPrimary }]}
      >
        {formatCurrency(activity.amount)}
      </Text>
    </View>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PersonDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  // Dynamic Layout Threshold
  const isDesktop = Platform.OS === 'web' && width >= 860;

  // ── API HOOKS ──────────────────────────────────────
  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = usePersonProfile(userId);
  const {
    data: expensesData,
    isLoading: expensesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchExpenses,
  } = useSharedExpenses(userId);
  const { data: settlementData } = useSettlementOptions(userId);
  const { data: activityData } = usePersonActivity(userId, 10);

  const [refreshing, setRefreshing] = useState(false);

  // ── EXTRACT DATA ──────────────────────────────────
  const profile = profileData?.person;
  const profileBalance = profileData?.balance;
  const settlementBalance = settlementData?.balance;
  const settlementOptions = settlementData?.options || [];

  const balance = profileBalance ||
    settlementBalance || {
      youOwe: 0,
      theyOwe: 0,
      netBalance: 0,
      baseCurrency: 'INR',
      pendingSettlementCount: 0,
    };
  const activity = Array.isArray(activityData) ? activityData : [];

  const expenses = useMemo(() => {
    return (
      expensesData?.pages?.flatMap((page: any) => page?.expenses || []) || []
    );
  }, [expensesData]);

  const totalExpenses = expensesData?.pages?.[0]?.pagination?.total || 0;
  const friendshipStatus = profile?.friendshipStatus || 'none';
  const friendshipInfo =
    FRIENDSHIP_LABELS[friendshipStatus] || FRIENDSHIP_LABELS.none;
  const netBalance = balance?.netBalance || 0;

  // ── HANDLERS ──────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProfile(), refetchExpenses()]);
    } catch (e) {}
    setRefreshing(false);
  }, [refetchProfile, refetchExpenses]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleSettlementAction = (option: any) => {
    haptics.medium();
    const personName = profile?.displayName || 'this person';
    const amount = formatCurrency(option.data?.amount || 0);

    switch (option.type) {
      case 'upi':
        Alert.alert('UPI Payment', `${option.label} to ${personName}?`, [
          { text: 'Open UPI', style: 'default' },
          { text: 'Cancel', style: 'cancel' },
        ]);
        break;
      case 'remind':
        Alert.alert(
          'Reminder',
          `Send payment reminder to ${personName} for ${amount}?`,
          [
            {
              text: 'Send',
              onPress: () => Alert.alert('Sent!', 'Reminder has been sent.'),
            },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        break;
      case 'cash':
        Alert.alert('Mark as Paid', `Mark ${amount} as paid by cash?`, [
          {
            text: 'Yes',
            onPress: () => Alert.alert('Done!', 'Marked as paid.'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
        break;
    }
  };

  // ── LOADING STATE ─────────────────────────────────
  if (profileLoading && !refreshing && !profile) {
    return (
      <GlobalBackground>
        <View
          style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}
        >
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading...
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  const personName = profile?.displayName || 'Person';

  return (
    <GlobalBackground>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        {/* ── HEADER ──────────────────────────────── */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 12,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <AppIcon
              name="arrow-left"
              size={22}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {personName}
          </Text>
          <Pressable
            style={styles.headerBtn}
            onPress={() =>
              Share.share({ message: `Check out ${personName} on Wakeru! 🧳` })
            }
          >
            <AppIcon
              name="share-2"
              size={20}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        </View>

        {/* ── CONTENT ─────────────────────────────── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* ── TOP SECTION (Centered Profile & Balance) ── */}
          <View style={styles.topHeroSection}>
            <View style={styles.profileSection}>
              {profile?.photoURL ? (
                <Image
                  source={{ uri: profile.photoURL }}
                  style={styles.avatar}
                />
              ) : (
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>
                    {getInitials(personName)}
                  </Text>
                </LinearGradient>
              )}
              <Text
                style={[
                  styles.profileName,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {personName}
              </Text>

              {profile?.email && (
                <Text
                  style={[
                    styles.profileEmail,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {profile.email}
                </Text>
              )}

              <View
                style={[
                  styles.friendshipBadge,
                  { backgroundColor: friendshipInfo.bgColor },
                ]}
              >
                <AppIcon
                  name={friendshipInfo.icon}
                  size={14}
                  color={friendshipInfo.color}
                />
                <Text
                  style={[
                    styles.friendshipText,
                    { color: friendshipInfo.color },
                  ]}
                >
                  {friendshipInfo.label}
                </Text>
              </View>

              {/* Stats Row */}
              <View style={styles.profileStats}>
                <View style={styles.profileStat}>
                  <Text
                    style={[
                      styles.profileStatValue,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {profile?.totalSharedTrips || 0}
                  </Text>
                  <Text
                    style={[
                      styles.profileStatLabel,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    Trips
                  </Text>
                </View>
                <View
                  style={[
                    styles.profileStatDivider,
                    { backgroundColor: theme.colors.borderLight },
                  ]}
                />
                <View style={styles.profileStat}>
                  <Text
                    style={[
                      styles.profileStatValue,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {totalExpenses}
                  </Text>
                  <Text
                    style={[
                      styles.profileStatLabel,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    Expenses
                  </Text>
                </View>
                <View
                  style={[
                    styles.profileStatDivider,
                    { backgroundColor: theme.colors.borderLight },
                  ]}
                />
                <View style={styles.profileStat}>
                  <Text
                    style={[
                      styles.profileStatValue,
                      {
                        color:
                          netBalance > 0
                            ? '#059669'
                            : netBalance < 0
                              ? '#DC2626'
                              : theme.colors.textPrimary,
                      },
                    ]}
                  >
                    {netBalance > 0 ? '+' : ''}
                    {formatCurrency(Math.abs(netBalance))}
                  </Text>
                  <Text
                    style={[
                      styles.profileStatLabel,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    Balance
                  </Text>
                </View>
              </View>
            </View>

            {/* Balance Card */}
            <LinearGradient
              colors={
                netBalance > 0
                  ? ['#059669', '#047857']
                  : netBalance < 0
                    ? ['#DC2626', '#B91C1C']
                    : ['#6B7280', '#4B5563']
              }
              style={styles.balanceCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.balanceLabel}>
                {netBalance === 0
                  ? 'ALL SETTLED UP 🎉'
                  : netBalance > 0
                    ? 'THEY OWE YOU'
                    : 'YOU OWE THEM'}
              </Text>
              <Text style={styles.balanceAmount}>
                {netBalance > 0 ? '+' : ''}
                {formatCurrency(Math.abs(netBalance))}
              </Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceItemValue}>
                    {formatCurrency(balance?.youOwe || 0)}
                  </Text>
                  <Text style={styles.balanceItemLabel}>You Owe</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceItemValue}>
                    {formatCurrency(balance?.theyOwe || 0)}
                  </Text>
                  <Text style={styles.balanceItemLabel}>They Owe</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceItemValue}>
                    {balance?.pendingSettlementCount || 0}
                  </Text>
                  <Text style={styles.balanceItemLabel}>Pending</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Settlement Actions */}
            {settlementOptions.length > 0 &&
              settlementOptions[0]?.type !== 'none' && (
                <View style={styles.settlementSection}>
                  {settlementOptions.map((option: any, i: number) => (
                    <Pressable
                      key={i}
                      style={({ hovered }: any) => [
                        styles.settlementBtn,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.borderLight,
                        },
                        Platform.OS === 'web' &&
                          hovered && {
                            backgroundColor: theme.colors.primaryBg,
                            borderColor: theme.colors.primary,
                          },
                      ]}
                      onPress={() => handleSettlementAction(option)}
                    >
                      <AppIcon
                        name={
                          option.type === 'upi'
                            ? 'smartphone'
                            : option.type === 'remind'
                              ? 'bell'
                              : 'check'
                        }
                        size={18}
                        color={theme.colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.settlementBtnText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
          </View>

          {/* ── BOTTOM SECTION (Lists) ────────────────── */}
          <View
            style={[styles.listsContainer, isDesktop && styles.desktopGrid]}
          >
            {/* Recent Activity Column */}
            <View style={[styles.listCol, isDesktop && { flex: 1 }]}>
              <View style={styles.sectionHeader}>
                <AppIcon
                  name="activity"
                  size={18}
                  color={theme.colors.textPrimary}
                />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Recent Activity
                </Text>
              </View>

              {activity.length > 0 ? (
                <View style={styles.listWrapper}>
                  {activity.slice(0, 5).map((a: any, i: number) => (
                    <ActivityRow key={i} activity={a} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    No recent activity
                  </Text>
                </View>
              )}
            </View>

            {/* Shared Expenses Column */}
            <View style={[styles.listCol, isDesktop && { flex: 1 }]}>
              <View style={styles.sectionHeader}>
                <AppIcon
                  name="list"
                  size={18}
                  color={theme.colors.textPrimary}
                />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Shared Expenses
                </Text>
                {totalExpenses > 0 && (
                  <Badge label={totalExpenses.toString()} variant="neutral" />
                )}
              </View>

              {expensesLoading && expenses.length === 0 ? (
                <View style={styles.emptyState}>
                  <GlobalLoader
                    variant="inline"
                    size="small"
                    color={theme.colors.primary}
                  />
                </View>
              ) : expenses.length === 0 ? (
                <View style={styles.emptyState}>
                  <AppIcon
                    name="inbox"
                    size={32}
                    color={theme.colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    No shared expenses yet
                  </Text>
                </View>
              ) : (
                <View style={styles.listWrapper}>
                  {expenses.map((exp: any) => (
                    <ExpenseRow key={exp._id} expense={exp} />
                  ))}
                  {hasNextPage && (
                    <Pressable
                      style={({ hovered }: any) => [
                        styles.loadMoreBtn,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.borderLight,
                        },
                        Platform.OS === 'web' &&
                          hovered && {
                            backgroundColor: theme.colors.primaryBg,
                          },
                      ]}
                      onPress={handleLoadMore}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <GlobalLoader
                          variant="inline"
                          size="small"
                          color={theme.colors.primary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.loadMoreText,
                            { color: theme.colors.primary },
                          ]}
                        >
                          Load More
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </GlobalBackground>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingTop: 24, alignItems: 'center' },

  // Top Hero Layout
  topHeroSection: {
    width: '100%',
    maxWidth: 700,
    alignItems: 'center',
    marginBottom: 32,
  },

  // Bottom Lists Layout
  listsContainer: { width: '100%', maxWidth: 1100, gap: 32 },
  desktopGrid: { flexDirection: 'row', alignItems: 'flex-start' },
  listCol: { width: '100%' },
  listWrapper: { gap: 12 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  // Profile
  profileSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 16 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#FFF' },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  profileEmail: { fontSize: 14, fontWeight: '500', marginBottom: 12 },

  friendshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  friendshipText: { fontSize: 13, fontWeight: '700' },

  // Stats
  profileStats: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  profileStat: { alignItems: 'center', minWidth: 60 },
  profileStatValue: { fontSize: 24, fontWeight: '800' },
  profileStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  profileStatDivider: { width: 1, height: 35 },

  // Balance Card
  balanceCard: {
    width: '100%',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -2,
    marginTop: 12,
    marginBottom: 32,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceItemValue: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  balanceItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },

  // Settlement Button
  settlementSection: { width: '100%', gap: 12 },
  settlementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  } as any,
  settlementBtnText: { fontSize: 15, fontWeight: '700' },

  // List Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingLeft: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },

  // Shared List Items (Expense & Activity Cards)
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '0.2s',
  } as any,
  itemEmojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  itemMeta: { fontSize: 12, fontWeight: '500' },

  // Specifics
  activityMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  activityTrip: { fontSize: 12, fontWeight: '600' },
  activityAmount: { fontSize: 15, fontWeight: '700', marginLeft: 8 },

  expRight: { alignItems: 'flex-end', gap: 6 },
  expAmount: { fontSize: 16, fontWeight: '800' },
  directionBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  directionText: { fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },

  // Empty & Loading states
  loadMoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
  } as any,
  loadMoreText: { fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
});
