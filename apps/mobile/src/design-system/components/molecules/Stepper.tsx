import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import { HStack, VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface StepperStep {
  label: string;
  description?: string;
  completed?: boolean;
  error?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  onStepPress?: (step: number) => void;
  style?: ViewStyle;
  testID?: string;
}

export const Stepper = React.forwardRef<View, StepperProps>(
  (
    {
      steps,
      currentStep,
      orientation = 'horizontal',
      onStepPress,
      style,
      testID,
    },
    ref,
  ) => {
    const { colors } = useTheme();

    if (orientation === 'horizontal') {
      return (
        <View ref={ref} style={style} testID={testID}>
          <HStack gap="md" align="stretch" justify="space-between">
            {steps.map((step, index) => (
              <HStack key={index} flex={1} align="flex-start" gap="sm">
                {/* Step Circle */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.full,
                    backgroundColor:
                      index < currentStep
                        ? colors.primary
                        : index === currentStep
                          ? colors.primary
                          : colors.surfaceVariant,
                    borderWidth: index === currentStep ? 2 : 0,
                    borderColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    weight="700"
                    color={
                      index <= currentStep
                        ? colors.onPrimary
                        : colors.onSurfaceVariant
                    }
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </Text>
                </View>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <View
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor:
                        index < currentStep - 1
                          ? colors.primary
                          : colors.surfaceVariant,
                      alignSelf: 'center',
                      marginHorizontal: -SPACING.md,
                    }}
                  />
                )}
              </HStack>
            ))}
          </HStack>

          {/* Step Labels */}
          <HStack
            gap="md"
            justify="space-between"
            style={{ marginTop: SPACING.md }}
          >
            {steps.map((step, index) => (
              <VStack key={index} flex={1} gap="xs">
                <Text
                  variant="caption"
                  weight="600"
                  color={
                    index <= currentStep
                      ? colors.primary
                      : colors.onSurfaceVariant
                  }
                >
                  {step.label}
                </Text>
                {step.description && (
                  <Text
                    variant="caption"
                    color={colors.onSurfaceVariant}
                    numberOfLines={1}
                  >
                    {step.description}
                  </Text>
                )}
              </VStack>
            ))}
          </HStack>
        </View>
      );
    }

    // Vertical orientation
    return (
      <View ref={ref} style={style} testID={testID}>
        <VStack gap="lg">
          {steps.map((step, index) => (
            <HStack key={index} gap="md" align="flex-start">
              {/* Left Column: Circle + Line */}
              <VStack align="center" gap={0}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.full,
                    backgroundColor:
                      index < currentStep
                        ? colors.primary
                        : index === currentStep
                          ? colors.primary
                          : colors.surfaceVariant,
                    borderWidth: index === currentStep ? 2 : 0,
                    borderColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    weight="700"
                    color={
                      index <= currentStep
                        ? colors.onPrimary
                        : colors.onSurfaceVariant
                    }
                  >
                    {index < currentStep ? '✓' : index + 1}
                  </Text>
                </View>

                {index < steps.length - 1 && (
                  <View
                    style={{
                      width: 2,
                      height: SPACING.lg,
                      backgroundColor:
                        index < currentStep - 1
                          ? colors.primary
                          : colors.surfaceVariant,
                    }}
                  />
                )}
              </VStack>

              {/* Right Column: Content */}
              <VStack flex={1} gap="xs" style={{ paddingTop: SPACING.sm }}>
                <Text
                  variant="body"
                  weight="600"
                  color={
                    index <= currentStep
                      ? colors.primary
                      : colors.onSurfaceVariant
                  }
                >
                  {step.label}
                </Text>
                {step.description && (
                  <Text variant="caption" color={colors.onSurfaceVariant}>
                    {step.description}
                  </Text>
                )}
              </VStack>
            </HStack>
          ))}
        </VStack>
      </View>
    );
  },
);

Stepper.displayName = 'Stepper';
