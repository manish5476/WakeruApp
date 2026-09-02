/**
 * Theme Provider Component
 * Wraps the app and provides theme context to all children
 */

import React, { useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeContext,
  ThemeContextType,
  AVAILABLE_THEMES,
} from './ThemeContext';
import {
  LIGHT_THEME,
  DARK_THEME,
  AMOLED_THEME,
  GLASS_LIGHT_THEME,
  GLASS_DARK_THEME,
  OCEAN_THEME,
  ThemeName,
  SemanticColors,
} from '../tokens/colors';

const THEME_STORAGE_KEY = '@tripsplit_theme';
const DEFAULT_THEME: ThemeName = 'light';

const getThemeColors = (themeName: ThemeName): SemanticColors => {
  switch (themeName) {
    case 'light':
      return LIGHT_THEME;
    case 'dark':
      return DARK_THEME;
    case 'amoled':
      return AMOLED_THEME;
    case 'glass-light':
      return GLASS_LIGHT_THEME;
    case 'glass-dark':
      return GLASS_DARK_THEME;
    case 'ocean':
      return OCEAN_THEME;
    default:
      return LIGHT_THEME;
  }
};

const isDarkTheme = (theme: ThemeName): boolean => {
  return ['dark', 'amoled', 'glass-dark', 'ocean'].includes(theme);
};

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeName;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = DEFAULT_THEME,
}) => {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && AVAILABLE_THEMES.includes(savedTheme as ThemeName)) {
          setThemeState(savedTheme as ThemeName);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeName): Promise<void> => {
    if (!AVAILABLE_THEMES.includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}`);
      return;
    }

    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const colors = getThemeColors(theme);

  const contextValue: ThemeContextType = {
    theme,
    colors,
    isDark: isDarkTheme(theme),
    setTheme,
    availableThemes: AVAILABLE_THEMES,
  };

  if (isLoading) {
    // Return a minimal loading view
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
