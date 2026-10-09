import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
// app/(app)/trips/[id]/[id].tsx
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Share,
  Alert,
  TextInput,
  Platform,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
  Image,
  ImageBackground,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { captureRef } from 'react-native-view-shot';
import { format, differenceInCalendarDays } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
// Hooks & Stores
import {
  useTrip,
  useArchiveTrip,
  useUnarchiveTrip,
  useGenerateInvite,
  useSearchUsers,
  useAddTripMember,
  useSettlement,
  useTripSummary,
  useTripAnalytics,
  useInfiniteTripExpenses,
} from '../../../hooks';
import { useQuery } from '@tanstack/react-query';
import { achievementsApi } from '../../../services/api';
import {
  usePendingJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
} from '../../../hooks/useJoinRequests';
import { useAuthStore } from '../../../stores/auth.store';
import { useSocket } from '../../../hooks/useSocket';
import { useTheme } from '../../../providers/ThemeProvider';
import { showToast } from '../../../utils/toast';
import { isUserTripAdmin } from '../../../utils/tripPermissions';

// UI Components
import { InviteFriendModal } from '../../../components/trips/InviteFriendModal';
import SettlementTab from '../../../components/trips/SettlementTab';
import { TripLocalTab } from '../../../components/trips/TripLocalTab';
import PlannerTab from '../../../components/trips/PlannerTab';
import ExpensesTab from '../../../components/trips/ExpensesTab';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { AvatarGroup } from '../../../components/ui/AvatarGroup';
import { InviteCard } from '../../../components/trips/InviteCard';
import { TripCompletionSheet } from '../../../components/trips/TripCompletionSheet';
import { haptics } from '../../../utils/haptics';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { formatAmount } from '../../../utils/formatters';
import { TabBar } from '../../../components/ui/TabBar';
import { getStopCoverImage, getTripCoverImage } from '../../../utils/tripImage';
import { StackedStopsDeck } from '../../../components/trips/StackedStopsDeck';
import { TravelAffiliateCard } from '../../../components/ads/TravelAffiliateCard';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

const TABS = [
  'Overview',
  'Planner',
  'Expenses',
  'Stops',
  'Members',
  'Settle',
  'Explore',
];

const TRIP_NAV_TABS = [
  {
    key: 0,
    label: 'Overview',
    icon: 'layout-grid',
    desc: 'Summary & quick stats',
  },
  { key: 1, label: 'Planner', icon: 'calendar', desc: 'Schedule & itinerary' },
  { key: 2, label: 'Expenses', icon: 'receipt', desc: 'Split bills & records' },
  { key: 3, label: 'Stops', icon: 'map-pin', desc: 'Destinations & places' },
  { key: 4, label: 'Members', icon: 'users', desc: 'Travelers & permissions' },
  {
    key: 5,
    label: 'Settle Up',
    icon: 'circle-check',
    desc: 'Balances & settlements',
  },
  {
    key: 6,
    label: 'Explore',
    icon: 'compass',
    desc: 'Local stays, food & activities',
  },
];
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2';

const getCategoryIconAndColor = (category?: string) => {
  const cat = (category || '').toLowerCase();
  if (
    cat.includes('food') ||
    cat.includes('drink') ||
    cat.includes('restaurant') ||
    cat.includes('dining')
  ) {
    return { icon: 'coffee', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
  }
  if (
    cat.includes('transport') ||
    cat.includes('cab') ||
    cat.includes('taxi') ||
    cat.includes('fuel') ||
    cat.includes('train')
  ) {
    return {
      icon: 'compass',
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.15)',
    };
  }
  if (
    cat.includes('hotel') ||
    cat.includes('stay') ||
    cat.includes('room') ||
    cat.includes('airbnb')
  ) {
    return { icon: 'home', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
  }
  if (
    cat.includes('activity') ||
    cat.includes('tour') ||
    cat.includes('ticket') ||
    cat.includes('fun')
  ) {
    return { icon: 'smile', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
  }
  if (
    cat.includes('shop') ||
    cat.includes('grocer') ||
    cat.includes('market')
  ) {
    return {
      icon: 'shopping-bag',
      color: '#EC4899',
      bg: 'rgba(236, 72, 153, 0.15)',
    };
  }
  return {
    icon: 'credit-card',
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.15)',
  };
};

// ============================================================
// Functional Components: Member Row & Stop Card
// ============================================================
function MemberRow({
  member,
  currencySymbol,
  settlementTransactions,
}: {
  member: any;
  currencySymbol: string;
  settlementTransactions?: any[];
}) {
  const styles = useStyles();
  const theme = useTheme();

  const hasSettlement =
    Array.isArray(settlementTransactions) && settlementTransactions.length > 0;

  let netBalance = (member.totalPaidBase || 0) - (member.totalOwesBase || 0);
  let isSettled = false;

  if (hasSettlement) {
    const pendingToPay = settlementTransactions
      .filter((t: any) => t.from === member.userId && t.status !== 'confirmed')
      .reduce((sum: number, t: any) => sum + (t.amountBase || 0), 0);

    const pendingToReceive = settlementTransactions
      .filter((t: any) => t.to === member.userId && t.status !== 'confirmed')
      .reduce((sum: number, t: any) => sum + (t.amountBase || 0), 0);

    const netPending = pendingToReceive - pendingToPay;
    netBalance = netPending;
    isSettled = pendingToPay === 0 && pendingToReceive === 0;
  } else {
    isSettled = Math.abs(netBalance) < 0.01;
  }

  const isPositive = netBalance > 0.01;
  const isNegative = netBalance < -0.01;

  return (
    <GlassCard style={styles.memberCard} intensity={theme.isDark ? 15 : 8}>
      <View style={styles.memberCardTop}>
        <View style={styles.memberCardAvatarWrap}>
          {member.photoURL ? (
            <Image
              source={{ uri: member.photoURL }}
              style={styles.memberAvatarImg}
            />
          ) : (
            <View
              style={[styles.memberAvatar, { backgroundColor: 'transparent' }]}
            >
              <Text
                style={[styles.memberInitial, { color: theme.colors.primary }]}
              >
                {member.displayName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.memberCardInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              style={[styles.memberName, { color: theme.colors.textPrimary }]}
            >
              {member.displayName}
            </Text>
            {member.role === 'admin' && (
              <Badge label="Admin" variant="primary" />
            )}
          </View>
          <Text
            style={[styles.memberRole, { color: theme.colors.textSecondary }]}
          >
            {member.role}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={[
              styles.memberBalanceText,
              {
                color: isSettled
                  ? theme.colors.success
                  : isPositive
                    ? theme.colors.success
                    : isNegative
                      ? theme.colors.danger
                      : theme.colors.textSecondary,
              },
            ]}
          >
            {isSettled
              ? `${currencySymbol}0`
              : `${isPositive ? '+' : '-'}${currencySymbol}${Math.abs(netBalance).toLocaleString()}`}
          </Text>
          <Text
            style={[
              styles.memberBalanceLabel,
              {
                color: isSettled
                  ? theme.colors.success
                  : theme.colors.textTertiary,
              },
            ]}
          >
            {isSettled ? 'settled' : isPositive ? 'gets back' : 'owes'}
          </Text>
        </View>
      </View>

      <View style={styles.memberCardBottom}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.memberStatLabel,
              { color: theme.colors.textTertiary },
            ]}
          >
            Paid
          </Text>
          <Text
            style={[
              styles.memberStatValue,
              { color: theme.colors.textPrimary },
            ]}
          >
            {currencySymbol}
            {(member.totalPaidBase || 0).toLocaleString()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.memberStatLabel,
              { color: theme.colors.textTertiary },
            ]}
          >
            {isSettled ? 'Status' : isNegative ? 'To Pay' : 'Gets Back'}
          </Text>
          <Text
            style={[
              styles.memberStatValue,
              {
                color: isSettled
                  ? theme.colors.success
                  : theme.colors.textPrimary,
              },
            ]}
          >
            {isSettled
              ? 'Settled'
              : `${currencySymbol}${Math.abs(netBalance).toLocaleString()}`}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

function StopCard({
  stop,
  onPress,
  index,
  tripTitle,
}: {
  stop: any;
  onPress: () => void;
  index: number;
  tripTitle?: string;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;

  const budget = stop.budgetBase || 0;
  const spent = stop.totalSpentBase || 0;
  let progressPercent = 0;
  if (budget > 0) {
    progressPercent = Math.min((spent / budget) * 100, 100);
  } else if (spent > 0) {
    progressPercent = 100;
  }

  return (
    <Pressable
      style={({ hovered, pressed }: WebPressableState) => [
        styles.stopCard,
        { width: '100%', height: 220 },
        Platform.OS === 'web' && hovered && styles.hoverLift,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
    >
      <ImageBackground
        source={{ uri: getStopCoverImage(stop, tripTitle) }}
        style={styles.stopCardBg}
        imageStyle={{ borderRadius: 16 }}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(15,23,42,0.95)']}
          locations={[0, 0.4, 1]}
          style={styles.stopCardGradient}
        />
        <View style={styles.stopCardContent}>
          <View style={styles.stopCardTopRow}>
            <View style={styles.stopCardNumberBadge}>
              <Text style={styles.stopCardNumberText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stopCardTitle} numberOfLines={1}>
                {stop.name}
              </Text>
              <Text
                style={styles.stopCardDates}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {format(new Date(stop.startDate), 'MMM d')} –{' '}
                {format(new Date(stop.endDate), 'MMM d')}
              </Text>
            </View>
          </View>

          <View style={styles.stopCardBottomRow}>
            <View style={styles.stopStatsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopStatLabel}>Expenses</Text>
                <Text
                  style={styles.stopStatValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {stop.expenseCount}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopStatLabel}>Spent</Text>
                <Text
                  style={styles.stopStatValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {stop.baseCurrency === 'INR' ? '₹' : ''}
                  {stop.totalSpentBase.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.stopProgressRow}>
              <View
                style={[
                  styles.stopProgressBarBg,
                  { backgroundColor: 'rgba(255,255,255,0.15)' },
                ]}
              >
                <View
                  style={[
                    styles.stopProgressBarFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor:
                        progressPercent > 90
                          ? theme.colors.danger
                          : theme.colors.secondary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.stopProgressText,
                  { color: 'rgba(255,255,255,0.7)' },
                ]}
              >
                {progressPercent.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

// ============================================================
// MAIN SCREEN
// ============================================================
export default function TripDetailScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 380;
  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const isWideDesktop = Platform.OS === 'web' && width >= 1024;
  const showRightSummary = isWideDesktop && width >= 1360;

  const { id } = useLocalSearchParams<{ id: string }>();
  const { subscribeToTrip, unsubscribeFromTrip } = useSocket();
  const [activeTab, setActiveTab] = useState(0);
  const [activeSubView, setActiveSubView] = useState<
    | 'overview'
    | 'summary'
    | 'insights'
    | 'analytics'
    | 'story'
    | 'rankings'
    | 'map'
  >('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      subscribeToTrip(id);
      return () => unsubscribeFromTrip(id);
    }
  }, [id, subscribeToTrip, unsubscribeFromTrip]);

  const { data: trip, isLoading, refetch: refetchTrip } = useTrip(id);
  const { data: settlementData } = useSettlement(id as string);
  const { user } = useAuthStore();
  const isTripAdmin = useMemo(() => isUserTripAdmin(trip, user), [trip, user]);

  useFocusEffect(
    useCallback(() => {
      refetchTrip();
    }, [refetchTrip]),
  );

  const { mutate: archiveTrip } = useArchiveTrip();
  const { mutate: unarchiveTrip } = useUnarchiveTrip();
  const { mutate: generateInvite } = useGenerateInvite();
  const { mutate: addTripMember, isPending: isAddingMember } =
    useAddTripMember();
  const { data: pendingRequests } = usePendingJoinRequests(
    id as string,
    isTripAdmin,
  );
  const { mutate: approveRequest, isPending: isApproving } =
    useApproveJoinRequest(id as string);
  const { mutate: rejectRequest, isPending: isRejecting } =
    useRejectJoinRequest(id as string);

  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults = [], isFetching: isSearching } =
    useSearchUsers(searchQuery);

  const inviteCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showInviteFriendModal, setShowInviteFriendModal] = useState(false);
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);
  const [showMoreActionsModal, setShowMoreActionsModal] = useState(false);

  // Fetch recent expenses for the overview tab
  const { data: expensesInfiniteData } = useInfiniteTripExpenses(id as string, {
    limit: 5,
  });
  const recentExpenses = useMemo(() => {
    return (
      (expensesInfiniteData?.pages?.[0] as any)?.expenses?.slice(0, 4) || []
    );
  }, [expensesInfiniteData]);

  // Build completion data when trip exists
  const completionData = trip
    ? {
        tripTitle: trip.title,
        totalSpent: trip.totalSpentBase || 0,
        currency: trip.baseCurrency || 'INR',
        memberCount: trip.members?.filter((m: any) => m.isActive).length || 0,
        durationDays:
          trip.startDate && trip.endDate
            ? Math.max(
                1,
                differenceInCalendarDays(
                  new Date(trip.endDate),
                  new Date(trip.startDate),
                ) + 1,
              )
            : 1,
        stopCount: trip.stops?.length || 0,
        inviteCode: trip.inviteCode,
      }
    : null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTrip()]);
    setRefreshing(false);
  }, [refetchTrip]);

  const handleArchive = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (
        window.confirm(
          'Are you sure you want to complete and archive this trip?',
        )
      ) {
        archiveTrip(id, {
          onSuccess: () => {
            haptics.success?.() ?? haptics.medium();
            setShowCompletionSheet(true);
          },
        });
      }
    } else {
      Alert.alert('Complete Trip', 'Mark this trip as done and archive it?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Trip',
          style: 'default',
          onPress: () =>
            archiveTrip(id, {
              onSuccess: () => {
                haptics.success?.() ?? haptics.medium();
                setShowCompletionSheet(true);
              },
            }),
        },
      ]);
    }
  };

  const handleUnarchive = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Restore trip to active list?')) {
        unarchiveTrip(id, {
          onSuccess: () => router.replace('/(app)/(tabs)/home'),
        });
      }
    } else {
      Alert.alert('Unarchive Trip', 'Restore to active list?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unarchive',
          onPress: () =>
            unarchiveTrip(id, {
              onSuccess: () => router.replace('/(app)/(tabs)/home'),
            }),
        },
      ]);
    }
  };

  const handleInvite = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Generate an invite code valid for 7 days?')) {
        generateInvite({ tripId: id, expiresInDays: 7 });
      }
    } else {
      Alert.alert('Generate Invite Link', 'How many days should it be valid?', [
        {
          text: '3 days',
          onPress: () => generateInvite({ tripId: id, expiresInDays: 3 }),
        },
        {
          text: '7 days',
          onPress: () => generateInvite({ tripId: id, expiresInDays: 7 }),
        },
        {
          text: '14 days',
          onPress: () => generateInvite({ tripId: id, expiresInDays: 14 }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleShareInvite = async () => {
    haptics.medium();
    if (trip?.inviteCode) {
      try {
        const webUrl =
          Platform.OS === 'web' && typeof window !== 'undefined'
            ? `${window.location.origin}/join/${trip.inviteCode}`
            : `https://tripsplit.app/join/${trip.inviteCode}`;
        const message = `Join my trip "${trip.title}" on Wakeru!\nCode: ${trip.inviteCode}\nJoin: ${webUrl}\nApp: wakeru://join/${trip.inviteCode}`;

        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && navigator.share)
            await navigator.share({ title: 'Trip Invite', text: message });
          else {
            await Clipboard.setStringAsync(message);
            Alert.alert('Copied!', 'Invite details copied.');
          }
          return;
        }

        setIsSharing(true);
        await Clipboard.setStringAsync(message);
        await new Promise(resolve => setTimeout(resolve, 100));

        const uri = await captureRef(inviteCardRef, {
          format: 'png',
          quality: 1,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            dialogTitle: `Join ${trip.title}`,
            UTI: 'public.image',
            mimeType: 'image/png',
          });
        } else {
          await Share.share({ message });
        }
      } catch (err) {
        showToast.error('Share Failed', 'Failed to share invite card.');
      } finally {
        setIsSharing(false);
      }
    } else {
      handleInvite();
    }
  };

  const handleGenerateReport = async () => {
    if (!trip) {
      showToast.info('Loading', 'Trip data is still loading...');
      return;
    }

    haptics.medium();

    const cs = trip.baseCurrency === 'INR' ? '₹' : '';

    let textReport = `*✈️ ${trip.title} - Trip Report*\n`;
    textReport += `📅 _${format(new Date(trip.startDate), 'MMM d, yyyy')} - ${format(new Date(trip.endDate), 'MMM d, yyyy')}_\n\n`;
    textReport += `💰 *TOTAL SPENT:* ${cs}${trip.totalSpentBase.toLocaleString()}\n`;
    if (trip.totalBudget) {
      textReport += `🎯 *BUDGET:* ${cs}${trip.totalBudget.toLocaleString()}\n`;
    }

    textReport += `\n──────────────\n*📍 STOPS BREAKDOWN*\n──────────────\n`;
    if (trip.stops?.length > 0) {
      trip.stops.forEach((stop: any) => {
        textReport += `• ${stop.emoji || '📍'} *${stop.name}*\n  └ ${stop.totalSpentLocal.toLocaleString()} ${stop.currency} (${cs}${stop.totalSpentBase.toLocaleString()}) • _${stop.expenseCount} expenses_\n`;
      });
    } else {
      textReport += `_No stops added._\n`;
    }

    textReport += `\n──────────────\n*👥 BALANCES*\n──────────────\n`;
    trip.members.forEach((member: any) => {
      const net = member.totalPaidBase - member.totalOwesBase;
      const status =
        net > 0
          ? `🟢 *Gets back* ${cs}${net.toLocaleString()}`
          : net < 0
            ? `🔴 *Owes* ${cs}${Math.abs(net).toLocaleString()}`
            : `✅ *Settled*`;
      textReport += `👤 *${member.displayName}*\n  └ ${status}\n  └ _(Paid: ${cs}${member.totalPaidBase.toLocaleString()} | Share: ${cs}${member.totalOwesBase.toLocaleString()})_\n\n`;
    });

    textReport += `✨ _Generated with *Wakeru* App_ 🚀`;

    // HTML for PDF
    const stopsHtml =
      trip.stops
        ?.map(
          (stop: any) => `
            <div class="list-item">
                <div class="item-left">
                    <span class="item-emoji">${stop.emoji || '📍'}</span>
                    <div>
                        <div class="item-title">${stop.name}</div>
                        <div class="item-subtitle">${stop.expenseCount} expenses</div>
                    </div>
                </div>
                <div class="item-right">
                    <div class="item-amount">${stop.totalSpentLocal.toLocaleString()} ${stop.currency}</div>
                    <div class="item-subtitle">${cs}${stop.totalSpentBase.toLocaleString()}</div>
                </div>
            </div>
        `,
        )
        .join('') ||
      '<div class="list-item"><div class="item-title" style="color: #64748b; font-weight: 400">No stops yet</div></div>';

    const membersHtml = trip.members
      .map((member: any) => {
        const net = member.totalPaidBase - member.totalOwesBase;
        let badgeClass = 'settled';
        let badgeText = 'Settled';
        if (net > 0) {
          badgeClass = 'gets-back';
          badgeText = `Gets back ${cs}${net.toLocaleString()}`;
        } else if (net < 0) {
          badgeClass = 'owes';
          badgeText = `Owes ${cs}${Math.abs(net).toLocaleString()}`;
        }

        return `
            <div class="list-item">
                <div class="item-left">
                    <img src="${member.avatarUrl || `https://ui-avatars.com/api/?name=${member.displayName}&background=f1f5f9`}" class="avatar" />
                    <div>
                        <div class="item-title">${member.displayName}</div>
                        <div class="item-subtitle">Paid: ${cs}${member.totalPaidBase.toLocaleString()} &bull; Share: ${cs}${member.totalOwesBase.toLocaleString()}</div>
                    </div>
                </div>
                <div class="item-right">
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>
            </div>
            `;
      })
      .join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; padding: 30px; margin: 0; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary}); color: white; padding: 40px 30px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(234, 88, 12, 0.3); }
            .title { font-size: 32px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.02em; }
            .date { font-size: 16px; opacity: 0.9; font-weight: 500; }
            .card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #f1f5f9; }
            .section-title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .stat-box { background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; }
            .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px; }
            .stat-value { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
            .stat-value.budget { color: ${theme.colors.secondary}; }
            .list-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
            .list-item:last-child { border-bottom: none; padding-bottom: 0; }
            .item-left { display: flex; align-items: center; gap: 16px; }
            .item-emoji { font-size: 28px; background: #f1f5f9; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
            .avatar { width: 48px; height: 48px; border-radius: 24px; object-fit: cover; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .item-title { font-weight: 700; color: #1e293b; font-size: 16px; margin-bottom: 4px; }
            .item-subtitle { font-size: 14px; color: #64748b; font-weight: 500; }
            .item-right { text-align: right; }
            .item-amount { font-weight: 800; color: #0f172a; font-size: 18px; margin-bottom: 4px; }
            .badge { display: inline-block; padding: 6px 12px; border-radius: 9999px; font-size: 13px; font-weight: 700; }
            .badge.gets-back { background: #dcfce7; color: #166534; }
            .badge.owes { background: #fee2e2; color: #991b1b; }
            .badge.settled { background: #f1f5f9; color: #475569; }
            .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #94a3b8; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .footer span { color: ${theme.colors.secondary}; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="container">
              <div class="header">
                  <h1 class="title">${trip.title}</h1>
                  <div class="date">${format(new Date(trip.startDate), 'MMM d, yyyy')} &bull; ${format(new Date(trip.endDate), 'MMM d, yyyy')}</div>
              </div>

              <div class="summary-grid">
                  <div class="stat-box">
                      <div class="stat-label">Total Spent</div>
                      <div class="stat-value">${cs}${trip.totalSpentBase.toLocaleString()}</div>
                  </div>
                  <div class="stat-box">
                      <div class="stat-label">Trip Budget</div>
                      <div class="stat-value budget">${trip.totalBudget ? `${cs}${trip.totalBudget.toLocaleString()}` : 'Not set'}</div>
                  </div>
              </div>

              <div class="card">
                  <h2 class="section-title">📍 Stops Breakdown</h2>
                  ${stopsHtml}
              </div>

              <div class="card">
                  <h2 class="section-title">👥 Member Balances</h2>
                  ${membersHtml}
              </div>

              <div class="footer">
                  Generated with <span>Wakeru</span> 🚀
              </div>
          </div>
        </body>
        </html>
        `;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (
        window.confirm(
          'Would you like to print/save this report as a PDF?\n(Click Cancel to copy the text report to your clipboard instead)',
        )
      ) {
        try {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            // Slight delay to ensure fonts/styles load before printing
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 250);
          } else {
            showToast.warning(
              'Popup Blocked',
              'Please allow popups to view and print the report.',
            );
          }
        } catch (error) {
          showToast.error('Export Failed', 'Could not generate PDF report.');
        }
      } else {
        try {
          await Clipboard.setStringAsync(textReport);
          showToast.success(
            'Copied to Clipboard',
            'Text report copied to clipboard!',
          );
        } catch (error) {
          showToast.error('Copy Failed', 'Could not copy text report.');
        }
      }
    } else {
      Alert.alert(
        'Share Report',
        'How would you like to share this trip report?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Text',
            onPress: async () => {
              try {
                await Share.share({
                  message: textReport,
                  title: `${trip.title} Trip Report`,
                });
              } catch (error) {
                showToast.error('Share Failed', 'Could not share text report.');
              }
            },
          },
          {
            text: 'Share PDF Document',
            onPress: async () => {
              try {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, {
                  UTI: '.pdf',
                  mimeType: 'application/pdf',
                });
              } catch (error) {
                showToast.error('PDF Failed', 'Could not generate PDF report.');
              }
            },
          },
        ],
      );
    }
  };

  if (!trip && isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  if (!trip) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center', padding: 24 },
        ]}
      >
        <AppIcon name="alert-circle" size={48} color={theme.colors.warning} />
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontSize: 18,
            fontWeight: '700',
            marginTop: 16,
          }}
        >
          Trip Not Found
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          This trip may have been removed or is unavailable offline.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            paddingVertical: 10,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const members = trip.members || [];
  const activeMembers = members.filter((m: any) => m.isActive);
  const memberUrls = activeMembers.map(
    (m: any) =>
      m.avatarUrl ||
      `https://ui-avatars.com/api/?name=${m.displayName}&background=random`,
  );

  const budget = trip.totalBudget || 0;
  const spent = trip.totalSpentBase || 0;
  const progressPercent =
    budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = progressPercent >= 100;

  const s = new Date(trip.startDate);
  const e = new Date(trip.endDate);
  const dur = differenceInCalendarDays(e, s);
  const cs = trip.baseCurrency === 'INR' ? '₹' : '';

  // ============================================================
  // INLINE SUB-VIEWS
  // ============================================================

  const SummarySubView = ({
    tripId,
    onBack,
  }: {
    tripId: string;
    onBack: () => void;
  }) => {
    const { data: summaryRes, isLoading, isError } = useTripSummary(tripId);
    const summaryData = (summaryRes as any)?.data || summaryRes;

    if (isLoading) {
      return (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={{
              color: theme.colors.textSecondary,
              marginTop: 10,
              fontSize: 13,
            }}
          >
            Loading trip summary...
          </Text>
        </View>
      );
    }

    if (isError || !summaryData) {
      return (
        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
          <AppIcon
            name="alert-triangle"
            size={32}
            color={theme.colors.danger}
          />
          <Text
            style={{
              color: theme.colors.danger,
              marginTop: 8,
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            Could not load summary
          </Text>
          <Pressable onPress={onBack} style={{ marginTop: 12 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
              Return to Overview
            </Text>
          </Pressable>
        </View>
      );
    }

    const summary = summaryData.summary || summaryData;
    const totalSpent = summary.totalSpentBase || 0;
    const stopsList = summary.stops || [];
    const membersList = summary.members || [];
    const durDays =
      summary.startDate && summary.endDate
        ? Math.max(
            differenceInCalendarDays(
              new Date(summary.endDate),
              new Date(summary.startDate),
            ),
            1,
          )
        : dur || 1;

    return (
      <View style={{ gap: 16 }}>
        {/* Header Breadcrumb */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Pressable
            onPress={onBack}
            style={({ hovered }: WebPressableState) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 4,
              },
              Platform.OS === 'web' && hovered && { opacity: 0.8 },
            ]}
          >
            <AppIcon name="arrow-left" size={16} color={theme.colors.primary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: theme.colors.primary,
              }}
            >
              Back to Overview
            </Text>
          </Pressable>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#EFF6FF',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <AppIcon name="activity" size={12} color="#2563EB" />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: '#2563EB',
                letterSpacing: 0.5,
              }}
            >
              EXECUTIVE SUMMARY
            </Text>
          </View>
        </View>

        {/* Obsidian / Sapphire Hero Banner */}
        <LinearGradient
          colors={['#0F172A', '#1E1B4B', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={
            {
              borderRadius: 24,
              padding: 22,

              ...Platform.select({
                web: {
                  boxShadow: '0 8px 30px rgba(15,23,42,0.12)',
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
            } as any
          }
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: '#38BDF8',
                letterSpacing: 0.8,
              }}
            >
              TOTAL SPENT ACROSS TRIP
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(16,185,129,0.18)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#10B981',
                }}
              />
              <Text
                style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}
              >
                LIVE
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 32,
              fontWeight: '900',
              color: '#FFFFFF',
              letterSpacing: -1,
            }}
          >
            {cs}
            {totalSpent.toLocaleString('en-IN')}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              marginTop: 4,
            }}
          >
            {stopsList.length} stop{stopsList.length !== 1 ? 's' : ''} •{' '}
            {membersList.length} member{membersList.length !== 1 ? 's' : ''} •{' '}
            {durDays} days duration
          </Text>
        </LinearGradient>

        {/* Spending by Stop Breakdown */}
        {stopsList.length > 0 && (
          <View
            style={
              {
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: theme.colors.borderLight,

                ...Platform.select({
                  web: {
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
              } as any
            }
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: theme.colors.textPrimary,
                marginBottom: 16,
                letterSpacing: -0.3,
              }}
            >
              Spending by Destination
            </Text>
            <View style={{ gap: 14 }}>
              {stopsList.map((stop: any, idx: number) => {
                const stopSpent =
                  stop.totalSpentBase || stop.totalSpentLocal || 0;
                const percent =
                  totalSpent > 0
                    ? Math.round((stopSpent / totalSpent) * 100)
                    : 0;
                return (
                  <View key={stop.stopId || stop._id || idx}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>
                          {stop.emoji || '📍'}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: theme.colors.textPrimary,
                          }}
                        >
                          {stop.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textTertiary,
                          }}
                        >
                          ({stop.expenseCount || 0} exp)
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'baseline',
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '800',
                            color: theme.colors.textPrimary,
                          }}
                        >
                          {cs}
                          {stopSpent.toLocaleString('en-IN')}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: theme.colors.textSecondary,
                          }}
                        >
                          {percent}%
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#F1F5F9',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.max(percent, 4)}%`,
                          height: '100%',
                          backgroundColor: '#2563EB',
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Member Payment Balances */}
        {membersList.length > 0 && (
          <View
            style={
              {
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: theme.colors.borderLight,

                ...Platform.select({
                  web: {
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
              } as any
            }
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: theme.colors.textPrimary,
                marginBottom: 14,
                letterSpacing: -0.3,
              }}
            >
              Crew Payment Standings
            </Text>
            <View style={{ gap: 10 }}>
              {membersList.map((m: any, idx: number) => {
                const net = m.netBalance || 0;
                const isPositive = net >= 0;
                return (
                  <View
                    key={m.userId || idx}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: idx === membersList.length - 1 ? 0 : 1,
                      borderBottomColor: theme.colors.borderLight,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      {m.photoURL ? (
                        <Image
                          source={{ uri: m.photoURL }}
                          style={{ width: 34, height: 34, borderRadius: 17 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: '#EFF6FF',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '800',
                              color: '#2563EB',
                            }}
                          >
                            {m.displayName
                              ? m.displayName.charAt(0).toUpperCase()
                              : '?'}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: theme.colors.textPrimary,
                          }}
                        >
                          {m.displayName || 'Member'}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          Paid: {cs}
                          {(m.totalPaidBase || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '800',
                          color: isPositive ? '#10B981' : '#EF4444',
                        }}
                      >
                        {isPositive ? '+' : '−'}
                        {cs}
                        {Math.abs(net).toLocaleString('en-IN')}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: isPositive ? '#059669' : '#DC2626',
                        }}
                      >
                        {isPositive ? 'Gets Back' : 'Owes Crew'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  const AnalyticsSubView = ({
    tripId,
    onBack,
  }: {
    tripId: string;
    onBack: () => void;
  }) => {
    const { data: analyticsRes, isLoading, error } = useTripAnalytics(tripId);
    const analytics = (analyticsRes as any)?.data || analyticsRes;

    if (isLoading) {
      return (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={{
              color: theme.colors.textSecondary,
              marginTop: 10,
              fontSize: 13,
            }}
          >
            Loading analytics...
          </Text>
        </View>
      );
    }

    if (error || !analytics) {
      return (
        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
          <AppIcon
            name="alert-triangle"
            size={32}
            color={theme.colors.danger}
          />
          <Text
            style={{
              color: theme.colors.danger,
              marginTop: 8,
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            Could not load analytics
          </Text>
          <Pressable onPress={onBack} style={{ marginTop: 12 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
              Return to Overview
            </Text>
          </Pressable>
        </View>
      );
    }

    const categories = analytics.byCategory || [];
    const totalSpent = analytics.overall?.totalSpent || 0;

    return (
      <View style={{ gap: 16 }}>
        {/* Header Breadcrumb */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Pressable
            onPress={onBack}
            style={({ hovered }: WebPressableState) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 4,
              },
              Platform.OS === 'web' && hovered && { opacity: 0.8 },
            ]}
          >
            <AppIcon name="arrow-left" size={16} color={theme.colors.primary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: theme.colors.primary,
              }}
            >
              Back to Overview
            </Text>
          </Pressable>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#F0FDF4',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <AppIcon name="bar-chart-2" size={12} color="#16A34A" />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: '#16A34A',
                letterSpacing: 0.5,
              }}
            >
              SPEND ANALYTICS
            </Text>
          </View>
        </View>

        {/* Total Stats Banner */}
        <View
          style={
            {
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.colors.borderLight,

              ...Platform.select({
                web: {
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
            } as any
          }
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            TOTAL LOGGED EXPENSES
          </Text>
          <Text
            style={{
              fontSize: 32,
              fontWeight: '900',
              color: theme.colors.textPrimary,
              marginTop: 4,
              letterSpacing: -0.8,
            }}
          >
            {cs}
            {totalSpent.toLocaleString('en-IN')}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
              marginTop: 4,
            }}
          >
            {analytics.overall?.expenseCount || 0} transactions tracked
          </Text>
        </View>

        {/* Category Breakdown */}
        <View
          style={
            {
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.colors.borderLight,

              ...Platform.select({
                web: {
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
            } as any
          }
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: theme.colors.textPrimary,
              marginBottom: 14,
              letterSpacing: -0.3,
            }}
          >
            Spending by Category
          </Text>
          {categories.length > 0 ? (
            <View style={{ gap: 12 }}>
              {categories.map((item: any, idx: number) => {
                const amount = item.totalBase || 0;
                const percent =
                  totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                return (
                  <View key={item._id || idx}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.textPrimary,
                          textTransform: 'capitalize',
                          fontSize: 13,
                          fontWeight: '700',
                        }}
                      >
                        {item._id || 'General'}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'baseline',
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: theme.colors.textPrimary,
                            fontWeight: '800',
                            fontSize: 14,
                          }}
                        >
                          {cs}
                          {amount.toLocaleString('en-IN')}
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: 11,
                            fontWeight: '600',
                          }}
                        >
                          {percent}%
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#F1F5F9',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.max(percent, 4)}%`,
                          height: '100%',
                          backgroundColor: '#06B6D4',
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              No categorized expenses recorded yet.
            </Text>
          )}
        </View>
      </View>
    );
  };

  const LeaderboardSubView = ({
    tripId,
    onBack,
  }: {
    tripId: string;
    onBack: () => void;
  }) => {
    const {
      data: response,
      isLoading,
      error,
    } = useQuery({
      queryKey: ['trip-leaderboard', tripId],
      queryFn: () => achievementsApi.getLeaderboard(tripId),
    });

    if (isLoading) {
      return (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={{
              color: theme.colors.textSecondary,
              marginTop: 10,
              fontSize: 13,
            }}
          >
            Loading leaderboard...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
          <AppIcon
            name="alert-triangle"
            size={32}
            color={theme.colors.danger}
          />
          <Text
            style={{
              color: theme.colors.danger,
              marginTop: 8,
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            Could not load rankings
          </Text>
          <Pressable onPress={onBack} style={{ marginTop: 12 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
              Return to Overview
            </Text>
          </Pressable>
        </View>
      );
    }

    const rawLeaderboard =
      (response as any)?.data?.leaderboard ||
      (response as any)?.leaderboard ||
      [];

    return (
      <View style={{ gap: 16 }}>
        {/* Header Breadcrumb */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Pressable
            onPress={onBack}
            style={({ hovered }: WebPressableState) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 4,
              },
              Platform.OS === 'web' && hovered && { opacity: 0.8 },
            ]}
          >
            <AppIcon name="arrow-left" size={16} color={theme.colors.primary} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: theme.colors.primary,
              }}
            >
              Back to Overview
            </Text>
          </Pressable>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#FEF3C7',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <AppIcon name="award" size={12} color="#D97706" />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: '#D97706',
                letterSpacing: 0.5,
              }}
            >
              CREW RANKINGS
            </Text>
          </View>
        </View>

        {/* Leaderboard Card */}
        <View
          style={
            {
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.colors.borderLight,

              ...Platform.select({
                web: {
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
            } as any
          }
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: theme.colors.textPrimary,
              marginBottom: 14,
              letterSpacing: -0.3,
            }}
          >
            Trip Contributors & Superlatives
          </Text>
          {rawLeaderboard.length > 0 ? (
            <View style={{ gap: 10 }}>
              {rawLeaderboard.map((player: any, idx: number) => {
                const rankColors = ['#F59E0B', '#94A3B8', '#D97706'];
                const rankColor = rankColors[idx] || theme.colors.textSecondary;
                return (
                  <View
                    key={player.userId || idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      borderBottomWidth:
                        idx === rawLeaderboard.length - 1 ? 0 : 1,
                      borderBottomColor: theme.colors.borderLight,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: rankColor + '22',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '900',
                            color: rankColor,
                          }}
                        >
                          #{idx + 1}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '700',
                          color: theme.colors.textPrimary,
                        }}
                      >
                        {player.displayName || 'Member'}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: theme.colors.primary,
                      }}
                    >
                      {player.points || player.totalSpent || 0} pts
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              No ranking data logged yet.
            </Text>
          )}
        </View>
      </View>
    );
  };

  const StorySubView = ({
    trip,
    onBack,
  }: {
    trip: any;
    onBack: () => void;
  }) => (
    <View style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 2,
        }}
      >
        <Pressable
          onPress={onBack}
          style={({ hovered }: WebPressableState) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 4,
            },
            Platform.OS === 'web' && hovered && { opacity: 0.8 },
          ]}
        >
          <AppIcon name="arrow-left" size={16} color={theme.colors.primary} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: theme.colors.primary,
            }}
          >
            Back to Overview
          </Text>
        </Pressable>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#F3E8FF',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <AppIcon name="play-circle" size={12} color="#7C3AED" />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: '#7C3AED',
              letterSpacing: 0.5,
            }}
          >
            TRIP WRAPPED
          </Text>
        </View>
      </View>

      <LinearGradient
        colors={['#1E1B4B', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={
          {
            borderRadius: 24,
            padding: 24,

            ...Platform.select({
              web: {
                boxShadow: '0 8px 30px rgba(15,23,42,0.12)',
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
          } as any
        }
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            color: '#38BDF8',
            letterSpacing: 0.8,
          }}
        >
          TRIP HIGHLIGHTS
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '900',
            color: '#FFFFFF',
            marginTop: 4,
            letterSpacing: -0.8,
          }}
        >
          {trip?.title || 'Trip'} Story
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
            marginTop: 6,
            lineHeight: 20,
          }}
        >
          {trip?.stops?.length || 0} Stops Visited •{' '}
          {trip?.members?.length || 0} Crew Members • {cs}
          {(trip?.totalSpentBase || 0).toLocaleString('en-IN')} Total Spend
          Logged
        </Text>
      </LinearGradient>
    </View>
  );

  // ============================================================
  // TAB 1: OVERVIEW & INLINE DYNAMIC SUB-VIEWS
  // ============================================================
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* 5 Sleek Floating Action Buttons (matching media_1790183686571.jpg) */}
      <View style={styles.quickActionsBar}>
        <Pressable
          style={styles.quickActionCircleBtn}
          onPress={() => {
            haptics.selection();
            setShowInviteFriendModal(true);
          }}
        >
          <View
            style={[
              styles.quickActionCircleIcon,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          >
            <AppIcon name="user-plus" size={19} color={theme.colors.primary} />
          </View>
          <Text
            style={[
              styles.quickActionCircleLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Invite
          </Text>
        </Pressable>

        <Pressable
          style={styles.quickActionCircleBtn}
          onPress={() => {
            haptics.selection();
            setActiveTab(1); // Itinerary / Planner
          }}
        >
          <View
            style={[
              styles.quickActionCircleIcon,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          >
            <AppIcon name="calendar" size={19} color="#3B82F6" />
          </View>
          <Text
            style={[
              styles.quickActionCircleLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Itinerary
          </Text>
        </Pressable>

        <Pressable
          style={styles.quickActionCircleBtn}
          onPress={() => {
            haptics.selection();
            setActiveSubView('summary');
          }}
        >
          <View
            style={[
              styles.quickActionCircleIcon,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          >
            <AppIcon name="pie-chart" size={19} color="#10B981" />
          </View>
          <Text
            style={[
              styles.quickActionCircleLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Budget
          </Text>
        </Pressable>

        <Pressable
          style={styles.quickActionCircleBtn}
          onPress={() => {
            haptics.selection();
            setActiveTab(2); // Split / Expenses
          }}
        >
          <View
            style={[
              styles.quickActionCircleIcon,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          >
            <AppIcon name="receipt" size={19} color="#8B5CF6" />
          </View>
          <Text
            style={[
              styles.quickActionCircleLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Split
          </Text>
        </Pressable>

        <Pressable
          style={styles.quickActionCircleBtn}
          onPress={() => {
            haptics.selection();
            setShowMoreActionsModal(true);
          }}
        >
          <View
            style={[
              styles.quickActionCircleIcon,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          >
            <AppIcon
              name="more-horizontal"
              size={19}
              color={theme.colors.textPrimary}
            />
          </View>
          <Text
            style={[
              styles.quickActionCircleLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            More
          </Text>
        </Pressable>
      </View>

      {/* DYNAMIC CONTENT SWITCHER */}
      {activeSubView === 'summary' && (
        <SummarySubView
          tripId={id as string}
          onBack={() => setActiveSubView('overview')}
        />
      )}

      {activeSubView === 'analytics' && (
        <AnalyticsSubView
          tripId={id as string}
          onBack={() => setActiveSubView('overview')}
        />
      )}

      {activeSubView === 'rankings' && (
        <LeaderboardSubView
          tripId={id as string}
          onBack={() => setActiveSubView('overview')}
        />
      )}

      {activeSubView === 'story' && (
        <StorySubView trip={trip} onBack={() => setActiveSubView('overview')} />
      )}

      {/* DEFAULT EXECUTIVE OVERVIEW */}
      {activeSubView === 'overview' && (
        <>
          {/* Modern Trip Summary Card (matching media_1790183686571.jpg) */}
          <GlassCard
            style={styles.cleanSummaryCard}
            intensity={theme.isDark ? 20 : 10}
          >
            <View style={styles.cleanSummaryHeader}>
              <Text
                style={[
                  styles.cleanSummaryTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Trip Summary
              </Text>
              <View
                style={[
                  styles.cleanSummaryBadge,
                  {
                    backgroundColor:
                      budget > 0
                        ? isOverBudget
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(59, 130, 246, 0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cleanSummaryBadgeText,
                    {
                      color:
                        budget > 0
                          ? isOverBudget
                            ? theme.colors.danger
                            : theme.colors.success
                          : theme.colors.primary,
                    },
                  ]}
                >
                  {budget > 0
                    ? isOverBudget
                      ? 'Over Budget'
                      : 'On Track'
                    : 'Live Tracking'}
                </Text>
              </View>
            </View>

            <View style={styles.cleanSummaryAmountsRow}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.cleanSummaryAmountLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Total Spent
                </Text>
                <Text
                  style={[
                    styles.cleanSummaryAmountValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {cs}
                  {spent.toLocaleString()}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.cleanSummaryAmountLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Trip Budget
                </Text>
                <Text
                  style={[
                    styles.cleanSummaryBudgetVal,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {budget > 0 ? `${cs}${budget.toLocaleString()}` : 'No Limit'}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.cleanProgressBarBg}>
              <View
                style={[
                  styles.cleanProgressBarFill,
                  {
                    width: `${Math.min(progressPercent, 100)}%`,
                    backgroundColor: isOverBudget
                      ? theme.colors.danger
                      : theme.colors.primary,
                  },
                ]}
              />
            </View>
            <View style={styles.cleanProgressFooter}>
              <Text
                style={[
                  styles.cleanProgressSubtext,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {budget > 0
                  ? `${progressPercent.toFixed(0)}% of budget used`
                  : `${trip.stops?.length || 0} destinations logged`}
              </Text>
              {budget > 0 && (
                <Text
                  style={[
                    styles.cleanProgressRemaining,
                    {
                      color: isOverBudget
                        ? theme.colors.danger
                        : theme.colors.success,
                    },
                  ]}
                >
                  {isOverBudget
                    ? `${cs}${(spent - budget).toLocaleString()} over`
                    : `${cs}${(budget - spent).toLocaleString()} left`}
                </Text>
              )}
            </View>
          </GlassCard>

          {/* Recent Expenses Section (matching media_1790183686571.jpg) */}
          <View style={styles.sectionHeaderRow}>
            <Text
              style={[
                styles.sectionHeaderTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Recent Expenses
            </Text>
            <Pressable onPress={() => setActiveTab(2)}>
              <Text
                style={[
                  styles.sectionHeaderAction,
                  { color: theme.colors.primary },
                ]}
              >
                View all
              </Text>
            </Pressable>
          </View>

          {recentExpenses.length > 0 ? (
            <View style={styles.recentExpensesList}>
              {recentExpenses.map((exp: any) => {
                const catMeta = getCategoryIconAndColor(exp.category);
                return (
                  <Pressable
                    key={exp._id}
                    style={({ pressed }) => [
                      styles.recentExpenseRow,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.05)',
                      },
                      pressed && { transform: [{ scale: 0.99 }] },
                    ]}
                    onPress={() => setActiveTab(2)}
                  >
                    <View
                      style={[
                        styles.recentExpenseIconBox,
                        { backgroundColor: catMeta.bg },
                      ]}
                    >
                      <AppIcon
                        name={catMeta.icon as any}
                        size={18}
                        color={catMeta.color}
                      />
                    </View>
                    <View style={styles.recentExpenseInfo}>
                      <Text
                        style={[
                          styles.recentExpenseTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {exp.title}
                      </Text>
                      <Text
                        style={[
                          styles.recentExpenseSub,
                          { color: theme.colors.textTertiary },
                        ]}
                        numberOfLines={1}
                      >
                        {exp.paidByName
                          ? `Paid by ${exp.paidByName}`
                          : trip.title}{' '}
                        • {exp.category || 'General'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.recentExpenseAmount,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {exp.localCurrency === 'INR' ||
                        trip.baseCurrency === 'INR'
                          ? '₹'
                          : exp.localCurrency || trip.baseCurrency || ''}{' '}
                        {(
                          exp.amountLocal ||
                          exp.amountBase ||
                          0
                        ).toLocaleString()}
                      </Text>
                      <AppIcon
                        name="chevron-right"
                        size={14}
                        color={theme.colors.textTertiary}
                        style={{ marginTop: 2 }}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <GlassCard
              style={styles.emptyExpenseMiniCard}
              intensity={theme.isDark ? 10 : 5}
            >
              <Text
                style={[
                  styles.emptyExpenseMiniText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No expenses logged yet. Tap + to record your first bill!
              </Text>
              <Pressable
                style={[
                  styles.miniAddExpenseBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => router.push(`/(app)/trips/${id}/add-expense`)}
              >
                <AppIcon name="plus" size={14} color="#FFF" />
                <Text style={styles.miniAddExpenseBtnText}>Add Expense</Text>
              </Pressable>
            </GlassCard>
          )}

          {/* Stops Highlight Shortcut */}
          <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
            <Text
              style={[
                styles.sectionHeaderTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Destinations ({trip.stops?.length || 0})
            </Text>
            <Pressable onPress={() => setActiveTab(3)}>
              <Text
                style={[
                  styles.sectionHeaderAction,
                  { color: theme.colors.primary },
                ]}
              >
                View Deck →
              </Text>
            </Pressable>
          </View>

          <GlassCard
            style={styles.stopsHighlightCard}
            intensity={theme.isDark ? 12 : 6}
          >
            {trip.stops && trip.stops.length > 0 ? (
              <Pressable
                style={styles.stopsHighlightContent}
                onPress={() => setActiveTab(3)}
              >
                <Image
                  source={{ uri: getStopCoverImage(trip.stops[0], trip.title) }}
                  style={styles.stopsHighlightThumb}
                />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text
                    style={[
                      styles.stopsHighlightName,
                      { color: theme.colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {trip.stops[0].name}
                  </Text>
                  <Text
                    style={[
                      styles.stopsHighlightSub,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {trip.stops[0].expenseCount || 0} expenses ·{' '}
                    {formatAmount(
                      trip.stops[0].totalSpentBase || 0,
                      trip.baseCurrency,
                    )}
                  </Text>
                </View>
                <View
                  style={[
                    styles.stopsHighlightBadge,
                    { backgroundColor: theme.colors.primaryBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.stopsHighlightBadgeText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    +{trip.stops.length} Stops
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.stopsHighlightEmpty}>
                <Text
                  style={[
                    styles.emptyExpenseMiniText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Organize your trip by adding destinations.
                </Text>
                <Pressable
                  style={[
                    styles.miniAddExpenseBtn,
                    { backgroundColor: theme.colors.primary, marginTop: 8 },
                  ]}
                  onPress={() => router.push(`/(app)/trips/${id}/add-stop`)}
                >
                  <AppIcon name="plus" size={14} color="#FFF" />
                  <Text style={styles.miniAddExpenseBtnText}>
                    Add First Stop
                  </Text>
                </Pressable>
              </View>
            )}
          </GlassCard>
          {/* Contextual Travel Partner Deal */}
          <View style={{ marginTop: 20 }}>
            <TravelAffiliateCard destination={trip.title} type="hotel" />
          </View>
        </>
      )}
    </View>
  );

  // ============================================================
  // TAB 3: STOPS (PINTEREST-INSPIRED STACKED CARD DECK)
  // ============================================================
  const renderStopsTab = () => (
    <View style={styles.tabContent}>
      <StackedStopsDeck
        stops={(trip.stops as any) || []}
        tripTitle={trip.title}
        tripId={id as string}
        baseCurrency={trip.baseCurrency || 'INR'}
        onSelectStop={stopId =>
          router.push(`/(app)/trips/${id}/stops/${stopId}`)
        }
        onAddStop={() => router.push(`/(app)/trips/${id}/add-stop`)}
        onAddExpenseToStop={stopId =>
          router.push({
            pathname: `/(app)/trips/${id}/add-expense`,
            params: { stopId },
          } as any)
        }
        onReorderStops={
          trip.stops?.length > 1
            ? () => router.push(`/(app)/trips/${id}/stops/reorder`)
            : undefined
        }
      />
      <View style={{ marginTop: 20 }}>
        <TravelAffiliateCard destination={trip.title} type="activity" />
      </View>
    </View>
  );

  // ============================================================
  // TAB 4: MEMBERS
  // ============================================================
  const renderMembersTab = () => (
    <View style={styles.tabContent}>
      <View style={{ marginBottom: 24 }}>
        <Text
          style={[
            styles.sectionHeader,
            { marginBottom: 16, color: theme.colors.textPrimary },
          ]}
        >
          Travelers ({members.length})
        </Text>
        <View style={Platform.OS === 'web' ? styles.webGrid : { gap: 16 }}>
          {members.map((member: any) => (
            <View
              key={member.userId}
              style={Platform.OS === 'web' ? styles.webGridItem : {}}
            >
              <MemberRow
                member={member}
                currencySymbol={cs}
                settlementTransactions={
                  settlementData?.settlement?.transactions
                }
              />
            </View>
          ))}
        </View>
      </View>

      {/* Join Requests */}
      {isTripAdmin && pendingRequests && pendingRequests.length > 0 && (
        <GlassCard
          style={[styles.membersCard, { borderColor: theme.colors.primary }]}
          intensity={theme.isDark ? 12 : 6}
        >
          <Text
            style={[styles.sectionHeader, { color: theme.colors.textPrimary }]}
          >
            Requests ({pendingRequests.length})
          </Text>
          {pendingRequests.map((req: any, idx: number) => (
            <View key={req._id}>
              <View style={styles.requestRow}>
                <View
                  style={[
                    styles.requestAvatar,
                    { backgroundColor: theme.colors.primaryBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.requestAvatarText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {req.userName.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.requestName,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {req.userName}
                  </Text>
                  <Text
                    style={[
                      styles.requestSub,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Requested to join
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    style={[
                      styles.reqBtn,
                      { backgroundColor: theme.colors.success },
                    ]}
                    onPress={() => approveRequest(req._id)}
                    disabled={isApproving}
                  >
                    <Text style={styles.reqBtnText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.reqBtn,
                      { backgroundColor: theme.colors.danger },
                    ]}
                    onPress={() => rejectRequest(req._id)}
                    disabled={isRejecting}
                  >
                    <Text style={styles.reqBtnText}>Deny</Text>
                  </Pressable>
                </View>
              </View>
              {idx < pendingRequests.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.borderLight },
                  ]}
                />
              )}
            </View>
          ))}
        </GlassCard>
      )}

      {/* Invite Card */}
      {trip.inviteCode ? (
        <GlassCard
          style={[styles.memberCard, { marginTop: 8 }]}
          intensity={theme.isDark ? 12 : 6}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Pressable
              onLongPress={async () => {
                await Clipboard.setStringAsync(trip.inviteCode);
                Alert.alert('Copied!');
              }}
            >
              <Text
                style={[
                  styles.inviteLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Invite Code
              </Text>
              <Text
                style={[
                  styles.inviteCode,
                  {
                    color: theme.colors.textPrimary,
                    marginTop: 8,
                    marginBottom: 4,
                  },
                ]}
              >
                {trip.inviteCode}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.textTertiary }}>
                Tap to copy
              </Text>
              {trip.inviteCodeExpiresAt && (
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.colors.textTertiary,
                    marginTop: 4,
                  }}
                >
                  Valid until{' '}
                  {format(new Date(trip.inviteCodeExpiresAt), 'MMM d, h:mm a')}
                </Text>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.inviteShareBtn,
                { backgroundColor: theme.colors.primaryBg },
              ]}
              onPress={handleShareInvite}
            >
              <AppIcon name="share-2" size={18} color={theme.colors.primary} />
            </Pressable>
          </View>
          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.primary, marginTop: 16 },
            ]}
            onPress={() => setShowInviteFriendModal(true)}
          >
            <Text style={styles.primaryButtonText}>+ Invite Friends</Text>
          </Pressable>
        </GlassCard>
      ) : (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            style={[
              styles.addStopBtn,
              { borderColor: theme.colors.border, flex: 1 },
            ]}
            onPress={handleInvite}
          >
            <Text style={[styles.addStopText, { color: theme.colors.primary }]}>
              Generate Link
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.addStopBtn,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary,
                flex: 1,
              },
            ]}
            onPress={() => setShowInviteFriendModal(true)}
          >
            <Text style={[styles.addStopText, { color: theme.colors.surface }]}>
              Invite Friends
            </Text>
          </Pressable>
        </View>
      )}

      {/* Manual Search */}
      <Text
        style={[
          styles.sectionHeader,
          { marginTop: 24, color: theme.colors.textPrimary },
        ]}
      >
        Add Manually
      </Text>
      <GlassCard style={styles.searchWrap} intensity={theme.isDark ? 10 : 5}>
        <AppIcon name="search" size={16} color={theme.colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          placeholder="Search by email or name..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </GlassCard>

      {isSearching && (
        <GlobalLoader
          variant="inline"
          color={theme.colors.primary}
          style={{ marginTop: 16 }}
        />
      )}

      {searchResults.length > 0 && (
        <View style={{ marginTop: 16, gap: 12 }}>
          {searchResults.map((usr: any) => {
            const isAlreadyMember = members.some(
              (m: any) => m.userId === usr._id && m.isActive,
            );
            return (
              <GlassCard
                key={usr._id}
                style={styles.searchResultCard}
                intensity={theme.isDark ? 8 : 4}
              >
                <View
                  style={[
                    styles.requestAvatar,
                    { backgroundColor: theme.colors.primaryBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.requestAvatarText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {usr.displayName.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.requestName,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {usr.displayName}
                  </Text>
                  <Text
                    style={[
                      styles.requestSub,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {usr.email}
                  </Text>
                </View>
                {isAlreadyMember ? (
                  <Badge label="Joined" variant="success" />
                ) : (
                  <Pressable
                    style={[
                      styles.reqBtn,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    disabled={isAddingMember}
                    onPress={() =>
                      addTripMember(
                        { tripId: id, userId: usr._id },
                        {
                          onSuccess: () => {
                            setSearchQuery('');
                            Alert.alert('Added!');
                          },
                        },
                      )
                    }
                  >
                    <Text style={styles.reqBtnText}>Add</Text>
                  </Pressable>
                )}
              </GlassCard>
            );
          })}
        </View>
      )}
    </View>
  );

  // ============================================================
  // MAIN RENDER WRAPPER
  // ============================================================

  const renderStickyHeaderContent = () => (
    <View style={styles.headerTopRow}>
      <Pressable
        onPress={() => router.back()}
        style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
      >
        <AppIcon name="arrow-left" size={18} color={theme.colors.textPrimary} />
      </Pressable>
      <View style={styles.headerRight}>
        {activeMembers.length > 0 && (
          <AvatarGroup urls={memberUrls} max={3} size={28} />
        )}
        <Pressable
          onPress={() => {
            if (!isTripAdmin) {
              showToast.info(
                'Admin Only',
                'Only trip admins can access trip settings.',
              );
              return;
            }
            router.push(`/(app)/trips/${id}/settings`);
          }}
          style={[
            styles.iconBtn,
            { marginLeft: 12, backgroundColor: theme.colors.surface },
            !isTripAdmin && { opacity: 0.45 },
          ]}
          accessibilityLabel="Trip Settings"
        >
          <AppIcon
            name="settings"
            size={18}
            color={
              isTripAdmin ? theme.colors.textPrimary : theme.colors.textTertiary
            }
          />
        </Pressable>
      </View>
    </View>
  );

  const renderCinematicHeaderText = () => (
    <View style={styles.cinematicHeaderText}>
      <Badge
        label={trip.isArchived ? 'Archived' : 'Active'}
        variant={trip.isArchived ? 'neutral' : 'success'}
      />
      <Text
        style={[styles.tripTitle, { color: theme.colors.textPrimary }]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {trip.title}
      </Text>
      <Text
        style={[styles.tripSubtitle, { color: theme.colors.textSecondary }]}
      >
        {format(s, 'MMM d')} – {format(e, 'MMM d, yyyy')} • {dur} Days
      </Text>
    </View>
  );

  const renderDesktopSidebar = () => (
    <View style={styles.desktopSidebar}>
      {renderStickyHeaderContent()}
      {renderCinematicHeaderText()}

      <GlassCard
        style={styles.desktopNavCard}
        intensity={theme.isDark ? 20 : 10}
      >
        <View style={styles.desktopNavHeader}>
          <Text
            style={[
              styles.desktopNavSectionTitle,
              { color: theme.colors.textTertiary },
            ]}
          >
            TRIP NAVIGATION
          </Text>
        </View>

        <View style={styles.desktopNavItems}>
          {TRIP_NAV_TABS.map(tab => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === 3
                ? trip?.stops?.length
                : tab.key === 4
                  ? activeMembers?.length
                  : undefined;

            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  haptics.selection();
                  setActiveTab(tab.key);
                }}
                style={({ pressed, hovered }: any) => [
                  styles.desktopNavItem,
                  isActive && [
                    styles.desktopNavItemActive,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.04)',
                      borderColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : `${theme.colors.primary}25`,
                    },
                  ],
                  pressed && { transform: [{ scale: 0.98 }] },
                  Platform.OS === 'web' &&
                    hovered &&
                    !isActive && {
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                ]}
              >
                {isActive && (
                  <View
                    style={[
                      styles.activeTabPill,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.desktopNavIconWrap,
                    {
                      backgroundColor: isActive
                        ? theme.colors.primary
                        : theme.isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}
                >
                  <AppIcon
                    name={tab.icon as any}
                    size={16}
                    color={
                      isActive
                        ? theme.isDark &&
                          (theme.colors.primary === '#F4F4F5' ||
                            theme.colors.primary === '#FFFFFF')
                          ? '#18181B'
                          : '#FFFFFF'
                        : theme.colors.textSecondary
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.desktopNavLabel,
                      {
                        color: isActive
                          ? theme.colors.fontColor || theme.colors.textPrimary
                          : theme.colors.textSecondary,
                        fontWeight: isActive ? '800' : '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </View>
                {count !== undefined && count > 0 && (
                  <View
                    style={[
                      styles.desktopNavBadge,
                      {
                        backgroundColor: isActive
                          ? `${theme.colors.primary}25`
                          : theme.isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.desktopNavBadgeText,
                        {
                          color: isActive
                            ? theme.colors.fontColor || theme.colors.textPrimary
                            : theme.colors.textTertiary,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Quick Add Expense in Sidebar */}
        <Pressable
          onPress={() => {
            haptics.medium();
            router.push(`/(app)/trips/${id}/add-expense`);
          }}
          style={({ pressed, hovered }: any) => [
            styles.desktopSidebarAddBtn,
            pressed && { transform: [{ scale: 0.98 }] },
            Platform.OS === 'web' && hovered && { opacity: 0.9 },
          ]}
        >
          <LinearGradient
            colors={
              theme.gradients.primary || [
                theme.colors.primary,
                theme.colors.secondary,
              ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.desktopSidebarAddGradient}
          >
            <AppIcon name="plus" size={15} color="#FFFFFF" />
            <Text style={styles.desktopSidebarAddText}>Add Expense</Text>
          </LinearGradient>
        </Pressable>
      </GlassCard>
    </View>
  );

  const renderRightSummaryColumn = () => (
    <View style={styles.desktopSummary}>
      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
            borderWidth: 1,
            borderRadius: 20,
            padding: 18,

            ...Platform.select({
              web: {
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
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
        ]}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <Text
            style={[
              styles.sectionHeader,
              { color: theme.colors.textPrimary, marginBottom: 0 },
            ]}
          >
            Trip Progress
          </Text>
          {budget > 0 ? (
            <View
              style={{
                backgroundColor: isOverBudget ? '#FEE2E2' : '#EFF6FF',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: isOverBudget ? '#EF4444' : '#2563EB',
                }}
              >
                {isOverBudget ? 'Over Budget' : 'On Track'}
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: '#ECFDF5',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: '800', color: '#10B981' }}
              >
                Live Tracking
              </Text>
            </View>
          )}
        </View>
        <View style={styles.progressRow}>
          <View
            style={[
              styles.progressCircle,
              {
                borderColor:
                  budget > 0
                    ? isOverBudget
                      ? theme.colors.danger
                      : theme.colors.primary
                    : theme.colors.primary,
                backgroundColor: `${theme.colors.primary}10`,
              },
            ]}
          >
            <Text
              style={[
                styles.progressCircleText,
                { color: theme.colors.textPrimary, fontWeight: '900' },
              ]}
            >
              {budget > 0 ? `${progressPercent.toFixed(0)}%` : 'LIVE'}
            </Text>
          </View>
          <View style={styles.progressDetails}>
            <Text
              style={[
                styles.progressAmount,
                {
                  color: theme.colors.textPrimary,
                  fontSize: 18,
                  fontWeight: '900',
                },
              ]}
            >
              {cs}
              {spent.toLocaleString()}
            </Text>
            <Text
              style={[
                styles.progressSubtext,
                { color: theme.colors.textSecondary, fontSize: 12 },
              ]}
            >
              {budget > 0
                ? `of ${cs}${budget.toLocaleString()} budget`
                : 'Total expenses logged'}
            </Text>
            {budget > 0 && (
              <View
                style={[
                  styles.progressBarBg,
                  {
                    backgroundColor: theme.colors.borderLight,
                    height: 6,
                    borderRadius: 3,
                    marginTop: 6,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(progressPercent, 100)}%`,
                      backgroundColor: isOverBudget
                        ? theme.colors.danger
                        : theme.colors.primary,
                      height: '100%',
                      borderRadius: 3,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.rightKpiGrid}>
        {[
          {
            icon: 'wallet',
            label: 'BUDGET',
            value: `${formatAmount(budget, trip.baseCurrency)}`,
            sub: dur > 0 ? `${dur} Days` : 'Allocated',
            bg: '#EFF6FF',
            color: '#2563EB',
          },
          {
            icon: 'credit-card',
            label: 'TOTAL SPENT',
            value: `${formatAmount(spent, trip.baseCurrency)}`,
            sub: budget > 0 ? `${progressPercent.toFixed(0)}% used` : 'Logged',
            bg: '#FEF2F2',
            color: '#EF4444',
          },
          {
            icon: 'pie-chart',
            label: 'REMAINING',
            value: `${formatAmount(Math.max(budget - spent, 0), trip.baseCurrency)}`,
            sub: isOverBudget ? 'Over' : 'Left',
            bg: '#ECFDF5',
            color: '#10B981',
          },
          {
            icon: 'calendar',
            label: 'DAILY AVG',
            value: `${formatAmount(dur > 0 ? spent / dur : spent, trip.baseCurrency)}`,
            sub: 'Per day',
            bg: '#FEF3C7',
            color: '#D97706',
          },
        ].map((stat, i) => (
          <GlassCard
            key={i}
            style={styles.rightKpiCard}
            intensity={theme.isDark ? 15 : 10}
          >
            <View style={styles.kpiHeaderRow}>
              <View
                style={[
                  styles.kpiIconWrap,
                  {
                    backgroundColor: theme.isDark ? `${stat.color}20` : stat.bg,
                  },
                ]}
              >
                <AppIcon name={stat.icon as any} size={12} color={stat.color} />
              </View>
              <View
                style={[
                  styles.kpiBadgePill,
                  {
                    backgroundColor: `${stat.color}15`,
                    borderColor: `${stat.color}25`,
                  },
                ]}
              >
                <Text style={[styles.kpiBadgeText, { color: stat.color }]}>
                  {stat.label}
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.kpiValue,
                { color: theme.colors.textPrimary, fontSize: 17 },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stat.value}
            </Text>
            <Text
              style={[
                styles.kpiSub,
                { color: theme.colors.textTertiary, fontSize: 10 },
              ]}
              numberOfLines={1}
            >
              {stat.sub}
            </Text>
          </GlassCard>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <InviteCard
          ref={inviteCardRef}
          trip={trip}
          userName={user?.displayName || 'Your friend'}
        />
      </View>

      <InviteFriendModal
        visible={showInviteFriendModal}
        onClose={() => setShowInviteFriendModal(false)}
        tripId={id as string}
      />

      {/* Global Gradient Background */}
      <View style={StyleSheet.absoluteFill}>
        <GlobalBackground />
      </View>

      {isWideDesktop ? (
        <View style={styles.desktopLayout}>
          {/* LEFT NAVIGATION SIDEBAR */}
          <View style={styles.desktopSidebar}>
            {renderStickyHeaderContent()}
            {renderCinematicHeaderText()}

            <View style={{ marginTop: 16 }}>
              <TabBar
                tabs={TABS.map((tab, index) => ({
                  key: String(index),
                  label: tab,
                }))}
                activeKey={String(activeTab)}
                onTabChange={key => setActiveTab(parseInt(key, 10))}
                variant="segmented"
                orientation="vertical"
              />
            </View>
          </View>

          {/* MIDDLE MAIN CONTENT */}
          <View style={styles.desktopMainContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: insets.bottom + 120,
                paddingTop: 16,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary}
                />
              }
            >
              <View style={styles.contentBody}>
                {activeTab === 0 && renderOverviewTab()}
                {activeTab === 1 && (
                  <PlannerTab
                    tripId={id as string}
                    showHero={false}
                    scrollEnabled={false}
                  />
                )}
                {activeTab === 2 && <ExpensesTab tripId={id as string} />}
                {activeTab === 3 && renderStopsTab()}
                {activeTab === 4 && renderMembersTab()}
                {activeTab === 5 && <SettlementTab tripId={id as string} />}
                {activeTab === 6 && (
                  <TripLocalTab
                    tripId={id as string}
                    destinationCity={
                      (trip as any)?.destination ||
                      (trip as any)?.destinationCity ||
                      'Goa'
                    }
                  />
                )}
              </View>
            </ScrollView>
          </View>

          {/* RIGHT SUMMARY COLUMN */}
          {showRightSummary && renderRightSummaryColumn()}
        </View>
      ) : (
        <>
          {/* MOBILE/TABLET LAYOUT */}
          <View style={{ zIndex: 10 }}>
            <View style={styles.cinematicHeroWrapper}>
              <ImageBackground
                source={{ uri: getTripCoverImage(trip) }}
                style={styles.cinematicHeroBg}
                imageStyle={{
                  borderBottomLeftRadius: 28,
                  borderBottomRightRadius: 28,
                }}
              >
                <LinearGradient
                  colors={[
                    'rgba(0,0,0,0.35)',
                    'rgba(15,23,42,0.55)',
                    'rgba(15,23,42,0.95)',
                  ]}
                  locations={[0, 0.45, 1]}
                  style={StyleSheet.absoluteFill}
                />
                {/* Top Nav Bar */}
                <View
                  style={[
                    styles.heroTopBar,
                    {
                      paddingTop:
                        Platform.OS === 'web'
                          ? 16
                          : Math.max(
                              insets.top,
                              Platform.OS === 'android'
                                ? (StatusBar.currentHeight ?? 38)
                                : 24,
                            ) + 8,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => router.back()}
                    style={styles.heroGlassIconBtn}
                  >
                    <AppIcon name="arrow-left" size={18} color="#FFFFFF" />
                  </Pressable>

                  <View style={styles.heroTopCenter}>
                    <View
                      style={[
                        styles.heroStatusBadge,
                        {
                          backgroundColor: trip.isArchived
                            ? 'rgba(148, 163, 184, 0.25)'
                            : 'rgba(16, 185, 129, 0.25)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.heroStatusDot,
                          {
                            backgroundColor: trip.isArchived
                              ? '#94A3B8'
                              : '#10B981',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.heroStatusText,
                          { color: trip.isArchived ? '#CBD5E1' : '#34D399' },
                        ]}
                      >
                        {trip.isArchived ? 'Archived' : 'Active'}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => {
                      if (!isTripAdmin) {
                        showToast.info(
                          'Admin Only',
                          'Only trip admins can access trip settings.',
                        );
                        return;
                      }
                      router.push(`/(app)/trips/${id}/settings`);
                    }}
                    style={[
                      styles.heroGlassIconBtn,
                      !isTripAdmin && { opacity: 0.45 },
                    ]}
                    accessibilityLabel="Trip Settings"
                  >
                    <AppIcon
                      name="settings"
                      size={18}
                      color={isTripAdmin ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
                    />
                  </Pressable>
                </View>

                {/* Hero Bottom: Title, Dates, Member Avatars */}
                <View style={styles.heroBottomContent}>
                  <Text
                    style={styles.heroTripTitle}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                  >
                    {trip.title}
                  </Text>
                  <View style={styles.heroSubtitleRow}>
                    <Text style={styles.heroTripDates}>
                      {format(s, 'MMM d')} – {format(e, 'MMM d, yyyy')} • {dur}{' '}
                      {dur === 1 ? 'Day' : 'Days'} • {activeMembers.length}{' '}
                      {activeMembers.length === 1 ? 'Member' : 'Members'}
                    </Text>
                    {activeMembers.length > 0 && (
                      <AvatarGroup urls={memberUrls} max={3} size={28} />
                    )}
                  </View>
                </View>
              </ImageBackground>
            </View>

            <View
              style={[
                styles.tabsContainer,
                { marginHorizontal: 16, marginTop: 12, overflow: 'hidden' },
              ]}
            >
              <TabBar
                tabs={TABS.map((tab, index) => ({
                  key: String(index),
                  label: tab,
                }))}
                activeKey={String(activeTab)}
                onTabChange={key => setActiveTab(parseInt(key, 10))}
                scrollable={true}
                variant="segmented"
              />
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
          >
            <View
              style={[
                styles.contentBody,
                isWebDesktop && styles.webDesktopContent,
              ]}
            >
              {activeTab === 0 && renderOverviewTab()}
              {activeTab === 1 && (
                <PlannerTab
                  tripId={id as string}
                  showHero={false}
                  scrollEnabled={false}
                />
              )}
              {activeTab === 2 && <ExpensesTab tripId={id as string} />}
              {activeTab === 3 && renderStopsTab()}
              {activeTab === 4 && renderMembersTab()}
              {activeTab === 5 && <SettlementTab tripId={id as string} />}
              {activeTab === 6 && (
                <TripLocalTab
                  tripId={id as string}
                  destinationCity={
                    (trip as any)?.destination ||
                    (trip as any)?.destinationCity ||
                    'Goa'
                  }
                />
              )}
            </View>
          </ScrollView>
        </>
      )}

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: insets.bottom + 24,
            backgroundColor: theme.colors.secondary,
          },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
        onPress={() => {
          haptics.medium();
          router.push(`/(app)/trips/${id}/add-expense`);
        }}
      >
        <LinearGradient
          colors={theme.gradients.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <AppIcon name="plus" size={28} color="#FFF" />
      </Pressable>

      <TripCompletionSheet
        visible={showCompletionSheet}
        data={completionData}
        onClose={() => setShowCompletionSheet(false)}
        onViewReport={handleGenerateReport}
      />

      {/* More Actions Modal */}
      <Modal
        visible={showMoreActionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreActionsModal(false)}
      >
        <Pressable
          style={styles.moreModalOverlay}
          onPress={() => setShowMoreActionsModal(false)}
        >
          <Pressable
            style={[
              styles.moreModalSheet,
              {
                backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.moreModalHeader}>
              <Text
                style={[
                  styles.moreModalTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Trip Actions & Tools
              </Text>
              <Pressable
                onPress={() => setShowMoreActionsModal(false)}
                style={[
                  styles.moreModalCloseBtn,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <AppIcon name="x" size={16} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.moreModalGrid}>
              <Pressable
                style={styles.moreModalItem}
                onPress={() => {
                  setShowMoreActionsModal(false);
                  setActiveTab(5); // Settle
                }}
              >
                <View
                  style={[
                    styles.moreModalIconWrap,
                    { backgroundColor: `${theme.colors.secondary}15` },
                  ]}
                >
                  <AppIcon
                    name="credit-card"
                    size={20}
                    color={theme.colors.secondary}
                  />
                </View>
                <Text
                  style={[
                    styles.moreModalLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Settle Up
                </Text>
              </Pressable>

              <Pressable
                style={styles.moreModalItem}
                onPress={() => {
                  setShowMoreActionsModal(false);
                  setActiveSubView('analytics');
                }}
              >
                <View
                  style={[
                    styles.moreModalIconWrap,
                    { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
                  ]}
                >
                  <AppIcon name="bar-chart-2" size={20} color="#3B82F6" />
                </View>
                <Text
                  style={[
                    styles.moreModalLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Analytics
                </Text>
              </Pressable>

              <Pressable
                style={styles.moreModalItem}
                onPress={() => {
                  setShowMoreActionsModal(false);
                  setActiveSubView('rankings');
                }}
              >
                <View
                  style={[
                    styles.moreModalIconWrap,
                    { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                  ]}
                >
                  <AppIcon name="award" size={20} color="#F59E0B" />
                </View>
                <Text
                  style={[
                    styles.moreModalLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Rankings
                </Text>
              </Pressable>

              <Pressable
                style={styles.moreModalItem}
                onPress={() => {
                  setShowMoreActionsModal(false);
                  setActiveSubView('story');
                }}
              >
                <View
                  style={[
                    styles.moreModalIconWrap,
                    { backgroundColor: 'rgba(168, 85, 247, 0.15)' },
                  ]}
                >
                  <AppIcon name="play-circle" size={20} color="#A855F7" />
                </View>
                <Text
                  style={[
                    styles.moreModalLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Trip Story
                </Text>
              </Pressable>

              <Pressable
                style={styles.moreModalItem}
                onPress={() => {
                  setShowMoreActionsModal(false);
                  router.push(`/(app)/trips/${id}/map`);
                }}
              >
                <View
                  style={[
                    styles.moreModalIconWrap,
                    { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                  ]}
                >
                  <AppIcon name="map-pin" size={20} color="#10B981" />
                </View>
                <Text
                  style={[
                    styles.moreModalLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Map View
                </Text>
              </Pressable>

              <Pressable
                style={styles.moreModalItem}
                onPress={() => {
                  setShowMoreActionsModal(false);
                  handleGenerateReport();
                }}
              >
                <View
                  style={[
                    styles.moreModalIconWrap,
                    { backgroundColor: 'rgba(6, 182, 212, 0.15)' },
                  ]}
                >
                  <AppIcon name="file-text" size={20} color="#06B6D4" />
                </View>
                <Text
                  style={[
                    styles.moreModalLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  PDF Report
                </Text>
              </Pressable>

              <Pressable
                style={styles.moreModalItem}
                onPress={() => {
                  setShowMoreActionsModal(false);
                  if (trip.isArchived) handleUnarchive();
                  else handleArchive();
                }}
              >
                <View
                  style={[
                    styles.moreModalIconWrap,
                    { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                  ]}
                >
                  <AppIcon
                    name={trip.isArchived ? 'refresh-cw' : 'archive'}
                    size={20}
                    color="#EF4444"
                  />
                </View>
                <Text
                  style={[
                    styles.moreModalLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {trip.isArchived ? 'Unarchive' : 'Archive'}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.moreModalItem,
                  !isTripAdmin && { opacity: 0.45 },
                ]}
                onPress={() => {
                  setShowMoreActionsModal(false);
                  if (!isTripAdmin) {
                    showToast.info(
                      'Admin Only',
                      'Only trip admins can access trip settings.',
                    );
                    return;
                  }
                  router.push(`/(app)/trips/${id}/settings`);
                }}
              >
                <View
                  style={[
                    styles.moreModalIconWrap,
                    { backgroundColor: 'rgba(148, 163, 184, 0.15)' },
                  ]}
                >
                  <AppIcon name="settings" size={20} color="#94A3B8" />
                </View>
                <Text
                  style={[
                    styles.moreModalLabel,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Settings
                </Text>
                {!isTripAdmin && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.colors.textTertiary,
                      marginLeft: 'auto',
                    }}
                  >
                    Admin only
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================================
// Styles (Unified, Fully Themed)
// ============================================================
const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: 'transparent' },
        contentBody: { flex: 1, width: '100%', minWidth: 0 },
        webDesktopContent: { flex: 1, width: '100%', minWidth: 0 },
        hoverLift: { transform: [{ translateY: -2 }] },
        webGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
        webGridItem: {
          width: 'auto',
          minWidth: 320,
          flexGrow: 1,
          flexBasis: 320,
          flexShrink: 0,
        },
        desktopLayout: {
          flexDirection: 'row',
          width: '95%',
          maxWidth: 1600,
          alignSelf: 'center',
          height: '100%',
          gap: 24,
          paddingTop: 24,
        },
        desktopSidebar: { width: 260, flexShrink: 0, paddingLeft: 12 },
        // Desktop Left Navigation
        desktopNavCard: {
          borderRadius: 24,
          padding: 10,
          marginTop: 8,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.06)',
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(255,255,255,0.6)',
        },
        desktopNavHeader: {
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 6,
        },
        desktopNavSectionTitle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
        desktopNavItems: {
          gap: 4,
        },
        desktopNavItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 14,
          position: 'relative',
          borderWidth: 1,
          borderColor: 'transparent',
          ...Platform.select({
            web: {
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            } as any,
          }),
        },
        desktopNavItemActive: {
          // dynamic border & bg
        },
        activeTabPill: {
          position: 'absolute',
          left: 0,
          top: 10,
          bottom: 10,
          width: 3.5,
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
        },
        desktopNavIconWrap: {
          width: 34,
          height: 34,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        desktopNavLabel: {
          fontSize: 14,
          flex: 1,
        },
        desktopNavBadge: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 10,
          marginLeft: 8,
        },
        desktopNavBadgeText: {
          fontSize: 11,
          fontWeight: '700',
        },
        desktopSidebarAddBtn: {
          marginTop: 12,
          borderRadius: 14,
          overflow: 'hidden',
          ...Platform.select({
            web: {
              cursor: 'pointer',
            } as any,
          }),
        },
        desktopSidebarAddGradient: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 11,
          paddingHorizontal: 16,
          gap: 8,
        },
        desktopSidebarAddText: {
          color: '#FFFFFF',
          fontSize: 13,
          fontWeight: '700',
        },
        desktopMainContent: {
          flex: 1,
          height: '100%',
          minWidth: 0,
          overflow: Platform.OS === 'web' ? 'hidden' : 'visible',
        },
        desktopSummary: {
          width: 320,
          flexShrink: 0,
          gap: 20,
          paddingRight: 12,
          marginTop: -8,
        },
        verticalTabBtn: {
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
        },
        verticalTabText: { fontSize: 15, fontWeight: '700' },
        verticalTabTextActive: { fontWeight: '900' },
        verticalTabActiveBg: { backgroundColor: 'transparent' },
        verticalTabIndicator: {
          position: 'absolute',
          left: 0,
          top: 12,
          bottom: 12,
          width: 3,
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
        },
        headerWrapper: { paddingHorizontal: 20 },
        headerTopRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        iconBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerRight: { flexDirection: 'row', alignItems: 'center' },
        cinematicHeaderText: { marginTop: 24, marginBottom: 16 },
        tripTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
        tripSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 4 },
        tabsContainer: { borderBottomWidth: 0, paddingVertical: 8 },
        tabsScroll: { paddingHorizontal: 20, gap: 8 },
        tabBtn: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'transparent',
        },
        tabBtnActive: { borderColor: 'transparent' },
        tabBtnHovered: { opacity: 0.8 },
        tabText: { fontSize: 13, fontWeight: '700' },
        tabTextActive: { fontWeight: '800' },
        tabContent: { paddingHorizontal: 20, paddingTop: 20 },
        sectionHeader: {
          fontSize: 15,
          fontWeight: '800',
          marginBottom: 12,
          letterSpacing: -0.2,
          textShadowColor: theme.isDark
            ? 'rgba(0, 0, 0, 0.65)'
            : 'rgba(255, 255, 255, 0.8)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
        actionsRow: { gap: 12, marginBottom: 24, paddingHorizontal: 4 },
        actionBtn: { alignItems: 'center', gap: 6 },
        actionIconWrap: {
          width: 56,
          height: 56,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.14)'
            : 'rgba(0,0,0,0.08)',
          backgroundColor: theme.isDark
            ? 'rgba(15,23,42,0.65)'
            : 'rgba(255,255,255,0.75)',
          ...theme.shadows.sm,
        },
        actionText: {
          fontSize: 11,
          fontWeight: '700',
          textAlign: 'center',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
          backgroundColor: theme.isDark
            ? 'rgba(0,0,0,0.40)'
            : 'rgba(255,255,255,0.65)',
          overflow: 'hidden',
        },
        progressCard: {
          padding: 20,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        },
        progressRow: { flexDirection: 'row', alignItems: 'center' },
        progressCircle: {
          width: 72,
          height: 72,
          borderRadius: 36,
          borderWidth: 6,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        },
        progressCircleText: { fontSize: 16, fontWeight: '800' },
        progressDetails: { flex: 1 },
        progressAmount: { fontSize: 22, fontWeight: '900' },
        progressSubtext: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
        progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
        progressBarFill: { height: '100%', borderRadius: 3 },

        // Overview Tab: Quick Grid
        // Rectangular KPI Cards (Matching Finance Center)
        kpiCardsRow: {
          flexDirection: 'row',
          gap: 10,
        },
        rectangularKpiCard: {
          width: 175,
          minWidth: 175,
          minHeight: 78,
          borderRadius: 18,
          paddingVertical: 10,
          paddingHorizontal: 13,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.05)',
          justifyContent: 'space-between',
        },
        rightKpiGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'space-between',
        },
        rightKpiCard: {
          flexBasis: '48%',
          minHeight: 78,
          borderRadius: 16,
          paddingVertical: 9,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.05)',
          justifyContent: 'space-between',
        },
        kpiHeaderRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 4,
        },
        kpiIconWrap: {
          width: 22,
          height: 22,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
        kpiBadgePill: {
          paddingHorizontal: 5,
          paddingVertical: 1.5,
          borderRadius: 6,
          borderWidth: 1,
        },
        kpiBadgeText: {
          fontSize: 8.5,
          fontWeight: '800',
          letterSpacing: 0.5,
        },
        kpiValue: {
          fontSize: 18,
          fontWeight: '900',
          letterSpacing: -0.4,
        },
        kpiSub: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 1,
        },
        quickGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
          justifyContent: 'space-between',
        },
        quickStatBox: {
          width: 105,
          minWidth: 105,
          padding: 12,
          borderRadius: 16,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        quickStatIcon: { fontSize: 18, marginBottom: 6 },
        quickStatValue: { fontSize: 14, fontWeight: '800' },
        quickStatLabel: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          textAlign: 'center',
        },
        overviewStopsCard: {
          padding: 16,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        stopSummaryRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
        },
        stopSummaryLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          flex: 1,
        },
        stopSummaryIconBox: {
          width: 36,
          height: 36,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        stopSummaryEmoji: { fontSize: 16 },
        stopSummaryName: { fontSize: 14, fontWeight: '800' },
        stopSummaryCount: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        stopSummaryRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        stopSummaryAmount: { fontSize: 13, fontWeight: '800' },
        healthDot: { width: 8, height: 8, borderRadius: 4 },
        addStopBtnOutline: {
          marginTop: 8,
          paddingVertical: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          alignItems: 'center',
        },
        addStopBtnText: { fontSize: 12, fontWeight: '700' },
        stopsList: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 20,
          justifyContent: 'flex-start',
        },
        stopCard: { borderRadius: 16, overflow: 'hidden' },
        stopCardBg: { flex: 1 },
        stopCardGradient: { ...StyleSheet.absoluteFill },
        stopCardContent: {
          padding: 16,
          justifyContent: 'space-between',
          flex: 1,
        },
        stopCardTopRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 'auto',
        },
        stopCardNumberBadge: {
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: 'rgba(255,255,255,0.9)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        stopCardNumberText: {
          color: '#020617',
          fontWeight: '900',
          fontSize: 11,
        },
        stopCardTitle: {
          fontSize: 17,
          fontWeight: '900',
          color: '#FFF',
          ...Platform.select({
            web: {
              textShadow: '1px 1px 3px rgba(0,0,0,0.7)',
            } as any,
            default: {
              textShadowColor: 'rgba(0,0,0,0.7)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            },
          }),
        },
        stopCardDates: {
          fontSize: 11,
          fontWeight: '700',
          color: 'rgba(255,255,255,0.75)',
          marginTop: 2,
        },
        stopCardBottomRow: { gap: 8 },
        stopStatsRow: { flexDirection: 'row', gap: 12 },
        stopStatLabel: {
          fontSize: 9,
          fontWeight: '700',
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        stopStatValue: {
          fontSize: 15,
          fontWeight: '800',
          color: '#FFF',
          marginTop: 2,
        },
        stopProgressRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 4,
        },
        stopProgressBarBg: {
          flex: 1,
          height: 4,
          borderRadius: 2,
          overflow: 'hidden',
        },
        stopProgressBarFill: { height: '100%', borderRadius: 2 },
        stopProgressText: {
          fontSize: 10,
          fontWeight: '800',
          minWidth: 28,
          textAlign: 'right',
        },
        stopsHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        },
        stopsHeaderLeft: { fontSize: 15, fontWeight: '800' },
        stopsHeaderRight: { fontSize: 15, fontWeight: '800' },
        addStopDashedBtn: {
          paddingVertical: 16,
          borderRadius: 16,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          alignItems: 'center',
          marginTop: 8,
        },
        addStopDashedBtnText: { fontSize: 13, fontWeight: '700' },
        addStopBtn: {
          paddingVertical: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderStyle: 'dashed',
          alignItems: 'center',
          marginTop: 8,
        },
        addStopText: { fontSize: 13, fontWeight: '700' },
        emptyState: { alignItems: 'center', padding: 40, borderRadius: 24 },
        emptyEmoji: { fontSize: 48, marginBottom: 16 },
        emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
        emptyText: { fontSize: 13, textAlign: 'center', marginBottom: 24 },
        primaryButton: {
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 16,
        },
        primaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
        membersCard: {
          padding: 16,
          borderRadius: 24,
          borderWidth: 1,
          marginBottom: 24,
        },
        divider: { height: 1, marginVertical: 8 },
        memberCard: {
          padding: 16,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        memberCardTop: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
        },
        memberCardAvatarWrap: {
          width: 44,
          height: 44,
          borderRadius: 22,
          marginRight: 12,
          overflow: 'hidden',
        },
        memberAvatarImg: { width: '100%', height: '100%' },
        memberAvatar: {
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        },
        memberInitial: { fontSize: 16, fontWeight: '800' },
        memberCardInfo: { flex: 1 },
        memberName: { fontSize: 16, fontWeight: '800' },
        memberRole: {
          fontSize: 12,
          textTransform: 'capitalize',
          fontWeight: '600',
        },
        memberBalanceText: { fontSize: 15, fontWeight: '900' },
        memberBalanceLabel: {
          fontSize: 11,
          fontWeight: '600',
          textAlign: 'right',
        },
        memberCardBottom: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        memberStatLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
        memberStatValue: { fontSize: 16, fontWeight: '800' },
        requestRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
        },
        requestAvatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        requestAvatarText: { fontSize: 14, fontWeight: '800' },
        requestName: { fontSize: 13, fontWeight: '700' },
        requestSub: { fontSize: 11 },
        reqBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
        reqBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

        inviteLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        inviteCode: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
        inviteShareBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
        },

        searchWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        searchInput: {
          flex: 1,
          height: 50,
          fontSize: 14,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
        } as any,
        searchResultCard: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },

        // FAB
        fab: {
          position: 'absolute',
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
            },
            android: { elevation: 8 },
          }),
        },

        // Cinematic Mobile Hero Banner
        cinematicHeroWrapper: {
          width: '100%',
          minHeight: 230,
          backgroundColor: '#0F172A',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          overflow: 'hidden',
        },
        cinematicHeroBg: {
          width: '100%',
          minHeight: 230,
          justifyContent: 'space-between',
        },
        heroTopBar: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          zIndex: 10,
        },
        heroGlassIconBtn: {
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: 'rgba(15,23,42,0.65)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroTopCenter: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        heroStatusBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.15)',
        },
        heroStatusDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        heroStatusText: {
          fontSize: 11,
          fontWeight: '800',
        },
        heroBottomContent: {
          paddingHorizontal: 20,
          paddingBottom: 18,
        },
        heroTripTitle: {
          fontSize: 26,
          fontWeight: '900',
          color: '#FFFFFF',
          letterSpacing: -0.5,
          marginBottom: 4,
        },
        heroSubtitleRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        },
        heroTripDates: {
          fontSize: 12,
          fontWeight: '600',
          color: 'rgba(255,255,255,0.85)',
        },

        // 5 Quick Action Floating Buttons
        quickActionsBar: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          marginBottom: 20,
          paddingHorizontal: 8,
        },
        quickActionCircleBtn: {
          alignItems: 'center',
          gap: 6,
        },
        quickActionCircleIcon: {
          width: 52,
          height: 52,
          borderRadius: 26,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            android: { elevation: 3 },
          }),
        },
        quickActionCircleLabel: {
          fontSize: 11,
          fontWeight: '700',
        },

        // Clean Trip Summary Card
        cleanSummaryCard: {
          borderRadius: 24,
          padding: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          marginBottom: 20,
        },
        cleanSummaryHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        },
        cleanSummaryTitle: {
          fontSize: 16,
          fontWeight: '900',
        },
        cleanSummaryBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
        },
        cleanSummaryBadgeText: {
          fontSize: 11,
          fontWeight: '800',
        },
        cleanSummaryAmountsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 12,
        },
        cleanSummaryAmountLabel: {
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 3,
        },
        cleanSummaryAmountValue: {
          fontSize: 24,
          fontWeight: '900',
          letterSpacing: -0.5,
        },
        cleanSummaryBudgetVal: {
          fontSize: 18,
          fontWeight: '800',
        },
        cleanProgressBarBg: {
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
          marginBottom: 8,
        },
        cleanProgressBarFill: {
          height: '100%',
          borderRadius: 3,
        },
        cleanProgressFooter: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        cleanProgressSubtext: {
          fontSize: 11,
          fontWeight: '600',
        },
        cleanProgressRemaining: {
          fontSize: 11,
          fontWeight: '800',
        },

        // Recent Expenses Section
        sectionHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          paddingHorizontal: 4,
        },
        sectionHeaderTitle: {
          fontSize: 16,
          fontWeight: '900',
          letterSpacing: -0.3,
        },
        sectionHeaderAction: {
          fontSize: 13,
          fontWeight: '700',
        },
        recentExpensesList: {
          gap: 8,
        },
        recentExpenseRow: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderRadius: 18,
          borderWidth: 1,
          gap: 12,
        },
        recentExpenseIconBox: {
          width: 42,
          height: 42,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        recentExpenseInfo: {
          flex: 1,
        },
        recentExpenseTitle: {
          fontSize: 14,
          fontWeight: '800',
        },
        recentExpenseSub: {
          fontSize: 11,
          marginTop: 2,
        },
        recentExpenseAmount: {
          fontSize: 14,
          fontWeight: '900',
        },
        emptyExpenseMiniCard: {
          padding: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          alignItems: 'center',
          gap: 10,
        },
        emptyExpenseMiniText: {
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 18,
        },
        miniAddExpenseBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 9,
          borderRadius: 12,
        },
        miniAddExpenseBtnText: {
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: '800',
        },

        // Destinations Highlight
        stopsHighlightCard: {
          padding: 14,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          marginBottom: 24,
        },
        stopsHighlightContent: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        stopsHighlightThumb: {
          width: 48,
          height: 48,
          borderRadius: 14,
        },
        stopsHighlightName: {
          fontSize: 15,
          fontWeight: '800',
        },
        stopsHighlightSub: {
          fontSize: 11,
          marginTop: 2,
        },
        stopsHighlightBadge: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
        },
        stopsHighlightBadgeText: {
          fontSize: 11,
          fontWeight: '800',
        },
        stopsHighlightEmpty: {
          alignItems: 'center',
          paddingVertical: 8,
        },

        // More Actions Modal Sheet
        moreModalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          justifyContent: 'flex-end',
        },
        moreModalSheet: {
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderWidth: 1,
          padding: 22,
          paddingBottom: 40,
        },
        moreModalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        },
        moreModalTitle: {
          fontSize: 17,
          fontWeight: '900',
        },
        moreModalCloseBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        },
        moreModalGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
        },
        moreModalItem: {
          width: '22%',
          minWidth: 70,
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        },
        moreModalIconWrap: {
          width: 50,
          height: 50,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
        },
        moreModalLabel: {
          fontSize: 11,
          fontWeight: '700',
          textAlign: 'center',
        },
      }),
    [theme],
  );
};
