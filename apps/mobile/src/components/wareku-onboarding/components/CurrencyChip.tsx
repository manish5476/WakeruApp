import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, currencyPalette, radius, spacing } from '../theme/tokens';

interface CurrencyChipProps {
  code: string; // 'AED' | 'INR' | ...
  compact?: boolean;
}

/**
 * Small currency badge — used inside expense cards to show which
 * currency a line item was originally paid in, before conversion.
 */
export default function CurrencyChip({
  code,
  compact = false,
}: CurrencyChipProps) {
  const tint = currencyPalette[code] ?? colors.oceanBlue;
  return (
    <View
      style={[
        styles.chip,
        compact && styles.compact,
        { backgroundColor: `${tint}1F`, borderColor: `${tint}55` },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <Text style={[styles.text, { color: tint }]}>{code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  compact: { paddingHorizontal: spacing.xs, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
});
