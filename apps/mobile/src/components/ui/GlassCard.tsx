// src/components/ui/GlassCard.tsx
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ViewStyle,
  StyleProp,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import type { Theme } from '../../theme';

export type GlassCardVariant = 'subtle' | 'medium' | 'prominent' | 'soft';
export type GlassCardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: GlassCardVariant;
  padding?: GlassCardPadding;
  intensity?: number;
  warm?: boolean;
  pressable?: boolean;
  softMode?: boolean;
  onPress?: () => void;
  [key: string]: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  style,
  variant = 'medium',
  padding = 'md',
  intensity,
  warm = false,
  pressable = false,
  softMode = false,
  onPress,
  ...restProps
}: GlassCardProps) {
  const theme = useTheme();
  const { isDark, glass } = theme;

  // â”€â”€â”€ Metric Calculations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const blurAmount =
    intensity ??
    glass.blur ??
    (variant === 'subtle' ? 20 : variant === 'prominent' ? 60 : 40);

  const paddingMap: Record<GlassCardPadding, number> = {
    none: 0,
    xs: theme.spacing[2],
    sm: theme.spacing[3],
    md: theme.spacing[4],
    lg: theme.spacing[6],
    xl: theme.spacing[8],
  };
  const pad = paddingMap[padding];

  const flattenedStyle = useMemo(
    () => StyleSheet.flatten(style) || {},
    [style],
  );
  const effectiveRadius =
    (flattenedStyle as any).borderRadius ??
    glass.borderRadius ??
    theme.borderRadius['2xl'];

  // â”€â”€â”€ Color & Gradient Matrices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (warm) {
      return isDark
        ? ['rgba(212, 160, 60, 0.15)', 'rgba(212, 160, 60, 0.05)']
        : ['rgba(212, 160, 60, 0.20)', 'rgba(212, 160, 60, 0.05)'];
    }

    switch (variant) {
      case 'subtle':
        return isDark
          ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']
          : ['rgba(255, 255, 255, 0.40)', 'rgba(255, 255, 255, 0.15)'];
      case 'prominent':
        return isDark
          ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']
          : ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.45)'];
      case 'medium':
      default:
        return isDark
          ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.03)']
          : ['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.25)'];
    }
  };

  const getBorderColor = () => {
    if (isDark) return 'rgba(255, 255, 255, 0.08)';
    return variant === 'prominent'
      ? 'rgba(255, 255, 255, 0.8)'
      : 'rgba(0, 0, 0, 0.05)';
  };

  // â”€â”€â”€ Reanimated Interactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (!pressable) return;
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    opacity.value = withSpring(0.85);
  };

  const handlePressOut = () => {
    if (!pressable) return;
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    opacity.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const WrapperComponent = pressable ? AnimatedPressable : Animated.View;
  const wrapperProps = pressable
    ? {
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        onPress,
        style: [animatedStyle, style],
        ...restProps,
      }
    : { style, ...restProps };

  // â”€â”€â”€ RENDER: Soft Mode (Opaque Fallback) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (softMode) {
    return (
      <WrapperComponent
        {...wrapperProps}
        style={[
          {
            backgroundColor: theme.colors.surface,
            borderRadius: effectiveRadius,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            padding: pad,
            ...theme.shadows.sm,
          },
          wrapperProps.style,
        ]}
      >
        {children}
      </WrapperComponent>
    );
  }

  // â”€â”€â”€ RENDER: Web CSS Backdrop Filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (Platform.OS === 'web') {
    const baseBg = isDark
      ? 'rgba(15, 23, 42, 0.55)'
      : 'rgba(255, 255, 255, 0.45)';

    const webStyle: any = {
      borderRadius: effectiveRadius,
      borderWidth: 1,
      borderColor: getBorderColor(),

      background: isDark
        ? `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%), ${baseBg}`
        : `linear-gradient(145deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.30) 100%), ${baseBg}`,

      backdropFilter: `blur(${blurAmount}px) saturate(1.2)`,
      WebkitBackdropFilter: `blur(${blurAmount}px) saturate(1.2)`,

      ...Platform.select({
        web: {
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 8px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
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

      padding: pad,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    };

    return (
      <WrapperComponent
        {...wrapperProps}
        style={[webStyle, wrapperProps.style]}
      >
        {children}
      </WrapperComponent>
    );
  }

  // â”€â”€â”€ RENDER: Native BlurView â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <WrapperComponent
      {...wrapperProps}
      style={[
        {
          borderRadius: effectiveRadius,
          borderWidth: 1,
          borderColor: getBorderColor(),
          overflow: 'hidden',
          backgroundColor: isDark
            ? 'rgba(15, 23, 42, 0.3)'
            : 'rgba(255, 255, 255, 0.2)',
        },
        wrapperProps.style,
      ]}
    >
      <BlurView
        intensity={blurAmount}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />

      {/* Structural Tint Layer */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? 'rgba(0,0,0,0.2)'
              : 'rgba(255,255,255,0.3)',
          },
        ]}
        pointerEvents="none"
      />

      {/* Surface Gradient Reflection */}
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Content Container */}
      <View
        style={{
          padding: pad,
          width: '100%',
          ...(flattenedStyle.flex !== undefined
            ? { flex: flattenedStyle.flex }
            : {}),
        }}
      >
        {children}
      </View>
    </WrapperComponent>
  );
}
