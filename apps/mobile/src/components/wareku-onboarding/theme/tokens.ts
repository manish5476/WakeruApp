// theme/tokens.ts

// ============================================================
// BREAKPOINTS
// ============================================================

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

// ============================================================
// COLORS
// ============================================================

export const colors = {
  // ----------------------------------------------------------
  // Brand
  // ----------------------------------------------------------

  midnightNavy: '#0F172A',
  oceanBlue: '#2563EB',
  travelCyan: '#06B6D4',
  emerald: '#10B981',

  // Brand namespace
  brand: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primarySoft: '#EFF6FF',

    cyan: '#06B6D4',
    cyanSoft: '#ECFEFF',

    emerald: '#10B981',
    emeraldSoft: '#ECFDF5',

    midnight: '#0B1220',
    midnightSoft: '#111827',

    white: '#FFFFFF',
  },

  // ----------------------------------------------------------
  // Surfaces
  // ----------------------------------------------------------

  background: '#F8FAFC',
  backgroundDark: '#0B1220',

  surface: '#FFFFFF',
  surfaceDark: '#111827',

  surfaceMuted: '#F1F5F9',
  surfaceHover: '#EEF2F7',

  // Nested theme objects
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#F1F5F9',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textFaint: '#94A3B8',

    border: 'rgba(15, 23, 42, 0.08)',
    borderStrong: 'rgba(15, 23, 42, 0.14)',
  },

  dark: {
    background: '#0B1220',
    surface: '#111827',
    surfaceElevated: '#172033',
    surfaceMuted: '#1E293B',

    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textFaint: '#64748B',

    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.14)',
  },

  // ----------------------------------------------------------
  // Glass
  // ----------------------------------------------------------

  glassLight: 'rgba(255, 255, 255, 0.80)',
  glassBorder: 'rgba(15, 23, 42, 0.08)',
  glassDark: 'rgba(15, 23, 42, 0.72)',

  glass: {
    light: 'rgba(255, 255, 255, 0.72)',
    lightStrong: 'rgba(255, 255, 255, 0.88)',
    dark: 'rgba(15, 23, 42, 0.58)',
    darkStrong: 'rgba(15, 23, 42, 0.78)',

    borderLight: 'rgba(255, 255, 255, 0.30)',
    borderDark: 'rgba(255, 255, 255, 0.10)',
  },

  // ----------------------------------------------------------
  // Text
  // ----------------------------------------------------------

  textOnDark: '#F8FAFC',
  textOnDarkMuted: '#475569',
  textOnDarkFaint: '#94A3B8',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',

  textOnLight: '#FFFFFF',

  // ----------------------------------------------------------
  // Borders
  // ----------------------------------------------------------

  border: 'rgba(15, 23, 42, 0.08)',
  borderStrong: 'rgba(15, 23, 42, 0.14)',

  // ----------------------------------------------------------
  // Semantic
  // ----------------------------------------------------------

  danger: '#EF4444',
  dangerSoft: '#FEF2F2',

  warning: '#F59E0B',
  warningSoft: '#FFFBEB',

  success: '#10B981',
  successSoft: '#ECFDF5',

  info: '#3B82F6',
  infoSoft: '#EFF6FF',

  // ----------------------------------------------------------
  // Tints
  // ----------------------------------------------------------

  tintBlue: 'rgba(37, 99, 235, 0.08)',
  tintCyan: 'rgba(6, 182, 212, 0.08)',
  tintEmerald: 'rgba(16, 185, 129, 0.08)',

  // ----------------------------------------------------------
  // Gradients
  // ----------------------------------------------------------

  gradientBrand: ['#2563EB', '#06B6D4'] as const,

  gradientNight: ['#0B1220', '#1E293B', '#0B1220'] as const,

  gradientSuccess: ['#10B981', '#06B6D4'] as const,

  gradientGlow: ['rgba(37, 99, 235, 0.15)', 'rgba(6, 182, 212, 0.05)'] as const,

  gradientSoft: ['#EEF2FF', '#F0F9FF', '#ECFEFF'] as const,

  gradientHero: [
    'rgba(11, 18, 32, 0.38)',
    'rgba(11, 18, 32, 0.68)',
    'rgba(11, 18, 32, 0.94)',
  ] as const,

  // New namespace for newer components
  gradients: {
    brand: ['#2563EB', '#06B6D4'] as const,

    brandReverse: ['#06B6D4', '#2563EB'] as const,

    hero: [
      'rgba(11, 18, 32, 0.38)',
      'rgba(11, 18, 32, 0.68)',
      'rgba(11, 18, 32, 0.94)',
    ] as const,

    heroGlow: [
      'rgba(37, 99, 235, 0.22)',
      'rgba(6, 182, 212, 0.10)',
      'rgba(6, 182, 212, 0)',
    ] as const,

    softBrand: ['#EFF6FF', '#F0F9FF', '#ECFEFF'] as const,

    success: ['#10B981', '#06B6D4'] as const,

    sunset: ['#2563EB', '#7C3AED', '#EC4899'] as const,
  },
} as const;

export const currencyPalette: Record<string, string> = {
  AED: '#F59E0B',
  INR: '#2563EB',
  EUR: '#06B6D4',
  USD: '#10B981',
  GBP: '#8B5CF6',
  JPY: '#EC4899',
  THB: '#14B8A6',
};

// ============================================================
// SPACING
// ============================================================

export const spacing = {
  0: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Landing page section spacing
  sectionSm: 48,
  sectionMd: 64,
  sectionLg: 80,
  sectionXl: 112,
  section2xl: 144,

  pageMobile: 20,
  pageTablet: 32,
  pageDesktop: 48,
} as const;

// ============================================================
// RADIUS
// ============================================================

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 9999,
} as const;

// ============================================================
// TYPOGRAPHY
// ============================================================

export const typography = {
  // ----------------------------------------------------------
  // Display
  // ----------------------------------------------------------

  display: {
    mobile: {
      fontSize: 42,
      lineHeight: 48,
      fontWeight: '800' as const,
      letterSpacing: -1.4,
    },

    tablet: {
      fontSize: 56,
      lineHeight: 64,
      fontWeight: '800' as const,
      letterSpacing: -2,
    },

    desktop: {
      fontSize: 72,
      lineHeight: 78,
      fontWeight: '800' as const,
      letterSpacing: -2.8,
    },

    wide: {
      fontSize: 88,
      lineHeight: 94,
      fontWeight: '800' as const,
      letterSpacing: -3.6,
    },
  },

  // ----------------------------------------------------------
  // Heading 1
  // ----------------------------------------------------------

  heading1: {
    mobile: {
      fontSize: 34,
      lineHeight: 42,
      fontWeight: '800' as const,
      letterSpacing: -0.8,
    },

    desktop: {
      fontSize: 52,
      lineHeight: 60,
      fontWeight: '800' as const,
      letterSpacing: -1.5,
    },
  },

  // ----------------------------------------------------------
  // Heading 2
  // ----------------------------------------------------------

  heading2: {
    mobile: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
    },

    desktop: {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: '800' as const,
      letterSpacing: -1,
    },
  },

  // ----------------------------------------------------------
  // Heading 3
  // ----------------------------------------------------------

  heading3: {
    mobile: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
    },

    desktop: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700' as const,
    },
  },

  // ----------------------------------------------------------
  // Backward-compatible heading
  // ----------------------------------------------------------

  heading: {
    mobile: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '800' as const,
    },

    desktop: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: '800' as const,
    },
  },

  // ----------------------------------------------------------
  // Body
  // ----------------------------------------------------------

  bodyLarge: {
    mobile: {
      fontSize: 17,
      lineHeight: 26,
      fontWeight: '400' as const,
    },

    desktop: {
      fontSize: 19,
      lineHeight: 30,
      fontWeight: '400' as const,
    },
  },

  body: {
    mobile: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },

    desktop: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '400' as const,
    },
  },

  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },

  // ----------------------------------------------------------
  // Labels
  // ----------------------------------------------------------

  label: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
  },

  // ----------------------------------------------------------
  // Buttons
  // ----------------------------------------------------------

  button: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700' as const,
  },

  buttonLarge: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700' as const,
  },
} as const;

// ============================================================
// SHADOWS
// ============================================================

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },

  cardHover: {
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },

  glow: {
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  glowBlue: {
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
  },

  glowCyan: {
    shadowColor: '#06B6D4',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 10,
  },

  soft: {
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  xl: {
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 24,
    },
    shadowOpacity: 0.14,
    shadowRadius: 48,
    elevation: 12,
  },
} as const;

// Optional alias for newer code.
export const shadows = shadow;

// New plural alias without breaking old imports.

// ============================================================
// LAYOUT
// ============================================================

export const layout = {
  maxContentWidth: 1200,
  maxWideContentWidth: 1440,

  heroMaxWidth: 1200,
  textMaxWidth: 760,

  navHeight: 72,

  mobileHorizontalPadding: 20,
  tabletHorizontalPadding: 32,
  desktopHorizontalPadding: 48,
} as const;
