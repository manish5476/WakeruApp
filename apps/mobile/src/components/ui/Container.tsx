// src/components/ui/Container.tsx
import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../providers/ThemeProvider';

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  padding?: boolean;
  style?: ViewStyle;
}

export function Container({
  children,
  maxWidth = 1700,
  padding = true,
  style,
}: ContainerProps) {
  const { isWideScreen } = useResponsive();
  const theme = useTheme();

  // '3xl' doesn't exist on your spacing keys, but '3xl' does.
  // For premium layout sizing, we'll use '5xl' if it exists, otherwise we'll default to '10'.
  // Assuming '5xl' is 48px, and '10' is 40px. We'll use 48 as a safe hardcoded desktop padding.
  const desktopPadding = 48;

  return (
    <View
      style={[
        styles.container,
        {
          maxWidth: isWideScreen ? maxWidth : '100%',
          paddingHorizontal: padding
            ? isWideScreen
              ? desktopPadding
              : theme.spacing.lg
            : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignSelf: 'center' },
});
