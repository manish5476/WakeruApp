import { create } from 'zustand';
import { Appearance } from 'react-native';
import { storage } from '../utils/storage';
import { ThemePreset, themePresets } from '../theme/presets';
import { lightTheme, Theme, FontPreset, fontFamilies } from '../theme';
import { authApi } from '../services/api';

type ThemeMode = 'light' | 'dark' | 'system';
type BackgroundType = 'color' | 'image' | 'video';
export type CardStyle = 'glass' | 'solid';
export type ImagePosition = { x: number; y: number; scale: number };

interface ThemeStore {
  mode: ThemeMode;
  preset: ThemePreset;
  isDark: boolean;
  theme: Theme;
  fontPreset: FontPreset;
  cardStyle: CardStyle;
  backgroundType: BackgroundType;
  backgroundColor: string | null;
  fontColor: string | null;
  backgroundImage: string | null;
  backgroundVideo: string | null;
  backgroundBlur: number;
  backgroundImagePosition: ImagePosition;

  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
  setFontPreset: (font: FontPreset) => void;
  setCardStyle: (style: CardStyle) => void;
  toggleTheme: () => void;
  syncWithSystem: () => void;
  cyclePreset: () => void;
  setBackgroundType: (type: BackgroundType) => void;
  setBackgroundColor: (color: string | null) => void;
  setFontColor: (color: string | null) => void;
  setBackgroundImage: (image: string | null) => void;
  setBackgroundVideo: (video: string | null) => void;
  setBackgroundBlur: (blur: number) => void;
  setBackgroundImagePosition: (position: ImagePosition) => void;
  hydrateFromBackend: (appearance?: any, themeMode?: ThemeMode) => void;
}

const PRESETS: ThemePreset[] = [
  'light',
  'dark',
  'midnight',
  'ocean',
  'sunset',
  'forest',
  'monochrome',
];

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return Appearance.getColorScheme() === 'dark';
}

function resolveTheme(
  mode: ThemeMode,
  preset: ThemePreset,
  fontColor?: string | null,
  fontPreset: FontPreset = 'system',
): Theme {
  let base: Theme;
  if (!['light', 'dark'].includes(preset)) {
    base = themePresets[preset] || themePresets.light;
  } else if (mode === 'dark') {
    base = themePresets.dark;
  } else if (mode === 'light') {
    base = themePresets.light;
  } else {
    base =
      Appearance.getColorScheme() === 'dark'
        ? themePresets.dark
        : themePresets.light;
  }

  const chosenFont = fontFamilies[fontPreset] || fontFamilies.system;
  base = {
    ...base,
    typography: {
      ...base.typography,
      fontFamily: {
        sans: chosenFont.sans,
        mono: chosenFont.mono,
        display: chosenFont.display,
      },
    },
  };

  if (fontColor) {
    return {
      ...base,
      colors: {
        ...base.colors,
        fontColor,
        textPrimary: fontColor,
      },
    };
  }
  return base;
}

// Load initial values from storage or set defaults
const storedMode = (storage.getString('themeMode') as ThemeMode) || 'light';
const storedPreset =
  (storage.getString('themePreset') as ThemePreset) || 'light';
const storedFontPreset =
  (storage.getString('fontPreset') as FontPreset) || 'system';
const storedCardStyle =
  (storage.getString('cardStyle') as CardStyle) || 'glass';
const storedBackgroundType =
  (storage.getString('backgroundType') as BackgroundType) || 'image';
const storedBackgroundColor = storage.getString('backgroundColor') || null;
const storedFontColor = storage.getString('fontColor') || null;
const storedBackgroundImage = storage.getString('backgroundImage') || 'cover_1';
const storedBackgroundVideo = storage.getString('backgroundVideo') || null;
const storedBackgroundBlur = storage.getNumber('backgroundBlur') ?? 50; // Default blur (50%)
let storedBackgroundImagePosition: ImagePosition = { x: 0, y: 0, scale: 1 };
try {
  const parsed = storage.getString('backgroundImagePosition');
  if (parsed) storedBackgroundImagePosition = JSON.parse(parsed);
} catch (e) {}

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
export const cancelThemePreferenceSync = () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
};
const syncWithBackend = (state: ThemeStore) => {
  cancelThemePreferenceSync();
  syncTimeout = setTimeout(async () => {
    try {
      await authApi.updatePreferences({
        theme: state.mode,
        appearance: {
          themePreset: state.preset,
          fontPreset: state.fontPreset,
          cardStyle: state.cardStyle,
          backgroundType: state.backgroundType,
          backgroundColor: state.backgroundColor,
          fontColor: state.fontColor,
          backgroundImage: state.backgroundImage,
          backgroundVideo: state.backgroundVideo,
          backgroundBlur: state.backgroundBlur,
          backgroundImagePosition: state.backgroundImagePosition,
        },
      });
    } catch (e) {
      console.error('Failed to sync appearance preferences', e);
    }
  }, 1500);
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: storedMode,
  preset: storedPreset,
  fontPreset: storedFontPreset,
  cardStyle: storedCardStyle,
  isDark: resolveIsDark(storedMode),
  theme: resolveTheme(
    storedMode,
    storedPreset,
    storedFontColor,
    storedFontPreset,
  ),
  backgroundType: storedBackgroundType,
  backgroundColor: storedBackgroundColor,
  fontColor: storedFontColor,
  backgroundImage: storedBackgroundImage,
  backgroundVideo: storedBackgroundVideo,
  backgroundBlur: storedBackgroundBlur,
  backgroundImagePosition: storedBackgroundImagePosition,

  setMode: (mode: ThemeMode) => {
    storage.setString('themeMode', mode);
    const { preset, fontColor, fontPreset } = get();
    set({
      mode,
      isDark: resolveIsDark(mode),
      theme: resolveTheme(mode, preset, fontColor, fontPreset),
    });
    syncWithBackend(get());
  },

  setCardStyle: (cardStyle: CardStyle) => {
    storage.setString('cardStyle', cardStyle);
    set({ cardStyle });
    syncWithBackend(get());
  },

  setPreset: (preset: ThemePreset) => {
    storage.setString('themePreset', preset);
    let newMode: ThemeMode = get().mode;
    if (preset === 'light') {
      newMode = 'light';
    } else if (preset === 'dark') {
      newMode = 'dark';
    } else {
      newMode = 'dark';
    }
    storage.setString('themeMode', newMode);
    const { fontColor, fontPreset } = get();
    set({
      preset,
      mode: newMode,
      isDark: resolveIsDark(newMode),
      theme: resolveTheme(newMode, preset, fontColor, fontPreset),
    });
    syncWithBackend(get());
  },

  setFontPreset: (fontPreset: FontPreset) => {
    storage.setString('fontPreset', fontPreset);
    const { mode, preset, fontColor } = get();
    set({
      fontPreset,
      theme: resolveTheme(mode, preset, fontColor, fontPreset),
    });
    syncWithBackend(get());
  },

  toggleTheme: () => {
    const { isDark, preset, fontColor, fontPreset } = get();
    if (!['light', 'dark'].includes(preset)) {
      const newMode: ThemeMode = isDark ? 'light' : 'dark';
      storage.setString('themeMode', newMode);
      storage.setString('themePreset', newMode);
      set({
        mode: newMode,
        preset: newMode,
        isDark: !isDark,
        theme: resolveTheme(newMode, newMode, fontColor, fontPreset),
      });
      syncWithBackend(get());
    } else {
      const newPreset: ThemePreset = isDark ? 'light' : 'dark';
      storage.setString('themePreset', newPreset);
      storage.setString('themeMode', newPreset);
      set({
        mode: newPreset,
        preset: newPreset,
        isDark: !isDark,
        theme: resolveTheme(newPreset, newPreset, fontColor, fontPreset),
      });
      syncWithBackend(get());
    }
  },

  syncWithSystem: () => {
    const { mode, preset, fontColor, fontPreset } = get();
    if (mode === 'system' && ['light', 'dark'].includes(preset)) {
      set({
        isDark: Appearance.getColorScheme() === 'dark',
        theme: resolveTheme('system', preset, fontColor, fontPreset),
      });
    }
  },

  cyclePreset: () => {
    const { preset } = get();
    const idx = PRESETS.indexOf(preset);
    const next = PRESETS[(idx + 1) % PRESETS.length];
    get().setPreset(next);
  },

  setBackgroundType: (type: BackgroundType) => {
    storage.setString('backgroundType', type);
    set({ backgroundType: type });
    syncWithBackend(get());
  },

  setBackgroundColor: (color: string | null) => {
    if (color) {
      storage.setString('backgroundColor', color);
    } else {
      storage.delete('backgroundColor');
    }
    set({ backgroundColor: color });
    syncWithBackend(get());
  },

  setFontColor: (color: string | null) => {
    if (color) {
      storage.setString('fontColor', color);
    } else {
      storage.delete('fontColor');
    }
    const { mode, preset, fontPreset } = get();
    set({
      fontColor: color,
      theme: resolveTheme(mode, preset, color, fontPreset),
    });
    syncWithBackend(get());
  },

  setBackgroundImage: (image: string | null) => {
    if (image) {
      storage.setString('backgroundImage', image);
    } else {
      storage.delete('backgroundImage');
    }
    set({ backgroundImage: image });
    syncWithBackend(get());
  },

  setBackgroundVideo: (video: string | null) => {
    if (video) {
      storage.setString('backgroundVideo', video);
    } else {
      storage.delete('backgroundVideo');
    }
    set({ backgroundVideo: video });
    syncWithBackend(get());
  },

  setBackgroundBlur: (blur: number) => {
    storage.setNumber('backgroundBlur', blur);
    set({ backgroundBlur: blur });
    syncWithBackend(get());
  },

  setBackgroundImagePosition: (position: ImagePosition) => {
    storage.setString('backgroundImagePosition', JSON.stringify(position));
    set({ backgroundImagePosition: position });
    syncWithBackend(get());
  },

  hydrateFromBackend: (appearance?: any, themeMode?: ThemeMode) => {
    let hasUpdates = false;
    const updates: Partial<ThemeStore> = {};

    let currentMode = get().mode;
    let currentPreset = get().preset;
    let currentFontPreset = get().fontPreset;

    if (themeMode && ['light', 'dark', 'system'].includes(themeMode)) {
      updates.mode = themeMode;
      currentMode = themeMode;
      storage.setString('themeMode', themeMode);
      const isDark = resolveIsDark(themeMode);
      updates.isDark = isDark;
      hasUpdates = true;
    }

    if (appearance) {
      if (appearance.themePreset !== undefined) {
        updates.preset = appearance.themePreset;
        currentPreset = appearance.themePreset;
        storage.setString('themePreset', appearance.themePreset);
        hasUpdates = true;
      }
      if (appearance.fontPreset !== undefined) {
        updates.fontPreset = appearance.fontPreset;
        currentFontPreset = appearance.fontPreset;
        storage.setString('fontPreset', appearance.fontPreset);
        hasUpdates = true;
      }
      if (appearance.cardStyle !== undefined) {
        updates.cardStyle = appearance.cardStyle;
        storage.setString('cardStyle', appearance.cardStyle);
        hasUpdates = true;
      }
      if (appearance.backgroundType !== undefined) {
        updates.backgroundType = appearance.backgroundType;
        storage.setString('backgroundType', appearance.backgroundType);
        hasUpdates = true;
      }
      if (appearance.backgroundColor !== undefined) {
        updates.backgroundColor = appearance.backgroundColor;
        if (appearance.backgroundColor)
          storage.setString('backgroundColor', appearance.backgroundColor);
        else storage.delete('backgroundColor');
        hasUpdates = true;
      }
      if (appearance.fontColor !== undefined) {
        updates.fontColor = appearance.fontColor;
        if (appearance.fontColor)
          storage.setString('fontColor', appearance.fontColor);
        else storage.delete('fontColor');
        hasUpdates = true;
      }
      if (appearance.backgroundImage !== undefined) {
        updates.backgroundImage = appearance.backgroundImage;
        if (appearance.backgroundImage)
          storage.setString('backgroundImage', appearance.backgroundImage);
        else storage.delete('backgroundImage');
        hasUpdates = true;
      }
      if (appearance.backgroundVideo !== undefined) {
        updates.backgroundVideo = appearance.backgroundVideo;
        if (appearance.backgroundVideo)
          storage.setString('backgroundVideo', appearance.backgroundVideo);
        else storage.delete('backgroundVideo');
        hasUpdates = true;
      }
      if (appearance.backgroundBlur !== undefined) {
        updates.backgroundBlur = appearance.backgroundBlur;
        storage.setNumber('backgroundBlur', appearance.backgroundBlur);
        hasUpdates = true;
      }
      if (appearance.backgroundImagePosition !== undefined) {
        updates.backgroundImagePosition = appearance.backgroundImagePosition;
        storage.setString(
          'backgroundImagePosition',
          JSON.stringify(appearance.backgroundImagePosition),
        );
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      if (updates.mode || updates.preset || updates.fontPreset) {
        updates.theme = resolveTheme(
          currentMode,
          currentPreset,
          updates.fontColor !== undefined ? updates.fontColor : get().fontColor,
          currentFontPreset,
        );
      }
      set(updates);
    }
  },
}));

// Listen for system appearance changes
Appearance.addChangeListener(() => {
  useThemeStore.getState().syncWithSystem();
});

export default useThemeStore;
