// src/components/ui/InteractiveWrapper.tsx
import React from 'react';
import { Pressable, ViewStyle, StyleProp, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface InteractiveWrapperProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hoverElevation?: boolean; // If true, raises the card on web hover
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function InteractiveWrapper({
  children,
  onPress,
  disabled,
  style,
  hoverElevation = true,
}: InteractiveWrapperProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  // Web-only Hover CSS class mapping
  const webHoverStyle =
    Platform.OS === 'web' && hoverElevation
      ? {
          transition: 'transform 0.2s ease',
          ':hover': {
            transform: 'translateY(-2px)',
          },
        }
      : ({} as any);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, webHoverStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
