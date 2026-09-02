/**
 * TripSplit Typography System
 * Defines all typography scales, variants, and text styles
 * Uses Inter (body) and Space Grotesk (display) for premium appearance
 */

import { TextStyle, Platform } from 'react-native';

// Font families
export const FONTS = {
  INTER_THIN: 'Inter-Thin',
  INTER_LIGHT: 'Inter-Light',
  INTER_REGULAR: 'Inter-Regular',
  INTER_MEDIUM: 'Inter-Medium',
  INTER_SEMIBOLD: 'Inter-SemiBold',
  INTER_BOLD: 'Inter-Bold',
  INTER_EXTRABOLD: 'Inter-ExtraBold',
  INTER_BLACK: 'Inter-Black',
  SPACE_GROTESK_LIGHT: 'SpaceGrotesk-Light',
  SPACE_GROTESK_REGULAR: 'SpaceGrotesk-Regular',
  SPACE_GROTESK_MEDIUM: 'SpaceGrotesk-Medium',
  SPACE_GROTESK_SEMIBOLD: 'SpaceGrotesk-SemiBold',
  SPACE_GROTESK_BOLD: 'SpaceGrotesk-Bold',
} as const;

// Line heights
export const LINE_HEIGHTS = {
  TIGHT: 1.2,
  NORMAL: 1.4,
  RELAXED: 1.6,
  LOOSE: 1.8,
} as const;

// Typography scale - 14 variants covering all UI needs
export const TYPOGRAPHY = {
  // Display sizes (for headlines and prominent text)
  displayLarge: {
    fontFamily: FONTS.SPACE_GROTESK_BOLD,
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 48 * LINE_HEIGHTS.TIGHT,
    letterSpacing: -0.8,
  } as TextStyle,

  displayMedium: {
    fontFamily: FONTS.SPACE_GROTESK_BOLD,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 40 * LINE_HEIGHTS.TIGHT,
    letterSpacing: -0.6,
  } as TextStyle,

  displaySmall: {
    fontFamily: FONTS.SPACE_GROTESK_SEMIBOLD,
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 32 * LINE_HEIGHTS.TIGHT,
    letterSpacing: -0.4,
  } as TextStyle,

  // Heading sizes
  headingLarge: {
    fontFamily: FONTS.SPACE_GROTESK_SEMIBOLD,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 28 * LINE_HEIGHTS.TIGHT,
    letterSpacing: -0.3,
  } as TextStyle,

  headingMedium: {
    fontFamily: FONTS.SPACE_GROTESK_MEDIUM,
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 24 * LINE_HEIGHTS.NORMAL,
    letterSpacing: 0,
  } as TextStyle,

  headingSmall: {
    fontFamily: FONTS.SPACE_GROTESK_MEDIUM,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 20 * LINE_HEIGHTS.NORMAL,
    letterSpacing: 0.2,
  } as TextStyle,

  // Title sizes
  titleLarge: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 18 * LINE_HEIGHTS.NORMAL,
    letterSpacing: 0.2,
  } as TextStyle,

  titleMedium: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16 * LINE_HEIGHTS.NORMAL,
    letterSpacing: 0.3,
  } as TextStyle,

  titleSmall: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 14 * LINE_HEIGHTS.NORMAL,
    letterSpacing: 0.4,
  } as TextStyle,

  // Body text
  bodyLarge: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 16 * LINE_HEIGHTS.RELAXED,
    letterSpacing: 0.2,
  } as TextStyle,

  bodyMedium: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 14 * LINE_HEIGHTS.RELAXED,
    letterSpacing: 0.3,
  } as TextStyle,

  bodySmall: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 12 * LINE_HEIGHTS.RELAXED,
    letterSpacing: 0.4,
  } as TextStyle,

  // Label sizes (for buttons, tags, badges)
  labelLarge: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 14 * LINE_HEIGHTS.NORMAL,
    letterSpacing: 0.5,
  } as TextStyle,

  labelSmall: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 12 * LINE_HEIGHTS.NORMAL,
    letterSpacing: 0.6,
  } as TextStyle,
} as const;

// Typography preset variants for quick access
export const TEXT_PRESETS = {
  hero: TYPOGRAPHY.displayLarge,
  h1: TYPOGRAPHY.headingLarge,
  h2: TYPOGRAPHY.headingMedium,
  h3: TYPOGRAPHY.headingSmall,
  title: TYPOGRAPHY.titleLarge,
  subtitle: TYPOGRAPHY.titleMedium,
  body: TYPOGRAPHY.bodyLarge,
  bodySmall: TYPOGRAPHY.bodySmall,
  button: TYPOGRAPHY.labelLarge,
  label: TYPOGRAPHY.labelSmall,
  caption: TYPOGRAPHY.bodySmall,
} as const;

// Font weight helpers
export const FONT_WEIGHTS = {
  thin: '100',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// Text style utilities
export const getTypography = (
  variant: keyof typeof TEXT_PRESETS,
): TextStyle => {
  return TEXT_PRESETS[variant];
};

export const createCustomTypography = (
  fontSize: number,
  fontFamily: string = FONTS.INTER_REGULAR,
  fontWeight: keyof typeof FONT_WEIGHTS = 'regular',
  lineHeight: number = fontSize * LINE_HEIGHTS.NORMAL,
  letterSpacing: number = 0,
): TextStyle => ({
  fontSize,
  fontFamily,
  fontWeight: FONT_WEIGHTS[fontWeight],
  lineHeight,
  letterSpacing,
});

// Platform-specific adjustments
export const getPlatformTypography = (style: TextStyle): TextStyle => {
  if (Platform.OS === 'ios') {
    return {
      ...style,
      fontFamily: style.fontFamily,
    };
  }
  return style;
};
