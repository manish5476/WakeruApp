/**
 * useAnimation Hook
 * Provides animation utilities for the app
 */

import { useRef, useCallback } from 'react';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_PRESETS } from '../animations/animations';

export const usePressAnimation = () => {
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.95, SPRING_CONFIGS.quick);
  }, [scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS.quick);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    onPressIn,
    onPressOut,
    animatedStyle,
  };
};

export const useFadeInAnimation = (duration = TIMING_PRESETS.normal) => {
  const opacity = useSharedValue(0);

  const triggerAnimation = useCallback(() => {
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [opacity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {
    triggerAnimation,
    animatedStyle,
    opacity,
  };
};

export const useSlideAnimation = (
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance = 50,
  duration = TIMING_PRESETS.normal,
) => {
  const translateY = useSharedValue(
    direction === 'up' ? distance : direction === 'down' ? -distance : 0,
  );
  const translateX = useSharedValue(
    direction === 'left' ? distance : direction === 'right' ? -distance : 0,
  );

  const triggerAnimation = useCallback(() => {
    translateY.value = withTiming(0, {
      duration,
      easing: Easing.inOut(Easing.cubic),
    });
    translateX.value = withTiming(0, {
      duration,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [translateY, translateX, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return {
    triggerAnimation,
    animatedStyle,
  };
};

export const useRotationAnimation = (duration = TIMING_PRESETS.slow) => {
  const rotation = useSharedValue(0);

  const startRotation = useCallback(() => {
    rotation.value = withTiming(360, {
      duration,
      easing: Easing.linear,
    });
  }, [rotation, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return {
    startRotation,
    animatedStyle,
  };
};

export const useScaleAnimation = (
  initialScale = 1,
  targetScale = 1.2,
  duration = TIMING_PRESETS.normal,
) => {
  const scale = useSharedValue(initialScale);

  const triggerScale = useCallback(() => {
    scale.value = withSpring(targetScale, SPRING_CONFIGS.bouncy);
  }, [scale, targetScale]);

  const resetScale = useCallback(() => {
    scale.value = withSpring(initialScale, SPRING_CONFIGS.bouncy);
  }, [scale, initialScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    triggerScale,
    resetScale,
    animatedStyle,
    scale,
  };
};

export default usePressAnimation;
