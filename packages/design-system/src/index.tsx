import React, { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'amoled';
export type BrandId = 'tripsplit';

export type Theme = Readonly<{
  color: Readonly<{
    background: string;
    backgroundAccent: string;
    onPrimary: string;
    primary: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    border: string;
    danger: string;
  }>;
  radius: Readonly<{ sm: number; md: number; lg: number; pill: number }>;
  space: Readonly<{ xs: number; sm: number; md: number; lg: number; xl: number; xxl: number }>;
  typography: Readonly<{
    display: TextStyle;
    title: TextStyle;
    body: TextStyle;
    label: TextStyle;
    caption: TextStyle;
  }>;
  elevation: Readonly<{
    sm: ViewStyle;
    md: ViewStyle;
    lg: ViewStyle;
  }>;
  glass: Readonly<{
    background: string;
    border: string;
  }>;
  animation: Readonly<{
    fast: number;
    normal: number;
    slow: number;
  }>;
}>;

const shared = {
  radius: { sm: 8, md: 14, lg: 22, pill: 999 },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  typography: {
    display: { fontSize: 32, fontWeight: '700', lineHeight: 40 } as TextStyle,
    title: { fontSize: 22, fontWeight: '700', lineHeight: 28 } as TextStyle,
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 } as TextStyle,
    label: { fontSize: 14, fontWeight: '600', lineHeight: 20 } as TextStyle,
    caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 } as TextStyle,
  },
  elevation: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 },
  },
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  }
} as const;

const themes: Record<ThemeMode, Theme> = {
  light: {
    ...shared,
    color: {
      background: '#F8FAFC',
      backgroundAccent: '#E0E7FF',
      border: '#E2E8F0',
      danger: '#C2410C',
      onPrimary: '#FFFFFF',
      primary: '#4F46E5',
      surface: '#FFFFFF',
      surfaceElevated: '#F1F5F9',
      text: '#0F172A',
      textMuted: '#475569',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      border: 'rgba(255, 255, 255, 0.4)',
    },
  },
  dark: {
    ...shared,
    color: {
      background: '#0F172A',
      backgroundAccent: '#1E1B4B',
      border: '#334155',
      danger: '#FB923C',
      onPrimary: '#FFFFFF',
      primary: '#818CF8',
      surface: '#172033',
      surfaceElevated: '#1E293B',
      text: '#F8FAFC',
      textMuted: '#CBD5E1',
    },
    glass: {
      background: 'rgba(15, 23, 42, 0.6)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  },
  amoled: {
    ...shared,
    color: {
      background: '#000000',
      backgroundAccent: '#170C38',
      border: '#262626',
      danger: '#FB923C',
      onPrimary: '#FFFFFF',
      primary: '#A78BFA',
      surface: '#0A0A0A',
      surfaceElevated: '#171717',
      text: '#FAFAFA',
      textMuted: '#D4D4D4',
    },
    glass: {
      background: 'rgba(0, 0, 0, 0.7)',
      border: 'rgba(255, 255, 255, 0.05)',
    },
  },
};

const ThemeContext = createContext<Theme>(themes.dark);

export function ThemeProvider({
  children,
  mode = 'dark',
}: PropsWithChildren<{ mode?: ThemeMode }>) {
  const theme = useMemo(() => themes[mode], [mode]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function AppBackground({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <View style={[styles.background, { backgroundColor: theme.color.background }]}>{children}</View>
  );
}

export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  return <View style={[styles.screen, { padding: theme.space.lg }, style]}>{children}</View>;
}

export function AppText({
  children,
  variant = 'body',
  style,
}: PropsWithChildren<{
  variant?: keyof Theme['typography'];
  style?: StyleProp<TextStyle>;
}>) {
  const theme = useTheme();
  return (
    <Text style={[theme.typography[variant], { color: theme.color.text }, style]}>{children}</Text>
  );
}

export function PrimaryButton({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
}: PropsWithChildren<{
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
}>) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.color.primary,
          borderRadius: theme.radius.md,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
        },
      ]}
    >
      <Text style={[theme.typography.label, { color: theme.color.onPrimary }]}>{children}</Text>
    </Pressable>
  );
}

export function Card({
  children,
  style,
  elevated = false,
  glass = false,
}: PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  glass?: boolean;
}>) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: theme.radius.md,
          padding: theme.space.md,
          backgroundColor: glass
            ? theme.glass.background
            : elevated
              ? theme.color.surfaceElevated
              : theme.color.surface,
          borderColor: glass ? theme.glass.border : theme.color.border,
          borderWidth: 1,
        },
        elevated && !glass && theme.elevation.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  button: { alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingHorizontal: 20 },
  screen: { flex: 1, gap: 16 },
});
