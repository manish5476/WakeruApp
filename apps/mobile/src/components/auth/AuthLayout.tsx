import AppLogo from '../common/AppLogo';
import AppIcon from '../common/AppIcon';
// components/auth/AuthLayout.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { theme } from '../../theme';

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
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width > 768;

  if (isWide) {
    return (
      <View
        style={[
          styles.webContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {/* Left Pane */}
        <View style={styles.leftPane}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.leftContent}>
            <View style={styles.brandContainer}>
              <View
                style={[
                  styles.logoWrap,
                  { backgroundColor: theme.colors.overlayLight },
                ]}
              >
                <AppLogo />
              </View>
              <Text style={styles.brandName}>WAKERU</Text>
            </View>
            <View style={styles.marketingContainer}>
              <Text style={styles.marketingSubtitle}>You can easily</Text>
              <Text style={styles.marketingTitle}>
                Manage your shared expenses for clarity and productivity.
              </Text>
              <View style={styles.marketingFeatures}>
                <View style={styles.featureRow}>
                  <AppIcon
                    name="check-circle"
                    size={16}
                    color={theme.colors.overlayLight}
                  />
                  <Text style={styles.featureText}>
                    Split expenses with friends
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <AppIcon
                    name="check-circle"
                    size={16}
                    color={theme.colors.overlayLight}
                  />
                  <Text style={styles.featureText}>
                    Track trips and settlements
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <AppIcon
                    name="check-circle"
                    size={16}
                    color={theme.colors.overlayLight}
                  />
                  <Text style={styles.featureText}>Multi-currency support</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Right Pane */}
        <View
          style={[
            styles.rightPane,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.rightScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <GlassCard
              style={styles.formContainer}
              intensity={theme.isDark ? 12 : 6}
            >
              <View style={styles.formHeader}>
                <View
                  style={[
                    styles.formIconWrap,
                    { backgroundColor: theme.colors.primaryBg },
                  ]}
                >
                  <AppIcon name="user" size={20} color={theme.colors.primary} />
                </View>
                <Text
                  style={[styles.webTitle, { color: theme.colors.textPrimary }]}
                >
                  {title}
                </Text>
                {subtitle && (
                  <Text
                    style={[
                      styles.webSubtitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>
              <View style={styles.childrenContainer}>{children}</View>
            </GlassCard>
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobileContainer}>
      {/* Background Image or Gradient covering the whole screen */}
      <View style={StyleSheet.absoluteFill}>
        {backgroundImageUrl ? (
          <>
            <Image
              source={{ uri: backgroundImageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient
              colors={[
                'transparent',
                theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
              ]}
              style={StyleSheet.absoluteFill}
            />
          </>
        ) : (
          <LinearGradient
            colors={theme.gradients.primary}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
      </View>

      <KeyboardAvoidingView
        style={StyleSheet.absoluteFill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              { marginBottom: insets.bottom > 0 ? insets.bottom : 24 },
            ]}
          >
            {/* Mobile Header */}
            <View style={styles.mobileHeader}>
              <View style={styles.mobileLogoWrap}>
                <LinearGradient
                  colors={theme.gradients.secondary}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <AppLogo />
              </View>
              <View>
                <Text
                  style={[
                    styles.mobileTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {title}
                </Text>
                {subtitle && (
                  <Text
                    style={[
                      styles.mobileSubtitle,
                      { color: theme.colors.textSecondary },
                    ]}
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
  // --- WEB STYLES ---
  webContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    flex: 1,
    borderTopRightRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    margin: 24,
  },
  leftContent: {
    flex: 1,
    padding: 48,
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: 2,
  },
  marketingContainer: {
    maxWidth: 400,
    gap: 12,
  },
  marketingSubtitle: {
    fontSize: 14,
    color: theme.colors.overlayLight,
    fontWeight: '500',
  },
  marketingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    lineHeight: 44,
  },
  marketingFeatures: {
    gap: 8,
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.overlayLight,
    fontWeight: '500',
  },
  rightPane: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.overlayLight,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  webTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  webSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  childrenContainer: {
    width: '100%',
  },

  // --- MOBILE STYLES ---
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
    borderColor: theme.colors.overlayLight,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  mobileLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mobileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
