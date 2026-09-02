/**
 * Card Component
 * Elevation-based card with optional glass morphism effect
 */

import React, { ReactNode } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS, SPACING, SHADOWS } from '../../tokens/tokens';
import Box from '../primitives/Box';

type CardVariant = 'elevated' | 'filled' | 'outlined' | 'glass';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  padding?: keyof typeof SPACING;
  borderRadius?: keyof typeof RADIUS;
  onPress?: () => void;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = 'lg',
  borderRadius = 'lg',
  onPress,
  testID,
}) => {
  const { colors, isDark } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: RADIUS[borderRadius],
      overflow: 'hidden',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          ...SHADOWS.md,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.surfaceAlt,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: isDark ? colors.glassDark : colors.glassLight,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...SHADOWS.sm,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <Box
      style={[getCardStyle(), style]}
      padding={padding}
      onTouchEnd={onPress}
      testID={testID}
    >
      {children}
    </Box>
  );
};

export default Card;
