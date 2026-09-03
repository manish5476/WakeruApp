// src/components/ui/Button.tsx
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
import { Typography } from './Typography';
import { ThemeColors } from '../../theme';

export type ButtonVariant =
  'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
  color?: keyof ThemeColors;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  variant = 'primary',
  size = 'md',
  title,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  color,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPressOut?.(e);
  };

  const getVariantStyles = () => {
    const customColor = color ? theme.colors[color] : null;

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: customColor || theme.colors.primary,
          borderColor: customColor || theme.colors.primary,
          textColor: theme.colors.textInverse,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.primaryBg,
          borderColor: theme.colors.primaryBg,
          textColor: customColor || theme.colors.primary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: customColor || theme.colors.border,
          textColor: customColor || theme.colors.textPrimary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: customColor || theme.colors.textPrimary,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.danger,
          borderColor: theme.colors.danger,
          textColor: theme.colors.white,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          textColor: theme.colors.textInverse,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: theme.spacing['2'],
          paddingHorizontal: theme.spacing['3'],
          borderRadius: theme.borderRadius.md,
          fontSize: theme.typography.fontSize.sm,
        };
      case 'lg':
        return {
          paddingVertical: theme.spacing['4'],
          paddingHorizontal: theme.spacing['6'],
          borderRadius: theme.borderRadius.xl,
          fontSize: theme.typography.fontSize.lg,
        };
      case 'md':
      default:
        return {
          paddingVertical: theme.spacing['3'],
          paddingHorizontal: theme.spacing['4'],
          borderRadius: theme.borderRadius.lg,
          fontSize: theme.typography.fontSize.base,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variant === 'outline' ? 1 : 0,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderRadius: sizeStyles.borderRadius,
      opacity: disabled ? 0.6 : 1,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
    },
    style,
  ];

  return (
    <AnimatedTouchable
      activeOpacity={1}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        { alignSelf: fullWidth ? 'stretch' : 'flex-start' },
      ]}
      {...props}
    >
      <View style={buttonStyles}>
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={variantStyles.textColor} size="small" />
          </View>
        )}

        <View style={[styles.content, { opacity: loading ? 0 : 1 }]}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Typography
            weight="semibold"
            style={{
              color: variantStyles.textColor,
              fontSize: sizeStyles.fontSize,
            }}
            align="center"
          >
            {title}
          </Typography>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // Ensure loader sits on top
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
