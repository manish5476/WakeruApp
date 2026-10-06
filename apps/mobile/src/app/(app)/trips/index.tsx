import AppIcon from '../../../components/common/AppIcon';
import React, { useState, useMemo } from 'react';
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
// Removed unused @expo/vector-icons

import { useTheme } from '../../../../src/providers/ThemeProvider';
import { useMyTrips } from '../../../../src/hooks';
import { ITrip } from '../../../../src/types/trip.types';
import { mapTripToCardUI } from '../../../../src/mappers/trip.mapper';
import { TripCardUI } from '../../../../src/mappers/trip.presentation';
import { haptics } from '../../../../src/utils/haptics';

import { GlassCard } from '../../../../src/components/ui/GlassCard';
import { Typography } from '../../../../src/components/ui/Typography';
import { GlobalBackground } from '../../../../src/components/ui/GlobalBackground';
import { TabBar } from '../../../../src/components/ui/TabBar';
import type { Theme } from '../../../../src/theme';

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
            source={{ uri: trip.coverImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Badges */}
          <View style={styles.heroTop}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    theme.colors[
                      trip.statusColorKey as keyof typeof theme.colors
                    ],
                },
              ]}
            >
              <Typography variant="caption" weight="bold" color="textSecondary">
                {trip.statusLabel}
              </Typography>
            </View>
            {trip.memberCount > 0 && (
              <View style={styles.memberBadge}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                >
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
              color="textSecondary"
              style={{ marginBottom: 4 }}
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
                color="textSecondary"
              >
                {trip.dateRange}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                •
              </Typography>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
              >
                {trip.duration}
              </Typography>
              {trip.stopCountLabel !== 'No Stops' && (
                <>
                  <Typography variant="caption" color="textSecondary">
                    •
                  </Typography>
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color="textSecondary"
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
              name="chevron-forward"
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
];

function FilterChips({
  activeFilter,
  setFilter,
}: {
  activeFilter: string;
  setFilter: (f: string) => void;
}) {
  const tabs = FILTERS.map(f => ({
    key: f.id,
    label: f.label,
  }));

  return (
    <View style={{ marginBottom: 12 }}>
      <TabBar
        tabs={tabs}
        activeKey={activeFilter}
        onTabChange={setFilter}
        variant="segmented"
        scrollable
        size="sm"
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
  const { width } = useWindowDimensions();

  const { data: rawData, isLoading, refetch, isFetching } = useMyTrips();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const cardWidth = isDesktop
    ? 360
    : isTablet
      ? (width - theme.spacing[8] * 2 - theme.spacing[4]) / 2
      : width - theme.spacing[4] * 2;

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <FlatList
          data={
            isLoading ? ([1, 2, 3] as unknown as TripCardUI[]) : filteredTrips
          }
          keyExtractor={(item, index) =>
            isLoading ? `skeleton-${index}` : (item as TripCardUI).id
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!isLoading ? <EmptyState /> : null}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          numColumns={isDesktop || isTablet ? 2 : 1}
          key={isDesktop || isTablet ? 'grid' : 'list'}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
          columnWrapperStyle={
            isDesktop || isTablet ? styles.columnWrapper : undefined
          }
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
      maxWidth: 1200,
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

    filterScroll: { gap: theme.spacing[2], paddingBottom: theme.spacing[2] },
    filterChip: {
      paddingHorizontal: theme.spacing[4],
      paddingVertical: 8,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      marginRight: theme.spacing[2],
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
    heroWrap: { width: '100%', height: 200, position: 'relative' },
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
