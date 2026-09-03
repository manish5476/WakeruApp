import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/state/auth.store';
import AuthLayout from '@/shared/components/AuthLayout';
import { useAppTheme } from '@/shared/theme/ThemeProvider';
import { GlobalBackground } from '@/shared/components/GlobalBackground';
import AppIcon from '@/shared/components/AppIcon';
import type { GuestNavigationProp } from '@/navigation/types';

let LinearGradientComponent: React.ComponentType<any> | null = null;
try {
  LinearGradientComponent = require('react-native-linear-gradient').default;
} catch {
  LinearGradientComponent = null;
}

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<GuestNavigationProp<'ForgotPassword'>>();
  const theme = useAppTheme();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await forgotPassword(email.trim());
      setIsSuccess(true);
    } catch {
      // Handled in store
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <GlobalBackground>
      <AuthLayout
        title="Reset Password"
        subtitle="We'll send you instructions to reset it."
      >
        {error && (
          <View
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
          </View>
        )}

        {isSuccess ? (
          <View style={styles.successContainer}>
            <View
              style={[
                styles.successIconWrap,
                { backgroundColor: theme.colors.successBg },
              ]}
            >
              <AppIcon
                name="check-circle"
                size={48}
                color={theme.colors.success}
              />
            </View>
            <Text
              style={[styles.successTitle, { color: theme.colors.textPrimary }]}
            >
              Check your email
            </Text>
            <Text
              style={[
                styles.successText,
                { color: theme.colors.textSecondary },
              ]}
            >
              We've sent password reset instructions to{' '}
              <Text style={styles.highlightText}>{email}</Text>. Please check
              your inbox and follow the link to reset your password.
            </Text>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleBackToLogin}
            >
              <AppIcon name="log-in" size={18} color="#FFF" />
              <Text style={styles.primaryButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text
                style={[styles.label, { color: theme.colors.textSecondary }]}
              >
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
                  placeholder="you@example.com"
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
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleReset}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {LinearGradientComponent ? (
                <LinearGradientComponent
                  colors={theme.gradients.secondary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                  </Text>
                </LinearGradientComponent>
              ) : (
                <View
                  style={[
                    styles.primaryGradient,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBackToLogin}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </AuthLayout>
    </GlobalBackground>
  );
}

const useStyles = () => {
  const theme = useAppTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        form: {
          gap: 16,
        },
        inputContainer: {
          gap: 6,
        },
        label: {
          fontSize: 13,
          fontWeight: '600',
        },
        inputBox: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 12,
          height: 48,
        },
        inputBoxFocused: {
          borderColor: theme.colors.primary,
        },
        inputIcon: {
          paddingLeft: 12,
        },
        input: {
          flex: 1,
          paddingHorizontal: 10,
          height: '100%',
          fontSize: 14,
        },
        primaryButton: {
          borderRadius: 14,
          overflow: 'hidden',
          marginTop: 8,
        },
        primaryGradient: {
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        primaryButtonText: {
          color: '#FFF',
          fontSize: 15,
          fontWeight: '700',
        },
        secondaryButton: {
          alignItems: 'center',
          paddingVertical: 8,
        },
        secondaryButtonText: {
          fontSize: 14,
          fontWeight: '600',
        },
        errorContainer: {
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
        },
        errorText: {
          fontSize: 13,
          fontWeight: '500',
          flex: 1,
        },
        successContainer: {
          alignItems: 'center',
          paddingVertical: 16,
          gap: 12,
        },
        successIconWrap: {
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        },
        successTitle: {
          fontSize: 20,
          fontWeight: '700',
        },
        successText: {
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
        },
        highlightText: {
          fontWeight: '700',
        },
      }),
    [theme],
  );
};
