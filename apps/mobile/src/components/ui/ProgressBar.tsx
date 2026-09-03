// src/components/ui/ProgressBar.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 6,
  variant = 'default',
  showLabel = false,
  label,
  animated = true,
  style,
}: ProgressBarProps) {
  const theme = useTheme();

  // Use Reanimated Shared Value for 60fps UI Thread
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    if (animated) {
      progressWidth.value = withSpring(clampedProgress, {
        damping: 18,
        stiffness: 180,
      });
    } else {
      progressWidth.value = clampedProgress;
    }
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const variantColors = {
    default: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    accent: theme.colors.accent,
  };

  const fillColor = variantColors[variant];

  return (
    <View style={[styles.container, style]}>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label && (
            <Typography
              variant="caption"
              weight="semibold"
              color="textSecondary"
            >
              {label}
            </Typography>
          )}
          {showLabel && (
            <Typography variant="caption" weight="bold" color="textTertiary">
              {Math.round(progress * 100)}%
            </Typography>
          )}
        </View>
      )}

      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)',
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            animatedStyle,
            {
              height: '100%',
              backgroundColor: fillColor,
              borderRadius: height / 2,
              shadowColor: fillColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: { width: '100%', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0 },
});
