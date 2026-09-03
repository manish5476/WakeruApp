// src/components/ui/IconButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glass';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  color?: keyof ThemeColors;
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  color,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: IconButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    onPressOut?.(e);
  };

  const getVariantStyles = () => {
    const customColor = color ? theme.colors[color] : null;

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: customColor || theme.colors.primary,
          iconColor: theme.colors.textInverse,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.primaryBg,
          iconColor: customColor || theme.colors.primary,
        };
      case 'glass':
        return {
          backgroundColor: theme.glass.background,
          iconColor: customColor || theme.colors.textPrimary,
          borderColor: theme.glass.borderTopColor,
          borderWidth: 1,
        };
      case 'ghost':
      default:
        return {
          backgroundColor: 'transparent',
          iconColor: customColor || theme.colors.textPrimary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: 32, height: 32, borderRadius: 16 };
      case 'lg':
        return { width: 48, height: 48, borderRadius: 24 };
      case 'md':
      default:
        return { width: 40, height: 40, borderRadius: 20 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: variantStyles.backgroundColor,
      width: sizeStyles.width,
      height: sizeStyles.height,
      borderRadius: sizeStyles.borderRadius,
      opacity: disabled ? 0.6 : 1,
      ...(variant === 'glass'
        ? {
            borderColor: variantStyles.borderColor,
            borderWidth: variantStyles.borderWidth,
          }
        : {}),
    },
    style,
  ];

  return (
    <Animated.View style={[animatedStyle, { alignSelf: 'flex-start' }]}>
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={buttonStyles}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variantStyles.iconColor} size="small" />
        ) : React.isValidElement(icon) ? (
          React.cloneElement(icon as any, {
            color: (icon.props as any).color || variantStyles.iconColor,
            size:
              (icon.props as any).size ||
              (size === 'sm' ? 16 : size === 'lg' ? 24 : 20),
          })
        ) : (
          icon
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
