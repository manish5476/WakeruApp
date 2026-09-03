import React from 'react';
import { View, type ViewProps } from 'react-native';

let NativeLinearGradient: React.ComponentType<any> | null = null;
try {
  NativeLinearGradient = require('react-native-linear-gradient').default;
} catch {
  NativeLinearGradient = null;
}

export interface LinearGradientProps extends ViewProps {
  colors: readonly string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  children?: React.ReactNode;
}

export function LinearGradient({
  colors,
  start,
  end,
  locations,
  style,
  children,
  ...props
}: LinearGradientProps) {
  if (NativeLinearGradient) {
    return (
      <NativeLinearGradient
        colors={colors}
        start={start}
        end={end}
        locations={locations}
        style={style}
        {...props}
      >
        {children}
      </NativeLinearGradient>
    );
  }

  const fallbackColor = colors && colors.length > 0 ? colors[0] : 'transparent';
  return (
    <View style={[{ backgroundColor: fallbackColor }, style]} {...props}>
      {children}
    </View>
  );
}

export default LinearGradient;
