import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { BookingRequest, BookingStatus } from '../../types/local.types';
import { formatAmount } from '../../utils/formatters';

interface BookingCardProps {
  booking: BookingRequest;
  onPress: () => void;
  onCancel?: () => void;
  isVendor?: boolean;
}

export function BookingCard({
  booking,
  onPress,
  onCancel,
  isVendor = false,
}: BookingCardProps) {
  const theme = useTheme();

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge label="Requested" variant="warning" />;
      case 'ACCEPTED':
        return <Badge label="Accepted" variant="success" />;
      case 'DECLINED':
        return <Badge label="Declined" variant="danger" />;
      case 'CANCELLED':
        return <Badge label="Cancelled" variant="neutral" />;
      case 'EXPIRED':
        return <Badge label="Expired" variant="neutral" />;
      default:
        return <Badge label={status} variant="info" />;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.touchable}
    >
      <GlassCard variant="subtle" padding="md" style={styles.card}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Typography
              variant="body"
              weight="bold"
              numberOfLines={1}
              style={{ color: theme.colors.textPrimary }}
            >
              {booking.businessName || 'Local Business'}
            </Typography>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textTertiary, marginTop: 2 }}
            >
              Ref: #{booking.bookingReference}
            </Typography>
          </View>
          {getStatusBadge(booking.status)}
        </View>

        <View
          style={[
            styles.details,
            {
              backgroundColor: theme.colors.borderLight,
              borderRadius: theme.borderRadius.md,
            },
          ]}
        >
          <View style={styles.detailRow}>
            <AppIcon
              name="calendar"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Typography
              variant="caption"
              style={{ color: theme.colors.textSecondary, marginLeft: 6 }}
            >
              Date: {booking.bookingDate}
            </Typography>
          </View>
          {booking.serviceName && (
            <View style={[styles.detailRow, { marginTop: 4 }]}>
              <AppIcon
                name="tag"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Typography
                variant="caption"
                style={{ color: theme.colors.textSecondary, marginLeft: 6 }}
              >
                Service: {booking.serviceName}
              </Typography>
            </View>
          )}
          {booking.guestCount && (
            <View style={[styles.detailRow, { marginTop: 4 }]}>
              <AppIcon
                name="users"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Typography
                variant="caption"
                style={{ color: theme.colors.textSecondary, marginLeft: 6 }}
              >
                Guests: {booking.guestCount}
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View>
            <Typography
              variant="caption"
              style={{ color: theme.colors.textTertiary }}
            >
              Price Snapshot:
            </Typography>
            <Typography
              variant="body"
              weight="bold"
              style={{ color: theme.colors.primary }}
            >
              {formatAmount(booking.priceSnapshotMinor / 100, booking.currency)}
            </Typography>
          </View>

          {!isVendor && booking.status === 'REQUESTED' && onCancel && (
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                onCancel();
              }}
              style={[styles.cancelBtn, { borderColor: theme.colors.danger }]}
            >
              <Typography
                variant="caption"
                weight="semibold"
                style={{ color: theme.colors.danger }}
              >
                Cancel
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  details: {
    padding: 10,
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
