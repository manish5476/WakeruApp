import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from './AppIcon';
import { useTheme } from '../../providers/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export type ToastConfigParams<Props = any> = {
  text1?: string;
  text2?: string;
  onPress?: () => void;
  props?: Props;
  [key: string]: any;
};

interface CustomToastItemProps {
  toastType: 'success' | 'error' | 'warning' | 'info';
  text1?: string;
  text2?: string;
  onPress?: () => void;
  props?: {
    action?: ToastAction;
    [key: string]: any;
  };
}

function CustomToastItem({
  toastType,
  text1,
  text2,
  onPress,
  props,
}: CustomToastItemProps) {
  const theme = useTheme();
  const action = props?.action;

  const configByType = {
    success: {
      iconName: 'circle-check',
      iconColor: theme.colors.success || '#10B981',
      borderColor: theme.colors.successBorder || 'rgba(16, 185, 129, 0.35)',
      accentBg: theme.colors.successBg || 'rgba(16, 185, 129, 0.14)',
      defaultTitle: 'Success',
      actionColor: '#10B981',
    },
    error: {
      iconName: 'circle-alert',
      iconColor: theme.colors.danger || '#F43F5E',
      borderColor: 'rgba(244, 63, 94, 0.35)',
      accentBg: theme.colors.dangerBg || 'rgba(244, 63, 94, 0.14)',
      defaultTitle: 'Error',
      actionColor: '#F43F5E',
    },
    warning: {
      iconName: 'triangle-alert',
      iconColor: theme.colors.warning || '#F59E0B',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      accentBg: theme.colors.warningBg || 'rgba(245, 158, 11, 0.14)',
      defaultTitle: 'Notice',
      actionColor: '#F59E0B',
    },
    info: {
      iconName: 'info',
      iconColor: theme.colors.info || '#06B6D4',
      borderColor: 'rgba(6, 182, 212, 0.35)',
      accentBg: theme.colors.infoBg || 'rgba(6, 182, 212, 0.14)',
      defaultTitle: 'Information',
      actionColor: '#2563EB',
    },
  }[toastType];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Toast.hide();
    }
  };

  const handleActionPress = (e: any) => {
    e?.stopPropagation?.();
    Toast.hide();
    if (action?.onPress) {
      action.onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.outerContainer}
      accessibilityRole="alert"
      accessibilityLabel={`${text1 || configByType.defaultTitle}: ${text2 || ''}`}
    >
      <GlassCard
        variant="prominent"
        padding="none"
        solid={true}
        style={[
          styles.glassCard,
          {
            borderColor: configByType.borderColor,
            backgroundColor: theme.isDark ? '#18181B' : '#FFFFFF',
          },
        ]}
      >
        <View style={styles.cardContent}>
          {/* Leading Icon with subtle ambient badge */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: configByType.accentBg },
            ]}
          >
            <AppIcon
              name={configByType.iconName}
              size={20}
              color={configByType.iconColor}
            />
          </View>

          {/* Text Area */}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                { color: theme.colors.textPrimary },
                !text2 && styles.titleSingleLine,
              ]}
              numberOfLines={2}
            >
              {text1 || configByType.defaultTitle}
            </Text>
            {!!text2 && (
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
                numberOfLines={3}
              >
                {text2}
              </Text>
            )}
          </View>

          {/* Optional Action Button */}
          {action && (
            <Pressable
              onPress={handleActionPress}
              style={[
                styles.actionButton,
                {
                  backgroundColor: `${configByType.actionColor}18`,
                  borderColor: `${configByType.actionColor}35`,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  { color: configByType.actionColor },
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          )}

          {/* Dismiss button */}
          <Pressable
            onPress={e => {
              e.stopPropagation?.();
              Toast.hide();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
          >
            <AppIcon
              name="x"
              size={16}
              color={theme.colors.textTertiary || '#A1A1AA'}
            />
          </Pressable>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export const toastConfig: Record<
  string,
  (params: ToastConfigParams<any>) => React.ReactNode
> = {
  success: (props: ToastConfigParams<any>) => (
    <CustomToastItem {...props} toastType="success" />
  ),
  error: (props: ToastConfigParams<any>) => (
    <CustomToastItem {...props} toastType="error" />
  ),
  warning: (props: ToastConfigParams<any>) => (
    <CustomToastItem {...props} toastType="warning" />
  ),
  info: (props: ToastConfigParams<any>) => (
    <CustomToastItem {...props} toastType="info" />
  ),
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 99999,
  },
  glassCard: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : Math.min(SCREEN_WIDTH - 32, 480),
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 10px 32px rgba(0,0,0,0.18)',
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  titleSingleLine: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '400',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dismissButton: {
    padding: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
});
