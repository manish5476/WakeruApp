import React, { useEffect } from 'react';
import { View, Pressable, Animated, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import { HStack, VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { useToast, Toast as ToastType } from '@/services/toast.service';
import { SPACING, RADIUS } from '../../tokens/tokens';

interface ToastItemProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { colors } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss(toast.id));
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, fadeAnim, onDismiss]);

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return colors.success || '#4CAF50';
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning || '#FF9800';
      case 'info':
      default:
        return colors.info || '#2196F3';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          backgroundColor: getBackgroundColor(),
          borderRadius: RADIUS.md,
          marginHorizontal: SPACING.md,
          marginVertical: SPACING.sm,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
          elevation: 5,
        }}
      >
        <HStack padding="md" align="center" gap="md">
          <Text style={{ fontSize: 20 }}>{getIcon()}</Text>
          <VStack flex={1} gap="xs">
            <Text variant="body" weight="semibold" color="#FFF">
              {toast.message}
            </Text>
            {toast.action && (
              <Pressable onPress={toast.action.onPress}>
                <Text
                  variant="caption"
                  weight="semibold"
                  color="#FFF"
                  style={{ textDecorationLine: 'underline' }}
                >
                  {toast.action.label}
                </Text>
              </Pressable>
            )}
          </VStack>
          <Pressable
            onPress={() => onDismiss(toast.id)}
            style={{ padding: SPACING.sm }}
          >
            <Text color="#FFF" style={{ fontSize: 18 }}>
              ×
            </Text>
          </Pressable>
        </HStack>
      </View>
    </Animated.View>
  );
};

export const ToastContainer: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { toasts, dismiss } = useToast();

  return (
    <View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          pointerEvents: 'box-none',
        },
        style,
      ]}
    >
      <VStack gap="sm" padding="md">
        {toasts.map((toast: any) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </VStack>
    </View>
  );
};

export const Toast = ToastItem;
