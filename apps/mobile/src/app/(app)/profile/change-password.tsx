import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
// app/(app)/profile/change-password.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { GlassCard } from '../../../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';

// Safe web pressable type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { width } = useWindowDimensions();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { changePassword, isLoading: storeLoading } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(false);
  const isLoading = storeLoading || localLoading;

  // Visibility State
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Focus State for premium UI
  const [isCurrentFocused, setIsCurrentFocused] = useState(false);
  const [isNewFocused, setIsNewFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  // Widescreen form containment
  const isWebDesktop = Platform.OS === 'web' && width > 768;

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    try {
      setLocalLoading(true);
      await changePassword(currentPassword, newPassword);
      setLocalLoading(false);
      Alert.alert('Success', 'Password updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      setLocalLoading(false);
      Alert.alert('Error', error.message || 'Failed to update password');
    }
  };

  return (
    <GlobalBackground>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.webDesktopContent,
            isWebDesktop && styles.webDesktopContentCentered,
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                paddingTop:
                  Platform.OS === 'web' ? theme.spacing['4'] : insets.top + 20,
                borderBottomColor: theme.colors.borderLight,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ hovered, pressed }: WebPressableState) => [
                styles.backBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderLight,
                },
                Platform.OS === 'web' && hovered && styles.backBtnHovered,
                pressed && styles.pressedState,
              ]}
            >
              <AppIcon
                name="arrow-left"
                size={22}
                color={theme.colors.textPrimary}
              />
            </Pressable>
            <Text
              style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            >
              Change Password
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            {/* Security Tip */}
            <View
              style={[
                styles.tipContainer,
                {
                  backgroundColor: theme.colors.primaryBg,
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <AppIcon name="shield" size={16} color={theme.colors.primary} />
              <Text
                style={[styles.tipText, { color: theme.colors.textSecondary }]}
              >
                Your new password must be unique from those previously used.
              </Text>
            </View>

            <GlassCard
              style={styles.formCard}
              intensity={theme.isDark ? 12 : 6}
            >
              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.label, { color: theme.colors.textSecondary }]}
                >
                  Current Password
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: isCurrentFocused
                        ? theme.colors.primary
                        : theme.colors.borderLight,
                      backgroundColor: theme.colors.surface,
                    },
                    isCurrentFocused && styles.inputFocused,
                  ]}
                >
                  <AppIcon
                    name="lock"
                    size={16}
                    color={theme.colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="Enter current password"
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={!showCurrent}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    onFocus={() => setIsCurrentFocused(true)}
                    onBlur={() => setIsCurrentFocused(false)}
                  />
                  <Pressable
                    onPress={() => setShowCurrent(!showCurrent)}
                    style={({ hovered }: WebPressableState) => [
                      styles.eyeBtn,
                      Platform.OS === 'web' &&
                        hovered &&
                        ({ opacity: 0.7, cursor: 'pointer' } as any),
                    ]}
                  >
                    <AppIcon
                      name={showCurrent ? 'eye-off' : 'eye'}
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text
                  style={[styles.label, { color: theme.colors.textSecondary }]}
                >
                  New Password
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: isNewFocused
                        ? theme.colors.primary
                        : theme.colors.borderLight,
                      backgroundColor: theme.colors.surface,
                    },
                    isNewFocused && styles.inputFocused,
                  ]}
                >
                  <AppIcon
                    name="key"
                    size={16}
                    color={theme.colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="Enter new password"
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={!showNew}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    onFocus={() => setIsNewFocused(true)}
                    onBlur={() => setIsNewFocused(false)}
                  />
                  <Pressable
                    onPress={() => setShowNew(!showNew)}
                    style={({ hovered }: WebPressableState) => [
                      styles.eyeBtn,
                      Platform.OS === 'web' &&
                        hovered &&
                        ({ opacity: 0.7, cursor: 'pointer' } as any),
                    ]}
                  >
                    <AppIcon
                      name={showNew ? 'eye-off' : 'eye'}
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                </View>
                <Text
                  style={[
                    styles.passwordHint,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Must be at least 6 characters
                </Text>
              </View>

              {/* Confirm New Password */}
              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text
                  style={[styles.label, { color: theme.colors.textSecondary }]}
                >
                  Confirm New Password
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: isConfirmFocused
                        ? theme.colors.primary
                        : theme.colors.borderLight,
                      backgroundColor: theme.colors.surface,
                    },
                    isConfirmFocused && styles.inputFocused,
                  ]}
                >
                  <AppIcon
                    name="check-circle"
                    size={16}
                    color={theme.colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry={!showNew}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setIsConfirmFocused(true)}
                    onBlur={() => setIsConfirmFocused(false)}
                  />
                  {confirmPassword.length > 0 &&
                    newPassword === confirmPassword && (
                      <AppIcon
                        name="check"
                        size={16}
                        color={theme.colors.success}
                        style={styles.confirmIcon}
                      />
                    )}
                </View>
              </View>
            </GlassCard>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={isLoading}
              style={({ hovered, pressed }: WebPressableState) => [
                styles.saveBtn,
                Platform.OS === 'web' &&
                  hovered &&
                  !isLoading &&
                  styles.saveBtnHovered,
                pressed && !isLoading && styles.pressedState,
                isLoading && styles.saveBtnDisabled,
              ]}
            >
              <LinearGradient
                colors={theme.gradients.secondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                {isLoading ? (
                  <GlobalLoader variant="inline" color={theme.colors.surface} />
                ) : (
                  <>
                    <AppIcon name="check-circle" size={18} color="#FFF" />
                    <Text style={styles.saveBtnText}>Update Password</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GlobalBackground>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },

        // Widescreen wrapper specifically for forms
        webDesktopContent: {
          flex: 1,
          width: '100%',
        },
        webDesktopContentCentered: {
          maxWidth: 480,
          alignSelf: 'center',
          marginTop: theme.spacing['4'],
          borderRadius: theme.borderRadius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          ...theme.shadows.lg,
          flex: 0,
          paddingBottom: theme.spacing['4'],
        },

        // Web Interaction Helpers
        pressedState: {
          opacity: 0.8,
          transform: [{ scale: 0.98 }],
        },

        // Header
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing['4'],
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderTopLeftRadius: theme.borderRadius['2xl'],
          borderTopRightRadius: theme.borderRadius['2xl'],
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          ...(Platform.OS === 'web'
            ? { transition: 'all 0.2s ease', cursor: 'pointer' }
            : {}),
        } as any,
        backBtnHovered: {
          backgroundColor: theme.colors.primaryBg,
        },
        headerTitle: {
          fontSize: 17,
          fontWeight: '700',
        },

        content: {
          padding: theme.spacing['4'],
        },

        // Tip Container
        tipContainer: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          marginBottom: 20,
        },
        tipText: {
          fontSize: 13,
          fontWeight: '500',
          flex: 1,
          lineHeight: 20,
        },

        // Form Card
        formCard: {
          padding: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(255,255,255,0.2)',
          marginBottom: 20,
        },

        // Inputs
        inputGroup: {
          marginBottom: 18,
        },
        label: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 6,
          letterSpacing: 0.3,
        },
        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 14,
          overflow: 'hidden',
          ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } : {}),
        },
        inputIcon: {
          paddingLeft: 14,
        },
        input: {
          flex: 1,
          paddingHorizontal: 12,
          paddingVertical: 14,
          fontSize: 15,
          fontWeight: '500',
          height: '100%',
        },
        inputFocused: {
          borderColor: theme.colors.primary,
          ...Platform.select({
            web: { boxShadow: `0 0 0 4px ${theme.colors.primary}25` } as any,
          }),
        },
        eyeBtn: {
          paddingHorizontal: 14,
          height: '100%',
          justifyContent: 'center',
        },
        confirmIcon: {
          paddingRight: 14,
        },
        passwordHint: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
          marginLeft: 4,
        },

        // Save Button
        saveBtn: {
          borderRadius: 14,
          overflow: 'hidden',
          ...theme.shadows.md,
          ...(Platform.OS === 'web'
            ? { transition: 'all 0.2s ease', cursor: 'pointer' }
            : {}),
        } as any,
        saveGradient: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 16,
        },
        saveBtnHovered: {
          transform: [{ translateY: -2 }],
          ...theme.shadows.lg,
        },
        saveBtnDisabled: {
          opacity: 0.7,
          ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
        } as any,
        saveBtnText: {
          color: theme.colors.surface,
          fontSize: 15,
          fontWeight: '700',
        },
      }),
    [theme],
  );
};
