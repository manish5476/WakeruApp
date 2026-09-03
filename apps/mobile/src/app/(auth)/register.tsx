import GlobalLoader from '../../components/common/GlobalLoader';
import AppIcon from '../../components/common/AppIcon';

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
import { GlobalBackground } from '../../components/ui/GlobalBackground';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPLIT_SIDE_IMAGE_URL =
  'https://i.pinimg.com/736x/43/92/a9/4392a9bf52f9a49813b2b062663902be.jpg';

export default function RegisterScreen() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const { width, height } = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { registerWithEmail, loginWithGoogle, isLoading, error, clearError } =
    useAuthStore();

  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const registerButtonScale = useSharedValue(1);

  const handleGoogleLogin = async () => {
    haptics.light();
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.replace('/(app)/(tabs)/home');
    } catch (e: any) {
      Alert.alert(
        'Google Sign-In Error',
        e.message || 'An error occurred during Google Sign-In.',
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    haptics.medium();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      await registerWithEmail(trimmedEmail, password, trimmedName, '');
      router.replace('/(app)/(tabs)/home');
    } catch {}
  };

  const renderRegisterForm = () => (
    <>
      <Animated.View
        entering={FadeInDown.delay(100).duration(500).springify()}
        style={styles.inputWrapper}
      >
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Full Name
        </Text>
        <View
          style={[
            styles.inputBox,
            {
              borderColor: isNameFocused
                ? theme.colors.primary
                : theme.colors.borderLight,
              backgroundColor: theme.colors.surface,
            },
            isNameFocused && styles.inputBoxFocused,
          ]}
        >
          <AppIcon
            name="user"
            size={18}
            color={theme.colors.textTertiary}
            style={styles.inputIcon}
          />
          <TextInput
            style={[
              styles.input,
              { color: theme.colors.textPrimary },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
            ]}
            placeholder="John Doe"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={t => {
              setName(t);
              clearError();
            }}
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).duration(500).springify()}
        style={styles.inputWrapper}
      >
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Email Address
        </Text>
        <View
          style={[
            styles.inputBox,
            {
              borderColor: isEmailFocused
                ? theme.colors.primary
                : theme.colors.borderLight,
              backgroundColor: theme.colors.surface,
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
            style={[
              styles.input,
              { color: theme.colors.textPrimary },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
            ]}
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
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(300).duration(500).springify()}
        style={styles.inputWrapper}
      >
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Create Password
        </Text>
        <View
          style={[
            styles.inputBox,
            {
              borderColor: isPasswordFocused
                ? theme.colors.primary
                : theme.colors.borderLight,
              backgroundColor: theme.colors.surface,
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
            style={[
              styles.input,
              { color: theme.colors.textPrimary },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
            ]}
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
          />
          <Pressable
            onPress={() => {
              haptics.light();
              setShowPassword(!showPassword);
            }}
            style={({ hovered }: WebPressableState) => [
              styles.eyeBtn,
              Platform.OS === 'web' &&
                hovered &&
                ({ opacity: 0.7, cursor: 'pointer' } as any),
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

      <Animated.View entering={FadeInDown.delay(400).duration(500).springify()}>
        <AnimatedPressable
          onPress={handleRegister}
          disabled={isLoading}
          onPressIn={() => (registerButtonScale.value = withSpring(0.96))}
          onPressOut={() => (registerButtonScale.value = withSpring(1))}
          style={[
            styles.primaryButtonWrap,
            { transform: [{ scale: registerButtonScale }] },
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
                <AppIcon name="user-plus" size={18} color="#FFF" />
                <Text style={styles.primaryButtonText}>Create Account</Text>
              </>
            )}
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(600).duration(500).springify()}
        style={styles.divider}
      >
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: theme.colors.borderLight },
          ]}
        />
        <Text
          style={[styles.dividerText, { color: theme.colors.textTertiary }]}
        >
          or continue with
        </Text>
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: theme.colors.borderLight },
          ]}
        />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(700).duration(500).springify()}
        style={styles.socialContainer}
      >
        {[
          { id: 'google', label: 'Google', icon: 'chrome' as const },
          { id: 'apple', label: 'Apple', icon: 'command' as const },
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
        entering={FadeInDown.delay(800).duration(500).springify()}
        style={styles.footer}
      >
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          Already have an account?{' '}
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable
            style={({ hovered }: WebPressableState) => [
              Platform.OS === 'web' &&
                hovered &&
                ({ opacity: 0.7, cursor: 'pointer' } as any),
            ]}
          >
            <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
              Log in here
            </Text>
          </Pressable>
        </Link>
      </Animated.View>
    </>
  );

  // --- FULL SCREEN WEB LAYOUT (Bypasses AuthLayout) ---
  if (isWebDesktop) {
    return (
      <GlobalBackground>
        <View
          style={[
            styles.fullScreenWeb,
            { height, backgroundColor: 'transparent' },
          ]}
        >
          {/* Left Side: Image covering the entire half */}
          <View style={styles.fullScreenImageContainer}>
            <Image
              source={{ uri: SPLIT_SIDE_IMAGE_URL }}
              style={styles.fullScreenImage}
              resizeMode="cover"
            />
            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(15,23,42,0.3)']}
              style={styles.fullScreenImageOverlay}
            />
          </View>

          {/* Right Side: Form Container */}
          <View
            style={[
              styles.fullScreenFormContainer,
              { backgroundColor: 'transparent' },
            ]}
          >
            <View style={styles.fullScreenFormWrapper}>
              {/* Headers since we removed AuthLayout */}
              <View style={styles.webHeader}>
                <View style={styles.webLogoWrap}>
                  <LinearGradient
                    colors={theme.gradients.secondary}
                    style={styles.webLogoIcon}
                  >
                    <AppIcon name="send" size={24} color="#FFF" />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.webLogoText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    WAKERU
                  </Text>
                </View>
                <Text
                  style={[styles.webTitle, { color: theme.colors.textPrimary }]}
                >
                  Create an account
                </Text>
                <Text
                  style={[
                    styles.webSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Join Wakeru to start planning
                </Text>
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
                      Platform.OS === 'web' &&
                        hovered &&
                        ({ opacity: 0.7, cursor: 'pointer' } as any),
                    ]}
                  >
                    <AppIcon name="x" size={16} color={theme.colors.danger} />
                  </Pressable>
                </Animated.View>
              ) : null}

              <View style={styles.form}>{renderRegisterForm()}</View>
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
        title="Create an account"
        subtitle="Join Wakeru to start planning"
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
                  Platform.OS === 'web' &&
                    hovered &&
                    ({ opacity: 0.7, cursor: 'pointer' } as any),
                ]}
              >
                <AppIcon name="x" size={16} color={theme.colors.danger} />
              </Pressable>
            </Animated.View>
          ) : null}

          <View style={styles.form}>{renderRegisterForm()}</View>
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
          // Padding removed to avoid double-padding with AuthLayout
        },

        // --- FULL SCREEN WEB STYLES ---
        fullScreenWeb: {
          flexDirection: 'row',
          width: '100%',
        },
        fullScreenImageContainer: {
          flex: 1,
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
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        fullScreenFormWrapper: {
          width: '100%',
          maxWidth: 440,
        },
        webHeader: {
          marginBottom: 32,
        },
        webLogoWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
        },
        webLogoIcon: {
          width: 40,
          height: 40,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        webLogoText: {
          fontSize: 14,
          fontWeight: '900',
          letterSpacing: 2,
        },
        webTitle: {
          fontSize: 32,
          fontWeight: 'bold',
          marginBottom: 8,
        },
        webSubtitle: {
          fontSize: 16,
        },
        // ----------------------------------

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
          gap: 8,
        },
        label: {
          fontSize: 13,
          fontWeight: '700',
          marginLeft: 4,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        inputBox: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 16,
          overflow: 'hidden',
          height: 56,
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
          fontSize: 16,
          fontWeight: '500',
        },
        eyeBtn: {
          paddingHorizontal: 16,
          height: '100%',
          justifyContent: 'center',
        },
        primaryButtonWrap: {
          borderRadius: 16,
          marginTop: 8,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: theme.colors.secondary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
            },
            android: { elevation: 8 },
          }),
        },
        primaryGradient: {
          height: 56,
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
          marginVertical: 8,
          gap: 16,
        },
        dividerLine: {
          flex: 1,
          height: 1,
        },
        dividerText: {
          fontSize: 12,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        socialContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 16,
        },
        socialButton: {
          flex: 1,
          height: 56,
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
          fontSize: 15,
          fontWeight: '700',
        },
        footer: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 8,
        },
        footerText: {
          fontSize: 14,
          fontWeight: '500',
        },
        footerLink: {
          fontSize: 14,
          fontWeight: '800',
        },
      }),
    [theme],
  );
};
