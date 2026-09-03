import { create } from 'zustand';
import { Appearance } from 'react-native';
import { storage } from '../utils/storage';
import { ThemePreset, themePresets } from '../theme/presets';
import { Theme } from '../theme';
import { authApi } from '../services/api';

export type ThemeMode = 'light' | 'dark' | 'system';
export type BackgroundType = 'color' | 'image' | 'video';
export type ImagePosition = { x: number; y: number; scale: number };
export type { ThemePreset };

export interface ThemeStore {
  mode: ThemeMode;
  preset: ThemePreset;
  isDark: boolean;
  theme: Theme;
  backgroundType: BackgroundType;
  backgroundColor: string | null;
  backgroundImage: string | null;
  backgroundVideo: string | null;
  backgroundBlur: number;
  backgroundImagePosition: ImagePosition;

  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
  toggleTheme: () => void;
  syncWithSystem: () => void;
  cyclePreset: () => void;
  setBackgroundType: (type: BackgroundType) => void;
  setBackgroundColor: (color: string | null) => void;
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

function resolveTheme(mode: ThemeMode, preset: ThemePreset): Theme {
  if (!['light', 'dark'].includes(preset)) {
    return themePresets[preset];
  }
  if (mode === 'dark') return themePresets.dark;
  if (mode === 'light') return themePresets.light;
  return Appearance.getColorScheme() === 'dark'
    ? themePresets.dark
    : themePresets.light;
}

// Load initial values from storage or set defaults
const storedMode = (storage.getString('themeMode') as ThemeMode) || 'light';
const storedPreset =
  (storage.getString('themePreset') as ThemePreset) || 'light';
const storedBackgroundType =
  (storage.getString('backgroundType') as BackgroundType) || 'color';
const storedBackgroundColor = storage.getString('backgroundColor') || null;
const storedBackgroundImage = storage.getString('backgroundImage') || null;
const storedBackgroundVideo = storage.getString('backgroundVideo') || null;
const storedBackgroundBlur = storage.getNumber('backgroundBlur') ?? 50;

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

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: storedMode,
  preset: storedPreset,
  isDark: resolveIsDark(storedMode),
  theme: resolveTheme(storedMode, storedPreset),
  backgroundType: storedBackgroundType,
  backgroundColor: storedBackgroundColor,
  backgroundImage: storedBackgroundImage,
  backgroundVideo: storedBackgroundVideo,
  backgroundBlur: storedBackgroundBlur,
  backgroundImagePosition: storedBackgroundImagePosition,

  setMode: (mode: ThemeMode) => {
    storage.setString('themeMode', mode);
    const { preset } = get();
    set({
      mode,
      isDark: resolveIsDark(mode),
      theme: resolveTheme(mode, preset),
    });

    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      const current = get();
      authApi
        .updateProfile({
          preferences: {
            theme: current.mode,
            appearance: {
              themePreset: current.preset,
              backgroundType: current.backgroundType,
              backgroundColor: current.backgroundColor || undefined,
              backgroundImage: current.backgroundImage || undefined,
              backgroundVideo: current.backgroundVideo || undefined,
              backgroundBlur: current.backgroundBlur,
              backgroundImagePosition: current.backgroundImagePosition,
            },
          },
        } as any)
        .catch(err => console.log('Silent theme sync failed:', err));
    }, 1500);
  },

  setPreset: (preset: ThemePreset) => {
    storage.setString('themePreset', preset);
    const { mode } = get();
    set({
      preset,
      theme: resolveTheme(mode, preset),
    });

    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      const current = get();
      authApi
        .updateProfile({
          preferences: {
            appearance: {
              themePreset: current.preset,
              backgroundType: current.backgroundType,
              backgroundColor: current.backgroundColor || undefined,
              backgroundImage: current.backgroundImage || undefined,
              backgroundVideo: current.backgroundVideo || undefined,
              backgroundBlur: current.backgroundBlur,
              backgroundImagePosition: current.backgroundImagePosition,
            },
          },
        } as any)
        .catch(err => console.log('Silent theme preset sync failed:', err));
    }, 1500);
  },

  toggleTheme: () => {
    const { mode } = get();
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    get().setMode(next);
  },

  syncWithSystem: () => {
    get().setMode('system');
  },

  cyclePreset: () => {
    const { preset } = get();
    const idx = PRESETS.indexOf(preset);
    const next = PRESETS[(idx + 1) % PRESETS.length] || 'light';
    get().setPreset(next);
  },

  setBackgroundType: (type: BackgroundType) => {
    storage.setString('backgroundType', type);
    set({ backgroundType: type });
  },

  setBackgroundColor: (color: string | null) => {
    if (color) storage.setString('backgroundColor', color);
    else storage.delete('backgroundColor');
    set({ backgroundColor: color });
  },

  setBackgroundImage: (image: string | null) => {
    if (image) storage.setString('backgroundImage', image);
    else storage.delete('backgroundImage');
    set({ backgroundImage: image });
  },

  setBackgroundVideo: (video: string | null) => {
    if (video) storage.setString('backgroundVideo', video);
    else storage.delete('backgroundVideo');
    set({ backgroundVideo: video });
  },

  setBackgroundBlur: (blur: number) => {
    storage.setNumber('backgroundBlur', blur);
    set({ backgroundBlur: blur });
  },

  setBackgroundImagePosition: (position: ImagePosition) => {
    storage.setString('backgroundImagePosition', JSON.stringify(position));
    set({ backgroundImagePosition: position });
  },

  hydrateFromBackend: (appearance?: any, themeMode?: ThemeMode) => {
    let changed = false;
    const updates: Partial<ThemeStore> = {};

    if (themeMode && ['light', 'dark', 'system'].includes(themeMode)) {
      updates.mode = themeMode;
      storage.setString('themeMode', themeMode);
      changed = true;
    }

    if (appearance) {
      if (appearance.themePreset && PRESETS.includes(appearance.themePreset)) {
        updates.preset = appearance.themePreset;
        storage.setString('themePreset', appearance.themePreset);
        changed = true;
      }
      if (appearance.backgroundType) {
        updates.backgroundType = appearance.backgroundType;
        storage.setString('backgroundType', appearance.backgroundType);
        changed = true;
      }
      if (appearance.backgroundColor !== undefined) {
        updates.backgroundColor = appearance.backgroundColor;
        if (appearance.backgroundColor)
          storage.setString('backgroundColor', appearance.backgroundColor);
        else storage.delete('backgroundColor');
        changed = true;
      }
      if (appearance.backgroundImage !== undefined) {
        updates.backgroundImage = appearance.backgroundImage;
        if (appearance.backgroundImage)
          storage.setString('backgroundImage', appearance.backgroundImage);
        else storage.delete('backgroundImage');
        changed = true;
      }
      if (appearance.backgroundVideo !== undefined) {
        updates.backgroundVideo = appearance.backgroundVideo;
        if (appearance.backgroundVideo)
          storage.setString('backgroundVideo', appearance.backgroundVideo);
        else storage.delete('backgroundVideo');
        changed = true;
      }
      if (typeof appearance.backgroundBlur === 'number') {
        updates.backgroundBlur = appearance.backgroundBlur;
        storage.setNumber('backgroundBlur', appearance.backgroundBlur);
        changed = true;
      }
      if (appearance.backgroundImagePosition) {
        updates.backgroundImagePosition = appearance.backgroundImagePosition;
        storage.setString(
          'backgroundImagePosition',
          JSON.stringify(appearance.backgroundImagePosition),
        );
        changed = true;
      }
    }

    if (changed) {
      const finalMode = updates.mode || get().mode;
      const finalPreset = updates.preset || get().preset;
      set({
        ...updates,
        isDark: resolveIsDark(finalMode),
        theme: resolveTheme(finalMode, finalPreset),
      });
    }
  },
}));

export default useThemeStore;
