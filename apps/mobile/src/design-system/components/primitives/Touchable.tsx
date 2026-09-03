import React, { ReactNode } from 'react';
import { Pressable, ViewStyle, GestureResponderEvent } from 'react-native';

export type TouchableOpacity = 'low' | 'medium' | 'high';

export interface TouchableProps {
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  children: ReactNode;
  disabled?: boolean;
  feedback?: TouchableOpacity;
  activeOpacity?: number;
  style?: ViewStyle | ((state: { pressed: boolean }) => ViewStyle);
  testID?: string;
}

export const Touchable = React.forwardRef<any, TouchableProps>(
  (
    {
      onPress,
      onLongPress,
      onPressIn,
      onPressOut,
      children,
      disabled = false,
      feedback = 'medium',
      activeOpacity,
      style,
      testID,
    },
    ref,
  ) => {
    const feedbackMap = {
      low: 0.8,
      medium: 0.7,
      high: 0.5,
    };

    const opacity = activeOpacity || feedbackMap[feedback];

    const getStyle = (state: { pressed: boolean }) => {
      const baseStyle: ViewStyle = {
        opacity: state.pressed ? opacity : 1,
      };

      if (typeof style === 'function') {
        return [baseStyle, style(state)];
      }

      return [baseStyle, style];
    };

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={getStyle}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  },
);

Touchable.displayName = 'Touchable';
