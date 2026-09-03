// src/components/ui/Input.tsx
import React, { useState } from 'react';
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';
import { ThemeColors } from '../../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
  disabled?: boolean;
  success?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  disabled = false,
  success = false,
  onFocus,
  onBlur,
  style,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.background;
    if (error) return theme.colors.dangerBg;
    if (success) return theme.colors.successBg;
    return theme.colors.surface; // Simplistic, replaced Animated interpolation
  };

  const getIconColor = () => {
    if (disabled) return theme.colors.textTertiary;
    if (error) return theme.colors.danger;
    if (success) return theme.colors.success;
    if (isFocused) return theme.colors.primary;
    return theme.colors.textSecondary;
  };

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        { opacity: disabled ? 0.6 : 1 },
      ]}
    >
      {label && (
        <Typography
          variant="caption"
          weight="semibold"
          color={error ? 'danger' : 'textSecondary'}
          style={styles.label}
        >
          {label}
        </Typography>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderRadius: theme.borderRadius.lg,
            paddingHorizontal: theme.spacing['4'],
            borderWidth: 1,
            borderColor: error
              ? theme.colors.danger
              : isFocused
                ? theme.colors.primary
                : theme.colors.border,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIcon}>
            {React.isValidElement(leftIcon)
              ? React.cloneElement(leftIcon as any, {
                  color: (leftIcon.props as any).color || getIconColor(),
                  size: (leftIcon.props as any).size || 20,
                })
              : leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamily.sans,
              fontSize: theme.typography.fontSize.base,
              paddingVertical: theme.spacing['3'],
            },
            style,
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          {...props}
        />

        {rightIcon && (
          <View style={styles.rightIcon}>
            {React.isValidElement(rightIcon)
              ? React.cloneElement(rightIcon as any, {
                  color: (rightIcon.props as any).color || getIconColor(),
                  size: (rightIcon.props as any).size || 20,
                })
              : rightIcon}
          </View>
        )}
      </View>
      {error && (
        <Typography variant="caption" color="danger" style={styles.errorText}>
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: { marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, includeFontPadding: false },
  leftIcon: { marginRight: 12 },
  rightIcon: { marginLeft: 12 },
  errorText: { marginTop: 6 },
});
