import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../../theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  marginVertical?: keyof typeof import('../../../tokens/spacing').spacing;
  marginHorizontal?: keyof typeof import('../../../tokens/spacing').spacing;
}

export const Divider = ({
  orientation = 'horizontal',
  thickness = 1,
  color,
  marginVertical,
  marginHorizontal,
}: DividerProps) => {
  const { tokens } = useTheme();

  const style: ViewStyle = {
    backgroundColor: color || tokens.colors.divider,
    marginVertical: marginVertical ? tokens.spacing[marginVertical] : 0,
    marginHorizontal: marginHorizontal ? tokens.spacing[marginHorizontal] : 0,
  };

  if (orientation === 'horizontal') {
    style.height = thickness;
    style.width = '100%';
  } else {
    style.width = thickness;
    style.height = '100%';
  }

  return <View style={style} />;
};
