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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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

// UI Components
import { InviteFriendModal } from '../../../components/trips/InviteFriendModal';
import SettlementTab from '../../../components/trips/SettlementTab';
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

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

const TABS = ['Overview', 'Planner', 'Expenses', 'Stops', 'Members', 'Settle'];

const TRIP_NAV_TABS = [
    { key: 0, label: 'Overview', icon: 'layout-grid', desc: 'Summary & quick stats' },
    { key: 1, label: 'Planner', icon: 'calendar', desc: 'Schedule & itinerary' },
    { key: 2, label: 'Expenses', icon: 'receipt', desc: 'Split bills & records' },
    { key: 3, label: 'Stops', icon: 'map-pin', desc: 'Destinations & places' },
    { key: 4, label: 'Members', icon: 'users', desc: 'Travelers & permissions' },
    { key: 5, label: 'Settle Up', icon: 'circle-check', desc: 'Balances & settlements' },
];
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2';

// ============================================================
// Functional Components: Member Row & Stop Card
// ============================================================
function MemberRow({
  member,
  currencySymbol,
}: {
  member: any;
  currencySymbol: string;
}) {
  const styles = useStyles();
  const theme = useTheme();
  const netBalance = (member.totalPaidBase || 0) - (member.totalOwesBase || 0);
  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;

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
                color: isPositive
                  ? theme.colors.success
                  : isNegative
                    ? theme.colors.danger
                    : theme.colors.textSecondary,
              },
            ]}
          >
            {isPositive ? '+' : isNegative ? '-' : ''}
            {currencySymbol}
            {Math.abs(netBalance).toLocaleString()}
          </Text>
          <Text
            style={[
              styles.memberBalanceLabel,
              { color: theme.colors.textTertiary },
            ]}
          >
            {isPositive ? 'owes to them' : isNegative ? 'owes' : 'settled'}
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
            {isNegative ? 'To Pay' : 'Gets Back'}
          </Text>
          <Text
            style={[
              styles.memberStatValue,
              { color: theme.colors.textPrimary },
            ]}
          >
            {currencySymbol}
            {Math.abs(netBalance).toLocaleString()}
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
}: {
  stop: any;
  onPress: () => void;
  index: number;
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
        source={{ uri: stop.coverImage || DEFAULT_COVER }}
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
  const isWideDesktop = Platform.OS === 'web' && width >= 1200;

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
  const { mutate: archiveTrip } = useArchiveTrip();
  const { mutate: unarchiveTrip } = useUnarchiveTrip();
  const { mutate: generateInvite } = useGenerateInvite();
  const { mutate: addTripMember, isPending: isAddingMember } =
    useAddTripMember();
  const { data: pendingRequests } = usePendingJoinRequests(id as string);
  const { mutate: approveRequest, isPending: isApproving } =
    useApproveJoinRequest(id as string);
  const { mutate: rejectRequest, isPending: isRejecting } =
    useRejectJoinRequest(id as string);
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults = [], isFetching: isSearching } =
    useSearchUsers(searchQuery);

  const inviteCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showInviteFriendModal, setShowInviteFriendModal] = useState(false);
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);

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
    if (Platform.OS === 'web') {
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
    if (Platform.OS === 'web') {
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
    if (Platform.OS === 'web') {
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
        const message = `Join my trip "${trip.title}" on Wakeru!\nCode: ${trip.inviteCode}\nLink: wakeru://join/${trip.inviteCode}`;

        if (Platform.OS === 'web') {
          if (navigator.share)
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
        Alert.alert('Error', 'Failed to share invite card.');
      } finally {
        setIsSharing(false);
      }
    } else {
      handleInvite();
    }
  };

  const handleGenerateReport = async () => {
    if (!trip) {
      Alert.alert('Loading', 'Trip data is still loading...');
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

    if (Platform.OS === 'web') {
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
            window.alert(
              'Popup blocked! Please allow popups to view and print the report.',
            );
          }
        } catch (error) {
          window.alert('Could not generate PDF report');
        }
      } else {
        try {
          await Clipboard.setStringAsync(textReport);
          window.alert('Text report copied to clipboard!');
        } catch (error) {
          window.alert('Could not copy text report');
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
                Alert.alert('Error', 'Could not share text report');
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
                Alert.alert('Error', 'Could not generate PDF report');
              }
            },
          },
        ],
      );
    }
  };

  if (isLoading || !trip) {
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
      {/* Quick Actions Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
      >
        <Pressable
          style={styles.actionBtn}
          onPress={() => setActiveSubView('overview')}
        >
          <GlassCard
            style={[
              styles.actionIconWrap,
              activeSubView === 'overview' && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            intensity={theme.isDark ? 15 : 8}
          >
            <AppIcon
              name="home"
              size={18}
              color={
                activeSubView === 'overview' ? '#FFF' : theme.colors.primary
              }
            />
          </GlassCard>
          <Text
            style={[
              styles.actionText,
              {
                color:
                  activeSubView === 'overview'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                fontWeight: activeSubView === 'overview' ? '800' : '600',
              },
            ]}
          >
            Overview
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => setActiveTab(TABS.indexOf('Settle'))}
        >
          <GlassCard
            style={styles.actionIconWrap}
            intensity={theme.isDark ? 15 : 8}
          >
            <AppIcon
              name="credit-card"
              size={18}
              color={theme.colors.secondary}
            />
          </GlassCard>
          <Text
            style={[styles.actionText, { color: theme.colors.textSecondary }]}
          >
            Settle Up
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => setActiveSubView('summary')}
        >
          <GlassCard
            style={[
              styles.actionIconWrap,
              activeSubView === 'summary' && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            intensity={theme.isDark ? 15 : 8}
          >
            <AppIcon
              name="activity"
              size={18}
              color={
                activeSubView === 'summary' ? '#FFF' : theme.colors.success
              }
            />
          </GlassCard>
          <Text
            style={[
              styles.actionText,
              {
                color:
                  activeSubView === 'summary'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                fontWeight: activeSubView === 'summary' ? '800' : '600',
              },
            ]}
          >
            Summary
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => setActiveSubView('analytics')}
        >
          <GlassCard
            style={[
              styles.actionIconWrap,
              activeSubView === 'analytics' && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            intensity={theme.isDark ? 15 : 8}
          >
            <AppIcon
              name="bar-chart-2"
              size={18}
              color={activeSubView === 'analytics' ? '#FFF' : theme.colors.info}
            />
          </GlassCard>
          <Text
            style={[
              styles.actionText,
              {
                color:
                  activeSubView === 'analytics'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                fontWeight: activeSubView === 'analytics' ? '800' : '600',
              },
            ]}
          >
            Analytics
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => setActiveSubView('rankings')}
        >
          <GlassCard
            style={[
              styles.actionIconWrap,
              activeSubView === 'rankings' && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            intensity={theme.isDark ? 15 : 8}
          >
            <AppIcon
              name="award"
              size={18}
              color={
                activeSubView === 'rankings' ? '#FFF' : theme.colors.warning
              }
            />
          </GlassCard>
          <Text
            style={[
              styles.actionText,
              {
                color:
                  activeSubView === 'rankings'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                fontWeight: activeSubView === 'rankings' ? '800' : '600',
              },
            ]}
          >
            Rankings
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => setActiveSubView('story')}
        >
          <GlassCard
            style={[
              styles.actionIconWrap,
              activeSubView === 'story' && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            intensity={theme.isDark ? 15 : 8}
          >
            <AppIcon
              name="play-circle"
              size={18}
              color={activeSubView === 'story' ? '#FFF' : theme.colors.info}
            />
          </GlassCard>
          <Text
            style={[
              styles.actionText,
              {
                color:
                  activeSubView === 'story'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                fontWeight: activeSubView === 'story' ? '800' : '600',
              },
            ]}
          >
            Story
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleShareInvite}>
          <GlassCard
            style={styles.actionIconWrap}
            intensity={theme.isDark ? 15 : 8}
          >
            <AppIcon name="link" size={18} color={theme.colors.primary} />
          </GlassCard>
          <Text
            style={[styles.actionText, { color: theme.colors.textSecondary }]}
          >
            Invite
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => router.push(`/(app)/trips/${id}/map`)}
        >
          <GlassCard
            style={styles.actionIconWrap}
            intensity={theme.isDark ? 15 : 8}
          >
            <AppIcon name="map-pin" size={18} color={theme.colors.success} />
          </GlassCard>
          <Text
            style={[styles.actionText, { color: theme.colors.textSecondary }]}
          >
            Map
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleGenerateReport}>
          <GlassCard
            style={styles.actionIconWrap}
            intensity={theme.isDark ? 15 : 8}
          >
            <AppIcon name="file-text" size={18} color={theme.colors.info} />
          </GlassCard>
          <Text
            style={[styles.actionText, { color: theme.colors.textSecondary }]}
          >
            Report
          </Text>
        </Pressable>

        {trip.isArchived ? (
          <Pressable style={styles.actionBtn} onPress={handleUnarchive}>
            <GlassCard
              style={styles.actionIconWrap}
              intensity={theme.isDark ? 15 : 8}
            >
              <AppIcon
                name="refresh-cw"
                size={18}
                color={theme.colors.success}
              />
            </GlassCard>
            <Text
              style={[styles.actionText, { color: theme.colors.textSecondary }]}
            >
              Unarchive
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.actionBtn} onPress={handleArchive}>
            <GlassCard
              style={styles.actionIconWrap}
              intensity={theme.isDark ? 15 : 8}
            >
              <AppIcon name="archive" size={18} color={theme.colors.danger} />
            </GlassCard>
            <Text
              style={[styles.actionText, { color: theme.colors.textSecondary }]}
            >
              Archive
            </Text>
          </Pressable>
        )}
      </ScrollView>

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
                    {/* Rectangular Executive Overview KPI Strip */}
                    <Text style={[styles.sectionHeader, { marginTop: 12, paddingHorizontal: 4, color: theme.colors.textPrimary }]}>
                        Executive Overview
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={[styles.kpiCardsRow, { paddingHorizontal: 16 }]}>
                        {[
                            { icon: 'wallet', label: 'BUDGET', value: `${formatAmount(budget, trip.baseCurrency)}`, sub: dur > 0 ? `${dur} days allocated` : 'Trip limit', color: '#2563EB', bg: '#EFF6FF' },
                            { icon: 'credit-card', label: 'TOTAL SPENT', value: `${formatAmount(spent, trip.baseCurrency)}`, sub: budget > 0 ? `${progressPercent.toFixed(0)}% of budget` : 'Total expenses', color: '#EF4444', bg: '#FEF2F2' },
                            { icon: 'pie-chart', label: 'REMAINING', value: `${formatAmount(Math.max(budget - spent, 0), trip.baseCurrency)}`, sub: budget > 0 ? (isOverBudget ? 'Budget exceeded' : `${formatAmount(budget - spent, trip.baseCurrency)} left`) : 'Live tracking', color: '#10B981', bg: '#ECFDF5' },
                            { icon: 'calendar', label: 'DAILY AVG', value: `${formatAmount(dur > 0 ? spent / dur : spent, trip.baseCurrency)}`, sub: dur > 0 ? `Avg per day (${dur}d)` : 'Daily estimate', color: '#D97706', bg: '#FEF3C7' },
                        ].map((stat, i) => (
                            <GlassCard
                                key={i}
                                style={styles.rectangularKpiCard}
                                intensity={theme.isDark ? 15 : 10}
                            >
                                <View style={styles.kpiHeaderRow}>
                                    <View style={[styles.kpiIconWrap, { backgroundColor: theme.isDark ? `${stat.color}20` : stat.bg }]}>
                                        <AppIcon name={stat.icon as any} size={13} color={stat.color} />
                                    </View>
                                    <View style={[styles.kpiBadgePill, { backgroundColor: `${stat.color}15`, borderColor: `${stat.color}25` }]}>
                                        <Text style={[styles.kpiBadgeText, { color: stat.color }]}>
                                            {stat.label}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.kpiValue, { color: theme.colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
                                    {stat.value}
                                </Text>
                                <Text style={[styles.kpiSub, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                                    {stat.sub}
                                </Text>
                            </GlassCard>
                        ))}
                    </ScrollView>
          </View>

          {/* RIGHT SUMMARY COLUMN */}
          {renderRightSummaryColumn()}
        </View>
      ) : (
        <>
          {/* MOBILE/TABLET LAYOUT */}
          <View style={{ zIndex: 10 }}>
            <View
              style={[styles.headerWrapper, { paddingTop: insets.top + 16 }]}
            >
              {renderStickyHeaderContent()}
              {renderCinematicHeaderText()}
            </View>

            <View style={styles.tabsContainer}>
              <TabBar
                tabs={TABS.map((tab, index) => ({
                  key: String(index),
                  label: tab,
                }))}
                activeKey={String(activeTab)}
                onTabChange={key => setActiveTab(parseInt(key, 10))}
                scrollable={true}
                variant="pills"
                style={{ paddingLeft: 20 }}
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
              {activeTab === 1 && <PlannerTab tripId={id as string} />}
              {activeTab === 2 && <ExpensesTab tripId={id as string} />}
              {activeTab === 3 && renderStopsTab()}
              {activeTab === 4 && renderMembersTab()}
              {activeTab === 5 && <SettlementTab tripId={id as string} />}
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
        contentBody: { flex: 1 },
        webDesktopContent: { flex: 1, width: '100%' },
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
          gap: 32,
          paddingTop: 32,
        },
        desktopSidebar: { width: 280, flexShrink: 0, paddingLeft: 16 },
        // Desktop Left Navigation
        desktopNavCard: {
            borderRadius: 24,
            padding: 10,
            marginTop: 8,
            borderWidth: 1,
            borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
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
        desktopMainContent: { flex: 1, height: '100%' },
        desktopSummary: {
          width: 340,
          flexShrink: 0,
          gap: 24,
          paddingRight: 16,
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
        sectionHeader: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
        actionsRow: { gap: 12, marginBottom: 24, paddingHorizontal: 4 },
        actionBtn: { alignItems: 'center', gap: 6 },
        actionIconWrap: {
          width: 56,
          height: 56,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        },
        actionText: { fontSize: 11, fontWeight: '600' },
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
        quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
        quickStatBox: {
          flex: 1,
          flexBasis: '22%',
          minWidth: 75,
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
          textShadowColor: 'rgba(0,0,0,0.7)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 3,
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
      }),
    [theme],
  );
};
