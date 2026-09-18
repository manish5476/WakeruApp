import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../stores/theme.store';
import { lightTheme, Theme } from '../theme';
import { themePresets } from '../theme/presets';

// Initialize context with the lightTheme as the default fallback
const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeStore(s => s.mode);
  const preset = useThemeStore(s => s.preset);
  const fontColor = useThemeStore(s => s.fontColor);

  const theme = useMemo(() => {
    let base: Theme;
    if (!['light', 'dark'].includes(preset)) {
      const custom = themePresets[preset as keyof typeof themePresets];
      base =
        custom ||
        (systemScheme === 'dark' ? themePresets.dark : themePresets.light);
    } else if (mode === 'dark') {
      base = themePresets.dark;
    } else if (mode === 'light') {
      base = themePresets.light;
    } else {
      base = systemScheme === 'dark' ? themePresets.dark : themePresets.light;
    }

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
  }, [mode, preset, systemScheme, fontColor]);

  // Sync active theme back to Zustand store so it can be accessed outside of React components
  useEffect(() => {
    useThemeStore.setState({ theme });
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

// Custom hook for easy access to the v2.2 theme tokens
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
