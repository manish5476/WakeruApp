import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Spacing } from '../../tokens/spacing';

export interface BoxProps extends ViewProps {
  padding?: keyof Spacing;
  paddingHorizontal?: keyof Spacing;
  paddingVertical?: keyof Spacing;
  paddingTop?: keyof Spacing;
  paddingBottom?: keyof Spacing;
  paddingLeft?: keyof Spacing;
  paddingRight?: keyof Spacing;
  
  margin?: keyof Spacing;
  marginHorizontal?: keyof Spacing;
  marginVertical?: keyof Spacing;
  marginTop?: keyof Spacing;
  marginBottom?: keyof Spacing;
  marginLeft?: keyof Spacing;
  marginRight?: keyof Spacing;
  
  backgroundColor?: string;
  flex?: number;
  alignItems?: ViewStyle['alignItems'];
  justifyContent?: ViewStyle['justifyContent'];
  borderRadius?: keyof typeof import('../../tokens/radius').radius;
}

export const Box = ({
  padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, paddingLeft, paddingRight,
  margin, marginHorizontal, marginVertical, marginTop, marginBottom, marginLeft, marginRight,
  backgroundColor,
  flex,
  alignItems,
  justifyContent,
  borderRadius,
  style,
  children,
  ...rest
}: BoxProps) => {
  const { tokens } = useTheme();

  const dynamicStyle: ViewStyle = {
    padding: padding ? tokens.spacing[padding] : undefined,
    paddingHorizontal: paddingHorizontal ? tokens.spacing[paddingHorizontal] : undefined,
    paddingVertical: paddingVertical ? tokens.spacing[paddingVertical] : undefined,
    paddingTop: paddingTop ? tokens.spacing[paddingTop] : undefined,
    paddingBottom: paddingBottom ? tokens.spacing[paddingBottom] : undefined,
    paddingLeft: paddingLeft ? tokens.spacing[paddingLeft] : undefined,
    paddingRight: paddingRight ? tokens.spacing[paddingRight] : undefined,
    
    margin: margin ? tokens.spacing[margin] : undefined,
    marginHorizontal: marginHorizontal ? tokens.spacing[marginHorizontal] : undefined,
    marginVertical: marginVertical ? tokens.spacing[marginVertical] : undefined,
    marginTop: marginTop ? tokens.spacing[marginTop] : undefined,
    marginBottom: marginBottom ? tokens.spacing[marginBottom] : undefined,
    marginLeft: marginLeft ? tokens.spacing[marginLeft] : undefined,
    marginRight: marginRight ? tokens.spacing[marginRight] : undefined,

    backgroundColor: backgroundColor || tokens.colors.transparent,
    flex,
    alignItems,
    justifyContent,
    borderRadius: borderRadius ? tokens.radius[borderRadius] : undefined,
  };

  return (
    <View style={[dynamicStyle, style]} {...rest}>
      {children}
    </View>
  );
};
