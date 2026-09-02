import React from 'react';
import { ViewStyle } from 'react-native';
import { Box, BoxProps } from '../primitives/Box';

export interface GridProps extends BoxProps {
  columns?: number;
  spacing?: keyof typeof import('../../tokens/tokens').SPACING;
}

export const Grid = ({
  columns = 1,
  spacing,
  style,
  children,
  ...rest
}: GridProps) => {
  const dynamicStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing ? require('../../tokens/tokens').SPACING[spacing] : undefined,
  };

  // Basic grid implementation for React Native
  // In a real scenario, you might calculate item widths based on columns
  // e.g. width = (100% / columns) - (gap * (columns - 1) / columns)

  return (
    <Box style={[dynamicStyle, style]} {...rest}>
      {children}
    </Box>
  );
};
