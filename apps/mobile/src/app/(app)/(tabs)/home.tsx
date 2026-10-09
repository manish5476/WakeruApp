import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
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
import { SponsoredTripCard } from '../../../components/ads/SponsoredTripCard';
import { AdMobBanner } from '../../../components/ads/AdMobBanner';
import { useAds } from '../../../hooks/useAds';
import { insertAdsIntoList, isAdItem } from '../../../utils/insertAdsIntoList';
import {
  SearchFilterModal,
  SearchFilters,
} from '../../../components/trips/SearchFilterModal';
import { FinanceStreakCard } from '../../../components/finance/FinanceStreakCard';
import AppIcon from '../../../components/common/AppIcon';
import { GlassCard } from '../../../components/ui/GlassCard';
import { TripTabs } from '../../../components/ui/TripTabs';
import { ContextualHint } from '../../../components/common/ContextualHint';
import { EmailVerificationBanner } from '../../../components/common/EmailVerificationBanner';
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
        {
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.10)'
            : 'rgba(0,0,0,0.07)',
        },
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16 }}
      contentContainerStyle={[
        bentoStyles(theme).actionsGrid,
        { paddingHorizontal: 16 },
      ]}
    >
      {QUICK_ACTIONS.map(action => (
        <GlassCard
          key={action.label}
          pressable
          onPress={() => {
            haptics.light();
            if ((action as any).action === 'openSearch') onOpenSearch();
            else router.push((action as any).route as any);
          }}
          style={bentoStyles(theme).actionCard}
          intensity={theme.isDark ? 18 : 12}
          padding="none"
        >
          <LinearGradient
            colors={action.gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={bentoStyles(theme).actionIconWrap}
          >
            <AppIcon name={action.icon as any} size={18} color="#FFFFFF" />
          </LinearGradient>
          <View
            style={[
              bentoStyles(theme).actionTextWrap,
              { backgroundColor: 'transparent' },
            ]}
          >
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
        </GlassCard>
      ))}
    </ScrollView>
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16 }}
      contentContainerStyle={[
        bentoStyles(theme).statsGrid,
        { paddingHorizontal: 16 },
      ]}
    >
      {statItems.map(item => (
        <GlassCard
          key={item.label}
          style={bentoStyles(theme).statTile}
          padding="none"
          softMode
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
        </GlassCard>
      ))}
    </ScrollView>
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
  const tabs = React.useMemo(
    () =>
      FILTERS.map(f => ({
        id: f.key ?? 'all',
        label: f.label,
        icon: f.icon,
      })),
    [],
  );

  return (
    <View style={{ marginBottom: 16 }}>
      <TripTabs
        tabs={tabs}
        activeTab={active ?? 'all'}
        onChange={(val: string) => onChange(val === 'all' ? undefined : val)}
        variant="segmented"
        size="sm"
        scrollable
      />
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
  const { isDesktop: isWideViewport } = useResponsive();
  const isDesktop = Platform.OS === 'web' && isWideViewport;

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
  const {
    isDesktop: isWideViewport,
    isMobile,
    width,
    isLandscape,
  } = useResponsive();
  // Native navigation retains the floating mobile tab bar in landscape.
  // Keep the page in its mobile composition until the web shell is active.
  const isDesktop = Platform.OS === 'web' && isWideViewport;
  const styles = homeStyles(theme);

  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchName: '',
    searchUser: '',
    dateRange: 'all',
  });

  const params = useLocalSearchParams<{
    searchName?: string;
    searchUser?: string;
    dateRange?: SearchFilters['dateRange'];
    status?: string;
    openSearch?: string;
  }>();

  useEffect(() => {
    if (params.openSearch === 'true') {
      setIsSearchOpen(true);
    }
    if (
      params.searchName ||
      params.searchUser ||
      params.dateRange ||
      params.status
    ) {
      setSearchFilters({
        searchName: params.searchName || '',
        searchUser: params.searchUser || '',
        dateRange: params.dateRange || 'all',
        status: params.status,
      });
      if (params.status) {
        setFilter(params.status === 'all' ? undefined : params.status);
      }
    }
  }, [
    params.openSearch,
    params.searchName,
    params.searchUser,
    params.dateRange,
    params.status,
  ]);

  const { user } = useAuthStore();
  const { data: latestTrip } = useLatestTrip();
  const tripFilters = useMemo(
    () => ({
      status: searchFilters.status || filter,
      includeArchived: (searchFilters.status || filter) === 'archived',
      searchName: searchFilters.searchName,
      searchUser: searchFilters.searchUser,
      dateRange: searchFilters.dateRange,
    }),
    [
      filter,
      searchFilters.status,
      searchFilters.searchName,
      searchFilters.searchUser,
      searchFilters.dateRange,
    ],
  );

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyTrips(tripFilters);
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

  const { isAdFree } = useAds();
  const greeting = getGreeting();
  const featuredTrip =
    latestTrip || (trips.length > 0 && !filter ? trips[0] : null);
  const otherTrips = trips.filter(t => t._id !== featuredTrip?._id);
  const otherTripsWithAds = useMemo(() => {
    return insertAdsIntoList(otherTrips, 3, isAdFree);
  }, [otherTrips, isAdFree]);

  const handleRefresh = useCallback(() => {
    haptics.light();
    refetch();
  }, [refetch]);

  const gridCols = isDesktop ? (width >= 1400 ? 3 : 2) : 1;

  if (isLoading && trips.length === 0) {
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
            paddingTop:
              Platform.OS === 'web'
                ? 20
                : isLandscape
                  ? insets.top + 4
                  : insets.top + 10,
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
          <EmailVerificationBanner />

          {/* ── TOP HEADER ──────────────────────────── */}
          <View style={[styles.header, isLandscape && styles.headerLandscape]}>
            <View style={styles.headerLeft}>
              {isLandscape ? (
                // Compact single-line greeting for landscape
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                >
                  <Text
                    style={[
                      styles.greetingNameCompact,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {firstName}
                  </Text>
                  <Text
                    style={[
                      styles.greetingSub,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {greeting.text} {greeting.emoji}
                  </Text>
                </View>
              ) : (
                <>
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
                </>
              )}
            </View>

            <View style={styles.headerRight}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  setIsSearchOpen(true);
                }}
                style={({ pressed }) => [
                  notifStyles(theme).btn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.10)'
                      : 'rgba(0,0,0,0.07)',
                  },
                  pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Search trips"
              >
                <AppIcon
                  name="search"
                  size={17}
                  color={theme.colors.textSecondary}
                />
              </Pressable>

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

          {/* ── CONTEXTUAL HINT (hidden in landscape to save vertical space) ── */}
          {!isLandscape && (
            <ContextualHint
              storageKey="trips_overview"
              icon="compass"
              title="Trips keep everything organized"
              message="Trips group your shared travel crew, split expenses, itinerary, and debt balances together."
            />
          )}

          {/* ── BENTO QUICK ACTIONS (4 TILES) ──────── */}
          <View style={styles.sectionBlock}>
            <BentoQuickActions onOpenSearch={() => setIsSearchOpen(true)} />
          </View>

          {/* ── BENTO TRAVEL METRICS (3 TILES) ─────── */}
          {trips.length > 0 && (
            <View style={styles.sectionBlock}>
              <BentoStatsCard stats={stats} tripsCount={trips.length} />
            </View>
          )}

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

            {/* Active search filter badge */}
            {(Boolean(searchFilters.searchName.trim()) ||
              Boolean(searchFilters.searchUser.trim()) ||
              searchFilters.dateRange !== 'all') && (
              <View
                style={[
                  styles.activeSearchBanner,
                  {
                    backgroundColor: `${theme.colors.primary}12`,
                    borderColor: `${theme.colors.primary}30`,
                  },
                ]}
              >
                <View style={styles.activeSearchBannerLeft}>
                  <AppIcon
                    name="filter"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.activeSearchBannerText,
                      { color: theme.colors.primary },
                    ]}
                    numberOfLines={1}
                  >
                    Active:{' '}
                    {[
                      searchFilters.searchName &&
                        `"${searchFilters.searchName}"`,
                      searchFilters.searchUser &&
                        `member: "${searchFilters.searchUser}"`,
                      searchFilters.dateRange !== 'all' &&
                        searchFilters.dateRange.replace('_', ' '),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setSearchFilters({
                      searchName: '',
                      searchUser: '',
                      dateRange: 'all',
                      status: undefined,
                    });
                  }}
                  hitSlop={8}
                >
                  <Text
                    style={[
                      styles.activeSearchBannerClear,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Reset
                  </Text>
                </Pressable>
              </View>
            )}

            {otherTrips.length > 0 ? (
              <>
                <Grid cols={gridCols} gap={14}>
                  {otherTripsWithAds.map((item: any, index: number) => {
                    if (isAdItem(item)) {
                      return (
                        <Animated.View
                          key={item.adId}
                          entering={FadeInDown.delay(index * 30)
                            .springify()
                            .damping(18)}
                          layout={Layout.springify()}
                          style={{ minWidth: 0, width: '100%' }}
                        >
                          <SponsoredTripCard />
                        </Animated.View>
                      );
                    }
                    return (
                      <Animated.View
                        key={item._id}
                        entering={FadeInDown.delay(index * 30)
                          .springify()
                          .damping(18)}
                        layout={Layout.springify()}
                        style={{ minWidth: 0 }}
                      >
                        <TripCard
                          trip={item}
                          onPress={() => {
                            haptics.light();
                            router.push(`/(app)/trips/${item._id}`);
                          }}
                        />
                      </Animated.View>
                    );
                  })}
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
                  title="No Trips Yet"
                  description="Your next adventure starts here. Create a new trip or join your travel crew with an invite code."
                  actionLabel="Create Trip"
                  onAction={() => {
                    haptics.light();
                    router.push('/create-trip');
                  }}
                  secondaryActionLabel="Join with Invite Code"
                  onSecondaryAction={() => {
                    haptics.light();
                    router.push('/(app)/trips/join');
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

            {/* AdMob Banner Slot for free users */}
            <AdMobBanner style={{ marginTop: 20, marginBottom: 8 }} />
          </View>
        </View>
      </ScrollView>

      {/* Search Modal */}
      <SearchFilterModal
        visible={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        filters={searchFilters}
        onApply={applied => {
          setSearchFilters(applied);
          if (applied.status !== undefined) {
            setFilter(applied.status === 'all' ? undefined : applied.status);
          }
        }}
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
    headerLandscape: {
      marginBottom: 10,
      alignItems: 'center',
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
    greetingNameCompact: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.5,
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
    activeSearchBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      marginTop: 10,
      marginBottom: 6,
    },
    activeSearchBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    activeSearchBannerText: {
      fontSize: 12.5,
      fontWeight: '600',
      flex: 1,
    },
    activeSearchBannerClear: {
      fontSize: 12.5,
      fontWeight: '700',
      marginLeft: 8,
    },
  });
}

function bentoStyles(theme: Theme) {
  return StyleSheet.create({
    // Quick Actions Bento (Horizontal Scroll)
    actionsGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    actionCard: {
      width: 155,
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
      gap: 10,
    },
    statTile: {
      width: 135,
      minWidth: 135,
      padding: 14,
      borderRadius: 18,
      // Keep these metrics as one calm, opaque surface on native. Stacking a
      // blur, tint, and white reflection made the center look like an inset.
      backgroundColor: theme.colors.elevated,
      borderWidth: 0,

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

          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
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
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
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
