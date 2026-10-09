// src/app/(app)/person/[userId].tsx
// Redesigned Friends Details Page — modern fintech/travel app aesthetic.
// OpenStreetMap (free) map via WebView, trip cards with curated destination images, KPI stat cards.

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  Pressable,
  RefreshControl,
  Image,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, formatDistanceToNow } from 'date-fns';

import {
  usePersonProfile,
  useSharedExpenses,
  useSettlementOptions,
  usePersonActivity,
  useSharedTrips,
} from '../../../hooks/usePerson';
import { useTheme } from '../../../providers/ThemeProvider';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/ui/StatCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Avatar } from '../../../components/ui/Avatar';
import { InteractiveWrapper } from '../../../components/ui/InteractiveWrapper';
import { haptics } from '../../../utils/haptics';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import AppIcon from '../../../components/common/AppIcon';
import { getTripCoverImage } from '../../../utils/tripImage';
import {
  LeafletMapView,
  type MapMarker,
} from '../../../components/person/LeafletMapView';

// ============================================================
// CONSTANTS
// ============================================================

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',
  stay: '#8B5CF6',
  transport: '#3B82F6',
  activity: '#10B981',
  shopping: '#EC4899',
  health: '#EF4444',
  other: '#6366F1',
};

const FRIENDSHIP_LABELS: Record<
  string,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  friend: {
    label: 'Friend',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'users',
  },
  pending_sent: {
    label: 'Request Sent',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'clock',
  },
  pending_received: {
    label: 'Wants to be friends',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: 'user-plus',
  },
  blocked: {
    label: 'Blocked',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'slash',
  },
  none: {
    label: 'Not connected',
    color: '#4B5563',
    bgColor: '#F3F4F6',
    icon: 'user',
  },
  self: { label: 'You', color: '#6366F1', bgColor: '#E0E7FF', icon: 'user' },
};

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getInitials(name: string): string {
  return (
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

// ============================================================
// SKELETON COMPONENTS
// ============================================================

function SkeletonBox({
  width,
  height,
  style,
}: {
  width?: number | string;
  height: number;
  style?: any;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius: 10,
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.07)',
        },
        style,
      ]}
    />
  );
}

function SkeletonProfile() {
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
      <SkeletonBox width={96} height={96} style={{ borderRadius: 48 }} />
      <SkeletonBox width={160} height={22} />
      <SkeletonBox width={120} height={14} />
      <SkeletonBox width={100} height={30} style={{ borderRadius: 20 }} />
      <View style={{ flexDirection: 'row', gap: 24, marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <SkeletonBox width={44} height={24} />
            <SkeletonBox width={44} height={12} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SkeletonKPI() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={{ flex: 1, minWidth: 130 }}>
          <SkeletonBox height={100} style={{ borderRadius: 18 }} />
        </View>
      ))}
    </View>
  );
}

function SkeletonTripCard() {
  return (
    <SkeletonBox height={200} style={{ borderRadius: 20, marginBottom: 12 }} />
  );
}

function SkeletonExpenseRow() {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surface,
        marginBottom: 10,
      }}
    >
      <SkeletonBox width={44} height={44} style={{ borderRadius: 12 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBox height={14} />
        <SkeletonBox width="60%" height={11} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <SkeletonBox width={60} height={16} />
        <SkeletonBox width={40} height={12} />
      </View>
    </View>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: string;
  title: string;
  count?: number;
}) {
  const theme = useTheme();
  return (
    <View style={sh.row}>
      <View
        style={[sh.iconWrap, { backgroundColor: `${theme.colors.primary}14` }]}
      >
        <AppIcon name={icon as any} size={15} color={theme.colors.primary} />
      </View>
      <Text style={[sh.title, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
      {count != null && count > 0 && (
        <Badge label={count.toString()} variant="neutral" />
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingLeft: 2,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', flex: 1 },
});

// ── Trip Card (reuses getTripCoverImage + TripCard design patterns) ──────────
function SharedTripCard({ trip, onPress }: { trip: any; onPress: () => void }) {
  const coverUri = getTripCoverImage(trip);
  const [imgUri, setImgUri] = useState(coverUri);

  const statusMap: Record<
    string,
    {
      label: string;
      variant: 'success' | 'info' | 'warning' | 'neutral' | 'primary';
    }
  > = {
    active: { label: '🟢 Live', variant: 'success' },
    planning: { label: '📅 Planning', variant: 'info' },
    completed: { label: '✅ Done', variant: 'primary' },
    archived: { label: 'Archived', variant: 'neutral' },
  };
  const status = statusMap[trip.status] || {
    label: trip.status,
    variant: 'neutral' as const,
  };

  const dateStr =
    trip.startDate && trip.endDate
      ? `${format(new Date(trip.startDate), 'MMM d')} – ${format(new Date(trip.endDate), 'MMM d, yyyy')}`
      : '';
  const totalSpent = trip.totalSpentBase || 0;
  const expenseCount = (trip.stops || []).reduce(
    (acc: number, s: any) => acc + (s.expenseCount || 0),
    0,
  );
  const memberCount = (trip.members || []).filter(
    (m: any) => m.isActive !== false,
  ).length;

  const stopNames = (trip.stops || [])
    .map((s: any) => (typeof s === 'string' ? s : s?.name || s?.title))
    .filter(Boolean);
  const destinationText =
    stopNames.length > 0 ? stopNames.slice(0, 3).join(' → ') : '';

  const isActive = trip.status === 'active' || trip.status === 'planning';
  const daysLeft =
    isActive && trip.endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(trip.endDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  return (
    <InteractiveWrapper onPress={onPress} hoverElevation>
      <View
        style={[
          tripStyle.card,
          { overflow: 'hidden', borderRadius: 20, backgroundColor: '#1E293B' },
        ]}
      >
        {/* Cover image */}
        <Image
          source={{ uri: imgUri }}
          style={tripStyle.image}
          resizeMode="cover"
          onError={() => {
            const fallback =
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
            if (imgUri !== fallback) setImgUri(fallback);
          }}
        />
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.85)']}
          locations={[0.2, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top badge row */}
        <View style={tripStyle.badgeRow}>
          <Badge label={status.label} variant={status.variant} />
          {isActive && daysLeft > 0 && daysLeft <= 30 && (
            <View style={tripStyle.countdownPill}>
              <Text style={tripStyle.countdownText}>⏳ {daysLeft}d left</Text>
            </View>
          )}
        </View>

        {/* Bottom content overlay */}
        <View style={tripStyle.overlay}>
          {destinationText ? (
            <Text style={tripStyle.destinationTag} numberOfLines={1}>
              📍 {destinationText}
            </Text>
          ) : null}
          <Text style={tripStyle.tripTitle} numberOfLines={1}>
            {trip.title}
          </Text>
          {dateStr ? <Text style={tripStyle.dateText}>{dateStr}</Text> : null}
          <View style={tripStyle.metaRow}>
            <Text style={tripStyle.metaText}>{formatCurrency(totalSpent)}</Text>
            <View style={tripStyle.metaDots}>
              <Text style={tripStyle.metaDot}>👥 {memberCount}</Text>
              {expenseCount > 0 && (
                <Text style={tripStyle.metaDot}>🧾 {expenseCount}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </InteractiveWrapper>
  );
}

const tripStyle = StyleSheet.create({
  card: { width: '100%', height: 210, position: 'relative' },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  countdownPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  destinationTag: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  overlay: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
    ...Platform.select({
      web: { textShadow: '0px 1px 4px rgba(0,0,0,0.8)' } as any,
      default: {
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.88)',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  metaDots: { flexDirection: 'row', gap: 10 },
  metaDot: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
});

// ── Expense Row ────────────────────────────────────────────────
function ExpenseRow({ expense }: { expense: any }) {
  const theme = useTheme();
  const emoji = CATEGORY_EMOJIS[expense.category] || '📦';
  const catColor = CATEGORY_COLORS[expense.category] || '#6366F1';
  const direction = expense.direction;

  return (
    <Pressable
      style={({ hovered }: any) => [
        expStyle.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
        },
        Platform.OS === 'web' &&
          hovered && { transform: [{ translateY: -1 }], shadowOpacity: 0.08 },
      ]}
      onPress={() => router.push(`/(app)/expenses/${expense._id}`)}
    >
      <View style={[expStyle.emojiWrap, { backgroundColor: `${catColor}18` }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={expStyle.info}>
        <Text
          style={[expStyle.title, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {expense.title}
        </Text>
        <Text
          style={[expStyle.meta, { color: theme.colors.textTertiary }]}
          numberOfLines={1}
        >
          {format(new Date(expense.date), 'MMM d, yyyy')}
          {expense.tripName ? ` · ${expense.tripName}` : ''}
        </Text>
      </View>
      <View style={expStyle.right}>
        <Text
          style={[
            expStyle.amount,
            { color: direction === 'you_paid' ? '#DC2626' : '#059669' },
          ]}
        >
          {direction === 'you_paid' ? '-' : '+'}
          {formatCurrency(expense.amountBase)}
        </Text>
        <View
          style={[
            expStyle.pill,
            {
              backgroundColor: direction === 'you_paid' ? '#FEE2E2' : '#D1FAE5',
            },
          ]}
        >
          <Text
            style={[
              expStyle.pillText,
              { color: direction === 'you_paid' ? '#DC2626' : '#059669' },
            ]}
          >
            {direction === 'you_paid' ? 'PAID' : 'OWES'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const expStyle = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '0.15s',
  } as any,
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  meta: { fontSize: 12, fontWeight: '400' },
  right: { alignItems: 'flex-end', gap: 5 },
  amount: { fontSize: 15, fontWeight: '800' },
  pill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
});

// ── Activity Row ───────────────────────────────────────────────
function ActivityRow({ activity }: { activity: any }) {
  const theme = useTheme();
  const emoji = CATEGORY_EMOJIS[activity.category] || '📦';
  const catColor = CATEGORY_COLORS[activity.category] || '#6366F1';

  return (
    <View
      style={[
        actStyle.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
        },
      ]}
    >
      <View style={[actStyle.emojiWrap, { backgroundColor: `${catColor}18` }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={actStyle.info}>
        <Text
          style={[actStyle.title, { color: theme.colors.textPrimary }]}
          numberOfLines={2}
        >
          {activity.description}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 3,
          }}
        >
          <Text style={[actStyle.meta, { color: theme.colors.textTertiary }]}>
            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
          </Text>
          {activity.tripName && (
            <Text style={[actStyle.tripTag, { color: theme.colors.primary }]}>
              · {activity.tripName}
            </Text>
          )}
        </View>
      </View>
      <Text style={[actStyle.amount, { color: theme.colors.textPrimary }]}>
        {formatCurrency(activity.amount)}
      </Text>
    </View>
  );
}

const actStyle = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 14, fontWeight: '500' },
  meta: { fontSize: 12 },
  tripTag: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 14, fontWeight: '700' },
});

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PersonDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const isDesktop = Platform.OS === 'web' && width >= 960;
  const isTablet = width >= 640;

  // ── API HOOKS ──────────────────────────────────────
  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = usePersonProfile(userId);
  const {
    data: expensesData,
    isLoading: expensesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchExpenses,
  } = useSharedExpenses(userId);
  const { data: settlementData } = useSettlementOptions(userId);
  const { data: activityData } = usePersonActivity(userId, 8);
  const {
    data: tripsData,
    isLoading: tripsLoading,
    fetchNextPage: fetchNextTrips,
    hasNextPage: hasNextTrips,
    isFetchingNextPage: isFetchingNextTrips,
    refetch: refetchTrips,
  } = useSharedTrips(userId);

  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'overview' | 'trips' | 'expenses' | 'map' | 'activity'
  >('overview');

  // ── EXTRACT DATA ──────────────────────────────────
  const profile = profileData?.person;
  const profileBalance = profileData?.balance;
  const settlementBalance = settlementData?.balance;
  const settlementOptions = settlementData?.options || [];

  const balance = profileBalance ||
    settlementBalance || {
      youOwe: 0,
      theyOwe: 0,
      netBalance: 0,
      baseCurrency: 'INR',
      pendingSettlementCount: 0,
    };
  const activity = Array.isArray(activityData) ? activityData : [];

  const expenses = useMemo(
    () =>
      expensesData?.pages?.flatMap((page: any) => page?.expenses || []) || [],
    [expensesData],
  );
  const totalExpenses = expensesData?.pages?.[0]?.pagination?.total || 0;

  const trips = useMemo(
    () => tripsData?.pages?.flatMap((page: any) => page?.trips || []) || [],
    [tripsData],
  );

  const friendshipStatus = profile?.friendshipStatus || 'none';
  const friendshipInfo =
    FRIENDSHIP_LABELS[friendshipStatus] || FRIENDSHIP_LABELS.none;
  const netBalance = balance?.netBalance || 0;
  const personName = profile?.displayName || 'Person';

  // ── MAP MARKERS from expenses AND trips ─────────────────────
  const mapMarkers: MapMarker[] = useMemo(() => {
    const seen = new Set<string>();
    const list: MapMarker[] = [];

    // 1. From shared expenses
    expenses.forEach((e: any) => {
      const lat = e.location?.lat ?? e.lat ?? e.coordinates?.lat;
      const lng = e.location?.lng ?? e.lng ?? e.coordinates?.lng;
      if (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat !== 0 &&
        lng !== 0
      ) {
        const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: e._id,
            lat,
            lng,
            title: e.title,
            amount: e.amountBase,
            currency: e.currency || 'INR',
            category: e.category,
            tripName: e.tripName,
            emoji: CATEGORY_EMOJIS[e.category] || '📦',
            type: 'expense',
          });
        }
      }
    });

    // 2. From shared trips stops
    trips.forEach((t: any) => {
      (t.stops || []).forEach((s: any) => {
        const lat = s.location?.lat;
        const lng = s.location?.lng;
        if (
          typeof lat === 'number' &&
          typeof lng === 'number' &&
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat !== 0 &&
          lng !== 0
        ) {
          const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              id: s._id || `${t._id}-${s.name || s.title}`,
              lat,
              lng,
              title: s.name || s.title || t.title,
              amount: s.totalSpentBase || 0,
              currency: s.currency || t.baseCurrency || 'INR',
              category: 'stay',
              tripName: t.title,
              emoji: s.emoji || '📍',
              type: 'stop',
              subtitle: s.location?.formattedAddress || `Stop on ${t.title}`,
            });
          }
        }
      });
    });

    return list.slice(0, 150);
  }, [expenses, trips]);

  // ── HANDLERS ──────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProfile(), refetchExpenses(), refetchTrips()]);
    } catch (_) {}
    setRefreshing(false);
  }, [refetchProfile, refetchExpenses, refetchTrips]);

  const handleLoadMoreExpenses = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const handleLoadMoreTrips = () => {
    if (hasNextTrips && !isFetchingNextTrips) fetchNextTrips();
  };

  const handleSettlementAction = (option: any) => {
    haptics.medium();
    const amount = formatCurrency(option.data?.amount || 0);
    switch (option.type) {
      case 'upi':
        Alert.alert('UPI Payment', `${option.label} to ${personName}?`, [
          { text: 'Open UPI', style: 'default' },
          { text: 'Cancel', style: 'cancel' },
        ]);
        break;
      case 'remind':
        Alert.alert(
          'Reminder',
          `Send payment reminder to ${personName} for ${amount}?`,
          [
            {
              text: 'Send',
              onPress: () => Alert.alert('Sent!', 'Reminder has been sent.'),
            },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        break;
      case 'cash':
        Alert.alert('Mark as Paid', `Mark ${amount} as paid by cash?`, [
          {
            text: 'Yes',
            onPress: () => Alert.alert('Done!', 'Marked as paid.'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
        break;
    }
  };

  // ── LOADING STATE ─────────────────────────────────
  if (profileLoading && !refreshing && !profile) {
    return (
      <GlobalBackground>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 12,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <AppIcon
              name="arrow-left"
              size={22}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          >
            Profile
          </Text>
          <View style={styles.headerBtn} />
        </View>
        <ScrollView
          contentContainerStyle={[
            styles.skeletonContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
        >
          <SkeletonProfile />
          <View style={{ height: 16 }} />
          <SkeletonKPI />
          <View style={{ height: 20 }} />
          <SkeletonBox height={18} width={140} style={{ marginBottom: 14 }} />
          <SkeletonTripCard />
          <SkeletonTripCard />
          <View style={{ height: 20 }} />
          <SkeletonBox height={18} width={160} style={{ marginBottom: 14 }} />
          {[0, 1, 2].map(i => (
            <SkeletonExpenseRow key={i} />
          ))}
        </ScrollView>
      </GlobalBackground>
    );
  }

  // ── BALANCE GRADIENT CONFIG ────────────────────────
  const balanceGradient: readonly [string, string, ...string[]] =
    netBalance > 0
      ? ['#059669', '#047857']
      : netBalance < 0
        ? ['#DC2626', '#B91C1C']
        : ['#374151', '#1F2937'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'trips', label: 'Trips', icon: 'map', count: trips.length },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: 'receipt',
      count: totalExpenses,
    },
    { id: 'map', label: 'Map', icon: 'map-pin', count: mapMarkers.length },
    {
      id: 'activity',
      label: 'Activity',
      icon: 'activity',
      count: activity.length,
    },
  ] as const;

  return (
    <GlobalBackground>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        {/* ── STICKY HEADER ────────────────── */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 12,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <AppIcon
              name="arrow-left"
              size={22}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {personName}
          </Text>
          <Pressable
            style={styles.headerBtn}
            onPress={() =>
              Share.share({ message: `Check out ${personName} on Wakeru! 🧳` })
            }
          >
            <AppIcon
              name="share-2"
              size={20}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* ── PROFILE HERO ─────────────────────────── */}
          <View style={styles.heroSection}>
            {/* Avatar */}
            {profile?.photoURL ? (
              <Avatar
                url={profile.photoURL}
                size="xl"
                style={styles.heroAvatar}
              />
            ) : (
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.heroAvatarGradient}
              >
                <Text style={styles.heroAvatarText}>
                  {getInitials(personName)}
                </Text>
              </LinearGradient>
            )}

            <Text
              style={[styles.heroName, { color: theme.colors.textPrimary }]}
            >
              {personName}
            </Text>
            {profile?.email && (
              <Text
                style={[styles.heroEmail, { color: theme.colors.textTertiary }]}
              >
                {profile.email}
              </Text>
            )}

            {/* Friendship badge */}
            <View
              style={[
                styles.friendshipBadge,
                {
                  backgroundColor: theme.isDark
                    ? `${friendshipInfo.color}22`
                    : friendshipInfo.bgColor,
                },
              ]}
            >
              <AppIcon
                name={friendshipInfo.icon as any}
                size={13}
                color={friendshipInfo.color}
              />
              <Text
                style={[styles.friendshipText, { color: friendshipInfo.color }]}
              >
                {friendshipInfo.label}
              </Text>
            </View>

            {/* Stats pill row */}
            <View
              style={[
                styles.statsRow,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                  borderColor: theme.colors.borderLight,
                },
              ]}
            >
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {profile?.totalSharedTrips || trips.length || 0}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Trips
                </Text>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: theme.colors.borderLight },
                ]}
              />
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {totalExpenses}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Expenses
                </Text>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: theme.colors.borderLight },
                ]}
              />
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        netBalance > 0
                          ? '#059669'
                          : netBalance < 0
                            ? '#DC2626'
                            : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {netBalance > 0 ? '+' : ''}
                  {formatCurrency(Math.abs(netBalance))}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Balance
                </Text>
              </View>
            </View>
          </View>

          {/* ── BALANCE CARD ─────────────────────────── */}
          <LinearGradient
            colors={balanceGradient}
            style={styles.balanceCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.balanceLabel}>
              {netBalance === 0
                ? 'ALL SETTLED UP 🎉'
                : netBalance > 0
                  ? 'THEY OWE YOU'
                  : 'YOU OWE THEM'}
            </Text>
            <Text style={styles.balanceAmount}>
              {netBalance > 0 ? '+' : ''}
              {formatCurrency(Math.abs(netBalance))}
            </Text>
            <View style={styles.balanceSubRow}>
              <View style={styles.balanceSubItem}>
                <Text style={styles.balanceSubValue}>
                  {formatCurrency(balance?.youOwe || 0)}
                </Text>
                <Text style={styles.balanceSubLabel}>You Owe</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceSubItem}>
                <Text style={styles.balanceSubValue}>
                  {formatCurrency(balance?.theyOwe || 0)}
                </Text>
                <Text style={styles.balanceSubLabel}>They Owe</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceSubItem}>
                <Text style={styles.balanceSubValue}>
                  {balance?.pendingSettlementCount || 0}
                </Text>
                <Text style={styles.balanceSubLabel}>Pending</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ── KPI STAT CARDS ───────────────────────── */}
          <View style={[styles.kpiGrid, isTablet && styles.kpiGridTablet]}>
            <StatCard
              title="You Owe"
              amount={balance?.youOwe || 0}
              currency="INR"
              subtitle="Your liability"
              icon="arrow-up-right"
              variant={balance?.youOwe > 0 ? 'danger' : 'success'}
            />
            <StatCard
              title="They Owe"
              amount={balance?.theyOwe || 0}
              currency="INR"
              subtitle="Their liability"
              icon="arrow-down-left"
              variant={balance?.theyOwe > 0 ? 'success' : 'default'}
            />
            <StatCard
              title="Total Shared"
              amount={totalExpenses}
              subtitle="Expenses together"
              icon="receipt"
              variant="default"
            />
            <StatCard
              title="Trips Together"
              amount={profile?.totalSharedTrips || trips.length || 0}
              subtitle="Shared adventures"
              icon="map"
              variant="default"
            />
          </View>

          {/* ── SETTLEMENT ACTIONS ───────────────────── */}
          {settlementOptions.length > 0 &&
            settlementOptions[0]?.type !== 'none' && (
              <View style={styles.settlementRow}>
                {settlementOptions.map((option: any, i: number) => (
                  <Pressable
                    key={i}
                    style={({ hovered }: any) => [
                      styles.settlementBtn,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.borderLight,
                      },
                      Platform.OS === 'web' &&
                        hovered && {
                          backgroundColor: theme.colors.primaryBg,
                          borderColor: theme.colors.primary,
                        },
                    ]}
                    onPress={() => handleSettlementAction(option)}
                  >
                    <AppIcon
                      name={
                        option.type === 'upi'
                          ? 'smartphone'
                          : option.type === 'remind'
                            ? 'bell'
                            : 'check-circle'
                      }
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.settlementBtnText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

          {/* ── TAB BAR ──────────────────────────────── */}
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
                borderColor: theme.colors.borderLight,
              },
            ]}
          >
            {tabs.map(tab => {
              const isActive = activeSection === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    isActive && {
                      backgroundColor: theme.colors.surface,
                      ...theme.shadows.sm,
                    },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setActiveSection(tab.id as typeof activeSection);
                  }}
                >
                  <AppIcon
                    name={tab.icon as any}
                    size={14}
                    color={
                      isActive
                        ? theme.colors.primary
                        : theme.colors.textTertiary
                    }
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isActive
                          ? theme.colors.primary
                          : theme.colors.textTertiary,
                      },
                      isActive && { fontWeight: '700' },
                    ]}
                  >
                    {tab.label}
                    {'count' in tab && (tab as any).count > 0
                      ? ` (${(tab as any).count})`
                      : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ──────────────────────────────────────────── */}
          {/* OVERVIEW TAB                                */}
          {/* ──────────────────────────────────────────── */}
          {activeSection === 'overview' && (
            <View style={styles.tabContent}>
              {/* Shared Trips Preview */}
              {trips.length > 0 && (
                <View>
                  <View style={styles.sectionHeaderRow}>
                    <SectionHeader
                      icon="map"
                      title="Trips Together"
                      count={trips.length}
                    />
                    <Pressable onPress={() => setActiveSection('trips')}>
                      <Text
                        style={[
                          styles.viewMoreHeaderLink,
                          { color: theme.colors.primary },
                        ]}
                      >
                        View all →
                      </Text>
                    </Pressable>
                  </View>
                  <View
                    style={[
                      styles.tripsGrid,
                      isDesktop && styles.tripsDesktopGrid,
                    ]}
                  >
                    {trips.slice(0, 2).map((trip: any) => (
                      <View
                        key={trip._id}
                        style={
                          isDesktop
                            ? { flex: 1, minWidth: 280 }
                            : { width: '100%' }
                        }
                      >
                        <SharedTripCard
                          trip={trip}
                          onPress={() =>
                            router.push(`/(app)/trips/${trip._id}`)
                          }
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Recent activity preview */}
              {activity.length > 0 && (
                <View style={{ marginTop: trips.length > 0 ? 24 : 0 }}>
                  <View style={styles.sectionHeaderRow}>
                    <SectionHeader icon="activity" title="Recent Activity" />
                    {activity.length > 3 && (
                      <Pressable onPress={() => setActiveSection('activity')}>
                        <Text
                          style={[
                            styles.viewMoreHeaderLink,
                            { color: theme.colors.primary },
                          ]}
                        >
                          View all →
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {activity.slice(0, 3).map((a: any, i: number) => (
                    <ActivityRow key={i} activity={a} />
                  ))}
                </View>
              )}

              {/* Top expenses preview */}
              {expenses.length > 0 && (
                <View style={{ marginTop: 24 }}>
                  <View style={styles.sectionHeaderRow}>
                    <SectionHeader
                      icon="receipt"
                      title="Recent Expenses"
                      count={totalExpenses}
                    />
                    {totalExpenses > 3 && (
                      <Pressable onPress={() => setActiveSection('expenses')}>
                        <Text
                          style={[
                            styles.viewMoreHeaderLink,
                            { color: theme.colors.primary },
                          ]}
                        >
                          View all →
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {expenses.slice(0, 3).map((exp: any) => (
                    <ExpenseRow key={exp._id} expense={exp} />
                  ))}
                </View>
              )}

              {/* Map preview */}
              {mapMarkers.length > 0 && (
                <View style={{ marginTop: 24 }}>
                  <View style={styles.sectionHeaderRow}>
                    <SectionHeader
                      icon="map-pin"
                      title="Trip & Expense Locations"
                      count={mapMarkers.length}
                    />
                    <Pressable onPress={() => setActiveSection('map')}>
                      <Text
                        style={[
                          styles.viewMoreHeaderLink,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Expand Map →
                      </Text>
                    </Pressable>
                  </View>
                  <View
                    style={[
                      styles.mapWrapper,
                      { borderColor: theme.colors.borderLight },
                    ]}
                  >
                    <LeafletMapView markers={mapMarkers} height={290} />
                  </View>
                </View>
              )}

              {/* Empty overview */}
              {activity.length === 0 &&
                expenses.length === 0 &&
                trips.length === 0 &&
                !expensesLoading &&
                !tripsLoading && (
                  <EmptyState
                    icon="🤝"
                    title="No shared activity yet"
                    description={`Start a trip or add an expense with ${personName} to see your history here.`}
                  />
                )}
            </View>
          )}

          {/* ──────────────────────────────────────────── */}
          {/* TRIPS TAB                                   */}
          {/* ──────────────────────────────────────────── */}
          {activeSection === 'trips' && (
            <View style={styles.tabContent}>
              <SectionHeader
                icon="map"
                title="Shared Trips"
                count={trips.length}
              />

              {tripsLoading && trips.length === 0 ? (
                <>
                  <SkeletonTripCard />
                  <SkeletonTripCard />
                </>
              ) : trips.length === 0 ? (
                <EmptyState
                  icon="✈️"
                  title="No shared trips yet"
                  description={`You haven't been on any trips with ${personName} yet.`}
                />
              ) : (
                <>
                  <View
                    style={[
                      styles.tripsGrid,
                      isDesktop && styles.tripsDesktopGrid,
                    ]}
                  >
                    {trips.map((trip: any) => (
                      <View
                        key={trip._id}
                        style={
                          isDesktop
                            ? { flex: 1, minWidth: 280 }
                            : { width: '100%' }
                        }
                      >
                        <SharedTripCard
                          trip={trip}
                          onPress={() =>
                            router.push(`/(app)/trips/${trip._id}`)
                          }
                        />
                      </View>
                    ))}
                  </View>
                  {hasNextTrips && (
                    <Pressable
                      style={[
                        styles.loadMoreBtn,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.borderLight,
                        },
                      ]}
                      onPress={handleLoadMoreTrips}
                      disabled={isFetchingNextTrips}
                    >
                      {isFetchingNextTrips ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.loadMoreText,
                            { color: theme.colors.primary },
                          ]}
                        >
                          Load More Trips
                        </Text>
                      )}
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          {/* ──────────────────────────────────────────── */}
          {/* EXPENSES TAB                                */}
          {/* ──────────────────────────────────────────── */}
          {activeSection === 'expenses' && (
            <View style={styles.tabContent}>
              <SectionHeader
                icon="receipt"
                title="Shared Expenses"
                count={totalExpenses}
              />

              {expensesLoading && expenses.length === 0 ? (
                <>
                  {[0, 1, 2, 3].map(i => (
                    <SkeletonExpenseRow key={i} />
                  ))}
                </>
              ) : expenses.length === 0 ? (
                <EmptyState
                  icon="🧾"
                  title="No shared expenses yet"
                  description={`You haven't shared any expenses with ${personName} yet.`}
                />
              ) : (
                <>
                  {expenses.map((exp: any) => (
                    <ExpenseRow key={exp._id} expense={exp} />
                  ))}
                  {hasNextPage && (
                    <Pressable
                      style={[
                        styles.loadMoreBtn,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.borderLight,
                        },
                      ]}
                      onPress={handleLoadMoreExpenses}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.loadMoreText,
                            { color: theme.colors.primary },
                          ]}
                        >
                          Load More Expenses
                        </Text>
                      )}
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          {/* ──────────────────────────────────────────── */}
          {/* MAP TAB                                     */}
          {/* ──────────────────────────────────────────── */}
          {activeSection === 'map' && (
            <View style={styles.tabContent}>
              <SectionHeader
                icon="map-pin"
                title="Interactive Map"
                count={mapMarkers.length}
              />
              <View
                style={[
                  styles.mapWrapper,
                  { borderColor: theme.colors.borderLight },
                ]}
              >
                <LeafletMapView
                  markers={mapMarkers}
                  height={isDesktop ? 540 : 420}
                />
              </View>
            </View>
          )}

          {/* ──────────────────────────────────────────── */}
          {/* ACTIVITY TAB                                */}
          {/* ──────────────────────────────────────────── */}
          {activeSection === 'activity' && (
            <View style={styles.tabContent}>
              <SectionHeader
                icon="activity"
                title="Recent Activity"
                count={activity.length}
              />

              {activity.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="No activity yet"
                  description={`Your shared activity with ${personName} will appear here.`}
                />
              ) : (
                activity.map((a: any, i: number) => (
                  <ActivityRow key={i} activity={a} />
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </GlobalBackground>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: {
    padding: 16,
    paddingTop: 20,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  // Skeleton
  skeletonContent: {
    padding: 16,
    paddingTop: 20,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroAvatar: { marginBottom: 14 },
  heroAvatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroAvatarText: { fontSize: 34, fontWeight: '800', color: '#FFF' },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  heroEmail: { fontSize: 14, fontWeight: '400', marginBottom: 12 },

  friendshipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 20,
  },
  friendshipText: { fontSize: 13, fontWeight: '700' },

  // Stats pill row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 0,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDivider: { width: 1, height: 32, marginHorizontal: 8 },

  // Balance card
  balanceCard: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -2,
    marginTop: 10,
    marginBottom: 28,
  },
  balanceSubRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  balanceSubItem: { flex: 1, alignItems: 'center' },
  balanceSubValue: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  balanceSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  balanceDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiGridTablet: { flexWrap: 'nowrap' },

  // Settlement
  settlementRow: { flexDirection: 'column', gap: 10, marginBottom: 20 },
  settlementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    transitionProperty: 'background-color, border-color',
    transitionDuration: '0.15s',
  } as any,
  settlementBtnText: { fontSize: 14, fontWeight: '700' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  tabLabel: { fontSize: 12, fontWeight: '600' },

  // Section Header Row with link
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewMoreHeaderLink: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
  },

  // Tab content
  tabContent: { gap: 0 },

  // Trips grid
  tripsGrid: { gap: 12 },
  tripsDesktopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },

  // Map
  mapWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Load more
  loadMoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  } as any,
  loadMoreText: { fontSize: 14, fontWeight: '700' },
});
