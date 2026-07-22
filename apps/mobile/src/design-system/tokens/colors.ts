export interface ColorTheme {
  primary: string;
  primaryVariant: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  borderLight: string;
  divider: string;
  transparent: string;
  overlay: string;
  glass: string;
}

export const lightColors: ColorTheme = {
  primary: '#E8A500', // Gold 500
  primaryVariant: '#D49500', // Gold 600
  secondary: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#FAFAF9',
  surfaceVariant: '#F5F5F4',
  error: '#DC2626',
  success: '#059669',
  warning: '#F59E0B',
  info: '#0891B2',
  text: '#1A1A18',
  textSecondary: '#4A4A47',
  textTertiary: '#717171',
  textInverse: '#FFFFFF',
  border: '#D7D7D4',
  borderLight: '#E8E8E6',
  divider: '#E8E8E6',
  transparent: 'transparent',
  overlay: 'rgba(26, 26, 24, 0.5)',
  glass: 'rgba(255, 255, 255, 0.8)',
};

export const darkColors: ColorTheme = {
  primary: '#E8A500',
  primaryVariant: '#D49500',
  secondary: '#8B5CF6',
  background: '#0A0A09',
  surface: '#1A1A18',
  surfaceVariant: '#262623',
  error: '#DC2626',
  success: '#059669',
  warning: '#F59E0B',
  info: '#0891B2',
  text: '#F5F5F4',
  textSecondary: '#B3B3AF',
  textTertiary: '#8F8F8B',
  textInverse: '#0A0A09',
  border: '#4A4A47',
  borderLight: '#717171',
  divider: '#4A4A47',
  transparent: 'transparent',
  overlay: 'rgba(250, 250, 249, 0.15)',
  glass: 'rgba(26, 26, 24, 0.85)',
};

export const amoledColors: ColorTheme = {
  ...darkColors,
  background: '#000000',
  surface: '#0A0A09',
  surfaceVariant: '#121210',
};
