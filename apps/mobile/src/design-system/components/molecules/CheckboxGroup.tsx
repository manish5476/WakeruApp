import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import { VStack, HStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface CheckboxOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  label?: string;
  options: CheckboxOption[];
  value: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  direction?: 'vertical' | 'horizontal';
  error?: string;
  required?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const CheckboxGroup = React.forwardRef<View, CheckboxGroupProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      direction = 'vertical',
      error,
      required = false,
      style,
      testID,
    },
    ref,
  ) => {
    const { colors } = useTheme();

    const toggleValue = (optionValue: string | number) => {
      if (value.includes(optionValue)) {
        onChange(value.filter(v => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    };

    return (
      <View ref={ref} style={style} testID={testID}>
        {label && (
          <Text
            variant="caption"
            weight="600"
            color={colors.onSurfaceVariant}
            style={{ marginBottom: SPACING.sm }}
          >
            {label}
            {required && <Text color={colors.error}> *</Text>}
          </Text>
        )}

        <VStack gap="sm">
          {options.map(option => (
            <Pressable
              key={option.value}
              onPress={() => !option.disabled && toggleValue(option.value)}
              disabled={option.disabled}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : option.disabled ? 0.5 : 1,
                },
              ]}
            >
              <HStack align="center" gap="md">
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderWidth: 2,
                    borderColor: value.includes(option.value)
                      ? colors.primary
                      : colors.outline,
                    borderRadius: RADIUS.sm,
                    backgroundColor: value.includes(option.value)
                      ? colors.primary
                      : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {value.includes(option.value) && (
                    <Text
                      color={colors.onPrimary}
                      weight="700"
                      style={{ fontSize: 14 }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
                <Text
                  variant="body"
                  color={
                    option.disabled ? colors.onSurfaceVariant : colors.onSurface
                  }
                  flex={1}
                >
                  {option.label}
                </Text>
              </HStack>
            </Pressable>
          ))}
        </VStack>

        {error && (
          <Text
            variant="caption"
            color={colors.error}
            style={{ marginTop: SPACING.sm }}
          >
            {error}
          </Text>
        )}
      </View>
    );
  },
);

CheckboxGroup.displayName = 'CheckboxGroup';
