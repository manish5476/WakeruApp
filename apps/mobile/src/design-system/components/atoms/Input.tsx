/**
 * Input Component
 * Text input with design system styling
 */

import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS, SPACING } from '../../tokens/tokens';
import Text from '../primitives/Text';

interface InputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  error,
  hint,
  icon,
  iconPosition = 'left',
  containerStyle,
  disabled = false,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const inputStyle = {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Inter-Regular',
    paddingHorizontal: icon ? SPACING.lg : SPACING.md,
    paddingVertical: SPACING.md,
  };

  const containerBorderColor = error
    ? colors.danger
    : isFocused
      ? colors.interactive
      : colors.border;

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          variant="titleSmall"
          color={colors.textSecondary}
          style={{ marginBottom: SPACING.xs }}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: RADIUS.md,
            borderWidth: 1,
            borderColor: containerBorderColor,
            paddingHorizontal: SPACING.md,
            minHeight: 44,
          },
          style,
        ]}
      >
        {icon && iconPosition === 'left' && (
          <View style={{ marginRight: SPACING.sm }}>{icon}</View>
        )}
        <TextInput
          style={[inputStyle, { opacity: disabled ? 0.5 : 1 }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <View style={{ marginLeft: SPACING.sm }}>{icon}</View>
        )}
      </View>
      {error && (
        <Text
          variant="labelSmall"
          color={colors.danger}
          style={{ marginTop: SPACING.xs }}
        >
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text
          variant="labelSmall"
          color={colors.textTertiary}
          style={{ marginTop: SPACING.xs }}
        >
          {hint}
        </Text>
      )}
    </View>
  );
};

export default Input;
