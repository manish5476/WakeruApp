import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Svg, Circle, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import { IconWallet, IconSparkles, IconCheck } from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

type FinanceViewMode = 'group' | 'personal';

const CATEGORIES = [
  { name: 'Stay', pct: 42, color: colors.oceanBlue, amt: '₹28,740' },
  { name: 'Food', pct: 26, color: colors.travelCyan, amt: '₹17,800' },
  { name: 'Transit', pct: 18, color: colors.emerald, amt: '₹12,315' },
  { name: 'Activities', pct: 14, color: colors.warning, amt: '₹9,565' },
];

export function FinanceDashboard() {
  const [viewMode, setViewMode] = useState<FinanceViewMode>('group');
  const [selectedCat, setSelectedCat] = useState(0);
  const active = CATEGORIES[selectedCat];

  const radiusSize = 46;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radiusSize;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <IconWallet size={14} color={colors.brand.primary} />
          <Text style={styles.badgeText}>CALM MONEY INTELLIGENCE</Text>
        </View>
        <Text style={styles.title}>Budget & Personal Vault</Text>
        <Text style={styles.subtitle}>
          Track shared group budget velocity or monitor your personal travel
          savings goals and recurring travel subscriptions.
        </Text>
      </View>

      {/* View Switcher */}
      <View style={styles.viewTabs}>
        <Pressable
          onPress={() => setViewMode('group')}
          style={[styles.viewTab, viewMode === 'group' && styles.viewTabActive]}
        >
          <Text
            style={[
              styles.viewTabText,
              viewMode === 'group' && styles.viewTabTextActive,
            ]}
          >
            📊 Group Trip Analytics
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setViewMode('personal')}
          style={[
            styles.viewTab,
            viewMode === 'personal' && styles.viewTabActive,
          ]}
        >
          <Text
            style={[
              styles.viewTabText,
              viewMode === 'personal' && styles.viewTabTextActive,
            ]}
          >
            🏦 Personal Travel Vault
          </Text>
        </Pressable>
      </View>

      {viewMode === 'group' ? (
        <>
          {/* Group Budget Gauge */}
          <View style={styles.budgetGauge}>
            <View style={styles.gaugeTop}>
              <Text style={styles.gaugeLabel}>GROUP BUDGET UTILIZATION</Text>
              <Text style={styles.gaugePercent}>68.4% Spent</Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.gaugeTotal}>₹68,420</Text>
              <Text style={styles.gaugeLimit}> / ₹1,00,000 Budget</Text>
            </View>

            <View style={styles.gaugeTrack}>
              <LinearGradient
                colors={colors.gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gaugeFill, { width: '68.4%' }]}
              />
            </View>

            <View style={styles.velocityRow}>
              <Text style={styles.velocityText}>
                ⚡ Burn Velocity: ₹11,400/day ·{' '}
                <Text style={{ color: colors.brand.emerald }}>Safe Pace</Text>
              </Text>
            </View>
          </View>

          {/* Donut Chart & Category Breakdown */}
          <View style={styles.chartSection}>
            <View style={styles.donutWrap}>
              <Svg width={130} height={130} viewBox="0 0 140 140">
                <G rotation="-90" origin="70, 70">
                  {CATEGORIES.map((cat, i) => {
                    const strokeDasharray = `${(cat.pct / 100) * circumference} ${circumference}`;
                    let offset = 0;
                    for (let k = 0; k < i; k++)
                      offset += (CATEGORIES[k].pct / 100) * circumference;

                    const isActive = i === selectedCat;
                    return (
                      <Circle
                        key={cat.name}
                        cx="70"
                        cy="70"
                        r={radiusSize}
                        stroke={cat.color}
                        strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={-offset}
                        fill="none"
                        opacity={isActive ? 1 : 0.25}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </G>
              </Svg>
              <View style={styles.donutCenter}>
                <Text style={styles.donutCenterVal}>{active.pct}%</Text>
                <Text style={styles.donutCenterLabel}>{active.name}</Text>
              </View>
            </View>

            <View style={styles.legendList}>
              {CATEGORIES.map((cat, idx) => {
                const isActive = idx === selectedCat;
                return (
                  <Pressable
                    key={cat.name}
                    onPress={() => setSelectedCat(idx)}
                    style={[
                      styles.legendRow,
                      isActive && styles.legendRowActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.catDot,
                        { backgroundColor: cat.color },
                        isActive && styles.catDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.catName,
                        isActive && { color: colors.light.textPrimary },
                      ]}
                    >
                      {cat.name}
                    </Text>
                    <Text
                      style={[
                        styles.catAmt,
                        isActive && { color: colors.light.textPrimary },
                      ]}
                    >
                      {cat.amt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      ) : (
        /* Personal Travel Vault View */
        <View style={styles.personalVault}>
          {/* Target Goal Card */}
          <View style={styles.vaultGoalCard}>
            <View style={styles.goalTopRow}>
              <View style={styles.goalIcon}>
                <Text style={{ fontSize: 18 }}>🏔️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalTitle}>Europe 2027 Dream Fund</Text>
                <Text style={styles.goalDeadline}>
                  Target: June 2027 · ₹15,000/mo
                </Text>
              </View>
              <View style={styles.goalPercentPill}>
                <Text style={styles.goalPercentText}>72%</Text>
              </View>
            </View>

            <View style={styles.goalNumbersRow}>
              <Text style={styles.savedAmount}>₹1,80,000</Text>
              <Text style={styles.targetAmount}> / ₹2,50,000 Goal</Text>
            </View>

            <View style={styles.goalTrack}>
              <LinearGradient
                colors={colors.gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.goalFill, { width: '72%' }]}
              />
            </View>
          </View>

          {/* Subscriptions / Recurring */}
          <Text style={styles.subhead}>TRAVEL SUBSCRIPTIONS & PASSES</Text>
          <View style={styles.billsList}>
            <View style={styles.billRow}>
              <View style={styles.billIcon}>
                <AppIcon
                  name="shield-check"
                  size={14}
                  color={colors.brand.primary}
                />
              </View>
              <View style={styles.billInfo}>
                <Text style={styles.billName}>Allianz Global Travel Cover</Text>
                <Text style={styles.billDate}>
                  Renews monthly · Auto-Pay On
                </Text>
              </View>
              <Text style={styles.billAmt}>$24.00/mo</Text>
            </View>

            <View style={styles.billRow}>
              <View
                style={[
                  styles.billIcon,
                  { backgroundColor: colors.brand.cyanSoft },
                ]}
              >
                <AppIcon name="wifi" size={14} color={colors.brand.cyan} />
              </View>
              <View style={styles.billInfo}>
                <Text style={styles.billName}>Airalo Global e-SIM Data</Text>
                <Text style={styles.billDate}>10 GB Europe Zone</Text>
              </View>
              <Text style={styles.billAmt}>$18.00</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadow.cardHover,
    marginBottom: spacing.sectionSm,
  },
  header: {
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.label,
    color: colors.brand.primary,
    marginLeft: 6,
  },
  title: {
    ...typography.heading3.mobile,
    color: colors.light.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    marginTop: 2,
  },

  // View Switcher
  viewTabs: {
    flexDirection: 'row',
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    marginVertical: spacing.md,
    gap: 4,
  },
  viewTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  viewTabActive: {
    backgroundColor: colors.light.surface,
    ...shadow.soft,
  },
  viewTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.light.textMuted,
  },
  viewTabTextActive: {
    color: colors.brand.primary,
    fontWeight: '700',
  },

  // Group Gauge
  budgetGauge: {
    backgroundColor: colors.light.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  gaugeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gaugeLabel: {
    ...typography.label,
    color: colors.light.textMuted,
    fontSize: 10,
  },
  gaugePercent: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  gaugeTotal: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.light.textPrimary,
  },
  gaugeLimit: {
    fontSize: 12,
    color: colors.light.textMuted,
  },
  gaugeTrack: {
    height: 8,
    backgroundColor: 'rgba(15,23,42,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  velocityRow: {
    marginTop: spacing.sm,
  },
  velocityText: {
    fontSize: 11,
    color: colors.light.textSecondary,
    fontWeight: '600',
  },

  // Chart
  chartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  donutWrap: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutCenterVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.light.textPrimary,
  },
  donutCenterLabel: {
    fontSize: 11,
    color: colors.light.textMuted,
  },
  legendList: {
    flex: 1,
    minWidth: 150,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  legendRowActive: {
    backgroundColor: colors.light.surfaceMuted,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  catDotActive: {
    transform: [{ scale: 1.3 }],
  },
  catName: {
    flex: 1,
    fontSize: 12,
    color: colors.light.textSecondary,
    fontWeight: '600',
  },
  catAmt: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.textMuted,
  },

  // Personal Vault
  personalVault: {
    gap: spacing.md,
  },
  vaultGoalCard: {
    backgroundColor: colors.brand.primarySoft,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.15)',
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  goalDeadline: {
    fontSize: 11,
    color: colors.light.textSecondary,
  },
  goalPercentPill: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  goalPercentText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  goalNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: spacing.sm,
  },
  savedAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.brand.primary,
  },
  targetAmount: {
    fontSize: 12,
    color: colors.light.textMuted,
  },
  goalTrack: {
    height: 8,
    backgroundColor: 'rgba(37,99,235,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
  },
  subhead: {
    ...typography.label,
    color: colors.light.textMuted,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  billsList: {
    gap: spacing.xs,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: spacing.sm,
  },
  billIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billInfo: {
    flex: 1,
  },
  billName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  billDate: {
    fontSize: 11,
    color: colors.light.textMuted,
  },
  billAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
});
