// src/components/common/SafeAreaWrapper.tsx
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  ViewStyle,
  ScrollView,
  KeyboardAvoidingView,
  RefreshControlProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  statusBarStyle?: 'light-content' | 'dark-content';
  gradient?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  gradientAngle?: number;
  style?: ViewStyle;
  ambientGlow?: boolean;
}

export function SafeAreaWrapper({
  children,
  backgroundColor,
  edges = ['top', 'bottom', 'left', 'right'],
  statusBarStyle,
  gradient = false,
  gradientColors,
  gradientAngle = 135,
  style,
  ambientGlow = false,
}: SafeAreaWrapperProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const bgColor = useMemo(() => {
    if (gradient) return 'transparent';
    return backgroundColor || 'transparent';
  }, [gradient, backgroundColor]);

  const barStyle = useMemo(() => {
    if (statusBarStyle) return statusBarStyle;
    return theme.isDark ? 'light-content' : 'dark-content';
  }, [statusBarStyle, theme.isDark]);

  const defaultGradientColors = useMemo(() => {
    if (gradientColors) return gradientColors;
    return theme.isDark
      ? (['rgba(30, 30, 34, 0.95)', 'rgba(18, 18, 20, 0.98)'] as const)
      : (['rgba(250, 250, 250, 0.95)', 'rgba(240, 240, 243, 0.98)'] as const);
  }, [theme.isDark, gradientColors]);

  const paddingStyle = useMemo(
    () => ({
      paddingTop: edges.includes('top') ? insets.top : 0,
      paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
      paddingLeft: edges.includes('left') ? insets.left : 0,
      paddingRight: edges.includes('right') ? insets.right : 0,
    }),
    [edges, insets],
  );

  const glowStyle = useMemo(() => {
    if (!ambientGlow) return null;
    return {
      position: 'absolute' as const,
      top: -100,
      left: -100,
      right: -100,
      bottom: -100,
      opacity: 0.3,
      borderRadius: 200,
      background: theme.isDark
        ? 'radial-gradient(circle at 50% 0%, rgba(74, 111, 165, 0.15) 0%, transparent 70%)'
        : 'radial-gradient(circle at 50% 0%, rgba(212, 166, 46, 0.08) 0%, transparent 70%)',
    };
  }, [ambientGlow, theme.isDark]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      <StatusBar
        barStyle={barStyle}
        backgroundColor="transparent"
        translucent
        animated
      />

      {gradient && (
        <LinearGradient
          colors={defaultGradientColors}
          start={{ x: gradientAngle === 135 ? 0 : 0, y: 0 }}
          end={{ x: gradientAngle === 135 ? 1 : 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {ambientGlow && <View style={glowStyle} pointerEvents="none" />}

      {!gradient && !backgroundColor && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: theme.isDark ? 0.02 : 0.01,
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
              pointerEvents: 'none',
            },
          ]}
        />
      )}

      <View style={[styles.content, paddingStyle]}>{children}</View>
    </View>
  );
}

// --- Helper Components ---

interface SafeAreaScrollWrapperProps extends Omit<
  SafeAreaWrapperProps,
  'scrollable'
> {
  contentContainerStyle?: ViewStyle;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export function SafeAreaScrollWrapper({
  children,
  contentContainerStyle,
  refreshControl,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  ...props
}: SafeAreaScrollWrapperProps) {
  return (
    <SafeAreaWrapper {...props}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        bounces
        alwaysBounceVertical
      >
        {children}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

interface SafeAreaKeyboardWrapperProps extends SafeAreaWrapperProps {
  keyboardVerticalOffset?: number;
  behavior?: 'height' | 'position' | 'padding';
}

export function SafeAreaKeyboardWrapper({
  children,
  keyboardVerticalOffset,
  behavior = Platform.OS === 'ios' ? 'padding' : 'height',
  ...props
}: SafeAreaKeyboardWrapperProps) {
  return (
    <SafeAreaWrapper {...props}>
      <KeyboardAvoidingView
        behavior={behavior}
        style={styles.flex}
        keyboardVerticalOffset={
          keyboardVerticalOffset || (Platform.OS === 'ios' ? 0 : 20)
        }
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
