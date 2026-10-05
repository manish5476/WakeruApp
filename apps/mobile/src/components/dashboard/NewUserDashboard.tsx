import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { ProgressBar } from '../ui/ProgressBar';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { ChecklistItem } from '../../hooks/useUserJourneyState';

interface NewUserDashboardProps {
  firstName: string;
  checklist: ChecklistItem[];
  completedCount: number;
  totalChecklistCount: number;
  progressPercent: number;
  hasTrips?: boolean;
  onDismiss?: () => void;
}

export function NewUserDashboard({
  firstName,
  checklist,
  completedCount,
  totalChecklistCount,
  progressPercent,
  hasTrips = false,
  onDismiss,
}: NewUserDashboardProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const handleAction = (route?: string) => {
    haptics.light();
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      {/* ── 1. WELCOME HERO SECTION ─────────────────────────── */}
      <Animated.View entering={FadeInDown.duration(400).springify()}>
        <GlassCard
          variant="prominent"
          padding="none"
          style={[
            styles.heroCard,
            {
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.4)',
              backgroundColor: theme.isDark
                ? 'rgba(15, 23, 42, 0.75)'
                : 'rgba(255, 255, 255, 0.85)',
            },
          ]}
        >
          <LinearGradient
            colors={
              theme.isDark
                ? ['rgba(37, 99, 235, 0.15)', 'rgba(56, 189, 248, 0.03)']
                : ['rgba(37, 99, 235, 0.06)', 'rgba(255, 255, 255, 0)']
            }
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <AppIcon name="sparkles" size={13} color="#2563EB" />
                <Text style={styles.heroBadgeText}>WELCOME TO WAKERU</Text>
              </View>

              <Text
                style={[styles.heroTitle, { color: theme.colors.textPrimary }]}
              >
                Welcome, {firstName} 👋
              </Text>

              <Text
                style={[
                  styles.heroDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Split expenses. Manage your money. Travel without the confusion.
                {'\n'}
                Everything you spend with friends stays organized in one place.
              </Text>
            </View>
          </LinearGradient>
        </GlassCard>
      </Animated.View>

      {/* ── 2. PRIMARY 3 ACTIONS (ONE OBVIOUS NEXT STEP) ─────── */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400).springify()}
        style={styles.section}
      >
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Get Started
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: theme.colors.textTertiary },
            ]}
          >
            Choose what you'd like to do first
          </Text>
        </View>

        <View
          style={[styles.actionGrid, isDesktop && styles.actionGridDesktop]}
        >
          {/* Action 1: Create a Trip (Primary) */}
          <GlassCard
            pressable
            onPress={() => handleAction('/create-trip')}
            style={[
              styles.primaryActionCard,
              { borderColor: theme.colors.primary },
            ]}
            padding="none"
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryActionInner}
            >
              <View style={styles.primaryActionTop}>
                <View style={styles.primaryIconWrap}>
                  <AppIcon name="plus" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.highlightPill}>
                  <Text style={styles.highlightPillText}>RECOMMENDED</Text>
                </View>
              </View>

              <View style={styles.primaryActionTextWrap}>
                <Text style={styles.primaryActionTitle}>Create a Trip</Text>
                <Text style={styles.primaryActionSub}>
                  Plan a trip, invite companions, and track group spending
                </Text>
              </View>
            </LinearGradient>
          </GlassCard>

          {/* Action 2: Join a Trip */}
          <GlassCard
            pressable
            onPress={() => handleAction('/(app)/trips/join')}
            style={styles.actionCard}
            padding="none"
          >
            <View style={styles.actionCardInner}>
              <View style={[styles.iconBox, { backgroundColor: '#EDE9FE' }]}>
                <AppIcon name="user-plus" size={18} color="#7C3AED" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text
                  style={[
                    styles.actionTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Join a Trip
                </Text>
                <Text
                  style={[
                    styles.actionSub,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Have an 8-character invite code? Join your group instantly
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Action 3: Add an Expense */}
          <GlassCard
            pressable
            onPress={() => handleAction('/create-trip')}
            style={styles.actionCard}
            padding="none"
          >
            <View style={styles.actionCardInner}>
              <View style={[styles.iconBox, { backgroundColor: '#FFE4E6' }]}>
                <AppIcon name="receipt" size={18} color="#F43F5E" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text
                  style={[
                    styles.actionTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Add an Expense
                </Text>
                <Text
                  style={[
                    styles.actionSub,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Log a bill, restaurant split, or hotel payment
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </Animated.View>

      {/* ── 3. GET STARTED CHECKLIST ────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(400).springify()}
        style={styles.section}
      >
        <GlassCard
          style={styles.checklistCard}
          intensity={theme.isDark ? 22 : 35}
        >
          <View style={styles.checklistHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.checklistTagRow}>
                <AppIcon
                  name="list-checks"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.checklistTag, { color: theme.colors.primary }]}
                >
                  ONBOARDING CHECKLIST
                </Text>
              </View>
              <Text
                style={[
                  styles.checklistTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Your First Steps
              </Text>
            </View>

            <View style={styles.progressBadge}>
              <Text
                style={[
                  styles.progressBadgeText,
                  { color: theme.colors.primary },
                ]}
              >
                {completedCount} / {totalChecklistCount} completed
              </Text>
            </View>
          </View>

          <View style={styles.progressBarWrap}>
            <ProgressBar
              progress={progressPercent / 100}
              height={6}
              variant="accent"
              animated
            />
          </View>

          <View style={styles.checklistItemsList}>
            {checklist.map((item, index) => {
              const isItemCompleted = item.completed;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => item.route && handleAction(item.route)}
                  disabled={isItemCompleted || !item.route}
                  style={({ pressed }) => [
                    styles.checklistItemRow,
                    index < checklist.length - 1 && styles.checklistItemBorder,
                    {
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      isItemCompleted
                        ? { backgroundColor: '#10B981', borderColor: '#10B981' }
                        : {
                            borderColor: theme.isDark
                              ? 'rgba(255,255,255,0.3)'
                              : 'rgba(0,0,0,0.2)',
                          },
                    ]}
                  >
                    {isItemCompleted ? (
                      <AppIcon name="check" size={12} color="#FFFFFF" />
                    ) : (
                      <View style={styles.pendingDot} />
                    )}
                  </View>

                  <View style={styles.checkTextWrap}>
                    <Text
                      style={[
                        styles.checkTitle,
                        { color: theme.colors.textPrimary },
                        isItemCompleted && styles.checkTitleCompleted,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.checkSubtitle,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>

                  {!isItemCompleted && item.route && (
                    <View style={styles.actionArrow}>
                      <AppIcon
                        name="chevron-right"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {(hasTrips || completedCount >= 2 || onDismiss) && (
            <Pressable
              onPress={() => {
                haptics.medium();
                if (onDismiss) {
                  onDismiss();
                } else {
                  router.push('/(app)/(tabs)/home' as any);
                }
              }}
              style={({ pressed }) => [
                styles.graduateButton,
                {
                  backgroundColor: theme.colors.primaryBg,
                  borderColor: theme.colors.primaryBorder,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text
                style={[
                  styles.graduateButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                {completedCount >= totalChecklistCount
                  ? '🎉 Onboarding Complete — View Dashboard'
                  : 'Explore Full Dashboard'}
              </Text>
              <AppIcon
                name="arrow-right"
                size={14}
                color={theme.colors.primary}
              />
            </Pressable>
          )}
        </GlassCard>
      </Animated.View>

      {/* ── 4. WHAT YOU CAN DO WITH WAKERU ──────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(400).springify()}
        style={styles.section}
      >
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            What You Can Do With Wakeru
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: theme.colors.textTertiary },
            ]}
          >
            Designed to make shared finances completely effortless
          </Text>
        </View>

        <View
          style={[styles.featuresGrid, isDesktop && styles.featuresGridDesktop]}
        >
          <GlassCard
            style={styles.featureTile}
            intensity={theme.isDark ? 16 : 25}
          >
            <View
              style={[styles.featureIconWrap, { backgroundColor: '#EFF6FF' }]}
            >
              <AppIcon name="split" size={20} color="#2563EB" />
            </View>
            <Text
              style={[styles.featureTitle, { color: theme.colors.textPrimary }]}
            >
              Trip Splitting
            </Text>
            <Text
              style={[
                styles.featureDesc,
                { color: theme.colors.textSecondary },
              ]}
            >
              Split shared expenses equally, unequally, or by percentages
              without complicated math.
            </Text>
          </GlassCard>

          <GlassCard
            style={styles.featureTile}
            intensity={theme.isDark ? 16 : 25}
          >
            <View
              style={[styles.featureIconWrap, { backgroundColor: '#ECFDF5' }]}
            >
              <AppIcon name="wallet" size={20} color="#059669" />
            </View>
            <Text
              style={[styles.featureTitle, { color: theme.colors.textPrimary }]}
            >
              Personal Finance
            </Text>
            <Text
              style={[
                styles.featureDesc,
                { color: theme.colors.textSecondary },
              ]}
            >
              Track your daily personal budgets, recurring bills, and spending
              timeline.
            </Text>
          </GlassCard>

          <GlassCard
            style={styles.featureTile}
            intensity={theme.isDark ? 16 : 25}
          >
            <View
              style={[styles.featureIconWrap, { backgroundColor: '#FEF3C7' }]}
            >
              <AppIcon name="circle-check" size={20} color="#D97706" />
            </View>
            <Text
              style={[styles.featureTitle, { color: theme.colors.textPrimary }]}
            >
              Smart Settlements
            </Text>
            <Text
              style={[
                styles.featureDesc,
                { color: theme.colors.textSecondary },
              ]}
            >
              See who owes whom and simplify debts into the minimum number of
              total payments.
            </Text>
          </GlassCard>

          <GlassCard
            style={styles.featureTile}
            intensity={theme.isDark ? 16 : 25}
          >
            <View
              style={[styles.featureIconWrap, { backgroundColor: '#EDE9FE' }]}
            >
              <AppIcon name="plane" size={20} color="#7C3AED" />
            </View>
            <Text
              style={[styles.featureTitle, { color: theme.colors.textPrimary }]}
            >
              Group Travel
            </Text>
            <Text
              style={[
                styles.featureDesc,
                { color: theme.colors.textSecondary },
              ]}
            >
              Keep trips, multi-currency expenses, and travel friends together
              seamlessly.
            </Text>
          </GlassCard>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 20,
  },
  desktopContainer: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  heroGradient: {
    width: '100%',
  },
  heroContent: {
    padding: 24,
    gap: 10,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Sections
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Action Grid
  actionGrid: {
    gap: 12,
  },
  actionGridDesktop: {
    flexDirection: 'row',
  },
  primaryActionCard: {
    flex: 1.2,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 20px rgba(37, 99, 235, 0.25)' } as any,
    }),
  },
  primaryActionInner: {
    padding: 20,
    gap: 14,
    height: '100%',
    justifyContent: 'space-between',
  },
  primaryActionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  highlightPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  primaryActionTextWrap: {
    gap: 4,
  },
  primaryActionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  primaryActionSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },

  actionCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionCardInner: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: '100%',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  actionSub: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },

  // Checklist
  checklistCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  checklistTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  checklistTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  checklistTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarWrap: {
    marginVertical: 2,
  },
  checklistItemsList: {
    gap: 2,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  checklistItemBorder: {
    borderBottomWidth: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  checkTextWrap: {
    flex: 1,
    gap: 2,
  },
  checkTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  checkTitleCompleted: {
    opacity: 0.6,
  },
  checkSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionArrow: {
    paddingLeft: 4,
  },

  // Features Grid
  featuresGrid: {
    gap: 12,
  },
  featuresGridDesktop: {
    flexDirection: 'row',
  },
  featureTile: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  featureDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  graduateButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  graduateButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
