// components/common/EmptyState.tsx
import React, { ReactNode, useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import AppIcon from './AppIcon';

import type { Theme } from '../../theme';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  accessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  actionLabel,
  onAction,
  accessory,
  style,
}: EmptyStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => emptyStyles(theme), [theme]);

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={[styles.container, style]}
    >
      {/* Icon Aura */}
      <Animated.View entering={ZoomIn.duration(220)} style={styles.iconSurface}>
        <AppIcon name={icon as any} size={28} color={theme.colors.primary} />
      </Animated.View>

      {/* Title */}
      <Typography variant="h3" weight="extrabold" align="center" premium>
        {title}
      </Typography>

      {/* Description */}
      {description && (
        <Typography
          variant="bodySm"
          color="textSecondary"
          align="center"
          style={styles.descriptionText}
        >
          {description}
        </Typography>
      )}

      {accessory}

      {/* Action Button */}
      {actionLabel && onAction && (
        <View style={styles.buttonWrap}>
          <Button
            title={actionLabel}
            variant="primary"
            size="md"
            onPress={() => {
              haptics.light();
              onAction();
            }}
          />
        </View>
      )}
    </Animated.View>
  );
}

function emptyStyles(theme: Theme) {
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
      borderColor: `${theme.colors.primary}30`,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,

      ...Platform.select({
        web: {
          boxShadow: `0 8px 24px ${theme.colors.primary}15`,
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
    descriptionText: {
      marginTop: 6,
      maxWidth: 320,
      lineHeight: 18,
    },
    buttonWrap: {
      marginTop: 18,
    },
  });
}
