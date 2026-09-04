// src/components/ui/Dialog.tsx
import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  ModalProps,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';
import { Button } from './Button';
import { GlassCard } from './GlassCard';

export interface DialogProps extends ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'danger';
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export function Dialog({
  visible,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  ...props
}: DialogProps) {
  const theme = useTheme();
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: theme.animation.duration.fast,
      });
      scale.value = withSpring(1, { damping: 15, stiffness: 250 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, {
        duration: theme.animation.duration.fast,
      });
      scale.value = withTiming(0.95, {
        duration: theme.animation.duration.fast,
      });
      translateY.value = withTiming(50, {
        duration: theme.animation.duration.fast,
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: isMobile ? translateY.value : 0 },
    ],
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      {...props}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                isMobile ? styles.mobileContainer : styles.desktopContainer,
                animatedStyle,
              ]}
            >
              <GlassCard style={{ padding: theme.spacing['6'], width: '100%' }}>
                {title && (
                  <Typography variant="h3" style={styles.title}>
                    {title}
                  </Typography>
                )}

                {description && (
                  <Typography
                    variant="body"
                    color="textSecondary"
                    style={styles.description}
                  >
                    {description}
                  </Typography>
                )}

                {children && <View style={styles.content}>{children}</View>}

                {(primaryAction || secondaryAction) && (
                  <View style={styles.actions}>
                    {secondaryAction && (
                      <Button
                        title={secondaryAction.label}
                        variant="ghost"
                        onPress={secondaryAction.onPress}
                        style={styles.secondaryButton}
                      />
                    )}
                    {primaryAction && (
                      <Button
                        title={primaryAction.label}
                        variant={primaryAction.variant || 'primary'}
                        onPress={primaryAction.onPress}
                        loading={primaryAction.loading}
                        style={styles.primaryButton}
                      />
                    )}
                  </View>
                )}
              </GlassCard>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
  },
  mobileContainer: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 500,
    marginHorizontal: 16,
  },
  desktopContainer: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    marginBottom: 16,
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 16,
  },
  secondaryButton: {
    width: '100%',
  },
  primaryButton: {
    width: '100%',
    minWidth: 100,
  },
});
