// Theme-related Hooks
import { useMemo } from 'react';
import { useTheme } from '@/design-system/theme/ThemeContext';
import {
  ColorTokens,
  TypographyScale,
  SpacingScale,
  RadiusScale,
  ElevationScale,
  BreakpointsScale,
} from '@/types/theme';

/**
 * Get all colors from current theme
 */
export const useColors = (): ColorTokens => {
  const { theme } = useTheme();
  return useMemo(() => theme.colors, [theme.colors]);
};

/**
 * Get typography tokens
 */
export const useTypography = (): TypographyScale => {
  const { theme } = useTheme();
  return useMemo(() => theme.typography, [theme.typography]);
};

/**
 * Get spacing tokens
 */
export const useSpacing = (): SpacingScale => {
  const { theme } = useTheme();
  return useMemo(() => theme.spacing, [theme.spacing]);
};

/**
 * Get radius tokens
 */
export const useRadius = (): RadiusScale => {
  const { theme } = useTheme();
  return useMemo(() => theme.radius, [theme.radius]);
};

/**
 * Get elevation tokens
 */
export const useElevation = (): ElevationScale => {
  const { theme } = useTheme();
  return useMemo(() => theme.elevation, [theme.elevation]);
};

/**
 * Get glass morphism tokens
 */
export const useGlass = () => {
  const { theme } = useTheme();
  return useMemo(() => theme.glass, [theme.glass]);
};

/**
 * Get shadow tokens
 */
export const useShadow = () => {
  const { theme } = useTheme();
  return useMemo(() => theme.shadows, [theme.shadows]);
};

/**
 * Get breakpoints
 */
export const useBreakpoints = (): BreakpointsScale => {
  const { theme } = useTheme();
  return useMemo(() => theme.breakpoints, [theme.breakpoints]);
};

/**
 * Get motion/animation tokens
 */
export const useMotion = () => {
  return useMemo(
    () => ({
      timing: {
        instant: 0,
        quick: 150,
        normal: 300,
        slow: 500,
        slowest: 800,
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
        easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
        easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      },
      spring: {
        gentle: { damping: 15, mass: 1, stiffness: 100 },
        normal: { damping: 10, mass: 1, stiffness: 100 },
        wobbly: { damping: 6, mass: 1, stiffness: 100 },
      },
    }),
    [],
  );
};

/**
 * Get opacity scale
 */
export const useOpacity = () => {
  const { theme } = useTheme();
  return useMemo(() => theme.opacity, [theme.opacity]);
};

/**
 * Get color variant with semantic meaning
 */
export const useSemanticColors = () => {
  const colors = useColors();
  return useMemo(
    () => ({
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
    }),
    [colors],
  );
};

/**
 * Get theme mode
 */
export const useThemeMode = () => {
  const { mode, setMode, toggleMode } = useTheme();
  return useMemo(
    () => ({
      isDark: mode === 'dark' || mode === 'amoled',
      isLight: mode === 'light',
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode],
  );
};
