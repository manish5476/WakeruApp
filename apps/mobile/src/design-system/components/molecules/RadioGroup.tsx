import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import { VStack, HStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
}

export interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  required?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const RadioGroup = React.forwardRef<View, RadioGroupProps>(
  (
    { label, options, value, onChange, error, required = false, style, testID },
    ref,
  ) => {
    const { colors } = useTheme();

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
              onPress={() => !option.disabled && onChange(option.value)}
              disabled={option.disabled}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : option.disabled ? 0.5 : 1,
                },
              ]}
            >
              <HStack align="flex-start" gap="md">
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderWidth: 2,
                    borderColor:
                      value === option.value ? colors.primary : colors.outline,
                    borderRadius: RADIUS.full,
                    backgroundColor:
                      value === option.value ? colors.primary : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 2,
                  }}
                >
                  {value === option.value && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: RADIUS.full,
                        backgroundColor: colors.onPrimary,
                      }}
                    />
                  )}
                </View>

                <VStack flex={1} gap="xs">
                  <Text
                    variant="body"
                    weight="600"
                    color={
                      option.disabled
                        ? colors.onSurfaceVariant
                        : colors.onSurface
                    }
                  >
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text
                      variant="caption"
                      color={colors.onSurfaceVariant}
                      numberOfLines={2}
                    >
                      {option.description}
                    </Text>
                  )}
                </VStack>
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

RadioGroup.displayName = 'RadioGroup';
