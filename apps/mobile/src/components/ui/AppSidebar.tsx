import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuthStore } from '../../stores/auth.store';
import { useUnreadCount } from '../../hooks';
import { useUserJourneyState } from '../../hooks/useUserJourneyState';
import { GlassCard } from './GlassCard';
import AppIcon from '../common/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const SIDEBAR_EXPANDED = 270;
const SIDEBAR_COLLAPSED = 72;
const FLOAT_GAP = 12;
const CARD_RADIUS = 24;

// ─────────────────────────────────────────────────────────────────────────────
// NAV DATA
// ─────────────────────────────────────────────────────────────────────────────
interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  match?: string[];
  badge?: number;
  tag?: 'new' | 'beta' | 'soon' | 'pro';
}

interface NavSection {
  id: string;
  title: string;
  count: number;
  items: NavItem[];
  defaultOpen: boolean;
}

const PRIMARY: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', route: '/dashboard' },
  {
    id: 'trips',
    label: 'My Trips',
    icon: 'plane',
    route: '/home',
    match: ['/trips'],
  },
  { id: 'expenses', label: 'Expenses', icon: 'receipt', route: '/expenses' },
  {
    id: 'budget',
    label: 'Regular Expenses',
    icon: 'wallet',
    route: '/finance',
  },
];

const SECTIONS: NavSection[] = [
  {
    id: 'travel',
    title: 'Travel & Local',
    count: 3,
    defaultOpen: true,
    items: [
      {
        id: 'explore',
        label: 'Explore Local',
        icon: 'compass',
        route: '/explore',
      },
      {
        id: 'bookings',
        label: 'My Bookings',
        icon: 'calendar',
        route: '/bookings',
      },
      {
        id: 'reminders',
        label: 'Reminders',
        icon: 'bell',
        route: '/reminders',
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    count: 3,
    defaultOpen: true,
    items: [
      {
        id: 'Requests',
        label: 'Requests',
        icon: 'arrow-left-right',
        route: '/requests',
      },
      {
        id: 'transactions',
        label: 'Transactions',
        icon: 'banknote',
        route: '/finance/transactions',
      },
      {
        id: 'settlements',
        label: 'Settlements',
        icon: 'circle-check',
        route: '/settlements',
      },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    count: 3,
    defaultOpen: true,
    items: [
      { id: 'friends', label: 'Friends', icon: 'users', route: '/friends' },
      {
        id: 'invites',
        label: 'Invitations',
        icon: 'mail',
        route: '/invitations',
      },
      {
        id: 'achievements',
        label: 'Achievements',
        icon: 'award',
        route: '/achievements',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    count: 2,
    defaultOpen: true,
    items: [
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'bar-chart-2',
        route: '/analytics',
      },
      {
        id: 'insights',
        label: 'Insights',
        icon: 'sparkles',
        route: '/insights',
        tag: 'pro',
      },
    ],
  },
  {
    id: 'merchant',
    title: 'Merchant & Local Partners',
    count: 1,
    defaultOpen: false,
    items: [
      {
        id: 'vendor',
        label: 'Vendor Portal',
        icon: 'store',
        route: '/vendor',
        tag: 'pro',
      },
    ],
  },
  {
    id: 'management',
    title: 'Platform Admin',
    count: 1,
    defaultOpen: false,
    items: [
      {
        id: 'admin',
        label: 'Admin Console',
        icon: 'shield-check',
        route: '/admin/businesses',
        tag: 'pro',
      },
    ],
  },
];

const SETTINGS_ITEMS: NavItem[] = [
  { id: 'profile', label: 'Profile', icon: 'user', route: '/profile' },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: 'palette',
    route: '/appearance',
  },
  { id: 'privacy', label: 'Privacy', icon: 'lock', route: '/privacy' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────
function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.route) return true;
  if (pathname.startsWith(item.route + '/')) return true;
  if (item.match) return item.match.some(m => pathname.startsWith(m));
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV ROW
// ─────────────────────────────────────────────────────────────────────────────
function NavRow({
  item,
  active,
  collapsed,
  onPress,
  theme,
  indent,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onPress: () => void;
  theme: any;
  indent?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 400,
      friction: 20,
    }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 400,
      friction: 20,
    }).start();

  const activeBg = theme.isDark
    ? 'rgba(37,99,235,0.22)'
    : 'rgba(37,99,235,0.12)';
  const hoverBg = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        accessibilityLabel={item.label}
        {...(Platform.OS === 'web' ? ({ title: item.label } as any) : {})}
        style={[
          rowStyles.row,
          indent && !collapsed && rowStyles.indented,
          collapsed && rowStyles.colRow,
          active && { backgroundColor: activeBg },
          hovered && !active && { backgroundColor: hoverBg },
          Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
        ]}
      >
        {active && (
          <View
            style={[rowStyles.bar, { backgroundColor: theme.colors.primary }]}
          />
        )}
        <View
          style={[
            rowStyles.iconBubble,
            active && { backgroundColor: `${theme.colors.primary}25` },
          ]}
        >
          <AppIcon
            name={item.icon}
            size={17}
            color={active ? theme.colors.primary : theme.colors.textSecondary}
          />
        </View>
        {!collapsed && (
          <>
            <Text
              style={[
                rowStyles.label,
                {
                  color: active
                    ? theme.colors.primary
                    : theme.colors.textPrimary,
                  fontWeight: active ? '800' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {item.badge !== undefined && item.badge > 0 && (
              <View
                style={[
                  rowStyles.badge,
                  { backgroundColor: theme.colors.danger },
                ]}
              >
                <Text style={rowStyles.badgeText}>
                  {item.badge > 99 ? '99+' : item.badge}
                </Text>
              </View>
            )}
            {item.tag && !item.badge && (
              <View
                style={[
                  rowStyles.tag,
                  {
                    backgroundColor:
                      item.tag === 'pro'
                        ? `${theme.colors.primary}20`
                        : theme.isDark
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <Text
                  style={[
                    rowStyles.tagText,
                    {
                      color:
                        item.tag === 'pro'
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {item.tag.toUpperCase()}
                </Text>
              </View>
            )}
          </>
        )}
        {collapsed && item.badge !== undefined && item.badge > 0 && (
          <View
            style={[
              rowStyles.collapsedDot,
              { backgroundColor: theme.colors.danger },
            ]}
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    paddingVertical: 7,
    paddingHorizontal: 8,
    gap: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  indented: { marginLeft: 18 },
  colRow: { justifyContent: 'center', paddingHorizontal: 0 },
  bar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3.5,
    borderRadius: 2,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 13.5, letterSpacing: -0.2 },
  badge: {
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  tag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  collapsedDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────
function SectionGroup({
  section,
  collapsed,
  pathname,
  onNavigate,
  theme,
  isOpen,
  onToggle,
}: {
  section: NavSection;
  collapsed: boolean;
  pathname: string;
  onNavigate: (r: string) => void;
  theme: any;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const arrowAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(arrowAnim, {
        toValue: isOpen ? 1 : 0,
        useNativeDriver: true,
        tension: 240,
        friction: 20,
      }),
      Animated.timing(heightAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isOpen]);

  const arrowDeg = arrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, section.items.length * 48],
  });

  if (collapsed) {
    return (
      <>
        <View style={{ alignItems: 'center', paddingVertical: 6 }}>
          <View
            style={[
              sgStyles.collapsedDot,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(0,0,0,0.12)',
              },
            ]}
          />
        </View>
        {section.items.map(item => (
          <NavRow
            key={item.id}
            item={item}
            active={isActive(pathname, item)}
            collapsed={true}
            onPress={() => onNavigate(item.route)}
            theme={theme}
          />
        ))}
      </>
    );
  }

  return (
    <View style={sgStyles.wrap}>
      <TouchableOpacity
        onPress={onToggle}
        style={sgStyles.header}
        activeOpacity={0.7}
      >
        <Text style={[sgStyles.title, { color: theme.colors.textSecondary }]}>
          {section.title}
          <Text style={{ fontWeight: '500', opacity: 0.8 }}>
            {' '}
            · {section.count}
          </Text>
        </Text>
        <Animated.Text
          style={[
            sgStyles.arrow,
            {
              color: theme.colors.textSecondary,
              transform: [{ rotate: arrowDeg }],
            },
          ]}
        >
          ›
        </Animated.Text>
      </TouchableOpacity>
      <Animated.View style={{ overflow: 'hidden', maxHeight }}>
        {section.items.map(item => (
          <NavRow
            key={item.id}
            item={item}
            active={isActive(pathname, item)}
            collapsed={false}
            onPress={() => onNavigate(item.route)}
            theme={theme}
            indent
          />
        ))}
      </Animated.View>
    </View>
  );
}

const sgStyles = StyleSheet.create({
  wrap: { marginTop: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  arrow: { fontSize: 16, fontWeight: '800', lineHeight: 16 },
  collapsedDot: { width: 20, height: 1.5, borderRadius: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// USER HERO
// ─────────────────────────────────────────────────────────────────────────────
function UserHero({
  user,
  theme,
  collapsed,
  onPress,
  unreadCount = 0,
  onNotificationsPress,
  onToggleCollapse,
}: {
  user: any;
  theme: any;
  collapsed: boolean;
  onPress: () => void;
  unreadCount?: number;
  onNotificationsPress?: () => void;
  onToggleCollapse?: () => void;
}) {
  const avatarUri = user?.avatar || user?.photoURL;
  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '👋' : '🌙';

  if (collapsed) {
    return (
      <View style={heroStyles.collapsedHero}>
        <TouchableOpacity
          onPress={onPress}
          style={{ padding: 4 }}
          activeOpacity={0.8}
        >
          <View
            style={[
              heroStyles.avatarRing,
              { borderColor: `${theme.colors.primary}70` },
            ]}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={heroStyles.avatar as any}
              />
            ) : (
              <View
                style={[
                  heroStyles.avatar,
                  heroStyles.fallback,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text
                  style={[
                    heroStyles.initials,
                    { color: theme.colors.textInverse },
                  ]}
                >
                  {initials}
                </Text>
              </View>
            )}
            <View
              style={[
                heroStyles.onlineDot,
                { backgroundColor: theme.colors.success },
              ]}
            />
          </View>
        </TouchableOpacity>

        {onNotificationsPress && (
          <TouchableOpacity
            onPress={onNotificationsPress}
            style={[
              heroStyles.collapsedActionBtn,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
            accessibilityLabel="Notifications"
            {...(Platform.OS === 'web'
              ? ({ title: 'Notifications' } as any)
              : {})}
          >
            <AppIcon
              name="bell"
              size={16}
              color={
                unreadCount > 0
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            {unreadCount > 0 && (
              <View
                style={[
                  heroStyles.collapsedNotifDot,
                  { backgroundColor: theme.colors.danger },
                ]}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={heroStyles.heroWrapper}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={heroStyles.hero}
      >
        <View
          style={[
            heroStyles.avatarRing,
            { borderColor: `${theme.colors.primary}70` },
          ]}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={heroStyles.avatar as any}
            />
          ) : (
            <View
              style={[
                heroStyles.avatar,
                heroStyles.fallback,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                style={[
                  heroStyles.initials,
                  { color: theme.colors.textInverse },
                ]}
              >
                {initials}
              </Text>
            </View>
          )}
          <View
            style={[
              heroStyles.onlineDot,
              { backgroundColor: theme.colors.success },
            ]}
          />
        </View>
        <View style={heroStyles.info}>
          <Text
            style={[heroStyles.greeting, { color: theme.colors.textTertiary }]}
          >
            {greeting} {greetingEmoji}
          </Text>
          <Text
            style={[heroStyles.name, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {user?.displayName || 'Traveler'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={heroStyles.heroActions}>
        {onNotificationsPress && (
          <TouchableOpacity
            onPress={onNotificationsPress}
            style={[
              heroStyles.actionBtn,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
            accessibilityLabel="Notifications"
            {...(Platform.OS === 'web'
              ? ({ title: 'Notifications' } as any)
              : {})}
          >
            <AppIcon
              name="bell"
              size={16}
              color={
                unreadCount > 0
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            {unreadCount > 0 && (
              <View
                style={[
                  heroStyles.notifBadge,
                  { backgroundColor: theme.colors.danger },
                ]}
              >
                <Text style={heroStyles.notifBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {onToggleCollapse && (
          <TouchableOpacity
            onPress={onToggleCollapse}
            style={[
              heroStyles.actionBtn,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
            accessibilityLabel="Collapse sidebar"
            {...(Platform.OS === 'web'
              ? ({ title: 'Collapse sidebar' } as any)
              : {})}
          >
            <AppIcon
              name="chevron-left"
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  heroWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  hero: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  collapsedHero: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  collapsedActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    padding: 2,
    position: 'relative',
  },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 13, fontWeight: '900' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  info: { flex: 1 },
  greeting: { fontSize: 11.5, fontWeight: '600', marginBottom: 1 },
  name: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: { color: '#FFF', fontSize: 8.5, fontWeight: '900' as const },
  collapsedNotifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
function SectionLabel({
  label,
  count,
  collapsed,
  theme,
}: {
  label: string;
  count: number;
  collapsed: boolean;
  theme: any;
}) {
  if (collapsed) return null;
  return (
    <View style={slStyles.row}>
      <Text style={[slStyles.label, { color: theme.colors.textTertiary }]}>
        {label}
        <Text style={{ opacity: 0.6, fontWeight: '500' }}> · {count}</Text>
      </Text>
    </View>
  );
}
const slStyles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────────────────────
function Divider({ theme }: { theme: any }) {
  return (
    <View
      style={[
        divStyles.line,
        {
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(15,23,42,0.06)',
        },
      ]}
    />
  );
}
const divStyles = StyleSheet.create({
  line: { height: 1, marginHorizontal: 14, marginVertical: 8 },
});

// ─────────────────────────────────────────────────────────────────────────────
// CREATE FAB
// ─────────────────────────────────────────────────────────────────────────────
function CreateFAB({
  collapsed,
  theme,
  onPress,
}: {
  collapsed: boolean;
  theme: any;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        collapsed
          ? { alignItems: 'center', paddingVertical: 12 }
          : { paddingHorizontal: 12, paddingVertical: 12 },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel="Create new"
        {...(Platform.OS === 'web' ? ({ title: 'Create new' } as any) : {})}
        style={[
          collapsed ? fabStyles.collapsedBtn : fabStyles.btn,
          // Gradient background used instead
          Platform.OS === 'web' && ({ cursor: 'pointer' } as any),
        ]}
      >
        <LinearGradient
          colors={['#2563EB', '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: collapsed ? 24 : 16 },
          ]}
        />
        <AppIcon name="plus" size={20} color="#FFF" />
        {!collapsed && (
          <View>
            <Text style={fabStyles.fabLabel}>Create new</Text>
            <Text style={fabStyles.fabSub}>Or use invite link</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const fabStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  collapsedBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  fabLabel: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  fabSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export interface AppSidebarProps {
  open: boolean;
  collapsed: boolean;
  isDesktop?: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
}

export function AppSidebar({
  open,
  collapsed,
  isDesktop,
  onClose,
  onToggleCollapsed,
}: AppSidebarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadCount();

  // Animation values
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_EXPANDED - 40)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(
    new Animated.Value(collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED),
  ).current;

  const journey = useUserJourneyState();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        SECTIONS.map(s => [s.id, journey.isNewUser ? false : s.defaultOpen]),
      ),
  );
  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Sync open state
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: open ? 0 : -SIDEBAR_EXPANDED - 40,
        useNativeDriver: false,
        tension: 220,
        friction: 24,
      }),
      Animated.timing(backdropAnim, {
        toValue: open ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [open]);

  // Sync collapse state
  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
      useNativeDriver: false,
      tension: 180,
      friction: 22,
    }).start();
  }, [collapsed]);

  const navigate = useCallback(
    (route: string) => router.push(route as any),
    [router],
  );

  // Layout Offsets: clean floating position from top to bottom
  const topOffset = insets.top + 16;
  const bottomOffset = Math.max(insets.bottom + FLOAT_GAP + 16, FLOAT_GAP + 16);

  return (
    <>
      {/* ── Backdrop ── */}
      {!isDesktop && (
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={[
            StyleSheet.absoluteFill,
            rootStyles.backdrop,
            { opacity: backdropAnim },
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* ── Floating sidebar card ── */}
      <Animated.View
        style={[
          rootStyles.floatingCard,
          {
            top: topOffset,
            bottom: bottomOffset,
            left: FLOAT_GAP,
            width: widthAnim,
            transform: [{ translateX: slideAnim }],
            shadowColor: theme.isDark ? '#000' : 'rgba(0,0,0,0.15)',
          },
        ]}
      >
        <GlassCard
          variant="prominent"
          padding="none"
          style={[
            {
              flex: 1,
              minHeight: 0,
              borderRadius: CARD_RADIUS,
              overflow: 'hidden',
              backgroundColor: theme.isDark
                ? 'rgba(15, 23, 42, 0.90)'
                : 'rgba(255, 255, 255, 0.92)',
              borderWidth: 1,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(15,23,42,0.08)',
            },
            Platform.OS === 'web' &&
              ({
                background: theme.isDark
                  ? 'rgba(15, 23, 42, 0.90)'
                  : 'rgba(255, 255, 255, 0.94)',

                backdropFilter: 'blur(32px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(32px) saturate(1.8)',

                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(15,23,42,0.08)',

                ...Platform.select({
                  web: {
                    boxShadow: theme.isDark
                      ? '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : '0 12px 36px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
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
              } as any),
          ]}
        >
          <ScrollView
            style={{ flex: 1, minHeight: 0 }}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            {/* User Hero */}
            <UserHero
              user={user}
              theme={theme}
              collapsed={collapsed}
              onPress={() => navigate('/profile')}
              unreadCount={unreadCount}
              onNotificationsPress={() => navigate('/notifications')}
              onToggleCollapse={onToggleCollapsed}
            />

            <Divider theme={theme} />

            {/* Menu */}
            <SectionLabel
              label="Menu"
              count={PRIMARY.length}
              collapsed={collapsed}
              theme={theme}
            />
            {PRIMARY.map(item => (
              <NavRow
                key={item.id}
                item={item}
                active={isActive(pathname, item)}
                collapsed={collapsed}
                onPress={() => navigate(item.route)}
                theme={theme}
              />
            ))}

            {/* Dynamic Sections */}
            {SECTIONS.map(section => (
              <SectionGroup
                key={section.id}
                section={section}
                collapsed={collapsed}
                pathname={pathname}
                onNavigate={navigate}
                theme={theme}
                isOpen={openSections[section.id]}
                onToggle={() => toggleSection(section.id)}
              />
            ))}

            <Divider theme={theme} />

            {/* Settings */}
            <SectionLabel
              label="Settings"
              count={SETTINGS_ITEMS.length}
              collapsed={collapsed}
              theme={theme}
            />
            {SETTINGS_ITEMS.map(item => (
              <NavRow
                key={item.id}
                item={item}
                active={isActive(pathname, item)}
                collapsed={collapsed}
                onPress={() => navigate(item.route)}
                theme={theme}
              />
            ))}
          </ScrollView>

          {/* Bottom Fixed FAB Area - Positioned absolutely over the ScrollView */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderTopWidth: 1,
              borderTopColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(15,23,42,0.06)',
              backgroundColor: theme.isDark
                ? 'rgba(15, 23, 42, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <CreateFAB
              collapsed={collapsed}
              theme={theme}
              onPress={() => navigate('/quick-actions')}
            />
          </View>
        </GlassCard>

        {/* Collapse toggle tab */}
        <TouchableOpacity
          onPress={onToggleCollapsed}
          style={[
            rootStyles.collapseTab,
            {
              backgroundColor: theme.isDark ? '#1E293B' : '#FFFFFF',
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(15,23,42,0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              rootStyles.collapseTabIcon,
              { color: theme.colors.textPrimary },
            ]}
          >
            {collapsed ? '›' : '‹'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT STYLES
// ─────────────────────────────────────────────────────────────────────────────
const rootStyles = StyleSheet.create({
  backdrop: { zIndex: 150, backgroundColor: 'rgba(0,0,0,0.45)' },
  floatingCard: {
    position: 'absolute',
    zIndex: 200,
    borderRadius: CARD_RADIUS,
    shadowOffset: { width: 4, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 20,
  },
  collapseTab: {
    position: 'absolute',
    right: -14,
    top: '50%',
    marginTop: -18,
    width: 26,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  collapseTabIcon: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
});
