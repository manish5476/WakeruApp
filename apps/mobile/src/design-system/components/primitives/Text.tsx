import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from '../../tokens/typography';

export type TextVariant =
  | 'displayXL' | 'displayL' | 'displayM'
  | 'headingXL' | 'headingL' | 'headingM' | 'headingS'
  | 'bodyXL' | 'bodyL' | 'body' | 'bodySmall'
  | 'caption' | 'label' | 'code' | 'numeric';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string; // Optional custom color, defaults to theme.colors.text
  align?: TextStyle['textAlign'];
  weight?: keyof Typography['fonts'];
}

export const Text = ({
  variant = 'body',
  color,
  align = 'left',
  weight,
  style,
  children,
  ...rest
}: TextProps) => {
  const { tokens } = useTheme();

  // Map variant to typography tokens
  const getVariantStyles = (): TextStyle => {
    switch (variant) {
      case 'displayXL':
        return { fontSize: tokens.typography.sizes.display, lineHeight: tokens.typography.sizes.display * tokens.typography.lineHeights.tight, fontFamily: tokens.typography.fonts.bold };
      case 'displayL':
        return { fontSize: tokens.typography.sizes.huge, lineHeight: tokens.typography.sizes.huge * tokens.typography.lineHeights.tight, fontFamily: tokens.typography.fonts.bold };
      case 'displayM':
        return { fontSize: tokens.typography.sizes.xxxl, lineHeight: tokens.typography.sizes.xxxl * tokens.typography.lineHeights.tight, fontFamily: tokens.typography.fonts.bold };
      case 'headingXL':
        return { fontSize: tokens.typography.sizes.xxl, lineHeight: tokens.typography.sizes.xxl * tokens.typography.lineHeights.tight, fontFamily: tokens.typography.fonts.bold };
      case 'headingL':
        return { fontSize: tokens.typography.sizes.xl, lineHeight: tokens.typography.sizes.xl * tokens.typography.lineHeights.tight, fontFamily: tokens.typography.fonts.semiBold };
      case 'headingM':
        return { fontSize: tokens.typography.sizes.lg, lineHeight: tokens.typography.sizes.lg * tokens.typography.lineHeights.tight, fontFamily: tokens.typography.fonts.semiBold };
      case 'headingS':
        return { fontSize: tokens.typography.sizes.md, lineHeight: tokens.typography.sizes.md * tokens.typography.lineHeights.tight, fontFamily: tokens.typography.fonts.medium };
      case 'bodyXL':
        return { fontSize: tokens.typography.sizes.lg, lineHeight: tokens.typography.sizes.lg * tokens.typography.lineHeights.normal, fontFamily: tokens.typography.fonts.regular };
      case 'bodyL':
        return { fontSize: tokens.typography.sizes.md, lineHeight: tokens.typography.sizes.md * tokens.typography.lineHeights.normal, fontFamily: tokens.typography.fonts.regular };
      case 'body':
        return { fontSize: tokens.typography.sizes.sm, lineHeight: tokens.typography.sizes.sm * tokens.typography.lineHeights.normal, fontFamily: tokens.typography.fonts.regular };
      case 'bodySmall':
        return { fontSize: tokens.typography.sizes.xs, lineHeight: tokens.typography.sizes.xs * tokens.typography.lineHeights.normal, fontFamily: tokens.typography.fonts.regular };
      case 'caption':
        return { fontSize: tokens.typography.sizes.xs, lineHeight: tokens.typography.sizes.xs * tokens.typography.lineHeights.normal, fontFamily: tokens.typography.fonts.regular, color: tokens.colors.textSecondary };
      case 'label':
        return { fontSize: tokens.typography.sizes.sm, lineHeight: tokens.typography.sizes.sm * tokens.typography.lineHeights.normal, fontFamily: tokens.typography.fonts.medium };
      case 'code':
        return { fontSize: tokens.typography.sizes.sm, fontFamily: 'monospace' }; // or custom mono font
      case 'numeric':
        return { fontSize: tokens.typography.sizes.md, fontFamily: tokens.typography.fonts.medium, fontVariant: ['tabular-nums'] };
      default:
        return { fontSize: tokens.typography.sizes.sm, fontFamily: tokens.typography.fonts.regular };
    }
  };

  const baseStyle: TextStyle = {
    color: color || tokens.colors.text,
    textAlign: align,
    ...getVariantStyles(),
  };

  if (weight) {
    baseStyle.fontFamily = tokens.typography.fonts[weight];
  }

  return (
    <RNText style={[baseStyle, style]} {...rest}>
      {children}
    </RNText>
  );
};
