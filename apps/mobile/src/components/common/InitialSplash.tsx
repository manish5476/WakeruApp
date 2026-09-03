// src/components/common/InitialSplash.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  AccessibilityInfo,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from './AppIcon';

import type { Theme } from '../../theme';

// ─── Constants ───────────────────────────────────────────────
const { width, height } = Dimensions.get('window');

const SPLASH_BG =
  'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=2070&auto=format&fit=crop';

const LOADING_MESSAGES = [
  'Preparing your adventure...',
  'Syncing your trips...',
  'Calculating balances...',
  'Loading bookings...',
  'Organizing memories...',
];

const MESSAGE_INTERVAL_MS = 2200;
const MESSAGE_FADE_MS = 350;

const EASE_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.55, 1);

// ─── Cinematic Animated Background ───────────────────────────
function AnimatedBackground({
  reduceMotion,
  isDark,
  onLoaded,
}: {
  reduceMotion: boolean;
  isDark: boolean;
  onLoaded?: () => void;
}) {
  const bgScale = useRef(new Animated.Value(1.15)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!reduceMotion) {
      Animated.timing(bgScale, {
        toValue: 1.0,
        duration: 14000,
        easing: EASE_OUT_EXPO,
        useNativeDriver: true,
      }).start();
    }
  }, [reduceMotion, bgScale]);

  return (
    <>
      <Animated.Image
        source={{ uri: SPLASH_BG }}
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ scale: bgScale }], opacity: bgOpacity },
        ]}
        resizeMode="cover"
        onLoad={() => {
          Animated.timing(bgOpacity, {
            toValue: 1,
            duration: 800,
            easing: EASE_OUT_EXPO,
            useNativeDriver: true,
          }).start();
          onLoaded?.();
        }}
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={[
          isDark ? 'rgba(9, 9, 11, 0.3)' : 'rgba(0, 0, 0, 0.15)',
          isDark ? 'rgba(9, 9, 11, 0.85)' : 'rgba(0, 0, 0, 0.65)',
          isDark ? 'rgba(9, 9, 11, 0.98)' : 'rgba(0, 0, 0, 0.9)',
        ]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}

// ─── Professional Logo Mark with Ring Pulse ───────────────────
function LogoMark({
  theme,
  reduceMotion,
}: {
  theme: Theme;
  reduceMotion: boolean;
}) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotateVal = useRef(new Animated.Value(0)).current;
  const pulseRing = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        easing: EASE_OUT_EXPO,
        useNativeDriver: true,
      }),
      Animated.timing(rotateVal, {
        toValue: 1,
        duration: 1000,
        easing: EASE_OUT_EXPO,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (reduceMotion) return;

      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseRing, {
              toValue: 1.35,
              duration: 2400,
              easing: EASE_OUT_EXPO,
              useNativeDriver: true,
            }),
            Animated.timing(pulseRing, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ringOpacity, {
              toValue: 0.4,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity, {
              toValue: 0,
              duration: 2200,
              easing: EASE_OUT_EXPO,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    });
  }, [reduceMotion, scale, opacity, rotateVal, pulseRing, ringOpacity]);

  const spin = rotateVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });

  return (
    <View style={splashStyles(theme).logoContainer}>
      {!reduceMotion && (
        <Animated.View
          style={[
            splashStyles(theme).pulseRingStyle,
            {
              borderColor: theme.colors.secondary,
              transform: [{ scale: pulseRing }],
              opacity: ringOpacity,
              borderRadius: theme.borderRadius['3xl'],
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          splashStyles(theme).logoWrapper,
          {
            opacity,
            transform: [{ scale }, { rotate: spin }],
          },
        ]}
      >
        <LinearGradient
          colors={theme.gradients.primary as readonly [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            splashStyles(theme).logoBox,
            { borderRadius: theme.borderRadius['2xl'] },
            theme.shadows.xl,
          ]}
        >
          <AppIcon
            name="map"
            size={theme.icon['2xl']}
            color={theme.colors.textInverse}
          />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ─── Staggered Brand Typography ──────────────────────────────
function BrandContent({ theme }: { theme: Theme }) {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 700,
          delay: 250,
          easing: EASE_OUT_EXPO,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 700,
          delay: 250,
          easing: EASE_OUT_EXPO,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 500,
          easing: EASE_OUT_EXPO,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [titleOpacity, titleTranslateY, badgeOpacity, badgeScale]);

  return (
    <View style={splashStyles(theme).textWrapper}>
      <Animated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslateY }],
        }}
      >
        <Typography
          variant="display"
          weight="extrabold"
          color="textInverse"
          align="center"
          style={{ letterSpacing: -1.5, marginBottom: theme.spacing.md }}
          accessibilityRole="header"
          premium
        >
          Wakeru
        </Typography>
      </Animated.View>

      <Animated.View
        style={{
          opacity: badgeOpacity,
          transform: [{ scale: badgeScale }],
        }}
      >
        <GlassCard
          variant="subtle"
          padding="sm"
          intensity={45}
          style={{
            borderRadius: theme.borderRadius.full,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.xl,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(15, 23, 42, 0.06)',

            ...Platform.select({
              web: {
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
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
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.xs,
              marginBottom: 2,
            }}
          >
            <AppIcon
              name="star"
              size={theme.icon.xl}
              color={theme.colors.secondary}
            />
            <Typography
              variant="caption"
              weight="extrabold"
              color="textSecondary"
              style={{ letterSpacing: 2, fontSize: 10 }}
            >
              PREMIUM
            </Typography>
          </View>
          <Typography
            variant="bodySm"
            weight="semibold"
            color="textInverse"
            style={{ letterSpacing: 0.4 }}
          >
            Travel Smarter Together
          </Typography>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

// ─── Fluid Loading State with Animated Track Progress ─────────
function LoadingIndicator({
  theme,
  reduceMotion,
  bottomOffset,
}: {
  theme: Theme;
  reduceMotion: boolean;
  bottomOffset: number;
}) {
  const [messageIndex, setMessageIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const mountOpacity = useRef(new Animated.Value(0)).current;

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountOpacity, {
      toValue: 1,
      duration: 600,
      delay: 500,
      easing: EASE_OUT_EXPO,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [mountOpacity, progressAnim]);

  useEffect(() => {
    if (reduceMotion) {
      const cycle = setInterval(() => {
        setMessageIndex(i => (i + 1) % LOADING_MESSAGES.length);
      }, MESSAGE_INTERVAL_MS);
      return () => clearInterval(cycle);
    }

    let isMounted = true;
    const cycle = setInterval(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: MESSAGE_FADE_MS,
          easing: EASE_IN_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -8,
          duration: MESSAGE_FADE_MS,
          easing: EASE_IN_OUT,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isMounted) return;
        setMessageIndex(i => (i + 1) % LOADING_MESSAGES.length);
        translateY.setValue(8);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: MESSAGE_FADE_MS,
            easing: EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: MESSAGE_FADE_MS,
            easing: EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, MESSAGE_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(cycle);
    };
  }, [reduceMotion, opacity, translateY]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        splashStyles(theme).loadingWrapper,
        { opacity: mountOpacity, bottom: bottomOffset },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View
        style={[
          splashStyles(theme).progressTrack,
          { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
        ]}
      >
        <Animated.View
          style={[
            splashStyles(theme).progressBar,
            {
              backgroundColor: theme.colors.secondary,
              width: progressBarWidth,
            },
          ]}
        />
      </View>

      <Animated.Text
        style={[
          splashStyles(theme).loadingText,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        {LOADING_MESSAGES[messageIndex]}
      </Animated.Text>
    </Animated.View>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function InitialSplash() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let subscription: { remove: () => void } | undefined;

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(setReduceMotion)
      .catch(() => {});

    subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  const bottomOffset = useMemo(
    () => theme.spacing['5xl'] + insets.bottom,
    [theme.spacing, insets.bottom],
  );

  return (
    <View
      style={[
        splashStyles(theme).container,
        { backgroundColor: theme.colors.background },
      ]}
      accessibilityLabel="Wakeru is loading"
    >
      <StatusBar style="light" />

      <AnimatedBackground reduceMotion={reduceMotion} isDark={theme.isDark} />

      <View style={splashStyles(theme).centerContent}>
        <LogoMark theme={theme} reduceMotion={reduceMotion} />
        <BrandContent theme={theme} />
      </View>

      <LoadingIndicator
        theme={theme}
        reduceMotion={reduceMotion}
        bottomOffset={bottomOffset}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
function splashStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      width,
      height,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    centerContent: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingHorizontal: 24,
      zIndex: 10,
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
    },
    pulseRingStyle: {
      position: 'absolute',
      width: 110,
      height: 110,
      borderWidth: 1.5,
    },
    logoWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoBox: {
      width: 92,
      height: 92,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrapper: {
      alignItems: 'center',
    },
    loadingWrapper: {
      position: 'absolute',
      width: '80%',
      maxWidth: 280,
      alignItems: 'center',
      zIndex: 10,
    },
    progressTrack: {
      width: '100%',
      height: 3,
      borderRadius: 1.5,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressBar: {
      height: '100%',
      borderRadius: 1.5,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
  });
}
