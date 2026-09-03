/**
 * TripSplit Native Theme System
 * Ported from Expo app — production-identical token system.
 */

export type ColorShade =
  50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

const palette = {
  neutral: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    850: '#1E1E21',
    900: '#18181B',
    950: '#09090B',
  },
  gold: {
    50: '#FDFBF7',
    100: '#F9F4E6',
    200: '#F2E5C2',
    300: '#E8D092',
    400: '#DDB864',
    500: '#D4A03C',
    600: '#B8862D',
    700: '#966A25',
    800: '#7A5422',
    900: '#63431D',
    950: '#3A2611',
  },
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  rose: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  teal: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },
} as const;

export const lightColors = {
  primary: palette.neutral[900],
  primaryLight: palette.neutral[700],
  primaryDark: palette.neutral[950],
  primaryBg: palette.neutral[50],
  primaryBorder: palette.neutral[200],

  secondary: palette.gold[500],
  secondaryLight: palette.gold[400],
  secondaryDark: palette.gold[600],
  secondaryBg: palette.gold[50],

  accent: palette.gold[500],
  accentLight: palette.gold[400],
  accentDark: palette.gold[600],

  success: palette.green[500],
  successLight: palette.green[50],
  successBg: palette.green[50],
  successBorder: palette.green[200],
  successDark: palette.green[700],

  warning: palette.amber[500],
  warningLight: palette.amber[50],
  warningBg: palette.amber[50],
  warningDark: palette.amber[700],

  danger: palette.rose[500],
  dangerLight: palette.rose[50],
  dangerBg: palette.rose[50],
  dangerDark: palette.rose[700],

  info: palette.cyan[500],
  infoLight: palette.cyan[50],
  infoBg: palette.cyan[50],
  infoDark: palette.cyan[700],

  warm: palette.rose[500],
  cool: palette.cyan[500],
  purple: palette.violet[600],

  white: '#FFFFFF',
  background: palette.neutral[50],
  neutralBg: palette.neutral[100],
  gradient: palette.neutral[200],

  surface: palette.neutral[50],
  card: palette.neutral[50],
  elevated: palette.neutral[100],

  textPrimary: palette.neutral[900],
  textSecondary: palette.neutral[600],
  textTertiary: palette.neutral[500],
  textInverse: '#FFFFFF',
  textLink: palette.gold[600],

  border: palette.neutral[200],
  borderLight: palette.neutral[100],
  borderDefault: palette.neutral[200],
  borderStrong: palette.neutral[300],

  overlay: 'rgba(9, 9, 11, 0.55)',
  overlayLight: 'rgba(9, 9, 11, 0.06)',
  overlayWarm: 'rgba(244, 63, 94, 0.08)',
  overlayCool: 'rgba(6, 182, 212, 0.08)',

  codeBg: palette.neutral[900],
  headingBg: palette.neutral[100],
  inr: palette.green[600],
  foreign: palette.indigo[600],
} as const;

export const darkColors = {
  ...lightColors,
  primary: palette.neutral[100],
  primaryLight: palette.neutral[200],
  primaryDark: palette.neutral[400],
  primaryBg: palette.neutral[850],
  primaryBorder: palette.neutral[700],

  secondary: palette.gold[400],
  secondaryLight: palette.gold[300],
  secondaryDark: palette.gold[500],
  secondaryBg: 'rgba(212, 160, 60, 0.1)',

  accent: palette.gold[400],
  accentLight: palette.gold[300],
  accentDark: palette.gold[500],

  success: palette.green[400],
  successLight: 'rgba(16, 185, 129, 0.15)',
  successBg: 'rgba(16, 185, 129, 0.1)',
  successBorder: 'rgba(16, 185, 129, 0.2)',
  successDark: palette.green[300],

  warning: palette.amber[400],
  warningLight: 'rgba(245, 158, 11, 0.15)',
  warningBg: 'rgba(245, 158, 11, 0.1)',
  warningDark: palette.amber[300],

  danger: palette.rose[400],
  dangerLight: 'rgba(244, 63, 94, 0.15)',
  dangerBg: 'rgba(244, 63, 94, 0.1)',
  dangerDark: palette.rose[300],

  info: palette.cyan[400],
  infoLight: 'rgba(6, 182, 212, 0.15)',
  infoBg: 'rgba(6, 182, 212, 0.1)',
  infoDark: palette.cyan[300],

  white: palette.neutral[900],
  background: palette.neutral[900],
  neutralBg: palette.neutral[850],
  gradient: palette.neutral[800],

  surface: palette.neutral[850],
  card: palette.neutral[850],
  elevated: palette.neutral[800],

  textPrimary: palette.neutral[100],
  textSecondary: palette.neutral[300],
  textTertiary: palette.neutral[400],
  textInverse: palette.neutral[900],
  textLink: palette.gold[300],

  border: palette.neutral[700],
  borderLight: palette.neutral[800],
  borderDefault: palette.neutral[700],
  borderStrong: palette.neutral[600],

  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(255, 255, 255, 0.06)',
  overlayWarm: 'rgba(251, 113, 133, 0.12)',
  overlayCool: 'rgba(34, 211, 238, 0.12)',

  codeBg: palette.neutral[950],
  headingBg: palette.neutral[800],
} as const;

export const gradients = {
  light: {
    primary: ['#18181B', '#27272A', '#3F3F46'] as const,
    secondary: ['#E8D092', '#D4A03C', '#B8862D'] as const,
    success: ['#34D399', '#10B981', '#047857'] as const,
    warning: ['#FCD34D', '#F59E0B', '#B45309'] as const,
    danger: ['#FB7185', '#F43F5E', '#BE123C'] as const,
    info: ['#22D3EE', '#06B6D4', '#0E7490'] as const,
    sunset: ['#FDBA74', '#FB7185', '#E11D48'] as const,
    ocean: ['#67E8F9', '#06B6D4', '#0E7490'] as const,
    aurora: ['#34D399', '#06B6D4', '#8B5CF6'] as const,
    midnight: ['#27272A', '#18181B', '#09090B'] as const,
    roseGold: ['#FDA4AF', '#F43F5E', '#D4A03C'] as const,
    emerald: ['#6EE7B7', '#10B981', '#047857'] as const,
    gold: ['#F2E5C2', '#D4A03C', '#966A25'] as const,
    glassWipe: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)'] as const,
    darkFade: ['transparent', 'rgba(9, 9, 11, 0.8)'] as const,
    aura: ['rgba(212, 160, 60, 0.08)', 'rgba(6, 182, 212, 0.08)'] as const,
  },
  dark: {
    primary: ['#27272A', '#18181B', '#09090B'] as const,
    secondary: ['#DDB864', '#D4A03C', '#966A25'] as const,
    success: ['#34D399', '#10B981', '#047857'] as const,
    warning: ['#FCD34D', '#F59E0B', '#B45309'] as const,
    danger: ['#FB7185', '#F43F5E', '#BE123C'] as const,
    info: ['#22D3EE', '#06B6D4', '#0E7490'] as const,
    sunset: ['#FB923C', '#F43F5E', '#9F1239'] as const,
    ocean: ['#06B6D4', '#0E7490', '#164E63'] as const,
    aurora: ['#10B981', '#06B6D4', '#7C3AED'] as const,
    midnight: ['#27272A', '#18181B', '#000000'] as const,
    roseGold: ['#FB7185', '#E11D48', '#B8862D'] as const,
    emerald: ['#10B981', '#047857', '#064E3B'] as const,
    gold: ['#DDB864', '#D4A03C', '#7A5422'] as const,
    glassWipe: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)'] as const,
    darkFade: ['transparent', 'rgba(0, 0, 0, 0.9)'] as const,
    aura: ['rgba(212, 160, 60, 0.15)', 'rgba(6, 182, 212, 0.15)'] as const,
  },
} as const;

export const glassTokens = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    blur: 40,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    borderLeftColor: 'rgba(255, 255, 255, 0.6)',
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 20,
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  dark: {
    background: 'rgba(24, 24, 27, 0.65)',
    blur: 40,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 20,
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

const baseSpacing = {
  '0': 0,
  px: 1,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '11': 44,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '32': 128,
  '40': 160,
  '48': 192,
  '56': 224,
  '64': 256,
} as const;

const spacingAlias = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const spacing = { ...baseSpacing, ...spacingAlias } as const;

export const typography = {
  fontFamily: {
    sans: undefined, // Uses system font in React Native
    mono: undefined,
    display: undefined,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: 'rgba(0, 0, 0, 0.20)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 16,
  },
  primaryGlow: {
    shadowColor: 'rgba(212, 160, 60, 0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  dangerGlow: {
    shadowColor: 'rgba(244, 63, 94, 0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export type AppColors = { [K in keyof typeof lightColors]: string };
export type AppGradients = {
  [K in keyof typeof gradients.light]: readonly string[];
};
export type AppShadows = {
  [K in keyof typeof shadows]: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
};
export type AppGlass = {
  background: string;
  blur: number;
  borderTopColor: string;
  borderLeftColor: string;
  borderRightColor: string;
  borderBottomColor: string;
  borderTopWidth: number;
  borderLeftWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderRadius: number;
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

export type AppTheme = {
  colors: AppColors;
  gradients: AppGradients;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: AppShadows;
  glass: AppGlass;
  isDark: boolean;
};

export const lightTheme: AppTheme = {
  colors: lightColors,
  gradients: gradients.light,
  spacing,
  typography,
  borderRadius,
  shadows,
  glass: glassTokens.light,
  isDark: false,
};

export const darkTheme: AppTheme = {
  colors: darkColors,
  gradients: gradients.dark,
  spacing,
  typography,
  borderRadius,
  shadows: {
    ...shadows,
    sm: { ...shadows.sm, shadowOpacity: 1, shadowColor: 'rgba(0,0,0,0.3)' },
    md: { ...shadows.md, shadowOpacity: 1, shadowColor: 'rgba(0,0,0,0.4)' },
    lg: { ...shadows.lg, shadowOpacity: 1, shadowColor: 'rgba(0,0,0,0.5)' },
    xl: { ...shadows.xl, shadowOpacity: 1, shadowColor: 'rgba(0,0,0,0.6)' },
  },
  glass: glassTokens.dark,
  isDark: true,
};
