// Styling Helper Utilities
import { ViewStyle, TextStyle } from 'react-native';
import { Theme } from '@/types/theme';

/**
 * Create typed styles with theme access
 */
export const createStyles = <T extends Record<string, ViewStyle | TextStyle>>(
  styles: (theme: Theme) => T,
): ((theme: Theme) => T) => {
  return styles;
};

/**
 * Create style variants (similar to class-based variants)
 */
export const createVariant = (variants: {
  base: ViewStyle | TextStyle;
  variants: Record<string, Record<string, ViewStyle | TextStyle>>;
  defaultVariants?: Record<string, string>;
}) => {
  return (props: Record<string, string>) => {
    const styles: (ViewStyle | TextStyle)[] = [variants.base];

    Object.entries(props).forEach(([key, value]) => {
      if (variants.variants[key]?.[value]) {
        styles.push(variants.variants[key][value]);
      }
    });

    return Object.assign({}, ...styles);
  };
};

/**
 * Merge multiple styles
 */
export const mergeStyles = (
  ...styles: (ViewStyle | TextStyle | undefined)[]
): ViewStyle | TextStyle => {
  return Object.assign({}, ...styles.filter(Boolean));
};

/**
 * Create responsive styles based on breakpoints
 */
export const responsive = (
  _theme: Theme,
  configs: {
    xs?: ViewStyle | TextStyle;
    sm?: ViewStyle | TextStyle;
    md?: ViewStyle | TextStyle;
    lg?: ViewStyle | TextStyle;
    xl?: ViewStyle | TextStyle;
    xl2?: ViewStyle | TextStyle;
  },
): Record<string, ViewStyle | TextStyle> => {
  return {
    '@media (max-width: 320px)': configs.xs ?? {},
    '@media (min-width: 321px)': configs.sm ?? {},
    '@media (min-width: 768px)': configs.md ?? {},
    '@media (min-width: 1024px)': configs.lg ?? {},
    '@media (min-width: 1280px)': configs.xl ?? {},
    '@media (min-width: 1536px)': configs.xl2 ?? {},
  } as any;
};

/**
 * Apply glass morphism style
 */
export const glassStyle = (
  theme: Theme,
  intensity: 'ultraThin' | 'thin' | 'regular' | 'thick' | 'frosted' = 'regular',
): ViewStyle => {
  const glass = theme.glass[intensity];
  return {
    backgroundColor: glass.backgroundColor,
    borderColor: glass.borderColor,
    borderWidth: glass.borderWidth,
    shadowColor: glass.shadowColor,
    shadowOpacity: glass.shadowOpacity,
    shadowOffset: glass.shadowOffset,
    shadowRadius: glass.shadowRadius,
    elevation: glass.elevation,
  } as ViewStyle;
};

/**
 * Apply surface style from theme
 */
export const surfaceStyle = (surfaceConfig: {
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowOffset?: { width: number; height: number };
  shadowRadius?: number;
  elevation?: number;
}): ViewStyle => {
  return {
    backgroundColor: surfaceConfig.backgroundColor,
    borderColor: surfaceConfig.borderColor,
    borderWidth: surfaceConfig.borderWidth ?? 0,
    shadowColor: surfaceConfig.shadowColor,
    shadowOpacity: surfaceConfig.shadowOpacity,
    shadowOffset: surfaceConfig.shadowOffset,
    shadowRadius: surfaceConfig.shadowRadius,
    elevation: surfaceConfig.elevation,
  } as ViewStyle;
};

/**
 * Apply shadow style
 */
export const shadowStyle = (shadowConfig: {
  color: string;
  opacity: number;
  offset: { width: number; height: number };
  radius: number;
  elevation: number;
}): ViewStyle => {
  return {
    shadowColor: shadowConfig.color,
    shadowOpacity: shadowConfig.opacity,
    shadowOffset: shadowConfig.offset,
    shadowRadius: shadowConfig.radius,
    elevation: shadowConfig.elevation,
  } as ViewStyle;
};

/**
 * Create spacing style
 */
export const spacing = (
  scale:
    | number
    | {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
        horizontal?: number;
        vertical?: number;
      },
  spaceValue: (key: string) => number = () => 0,
): ViewStyle => {
  if (typeof scale === 'number') {
    const value = spaceValue(scale.toString());
    return {
      paddingHorizontal: value,
      paddingVertical: value,
    };
  }

  return {
    paddingTop: scale.top,
    paddingBottom: scale.bottom,
    paddingLeft: scale.left,
    paddingRight: scale.right,
    paddingHorizontal: scale.horizontal,
    paddingVertical: scale.vertical,
  } as ViewStyle;
};

/**
 * Create typography style
 */
export const typography = (typoScale: {
  fontSize: number;
  fontWeight: string | number;
  lineHeight: number;
  letterSpacing: number;
}): TextStyle => {
  return {
    fontSize: typoScale.fontSize,
    fontWeight: typoScale.fontWeight as TextStyle['fontWeight'],
    lineHeight: typoScale.lineHeight,
    letterSpacing: typoScale.letterSpacing,
  };
};

/**
 * Create animation style
 */
export const animation = (config: {
  duration?: number;
  easing?: string;
  delay?: number;
  transform?: string;
}): ViewStyle => {
  return {
    transitionDuration: `${config.duration ?? 300}ms`,
    transitionTimingFunction: config.easing ?? 'ease-out',
    transitionDelay: `${config.delay ?? 0}ms`,
  } as any;
};

/**
 * Create color style
 */
export const color = (colors: {
  text?: string;
  background?: string;
  border?: string;
  tint?: string;
}): ViewStyle | TextStyle => {
  return {
    color: colors.text,
    backgroundColor: colors.background,
    borderColor: colors.border,
    tintColor: colors.tint,
  } as any;
};

/**
 * Create radius style
 */
export const radius = (
  value:
    | number
    | {
        topLeft?: number;
        topRight?: number;
        bottomLeft?: number;
        bottomRight?: number;
      },
): ViewStyle => {
  if (typeof value === 'number') {
    return { borderRadius: value };
  }

  return {
    borderTopLeftRadius: value.topLeft,
    borderTopRightRadius: value.topRight,
    borderBottomLeftRadius: value.bottomLeft,
    borderBottomRightRadius: value.bottomRight,
  } as ViewStyle;
};

/**
 * Create opacity style
 */
export const opacity = (value: number): ViewStyle => ({
  opacity: Math.min(Math.max(value, 0), 1),
});

/**
 * Create disabled state style
 */
export const disabledState = (
  theme: Theme,
  baseStyle: ViewStyle | TextStyle = {},
): ViewStyle | TextStyle => {
  return {
    ...baseStyle,
    opacity: theme.opacity.md,
  };
};

/**
 * Create focus/active state style
 */
export const focusState = (
  baseStyle: ViewStyle | TextStyle = {},
): ViewStyle | TextStyle => {
  return {
    ...baseStyle,
    outline: 'none',
  } as any;
};

/**
 * Combine multiple helper functions
 */
export const composeStyles = (
  ...helpers: (ViewStyle | TextStyle)[]
): ViewStyle | TextStyle => {
  return Object.assign({}, ...helpers.filter(Boolean));
};
