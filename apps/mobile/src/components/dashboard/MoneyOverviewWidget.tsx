/**
 * MoneyOverviewWidget
 * -------------------
 * Shows the current month's financial activity as a compact, premium KPI card
 * on the Dashboard. Data comes from GET /finance/overview (backend-aggregated).
 *
 * Layout:
 *  ┌─────────────────────────────────────────────────────────┐
 *  │ SEPTEMBER 2026              Finance Overview  →          │
 *  │─────────────────────────────────────────────────────────│
 *  │ Net Balance (+₹12,400)   │  People (4)                  │
 *  │─────────────────────────────────────────────────────────│
 *  │ Paid by me  ₹8,400  │  My Share  ₹5,200  │ Settled ✓   │
 *  │─────────────────────────────────────────────────────────│
 *  │ Lent ↑ ₹3,000   │  Borrowed ↓ ₹600   │  Pending ⬤     │
 *  │─────────────────────────────────────────────────────────│
 *  │ People breakdown (top 4 rows)                           │
 *  └─────────────────────────────────────────────────────────┘
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  useFinanceOverview,
  type FinanceOverviewData,
} from '../../hooks/useFinance';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { safeFormatCurrency } from '../../utils/formatters';
import { haptics } from '../../utils/haptics';
import type { Theme } from '../../theme';

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────

function SkeletonBlock({
  width,
  height = 12,
  style,
}: {
  width: number | `${number}%`;
  height?: number;
  style?: object;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: 6,
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.07)',
        },
        style,
      ]}
    />
  );
}

function MoneyOverviewSkeleton({ theme }: { theme: Theme }) {
  return (
    <GlassCard style={styles(theme).card} intensity={theme.isDark ? 25 : 45}>
      {/* Header */}
      <View style={styles(theme).header}>
        <SkeletonBlock width={120} height={10} />
        <SkeletonBlock width={80} height={10} />
      </View>

      {/* Big net balance */}
      <View style={styles(theme).netRow}>
        <SkeletonBlock width={160} height={28} />
        <SkeletonBlock width={60} height={16} />
      </View>

      {/* KPI row 1 */}
      <View style={styles(theme).kpiRow}>
        {[1, 2, 3].map(k => (
          <View key={k} style={styles(theme).kpiCell}>
            <SkeletonBlock width={60} height={9} />
            <SkeletonBlock width={80} height={16} style={{ marginTop: 5 }} />
          </View>
        ))}
      </View>

      {/* KPI row 2 */}
      <View style={[styles(theme).kpiRow, { marginTop: 8 }]}>
        {[1, 2, 3].map(k => (
          <View key={k} style={styles(theme).kpiCell}>
            <SkeletonBlock width={50} height={9} />
            <SkeletonBlock width={70} height={16} style={{ marginTop: 5 }} />
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────
// KPI CELL
// ─────────────────────────────────────────────────────────────

function KpiCell({
  label,
  value,
  accent,
  icon,
  theme,
}: {
  label: string;
  value: string;
  accent?: string;
  icon?: string;
  theme: Theme;
}) {
  return (
    <View style={styles(theme).kpiCell}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        {icon && (
          <AppIcon
            name={icon as any}
            size={10}
            color={accent || theme.colors.textTertiary}
          />
        )}
        <Text
          style={[styles(theme).kpiLabel, { color: theme.colors.textTertiary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles(theme).kpiValue,
          { color: accent || theme.colors.textPrimary },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PERSON ROW
// ─────────────────────────────────────────────────────────────

function PersonRow({
  person,
  currency,
  theme,
}: {
  person: FinanceOverviewData['peopleBreakdown'][0];
  currency: string;
  theme: Theme;
}) {
  const isOwed = person.direction === 'they_owe_you';
  const accent = isOwed ? '#10B981' : '#F43F5E';
  const formatted = safeFormatCurrency(Math.abs(person.net), currency);

  return (
    <View style={styles(theme).personRow}>
      {/* Avatar letter */}
      <View
        style={[
          styles(theme).personAvatar,
          { backgroundColor: isOwed ? '#D1FAE5' : '#FEE2E2' },
        ]}
      >
        <Text style={[styles(theme).personAvatarText, { color: accent }]}>
          {person.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text
        style={[styles(theme).personName, { color: theme.colors.textPrimary }]}
        numberOfLines={1}
      >
        {person.name}
      </Text>

      <View style={styles(theme).personRight}>
        <Text style={[styles(theme).personAmount, { color: accent }]}>
          {isOwed ? '+' : '-'}
          {formatted}
        </Text>
        <Text
          style={[
            styles(theme).personDir,
            { color: theme.colors.textTertiary },
          ]}
        >
          {isOwed ? 'owes you' : 'you owe'}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN WIDGET
// ─────────────────────────────────────────────────────────────

interface MoneyOverviewWidgetProps {
  month?: string;
}

export function MoneyOverviewWidget({ month }: MoneyOverviewWidgetProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 860;

  const { data, isLoading, isError, error, refetch } =
    useFinanceOverview(month);

  const navigate = useCallback(() => {
    haptics.light();
    router.push('/(app)/(tabs)/finance' as any);
  }, []);

  // ── LOADING ──
  if (isLoading) {
    return <MoneyOverviewSkeleton theme={theme} />;
  }

  // ── ERROR ──
  if (isError || !data) {
    return (
      <GlassCard style={styles(theme).card} intensity={theme.isDark ? 25 : 45}>
        <View style={styles(theme).errorContainer}>
          <AppIcon
            name="alert-circle"
            size={18}
            color={theme.colors.textTertiary}
          />
          <Text
            style={[
              styles(theme).errorText,
              { color: theme.colors.textTertiary },
            ]}
          >
            {(error as any)?.message?.includes('401')
              ? 'Sign in required to view Finance'
              : 'Could not load finance data'}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={({ pressed }) => [
              styles(theme).retryBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[styles(theme).retryText, { color: theme.colors.primary }]}
            >
              Retry
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    );
  }

  const currency = data.currency || 'INR';
  const netIsPositive = data.netBalance >= 0;
  const netColor = netIsPositive ? '#10B981' : '#F43F5E';
  const netSign = netIsPositive ? '+' : '';

  // ── EMPTY (no financial activity this month) ──
  const hasActivity =
    data.totalTransactions > 0 ||
    data.totalExpenses > 0 ||
    data.amountLent > 0 ||
    data.amountBorrowed > 0;

  if (!hasActivity) {
    return (
      <GlassCard style={styles(theme).card} intensity={theme.isDark ? 25 : 45}>
        <View style={styles(theme).header}>
          <Text
            style={[
              styles(theme).monthLabel,
              { color: theme.colors.textTertiary },
            ]}
          >
            {data.monthLabel}
          </Text>
          <Pressable
            onPress={navigate}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
            hitSlop={8}
          >
            <Text
              style={[styles(theme).viewAll, { color: theme.colors.primary }]}
            >
              Finance →
            </Text>
          </Pressable>
        </View>
        <View style={styles(theme).emptyBody}>
          <AppIcon name="wallet" size={24} color={theme.colors.textTertiary} />
          <Text
            style={[
              styles(theme).emptyText,
              { color: theme.colors.textTertiary },
            ]}
          >
            No financial activity this month
          </Text>
          <Pressable
            onPress={() => {
              haptics.light();
              router.push('/(app)/finance/add' as any);
            }}
            style={({ pressed }) => [
              styles(theme).addFirstBtn,
              { borderColor: theme.colors.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles(theme).addFirstText,
                { color: theme.colors.primary },
              ]}
            >
              + Add Transaction
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    );
  }

  // ── SUCCESS ──
  const topPeople = data.peopleBreakdown.slice(0, isDesktop ? 5 : 3);

  return (
    <Animated.View entering={FadeIn.duration(350)}>
      <GlassCard style={styles(theme).card} intensity={theme.isDark ? 25 : 45}>
        {/* ── HEADER ── */}
        <View style={styles(theme).header}>
          <Text
            style={[
              styles(theme).monthLabel,
              { color: theme.colors.textTertiary },
            ]}
          >
            {data.monthLabel.toUpperCase()}
          </Text>
          <Pressable
            onPress={navigate}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
            hitSlop={8}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
            >
              <Text
                style={[styles(theme).viewAll, { color: theme.colors.primary }]}
              >
                Finance Overview
              </Text>
              <AppIcon
                name="arrow-right"
                size={12}
                color={theme.colors.primary}
              />
            </View>
          </Pressable>
        </View>

        {/* ── NET BALANCE (Hero) ── */}
        <View style={styles(theme).netRow}>
          <View>
            <Text
              style={[
                styles(theme).netLabel,
                { color: theme.colors.textTertiary },
              ]}
            >
              NET BALANCE
            </Text>
            <Text style={[styles(theme).netValue, { color: netColor }]}>
              {netSign}
              {safeFormatCurrency(Math.abs(data.netBalance), currency)}
            </Text>
          </View>
          <View style={styles(theme).metaPills}>
            <View
              style={[
                styles(theme).pill,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <AppIcon
                name="users"
                size={10}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles(theme).pillText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {data.activePeopleCount}{' '}
                {data.activePeopleCount === 1 ? 'person' : 'people'}
              </Text>
            </View>
            <View
              style={[
                styles(theme).pill,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <AppIcon name="zap" size={10} color={theme.colors.textTertiary} />
              <Text
                style={[
                  styles(theme).pillText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {data.totalTransactions + data.totalExpenses} txns
              </Text>
            </View>
          </View>
        </View>

        {/* ── DIVIDER ── */}
        <View
          style={[
            styles(theme).divider,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        />

        {/* ── KPI CAROUSEL ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          directionalLockEnabled
          nestedScrollEnabled
          contentContainerStyle={styles(theme).kpiCarousel}
        >
          <KpiCell
            label="Paid by me"
            value={safeFormatCurrency(data.amountPaidByMe, currency)}
            icon="credit-card"
            theme={theme}
          />
          <KpiCell
            label="My Share"
            value={safeFormatCurrency(data.myShare, currency)}
            icon="pie-chart"
            theme={theme}
          />
          <KpiCell
            label="Settled"
            value={safeFormatCurrency(data.settledAmount, currency)}
            accent="#10B981"
            icon="check-circle"
            theme={theme}
          />
          <KpiCell
            label="Lent"
            value={safeFormatCurrency(data.amountLent, currency)}
            accent={data.amountLent > 0 ? '#10B981' : undefined}
            icon="arrow-up-right"
            theme={theme}
          />
          <KpiCell
            label="Borrowed"
            value={safeFormatCurrency(data.amountBorrowed, currency)}
            accent={data.amountBorrowed > 0 ? '#F43F5E' : undefined}
            icon="arrow-down-left"
            theme={theme}
          />
          <KpiCell
            label="Pending"
            value={safeFormatCurrency(data.pendingAmount, currency)}
            accent={data.pendingAmount > 0 ? '#F59E0B' : undefined}
            icon="clock"
            theme={theme}
          />
        </ScrollView>

        {/* ── PEOPLE BREAKDOWN ── */}
        {topPeople.length > 0 && (
          <>
            <View
              style={[
                styles(theme).divider,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            />
            <View style={styles(theme).peopleSection}>
              <Text
                style={[
                  styles(theme).peopleHeader,
                  { color: theme.colors.textTertiary },
                ]}
              >
                PEOPLE
              </Text>
              {topPeople.map((person: any, i: number) => (
                <PersonRow
                  key={person.userId || person.name + i}
                  person={person}
                  currency={currency}
                  theme={theme}
                />
              ))}
              {data.peopleBreakdown.length > topPeople.length && (
                <Pressable
                  onPress={navigate}
                  style={({ pressed }) => pressed && { opacity: 0.7 }}
                  hitSlop={6}
                >
                  <Text
                    style={[
                      styles(theme).moreText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    +{data.peopleBreakdown.length - topPeople.length} more →
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </GlassCard>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

function styles(theme: Theme) {
  return StyleSheet.create({
    card: {
      padding: 16,
      gap: 0,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    monthLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    viewAll: {
      fontSize: 12,
      fontWeight: '600',
    },

    // Net balance hero
    netRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 14,
    },
    netLabel: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.6,
      marginBottom: 3,
    },
    netValue: {
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    metaPills: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 5,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    pillText: {
      fontSize: 10,
      fontWeight: '600',
    },

    // Divider
    divider: {
      height: 1,
      marginVertical: 12,
    },
    // Retained for the loading skeleton, whose compact placeholders do
    // not need the interactive carousel treatment.
    kpiRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
    },
    // Horizontal KPI carousel. Each card retains a predictable touch-sized
    // width so the next metric remains visible as a scroll affordance.
    kpiCarousel: {
      gap: 10,
      paddingRight: 10,
    },
    kpiCell: {
      width: 132,
      minHeight: 76,
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(15,23,42,0.06)',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(255,255,255,0.54)',
    },
    kpiLabel: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    kpiValue: {
      fontSize: 14,
      fontWeight: '700',
      marginTop: 4,
      letterSpacing: -0.2,
    },

    // People
    peopleSection: {
      gap: 8,
    },
    peopleHeader: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    personRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    personAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    personAvatarText: {
      fontSize: 11,
      fontWeight: '700',
    },
    personName: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
    },
    personRight: {
      alignItems: 'flex-end',
    },
    personAmount: {
      fontSize: 13,
      fontWeight: '700',
    },
    personDir: {
      fontSize: 10,
      fontWeight: '500',
    },
    moreText: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'right',
      marginTop: 2,
    },

    // Error / Empty
    errorContainer: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 20,
    },
    errorText: {
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
    },
    retryBtn: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    retryText: {
      fontSize: 13,
      fontWeight: '600',
    },
    emptyBody: {
      alignItems: 'center',
      gap: 10,
      paddingVertical: 16,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
    },
    addFirstBtn: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    addFirstText: {
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
