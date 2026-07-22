import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme';
import { Text } from '../primitives/Text';
import { Box } from '../primitives/Box';
import { Row } from '../primitives/Row';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  ...rest
}: ButtonProps) => {
  const { tokens } = useTheme();

  const getVariantStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return { bg: tokens.colors.primary, text: '#FFF' };
      case 'secondary':
        return { bg: tokens.colors.surfaceVariant, text: tokens.colors.text };
      case 'outline':
        return { bg: tokens.colors.transparent, text: tokens.colors.primary, border: tokens.colors.border };
      case 'ghost':
        return { bg: tokens.colors.transparent, text: tokens.colors.text };
      case 'danger':
        return { bg: tokens.colors.error, text: '#FFF' };
      default:
        return { bg: tokens.colors.primary, text: '#FFF' };
    }
  };

  const getSizeStyles = (): { height: number; paddingHorizontal: keyof typeof tokens.spacing } => {
    switch (size) {
      case 'sm': return { height: 36, paddingHorizontal: 'md' };
      case 'md': return { height: 48, paddingHorizontal: 'lg' };
      case 'lg': return { height: 56, paddingHorizontal: 'xl' };
      default: return { height: 48, paddingHorizontal: 'lg' };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const opacity = disabled || loading ? 0.6 : 1;

  const dynamicStyle: ViewStyle = {
    height: sizeStyles.height,
    backgroundColor: variantStyles.bg,
    borderRadius: tokens.radius.md,
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: variantStyles.border,
    width: fullWidth ? '100%' : 'auto',
    opacity,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing[sizeStyles.paddingHorizontal],
  };

  return (
    <TouchableOpacity
      style={[dynamicStyle, style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text} />
      ) : (
        <Row spacing="sm">
          {leftIcon}
          <Text variant="label" color={variantStyles.text}>
            {label}
          </Text>
          {rightIcon}
        </Row>
      )}
    </TouchableOpacity>
  );
};
