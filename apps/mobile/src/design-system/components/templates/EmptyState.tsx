import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import Button from '../atoms/Button';
import { VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../tokens/tokens';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  image?: ReactNode;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  testID?: string;
}

export const EmptyState = React.forwardRef<View, EmptyStateProps>(
  ({ icon, title, message, image, action, style, testID }, ref) => {
    const { colors } = useTheme();

    return (
      <View
        ref={ref}
        style={[
          {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.xl,
          },
          style,
        ]}
        testID={testID}
      >
        <VStack align="center" gap="lg">
          {/* Icon or Image */}
          {image && <View style={{ marginBottom: SPACING.md }}>{image}</View>}
          {icon && !image && (
            <View style={{ marginBottom: SPACING.md }}>{icon}</View>
          )}

          {/* Title */}
          <Text
            variant="heading3"
            weight="700"
            color={colors.onSurface}
            textAlign="center"
          >
            {title}
          </Text>

          {/* Message */}
          {message && (
            <Text
              variant="body"
              color={colors.onSurfaceVariant}
              textAlign="center"
              numberOfLines={3}
              style={{ maxWidth: '90%' }}
            >
              {message}
            </Text>
          )}

          {/* Action */}
          {action && (
            <Button
              label={action.label}
              onPress={action.onPress}
              variant="primary"
              style={{ marginTop: SPACING.md }}
            />
          )}
        </VStack>
      </View>
    );
  },
);

EmptyState.displayName = 'EmptyState';
