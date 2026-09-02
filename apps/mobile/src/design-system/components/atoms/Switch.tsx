/**
 * Switch Component
 * Toggle switch for boolean values
 */

import React from 'react';
import {
  Switch as RNSwitch,
  SwitchProps as RNSwitchProps,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SwitchProps extends RNSwitchProps {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const getTrackColor = (): { true: string; false: string } => {
    switch (variant) {
      case 'secondary':
        return {
          true: colors.secondary,
          false: colors.border,
        };
      case 'accent':
        return {
          true: colors.accent,
          false: colors.border,
        };
      case 'primary':
      default:
        return {
          true: colors.primary,
          false: colors.border,
        };
    }
  };

  const scaleValue = size === 'sm' ? 0.8 : 1;

  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={getTrackColor()}
      thumbColor={colors.surface}
      style={[{ transform: [{ scale: scaleValue }] }, style]}
      {...props}
    />
  );
};

export default Switch;
