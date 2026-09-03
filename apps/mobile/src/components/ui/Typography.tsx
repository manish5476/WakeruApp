// src/components/ui/Typography.tsx
import React from 'react';
import { Platform, Text, TextProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'overline';

// Accept actual color keys from your Theme interface
export type TypographyColor =
  | 'primary'
  | 'textPrimary'
  | 'textSecondary'
  | 'textTertiary'
  | 'textInverse'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  color?: TypographyColor;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  animated?: boolean;
  opacity?: number;
  truncate?: boolean;
  /** Enables a subtle high-end letter spacing, tighter tracking, and crisp rendering options */
  premium?: boolean;
  children: React.ReactNode;
}

export function Typography({
  variant = 'body',
  weight,
  color = 'textPrimary',
  align = 'auto',
  animated = false,
  opacity = 1,
  truncate = false,
  premium = false,
  style,
  children,
  ...props
}: TypographyProps) {
  const theme = useTheme();

  const getVariantStyle = () => {
    const f = theme.typography.fontSize;
    const l = theme.typography.lineHeight;

    // Premium tweaks adjust tracking and line height slightly for executive typography
    const trackingOffset = premium ? -0.4 : 0;

    switch (variant) {
      case 'display':
        return {
          fontSize: f['5xl'],
          lineHeight: f['5xl'] * (l.tight - 0.05),
          fontWeight: theme.typography.fontWeight.black,
          letterSpacing:
            (theme.typography.letterSpacing.tight || -0.5) + trackingOffset,
        };
      case 'h1':
        return {
          fontSize: f['4xl'],
          lineHeight: f['4xl'] * (l.tight - 0.05),
          fontWeight: theme.typography.fontWeight.extrabold,
          letterSpacing:
            (theme.typography.letterSpacing.tight || -0.4) + trackingOffset,
        };
      case 'h2':
        return {
          fontSize: f['3xl'],
          lineHeight: f['3xl'] * l.tight,
          fontWeight: theme.typography.fontWeight.extrabold,
          letterSpacing:
            (theme.typography.letterSpacing.tight || -0.3) + trackingOffset,
        };
      case 'h3':
        return {
          fontSize: f['2xl'],
          lineHeight: f['2xl'] * l.tight,
          fontWeight: theme.typography.fontWeight.bold,
          letterSpacing: trackingOffset,
        };
      case 'title':
        return {
          fontSize: f.xl,
          lineHeight: f.xl * l.normal,
          fontWeight: theme.typography.fontWeight.bold,
          letterSpacing: -0.2,
        };
      case 'subtitle':
        return {
          fontSize: f.lg,
          lineHeight: f.lg * l.normal,
          fontWeight: theme.typography.fontWeight.semibold,
        };
      case 'body':
        return {
          fontSize: f.base,
          lineHeight: f.base * l.relaxed,
          fontWeight: theme.typography.fontWeight.normal,
        };
      case 'bodySm':
        return {
          fontSize: f.sm,
          lineHeight: f.sm * l.relaxed,
          fontWeight: theme.typography.fontWeight.normal,
        };
      case 'caption':
        return {
          fontSize: f.xs,
          lineHeight: f.xs * l.normal,
          fontWeight: theme.typography.fontWeight.medium,
        };
      case 'overline':
        return {
          fontSize: f.xs,
          lineHeight: f.xs * l.normal,
          fontWeight: theme.typography.fontWeight.extrabold,
          letterSpacing:
            (theme.typography.letterSpacing.wider || 1) + (premium ? 0.4 : 0),
          textTransform: 'uppercase' as const,
        };
      default:
        return { fontSize: f.base, lineHeight: f.base * l.relaxed };
    }
  };

  const variantStyle = getVariantStyle();
  const fontWeight = weight
    ? theme.typography.fontWeight[weight]
    : variantStyle.fontWeight;

  const baseStyle = {
    fontFamily: theme.typography.fontFamily.sans,
    ...variantStyle,
    fontWeight,
    color: theme.colors[color],
    textAlign: align,
    opacity,
    ...(Platform.OS === 'web' && premium
      ? { textRendering: 'optimizeLegibility' }
      : {}),
  };

  const textProps = {
    ...props,
    ...(truncate ? { numberOfLines: 1, ellipsizeMode: 'tail' as const } : {}),
  };

  if (animated) {
    return (
      <Animated.Text style={[baseStyle, style]} {...textProps}>
        {children}
      </Animated.Text>
    );
  }
  return (
    <Text style={[baseStyle, style]} {...textProps}>
      {children}
    </Text>
  );
}
// // src/components/ui/Typography.tsx
// import React from 'react';
// import { Text, TextProps } from 'react-native';
// import Animated from 'react-native-reanimated';
// import { useTheme } from '../../providers/ThemeProvider';

// export type TypographyVariant =
//     | 'display' | 'h1' | 'h2' | 'h3' | 'title' | 'subtitle' | 'body' | 'bodySm' | 'caption' | 'overline';

// // Accept actual color keys from your Theme interface
// export type TypographyColor =
//     | 'primary' | 'textPrimary' | 'textSecondary' | 'textTertiary' | 'textInverse'
//     | 'success' | 'warning' | 'danger' | 'info';

// export interface TypographyProps extends TextProps {
//     variant?: TypographyVariant;
//     weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
//     color?: TypographyColor;
//     align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
//     animated?: boolean;
//     opacity?: number;
//     truncate?: boolean;
//     children: React.ReactNode;
// }

// export function Typography({
//     variant = 'body',
//     weight,
//     color = 'textPrimary',
//     align = 'auto',
//     animated = false,
//     opacity = 1,
//     truncate = false,
//     style,
//     children,
//     ...props
// }: TypographyProps) {
//     const theme = useTheme();

//     const getVariantStyle = () => {
//         const f = theme.typography.fontSize;
//         const l = theme.typography.lineHeight;
//         switch (variant) {
//             case 'display': return { fontSize: f['5xl'], lineHeight: f['5xl'] * l.tight, fontWeight: theme.typography.fontWeight.bold, letterSpacing: theme.typography.letterSpacing.tight };
//             case 'h1': return { fontSize: f['4xl'], lineHeight: f['4xl'] * l.tight, fontWeight: theme.typography.fontWeight.bold, letterSpacing: theme.typography.letterSpacing.tight };
//             case 'h2': return { fontSize: f['3xl'], lineHeight: f['3xl'] * l.tight, fontWeight: theme.typography.fontWeight.semibold, letterSpacing: theme.typography.letterSpacing.tight };
//             case 'h3': return { fontSize: f['2xl'], lineHeight: f['2xl'] * l.tight, fontWeight: theme.typography.fontWeight.semibold };
//             case 'title': return { fontSize: f.xl, lineHeight: f.xl * l.normal, fontWeight: theme.typography.fontWeight.semibold };
//             case 'subtitle': return { fontSize: f.lg, lineHeight: f.lg * l.normal, fontWeight: theme.typography.fontWeight.medium };
//             case 'body': return { fontSize: f.base, lineHeight: f.base * l.relaxed, fontWeight: theme.typography.fontWeight.normal };
//             case 'bodySm': return { fontSize: f.sm, lineHeight: f.sm * l.relaxed, fontWeight: theme.typography.fontWeight.normal };
//             case 'caption': return { fontSize: f.xs, lineHeight: f.xs * l.normal, fontWeight: theme.typography.fontWeight.normal };
//             case 'overline': return { fontSize: f.xs, lineHeight: f.xs * l.normal, fontWeight: theme.typography.fontWeight.bold, letterSpacing: theme.typography.letterSpacing.wider, textTransform: 'uppercase' as const };
//             default: return { fontSize: f.base, lineHeight: f.base * l.relaxed };
//         }
//     };

//     const variantStyle = getVariantStyle();
//     const fontWeight = weight ? theme.typography.fontWeight[weight] : variantStyle.fontWeight;

//     const baseStyle = {
//         fontFamily: theme.typography.fontFamily.sans,
//         ...variantStyle,
//         fontWeight,
//         color: theme.colors[color], // Now safely maps correctly
//         textAlign: align,
//         opacity,
//     };

//     const textProps = {
//         ...props,
//         ...(truncate ? { numberOfLines: 1, ellipsizeMode: 'tail' as const } : {}),
//     };

//     if (animated) {
//         return <Animated.Text style={[baseStyle, style]} {...textProps}>{children}</Animated.Text>;
//     }
//     return <Text style={[baseStyle, style]} {...textProps}>{children}</Text>;
// }
