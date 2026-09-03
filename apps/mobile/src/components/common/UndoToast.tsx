// src/components/common/UndoToast.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { haptics } from '../../utils/haptics';
import AppIcon from './AppIcon';

export type UndoToastVariant = 'default' | 'success' | 'warning' | 'danger';
export type UndoToastPosition = 'bottom' | 'top';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
  variant?: UndoToastVariant;
  position?: UndoToastPosition;
  /**
   * If true, shows an icon next to the message
   */
  showIcon?: boolean;
  /**
   * Custom icon name
   */
  iconName?: string;
  /**
   * If true, the toast will be dismissible by swiping down
   */
  swipeToDismiss?: boolean;
  /**
   * Custom undo button text
   */
  undoText?: string;
  /**
   * If true, shows a progress bar indicating remaining time
   */
  showProgress?: boolean;
  /**
   * Action button configuration (optional secondary action)
   */
  action?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  };
}

export function UndoToast({
  message,
  onUndo,
  onDismiss,
  duration = 4000,
  variant = 'default',
  position = 'bottom',
  showIcon = true,
  iconName = 'info',
  swipeToDismiss = true,
  undoText = 'UNDO',
  showProgress = true,
  action,
}: UndoToastProps) {
  const theme = useTheme();

  // --- Animation Values ---
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const progress = useSharedValue(1);

  // --- Variant Config ---
  const variantConfig = {
    default: {
      icon: iconName,
      iconColor: theme.colors.textTertiary,
      progressColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    success: {
      icon: 'check-circle',
      iconColor: theme.colors.success,
      progressColor: theme.colors.success,
      backgroundColor: theme.colors.successBg,
    },
    warning: {
      icon: 'alert-triangle',
      iconColor: theme.colors.warning,
      progressColor: theme.colors.warning,
      backgroundColor: theme.colors.warningBg,
    },
    danger: {
      icon: 'alert-circle',
      iconColor: theme.colors.danger,
      progressColor: theme.colors.danger,
      backgroundColor: theme.colors.dangerBg,
    },
  };

  const config = variantConfig[variant];

  // --- Animations ---
  useEffect(() => {
    // Animate in
    translateY.value = withSpring(0, { damping: 18, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withSpring(1, { damping: 18, stiffness: 150 });

    // Auto dismiss
    const startTime = Date.now();

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1 - elapsed / duration);
      progress.value = withTiming(remaining, { duration: 100 });

      if (remaining > 0) {
        requestAnimationFrame(animateProgress);
      }
    };

    if (showProgress) {
      requestAnimationFrame(animateProgress);
    }

    const timer = setTimeout(() => {
      dismissToast();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // --- Dismiss ---
  const dismissToast = () => {
    translateY.value = withTiming(100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.95, { duration: 300 });
    progress.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      onDismiss();
    }, 350);
  };

  // --- Handlers ---
  const handleUndo = () => {
    haptics.medium();
    onUndo();
    dismissToast();
  };

  const handleAction = () => {
    if (action) {
      haptics.light();
      action.onPress();
      dismissToast();
    }
  };

  const handleSwipe = () => {
    if (swipeToDismiss) {
      haptics.light();
      dismissToast();
    }
  };

  // --- Animated Styles ---
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  // --- Position Styles ---
  const positionStyle =
    position === 'top'
      ? { top: Platform.OS === 'ios' ? 60 : 40 }
      : { bottom: 100 };

  return (
    <Animated.View
      style={[styles.wrapper, positionStyle, containerStyle]}
      {...(swipeToDismiss && {
        onTouchEnd: handleSwipe,
      })}
    >
      <GlassCard
        variant="prominent"
        padding="md"
        intensity={theme.isDark ? 30 : 50}
        style={[
          styles.container,
          {
            borderColor:
              variant !== 'default' ? config.iconColor : theme.colors.border,
            borderWidth: variant !== 'default' ? 1.5 : 1,
          },
        ]}
      >
        <View style={styles.content}>
          {/* Icon */}
          {showIcon && (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: `${config.iconColor}15`,
                  borderRadius: theme.borderRadius.md,
                },
              ]}
            >
              <AppIcon name={config.icon} size={20} color={config.iconColor} />
            </View>
          )}

          {/* Message */}
          <View style={styles.messageContainer}>
            <Typography
              variant="body"
              weight="medium"
              color="textPrimary"
              numberOfLines={2}
            >
              {message}
            </Typography>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {action && (
              <InteractiveWrapper onPress={handleAction}>
                <View
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor:
                        variant === 'default'
                          ? theme.colors.primaryBg
                          : `${config.iconColor}15`,
                    },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    color={variant === 'default' ? 'primary' : 'textSecondary'}
                    style={styles.actionText}
                  >
                    {action.label}
                  </Typography>
                </View>
              </InteractiveWrapper>
            )}

            <InteractiveWrapper onPress={handleUndo}>
              <View
                style={[
                  styles.undoButton,
                  { backgroundColor: theme.colors.primaryBg },
                ]}
              >
                <AppIcon
                  name="refresh-cw"
                  size={14}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="caption"
                  weight="bold"
                  color="primary"
                  style={styles.undoText}
                >
                  {undoText}
                </Typography>
              </View>
            </InteractiveWrapper>
          </View>
        </View>

        {/* Progress Bar */}
        {showProgress && (
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.06)',
                marginTop: theme.spacing.sm,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: config.progressColor,
                },
                progressStyle,
              ]}
            />
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  messageContainer: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  undoText: {
    letterSpacing: 0.5,
    fontSize: 11,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    letterSpacing: 0.5,
    fontSize: 11,
  },
  progressTrack: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
});

// --- Helper Hook for Toast Management ---
import { useState, useCallback } from 'react';

interface ToastState {
  visible: boolean;
  message: string;
  onUndo: () => void;
  variant?: UndoToastVariant;
  duration?: number;
}

export function useUndoToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (
      message: string,
      onUndo: () => void,
      options?: {
        duration?: number;
        variant?: UndoToastVariant;
      },
    ) => {
      setToast({
        visible: true,
        message,
        onUndo,
        variant: options?.variant || 'default',
        duration: options?.duration || 4000,
      });
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const ToastComponent = useCallback(() => {
    if (!toast || !toast.visible) return null;

    return (
      <UndoToast
        message={toast.message}
        onUndo={() => {
          toast.onUndo();
          hideToast();
        }}
        onDismiss={hideToast}
        duration={toast.duration}
        variant={toast.variant}
      />
    );
  }, [toast, hideToast]);

  return {
    showToast,
    hideToast,
    ToastComponent,
  };
}
