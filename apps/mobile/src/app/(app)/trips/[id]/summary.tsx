import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  Pressable,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

import { useTripSummary } from '../../../../hooks/useTrips';
import { useTheme } from '../../../../providers/ThemeProvider';
import AppIcon from '../../../../components/common/AppIcon';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import GlobalLoader from '../../../../components/common/GlobalLoader';

const MEMBER_COLORS = [
  '#2563EB',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
];

export default function TripSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: summary, isLoading, isError } = useTripSummary(id as string);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;
  const isWideDesktop = width >= 1100;

  const stops = summary?.stops || [];
  const members = summary?.members || [];

  if (isLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <GlobalLoader size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (isError || !summary) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[styles.errorCard, { backgroundColor: theme.colors.surface }]}
        >
          <AppIcon name="alert-triangle" size={44} color="#EF4444" />
          <Text
            style={[styles.errorTitle, { color: theme.colors.textPrimary }]}
          >
            Failed to Load Summary
          </Text>
          <Text
            style={[
              styles.errorSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Please check your network connection and try again.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.errorBackBtn}>
            <Text style={styles.errorBackBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const {
    title,
    baseCurrency,
    startDate,
    endDate,
    totalSpentBase = 0,
    stopCount = stops.length,
    memberCount = members.length,
  } = summary;

  const cs = baseCurrency === 'INR' ? '₹' : baseCurrency === 'USD' ? '$' : '€';

  const formatCurrency = (val: number) => {
    if (!val || val === 0) return `${cs}0`;
    if (val >= 10000000) return `${cs}${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `${cs}${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `${cs}${(val / 1000).toFixed(1)}k`;
    return `${cs}${val.toLocaleString('en-IN')}`;
  };

  const totalBudget = stops.reduce(
    (sum: number, s: any) => sum + (s.budgetHealth || 0),
    0,
  );
  const progressPercent =
    totalBudget > 0 ? Math.min((totalSpentBase / totalBudget) * 100, 100) : 0;
  const isOverBudget = progressPercent >= 100;

  const sDate = startDate ? new Date(startDate) : new Date();
  const eDate = endDate ? new Date(endDate) : new Date();
  const tripDays = Math.max(
    1,
    Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const daysLeft = Math.ceil(
    (eDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const totalExpensesCount = stops.reduce(
    (sum: number, s: any) => sum + (s.expenseCount || 0),
    0,
  );

  return (
    <GlobalBackground>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 12 },
        ]}
      >
        <View
          style={[
            styles.headerBar,
            isDesktop && styles.desktopHeaderBar,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <AppIcon
              name="arrow-left"
              size={20}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          >
            Trip Summary Dashboard
          </Text>
          <Pressable style={styles.headerAction} hitSlop={12}>
            <AppIcon
              name="share-2"
              size={18}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          isDesktop && styles.desktopContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* BENTO TOP ROW: Hero Card (Left) + Quick Stats Tiles (Right) */}
        <View style={[styles.bentoRow, !isDesktop && styles.stackColumn]}>
          {/* BENTO ITEM 1: Hero Overview Card */}
          <LinearGradient
            colors={['#0F172A', '#1E1B4B', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, isDesktop && styles.bentoHeroCard]}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <AppIcon name="map-pin" size={12} color="#38BDF8" />
                <Text style={styles.heroBadgeText}>
                  {stopCount} {stopCount === 1 ? 'Stop' : 'Stops'}
                </Text>
              </View>
              <View style={styles.heroBadge}>
                <AppIcon name="users" size={12} color="#A78BFA" />
                <Text style={styles.heroBadgeText}>
                  {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                </Text>
              </View>
              <View style={styles.heroStatusPill}>
                <View style={styles.heroStatusDot} />
                <Text style={styles.heroStatusText}>ACTIVE TRIP</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroDates}>
              {format(sDate, 'MMM d, yyyy')} — {format(eDate, 'MMM d, yyyy')}
            </Text>
            <Text style={styles.heroDuration}>
              {tripDays} Days •{' '}
              {daysLeft > 0 ? `${daysLeft} days remaining` : 'Trip completed'}
            </Text>

            {/* Executive Spent vs Budget Box */}
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>TOTAL SPENT</Text>
                <Text style={styles.heroStatValue}>
                  {cs}
                  {totalSpentBase.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.heroStatSub}>
                  {formatCurrency(totalSpentBase)} in {baseCurrency}
                </Text>
              </View>

              <View style={styles.heroStatDivider} />

              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>TRIP BUDGET</Text>
                <Text style={styles.heroStatValue}>
                  {totalBudget > 0
                    ? `${cs}${totalBudget.toLocaleString('en-IN')}`
                    : 'No Budget Set'}
                </Text>
                <Text style={styles.heroStatSub}>
                  {totalBudget > 0
                    ? `${formatCurrency(totalBudget)} allocated`
                    : 'Live tracking'}
                </Text>
              </View>
            </View>

            {totalBudget > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabelLeft}>
                    Budget Utilization
                  </Text>
                  <Text style={styles.progressLabelRight}>
                    {progressPercent.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={
                      isOverBudget
                        ? ['#EF4444', '#DC2626']
                        : ['#38BDF8', '#2563EB']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
              </View>
            )}
          </LinearGradient>

          {/* BENTO ITEM 2: 3 Quick Metric Tiles */}
          <View
            style={[
              styles.statsBentoContainer,
              isDesktop && styles.bentoRightColumn,
            ]}
          >
            <View
              style={[
                styles.bentoMetricTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View
                style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: '900', color: '#2563EB' }}
                >
                  {cs}
                </Text>
              </View>
              <View style={styles.metricTextContainer}>
                <Text
                  style={[
                    styles.quickStatLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Total Expenses
                </Text>
                <Text
                  style={[
                    styles.quickStatValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {formatCurrency(totalSpentBase)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.bentoMetricTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View
                style={[styles.statIconBadge, { backgroundColor: '#ECFEFF' }]}
              >
                <AppIcon name="calendar" size={16} color="#0891B2" />
              </View>
              <View style={styles.metricTextContainer}>
                <Text
                  style={[
                    styles.quickStatLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Trip Duration
                </Text>
                <Text
                  style={[
                    styles.quickStatValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {tripDays} Days
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.bentoMetricTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View
                style={[styles.statIconBadge, { backgroundColor: '#ECFDF5' }]}
              >
                <AppIcon name="credit-card" size={16} color="#059669" />
              </View>
              <View style={styles.metricTextContainer}>
                <Text
                  style={[
                    styles.quickStatLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Transactions Logged
                </Text>
                <Text
                  style={[
                    styles.quickStatValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {totalExpensesCount} Entries
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* BENTO BOTTOM ROW: Stops (Col 1), Payment Share (Col 2), Balances (Col 3 on wide, stacked on tablet) */}
        <View
          style={[
            styles.bentoBottomGrid,
            !isWideDesktop && styles.stackGridTablet,
          ]}
        >
          {/* BENTO TILE A: Spending By Stop */}
          <View
            style={[
              styles.bentoCardPanel,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Spending by Stop
              </Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>
                  {stops.length} STOPS
                </Text>
              </View>
            </View>

            <View style={styles.cardsList}>
              {stops.map((stop: any, index: number) => {
                const stopPercent =
                  totalSpentBase > 0
                    ? Math.round((stop.totalSpentBase / totalSpentBase) * 100)
                    : 0;

                return (
                  <View
                    key={stop.stopId || index}
                    style={[
                      styles.stopCardItem,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <View style={styles.stopTopRow}>
                      <View style={styles.stopEmojiBox}>
                        <Text style={styles.stopEmoji}>
                          {stop.emoji || '📍'}
                        </Text>
                      </View>
                      <View style={styles.stopInfo}>
                        <Text
                          style={[
                            styles.stopTitle,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {stop.name}
                        </Text>
                        <Text
                          style={[
                            styles.stopSub,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {stop.expenseCount || 0} expenses · {stop.currency}
                        </Text>
                      </View>
                      <View style={styles.stopAmountBox}>
                        <Text
                          style={[
                            styles.stopAmount,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {cs}
                          {stop.totalSpentBase.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.stopShareText}>
                          {stopPercent}% share
                        </Text>
                      </View>
                    </View>

                    <View style={styles.stopProgressTrack}>
                      <View
                        style={[
                          styles.stopProgressFill,
                          {
                            width: `${Math.max(stopPercent, 4)}%`,
                            backgroundColor: '#2563EB',
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* BENTO TILE B: Payment Distribution */}
          <View
            style={[
              styles.bentoCardPanel,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Payment Split
              </Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>
                  {members.length} CREW
                </Text>
              </View>
            </View>

            <View style={styles.multiColorBar}>
              {members.map((m: any, idx: number) => {
                const percent =
                  totalSpentBase > 0
                    ? Math.max(
                        2,
                        Math.round((m.totalPaidBase / totalSpentBase) * 100),
                      )
                    : 100 / members.length;
                return (
                  <View
                    key={m.userId || idx}
                    style={{
                      flex: percent,
                      height: '100%',
                      backgroundColor:
                        MEMBER_COLORS[idx % MEMBER_COLORS.length],
                    }}
                  />
                );
              })}
            </View>

            <View style={styles.memberShareList}>
              {members.map((m: any, idx: number) => {
                const percent =
                  totalSpentBase > 0
                    ? ((m.totalPaidBase / totalSpentBase) * 100).toFixed(1)
                    : '0.0';
                const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];

                return (
                  <View key={m.userId || idx} style={styles.memberShareRow}>
                    <View style={styles.memberShareLeft}>
                      <View
                        style={[styles.colorDot, { backgroundColor: color }]}
                      />
                      {m.photoURL ? (
                        <Image
                          source={{ uri: m.photoURL }}
                          style={styles.memberAvatarImg}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatarCircle,
                            { backgroundColor: color },
                          ]}
                        >
                          <Text style={styles.avatarInitial}>
                            {m.displayName[0]}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text
                          style={[
                            styles.memberNameText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {m.displayName}
                        </Text>
                        <Text
                          style={[
                            styles.memberRoleText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {m.role === 'admin' ? 'Trip Admin' : 'Member'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.memberShareRight}>
                      <Text
                        style={[
                          styles.memberPaidAmount,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {cs}
                        {m.totalPaidBase.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.memberPercentText}>{percent}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* BENTO TILE C: Net Balances & Settlements */}
          <View
            style={[
              styles.bentoCardPanel,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Net Balances
              </Text>
            </View>

            <View style={styles.cardsList}>
              {members.map((member: any, index: number) => {
                const isPositive = member.netBalance > 0;
                const isNegative = member.netBalance < 0;

                return (
                  <View
                    key={member.userId || index}
                    style={[
                      styles.balanceCardItem,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <View style={styles.balanceLeft}>
                      {member.photoURL ? (
                        <Image
                          source={{ uri: member.photoURL }}
                          style={styles.balanceAvatarImg}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatarCircle,
                            { backgroundColor: '#2563EB' },
                          ]}
                        >
                          <Text style={styles.avatarInitial}>
                            {member.displayName[0]}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text
                          style={[
                            styles.balanceName,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {member.displayName}
                        </Text>
                        <Text
                          style={[
                            styles.balanceSub,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Paid: {cs}
                          {member.totalPaidBase.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.balanceRight}>
                      <Text
                        style={[
                          styles.balanceNumber,
                          {
                            color: isPositive
                              ? '#10B981'
                              : isNegative
                                ? '#EF4444'
                                : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {isPositive ? '+' : isNegative ? '−' : ''}
                        {cs}
                        {Math.abs(member.netBalance).toLocaleString('en-IN')}
                      </Text>

                      <View
                        style={[
                          styles.balanceTag,
                          {
                            backgroundColor: isPositive
                              ? '#ECFDF5'
                              : isNegative
                                ? '#FEE2E2'
                                : '#F1F5F9',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.balanceTagText,
                            {
                              color: isPositive
                                ? '#059669'
                                : isNegative
                                  ? '#DC2626'
                                  : '#64748B',
                            },
                          ]}
                        >
                          {isPositive
                            ? 'Gets back'
                            : isNegative
                              ? 'Owes crew'
                              : 'Settled'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 24,
    gap: 12,
    maxWidth: 360,

    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
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
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBackBtn: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  errorBackBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',

    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
  },
  desktopHeaderBar: {
    maxWidth: 1300,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: 16,
    paddingBottom: 64,
  },
  desktopContent: {
    maxWidth: 1300,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },

  // Bento Structure
  bentoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  stackColumn: {
    flexDirection: 'column',
  },
  bentoHeroCard: {
    flex: 1.8,
    marginBottom: 0,
  },
  bentoRightColumn: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  statsBentoContainer: {
    gap: 12,
  },
  bentoMetricTile: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
  },
  metricTextContainer: {
    flex: 1,
  },

  // Bento Bottom Grid
  bentoBottomGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  stackGridTablet: {
    flexDirection: 'column',
  },
  bentoCardPanel: {
    flex: 1,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
  },

  // Hero Executive Card
  heroCard: {
    borderRadius: 24,
    padding: 26,
    marginBottom: 16,

    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.15)',
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

    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  heroStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  heroStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: -0.8,
  },
  heroDates: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 2,
  },
  heroDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: 18,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroStat: {
    flex: 1,
  },
  heroStatDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 14,
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
  },
  heroStatSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  progressContainer: {
    marginTop: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabelLeft: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  progressLabelRight: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },

  cardsList: {
    gap: 10,
  },

  // Stop Card item inside bento
  stopCardItem: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
  },
  stopTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stopEmojiBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopEmoji: {
    fontSize: 18,
  },
  stopInfo: {
    flex: 1,
  },
  stopTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  stopSub: {
    fontSize: 11,
    marginTop: 2,
  },
  stopAmountBox: {
    alignItems: 'flex-end',
  },
  stopAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  stopShareText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  stopProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(15,23,42,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 10,
  },
  stopProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Member Contribution
  multiColorBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 16,
  },
  memberShareList: {
    gap: 12,
  },
  memberShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberShareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  memberAvatarImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  memberNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  memberRoleText: {
    fontSize: 11,
  },
  memberShareRight: {
    alignItems: 'flex-end',
  },
  memberPaidAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  memberPercentText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  // Balance Card item inside bento
  balanceCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  balanceAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  balanceName: {
    fontSize: 13,
    fontWeight: '800',
  },
  balanceSub: {
    fontSize: 11,
    marginTop: 2,
  },
  balanceRight: {
    alignItems: 'flex-end',
  },
  balanceNumber: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  balanceTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  balanceTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
