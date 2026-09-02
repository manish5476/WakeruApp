/**
 * useTheme Hook
 * Provides access to the current theme and theme switching functionality
 */

import { useContext } from 'react';
import { ThemeContext, ThemeContextType } from '../theme/ThemeContext';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default useTheme;
