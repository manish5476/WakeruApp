import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import AppIcon from '../common/AppIcon';
import { BusinessCard, CategoryFilterBar } from '../local';
import { useDestinationBusinesses } from '../../hooks/useLocal';
import { BusinessCategory } from '../../types/local.types';

interface TripLocalTabProps {
  tripId: string;
  destinationCity?: string;
}

export function TripLocalTab({
  tripId,
  destinationCity = 'Goa',
}: TripLocalTabProps) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<
    BusinessCategory | undefined
  >();

  const { data: businesses = [], isLoading } = useDestinationBusinesses(
    destinationCity,
    'India',
    selectedCategory,
  );

  return (
    <View style={styles.container}>
      {/* Destination Hero Banner */}
      <GlassCard variant="prominent" padding="md" style={styles.banner}>
        <View style={styles.bannerRow}>
          <View style={{ flex: 1 }}>
            <Typography
              variant="caption"
              weight="bold"
              style={{ color: theme.colors.primary }}
            >
              LOCAL DISCOVERY
            </Typography>
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: theme.colors.textPrimary, marginTop: 2 }}
            >
              Explore {destinationCity}
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary, marginTop: 2 }}
            >
              Verified stays, dining, cabs & rentals for your trip itinerary
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(app)/explore' as any)}
            style={[
              styles.allPlacesBtn,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Typography
              variant="caption"
              weight="bold"
              style={{ color: theme.colors.textInverse }}
            >
              All Places
            </Typography>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Category Filter */}
      <CategoryFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={cat => setSelectedCategory(cat as any)}
      />

      {/* Businesses for this destination */}
      <View style={styles.list}>
        {businesses.length === 0 && !isLoading ? (
          <EmptyState
            icon="compass"
            title={`No verified places in ${destinationCity} yet`}
            description="Browse all popular destinations or switch categories."
            actionLabel="Open Explore Directory"
            onAction={() => router.push('/(app)/explore' as any)}
          />
        ) : (
          businesses.map((b: any) => (
            <BusinessCard
              key={b.id}
              business={b}
              onPress={() =>
                router.push(`/(app)/explore/business/${b.id}` as any)
              }
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  banner: {
    borderRadius: 16,
    marginBottom: 8,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  allPlacesBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  list: {
    paddingTop: 8,
  },
});
