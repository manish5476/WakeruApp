// src/components/ui/Badge.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';

// Added 'info', 'sponsored', and 'verified' and explicitly typed the union
export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'accent'
  | 'info'
  | 'sponsored'
  | 'verified';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const theme = useTheme();

  // Mapping strictly to your theme colors
  const colorMap: Record<BadgeVariant, { bg: string; text: string }> = {
    primary: { bg: theme.colors.primaryBg, text: theme.colors.primary },
    success: { bg: theme.colors.successBg, text: theme.colors.success },
    warning: { bg: theme.colors.warningBg, text: theme.colors.warning },
    danger: { bg: theme.colors.dangerBg, text: theme.colors.danger },
    accent: { bg: `${theme.colors.accent}20`, text: theme.colors.accent },
    // Added Info variant
    info: { bg: theme.colors.infoBg, text: theme.colors.info },
    sponsored: {
      bg: `${theme.colors.accent || '#8B5CF6'}25`,
      text: theme.colors.accent || '#8B5CF6',
    },
    verified: {
      bg: theme.colors.successBg || 'rgba(16, 185, 129, 0.15)',
      text: theme.colors.success || '#10B981',
    },
    // Fixed Neutral to use the proper textTertiary color instead of hardcoded
    neutral: {
      bg: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      text: theme.colors.textTertiary,
    },
  };

  const { bg, text } = colorMap[variant];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderRadius: theme.borderRadius.md,
          paddingHorizontal: theme.spacing['2'],
          paddingVertical: theme.spacing['1'],
        },
        style,
      ]}
    >
      <Typography
        variant="caption"
        weight="bold"
        style={{ color: text, textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
