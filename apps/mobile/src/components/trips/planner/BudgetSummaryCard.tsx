import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { GlassCard } from '../../ui/GlassCard';
import AppIcon from '../../common/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCompactCurrency } from '../../../formatters/currency';

interface BudgetBreakdownItem {
  label: string;
  value: number;
  icon: string;
  color: string;
}

interface BudgetSummaryCardProps {
  total: number;
  spent: number;
  currency: string;
  breakdown: BudgetBreakdownItem[];
  onEdit?: () => void;
  onSetReminder?: () => void;
}

export function BudgetSummaryCard({
  total,
  spent,
  currency,
  breakdown,
  onEdit,
  onSetReminder,
}: BudgetSummaryCardProps) {
  const theme = useTheme();

  const utilization =
    total > 0 ? Math.min(Math.round((spent / total) * 100), 100) : 0;
  const isOverBudget = spent > total;
  const budgetColor = isOverBudget
    ? theme.colors.danger
    : utilization > 80
      ? theme.colors.warning
      : theme.colors.success;

  const filteredBreakdown = breakdown.filter(b => b.value > 0);

  return (
    <GlassCard style={styles.container} intensity={theme.isDark ? 10 : 80}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[styles.iconBox, { backgroundColor: budgetColor + '20' }]}
          >
            <AppIcon name="credit-card" size={16} color={budgetColor} />
          </View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Budget Overview
          </Text>
        </View>
        {onEdit && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {onSetReminder && (
              <Pressable
                onPress={onSetReminder}
                style={[
                  styles.editBtn,
                  { backgroundColor: theme.colors.warning + '15' },
                ]}
              >
                <AppIcon name="bell" size={12} color={theme.colors.warning} />
                <Text
                  style={[styles.editBtnText, { color: theme.colors.warning }]}
                >
                  Set Alert
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onEdit}
              style={[
                styles.editBtn,
                { backgroundColor: theme.colors.primaryLight + '15' },
              ]}
            >
              <AppIcon name="edit-2" size={12} color={theme.colors.primary} />
              <Text
                style={[styles.editBtnText, { color: theme.colors.primary }]}
              >
                Edit
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.amountsRow}>
        <View style={styles.amountCol}>
          <Text
            style={[styles.amountLabel, { color: theme.colors.textTertiary }]}
          >
            Total Budget
          </Text>
          <Text
            style={[styles.mainAmount, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {formatCompactCurrency(total)}
          </Text>
        </View>
        <View style={styles.amountColRight}>
          <Text
            style={[styles.spentLabel, { color: theme.colors.textSecondary }]}
          >
            Spent: {formatCompactCurrency(spent)}
          </Text>
          <View
            style={[styles.utilBadge, { backgroundColor: budgetColor + '20' }]}
          >
            <Text style={[styles.utilText, { color: budgetColor }]}>
              {utilization}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.barSection}>
        <View
          style={[
            styles.barTrack,
            { backgroundColor: theme.colors.borderLight },
          ]}
        >
          <View
            style={[
              styles.barFill,
              {
                backgroundColor: budgetColor,
                width: `${Math.min(utilization, 100)}%`,
              },
            ]}
          />
        </View>
        {isOverBudget && (
          <View
            style={[
              styles.alertBanner,
              {
                backgroundColor: theme.colors.danger + '15',
                borderColor: theme.colors.danger + '30',
              },
            ]}
          >
            <AppIcon
              name="alert-triangle"
              size={14}
              color={theme.colors.danger}
            />
            <Text style={[styles.alertText, { color: theme.colors.danger }]}>
              Budget exceeded!
            </Text>
          </View>
        )}
      </View>

      {filteredBreakdown.length > 0 && (
        <View style={styles.breakdownGrid}>
          {filteredBreakdown.map((item, i) => (
            <View
              key={i}
              style={[
                styles.breakdownItem,
                {
                  borderColor: theme.colors.borderLight,
                  backgroundColor: theme.colors.neutralBg + '50',
                },
              ]}
            >
              <View
                style={[
                  styles.breakdownIcon,
                  { backgroundColor: item.color + '15' },
                ]}
              >
                <AppIcon name={item.icon as any} size={12} color={item.color} />
              </View>
              <View style={styles.breakdownTextWrap}>
                <Text
                  style={[
                    styles.breakdownLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.breakdownValue,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {formatCompactCurrency(item.value)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  amountCol: {
    flex: 1,
  },
  amountColRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mainAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  spentLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  utilBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  utilText: {
    fontSize: 16,
    fontWeight: '800',
  },
  barSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
  },
  breakdownIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownTextWrap: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
