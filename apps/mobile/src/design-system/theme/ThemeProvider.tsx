import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeRegistry, ThemeName } from './ThemeRegistry';
import { ThemeStorage } from './ThemeStorage';
import { ThemeTokens } from '../tokens';

interface ThemeContextValue {
  themeName: ThemeName;
  tokens: ThemeTokens;
  setTheme: (name: ThemeName) => void;
  isSystem: boolean;
  setSystemTheme: (useSystem: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
}

export const ThemeProvider = ({ children, defaultTheme = 'light' }: ThemeProviderProps) => {
  const systemColorScheme = useColorScheme();
  const [themeName, setThemeNameState] = useState<ThemeName>(defaultTheme);
  const [isSystem, setIsSystem] = useState<boolean>(true);

  useEffect(() => {
    const savedTheme = ThemeStorage.getTheme();
    if (savedTheme) {
      if (savedTheme === 'system') {
        setIsSystem(true);
        setThemeNameState(systemColorScheme || 'light');
      } else {
        setIsSystem(false);
        setThemeNameState(savedTheme);
      }
    } else {
      setIsSystem(true);
      setThemeNameState(systemColorScheme || 'light');
    }
  }, [systemColorScheme]);

  const setTheme = (name: ThemeName) => {
    setIsSystem(false);
    setThemeNameState(name);
    ThemeStorage.setTheme(name);
  };

  const setSystemTheme = (useSystem: boolean) => {
    setIsSystem(useSystem);
    if (useSystem) {
      ThemeStorage.setTheme('system');
      setThemeNameState(systemColorScheme || 'light');
    }
  };

  const tokens = ThemeRegistry.getTheme(themeName);

  return (
    <ThemeContext.Provider value={{ themeName, tokens, setTheme, isSystem, setSystemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
