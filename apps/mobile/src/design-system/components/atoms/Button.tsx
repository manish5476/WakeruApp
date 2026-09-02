/**
 * Button Component
 * Primary interactive component with multiple variants
 */

import { SPACING, RADIUS, SHADOWS } from '@/design-system/tokens/tokens';
import { useTheme } from '../../hooks/useTheme';
import React, { ReactNode, useState } from 'react';
import {
  Pressable,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  StyleProp,
} from 'react-native';
import { Text } from '../primitives/Text';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void | Promise<void>;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  testID?: string;
}

const BUTTON_SIZES = {
  sm: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    height: 32,
  },
  md: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    height: 44,
  },
  lg: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    height: 56,
  },
} as const;

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  style,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  testID,
}) => {
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...BUTTON_SIZES[size],
      borderRadius: RADIUS.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      ...SHADOWS.md,
      opacity: disabled ? 0.5 : 1,
      ...(fullWidth && { width: '100%' }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: isPressed
            ? colors.interactivePressed
            : colors.interactive,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondary,
          opacity: isPressed ? 0.8 : 1,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.border,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'tertiary':
        return {
          ...baseStyle,
          backgroundColor: colors.surfaceAlt,
        };
      default:
        return baseStyle;
    }
  };

  const getTextColor = (): string => {
    if (variant === 'primary' || variant === 'secondary') {
      return colors.textInverted;
    }
    return colors.text;
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    try {
      await Promise.resolve(onPress());
    } catch (error) {
      console.error('Button press error:', error);
    }
  };

  const textContent = (
    <Text variant="button" color={getTextColor()}>
      {children}
    </Text>
  );

  const content = (
    <>
      {icon && iconPosition === 'left' && icon}
      {loading ? <ActivityIndicator color={getTextColor()} /> : textContent}
      {icon && iconPosition === 'right' && icon}
    </>
  );

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      testID={testID}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}
      >
        {content}
      </View>
    </Pressable>
  );
};

export default Button;
