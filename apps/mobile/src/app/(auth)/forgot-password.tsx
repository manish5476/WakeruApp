// app/(auth)/forgot-password.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  useWindowDimensions,
  PressableStateCallbackType,
  Image,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { router, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInLeft,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth.store';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { GlassCard } from '../../components/ui/GlassCard';
import GlobalLoader from '../../components/common/GlobalLoader';
import AppIcon from '../../components/common/AppIcon';
import AppLogo from '../../components/common/AppLogo';
import { Typography } from '../../components/ui/Typography';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FULL_BG_IMAGE = {
  uri: 'https://images.pexels.com/photos/24235314/pexels-photo-24235314.jpeg',
};

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { forgotPassword, error, clearError } = useAuthStore();

  const isDesktop = width >= 960;
  const actionButtonScale = useSharedValue(1);

  useEffect(() => {
    clearError();
  }, []);

  const handleReset = async () => {
    haptics.medium();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToast.warning('Email Required', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showToast.warning('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(trimmedEmail);
      showToast.success(
        'Reset Email Sent',
        'Check your inbox for password reset instructions.',
      );
      setIsSuccess(true);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    haptics.light();
    router.replace('/(auth)/login');
  };

  const renderDesktopHero = () => {
    if (!isDesktop) return null;
    return (
      <Animated.View
        entering={FadeInLeft.duration(600).springify()}
        style={styles.heroLeftSection}
      >
        {/* Brand Badge */}
        <View style={styles.heroBrandRow}>
          <View style={styles.heroLogoWrap}>
            <AppLogo size={36} />
          </View>
          <Text style={styles.heroBrandTitle}>TRIPSPLIT</Text>
          <View style={styles.heroProBadge}>
            <Text style={styles.heroProBadgeText}>ACCOUNT</Text>
          </View>
        </View>

        {/* Hero Title & Subtitle */}
        <View style={styles.heroHeadingBlock}>
          <Text style={styles.heroHeadlineGradient}>Quick Recovery.</Text>
          <Text style={styles.heroHeadlineWhite}>Back on Track.</Text>
          <Text style={styles.heroSubheadline}>
            Don't worry, it happens to the best of us. Reset your credentials
            securely and jump right back into your active trip expenses.
          </Text>
        </View>

        {/* 3 Glass Bento Feature Badges */}
        <View style={styles.heroFeatureGrid}>
          {[
            {
              icon: 'lock' as const,
              title: 'Encrypted Security',
              desc: 'Protected reset links sent directly to your verified address.',
            },
            {
              icon: 'clock' as const,
              title: 'Fast 1-Min Reset',
              desc: 'Restore full access to your split accounts immediately.',
            },
            {
              icon: 'shield' as const,
              title: 'Data Safe & Sound',
              desc: 'All your past and present group trip ledger data stays safe.',
            },
          ].map((feature, i) => (
            <View key={i} style={styles.heroFeatureCard}>
              <View style={styles.heroFeatureIconWrap}>
                <AppIcon name={feature.icon} size={18} color="#60A5FA" />
              </View>
              <View style={styles.heroFeatureTextWrap}>
                <Text style={styles.heroFeatureTitle}>{feature.title}</Text>
                <Text style={styles.heroFeatureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.fullCanvas, { height }]}>
      {/* ── 1. Full-Bleed Cover Background Image ── */}
      <Image
        source={FULL_BG_IMAGE}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* ── 2. Cinematic Dark Ambient Scrim & Vignette ── */}
      <LinearGradient
        colors={[
          'rgba(15, 23, 42, 0.70)',
          'rgba(15, 23, 42, 0.82)',
          'rgba(10, 15, 30, 0.92)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── 3. Responsive 2-Column Bento / Centered Viewport ── */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            isDesktop
              ? styles.scrollContainerDesktop
              : styles.scrollContainerMobile,
            {
              paddingTop: Math.max(insets.top + 20, isDesktop ? 48 : 28),
              paddingBottom: Math.max(insets.bottom + 20, isDesktop ? 48 : 28),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
        >
          <View
            style={[
              styles.layoutWrapper,
              isDesktop && styles.layoutWrapperDesktop,
            ]}
          >
            {/* Desktop Hero Left Column */}
            {renderDesktopHero()}

            {/* Floating Frosted Glass Modal */}
            <GlassCard
              variant="prominent"
              padding="none"
              intensity={theme.isDark ? 65 : 90}
              style={styles.floatingModal}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                {!isDesktop && (
                  <View style={styles.brandRow}>
                    <View
                      style={[
                        styles.brandIconWrap,
                        {
                          backgroundColor: theme.isDark
                            ? 'rgba(255,255,255,0.08)'
                            : '#EFF6FF',
                        },
                      ]}
                    >
                      <AppLogo size={34} />
                    </View>
                    <View>
                      <View style={styles.brandTitleRow}>
                        <Text
                          style={[
                            styles.brandTitleText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          TRIPSPLIT
                        </Text>
                        <View style={styles.brandBadge}>
                          <Text style={styles.brandBadgeText}>RECOVERY</Text>
                        </View>
                      </View>
                      <Text style={styles.brandTagline}>
                        TRAVEL TOGETHER · SPLIT SMARTER
                      </Text>
                    </View>
                  </View>
                )}

                <Typography
                  variant="h2"
                  weight="black"
                  color="textPrimary"
                  style={styles.welcomeHeading}
                >
                  {isSuccess ? 'Check your email' : 'Reset password'}
                </Typography>
                <Typography
                  variant="bodySm"
                  color="textSecondary"
                  style={styles.welcomeSubtext}
                >
                  {isSuccess
                    ? `We've dispatched recovery instructions to your inbox.`
                    : `Enter your account's email and we'll send a password recovery link.`}
                </Typography>
              </View>

              {/* Error Banner */}
              {error ? (
                <Animated.View
                  entering={FadeInDown.duration(400).springify()}
                  style={[
                    styles.errorBox,
                    {
                      backgroundColor: theme.colors.dangerBg,
                      borderColor: theme.colors.danger + '35',
                    },
                  ]}
                >
                  <AppIcon
                    name="alert-circle"
                    size={16}
                    color={theme.colors.danger}
                  />
                  <Text
                    style={[styles.errorMsg, { color: theme.colors.danger }]}
                  >
                    {error}
                  </Text>
                  <Pressable
                    onPress={clearError}
                    style={({ hovered }: WebPressableState) => [
                      hovered && Platform.OS === 'web' && { opacity: 0.7 },
                    ]}
                  >
                    <AppIcon name="x" size={16} color={theme.colors.danger} />
                  </Pressable>
                </Animated.View>
              ) : null}

              {/* Content */}
              {isSuccess ? (
                <View style={styles.successWrapper}>
                  <View style={styles.successIconCircle}>
                    <AppIcon name="check" size={32} color="#10B981" />
                  </View>
                  <Text
                    style={[
                      styles.successEmailText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {email}
                  </Text>
                  <Typography
                    variant="bodySm"
                    color="textSecondary"
                    style={styles.successInstructions}
                  >
                    Please check your spam or promotion folders if you do not
                    see the email within a couple of minutes.
                  </Typography>

                  <AnimatedPressable
                    onPress={handleBackToLogin}
                    onPressIn={() =>
                      (actionButtonScale.value = withSpring(0.97))
                    }
                    onPressOut={() => (actionButtonScale.value = withSpring(1))}
                    style={[
                      styles.primaryBtnWrap,
                      {
                        transform: [{ scale: actionButtonScale }],
                        marginTop: 16,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#2563EB', '#1D4ED8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtnGradient}
                    >
                      <AppIcon name="log-in" size={18} color="#FFF" />
                      <Text style={styles.primaryBtnText}>Back to Log In</Text>
                    </LinearGradient>
                  </AnimatedPressable>
                </View>
              ) : (
                <View style={styles.formContent}>
                  {/* Email Field */}
                  <Animated.View
                    entering={FadeInDown.delay(100).duration(450).springify()}
                    style={styles.inputGroup}
                  >
                    <Typography
                      variant="caption"
                      weight="extrabold"
                      color="textSecondary"
                      style={styles.inputLabel}
                    >
                      EMAIL ADDRESS
                    </Typography>
                    <View
                      style={[
                        styles.inputFieldBox,
                        {
                          borderColor: isEmailFocused
                            ? theme.colors.primary
                            : theme.isDark
                              ? 'rgba(255,255,255,0.14)'
                              : '#E2E8F0',
                          backgroundColor: theme.isDark
                            ? 'rgba(15, 23, 42, 0.7)'
                            : '#FFFFFF',
                        },
                        isEmailFocused && styles.inputFieldBoxFocused,
                      ]}
                    >
                      <AppIcon
                        name="mail"
                        size={18}
                        color={
                          isEmailFocused
                            ? theme.colors.primary
                            : theme.colors.textTertiary
                        }
                        style={styles.fieldIcon}
                      />
                      <TextInput
                        placeholder="name@company.com"
                        placeholderTextColor={theme.colors.textTertiary}
                        value={email}
                        onChangeText={t => {
                          setEmail(t);
                          clearError();
                        }}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={[
                          styles.textInput,
                          { color: theme.colors.textPrimary },
                          Platform.OS === 'web'
                            ? ({ outlineStyle: 'none' } as any)
                            : null,
                        ]}
                      />
                    </View>
                  </Animated.View>

                  {/* Submit Button */}
                  <Animated.View
                    entering={FadeInDown.delay(200).duration(450).springify()}
                  >
                    <AnimatedPressable
                      onPress={handleReset}
                      disabled={isSubmitting}
                      onPressIn={() =>
                        (actionButtonScale.value = withSpring(0.97))
                      }
                      onPressOut={() =>
                        (actionButtonScale.value = withSpring(1))
                      }
                      style={[
                        styles.primaryBtnWrap,
                        { transform: [{ scale: actionButtonScale }] },
                        isSubmitting && { opacity: 0.7 },
                      ]}
                    >
                      <LinearGradient
                        colors={['#2563EB', '#1D4ED8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryBtnGradient}
                      >
                        {isSubmitting ? (
                          <GlobalLoader variant="inline" color="#FFF" />
                        ) : (
                          <>
                            <AppIcon name="send" size={18} color="#FFF" />
                            <Text style={styles.primaryBtnText}>
                              Send Reset Link
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </AnimatedPressable>
                  </Animated.View>

                  {/* Footer Link */}
                  <Animated.View
                    entering={FadeInDown.delay(300).duration(450).springify()}
                    style={styles.footerRow}
                  >
                    <Pressable
                      onPress={handleBackToLogin}
                      style={({ hovered }: WebPressableState) => [
                        styles.backBtn,
                        Platform.OS === 'web' &&
                          hovered && { opacity: 0.7, cursor: 'pointer' },
                      ]}
                    >
                      <AppIcon
                        name="arrow-left"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Typography
                        variant="bodySm"
                        weight="extrabold"
                        color="primary"
                      >
                        Back to Log In
                      </Typography>
                    </Pressable>
                  </Animated.View>
                </View>
              )}
            </GlassCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================
const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        fullCanvas: {
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: '#0A0F1D',
        },
        keyboardAvoid: {
          flex: 1,
          width: '100%',
          height: '100%',
        },
        scrollContainer: {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        },
        scrollContainerDesktop: {
          paddingHorizontal: 40,
        },
        scrollContainerMobile: {
          paddingHorizontal: 16,
        },
        layoutWrapper: {
          width: '100%',
          maxWidth: 460,
          alignItems: 'center',
          justifyContent: 'center',
        },
        layoutWrapperDesktop: {
          maxWidth: 1040,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 60,
        },

        // --- Desktop Hero Left Section ---
        heroLeftSection: {
          flex: 1,
          maxWidth: 480,
          gap: 28,
        },
        heroBrandRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        heroLogoWrap: {
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        heroBrandTitle: {
          fontSize: 18,
          fontWeight: '900',
          letterSpacing: 2,
          color: '#FFFFFF',
        },
        heroProBadge: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: '#2563EB30',
          borderWidth: 1,
          borderColor: '#3B82F660',
        },
        heroProBadgeText: {
          fontSize: 10,
          fontWeight: '900',
          color: '#60A5FA',
          letterSpacing: 0.8,
        },
        heroHeadingBlock: {
          gap: 8,
        },
        heroHeadlineGradient: {
          fontSize: 40,
          fontWeight: '900',
          color: '#60A5FA',
          letterSpacing: -1,
          lineHeight: 46,
        },
        heroHeadlineWhite: {
          fontSize: 40,
          fontWeight: '900',
          color: '#FFFFFF',
          letterSpacing: -1,
          lineHeight: 46,
        },
        heroSubheadline: {
          fontSize: 15,
          color: '#94A3B8',
          lineHeight: 24,
          marginTop: 6,
        },
        heroFeatureGrid: {
          gap: 12,
        },
        heroFeatureCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 14,
          borderRadius: 18,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          ...(Platform.OS === 'web'
            ? ({ backdropFilter: 'blur(16px)' } as any)
            : {}),
        },
        heroFeatureIconWrap: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(96, 165, 250, 0.3)',
        },
        heroFeatureTextWrap: {
          flex: 1,
        },
        heroFeatureTitle: {
          fontSize: 14,
          fontWeight: '700',
          color: '#FFFFFF',
          marginBottom: 2,
        },
        heroFeatureDesc: {
          fontSize: 12,
          color: '#94A3B8',
          lineHeight: 16,
        },

        // --- Floating Modal ---
        floatingModal: {
          width: '100%',
          maxWidth: 440,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.18)'
            : 'rgba(255, 255, 255, 0.85)',
          backgroundColor: theme.isDark
            ? 'rgba(15, 23, 42, 0.84)'
            : 'rgba(255, 255, 255, 0.92)',
          padding: 32,
          ...Platform.select({
            web: {
              boxShadow:
                '0 30px 80px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(40px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            } as any,
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 14 },
              shadowOpacity: 0.35,
              shadowRadius: 32,
              elevation: 14,
            },
          }),
        },

        // Header
        modalHeader: {
          marginBottom: 22,
        },
        brandRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        },
        brandIconWrap: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
        },
        brandTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        brandTitleText: {
          fontSize: 16,
          fontWeight: '900',
          letterSpacing: 2,
        },
        brandBadge: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: '#2563EB20',
          borderWidth: 1,
          borderColor: '#2563EB40',
        },
        brandBadgeText: {
          fontSize: 9,
          fontWeight: '900',
          color: '#3B82F6',
          letterSpacing: 0.5,
        },
        brandTagline: {
          fontSize: 10,
          fontWeight: '700',
          color: '#64748B',
          letterSpacing: 0.8,
          marginTop: 2,
        },
        welcomeHeading: {
          letterSpacing: -0.8,
          marginBottom: 6,
        },
        welcomeSubtext: {
          lineHeight: 20,
        },

        // Error
        errorBox: {
          borderRadius: 16,
          padding: 14,
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
        },
        errorMsg: {
          fontSize: 13,
          fontWeight: '600',
          flex: 1,
        },

        // Form Fields
        formContent: {
          gap: 16,
        },
        inputGroup: {
          gap: 6,
        },
        inputLabel: {
          marginLeft: 2,
          letterSpacing: 0.8,
          fontSize: 11,
        },
        inputFieldBox: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 14,
          overflow: 'hidden',
          height: 50,
          ...(Platform.OS === 'web'
            ? ({ transition: 'all 0.2s ease' } as any)
            : {}),
        },
        inputFieldBoxFocused: {
          borderColor: theme.colors.primary,
          ...Platform.select({
            web: { boxShadow: `0 0 0 4px ${theme.colors.primary}25` } as any,
          }),
        },
        fieldIcon: {
          paddingLeft: 16,
        },
        textInput: {
          flex: 1,
          paddingHorizontal: 12,
          height: '100%',
          fontSize: 15,
          fontWeight: '500',
        },

        // Action Button
        primaryBtnWrap: {
          borderRadius: 14,
          overflow: 'hidden',
          ...Platform.select({
            web: {
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
            } as any,
            default: {
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 5,
            },
          }),
        },
        primaryBtnGradient: {
          height: 50,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        primaryBtnText: {
          color: '#FFFFFF',
          fontSize: 15,
          fontWeight: '800',
          letterSpacing: 0.5,
        },

        // Success State
        successWrapper: {
          alignItems: 'center',
          paddingVertical: 10,
        },
        successIconCircle: {
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#10B98118',
          borderWidth: 1,
          borderColor: '#10B98135',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        successEmailText: {
          fontSize: 16,
          fontWeight: '800',
          marginBottom: 8,
          textAlign: 'center',
        },
        successInstructions: {
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 8,
        },

        // Footer
        footerRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 4,
        },
        backBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 8,
        },
      }),
    [theme],
  );
};
