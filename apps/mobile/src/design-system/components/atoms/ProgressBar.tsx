import React from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import { VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS, SPACING } from '../../tokens/tokens';

export interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const ProgressBar = React.forwardRef<View, ProgressBarProps>(
  (
    {
      progress,
      label,
      showLabel = true,
      size = 'md',
      color,
      backgroundColor,
      animated = true,
      style,
      testID,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    const heightMap = {
      sm: 4,
      md: 8,
      lg: 12,
    };

    const bgColor = backgroundColor || colors.surfaceVariant;
    const progressColor = color || colors.primary;

    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      if (animated) {
        Animated.timing(animatedValue, {
          toValue: clampedProgress,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }
    }, [clampedProgress, animated, animatedValue]);

    const progressWidth = animated
      ? animatedValue.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%'],
        })
      : `${clampedProgress}%`;

    return (
      <VStack ref={ref} gap="xs" style={style} testID={testID}>
        {(label || showLabel) && (
          <Text variant="caption" weight="600" color={colors.onSurfaceVariant}>
            {label || `${Math.round(clampedProgress)}%`}
          </Text>
        )}

        <View
          style={{
            width: '100%',
            height: heightMap[size],
            backgroundColor: bgColor,
            borderRadius: RADIUS.full,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              width: progressWidth,
              height: '100%',
              backgroundColor: progressColor,
              borderRadius: RADIUS.full,
            }}
          />
        </View>
      </VStack>
    );
  },
);

ProgressBar.displayName = 'ProgressBar';
