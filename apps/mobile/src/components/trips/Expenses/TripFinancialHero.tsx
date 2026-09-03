// src/components/trips/Expenses/TripFinancialHero.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../ui/GlassCard';
import { useTheme } from '../../../providers/ThemeProvider';
import { FinancialHeroUI } from './PresentationModels';
import AppIcon from '../../common/AppIcon';

interface TripFinancialHeroProps {
  hero: FinancialHeroUI;
}

export function TripFinancialHero({ hero }: TripFinancialHeroProps) {
  const theme = useTheme();
  const styles = useStyles();

  const isPositive = hero.balanceStatus === 'positive';
  const isNegative = hero.balanceStatus === 'negative';

  const balanceColor = isPositive
    ? theme.colors.success
    : isNegative
      ? theme.colors.danger
      : theme.colors.textPrimary;
  const balanceIcon = isPositive
    ? 'arrow-up-right'
    : isNegative
      ? 'arrow-down-left'
      : 'minus';

  return (
    <Animated.View entering={FadeInDown.duration(600).springify()}>
      <GlassCard style={styles.container} intensity={theme.isDark ? 20 : 15}>
        {/* Top Section: Net Balance */}
        <View style={styles.topSection}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Net Balance
          </Text>
          <View style={styles.balanceWrapper}>
            <Text style={[styles.balanceAmount, { color: balanceColor }]}>
              {hero.formattedNetBalance}
            </Text>
            <View
              style={[
                styles.trendBadge,
                { backgroundColor: `${balanceColor}15` },
              ]}
            >
              <AppIcon name={balanceIcon} size={14} color={balanceColor} />
              <Text style={[styles.trendText, { color: balanceColor }]}>
                {isPositive
                  ? 'You are owed'
                  : isNegative
                    ? 'You owe'
                    : 'Settled up'}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.divider,
            { backgroundColor: theme.colors.borderLight },
          ]}
        />

        {/* Bottom Section: KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <View
              style={[
                styles.kpiIconWrap,
                { backgroundColor: `${theme.colors.primary}15` },
              ]}
            >
              <AppIcon
                name="credit-card"
                size={16}
                color={theme.colors.primary}
              />
            </View>
            <View>
              <Text
                style={[styles.kpiLabel, { color: theme.colors.textTertiary }]}
              >
                Trip Spend
              </Text>
              <Text
                style={[styles.kpiValue, { color: theme.colors.textPrimary }]}
              >
                {hero.formattedTotalTripSpend}
              </Text>
            </View>
          </View>

          {hero.formattedBudgetRemaining && (
            <View style={styles.kpiItem}>
              <View
                style={[
                  styles.kpiIconWrap,
                  {
                    backgroundColor:
                      hero.budgetStatus === 'danger'
                        ? `${theme.colors.danger}15`
                        : hero.budgetStatus === 'warning'
                          ? `${theme.colors.warning}15`
                          : `${theme.colors.success}15`,
                  },
                ]}
              >
                <AppIcon
                  name="pie-chart"
                  size={16}
                  color={
                    hero.budgetStatus === 'danger'
                      ? theme.colors.danger
                      : hero.budgetStatus === 'warning'
                        ? theme.colors.warning
                        : theme.colors.success
                  }
                />
              </View>
              <View>
                <Text
                  style={[
                    styles.kpiLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Budget Left
                </Text>
                <Text
                  style={[styles.kpiValue, { color: theme.colors.textPrimary }]}
                >
                  {hero.formattedBudgetRemaining}
                </Text>
              </View>
            </View>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return StyleSheet.create({
    container: {
      padding: 24,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(255,255,255,0.4)',
      marginBottom: 24,
      overflow: 'hidden',
    },
    topSection: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    balanceWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    balanceAmount: {
      fontSize: 48,
      fontWeight: '900',
      letterSpacing: -1.5,
    },
    trendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
    },
    trendText: {
      fontSize: 13,
      fontWeight: '700',
    },
    divider: {
      height: 1,
      width: '100%',
      marginBottom: 20,
    },
    kpiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 24,
    },
    kpiItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    kpiIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kpiLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 2,
    },
    kpiValue: {
      fontSize: 16,
      fontWeight: '800',
    },
  });
};
