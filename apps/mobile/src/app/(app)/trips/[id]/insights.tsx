import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import { useTheme } from '../../../../providers/ThemeProvider';
import { tripsApi } from '../../../../services/api';
import { mapInsightsToUI } from './insights/mapper';
import {
  TripIntelligenceUI,
  InsightCategoryUI,
  RecommendationUI,
  FunFactUI,
  InsightMemberUI,
} from './insights/models';

// ─── Sub-components ────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  color,
  icon,
  flex = 1,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
  flex?: number;
}) {
  const theme = useTheme();
  return (
    <View
      style={[chipStyles.wrap, { backgroundColor: theme.colors.surface, flex }]}
    >
      <View style={chipStyles.topRow}>
        <View style={[chipStyles.iconBox, { backgroundColor: color + '22' }]}>
          <AppIcon name={icon as any} size={14} color={color} />
        </View>
      </View>
      <Text style={[chipStyles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[chipStyles.value, { color: theme.colors.textPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: { borderRadius: 20, padding: 16, gap: 4 },
  topRow: { marginBottom: 8 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  value: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
});

function CategoryBar({ cat }: { cat: InsightCategoryUI }) {
  const theme = useTheme();
  return (
    <View style={barStyles.row}>
      <View
        style={[barStyles.rankBadge, { backgroundColor: cat.color + '22' }]}
      >
        <Text style={[barStyles.rankText, { color: cat.color }]}>
          #{cat.rank}
        </Text>
      </View>
      <View style={barStyles.info}>
        <View style={barStyles.topRow}>
          <Text
            style={[barStyles.name, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
          </Text>
          <Text style={[barStyles.pct, { color: cat.color }]}>
            {cat.pct.toFixed(1)}%
          </Text>
        </View>
        <View
          style={[
            barStyles.track,
            { backgroundColor: theme.colors.borderLight },
          ]}
        >
          <View
            style={[
              barStyles.fill,
              {
                width: `${Math.min(cat.pct, 100)}%` as any,
                backgroundColor: cat.color,
              },
            ]}
          />
        </View>
        <Text style={[barStyles.amount, { color: theme.colors.textSecondary }]}>
          {cat.formattedAmount}
        </Text>
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankText: { fontSize: 11, fontWeight: '900' },
  info: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: { fontSize: 13, fontWeight: '800', flex: 1 },
  pct: { fontSize: 12, fontWeight: '900', marginLeft: 8 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  amount: { fontSize: 11, fontWeight: '700', marginTop: 4 },
});

function RecommendationCard({
  rec,
  idx,
}: {
  rec: RecommendationUI;
  idx: number;
}) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(idx * 80).springify()}>
      <View
        style={[
          recStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight,
          },
        ]}
      >
        <View style={recStyles.topRow}>
          <View style={[recStyles.iconWrap, { backgroundColor: rec.bgColor }]}>
            <AppIcon name={rec.icon as any} size={16} color={rec.color} />
          </View>
          <View style={[recStyles.badge, { backgroundColor: rec.bgColor }]}>
            <Text style={[recStyles.badgeText, { color: rec.color }]}>
              {rec.label} Priority
            </Text>
          </View>
        </View>
        <Text style={[recStyles.message, { color: theme.colors.textPrimary }]}>
          {rec.message}
        </Text>
        {rec.detail ? (
          <Text
            style={[recStyles.detail, { color: theme.colors.textSecondary }]}
          >
            {rec.detail}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const recStyles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  message: { fontSize: 14, fontWeight: '800', lineHeight: 22, marginBottom: 6 },
  detail: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
});

function FunFactCard({ fact, idx }: { fact: FunFactUI; idx: number }) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(idx * 80 + 300).springify()}>
      <View
        style={[factStyles.card, { backgroundColor: theme.colors.primaryBg }]}
      >
        <Text style={factStyles.icon}>{fact.icon}</Text>
        <Text style={[factStyles.message, { color: theme.colors.primary }]}>
          {fact.message}
        </Text>
      </View>
    </Animated.View>
  );
}

const factStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: { fontSize: 24 },
  message: { fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 18 },
});

function SectionHeader({
  icon,
  title,
  color,
}: {
  icon: string;
  title: string;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={sectionStyles.header}>
      <View style={[sectionStyles.iconWrap, { backgroundColor: color + '22' }]}>
        <AppIcon name={icon as any} size={16} color={color} />
      </View>
      <Text style={[sectionStyles.title, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function TripInsightsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const { data: tripRes } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripsApi.getTrip(id as string),
  });

  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['trip-insights', id],
    queryFn: () => tripsApi.getInsights(id as string),
  });

  const totalBudget = tripRes?.data?.trip?.totalBudget || 0;
  const uiData: TripIntelligenceUI = useMemo(() => {
    return mapInsightsToUI(response?.data, theme, totalBudget);
  }, [response?.data, theme, totalBudget]);

  // ── loading ─────────────────────────────────────────
  if (isLoading && !(response as any)?.data) {
    return (
      <GlobalBackground>
        <View style={s.center}>
          <View
            style={[s.loadingBox, { backgroundColor: theme.colors.surface }]}
          >
            <GlobalLoader
              variant="inline"
              size="large"
              color={theme.colors.primary}
            />
            <Text
              style={[s.loadingText, { color: theme.colors.textSecondary }]}
            >
              Generating AI Insights…
            </Text>
          </View>
        </View>
      </GlobalBackground>
    );
  }

  if (error) {
    return (
      <GlobalBackground>
        <View style={s.center}>
          <AppIcon name="alert-circle" size={48} color={theme.colors.danger} />
          <Text style={[s.errorText, { color: theme.colors.textPrimary }]}>
            Could not load insights
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[s.retryBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={s.retryText}>Go Back</Text>
          </Pressable>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <GlobalBackground>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerBlurEffect: theme.isDark ? 'dark' : 'light',
          headerTintColor: theme.colors.textPrimary,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }: any) => [
                {
                  padding: 8,
                  marginLeft: Platform.OS === 'ios' ? 0 : 8,
                  borderRadius: 20,
                },
                pressed && { backgroundColor: theme.colors.borderLight },
              ]}
            >
              <AppIcon
                name="arrow-left"
                size={24}
                color={theme.colors.textPrimary}
              />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 80 },
          isDesktop && { maxWidth: 640, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* ── AI Header ── */}
        <Animated.View
          entering={FadeInUp.duration(500).springify()}
          style={s.hero}
        >
          <View style={s.heroInner}>
            <View
              style={[
                s.sparkBadge,
                { backgroundColor: theme.colors.primaryBg },
              ]}
            >
              <AppIcon name="zap" size={14} color={theme.colors.primary} />
              <Text style={[s.sparkText, { color: theme.colors.primary }]}>
                AI Trip Intelligence
              </Text>
            </View>
            <Text style={[s.heroTitle, { color: theme.colors.textPrimary }]}>
              Smart Insights
            </Text>
            <Text style={[s.heroSub, { color: theme.colors.textSecondary }]}>
              Real-time analysis of your travel spending, budget, members, and
              predictions.
            </Text>
          </View>
        </Animated.View>

        {!uiData.hasData ? (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <GlassCard intensity={theme.isDark ? 15 : 8} style={s.emptyCard}>
              <Text style={s.emptyEmoji}>✈️</Text>
              <Text style={[s.emptyTitle, { color: theme.colors.textPrimary }]}>
                No expenses yet.
              </Text>
              <Text
                style={[s.emptyDesc, { color: theme.colors.textSecondary }]}
              >
                Start adding expenses to unlock AI recommendations, forecasts,
                spending patterns, and budget predictions.
              </Text>
              <Pressable
                onPress={() =>
                  router.push(`/(app)/trips/${id}/expenses/new` as any)
                }
                style={[s.emptyBtn, { backgroundColor: theme.colors.primary }]}
              >
                <AppIcon name="plus" size={18} color="#fff" />
                <Text style={s.emptyBtnText}>Add First Expense</Text>
              </Pressable>
            </GlassCard>
          </Animated.View>
        ) : (
          <>
            {/* ── Trip Health Score ── */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <GlassCard
                intensity={theme.isDark ? 20 : 10}
                style={[
                  s.card,
                  { borderColor: uiData.healthColor + '40', borderWidth: 1 },
                ]}
              >
                <SectionHeader
                  icon="activity"
                  title="Trip Health"
                  color={uiData.healthColor}
                />
                <View style={s.healthRow}>
                  <View style={s.healthScoreBox}>
                    <Text
                      style={[s.healthScoreNum, { color: uiData.healthColor }]}
                    >
                      {uiData.healthScore}
                    </Text>
                    <Text
                      style={[
                        s.healthScoreMax,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      / 100
                    </Text>
                  </View>
                  <View style={s.healthInfo}>
                    <View
                      style={[
                        s.healthBadge,
                        { backgroundColor: uiData.healthBg },
                      ]}
                    >
                      <Text
                        style={[
                          s.healthBadgeText,
                          { color: uiData.healthColor },
                        ]}
                      >
                        {uiData.healthStatus}
                      </Text>
                    </View>
                    <Text
                      style={[
                        s.healthSummary,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {uiData.healthSummary}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Animated.View>

            {/* ── Forecast ── */}
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <GlassCard intensity={theme.isDark ? 15 : 8} style={s.card}>
                <SectionHeader
                  icon="trending-up"
                  title="Forecast"
                  color={theme.colors.info}
                />
                <View style={s.forecastRow}>
                  <View style={s.forecastLeft}>
                    <Text
                      style={[
                        s.forecastLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Estimated Final Cost
                    </Text>
                    <Text
                      style={[
                        s.forecastAmount,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {uiData.formattedFinalCost}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.statusBadge,
                      { backgroundColor: uiData.budgetStatusBg },
                    ]}
                  >
                    <Text
                      style={[
                        s.statusText,
                        { color: uiData.budgetStatusColor },
                      ]}
                    >
                      {uiData.budgetStatusLabel}
                    </Text>
                  </View>
                </View>
                {uiData.daysRemaining > 0 && (
                  <View
                    style={[
                      s.daysRow,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <AppIcon
                      name="clock"
                      size={14}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        s.daysText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      <Text
                        style={{
                          fontWeight: '800',
                          color: theme.colors.textPrimary,
                        }}
                      >
                        {uiData.daysRemaining}
                      </Text>{' '}
                      days remaining in trip
                    </Text>
                  </View>
                )}
              </GlassCard>
            </Animated.View>

            {/* ── Spending Patterns ── */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <View style={s.chipsGrid}>
                <StatChip
                  label="Daily Burn Rate"
                  value={uiData.formattedDailySpend}
                  color={theme.colors.purple}
                  icon="sun"
                  flex={1}
                />
                <View style={{ width: 12 }} />
                <StatChip
                  label="Peak Spend Day"
                  value={uiData.formattedMostExpensiveDay}
                  color={theme.colors.warm}
                  icon="calendar"
                  flex={1}
                />
              </View>
            </Animated.View>

            {/* ── Category Insights ── */}
            {uiData.categories.length > 0 && (
              <Animated.View entering={FadeInDown.delay(250).springify()}>
                <GlassCard intensity={theme.isDark ? 15 : 8} style={s.card}>
                  <SectionHeader
                    icon="pie-chart"
                    title="Category Insights"
                    color={theme.colors.secondary}
                  />
                  {uiData.categories.slice(0, 6).map(cat => (
                    <CategoryBar key={cat.category} cat={cat} />
                  ))}
                </GlassCard>
              </Animated.View>
            )}

            {/* ── Member Insights ── */}
            {uiData.topSpenders.length > 0 && (
              <Animated.View entering={FadeInDown.delay(300).springify()}>
                <GlassCard intensity={theme.isDark ? 15 : 8} style={s.card}>
                  <SectionHeader
                    icon="users"
                    title="Member Insights"
                    color={theme.colors.success}
                  />
                  {uiData.topSpenders.map((m: InsightMemberUI, i: number) => (
                    <View
                      key={m.userId || i}
                      style={[
                        s.memberRow,
                        {
                          borderBottomColor: theme.colors.borderLight,
                          borderBottomWidth:
                            i === uiData.topSpenders.length - 1 ? 0 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          s.memberAvatar,
                          { backgroundColor: m.color + '33' },
                        ]}
                      >
                        <Text style={[s.memberInitial, { color: m.color }]}>
                          {m.initial}
                        </Text>
                      </View>
                      <View style={s.memberInfo}>
                        <Text
                          style={[
                            s.memberName,
                            { color: theme.colors.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {m.displayName}
                        </Text>
                        {i === 0 && (
                          <Text
                            style={[
                              s.memberTag,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            Biggest Spender
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          s.memberAmt,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {m.formattedAmount}
                      </Text>
                    </View>
                  ))}
                </GlassCard>
              </Animated.View>
            )}

            {/* ── AI Recommendations ── */}
            {uiData.recommendations.length > 0 && (
              <Animated.View entering={FadeInDown.delay(350).springify()}>
                <Text
                  style={[s.sectionTitle, { color: theme.colors.textPrimary }]}
                >
                  AI Recommendations
                </Text>
                {uiData.recommendations.map((rec, idx) => (
                  <RecommendationCard key={rec.id} rec={rec} idx={idx} />
                ))}
              </Animated.View>
            )}

            {/* ── Fun Facts ── */}
            {uiData.funFacts.length > 0 && (
              <Animated.View entering={FadeInDown.delay(400).springify()}>
                <Text
                  style={[
                    s.sectionTitle,
                    { color: theme.colors.textPrimary, marginTop: 10 },
                  ]}
                >
                  Fun Facts
                </Text>
                {uiData.funFacts.map((fact, idx) => (
                  <FunFactCard key={fact.id} fact={fact} idx={idx} />
                ))}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </GlobalBackground>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  scroll: { paddingHorizontal: 20 },

  // Loading
  loadingBox: {
    width: 180,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },

  // Error
  errorText: { fontSize: 16, fontWeight: '800' },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  retryText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  // Hero
  hero: { marginBottom: 28 },
  heroInner: { paddingHorizontal: 4, gap: 12 },
  sparkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sparkText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  heroTitle: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2 },
  heroSub: { fontSize: 15, fontWeight: '500', lineHeight: 22 },

  // Card
  card: { padding: 22, marginBottom: 16, borderRadius: 28 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },

  // Trip Health
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  healthScoreBox: { flexDirection: 'row', alignItems: 'baseline' },
  healthScoreNum: { fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  healthScoreMax: { fontSize: 16, fontWeight: '700', marginLeft: 4 },
  healthInfo: { flex: 1, alignItems: 'flex-start', gap: 6 },
  healthBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  healthSummary: { fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // Forecast
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  forecastLeft: { flex: 1 },
  forecastLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  forecastAmount: { fontSize: 36, fontWeight: '900', letterSpacing: -1.5 },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
  },
  daysText: { fontSize: 13, fontWeight: '600' },

  // Chips
  chipsGrid: { flexDirection: 'row', marginBottom: 16 },

  // Member
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: { fontSize: 18, fontWeight: '900' },
  memberInfo: { flex: 1, justifyContent: 'center' },
  memberName: { fontSize: 15, fontWeight: '800' },
  memberTag: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  memberAmt: { fontSize: 16, fontWeight: '900' },

  // Empty State
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 28,
    gap: 12,
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '900' },
  emptyDesc: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
