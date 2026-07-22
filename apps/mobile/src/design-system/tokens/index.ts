import { lightColors, darkColors, amoledColors, ColorTheme } from './colors';
import { spacing, Spacing } from './spacing';
import { radius, Radius } from './radius';
import { breakpoints, Breakpoints } from './breakpoints';
import { typography, Typography } from './typography';

export interface ThemeTokens {
  colors: ColorTheme;
  spacing: Spacing;
  radius: Radius;
  breakpoints: Breakpoints;
  typography: Typography;
}

export const lightThemeTokens: ThemeTokens = {
  colors: lightColors,
  spacing,
  radius,
  breakpoints,
  typography,
};

export const darkThemeTokens: ThemeTokens = {
  colors: darkColors,
  spacing,
  radius,
  breakpoints,
  typography,
};

export const amoledThemeTokens: ThemeTokens = {
  colors: amoledColors,
  spacing,
  radius,
  breakpoints,
  typography,
};
