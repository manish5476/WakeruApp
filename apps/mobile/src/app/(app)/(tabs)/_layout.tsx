// app/(app)/(tabs)/_layout.tsx
import React, { useRef, createContext, useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, useRouter, usePathname } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { useUnreadCount } from '../../../hooks';
import { useTheme } from '../../../providers/ThemeProvider';
import AppIcon from '../../../components/common/AppIcon';
import { haptics } from '../../../utils/haptics';
import type { Theme } from '../../../theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// ============================================================
// SIDEBAR MENU CONTEXT — exposes openSidebar to the bottom bar
// ============================================================
export const SidebarMenuContext = createContext<{ onMenuPress?: () => void }>(
  {},
);

// ============================================================
// TAB NAV ITEMS CONFIGURATION
// ============================================================

interface TabNavItem {
  key: string;
  label: string;
  icon: string;
  routeName?: string;
  isExternalRoute?: boolean;
  targetPath?: string;
}

const BOTTOM_NAV_ITEMS: TabNavItem[] = [
  { key: 'dashboard', label: 'Home', icon: 'home', routeName: 'dashboard' },
  { key: 'home', label: 'Trips', icon: 'plane', routeName: 'home' },
  {
    key: 'expenses',
    label: 'Splits',
    icon: 'arrow-left-right',
    routeName: 'expenses',
  },
  { key: 'finance', label: 'Budget', icon: 'wallet', routeName: 'finance' },
  { key: 'profile', label: 'Profile', icon: 'user', routeName: 'profile' },
];

// ============================================================
// CUSTOM LUXURY BOTTOM TAB BAR
// ============================================================

function CustomBottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data: unreadCount = 0 } = useUnreadCount();
  const scrollViewRef = useRef<ScrollView>(null);
  const { onMenuPress } = useContext(SidebarMenuContext);

  const isWebDesktop = Platform.OS === 'web' && width > 768;

  // Hide on desktop — sidebar handles navigation there
  if (isWebDesktop) return null;

  const bottomInset =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, 12)
      : Math.max(insets.bottom, 18);
  const styles = tabStyles(theme, bottomInset);

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View style={styles.barContainer}>
        {/* Glass blur (native only) */}
        {Platform.OS !== 'web' && (
          <BlurView
            tint={theme.isDark ? 'dark' : 'light'}
            intensity={theme.glass.blur || 35}
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
        )}
        <View style={styles.glassTint} />

        {/* ── Hamburger / Menu button ── */}
        {onMenuPress && (
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              onMenuPress();
            }}
            style={styles.menuBtn}
            accessibilityLabel="Open navigation menu"
            accessibilityRole="button"
          >
            <View style={styles.menuBtnInner}>
              <AppIcon
                name="menu"
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Tab pills ── */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {BOTTOM_NAV_ITEMS.map(item => {
            const isExternal = item.isExternalRoute;
            const isFocused = isExternal
              ? pathname.includes('/profile/dashboard')
              : state.routes[state.index]?.name === item.routeName &&
                !pathname.includes('/profile/dashboard');

            const badge =
              item.key === 'profile' && unreadCount > 0
                ? unreadCount
                : undefined;

            const onPress = () => {
              haptics.light();
              if (isExternal && item.targetPath) {
                router.push(item.targetPath as any);
              } else if (item.routeName) {
                const tabRoute = state.routes.find(
                  (r: { name: string | undefined }) =>
                    r.name === item.routeName,
                );
                if (tabRoute) {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: tabRoute.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(tabRoute.name);
                  }
                }
              }
            };

            return (
              <Pressable
                key={item.key}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tabPill,
                  isFocused && styles.tabPillActive,
                  pressed && styles.tabPillPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={`${item.label} tab`}
              >
                <View style={styles.iconWrap}>
                  <AppIcon
                    name={item.icon}
                    size={17}
                    color={
                      isFocused
                        ? theme.colors.textInverse
                        : theme.colors.textSecondary
                    }
                  />
                  {badge !== undefined && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {badge > 99 ? '99+' : badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabText,
                    isFocused ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// ============================================================
// MAIN TAB LAYOUT
// ============================================================

export default function TabLayout() {
  const queryClient = useQueryClient();

  // onMenuPress is injected from (app)/_layout.tsx via context
  const { onMenuPress } = useContext(SidebarMenuContext);

  return (
    <Tabs
      tabBar={(props: any) => <CustomBottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Home' }}
        listeners={{
          focus: () =>
            queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{ title: 'Trips' }}
        listeners={{
          focus: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{ title: 'Trip Splits' }}
        listeners={{
          focus: () =>
            queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{ title: 'Daily Budget' }}
        listeners={{
          focus: () => queryClient.invalidateQueries({ queryKey: ['finance'] }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
        listeners={{
          focus: () =>
            queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] }),
        }}
      />
    </Tabs>
  );
}

// ============================================================
// STYLES
// ============================================================

function tabStyles(theme: Theme, bottomInset: number) {
  return StyleSheet.create({
    floatingWrapper: {
      position: 'absolute',
      bottom: bottomInset,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      paddingHorizontal: 14,
    },
    barContainer: {
      width: '100%',
      maxWidth: 580,
      height: 58,
      borderRadius: 30,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
      ...theme.shadows.lg,
      shadowColor: '#000',
      shadowOpacity: theme.isDark ? 0.45 : 0.12,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 20,
      elevation: 12,
    },
    glassTint: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.isDark
        ? 'rgba(22,22,28,0.85)'
        : 'rgba(255,255,255,0.88)',
      ...(Platform.OS === 'web'
        ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }
        : {}),
    },
    menuBtn: {
      paddingLeft: 10,
      paddingRight: 2,
      height: '100%',
      justifyContent: 'center',
      zIndex: 10,
    },
    menuBtnInner: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      gap: 2,
      minWidth: '100%',
    },
    tabPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 22,
      gap: 5,
      minHeight: 40,
    },
    tabPillActive: {
      backgroundColor: theme.colors.primary,
      ...theme.shadows.sm,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.3,
    },
    tabPillPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.97 }],
    },
    iconWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabText: {
      fontSize: 11.5,
      letterSpacing: -0.2,
    },
    tabTextActive: {
      color: theme.colors.textInverse,
      fontWeight: '700',
    },
    tabTextInactive: {
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    badge: {
      position: 'absolute',
      top: -5,
      right: -8,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      borderWidth: 1.5,
      borderColor: theme.colors.surface,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: '800',
    },
  });
}
