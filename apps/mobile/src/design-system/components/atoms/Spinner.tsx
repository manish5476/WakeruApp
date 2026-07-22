import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';
import { useTheme } from '../../../theme';

export interface SpinnerProps extends Omit<ActivityIndicatorProps, 'color'> {
  color?: string;
  variant?: 'primary' | 'secondary' | 'error' | 'success';
}

export const Spinner = ({ color, variant = 'primary', size = 'small', ...rest }: SpinnerProps) => {
  const { tokens } = useTheme();

  const getColor = () => {
    if (color) return color;
    switch (variant) {
      case 'primary': return tokens.colors.primary;
      case 'secondary': return tokens.colors.textSecondary;
      case 'error': return tokens.colors.error;
      case 'success': return tokens.colors.success;
      default: return tokens.colors.primary;
    }
  };

  return <ActivityIndicator color={getColor()} size={size} {...rest} />;
};
