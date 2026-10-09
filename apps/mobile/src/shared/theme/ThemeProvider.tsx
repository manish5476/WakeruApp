import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';
import { type AppTheme, darkTheme, lightTheme } from './index';

import { useTheme as useDesignSystemTheme } from '@tripsplit/design-system';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: 'light',
  setMode: () => undefined,
});

export function AppThemeProvider({
  children,
  initialMode = 'light',
}: PropsWithChildren<{ initialMode?: ThemeMode }>) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const theme = useMemo<AppTheme>(() => {
    if (mode === 'system') {
      return systemScheme === 'dark' ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  }, [mode, systemScheme]);

  const handleSetMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, mode, setMode: handleSetMode }),
    [theme, mode, handleSetMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Hook for accessing the full TripSplit app theme. */
export function useAppTheme(): AppTheme {
  try {
    const dsTheme = useDesignSystemTheme();
    if (dsTheme && dsTheme.colors) {
      return dsTheme as unknown as AppTheme;
    }
  } catch {
    // fallback
  }
  return useContext(ThemeContext).theme;
}

export function useThemeMode(): {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
} {
  const ctx = useContext(ThemeContext);
  return { mode: ctx.mode, setMode: ctx.setMode };
}

// Re-export as `useTheme` for compatibility with Expo source patterns
export { useAppTheme as useTheme };
