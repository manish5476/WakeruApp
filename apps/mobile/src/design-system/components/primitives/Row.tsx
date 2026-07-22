import React from 'react';
import { ViewStyle } from 'react-native';
import { Box, BoxProps } from './Box';

export interface RowProps extends BoxProps {
  spacing?: keyof typeof import('../../tokens/spacing').spacing;
  wrap?: boolean;
}

export const Row = ({
  spacing,
  wrap,
  alignItems = 'center',
  style,
  children,
  ...rest
}: RowProps) => {
  const dynamicStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    gap: spacing ? require('../../tokens').spacing[spacing] : undefined,
  };

  return (
    <Box style={[dynamicStyle, style]} {...rest}>
      {children}
    </Box>
  );
};
