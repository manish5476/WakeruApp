import React from 'react';
import { View, type ViewProps } from 'react-native';

export interface BlurViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  experimentalBlurMethod?: string;
  children?: React.ReactNode;
}

export function BlurView({
  intensity = 50,
  tint = 'dark',
  style,
  children,
  ...props
}: BlurViewProps) {
  const isDark = tint === 'dark';
  const alpha = Math.min(Math.max((intensity / 100) * 0.7, 0.2), 0.9);
  const bgColor = isDark
    ? `rgba(15, 23, 42, ${alpha})`
    : `rgba(255, 255, 255, ${alpha})`;

  return (
    <View
      style={[
        {
          backgroundColor: bgColor,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export default BlurView;
