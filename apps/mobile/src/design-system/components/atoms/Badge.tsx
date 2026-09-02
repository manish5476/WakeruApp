/**
 * Badge Component
 * Small label for categorization and status
 */

import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS, SPACING } from '../../tokens/tokens';
import Box from '../primitives/Box';
import Text from '../primitives/Text';

type BadgeVariant =
  'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

const BADGE_SIZES = {
  sm: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  md: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  lg: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
} as const;

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
  icon,
}) => {
  const { colors } = useTheme();

  const getBadgeStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...BADGE_SIZES[size],
      borderRadius: RADIUS.full,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondary,
        };
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: colors.accent,
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: colors.warning,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: colors.danger,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.surfaceAlt,
        };
    }
  };

  const getTextColor = (): string => {
    if (
      ['primary', 'secondary', 'success', 'warning', 'danger'].includes(variant)
    ) {
      return colors.textInverted;
    }
    return colors.text;
  };

  return (
    <Box
      style={[getBadgeStyle(), style]}
      flexDirection="row"
      alignItems="center"
      gap="xs"
    >
      {icon}
      <Text variant="labelSmall" color={getTextColor()} uppercase>
        {label}
      </Text>
    </Box>
  );
};

export default Badge;
