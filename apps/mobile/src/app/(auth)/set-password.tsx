import GlobalLoader from '../../components/common/GlobalLoader';
import AppIcon from '../../components/common/AppIcon';

// app/(auth)/set-password.tsx
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
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAuthStore } from '../../stores/auth.store';
import AuthLayout from '../../components/auth/AuthLayout';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { storage } from '../../utils/storage';
import { GlobalBackground } from '../../components/ui/GlobalBackground';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPLIT_SIDE_IMAGE_URL =
  'https://i.pinimg.com/1200x/f5/b5/4c/f5b54cdb7dac90bf7ffb78ad82eed57b.jpg';

export default function SetPasswordScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { width, height } = useWindowDimensions();

  const [password, setPasswordState] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setPassword, error, clearError } = useAuthStore();

  const isWebDesktop = Platform.OS === 'web' && width > 768;
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
        { text: 'OK', onPress: () => router.replace('/(app)/(tabs)/home') },
      ]);
      if (Platform.OS === 'web') {
        router.replace('/(app)/(tabs)/home');
      }
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
    router.replace('/(app)/(tabs)/home');
  };

  const renderForm = () => (
    <>
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
            style={[
              styles.input,
              { color: theme.colors.textPrimary },
              Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
            ]}
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
          <LinearGradient
            colors={theme.gradients.secondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryGradient}
          >
            {isSubmitting ? (
              <GlobalLoader variant="inline" color="#FFF" />
            ) : (
              <>
                <AppIcon name="check" size={18} color="#FFF" />
                <Text style={styles.primaryButtonText}>Save Password</Text>
              </>
            )}
          </LinearGradient>
        </AnimatedPressable>

        <Pressable
          onPress={handleSkip}
          disabled={isSubmitting}
          style={({ hovered, pressed }: WebPressableState) => [
            styles.skipButton,
            { borderColor: theme.colors.borderLight },
            Platform.OS === 'web' && hovered && styles.skipButtonHovered,
            pressed && styles.skipButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.skipButtonText,
              { color: theme.colors.textSecondary },
            ]}
          >
            Skip for now
          </Text>
        </Pressable>
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
              <View style={styles.webHeader}>
                <View style={styles.webLogoWrap}>
                  <LinearGradient
                    colors={theme.gradients.secondary}
                    style={styles.webLogoIcon}
                  >
                    <AppIcon name="send" size={24} color="#FFF" />
                  </LinearGradient>
                  <Text style={styles.webLogoText}>WAKERU</Text>
                </View>
                <Text
                  style={[styles.webTitle, { color: theme.colors.textPrimary }]}
                >
                  Set up a Password
                </Text>
                <Text
                  style={[
                    styles.webSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  You logged in with Google. Set a password now so you can also
                  log in using your email address next time.
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
                    style={[
                      styles.errorTextFull,
                      { color: theme.colors.danger },
                    ]}
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

              <View style={styles.form}>{renderForm()}</View>
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
        title="Set up a Password"
        subtitle="You logged in with Google. Set a password now so you can also log in using your email address next time."
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
              <Text
                style={[styles.errorTextFull, { color: theme.colors.danger }]}
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

          <View style={styles.form}>{renderForm()}</View>
        </View>
      </AuthLayout>
    </GlobalBackground>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
        },

        // --- NEW FULL SCREEN WEB STYLES ---
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
          color: theme.colors.textPrimary,
          letterSpacing: 2,
        },
        webTitle: {
          fontSize: 32,
          fontWeight: 'bold',
          marginBottom: 8,
        },
        webSubtitle: {
          fontSize: 16,
          lineHeight: 24,
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
        errorTextFull: {
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
        errorText: {
          fontSize: 13,
          fontWeight: '500',
          marginTop: 8,
          marginLeft: 4,
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
        skipButton: {
          width: '100%',
          height: 56,
          borderRadius: 16,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 16,
          backgroundColor: 'transparent',
          ...(Platform.OS === 'web' && {
            transition: 'all 0.2s ease',
            cursor: 'pointer' as any,
          }),
        },
        skipButtonHovered: {
          backgroundColor: 'rgba(0,0,0,0.02)',
        },
        skipButtonPressed: {
          opacity: 0.7,
        },
        skipButtonText: {
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [theme],
  );
};
