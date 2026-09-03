import React, { useEffect, useState, useCallback } from 'react';
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useIsMutating } from '@tanstack/react-query';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { useAppTheme } from '../theme/ThemeProvider';
import { GlassCard } from './GlassCard';
import { Typography } from './Typography';
import AppIcon from './AppIcon';

const TRIP_ICONS = ['map', 'banknote', 'users', 'plane', 'receipt'] as const;

type GlobalLoaderProps = {
  visible?: boolean;
  trackMutations?: boolean;
  message?: string;
  size?: 'small' | 'large' | number;
  color?: ColorValue;
  variant?: 'fullscreen' | 'inline';
  style?: StyleProp<ViewStyle>;
};

function AnimatedRotatingIcon({
  icon,
  size,
  color,
}: {
  icon: string;
  size: number;
  color: ColorValue;
}) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(0.75, { damping: 14, stiffness: 280 }, () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 280 });
    });
    rotation.value = withSpring(rotation.value + 360, {
      damping: 18,
      stiffness: 150,
    });
  }, [icon]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AppIcon name={icon} size={size} color={color as string} />
    </Animated.View>
  );
}

export default function GlobalLoader({
  visible,
  trackMutations = false,
  message,
  size = 'large',
  color,
  variant = 'fullscreen',
  style,
}: GlobalLoaderProps) {
  const theme = useAppTheme();
  const mutationCount = useIsMutating();
  const [iconIndex, setIconIndex] = useState(0);

  const resolvedVisible =
    visible ?? (trackMutations ? mutationCount > 0 : true);
  const resolvedSize =
    typeof size === 'number' ? size : size === 'small' ? 18 : 28;
  const resolvedMessage = message;

  const masterClock = useSharedValue(0);

  useEffect(() => {
    if (!resolvedVisible) {
      cancelAnimation(masterClock);
      masterClock.value = 0;
      return;
    }

    masterClock.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(masterClock);
    };
  }, [resolvedVisible]);

  const updateIconIndex = useCallback(() => {
    setIconIndex(prev => (prev + 1) % TRIP_ICONS.length);
  }, []);

  useDerivedValue(() => {
    if (masterClock.value >= 0.95) {
      runOnJS(updateIconIndex)();
    }
  }, [masterClock, updateIconIndex]);

  if (!resolvedVisible) return null;

  const iconColor = (color ?? theme.colors.primary) as ColorValue;

  const innerContent = (
    <>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            width: resolvedSize * 2.4,
            height: resolvedSize * 2.4,
            borderRadius: resolvedSize * 1.2,
            backgroundColor: `${theme.colors.primary}15`,
            borderColor: `${theme.colors.primary}30`,
          },
        ]}
      >
        <AnimatedRotatingIcon
          icon={TRIP_ICONS[iconIndex] || 'map'}
          size={resolvedSize}
          color={iconColor}
        />
      </Animated.View>

      {resolvedMessage ? (
        <Typography
          variant="bodySm"
          weight="extrabold"
          color="textPrimary"
          align="center"
          style={{ marginTop: 12, letterSpacing: -0.2 }}
        >
          {resolvedMessage}
        </Typography>
      ) : null}
    </>
  );

  const content =
    variant === 'fullscreen' ? (
      <GlassCard
        variant="prominent"
        padding="lg"
        intensity={theme.isDark ? 45 : 30}
        style={styles.fullscreenCard}
      >
        {innerContent}
      </GlassCard>
    ) : (
      <View style={styles.content}>{innerContent}</View>
    );

  if (variant === 'inline') {
    return <View style={[styles.inline, style]}>{content}</View>;
  }

  return (
    <View style={[styles.overlay, style]} pointerEvents="auto">
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: theme.isDark
              ? 'rgba(15, 23, 42, 0.75)'
              : 'rgba(255, 255, 255, 0.75)',
          },
        ]}
      />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenCard: {
    minWidth: 180,
    paddingHorizontal: 28,
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
