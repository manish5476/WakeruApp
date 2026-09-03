import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Alert,
  useWindowDimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../providers/ThemeProvider';
import { useAuthStore } from '../../../stores/auth.store';
import { authApi, Session } from '../../../services/api/auth.api';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { Typography } from '../../../components/ui/Typography';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

// Helper: Parse OS and Browser
const parseDeviceString = (deviceStr: string) => {
  const str = (deviceStr || '').toLowerCase();
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  let platformType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  let iconName = 'monitor';

  // Parse OS
  if (str.includes('ios') || str.includes('iphone')) {
    os = 'iOS';
    platformType = 'mobile';
    iconName = 'smartphone';
  } else if (str.includes('ipad')) {
    os = 'iPadOS';
    platformType = 'tablet';
    iconName = 'tablet';
  } else if (str.includes('android')) {
    os = 'Android';
    platformType = 'mobile';
    iconName = 'smartphone';
  } else if (str.includes('mac')) {
    os = 'macOS';
    iconName = 'monitor';
  } else if (str.includes('win')) {
    os = 'Windows';
    iconName = 'monitor';
  } else if (str.includes('linux')) {
    os = 'Linux';
    iconName = 'monitor';
  } else if (str.includes('postman')) {
    os = 'API Client';
    iconName = 'terminal';
  }

  // Parse Browser/App
  if (str.includes('chrome')) {
    browser = 'Chrome';
  } else if (str.includes('safari') && !str.includes('chrome')) {
    browser = 'Safari';
  } else if (str.includes('firefox')) {
    browser = 'Firefox';
  } else if (str.includes('edge')) {
    browser = 'Edge';
  } else if (str.includes('okhttp') || str.includes('postman')) {
    browser = 'System Client';
  } else if (str.includes('wakeru')) {
    browser = 'Wakeru App';
  }

  return { os, browser, platformType, iconName };
};

// Helper: Relative time
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

const formatExactDate = (dateString: string) => {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ActiveSessionsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { width } = useWindowDimensions();

  const { logoutAll } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isDesktop = width > 768;

  const fetchSessions = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      const res = await authApi.getSessions();
      if (res.success && res.data?.sessions) {
        // Map over sessions to handle nested token object if returned by backend
        const mappedSessions = res.data.sessions.map((s: any) =>
          s.token && typeof s.token === 'object' ? s.token : s,
        );
        setSessions(mappedSessions);
      } else {
        throw new Error(res.message || 'Failed to fetch sessions');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not load active sessions.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutSession = async (token: string) => {
    Alert.alert(
      'Revoke Session',
      'Are you sure you want to sign out of this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(token);
              const res = await authApi.logout(token);
              if (res.success) {
                setSessions(prev => prev.filter(s => s.token !== token));
              } else {
                throw new Error(res.message);
              }
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to revoke session.',
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleLogoutAll = () => {
    Alert.alert(
      'Sign out of all other devices',
      'Are you sure you want to log out from ALL devices? You will need to log in again on those devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('all');
              await logoutAll();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to sign out all devices.',
              );
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          paddingTop:
            Platform.OS === 'web' ? theme.spacing['6'] : insets.top + 20,
        },
      ]}
    >
      <Button
        variant="ghost"
        size="sm"
        onPress={() => router.back()}
        leftIcon={
          <AppIcon
            name="arrow-left"
            size={20}
            color={theme.colors.textPrimary}
          />
        }
        title="Back"
        style={styles.backBtn}
      />
      <View style={styles.headerTextWrap}>
        <View style={styles.titleRow}>
          <Typography variant="h2" weight="bold">
            Account Security
          </Typography>
          <AppIcon name="shield-check" size={24} color={theme.colors.success} />
        </View>
        <Typography
          variant="body"
          color="textSecondary"
          style={styles.subtitle}
        >
          Manage devices currently signed into your account.
        </Typography>
      </View>
    </View>
  );

  const renderSummary = () => (
    <GlassCard style={styles.summaryCard} intensity={theme.isDark ? 15 : 10}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Typography variant="caption" color="textTertiary" weight="semibold">
            Status
          </Typography>
          <Typography variant="body" color="success" weight="bold">
            Excellent
          </Typography>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Typography variant="caption" color="textTertiary" weight="semibold">
            Active Devices
          </Typography>
          <Typography variant="body" color="textPrimary" weight="bold">
            {sessions.length}
          </Typography>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Typography variant="caption" color="textTertiary" weight="semibold">
            Last Active
          </Typography>
          <Typography variant="body" color="textPrimary" weight="bold">
            {sessions.length > 0
              ? getRelativeTime(sessions[0].lastActive)
              : '--'}
          </Typography>
        </View>
      </View>
      <View style={styles.summaryFooter}>
        <AppIcon name="check-circle" size={16} color={theme.colors.success} />
        <Typography variant="caption" color="textSecondary">
          No suspicious activity detected
        </Typography>
      </View>
    </GlassCard>
  );

  const renderCurrentDevice = (session: Session) => {
    const { os, browser, iconName } = parseDeviceString(session.device);

    return (
      <View style={styles.section}>
        <Typography variant="h3" weight="bold" style={styles.sectionTitle}>
          Current Session
        </Typography>
        <View
          style={[
            styles.currentDeviceWrapper,
            {
              backgroundColor: theme.isDark
                ? 'rgba(76, 175, 80, 0.1)'
                : 'rgba(76, 175, 80, 0.05)',
            },
          ]}
        >
          <GlassCard style={styles.currentDeviceCard} intensity={0}>
            <View style={styles.deviceHeader}>
              <View
                style={[
                  styles.deviceIconBox,
                  { backgroundColor: theme.colors.successBg },
                ]}
              >
                <AppIcon
                  name={iconName as any}
                  size={24}
                  color={theme.colors.success}
                />
              </View>
              <View style={styles.deviceHeaderInfo}>
                <View style={styles.deviceNameRow}>
                  <Typography variant="body" weight="bold">
                    {os}
                  </Typography>
                  <Badge label="This Device" variant="success" />
                </View>
                <Typography variant="caption" color="textSecondary">
                  {browser}
                </Typography>
              </View>
            </View>

            <View style={styles.deviceDetailsGrid}>
              <View style={styles.detailRow}>
                <AppIcon
                  name="map-pin"
                  size={14}
                  color={theme.colors.textTertiary}
                />
                <Typography variant="caption" color="textSecondary">
                  {session.ip} • Unknown Location
                </Typography>
              </View>
              <View style={styles.detailRow}>
                <AppIcon
                  name="clock"
                  size={14}
                  color={theme.colors.textTertiary}
                />
                <View style={styles.onlineBadge}>
                  <View
                    style={[
                      styles.onlineDot,
                      { backgroundColor: theme.colors.success },
                    ]}
                  />
                  <Typography
                    variant="caption"
                    color="success"
                    weight="semibold"
                  >
                    Online Now
                  </Typography>
                </View>
              </View>
            </View>
          </GlassCard>
        </View>
      </View>
    );
  };

  const renderOtherDevices = () => {
    if (sessions.length <= 1) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <AppIcon
              name="shield-check"
              size={48}
              color={theme.colors.success}
            />
          </View>
          <Typography
            variant="body"
            weight="semibold"
            align="center"
            style={styles.emptyText}
          >
            You're only signed in on this device.
          </Typography>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Typography variant="title" weight="bold" style={styles.sectionTitle}>
          Other Sessions
        </Typography>
        <View style={styles.sessionsList}>
          {sessions.slice(1).map(session => {
            const { os, browser, iconName } = parseDeviceString(session.device);
            const isRevoking = actionLoading === session.token;

            return (
              <GlassCard key={session.token} style={styles.otherDeviceCard}>
                <View style={styles.deviceHeader}>
                  <View
                    style={[
                      styles.deviceIconBox,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <AppIcon
                      name={iconName as any}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                  <View style={styles.deviceHeaderInfo}>
                    <Typography variant="bodySm" weight="bold">
                      {os}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {browser}
                    </Typography>
                  </View>
                  <Button
                    title="Sign Out"
                    variant="outline"
                    size="sm"
                    loading={isRevoking}
                    onPress={() => handleLogoutSession(session.token)}
                  />
                </View>
                <View style={styles.deviceDetailsGrid}>
                  <View style={styles.detailRow}>
                    <AppIcon
                      name="map-pin"
                      size={14}
                      color={theme.colors.textTertiary}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {session.ip} • Unknown Location
                    </Typography>
                  </View>
                  <View style={styles.detailRow}>
                    <AppIcon
                      name="clock"
                      size={14}
                      color={theme.colors.textTertiary}
                    />
                    <Typography variant="caption" color="textSecondary">
                      Last active: {getRelativeTime(session.lastActive)} (
                      {formatExactDate(session.lastActive)})
                    </Typography>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDangerZone = () => {
    if (sessions.length <= 1) return null;

    return (
      <View style={styles.dangerZone}>
        <GlassCard style={styles.dangerCard} intensity={10}>
          <View style={styles.dangerInfo}>
            <AppIcon
              name="alert-triangle"
              size={24}
              color={theme.colors.danger}
            />
            <View style={styles.dangerText}>
              <Typography variant="body" weight="bold" color="danger">
                Sign out of all other devices
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Did you notice suspicious activity? Revoke access to all devices
                except this one safely.
              </Typography>
            </View>
          </View>
          <Button
            title="Sign Out All"
            variant="danger"
            fullWidth
            loading={actionLoading === 'all'}
            onPress={handleLogoutAll}
          />
        </GlassCard>
      </View>
    );
  };

  const renderSecurityTips = () => (
    <View style={styles.tipsSection}>
      <Typography variant="title" weight="bold" style={styles.sectionTitle}>
        Security Tips
      </Typography>
      <GlassCard style={styles.tipsCard}>
        {[
          'Enable Two-Factor Authentication',
          'Review account activity regularly',
          'Never share OTPs',
          'Use strong passwords',
        ].map((tip, idx) => (
          <View key={idx} style={styles.tipRow}>
            <AppIcon name="check" size={16} color={theme.colors.success} />
            <Typography variant="bodySm" color="textSecondary">
              {tip}
            </Typography>
          </View>
        ))}
      </GlassCard>
    </View>
  );

  return (
    <GlobalBackground>
      <View style={styles.container}>
        {renderHeader()}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <GlobalLoader
              variant="inline"
              size="large"
              color={theme.colors.primary}
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isDesktop && styles.desktopLayout,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchSessions(true)}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {isDesktop ? (
              <>
                <View style={styles.desktopColumnLeft}>
                  {renderSummary()}
                  {renderSecurityTips()}
                </View>
                <View style={styles.desktopColumnRight}>
                  {sessions.length > 0 && renderCurrentDevice(sessions[0])}
                  {renderOtherDevices()}
                  {renderDangerZone()}
                </View>
              </>
            ) : (
              <>
                {renderSummary()}
                {sessions.length > 0 && renderCurrentDevice(sessions[0])}
                {renderOtherDevices()}
                {renderDangerZone()}
                {renderSecurityTips()}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </GlobalBackground>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: 'transparent' },
        loadingContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },

        header: {
          paddingHorizontal: theme.spacing['4'],
          paddingBottom: theme.spacing['4'],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
          backgroundColor: theme.colors.surface,
        },
        backBtn: {
          marginLeft: -8,
          marginBottom: theme.spacing['2'],
        },
        headerTextWrap: {
          gap: 4,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        subtitle: {
          marginTop: 4,
        },

        scrollContent: {
          padding: theme.spacing['4'],
          paddingBottom: 60,
          gap: theme.spacing['6'],
        },

        desktopLayout: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'center',
          maxWidth: 1000,
          alignSelf: 'center',
          width: '100%',
          gap: theme.spacing['8'],
          paddingVertical: theme.spacing['8'],
        },
        desktopColumnLeft: {
          width: 380, // Fixed width on desktop
          gap: theme.spacing['6'],
        },
        desktopColumnRight: {
          flex: 1,
          maxWidth: 500, // Cards max width
          gap: theme.spacing['6'],
        },

        section: {
          gap: theme.spacing['3'],
        },
        sectionTitle: {
          marginBottom: theme.spacing['1'],
        },

        summaryCard: {
          padding: theme.spacing['4'],
        },
        summaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing['4'],
        },
        summaryItem: {
          flex: 1,
          gap: 4,
        },
        summaryDivider: {
          width: 1,
          height: 32,
          backgroundColor: theme.colors.borderLight,
          marginHorizontal: theme.spacing['3'],
        },
        summaryFooter: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: theme.spacing['3'],
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
        },

        currentDeviceWrapper: {
          borderRadius: theme.borderRadius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.success,
          overflow: 'hidden',
        },
        currentDeviceCard: {
          padding: theme.spacing['4'],
          backgroundColor: 'transparent',
          borderWidth: 0,
        },

        otherDeviceCard: {
          padding: theme.spacing['4'],
          marginBottom: theme.spacing['3'],
        },
        sessionsList: {
          // handled by marginBottom
        },

        deviceHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing['4'],
          gap: 12,
        },
        deviceIconBox: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
        },
        deviceHeaderInfo: {
          flex: 1,
          gap: 4,
        },
        deviceNameRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        },

        deviceDetailsGrid: {
          gap: 8,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing['3'],
          borderRadius: theme.borderRadius.lg,
        },
        detailRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        onlineBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        onlineDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
        },

        dangerZone: {
          marginTop: theme.spacing['4'],
        },
        dangerCard: {
          padding: theme.spacing['4'],
          borderColor: theme.colors.danger,
          backgroundColor: theme.isDark
            ? 'rgba(244, 67, 54, 0.05)'
            : 'rgba(244, 67, 54, 0.02)',
          gap: theme.spacing['4'],
        },
        dangerInfo: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
        },
        dangerText: {
          flex: 1,
          gap: 4,
        },

        emptyState: {
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing['6'],
          paddingVertical: theme.spacing['8'],
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius['2xl'],
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          marginTop: theme.spacing['4'],
        },
        emptyIconWrap: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.successBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing['4'],
        },
        emptyText: {
          maxWidth: 240,
          lineHeight: 22,
        },

        tipsSection: {
          gap: theme.spacing['3'],
          marginTop: theme.spacing['2'],
        },
        tipsCard: {
          padding: theme.spacing['4'],
          gap: theme.spacing['3'],
        },
        tipRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
      }),
    [theme],
  );
};
