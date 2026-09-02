/**
 * Skeleton Component
 * Loading placeholder component
 */

import React, { useEffect } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS, OPACITY } from '../../tokens/tokens';

type SkeletonShape = 'rect' | 'circle';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  shape?: SkeletonShape;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  shape = 'rect',
  borderRadius = RADIUS.md,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const skeletonStyle: ViewStyle = {
    width,
    height,
    backgroundColor: colors.surfaceAlt,
    borderRadius: shape === 'circle' ? height / 2 : borderRadius,
  };

  return (
    <Animated.View
      style={[skeletonStyle, animatedStyle, style]}
      testID={testID}
    />
  );
};

export default Skeleton;
