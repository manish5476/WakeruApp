import React, { ReactNode } from 'react';
import { Modal, View, Pressable, ScrollView } from 'react-native';
import Text from '../primitives/Text';
import Button from '../atoms/Button';
import { VStack, HStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outlined';
}

export interface DialogProps {
  visible: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  actions: DialogAction[];
  icon?: ReactNode;
  onDismiss?: () => void;
  isDismissible?: boolean;
}

export const Dialog = React.forwardRef<View, DialogProps>(
  (
    {
      visible,
      title,
      message,
      children,
      actions,
      icon,
      onDismiss,
      isDismissible = true,
    },
    ref,
  ) => {
    const { colors } = useTheme();

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => isDismissible && onDismiss?.()}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => isDismissible && onDismiss?.()}
        >
          <Pressable
            ref={ref}
            onPress={e => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderRadius: RADIUS.lg,
              minWidth: '80%',
              maxWidth: '90%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <ScrollView
              style={{ maxHeight: '80%' }}
              showsVerticalScrollIndicator={false}
            >
              <VStack padding="lg" gap="md">
                {icon && (
                  <View
                    style={{ alignItems: 'center', marginBottom: SPACING.sm }}
                  >
                    {icon}
                  </View>
                )}

                <Text
                  variant="heading3"
                  weight="700"
                  color={colors.onSurface}
                  textAlign="center"
                >
                  {title}
                </Text>

                {message && (
                  <Text
                    variant="body"
                    color={colors.onSurfaceVariant}
                    textAlign="center"
                  >
                    {message}
                  </Text>
                )}

                {children}
              </VStack>
            </ScrollView>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.outline,
                paddingHorizontal: SPACING.lg,
                paddingVertical: SPACING.md,
              }}
            >
              <HStack gap="md" justify="flex-end">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    label={action.label}
                    onPress={action.onPress}
                    variant={
                      action.variant ||
                      (index === actions.length - 1 ? 'primary' : 'outlined')
                    }
                    size="sm"
                  />
                ))}
              </HStack>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  },
);

Dialog.displayName = 'Dialog';
