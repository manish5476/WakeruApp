// Utility Helpers for Design System

/**
 * Color manipulation helpers
 */
export const colorHelpers = {
  /**
   * Convert hex to RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex: (r: number, g: number, b: number): string => {
    return (
      '#' +
      [r, g, b]
        .map(x => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  },

  /**
   * Lighten color
   */
  lighten: (hex: string, amount: number): string => {
    const rgb = colorHelpers.hexToRgb(hex);
    if (!rgb) return hex;
    const lightened = {
      r: Math.min(255, rgb.r + Math.round(255 * amount)),
      g: Math.min(255, rgb.g + Math.round(255 * amount)),
      b: Math.min(255, rgb.b + Math.round(255 * amount)),
    };
    return colorHelpers.rgbToHex(lightened.r, lightened.g, lightened.b);
  },

  /**
   * Darken color
   */
  darken: (hex: string, amount: number): string => {
    const rgb = colorHelpers.hexToRgb(hex);
    if (!rgb) return hex;
    const darkened = {
      r: Math.max(0, rgb.r - Math.round(255 * amount)),
      g: Math.max(0, rgb.g - Math.round(255 * amount)),
      b: Math.max(0, rgb.b - Math.round(255 * amount)),
    };
    return colorHelpers.rgbToHex(darkened.r, darkened.g, darkened.b);
  },

  /**
   * Get contrast color (black or white)
   */
  getContrastColor: (hex: string): 'black' | 'white' => {
    const rgb = colorHelpers.hexToRgb(hex);
    if (!rgb) return 'black';
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? 'black' : 'white';
  },

  /**
   * Create color palette from base color
   */
  createPalette: (
    baseColor: string,
  ): {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  } => {
    return {
      50: colorHelpers.lighten(baseColor, 0.9),
      100: colorHelpers.lighten(baseColor, 0.8),
      200: colorHelpers.lighten(baseColor, 0.6),
      300: colorHelpers.lighten(baseColor, 0.4),
      400: colorHelpers.lighten(baseColor, 0.2),
      500: baseColor,
      600: colorHelpers.darken(baseColor, 0.2),
      700: colorHelpers.darken(baseColor, 0.4),
      800: colorHelpers.darken(baseColor, 0.6),
      900: colorHelpers.darken(baseColor, 0.8),
    };
  },
};

/**
 * Typography helpers
 */
export const typographyHelpers = {
  /**
   * Truncate text with ellipsis
   */
  truncate: (text: string, length: number): string => {
    return text.length > length ? text.substring(0, length - 3) + '...' : text;
  },

  /**
   * Convert font size in px to rem
   */
  pxToRem: (px: number, baseFontSize: number = 16): number => {
    return px / baseFontSize;
  },

  /**
   * Convert rem to px
   */
  remToPx: (rem: number, baseFontSize: number = 16): number => {
    return rem * baseFontSize;
  },

  /**
   * Calculate line height multiplier
   */
  lineHeightMultiplier: (fontSize: number, lineHeight: number): number => {
    return lineHeight / fontSize;
  },
};

/**
 * Spacing helpers
 */
export const spacingHelpers = {
  /**
   * Create spacing scale
   */
  createScale: (baseUnit: number, steps: number = 10) => {
    const scale: Record<number, number> = {};
    for (let i = 0; i <= steps; i++) {
      scale[i] = baseUnit * i;
    }
    return scale;
  },

  /**
   * Convert spacing token to REM
   */
  toRem: (value: number, baseUnit: number = 4): number => {
    return (value / 16) * baseUnit;
  },
};

/**
 * Breakpoint helpers
 */
export const breakpointHelpers = {
  /**
   * Check if viewport matches breakpoint
   */
  isBreakpoint: (width: number, breakpoint: number): boolean => {
    return width >= breakpoint;
  },

  /**
   * Get active breakpoint
   */
  getActiveBreakpoint: (
    width: number,
    breakpoints: Record<string, number>,
  ): string => {
    const sorted = Object.entries(breakpoints)
      .sort(([, a], [, b]) => b - a)
      .find(([, value]) => width >= value);
    return sorted ? sorted[0] : 'xs';
  },

  /**
   * Create media query
   */
  createMediaQuery: (
    breakpoint: number,
    direction: 'min' | 'max' = 'min',
  ): string => {
    return `@media (${direction}-width: ${breakpoint}px)`;
  },
};

/**
 * Elevation/Shadow helpers
 */
export const elevationHelpers = {
  /**
   * Get shadow from elevation level
   */
  getShadowFromElevation: (elevation: number) => ({
    shadowOffset: {
      width: 0,
      height: Math.ceil(elevation * 0.5),
    },
    shadowOpacity: 0.15 + elevation * 0.03,
    shadowRadius: Math.ceil(elevation * 1.5),
    elevation,
  }),

  /**
   * Create smooth shadow transition
   */
  createShadowTransition: (fromElevation: number, toElevation: number) => ({
    from: elevationHelpers.getShadowFromElevation(fromElevation),
    to: elevationHelpers.getShadowFromElevation(toElevation),
  }),
};

/**
 * Validation helpers
 */
export const validationHelpers = {
  /**
   * Validate color format (hex, rgb, rgba, hsl)
   */
  isValidColor: (color: string): boolean => {
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
    const hslPattern = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;

    return (
      hexPattern.test(color) ||
      rgbPattern.test(color) ||
      rgbaPattern.test(color) ||
      hslPattern.test(color)
    );
  },

  /**
   * Validate spacing value
   */
  isValidSpacing: (value: any): boolean => {
    return typeof value === 'number' && value >= 0;
  },

  /**
   * Validate border radius
   */
  isValidBorderRadius: (value: any): boolean => {
    return typeof value === 'number' && value >= 0;
  },
};

/**
 * Performance helpers
 */
export const performanceHelpers = {
  /**
   * Debounce function
   */
  debounce: <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  },

  /**
   * Throttle function
   */
  throttle: <T extends (...args: any[]) => any>(fn: T, limit: number): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },

  /**
   * Memoize function
   */
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();
    return ((...args: any[]) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },
};

/**
 * Accessibility helpers
 */
export const a11yHelpers = {
  /**
   * Check if color contrast is WCAG AA compliant
   */
  meetsWCAG_AA: (foreground: string, background: string): boolean => {
    const rgb1 = colorHelpers.hexToRgb(foreground);
    const rgb2 = colorHelpers.hexToRgb(background);
    if (!rgb1 || !rgb2) return false;

    const getLuminance = (r: number, g: number, b: number) => {
      const [rs = 0, gs = 0, bs = 0] = [r, g, b].map(val => {
        const s = val / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05) >= 4.5;
  },

  /**
   * Get readable text color for given background
   */
  getReadableTextColor: (backgroundColor: string): string => {
    const contrast = colorHelpers.getContrastColor(backgroundColor);
    return contrast === 'white' ? '#FFFFFF' : '#000000';
  },
};

/**
 * Responsive helpers
 */
export const responsiveHelpers = {
  /**
   * Generate responsive value
   */
  createResponsiveValue: <T>(
    xs: T,
    sm?: T,
    md?: T,
    lg?: T,
    xl?: T,
  ): Record<string, T> => ({
    xs,
    sm: sm ?? xs,
    md: md ?? sm ?? xs,
    lg: lg ?? md ?? sm ?? xs,
    xl: xl ?? lg ?? md ?? sm ?? xs,
  }),

  /**
   * Get responsive value based on current breakpoint
   */
  getResponsiveValue: <T>(
    values: Record<string, T>,
    currentBreakpoint: string,
  ): T => {
    return (values[currentBreakpoint] ?? Object.values(values)[0]) as T;
  },
};
