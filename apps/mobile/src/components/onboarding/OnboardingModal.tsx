// src/components/onboarding/OnboardingModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../providers/ThemeProvider';
import { storage } from '../../utils/storage';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import apiClient from '../../services/api/client';
import { router } from 'expo-router';

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  badge?: string;
  flowSteps?: string[];
  emoji?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to Wakeru',
    subtitle: 'Your Modern Travel & Expense Ledger',
    description:
      'Split expenses, manage your personal budget, and keep every trip financially organized in one place.',
    icon: 'compass',
    emoji: '✈️',
  },
  {
    title: 'Create a Trip',
    subtitle: 'Plan with your travel crew',
    description:
      'Create a trip, add destinations, set a group budget, invite friends, and coordinate trip members seamlessly.',
    icon: 'map-pin',
    emoji: '🗺️',
    flowSteps: [
      'Create Trip',
      'Invite Friends',
      'Set Budget',
      'Start Tracking',
    ],
  },
  {
    title: 'Add Expenses',
    subtitle: 'Log spend in any currency',
    description:
      'Record Food 🍽️, Stay 🏨, Transport 🚗, Activities 🎯, Shopping 🛍️, Healthcare 💊, and any shared expenses.',
    icon: 'credit-card',
    emoji: '💳',
  },
  {
    title: 'Split Expenses',
    subtitle: 'Smart automatic calculation',
    description:
      'Wakeru automatically calculates who owes whom based on the recorded expenses and selected split method.',
    icon: 'pie-chart',
    emoji: '⚖️',
    flowSteps: [
      'You paid ₹3,000',
      '3 people shared',
      'Shares calculated',
      'Balances updated',
    ],
  },
  {
    title: 'Settlement',
    subtitle: 'Minimum transfer paths',
    description:
      'View outstanding balances, request settlement, confirm payments via UPI, track status, and receive notifications.',
    icon: 'zap',
    emoji: '💸',
    flowSteps: [
      'Rahul owes ₹1,000',
      'Send Request',
      'Rahul Notified',
      'Payment Confirmed',
    ],
  },
  {
    title: 'Personal Finance',
    subtitle: 'Track beyond group trips',
    description:
      'Track personal expenses outside trips: budgets, categories, pace analytics, and comprehensive monthly reports.',
    icon: 'trending-up',
    emoji: '📊',
  },
  {
    title: 'Stay Updated',
    subtitle: 'Real-time sync & notifications',
    description:
      'Instant alerts for new expenses, settlement reminders, payment confirmations, and monthly reports. Customizable in Settings.',
    icon: 'bell',
    emoji: '🔔',
  },
  {
    title: "You're all set",
    subtitle: 'Ready to start your journey',
    description:
      'Start your first trip, add your expenses, invite your friends, and let Wakeru handle the math.',
    icon: 'check-circle',
    emoji: '🎉',
  },
];

export function OnboardingModal() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);

  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Robust check: only show if the user is truly new and has never completed or skipped onboarding
  useEffect(() => {
    if (!user) {
      setVisible(false);
      return;
    }

    const userId = user._id || (user as any).id;
    const localCompleted = storage.getBoolean('onboarding_completed');
    const userSpecificCompleted = userId
      ? storage.getBoolean(`onboarding_completed_${userId}`)
      : false;
    const backendCompleted = user.onboardingCompleted === true;

    // If already completed in any storage or on the user profile, never show
    if (localCompleted || userSpecificCompleted || backendCompleted) {
      setVisible(false);
      return;
    }

    // If the user already has trips, they are an existing user — auto-mark as completed
    const userTripCount =
      (user as any).tripCount ||
      (user as any).tripsCount ||
      user.stats?.totalGroups ||
      0;
    if (userTripCount > 0) {
      storage.setBoolean('onboarding_completed', true);
      if (userId) storage.setBoolean(`onboarding_completed_${userId}`, true);
      if (!user.onboardingCompleted) {
        setUser({ ...user, onboardingCompleted: true });
        apiClient
          .put('/users/profile', { onboardingCompleted: true })
          .catch(() => {});
      }
      setVisible(false);
      return;
    }

    // Only show if user is confirmed brand new and hasn't finished
    setVisible(true);
  }, [user, setUser]);

  const handleFinish = useCallback(
    async (actionDestination?: string) => {
      haptics.success();
      setVisible(false);

      const userId = user?._id || (user as any)?.id;

      // Save locally immediately
      storage.setBoolean('onboarding_completed', true);
      if (userId) {
        storage.setBoolean(`onboarding_completed_${userId}`, true);
      }

      // Update in-memory auth state
      if (user && !user.onboardingCompleted) {
        setUser({ ...user, onboardingCompleted: true });
      }

      // Sync to backend
      try {
        await apiClient.put('/users/profile', { onboardingCompleted: true });
      } catch {
        // Offline fallback: local storage already holds true
      }

      if (actionDestination) {
        router.push(actionDestination as any);
      }
    },
    [user, setUser],
  );

  const handleNext = () => {
    haptics.selection();
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    haptics.selection();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    haptics.light();
    handleFinish();
  };

  // Keyboard navigation on web
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, currentStep, handleNext, handleBack, handleSkip]);

  if (!visible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.08)',
              width: isDesktop ? 540 : '92%',
              maxWidth: 540,
            },
          ]}
        >
          {/* Top Bar: Step count & Skip */}
          <View style={styles.topBar}>
            <View style={styles.stepCounterPill}>
              <Text
                style={[
                  styles.stepCounterText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {currentStep + 1} of {ONBOARDING_STEPS.length}
              </Text>
            </View>

            <Pressable
              onPress={handleSkip}
              hitSlop={12}
              style={({ pressed }) => [
                styles.skipBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text
                style={[styles.skipText, { color: theme.colors.textTertiary }]}
              >
                Skip
              </Text>
            </Pressable>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressTrack}>
            {ONBOARDING_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor:
                      i <= currentStep
                        ? theme.colors.primary
                        : theme.isDark
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.08)',
                  },
                ]}
              />
            ))}
          </View>

          {/* Step Content */}
          <Animated.View
            key={currentStep}
            entering={SlideInRight.duration(260)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.contentWrap}
          >
            {/* Visual Icon Badge */}
            <View
              style={[
                styles.iconAura,
                { backgroundColor: theme.colors.primaryBg },
              ]}
            >
              <AppIcon
                name={step.icon as any}
                size={36}
                color={theme.colors.primary}
              />
            </View>

            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {step.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
              {step.subtitle}
            </Text>
            <Text
              style={[
                styles.description,
                { color: theme.colors.textSecondary },
              ]}
            >
              {step.description}
            </Text>

            {/* Optional Flow Badge */}
            {step.flowSteps && (
              <View
                style={[
                  styles.flowContainer,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.02)',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                  },
                ]}
              >
                {step.flowSteps.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <View style={styles.flowPill}>
                      <Text
                        style={[
                          styles.flowPillText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {item}
                      </Text>
                    </View>
                    {idx < step.flowSteps!.length - 1 && (
                      <AppIcon
                        name="arrow-right"
                        size={12}
                        color={theme.colors.textTertiary}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Action Footer */}
          <View style={[styles.footerRow, isLast && styles.footerRowLast]}>
            {!isLast && (
              <>
                {currentStep > 0 ? (
                  <Pressable
                    onPress={handleBack}
                    style={({ pressed }) => [
                      styles.backBtn,
                      { borderColor: theme.colors.borderLight },
                      pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <AppIcon
                      name="arrow-left"
                      size={16}
                      color={theme.colors.textPrimary}
                    />
                    <Text
                      style={[
                        styles.backBtnText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Back
                    </Text>
                  </Pressable>
                ) : (
                  <View style={{ width: 80 }} />
                )}
                <Pressable
                  onPress={handleNext}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: theme.colors.primary },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>Next</Text>
                  <AppIcon name="arrow-right" size={16} color="#FFFFFF" />
                </Pressable>
              </>
            )}

            {isLast && (
              <View style={styles.lastActionCluster}>
                <Pressable
                  onPress={() => handleFinish('/(app)/trips')}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    styles.primaryBtnFull,
                    { backgroundColor: theme.colors.primary },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>Get Started</Text>
                  <AppIcon name="arrow-right" size={16} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  onPress={() => handleFinish('/(app)/trips')}
                  style={({ pressed }) => [
                    styles.exploreBtn,
                    styles.exploreBtnFull,
                    { borderColor: theme.colors.borderLight },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.exploreBtnText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Explore Wakeru
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stepCounterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  stepCounterText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 24,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  contentWrap: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 280,
  },
  iconAura: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 420,
  },
  flowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  flowPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  flowPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  lastActionCluster: {
    width: '100%',
    gap: 10,
  },
  primaryBtnFull: {
    justifyContent: 'center',
    width: '100%',
  },
  exploreBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  exploreBtnFull: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerRowLast: {
    flexDirection: 'column',
    gap: 8,
  },
});
