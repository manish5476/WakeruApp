import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleProp, FlexAlignType } from 'react-native';
import { SPACING } from '../../tokens/tokens';

export interface StackProps {
  children: ReactNode;
  gap?: keyof typeof SPACING;
  padding?: keyof typeof SPACING;
  paddingH?: keyof typeof SPACING;
  paddingV?: keyof typeof SPACING;
  align?: FlexAlignType;
  justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  flex?: number;
  width?: string | number;
  height?: string | number;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const VStack = React.forwardRef<View, StackProps>(
  (
    {
      children,
      gap = 'md',
      padding,
      paddingH,
      paddingV,
      align = 'stretch',
      justify = 'flex-start',
      flex,
      width,
      height,
      backgroundColor,
      borderRadius,
      borderWidth,
      borderColor,
      style,
      testID,
    },
    ref,
  ) => {
    const gapValue = SPACING[gap];
    const paddingValue = padding ? SPACING[padding] : undefined;
    const paddingHValue = paddingH ? SPACING[paddingH] : undefined;
    const paddingVValue = paddingV ? SPACING[paddingV] : undefined;

    const styles: ViewStyle = {
      flexDirection: 'column',
      gap: gapValue,
      alignItems: align,
      justifyContent: justify,
      flex: flex,
      width: width,
      height: height,
      paddingHorizontal: paddingHValue,
      paddingVertical: paddingVValue,
      paddingTop: paddingValue,
      paddingBottom: paddingValue,
      paddingLeft: paddingValue,
      paddingRight: paddingValue,
      backgroundColor,
      borderRadius,
      borderWidth,
      borderColor,
    };

    return (
      <View ref={ref} style={[styles, style]} testID={testID}>
        {children}
      </View>
    );
  },
);

VStack.displayName = 'VStack';

export const HStack = React.forwardRef<View, StackProps>(
  (
    {
      children,
      gap = 'md',
      padding,
      paddingH,
      paddingV,
      align = 'center',
      justify = 'flex-start',
      flex,
      width,
      height,
      backgroundColor,
      borderRadius,
      borderWidth,
      borderColor,
      style,
      testID,
    },
    ref,
  ) => {
    const gapValue = SPACING[gap];
    const paddingValue = padding ? SPACING[padding] : undefined;
    const paddingHValue = paddingH ? SPACING[paddingH] : undefined;
    const paddingVValue = paddingV ? SPACING[paddingV] : undefined;

    const styles: ViewStyle = {
      flexDirection: 'row',
      gap: gapValue,
      alignItems: align,
      justifyContent: justify,
      flex: flex,
      width: width,
      height: height,
      paddingHorizontal: paddingHValue,
      paddingVertical: paddingVValue,
      paddingTop: paddingValue,
      paddingBottom: paddingValue,
      paddingLeft: paddingValue,
      paddingRight: paddingValue,
      backgroundColor,
      borderRadius,
      borderWidth,
      borderColor,
    };

    return (
      <View ref={ref} style={[styles, style]} testID={testID}>
        {children}
      </View>
    );
  },
);

HStack.displayName = 'HStack';

export const Spacer = ({ flex = 1 }: { flex?: number }) => {
  return <View style={{ flex }} />;
};
