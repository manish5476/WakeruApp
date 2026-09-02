/**
 * Box Component
 * Base layout component that accepts all View props plus design system styling
 */

import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface BoxProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: keyof typeof SPACING | 'transparent' | string;
  padding?: keyof typeof SPACING;
  paddingH?: keyof typeof SPACING;
  paddingV?: keyof typeof SPACING;
  margin?: keyof typeof SPACING;
  marginH?: keyof typeof SPACING;
  marginV?: keyof typeof SPACING;
  borderRadius?: keyof typeof RADIUS;
  flexDirection?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  flex?: number;
  gap?: keyof typeof SPACING;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
  testID?: string;
}

export const Box: React.FC<BoxProps> = ({
  children,
  style,
  bg,
  padding,
  paddingH,
  paddingV,
  margin,
  marginH,
  marginV,
  borderRadius,
  flexDirection = 'column',
  alignItems,
  justifyContent,
  flex,
  gap,
  borderWidth,
  borderColor,
  opacity,
  testID,
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = (
    bgValue?: string | keyof typeof SPACING,
  ): string | undefined => {
    if (!bgValue) return undefined;
    if (bgValue === 'transparent') return 'transparent';
    if (bgValue.startsWith('#') || bgValue.startsWith('rgba')) return bgValue;
    return colors.surface;
  };

  const getPaddingValue = (p?: keyof typeof SPACING) =>
    p ? SPACING[p] : undefined;
  const getMarginValue = (m?: keyof typeof SPACING) =>
    m ? SPACING[m] : undefined;
  const getBorderRadius = (r?: keyof typeof RADIUS) =>
    r ? RADIUS[r] : undefined;
  const getGapValue = (g?: keyof typeof SPACING) =>
    g ? SPACING[g] : undefined;

  const boxStyle: ViewStyle = {
    flexDirection,
    ...(alignItems && { alignItems }),
    ...(justifyContent && { justifyContent }),
    ...(flex !== undefined && { flex }),
    ...(bg && { backgroundColor: getBackgroundColor(bg) }),
    ...(padding && { padding: getPaddingValue(padding) }),
    ...(paddingH && { paddingHorizontal: getPaddingValue(paddingH) }),
    ...(paddingV && { paddingVertical: getPaddingValue(paddingV) }),
    ...(margin && { margin: getMarginValue(margin) }),
    ...(marginH && { marginHorizontal: getMarginValue(marginH) }),
    ...(marginV && { marginVertical: getMarginValue(marginV) }),
    ...(borderRadius && { borderRadius: getBorderRadius(borderRadius) }),
    ...(gap && { gap: getGapValue(gap) }),
    ...(borderWidth && { borderWidth }),
    ...(borderColor && { borderColor }),
    ...(opacity !== undefined && { opacity }),
  };

  return (
    <View style={[boxStyle, style]} testID={testID}>
      {children}
    </View>
  );
};

export default Box;
