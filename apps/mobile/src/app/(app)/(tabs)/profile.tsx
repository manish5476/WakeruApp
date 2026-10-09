import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Platform,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
  Linking,
  Image,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useAuthStore } from '../../../stores/auth.store';
import { useVerifyUpi } from '../../../hooks';
import { useQuickStats } from '../../../hooks/useAnalytics';
import { achievements } from '../../../utils/achievements';
import { useTheme } from '../../../providers/ThemeProvider';
import { storage } from '../../../utils/storage';
import { useEntitlements } from '../../../hooks/useEntitlements';
import { AdminBroadcastModal } from '../../../components/admin/AdminBroadcastModal';
import { AppAboutModal } from '../../../components/common/AppAboutModal';
import { APP_NAME, SUPPORT_EMAIL } from '../../../config/branding';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// ============================================================
// Helper Components
// ============================================================

function MenuRow({
  icon,
  title,
  sub,
  onPress,
  rightElement,
  isDestructive,
  hideBorder,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
  hideBorder?: boolean;
}) {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const content = (
    <View style={[styles.menuRow, hideBorder && { borderBottomWidth: 0 }]}>
      <View
        style={[
          styles.menuIconWrap,
          {
            backgroundColor: isDestructive
              ? `${theme.colors.danger}15`
              : `${theme.colors.primary}12`,
          },
        ]}
      >
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<any>, {
              color: isDestructive ? theme.colors.danger : theme.colors.primary,
              size: 18,
            })
          : icon}
      </View>
      <View style={styles.menuTextWrap}>
        <Text
          style={[
            styles.menuTitle,
            isDestructive && { color: theme.colors.danger },
          ]}
        >
          {title}
        </Text>
        {sub && (
          <Text style={styles.menuSub} numberOfLines={1}>
            {sub}
          </Text>
        )}
      </View>
      {rightElement || (
        <AppIcon
          name="chevron-right"
          size={16}
          color={theme.colors.textTertiary}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ hovered, pressed }: WebPressableState) => [
          Platform.OS === 'web' &&
            hovered && { opacity: 0.85, cursor: 'pointer' },
          pressed && { opacity: 0.65 },
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

// ============================================================
// Profile Screen
// ============================================================

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuthStore();
  const { data: quickStats } = useQuickStats();
  const { mutate: verifyUpi, isPending: isVerifying } = useVerifyUpi();

  const [refreshing, setRefreshing] = useState(false);

  // Keep native landscape in the same document flow as the floating mobile
  // navigation; the two-column web composition is reserved for the web shell.
  const isDesktop = Platform.OS === 'web' && width >= 860;
  const isWideDesktop = Platform.OS === 'web' && width >= 1180;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const handleVerifyUpi = () => {
    if (!user?.bankingDetails?.upiId) {
      Alert.alert('No UPI ID', 'Please set your UPI ID first', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set UPI', onPress: () => router.push('/(app)/profile/edit') },
      ]);
      return;
    }
    verifyUpi(undefined, {
      onSuccess: verified => {
        Alert.alert(
          verified ? 'Verified! ✅' : 'Failed',
          verified
            ? 'Your UPI ID is verified'
            : 'Verification failed. Try again.',
        );
      },
    });
  };

  const stats = quickStats?.data;
  const unlockedAchievements = achievements.getUnlockedCount();
  const totalAchievements = Object.keys(achievements.getAll()).length;

  const appUpdateLink = storage.getString('latest_app_update_link');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [aboutModalTab, setAboutModalTab] = useState<'about' | 'support'>(
    'about',
  );
  const { planName, isPaid, getLimitStatus } = useEntitlements();
  const tripsStatus = getLimitStatus('trips');

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Top Navigation Bar */}
      <View
        style={[
          styles.headerTop,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 12 },
        ]}
      >
        <View
          style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}
        >
          <View>
            <Text style={styles.headerTitle}>Account & Profile</Text>
            <Text style={styles.headerSub}>
              Manage your traveler identity and settings
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/profile/edit')}
            style={({ hovered }: WebPressableState) => [
              styles.editIconBtn,
              Platform.OS === 'web' && hovered && { opacity: 0.8 },
            ]}
          >
            <AppIcon name="edit-2" size={16} color={theme.colors.textPrimary} />
            {isDesktop && <Text style={styles.editBtnText}>Edit Profile</Text>}
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 2-COLUMN BENTO DASHBOARD CONTAINER */}
        <View style={[styles.bentoContainer, !isDesktop && styles.stackLayout]}>
          {/* ======================================================== */}
          {/* LEFT COLUMN: User Hero, Financial Hub & Achievements    */}
          {/* ======================================================== */}
          <View style={[styles.bentoColumn, isDesktop && { flex: 1.15 }]}>
            {/* Profile Executive Hero Card */}
            <GlassCard
              intensity={theme.isDark ? 25 : 35}
              style={styles.heroProfileCard}
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
                <View style={styles.avatarWrap}>
                  {user?.avatar?.startsWith('http') ||
                  user?.photoURL?.startsWith('http') ? (
                    <Image
                      source={{ uri: user.avatar || user.photoURL }}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text style={styles.avatarInitial}>
                        {user?.displayName?.charAt(0)?.toUpperCase() || '👤'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.onlineBadgeDot} />
                </View>

                <View style={styles.heroInfo}>
                  <View style={styles.heroNameRow}>
                    <Text style={styles.heroName} numberOfLines={1}>
                      {user?.displayName || 'Traveler'}
                    </Text>
                    {user?.bankingDetails?.upiVerified && (
                      <View style={styles.verifiedBadge}>
                        <AppIcon
                          name="check-circle"
                          size={12}
                          color={theme.colors.success}
                        />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.heroEmail} numberOfLines={1}>
                    {user?.email}
                  </Text>
                  <View style={styles.memberDateTag}>
                    <AppIcon
                      name="calendar"
                      size={11}
                      color={theme.colors.textTertiary}
                    />
                    <Text style={styles.memberDateText}>
                      Joined{' '}
                      {user?.createdAt
                        ? format(new Date(user.createdAt), 'MMM yyyy')
                        : '2026'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Hero Stat Strip */}
              <View style={styles.heroStatStrip}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>
                    {stats?.activeTrips || 0}
                  </Text>
                  <Text style={styles.heroStatLabel}>ACTIVE TRIPS</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>
                    ₹{stats?.thisMonth?.total?.toLocaleString() || 0}
                  </Text>
                  <Text style={styles.heroStatLabel}>THIS MONTH</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>
                    {unlockedAchievements}/{totalAchievements}
                  </Text>
                  <Text style={styles.heroStatLabel}>AWARDS</Text>
                </View>
              </View>
            </GlassCard>

            {/* Membership & Subscription Plan Bento Tile */}
            <GlassCard
              style={styles.bentoTile}
              intensity={theme.isDark ? 18 : 30}
            >
              <View style={styles.tileHeader}>
                <View style={styles.planTitleGroup}>
                  <AppIcon
                    name="sparkles"
                    size={15}
                    color={isPaid ? theme.colors.primary : theme.colors.warning}
                  />
                  <Text
                    style={[
                      styles.tileTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Membership & Plan
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/(app)/plans' as any)}>
                  <Text
                    style={[
                      styles.tileActionLink,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {isPaid ? 'Manage' : 'Upgrade'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.planCardContent}>
                <View style={styles.planHeaderRow}>
                  <View
                    style={[
                      styles.planPill,
                      {
                        backgroundColor: isPaid
                          ? `${theme.colors.primary}18`
                          : `${theme.colors.warning}18`,
                        borderColor: isPaid
                          ? `${theme.colors.primary}30`
                          : `${theme.colors.warning}30`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.planPillText,
                        {
                          color: isPaid
                            ? theme.colors.primary
                            : theme.colors.warning,
                        },
                      ]}
                    >
                      {planName.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.planRenewalText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {isPaid ? 'Active Subscription' : 'Free Tier'}
                  </Text>
                </View>

                {/* Live Trip Usage Progress Bar */}
                <View style={styles.planUsageBlock}>
                  <View style={styles.planUsageHeader}>
                    <Text
                      style={[
                        styles.planUsageLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Trips Created
                    </Text>
                    <Text
                      style={[
                        styles.planUsageValue,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {tripsStatus.used} /{' '}
                      {tripsStatus.total === null ? '∞' : tripsStatus.total}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.planProgressBarBg,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.planProgressBarFill,
                        {
                          width: `${tripsStatus.total === null ? 100 : tripsStatus.percent}%`,
                          backgroundColor: tripsStatus.isReached
                            ? theme.colors.danger
                            : tripsStatus.isApproaching
                              ? theme.colors.warning
                              : theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* UPI & Banking Management Tile */}
            <GlassCard
              style={styles.bentoTile}
              intensity={theme.isDark ? 18 : 30}
            >
              <View style={styles.tileHeader}>
                <Text
                  style={[
                    styles.tileTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Banking & UPI
                </Text>
                <Pressable onPress={() => router.push('/(app)/profile/edit')}>
                  <Text
                    style={[
                      styles.tileActionLink,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Change
                  </Text>
                </Pressable>
              </View>

              <View style={styles.upiContainer}>
                <View style={styles.upiIconBox}>
                  <AppIcon
                    name="credit-card"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.upiDetails}>
                  <Text
                    style={[
                      styles.upiIdText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {user?.bankingDetails?.upiId || 'No UPI ID linked'}
                  </Text>
                  <Text
                    style={[
                      styles.upiSubText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {user?.bankingDetails?.upiId
                      ? user.bankingDetails.upiVerified
                        ? 'Ready for auto-splits & settlements'
                        : 'Verification pending'
                      : 'Add your UPI to settle expenses seamlessly'}
                  </Text>
                </View>
                {user?.bankingDetails?.upiId &&
                  (user.bankingDetails.upiVerified ? (
                    <View style={styles.upiActivePill}>
                      <AppIcon
                        name="check"
                        size={12}
                        color={theme.colors.successDark}
                      />
                      <Text style={styles.upiActiveText}>Active</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleVerifyUpi}
                      disabled={isVerifying}
                      style={({ pressed }) => [
                        styles.verifyBtnSmall,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      {isVerifying ? (
                        <GlobalLoader
                          variant="inline"
                          size="small"
                          color="#FFF"
                        />
                      ) : (
                        <Text style={styles.verifyBtnSmallText}>Verify</Text>
                      )}
                    </Pressable>
                  ))}
              </View>
            </GlassCard>
          </View>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Settings, Hub, Quick Actions, App Info    */}
          {/* ======================================================== */}
          <View style={[styles.bentoColumn, isDesktop && { flex: 1 }]}>
            {/* Traveler Hub & Social Links */}
            <GlassCard
              style={styles.bentoTile}
              intensity={theme.isDark ? 18 : 30}
            >
              <View style={styles.tileHeader}>
                <Text
                  style={[
                    styles.tileTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Traveler Hub
                </Text>
              </View>
              <MenuRow
                icon={<AppIcon name="users" />}
                title="My Friends"
                sub="Manage your travel companions & crew"
                onPress={() => router.push('/(app)/friends' as any)}
              />
              <MenuRow
                icon={<AppIcon name="mail" />}
                title="Trip Invitations"
                sub="View and respond to pending invites"
                onPress={() => router.push('/(app)/invitations' as any)}
              />
              <MenuRow
                icon={<AppIcon name="award" />}
                title="My Achievements"
                sub={`${unlockedAchievements} of ${totalAchievements} awards earned`}
                onPress={() => router.push('/(app)/achievements')}
              />
              <MenuRow
                icon={<AppIcon name="share-2" />}
                title="Share Wakeru"
                sub="Invite your trip group to download the app"
                hideBorder
                onPress={() => {
                  const link = appUpdateLink || 'https://wakeru.app';
                  Share.share({
                    message: `Join me on Wakeru! Download the app here: ${link}`,
                    url: link,
                    title: 'Download Wakeru',
                  }).catch(err => console.log('Share error:', err));
                }}
              />
            </GlassCard>

            {/* System, Preferences & Support */}
            <GlassCard
              style={styles.bentoTile}
              intensity={theme.isDark ? 18 : 30}
            >
              <View style={styles.tileHeader}>
                <Text
                  style={[
                    styles.tileTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Preferences & System
                </Text>
              </View>
              {user?.role === 'admin' && (
                <>
                  <MenuRow
                    icon={
                      <AppIcon name="shield" color={theme.colors.warning} />
                    }
                    title="Admin: Plan Management"
                    sub="Manage pricing, dynamic limits & features"
                    onPress={() => router.push('/(app)/admin/plans' as any)}
                  />
                  <MenuRow
                    icon={
                      <AppIcon
                        name="message-square"
                        color={theme.colors.primary}
                      />
                    }
                    title="Admin: User Feedback & Reviews"
                    sub="Review user bug reports, ideas & ratings"
                    onPress={() => router.push('/(app)/profile/reviews' as any)}
                  />
                  <MenuRow
                    icon={<AppIcon name="radio" color={theme.colors.success} />}
                    title="Admin: Broadcast App Update"
                    sub="Push release notices to all app users"
                    onPress={() => setShowBroadcastModal(true)}
                  />
                </>
              )}
              <MenuRow
                icon={<AppIcon name="pen-tool" />}
                title="Appearance"
                sub="Toggle Dark/Light themes and accents"
                onPress={() => router.push('/(app)/appearance')}
              />
              <MenuRow
                icon={<AppIcon name="shield" />}
                title="Privacy & Security"
                sub="Manage password, biometric lock and data"
                onPress={() => router.push('/(app)/privacy')}
              />
              <MenuRow
                icon={<AppIcon name="message-square" />}
                title="Give Feedback"
                sub="Submit ideas, suggestions or report bugs"
                onPress={() => router.push('/(app)/profile/feedback')}
              />
              <MenuRow
                icon={
                  <AppIcon name="help-circle" color={theme.colors.primary} />
                }
                title="Help & Support"
                sub={`Contact our team at ${SUPPORT_EMAIL}`}
                onPress={() => {
                  setAboutModalTab('support');
                  setShowAboutModal(true);
                }}
              />
              <MenuRow
                icon={
                  <AppIcon
                    name="info"
                    color={theme.colors.accent || '#3B82F6'}
                  />
                }
                title={`About ${APP_NAME}`}
                sub="Features, capabilities & version details"
                onPress={() => {
                  setAboutModalTab('about');
                  setShowAboutModal(true);
                }}
              />
              <MenuRow
                icon={<AppIcon name="download" />}
                title="App Version & Updates"
                sub={
                  appUpdateLink
                    ? 'A new update is ready'
                    : `You are on the latest version (v1.0.0)`
                }
                onPress={() => {
                  if (user?.role === 'admin') {
                    Alert.alert(
                      'App Version & Updates',
                      `${APP_NAME} v1.0.0 (Production)`,
                      [
                        {
                          text: 'Broadcast Update',
                          onPress: () => setShowBroadcastModal(true),
                        },
                        {
                          text: appUpdateLink
                            ? 'Open Update Link'
                            : 'Check Status',
                          onPress: () => {
                            if (appUpdateLink) Linking.openURL(appUpdateLink);
                            else
                              Alert.alert(
                                'Up to Date',
                                `You are running the latest version of ${APP_NAME}.`,
                              );
                          },
                        },
                        { text: 'Cancel', style: 'cancel' },
                      ],
                    );
                  } else if (appUpdateLink) {
                    Linking.openURL(appUpdateLink);
                  } else {
                    Alert.alert(
                      'Up to Date',
                      `You are running the latest version of ${APP_NAME}.`,
                    );
                  }
                }}
              />
              <MenuRow
                icon={<AppIcon name="log-out" />}
                title="Logout"
                sub="Sign out from this device"
                onPress={logout}
                isDestructive
                hideBorder
              />
            </GlassCard>

            {/* Version Footer */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>{APP_NAME} v1.0.0</Text>
              <View
                style={[
                  styles.versionDot,
                  { backgroundColor: theme.colors.textTertiary },
                ]}
              />
              <Text style={styles.versionText}>Crafted for Travelers</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <AdminBroadcastModal
        visible={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />

      <AppAboutModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        initialTab={aboutModalTab}
      />
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    headerTop: {
      paddingHorizontal: 20,
      paddingBottom: 14,
      zIndex: 10,
    },
    headerInner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    desktopHeaderInner: {
      maxWidth: 1300,
      alignSelf: 'center',
      paddingHorizontal: 24,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      letterSpacing: -0.6,
    },
    headerSub: {
      fontSize: 13,
      color: theme.colors.textTertiary,
      fontWeight: '500',
      marginTop: 2,
    },
    editIconBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(0,0,0,0.06)',
      borderWidth: 1,
      borderColor: theme.colors.borderLight,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        } as any,

        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
      }),
    },
    editBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 80,
    },
    desktopScrollContent: {
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 24,
    },

    // Bento Architecture
    bentoContainer: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'flex-start',
    },
    stackLayout: {
      flexDirection: 'column',
    },
    bentoColumn: {
      flex: 1,
      gap: 16,
      width: '100%',
    },
    bentoTile: {
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
        } as any,

        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
      }),
    },
    tileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    tileTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    tileActionLink: {
      fontSize: 12,
      fontWeight: '700',
    },

    // Hero Profile Card
    heroProfileCard: {
      borderRadius: 24,
      padding: 24,

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
      gap: 16,
      marginBottom: 20,
    },
    avatarWrap: {
      position: 'relative',
    },
    avatarImg: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 2,
      borderColor: theme.colors.borderLight,
    },
    avatarFallback: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.borderLight,
    },
    avatarInitial: {
      fontSize: 28,
      fontWeight: '900',
      color: '#FFF',
    },
    onlineBadgeDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.success,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    heroInfo: {
      flex: 1,
    },
    heroNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroName: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      letterSpacing: -0.4,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: `${theme.colors.success}20`,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: `${theme.colors.success}40`,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.success,
    },
    heroEmail: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    memberDateTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
    },
    memberDateText: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      fontWeight: '600',
    },

    // Hero Stat Strip
    heroStatStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    heroStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    heroStatValue: {
      fontSize: 17,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    heroStatLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.colors.textTertiary,
      letterSpacing: 0.6,
      marginTop: 2,
    },
    heroStatDivider: {
      width: 1,
      height: 24,
      backgroundColor: theme.colors.borderLight,
    },

    // Financial Grid
    financeGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    financeTile: {
      flex: 1,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    financeIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    financeLabel: {
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 2,
    },
    financeValue: {
      fontSize: 16,
      fontWeight: '900',
    },
    pendingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.warningBg,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.colors.warningBg,
      marginTop: 4,
    },
    pendingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    pendingBannerText: {
      fontSize: 12,
      color: theme.colors.warningDark,
      fontWeight: '600',
    },

    // Subscription Plan Card
    planTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    planCardContent: {
      gap: 12,
    },
    planHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    planPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    planPillText: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    planRenewalText: {
      fontSize: 12,
      fontWeight: '500',
    },
    planUsageBlock: {
      gap: 6,
    },
    planUsageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    planUsageLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    planUsageValue: {
      fontSize: 12,
      fontWeight: '700',
    },
    planProgressBarBg: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    planProgressBarFill: {
      height: '100%',
      borderRadius: 3,
    },

    // UPI Box
    upiContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
    },
    upiIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: `${theme.colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    upiDetails: {
      flex: 1,
    },
    upiIdText: {
      fontSize: 14,
      fontWeight: '800',
    },
    upiSubText: {
      fontSize: 11,
      marginTop: 2,
    },
    upiActivePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.successBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    upiActiveText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.successDark,
    },
    verifyBtnSmall: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    verifyBtnSmallText: {
      color: theme.colors.textInverse,
      fontSize: 12,
      fontWeight: '700',
    },

    // Menu Rows
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    menuIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    menuTextWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    menuTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    menuSub: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 1,
      fontWeight: '500',
    },

    // Footer
    versionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    versionText: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      fontWeight: '600',
    },
    versionDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
  });
