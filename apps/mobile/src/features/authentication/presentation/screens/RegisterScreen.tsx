// app/(auth)/register.tsx
import React, { useState, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { GuestNavigationProp } from '@/navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInLeft,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/state/auth.store';
import { useTheme } from '@tripsplit/design-system';
import { haptics } from '@/shared/utils/haptics';
import { showToast } from '@/shared/utils/toast';
import { GlassCard } from '@/shared/components/GlassCard';
import GlobalLoader from '@/shared/components/GlobalLoader';
import AppIcon from '@/shared/components/AppIcon';
import AppLogo from '@/shared/components/AppIcon';
import { Typography } from '@/shared/components/Typography';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FULL_BG_IMAGE = {
  uri: 'https://images.pexels.com/photos/24235314/pexels-photo-24235314.jpeg',
};

export default function RegisterScreen() {
  const navigation = useNavigation<GuestNavigationProp<'Register'>>();
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerWithEmail, loginWithGoogle, error, clearError } =
    useAuthStore();

  const isDesktop = width >= 960;
  const registerButtonScale = useSharedValue(1);

  const handleGoogleLogin = async () => {
    haptics.light();
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.replace('/(app)/(tabs)/dashboard');
    } catch (e: any) {
      showToast.fromError(e, 'Google Sign-In Failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    haptics.medium();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      showToast.warning('Required Fields', 'Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showToast.warning('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      showToast.warning(
        'Weak Password',
        'Password must be at least 6 characters long.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWithEmail(trimmedEmail, password, trimmedName, '');
      showToast.success(
        'Account Created!',
        'A verification link has been sent to your email.',
      );
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: trimmedEmail },
      });
    } catch (err: any) {
      showToast.error(
        'Registration Notice',
        err.message || 'Registration could not be completed.',
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <AppIcon name="plane" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.heroBrandTitle}>TRIPSPLIT</Text>
          <View style={styles.heroProBadge}>
            <Text style={styles.heroProBadgeText}>JOIN</Text>
          </View>
        </View>

        {/* Hero Title & Subtitle */}
        <View style={styles.heroHeadingBlock}>
          <Text style={styles.heroHeadlineGradient}>Start Planning.</Text>
          <Text style={styles.heroHeadlineWhite}>Split with Ease.</Text>
          <Text style={styles.heroSubheadline}>
            Join thousands of travelers splitting trip costs, organizing hotel
            bills, and staying synced across every group getaway.
          </Text>
        </View>

        {/* 3 Glass Bento Feature Badges */}
        <View style={styles.heroFeatureGrid}>
          {[
            {
              icon: 'plane' as const,
              title: 'Collaborative Trips',
              desc: 'Invite friends, track activities, and pool travel funds.',
            },
            {
              icon: 'banknote' as const,
              title: 'Fair Bill Splitting',
              desc: 'Split equal shares, percentages, or custom amounts.',
            },
            {
              icon: 'circle-check' as const,
              title: 'One-Tap Settlement',
              desc: 'Stay transparent with auto-calculated debt reduction.',
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

  const renderRegisterForm = () => (
    <View style={styles.formContent}>
      {/* Full Name */}
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
          FULL NAME
        </Typography>
        <View
          style={[
            styles.inputFieldBox,
            {
              borderColor: isNameFocused
                ? theme.colors.primary
                : theme.isDark
                  ? 'rgba(255,255,255,0.14)'
                  : '#E2E8F0',
              backgroundColor: theme.isDark
                ? 'rgba(15, 23, 42, 0.7)'
                : '#FFFFFF',
            },
            isNameFocused && styles.inputFieldBoxFocused,
          ]}
        >
          <AppIcon
            name="user"
            size={18}
            color={
              isNameFocused ? theme.colors.primary : theme.colors.textTertiary
            }
            style={styles.fieldIcon}
          />
          <TextInput
            placeholder="John Doe"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={t => {
              setName(t);
              clearError();
            }}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
            style={[
              styles.textInput,
              { color: theme.colors.textPrimary },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
            ]}
          />
        </View>
      </Animated.View>

      {/* Email Address */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(450).springify()}
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
              isEmailFocused ? theme.colors.primary : theme.colors.textTertiary
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
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
            ]}
          />
        </View>
      </Animated.View>

      {/* Password */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(450).springify()}
        style={styles.inputGroup}
      >
        <Typography
          variant="caption"
          weight="extrabold"
          color="textSecondary"
          style={styles.inputLabel}
        >
          CREATE PASSWORD
        </Typography>
        <View
          style={[
            styles.inputFieldBox,
            {
              borderColor: isPasswordFocused
                ? theme.colors.primary
                : theme.isDark
                  ? 'rgba(255,255,255,0.14)'
                  : '#E2E8F0',
              backgroundColor: theme.isDark
                ? 'rgba(15, 23, 42, 0.7)'
                : '#FFFFFF',
            },
            isPasswordFocused && styles.inputFieldBoxFocused,
          ]}
        >
          <AppIcon
            name="lock"
            size={18}
            color={
              isPasswordFocused
                ? theme.colors.primary
                : theme.colors.textTertiary
            }
            style={styles.fieldIcon}
          />
          <TextInput
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textTertiary}
            value={password}
            onChangeText={t => {
              setPassword(t);
              clearError();
            }}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
            secureTextEntry={!showPassword}
            style={[
              styles.textInput,
              { color: theme.colors.textPrimary },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
            ]}
          />
          <Pressable
            onPress={() => {
              haptics.light();
              setShowPassword(!showPassword);
            }}
            style={({ hovered }: WebPressableState) => [
              styles.eyeBtn,
              Platform.OS === 'web' &&
                hovered && { opacity: 0.7, cursor: 'pointer' },
            ]}
          >
            <AppIcon
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* Create Account Button */}
      <Animated.View entering={FadeInDown.delay(400).duration(450).springify()}>
        <AnimatedPressable
          onPress={handleRegister}
          disabled={isSubmitting || isGoogleLoading}
          onPressIn={() => (registerButtonScale.value = withSpring(0.97))}
          onPressOut={() => (registerButtonScale.value = withSpring(1))}
          style={[
            styles.primaryBtnWrap,
            { transform: [{ scale: registerButtonScale }] },
            (isSubmitting || isGoogleLoading) && { opacity: 0.7 },
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
                <AppIcon name="user-plus" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Create Account</Text>
              </>
            )}
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>

      {/* Divider */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(450).springify()}
        style={styles.dividerRow}
      >
        <View
          style={[
            styles.dividerLine,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.12)'
                : '#E2E8F0',
            },
          ]}
        />
        <Typography
          variant="caption"
          weight="bold"
          color="textTertiary"
          style={styles.dividerText}
        >
          or continue with
        </Typography>
        <View
          style={[
            styles.dividerLine,
            {
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.12)'
                : '#E2E8F0',
            },
          ]}
        />
      </Animated.View>

      {/* Social Authentication */}
      <Animated.View
        entering={FadeInDown.delay(600).duration(450).springify()}
        style={styles.socialRow}
      >
        {[
          { id: 'google', label: 'Google', icon: 'google' as const },
          { id: 'apple', label: 'Apple', icon: 'apple' as const },
        ].map(provider => (
          <Pressable
            key={provider.id}
            onPress={provider.id === 'google' ? handleGoogleLogin : undefined}
            style={({ hovered, pressed }: WebPressableState) => [
              styles.socialBtn,
              {
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.14)'
                  : '#E2E8F0',
                backgroundColor: theme.isDark
                  ? 'rgba(30, 41, 59, 0.75)'
                  : '#FFFFFF',
              },
              Platform.OS === 'web' && hovered && styles.socialBtnHovered,
              pressed && { opacity: 0.75 },
            ]}
          >
            {isGoogleLoading && provider.id === 'google' ? (
              <GlobalLoader variant="inline" color={theme.colors.primary} />
            ) : (
              <View style={styles.socialContent}>
                <AppIcon
                  name={provider.icon}
                  size={18}
                  color={theme.colors.textPrimary}
                />
                <Text
                  style={[
                    styles.socialBtnText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {provider.label}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </Animated.View>

      {/* Footer */}
      <Animated.View
        entering={FadeInDown.delay(700).duration(450).springify()}
        style={styles.footerRow}
      >
        <Typography variant="bodySm" color="textSecondary">
          Already have an account?{' '}
        </Typography>
        <Pressable
          style={({ hovered }: WebPressableState) => [
            Platform.OS === 'web' &&
              hovered && { opacity: 0.7, cursor: 'pointer' },
          ]}
        >
          <Typography variant="bodySm" weight="extrabold" color="primary">
            Log in here
          </Typography>
        </Pressable>
      </Animated.View>
    </View>
  );

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

            {/* Floating Frosted Glass Register Modal */}
            <GlassCard
              variant="prominent"
              padding="none"
              intensity={theme.isDark ? 65 : 90}
              style={styles.floatingRegisterModal}
            >
              {/* Header */}
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
                      <AppIcon name="plane" size={34} color="#FFFFFF" />
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
                          <Text style={styles.brandBadgeText}>JOIN</Text>
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
                  Create account
                </Typography>
                <Typography
                  variant="bodySm"
                  color="textSecondary"
                  style={styles.welcomeSubtext}
                >
                  Sign up to start organizing group trips and splitting bills
                  seamlessly
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

              {/* Interactive Form */}
              {renderRegisterForm()}
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

        // --- Floating Register Modal ---
        floatingRegisterModal: {
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
        eyeBtn: {
          paddingHorizontal: 16,
          height: '100%',
          justifyContent: 'center',
        },

        // Action Button
        primaryBtnWrap: {
          borderRadius: 14,
          marginTop: 4,
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

        // Divider
        dividerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 4,
          gap: 14,
        },
        dividerLine: {
          flex: 1,
          height: 1,
        },
        dividerText: {
          letterSpacing: 0.5,
          fontSize: 11,
        },

        // Social Authentication
        socialRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 12,
        },
        socialBtn: {
          flex: 1,
          height: 46,
          borderRadius: 14,
          borderWidth: 1,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          ...(Platform.OS === 'web'
            ? ({ transition: 'all 0.2s ease', cursor: 'pointer' } as any)
            : {}),
        },
        socialBtnHovered: {
          transform: [{ translateY: -2 }],
        },
        socialContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        socialBtnText: {
          fontSize: 14,
          fontWeight: '700',
        },

        // Footer
        footerRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 4,
        },
      }),
    [theme],
  );
};
