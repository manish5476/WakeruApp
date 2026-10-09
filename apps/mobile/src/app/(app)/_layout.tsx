import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Pressable,
} from 'react-native';
import { Stack, useSegments, usePathname, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { useSocket } from '../../hooks/useSocket';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useBiometricLock } from '../../hooks/useBiometricLock';
import { useTheme } from '../../providers/ThemeProvider';
import { useThemeStore } from '../../stores/theme.store';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../services/api';
import { widgetService } from '../../services/widget/widgetService';

import { AppSidebar } from '../../components/ui/AppSidebar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import GlobalLoader from '../../components/common/GlobalLoader';
import AppIcon from '../../components/common/AppIcon';
import type { Theme } from '../../theme';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { SidebarMenuContext } from './(tabs)/_layout';
import { SEOHead } from '../../components/seo/SEOHead';
import { OnboardingModal } from '../../components/onboarding/OnboardingModal';
import { GlobalFloatingTabBar } from '../../components/navigation/GlobalFloatingTabBar';
import { SyncStatusIndicator } from '../../components/ui/SyncStatusIndicator';

// ─── Constants ───────────────────────────────────────────────
const MOBILE_BREAKPOINT = 768;
const SIDEBAR_WIDTH_COLLAPSED = 90;
const SIDEBAR_WIDTH_EXPANDED = 290;

export default function AppLayout() {
  const theme = useTheme();
  const styles = layoutStyles(theme);
  const insets = useSafeAreaInsets();

  const { isAuthenticated, isInitialized } = useAuthStore();
  const { hydrateFromBackend } = useThemeStore();
  const { width } = useWindowDimensions();

  useSocket();
  usePushNotifications();

  const { isLocked, isChecking, isLockReady, unlock } = useBiometricLock(
    isAuthenticated,
    isInitialized,
  );

  const isDesktop = Platform.OS === 'web' && width > MOBILE_BREAKPOINT;

  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── IMPORTANT: hooks must be called unconditionally before any early returns ──
  const segments = useSegments();
  const pathname = usePathname();

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);
  const closeSidebar = useCallback(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [isDesktop]);
  const toggleCollapsed = useCallback(() => setSidebarCollapsed(v => !v), []);

  useEffect(() => {
    setSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isInitialized]);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const { data, error } = await authApi.getPreferences();
        if (data?.preferences) {
          hydrateFromBackend(
            data.preferences.appearance,
            data.preferences.theme as any,
          );
        }
        if (error) {
          console.error('Failed to fetch user preferences:', error);
        }
      } catch (e) {
        // Network error handled gracefully, prevents app crash
        console.warn(
          'Unexpected error fetching preferences (likely offline):',
          e,
        );
      }
    };

    // Only fetch if we are initialized and authenticated
    if (isInitialized && isAuthenticated) {
      fetchPreferences();
      widgetService.updateAllWidgets().catch(() => {});
    }
  }, [hydrateFromBackend, isInitialized, isAuthenticated]);

  // ── GATING: Initialization & Biometric Lock ──────────────
  if (!isInitialized || !isAuthenticated || !isLockReady) {
    return (
      <GlobalBackground>
        <View style={styles.gate}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Typography
            variant="bodySm"
            color="textSecondary"
            style={{ marginTop: theme.spacing[3] }}
          >
            Initializing Wakeru…
          </Typography>
        </View>
      </GlobalBackground>
    );
  }

  if (isLocked) {
    return (
      <GlobalBackground>
        <View style={styles.gate}>
          <View style={styles.lockIcon}>
            <AppIcon name="lock" size={32} color={theme.colors.primary} />
          </View>
          <Typography
            variant="h2"
            weight="bold"
            color="textPrimary"
            align="center"
          >
            Wakeru is Locked
          </Typography>
          <Typography
            variant="body"
            color="textSecondary"
            align="center"
            style={styles.lockMessage}
          >
            Confirm your identity to continue accessing your trips.
          </Typography>
          <Pressable
            onPress={() => void unlock()}
            disabled={isChecking}
            style={styles.unlockButton}
          >
            {isChecking ? (
              <GlobalLoader
                variant="inline"
                size="small"
                color={theme.colors.textInverse}
              />
            ) : (
              <Typography variant="body" weight="bold" color="textInverse">
                Unlock App
              </Typography>
            )}
          </Pressable>
        </View>
      </GlobalBackground>
    );
  }

  // ── LAYOUT: Header, Sidebar, and Stack ───────────────────
  const sidebarMargin =
    isDesktop && sidebarOpen
      ? sidebarCollapsed
        ? SIDEBAR_WIDTH_COLLAPSED
        : SIDEBAR_WIDTH_EXPANDED
      : 0;

  const isInsideTabs =
    (segments as string[])[1] === '(tabs)' ||
    (!(segments as string[])[1] && pathname === '/');
  const isModalRoute =
    pathname.includes('/edit') ||
    pathname.includes('/create') ||
    pathname.includes('/upload') ||
    pathname.includes('/add-expense') ||
    pathname.includes('/quick-actions') ||
    pathname.includes('/join');

  const shouldShowGlobalBottomBar =
    !isDesktop && !isInsideTabs && !isModalRoute;

  return (
    <SidebarMenuContext.Provider
      value={{ onMenuPress: !isDesktop ? toggleSidebar : undefined }}
    >
      <GlobalBackground>
        <SEOHead title="Wakeru App" noindex nofollow />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            {/* ── Sidebar: Rendered first so it's behind header ── */}
            <AppSidebar
              open={sidebarOpen}
              collapsed={sidebarCollapsed}
              isDesktop={isDesktop}
              onClose={closeSidebar}
              onToggleCollapsed={toggleCollapsed}
            />

            {/* ── Main Layout Container ── */}
            <View style={[styles.mainContainer, { marginLeft: sidebarMargin }]}>
              {/* ── Offline & Sync Status Banner ── */}
              <View
                pointerEvents="box-none"
                style={{
                  position: 'absolute',
                  top: insets.top + (Platform.OS === 'web' ? 8 : 4),
                  left: 0,
                  right: 0,
                  zIndex: 9999,
                  alignItems: 'center',
                }}
              >
                <SyncStatusIndicator />
              </View>
              {/* ── Body Content: 100% Full Screen Canvas ── */}
              <View style={styles.body}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="trips/[id]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="trips/[id]/stops/[stopId]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="trips/[id]/add-stop"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="trips/[id]/add-expense"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="trips/[id]/expenses"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="trips/join"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="expenses/[id]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="settlements/index"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="settlements/[tripId]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="balances"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="profile/edit"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="create-trip"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="requests"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="analytics"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="quick-actions"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="reminders"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="insights"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="friends"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="privacy"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="receipts/upload"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="finance/add"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_bottom',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="finance/transactions"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="finance/transaction/create"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="finance/transaction/[id]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="finance/transaction/edit/[id]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                      presentation: 'modal',
                    }}
                  />
                  <Stack.Screen
                    name="person/[userId]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="trips/[id]/map"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="appearance"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="invitations"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="achievements"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  {/* Wakeru Local Discovery & Marketplace */}
                  <Stack.Screen
                    name="explore/index"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="explore/business/[id]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="explore/compare"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="bookings/index"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="bookings/[id]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="reservations/[id]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  {/* Vendor Portal */}
                  <Stack.Screen
                    name="vendor/index"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="vendor/business/[id]"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  {/* Admin Operations */}
                  <Stack.Screen
                    name="admin/businesses"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                </Stack>
                <OnboardingModal />
                {shouldShowGlobalBottomBar && <GlobalFloatingTabBar />}
              </View>
            </View>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </GlobalBackground>
    </SidebarMenuContext.Provider>
  );
}

// ============================================================
// STYLES
// ============================================================

function layoutStyles(theme: Theme) {
  return StyleSheet.create({
    gate: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing[6],
    },
    lockIcon: {
      marginBottom: theme.spacing[4],
      padding: theme.spacing[4],
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.primaryBg,
    },
    lockMessage: {
      marginTop: theme.spacing[2],
      maxWidth: 320,
      lineHeight: 22,
    },
    unlockButton: {
      marginTop: theme.spacing[6],
      minWidth: 160,
      minHeight: 48,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.md,
    },
    mainContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    body: {
      flex: 1,
      overflow: 'hidden',
    },
  });
}
