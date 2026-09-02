import React, { useState } from 'react';
import { View, ScrollView, Pressable, Modal, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import { HStack, VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Select = React.forwardRef<View, SelectProps>(
  (
    {
      label,
      placeholder = 'Select an option',
      options,
      value,
      onChange,
      error,
      disabled = false,
      required = false,
      style,
      testID,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const { colors } = useTheme();

    const selectedOption = options.find(opt => opt.value === value);

    return (
      <View ref={ref} style={style} testID={testID}>
        {label && (
          <Text
            variant="caption"
            weight="600"
            color={colors.onSurfaceVariant}
            style={{ marginBottom: SPACING.xs }}
          >
            {label}
            {required && <Text color={colors.error}> *</Text>}
          </Text>
        )}

        <Pressable
          onPress={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          style={({ pressed }) => [
            {
              borderWidth: 1,
              borderColor: error ? colors.error : colors.outline,
              borderRadius: RADIUS.md,
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.md,
              backgroundColor: disabled
                ? colors.surfaceVariant
                : colors.surface,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <HStack justify="space-between" align="center">
            <Text
              variant="body"
              color={
                selectedOption ? colors.onSurface : colors.onSurfaceVariant
              }
              flex={1}
            >
              {selectedOption?.label || placeholder}
            </Text>
            <Text color={colors.onSurfaceVariant}>▼</Text>
          </HStack>
        </Pressable>

        {error && (
          <Text
            variant="caption"
            color={colors.error}
            style={{ marginTop: SPACING.xs }}
          >
            {error}
          </Text>
        )}

        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
            onPress={() => setIsOpen(false)}
          >
            <View
              style={{
                flex: 1,
                justifyContent: 'flex-end',
              }}
            >
              <Pressable
                onPress={e => e.stopPropagation()}
                style={{
                  backgroundColor: colors.surface,
                  borderTopLeftRadius: RADIUS.lg,
                  borderTopRightRadius: RADIUS.lg,
                  maxHeight: '70%',
                }}
              >
                <VStack padding="lg" gap="sm">
                  <Text variant="heading3" color={colors.onSurface}>
                    Select Option
                  </Text>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    <VStack gap="xs">
                      {options.map(option => (
                        <Pressable
                          key={option.value}
                          onPress={() => {
                            onChange(option.value);
                            setIsOpen(false);
                          }}
                          disabled={option.disabled}
                          style={({ pressed }) => [
                            {
                              paddingVertical: SPACING.md,
                              paddingHorizontal: SPACING.md,
                              borderRadius: RADIUS.md,
                              backgroundColor:
                                value === option.value
                                  ? colors.primary + '20'
                                  : pressed
                                    ? colors.surfaceVariant
                                    : 'transparent',
                              opacity: option.disabled ? 0.5 : 1,
                            },
                          ]}
                        >
                          <HStack align="center" gap="md">
                            {value === option.value && (
                              <Text color={colors.primary}>✓</Text>
                            )}
                            <Text
                              variant="body"
                              color={
                                value === option.value
                                  ? colors.primary
                                  : colors.onSurface
                              }
                              flex={1}
                            >
                              {option.label}
                            </Text>
                          </HStack>
                        </Pressable>
                      ))}
                    </VStack>
                  </ScrollView>
                </VStack>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  },
);

Select.displayName = 'Select';
