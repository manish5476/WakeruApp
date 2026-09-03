import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import { IconCheck, IconSplit, IconGlobe } from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

type SplitMode = 'equal' | 'shares' | 'percentage' | 'exact';

interface CurrencyOption {
  code: string;
  symbol: string;
  rateToInr: number;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', rateToInr: 1 },
  { code: 'EUR', symbol: '€', rateToInr: 91.2 },
  { code: 'USD', symbol: '$', rateToInr: 86.8 },
  { code: 'GBP', symbol: '£', rateToInr: 109.5 },
  { code: 'THB', symbol: '฿', rateToInr: 2.52 },
  { code: 'AED', symbol: 'AED', rateToInr: 23.6 },
];

const USERS = [
  {
    id: '1',
    name: 'Rahul',
    initial: 'R',
    color: '#2563EB',
    defaultShares: 1,
    defaultPct: 25,
  },
  {
    id: '2',
    name: 'Sarah',
    initial: 'S',
    color: '#06B6D4',
    defaultShares: 2,
    defaultPct: 35,
  },
  {
    id: '3',
    name: 'Arjun',
    initial: 'A',
    color: '#10B981',
    defaultShares: 1,
    defaultPct: 20,
  },
  {
    id: '4',
    name: 'Nehal',
    initial: 'N',
    color: '#8B5CF6',
    defaultShares: 1,
    defaultPct: 20,
  },
];

export function InteractiveSplitter() {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(
    CURRENCIES[0]!,
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [baseAmount, setBaseAmount] = useState<number>(4800);
  const [selectedPayer, setSelectedPayer] = useState<string>('Arjun');
  const [included, setIncluded] = useState<Record<string, boolean>>({
    '1': true,
    '2': true,
    '3': true,
    '4': true,
  });

  const [customShares, setCustomShares] = useState<Record<string, number>>({
    '1': 1,
    '2': 2,
    '3': 1,
    '4': 1,
  });

  const [customPcts] = useState<Record<string, number>>({
    '1': 25,
    '2': 35,
    '3': 20,
    '4': 20,
  });

  const activeUsers = USERS.filter(u => included[u.id]);

  const toggleUser = (id: string) => {
    if (included[id] && activeUsers.length === 1) return;
    setIncluded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const adjustShareWeight = (id: string, delta: number) => {
    setCustomShares(prev => ({
      ...prev,
      [id]: Math.max(1, Math.min(5, (prev[id] || 1) + delta)),
    }));
  };

  // Convert displayed amount based on selected currency
  const convertedAmount = Math.round(baseAmount / selectedCurrency.rateToInr);

  // Calculate per user shares based on mode
  const calculatedShares = useMemo(() => {
    if (activeUsers.length === 0) return {};
    const sharesMap: Record<string, number> = {};

    if (splitMode === 'equal') {
      const perHead = Math.round(convertedAmount / activeUsers.length);
      activeUsers.forEach(u => {
        sharesMap[u.id] = perHead;
      });
    } else if (splitMode === 'shares') {
      const totalShares = activeUsers.reduce(
        (sum, u) => sum + (customShares[u.id] || 1),
        0,
      );
      activeUsers.forEach(u => {
        const weight = customShares[u.id] || 1;
        sharesMap[u.id] = Math.round((convertedAmount * weight) / totalShares);
      });
    } else if (splitMode === 'percentage') {
      activeUsers.forEach(u => {
        const pct = customPcts[u.id] || 25;
        sharesMap[u.id] = Math.round((convertedAmount * pct) / 100);
      });
    } else if (splitMode === 'exact') {
      const baseShare = Math.round(convertedAmount / activeUsers.length);
      activeUsers.forEach((u, i) => {
        sharesMap[u.id] = i === 0 ? baseShare + 200 : baseShare - 100;
      });
    }

    return sharesMap;
  }, [splitMode, convertedAmount, activeUsers, customShares, customPcts]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <IconSplit size={18} color={colors.brand.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.miniBadge}>
              <Text style={styles.miniBadgeText}>LIVE MULTI-CURRENCY</Text>
            </View>
          </View>
          <Text style={styles.title}>Dynamic Split & FX Engine</Text>
          <Text style={styles.subtitle}>
            Equal, custom shares, percentages & cross-border live conversions
          </Text>
        </View>
      </View>

      {/* Multi-Currency Ticker */}
      <View style={styles.currencyRow}>
        <View style={styles.currencyLabelWrap}>
          <IconGlobe size={14} color={colors.brand.primary} />
          <Text style={styles.currencyLabel}>TRIP FX</Text>
        </View>
        <View style={styles.currencyPills}>
          {CURRENCIES.map(curr => {
            const isActive = selectedCurrency.code === curr.code;
            return (
              <Pressable
                key={curr.code}
                onPress={() => setSelectedCurrency(curr)}
                style={[
                  styles.currencyPill,
                  isActive && styles.currencyPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.currencyPillText,
                    isActive && styles.currencyPillTextActive,
                  ]}
                >
                  {curr.code} ({curr.symbol})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Live FX Rate Note */}
      {selectedCurrency.code !== 'INR' && (
        <View style={styles.fxRateBanner}>
          <AppIcon
            name="arrow-left-right"
            size={12}
            color={colors.brand.primary}
          />
          <Text style={styles.fxRateText}>
            Institutional FX: 1 {selectedCurrency.code} = ₹
            {selectedCurrency.rateToInr.toFixed(2)} INR
          </Text>
        </View>
      )}

      {/* Split Mode Selector */}
      <View style={styles.modeTabs}>
        {(
          [
            { key: 'equal', label: '1/N Equal' },
            { key: 'shares', label: 'Shares (Ratios)' },
            { key: 'percentage', label: 'Percentage %' },
            { key: 'exact', label: 'Exact Items' },
          ] as const
        ).map(tab => {
          const isActive = splitMode === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setSplitMode(tab.key)}
              style={[styles.modeTab, isActive && styles.modeTabActive]}
            >
              <Text
                style={[
                  styles.modeTabText,
                  isActive && styles.modeTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Amount Stepper */}
      <View style={styles.amountContainer}>
        <Text style={styles.label}>EXPENSE AMOUNT</Text>
        <View style={styles.stepperRow}>
          <Pressable
            style={({ pressed }) => [
              styles.stepBtn,
              pressed && styles.stepBtnPressed,
            ]}
            onPress={() =>
              setBaseAmount(a =>
                Math.max(500, a - 500 * selectedCurrency.rateToInr),
              )
            }
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.amountText}>
              {selectedCurrency.symbol}
              {convertedAmount.toLocaleString('en-IN')}
            </Text>
            {selectedCurrency.code !== 'INR' && (
              <Text style={styles.convertedSub}>
                ≈ ₹{baseAmount.toLocaleString('en-IN')} INR
              </Text>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.stepBtn,
              pressed && styles.stepBtnPressed,
            ]}
            onPress={() =>
              setBaseAmount(a => a + 500 * selectedCurrency.rateToInr)
            }
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Paid By Selection */}
      <Text style={[styles.label, { marginTop: spacing.xl }]}>
        PAID UPFRONT BY
      </Text>
      <View style={styles.pillRow}>
        {USERS.map(user => {
          const isActive = selectedPayer === user.name;
          return (
            <Pressable
              key={user.id}
              onPress={() => setSelectedPayer(user.name)}
              style={[styles.userPill, isActive && styles.activePill]}
            >
              <View style={[styles.avatar, { backgroundColor: user.color }]}>
                <Text style={styles.avatarText}>{user.initial}</Text>
              </View>
              <Text
                style={[styles.pillText, isActive && styles.activePillText]}
              >
                {user.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Participants & Custom Shares */}
      <Text style={[styles.label, { marginTop: spacing.xl }]}>
        PARTICIPANTS & SPLIT BREAKDOWN
      </Text>
      <View style={styles.usersList}>
        {USERS.map(user => {
          const isIncluded = included[user.id];
          const isPayer = selectedPayer === user.name;
          const shareVal = calculatedShares[user.id] || 0;

          return (
            <Pressable
              key={user.id}
              onPress={() => toggleUser(user.id)}
              style={[styles.userRow, !isIncluded && styles.userRowDisabled]}
            >
              <View style={styles.userLeft}>
                <View
                  style={[styles.checkbox, isIncluded && styles.checkboxActive]}
                >
                  {isIncluded && (
                    <IconCheck size={12} color={colors.brand.white} />
                  )}
                </View>

                <View style={[styles.avatar, { backgroundColor: user.color }]}>
                  <Text style={styles.avatarText}>{user.initial}</Text>
                </View>

                <View>
                  <Text
                    style={[
                      styles.userName,
                      !isIncluded && styles.userNameDisabled,
                    ]}
                  >
                    {user.name}
                  </Text>
                  {splitMode === 'shares' && isIncluded && (
                    <Text style={styles.shareMultiplier}>
                      {customShares[user.id] || 1} share(s) (e.g. couple/kids)
                    </Text>
                  )}
                  {splitMode === 'percentage' && isIncluded && (
                    <Text style={styles.shareMultiplier}>
                      {customPcts[user.id] || 25}% of total
                    </Text>
                  )}
                </View>

                {isPayer && (
                  <View style={styles.payerTag}>
                    <Text style={styles.payerTagText}>PAID UPFRONT</Text>
                  </View>
                )}
              </View>

              {/* Action on Right (Shares Controls or Calculated Share) */}
              <View style={styles.userRight}>
                {splitMode === 'shares' && isIncluded && (
                  <View style={styles.weightStepper}>
                    <Pressable
                      style={styles.weightBtn}
                      onPress={() => adjustShareWeight(user.id, -1)}
                    >
                      <Text style={styles.weightBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.weightVal}>
                      {customShares[user.id] || 1}
                    </Text>
                    <Pressable
                      style={styles.weightBtn}
                      onPress={() => adjustShareWeight(user.id, 1)}
                    >
                      <Text style={styles.weightBtnText}>+</Text>
                    </Pressable>
                  </View>
                )}

                <Text
                  style={[
                    styles.shareText,
                    !isIncluded && styles.shareDisabled,
                  ]}
                >
                  {isIncluded
                    ? `${selectedCurrency.symbol}${shareVal.toLocaleString('en-IN')}`
                    : 'Excluded'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.summaryLabel}>OPTIMIZED NET TRANSFERS</Text>
          <Text style={styles.summarySub}>
            Graph engine collapsed 6 bilateral debts into 1 clean settlement
          </Text>
        </View>
        <View style={styles.savingsPill}>
          <Text style={styles.savingsText}>✓ 0 Math Stress</Text>
        </View>
      </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  miniBadge: {
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  miniBadgeText: {
    ...typography.label,
    color: colors.brand.primary,
    fontSize: 9,
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

  // Currency Row
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.surfaceMuted,
    padding: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  currencyLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  currencyLabel: {
    ...typography.label,
    color: colors.brand.primary,
    fontSize: 10,
  },
  currencyPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  currencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  currencyPillActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  currencyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.light.textSecondary,
  },
  currencyPillTextActive: {
    color: '#FFFFFF',
  },
  fxRateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: spacing.md,
  },
  fxRateText: {
    fontSize: 11,
    color: colors.brand.primary,
    fontWeight: '600',
  },

  // Mode Tabs
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
    gap: 2,
  },
  modeTab: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  modeTabActive: {
    backgroundColor: colors.light.surface,
    ...shadow.soft,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.light.textMuted,
  },
  modeTabTextActive: {
    color: colors.brand.primary,
    fontWeight: '700',
  },

  // Amount Stepper
  amountContainer: {
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  label: {
    ...typography.label,
    color: colors.light.textMuted,
    marginBottom: spacing.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.light.surface,
    ...shadow.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  stepBtnText: {
    color: colors.light.textPrimary,
    fontSize: 24,
    fontWeight: '600',
  },
  amountText: {
    ...typography.heading2.mobile,
    color: colors.brand.primary,
  },
  convertedSub: {
    fontSize: 11,
    color: colors.light.textMuted,
    marginTop: 2,
  },

  // Payer Pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.light.surfaceMuted,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  activePill: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
    ...shadow.glow,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.label,
    color: colors.brand.white,
    letterSpacing: 0,
  },
  pillText: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    fontWeight: '600',
  },
  activePillText: {
    color: colors.brand.white,
  },

  // List
  usersList: {
    gap: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadow.soft,
  },
  userRowDisabled: {
    opacity: 0.5,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.light.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  userName: {
    ...typography.body.mobile,
    color: colors.light.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  userNameDisabled: {
    color: colors.light.textMuted,
  },
  shareMultiplier: {
    fontSize: 10,
    color: colors.brand.primary,
  },
  payerTag: {
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginLeft: 4,
  },
  payerTagText: {
    ...typography.label,
    color: colors.brand.primary,
    fontSize: 9,
  },
  userRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  weightStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  weightBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  weightVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  shareText: {
    ...typography.body.mobile,
    color: colors.light.textPrimary,
    fontWeight: '700',
  },
  shareDisabled: {
    color: colors.light.textFaint,
    fontStyle: 'italic',
  },

  // Footer
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryLabel: {
    ...typography.label,
    color: colors.light.textMuted,
    fontSize: 10,
  },
  summarySub: {
    fontSize: 11,
    color: colors.light.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  savingsPill: {
    backgroundColor: colors.brand.emeraldSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  savingsText: {
    color: colors.brand.emerald,
    fontSize: 11,
    fontWeight: '700',
  },
});
