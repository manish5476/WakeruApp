import GlobalLoader from '../../components/common/GlobalLoader';
import AppIcon from '../../components/common/AppIcon';

// app/(auth)/forgot-password.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth.store';
import AuthLayout from '../../components/auth/AuthLayout';
import { useTheme } from '../../providers/ThemeProvider';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalBackground } from '../../components/ui/GlobalBackground';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);

  // Clear any global auth errors when entering the screen
  useEffect(() => {
    clearError();
  }, []);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await forgotPassword(email.trim());
      setIsSuccess(true);
    } catch {}
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
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
            <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
              <AppIcon name="x" size={16} color={theme.colors.danger} />
            </TouchableOpacity>
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
                    <AppIcon name="send" size={18} color="#FFF" />
                    <Text style={styles.primaryButtonText}>
                      Send Reset Link
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleBackToLogin}
                style={styles.footerBtn}
              >
                <AppIcon
                  name="arrow-left"
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.footerLink,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.helpTextContainer}>
              <AppIcon
                name="info"
                size={14}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[styles.helpText, { color: theme.colors.textTertiary }]}
              >
                You'll receive a password reset link via email
              </Text>
            </View>
          </View>
        )}
      </AuthLayout>
    </GlobalBackground>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        errorContainer: {
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing['3'],
          marginBottom: theme.spacing['4'],
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
        },
        errorText: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: '600',
          flex: 1,
        },
        errorDismiss: {
          padding: 4,
        },
        successContainer: {
          alignItems: 'center',
          paddingVertical: theme.spacing['5'],
        },
        successIconWrap: {
          width: 80,
          height: 80,
          borderRadius: 40,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing['4'],
        },
        successTitle: {
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing['2'],
        },
        successText: {
          fontSize: theme.typography.fontSize.base,
          textAlign: 'center',
          marginBottom: theme.spacing['6'],
          lineHeight: 24,
        },
        highlightText: {
          fontWeight: '700',
          color: theme.colors.primary,
        },
        form: {
          gap: theme.spacing['4'],
        },
        inputContainer: {
          gap: theme.spacing['1'],
        },
        label: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginLeft: 4,
        },
        inputBox: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: theme.borderRadius.lg,
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
          fontSize: theme.typography.fontSize.base,
          fontWeight: '500',
        },
        primaryButton: {
          borderRadius: theme.borderRadius.lg,
          overflow: 'hidden',
          marginTop: theme.spacing['2'],
          width: '100%',
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: theme.spacing['4'],
        },
        primaryButtonText: {
          color: theme.colors.white,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.bold,
        },
        footer: {
          alignItems: 'center',
          marginTop: theme.spacing['4'],
        },
        footerBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          padding: 8,
        },
        footerLink: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
        },
        helpTextContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: theme.spacing['2'],
          paddingHorizontal: 16,
        },
        helpText: {
          fontSize: 12,
          fontWeight: '500',
          textAlign: 'center',
        },
      }),
    [theme],
  );
};
