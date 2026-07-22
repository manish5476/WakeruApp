export const typography = {
  fonts: {
    regular: 'Inter-Regular', // Mapped to body normal
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16, // base
    lg: 18,
    xl: 20,
    xxl: 24, // 2xl
    xxxl: 30, // 3xl
    huge: 36, // 4xl
    display: 48, // 5xl
    displayLg: 60, // 6xl
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
} as const;

export type Typography = typeof typography;
