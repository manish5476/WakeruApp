import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../providers/ThemeProvider';
import { Typography } from '../../../components/ui/Typography';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import {
  useTravelerBookingDetail,
  useCancelBookingRequest,
} from '../../../hooks/useLocal';
import { formatAmount } from '../../../utils/formatters';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cancelMutation = useCancelBookingRequest();

  const { data: booking, isLoading } = useTravelerBookingDetail(id);

  if (isLoading || !booking) {
    return <GlobalLoader message="Loading booking details..." />;
  }

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(booking.id);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel.');
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
              Booking Request
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary }}
            >
              Ref: #{booking.bookingReference}
            </Typography>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <GlassCard variant="subtle" padding="md" style={styles.card}>
            <View style={styles.rowBetween}>
              <Typography
                variant="body"
                weight="bold"
                style={{ color: theme.colors.textPrimary }}
              >
                Current Status
              </Typography>
              <Badge
                label={booking.status}
                variant={
                  booking.status === 'ACCEPTED'
                    ? 'success'
                    : booking.status === 'REQUESTED'
                      ? 'warning'
                      : 'danger'
                }
              />
            </View>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textTertiary, marginTop: 6 }}
            >
              {booking.status === 'REQUESTED'
                ? 'Your request is with the vendor. You will be notified once accepted.'
                : booking.status === 'ACCEPTED'
                  ? 'Your booking is accepted! You may check in on the reserved date.'
                  : 'This booking request is no longer active.'}
            </Typography>
          </GlassCard>

          {/* Details */}
          <GlassCard variant="subtle" padding="md" style={styles.card}>
            <Typography
              variant="body"
              weight="bold"
              style={{ color: theme.colors.textPrimary, marginBottom: 12 }}
            >
              Booking Overview
            </Typography>

            <View style={styles.detailRow}>
              <Typography
                variant="caption"
                style={{ color: theme.colors.textSecondary }}
              >
                Business:
              </Typography>
              <Typography
                variant="caption"
                weight="bold"
                style={{ color: theme.colors.textPrimary }}
              >
                {booking.businessName || 'Local Business'}
              </Typography>
            </View>

            <View style={styles.detailRow}>
              <Typography
                variant="caption"
                style={{ color: theme.colors.textSecondary }}
              >
                Date:
              </Typography>
              <Typography
                variant="caption"
                weight="bold"
                style={{ color: theme.colors.textPrimary }}
              >
                {booking.bookingDate}
              </Typography>
            </View>

            {booking.serviceName && (
              <View style={styles.detailRow}>
                <Typography
                  variant="caption"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Service / Unit:
                </Typography>
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {booking.serviceName}
                </Typography>
              </View>
            )}

            {booking.guestCount && (
              <View style={styles.detailRow}>
                <Typography
                  variant="caption"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Guests:
                </Typography>
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {booking.guestCount}
                </Typography>
              </View>
            )}

            {booking.notes && (
              <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                <Typography
                  variant="caption"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Notes:
                </Typography>
                <Typography
                  variant="caption"
                  style={{
                    color: theme.colors.textPrimary,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {booking.notes}
                </Typography>
              </View>
            )}
          </GlassCard>

          {/* Price Snapshot */}
          <GlassCard variant="prominent" padding="md" style={styles.card}>
            <View style={styles.rowBetween}>
              <Typography
                variant="body"
                style={{ color: theme.colors.textSecondary }}
              >
                Immutable Price Snapshot:
              </Typography>
              <Typography
                variant="h3"
                weight="bold"
                style={{ color: theme.colors.primary }}
              >
                {formatAmount(
                  booking.priceSnapshotMinor / 100,
                  booking.currency,
                )}
              </Typography>
            </View>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textTertiary, marginTop: 4 }}
            >
              * Fixed rate confirmed during request generation.
            </Typography>
          </GlassCard>

          {/* Cancel button if pending */}
          {booking.status === 'REQUESTED' && (
            <Button
              title="Cancel Booking Request"
              variant="danger"
              size="lg"
              loading={cancelMutation.isPending}
              onPress={handleCancel}
              style={{ marginTop: 8 }}
            />
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
  content: {
    flex: 1,
  },
  scrollBody: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});
