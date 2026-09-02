/**
 * Theme Context
 * Manages theme state and switching across the application
 */

import { createContext } from 'react';
import { SemanticColors, ThemeName } from '../tokens/colors';

export interface ThemeContextType {
  theme: ThemeName;
  colors: SemanticColors;
  isDark: boolean;
  setTheme: (theme: ThemeName) => Promise<void>;
  availableThemes: ThemeName[];
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export const AVAILABLE_THEMES: ThemeName[] = [
  'light',
  'dark',
  'amoled',
  'glass-light',
  'glass-dark',
  'ocean',
];
