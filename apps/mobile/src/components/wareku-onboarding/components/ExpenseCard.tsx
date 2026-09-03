import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppIcon from '../../common/AppIcon';
import CurrencyChip from './CurrencyChip';
import { colors, radius, spacing, shadow } from '../theme/tokens';

interface LineItem {
  label: string;
  icon: string;
  amount: string;
  currency: string;
}

interface ExpenseCardProps {
  stopName: string;
  items: LineItem[];
  convertedTotal: string;
  convertedCurrency: string;
}

/**
 * Fintech-grade expense breakdown card — one destination's spend,
 * itemized by category, with a single converted balance up top.
 * Visual target: Revolut spending screen.
 */
export default function ExpenseCard({
  stopName,
  items,
  convertedTotal,
  convertedCurrency,
}: ExpenseCardProps) {
  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{stopName.toUpperCase()} STOP</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalCurrency}>{convertedCurrency}</Text>
            <Text style={styles.totalAmount}>{convertedTotal}</Text>
          </View>
        </View>
        <View style={styles.trendBadge}>
          <AppIcon name="trending-up" size={12} color={colors.emerald} />
          <Text style={styles.trendText}>Live rate</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {items.map(item => (
        <View key={item.label} style={styles.itemRow}>
          <View style={styles.itemIconWrap}>
            <AppIcon name={item.icon} size={16} color={colors.travelCyan} />
          </View>
          <Text style={styles.itemLabel}>{item.label}</Text>
          <View style={styles.itemRight}>
            <Text style={styles.itemAmount}>{item.amount}</Text>
            <CurrencyChip code={item.currency} compact />
          </View>
        </View>
      ))}

      {/* Mini spending bar chart */}
      <View style={styles.chartRow}>
        {items.map((item, i) => (
          <View
            key={item.label}
            style={[
              styles.chartBar,
              {
                flex: parseFloat(item.amount.replace(/[^0-9.]/g, '')) || 1,
                backgroundColor:
                  i === 0
                    ? colors.oceanBlue
                    : i === 1
                      ? colors.travelCyan
                      : colors.emerald,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.textOnDarkFaint,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalCurrency: {
    color: colors.textOnDarkMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  totalAmount: { color: colors.textOnDark, fontSize: 30, fontWeight: '900' },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  trendText: { color: colors.emerald, fontSize: 10, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: spacing.sm,
  },
  itemIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(6,182,212,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    color: colors.textOnDark,
    fontSize: 14,
    fontWeight: '600',
  },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemAmount: { color: colors.textOnDark, fontSize: 13, fontWeight: '700' },
  chartRow: { flexDirection: 'row', gap: 4, marginTop: spacing.md, height: 6 },
  chartBar: { height: 6, borderRadius: 3, minWidth: 8 },
});
