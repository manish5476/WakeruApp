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
import { storage } from '@/core/storage';
import { GlobalBackground } from '@/shared/components/GlobalBackground';
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
  'https://i.pinimg.com/1200x/f5/b5/4c/f5b54cdb7dac90bf7ffb78ad82eed57b.jpg';

export default function SetPasswordScreen() {
  const navigation = useNavigation<GuestNavigationProp<'SetPassword'>>();
  const theme = useAppTheme();
  const styles = useStyles();

  const [password, setPasswordState] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setPassword, error, clearError } = useAuthStore();
  const buttonScale = useSharedValue(1);

  const handleSavePassword = async () => {
    haptics.medium();
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setPassword(password);
      Alert.alert('Success', 'Password set successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.message || 'An error occurred while setting the password.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    haptics.light();
    const user = useAuthStore.getState().firebaseUser;
    if (user?.uid) {
      storage.setBoolean(`skipped_password_${user.uid}`, true);
    }
  };

  const renderForm = () => (
    <View style={styles.form}>
      <Animated.View
        entering={FadeInDown.delay(100).duration(500).springify()}
        style={styles.inputWrapper}
      >
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          New Password
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
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textTertiary}
            value={password}
            onChangeText={t => {
              setPasswordState(t);
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

      <Animated.View
        entering={FadeInDown.delay(200).duration(500).springify()}
        style={styles.inputWrapper}
      >
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Confirm Password
        </Text>
        <View
          style={[
            styles.inputBox,
            {
              borderColor: isConfirmFocused
                ? theme.colors.primary
                : theme.colors.borderLight,
              backgroundColor: theme.colors.surface,
            },
            isConfirmFocused && styles.inputBoxFocused,
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
            value={confirmPassword}
            onChangeText={t => {
              setConfirmPassword(t);
              clearError();
            }}
            onFocus={() => setIsConfirmFocused(true)}
            onBlur={() => setIsConfirmFocused(false)}
            secureTextEntry={!showPassword}
            style={[styles.input, { color: theme.colors.textPrimary }]}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
        <AnimatedPressable
          onPress={handleSavePassword}
          disabled={isSubmitting}
          onPressIn={() => (buttonScale.value = withSpring(0.96))}
          onPressOut={() => (buttonScale.value = withSpring(1))}
          style={[
            styles.primaryButtonWrap,
            { transform: [{ scale: buttonScale }] },
            isSubmitting && styles.primaryButtonDisabled,
          ]}
        >
          {LinearGradientComponent ? (
            <LinearGradientComponent
              colors={theme.gradients.secondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Saving...' : 'Set Password'}
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
                {isSubmitting ? 'Saving...' : 'Set Password'}
              </Text>
            </View>
          )}
        </AnimatedPressable>
      </Animated.View>

      <Pressable onPress={handleSkip} style={styles.skipBtn}>
        <Text style={[styles.skipText, { color: theme.colors.textTertiary }]}>
          Skip for now
        </Text>
      </Pressable>
    </View>
  );

  return (
    <GlobalBackground>
      <AuthLayout
        title="Set a Password"
        subtitle="You signed in with Google. You can set a password to log in directly next time."
        backgroundImageUrl={SPLIT_SIDE_IMAGE_URL}
      >
        <View style={styles.container}>
          {error ? (
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
          ) : null}

          {renderForm()}
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
        form: {
          gap: 18,
        },
        inputWrapper: {
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
          borderRadius: 14,
          height: 50,
        },
        inputBoxFocused: {
          borderColor: theme.colors.primary,
        },
        inputIcon: {
          paddingLeft: 14,
        },
        input: {
          flex: 1,
          paddingHorizontal: 12,
          height: '100%',
          fontSize: 15,
        },
        eyeBtn: {
          paddingHorizontal: 14,
          height: '100%',
          justifyContent: 'center',
        },
        primaryButtonWrap: {
          borderRadius: 14,
          overflow: 'hidden',
          marginTop: 6,
        },
        primaryGradient: {
          height: 50,
          alignItems: 'center',
          justifyContent: 'center',
        },
        primaryButtonDisabled: {
          opacity: 0.6,
        },
        primaryButtonText: {
          color: '#FFF',
          fontSize: 15,
          fontWeight: '700',
        },
        skipBtn: {
          alignItems: 'center',
          paddingVertical: 10,
        },
        skipText: {
          fontSize: 14,
          fontWeight: '500',
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
      }),
    [theme],
  );
};
