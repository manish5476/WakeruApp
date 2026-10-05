import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../providers/ThemeProvider';
import { Typography } from '../../../components/ui/Typography';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { EmptyState } from '../../../components/ui/EmptyState';
import AppIcon from '../../../components/common/AppIcon';
import { BookingCard } from '../../../components/local';
import {
  useTravelerBookings,
  useCancelBookingRequest,
} from '../../../hooks/useLocal';
import { BookingStatus } from '../../../types/local.types';

export default function TravelerBookingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cancelBookingMutation = useCancelBookingRequest();

  const [activeTab, setActiveTab] = useState<
    'ALL' | 'REQUESTED' | 'ACCEPTED' | 'CANCELLED'
  >('ALL');

  const { data: bookings = [], isLoading, refetch } = useTravelerBookings();

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBookingMutation.mutateAsync(bookingId);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel booking.');
            }
          },
        },
      ],
    );
  };

  return (
    <GlobalBackground>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 16 : 8) },
        ]}
      >
        {/* Header */}
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
              My Bookings
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary }}
            >
              Requests, confirmed stays, activities & reservations
            </Typography>
          </View>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabsRow}>
          {(['ALL', 'REQUESTED', 'ACCEPTED', 'CANCELLED'] as const).map(tab => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
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
                      ? theme.colors.textInverse
                      : theme.colors.textSecondary,
                  }}
                >
                  {tab === 'ALL'
                    ? 'All'
                    : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Booking List */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredBookings.length === 0 && !isLoading ? (
            <EmptyState
              icon="calendar"
              title="No bookings in this category"
              description="Explore verified hotels, homestays, and activities to request a reservation."
              actionLabel="Discover Local Places"
              onAction={() => router.push('/(app)/explore' as any)}
            />
          ) : (
            filteredBookings.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                onPress={() => router.push(`/(app)/bookings/${b.id}` as any)}
                onCancel={() => handleCancel(b.id)}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
});
