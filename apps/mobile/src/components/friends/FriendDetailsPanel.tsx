// components/friends/FriendDetailsPanel.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { format } from 'date-fns';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { useFriendDetails } from '../../hooks/useFriends';

import { Avatar } from '../ui/Avatar';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import { TravelTimeline } from './TravelTimeline';
import type { Theme } from '../../theme';

interface FriendDetailsPanelProps {
  userId: string | null;
  onClose?: () => void;
}

// ─── 4-Tile Bento Travel Statistics ──────────────────────────
function BentoStatsGrid({ details, theme }: { details: any; theme: Theme }) {
  const stats = [
    {
      title: 'TRIPS TOGETHER',
      value: details.tripsTogether || 0,
      icon: 'map-pin',
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      sub: `${details.countries?.length || 0} destinations`,
    },
    {
      title: 'CITIES EXPLORED',
      value: details.cities?.length || 0,
      icon: 'globe',
      iconColor: '#06B6D4',
      iconBg: '#CFFAFE',
      sub: 'Visited jointly',
    },
    {
      title: 'TRAVEL COMPATIBILITY',
      value: `${details.travelScore || 95}%`,
      icon: 'star',
      iconColor: '#10B981',
      iconBg: '#ECFDF5',
      sub: 'Synergy score',
    },
    {
      title: 'SHARED EXPENSES',
      value: `₹${(details.expensesTogether || 0).toLocaleString('en-IN')}`,
      icon: 'credit-card',
      iconColor: '#8B5CF6',
      iconBg: '#EDE9FE',
      sub: 'Total volume split',
    },
  ];

  return (
    <View style={statsStyles.grid}>
      {stats.map((stat, idx) => (
        <View
          key={idx}
          style={[statsStyles.tile, { backgroundColor: theme.colors.surface }]}
        >
          <View style={statsStyles.topRow}>
            <View
              style={[statsStyles.iconAura, { backgroundColor: stat.iconBg }]}
            >
              <AppIcon
                name={stat.icon as any}
                size={15}
                color={stat.iconColor}
              />
            </View>
            <Text style={[statsStyles.statLabel, { color: stat.iconColor }]}>
              {stat.title}
            </Text>
          </View>
          <Text
            style={[statsStyles.statValue, { color: theme.colors.textPrimary }]}
          >
            {stat.value}
          </Text>
          <Text
            style={[statsStyles.statSub, { color: theme.colors.textTertiary }]}
          >
            {stat.sub}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Shared Finances Command Block ───────────────────────────
function SharedFinancesCard({ details }: { details: any }) {
  const router = useRouter();
  const balance = details.settlementBalance || 0;
  const isOwed = balance > 0;
  const isSettled = balance === 0;

  return (
    <LinearGradient
      colors={['#0F172A', '#1E1B4B', '#1E293B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={financeStyles.card}
    >
      <View style={financeStyles.topRow}>
        <View>
          <Text style={financeStyles.cardLabel}>COLLABORATIVE LEDGER</Text>
          <Text
            style={[
              financeStyles.mainBalance,
              { color: isSettled ? '#FFFFFF' : isOwed ? '#34D399' : '#F87171' },
            ]}
          >
            {isSettled ? '' : isOwed ? '+' : '−'}₹
            {Math.abs(balance).toLocaleString('en-IN')}
          </Text>
          <Text style={financeStyles.balanceSub}>
            {isSettled
              ? 'All shared costs are settled'
              : isOwed
                ? 'Friend owes you'
                : 'You owe this friend'}
          </Text>
        </View>

        <View
          style={[
            financeStyles.statusPill,
            {
              backgroundColor: isSettled
                ? 'rgba(255,255,255,0.1)'
                : isOwed
                  ? 'rgba(16,185,129,0.2)'
                  : 'rgba(239,68,68,0.2)',
            },
          ]}
        >
          <AppIcon
            name={
              isSettled
                ? 'check-circle'
                : isOwed
                  ? 'arrow-down-left'
                  : 'arrow-up-right'
            }
            size={14}
            color={isSettled ? '#FFF' : isOwed ? '#10B981' : '#EF4444'}
          />
          <Text
            style={[
              financeStyles.statusPillText,
              { color: isSettled ? '#FFF' : isOwed ? '#10B981' : '#EF4444' },
            ]}
          >
            {isSettled ? 'Settled' : isOwed ? 'To Receive' : 'To Pay'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={financeStyles.actionRow}>
        <Pressable
          onPress={() => {
            haptics.medium();
            router.push('/(app)/settlements');
          }}
          style={financeStyles.settleBtn}
        >
          <AppIcon name="refresh-cw" size={14} color="#FFFFFF" />
          <Text style={financeStyles.settleBtnText}>Settle Up Now</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            haptics.light();
            router.push('/(app)/finance/transactions' as any);
          }}
          style={financeStyles.viewLogsBtn}
        >
          <Text style={financeStyles.viewLogsText}>View Split Logs</Text>
          <AppIcon
            name="chevron-right"
            size={14}
            color="rgba(255,255,255,0.8)"
          />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

// ─── Recent Joint Trips ──────────────────────────────────────
function RecentTripsSection({ trips, theme }: { trips: any[]; theme: Theme }) {
  const router = useRouter();
  if (!trips || trips.length === 0) return null;

  return (
    <View style={tripStyles.container}>
      <Text
        style={[tripStyles.sectionHeading, { color: theme.colors.textPrimary }]}
      >
        Shared Expeditions
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tripStyles.scrollList}
      >
        {trips.map((trip: any) => (
          <Pressable
            key={trip.id || trip._id}
            onPress={() => {
              haptics.light();
              router.push(`/(app)/trips/${trip.id || trip._id}`);
            }}
            style={({ pressed }) => [
              tripStyles.card,
              { backgroundColor: theme.colors.surface },
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Image
              source={{
                uri:
                  trip.image ||
                  trip.coverImage ||
                  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2',
              }}
              style={tripStyles.image}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={tripStyles.overlayContent}>
              <Text style={tripStyles.tripTitle} numberOfLines={1}>
                {trip.name || trip.title}
              </Text>
              <Text style={tripStyles.tripDate}>
                {trip.date
                  ? format(new Date(trip.date), 'MMM yyyy')
                  : 'Recent trip'}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main Details Panel ──────────────────────────────────────
export function FriendDetailsPanel({
  userId,
  onClose,
}: FriendDetailsPanelProps) {
  const theme = useTheme();
  const router = useRouter();
  const { data: details, isLoading } = useFriendDetails(userId || undefined);

  if (!userId) return null;

  if (isLoading || !details) {
    return (
      <View style={styles.loadingContainer}>
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
        <Text
          style={[styles.loadingText, { color: theme.colors.textSecondary }]}
        >
          Loading companion profile…
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.root}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cover Header */}
        <View style={styles.coverWrap}>
          {details.coverImage ? (
            <Image
              source={{ uri: details.coverImage }}
              style={styles.coverImg}
            />
          ) : (
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0.3)',
              'transparent',
              theme.isDark ? '#0F172A' : '#F8FAFC',
            ]}
            style={StyleSheet.absoluteFill}
          />

          {onClose && (
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <AppIcon name="x" size={16} color="#FFFFFF" />
            </Pressable>
          )}

          {/* Profile Identity Overlay */}
          <View style={styles.identityOverlay}>
            <Avatar
              url={details.photoURL}
              fallback={details.displayName?.charAt(0).toUpperCase() || '?'}
              size="xl"
              ringColor={theme.colors.surface}
            />

            <View style={styles.headerActionRow}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  router.push(`/(app)/chat/${userId}` as any);
                }}
                style={[
                  styles.headerIconBtn,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <AppIcon
                  name="message-circle"
                  size={16}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.medium();
                  router.push(`/(app)/create-trip?friendId=${userId}` as any);
                }}
                style={styles.planTripBtn}
              >
                <AppIcon name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.planTripBtnText}>Plan Trip</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Profile Info Bar */}
        <View style={styles.infoSection}>
          <View>
            <Text
              style={[styles.displayName, { color: theme.colors.textPrimary }]}
            >
              {details.displayName}
            </Text>
            <Text
              style={[styles.memberSince, { color: theme.colors.textTertiary }]}
            >
              Traveling companion since{' '}
              {details.friendSince
                ? format(new Date(details.friendSince), 'MMM yyyy')
                : '2026'}
            </Text>
          </View>

          {details.achievements && details.achievements.length > 0 && (
            <View style={styles.badgeCluster}>
              {details.achievements.map((ach: string, i: number) => (
                <View
                  key={i}
                  style={[
                    styles.achieveBadge,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <AppIcon name="award" size={12} color="#F59E0B" />
                  <Text
                    style={[
                      styles.achieveBadgeText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {ach}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Shared Finances Command Card */}
        <View style={styles.sectionWrap}>
          <SharedFinancesCard details={details} />
        </View>

        {/* 4-Tile Bento Travel Statistics */}
        <View style={styles.sectionWrap}>
          <Text
            style={[styles.sectionHeading, { color: theme.colors.textPrimary }]}
          >
            Travel Compatibility
          </Text>
          <BentoStatsGrid details={details} theme={theme} />
        </View>

        {/* Shared Trips Carousel */}
        {details.recentTrips && details.recentTrips.length > 0 && (
          <View style={styles.sectionWrap}>
            <RecentTripsSection trips={details.recentTrips} theme={theme} />
          </View>
        )}

        {/* Collaborative Timeline */}
        {details.timeline && details.timeline.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text
              style={[
                styles.sectionHeading,
                { color: theme.colors.textPrimary },
              ]}
            >
              Timeline of Adventures
            </Text>
            <TravelTimeline events={details.timeline} />
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 80,
  },

  // Cover & Header
  coverWrap: {
    height: 180,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  coverImg: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  identityOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: -28,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  planTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  planTripBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Profile Information
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 36,
    gap: 10,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  memberSince: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  badgeCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  achieveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  achieveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Sections
  sectionWrap: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});

const statsStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flex: 1,
    minWidth: 140,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',

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

    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  iconAura: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
});

const financeStyles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    gap: 16,

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.6)',
  },
  mainBalance: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  balanceSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  settleBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 12,
  },
  settleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  viewLogsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewLogsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

const tripStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollList: {
    gap: 10,
  },
  card: {
    width: 140,
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  overlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  tripTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tripDate: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
// // components/friends/FriendDetailsPanel.tsx
// import React from 'react';
// import {
//   View,
//   StyleSheet,
//   ScrollView,
//   Image,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
// import { format } from 'date-fns';

// import { useTheme } from '../../providers/ThemeProvider';
// import { haptics } from '../../utils/haptics';
// import { useFriendDetails } from '../../hooks/useFriends';

// import { GlassCard } from '../ui/GlassCard';
// import { Typography } from '../ui/Typography';
// import { AmountDisplay } from '../ui/AmountDisplay';
// import { Badge } from '../ui/Badge';
// import { Button } from '../ui/Button';
// import { InteractiveWrapper } from '../ui/InteractiveWrapper';
// import { Avatar } from '../ui/Avatar';
// import { Grid } from '../ui/Grid';
// import { IconButton } from '../ui/IconButton';
// import { MetricTile } from '../ui/MetricTile';
// import AppIcon from '../common/AppIcon';

// import { TravelTimeline } from './TravelTimeline';

// import type { Theme } from '../../theme';

// // ─── Constants ───────────────────────────────────────────────
// const WEB = Platform.OS === 'web';

// interface FriendDetailsPanelProps {
//   userId: string | null;
//   onClose?: () => void;
// }

// // ─── Bento Stats Grid ────────────────────────────────────────
// function BentoStatsGrid({ details }: { details: any }) {
//   const theme = useTheme();

//   const stats: any = [
//     {
//       title: 'Trips Together',
//       value: details.tripsTogether || 0,
//       icon: '🧳',
//       variant: 'default' as const,
//       subtitle: `${details.countries?.length || 0} countries`,
//     },
//     {
//       title: 'Cities',
//       value: details.cities?.length || 0,
//       icon: '🏙️',
//       variant: 'info' as const,
//       subtitle: 'Explored together',
//     },
//     {
//       title: 'Travel Score',
//       value: details.travelScore || 0,
//       icon: '⭐',
//       variant: 'success' as const,
//       subtitle: 'Compatibility',
//     },
//     {
//       title: 'Shared Expenses',
//       amount: details.expensesTogether || 0,
//       currency: 'INR',
//       icon: '💸',
//       variant: 'warning' as const,
//       isAmount: true,
//     },
//   ];

//   return (
//     <Grid cols={2} gap={theme.spacing.md}>
//       {stats.map((stat: any, index: any) => (
//         <Animated.View key={stat.title} entering={FadeIn.delay(index * 80).springify().damping(18)}>
//           <GlassCard variant="medium" padding="lg">
//             {stat.isAmount ? (
//               <View style={{ gap: theme.spacing.sm }}>
//                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
//                   <View
//                     style={{
//                       width: 36,
//                       height: 36,
//                       borderRadius: 10,
//                       backgroundColor: theme.colors.warningBg,
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                     }}
//                   >
//                     <Typography variant="bodySm">{stat.icon}</Typography>
//                   </View>
//                   <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     {stat.title}
//                   </Typography>
//                 </View>
//                 <View style={{ paddingLeft: 36 + theme.spacing.sm }}>
//                   <AmountDisplay amount={stat.amount!} currency={stat.currency!} size="md" variant="default" />
//                 </View>
//               </View>
//             ) : (
//               <MetricTile
//                 title={stat.title}
//                 value={stat.value}
//                 icon={stat.icon}
//                 variant={stat.variant}
//                 subtitle={stat.subtitle}
//               />
//             )}
//           </GlassCard>
//         </Animated.View>
//       ))}
//     </Grid>
//   );
// }

// // ─── Shared Finances Card ────────────────────────────────────
// function SharedFinancesCard({ details }: { details: any }) {
//   const theme = useTheme();
//   const router = useRouter();
//   const balance = details.settlementBalance || 0;
//   const isOwed = balance > 0;

//   return (
//     <Animated.View entering={FadeIn.delay(200).springify().damping(18)}>
//       <GlassCard variant="prominent" padding="lg">
//         <View style={{ gap: theme.spacing.lg }}>
//           {/* Header */}
//           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//             <View>
//               <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                 Total Shared
//               </Typography>
//               <AmountDisplay
//                 amount={details.expensesTogether || 0}
//                 currency="INR"
//                 size="xl"
//                 variant="default"
//               />
//             </View>
//             <View style={{ alignItems: 'flex-end' }}>
//               <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                 Pending
//               </Typography>
//               <AmountDisplay
//                 amount={Math.abs(balance)}
//                 currency="INR"
//                 size="lg"
//                 variant={isOwed ? 'positive' : 'negative'}
//                 showSign={false}
//               />
//               <Typography variant="caption" color={isOwed ? 'success' : 'danger'} style={{ marginTop: 2 }}>
//                 {isOwed ? 'You are owed' : 'You owe'}
//               </Typography>
//             </View>
//           </View>

//           {/* Actions */}
//           <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
//             <Button
//               title="Settle Up"
//               variant="primary"
//               size="md"
//               fullWidth
//               onPress={() => {
//                 haptics.medium();
//                 router.push('/(app)/settlements');
//               }}
//               leftIcon={<AppIcon name="refresh-cw" size={14} color={theme.colors.textInverse} />}
//             />
//             <Button
//               title="View All"
//               variant="outline"
//               size="md"
//               fullWidth
//               onPress={() => {
//                 haptics.light();
//                 router.push('/(app)/finance/transactions');
//               }}
//             />
//           </View>
//         </View>
//       </GlassCard>
//     </Animated.View>
//   );
// }

// // ─── Recent Trips Section ────────────────────────────────────
// function RecentTripsSection({ trips }: { trips: any[] }) {
//   const theme = useTheme();
//   const router = useRouter();

//   if (!trips || trips.length === 0) return null;

//   return (
//     <View style={{ gap: theme.spacing.md }}>
//       <Typography variant="h3" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//         Recent Trips
//       </Typography>
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.md }}>
//         {trips.map((trip: any) => (
//           <InteractiveWrapper
//             key={trip.id}
//             onPress={() => {
//               haptics.light();
//               router.push(`/(app)/trips/${trip.id}`);
//             }}
//           >
//             <View style={tripStyles(theme).card}>
//               <Image source={{ uri: trip.image }} style={tripStyles(theme).image} />
//               <LinearGradient
//                 colors={['transparent', 'rgba(0,0,0,0.8)']}
//                 style={StyleSheet.absoluteFill}
//               />
//               <View style={tripStyles(theme).content}>
//                 <Typography variant="body" weight="bold" color="textInverse" numberOfLines={1}>
//                   {trip.name}
//                 </Typography>
//                 <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
//                   {format(new Date(trip.date), 'MMM yyyy')}
//                 </Typography>
//               </View>
//             </View>
//           </InteractiveWrapper>
//         ))}
//       </ScrollView>
//     </View>
//   );
// }

// // ─── Main Component ──────────────────────────────────────────
// export function FriendDetailsPanel({ userId, onClose }: FriendDetailsPanelProps) {
//   const theme = useTheme();
//   const router = useRouter();
//   const { data: details, isLoading } = useFriendDetails(userId || undefined);

//   // ─── Empty State (Glassmorphic upgrade) ───
//   if (!userId) {
//     return (
//       <LinearGradient
//         colors={theme.gradients.glassWipe}
//         start={{ x: 0, y: 0.5 }}
//         end={{ x: 1, y: 0.5 }}
//         style={[
//           emptyStyles(theme).container,
//           theme.shadows.sm,
//           { borderColor: theme.colors.borderLight }
//         ]}
//       >
//         <View style={[emptyStyles(theme).iconWrapper, { backgroundColor: theme.colors.primaryBg }]}>
//           <AppIcon name="users" size={36} color={theme.colors.primary} />
//         </View>
//         <Typography variant="h3" weight="bold" color="textPrimary" align="center">
//           Select a Travel Companion
//         </Typography>
//         <Typography variant="bodySm" color="textSecondary" align="center" style={{ maxWidth: 280, lineHeight: 20 }}>
//           View their travel statistics, shared expenses, and timeline of your trips together.
//         </Typography>
//       </LinearGradient>
//     );
//   }

//   // ─── Loading State ───
//   if (isLoading || !details) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={theme.colors.primary} />
//         <Typography variant="bodySm" color="textSecondary" style={{ marginTop: 12 }}>
//           Loading profile…
//         </Typography>
//       </View>
//     );
//   }

//   return (
//     <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.root}>
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 120 }}
//       >
//         {/* Cover Header */}
//         <View style={headerStyles(theme).coverArea}>
//           {details.coverImage && (
//             <Image source={{ uri: details.coverImage }} style={headerStyles(theme).coverImage} />
//           )}
//           <LinearGradient
//             colors={['transparent', theme.isDark ? '#121214' : '#FAFAFA']}
//             style={StyleSheet.absoluteFill}
//           />

//           {/* Close Button */}
//           {onClose && (
//             <View style={headerStyles(theme).closeBtnContainer}>
//               <IconButton
//                 icon={<AppIcon name="x" size={18} color={theme.colors.textPrimary} />}
//                 size="sm"
//                 variant="glass"
//                 onPress={onClose}
//               />
//             </View>
//           )}

//           {/* Avatar + Actions */}
//           <View style={headerStyles(theme).avatarRow}>
//             <Avatar
//               url={details.photoURL}
//               fallback={details.displayName?.charAt(0).toUpperCase() || '?'}
//               size="xl"
//               ringColor={theme.colors.surface}
//             />
//             <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
//               <IconButton
//                 icon={<AppIcon name="message-circle" size={18} color={theme.colors.primary} />}
//                 size="md"
//                 variant="glass"
//                 onPress={() => {
//                   haptics.light();
//                   router.push(`/(app)/chat/${userId}`);
//                 }}
//               />
//               <Button
//                 title="Start Trip"
//                 variant="primary"
//                 size="sm"
//                 onPress={() => {
//                   haptics.medium();
//                   router.push(`/(app)/create-trip?friendId=${userId}`);
//                 }}
//               />
//             </View>
//           </View>
//         </View>

//         {/* Profile Info */}
//         <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, gap: theme.spacing.md }}>
//           <View>
//             <Typography variant="h2" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//               {details.displayName}
//             </Typography>
//             <Typography variant="bodySm" color="textSecondary" style={{ marginTop: 2 }}>
//               Friend since {details.friendSince ? format(new Date(details.friendSince), 'MMMM yyyy') : 'Unknown'}
//             </Typography>
//           </View>

//           {/* Achievements */}
//           {details.achievements && details.achievements.length > 0 && (
//             <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
//               {details.achievements.map((ach: string, i: number) => (
//                 <Badge key={i} label={ach} variant="neutral" />
//               ))}
//             </View>
//           )}
//         </View>

//         {/* Statistics */}
//         <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing['3xl'], gap: theme.spacing.md }}>
//           <Typography variant="h3" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//             Travel Statistics
//           </Typography>
//           <BentoStatsGrid details={details} />
//         </View>

//         {/* Shared Finances */}
//         <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing['3xl'], gap: theme.spacing.md }}>
//           <Typography variant="h3" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//             Shared Finances
//           </Typography>
//           <SharedFinancesCard details={details} />
//         </View>

//         {/* Recent Trips */}
//         {details.recentTrips && details.recentTrips.length > 0 && (
//           <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing['3xl'] }}>
//             <RecentTripsSection trips={details.recentTrips} />
//           </View>
//         )}

//         {/* Timeline */}
//         {details.timeline && details.timeline.length > 0 && (
//           <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing['3xl'], gap: theme.spacing.md }}>
//             <Typography variant="h3" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//               Travel Timeline
//             </Typography>
//             <TravelTimeline events={details.timeline} />
//           </View>
//         )}
//       </ScrollView>
//     </Animated.View>
//   );
// }

// // ─── Styles ────────────────────────────────__________________
// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//   },
//   loadingContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 40,
//   },
// });

// // ─── Empty State Styles (Glassmorphism Upgrade) ──────────────
// function emptyStyles(theme: Theme) {
//   return StyleSheet.create({
//     container: {
//       flex: 1,
//       alignItems: 'center',
//       justifyContent: 'center',
//       padding: 36,
//       borderRadius: 24,
//       borderWidth: 1,
//       gap: theme.spacing.md,
//       margin: 16,
//     },
//     iconWrapper: {
//       width: 72,
//       height: 72,
//       borderRadius: 20,
//       alignItems: 'center',
//       justifyContent: 'center',
//       marginBottom: theme.spacing.sm,
//     },
//   });
// }

// // ─── Header Styles ───────────────────────────────────────────
// function headerStyles(theme: Theme) {
//   return StyleSheet.create({
//     coverArea: {
//       height: 220,
//       position: 'relative',
//     },
//     coverImage: {
//       ...StyleSheet.absoluteFill,
//       width: '100%',
//       height: '100%',
//     },
//     closeBtnContainer: {
//       position: 'absolute',
//       top: 16,
//       right: 16,
//       zIndex: 10,
//     },
//     avatarRow: {
//       position: 'absolute',
//       bottom: -24,
//       left: 24,
//       right: 24,
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'flex-end',
//     },
//   });
// }

// // ─── Trip Card Styles ────────────────────────────────────────
// function tripStyles(theme: Theme) {
//   return StyleSheet.create({
//     card: {
//       width: 160,
//       height: 200,
//       borderRadius: 20,
//       overflow: 'hidden',
//     },
//     image: {
//       ...StyleSheet.absoluteFill,
//       width: '100%',
//       height: '100%',
//     },
//     content: {
//       position: 'absolute',
//       bottom: 0,
//       left: 0,
//       right: 0,
//       padding: 16,
//     },
//   });
// }
