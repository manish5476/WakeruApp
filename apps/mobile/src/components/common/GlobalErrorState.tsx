// src/components/common/GlobalErrorState.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import AppIcon from './AppIcon';

import type { Theme } from '../../theme';

type GlobalErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

export function GlobalErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  onRetry,
  retryLabel = 'Try again',
  icon = 'triangle-alert',
  style,
}: GlobalErrorStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => errorStyles(theme), [theme]);

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={[styles.container, style]}
    >
      {/* Icon Aura */}
      <Animated.View entering={ZoomIn.duration(220)} style={styles.iconSurface}>
        <AppIcon name={icon as any} size={26} color="#EF4444" />
      </Animated.View>

      {/* Title */}
      <Typography variant="h3" weight="extrabold" align="center" premium>
        {title}
      </Typography>

      {/* Message */}
      <Typography
        variant="bodySm"
        color="textSecondary"
        align="center"
        style={styles.messageText}
      >
        {message}
      </Typography>

      {/* Retry Action */}
      {onRetry && (
        <View style={styles.buttonWrap}>
          <Button
            title={retryLabel}
            variant="outline"
            size="md"
            onPress={() => {
              haptics.medium();
              onRetry();
            }}
            leftIcon={
              <AppIcon
                name="refresh-cw"
                size={15}
                color={theme.colors.primary}
              />
            }
          />
        </View>
      )}
    </Animated.View>
  );
}

function errorStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
      width: '100%',
    },
    iconSurface: {
      width: 60,
      height: 60,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,

      ...Platform.select({
        web: {
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.12)',
        } as any,

        default: {
          shadowColor: '#000',

          shadowOffset: {
            width: 0,
            height: 4,
          },

          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4,
        },
      }),
    },
    messageText: {
      marginTop: 6,
      maxWidth: 320,
      lineHeight: 18,
    },
    buttonWrap: {
      marginTop: 18,
    },
  });
}
