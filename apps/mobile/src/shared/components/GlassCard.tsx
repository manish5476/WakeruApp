import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '../theme/ThemeProvider';

let LinearGradientComponent: React.ComponentType<any> | null = null;
try {
  LinearGradientComponent = require('react-native-linear-gradient').default;
} catch {
  LinearGradientComponent = null;
}

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
  const theme = useAppTheme();
  const { isDark, glass } = theme;

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

  const surfaceBg = isDark
    ? 'rgba(24, 24, 27, 0.72)'
    : 'rgba(255, 255, 255, 0.75)';

  return (
    <WrapperComponent
      {...wrapperProps}
      style={[
        {
          borderRadius: effectiveRadius,
          borderWidth: 1,
          borderColor: getBorderColor(),
          overflow: 'hidden',
          backgroundColor: surfaceBg,
        },
        wrapperProps.style,
      ]}
    >
      {LinearGradientComponent ? (
        <LinearGradientComponent
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}

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
