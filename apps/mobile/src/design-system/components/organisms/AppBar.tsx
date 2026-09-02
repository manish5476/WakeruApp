import React, { ReactNode } from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../primitives/Text';
import { HStack, VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface AppBarProps {
  title?: string | ReactNode;
  subtitle?: string;
  leftAction?: {
    icon: ReactNode;
    onPress: () => void;
    label?: string;
  };
  rightActions?: Array<{
    icon: ReactNode;
    onPress: () => void;
    label?: string;
  }>;
  backgroundColor?: string;
  elevation?: number;
  centered?: boolean;
  style?: ViewStyle;
}

export const AppBar = React.forwardRef<View, AppBarProps>(
  (
    {
      title,
      subtitle,
      leftAction,
      rightActions,
      backgroundColor,
      elevation = 2,
      centered = false,
      style,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const bgColor = backgroundColor || colors.surface;
    const shadowOpacity = elevation / 10;

    return (
      <View
        ref={ref}
        style={[
          {
            paddingTop: insets.top,
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.md,
            backgroundColor: bgColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: elevation },
            shadowOpacity: shadowOpacity,
            shadowRadius: elevation * 1.5,
            elevation,
          },
          style,
        ]}
      >
        <HStack
          justify={centered ? 'center' : 'space-between'}
          align="center"
          gap="md"
        >
          {/* Left Action */}
          {leftAction ? (
            <Pressable
              onPress={leftAction.onPress}
              accessibilityLabel={leftAction.label}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                padding: SPACING.xs,
              })}
            >
              {leftAction.icon}
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}

          {/* Title */}
          {centered && (
            <VStack align="center" flex={1}>
              {typeof title === 'string' ? (
                <Text variant="heading2" color={colors.onSurface}>
                  {title}
                </Text>
              ) : (
                title
              )}
              {subtitle && (
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {subtitle}
                </Text>
              )}
            </VStack>
          )}

          {!centered && typeof title === 'string' && (
            <VStack flex={1}>
              <Text variant="heading2" color={colors.onSurface}>
                {title}
              </Text>
              {subtitle && (
                <Text variant="caption" color={colors.onSurfaceVariant}>
                  {subtitle}
                </Text>
              )}
            </VStack>
          )}

          {!centered && title && typeof title !== 'string' && (
            <View style={{ flex: 1 }}>{title}</View>
          )}

          {/* Right Actions */}
          <HStack gap="sm">
            {rightActions?.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                accessibilityLabel={action.label}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  padding: SPACING.xs,
                })}
              >
                {action.icon}
              </Pressable>
            ))}
          </HStack>
        </HStack>
      </View>
    );
  },
);

AppBar.displayName = 'AppBar';
