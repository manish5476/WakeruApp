// src/components/ui/Card.tsx
import React from 'react';
import {
  View,
  Pressable,
  ViewStyle,
  StyleProp,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard, GlassCardVariant } from './GlassCard';

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'glass';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /**
   * 'glass' uses the premium GlassCard primitive.
   * 'elevated' uses a solid card with theme shadows.
   * 'outlined' uses a solid card with border.
   * 'filled' uses a solid card with surface background.
   */
  variant?: CardVariant;
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  children,
  onPress,
  variant = 'elevated',
  padding,
  style,
}: CardProps) {
  const { isMobile } = useResponsive();
  const theme = useTheme();
  const cardPadding =
    padding ?? (isMobile ? theme.spacing.lg : theme.spacing.xl);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // If it's a glass card, we use our premium GlassCard primitive
  if (variant === 'glass') {
    return (
      <GlassCard
        variant="prominent"
        padding="lg"
        pressable={!!onPress}
        onPress={onPress}
        style={style}
      >
        {children}
      </GlassCard>
    );
  }

  // Standard Solid Cards
  const baseStyle: ViewStyle = {
    backgroundColor:
      variant === 'filled' ? theme.colors.surface : theme.colors.card,
    borderRadius: theme.borderRadius['2xl'],
    padding: cardPadding,
    ...(variant === 'elevated' ? theme.shadows.md : {}),
    ...(variant === 'outlined'
      ? { borderWidth: 1, borderColor: theme.colors.border }
      : {}),
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() =>
          (scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }))
        }
        onPressOut={() =>
          (scale.value = withSpring(1, { damping: 15, stiffness: 300 }))
        }
        style={[baseStyle, style, animatedStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}
