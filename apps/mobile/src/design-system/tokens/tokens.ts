/**
 * TripSplit Design Tokens
 * Core tokens for spacing, radius, shadows, and base styling
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

export const OPACITY = {
  disabled: 0.5,
  hover: 0.7,
  pressed: 0.6,
  light: 0.2,
  lighter: 0.1,
} as const;

export const BORDER_WIDTH = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
} as const;

// Elevation system (for layering)
export const ELEVATION = {
  none: 0,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
  modal: 5,
} as const;

// Glass effect tokens
export const GLASS = {
  blur: 20,
  blurLarge: 40,
  opacity: 0.8,
  opacityLight: 0.6,
  opacityLighter: 0.4,
} as const;

// Animation timing
export const TIMING = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
} as const;

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Z-index layers
export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
} as const;

// Color opacity levels
export const COLOR_OPACITY = {
  '0': 0,
  '5': 0.05,
  '10': 0.1,
  '15': 0.15,
  '20': 0.2,
  '30': 0.3,
  '40': 0.4,
  '50': 0.5,
  '60': 0.6,
  '70': 0.7,
  '80': 0.8,
  '90': 0.9,
  '100': 1,
} as const;

// Border radius helpers
export const getBorderRadius = (
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full',
) => RADIUS[size];

// Spacing helpers
export const getSpacing = (multiplier: number) => SPACING.md * multiplier;

// Shadow helpers
export const getShadow = (level: 'sm' | 'md' | 'lg' | 'xl') => SHADOWS[level];

export type SpacingKey = keyof typeof SPACING;
export type RadiusKey = keyof typeof RADIUS;
export type ShadowKey = keyof typeof SHADOWS;
export type TimingKey = keyof typeof TIMING;
