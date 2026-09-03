// app/(auth)/login.tsx
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
} from 'react-native';
import { router, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAuthStore } from '../../stores/auth.store';
import AuthLayout from '../../components/auth/AuthLayout';
import { GoogleOneTap } from '../../components/auth/GoogleOneTap';
import { useTheme } from '../../providers/ThemeProvider';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { haptics } from '../../utils/haptics';
import { GlassCard } from '../../components/ui/GlassCard';
import { storage } from '../../utils/storage';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import GlobalLoader from '../../components/common/GlobalLoader';
import AppIcon from '../../components/common/AppIcon';
import AppLogo from '../../components/common/AppLogo';
import { Typography } from '../../components/ui/Typography';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPLIT_SIDE_IMAGE_URL =
  'https://i.pinimg.com/1200x/f5/b5/4c/f5b54cdb7dac90bf7ffb78ad82eed57b.jpg';

export default function LoginScreen() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const { width, height } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { loginWithEmail, loginWithGoogle, isLoading, error, clearError } =
    useAuthStore();

  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const loginButtonScale = useSharedValue(1);

  const handleLogin = async () => {
    haptics.medium();
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    try {
      await loginWithEmail(email.trim(), password);
      router.replace('/(app)/(tabs)/home');
    } catch {}
  };

  const handleGoogleLogin = async () => {
    haptics.light();
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      const user = useAuthStore.getState().firebaseUser;
      const hasPassword = user?.providerData.some(
        (p: any) => p.providerId === 'password',
      );
      const hasSkipped = user
        ? storage.getBoolean(`skipped_password_${user.uid}`)
        : false;

      if (user && !hasPassword && !hasSkipped) {
        router.replace('/(auth)/set-password');
      } else {
        router.replace('/(app)/(tabs)/home');
      }
    } catch (e: any) {
      Alert.alert(
        'Google Sign-In Error',
        e.message || 'An error occurred during Google Sign-In.',
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const renderLoginForm = () => (
    <GlassCard
      variant="prominent"
      padding="xl"
      intensity={theme.isDark ? 35 : 55}
      style={styles.floatingFormCard}
    >
      <Animated.View
        entering={FadeInDown.delay(100).duration(500).springify()}
        style={styles.inputWrapper}
      >
        <Typography
          variant="caption"
          weight="extrabold"
          color="textSecondary"
          style={styles.labelField}
          premium
        >
          Email Address
        </Typography>
        <View
          style={[
            styles.inputBox,
            {
              borderColor: isEmailFocused
                ? theme.colors.primary
                : theme.colors.borderLight,
              backgroundColor: theme.colors.background,
            },
            isEmailFocused && styles.inputBoxFocused,
          ]}
        >
          <AppIcon
            name="mail"
            size={18}
            color={theme.colors.textTertiary}
            style={styles.inputIcon}
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
              styles.input,
              { color: theme.colors.textPrimary },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
            ]}
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).duration(500).springify()}
        style={styles.inputWrapper}
      >
        <Typography
          variant="caption"
          weight="extrabold"
          color="textSecondary"
          style={styles.labelField}
          premium
        >
          Password
        </Typography>
        <View
          style={[
            styles.inputBox,
            {
              borderColor: isPasswordFocused
                ? theme.colors.primary
                : theme.colors.borderLight,
              backgroundColor: theme.colors.background,
            },
            isPasswordFocused && styles.inputBoxFocused,
          ]}
        >
          <AppIcon
            name="lock"
            size={18}
            color={theme.colors.textTertiary}
            style={styles.inputIcon}
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
              styles.input,
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

      <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable
            style={({ hovered }: WebPressableState) => [
              styles.forgotPassword,
              Platform.OS === 'web' &&
                hovered && { opacity: 0.7, cursor: 'pointer' },
            ]}
          >
            <Typography variant="caption" weight="bold" color="primary">
              Forgot Password?
            </Typography>
          </Pressable>
        </Link>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500).springify()}>
        <AnimatedPressable
          onPress={handleLogin}
          disabled={isLoading}
          onPressIn={() => (loginButtonScale.value = withSpring(0.96))}
          onPressOut={() => (loginButtonScale.value = withSpring(1))}
          style={[
            styles.primaryButtonWrap,
            { transform: [{ scale: loginButtonScale }] },
            isLoading && styles.primaryButtonDisabled,
          ]}
        >
          <LinearGradient
            colors={theme.gradients.secondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryGradient}
          >
            {isLoading ? (
              <GlobalLoader variant="inline" color="#FFF" />
            ) : (
              <>
                <AppIcon name="log-in" size={18} color="#FFF" />
                <Text style={styles.primaryButtonText}>Log In</Text>
              </>
            )}
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(500).duration(500).springify()}
        style={styles.divider}
      >
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: theme.colors.borderLight },
          ]}
        />
        <Typography
          variant="caption"
          weight="bold"
          color="textTertiary"
          style={{ letterSpacing: 0.5 }}
        >
          or continue with
        </Typography>
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: theme.colors.borderLight },
          ]}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(600).duration(500).springify()}
        style={styles.socialContainer}
      >
        {[
          { id: 'google', label: 'Google', icon: 'google' as const },
          { id: 'apple', label: 'Apple', icon: 'apple' as const },
        ].map(provider => (
          <Pressable
            key={provider.id}
            onPress={provider.id === 'google' ? handleGoogleLogin : undefined}
            style={({ hovered, pressed }: WebPressableState) => [
              styles.socialButton,
              {
                borderColor: theme.colors.borderLight,
                backgroundColor: theme.colors.surface,
              },
              Platform.OS === 'web' && hovered && styles.socialButtonHovered,
              pressed && styles.socialButtonPressed,
            ]}
          >
            <GlassCard
              style={styles.socialGlass}
              intensity={theme.isDark ? 8 : 4}
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
                      styles.socialButtonText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {provider.label}
                  </Text>
                </View>
              )}
            </GlassCard>
          </Pressable>
        ))}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(700).duration(500).springify()}
        style={styles.footer}
      >
        <Typography variant="bodySm" color="textSecondary">
          Don't have an account?{' '}
        </Typography>
        <Link href="/(auth)/register" asChild>
          <Pressable
            style={({ hovered }: WebPressableState) => [
              Platform.OS === 'web' &&
                hovered && { opacity: 0.7, cursor: 'pointer' },
            ]}
          >
            <Typography variant="bodySm" weight="extrabold" color="primary">
              Register here
            </Typography>
          </Pressable>
        </Link>
      </Animated.View>
    </GlassCard>
  );

  // --- FULL SCREEN WEB LAYOUT (Bypasses AuthLayout with Floating Bento Effect) ---
  if (isWebDesktop) {
    return (
      <GlobalBackground>
        <View style={[styles.fullScreenWeb, { height }]}>
          {/* Left Side: Image covering the entire half */}
          <View style={styles.fullScreenImageContainer}>
            <Image
              source={{ uri: SPLIT_SIDE_IMAGE_URL }}
              style={styles.fullScreenImage}
              resizeMode="cover"
            />
            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(15,23,42,0.4)']}
              style={styles.fullScreenImageOverlay}
            />
          </View>

          {/* Right Side: Floating Bento Form Container Centered */}
          <View style={styles.fullScreenFormContainer}>
            <View style={styles.fullScreenFormWrapper}>
              <View style={styles.webHeader}>
                <View style={styles.webLogoWrap}>
                  <AppLogo size={42} />
                  <Text style={styles.webLogoText}>WAKERU</Text>
                </View>
                <Typography
                  variant="h1"
                  weight="extrabold"
                  color="textPrimary"
                  style={{ marginBottom: 6 }}
                  premium
                >
                  Welcome back
                </Typography>
                <Typography variant="body" color="textSecondary">
                  Log in securely to continue to your expedition suite
                </Typography>
              </View>

              {error ? (
                <Animated.View
                  entering={FadeInDown.duration(400).springify()}
                  style={[
                    styles.errorContainer,
                    {
                      backgroundColor: theme.colors.dangerBg,
                      borderColor: theme.colors.danger + '30',
                    },
                  ]}
                >
                  <AppIcon
                    name="alert-circle"
                    size={16}
                    color={theme.colors.danger}
                  />
                  <Text
                    style={[styles.errorText, { color: theme.colors.danger }]}
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

              <View style={styles.form}>{renderLoginForm()}</View>
            </View>
          </View>
        </View>
      </GlobalBackground>
    );
  }

  // --- MOBILE LAYOUT (Keeps AuthLayout) ---
  return (
    <GlobalBackground>
      <AuthLayout
        title="Welcome back"
        subtitle="Log in securely to continue to Wakeru"
        backgroundImageUrl={SPLIT_SIDE_IMAGE_URL}
      >
        <View style={styles.container}>
          {error ? (
            <Animated.View
              entering={FadeInDown.duration(400).springify()}
              style={[
                styles.errorContainer,
                {
                  backgroundColor: theme.colors.dangerBg,
                  borderColor: theme.colors.danger + '30',
                },
              ]}
            >
              <AppIcon
                name="alert-circle"
                size={16}
                color={theme.colors.danger}
              />
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
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

          <View style={styles.form}>{renderLoginForm()}</View>
        </View>
      </AuthLayout>
    </GlobalBackground>
  );
}

// ============================================================
// Premium Styles
// ============================================================
const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
        },
        floatingFormCard: {
          borderRadius: 28,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(15,23,42,0.06)',

          ...Platform.select({
            web: {
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            } as any,

            default: {
              shadowColor: '#000',

              shadowOffset: {
                width: 0,
                height: 4,
              },

              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
            },
          }),
        },

        // --- FULL SCREEN WEB STYLES ---
        fullScreenWeb: {
          flexDirection: 'row',
          width: '100%',
          backgroundColor: 'transparent',
        },
        fullScreenImageContainer: {
          flex: 1.1,
          position: 'relative',
        },
        fullScreenImage: {
          ...StyleSheet.absoluteFill,
          width: '100%',
          height: '100%',
        },
        fullScreenImageOverlay: {
          ...StyleSheet.absoluteFill,
        },
        fullScreenFormContainer: {
          flex: 1.2,
          justifyContent: 'center',
          alignItems: 'center', // Centers form horizontally within its column
          padding: 48,
          backgroundColor: 'transparent',
        },
        fullScreenFormWrapper: {
          width: '100%',
          maxWidth: 480,
          alignSelf: 'center', // Ensures content block stays anchored dead-center
        },
        webHeader: {
          marginBottom: 24,
          paddingHorizontal: 4,
        },
        webLogoWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
        },
        webLogoText: {
          fontSize: 14,
          fontWeight: '900',
          color: theme.colors.textPrimary,
          letterSpacing: 2,
        },

        errorContainer: {
          borderRadius: 16,
          padding: 14,
          marginBottom: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
        },
        errorText: {
          fontSize: 14,
          fontWeight: '600',
          flex: 1,
        },
        form: {
          gap: 20,
        },
        inputWrapper: {
          gap: 6,
        },
        labelField: {
          marginLeft: 2,
          letterSpacing: 0.8,
        },
        inputBox: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 16,
          overflow: 'hidden',
          height: 52,
          ...(Platform.OS === 'web' && { transition: 'all 0.2s ease' }),
        },
        inputBoxFocused: {
          borderColor: theme.colors.primary,
          ...Platform.select({
            web: { boxShadow: `0 0 0 4px ${theme.colors.primary}25` } as any,
          }),
        },
        inputIcon: {
          paddingLeft: 16,
        },
        input: {
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
        forgotPassword: {
          alignSelf: 'flex-end',
          marginTop: -2,
          marginBottom: 4,
        },
        primaryButtonWrap: {
          borderRadius: 16,
          overflow: 'hidden',

          ...Platform.select({
            web: {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            } as any,

            default: {
              shadowColor: '#000',

              shadowOffset: {
                width: 0,
                height: 4,
              },

              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
            },
          }),
        },
        primaryGradient: {
          height: 52,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        primaryButtonDisabled: {
          opacity: 0.6,
        },
        primaryButtonText: {
          color: '#FFFFFF',
          fontSize: 15,
          fontWeight: '800',
          letterSpacing: 0.5,
        },
        divider: {
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 4,
          gap: 14,
        },
        dividerLine: {
          flex: 1,
          height: 1,
        },
        socialContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 12,
        },
        socialButton: {
          flex: 1,
          height: 50,
          borderRadius: 16,
          borderWidth: 1,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          ...(Platform.OS === 'web'
            ? { transition: 'all 0.2s ease', cursor: 'pointer' as any }
            : {}),
        },
        socialGlass: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 0,
        },
        socialContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        socialButtonHovered: {
          transform: [{ translateY: -2 }],
        },
        socialButtonPressed: {
          opacity: 0.7,
        },
        socialButtonText: {
          fontSize: 14,
          fontWeight: '700',
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 8,
        },
      }),
    [theme],
  );
};
