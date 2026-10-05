import React, { forwardRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheet } from '../ui/BottomSheet';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import { useDashboard } from '../../hooks/useDashboard';
import { router } from 'expo-router';
import { format } from 'date-fns';

interface QuickAddBottomSheetProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const QuickAddBottomSheet = forwardRef<
  BottomSheetModal,
  QuickAddBottomSheetProps
>(({ onSuccess, onClose }, ref) => {
  const theme = useTheme();

  // Fetch active trips to display as options
  const { data: dashboard, isLoading } = useDashboard();

  // Active trips (not archived, not past if possible, or just recent)
  const activeTrips = dashboard?.activeTrips || [];

  const handleSelectTrip = (tripId: string) => {
    haptics.selection();
    // Dismiss the bottom sheet
    if (typeof ref === 'function') {
      // not possible here easily, but we can call onClose
    } else if (ref && ref.current) {
      ref.current.dismiss();
    }
    onClose?.();

    // Route to the actual trip's add-expense screen
    setTimeout(() => {
      router.push(`/(app)/trips/${tripId}/add-expense`);
    }, 100);
  };

  const handlePersonalExpense = () => {
    haptics.selection();
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.dismiss();
    }
    onClose?.();
    setTimeout(() => {
      router.push(`/(app)/(tabs)/finance`);
    }, 100);
  };

  return (
    <BottomSheet
      ref={ref}
      snapPoints={['60%']}
      onDismiss={() => {
        onClose?.();
      }}
      enablePanDownToClose
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Which Trip?
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Select a trip to add an expense
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : activeTrips.length === 0 ? (
            <View style={styles.emptyState}>
              <AppIcon name="map" size={40} color={theme.colors.textTertiary} />
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No active trips found.
              </Text>
            </View>
          ) : (
            activeTrips.map((trip: any) => (
              <Pressable
                key={trip._id}
                style={({ pressed }) => [
                  styles.tripRow,
                  { backgroundColor: theme.colors.surface },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => handleSelectTrip(trip._id)}
              >
                <View
                  style={[
                    styles.tripIconBox,
                    { backgroundColor: theme.colors.primaryBg },
                  ]}
                >
                  <Text style={{ fontSize: 24 }}>
                    {trip.stops?.[0]?.emoji || 'dY"O'}
                  </Text>
                </View>
                <View style={styles.tripInfo}>
                  <Text
                    style={[
                      styles.tripName,
                      { color: theme.colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {trip.title}
                  </Text>
                  <Text
                    style={[
                      styles.tripDate,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {trip.startDate
                      ? format(new Date(trip.startDate), 'MMM d, yyyy')
                      : 'Upcoming'}
                  </Text>
                </View>
                <AppIcon
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </Pressable>
            ))
          )}

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.borderLight },
            ]}
          />

          <Pressable
            style={({ pressed }) => [
              styles.personalRow,
              { backgroundColor: theme.colors.secondaryBg },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handlePersonalExpense}
          >
            <View
              style={[styles.tripIconBox, { backgroundColor: 'transparent' }]}
            >
              <AppIcon
                name="credit-card"
                size={24}
                color={theme.colors.secondary}
              />
            </View>
            <View style={styles.tripInfo}>
              <Text
                style={[styles.tripName, { color: theme.colors.textPrimary }]}
              >
                Personal Finance
              </Text>
              <Text
                style={[styles.tripDate, { color: theme.colors.textSecondary }]}
              >
                Add a regular bill or debt
              </Text>
            </View>
            <AppIcon
              name="chevron-right"
              size={20}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        </ScrollView>
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tripIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
    opacity: 0.5,
  },
  personalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
});
