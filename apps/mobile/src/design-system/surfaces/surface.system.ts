// Surface System - Reusable surfaces for components
import { Theme } from '@/types/theme';

export interface SurfaceStyle {
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowOffset?: { width: number; height: number };
  shadowRadius?: number;
  elevation?: number;
}

export const createSurfaceSystem = (theme: Theme) => ({
  /**
   * Primary Surface - Main application surface
   */
  primary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 0,
    elevation: 0,
  } as SurfaceStyle,

  /**
   * Secondary Surface - Alternative surface for secondary content
   */
  secondary: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderWidth: 0,
    elevation: 0,
  } as SurfaceStyle,

  /**
   * Card Surface - For card components
   */
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    shadowColor: theme.colors.text,
    shadowOpacity: theme.mode === 'light' ? 0.08 : 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  } as SurfaceStyle,

  /**
   * Elevated Card - Card with more elevation
   */
  elevatedCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    shadowColor: theme.colors.text,
    shadowOpacity: theme.mode === 'light' ? 0.12 : 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  } as SurfaceStyle,

  /**
   * Glass Surface - For glassmorphism components
   */
  glass: {
    backgroundColor: theme.glass.regular.backgroundColor,
    borderColor: theme.glass.regular.borderColor,
    borderWidth: theme.glass.regular.borderWidth,
    shadowColor: theme.shadows.md.color,
    shadowOpacity: theme.shadows.md.opacity,
    shadowOffset: theme.shadows.md.offset,
    shadowRadius: theme.shadows.md.radius,
    elevation: theme.glass.regular.elevation,
  } as SurfaceStyle,

  /**
   * Floating Glass - Elevated glass surface for floating elements
   */
  floatingGlass: {
    backgroundColor: theme.glass.floating.backgroundColor,
    borderColor: theme.glass.floating.borderColor,
    borderWidth: theme.glass.floating.borderWidth,
    shadowColor: theme.shadows.lg.color,
    shadowOpacity: theme.shadows.lg.opacity,
    shadowOffset: theme.shadows.lg.offset,
    shadowRadius: theme.shadows.lg.radius,
    elevation: theme.glass.floating.elevation,
  } as SurfaceStyle,

  /**
   * Navigation Glass - For navigation elements
   */
  navigationGlass: {
    backgroundColor: theme.glass.navigation.backgroundColor,
    borderColor: theme.glass.navigation.borderColor,
    borderWidth: theme.glass.navigation.borderWidth,
    shadowColor: theme.shadows.sm.color,
    shadowOpacity: theme.shadows.sm.opacity,
    shadowOffset: theme.shadows.sm.offset,
    shadowRadius: theme.shadows.sm.radius,
    elevation: theme.glass.navigation.elevation,
  } as SurfaceStyle,

  /**
   * Bottom Sheet Surface
   */
  bottomSheet: {
    backgroundColor: theme.glass.bottomSheet.backgroundColor,
    borderColor: theme.glass.bottomSheet.borderColor,
    borderWidth: theme.glass.bottomSheet.borderWidth,
    shadowColor: theme.shadows.xl.color,
    shadowOpacity: theme.shadows.xl.opacity,
    shadowOffset: theme.shadows.xl.offset,
    shadowRadius: theme.shadows.xl.radius,
    elevation: theme.glass.bottomSheet.elevation,
  } as SurfaceStyle,

  /**
   * Modal Surface
   */
  modal: {
    backgroundColor: theme.glass.modal.backgroundColor,
    borderColor: theme.glass.modal.borderColor,
    borderWidth: theme.glass.modal.borderWidth,
    shadowColor: theme.shadows.xl2.color,
    shadowOpacity: theme.shadows.xl2.opacity,
    shadowOffset: theme.shadows.xl2.offset,
    shadowRadius: theme.shadows.xl2.radius,
    elevation: theme.glass.modal.elevation,
  } as SurfaceStyle,

  /**
   * Overlay Surface - Semi-transparent overlay
   */
  overlay: {
    backgroundColor: theme.glass.overlay.backgroundColor,
    borderColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
  } as SurfaceStyle,

  /**
   * Input Surface - For input fields
   */
  input: {
    backgroundColor:
      theme.mode === 'light' ? '#FFFFFF' : theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderWidth: 1,
    shadowColor: theme.colors.text,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  } as SurfaceStyle,

  /**
   * Subtle Surface - Minimal visual hierarchy
   */
  subtle: {
    backgroundColor: theme.colors.surface,
    borderColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
  } as SurfaceStyle,

  /**
   * Interactive Surface - For interactive elements
   */
  interactive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderWidth: 0,
    elevation: 2,
  } as SurfaceStyle,

  /**
   * Accent Surface
   */
  accent: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
    borderWidth: 0,
    elevation: 2,
  } as SurfaceStyle,

  /**
   * Success Surface
   */
  success: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
    borderWidth: 0,
    elevation: 1,
  } as SurfaceStyle,

  /**
   * Warning Surface
   */
  warning: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
    borderWidth: 0,
    elevation: 1,
  } as SurfaceStyle,

  /**
   * Error Surface
   */
  error: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
    borderWidth: 0,
    elevation: 1,
  } as SurfaceStyle,

  /**
   * Disabled Surface
   */
  disabled: {
    backgroundColor: theme.colors.disabled,
    borderColor: theme.colors.disabled,
    borderWidth: 0,
    elevation: 0,
  } as SurfaceStyle,
});

export type SurfaceType = ReturnType<typeof createSurfaceSystem>;
export type SurfaceKey = keyof SurfaceType;
