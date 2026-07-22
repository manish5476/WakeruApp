import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme';

export interface ProgressProps {
  progress: number; // 0 to 100
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
}

export const Progress = ({
  progress,
  color,
  backgroundColor,
  height = 8,
  borderRadius,
}: ProgressProps) => {
  const { tokens } = useTheme();
  
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const containerStyle: ViewStyle = {
    height,
    width: '100%',
    backgroundColor: backgroundColor || tokens.colors.surfaceVariant,
    borderRadius: borderRadius ?? tokens.radius.pill,
    overflow: 'hidden',
  };

  const fillStyle: ViewStyle = {
    height: '100%',
    width: `${clampedProgress}%`,
    backgroundColor: color || tokens.colors.primary,
    borderRadius: borderRadius ?? tokens.radius.pill,
  };

  return (
    <View style={containerStyle}>
      <View style={fillStyle} />
    </View>
  );
};
