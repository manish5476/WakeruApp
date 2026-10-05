import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../providers/ThemeProvider';
import { Typography } from '../../../components/ui/Typography';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import AppIcon from '../../../components/common/AppIcon';
import { useCompareBusinesses } from '../../../hooks/useLocal';
import { formatAmount } from '../../../utils/formatters';

export default function CompareScreen() {
  const params = useLocalSearchParams<{ ids?: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [idsInput, setIdsInput] = useState(params.ids || '');
  const { data: businesses = [], isLoading } = useCompareBusinesses(idsInput);

  return (
    <GlobalBackground>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 16 : 8) },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <AppIcon
              name="arrow-left"
              size={20}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Typography
              variant="h2"
              weight="bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Compare Options
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary }}
            >
              Objective side-by-side amenity & pricing comparison
            </Typography>
          </View>
        </View>

        {businesses.length === 0 && !isLoading ? (
          <View style={{ padding: 16 }}>
            <EmptyState
              icon="columns"
              title="No businesses selected for comparison"
              description="Browse the Explore directory and add businesses to compare."
              actionLabel="Browse Stays & Activities"
              onAction={() => router.push('/(app)/explore' as any)}
            />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.compareDeck}
          >
            {businesses.map((b: any) => (
              <GlassCard
                key={b.id}
                variant="subtle"
                padding="md"
                style={styles.compareCard}
              >
                <View style={styles.cardHeader}>
                  <Badge label={b.category} variant="primary" />
                  {b.verificationStatus === 'VERIFIED' && (
                    <Badge label="✓ Verified" variant="verified" />
                  )}
                </View>

                <Typography
                  variant="h3"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary, marginTop: 8 }}
                  numberOfLines={2}
                >
                  {b.businessName}
                </Typography>

                <Typography
                  variant="caption"
                  style={{ color: theme.colors.textSecondary, marginTop: 2 }}
                >
                  📍 {b.city}, {b.country}
                </Typography>

                {/* Rating */}
                <View style={[styles.statRow, { marginTop: 12 }]}>
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Rating:
                  </Typography>
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: '#F59E0B' }}
                  >
                    ★ {b.rating ? b.rating.toFixed(1) : 'New'} (
                    {b.reviewCount || 0})
                  </Typography>
                </View>

                {/* Price */}
                <View style={styles.statRow}>
                  <Typography
                    variant="caption"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    Price:
                  </Typography>
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: theme.colors.primary }}
                  >
                    {b.priceMinor
                      ? formatAmount(b.priceMinor / 100, b.currency || 'INR')
                      : 'On request'}
                  </Typography>
                </View>

                {/* Distance */}
                {b.distanceKm !== undefined && (
                  <View style={styles.statRow}>
                    <Typography
                      variant="caption"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      Distance:
                    </Typography>
                    <Typography
                      variant="caption"
                      style={{ color: theme.colors.textPrimary }}
                    >
                      {b.distanceKm.toFixed(1)} km
                    </Typography>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(app)/explore/business/${b.id}` as any)
                  }
                  style={[
                    styles.viewBtn,
                    { backgroundColor: theme.colors.primary, marginTop: 16 },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: theme.colors.textInverse }}
                  >
                    View Listing
                  </Typography>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </ScrollView>
        )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  compareDeck: {
    paddingHorizontal: 16,
    gap: 12,
  },
  compareCard: {
    width: 250,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  viewBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
});
