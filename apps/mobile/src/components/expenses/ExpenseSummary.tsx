import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { useTheme } from '../../providers/ThemeProvider';
import { Theme } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import { formatCompactCurrency } from '../../formatters/currency';

interface ExpenseSummaryProps {
  netBalance: number;
  totalOwed: number;
  totalLent: number;
  totalSpent: number;
  pendingCount: number;
}

export function ExpenseSummary({
  netBalance,
  totalOwed,
  totalLent,
  totalSpent,
  pendingCount,
}: ExpenseSummaryProps) {
  const { isDesktop } = useResponsive();
  const theme = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);

  return (
    <View
      style={isDesktop ? styles.desktopSummaryRow : styles.mobileSummaryRow}
    >
      {/* Primary KPI Card: Balances */}
      <Animated.View
        entering={FadeInDown.duration(600).springify()}
        style={isDesktop ? styles.flexCard : undefined}
      >
        <GlassCard
          style={styles.primaryGlassCard}
          intensity={theme.isDark ? 25 : 15}
        >
          <View style={styles.netBalanceRow}>
            <View>
              <Text
                style={[
                  styles.netBalanceLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                NET BALANCE
              </Text>
              <Text
                style={[
                  styles.netBalanceValue,
                  {
                    color:
                      netBalance >= 0
                        ? theme.colors.success
                        : theme.colors.danger,
                  },
                ]}
              >
                {netBalance >= 0 ? '+' : '-'}
                {formatCompactCurrency(Math.abs(netBalance))}
              </Text>
            </View>
            <View
              style={[
                styles.netBalanceIconBox,
                {
                  backgroundColor:
                    netBalance >= 0
                      ? `${theme.colors.success}15`
                      : `${theme.colors.danger}15`,
                },
              ]}
            >
              <AppIcon
                name={netBalance >= 0 ? 'trending-up' : 'trending-down'}
                size={20}
                color={
                  netBalance >= 0 ? theme.colors.success : theme.colors.danger
                }
              />
            </View>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.glass.borderTopColor },
            ]}
          />

          <View style={styles.splitMetricsRow}>
            <View style={styles.splitMetricItem}>
              <View style={styles.splitMetricHeader}>
                <View
                  style={[
                    styles.metricDot,
                    { backgroundColor: theme.colors.success },
                  ]}
                />
                <Text
                  style={[
                    styles.splitMetricLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  OWED TO YOU
                </Text>
              </View>
              <Text
                style={[
                  styles.splitMetricValue,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {formatCompactCurrency(totalLent)}
              </Text>
            </View>

            <View
              style={[
                styles.verticalDivider,
                { backgroundColor: theme.glass.borderTopColor },
              ]}
            />

            <View style={styles.splitMetricItem}>
              <View style={styles.splitMetricHeader}>
                <View
                  style={[
                    styles.metricDot,
                    { backgroundColor: theme.colors.danger },
                  ]}
                />
                <Text
                  style={[
                    styles.splitMetricLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  YOU OWE
                </Text>
              </View>
              <Text
                style={[
                  styles.splitMetricValue,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {formatCompactCurrency(totalOwed)}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Secondary Stats Group */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(600).springify()}
        style={isDesktop ? styles.flexCard : undefined}
      >
        <View style={styles.secondaryGrid}>
          <GlassCard
            style={styles.secondaryGlassCard}
            intensity={theme.isDark ? 20 : 10}
          >
            <View style={styles.statContent}>
              <View
                style={[
                  styles.statIconBox,
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
                  style={[
                    styles.statValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {formatCompactCurrency(totalSpent)}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  TOTAL SPENT
                </Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard
            style={styles.secondaryGlassCard}
            intensity={theme.isDark ? 20 : 10}
          >
            <View style={styles.statContent}>
              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: `${theme.colors.warning}15` },
                ]}
              >
                <AppIcon name="clock" size={16} color={theme.colors.warning} />
              </View>
              <View>
                <Text
                  style={[
                    styles.statValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {pendingCount}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  PENDING
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </Animated.View>
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    desktopSummaryRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    mobileSummaryRow: {
      flexDirection: 'column',
      gap: 12,
      marginBottom: 16,
    },
    flexCard: {
      flex: 1,
    },
    primaryGlassCard: {
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.glass.borderTopColor,
    },
    netBalanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    netBalanceLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    netBalanceValue: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -1,
    },
    netBalanceIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      height: 1,
      marginVertical: 14,
    },
    splitMetricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    splitMetricItem: {
      flex: 1,
    },
    splitMetricHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    metricDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    splitMetricLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    splitMetricValue: {
      fontSize: 18,
      fontWeight: '800',
    },
    verticalDivider: {
      width: 1,
      marginHorizontal: 16,
    },
    secondaryGrid: {
      flexDirection: 'row',
      gap: 12,
      flex: 1,
    },
    secondaryGlassCard: {
      flex: 1,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.glass.borderTopColor,
      justifyContent: 'center',
    },
    statContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    statIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginTop: 2,
    },
  });
