import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../providers/ThemeProvider';
import { Typography } from '../../../components/ui/Typography';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import AppIcon from '../../../components/common/AppIcon';
import { BusinessCard, CategoryFilterBar } from '../../../components/local';
import {
  useNearbyBusinesses,
  useDestinationBusinesses,
  useMasterDestinations,
} from '../../../hooks/useLocal';
import { BusinessCategory } from '../../../types/local.types';

export default function ExploreScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    BusinessCategory | undefined
  >();
  const [selectedCity, setSelectedCity] = useState<string>('Goa');

  // Default coordinate fallback: Goa coordinates (15.2993, 74.1240)
  const {
    data: nearbyBusinesses = [],
    isLoading: isLoadingNearby,
    refetch: refetchNearby,
  } = useNearbyBusinesses(15.2993, 74.124, 25, selectedCategory);

  const {
    data: destBusinesses = [],
    isLoading: isLoadingDest,
    refetch: refetchDest,
  } = useDestinationBusinesses(selectedCity, 'India', selectedCategory);

  const { data: destinations = [] } = useMasterDestinations();

  const isSearching = searchQuery.trim().length > 0;
  const displayBusinesses = isSearching
    ? nearbyBusinesses.filter(
        (b: any) =>
          b.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.city.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : nearbyBusinesses.length > 0
      ? nearbyBusinesses
      : destBusinesses;

  const onRefresh = () => {
    refetchNearby();
    refetchDest();
  };

  return (
    <GlobalBackground>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 16 : 8) },
        ]}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Typography
              variant="h2"
              weight="bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Explore Local
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary, marginTop: 2 }}
            >
              Verified stays, dining & activities around you
            </Typography>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/(app)/bookings' as any)}
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppIcon
                name="calendar"
                size={18}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(app)/explore/compare' as any)}
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppIcon
                name="columns"
                size={18}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppIcon
              name="search"
              size={18}
              color={theme.colors.textTertiary}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by hotel, cafe, activity, or city..."
              placeholderTextColor={theme.colors.textTertiary}
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            />
            {isSearching && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <AppIcon name="x" size={16} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter Chips */}
        <CategoryFilterBar
          selectedCategory={selectedCategory}
          onSelectCategory={cat => setSelectedCategory(cat as any)}
        />

        {/* Destination Selector quick bar */}
        {destinations.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destList}
          >
            {destinations.map((d: any) => {
              const isSelected =
                selectedCity.toLowerCase() === d.city.toLowerCase();
              return (
                <TouchableOpacity
                  key={d.city}
                  onPress={() => setSelectedCity(d.city)}
                  style={[
                    styles.destChip,
                    {
                      backgroundColor: isSelected
                        ? `${theme.colors.primary}15`
                        : 'transparent',
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.borderLight,
                    },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight={isSelected ? 'bold' : 'normal'}
                    style={{
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                    }}
                  >
                    📍 {d.city}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Business Feed */}
        <ScrollView
          style={styles.feed}
          contentContainerStyle={[
            styles.feedContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingNearby || isLoadingDest}
              onRefresh={onRefresh}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {displayBusinesses.length === 0 &&
          !(isLoadingNearby || isLoadingDest) ? (
            <EmptyState
              icon="search"
              title="No verified businesses found"
              description="Try changing your search term, destination, or category filter."
              actionLabel="Reset Filters"
              onAction={() => {
                setSelectedCategory(undefined);
                setSearchQuery('');
              }}
            />
          ) : (
            displayBusinesses.map((business: any) => (
              <BusinessCard
                key={business.id}
                business={business}
                onPress={() =>
                  router.push(`/(app)/explore/business/${business.id}` as any)
                }
              />
            ))
          )}
        </ScrollView>
      </View>
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  destList: {
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  destChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
