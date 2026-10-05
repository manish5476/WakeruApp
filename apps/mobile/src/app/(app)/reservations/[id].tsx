import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { useTravelerReservationDetail } from '../../../hooks/useLocal';
import { formatAmount } from '../../../utils/formatters';

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { data: reservation, isLoading } = useTravelerReservationDetail(id);

  if (isLoading || !reservation) {
    return <GlobalLoader message="Loading reservation voucher..." />;
  }

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
              Confirmed Reservation
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary }}
            >
              Digital Check-in Voucher
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
          {/* Confirmed Banner */}
          <GlassCard variant="prominent" padding="md" style={styles.bannerCard}>
            <View style={styles.badgeRow}>
              <Badge label="✓ CONFIRMED" variant="verified" />
              <Typography
                variant="caption"
                style={{ color: theme.colors.textTertiary }}
              >
                Ref #
                {reservation.bookingReference || reservation.id.slice(0, 8)}
              </Typography>
            </View>
            <Typography
              variant="h3"
              weight="bold"
              style={{ color: theme.colors.textPrimary, marginTop: 10 }}
            >
              {reservation.businessName || 'Verified Experience'}
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary, marginTop: 2 }}
            >
              Present this voucher upon arrival for guaranteed check-in.
            </Typography>
          </GlassCard>

          {/* Details */}
          <GlassCard variant="subtle" padding="md" style={styles.card}>
            <Typography
              variant="body"
              weight="bold"
              style={{ color: theme.colors.textPrimary, marginBottom: 12 }}
            >
              Reservation Details
            </Typography>

            <View style={styles.row}>
              <Typography
                variant="caption"
                style={{ color: theme.colors.textSecondary }}
              >
                Date of Booking:
              </Typography>
              <Typography
                variant="caption"
                weight="bold"
                style={{ color: theme.colors.textPrimary }}
              >
                {reservation.bookingDate}
              </Typography>
            </View>

            {reservation.serviceName && (
              <View style={styles.row}>
                <Typography
                  variant="caption"
                  style={{ color: theme.colors.textSecondary }}
                >
                  Service / Plan:
                </Typography>
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {reservation.serviceName}
                </Typography>
              </View>
            )}

            <View style={styles.row}>
              <Typography
                variant="caption"
                style={{ color: theme.colors.textSecondary }}
              >
                Confirmed By Vendor:
              </Typography>
              <Typography
                variant="caption"
                style={{ color: theme.colors.textPrimary }}
              >
                {reservation.vendorConfirmedAt
                  ? new Date(reservation.vendorConfirmedAt).toLocaleDateString()
                  : 'Yes'}
              </Typography>
            </View>

            <View style={styles.row}>
              <Typography
                variant="caption"
                style={{ color: theme.colors.textSecondary }}
              >
                Amount Snapshot:
              </Typography>
              <Typography
                variant="body"
                weight="bold"
                style={{ color: theme.colors.primary }}
              >
                {formatAmount(
                  reservation.priceSnapshotMinor / 100,
                  reservation.currency,
                )}
              </Typography>
            </View>
          </GlassCard>

          {/* Action button: Write review if completed */}
          {reservation.status === 'COMPLETED' && (
            <Button
              title="Leave Verified Review"
              variant="primary"
              size="lg"
              onPress={() =>
                router.push(
                  `/(app)/explore/business/${reservation.businessId}` as any,
                )
              }
              style={{ marginTop: 12 }}
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
  bannerCard: {
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});
