import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';

let LinearGradientComponent: React.ComponentType<any> | null = null;
try {
  LinearGradientComponent = require('react-native-linear-gradient').default;
} catch {
  LinearGradientComponent = null;
}

interface GlobalBackgroundProps {
  children?: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
}

export function GlobalBackground({
  children,
  intensity = 'subtle',
}: GlobalBackgroundProps) {
  const theme = useAppTheme();
  const isDark = theme.isDark;

  const gradientColors = useMemo(() => {
    const { gradients } = theme;
    const defaultAura = isDark
      ? ['rgba(212,160,60,0.15)', 'rgba(6,182,212,0.15)']
      : ['rgba(212,160,60,0.08)', 'rgba(6,182,212,0.08)'];

    const presetGradient = (gradients as any)?.aura ?? defaultAura;
    const opacityMap = {
      subtle: isDark ? 0.3 : 0.2,
      medium: isDark ? 0.5 : 0.4,
      strong: isDark ? 0.8 : 0.7,
    };
    const opacity = opacityMap[intensity];

    return presetGradient.map((color: string) => {
      if (color.startsWith('rgba')) {
        const match = color.match(
          /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/,
        );
        if (match && match[1] && match[2] && match[3] && match[4]) {
          const [, r, g, b, a] = match;
          return `rgba(${r}, ${g}, ${b}, ${parseFloat(a) * opacity})`;
        }
      }
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
      return color;
    });
  }, [theme, isDark, intensity]);

  return (
    <View style={styles.container}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.colors.background },
        ]}
        pointerEvents="none"
      />
      {LinearGradientComponent ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradientComponent
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
});
