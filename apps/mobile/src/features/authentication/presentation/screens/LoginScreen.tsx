import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/state/auth.store';
import AuthLayout from '@/shared/components/AuthLayout';
import { useAppTheme } from '@/shared/theme/ThemeProvider';
import { haptics } from '@/shared/utils/haptics';
import { GlassCard } from '@/shared/components/GlassCard';
import { GlobalBackground } from '@/shared/components/GlobalBackground';
import GlobalLoader from '@/shared/components/GlobalLoader';
import AppIcon from '@/shared/components/AppIcon';
import { Typography } from '@/shared/components/Typography';
import type { GuestNavigationProp } from '@/navigation/types';

let LinearGradientComponent: React.ComponentType<any> | null = null;
try {
  LinearGradientComponent = require('react-native-linear-gradient').default;
} catch {
  LinearGradientComponent = null;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPLIT_SIDE_IMAGE_URL =
  'https://i.pinimg.com/1200x/f5/b5/4c/f5b54cdb7dac90bf7ffb78ad82eed57b.jpg';

export default function LoginScreen() {
  const navigation = useNavigation<GuestNavigationProp<'Login'>>();
  const theme = useAppTheme();
  const styles = useStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { loginWithEmail, loginWithGoogle, isLoading, error, clearError } =
    useAuthStore();

  const loginButtonScale = useSharedValue(1);

  const handleLogin = async () => {
    haptics.medium();
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    try {
      await loginWithEmail(email.trim(), password);
    } catch {
      // Handled in store
    }
  };

  const handleGoogleLogin = async () => {
    haptics.light();
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
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
            style={[styles.input, { color: theme.colors.textPrimary }]}
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
            style={[styles.input, { color: theme.colors.textPrimary }]}
          />
          <Pressable
            onPress={() => {
              haptics.light();
              setShowPassword(!showPassword);
            }}
            style={styles.eyeBtn}
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
        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotPassword}
        >
          <Typography variant="caption" weight="bold" color="primary">
            Forgot Password?
          </Typography>
        </Pressable>
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
          {LinearGradientComponent ? (
            <LinearGradientComponent
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
            </LinearGradientComponent>
          ) : (
            <View
              style={[
                styles.primaryGradient,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.primaryButtonText}>Log In</Text>
            </View>
          )}
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
        <Pressable
          onPress={handleGoogleLogin}
          style={[
            styles.socialButton,
            {
              borderColor: theme.colors.borderLight,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <GlassCard
            style={styles.socialGlass}
            intensity={theme.isDark ? 8 : 4}
          >
            {isGoogleLoading ? (
              <GlobalLoader variant="inline" color={theme.colors.primary} />
            ) : (
              <View style={styles.socialContent}>
                <AppIcon
                  name="google"
                  size={18}
                  color={theme.colors.textPrimary}
                />
                <Text
                  style={[
                    styles.socialButtonText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Google
                </Text>
              </View>
            )}
          </GlassCard>
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(700).duration(500).springify()}
        style={styles.footer}
      >
        <Typography variant="bodySm" color="textSecondary">
          Don't have an account?{' '}
        </Typography>
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Typography variant="bodySm" weight="extrabold" color="primary">
            Register here
          </Typography>
        </Pressable>
      </Animated.View>
    </GlassCard>
  );

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
              <Pressable onPress={clearError}>
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

const useStyles = () => {
  const theme = useAppTheme();
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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4,
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
        },
        inputBoxFocused: {
          borderColor: theme.colors.primary,
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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4,
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
