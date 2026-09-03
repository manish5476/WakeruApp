// src/components/ui/Row.tsx
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../providers/ThemeProvider';

interface RowProps {
  children: React.ReactNode;
  gap?: number;
  wrap?: boolean;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?:
    'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  style?: ViewStyle;
  mobileStack?: boolean; // Stack vertically on mobile
}

export function Row({
  children,
  gap,
  wrap = false,
  align = 'flex-start',
  justify = 'flex-start',
  style,
  mobileStack = false,
}: RowProps) {
  const { isMobile } = useResponsive();
  const theme = useTheme();

  // Use theme spacing if gap isn't provided, otherwise hardcode
  const finalGap = gap ?? theme.spacing.md;

  return (
    <View
      style={[
        {
          flexDirection: mobileStack && isMobile ? 'column' : 'row',
          flexWrap: wrap ? 'wrap' : 'nowrap',
          alignItems: align,
          justifyContent: justify,
          gap: finalGap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
