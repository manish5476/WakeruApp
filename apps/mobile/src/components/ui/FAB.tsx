// src/components/ui/FAB.tsx
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

export interface FABProps extends Omit<TouchableOpacityProps, 'style'> {
  icon: React.ReactNode;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  style?: any;
  color?: keyof ThemeColors;
  elevation?: keyof typeof import('../../theme').shadows;
}

export function FAB({
  icon,
  label,
  loading = false,
  disabled = false,
  position = 'bottom-right',
  style,
  color,
  elevation = 'lg',
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: FABProps) {
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

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: theme.spacing['6'], left: theme.spacing['6'] };
      case 'bottom-center':
        return { bottom: theme.spacing['6'], alignSelf: 'center' };
      case 'bottom-right':
      default:
        return { bottom: theme.spacing['6'], right: theme.spacing['6'] };
    }
  };

  const bgColor = color ? theme.colors[color] : theme.colors.primary;
  const shadowStyles = theme.shadows[elevation];

  const buttonStyles = [
    styles.button,
    shadowStyles,
    {
      backgroundColor: bgColor,
      opacity: disabled ? 0.6 : 1,
      borderRadius: label ? theme.borderRadius['3xl'] : 28,
      minWidth: label ? undefined : 56,
      minHeight: 56,
      paddingHorizontal: label ? theme.spacing['5'] : theme.spacing['0'],
    },
  ];

  return (
    <Animated.View
      style={[styles.container, getPositionStyles(), animatedStyle, style]}
    >
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={buttonStyles as any}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.textInverse} size="small" />
        ) : (
          <View style={styles.content}>
            {React.isValidElement(icon)
              ? React.cloneElement(icon as any, {
                  color: (icon.props as any).color || theme.colors.textInverse,
                  size: (icon.props as any).size || 24,
                })
              : icon}
            {label && (
              <Typography
                weight="semibold"
                style={{
                  color: theme.colors.textInverse,
                  marginLeft: theme.spacing['2'],
                }}
              >
                {label}
              </Typography>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', zIndex: 1000 },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
