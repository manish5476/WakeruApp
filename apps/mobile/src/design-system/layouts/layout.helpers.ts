// Layout Helper Utilities
import { ViewStyle } from 'react-native';

export const layoutHelpers = {
  /**
   * Flexbox centering - Center content both horizontally and vertically
   */
  flexCenter: (): ViewStyle => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),

  /**
   * Flex row with center alignment
   */
  flexRow: (gap?: number): ViewStyle => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap,
  }),

  /**
   * Flex column with center alignment
   */
  flexCol: (gap?: number): ViewStyle => ({
    display: 'flex',
    flexDirection: 'column',
    gap,
  }),

  /**
   * Space between layout
   */
  spaceBetween: (
    direction: 'row' | 'column' = 'row',
    gap?: number,
  ): ViewStyle => ({
    display: 'flex',
    flexDirection: direction,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap,
  }),

  /**
   * Space around layout
   */
  spaceAround: (
    direction: 'row' | 'column' = 'row',
    gap?: number,
  ): ViewStyle => ({
    display: 'flex',
    flexDirection: direction,
    justifyContent: 'space-around',
    alignItems: 'center',
    gap,
  }),

  /**
   * Space evenly layout
   */
  spaceEvenly: (
    direction: 'row' | 'column' = 'row',
    gap?: number,
  ): ViewStyle => ({
    display: 'flex',
    flexDirection: direction,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap,
  }),

  /**
   * Flex with stretch to fill
   */
  fill: (): ViewStyle => ({
    flex: 1,
  }),

  /**
   * Absolute fill (cover entire parent)
   */
  absoluteFill: (): ViewStyle => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),

  /**
   * Aspect ratio helper
   */
  aspectRatio: (ratio: number): ViewStyle => ({
    aspectRatio: ratio,
  }),

  /**
   * Fixed dimensions
   */
  size: (width: number, height?: number): ViewStyle => ({
    width,
    height: height ?? width,
  }),

  /**
   * Width constraint
   */
  width: (value: number | string): ViewStyle => ({
    width: typeof value === 'number' ? value : value,
  }),

  /**
   * Height constraint
   */
  height: (value: number | string): ViewStyle => ({
    height: typeof value === 'number' ? value : value,
  }),

  /**
   * Max width constraint
   */
  maxWidth: (value: number): ViewStyle => ({
    maxWidth: value,
  }),

  /**
   * Max height constraint
   */
  maxHeight: (value: number): ViewStyle => ({
    maxHeight: value,
  }),

  /**
   * Min width constraint
   */
  minWidth: (value: number): ViewStyle => ({
    minWidth: value,
  }),

  /**
   * Min height constraint
   */
  minHeight: (value: number): ViewStyle => ({
    minHeight: value,
  }),

  /**
   * Grid layout helper
   */
  grid: (columns: number, gap?: number): ViewStyle => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
  }),

  /**
   * Stack layout (vertical flex)
   */
  stack: (spacing?: number): ViewStyle => ({
    display: 'flex',
    flexDirection: 'column',
    gap: spacing,
  }),

  /**
   * Horizontal stack (horizontal flex)
   */
  hStack: (spacing?: number): ViewStyle => ({
    display: 'flex',
    flexDirection: 'row',
    gap: spacing,
  }),

  /**
   * Responsive padding
   */
  paddingResponsive: (sm: number, md: number, lg: number): ViewStyle =>
    ({
      padding: sm,
      '@media (min-width: 768px)': { padding: md },
      '@media (min-width: 1024px)': { padding: lg },
    }) as any,

  /**
   * Responsive margin
   */
  marginResponsive: (sm: number, md: number, lg: number): ViewStyle =>
    ({
      margin: sm,
      '@media (min-width: 768px)': { margin: md },
      '@media (min-width: 1024px)': { margin: lg },
    }) as any,

  /**
   * Overflow handling
   */
  scrollable: (): ViewStyle =>
    ({
      overflowY: 'auto',
    }) as any,

  /**
   * Hidden overflow
   */
  clipped: (): ViewStyle =>
    ({
      overflow: 'hidden',
    }) as any,

  /**
   * Full screen dimensions
   */
  fullScreen: (): ViewStyle =>
    ({
      width: '100%',
      height: '100%',
    }) as any,

  /**
   * Sticky positioning
   */
  sticky: (top?: number): ViewStyle =>
    ({
      position: 'sticky',
      top: top ?? 0,
    }) as any,

  /**
   * Z-index stacking
   */
  zIndex: (value: number): ViewStyle =>
    ({
      zIndex: value,
    }) as any,
};

/**
 * Create responsive layout configuration
 */
export const createResponsiveLayout = (config: {
  columns?: { xs: number; sm: number; md: number; lg: number };
  gap?: { xs: number; sm: number; md: number; lg: number };
  padding?: { xs: number; sm: number; md: number; lg: number };
}) => {
  return {
    xs: {
      gridTemplateColumns: `repeat(${config.columns?.xs ?? 1}, 1fr)`,
      gap: config.gap?.xs,
      padding: config.padding?.xs,
    },
    sm: {
      gridTemplateColumns: `repeat(${config.columns?.sm ?? 2}, 1fr)`,
      gap: config.gap?.sm,
      padding: config.padding?.sm,
    },
    md: {
      gridTemplateColumns: `repeat(${config.columns?.md ?? 3}, 1fr)`,
      gap: config.gap?.md,
      padding: config.padding?.md,
    },
    lg: {
      gridTemplateColumns: `repeat(${config.columns?.lg ?? 4}, 1fr)`,
      gap: config.gap?.lg,
      padding: config.padding?.lg,
    },
  };
};
