// src/components/ui/StatCard.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from './GlassCard';
import { InteractiveWrapper } from './InteractiveWrapper';
import AppIcon from '../common/AppIcon';

interface StatCardProps {
  title: string;
  amount: number | string;
  currency?: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  icon?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  onPress?: () => void;
  style?: ViewStyle;
}

const VARIANT_CONFIG = {
  default: {
    color: '#3B82F6',
    iconBg: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
    cardBorder: 'rgba(59, 130, 246, 0.18)',
  },
  success: {
    color: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    cardBorder: 'rgba(16, 185, 129, 0.18)',
  },
  warning: {
    color: '#F59E0B',
    iconBg: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    cardBorder: 'rgba(245, 158, 11, 0.18)',
  },
  danger: {
    color: '#EF4444',
    iconBg: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    cardBorder: 'rgba(239, 68, 68, 0.18)',
  },
};

function formatStatAmount(amount: number | string, currency?: string): string {
  if (typeof amount === 'string') return amount;
  const num = Number(amount) || 0;
  const isWhole = num % 1 === 0;
  const formatted = isWhole
    ? num.toLocaleString('en-IN')
    : num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  if (currency === 'INR' || currency === '₹' || currency === '\u20B9') {
    return `\u20B9${formatted}`;
  }
  if (currency && currency.trim().length > 0) {
    return `${currency} ${formatted}`;
  }
  return formatted;
}

export function StatCard({
  title,
  amount,
  currency = 'INR',
  subtitle,
  trend,
  icon = 'wallet',
  variant = 'default',
  onPress,
  style,
}: StatCardProps) {
  const theme = useTheme();
  const meta = VARIANT_CONFIG[variant] || VARIANT_CONFIG.default;
  const displayValue = formatStatAmount(amount, currency);

  // Value text color
  let valueColor = theme.colors.textPrimary;
  if (variant === 'danger' && Number(amount) > 0) valueColor = '#EF4444';
  else if (variant === 'success' && Number(amount) > 0) valueColor = '#10B981';
  else if (variant === 'warning' && Number(amount) > 0) valueColor = '#F59E0B';

  const cardContent = (
    <GlassCard
      variant="prominent"
      padding="none"
      style={[
        styles.card,
        {
          borderColor: theme.isDark ? meta.cardBorder : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
      intensity={theme.isDark ? 30 : 60}
    >
      <View style={styles.inner}>
        {/* Header Row: Icon Bubble + Title */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: meta.iconBg, borderColor: meta.borderColor },
            ]}
          >
            <AppIcon name={icon as any} size={15} color={meta.color} />
          </View>
          <Text
            style={[styles.title, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {title.toUpperCase()}
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.amountWrap}>
          <Text
            style={[styles.amount, { color: valueColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {displayValue}
          </Text>
        </View>

        {/* Footer: Subtitle / Trend */}
        <View style={styles.footer}>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: theme.colors.textTertiary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : trend ? (
            <Text
              style={[
                styles.trendText,
                { color: trend.isPositive ? '#10B981' : '#EF4444' },
              ]}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Text>
          ) : (
            <Text
              style={[styles.subtitle, { color: theme.colors.textTertiary }]}
            >
              {' '}
            </Text>
          )}
        </View>
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.wrapper, style]}>
      {onPress ? (
        <InteractiveWrapper onPress={onPress} hoverElevation>
          {cardContent}
        </InteractiveWrapper>
      ) : (
        cardContent
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flex: 1,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 116,
  },
  inner: {
    padding: 14,
    height: '100%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    flex: 1,
  },
  amountWrap: {
    justifyContent: 'center',
    marginVertical: 4,
  },
  amount: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
