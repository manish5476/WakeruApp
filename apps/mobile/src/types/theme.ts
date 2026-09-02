// Theme Type Definitions for TripSplit Native

export type ThemeMode = 'light' | 'dark' | 'amoled';
export type ThemePreset =
  | 'default-light'
  | 'default-dark'
  | 'amoled'
  | 'glass-light'
  | 'glass-dark'
  | 'midnight'
  | 'ocean'
  | 'aurora'
  | 'sunset'
  | 'forest'
  | 'slate'
  | 'minimal'
  | 'luxury-black';

export interface ColorTokens {
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  // Accents
  accent: string;
  accentLight: string;
  accentDark: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Neutral
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  disabled: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
}

export interface TypographyScale {
  displayXL: Typography;
  displayL: Typography;
  displayM: Typography;
  headingXL: Typography;
  headingL: Typography;
  headingM: Typography;
  headingS: Typography;
  title: Typography;
  subtitle: Typography;
  bodyXL: Typography;
  body: Typography;
  bodySmall: Typography;
  caption: Typography;
  label: Typography;
  overline: Typography;
  code: Typography;
  numeric: Typography;
}

export interface Typography {
  fontSize: number;
  fontWeight:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  lineHeight: number;
  letterSpacing: number;
}

export interface GlassPreset {
  blur: number;
  opacity: number;
  borderWidth: number;
  borderColor: string;
  shadowColor: string;
  shadowOpacity: number;
  shadowOffset: { width: number; height: number };
  shadowRadius: number;
  elevation: number;
  backgroundColor: string;
}

export interface GlassTokens {
  ultraThin: GlassPreset;
  thin: GlassPreset;
  regular: GlassPreset;
  thick: GlassPreset;
  frosted: GlassPreset;
  floating: GlassPreset;
  navigation: GlassPreset;
  overlay: GlassPreset;
  bottomSheet: GlassPreset;
  modal: GlassPreset;
  sidebar: GlassPreset;
}

export interface SpacingScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xl2: number;
  xl3: number;
  xl4: number;
  xl5: number;
  xl6: number;
}

export interface RadiusScale {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ShadowScale {
  none: ShadowValue;
  xs: ShadowValue;
  sm: ShadowValue;
  md: ShadowValue;
  lg: ShadowValue;
  xl: ShadowValue;
  xl2: ShadowValue;
}

export interface ShadowValue {
  color: string;
  opacity: number;
  offset: { width: number; height: number };
  radius: number;
  elevation: number;
}

export interface ElevationScale {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xl2: number;
}

export interface OpacityScale {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface BreakpointsScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xl2: number;
}

export interface IconSizesScale {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xl2: number;
}

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyScale;
  spacing: SpacingScale;
  radius: RadiusScale;
  shadows: ShadowScale;
  elevation: ElevationScale;
  opacity: OpacityScale;
  glass: GlassTokens;
  breakpoints: BreakpointsScale;
  iconSizes: IconSizesScale;
}

export interface Theme extends DesignTokens {
  mode: ThemeMode;
  preset: ThemePreset;
}

export interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  preset: ThemePreset;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
  toggleMode: () => void;
}
