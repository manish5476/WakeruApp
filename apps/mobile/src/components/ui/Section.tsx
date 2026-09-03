// src/components/ui/Section.tsx
import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function Section({
  children,
  title,
  subtitle,
  action,
  style,
}: SectionProps) {
  const { isMobile } = useResponsive();
  const theme = useTheme();

  return (
    <View style={[styles.container, { marginBottom: theme.spacing.xl }, style]}>
      {(title || action) && (
        <View style={[styles.header, { marginBottom: theme.spacing.md }]}>
          <View style={styles.headerLeft}>
            {title && (
              <Typography
                variant={isMobile ? 'title' : 'h3'}
                weight="bold"
                color="textPrimary"
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="bodySm"
                color="textTertiary"
                style={{ marginTop: theme.spacing['1'] }}
              >
                {subtitle}
              </Typography>
            )}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
});
