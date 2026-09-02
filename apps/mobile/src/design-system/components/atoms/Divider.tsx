/**
 * Divider Component
 * Visual separator for content
 */

import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../tokens/tokens';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  margin?: keyof typeof SPACING;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  margin = 'md',
  style,
  testID,
}) => {
  const { colors } = useTheme();

  const dividerStyle: ViewStyle = {
    backgroundColor: colors.border,
    ...(orientation === 'horizontal' && {
      height: thickness,
      width: '100%',
      marginVertical: SPACING[margin],
    }),
    ...(orientation === 'vertical' && {
      width: thickness,
      height: '100%',
      marginHorizontal: SPACING[margin],
    }),
  };

  return <View style={[dividerStyle, style]} testID={testID} />;
};

export default Divider;
