// src/components/common/InstallPrompt.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { haptics } from '../../utils/haptics';
import AppIcon from './AppIcon';
import type { Theme } from '../../theme';

// --- Constants ---
const INSTALL_DELAY = 2500;
const DISMISS_DURATION = 300;
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 150,
};

interface InstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [installPromptEvent, setInstallPromptEvent] =
    useState<InstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // --- Animation Values ---
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const progress = useSharedValue(0);

  // --- Detect iOS Safari ---
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

    if (isIos && isSafari) {
      setIsIosSafari(true);
      const timer = setTimeout(() => {
        if (!isDismissed) {
          setIsVisible(true);
          animateIn();
        }
      }, INSTALL_DELAY);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as InstallPromptEvent;
      setInstallPromptEvent(event);
      if (!isDismissed) {
        setIsVisible(true);
        animateIn();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
    };
  }, [isDismissed]);

  // --- Animations ---
  const animateIn = () => {
    translateY.value = withSpring(0, SPRING_CONFIG);
    opacity.value = withTiming(1, { duration: DISMISS_DURATION });
    scale.value = withSpring(1, SPRING_CONFIG);
    progress.value = withTiming(1, { duration: 3000 });
  };

  const animateOut = (callback?: () => void) => {
    translateY.value = withTiming(100, { duration: DISMISS_DURATION });
    opacity.value = withTiming(0, { duration: DISMISS_DURATION });
    scale.value = withTiming(0.95, { duration: DISMISS_DURATION });
    progress.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      callback?.();
    }, DISMISS_DURATION + 50);
  };

  const handleDismiss = () => {
    haptics.light();
    setIsDismissed(true);
    animateOut(() => setIsVisible(false));
  };

  const handleInstall = () => {
    haptics.medium();

    if (!installPromptEvent) {
      setIsIosSafari(true);
      setIsVisible(true);
      return;
    }

    installPromptEvent.prompt();
    installPromptEvent.userChoice.then(choiceResult => {
      if (choiceResult.outcome === 'accepted') {
        haptics.success();
        animateOut(() => setIsVisible(false));
      } else {
        haptics.light();
        animateOut(() => setIsVisible(false));
      }
      setInstallPromptEvent(null);
    });
  };

  // --- Animated Styles ---
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // --- Render Logic ---
  if (!isVisible || Platform.OS !== 'web') return null;

  // --- iOS Safari Version ---
  if (isIosSafari) {
    return (
      <Animated.View style={[styles.iosWrapper, containerAnimatedStyle]}>
        <GlassCard
          variant="prominent"
          padding="lg"
          intensity={theme.isDark ? 45 : 30}
          style={styles.iosCard}
        >
          {/* Close Button */}
          <InteractiveWrapper
            onPress={handleDismiss}
            style={styles.closeButton}
          >
            <AppIcon name="x" size={16} color={theme.colors.textTertiary} />
          </InteractiveWrapper>

          {/* Icon AURA */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${theme.colors.primary}15` },
            ]}
          >
            <AppIcon name="smartphone" size={28} color={theme.colors.primary} />
          </View>

          {/* Title & Description */}
          <View style={styles.iosContent}>
            <Typography variant="h3" weight="extrabold" align="center" premium>
              Add to Home Screen
            </Typography>
            <Typography variant="bodySm" color="textSecondary" align="center">
              Install Wakeru for instant trip access, offline tracking, and a
              native app experience.
            </Typography>
          </View>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            <View
              style={[
                styles.step,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <AppIcon
                  name="share-2"
                  size={14}
                  color={theme.colors.primary}
                />
              </View>
              <Typography variant="caption" weight="bold" color="textSecondary">
                Tap Share
              </Typography>
            </View>

            <View style={styles.stepArrow}>
              <AppIcon
                name="arrow-right"
                size={14}
                color={theme.colors.textTertiary}
              />
            </View>

            <View
              style={[
                styles.step,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <AppIcon
                  name="plus-square"
                  size={14}
                  color={theme.colors.primary}
                />
              </View>
              <Typography variant="caption" weight="bold" color="textSecondary">
                Add to Home
              </Typography>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: theme.colors.primary },
                progressAnimatedStyle,
              ]}
            />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  // --- Desktop / Android Version ---
  return (
    <Animated.View style={[styles.wrapper, containerAnimatedStyle]}>
      <GlassCard
        variant="prominent"
        padding="md"
        intensity={theme.isDark ? 45 : 30}
        style={styles.card}
      >
        <View style={styles.content}>
          {/* Icon Section */}
          <View style={styles.iconSection}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: `${theme.colors.primary}15` },
              ]}
            >
              <AppIcon name="download" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.textSection}>
              <Typography variant="body" weight="extrabold">
                Install Wakeru App
              </Typography>
              <Typography variant="caption" color="textTertiary">
                Launch directly from your desktop or home screen
              </Typography>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Install"
              variant="primary"
              size="sm"
              onPress={handleInstall}
              style={styles.installButton}
            />
            <InteractiveWrapper
              onPress={handleDismiss}
              style={styles.dismissButton}
            >
              <Typography variant="caption" color="textTertiary" weight="bold">
                Later
              </Typography>
            </InteractiveWrapper>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary },
              progressAnimatedStyle,
            ]}
          />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// --- Styles ---
function createStyles(theme: Theme) {
  return StyleSheet.create({
    // iOS Safari Styles
    iosWrapper: {
      position: 'absolute',
      bottom: 30,
      left: 20,
      right: 20,
      zIndex: 1000,
      alignItems: 'center',
    },
    iosCard: {
      width: '100%',
      maxWidth: 380,
      borderRadius: 24,
      padding: 22,
      position: 'relative',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(15,23,42,0.06)',

      ...Platform.select({
        web: {
          boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
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
    closeButton: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
      zIndex: 1,
    },
    iconContainer: {
      width: 58,
      height: 58,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      alignSelf: 'center',
      borderWidth: 1.5,
      borderColor: `${theme.colors.primary}30`,
    },
    iosContent: {
      gap: 6,
      marginBottom: 18,
    },
    stepsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 18,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.04)',
    },
    stepIcon: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepArrow: {
      opacity: 0.5,
    },

    // Desktop/Android Styles
    wrapper: {
      position: 'absolute',
      bottom: 24,
      left: 20,
      right: 20,
      zIndex: 1000,
      maxWidth: 460,
      alignSelf: 'center',
    },
    card: {
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(15,23,42,0.06)',

      ...Platform.select({
        web: {
          boxShadow: '0 16px 36px rgba(0,0,0,0.2)',
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

      gap: 10,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    iconSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    iconWrapper: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
    },
    textSection: {
      flex: 1,
      gap: 1,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    installButton: {
      minWidth: 74,
    },
    dismissButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
    },

    // Progress Bar
    progressTrack: {
      height: 2.5,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(15,23,42,0.06)',
      borderRadius: 1.25,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 1.25,
    },
  });
}

// --- Add TypeScript support for window events ---
declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event;
  }
}
