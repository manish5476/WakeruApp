import React, { ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useResponsive } from '../theme/useResponsive';
import { colors, layout, spacing, typography } from '../theme/tokens';
import { WakeruLogo } from '../../ui/WakeruLogo';

interface OnboardingLayoutProps {
  eyebrow?: string;
  title: string;
  description: string;
  visual: ReactNode;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  progress?: ReactNode;
  backgroundVariant?: 'night' | 'glow';
  backgroundImage?: string;
  isFirstStep?: boolean;
}

export default function OnboardingLayout({
  eyebrow,
  title,
  description,
  visual,
  primaryAction,
  secondaryAction,
  progress,
  backgroundVariant = 'night',
  backgroundImage,
  _isFirstStep = false,
}: OnboardingLayoutProps) {
  const { isDesktop } = useResponsive();
  const insets = useSafeAreaInsets();

  // Unified Reanimated shared value for background zoom
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    if (backgroundImage) {
      scaleValue.value = withRepeat(
        withSequence(
          withTiming(1.08, {
            duration: 16000,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.quad) }),
        ),
        -1, // Infinite loop
        true, // Reverse on repeat
      );
    }

    return () => {
      cancelAnimation(scaleValue);
    };
  }, [backgroundImage, scaleValue]);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const scrimColors =
    backgroundVariant === 'glow'
      ? ([
          'transparent',
          'rgba(11,18,32,0.1)',
          'rgba(19,36,71,0.6)',
          'rgba(11,18,32,0.8)',
        ] as const)
      : ([
          'transparent',
          'rgba(11,18,32,0.1)',
          'rgba(11,18,32,0.5)',
          'rgba(11,18,32,0.85)',
        ] as const);

  const background = (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {backgroundImage ? (
        <>
          <Animated.Image
            source={{ uri: backgroundImage }}
            resizeMode="cover"
            style={[StyleSheet.absoluteFill, animatedImageStyle]}
          />
          <LinearGradient
            colors={scrimColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <LinearGradient
          colors={colors.gradientNight}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.fill}>
        {background}
        <ScrollView
          contentContainerStyle={styles.scrollGrow}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.desktopWrap}>
            <View style={styles.desktopLeft}>
              <Animated.View entering={FadeIn.delay(300).duration(800)}>
                {visual}
              </Animated.View>
            </View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(800)}
              style={styles.desktopRight}
            >
              <View style={styles.logoDesktop}>
                <WakeruLogo size={42} showText={true} />
              </View>
              {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
              <Text style={[styles.title, typography.heading.desktop]}>
                {title}
              </Text>
              <Text style={[styles.description, typography.body.desktop]}>
                {description}
              </Text>

              <View style={styles.actionsDesktop}>
                {primaryAction}
                {secondaryAction}
              </View>

              {progress && (
                <View style={styles.progressDesktop}>{progress}</View>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {background}

      {/* Top visual area */}
      <View
        style={[
          styles.mobileTopVisual,
          { paddingTop: Math.max(insets.top + 50, 80) },
        ]}
      >
        <Animated.View
          entering={FadeIn.delay(200).duration(800)}
          style={[
            styles.logoMobileWrap,
            { top: Math.max(insets.top + 24, 60) },
          ]}
        >
          <WakeruLogo size={36} showText={true} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(800).springify().damping(14)}
        >
          {visual}
        </Animated.View>
      </View>

      {/* Bottom text container with glass effect */}
      <View style={styles.bottomWrapper}>
        <BlurView
          tint="dark"
          intensity={50}
          style={[StyleSheet.absoluteFill, styles.glassBg]}
          experimentalBlurMethod="dimezisBlurView"
        />
        <LinearGradient
          colors={['rgba(11,18,32,0.4)', 'rgba(11,18,32,0.95)']}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          entering={FadeInDown.delay(400).duration(700).springify().damping(16)}
          style={[
            styles.mobileBottomContent,
            { paddingBottom: Math.max(insets.bottom + 34, 48) },
          ]}
        >
          {progress && <View style={styles.progressMobile}>{progress}</View>}
          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={[styles.title, typography.heading.mobile]}>{title}</Text>
          <Text style={[styles.description, typography.body.mobile]}>
            {description}
          </Text>

          <View style={styles.actionsMobile}>
            {primaryAction}
            {secondaryAction}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.brand.midnight,
  },
  scrollGrow: {
    flexGrow: 1,
  },

  // Desktop split
  desktopWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
    gap: spacing.xxxl,
  },
  desktopLeft: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopRight: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 480,
  },
  logoDesktop: {
    marginBottom: spacing.xl,
  },
  actionsDesktop: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    maxWidth: 420,
  },
  progressDesktop: {
    marginTop: spacing.xxl,
  },

  // Mobile layout
  logoMobileWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  mobileTopVisual: {
    flex: 1.2,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  bottomWrapper: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  glassBg: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  mobileBottomContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    minHeight: 320,
    justifyContent: 'flex-end',
  },
  progressMobile: {
    marginBottom: spacing.lg,
    paddingLeft: 2,
  },
  actionsMobile: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  // Shared text
  eyebrow: {
    ...typography.label,
    color: colors.brand.cyan,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textOnDark,
    marginBottom: spacing.md,
    fontWeight: '800',
  },
  description: {
    color: colors.textOnDarkMuted,
    maxWidth: 460,
    lineHeight: 24,
  },
});
