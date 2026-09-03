// app/(app)/(tabs)/index.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';

import GlobalLoader from '../../../components/common/GlobalLoader';
import { useTheme } from '../../../providers/ThemeProvider';
import { useMyTrips, useLatestTrip, useUnreadCount } from '../../../hooks';
import { usePendingInvitations } from '../../../hooks/useInvitations';
import { useAdminJoinRequests } from '../../../hooks/useJoinRequests';
import { useAuthStore } from '../../../stores/auth.store';
import { useResponsive } from '../../../hooks/useResponsive';
import { haptics } from '../../../utils/haptics';
import { safeFormatCurrency } from '../../../utils/formatters';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { Avatar } from '../../../components/ui/Avatar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Container } from '../../../components/ui/Container';
import { Grid } from '../../../components/ui/Grid';
import { TripCard } from '../../../components/ui/TripCard';
import {
  SearchFilterModal,
  SearchFilters,
} from '../../../components/trips/SearchFilterModal';
import { FinanceStreakCard } from '../../../components/finance/FinanceStreakCard';
import AppIcon from '../../../components/common/AppIcon';
import type { Theme } from '../../../theme';

// ─── Constants ───────────────────────────────────────────────
const FILTERS = [
  { key: undefined, label: 'All Trips', icon: 'globe' },
  { key: 'active', label: 'Active', icon: 'zap' },
  { key: 'planning', label: 'Planning', icon: 'calendar' },
  { key: 'completed', label: 'Completed', icon: 'check-circle' },
  { key: 'archived', label: 'Archived', icon: 'archive' },
] as const;

const QUICK_ACTIONS = [
  {
    icon: 'plus',
    label: 'New Trip',
    sub: 'Plan adventure',
    route: '/create-trip',
    gradient: ['#38BDF8', '#2563EB'],
  },
  {
    icon: 'user-plus',
    label: 'Join Trip',
    sub: 'With invite code',
    route: '/(app)/trips/join',
    gradient: ['#A78BFA', '#7C3AED'],
  },
  {
    icon: 'credit-card',
    label: 'Settle Up',
    sub: 'Clear balances',
    route: '/(app)/settlements',
    gradient: ['#34D399', '#059669'],
  },
  {
    icon: 'search',
    label: 'Search',
    sub: 'Find anywhere',
    action: 'openSearch',
    gradient: ['#FBBF24', '#D97706'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────
function getGreeting(): { emoji: string; text: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { emoji: '🌙', text: 'Good Night' };
  if (hour < 12) return { emoji: '🌅', text: 'Good Morning' };
  if (hour < 17) return { emoji: '☀️', text: 'Good Afternoon' };
  if (hour < 21) return { emoji: '🌇', text: 'Good Evening' };
  return { emoji: '🌙', text: 'Good Night' };
}

function stripFloat(value: number | string): number {
  return Math.round(Number(value) || 0);
}

// ─── Notification Button ─────────────────────────────────────
function NotifButton({
  icon,
  count,
  onPress,
}: {
  icon: string;
  count: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        notifStyles(theme).btn,
        { backgroundColor: theme.colors.surface },
        pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
      ]}
      hitSlop={8}
    >
      <AppIcon name={icon as any} size={18} color={theme.colors.textPrimary} />
      {count > 0 && (
        <View style={notifStyles(theme).badge}>
          <Text style={notifStyles(theme).badgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Bento Quick Actions Cluster ─────────────────────────────
function BentoQuickActions({ onOpenSearch }: { onOpenSearch: () => void }) {
  const theme = useTheme();

  return (
    <View style={bentoStyles(theme).actionsGrid}>
      {QUICK_ACTIONS.map(action => (
        <Pressable
          key={action.label}
          onPress={() => {
            haptics.light();
            if (action.action === 'openSearch') onOpenSearch();
            else router.push(action.route as any);
          }}
          style={({ pressed }) => [
            bentoStyles(theme).actionCard,
            { backgroundColor: theme.colors.surface },
            pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={action.gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={bentoStyles(theme).actionIconWrap}
          >
            <AppIcon name={action.icon as any} size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={bentoStyles(theme).actionTextWrap}>
            <Text
              style={[
                bentoStyles(theme).actionLabel,
                { color: theme.colors.textPrimary },
              ]}
            >
              {action.label}
            </Text>
            <Text
              style={[
                bentoStyles(theme).actionSub,
                { color: theme.colors.textTertiary },
              ]}
            >
              {action.sub}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Bento Stats Card Strip ──────────────────────────────────
function BentoStatsCard({
  stats,
  tripsCount,
}: {
  stats: any;
  tripsCount: number;
}) {
  const theme = useTheme();

  const statItems = [
    {
      icon: 'map-pin',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
      label: 'ACTIVE TRIPS',
      value: stripFloat(stats.activeTripsCount),
      sub: `${stats.totalCountries || 0} countr${stats.totalCountries === 1 ? 'y' : 'ies'}`,
    },
    {
      icon: 'credit-card',
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
      label: 'TOTAL SPENT',
      value: `₹${stripFloat(stats.totalSpentBase).toLocaleString('en-IN')}`,
      sub: 'Across all trips',
    },
    {
      icon: 'users',
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
      label: 'TRAVEL CREW',
      value: stripFloat(stats.totalTravelers),
      sub: `In ${tripsCount} adventure${tripsCount !== 1 ? 's' : ''}`,
    },
  ];

  return (
    <View style={bentoStyles(theme).statsGrid}>
      {statItems.map(item => (
        <View
          key={item.label}
          style={[
            bentoStyles(theme).statTile,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={bentoStyles(theme).statTopRow}>
            <View
              style={[
                bentoStyles(theme).statIconWrap,
                { backgroundColor: item.iconBg },
              ]}
            >
              <AppIcon
                name={item.icon as any}
                size={15}
                color={item.iconColor}
              />
            </View>
            <Text
              style={[bentoStyles(theme).statLabel, { color: item.iconColor }]}
            >
              {item.label}
            </Text>
          </View>
          <Text
            style={[
              bentoStyles(theme).statValue,
              { color: theme.colors.textPrimary },
            ]}
          >
            {item.value}
          </Text>
          <Text
            style={[
              bentoStyles(theme).statSub,
              { color: theme.colors.textTertiary },
            ]}
          >
            {item.sub}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Filter Tab Bar ──────────────────────────────────────────
function FilterTabBar({
  active,
  onChange,
}: {
  active: string | undefined;
  onChange: (key: string | undefined) => void;
}) {
  const theme = useTheme();

  return (
    <View style={tabBarStyles(theme).container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabBarStyles(theme).scrollList}
      >
        {FILTERS.map(f => {
          const isActive = active === f.key;
          return (
            <Pressable
              key={f.key || 'all'}
              onPress={() => {
                haptics.light();
                onChange(isActive ? undefined : f.key);
              }}
              style={[
                tabBarStyles(theme).tabPill,
                isActive
                  ? { backgroundColor: theme.colors.primary }
                  : {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                    },
              ]}
            >
              <AppIcon
                name={f.icon as any}
                size={13}
                color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
              />
              <Text
                style={[
                  tabBarStyles(theme).tabLabel,
                  {
                    color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Featured Trip + Momentum Row ────────────────────────────
function FeaturedRow({
  featuredTrip,
  onTripPress,
}: {
  featuredTrip: any;
  onTripPress: () => void;
}) {
  const theme = useTheme();
  const { isDesktop } = useResponsive();

  return (
    <View
      style={[
        featuredStyles(theme).container,
        isDesktop && featuredStyles(theme).desktopContainer,
      ]}
    >
      {/* Featured Trip Card */}
      <View style={[featuredStyles(theme).column, isDesktop && { flex: 1.4 }]}>
        <View style={featuredStyles(theme).sectionHeader}>
          <View>
            <Text
              style={[
                featuredStyles(theme).sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Featured Adventure
            </Text>
            <Text
              style={[
                featuredStyles(theme).sectionSub,
                { color: theme.colors.textTertiary },
              ]}
            >
              Your most recent & active expedition
            </Text>
          </View>
        </View>
        <TripCard trip={featuredTrip} onPress={onTripPress} />
      </View>

      {/* Finance Momentum Streak Tile */}
      <View style={[featuredStyles(theme).column, isDesktop && { flex: 1 }]}>
        <View style={featuredStyles(theme).sectionHeader}>
          <View>
            <Text
              style={[
                featuredStyles(theme).sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Spending Momentum
            </Text>
            <Text
              style={[
                featuredStyles(theme).sectionSub,
                { color: theme.colors.textTertiary },
              ]}
            >
              Budget habit tracker & streaks
            </Text>
          </View>
        </View>
        <FinanceStreakCard limit={100} />
      </View>
    </View>
  );
}

// ─── Main Screen Component ───────────────────────────────────
export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isDesktop, isMobile, width } = useResponsive();
  const styles = homeStyles(theme);

  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchName: '',
    searchUser: '',
    dateRange: 'all',
  });

  const { user } = useAuthStore();
  const { data: latestTrip } = useLatestTrip();
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyTrips({
    status: filter,
    includeArchived: filter === 'archived',
    searchName: searchFilters.searchName,
    searchUser: searchFilters.searchUser,
    dateRange: searchFilters.dateRange,
  });
  const { data: unread = 0 } = useUnreadCount();
  const { data: invitations } = usePendingInvitations();
  const { data: adminRequests } = useAdminJoinRequests();

  const invitationCount =
    (invitations?.length || 0) + (adminRequests?.length || 0);
  const userName = user?.displayName || 'Traveler';
  const firstName = userName.split(' ')[0];
  const trips = useMemo(
    () => data?.pages.flatMap(page => page?.trips || []) || [],
    [data],
  );
  const stats = data?.pages[0]?.stats || {
    activeTripsCount: 0,
    totalSpentBase: 0,
    totalCountries: 0,
    totalTravelers: 0,
  };

  const greeting = getGreeting();
  const featuredTrip =
    latestTrip || (trips.length > 0 && !filter ? trips[0] : null);
  const otherTrips = trips.filter(t => t._id !== featuredTrip?._id);

  const handleRefresh = useCallback(() => {
    haptics.light();
    refetch();
  }, [refetch]);

  const gridCols = isDesktop ? (width >= 1400 ? 3 : 2) : 1;

  if (isLoading) {
    return (
      <GlobalBackground>
        <View style={styles.loadingWrap}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading your journeys…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10,
            paddingBottom: insets.bottom + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        onMomentumScrollEnd={e => {
          const isAtBottom =
            e.nativeEvent.layoutMeasurement.height +
              e.nativeEvent.contentOffset.y >=
            e.nativeEvent.contentSize.height - 40;
          if (isAtBottom && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
      >
        <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
          {/* ── TOP HEADER ──────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text
                style={[
                  styles.greetingSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {greeting.text} {greeting.emoji}
              </Text>
              <Text
                style={[
                  styles.greetingName,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {firstName}
              </Text>
              <Text
                style={[
                  styles.greetingStats,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {stats.activeTripsCount} active expeditions ·{' '}
                {stats.totalTravelers} travel crew
              </Text>
            </View>

            <View style={styles.headerRight}>
              <NotifButton
                icon="mail"
                count={invitationCount}
                onPress={() => {
                  haptics.light();
                  router.push('/(app)/requests');
                }}
              />
              <NotifButton
                icon="bell"
                count={unread}
                onPress={() => {
                  haptics.light();
                  router.push('/(app)/notifications');
                }}
              />
              <Pressable
                onPress={() => {
                  haptics.light();
                  router.push('/(app)/profile');
                }}
                style={({ pressed }) => pressed && { opacity: 0.8 }}
              >
                <Avatar
                  url={user?.photoURL || undefined}
                  fallback={firstName.charAt(0)}
                  size="md"
                  online
                />
              </Pressable>
            </View>
          </View>

          {/* ── BENTO QUICK ACTIONS (4 TILES) ──────── */}
          <View style={styles.sectionBlock}>
            <BentoQuickActions onOpenSearch={() => setIsSearchOpen(true)} />
          </View>

          {/* ── BENTO TRAVEL METRICS (3 TILES) ─────── */}
          <View style={styles.sectionBlock}>
            <BentoStatsCard stats={stats} tripsCount={trips.length} />
          </View>

          {/* ── FEATURED TRIP + STREAK ROW ─────────── */}
          {featuredTrip && (
            <FeaturedRow
              featuredTrip={featuredTrip}
              onTripPress={() => {
                haptics.light();
                router.push(`/(app)/trips/${featuredTrip._id}`);
              }}
            />
          )}

          {/* ── ALL TRIPS EXPLORER ─────────────────── */}
          <View style={styles.tripsSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  All Expeditions
                </Text>
                <Text
                  style={[
                    styles.sectionSubHeading,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {trips.length} registered{' '}
                  {trips.length === 1 ? 'trip' : 'trips'}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  haptics.light();
                  router.push('/(app)/trips');
                }}
                style={styles.viewAllBtn}
              >
                <Text
                  style={[styles.viewAllText, { color: theme.colors.primary }]}
                >
                  View All
                </Text>
                <AppIcon
                  name="arrow-right"
                  size={14}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>

            {/* Filter Tab Bar */}
            <FilterTabBar active={filter} onChange={setFilter} />

            {otherTrips.length > 0 ? (
              <>
                <Grid cols={gridCols} gap={14}>
                  {otherTrips.map((trip: any, index: number) => (
                    <Animated.View
                      key={trip._id}
                      entering={FadeInDown.delay(index * 30)
                        .springify()
                        .damping(18)}
                      layout={Layout.springify()}
                      style={{ minWidth: 0 }}
                    >
                      <TripCard
                        trip={trip}
                        onPress={() => {
                          haptics.light();
                          router.push(`/(app)/trips/${trip._id}`);
                        }}
                      />
                    </Animated.View>
                  ))}
                </Grid>

                {hasNextPage && (
                  <View style={styles.loadMoreWrap}>
                    {isFetchingNextPage ? (
                      <GlobalLoader
                        variant="inline"
                        size="small"
                        color={theme.colors.primary}
                      />
                    ) : (
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          fetchNextPage();
                        }}
                        style={[
                          styles.loadMoreBtn,
                          { borderColor: theme.colors.borderLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.loadMoreText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Load More Trips
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </>
            ) : trips.length === 0 ? (
              <Animated.View
                entering={FadeInUp.delay(100).springify().damping(18)}
              >
                <EmptyState
                  icon="✈️"
                  title="No Trips Found"
                  description="Create your first adventure and start splitting expenses effortlessly."
                  actionLabel="Create New Trip"
                  onAction={() => {
                    haptics.light();
                    router.push('/create-trip');
                  }}
                />
              </Animated.View>
            ) : (
              <Text
                style={[
                  styles.allShownText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                All trips are currently featured above.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Search Modal */}
      <SearchFilterModal
        visible={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        filters={searchFilters}
        onApply={setSearchFilters}
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

function homeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16 },
    mainWrapper: { width: '100%' },
    desktopWrapper: {
      maxWidth: 1400,
      alignSelf: 'center',
      paddingHorizontal: 16,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    loadingText: { fontSize: 13, fontWeight: '600' },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerLeft: { flex: 1 },
    greetingSub: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    greetingName: {
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.8,
      marginTop: 2,
    },
    greetingStats: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    sectionBlock: {
      marginBottom: 16,
    },
    tripsSection: {
      marginTop: 8,
      marginBottom: 32,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 14,
    },
    sectionHeading: {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    sectionSubHeading: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '800',
    },
    loadMoreWrap: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    loadMoreBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
    },
    loadMoreText: {
      fontSize: 13,
      fontWeight: '700',
    },
    allShownText: {
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '500',
      paddingVertical: 24,
    },
  });
}

function bentoStyles(theme: Theme) {
  return StyleSheet.create({
    // Quick Actions Bento (2x2 on Mobile, 4-in-a-row on Desktop)
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    actionCard: {
      flex: 1,
      minWidth: 155,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

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
    },
    actionIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionTextWrap: {
      flex: 1,
      gap: 1,
    },
    actionLabel: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    actionSub: {
      fontSize: 10,
      fontWeight: '500',
    },

    // Stats Grid
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statTile: {
      flex: 1,
      minWidth: 105,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

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

      justifyContent: 'space-between',
    },
    statTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    statIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    statSub: {
      fontSize: 10,
      fontWeight: '500',
      marginTop: 2,
    },
  });
}

function tabBarStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    scrollList: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tabPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
    },
    tabLabel: {
      fontSize: 12,
    },
  });
}

function featuredStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: 16,
      marginBottom: 20,
    },
    desktopContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    column: {
      flex: 1,
      gap: 8,
    },
    sectionHeader: {
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    sectionSub: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
    },
  });
}

function notifStyles(theme: Theme) {
  return StyleSheet.create({
    btn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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
    badge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
    },
  });
}

// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   StyleSheet,
//   RefreshControl,
//   ScrollView,
//   Platform,
// } from 'react-native';
// import { router } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

// import GlobalLoader from '../../../components/common/GlobalLoader';
// import { useTheme } from '../../../providers/ThemeProvider';
// import { useMyTrips, useLatestTrip, useUnreadCount } from '../../../hooks';
// import { usePendingInvitations } from '../../../hooks/useInvitations';
// import { useAdminJoinRequests } from '../../../hooks/useJoinRequests';
// import { useAuthStore } from '../../../stores/auth.store';
// import { useResponsive } from '../../../hooks/useResponsive';
// import { haptics } from '../../../utils/haptics';

// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import { Typography } from '../../../components/ui/Typography';
// import { Badge } from '../../../components/ui/Badge';
// import { Button } from '../../../components/ui/Button';
// import { AmountDisplay } from '../../../components/ui/AmountDisplay';
// import { Avatar } from '../../../components/ui/Avatar';
// import { EmptyState } from '../../../components/ui/EmptyState';
// import { InteractiveWrapper } from '../../../components/ui/InteractiveWrapper';
// import { Container } from '../../../components/ui/Container';
// import { Grid } from '../../../components/ui/Grid';

// import { SearchFilterModal, SearchFilters } from '../../../components/trips/SearchFilterModal';
// import { FinanceStreakCard } from '../../../components/finance/FinanceStreakCard';
// import type { Theme } from '../../../theme';
// import { TripCard } from '../../../components/ui/TripCard';

// // ─── Constants ───────────────────────────────────────────────
// const WEB = Platform.OS === 'web';

// const FILTERS = [
//   { key: undefined, label: 'All', icon: '🌍' },
//   { key: 'active', label: 'Active', icon: '🟢' },
//   { key: 'planning', label: 'Planning', icon: '📋' },
//   { key: 'completed', label: 'Completed', icon: '✅' },
//   { key: 'archived', label: 'Archived', icon: '📦' },
// ] as const;

// const QUICK_ACTIONS = [
//   { icon: '✈️', label: 'New Trip', route: '/create-trip', gradient: 'ocean' as const },
//   { icon: '🔗', label: 'Join Trip', route: '/(app)/trips/join', gradient: 'aurora' as const },
//   { icon: '🤝', label: 'Settle Up', route: '/(app)/settlements', gradient: 'gold' as const },
//   { icon: '🔍', label: 'Search', action: 'openSearch', gradient: 'midnight' as const },
// ];

// // ─── Helpers ─────────────────────────────────────────────────
// function getGreeting(): { emoji: string; text: string } {
//   const hour = new Date().getHours();
//   if (hour < 6) return { emoji: '🌙', text: 'Good Night' };
//   if (hour < 12) return { emoji: '🌅', text: 'Good Morning' };
//   if (hour < 17) return { emoji: '☀️', text: 'Good Afternoon' };
//   if (hour < 21) return { emoji: '🌇', text: 'Good Evening' };
//   return { emoji: '🌙', text: 'Good Night' };
// }

// function stripFloat(value: number | string): number {
//   return Math.round(Number(value));
// }

// // ─── Notification Button ─────────────────────────────────────
// function NotifButton({
//   icon,
//   count,
//   onPress,
// }: {
//   icon: string;
//   count: number;
//   onPress: () => void;
// }) {
//   const theme = useTheme();
//   return (
//     <InteractiveWrapper onPress={onPress} hoverElevation={false}>
//       <GlassCard
//         variant="medium"
//         padding="none"
//         style={[
//           notifStyles(theme).btn,
//           { borderWidth: 1, borderColor: theme.colors.borderLight },
//         ]}
//       >
//         <Typography variant="body">{icon}</Typography>
//         {count > 0 && (
//           <View style={notifStyles(theme).badge}>
//             <Typography
//               variant="caption"
//               weight="extrabold"
//               color="textInverse"
//               style={{ fontSize: 10, lineHeight: 10 }}
//             >
//               {count > 99 ? '99+' : count}
//             </Typography>
//           </View>
//         )}
//       </GlassCard>
//     </InteractiveWrapper>
//   );
// }

// // ─── Bento Quick Actions (4-in-1 Card) ──────────────────────
// function BentoQuickActions({ onOpenSearch }: { onOpenSearch: () => void }) {
//   const theme = useTheme();
//   const { isMobile } = useResponsive();

//   if (isMobile) {
//     return (
//       <Animated.View entering={FadeInDown.springify().damping(18)}>
//         <GlassCard variant="medium" padding="md">
//           <View style={{ gap: theme.spacing[2] }}>
//             {/* Row 1 */}
//             <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
//               <QuickActionItem action={QUICK_ACTIONS[0]} onOpenSearch={onOpenSearch} style={{ flex: 1 }} />
//               <View style={{ width: 1, backgroundColor: theme.colors.borderLight }} />
//               <QuickActionItem action={QUICK_ACTIONS[1]} onOpenSearch={onOpenSearch} style={{ flex: 1 }} />
//             </View>

//             <View style={{ height: 1, backgroundColor: theme.colors.borderLight }} />

//             {/* Row 2 */}
//             <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
//               <QuickActionItem action={QUICK_ACTIONS[2]} onOpenSearch={onOpenSearch} style={{ flex: 1 }} />
//               <View style={{ width: 1, backgroundColor: theme.colors.borderLight }} />
//               <QuickActionItem action={QUICK_ACTIONS[3]} onOpenSearch={onOpenSearch} style={{ flex: 1 }} />
//             </View>
//           </View>
//         </GlassCard>
//       </Animated.View>
//     );
//   }

//   return (
//     <Animated.View entering={FadeInDown.springify().damping(18)}>
//       <GlassCard variant="medium" padding="md">
//         <View style={bentoStyles(theme).desktopRow}>
//           {QUICK_ACTIONS.map((action, index) => (
//             <React.Fragment key={action.label}>
//               {index > 0 && <View style={bentoStyles(theme).divider} />}
//               <View style={bentoStyles(theme).segment}>
//                 <QuickActionItem action={action} onOpenSearch={onOpenSearch} />
//               </View>
//             </React.Fragment>
//           ))}
//         </View>
//       </GlassCard>
//     </Animated.View>
//   );
// }

// // ─── Quick Action Item ───────────────────────────────────────
// function QuickActionItem({
//   action,
//   onOpenSearch,
//   style,
// }: {
//   action: (typeof QUICK_ACTIONS)[number];
//   onOpenSearch: () => void;
//   style?: any;
// }) {
//   const theme = useTheme();

//   return (
//     <InteractiveWrapper
//       onPress={() => {
//         haptics.light();
//         if (action.action === 'openSearch') onOpenSearch();
//         else router.push(action.route as any);
//       }}
//       hoverElevation
//       style={[{ flex: 1 }, style]}
//     >
//       <View style={quickStyles(theme).item}>
//         <View style={quickStyles(theme).iconWrapper}>
//           <LinearGradient
//             colors={theme.gradients[action.gradient].slice(0, 2) as any}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//             style={StyleSheet.absoluteFill}
//           />
//           <View style={quickStyles(theme).iconInnerHighlight} pointerEvents="none" />
//           <Typography variant="body" style={{ zIndex: 1, fontSize: 20 }}>
//             {action.icon}
//           </Typography>
//         </View>
//         <Typography
//           variant="caption"
//           weight="bold"
//           color="textPrimary"
//           align="center"
//           style={{ marginTop: theme.spacing[1], fontSize: 11 }}
//           numberOfLines={1}
//         >
//           {action.label}
//         </Typography>
//       </View>
//     </InteractiveWrapper>
//   );
// }

// // ─── Filter Tab Bar ──────────────────────────────────────────
// function FilterTabBar({
//   active,
//   onChange,
// }: {
//   active: string | undefined;
//   onChange: (key: string | undefined) => void;
// }) {
//   const theme = useTheme();

//   return (
//     <View style={{ marginBottom: theme.spacing[4] }}>
//       <GlassCard variant="subtle" padding="xs" intensity={theme.isDark ? 20 : 30}>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={{
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing[1],
//             paddingHorizontal: theme.spacing[1],
//           }}
//         >
//           {FILTERS.map((f) => {
//             const isActive = active === f.key;
//             return (
//               <InteractiveWrapper
//                 key={f.key || 'all'}
//                 onPress={() => {
//                   haptics.light();
//                   onChange(isActive ? undefined : f.key);
//                 }}
//                 style={{ flex: 1, minWidth: 80 }}
//               >
//                 <View
//                   style={[
//                     tabBarStyles(theme).tabItem,
//                     isActive && tabBarStyles(theme).tabItemActive,
//                   ]}
//                 >
//                   <Typography variant="bodySm">{f.icon}</Typography>
//                   <Typography
//                     variant="caption"
//                     weight="semibold"
//                     color={isActive ? 'textInverse' : 'textSecondary'}
//                     numberOfLines={1}
//                   >
//                     {f.label}
//                   </Typography>
//                 </View>
//               </InteractiveWrapper>
//             );
//           })}
//         </ScrollView>
//       </GlassCard>
//     </View>
//   );
// }

// // ─── Bento Stats Card (3-in-1) ──────────────────────────────
// function BentoStatsCard({ stats, trips }: { stats: any; trips: any[] }) {
//   const theme = useTheme();
//   const { isMobile } = useResponsive();

//   const statItems = [
//     {
//       icon: '🧳',
//       iconBgColor: theme.colors.primaryBg,
//       iconColor: theme.colors.primary,
//       label: 'Active Trips',
//       value: stripFloat(stats.activeTripsCount),
//       subtitle: `${stats.totalCountries} countr${stats.totalCountries === 1 ? 'y' : 'ies'}`,
//     },
//     {
//       icon: '💸',
//       iconBgColor: theme.colors.warningBg,
//       iconColor: theme.colors.warning,
//       label: 'Total Spent',
//       amount: stripFloat(stats.totalSpentBase),
//       currency: 'INR',
//       isAmount: true,
//     },
//     {
//       icon: '👥',
//       iconBgColor: theme.colors.successBg,
//       iconColor: theme.colors.success,
//       label: 'Travel Buddies',
//       value: stripFloat(stats.totalTravelers),
//       subtitle: `Across ${trips.length} trip${trips.length !== 1 ? 's' : ''}`,
//     },
//   ];

//   if (isMobile) {
//     return (
//       <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
//         <GlassCard variant="medium" padding="md">
//           <View style={{ gap: theme.spacing[3] }}>
//             {statItems.map((item, index) => (
//               <React.Fragment key={item.label}>
//                 {index > 0 && <View style={{ height: 1, backgroundColor: theme.colors.borderLight }} />}
//                 <BentoStatItem {...item} />
//               </React.Fragment>
//             ))}
//           </View>
//         </GlassCard>
//       </Animated.View>
//     );
//   }

//   return (
//     <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
//       <GlassCard variant="medium" padding="md">
//         <View style={bentoStyles(theme).desktopRow}>
//           {statItems.map((item, index) => (
//             <React.Fragment key={item.label}>
//               {index > 0 && <View style={bentoStyles(theme).divider} />}
//               <View style={bentoStyles(theme).segment}>
//                 <BentoStatItem {...item} />
//               </View>
//             </React.Fragment>
//           ))}
//         </View>
//       </GlassCard>
//     </Animated.View>
//   );
// }

// // ─── Bento Stat Item ─────────────────────────────────────────
// function BentoStatItem({
//   icon,
//   iconBgColor,
//   label,
//   value,
//   subtitle,
//   amount,
//   currency,
//   isAmount,
// }: {
//   icon: string;
//   iconBgColor: string;
//   iconColor: string;
//   label: string;
//   value?: number;
//   subtitle?: string;
//   amount?: number;
//   currency?: string;
//   isAmount?: boolean;
// }) {
//   const theme = useTheme();

//   return (
//     <View style={{ flex: 1, gap: theme.spacing[1] }}>
//       <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
//         <View
//           style={{
//             width: 32,
//             height: 32,
//             borderRadius: theme.borderRadius.md,
//             backgroundColor: iconBgColor,
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//         >
//           <Typography variant="body" style={{ fontSize: 16 }}>{icon}</Typography>
//         </View>
//         <Typography
//           variant="caption"
//           weight="semibold"
//           color="textSecondary"
//           style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
//         >
//           {label}
//         </Typography>
//       </View>
//       <View style={{ paddingLeft: 40 }}>
//         {isAmount && amount !== undefined && currency ? (
//           <AmountDisplay amount={amount} currency={currency} size="md" variant="default" />
//         ) : (
//           <Typography variant="h3" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//             {value ?? '—'}
//           </Typography>
//         )}
//         {subtitle ? (
//           <Typography variant="caption" color="textTertiary" style={{ marginTop: 2 }}>
//             {subtitle}
//           </Typography>
//         ) : null}
//       </View>
//     </View>
//   );
// }

// // ─── Featured Trip + Streak Row ──────────────────────────────
// function FeaturedRow({
//   featuredTrip,
//   onTripPress,
// }: {
//   featuredTrip: any;
//   onTripPress: () => void;
// }) {
//   const theme = useTheme();
//   const { isMobile } = useResponsive();

//   if (isMobile) {
//     return (
//       <View style={{ gap: theme.spacing[5], marginBottom: theme.spacing[6] }}>
//         <Animated.View entering={FadeInUp.springify().damping(18)}>
//           <View style={{ marginBottom: theme.spacing[2] }}>
//             <Typography variant="h2" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//               Featured Trip
//             </Typography>
//             <Typography variant="bodySm" color="textTertiary" weight="medium" style={{ marginTop: 4 }}>
//               Your most active adventure
//             </Typography>
//           </View>
//           <TripCard trip={featuredTrip} onPress={onTripPress} />
//         </Animated.View>
//         <Animated.View entering={FadeInUp.delay(100).springify().damping(18)}>
//           <FinanceStreakCard limit={100} />
//         </Animated.View>
//       </View>
//     );
//   }

//   return (
//     <View
//       style={{
//         flexDirection: 'row',
//         gap: theme.spacing[6],
//         marginBottom: theme.spacing['3xl'],
//         width: '100%',
//       }}
//     >
//       <Animated.View entering={FadeInUp.springify().damping(18)} style={{ flex: 3, minWidth: 0 }}>
//         <View style={{ marginBottom: theme.spacing[3] }}>
//           <Typography variant="h2" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//             Featured Trip
//           </Typography>
//           <Typography variant="bodySm" color="textTertiary" weight="medium" style={{ marginTop: 4 }}>
//             Your most active adventure
//           </Typography>
//         </View>
//         <TripCard trip={featuredTrip} onPress={onTripPress} />
//       </Animated.View>

//       <Animated.View entering={FadeInUp.delay(100).springify().damping(18)} style={{ flex: 2, minWidth: 0 }}>
//         <View style={{ marginBottom: theme.spacing[3] }}>
//           <Typography variant="h2" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//             Streak
//           </Typography>
//           <Typography variant="bodySm" color="textTertiary" weight="medium" style={{ marginTop: 4 }}>
//             Your spending momentum
//           </Typography>
//         </View>
//         <FinanceStreakCard limit={100} />
//       </Animated.View>
//     </View>
//   );
// }

// // ─── Main Screen ─────────────────────────────────────────────
// export default function HomeScreen() {
//   const theme = useTheme();
//   const insets = useSafeAreaInsets();
//   const { isDesktop, isMobile, width } = useResponsive();
//   const styles = homeStyles(theme);

//   const [filter, setFilter] = useState<string | undefined>(undefined);
//   const [isSearchOpen, setIsSearchOpen] = useState(false);
//   const [searchFilters, setSearchFilters] = useState<SearchFilters>({
//     searchName: '',
//     searchUser: '',
//     dateRange: 'all',
//   });

//   const { user } = useAuthStore();
//   const { data: latestTrip } = useLatestTrip();
//   const {
//     data,
//     isLoading,
//     isRefetching,
//     refetch,
//     fetchNextPage,
//     hasNextPage,
//     isFetchingNextPage,
//   } = useMyTrips({
//     status: filter,
//     includeArchived: filter === 'archived',
//     searchName: searchFilters.searchName,
//     searchUser: searchFilters.searchUser,
//     dateRange: searchFilters.dateRange,
//   });
//   const { data: unread = 0 } = useUnreadCount();
//   const { data: invitations } = usePendingInvitations();
//   const { data: adminRequests } = useAdminJoinRequests();

//   const invitationCount = (invitations?.length || 0) + (adminRequests?.length || 0);
//   const userName = user?.displayName || 'Traveler';
//   const firstName = userName.split(' ')[0];
//   const trips = data?.pages.flatMap((page) => page?.trips || []) || [];
//   const stats = data?.pages[0]?.stats || {
//     activeTripsCount: 0,
//     totalSpentBase: 0,
//     totalCountries: 0,
//     totalTravelers: 0,
//   };

//   const greeting = getGreeting();
//   const featuredTrip = latestTrip || (trips.length > 0 && !filter ? trips[0] : null);
//   const otherTrips = trips.filter((t) => t._id !== featuredTrip?._id);

//   const handleRefresh = useCallback(() => {
//     haptics.light();
//     refetch();
//   }, [refetch]);

//   const gridCols = isDesktop ? (width >= 1400 ? 4 : 3) : isMobile ? 1 : 2;

//   if (isLoading) {
//     return (
//       <GlobalBackground>
//         <View style={styles.loadingWrap}>
//           <GlobalLoader variant="inline" size="large" color={theme.colors.primary} />
//           <Typography variant="bodySm" color="textSecondary" style={{ marginTop: theme.spacing[3] }}>
//             Loading your trips…
//           </Typography>
//         </View>
//       </GlobalBackground>
//     );
//   }

//   return (
//     <View style={styles.root}>
//       <View style={StyleSheet.absoluteFill} pointerEvents="none">
//         <GlobalBackground />
//       </View>

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={{
//           paddingTop: insets.top + theme.spacing[4],
//           paddingBottom: insets.bottom + theme.spacing['5xl'],
//         }}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={isRefetching}
//             onRefresh={handleRefresh}
//             tintColor={theme.colors.primary}
//             colors={[theme.colors.primary]}
//           />
//         }
//         onMomentumScrollEnd={(e) => {
//           const isAtBottom =
//             e.nativeEvent.layoutMeasurement.height +
//             e.nativeEvent.contentOffset.y >=
//             e.nativeEvent.contentSize.height - 40;
//           if (isAtBottom && hasNextPage && !isFetchingNextPage) {
//             fetchNextPage();
//           }
//         }}
//       >
//         <Container maxWidth={WEB ? 1400 : undefined}>
//           {/* ── HEADER ──────────────────────────── */}
//           <View style={styles.header}>
//             <View style={styles.headerLeft}>
//               <Typography variant="overline" color="textTertiary" weight="semibold" style={{ letterSpacing: 1 }}>
//                 {greeting.text} {greeting.emoji}
//               </Typography>
//               <Typography
//                 variant="h1"
//                 weight="extrabold"
//                 color="textPrimary"
//                 style={{ letterSpacing: -1, marginTop: 4 }}
//               >
//                 {firstName}
//               </Typography>
//               <Typography
//                 variant="bodySm"
//                 color="textSecondary"
//                 weight="medium"
//                 style={{ marginTop: 6 }}
//               >
//                 {stats.activeTripsCount} active trips · {stats.totalTravelers} travelers
//               </Typography>
//             </View>

//             <View style={styles.headerRight}>
//               <NotifButton
//                 icon="📬"
//                 count={invitationCount}
//                 onPress={() => {
//                   haptics.light();
//                   router.push('/(app)/requests');
//                 }}
//               />
//               <NotifButton
//                 icon="🔔"
//                 count={unread}
//                 onPress={() => {
//                   haptics.light();
//                   router.push('/(app)/notifications');
//                 }}
//               />
//               <InteractiveWrapper
//                 onPress={() => {
//                   haptics.light();
//                   router.push('/(app)/profile');
//                 }}
//                 hoverElevation={false}
//               >
//                 <Avatar
//                   url={user?.photoURL || undefined}
//                   fallback={firstName.charAt(0)}
//                   size="md"
//                   online
//                 />
//               </InteractiveWrapper>
//             </View>
//           </View>

//           {/* ── BENTO QUICK ACTIONS (4-in-1 Card) ── */}
//           <View style={{ marginBottom: theme.spacing['3xl'] }}>
//             <BentoQuickActions onOpenSearch={() => setIsSearchOpen(true)} />
//           </View>

//           {/* ── BENTO STATS (3-in-1 Card) ────────── */}
//           <View style={{ marginBottom: theme.spacing['3xl'] }}>
//             <BentoStatsCard stats={stats} trips={trips} />
//           </View>

//           {/* ── FEATURED TRIP + STREAK (Side-by-Side) ── */}
//           {featuredTrip && (
//             <FeaturedRow
//               featuredTrip={featuredTrip}
//               onTripPress={() => {
//                 haptics.light();
//                 router.push(`/(app)/trips/${featuredTrip._id}`);
//               }}
//             />
//           )}

//           {/* ── ALL TRIPS ────────────────────────── */}
//           <View style={{ marginBottom: theme.spacing[6] }}>
//             <View style={styles.sectionHeader}>
//               <View style={{ flex: 1 }}>
//                 <Typography
//                   variant="h2"
//                   weight="extrabold"
//                   color="textPrimary"
//                   style={{ letterSpacing: -0.5 }}
//                 >
//                   All Trips
//                 </Typography>
//                 <Typography
//                   variant="bodySm"
//                   color="textTertiary"
//                   weight="medium"
//                   style={{ marginTop: 4 }}
//                 >
//                   {trips.length} trip{trips.length !== 1 ? 's' : ''}
//                 </Typography>
//               </View>
//               <InteractiveWrapper
//                 onPress={() => {
//                   haptics.light();
//                   router.push('/(app)/trips');
//                 }}
//               >
//                 <View style={styles.actionLink}>
//                   <Typography variant="bodySm" weight="bold" color="primary">
//                     View All →
//                   </Typography>
//                 </View>
//               </InteractiveWrapper>
//             </View>

//             {/* Filter Tab Bar */}
//             <FilterTabBar active={filter} onChange={setFilter} />

//             {otherTrips.length > 0 ? (
//               <>
//                 <Grid cols={gridCols} gap={theme.spacing[4]}>
//                   {otherTrips.map((trip: any, index: number) => (
//                     <Animated.View
//                       key={trip._id}
//                       entering={FadeInDown.delay(index * 40).springify().damping(18)}
//                       layout={Layout.springify()}
//                       style={{ minWidth: 0 }}
//                     >
//                       <TripCard
//                         trip={trip}
//                         onPress={() => {
//                           haptics.light();
//                           router.push(`/(app)/trips/${trip._id}`);
//                         }}
//                       />
//                     </Animated.View>
//                   ))}
//                 </Grid>

//                 {hasNextPage && (
//                   <View style={styles.loadMore}>
//                     {isFetchingNextPage ? (
//                       <GlobalLoader variant="inline" size="small" color={theme.colors.primary} />
//                     ) : (
//                       <Button
//                         title="Load More Trips"
//                         variant="outline"
//                         size="md"
//                         onPress={() => {
//                           haptics.light();
//                           fetchNextPage();
//                         }}
//                       />
//                     )}
//                   </View>
//                 )}
//               </>
//             ) : trips.length === 0 ? (
//               <Animated.View entering={FadeInUp.delay(200).springify().damping(18)}>
//                 <EmptyState
//                   icon="✈️"
//                   title="No Trips Yet"
//                   description="Create your first trip and start splitting expenses with your travel buddies."
//                   actionLabel="Create New Trip"
//                   onAction={() => {
//                     haptics.light();
//                     router.push('/create-trip');
//                   }}
//                 />
//               </Animated.View>
//             ) : (
//               <Typography variant="body" color="textTertiary" align="center" style={{ paddingVertical: theme.spacing[8] }}>
//                 All trips shown in featured section above.
//               </Typography>
//             )}
//           </View>
//         </Container>
//       </ScrollView>

//       {/* Search Modal */}
//       <SearchFilterModal
//         visible={isSearchOpen}
//         onClose={() => setIsSearchOpen(false)}
//         filters={searchFilters}
//         onApply={setSearchFilters}
//       />
//     </View>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────

// function homeStyles(theme: Theme) {
//   return StyleSheet.create({
//     root: { flex: 1 },
//     scroll: { flex: 1 },
//     loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

//     header: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: theme.spacing[6],
//       width: '100%',
//       gap: theme.spacing[4],
//       paddingHorizontal: theme.spacing[1],
//     },
//     headerLeft: { flex: 1 },
//     headerRight: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },

//     sectionHeader: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'flex-end',
//       marginBottom: theme.spacing[3],
//       width: '100%',
//     },
//     actionLink: {
//       paddingVertical: theme.spacing[1],
//       paddingHorizontal: theme.spacing[2],
//       borderRadius: theme.borderRadius.md,
//     },

//     loadMore: {
//       paddingVertical: theme.spacing[8],
//       alignItems: 'center',
//     },
//   });
// }

// // ─── Bento Styles ────────────────────────────────────────────
// function bentoStyles(theme: Theme) {
//   return StyleSheet.create({
//     desktopRow: {
//       flexDirection: 'row',
//       alignItems: 'stretch',
//       width: '100%',
//     },
//     segment: {
//       flex: 1,
//       justifyContent: 'center',
//     },
//     divider: {
//       width: 1,
//       alignSelf: 'stretch',
//       backgroundColor: theme.colors.borderLight,
//       marginHorizontal: theme.spacing[4],
//     },
//   });
// }

// // ─── Tab Bar Styles ──────────────────────────────────────────
// function tabBarStyles(theme: Theme) {
//   return StyleSheet.create({
//     tabItem: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       gap: theme.spacing[1],
//       paddingVertical: theme.spacing[2],
//       paddingHorizontal: theme.spacing[3],
//       borderRadius: theme.borderRadius.lg,
//       minWidth: 80,
//     },
//     tabItemActive: {
//       backgroundColor: theme.colors.primary,
//       ...theme.shadows.sm,
//     },
//   });
// }

// // ─── Quick Actions Styles ────────────────────────────────────
// function quickStyles(theme: Theme) {
//   return StyleSheet.create({
//     item: {
//       alignItems: 'center',
//       justifyContent: 'center',
//       paddingVertical: theme.spacing[1],
//       gap: theme.spacing[1],
//     },
//     iconWrapper: {
//       width: 44,
//       height: 44,
//       borderRadius: theme.borderRadius.xl,
//       alignItems: 'center',
//       justifyContent: 'center',
//       overflow: 'hidden',
//       ...theme.shadows.sm,
//       borderWidth: 1,
//       borderColor: theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)',
//     },
//     iconInnerHighlight: {
//       position: 'absolute',
//       top: 0,
//       left: 0,
//       right: 0,
//       height: '50%',
//       backgroundColor: 'rgba(255,255,255,0.2)',
//     },
//   });
// }

// // ─── Notification Styles ─────────────────────────────────────
// function notifStyles(theme: Theme) {
//   return StyleSheet.create({
//     btn: {
//       width: 44,
//       height: 44,
//       borderRadius: theme.borderRadius.full,
//       alignItems: 'center',
//       justifyContent: 'center',
//       padding: 0,
//     },
//     badge: {
//       position: 'absolute',
//       top: -2,
//       right: -2,
//       minWidth: 20,
//       height: 20,
//       borderRadius: 10,
//       backgroundColor: theme.colors.danger,
//       alignItems: 'center',
//       justifyContent: 'center',
//       paddingHorizontal: 4,
//       borderWidth: 2,
//       borderColor: theme.colors.background,
//       ...theme.shadows.sm,
//     },
//   });
// }
