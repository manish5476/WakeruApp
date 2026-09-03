// src/components/navigation/GlobalHeader.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuthStore } from '../../stores/auth.store';
import { useUnreadCount } from '../../hooks';
import { GlassCard } from './GlassCard';

// ─── Route metadata ───────────────────────────────────────────
interface RouteInfo {
  title: string;
  section?: string;
  icon: string;
}

const ROUTE_MAP: Record<string, RouteInfo> = {
  '/dashboard': { title: 'Dashboard', icon: '⊞' },
  '/home': { title: 'Trips', icon: '✈', section: 'Travel' },
  '/expenses': { title: 'Expenses', icon: '◈', section: 'Finance' },
  '/finance': { title: 'Budget', icon: '◎', section: 'Finance' },
  '/friends': { title: 'Friends', icon: '◉', section: 'Community' },
  '/analytics': { title: 'Analytics', icon: '📊', section: 'Analytics' },
  '/insights': { title: 'Insights', icon: '◈', section: 'Analytics' },
  '/reminders': { title: 'Reminders', icon: '◷', section: 'Productivity' },
  '/templates': { title: 'Templates', icon: '⊡', section: 'Travel' },
  '/profile': { title: 'Profile', icon: '◉' },
  '/notifications': { title: 'Notifications', icon: '🔔' },
  '/requests': { title: 'Settlements', icon: '⇄', section: 'Finance' },
  '/achievements': { title: 'Achievements', icon: '★', section: 'Community' },
  '/invitations': { title: 'Invitations', icon: '✉' },
  '/transactions': { title: 'Transactions', icon: '⊕', section: 'Finance' },
  '/appearance': { title: 'Appearance', icon: '⊙', section: 'Settings' },
  '/privacy': { title: 'Privacy', icon: '🔒', section: 'Settings' },
};

// --- RESTORED HELPER FUNCTION ---
function getRouteInfo(pathname: string): RouteInfo {
  if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname];
  for (const [key, info] of Object.entries(ROUTE_MAP)) {
    if (pathname.startsWith(key + '/')) return info;
  }
  return { title: 'Wakeru', icon: '✈' };
}
// ---------------------------------

const MOBILE_BREAKPOINT = 768;
const HEADER_HEIGHT = 52;

// ─── Props ────────────────────────────────────────────────────
interface GlobalHeaderProps {
  onMenuPress: () => void;
  sidebarOpen?: boolean;
}

// ─── Icon Button ─────────────────────────────────────────────
function HeaderIconBtn({
  label,
  children,
  onPress,
  theme,
  badgeCount,
}: {
  label: string;
  children: React.ReactNode;
  onPress: () => void;
  theme: any;
  badgeCount?: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        iconBtnStyles.btn,
        {
          backgroundColor: hovered
            ? theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)'
            : 'transparent',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {children}
      {badgeCount !== undefined && badgeCount > 0 && (
        <View
          style={[
            iconBtnStyles.badge,
            { backgroundColor: theme.colors.danger },
          ]}
        >
          <Text style={iconBtnStyles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const iconBtnStyles = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '800',
  },
});

// ─── Main Component ───────────────────────────────────────────
export function GlobalHeader({ onMenuPress, sidebarOpen }: GlobalHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useAuthStore(s => s.user);
  const pathname = usePathname();
  const { data: unreadCount = 0 } = useUnreadCount();

  const isDesktop = Platform.OS === 'web' && width > MOBILE_BREAKPOINT;
  const routeInfo = getRouteInfo(pathname);

  // Avatar
  const avatarUri = user?.avatar || user?.photoURL || undefined;
  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <View
      style={{
        paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 12),
        paddingHorizontal: 16,
        paddingBottom: 12,
        zIndex: 100,
      }}
    >
      <GlassCard
        padding="none"
        intensity={theme.isDark ? 20 : 30}
        style={[
          styles.headerPill,
          {
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        <View style={[styles.headerInner, { height: HEADER_HEIGHT }]}>
          {/* ── LEFT ── */}
          <View style={styles.left}>
            {/* Hamburger → ✕ toggle */}
            <HeaderIconBtn
              label="Toggle navigation"
              onPress={onMenuPress}
              theme={theme}
            >
              <Text
                style={[
                  styles.menuIcon,
                  {
                    color: sidebarOpen
                      ? theme.colors.accent
                      : theme.colors.textPrimary,
                    fontWeight: sidebarOpen ? '700' : '500',
                  },
                ]}
              >
                {sidebarOpen ? '✕' : '☰'}
              </Text>
            </HeaderIconBtn>

            {/* Breadcrumb — desktop: section > title; mobile: title only */}
            <View style={styles.breadcrumb}>
              {routeInfo.section && isDesktop && (
                <>
                  <Text
                    style={[
                      styles.breadcrumbSection,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {routeInfo.section}
                  </Text>
                  <Text
                    style={[
                      styles.breadcrumbSep,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    /
                  </Text>
                </>
              )}
              <Text
                style={[
                  styles.breadcrumbTitle,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {routeInfo.title}
              </Text>
            </View>
          </View>

          {/* ── RIGHT ── */}
          <View style={styles.right}>
            {/* Quick search — desktop only */}
            {isDesktop && (
              <Pressable
                onPress={() => router.push('/search')}
                style={[
                  styles.searchPill,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.04)',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.08)',
                  },
                ]}
                accessibilityRole="search"
                accessibilityLabel="Open global search"
              >
                <Text
                  style={[
                    styles.searchIcon,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  ⌕
                </Text>
                <Text
                  style={[
                    styles.searchHint,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Search
                </Text>
                <View
                  style={[
                    styles.kbd,
                    {
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.1)',
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.kbdText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    ⌘K
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Quick action — add expense / trip */}
            <HeaderIconBtn
              label="Quick actions"
              onPress={() => router.push('/quick-actions')}
              theme={theme}
            >
              <Text
                style={[styles.actionIcon, { color: theme.colors.textPrimary }]}
              >
                ⊕
              </Text>
            </HeaderIconBtn>

            {/* Notifications */}
            <HeaderIconBtn
              label="Notifications"
              onPress={() => router.push('/notifications')}
              theme={theme}
              badgeCount={Number(unreadCount)}
            >
              <Text
                style={[styles.actionIcon, { color: theme.colors.textPrimary }]}
              >
                🔔
              </Text>
            </HeaderIconBtn>

            {/* Divider */}
            <View
              style={[
                styles.vertDivider,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.08)',
                },
              ]}
            />

            {/* Avatar */}
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              activeOpacity={0.85}
              style={styles.avatarBtn}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <View
                style={[
                  styles.avatarRing,
                  { borderColor: `${theme.colors.accent}60` },
                ]}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarFallback,
                      { backgroundColor: theme.colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarInitials,
                        { color: theme.colors.textInverse },
                      ]}
                    >
                      {initials}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  headerPill: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
  },

  // Left
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuIcon: {
    fontSize: 18,
    lineHeight: 20,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breadcrumbSection: {
    fontSize: 13,
    fontWeight: '500',
  },
  breadcrumbSep: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.5,
  },
  breadcrumbTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Right
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    marginRight: 4,
  },
  searchIcon: { fontSize: 14, lineHeight: 16 },
  searchHint: { fontSize: 12, fontWeight: '400' },
  kbd: {
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  kbdText: { fontSize: 10, fontWeight: '600' },
  actionIcon: { fontSize: 16, lineHeight: 18 },

  vertDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },

  // Avatar
  avatarBtn: {
    marginLeft: 2,
  },
  avatarRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 10,
    fontWeight: '800',
  },
});
