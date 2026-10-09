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

            <View style={styles.headerTitleWrap}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                Edit Profile
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
                numberOfLines={1}
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
                <Text style={styles.saveActionText}>
                  {isDesktop ? 'Save Changes' : 'Save'}
                </Text>
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
                  scrollEnabled={false}
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
      gap: 12,
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minWidth: 0,
    },
    headerTitleWrap: {
      flex: 1,
      minWidth: 0,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    headerSub: {
      fontSize: 11.5,
      fontWeight: '500',
      marginTop: 1,
    },
    saveActionPill: {
      flexShrink: 0,
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
      borderColor: theme.colors.primary,
      ...Platform.select({
        web: {
          boxShadow: `0 0 0 3px ${theme.colors.primary}25`,
        } as any,
      }),
    },
    textInput: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: '600',
      padding: 0,
      ...Platform.select({
        web: {
          outlineStyle: 'none',
          outlineWidth: 0,
        } as any,
      }),
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
      ...Platform.select({
        web: {
          outlineStyle: 'none',
          outlineWidth: 0,
        } as any,
      }),
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
