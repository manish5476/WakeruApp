export const breakpoints = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
} as const;

export type Breakpoints = typeof breakpoints;
