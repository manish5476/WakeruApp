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

      {/* Rectangular KPI Cards Strip */}
      <View style={styles.kpiStrip}>
        <View
          style={[
            styles.kpiTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <AppIcon name="wallet" size={13} color="#2563EB" />
            </View>
            <View
              style={[
                styles.kpiBadgePill,
                { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
              ]}
            >
              <Text style={[styles.kpiBadgeText, { color: '#2563EB' }]}>
                BUDGET
              </Text>
            </View>
          </View>
          <Text
            style={[styles.kpiValue, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {formatCompactCurrency(total)}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.colors.textTertiary }]}>
            Trip limit
          </Text>
        </View>

        <View
          style={[
            styles.kpiTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <AppIcon name="credit-card" size={13} color="#EF4444" />
            </View>
            <View
              style={[
                styles.kpiBadgePill,
                { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
              ]}
            >
              <Text style={[styles.kpiBadgeText, { color: '#EF4444' }]}>
                SPENT
              </Text>
            </View>
          </View>
          <Text
            style={[styles.kpiValue, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {formatCompactCurrency(spent)}
          </Text>
          <Text style={[styles.kpiSub, { color: theme.colors.textTertiary }]}>
            {utilization}% utilized
          </Text>
        </View>

        <View
          style={[
            styles.kpiTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={styles.kpiHeaderRow}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <AppIcon name="pie-chart" size={13} color="#10B981" />
            </View>
            <View
              style={[
                styles.kpiBadgePill,
                { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
              ]}
            >
              <Text style={[styles.kpiBadgeText, { color: '#10B981' }]}>
                REMAINING
              </Text>
            </View>
          </View>
          <Text
            style={[styles.kpiValue, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {formatCompactCurrency(Math.max(total - spent, 0))}
          </Text>
          <Text
            style={[
              styles.kpiSub,
              {
                color: isOverBudget
                  ? theme.colors.danger
                  : theme.colors.textTertiary,
              },
            ]}
          >
            {isOverBudget ? 'Over budget' : 'Remaining'}
          </Text>
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
  kpiStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  kpiTile: {
    flex: 1,
    minHeight: 78,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  kpiIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBadgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  kpiBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  kpiSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
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
