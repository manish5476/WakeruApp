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

  const theme = useMemo(() => {
    // Handle custom / non-light-dark presets
    if (!['light', 'dark'].includes(preset)) {
      // Guard: if stored preset key is stale or unknown, fall through to default
      const custom = themePresets[preset as keyof typeof themePresets];
      if (custom) return custom;
    }

    // Handle explicit manual overrides
    if (mode === 'dark') return themePresets.dark;
    if (mode === 'light') return themePresets.light;

    // Default to system preference
    return systemScheme === 'dark' ? themePresets.dark : themePresets.light;
  }, [mode, preset, systemScheme]);

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
