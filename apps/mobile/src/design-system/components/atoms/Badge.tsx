import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme';
import { Text } from '../primitives/Text';

export interface BadgeProps {
  label: string | number;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'default';
  size?: 'sm' | 'md';
}

export const Badge = ({ label, variant = 'default', size = 'md' }: BadgeProps) => {
  const { tokens } = useTheme();

  const getVariantStyles = (): { bg: string; text: string } => {
    switch (variant) {
      case 'primary': return { bg: tokens.colors.primary, text: '#FFF' };
      case 'success': return { bg: tokens.colors.success, text: '#FFF' };
      case 'warning': return { bg: tokens.colors.warning, text: '#000' };
      case 'error': return { bg: tokens.colors.error, text: '#FFF' };
      default: return { bg: tokens.colors.surfaceVariant, text: tokens.colors.text };
    }
  };

  const vStyles = getVariantStyles();
  const height = size === 'sm' ? 20 : 24;
  
  const style: ViewStyle = {
    backgroundColor: vStyles.bg,
    height,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  };

  return (
    <View style={style}>
      <Text variant={size === 'sm' ? 'caption' : 'bodySmall'} color={vStyles.text} weight="medium">
        {label}
      </Text>
    </View>
  );
};
