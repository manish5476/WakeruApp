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
import type { GuestNavigationProp } from '@/navigation/types';

let LinearGradientComponent: React.ComponentType<any> | null = null;
try {
  LinearGradientComponent = require('react-native-linear-gradient').default;
} catch {
  LinearGradientComponent = null;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPLIT_SIDE_IMAGE_URL =
  'https://i.pinimg.com/736x/43/92/a9/4392a9bf52f9a49813b2b062663902be.jpg';

export default function RegisterScreen() {
  const navigation = useNavigation<GuestNavigationProp<'Register'>>();
  const theme = useAppTheme();
  const styles = useStyles();

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

  const registerButtonScale = useSharedValue(1);

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
    } catch {
      // Handled in store
    }
  };

  const renderRegisterForm = () => (
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
            style={[styles.input, { color: theme.colors.textPrimary }]}
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
            style={[styles.input, { color: theme.colors.textPrimary }]}
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
            style={[styles.input, { color: theme.colors.textPrimary }]}
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
                  <AppIcon name="user-plus" size={18} color="#FFF" />
                  <Text style={styles.primaryButtonText}>Create Account</Text>
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
              <Text style={styles.primaryButtonText}>Create Account</Text>
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
        <Text
          style={[styles.footerText, { color: theme.colors.textSecondary }]}
        >
          Already have an account?{' '}
        </Text>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text
            style={[
              styles.footerLink,
              { color: theme.colors.primary, fontWeight: '800' },
            ]}
          >
            Log in here
          </Text>
        </Pressable>
      </Animated.View>
    </GlassCard>
  );

  return (
    <GlobalBackground>
      <AuthLayout
        title="Create Account"
        subtitle="Start tracking shared expenses effortlessly"
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

          <View style={styles.form}>{renderRegisterForm()}</View>
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
        label: {
          fontSize: 12,
          fontWeight: '700',
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
        dividerText: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.5,
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
        footerText: {
          fontSize: 14,
        },
        footerLink: {
          fontSize: 14,
        },
      }),
    [theme],
  );
};
