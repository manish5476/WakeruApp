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
import { useDashboard } from '../../../hooks/useDashboard';
import { useUserStats } from '../../../hooks/useUsers';
import { achievements } from '../../../utils/achievements';
import { useTheme } from '../../../providers/ThemeProvider';
import { storage } from '../../../utils/storage';

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
  const { data: userStats } = useUserStats();
  const { data: dashboardData } = useDashboard();
  const { mutate: verifyUpi, isPending: isVerifying } = useVerifyUpi();

  const [refreshing, setRefreshing] = useState(false);

  const isDesktop = width >= 860;
  const isWideDesktop = width >= 1180;

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

  const dashboardStats = dashboardData?.data;
  const totalLent =
    userStats?.totalLentAcrossTrips ?? dashboardStats?.balances?.totalLent ?? 0;
  const totalOwed =
    userStats?.totalOwedAcrossTrips ?? dashboardStats?.balances?.totalOwed ?? 0;
  const netBalance = userStats?.netBalance ?? totalLent - totalOwed;

  const appUpdateLink = storage.getString('latest_app_update_link');

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
            <LinearGradient
              colors={['#0F172A', '#1E1B4B', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroProfileCard}
            >
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
                        { backgroundColor: '#3B82F6' },
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
                          color="#10B981"
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
                      color="rgba(255,255,255,0.6)"
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
            </LinearGradient>

            {/* Financial Summary Bento Tile */}
            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.tileHeader}>
                <Text
                  style={[
                    styles.tileTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Financial Balances
                </Text>
                <Pressable
                  onPress={() => router.push('/(app)/profile/dashboard' as any)}
                >
                  <Text
                    style={[
                      styles.tileActionLink,
                      { color: theme.colors.primary },
                    ]}
                  >
                    View Details
                  </Text>
                </Pressable>
              </View>

              <View style={styles.financeGrid}>
                <View
                  style={[
                    styles.financeTile,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.financeIconWrap,
                      { backgroundColor: '#ECFDF5' },
                    ]}
                  >
                    <AppIcon name="arrow-up-right" size={16} color="#10B981" />
                  </View>
                  <Text
                    style={[
                      styles.financeLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Total Lent
                  </Text>
                  <Text style={[styles.financeValue, { color: '#10B981' }]}>
                    ₹{totalLent.toLocaleString()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.financeTile,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.financeIconWrap,
                      { backgroundColor: '#FEF2F2' },
                    ]}
                  >
                    <AppIcon name="arrow-down-left" size={16} color="#EF4444" />
                  </View>
                  <Text
                    style={[
                      styles.financeLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Total Owed
                  </Text>
                  <Text style={[styles.financeValue, { color: '#EF4444' }]}>
                    ₹{totalOwed.toLocaleString()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.financeTile,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <View
                    style={[
                      styles.financeIconWrap,
                      { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <AppIcon name="scale" size={16} color="#2563EB" />
                  </View>
                  <Text
                    style={[
                      styles.financeLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Net Balance
                  </Text>
                  <Text
                    style={[
                      styles.financeValue,
                      { color: netBalance >= 0 ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    ₹{netBalance.toLocaleString()}
                  </Text>
                </View>
              </View>

              {(stats?.pendingSettlements || 0) > 0 && (
                <Pressable
                  onPress={() => router.push('/(app)/(tabs)/expenses')}
                  style={({ pressed }) => [
                    styles.pendingBanner,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={styles.pendingLeft}>
                    <AppIcon name="alert-circle" size={18} color="#D97706" />
                    <Text style={styles.pendingBannerText}>
                      <Text style={{ fontWeight: '800' }}>
                        {stats?.pendingSettlements} pending
                      </Text>{' '}
                      settlement{stats?.pendingSettlements !== 1 ? 's' : ''} to
                      resolve
                    </Text>
                  </View>
                  <AppIcon name="arrow-right" size={16} color="#D97706" />
                </Pressable>
              )}
            </View>

            {/* UPI & Banking Management Tile */}
            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
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
                      <AppIcon name="check" size={12} color="#059669" />
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
            </View>
          </View>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Settings, Hub, Quick Actions, App Info    */}
          {/* ======================================================== */}
          <View style={[styles.bentoColumn, isDesktop && { flex: 1 }]}>
            {/* Traveler Hub & Social Links */}
            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
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
            </View>

            {/* System, Preferences & Support */}
            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
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
                icon={<AppIcon name="download" />}
                title="App Version & Updates"
                sub={
                  appUpdateLink
                    ? 'A new update is ready'
                    : 'You are on the latest version'
                }
                onPress={() => {
                  if (appUpdateLink) {
                    Linking.openURL(appUpdateLink);
                  } else {
                    Alert.alert(
                      'Up to Date',
                      'You are running the latest version of Wakeru.',
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
            </View>

            {/* Version Footer */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Wakeru v1.0.0</Text>
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
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
      borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarFallback: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.2)',
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
      backgroundColor: '#10B981',
      borderWidth: 2,
      borderColor: '#0F172A',
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
      color: '#FFF',
      letterSpacing: -0.4,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#10B981',
    },
    heroEmail: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
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
      color: 'rgba(255,255,255,0.6)',
      fontWeight: '600',
    },

    // Hero Stat Strip
    heroStatStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    heroStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    heroStatValue: {
      fontSize: 17,
      fontWeight: '900',
      color: '#FFF',
    },
    heroStatLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: 0.6,
      marginTop: 2,
    },
    heroStatDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255,255,255,0.15)',
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
      borderColor: 'rgba(15,23,42,0.04)',
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
      backgroundColor: '#FEF3C7',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: '#FDE68A',
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
      color: '#92400E',
      fontWeight: '600',
    },

    // UPI Box
    upiContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: 'rgba(15,23,42,0.04)',
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
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    upiActiveText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#059669',
    },
    verifyBtnSmall: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    verifyBtnSmallText: {
      color: '#FFF',
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
// import GlobalLoader from '../../../components/common/GlobalLoader';
// import AppIcon from '../../../components/common/AppIcon';
// import React, { useState, useCallback, useMemo } from 'react';
// import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl, Platform, useWindowDimensions, Pressable, PressableStateCallbackType, Linking, Image, Share } from 'react-native';
// import { router } from 'expo-router';
// import { GlobalBackground } from '../../../components/ui/GlobalBackground';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useAuthStore } from '../../../stores/auth.store';
// import { useVerifyUpi } from '../../../hooks';
// import { useQuickStats } from '../../../hooks/useAnalytics';
// import { useDashboard } from '../../../hooks/useDashboard';
// import { useUserStats } from '../../../hooks/useUsers';
// import { achievements } from '../../../utils/achievements';
// import { format } from 'date-fns';
// import { useTheme } from '../../../providers/ThemeProvider';
// import { notificationsApi } from '../../../services/api/notifications.api';
// import { GlassCard } from '../../../components/ui/GlassCard';
// import { storage } from '../../../utils/storage';

// // Safe web pressable type
// type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// // ============================================================
// // Helper Components
// // ============================================================

// function MenuRow({
//     icon,
//     title,
//     sub,
//     onPress,
//     rightElement,
//     isDestructive,
//     hideBorder,
// }: {
//     icon: React.ReactNode;
//     title: string;
//     sub?: string;
//     onPress?: () => void;
//     rightElement?: React.ReactNode;
//     isDestructive?: boolean;
//     hideBorder?: boolean;
// }) {
//     const theme = useTheme();
//     const styles = useMemo(() => getStyles(theme), [theme]);

//     const content = (
//         <View style={[
//             styles.menuRow,
//             hideBorder && { borderBottomWidth: 0 }
//         ]}>
//             <View style={[
//                 styles.menuIconWrap,
//                 { backgroundColor: isDestructive ? theme.colors.dangerBg : theme.colors.primaryBg }
//             ]}>
//                 {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, {
//                     color: isDestructive ? theme.colors.danger : theme.colors.primary,
//                 }) : icon}
//             </View>
//             <View style={styles.menuTextWrap}>
//                 <Text style={[
//                     styles.menuTitle,
//                     isDestructive && { color: theme.colors.danger }
//                 ]}>
//                     {title}
//                 </Text>
//                 {sub && <Text style={styles.menuSub}>{sub}</Text>}
//             </View>
//             {rightElement || (
//                 <AppIcon name="chevron-right" size={18} color={theme.colors.textTertiary} />
//             )}
//         </View>
//     );

//     if (onPress) {
//         return (
//             <Pressable
//                 onPress={onPress}
//                 style={({ hovered, pressed }: WebPressableState) => [
//                     Platform.OS === 'web' && hovered && { opacity: 0.8, cursor: 'pointer' },
//                     pressed && { opacity: 0.6 }
//                 ]}
//             >
//                 {content}
//             </Pressable>
//         );
//     }
//     return content;
// }

// // ============================================================
// // Profile Screen
// // ============================================================

// export default function ProfileScreen() {
//     const theme = useTheme();
//     const styles = useMemo(() => getStyles(theme), [theme]);
//     const insets = useSafeAreaInsets();
//     const { width } = useWindowDimensions();
//     const { user, logout } = useAuthStore();
//     const { data: quickStats } = useQuickStats();
//     const { data: userStats } = useUserStats();

//     const { data: dashboardData } = useDashboard();
//     const { mutate: verifyUpi, isPending: isVerifying } = useVerifyUpi();

//     const [refreshing, setRefreshing] = useState(false);
//     const isWebDesktop = Platform.OS === 'web' && width > 768;

//     const onRefresh = useCallback(async () => {
//         setRefreshing(true);
//         await new Promise((r) => setTimeout(r, 1000));
//         setRefreshing(false);
//     }, []);

//     const handleVerifyUpi = () => {
//         if (!user?.bankingDetails?.upiId) {
//             Alert.alert('No UPI ID', 'Please set your UPI ID first', [
//                 { text: 'Cancel', style: 'cancel' },
//                 { text: 'Set UPI', onPress: () => router.push('/(app)/profile/edit') },
//             ]);
//             return;
//         }
//         verifyUpi(undefined, {
//             onSuccess: (verified) => {
//                 Alert.alert(verified ? 'Verified! ✅' : 'Failed', verified ? 'Your UPI ID is verified' : 'Verification failed. Try again.');
//             },
//         });
//     };

//     const stats = quickStats?.data;
//     const unlockedAchievements = achievements.getUnlockedCount();
//     const totalAchievements = Object.keys(achievements.getAll()).length;

//     // Use dynamic balances from dashboard or new userStats API
//     const dashboardStats = dashboardData?.data;
//     const totalLent = userStats?.totalLentAcrossTrips ?? dashboardStats?.balances?.totalLent ?? 0;
//     const totalOwed = userStats?.totalOwedAcrossTrips ?? dashboardStats?.balances?.totalOwed ?? 0;
//     const netBalance = userStats?.netBalance ?? (totalLent - totalOwed);

//     // App Update Link
//     const appUpdateLink = storage.getString('latest_app_update_link');

//     return (
//         <View style={styles.container}>
//             {/* Global Gradient Background */}
//             <View style={StyleSheet.absoluteFill} pointerEvents="none">
//                 <GlobalBackground />
//             </View>

//             <View style={[styles.webDesktopContent, isWebDesktop && styles.webDesktopContentCentered]}>
//                 {/* Header Title */}
//                 <View style={[styles.headerTop, { paddingTop: Platform.OS === 'web' ? theme.spacing['4'] : insets.top + 16 }]}>
//                     <Text style={styles.headerTitle}>Profile</Text>
//                     <Pressable
//                         onPress={() => router.push('/(app)/profile/edit')}
//                         style={({ hovered }: WebPressableState) => [
//                             styles.editIconBtn,
//                             Platform.OS === 'web' && hovered && { opacity: 0.7 }
//                         ]}
//                     >
//                         <AppIcon name="edit-2" size={18} color={theme.colors.textPrimary} />
//                     </Pressable>
//                 </View>

//                 <ScrollView
//                     contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 }]}
//                     showsVerticalScrollIndicator={false}
//                     keyboardShouldPersistTaps="handled"
//                     refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
//                 >
//                     {/* PROFILE HEADER CARD */}
//                     <GlassCard style={styles.profileCard} intensity={theme.isDark ? 30 : 20}>
//                         <View style={styles.profileTopRow}>
//                             <View style={[styles.avatar, { overflow: 'hidden' }]}>
//                                 {user?.avatar?.startsWith('http') || user?.photoURL?.startsWith('http') ? (
//                                     <Image
//                                         source={{ uri: user.avatar || user.photoURL }}
//                                         style={{ width: '100%', height: '100%' }}
//                                     />
//                                 ) : (
//                                     <View style={[styles.avatarFallback, { backgroundColor: theme.colors.secondaryBg }]}>
//                                         <Text style={styles.avatarText}>
//                                             {user?.displayName?.charAt(0)?.toUpperCase() || '👤'}
//                                         </Text>
//                                     </View>
//                                 )}
//                             </View>
//                             <View style={styles.profileInfo}>
//                                 <Text style={styles.userName}>{user?.displayName || 'Traveler'}</Text>
//                                 <Text style={styles.userEmail}>{user?.email}</Text>
//                                 <View style={styles.memberSinceRow}>
//                                     <AppIcon name="calendar" size={12} color={theme.colors.textTertiary} />
//                                     <Text style={styles.memberSince}>Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : '2026'}</Text>
//                                 </View>
//                             </View>
//                         </View>
//                         <View style={styles.profileStatsRow}>
//                             <View style={styles.profileStat}>
//                                 <Text style={styles.profileStatVal}>{stats?.activeTrips || 0}</Text>
//                                 <Text style={styles.profileStatLbl}>Active Trips</Text>
//                             </View>
//                             <View style={styles.statDivider} />
//                             <View style={styles.profileStat}>
//                                 <Text style={styles.profileStatVal}>₹{stats?.thisMonth?.total?.toLocaleString() || 0}</Text>
//                                 <Text style={styles.profileStatLbl}>This Month</Text>
//                             </View>
//                             <View style={styles.statDivider} />
//                             <View style={styles.profileStat}>
//                                 <Text style={styles.profileStatVal}>{unlockedAchievements}/{totalAchievements}</Text>
//                                 <Text style={styles.profileStatLbl}>Awards</Text>
//                             </View>
//                         </View>
//                     </GlassCard>

//                     {/* FINANCIAL SUMMARY */}
//                     <View style={styles.section}>
//                         <Text style={styles.sectionTitle}>Financial Summary</Text>
//                         <View style={styles.financeGrid}>
//                             <GlassCard style={styles.financeCard} intensity={theme.isDark ? 15 : 8}>
//                                 <View style={[styles.financeIconWrap, { backgroundColor: theme.colors.successBg }]}>
//                                     <Text style={[styles.financeIcon, { color: theme.colors.success }]}>↗</Text>
//                                 </View>
//                                 <Text style={styles.financeLabel}>Total Lent</Text>
//                                 <Text style={[styles.financeValue, { color: theme.colors.success }]}>
//                                     ₹{totalLent.toLocaleString()}
//                                 </Text>
//                             </GlassCard>

//                             <GlassCard style={styles.financeCard} intensity={theme.isDark ? 15 : 8}>
//                                 <View style={[styles.financeIconWrap, { backgroundColor: theme.colors.dangerBg }]}>
//                                     <Text style={[styles.financeIcon, { color: theme.colors.danger }]}>↙</Text>
//                                 </View>
//                                 <Text style={styles.financeLabel}>Total Owed</Text>
//                                 <Text style={[styles.financeValue, { color: theme.colors.danger }]}>
//                                     ₹{totalOwed.toLocaleString()}
//                                 </Text>
//                             </GlassCard>

//                             <GlassCard style={styles.financeCard} intensity={theme.isDark ? 15 : 8}>
//                                 <View style={[styles.financeIconWrap, { backgroundColor: theme.colors.secondaryBg }]}>
//                                     <Text style={[styles.financeIcon, { color: theme.colors.secondary }]}>⚖️</Text>
//                                 </View>
//                                 <Text style={styles.financeLabel}>Net Balance</Text>
//                                 <Text style={[styles.financeValue, { color: netBalance >= 0 ? theme.colors.success : theme.colors.danger }]}>
//                                     ₹{netBalance.toLocaleString()}
//                                 </Text>
//                             </GlassCard>
//                         </View>

//                         {(stats?.pendingSettlements || 0) > 0 && (
//                             <Pressable
//                                 onPress={() => router.push('/(app)/(tabs)/expenses')}
//                                 style={({ hovered, pressed }: WebPressableState) => [
//                                     styles.pendingAlert,
//                                     Platform.OS === 'web' && hovered && { opacity: 0.9, cursor: 'pointer' },
//                                     pressed && { opacity: 0.8 }
//                                 ]}
//                             >
//                                 <View style={[styles.pendingAlertIconWrap, { backgroundColor: theme.colors.warningBg }]}>
//                                     <AppIcon name="alert-circle" size={18} color={theme.colors.warning} />
//                                 </View>
//                                 <Text style={styles.pendingAlertText}>
//                                     You have <Text style={{ fontWeight: '700' }}>{stats?.pendingSettlements} pending</Text> settlement{stats?.pendingSettlements !== 1 ? 's' : ''}
//                                 </Text>
//                                 <AppIcon name="chevron-right" size={18} color={theme.colors.warning} />
//                             </Pressable>
//                         )}
//                     </View>

//                     {/* SETTINGS GROUPS */}
//                     <Text style={styles.sectionTitle}>Account</Text>
//                     <GlassCard style={styles.menuGroup} intensity={theme.isDark ? 20 : 10}>
//                         <MenuRow
//                             icon={<AppIcon name="user" size={18} />}
//                             title="Edit Profile"
//                             sub="Update your name, email and avatar"
//                             onPress={() => router.push('/(app)/profile/edit')}
//                         />
//                         <MenuRow
//                             icon={<AppIcon name="shield" size={18} />}
//                             title="Privacy & Security"
//                             sub="Password, app lock and data controls"
//                             onPress={() => router.push('/(app)/privacy')}
//                             hideBorder
//                         />
//                     </GlassCard>

//                     <Text style={styles.sectionTitle}>Banking & Payment</Text>
//                     <GlassCard style={styles.menuGroup} intensity={theme.isDark ? 20 : 10}>
//                         <MenuRow
//                             icon={<AppIcon name="credit-card" size={18} />}
//                             title="UPI ID"
//                             sub={user?.bankingDetails?.upiId ? `${user.bankingDetails.upiId} ${user.bankingDetails.upiVerified ? '✅' : ''}` : 'Not set'}
//                             onPress={() => router.push('/(app)/profile/edit')}
//                             hideBorder={user?.bankingDetails?.upiId && !user?.bankingDetails?.upiVerified ? false : true}
//                         />
//                         {user?.bankingDetails?.upiId && !user?.bankingDetails?.upiVerified && (
//                             <View style={[styles.menuRow, { borderBottomWidth: 0, paddingVertical: 12 }]}>
//                                 <Pressable
//                                     onPress={handleVerifyUpi}
//                                     disabled={isVerifying}
//                                     style={({ hovered, pressed }: WebPressableState) => [
//                                         styles.verifyUpiBtn,
//                                         Platform.OS === 'web' && hovered && !isVerifying && { opacity: 0.9, cursor: 'pointer' },
//                                         pressed && !isVerifying && { opacity: 0.8 }
//                                     ]}
//                                 >
//                                     {isVerifying ? (
//                                         <GlobalLoader variant="inline" size="small" color={theme.colors.surface} />
//                                     ) : (
//                                         <>
//                                             <AppIcon name="check-circle" size={16} color={theme.colors.surface} style={{ marginRight: 8 }} />
//                                             <Text style={styles.verifyUpiText}>Verify UPI ID Now</Text>
//                                         </>
//                                     )}
//                                 </Pressable>
//                             </View>
//                         )}
//                     </GlassCard>

//                     <Text style={styles.sectionTitle}>Preferences</Text>
//                     <GlassCard style={styles.menuGroup} intensity={theme.isDark ? 20 : 10}>
//                         <MenuRow
//                             icon={<AppIcon name="pen-tool" size={18} />}
//                             title="Appearance"
//                             sub="Customize the look and feel"
//                             onPress={() => router.push('/(app)/appearance')}
//                         />
//                         <MenuRow
//                             icon={<AppIcon name="shield" size={18} />}
//                             title="Privacy & Security"
//                             sub="Manage app lock and data controls"
//                             onPress={() => router.push('/(app)/privacy')}
//                             hideBorder
//                         />
//                     </GlassCard>

//                     <Text style={styles.sectionTitle}>Quick Links</Text>
//                     <GlassCard style={styles.menuGroup} intensity={theme.isDark ? 20 : 10}>
//                         <MenuRow
//                             icon={<AppIcon name="download" size={18} />}
//                             title="Download App"
//                             sub={appUpdateLink ? "A new version is available" : "No new updates"}
//                             onPress={() => {
//                                 if (appUpdateLink) {
//                                     Linking.openURL(appUpdateLink);
//                                 } else {
//                                     Alert.alert("No Update Available", "Check back later for new updates.");
//                                 }
//                             }}
//                         />
//                         <MenuRow
//                             icon={<AppIcon name="share-2" size={18} />}
//                             title="Share App"
//                             sub="Send the download link to friends"
//                             onPress={() => {
//                                 const link = appUpdateLink || 'https://wakeru.app';
//                                 Share.share({
//                                     message: `Join me on Wakeru! Download the app here: ${link}`,
//                                     url: link,
//                                     title: 'Download Wakeru'
//                                 }).catch(err => console.log('Share error:', err));
//                             }}
//                         />
//                         <MenuRow
//                             icon={<AppIcon name="users" size={18} />}
//                             title="My Friends"
//                             sub="View and manage your friends list"
//                             onPress={() => router.push('/(app)/friends' as any)}
//                         />
//                         <MenuRow
//                             icon={<AppIcon name="mail" size={18} />}
//                             title="Trip Invitations"
//                             sub="View pending invites"
//                             onPress={() => router.push('/(app)/invitations' as any)}
//                         />
//                         <MenuRow
//                             icon={<AppIcon name="pie-chart" size={18} />}
//                             title="My Dashboard"
//                             sub="View all stats and balances"
//                             onPress={() => router.push('/(app)/profile/dashboard' as any)}
//                         />
//                         <MenuRow
//                             icon={<AppIcon name="award" size={18} />}
//                             title="My Achievements"
//                             sub={`${unlockedAchievements} unlocked`}
//                             onPress={() => router.push('/(app)/achievements')}
//                         />
//                         <MenuRow
//                             icon={<AppIcon name="log-out" size={18} />}
//                             title="Logout"
//                             sub="You will be returned to the login screen"
//                             onPress={logout}
//                             isDestructive
//                             hideBorder
//                         />
//                     </GlassCard>

//                     {/* SUPPORT */}
//                     <Text style={styles.sectionTitle}>Support</Text>
//                     <GlassCard style={styles.menuGroup} intensity={theme.isDark ? 20 : 10}>
//                         <MenuRow
//                             icon={<AppIcon name="message-square" size={18} />}
//                             title="Give Feedback"
//                             sub="Submit ideas, suggestions or report bugs"
//                             onPress={() => router.push('/(app)/profile/feedback')}
//                         />
//                         <MenuRow
//                             icon={<AppIcon name="star" size={18} />}
//                             title="View App Reviews"
//                             sub="See logs and summary details of app reviews"
//                             onPress={() => router.push('/(app)/profile/reviews')}
//                         />
//                     </GlassCard>

//                     {/* App Version */}
//                     <View style={styles.versionContainer}>
//                         <Text style={styles.versionText}>Wakeru v1.0.0</Text>
//                         <View style={[styles.versionDot, { backgroundColor: theme.colors.textTertiary }]} />
//                         <Text style={styles.versionText}>Crafted for Travelers</Text>
//                     </View>
//                 </ScrollView>
//             </View>
//         </View>
//     );
// }

// // ============================================================
// // Styles
// // ============================================================

// const getStyles = (theme: any) => StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: 'transparent',
//     },
//     webDesktopContent: {
//         flex: 1,
//         width: '100%',
//     },
//     webDesktopContentCentered: {
//         maxWidth: 1024,
//         alignSelf: 'center',
//         backgroundColor: 'transparent',
//     },
//     headerTop: {
//         paddingHorizontal: 20,
//         paddingBottom: 12,
//         backgroundColor: 'transparent',
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//     },
//     headerTitle: {
//         fontSize: 32,
//         fontWeight: '800',
//         color: theme.colors.textPrimary,
//         letterSpacing: -0.5,
//     },
//     editIconBtn: {
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         backgroundColor: theme.colors.surface,
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 1,
//         borderColor: theme.colors.borderLight,
//     },
//     scrollContent: {
//         paddingHorizontal: 20,
//     },
//     profileCard: {
//         borderRadius: 24,
//         padding: 20,
//         marginBottom: 24,
//         borderWidth: 1,
//         borderColor: theme.glass.borderTopColor,
//     },
//     profileTopRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 20,
//     },
//     avatar: {
//         width: 80,
//         height: 80,
//         borderRadius: 40,
//         marginRight: 16,
//         borderWidth: 2,
//         borderColor: theme.colors.secondaryBg,
//     },
//     avatarFallback: {
//         width: '100%',
//         height: '100%',
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderRadius: 40,
//     },
//     avatarText: {
//         fontSize: 32,
//         fontWeight: '800',
//         color: theme.colors.primary,
//     },
//     profileInfo: {
//         flex: 1,
//         justifyContent: 'center',
//     },
//     userName: {
//         fontSize: 22,
//         fontWeight: '900',
//         color: theme.colors.textPrimary,
//         marginBottom: 2,
//     },
//     userEmail: {
//         fontSize: 14,
//         color: theme.colors.textSecondary,
//         fontWeight: '500',
//         marginBottom: 6,
//     },
//     memberSinceRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 4,
//     },
//     memberSince: {
//         fontSize: 11,
//         color: theme.colors.textTertiary,
//         fontWeight: '600',
//     },
//     profileStatsRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.15)',
//         borderRadius: 16,
//         paddingVertical: 12,
//         marginBottom: 0,
//         borderWidth: 1,
//         borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)',
//     },
//     profileStat: {
//         flex: 1,
//         alignItems: 'center',
//     },
//     profileStatVal: {
//         fontSize: 18,
//         fontWeight: '800',
//         color: theme.colors.textPrimary,
//     },
//     profileStatLbl: {
//         fontSize: 11,
//         color: theme.isDark ? '#94A3B8' : '#475569',
//         fontWeight: '600',
//         marginTop: 2,
//     },
//     statDivider: {
//         width: 1,
//         height: 24,
//         backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
//     },
//     section: {
//         marginBottom: 24,
//     },
//     sectionTitle: {
//         fontSize: 13,
//         fontWeight: '700',
//         color: theme.colors.textTertiary,
//         textTransform: 'uppercase',
//         letterSpacing: 0.8,
//         marginBottom: 12,
//         marginLeft: 4,
//     },
//     financeGrid: {
//         flexDirection: 'row',
//         gap: 12,
//         marginBottom: 16,
//     },
//     financeCard: {
//         flex: 1,
//         padding: 16,
//         borderRadius: 16,
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: theme.glass.borderTopColor,
//     },
//     financeIconWrap: {
//         width: 32,
//         height: 32,
//         borderRadius: 16,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginBottom: 8,
//     },
//     financeIcon: {
//         fontSize: 16,
//         fontWeight: '800',
//     },
//     financeLabel: {
//         fontSize: 11,
//         color: theme.colors.textSecondary,
//         fontWeight: '600',
//         marginBottom: 4,
//     },
//     financeValue: {
//         fontSize: 18,
//         fontWeight: '800',
//     },
//     pendingAlert: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: theme.colors.warningBg,
//         borderRadius: 16,
//         padding: 16,
//         borderWidth: 1,
//         borderColor: theme.colors.warningLight || theme.colors.warning,
//     },
//     pendingAlertIconWrap: {
//         width: 36,
//         height: 36,
//         borderRadius: 18,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginRight: 12,
//     },
//     pendingAlertText: {
//         flex: 1,
//         fontSize: 14,
//         color: theme.colors.warning,
//         fontWeight: '500',
//     },
//     menuGroup: {
//         marginBottom: 24,
//         borderRadius: 20,
//         overflow: 'hidden',
//         borderWidth: 1,
//         borderColor: theme.glass.borderTopColor,
//     },
//     menuRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingVertical: 16,
//         paddingHorizontal: 16,
//         borderBottomWidth: 1,
//         borderBottomColor: theme.colors.borderLight,
//     },
//     menuIconWrap: {
//         width: 40,
//         height: 40,
//         borderRadius: 12,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginRight: 12,
//     },
//     menuIcon: {
//         fontSize: 18,
//     },
//     menuTextWrap: {
//         flex: 1,
//         justifyContent: 'center',
//     },
//     menuTitle: {
//         fontSize: 15,
//         fontWeight: '600',
//         color: theme.colors.textPrimary,
//     },
//     menuSub: {
//         fontSize: 12,
//         color: theme.colors.textSecondary,
//         marginTop: 2,
//         fontWeight: '500',
//     },
//     verifyUpiBtn: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: theme.colors.primary,
//         borderRadius: 12,
//         paddingVertical: 12,
//         paddingHorizontal: 16,
//         marginHorizontal: 16,
//     },
//     verifyUpiText: {
//         color: theme.colors.surface,
//         fontSize: 14,
//         fontWeight: '700',
//     },
//     versionContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 8,
//         paddingVertical: 24,
//     },
//     versionText: {
//         fontSize: 12,
//         color: theme.colors.textTertiary,
//         fontWeight: '500',
//     },
//     versionDot: {
//         width: 4,
//         height: 4,
//         borderRadius: 2,
//     },
//     codeInput: {
//         backgroundColor: 'transparent',
//         borderWidth: 1,
//         borderColor: theme.colors.borderLight,
//         borderRadius: 12,
//         color: theme.colors.textPrimary,
//     },
// });
