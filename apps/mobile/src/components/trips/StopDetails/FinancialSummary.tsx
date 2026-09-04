// src/components/trips/StopDetails/FinancialSummary.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { GlassCard } from '../../ui';
import AppIcon from '../../common/AppIcon';
import { StopFinancialSummaryUI } from './PresentationModels';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  data: StopFinancialSummaryUI;
}

export function FinancialSummary({ data }: Props) {
  const theme = useTheme();
  const safeSpentPercentage =
    data.spentPercentage && !isNaN(data.spentPercentage)
      ? data.spentPercentage
      : 0;

  const renderCard = (
    index: number,
    title: string,
    value: string | number,
    subtext: string,
    icon: string,
    color: string,
    trend?: { direction: 'up' | 'down' | 'neutral'; text: string },
  ) => (
    <Animated.View
      key={title}
      entering={FadeInUp.delay(index * 80).duration(400)}
      style={styles.cardWrapper}
    >
      <GlassCard
        variant="prominent"
        style={styles.card}
        intensity={theme.isDark ? 35 : 55}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
              <AppIcon name={icon} size={15} color={color} />
            </View>
            <Text style={[styles.label, { color: theme.colors.textTertiary }]}>
              {title}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.value, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>

        <View style={styles.footerRow}>
          <Text
            style={[styles.subvalue, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtext}
          </Text>
          {trend && (
            <View
              style={[
                styles.trendPill,
                {
                  backgroundColor:
                    trend.direction === 'up'
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(16, 185, 129, 0.12)',
                },
              ]}
            >
              <AppIcon
                name={
                  trend.direction === 'up' ? 'trending-up' : 'trending-down'
                }
                size={11}
                color={
                  trend.direction === 'up'
                    ? theme.colors.danger
                    : theme.colors.success
                }
              />
              <Text
                style={[
                  styles.trendText,
                  {
                    color:
                      trend.direction === 'up'
                        ? theme.colors.danger
                        : theme.colors.success,
                  },
                ]}
              >
                {trend.text}
              </Text>
            </View>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {renderCard(
          0,
          'Total Spent',
          data.totalSpentFormatted,
          data.budgetFormatted !== 'No Budget'
            ? `of ${data.budgetFormatted}`
            : 'No budget set',
          'wallet',
          '#EA580C',
          data.spentPercentage > 0
            ? {
                direction: safeSpentPercentage > 100 ? 'up' : 'down',
                text: `${safeSpentPercentage.toFixed(0)}%`,
              }
            : undefined,
        )}
        {renderCard(
          1,
          'Avg Expense',
          data.averageExpenseFormatted,
          `${data.expenseCount} expenses`,
          'pie-chart',
          '#8B5CF6',
        )}
        {renderCard(
          2,
          'Members',
          data.memberCount,
          'in this stop',
          'users',
          '#3B82F6',
        )}
        {renderCard(
          3,
          'Settlements',
          data.pendingSettlementsCount,
          'pending',
          'refresh-cw',
          data.pendingSettlementsCount > 0 ? '#F59E0B' : '#10B981',
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
    minWidth: 160,
  },
  card: {
    padding: 16,
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
      } as any,

      default: {
        shadowColor: '#000',

        shadowOffset: {
          width: 0,
          height: 4,
        },

        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  } as any,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  subvalue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
