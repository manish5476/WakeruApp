import React from 'react';
import { ViewStyle } from 'react-native';
import { Box, BoxProps } from '../primitives/Box';

export interface RowProps extends BoxProps {
  spacing?: keyof typeof import('../../tokens/tokens').SPACING;
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
    gap: spacing ? require('../../tokens/tokens').SPACING[spacing] : undefined,
  };

  return (
    <Box style={[dynamicStyle, style]} {...rest}>
      {children}
    </Box>
  );
};
