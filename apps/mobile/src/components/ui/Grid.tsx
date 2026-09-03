// src/components/ui/Grid.tsx
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../providers/ThemeProvider';

interface GridProps {
  children: React.ReactNode;
  cols?: number | { mobile: number; tablet: number; desktop: number };
  gap?: number;
  style?: ViewStyle;
}

export function Grid({ children, cols = 2, gap, style }: GridProps) {
  const { isTablet, isDesktop } = useResponsive();
  const theme = useTheme();
  const finalGap = gap ?? theme.spacing.md;
  let numCols =
    typeof cols === 'number'
      ? cols
      : isDesktop
        ? cols.desktop
        : isTablet
          ? cols.tablet
          : cols.mobile;
  const childrenArray = React.Children.toArray(children);
  const halfGap = finalGap / 2;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -halfGap,
        },
        style,
      ]}
    >
      {childrenArray.map((child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / numCols}%` as any,
            paddingHorizontal: halfGap,
            paddingBottom: finalGap,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
