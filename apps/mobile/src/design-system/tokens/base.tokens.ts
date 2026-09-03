// Base Design Tokens - Shared across all themes

import { TypographyScale } from '@/types/theme';

export const baseTokens = {
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xl2: 20,
    xl3: 24,
    xl4: 28,
    xl5: 32,
    xl6: 40,
  },

  radius: {
    none: 0,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },

  elevation: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
    xl2: 16,
  },

  opacity: {
    none: 0,
    xs: 0.05,
    sm: 0.1,
    md: 0.3,
    lg: 0.5,
    xl: 0.75,
  },

  breakpoints: {
    xs: 0,
    sm: 320,
    md: 768,
    lg: 1024,
    xl: 1280,
    xl2: 1536,
  },

  iconSizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xl2: 40,
  },

  typography: {
    displayXL: {
      fontSize: 56,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.02,
    },
    displayL: {
      fontSize: 48,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.02,
    },
    displayM: {
      fontSize: 40,
      fontWeight: '700',
      lineHeight: 1.3,
      letterSpacing: -0.01,
    },
    headingXL: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 1.3,
      letterSpacing: -0.01,
    },
    headingL: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    headingM: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    headingS: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    bodyXL: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.6,
      letterSpacing: 0,
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.6,
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.3,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: 0.5,
    },
    overline: {
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 1.4,
      letterSpacing: 1.5,
    },
    code: {
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    numeric: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
  } as TypographyScale,
};

export const defaultLightColors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',

  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',
  secondaryDark: '#7C3AED',

  accent: '#EC4899',
  accentLight: '#F472B6',
  accentDark: '#DB2777',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',

  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceAlt: '#F3F4F6',
  border: '#E5E7EB',
  disabled: '#D1D5DB',

  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
};

export const defaultDarkColors = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#1E40AF',

  secondary: '#A78BFA',
  secondaryLight: '#C4B5FD',
  secondaryDark: '#7C3AED',

  accent: '#F472B6',
  accentLight: '#F9A8D4',
  accentDark: '#DB2777',

  success: '#10B981',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#22D3EE',

  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  border: '#475569',
  disabled: '#64748B',

  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverse: '#0F172A',
};

export const amoledColors = {
  primary: '#00D9FF',
  primaryLight: '#33E5FF',
  primaryDark: '#00A8CC',

  secondary: '#BB86FC',
  secondaryLight: '#D8B5FF',
  secondaryDark: '#9058D4',

  accent: '#FF006E',
  accentLight: '#FF6BB3',
  accentDark: '#C2004B',

  success: '#00E5A0',
  warning: '#FFB703',
  error: '#FF006E',
  info: '#00D9FF',

  background: '#000000',
  surface: '#0D0D0D',
  surfaceAlt: '#1A1A1A',
  border: '#2D2D2D',
  disabled: '#424242',

  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textTertiary: '#808080',
  textInverse: '#000000',
};
