// src/components/settlements/SettlementCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { AmountDisplay } from '../ui/AmountDisplay';
import { Avatar } from '../ui/Avatar';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { InteractiveWrapper } from './InteractiveWrapper';

// --- RESTORED INTERFACES ---
type SettlementStatus = 'pending' | 'initiated' | 'confirmed' | 'disputed';

interface SettlementCardProps {
  transaction: {
    from: string;
    fromName: string;
    to: string;
    toName: string;
    amountBase: number;
    baseCurrency: string;
    status: SettlementStatus;
    upiDeepLink?: string;
  };
  onPress: () => void;
}
// ---------------------------

const STATUS_CONFIG: Record<
  SettlementStatus,
  { label: string; variant: 'warning' | 'info' | 'success' | 'danger' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  initiated: { label: 'Initiated', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  disputed: { label: 'Disputed', variant: 'danger' },
};

export function SettlementCard({ transaction, onPress }: SettlementCardProps) {
  const theme = useTheme();
  const statusConfig = STATUS_CONFIG[transaction.status];
  const hasUPI = !!transaction.upiDeepLink;

  return (
    <InteractiveWrapper onPress={onPress} hoverElevation>
      <GlassCard intensity={theme.isDark ? 20 : 30} style={styles.card}>
        <View style={styles.userSection}>
          <Avatar fallback={transaction.fromName.charAt(0)} size="md" />
          <View style={styles.userInfo}>
            <Typography
              variant="bodySm"
              weight="semibold"
              color="textPrimary"
              numberOfLines={1}
            >
              {transaction.fromName}
            </Typography>
            <Typography variant="caption" color="textTertiary">
              owes
            </Typography>
          </View>
        </View>

        <View style={styles.amountSection}>
          <View style={styles.arrowContainer}>
            <View
              style={[
                styles.arrowLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
            <Typography
              variant="bodySm"
              style={{ color: theme.colors.textTertiary }}
            >
              →
            </Typography>
            <View
              style={[
                styles.arrowLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>
          <AmountDisplay
            amount={transaction.amountBase}
            currency={transaction.baseCurrency}
            size="sm"
            compact
          />
        </View>

        <View style={styles.userSection}>
          <Avatar fallback={transaction.toName.charAt(0)} size="md" />
          <View style={styles.userInfo}>
            <Typography
              variant="bodySm"
              weight="semibold"
              color="textPrimary"
              numberOfLines={1}
            >
              {transaction.toName}
            </Typography>
          </View>
        </View>

        <View style={styles.actionSection}>
          <Badge label={statusConfig.label} variant={statusConfig.variant} />
          {hasUPI && transaction.status === 'pending' && (
            <View
              style={[
                styles.upiBadge,
                { backgroundColor: `${theme.colors.success}15` },
              ]}
            >
              <Typography variant="caption" weight="bold" color="success">
                UPI
              </Typography>
            </View>
          )}
        </View>
      </GlassCard>
    </InteractiveWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  userSection: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  userInfo: { gap: 1, flex: 1 },
  amountSection: { alignItems: 'center', gap: 2, minWidth: 80 },
  arrowContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrowLine: { width: 16, height: 1 },
  actionSection: { alignItems: 'flex-end', gap: 6 },
  upiBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});
