import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import { GlassCard } from './GlassCard';
import AppLogo from './AppLogo';

let LinearGradientComponent: React.ComponentType<any> | null = null;
try {
  LinearGradientComponent = require('react-native-linear-gradient').default;
} catch {
  LinearGradientComponent = null;
}

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backgroundImageUrl?: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  backgroundImageUrl,
}: AuthLayoutProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.mobileContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Background Image or Gradient covering the whole screen */}
      <View style={StyleSheet.absoluteFill}>
        {backgroundImageUrl ? (
          <>
            <Image
              source={{ uri: backgroundImageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            {LinearGradientComponent ? (
              <LinearGradientComponent
                colors={[
                  'transparent',
                  theme.isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.45)',
                ]}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(0,0,0,0.4)'
                      : 'rgba(255,255,255,0.3)',
                  },
                ]}
              />
            )}
          </>
        ) : LinearGradientComponent ? (
          <LinearGradientComponent
            colors={theme.gradients.primary}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.colors.background },
            ]}
          />
        )}
      </View>

      <KeyboardAvoidingView
        style={StyleSheet.absoluteFill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.mobileScrollContent,
            {
              paddingTop: insets.top + theme.spacing['4xl'],
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard
            intensity={theme.isDark ? 20 : 40}
            style={[
              styles.mobileFloatingCard,
              { marginBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 },
            ]}
          >
            {/* Mobile Header */}
            <View style={styles.mobileHeader}>
              <View style={styles.mobileLogoWrap}>
                {LinearGradientComponent ? (
                  <LinearGradientComponent
                    colors={theme.gradients.secondary}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                ) : null}
                <AppLogo size={36} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.mobileTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {subtitle && (
                  <Text
                    style={[
                      styles.mobileSubtitle,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.mobileChildrenContainer}>{children}</View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  mobileScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  mobileFloatingCard: {
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    borderWidth: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  mobileLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mobileTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  mobileSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  mobileChildrenContainer: {
    width: '100%',
  },
});
