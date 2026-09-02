import React, { ReactNode } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import { HStack, VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rightText?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  divider?: boolean;
  disabled?: boolean;
  selected?: boolean;
  badge?: string | number;
  style?: ViewStyle;
  testID?: string;
}

export const ListItem = React.forwardRef<View, ListItemProps>(
  (
    {
      title,
      subtitle,
      description,
      leftIcon,
      rightIcon,
      rightText,
      onPress,
      onLongPress,
      divider = true,
      disabled = false,
      selected = false,
      badge,
      style,
      testID,
    },
    ref,
  ) => {
    const { colors } = useTheme();

    return (
      <View ref={ref} testID={testID}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          disabled={disabled}
          style={({ pressed }) => [
            {
              backgroundColor: pressed ? colors.surfaceVariant : colors.surface,
              paddingVertical: SPACING.md,
              paddingHorizontal: SPACING.lg,
              opacity: disabled ? 0.5 : 1,
            },
            selected && {
              backgroundColor: colors.primary + '10',
              borderLeftWidth: 3,
              borderLeftColor: colors.primary,
            },
            style,
          ]}
        >
          <HStack align="center" justify="space-between" gap="md">
            {/* Left Icon */}
            {leftIcon && (
              <View
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {leftIcon}
              </View>
            )}

            {/* Content */}
            <VStack flex={1} gap="xs">
              <HStack align="center" gap="sm">
                <Text
                  variant="body"
                  weight="600"
                  color={colors.onSurface}
                  flex={1}
                >
                  {title}
                </Text>
                {badge && (
                  <View
                    style={{
                      backgroundColor: colors.error,
                      borderRadius: RADIUS.full,
                      width: 24,
                      height: 24,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text variant="caption" weight="700" color={colors.onError}>
                      {badge}
                    </Text>
                  </View>
                )}
              </HStack>

              {subtitle && (
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {subtitle}
                </Text>
              )}

              {description && (
                <Text
                  variant="caption"
                  color={colors.onSurfaceVariant}
                  numberOfLines={2}
                >
                  {description}
                </Text>
              )}
            </VStack>

            {/* Right Content */}
            {(rightText || rightIcon) && (
              <VStack align="flex-end" gap="xs">
                {rightText && (
                  <Text
                    variant="caption"
                    weight="600"
                    color={colors.onSurfaceVariant}
                  >
                    {rightText}
                  </Text>
                )}
                {rightIcon && <View>{rightIcon}</View>}
              </VStack>
            )}
          </HStack>
        </Pressable>

        {divider && (
          <View
            style={{
              height: 1,
              backgroundColor: colors.surfaceVariant,
              marginLeft: SPACING.lg,
              marginRight: SPACING.lg,
            }}
          />
        )}
      </View>
    );
  },
);

ListItem.displayName = 'ListItem';
