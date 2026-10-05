// src/components/navigation/GlobalFloatingTabBar.tsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';

import { useUnreadCount } from '../../hooks';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';
import { haptics } from '../../utils/haptics';
import type { Theme } from '../../theme';
import { SidebarMenuContext } from '../../app/(app)/(tabs)/_layout';

export interface TabNavItem {
  key: string;
  label: string;
  icon: string;
  route: string;
}

export const GLOBAL_NAV_ITEMS: TabNavItem[] = [
  { key: 'dashboard', label: 'Home', icon: 'home', route: '/(app)/dashboard' },
  { key: 'home', label: 'Trips', icon: 'plane', route: '/(app)/home' },
  {
    key: 'expenses',
    label: 'Splits',
    icon: 'arrow-left-right',
    route: '/(app)/expenses',
  },
  {
    key: 'notifications',
    label: 'Alerts',
    icon: 'bell',
    route: '/(app)/notifications',
  },
  { key: 'profile', label: 'Profile', icon: 'user', route: '/(app)/profile' },
];

export function GlobalFloatingTabBar() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { onMenuPress } = useContext(SidebarMenuContext);

  const isWebDesktop = Platform.OS === 'web' && width > 768;

  // On desktop, the sidebar handles navigation
  if (isWebDesktop) return null;

  const bottomInset =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, 12)
      : Math.max(insets.bottom, 18);
  const styles = tabStyles(theme, bottomInset);
  const showAllLabels = width >= 520;

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View style={styles.barContainer}>
        {/* iOS Blur */}
        {Platform.OS === 'ios' && (
          <BlurView
            tint={theme.isDark ? 'dark' : 'light'}
            intensity={theme.glass.blur || 35}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.glassTint} />

        {/* ── Hamburger Menu Button ── */}
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

        {/* ── Tab Pills ── */}
        <View style={styles.tabsRow}>
          {GLOBAL_NAV_ITEMS.map(item => {
            const isFocused =
              (item.key === 'dashboard' &&
                (pathname === '/dashboard' ||
                  pathname === '/(app)/dashboard' ||
                  pathname === '/(app)' ||
                  pathname === '/')) ||
              (item.key === 'home' &&
                (pathname === '/home' ||
                  pathname.startsWith('/trips') ||
                  pathname.startsWith('/(app)/trips') ||
                  pathname === '/(app)/home')) ||
              (item.key === 'expenses' &&
                (pathname === '/expenses' ||
                  pathname.startsWith('/expenses') ||
                  pathname.startsWith('/(app)/expenses'))) ||
              (item.key === 'notifications' &&
                (pathname === '/notifications' ||
                  pathname.startsWith('/(app)/notifications') ||
                  pathname === '/requests' ||
                  pathname === '/invitations')) ||
              (item.key === 'profile' &&
                (pathname === '/profile' ||
                  pathname.startsWith('/(app)/profile') ||
                  pathname === '/appearance' ||
                  pathname === '/privacy'));

            const badge =
              item.key === 'notifications' && unreadCount > 0
                ? unreadCount
                : undefined;

            const onPress = () => {
              haptics.light();
              router.push(item.route as any);
            };

            const shouldShowLabel = isFocused || showAllLabels;

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
                {shouldShowLabel && (
                  <Text
                    style={[
                      styles.tabText,
                      isFocused ? styles.tabTextActive : styles.tabTextInactive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

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
      shadowOpacity: theme.isDark ? 0.35 : 0.1,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 16,
      ...(Platform.OS === 'android' ? {} : { elevation: 12 }),
    },
    glassTint: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.isDark
        ? Platform.OS === 'android'
          ? 'rgba(15, 23, 42, 0.65)'
          : 'rgba(22,22,28,0.75)'
        : Platform.OS === 'android'
          ? 'rgba(255,255,255,0.72)'
          : 'rgba(255,255,255,0.80)',
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
    tabsRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 4,
      height: '100%',
    },
    tabPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 22,
      gap: 5,
      minHeight: 38,
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
