// Theme Presets for TripSplit Native
import { Theme, ThemePreset } from '@/types/theme';
import {
  baseTokens,
  defaultLightColors,
  defaultDarkColors,
  amoledColors,
} from '@/design-system/tokens/base.tokens';
import { glassMorphism } from '@/design-system/tokens/glass.tokens';

// Shadow Scale Definition
const createShadowScale = (baseColor: string, dark: boolean) => ({
  none: {
    color: 'transparent',
    opacity: 0,
    offset: { width: 0, height: 0 },
    radius: 0,
    elevation: 0,
  },
  xs: {
    color: baseColor,
    opacity: dark ? 0.1 : 0.05,
    offset: { width: 0, height: 1 },
    radius: 2,
    elevation: 1,
  },
  sm: {
    color: baseColor,
    opacity: dark ? 0.15 : 0.08,
    offset: { width: 0, height: 2 },
    radius: 4,
    elevation: 2,
  },
  md: {
    color: baseColor,
    opacity: dark ? 0.25 : 0.1,
    offset: { width: 0, height: 4 },
    radius: 8,
    elevation: 4,
  },
  lg: {
    color: baseColor,
    opacity: dark ? 0.35 : 0.12,
    offset: { width: 0, height: 8 },
    radius: 12,
    elevation: 8,
  },
  xl: {
    color: baseColor,
    opacity: dark ? 0.4 : 0.15,
    offset: { width: 0, height: 12 },
    radius: 16,
    elevation: 12,
  },
  xl2: {
    color: baseColor,
    opacity: dark ? 0.5 : 0.2,
    offset: { width: 0, height: 20 },
    radius: 24,
    elevation: 16,
  },
});

const presetDefaultLight: Theme = {
  mode: 'light',
  preset: 'default-light',
  colors: defaultLightColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassLight(defaultLightColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', false),
};

const presetDefaultDark: Theme = {
  mode: 'dark',
  preset: 'default-dark',
  colors: defaultDarkColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(defaultDarkColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

const presetAmoled: Theme = {
  mode: 'dark',
  preset: 'amoled',
  colors: amoledColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(amoledColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

// Glass Light Preset (Light mode with glass components)
const glassLightColors = {
  ...defaultLightColors,
  primary: '#1E88E5',
  accent: '#00BCD4',
};

const presetGlassLight: Theme = {
  mode: 'light',
  preset: 'glass-light',
  colors: glassLightColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassLight(glassLightColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', false),
};

// Glass Dark Preset
const glassDarkColors = {
  ...defaultDarkColors,
  primary: '#00D9FF',
  accent: '#BB86FC',
};

const presetGlassDark: Theme = {
  mode: 'dark',
  preset: 'glass-dark',
  colors: glassDarkColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(glassDarkColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

// Midnight Preset
const midnightColors = {
  ...defaultDarkColors,
  primary: '#4F46E5',
  accent: '#8B5CF6',
  background: '#0F0F1E',
  surface: '#1A1A2E',
};

const presetMidnight: Theme = {
  mode: 'dark',
  preset: 'midnight',
  colors: midnightColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(midnightColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

// Ocean Preset
const oceanColors = {
  ...defaultDarkColors,
  primary: '#0EA5E9',
  secondary: '#06B6D4',
  accent: '#14B8A6',
  background: '#0C172B',
  surface: '#164E63',
};

const presetOcean: Theme = {
  mode: 'dark',
  preset: 'ocean',
  colors: oceanColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(oceanColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

// Aurora Preset
const auroraColors = {
  ...defaultDarkColors,
  primary: '#EC4899',
  secondary: '#8B5CF6',
  accent: '#06B6D4',
  background: '#15051E',
  surface: '#2D1B3D',
};

const presetAurora: Theme = {
  mode: 'dark',
  preset: 'aurora',
  colors: auroraColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(auroraColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

// Sunset Preset
const sunsetColors = {
  ...defaultDarkColors,
  primary: '#F97316',
  secondary: '#FB923C',
  accent: '#FBBF24',
  background: '#1F1409',
  surface: '#5A3A1A',
};

const presetSunset: Theme = {
  mode: 'dark',
  preset: 'sunset',
  colors: sunsetColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(sunsetColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

// Forest Preset
const forestColors = {
  ...defaultDarkColors,
  primary: '#10B981',
  secondary: '#34D399',
  accent: '#6EE7B7',
  background: '#051B15',
  surface: '#065F46',
};

const presetForest: Theme = {
  mode: 'dark',
  preset: 'forest',
  colors: forestColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(forestColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

// Slate Preset
const slateColors = {
  ...defaultDarkColors,
  primary: '#64748B',
  secondary: '#78716C',
  accent: '#A1A1AA',
  background: '#09090B',
  surface: '#27272A',
};

const presetSlate: Theme = {
  mode: 'dark',
  preset: 'slate',
  colors: slateColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(slateColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

// Minimal Preset
const minimalColors = {
  ...defaultLightColors,
  primary: '#000000',
  secondary: '#404040',
  accent: '#666666',
};

const presetMinimal: Theme = {
  mode: 'light',
  preset: 'minimal',
  colors: minimalColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassLight(minimalColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', false),
};

// Luxury Black Preset
const luxuryBlackColors = {
  ...defaultDarkColors,
  primary: '#FFD700',
  secondary: '#C0A080',
  accent: '#FFFFFF',
  background: '#0A0A0A',
  surface: '#1A1A1A',
};

const presetLuxuryBlack: Theme = {
  mode: 'dark',
  preset: 'luxury-black',
  colors: luxuryBlackColors,
  typography: baseTokens.typography,
  spacing: baseTokens.spacing,
  radius: baseTokens.radius,
  elevation: baseTokens.elevation,
  opacity: baseTokens.opacity,
  glass: glassMorphism.createGlassDark(luxuryBlackColors.primary),
  breakpoints: baseTokens.breakpoints,
  iconSizes: baseTokens.iconSizes,
  shadows: createShadowScale('#000000', true),
};

export const themePresets: Record<ThemePreset, Theme> = {
  'default-light': presetDefaultLight,
  'default-dark': presetDefaultDark,
  amoled: presetAmoled,
  'glass-light': presetGlassLight,
  'glass-dark': presetGlassDark,
  midnight: presetMidnight,
  ocean: presetOcean,
  aurora: presetAurora,
  sunset: presetSunset,
  forest: presetForest,
  slate: presetSlate,
  minimal: presetMinimal,
  'luxury-black': presetLuxuryBlack,
};

export const getThemePreset = (preset: ThemePreset): Theme => {
  return themePresets[preset] || themePresets['default-light'];
};
