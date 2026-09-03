import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppIcon from '../../../components/common/AppIcon';
import { colors, radius, spacing } from '../theme/tokens';

interface StatBadgeProps {
  icon: string;
  value: string;
  label: string;
}

/**
 * Small glass "proof point" pill — one per onboarding screen, so every
 * step carries the same credibility signal the Welcome screen has
 * (e.g. "50K+ Active Travelers"), not just the first one.
 */
export default function StatBadge({ icon, value, label }: StatBadgeProps) {
  return (
    <View style={styles.pill}>
      <View style={styles.iconWrap}>
        <AppIcon name={icon} size={14} color={colors.travelCyan} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(6,182,212,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  value: { color: colors.textOnDark, fontSize: 14, fontWeight: '800' },
  label: { color: colors.textOnDarkFaint, fontSize: 12, fontWeight: '600' },
});
