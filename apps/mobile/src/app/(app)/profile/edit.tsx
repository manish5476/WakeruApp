// app/(app)/profile/edit.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  Pressable,
  Image,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { useUpdateProfile } from '../../../hooks';
import { haptics } from '../../../utils/haptics';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import AppIcon from '../../../components/common/AppIcon';
import GlobalLoader from '../../../components/common/GlobalLoader';
import type { Theme } from '../../../theme';
import { usersApi } from '../../../services/api/users.api';

export default function EditProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const styles = useMemo(
    () => createStyles(theme, isDesktop),
    [theme, isDesktop],
  );

  const { user } = useAuthStore();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [bio, setBio] = useState(user?.bio || '');

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isBioFocused, setIsBioFocused] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setIsUploadingAvatar(true);
        const response = await usersApi.uploadProfilePicture(
          result.assets[0].uri,
        );
        if (response.data?.photoURL) {
          setAvatar(response.data.photoURL);
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Upload Failed',
        error.message || 'Could not upload avatar image.',
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = useCallback(() => {
    const normalizedName = displayName.trim();
    const normalizedPhone = phoneNumber.trim();
    const normalizedBio = bio.trim();

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      Alert.alert(
        'Invalid Name',
        'Your display name must be between 2 and 80 characters.',
      );
      return;
    }
    if (normalizedPhone && !/^\+?[0-9][0-9\s-]{6,19}$/.test(normalizedPhone)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid phone number including country code.',
      );
      return;
    }
    if (normalizedBio.length > 500) {
      Alert.alert('Bio Too Long', 'Your bio can contain up to 500 characters.');
      return;
    }

    const updates: any = {};
    if (normalizedName !== (user?.displayName || ''))
      updates.displayName = normalizedName;
    if (avatar.trim() !== (user?.avatar || '')) updates.avatar = avatar.trim();
    if (normalizedPhone !== (user?.phoneNumber || ''))
      updates.phoneNumber = normalizedPhone;
    if (normalizedBio !== (user?.bio || '')) updates.bio = normalizedBio;

    if (Object.keys(updates).length === 0) {
      router.back();
      return;
    }

    updateProfile(updates, {
      onSuccess: () => {
        haptics.success();
        Alert.alert(
          'Profile Updated',
          'Your changes have been saved successfully.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      },
      onError: (error: any) =>
        Alert.alert('Notice', error.message || 'Failed to update profile.'),
    });
  }, [displayName, phoneNumber, bio, avatar, user, updateProfile]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Sticky Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10 },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon name="x" size={18} color={theme.colors.textPrimary} />
            </Pressable>

            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Edit Profile
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                Update personal identity & preferences
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={isPending}
            style={({ pressed }) => [
              styles.saveActionPill,
              { backgroundColor: theme.colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            {isPending ? (
              <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
            ) : (
              <>
                <AppIcon name="check" size={14} color="#FFFFFF" />
                <Text style={styles.saveActionText}>Save Changes</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Main Content Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          {/* ── PROFILE INFO CARD ── */}
          <View
            style={[
              styles.panelCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.panelHeader}>
              <View
                style={[styles.panelIconWrap, { backgroundColor: '#EFF6FF' }]}
              >
                <AppIcon name="user" size={16} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.panelTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Identity & Contact
                </Text>
                <Text
                  style={[
                    styles.panelSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Public profile details visible to your travel crew
                </Text>
              </View>
            </View>

            {/* Avatar Section */}
            <View style={styles.avatarRow}>
              <View
                style={[
                  styles.avatarContainer,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                {isUploadingAvatar ? (
                  <GlobalLoader
                    variant="inline"
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImage} />
                ) : (
                  <Text
                    style={[
                      styles.avatarPlaceholder,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {displayName?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={handlePickAvatar}
                disabled={isUploadingAvatar}
                style={({ pressed }) => [
                  styles.avatarUploadBtn,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(15,23,42,0.06)',
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <AppIcon name="camera" size={14} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.avatarUploadText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {isUploadingAvatar ? 'Uploading…' : 'Change Avatar'}
                </Text>
              </Pressable>
            </View>

            {/* Display Name Input */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.textTertiary },
                ]}
              >
                DISPLAY NAME *
              </Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: isNameFocused
                      ? theme.colors.primary
                      : theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(15,23,42,0.06)',
                  },
                  isNameFocused && styles.inputFocused,
                ]}
              >
                <AppIcon
                  name="user"
                  size={15}
                  color={theme.colors.textTertiary}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Manish Sharma"
                  placeholderTextColor={theme.colors.textTertiary}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  maxLength={80}
                />
              </View>
            </View>

            {/* Phone Number Input */}
            <View style={styles.fieldGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.textTertiary },
                ]}
              >
                PHONE NUMBER
              </Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: isPhoneFocused
                      ? theme.colors.primary
                      : theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(15,23,42,0.06)',
                  },
                  isPhoneFocused && styles.inputFocused,
                ]}
              >
                <AppIcon
                  name="phone"
                  size={15}
                  color={theme.colors.textTertiary}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="phone-pad"
                  onFocus={() => setIsPhoneFocused(true)}
                  onBlur={() => setIsPhoneFocused(false)}
                />
              </View>
            </View>

            {/* Bio Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  BIO (OPTIONAL)
                </Text>
                <Text
                  style={[
                    styles.charCountText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {bio.length}/500
                </Text>
              </View>
              <View
                style={[
                  styles.textAreaBox,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: isBioFocused
                      ? theme.colors.primary
                      : theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(15,23,42,0.06)',
                  },
                  isBioFocused && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={[
                    styles.textAreaInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Share a quick note about your travel style or bucket list..."
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  onFocus={() => setIsBioFocused(true)}
                  onBlur={() => setIsBioFocused(false)}
                />
              </View>
            </View>
          </View>

          {/* ── VERIFIED EMAIL CARD ── */}
          <View
            style={[
              styles.emailCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.emailRow}>
              <View
                style={[styles.panelIconWrap, { backgroundColor: '#ECFDF5' }]}
              >
                <AppIcon name="mail" size={16} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.emailLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  VERIFIED ACCOUNT EMAIL
                </Text>
                <Text
                  style={[
                    styles.emailValue,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {user?.email || 'No email associated'}
                </Text>
              </View>
              <Badge label="Verified" variant="success" />
            </View>
          </View>

          {/* ── BANKING & PAYOUTS SHORTCUT ── */}
          <Pressable
            onPress={() => router.push('/profile/banking' as any)}
            style={({ pressed }) => [
              styles.shortcutCard,
              { backgroundColor: theme.colors.surface },
              pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
            ]}
          >
            <View
              style={[styles.panelIconWrap, { backgroundColor: '#FEF3C7' }]}
            >
              <AppIcon name="credit-card" size={16} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.shortcutTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Banking & Payout Methods
              </Text>
              <Text
                style={[
                  styles.shortcutSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Configure UPI IDs and bank account routing for splits
              </Text>
            </View>
            <AppIcon
              name="chevron-right"
              size={16}
              color={theme.colors.textTertiary}
            />
          </Pressable>

          {/* ── DANGER ZONE SHORTCUT ── */}
          <Pressable
            onPress={() => router.push('/profile/danger-zone' as any)}
            style={({ pressed }) => [
              styles.shortcutCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: 'rgba(239,68,68,0.2)',
              },
              pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] },
            ]}
          >
            <View
              style={[styles.panelIconWrap, { backgroundColor: '#FEE2E2' }]}
            >
              <AppIcon name="trash-2" size={16} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.shortcutTitle, { color: '#EF4444' }]}>
                Account Danger Zone
              </Text>
              <Text
                style={[
                  styles.shortcutSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Permanently purge data or close profile account
              </Text>
            </View>
            <AppIcon
              name="chevron-right"
              size={16}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

function createStyles(theme: Theme, isDesktop: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scrollView: { flex: 1 },
    scrollContent: {
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    mainWrapper: {
      maxWidth: 820,
      alignSelf: 'center',
      width: '100%',
      gap: 14,
    },

    // Header Bar
    headerBar: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
      zIndex: 10,
    },
    headerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: 820,
      alignSelf: 'center',
      width: '100%',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    headerSub: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 1,
    },
    saveActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
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
    saveActionText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },

    // Panels
    panelCard: {
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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

      gap: 16,
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    panelIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    panelTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    panelSub: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
    },

    // Avatar Row
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 4,
    },
    avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: 22,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(15,23,42,0.06)',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      fontSize: 22,
      fontWeight: '900',
    },
    avatarUploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
    },
    avatarUploadText: {
      fontSize: 13,
      fontWeight: '800',
    },

    // Fields
    fieldGroup: {
      gap: 6,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fieldLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    charCountText: {
      fontSize: 10,
      fontWeight: '700',
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
    },
    inputFocused: {
      borderWidth: 1.5,

      ...Platform.select({
        web: {
          boxShadow: '0 0 0 3px rgba(37,99,235,0.12)',
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
    textInput: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: '600',
      padding: 0,
    },
    textAreaBox: {
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minHeight: 84,
    },
    textAreaInput: {
      fontSize: 13,
      fontWeight: '500',
      textAlignVertical: 'top',
      padding: 0,
      minHeight: 64,
    },

    // Email Card
    emailCard: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
    emailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    emailLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    emailValue: {
      fontSize: 13,
      fontWeight: '800',
      marginTop: 1,
    },

    // Shortcut Cards
    shortcutCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
    shortcutTitle: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    shortcutSub: {
      fontSize: 11.5,
      fontWeight: '500',
      marginTop: 1,
    },
  });
}
// import GlobalLoader from '../../../components/common/GlobalLoader';
// import AppIcon  from '../../../components/common/AppIcon';
// // app/(app)/profile/edit.tsx
// import React, { useState, useMemo } from 'react';
// import { View, Text, StyleSheet, TextInput, ScrollView, Alert, Switch, Platform, useWindowDimensions, Pressable, PressableStateCallbackType, Image } from 'react-native';
// import { router } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useTheme } from '../../../providers/ThemeProvider';
// import { useGlobalStyles } from '../../../hooks/useGlobalStyles';
// import { useAuthStore } from '../../../stores/auth.store';
// import { useThemeStore } from '../../../stores/theme.store';
// import { useUpdateProfile } from '../../../hooks';
// import { haptics } from '../../../utils/haptics';
// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import { LinearGradient } from 'expo-linear-gradient';
// import * as ImagePicker from 'expo-image-picker';
// import { usersApi } from '../../../services/api/users.api';
// import { Badge } from '../../../components/ui/Badge';

// type ThemeOption = 'light' | 'dark' | 'system';
// type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// export default function EditProfileScreen() {
//     const theme = useTheme();
//     const globalStyles = useGlobalStyles();
//     const styles = useStyles();
//     const insets = useSafeAreaInsets();
//     const { width } = useWindowDimensions();

//     const { user } = useAuthStore();
//     const { mode, setMode, isDark } = useThemeStore();
//     const { mutate: updateProfile, isPending } = useUpdateProfile();
//     const [displayName, setDisplayName] = useState(user?.displayName || '');
//     const [avatar, setAvatar] = useState(user?.avatar || '');
//     const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
//     const [bio, setBio] = useState(user?.bio || '');

//     const [isNameFocused, setIsNameFocused] = useState(false);
//     const [isPhoneFocused, setIsPhoneFocused] = useState(false);
//     const [isBioFocused, setIsBioFocused] = useState(false);
//     const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

//     const isWebDesktop = Platform.OS === 'web' && width > 768;

//     const handlePickAvatar = async () => {
//         try {
//             const result = await ImagePicker.launchImageLibraryAsync({
//                 mediaTypes: ImagePicker.MediaTypeOptions.Images,
//                 allowsEditing: true,
//                 aspect: [1, 1],
//                 quality: 0.8,
//             });

//             if (!result.canceled && result.assets?.[0]) {
//                 setIsUploadingAvatar(true);
//                 const response = await usersApi.uploadProfilePicture(result.assets[0].uri);
//                 if (response.data?.photoURL) {
//                     setAvatar(response.data.photoURL);
//                 }
//             }
//         } catch (error: any) {
//             Alert.alert('Upload Failed', error.message || 'Could not upload avatar');
//         } finally {
//             setIsUploadingAvatar(false);
//         }
//     };

//     const handleSave = () => {
//         const normalizedName = displayName.trim();
//         const normalizedPhone = phoneNumber.trim();
//         const normalizedBio = bio.trim();

//         if (normalizedName.length < 2 || normalizedName.length > 80) {
//             Alert.alert('Check your name', 'Your display name must be between 2 and 80 characters.');
//             return;
//         }
//         if (normalizedPhone && !/^\+?[0-9][0-9\s-]{6,19}$/.test(normalizedPhone)) {
//             Alert.alert('Check your phone number', 'Use a valid phone number, including an optional country code.');
//             return;
//         }
//         if (normalizedBio.length > 500) {
//             Alert.alert('Bio is too long', 'Your bio can contain up to 500 characters.');
//             return;
//         }

//         const updates: any = {};
//         if (normalizedName !== (user?.displayName || '')) updates.displayName = normalizedName;
//         if (avatar.trim() !== (user?.avatar || '')) updates.avatar = avatar.trim();
//         if (normalizedPhone !== (user?.phoneNumber || '')) updates.phoneNumber = normalizedPhone;
//         if (normalizedBio !== (user?.bio || '')) updates.bio = normalizedBio;

//         if (Object.keys(updates).length === 0) {
//             router.back();
//             return;
//         }

//         updateProfile(updates, {
//             onSuccess: () => {
//                 haptics.success();
//                 Alert.alert('Profile updated', 'Your changes have been saved.', [{ text: 'OK', onPress: () => router.back() }]);
//             },
//             onError: (error: any) => Alert.alert('Error', error.message),
//         });
//     };

//     return (
//         <View style={[styles.container, { backgroundColor: 'transparent' }]}>
//             {/* Global Gradient Background */}
//             <View style={StyleSheet.absoluteFill} pointerEvents="none">
//                 <GlobalBackground />
//             </View>

//             <View style={[styles.webDesktopContent, isWebDesktop && styles.webDesktopContentCentered]}>

//                 {/* Premium Header */}
//                 <View style={[styles.header, {
//                     paddingTop: Platform.OS === 'web' ? theme.spacing['4'] : insets.top + 16,
//                     borderBottomColor: theme.colors.borderLight,
//                     backgroundColor: theme.colors.surface
//                 }]}>
//                     <Pressable
//                         onPress={() => router.back()}
//                         style={({ hovered }: WebPressableState) => [
//                             styles.headerBtn,
//                             { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight },
//                             Platform.OS === 'web' && hovered && { opacity: 0.7, cursor: 'pointer' } as any
//                         ]}
//                         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                     >
//                         <AppIcon name="x" size={22} color={theme.colors.textSecondary} />
//                     </Pressable>

//                     <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Edit Profile</Text>

//                     <Pressable
//                         onPress={handleSave}
//                         disabled={isPending}
//                         style={({ hovered, pressed }: WebPressableState) => [
//                             styles.saveBtnWrap,
//                             Platform.OS === 'web' && hovered && !isPending && { opacity: 0.7, cursor: 'pointer' } as any,
//                             pressed && !isPending && styles.pressedState
//                         ]}
//                         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//                     >
//                         {isPending ? (
//                             <GlobalLoader variant="inline" size="small" color={theme.colors.primary}  />
//                         ) : (
//                             <Text style={[styles.saveBtn, { color: theme.colors.primary }]}>Save</Text>
//                         )}
//                     </Pressable>
//                 </View>

//                 <ScrollView
//                     contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 60 : insets.bottom + 40 }]}
//                     showsVerticalScrollIndicator={false}
//                 >
//                     {/* Profile Fields Section */}
//                     <View style={styles.section}>
//                         <View style={styles.sectionHeader}>
//                             <AppIcon name="user" size={14} color={theme.colors.primary} />
//                             <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Profile Info</Text>
//                         </View>

//                         <GlassCard style={styles.cardGlass} intensity={theme.isDark ? 12 : 6}>
//                             {/* Avatar */}
//                             <View style={styles.fieldGroup}>
//                                 <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Profile Picture</Text>
//                                 <View style={styles.avatarRow}>
//                                     <View style={[styles.avatarContainer, {
//                                         backgroundColor: theme.colors.primaryBg,
//                                         borderColor: theme.colors.borderLight
//                                     }]}>
//                                         {isUploadingAvatar ? (
//                                             <GlobalLoader variant="inline" color={theme.colors.primary}  />
//                                         ) : avatar ? (
//                                             <Image source={{ uri: avatar }} style={styles.avatarImage} />
//                                         ) : (
//                                             <Text style={[styles.avatarPlaceholder, { color: theme.colors.primary }]}>
//                                                 {displayName?.charAt(0)?.toUpperCase() || '?'}
//                                             </Text>
//                                         )}
//                                     </View>
//                                     <Pressable
//                                         style={[styles.avatarBtn, {
//                                             backgroundColor: theme.colors.primaryBg,
//                                             borderColor: theme.colors.borderLight
//                                         }]}
//                                         onPress={handlePickAvatar}
//                                     >
//                                         <AppIcon name="camera" size={16} color={theme.colors.primary} />
//                                         <Text style={[styles.avatarBtnText, { color: theme.colors.primary }]}>Change Photo</Text>
//                                     </Pressable>
//                                 </View>
//                             </View>

//                             {/* Display Name */}
//                             <View style={styles.fieldGroup}>
//                                 <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                                     Display Name
//                                 </Text>
//                                 <View style={[styles.inputContainer, {
//                                     borderColor: isNameFocused ? theme.colors.primary : theme.colors.borderLight,
//                                     backgroundColor: theme.colors.surface
//                                 }, isNameFocused && styles.inputFocused]}>
//                                     <AppIcon name="user" size={16} color={theme.colors.textTertiary} style={styles.inputIcon} />
//                                     <TextInput
//                                         style={[styles.input, { color: theme.colors.textPrimary }]}
//                                         value={displayName}
//                                         onChangeText={setDisplayName}
//                                         placeholder="e.g. John Doe"
//                                         placeholderTextColor={theme.colors.textTertiary}
//                                         onFocus={() => setIsNameFocused(true)}
//                                         onBlur={() => setIsNameFocused(false)}
//                                     />
//                                 </View>
//                             </View>

//                             {/* Phone Number */}
//                             <View style={styles.fieldGroup}>
//                                 <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                                     Phone Number
//                                 </Text>
//                                 <View style={[styles.inputContainer, {
//                                     borderColor: isPhoneFocused ? theme.colors.primary : theme.colors.borderLight,
//                                     backgroundColor: theme.colors.surface
//                                 }, isPhoneFocused && styles.inputFocused]}>
//                                     <AppIcon name="phone" size={16} color={theme.colors.textTertiary} style={styles.inputIcon} />
//                                     <TextInput
//                                         style={[styles.input, { color: theme.colors.textPrimary }]}
//                                         value={phoneNumber}
//                                         onChangeText={setPhoneNumber}
//                                         placeholder="+91 99999 99999"
//                                         placeholderTextColor={theme.colors.textTertiary}
//                                         keyboardType="phone-pad"
//                                         onFocus={() => setIsPhoneFocused(true)}
//                                         onBlur={() => setIsPhoneFocused(false)}
//                                     />
//                                 </View>
//                             </View>

//                             {/* Bio */}
//                             <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
//                                 <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                                     Bio <Text style={[styles.optionalText, { color: theme.colors.textTertiary }]}>(optional)</Text>
//                                 </Text>
//                                 <View style={[styles.inputContainer, styles.bioInputContainer, {
//                                     borderColor: isBioFocused ? theme.colors.primary : theme.colors.borderLight,
//                                     backgroundColor: theme.colors.surface
//                                 }, isBioFocused && styles.inputFocused]}>
//                                     <TextInput
//                                         style={[styles.input, styles.textArea, { color: theme.colors.textPrimary }]}
//                                         value={bio}
//                                         onChangeText={setBio}
//                                         placeholder="Tell us a little about your travel style..."
//                                         placeholderTextColor={theme.colors.textTertiary}
//                                         multiline
//                                         maxLength={500}
//                                         onFocus={() => setIsBioFocused(true)}
//                                         onBlur={() => setIsBioFocused(false)}
//                                     />
//                                     <Text style={[styles.charCount, { color: theme.colors.textTertiary }]}>
//                                         {bio.length}/500
//                                     </Text>
//                                 </View>
//                             </View>
//                         </GlassCard>
//                     </View>

//                     {/* Payments Section */}
//                     <View style={styles.section}>
//                         <View style={styles.sectionHeader}>
//                             <AppIcon name="credit-card" size={14} color={theme.colors.secondary} />
//                             <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Payments</Text>
//                         </View>

//                         <Pressable
//                             style={({ hovered, pressed }: WebPressableState) => [
//                                 Platform.OS === 'web' && hovered && styles.cardHovered,
//                                 pressed && styles.pressedState
//                             ]}
//                             onPress={() => router.push('/profile/banking')}
//                         >
//                             <GlassCard style={styles.cardGlass} intensity={theme.isDark ? 12 : 6}>
//                                 <View style={styles.menuRow}>
//                                     <View style={[styles.menuIconWrap, { backgroundColor: theme.colors.secondaryBg }]}>
//                                         <AppIcon name="credit-card" size={20} color={theme.colors.secondary} />
//                                     </View>
//                                     <View style={styles.menuTextContainer}>
//                                         <Text style={[styles.menuTitle, { color: theme.colors.textPrimary }]}>
//                                             Banking & Payouts
//                                         </Text>
//                                         <Text style={[styles.menuSub, { color: theme.colors.textSecondary }]}>
//                                             Manage UPI and bank details
//                                         </Text>
//                                     </View>
//                                     <AppIcon name="chevron-right" size={18} color={theme.colors.textTertiary} />
//                                 </View>
//                             </GlassCard>
//                         </Pressable>
//                     </View>

//                     {/* Email Info */}
//                     <GlassCard style={styles.emailCard} intensity={theme.isDark ? 8 : 4}>
//                         <View style={styles.emailRow}>
//                             <AppIcon name="mail" size={16} color={theme.colors.textTertiary} />
//                             <Text style={[styles.emailText, { color: theme.colors.textSecondary }]}>
//                                 Email: {user?.email}
//                             </Text>
//                             <Badge label="Verified" variant="success" style={styles.emailBadge} />
//                         </View>
//                         <Text style={[styles.emailNote, { color: theme.colors.textTertiary }]}>
//                             Email cannot be changed
//                         </Text>
//                     </GlassCard>

//                     {/* Danger Zone Section */}
//                     <View style={[styles.section, { marginTop: 32 }]}>
//                         <View style={styles.sectionHeader}>
//                             <AppIcon name="alert-triangle" size={14} color={theme.colors.danger} />
//                             <Text style={[styles.sectionLabel, { color: theme.colors.danger }]}>Danger Zone</Text>
//                         </View>

//                         <Pressable
//                             style={({ hovered, pressed }: WebPressableState) => [
//                                 Platform.OS === 'web' && hovered && styles.cardHovered,
//                                 pressed && styles.pressedState
//                             ]}
//                             onPress={() => router.push('/profile/danger-zone')}
//                         >
//                             <GlassCard style={[styles.cardGlass, { borderColor: theme.colors.danger + '30' }]} intensity={theme.isDark ? 12 : 6}>
//                                 <View style={styles.menuRow}>
//                                     <View style={[styles.menuIconWrap, { backgroundColor: theme.colors.dangerBg }]}>
//                                         <AppIcon name="trash-2" size={20} color={theme.colors.danger} />
//                                     </View>
//                                     <View style={styles.menuTextContainer}>
//                                         <Text style={[styles.menuTitle, { color: theme.colors.danger }]}>
//                                             Delete Account
//                                         </Text>
//                                         <Text style={[styles.menuSub, { color: theme.colors.textSecondary }]}>
//                                             Permanently delete your data
//                                         </Text>
//                                     </View>
//                                     <AppIcon name="chevron-right" size={18} color={theme.colors.textTertiary} />
//                                 </View>
//                             </GlassCard>
//                         </Pressable>
//                     </View>

//                 </ScrollView>
//             </View>
//         </View>
//     );
// }

// // ============================================================
// // Premium Styles - Updated for Full Width on Web
// // ============================================================

// const useStyles = () => {
//     const theme = useTheme();
//     const { width } = useWindowDimensions();
//     const isWebDesktop = Platform.OS === 'web' && width > 768;

//     return useMemo(() => StyleSheet.create({
//         container: {
//             flex: 1,
//             backgroundColor: 'transparent',
//         },

//         // Widescreen wrapper - FULL WIDTH on web
//         webDesktopContent: {
//             flex: 1,
//             width: '100%',
//             maxWidth: isWebDesktop ? 800 : '100%', // Wider on web
//             alignSelf: 'center',
//             paddingHorizontal: isWebDesktop ? 24 : 0,
//         },
//         webDesktopContentCentered: {
//             // Remove maxWidth constraint to use full width
//             width: '100%',
//         },

//         // Web Interaction Helpers
//         pressedState: {
//             opacity: 0.8,
//             transform: [{ scale: 0.98 }]
//         },

//         header: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             paddingHorizontal: 20,
//             paddingVertical: 16,
//             borderBottomWidth: 1,
//             borderBottomColor: theme.colors.borderLight,
//             borderTopLeftRadius: isWebDesktop ? theme.borderRadius['2xl'] : 0,
//             borderTopRightRadius: isWebDesktop ? theme.borderRadius['2xl'] : 0,
//             backgroundColor: theme.colors.surface,
//         },
//         headerBtn: {
//             width: 40,
//             height: 40,
//             borderRadius: 20,
//             alignItems: 'center',
//             justifyContent: 'center',
//             borderWidth: 1,
//             borderColor: theme.colors.borderLight,
//         },
//         headerTitle: {
//             fontSize: 17,
//             fontWeight: '700'
//         },
//         saveBtnWrap: {
//             padding: 4,
//         },
//         saveBtn: {
//             fontSize: 16,
//             fontWeight: '700'
//         },

//         content: {
//             padding: isWebDesktop ? 24 : 20,
//             paddingBottom: Platform.OS === 'web' ? 60 : 40,
//         },

//         // Sections
//         section: {
//             marginBottom: 24
//         },
//         sectionHeader: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 8,
//             marginBottom: 10,
//             marginLeft: 4,
//         },
//         sectionLabel: {
//             fontSize: 12,
//             fontWeight: '700',
//             textTransform: 'uppercase',
//             letterSpacing: 0.8,
//         },

//         cardGlass: {
//             padding: isWebDesktop ? 24 : 20,
//             borderRadius: 20,
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
//             ...theme.shadows.sm,
//         },
//         cardHovered: {
//             borderColor: theme.colors.borderDefault,
//         },

//         // Avatar
//         avatarRow: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 16,
//         },
//         avatarContainer: {
//             width: 64,
//             height: 64,
//             borderRadius: 32,
//             borderWidth: 2,
//             overflow: 'hidden',
//             justifyContent: 'center',
//             alignItems: 'center',
//         },
//         avatarImage: {
//             width: '100%',
//             height: '100%',
//         },
//         avatarPlaceholder: {
//             fontSize: 24,
//             fontWeight: '700',
//         },
//         avatarBtn: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 6,
//             paddingHorizontal: 14,
//             paddingVertical: 8,
//             borderRadius: 12,
//             borderWidth: 1,
//             borderColor: theme.colors.borderLight,
//         },
//         avatarBtnText: {
//             fontSize: 13,
//             fontWeight: '600',
//         },

//         // Menu Rows
//         menuRow: {
//             flexDirection: 'row',
//             alignItems: 'center'
//         },
//         menuIconWrap: {
//             width: 40,
//             height: 40,
//             borderRadius: 12,
//             alignItems: 'center',
//             justifyContent: 'center',
//             marginRight: 14,
//         },
//         menuTextContainer: {
//             flex: 1
//         },
//         menuTitle: {
//             fontSize: 15,
//             fontWeight: '600',
//             marginBottom: 2
//         },
//         menuSub: {
//             fontSize: 12,
//             fontWeight: '500'
//         },

//         fieldGroup: {
//             marginBottom: 18
//         },
//         fieldLabel: {
//             fontSize: 12,
//             fontWeight: '700',
//             marginBottom: 6,
//             letterSpacing: 0.3,
//         },
//         optionalText: {
//             fontWeight: '400'
//         },

//         inputContainer: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             borderWidth: 1,
//             borderRadius: 14,
//             overflow: 'hidden',
//             ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } : {}),
//         },
//         inputIcon: {
//             paddingLeft: 14,
//         },
//         input: {
//             flex: 1,
//             paddingHorizontal: 12,
//             paddingVertical: 14,
//             fontSize: 15,
//             fontWeight: '500',
//             height: '100%',
//         },
//         inputFocused: {
//             borderColor: theme.colors.primary,
//             ...Platform.select({ web: { boxShadow: `0 0 0 4px ${theme.colors.primary}25` } as any })
//         },
//         bioInputContainer: {
//             flexDirection: 'column',
//             alignItems: 'stretch',
//             paddingVertical: 0,
//         },
//         textArea: {
//             height: 80,
//             textAlignVertical: 'top',
//             paddingTop: 14
//         },
//         charCount: {
//             fontSize: 11,
//             fontWeight: '500',
//             paddingHorizontal: 14,
//             paddingBottom: 10,
//             textAlign: 'right',
//         },

//         // Email Card
//         emailCard: {
//             padding: 16,
//             borderRadius: 16,
//             marginBottom: 24,
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
//         },
//         emailRow: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 10,
//         },
//         emailText: {
//             fontSize: 14,
//             fontWeight: '500',
//             flex: 1,
//         },
//         emailBadge: {
//             paddingHorizontal: 8,
//             paddingVertical: 2,
//         },
//         emailNote: {
//             fontSize: 12,
//             fontWeight: '500',
//             marginTop: 6,
//             paddingLeft: 26,
//         },
//     }), [theme, isWebDesktop]);
// };
