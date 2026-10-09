import AppIcon from '../../../components/common/AppIcon';
import GlobalLoader from '../../../components/common/GlobalLoader';
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  RefreshControl,
  Platform,
  Pressable,
  useWindowDimensions,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../../providers/ThemeProvider';
import { useMyTrips } from '../../../hooks';
import { ITrip } from '../../../types/trip.types';
import { mapTripToCardUI } from '../../../mappers/trip.mapper';
import { TripCardUI } from '../../../mappers/trip.presentation';
import { haptics } from '../../../utils/haptics';
import { GUARANTEED_FALLBACK_COVER } from '../../../utils/tripImage';

import { GlassCard } from '../../../components/ui/GlassCard';
import { Typography } from '../../../components/ui/Typography';
import { TripTabs } from '../../../components/ui/TripTabs';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import type { Theme } from '../../../theme';

// ============================================================
// PREMIUM TRIP CARD
// ============================================================
function PremiumTripCard({
  trip,
  onPress,
  width,
}: {
  trip: TripCardUI;
  onPress: () => void;
  width: number;
}) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const isLive = trip.status === 'active';
  const [imgSrc, setImgSrc] = useState(
    trip.coverImage || GUARANTEED_FALLBACK_COVER,
  );

  useEffect(() => {
    setImgSrc(trip.coverImage || GUARANTEED_FALLBACK_COVER);
  }, [trip.coverImage]);

  return (
    <Pressable
      style={({ hovered, pressed }: any) => [
        { width, marginBottom: theme.spacing[6] },
        pressed && { transform: [{ scale: 0.97 }] },
        Platform.OS === 'web' && hovered && { transform: [{ translateY: -4 }] },
      ]}
      onPress={() => {
        haptics.light();
        onPress();
      }}
    >
      <GlassCard style={styles.tripCard} intensity={theme.isDark ? 15 : 40}>
        {/* Hero Image Section */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: imgSrc }}
            style={styles.heroImage}
            resizeMode="cover"
            onError={() => {
              if (imgSrc !== GUARANTEED_FALLBACK_COVER) {
                setImgSrc(GUARANTEED_FALLBACK_COVER);
              }
            }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            locations={[0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Badges */}
          <View style={styles.heroTop}>
            <View
              style={[
                styles.statusBadge,
                isLive
                  ? {
                      backgroundColor: theme.colors.success,
                      borderWidth: 1,
                      borderColor: '#059669',
                    }
                  : {
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
              ]}
            >
              <Typography variant="caption" weight="bold" color="textInverse">
                {trip.statusLabel}
              </Typography>
            </View>
            {trip.memberCount > 0 && (
              <View style={styles.memberBadge}>
                <Typography variant="caption" weight="bold" color="textInverse">
                  👤 {trip.memberCount}
                </Typography>
              </View>
            )}
          </View>

          {/* Bottom Metadata */}
          <View style={styles.heroBottom}>
            <Typography
              variant="h2"
              weight="bold"
              color="textInverse"
              style={{ marginBottom: 4 }}
              numberOfLines={1}
            >
              {trip.title}
            </Typography>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                opacity: 0.9,
              }}
            >
              <Typography
                variant="caption"
                weight="semibold"
                color="textInverse"
              >
                {trip.dateRange}
              </Typography>
              <Typography variant="caption" color="textInverse">
                •
              </Typography>
              <Typography
                variant="caption"
                weight="semibold"
                color="textInverse"
              >
                {trip.duration}
              </Typography>
              {trip.stopCountLabel !== 'No Stops' && (
                <>
                  <Typography variant="caption" color="textInverse">
                    •
                  </Typography>
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color="textInverse"
                  >
                    📍 {trip.stopCountLabel}
                  </Typography>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialWrap}>
          <View style={styles.financialRow}>
            <View style={{ flex: 1 }}>
              <Typography
                variant="caption"
                weight="bold"
                color="textTertiary"
                style={{ textTransform: 'uppercase', marginBottom: 2 }}
              >
                Spent
              </Typography>
              <Typography
                variant="body"
                weight="bold"
                color={trip.isOverBudget ? 'danger' : 'textPrimary'}
              >
                {trip.spentDisplay}{' '}
                <Typography variant="caption" color="textTertiary">
                  of {trip.budgetDisplay}
                </Typography>
              </Typography>
            </View>
            <AppIcon
              name="chevron-right"
              size={20}
              color={theme.colors.textTertiary}
            />
          </View>

          {/* Progress Bar */}
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.colors.borderLight },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${trip.progressValue}%`,
                  backgroundColor: trip.isOverBudget
                    ? theme.colors.danger
                    : theme.colors.primary,
                },
              ]}
            />
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

// ============================================================
// FILTER CHIPS
// ============================================================
const FILTERS = [
  { id: 'all', label: 'All Trips' },
  { id: 'active', label: 'Active' },
  { id: 'planning', label: 'Planning' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
];

function FilterChips({
  activeFilter,
  setFilter,
}: {
  activeFilter: string;
  setFilter: (f: string) => void;
}) {
  const tabs = React.useMemo(
    () => FILTERS.map(f => ({ id: f.id, label: f.label })),
    [],
  );

  return (
    <View style={{ paddingBottom: 8 }}>
      <TripTabs
        tabs={tabs}
        activeTab={activeFilter}
        onChange={setFilter}
        variant="segmented"
        size="sm"
        scrollable
      />
    </View>
  );
}

// ============================================================
// SEARCH BAR
// ============================================================
function SearchBar({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (q: string) => void;
}) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.searchWrap}>
      <AppIcon
        name="search"
        size={20}
        color={theme.colors.textTertiary}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.searchInput, { color: theme.colors.textPrimary }]}
        placeholder="Search trips..."
        placeholderTextColor={theme.colors.textTertiary}
        value={query}
        onChangeText={setQuery}
      />
      {query.length > 0 && (
        <Pressable onPress={() => setQuery('')} style={styles.searchClearBtn}>
          <AppIcon
            name="close-circle"
            size={18}
            color={theme.colors.textTertiary}
          />
        </Pressable>
      )}
    </View>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState() {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.emptyStateWrap}>
      <Typography variant="display" style={{ fontSize: 64, marginBottom: 16 }}>
        ✈️
      </Typography>
      <Typography
        variant="h2"
        weight="bold"
        color="textPrimary"
        style={{ marginBottom: 8 }}
      >
        No trips found
      </Typography>
      <Typography
        variant="bodySm"
        color="textSecondary"
        style={{ textAlign: 'center', marginBottom: 24, paddingHorizontal: 32 }}
      >
        Time to pack your bags! Create a new trip to start planning your next
        adventure.
      </Typography>
      <Pressable
        style={({ hovered }: any) => [
          styles.primaryBtn,
          { backgroundColor: theme.colors.primary },
          Platform.OS === 'web' && hovered && { opacity: 0.9 },
        ]}
        onPress={() => router.push('/(app)/create-trip' as any)}
      >
        <AppIcon name="add" size={18} color={theme.colors.textInverse} />
        <Typography variant="bodySm" weight="bold" color="textInverse">
          Create Trip
        </Typography>
      </Pressable>
    </View>
  );
}

// ============================================================
// SKELETON LOADER
// ============================================================
function SkeletonLoader({ width }: { width: number }) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={{ width, marginBottom: theme.spacing[6] }}>
      <GlassCard style={styles.tripCard} intensity={theme.isDark ? 5 : 20}>
        <View
          style={[
            styles.heroWrap,
            { backgroundColor: theme.colors.borderLight },
          ]}
        />
        <View style={styles.financialWrap}>
          <View
            style={{
              width: '40%',
              height: 16,
              backgroundColor: theme.colors.borderLight,
              borderRadius: 4,
              marginBottom: 12,
            }}
          />
          <View
            style={{
              width: '100%',
              height: 8,
              backgroundColor: theme.colors.borderLight,
              borderRadius: 4,
            }}
          />
        </View>
      </GlassCard>
    </View>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TripsListScreen() {
  const theme = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(windowWidth);

  useEffect(() => {
    setContainerWidth(windowWidth);
  }, [windowWidth]);

  const {
    data: rawData,
    isLoading,
    refetch,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMyTrips();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic responsive grid calculation
  const contentWidth = Math.min(containerWidth, 1600);
  const padding = theme.spacing[4] * 2; // 32px total horizontal padding
  const gap = theme.spacing[4]; // 16px gap between cards

  const numColumns = useMemo(() => {
    if (contentWidth >= 1440) return 4;
    if (contentWidth >= 1024) return 3;
    if (contentWidth >= 640) return 2;
    return 1;
  }, [contentWidth]);

  const cardWidth = useMemo(() => {
    const availableSpace = contentWidth - padding - (numColumns - 1) * gap;
    return Math.floor(availableSpace / numColumns);
  }, [contentWidth, padding, numColumns, gap]);

  // Process Data Layer -> Presentation Layer
  const tripsUI: TripCardUI[] = useMemo(() => {
    if (!rawData) return [];
    let trips: ITrip[] = [];

    if ((rawData as any).pages) {
      // Handle InfiniteQuery response
      (rawData as any).pages.forEach((page: any) => {
        if (page && Array.isArray(page.trips)) {
          trips.push(...page.trips);
        } else if (Array.isArray(page)) {
          trips.push(...page);
        }
      });
    } else if (Array.isArray(rawData)) {
      trips = rawData;
    } else if (rawData && typeof rawData === 'object') {
      const dataObj = (rawData as any).data || rawData;
      if (Array.isArray(dataObj)) {
        trips = dataObj;
      } else if (dataObj && Array.isArray(dataObj.trips)) {
        trips = dataObj.trips;
      }
    }

    return trips.map((t: ITrip) => mapTripToCardUI(t));
  }, [rawData]);

  // Apply Filters & Search
  const filteredTrips = useMemo(() => {
    let result = tripsUI;
    if (activeFilter !== 'all') {
      result = result.filter(t => t.status === activeFilter);
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q));
    }
    return result;
  }, [tripsUI, activeFilter, searchQuery]);

  const renderHeader = () => (
    <View style={styles.headerArea}>
      <View style={styles.headerTop}>
        <Typography variant="h1" weight="black" color="textPrimary">
          All Trips
        </Typography>
        <View style={styles.headerActions}>
          <Pressable
            style={({ hovered }: any) => [
              styles.iconBtn,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.03)',
              },
              Platform.OS === 'web' && hovered && { opacity: 0.8 },
            ]}
            onPress={() => router.push('/(app)/create-trip' as any)}
          >
            <AppIcon name="add" size={24} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>
      <SearchBar query={searchQuery} setQuery={setSearchQuery} />
      <FilterChips activeFilter={activeFilter} setFilter={setActiveFilter} />
    </View>
  );

  return (
    <GlobalBackground>
      <View
        style={[styles.container, { paddingTop: insets.top }]}
        onLayout={e => {
          const w = Math.floor(e.nativeEvent.layout.width);
          if (w > 0 && Math.abs(w - containerWidth) > 5) {
            setContainerWidth(w);
          }
        }}
      >
        <FlatList
          data={
            isLoading
              ? ([1, 2, 3, 4, 5, 6, 7, 8] as unknown as TripCardUI[])
              : filteredTrips
          }
          keyExtractor={(item, index) =>
            isLoading ? `skeleton-${index}` : (item as TripCardUI).id
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!isLoading ? <EmptyState /> : null}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <GlobalLoader
                  variant="inline"
                  size="small"
                  color={theme.colors.primary}
                />
              </View>
            ) : null
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          numColumns={numColumns}
          key={`trips-grid-${numColumns}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => {
            if (isLoading) {
              return <SkeletonLoader width={cardWidth} />;
            }
            const trip = item as TripCardUI;
            return (
              <PremiumTripCard
                trip={trip}
                width={cardWidth}
                onPress={() => router.push(`/(app)/trips/${trip.id}` as any)}
              />
            );
          }}
        />
      </View>
    </GlobalBackground>
  );
}

// ============================================================
// STYLES
// ============================================================
function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
      padding: theme.spacing[4],
      alignSelf: 'center',
      width: '100%',
      maxWidth: 1600,
    },
    columnWrapper: { gap: theme.spacing[4], justifyContent: 'flex-start' },

    headerArea: { marginBottom: theme.spacing[6] },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[4],
    },
    headerActions: { flexDirection: 'row', gap: theme.spacing[3] },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },

    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.03)',
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing[3],
      height: 48,
      marginBottom: theme.spacing[4],
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    searchIcon: { marginRight: theme.spacing[2] },
    searchInput: {
      flex: 1,
      fontSize: 16,
      height: '100%',
      outlineStyle: 'none',
    } as any,
    searchClearBtn: { padding: theme.spacing[1] },

    filterScroll: {
      gap: theme.spacing[2],
      paddingHorizontal: 2,
      paddingBottom: theme.spacing[2],
    },
    filterChip: {
      paddingHorizontal: theme.spacing[4],
      paddingVertical: 8,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
    },

    emptyStateWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing[12],
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
      paddingHorizontal: theme.spacing[6],
      paddingVertical: theme.spacing[3],
      borderRadius: theme.borderRadius.full,
    },

    tripCard: {
      padding: 0,
      borderRadius: theme.borderRadius['2xl'],
      overflow: 'hidden',
    },
    heroWrap: {
      width: '100%',
      height: 200,
      position: 'relative',
      backgroundColor: theme.isDark ? '#1E293B' : '#CBD5E1',
    },
    heroImage: { width: '100%', height: '100%' },
    heroTop: {
      position: 'absolute',
      top: theme.spacing[4],
      left: theme.spacing[4],
      right: theme.spacing[4],
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
    },
    memberBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    heroBottom: {
      position: 'absolute',
      bottom: theme.spacing[4],
      left: theme.spacing[4],
      right: theme.spacing[4],
    },

    financialWrap: { padding: theme.spacing[4] },
    financialRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[3],
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      width: '100%',
    },
    progressFill: { height: '100%', borderRadius: 3 },
  });
}
