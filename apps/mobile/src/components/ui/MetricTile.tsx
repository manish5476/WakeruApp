// src/components/ui/MetricTile.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';
import { GlassCard } from './GlassCard';
import { InteractiveWrapper } from './InteractiveWrapper';

type MetricVariant = 'default' | 'success' | 'warning' | 'danger';

interface MetricTileProps {
  title: string;
  value: number;
  suffix?: string; // e.g. "countries", "trips"
  subtitle?: string;
  icon?: string;
  variant?: MetricVariant;
  onPress?: () => void;
}

/**
 * For plain counts (active trips, travel buddies, etc).
 * Use StatCard/AmountDisplay for actual currency values —
 * this exists specifically so counts don't render as "5.00".
 */
export function MetricTile({
  title,
  value,
  suffix,
  subtitle,
  icon,
  variant = 'default',
  onPress,
}: MetricTileProps) {
  const theme = useTheme();

  const variantColors: Record<
    MetricVariant,
    { border: string; iconBg: string; valueColor: any }
  > = {
    default: {
      border: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      iconBg: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      valueColor: 'textPrimary',
    },
    success: {
      border: theme.isDark ? 'rgba(63,143,106,0.2)' : 'rgba(63,143,106,0.15)',
      iconBg: theme.isDark ? 'rgba(63,143,106,0.15)' : 'rgba(63,143,106,0.1)',
      valueColor: 'success',
    },
    warning: {
      border: theme.isDark ? 'rgba(184,137,31,0.2)' : 'rgba(184,137,31,0.15)',
      iconBg: theme.isDark ? 'rgba(184,137,31,0.15)' : 'rgba(184,137,31,0.1)',
      valueColor: 'warning',
    },
    danger: {
      border: theme.isDark ? 'rgba(180,69,58,0.2)' : 'rgba(180,69,58,0.15)',
      iconBg: theme.isDark ? 'rgba(180,69,58,0.15)' : 'rgba(180,69,58,0.1)',
      valueColor: 'danger',
    },
  };

  const c = variantColors[variant] || variantColors.default;

  const content = (
    <GlassCard
      intensity={theme.isDark ? 40 : 50}
      style={[styles.card, { borderColor: c.border }]}
    >
      {/* Top block: header + value. Not flex — sits naturally at the top
          even when the card is stretched taller by a sibling (e.g. the
          Spending Streak card) in a flex row. */}
      <View>
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: c.iconBg }]}>
              <Typography variant="bodySm">{icon}</Typography>
            </View>
          )}
          <Typography
            variant="caption"
            weight="bold"
            color="textSecondary"
            style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            {title}
          </Typography>
        </View>

        <View style={[styles.valueRow, { marginTop: 10 }]}>
          <Typography
            variant="h1"
            weight="extrabold"
            color={c.valueColor}
            style={{ letterSpacing: -0.5 }}
          >
            {value}
          </Typography>
          {suffix && (
            <Typography
              variant="bodySm"
              weight="semibold"
              color="textTertiary"
              style={{ marginLeft: 6, marginBottom: 4 }}
            >
              {suffix}
            </Typography>
          )}
        </View>
      </View>

      {/* Bottom block: pushed down with marginTop: 'auto' so that when the
          card is stretched to match a taller sibling, this — not empty
          space — is what fills the gap. Always renders something, even
          without a subtitle, so the card never looks unfinished. */}
      <View style={[styles.footer, { marginTop: 'auto' }]}>
        <View style={[styles.footerRule, { backgroundColor: c.border }]} />
        <Typography
          variant="caption"
          color="textTertiary"
          style={{ marginTop: 8 }}
        >
          {subtitle || 'Up to date'}
        </Typography>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.wrapper}>
      {onPress ? (
        <InteractiveWrapper onPress={onPress} hoverElevation>
          {content}
        </InteractiveWrapper>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, minWidth: 130 },
  card: {
    flexGrow: 1,
    minHeight: 108,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  footer: { width: '100%' },
  footerRule: { height: 1, width: '100%', opacity: 0.8 },
});
