// theme/presets.ts
import { lightTheme, darkThemeObj, Theme } from './index';

export type ThemePreset =
  | 'light'
  | 'dark'
  | 'midnight'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'monochrome'
  | 'rose'
  | 'gold'
  | 'aurora';

// ============================================================
// Design rule for every preset below:
// - ONE accent hue per preset (primary/secondary/accent all derive
//   from that single family) — no cross-hue rainbow combinations.
// - Text/background pairs are chosen for contrast, not saturation.
// - "aura" (ambient background gradient) stays a soft tint of the
//   SAME accent hue, never a mix of unrelated hues.
//
// NOTE (v4.1): these presets spread `...lightTheme` / `...darkThemeObj`,
// so the glass-opacity fix and softened darkFade gradient in index.ts
// apply automatically to every preset below — no changes needed here.
// ============================================================

const auraOverrides = {
  light: ['#FAFAFA', '#F2F2F3', '#E4E4E7', '#F2F2F3', '#FAFAFA'] as const,
  dark: ['#121214', '#19191C', '#232326', '#19191C', '#121214'] as const,
  midnight: ['#121218', '#1A1A24', '#242433', '#1A1A24', '#121218'] as const,
  ocean: ['#EEF2F8', '#D3DFEE', '#A6C0DD', '#D3DFEE', '#EEF2F8'] as const,
  sunset: ['#FBF0E9', '#F3D7C2', '#E9AA9E', '#F3D7C2', '#FBF0E9'] as const,
  forest: ['#EEF6F1', '#D7EBDF', '#B0D7BF', '#D7EBDF', '#EEF6F1'] as const,
  monochrome: ['#FAFAFA', '#F2F2F3', '#E4E4E7', '#F2F2F3', '#FAFAFA'] as const,
  rose: ['#FBEEEC', '#F5D4CE', '#E9AA9E', '#F5D4CE', '#FBEEEC'] as const,
  gold: ['#FDF9EE', '#F8ECC9', '#F0D68A', '#F8ECC9', '#FDF9EE'] as const,
  aurora: ['#ECF7F5', '#CBEBE4', '#97D7CB', '#CBEBE4', '#ECF7F5'] as const,
} as const;

export const themePresets: Record<ThemePreset, Theme> = {
  // ── Light — neutral chrome, gold accent ─────────────────
  light: {
    ...lightTheme,
    gradients: { ...lightTheme.gradients, aura: auraOverrides.light },
  },

  // ── Dark — neutral chrome, gold accent (no navy cast) ───
  dark: {
    ...darkThemeObj,
    gradients: { ...darkThemeObj.gradients, aura: auraOverrides.dark },
  },

  // ── Midnight — near-black neutral base, indigo as the ONLY accent ──
  midnight: {
    ...darkThemeObj,
    colors: {
      ...darkThemeObj.colors,
      background: '#121218',
      surface: '#191924',
      card: '#191924',
      elevated: '#20202E',

      primary: '#C7CBFA',
      primaryLight: '#A9AFF6',
      primaryDark: '#8E96EF',
      primaryBg: '#1E1E30',
      primaryBorder: '#2E2E48',

      secondary: '#A9AFF6',
      secondaryBg: '#1E1E30',
      accent: '#A9AFF6',
      accentLight: '#C7CBFA',
      accentDark: '#8E96EF',

      success: '#7FBD9E',
      successBg: 'rgba(127, 189, 158, 0.12)',
      warning: '#E0BE72',
      warningBg: 'rgba(224, 190, 114, 0.12)',
      danger: '#DE8C7E',
      dangerBg: 'rgba(222, 140, 126, 0.12)',
      info: '#8EA9E0',
      infoLight: 'rgba(142, 169, 224, 0.12)',

      textPrimary: '#E7E7EF',
      fontColor: '#E7E7EF',
      textSecondary: '#B4B4C8',
      textTertiary: '#808096',
      textLink: '#A9AFF6',

      borderLight: '#20202E',
      borderDefault: '#2E2E48',
      borderStrong: '#3D3D5C',
      headingBg: '#1E1E30',

      overlay: 'rgba(9, 9, 15, 0.75)',
      overlayLight: 'rgba(169, 175, 246, 0.08)',
    },
    gradients: {
      ...darkThemeObj.gradients,
      primary: ['#8E96EF', '#6D74D6', '#4E54B8'] as const,
      secondary: ['#C7CBFA', '#A9AFF6', '#8E96EF'] as const,
      aura: auraOverrides.midnight,
    },
  },

  // ── Ocean — neutral-cool base, cyan as the only accent ──
  ocean: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      background: '#F7FAFC',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#FFFFFF',

      primary: '#1F3A52',
      primaryLight: '#3D5A75',
      primaryDark: '#152A3C',
      primaryBg: '#EEF2F8',
      primaryBorder: '#D3DFEE',

      secondary: '#4A6FA5',
      secondaryBg: '#EEF2F8',
      accent: '#4A6FA5',
      accentLight: '#5B87B9',
      accentDark: '#3D5B87',

      success: '#3F8F6A',
      successBg: '#EEF6F1',
      warning: '#B8891F',
      warningBg: '#FBF3E4',
      danger: '#B4453A',
      dangerBg: '#FBEEEC',
      info: '#4A6FA5',
      infoLight: '#EEF2F8',

      textPrimary: '#152A3C',
      fontColor: '#152A3C',
      textSecondary: '#3D5A75',
      textTertiary: '#7AA0CB',
      textLink: '#3D5B87',

      borderLight: '#D3DFEE',
      borderDefault: '#A6C0DD',
      headingBg: '#EEF2F8',

      overlay: 'rgba(21, 42, 60, 0.5)',
      overlayLight: 'rgba(74, 111, 165, 0.06)',
    },
    gradients: {
      ...lightTheme.gradients,
      primary: ['#1F3A52', '#3D5A75', '#4A6FA5'] as const,
      secondary: ['#5B87B9', '#4A6FA5', '#3D5B87'] as const,
      aura: auraOverrides.ocean,
    },
  },

  // ── Sunset — warm neutral base, single warm-coral accent ──
  sunset: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      background: '#FCF8F5',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#FFFFFF',

      primary: '#5C3420',
      primaryLight: '#8A5636',
      primaryDark: '#3F2314',
      primaryBg: '#FBF0E9',
      primaryBorder: '#F3D7C2',

      secondary: '#C0654A',
      secondaryBg: '#FBF0E9',
      accent: '#C0654A',
      accentLight: '#D68868',
      accentDark: '#A0543D',

      success: '#3F8F6A',
      successBg: '#EEF6F1',
      warning: '#B8891F',
      warningBg: '#FBF3E4',
      danger: '#B4453A',
      dangerBg: '#FBEEEC',
      info: '#4A6FA5',
      infoLight: '#EEF2F8',

      textPrimary: '#3F2314',
      fontColor: '#3F2314',
      textSecondary: '#8A5636',
      textTertiary: '#D68868',
      textLink: '#A0543D',

      borderLight: '#F3D7C2',
      borderDefault: '#E9AA9E',
      headingBg: '#FBF0E9',

      overlay: 'rgba(63, 35, 20, 0.5)',
      overlayLight: 'rgba(192, 101, 74, 0.06)',
    },
    gradients: {
      ...lightTheme.gradients,
      primary: ['#5C3420', '#8A5636', '#C0654A'] as const,
      secondary: ['#D68868', '#C0654A', '#A0543D'] as const,
      aura: auraOverrides.sunset,
    },
  },

  // ── Forest — neutral base, single green accent ──
  forest: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      background: '#F8FAF9',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#FFFFFF',

      primary: '#1E4433',
      primaryLight: '#327256',
      primaryDark: '#153021',
      primaryBg: '#EEF6F1',
      primaryBorder: '#D7EBDF',

      secondary: '#3F8F6A',
      secondaryBg: '#EEF6F1',
      accent: '#3F8F6A',
      accentLight: '#5CA37E',
      accentDark: '#327256',

      success: '#3F8F6A',
      successBg: '#EEF6F1',
      warning: '#B8891F',
      warningBg: '#FBF3E4',
      danger: '#B4453A',
      dangerBg: '#FBEEEC',
      info: '#4A6FA5',
      infoLight: '#EEF2F8',

      textPrimary: '#153021',
      fontColor: '#153021',
      textSecondary: '#327256',
      textTertiary: '#83BE9C',
      textLink: '#285A44',

      borderLight: '#D7EBDF',
      borderDefault: '#B0D7BF',
      headingBg: '#EEF6F1',

      overlay: 'rgba(21, 48, 33, 0.5)',
      overlayLight: 'rgba(63, 143, 106, 0.06)',
    },
    gradients: {
      ...lightTheme.gradients,
      primary: ['#1E4433', '#327256', '#3F8F6A'] as const,
      secondary: ['#5CA37E', '#3F8F6A', '#327256'] as const,
      aura: auraOverrides.forest,
    },
  },

  // ── Monochrome — true grayscale, no hue at all ──
  monochrome: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      background: '#FAFAFA',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#FFFFFF',

      primary: '#121214',
      primaryLight: '#3A3A40',
      primaryDark: '#09090B',
      primaryBg: '#F2F2F3',
      primaryBorder: '#E4E4E7',

      secondary: '#52525B',
      secondaryBg: '#F2F2F3',
      accent: '#3A3A40',
      accentLight: '#71717A',
      accentDark: '#232326',

      success: '#3F8F6A',
      successBg: '#EEF6F1',
      warning: '#B8891F',
      warningBg: '#FBF3E4',
      danger: '#B4453A',
      dangerBg: '#FBEEEC',
      info: '#52525B',
      infoLight: '#F2F2F3',

      textPrimary: '#09090B',
      fontColor: '#09090B',
      textSecondary: '#52525B',
      textTertiary: '#A0A0AA',
      textLink: '#121214',

      borderLight: '#E4E4E7',
      borderDefault: '#D1D1D6',
      headingBg: '#F2F2F3',

      overlay: 'rgba(9, 9, 11, 0.5)',
      overlayLight: 'rgba(18, 18, 20, 0.06)',
    },
    gradients: {
      ...lightTheme.gradients,
      primary: ['#121214', '#3A3A40', '#52525B'] as const,
      secondary: ['#71717A', '#52525B', '#3A3A40'] as const,
      aura: auraOverrides.monochrome,
    },
  },

  // ── Rose — neutral base, single rose accent ──
  rose: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      background: '#FDF8F7',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#FFFFFF',

      primary: '#57231E',
      primaryLight: '#943830',
      primaryDark: '#3D1815',
      primaryBg: '#FBEEEC',
      primaryBorder: '#F5D4CE',

      secondary: '#B4453A',
      secondaryBg: '#FBEEEC',
      accent: '#B4453A',
      accentLight: '#CB5C48',
      accentDark: '#943830',

      success: '#3F8F6A',
      successBg: '#EEF6F1',
      warning: '#B8891F',
      warningBg: '#FBF3E4',
      danger: '#B4453A',
      dangerBg: '#FBEEEC',
      info: '#4A6FA5',
      infoLight: '#EEF2F8',

      textPrimary: '#3D1815',
      fontColor: '#3D1815',
      textSecondary: '#943830',
      textTertiary: '#DC7E6D',
      textLink: '#943830',

      borderLight: '#F5D4CE',
      borderDefault: '#E9AA9E',
      headingBg: '#FBEEEC',

      overlay: 'rgba(61, 24, 21, 0.5)',
      overlayLight: 'rgba(180, 69, 58, 0.06)',
    },
    gradients: {
      ...lightTheme.gradients,
      primary: ['#57231E', '#943830', '#B4453A'] as const,
      secondary: ['#CB5C48', '#B4453A', '#943830'] as const,
      aura: auraOverrides.rose,
    },
  },

  // ── Gold — neutral base, richer/deeper gold accent than default ──
  gold: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      background: '#FDFBF6',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#FFFFFF',

      primary: '#5C4512',
      primaryLight: '#96701A',
      primaryDark: '#43330D',
      primaryBg: '#FDF9EE',
      primaryBorder: '#F0D68A',

      secondary: '#B8891F',
      secondaryBg: '#FDF9EE',
      accent: '#B8891F',
      accentLight: '#D4A62E',
      accentDark: '#96701A',

      success: '#3F8F6A',
      successBg: '#EEF6F1',
      warning: '#B8891F',
      warningBg: '#FBF3E4',
      danger: '#B4453A',
      dangerBg: '#FBEEEC',
      info: '#4A6FA5',
      infoLight: '#EEF2F8',

      textPrimary: '#43330D',
      fontColor: '#43330D',
      textSecondary: '#96701A',
      textTertiary: '#DFAE52',
      textLink: '#755716',

      borderLight: '#F0D68A',
      borderDefault: '#EBC981',
      headingBg: '#FDF9EE',

      overlay: 'rgba(67, 51, 13, 0.5)',
      overlayLight: 'rgba(184, 137, 31, 0.06)',
    },
    gradients: {
      ...lightTheme.gradients,
      primary: ['#5C4512', '#96701A', '#B8891F'] as const,
      secondary: ['#D4A62E', '#B8891F', '#96701A'] as const,
      aura: auraOverrides.gold,
    },
  },

  // ── Aurora — neutral base, single teal accent ──
  aurora: {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      background: '#F7FBFA',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      elevated: '#FFFFFF',

      primary: '#0F4740',
      primaryLight: '#115E56',
      primaryDark: '#0A312C',
      primaryBg: '#ECF7F5',
      primaryBorder: '#CBEBE4',

      secondary: '#0D9488',
      secondaryBg: '#ECF7F5',
      accent: '#0D9488',
      accentLight: '#3AA895',
      accentDark: '#0F766E',

      success: '#3F8F6A',
      successBg: '#EEF6F1',
      warning: '#B8891F',
      warningBg: '#FBF3E4',
      danger: '#B4453A',
      dangerBg: '#FBEEEC',
      info: '#4A6FA5',
      infoLight: '#EEF2F8',

      textPrimary: '#0A312C',
      fontColor: '#0A312C',
      textSecondary: '#115E56',
      textTertiary: '#63C0AF',
      textLink: '#0F766E',

      borderLight: '#CBEBE4',
      borderDefault: '#97D7CB',
      headingBg: '#ECF7F5',

      overlay: 'rgba(10, 49, 44, 0.5)',
      overlayLight: 'rgba(13, 148, 136, 0.06)',
    },
    gradients: {
      ...lightTheme.gradients,
      primary: ['#0F4740', '#115E56', '#0D9488'] as const,
      secondary: ['#3AA895', '#0D9488', '#0F766E'] as const,
      aura: auraOverrides.aurora,
    },
  },
};

// ── Dark variants for green-tinted themes ─────────────────────
export const darkForestTheme: Theme = {
  ...darkThemeObj,
  colors: {
    ...darkThemeObj.colors,
    background: '#0B1A14',
    surface: '#12261E',
    card: '#12261E',
    elevated: '#173328',

    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    primaryBg: '#0F2E22',
    primaryBorder: '#1A4D39',

    secondary: '#34D399',
    secondaryBg: '#0F2E22',
    accent: '#10B981',
    accentLight: '#6EE7B7',
    accentDark: '#047857',

    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.14)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.14)',
    danger: '#F43F5E',
    dangerBg: 'rgba(244, 63, 94, 0.14)',
    info: '#06B6D4',
    infoLight: 'rgba(6, 182, 212, 0.14)',

    textPrimary: '#F0FDF4',
    fontColor: '#F0FDF4',
    textSecondary: '#A7F3D0',
    textTertiary: '#6EE7B7',
    textLink: '#34D399',

    borderLight: '#173D2C',
    borderDefault: '#1E4E38',
    borderStrong: '#29674B',
    headingBg: '#0F2E22',

    overlay: 'rgba(7, 18, 13, 0.8)',
    overlayLight: 'rgba(16, 185, 129, 0.08)',
  },
  gradients: {
    ...darkThemeObj.gradients,
    primary: ['#059669', '#10B981', '#34D399'] as const,
    secondary: ['#10B981', '#34D399', '#6EE7B7'] as const,
    aura: ['#0B1A14', '#12261E', '#173328', '#12261E', '#0B1A14'] as const,
  },
};

export const darkAuroraTheme: Theme = {
  ...darkThemeObj,
  colors: {
    ...darkThemeObj.colors,
    background: '#0B1A1A',
    surface: '#112526',
    card: '#112526',
    elevated: '#163234',

    primary: '#14B8A6',
    primaryLight: '#2DD4BF',
    primaryDark: '#0D9488',
    primaryBg: '#0E2E2E',
    primaryBorder: '#164B4D',

    secondary: '#2DD4BF',
    secondaryBg: '#0E2E2E',
    accent: '#14B8A6',
    accentLight: '#5EEAD4',
    accentDark: '#0F766E',

    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.14)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.14)',
    danger: '#F43F5E',
    dangerBg: 'rgba(244, 63, 94, 0.14)',
    info: '#06B6D4',
    infoLight: 'rgba(6, 182, 212, 0.14)',

    textPrimary: '#F0FDFA',
    fontColor: '#F0FDFA',
    textSecondary: '#99F6E4',
    textTertiary: '#5EEAD4',
    textLink: '#2DD4BF',

    borderLight: '#143C3D',
    borderDefault: '#1C4F51',
    borderStrong: '#256568',
    headingBg: '#0E2E2E',

    overlay: 'rgba(7, 18, 18, 0.8)',
    overlayLight: 'rgba(20, 184, 166, 0.08)',
  },
  gradients: {
    ...darkThemeObj.gradients,
    primary: ['#0D9488', '#14B8A6', '#2DD4BF'] as const,
    secondary: ['#14B8A6', '#2DD4BF', '#5EEAD4'] as const,
    aura: ['#0B1A1A', '#112526', '#163234', '#112526', '#0B1A1A'] as const,
  },
};

// Theme metadata for UI display
export const themeMeta: Record<
  ThemePreset,
  { name: string; emoji: string; description: string; isDark: boolean }
> = {
  light: { name: 'Light', emoji: '☀️', description: 'Clean neutral, gold accent', isDark: false },
  dark: { name: 'Dark', emoji: '🌙', description: 'True neutral dark, gold accent', isDark: true },
  midnight: {
    name: 'Midnight',
    emoji: '🌌',
    description: 'Near-black, indigo accent',
    isDark: true,
  },
  ocean: {
    name: 'Ocean',
    emoji: '🌊',
    description: 'Cool neutral, steel-blue accent',
    isDark: false,
  },
  sunset: { name: 'Sunset', emoji: '🌅', description: 'Warm neutral, coral accent', isDark: false },
  forest: { name: 'Forest', emoji: '🌿', description: 'Lush emerald green', isDark: false },
  monochrome: { name: 'Mono', emoji: '◼️', description: 'Pure grayscale', isDark: false },
  rose: { name: 'Rose', emoji: '🌹', description: 'Neutral, rose accent', isDark: false },
  gold: { name: 'Gold', emoji: '✨', description: 'Neutral, deep gold accent', isDark: false },
  aurora: { name: 'Aurora', emoji: '🌅', description: 'Mint & glowing teal', isDark: false },
};
