// app/(app)/settings/privacy.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  Pressable,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../providers/ThemeProvider';
import { useAuthStore } from '../../stores/auth.store';
import { biometricAuth } from '../../services/biometrics/biometricAuth';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { Avatar } from '../../components/ui/Avatar';
import AppIcon from '../../components/common/AppIcon';
import GlobalLoader from '../../components/common/GlobalLoader';
import { haptics } from '../../utils/haptics';
import type { Theme } from '../../theme';

// ─── Setting Toggle Row ──────────────────────────────────────
function SettingToggle({
  icon,
  title,
  description,
  value,
  onToggle,
  disabled,
}: {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.settingRow, disabled && { opacity: 0.5 }]}>
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.settingIconAura,
            { backgroundColor: `${theme.colors.primary}12` },
          ]}
        >
          <AppIcon name={icon as any} size={16} color={theme.colors.primary} />
        </View>
        <View style={styles.settingInfo}>
          <Text
            style={[styles.settingTitle, { color: theme.colors.textPrimary }]}
          >
            {title}
          </Text>
          <Text
            style={[styles.settingDesc, { color: theme.colors.textSecondary }]}
          >
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{
          false: theme.colors.borderLight,
          true: theme.colors.primary,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.colors.borderLight}
      />
    </View>
  );
}

// ─── Setting Button Row ──────────────────────────────────────
function SettingButton({
  icon,
  title,
  description,
  onPress,
  rightText,
  danger,
  disabled,
}: {
  icon: string;
  title: string;
  description?: string;
  onPress: () => void;
  rightText?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          haptics.light();
          onPress();
        }
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.settingRow,
        disabled && { opacity: 0.6 },
        pressed &&
          !disabled && {
            opacity: 0.75,
            backgroundColor: theme.colors.background,
          },
      ]}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.settingIconAura,
            {
              backgroundColor: danger
                ? 'rgba(239,68,68,0.12)'
                : `${theme.colors.primary}12`,
            },
          ]}
        >
          <AppIcon
            name={icon as any}
            size={16}
            color={danger ? '#EF4444' : theme.colors.primary}
          />
        </View>
        <View style={styles.settingInfo}>
          <Text
            style={[
              styles.settingTitle,
              { color: danger ? '#EF4444' : theme.colors.textPrimary },
            ]}
          >
            {title}
          </Text>
          {description && (
            <Text
              style={[
                styles.settingDesc,
                { color: theme.colors.textSecondary },
              ]}
            >
              {description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.settingRight}>
        {rightText && (
          <Text
            style={[styles.rightText, { color: theme.colors.textTertiary }]}
          >
            {rightText}
          </Text>
        )}
        {!disabled && (
          <AppIcon
            name="chevron-right"
            size={15}
            color={theme.colors.textTertiary}
          />
        )}
      </View>
    </Pressable>
  );
}

// ─── Main Screen Component ───────────────────────────────────
export default function PrivacyScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, firebaseUser } = useAuthStore();

  const isDesktop = width >= 860;
  const hasPassword = firebaseUser?.providerData?.some(
    (p: any) => p.providerId === 'password',
  );

  const [biometricEnabled, setBiometricEnabled] = useState(
    biometricAuth.isEnabled(),
  );
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    biometricAuth.isAvailable().then(setBiometricAvailable);
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      setIsLoading(true);
      const success = await biometricAuth.authenticate();
      setIsLoading(false);
      if (success) {
        biometricAuth.enable();
        setBiometricEnabled(true);
      }
    } else {
      biometricAuth.disable();
      setBiometricEnabled(false);
    }
  };

  const handleClearCache = useCallback(async () => {
    haptics.medium();
    try {
      const { storage } = await import('../../utils/storage');
      const { queryClient } = await import('../../providers/QueryProvider');
      await storage.clearCachedData();
      queryClient.clear();
      Alert.alert(
        'Local Cache Cleared',
        'Your local cache has been reset. Fresh telemetry and trip data will load as you use the app.',
      );
    } catch {
      Alert.alert('Notice', 'Could not clear cache. Please try again.');
    }
  }, []);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Sticky Top Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10 },
        ]}
      >
        <View
          style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}
        >
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                haptics.light();
                router.back();
              }}
              style={({ pressed }) => [
                styles.headerBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="arrow-left"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>

            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Privacy & Security
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                Biometric authorization & account protection
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
      >
        <View style={styles.mainWrapper}>
          {/* Top Account Identity Hero Card */}
          <GlassCard
            intensity={theme.isDark ? 24 : 36}
            style={styles.heroAccountCard}
          >
            <LinearGradient
              colors={
                theme.isDark
                  ? [
                      'rgba(15, 23, 42, 0.40)',
                      'rgba(30, 27, 75, 0.35)',
                      'rgba(30, 41, 59, 0.40)',
                    ]
                  : [
                      'rgba(255, 255, 255, 0.75)',
                      'rgba(241, 245, 249, 0.65)',
                      'rgba(255, 255, 255, 0.80)',
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroTopRow}>
              <Avatar
                url={user?.photoURL}
                fallback={user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                size="lg"
                ringColor="#38BDF8"
              />

              <View style={styles.heroInfo}>
                <View style={styles.heroNameRow}>
                  <Text
                    style={[
                      styles.heroNameText,
                      {
                        color: theme.isDark
                          ? '#FFFFFF'
                          : theme.colors.textPrimary,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {user?.displayName || 'Traveler'}
                  </Text>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>ACTIVE SESSION</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.heroEmailText,
                    {
                      color: theme.isDark
                        ? 'rgba(255,255,255,0.7)'
                        : theme.colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {user?.email || 'No email registered'}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* ── 2-COLUMN BENTO SETTINGS GRID ── */}
          <View style={[styles.bentoGrid, !isDesktop && styles.stackLayout]}>
            {/* ── LEFT COLUMN: AUTHENTICATION & SECURITY ── */}
            <View style={styles.bentoColumn}>
              <Text
                style={[
                  styles.sectionHeading,
                  { color: theme.colors.textTertiary },
                ]}
              >
                AUTHENTICATION & ACCESS
              </Text>

              <GlassCard
                style={styles.bentoCardPanel}
                intensity={theme.isDark ? 18 : 30}
              >
                {biometricAvailable && (
                  <SettingToggle
                    icon="shield-check"
                    title="Biometric App Lock"
                    description="Protect app entry using FaceID or Fingerprint authentication"
                    value={biometricEnabled}
                    onToggle={handleBiometricToggle}
                    disabled={isLoading}
                  />
                )}

                <SettingButton
                  icon="key"
                  title={hasPassword ? 'Change Password' : 'Set Password'}
                  description={
                    hasPassword
                      ? 'Update your master login credentials'
                      : 'Create a password for direct login'
                  }
                  onPress={() =>
                    router.push(
                      hasPassword
                        ? '/(app)/profile/change-password'
                        : '/(auth)/set-password',
                    )
                  }
                />

                <SettingButton
                  icon="smartphone"
                  title="Two-Factor Authentication (2FA)"
                  description="Hardware & authenticator app verification"
                  rightText="Coming Soon"
                  onPress={() => {}}
                  disabled
                />
              </GlassCard>
            </View>

            {/* ── RIGHT COLUMN: DATA, CACHE & DANGER ZONE ── */}
            <View style={styles.bentoColumn}>
              <Text
                style={[
                  styles.sectionHeading,
                  { color: theme.colors.textTertiary },
                ]}
              >
                DATA & SYSTEM CONTROLS
              </Text>

              <GlassCard
                style={styles.bentoCardPanel}
                intensity={theme.isDark ? 18 : 30}
              >
                <SettingButton
                  icon="trash-2"
                  title="Clear Local Cache"
                  description="Remove cached trip logs and temporary media files"
                  danger
                  onPress={handleClearCache}
                />
              </GlassCard>

              <Text
                style={[
                  styles.sectionHeading,
                  { color: '#EF4444', marginTop: 12 },
                ]}
              >
                DANGER ZONE
              </Text>

              <GlassCard
                style={[
                  styles.bentoCardPanel,
                  { borderColor: 'rgba(239,68,68,0.3)' },
                ]}
                intensity={theme.isDark ? 18 : 30}
              >
                <SettingButton
                  icon="alert-triangle"
                  title="Delete Account"
                  description="Permanently delete profile and personal balance histories"
                  rightText="Protected"
                  danger
                  onPress={() => {}}
                  disabled
                />
              </GlassCard>
            </View>
          </View>

          {/* Footer Telemetry */}
          <Text
            style={[styles.footerText, { color: theme.colors.textTertiary }]}
          >
            Wakeru v1.0.0 • Secured with 256-bit Encrypted Token Architecture
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    scrollView: { flex: 1 },

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
      width: '100%',
    },
    desktopHeaderInner: {
      maxWidth: 1200,
      alignSelf: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerBtn: {
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

    // Content Body
    scrollContent: {
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    desktopScrollContent: {
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },
    mainWrapper: {
      gap: 16,
    },

    // Hero Account Card
    heroAccountCard: {
      borderRadius: 22,
      overflow: 'hidden',
      padding: 18,

      ...Platform.select({
        web: {
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.15)',
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
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    heroInfo: {
      flex: 1,
      gap: 2,
    },
    heroNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    heroNameText: {
      fontSize: 17,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    heroEmailText: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '500',
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(16,185,129,0.2)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(16,185,129,0.3)',
    },
    activeDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#10B981',
    },
    activeBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#34D399',
    },

    // Bento Grid Layout
    bentoGrid: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'flex-start',
    },
    stackLayout: {
      flexDirection: 'column',
    },
    bentoColumn: {
      flex: 1,
      gap: 10,
      width: '100%',
    },
    sectionHeading: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      paddingLeft: 4,
    },
    bentoCardPanel: {
      borderRadius: 20,
      overflow: 'hidden',
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

    // Row Styles
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.03)',
      gap: 12,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    settingIconAura: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingInfo: {
      flex: 1,
      gap: 2,
    },
    settingTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    settingDesc: {
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: '500',
    },
    settingRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rightText: {
      fontSize: 11,
      fontWeight: '600',
    },

    // Footer
    footerText: {
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '600',
      paddingVertical: 16,
    },
  });
}
