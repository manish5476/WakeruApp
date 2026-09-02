/**
 * TripSplit Color System
 * Comprehensive color palette with semantic naming
 */

// Primitive colors
export const PRIMITIVES = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Neutral palette (grays)
export const NEUTRAL = {
  50: '#F8F9FA',
  100: '#F1F3F5',
  200: '#E9ECEF',
  300: '#DEE2E6',
  400: '#CED4DA',
  500: '#ADB5BD',
  600: '#868E96',
  700: '#495057',
  800: '#343A40',
  900: '#212529',
} as const;

// Primary palette (Blue - Professional/Trust)
export const PRIMARY = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
} as const;

// Secondary palette (Purple - Creative)
export const SECONDARY = {
  50: '#F3E8FF',
  100: '#E9D5FF',
  200: '#D8B4FE',
  300: '#C084FC',
  400: '#A855F7',
  500: '#9333EA',
  600: '#7E22CE',
  700: '#6D28D9',
  800: '#5B21B6',
  900: '#4C1D95',
} as const;

// Accent palette (Emerald - Success)
export const ACCENT = {
  50: '#F0FDF4',
  100: '#DCFCE7',
  200: '#BBFBCF',
  300: '#86EFAC',
  400: '#4ADE80',
  500: '#22C55E',
  600: '#16A34A',
  700: '#15803D',
  800: '#166534',
  900: '#145231',
} as const;

// Warning palette
export const WARNING = {
  50: '#FEF3C7',
  100: '#FDE68A',
  200: '#FCD34D',
  300: '#FBD381',
  400: '#F59E0B',
  500: '#F97316',
  600: '#DC2626',
  700: '#B45309',
  800: '#7C2D12',
  900: '#5A2810',
} as const;

// Danger/Error palette
export const DANGER = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
} as const;

// Info palette
export const INFO = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
} as const;

// Semantic color tokens (used across the app)
export interface SemanticColors {
  // Surfaces
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceInverted: string;

  // Glass
  glassLight: string;
  glassMedium: string;
  glassDark: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverted: string;

  // Interactive
  interactive: string;
  interactiveHover: string;
  interactivePressed: string;
  interactiveDisabled: string;

  // Components
  primary: string;
  secondary: string;
  accent: string;
  warning: string;
  danger: string;
  info: string;

  // Borders
  border: string;
  borderSecondary: string;
  borderLight: string;

  // Overlay
  overlay: string;
  overlayDark: string;
}

// Light theme
export const LIGHT_THEME: SemanticColors = {
  background: NEUTRAL[50],
  surface: PRIMITIVES.white,
  surfaceAlt: NEUTRAL[100],
  surfaceInverted: NEUTRAL[900],

  glassLight: 'rgba(255, 255, 255, 0.7)',
  glassMedium: 'rgba(255, 255, 255, 0.5)',
  glassDark: 'rgba(255, 255, 255, 0.3)',

  text: NEUTRAL[900],
  textSecondary: NEUTRAL[700],
  textTertiary: NEUTRAL[500],
  textInverted: PRIMITIVES.white,

  interactive: PRIMARY[600],
  interactiveHover: PRIMARY[700],
  interactivePressed: PRIMARY[800],
  interactiveDisabled: NEUTRAL[300],

  primary: PRIMARY[600],
  secondary: SECONDARY[600],
  accent: ACCENT[600],
  warning: WARNING[500],
  danger: DANGER[600],
  info: INFO[600],

  border: NEUTRAL[200],
  borderSecondary: NEUTRAL[100],
  borderLight: NEUTRAL[50],

  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.8)',
};

// Dark theme
export const DARK_THEME: SemanticColors = {
  background: NEUTRAL[900],
  surface: NEUTRAL[800],
  surfaceAlt: NEUTRAL[700],
  surfaceInverted: NEUTRAL[50],

  glassLight: 'rgba(255, 255, 255, 0.1)',
  glassMedium: 'rgba(255, 255, 255, 0.08)',
  glassDark: 'rgba(255, 255, 255, 0.05)',

  text: NEUTRAL[50],
  textSecondary: NEUTRAL[300],
  textTertiary: NEUTRAL[500],
  textInverted: NEUTRAL[900],

  interactive: PRIMARY[500],
  interactiveHover: PRIMARY[400],
  interactivePressed: PRIMARY[600],
  interactiveDisabled: NEUTRAL[600],

  primary: PRIMARY[500],
  secondary: SECONDARY[500],
  accent: ACCENT[500],
  warning: WARNING[500],
  danger: DANGER[500],
  info: INFO[500],

  border: NEUTRAL[700],
  borderSecondary: NEUTRAL[600],
  borderLight: NEUTRAL[700],

  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayDark: 'rgba(0, 0, 0, 0.9)',
};

// AMOLED Dark theme (for OLED screens)
export const AMOLED_THEME: SemanticColors = {
  background: PRIMITIVES.black,
  surface: NEUTRAL[950] || '#0A0A0A',
  surfaceAlt: NEUTRAL[900],
  surfaceInverted: NEUTRAL[50],

  glassLight: 'rgba(255, 255, 255, 0.08)',
  glassMedium: 'rgba(255, 255, 255, 0.05)',
  glassDark: 'rgba(255, 255, 255, 0.02)',

  text: NEUTRAL[50],
  textSecondary: NEUTRAL[300],
  textTertiary: NEUTRAL[500],
  textInverted: PRIMITIVES.black,

  interactive: PRIMARY[400],
  interactiveHover: PRIMARY[300],
  interactivePressed: PRIMARY[500],
  interactiveDisabled: NEUTRAL[600],

  primary: PRIMARY[400],
  secondary: SECONDARY[400],
  accent: ACCENT[400],
  warning: WARNING[400],
  danger: DANGER[400],
  info: INFO[400],

  border: NEUTRAL[800],
  borderSecondary: NEUTRAL[900],
  borderLight: NEUTRAL[800],

  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayDark: 'rgba(0, 0, 0, 0.95)',
};

// Glass light theme
export const GLASS_LIGHT_THEME: SemanticColors = {
  background: NEUTRAL[50],
  surface: 'rgba(255, 255, 255, 0.85)',
  surfaceAlt: 'rgba(255, 255, 255, 0.7)',
  surfaceInverted: NEUTRAL[900],

  glassLight: 'rgba(255, 255, 255, 0.9)',
  glassMedium: 'rgba(255, 255, 255, 0.7)',
  glassDark: 'rgba(255, 255, 255, 0.5)',

  text: NEUTRAL[900],
  textSecondary: NEUTRAL[700],
  textTertiary: NEUTRAL[500],
  textInverted: PRIMITIVES.white,

  interactive: PRIMARY[600],
  interactiveHover: PRIMARY[700],
  interactivePressed: PRIMARY[800],
  interactiveDisabled: NEUTRAL[300],

  primary: PRIMARY[600],
  secondary: SECONDARY[600],
  accent: ACCENT[600],
  warning: WARNING[500],
  danger: DANGER[600],
  info: INFO[600],

  border: 'rgba(255, 255, 255, 0.3)',
  borderSecondary: 'rgba(255, 255, 255, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.1)',

  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayDark: 'rgba(0, 0, 0, 0.6)',
};

// Glass dark theme
export const GLASS_DARK_THEME: SemanticColors = {
  background: NEUTRAL[900],
  surface: 'rgba(30, 30, 30, 0.85)',
  surfaceAlt: 'rgba(30, 30, 30, 0.7)',
  surfaceInverted: NEUTRAL[50],

  glassLight: 'rgba(255, 255, 255, 0.15)',
  glassMedium: 'rgba(255, 255, 255, 0.1)',
  glassDark: 'rgba(255, 255, 255, 0.05)',

  text: NEUTRAL[50],
  textSecondary: NEUTRAL[300],
  textTertiary: NEUTRAL[500],
  textInverted: NEUTRAL[900],

  interactive: PRIMARY[500],
  interactiveHover: PRIMARY[400],
  interactivePressed: PRIMARY[600],
  interactiveDisabled: NEUTRAL[600],

  primary: PRIMARY[500],
  secondary: SECONDARY[500],
  accent: ACCENT[500],
  warning: WARNING[500],
  danger: DANGER[500],
  info: INFO[500],

  border: 'rgba(255, 255, 255, 0.1)',
  borderSecondary: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',

  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayDark: 'rgba(0, 0, 0, 0.8)',
};

// Ocean theme
export const OCEAN_THEME: SemanticColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  surfaceInverted: NEUTRAL[50],

  glassLight: 'rgba(51, 65, 85, 0.6)',
  glassMedium: 'rgba(51, 65, 85, 0.4)',
  glassDark: 'rgba(51, 65, 85, 0.2)',

  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textInverted: '#0F172A',

  interactive: '#06B6D4',
  interactiveHover: '#0891B2',
  interactivePressed: '#0E7490',
  interactiveDisabled: '#475569',

  primary: '#06B6D4',
  secondary: '#8B5CF6',
  accent: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',

  border: 'rgba(148, 163, 184, 0.2)',
  borderSecondary: 'rgba(148, 163, 184, 0.1)',
  borderLight: 'rgba(148, 163, 184, 0.05)',

  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayDark: 'rgba(0, 0, 0, 0.8)',
};

export type ThemeName =
  'light' | 'dark' | 'amoled' | 'glass-light' | 'glass-dark' | 'ocean';
