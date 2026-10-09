import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  type PropsWithChildren,
} from 'react';
import {
  useColorScheme,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { lightTheme, darkTheme, fontFamilies, type FontPreset, type Theme } from './theme';
import { themePresets } from './theme/presets';

export { lightTheme, darkTheme, Theme, themePresets };
export type ThemeMode = 'light' | 'dark' | 'amoled' | 'system';

// We export the exact Expo theme.
const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({
  children,
  mode = 'system',
  preset = 'light',
  fontColor,
  fontPreset = 'system',
}: PropsWithChildren<{
  mode?: ThemeMode;
  preset?: string;
  fontColor?: string;
  fontPreset?: FontPreset;
}>) {
  const systemScheme = useColorScheme();

  const theme = useMemo(() => {
    let base: Theme;

    // Custom presets (e.g., from Expo's themePresets)
    if (preset && !['light', 'dark'].includes(preset) && preset in themePresets) {
      base = themePresets[preset as keyof typeof themePresets];
    } else if (mode === 'dark' || mode === 'amoled') {
      base = themePresets.dark || darkTheme;
    } else if (mode === 'light') {
      base = themePresets.light || lightTheme;
    } else {
      base =
        systemScheme === 'dark' ? themePresets.dark || darkTheme : themePresets.light || lightTheme;
    }

    const selectedFont = fontFamilies[fontPreset] ?? fontFamilies.system;
    // CSS font stacks are not valid React Native family names. Resolve a
    // concrete native family whenever a preset has no bundled native font.
    const nativeSans =
      selectedFont.nativeSans ??
      Platform.select({
        ios: 'System',
        android: 'sans-serif',
        default: selectedFont.sans,
      })!;
    const nativeMono =
      selectedFont.nativeMono ??
      Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: selectedFont.mono,
      })!;

    return {
      ...base,
      typography: {
        ...base.typography,
        fontFamily: {
          ...base.typography.fontFamily,
          sans: nativeSans,
          mono: nativeMono,
          display: nativeSans,
        },
      },
      ...(fontColor
        ? {
            colors: {
              ...base.colors,
              fontColor,
              textPrimary: fontColor,
            },
          }
        : {}),
    };
  }, [mode, preset, systemScheme, fontColor, fontPreset]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

// ============================================================================
// Legacy Components mapped to Expo Theme Tokens to prevent breakage in older screens
// ============================================================================

export function AppBackground({ children }: PropsWithChildren) {
  const theme = useTheme();
  return <View style={[{ flex: 1, backgroundColor: theme.colors.background }]}>{children}</View>;
}

export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  // using Expo's spacing token
  return (
    <View style={[{ flex: 1, padding: theme.spacing[4], gap: theme.spacing[3] }, style]}>
      {children}
    </View>
  );
}

export function AppText({
  children,
  variant = 'body',
  style,
}: PropsWithChildren<{
  variant?: 'display' | 'title' | 'body' | 'label' | 'caption';
  style?: StyleProp<TextStyle>;
}>) {
  const theme = useTheme();
  // Map old typography variant to Expo typography if possible
  const getFontSize = () => {
    switch (variant as string) {
      case 'display':
        return theme.typography.fontSize['4xl'];
      case 'title':
        return theme.typography.fontSize.xl;
      case 'label':
        return theme.typography.fontSize.sm;
      case 'caption':
        return theme.typography.fontSize.xs;
      default:
        return theme.typography.fontSize.base;
    }
  };
  const textStyle = {
    fontSize: getFontSize(),
    fontFamily: theme.typography.fontFamily.sans,
  } as TextStyle;
  return <Text style={[textStyle, { color: theme.colors.textPrimary }, style]}>{children}</Text>;
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
        { alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingHorizontal: 20 },
        {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.borderRadius.md,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
        },
      ]}
    >
      <Text
        style={[
          {
            fontSize: theme.typography.fontSize.sm,
            fontFamily: theme.typography.fontFamily.sans,
            fontWeight: '600',
          },
          { color: theme.colors.textInverse },
        ]}
      >
        {children}
      </Text>
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
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing[4],
          backgroundColor: glass
            ? theme.glass.background
            : elevated
              ? theme.colors.elevated
              : theme.colors.surface,
          borderColor: glass ? theme.glass.borderTopColor : theme.colors.border,
          borderWidth: 1,
        },
        elevated && !glass && theme.shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}
