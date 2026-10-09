// app/(app)/requests.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Platform,
  Pressable,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import {
  usePendingInvitations,
  useSentInvitations,
  useCancelInvitation,
  useAcceptInvitation,
  useDeclineInvitation,
} from '../../hooks/useInvitations';
import {
  useAdminJoinRequests,
  useApproveJoinRequest,
  useRejectJoinRequest,
} from '../../hooks/useJoinRequests';
import { haptics } from '../../utils/haptics';

import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { GlassCard } from '../../components/ui/GlassCard';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import AppIcon from '../../components/common/AppIcon';
import GlobalLoader from '../../components/common/GlobalLoader';
import type { Theme } from '../../theme';

// ─── Types ───────────────────────────────────────────────────
interface Invitation {
  _id: string;
  tripTitle?: string;
  fromName?: string;
  message?: string;
  tripId?: { _id: string; title: string };
  fromUser?: { displayName: string; photoURL?: string };
}

interface JoinRequest {
  _id: string;
  tripId: string | { _id: string; title?: string };
  tripTitle?: string;
  userName?: string;
  fromName?: string;
  message?: string;
  user?: { displayName: string; photoURL?: string };
}

const WEB = Platform.OS === 'web' && typeof window !== 'undefined';

// ─── Sub-Components ──────────────────────────────────────────

function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: {
  invitation: Invitation;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isAccepting: boolean;
  isDeclining: boolean;
}) {
  const theme = useTheme();
  const inviterName =
    invitation.fromUser?.displayName || invitation.fromName || 'Trip Organizer';
  const tripName =
    invitation.tripTitle || invitation.tripId?.title || 'Untitled Trip';

  return (
    <GlassCard style={styles.card} intensity={theme.isDark ? 16 : 10}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconAura, { backgroundColor: '#EFF6FF' }]}>
          <AppIcon name="mail" size={18} color="#2563EB" />
        </View>

        <View style={styles.cardHeaderInfo}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: 'rgba(37,99,235,0.1)' },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: '#2563EB' }]}>
                INVITATION
              </Text>
            </View>
          </View>
          <Text
            style={[styles.tripTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {tripName}
          </Text>
        </View>
      </View>

      <View style={styles.senderRow}>
        <Avatar
          url={invitation.fromUser?.photoURL}
          fallback={inviterName.charAt(0)}
          size="sm"
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.senderLabel, { color: theme.colors.textTertiary }]}
          >
            Invited by
          </Text>
          <Text
            style={[styles.senderName, { color: theme.colors.textPrimary }]}
          >
            {inviterName}
          </Text>
        </View>
      </View>

      {invitation.message ? (
        <View
          style={[
            styles.messageBox,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[styles.messageText, { color: theme.colors.textSecondary }]}
          >
            "{invitation.message}"
          </Text>
        </View>
      ) : null}

      {/* Action Cluster */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => onAccept(invitation._id)}
          disabled={isAccepting || isDeclining}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.acceptBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          {isAccepting ? (
            <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
          ) : (
            <>
              <AppIcon name="check" size={14} color="#FFFFFF" />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => onDecline(invitation._id)}
          disabled={isAccepting || isDeclining}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.declineBtn,
            {
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.1)',
            },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          {isDeclining ? (
            <GlobalLoader variant="inline" size="small" color="#EF4444" />
          ) : (
            <>
              <AppIcon name="x" size={14} color="#EF4444" />
              <Text style={styles.declineBtnText}>Decline</Text>
            </>
          )}
        </Pressable>
      </View>
    </GlassCard>
  );
}

function JoinRequestCard({
  request,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  request: JoinRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const theme = useTheme();
  const requesterName =
    request.user?.displayName ||
    request.userName ||
    request.fromName ||
    'Traveler';
  const tripName =
    request.tripTitle ||
    (typeof request.tripId === 'object' ? request.tripId.title : 'Trip');

  return (
    <GlassCard style={styles.card} intensity={theme.isDark ? 16 : 10}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconAura, { backgroundColor: '#ECFDF5' }]}>
          <AppIcon name="user-plus" size={18} color="#10B981" />
        </View>

        <View style={styles.cardHeaderInfo}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: 'rgba(16,185,129,0.12)' },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: '#059669' }]}>
                JOIN REQUEST
              </Text>
            </View>
          </View>
          <Text
            style={[styles.tripTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {tripName}
          </Text>
        </View>
      </View>

      <View style={styles.senderRow}>
        <Avatar
          url={request.user?.photoURL}
          fallback={requesterName.charAt(0)}
          size="sm"
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.senderLabel, { color: theme.colors.textTertiary }]}
          >
            Requested by
          </Text>
          <Text
            style={[styles.senderName, { color: theme.colors.textPrimary }]}
          >
            {requesterName}
          </Text>
        </View>
      </View>

      {request.message ? (
        <View
          style={[
            styles.messageBox,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[styles.messageText, { color: theme.colors.textSecondary }]}
          >
            "{request.message}"
          </Text>
        </View>
      ) : null}

      {/* Action Cluster */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => onApprove(request._id)}
          disabled={isApproving || isRejecting}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.approveBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          {isApproving ? (
            <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
          ) : (
            <>
              <AppIcon name="check" size={14} color="#FFFFFF" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => onReject(request._id)}
          disabled={isApproving || isRejecting}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.declineBtn,
            {
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.1)',
            },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          {isRejecting ? (
            <GlobalLoader variant="inline" size="small" color="#EF4444" />
          ) : (
            <>
              <AppIcon name="x" size={14} color="#EF4444" />
              <Text style={styles.declineBtnText}>Reject</Text>
            </>
          )}
        </Pressable>
      </View>
    </GlassCard>
  );
}

function SentInvitationCard({
  invitation,
  onRevoke,
  isRevoking,
}: {
  invitation: any;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) {
  const theme = useTheme();
  const recipientName = invitation.toName || 'Invited Traveler';
  const tripName =
    invitation.tripTitle || invitation.tripId?.title || 'Expedition';

  return (
    <GlassCard style={styles.card} intensity={theme.isDark ? 16 : 10}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconAura, { backgroundColor: '#EDE9FE' }]}>
          <AppIcon name="send" size={18} color="#8B5CF6" />
        </View>

        <View style={styles.cardHeaderInfo}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: 'rgba(139,92,246,0.12)' },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: '#8B5CF6' }]}>
                OUTGOING INVITE
              </Text>
            </View>
          </View>
          <Text
            style={[styles.tripTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {tripName}
          </Text>
        </View>
      </View>

      <View style={styles.senderRow}>
        <Avatar fallback={recipientName.charAt(0).toUpperCase()} size="sm" />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.senderLabel, { color: theme.colors.textTertiary }]}
          >
            Invited
          </Text>
          <Text
            style={[styles.senderName, { color: theme.colors.textPrimary }]}
          >
            {recipientName}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: 'rgba(245,158,11,0.12)',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
            Pending
          </Text>
        </View>
      </View>

      {invitation.message ? (
        <View
          style={[
            styles.messageBox,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[styles.messageText, { color: theme.colors.textSecondary }]}
          >
            "{invitation.message}"
          </Text>
        </View>
      ) : null}

      <View style={[styles.actionRow, { justifyContent: 'flex-end' }]}>
        <Pressable
          onPress={() => onRevoke(invitation._id)}
          disabled={isRevoking}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.declineBtn,
            { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.06)' },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          {isRevoking ? (
            <GlobalLoader variant="inline" size="small" color="#EF4444" />
          ) : (
            <>
              <AppIcon name="trash-2" size={14} color="#EF4444" />
              <Text style={[styles.declineBtnText, { color: '#EF4444' }]}>
                Revoke Invite
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </GlassCard>
  );
}

// ─── Main Screen ─────────────────────────────────────────────

export default function RequestsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Incoming Invitations
  const {
    data: invitationsData,
    isLoading: loadingInv,
    isRefetching: refetchingInv,
    refetch: refetchInv,
  } = usePendingInvitations();
  const { mutate: acceptInv, isPending: isAcceptingInv } =
    useAcceptInvitation();
  const { mutate: declineInv, isPending: isDecliningInv } =
    useDeclineInvitation();

  // Admin Join Requests
  const {
    data: requestsData,
    isLoading: loadingReq,
    isRefetching: refetchingReq,
    refetch: refetchReq,
  } = useAdminJoinRequests();

  // Outgoing / Sent Invitations (only fetched when viewing sent tab)
  const {
    data: sentData,
    isLoading: loadingSent,
    isRefetching: refetchingSent,
    refetch: refetchSent,
  } = useSentInvitations({
    enabled: activeTab === 'sent',
  });
  const { mutate: cancelInv } = useCancelInvitation();

  const invitations: Invitation[] = useMemo(() => {
    if (!invitationsData) return [];
    return Array.isArray(invitationsData)
      ? invitationsData
      : (invitationsData as any)?.invitations || [];
  }, [invitationsData]);

  const requests: JoinRequest[] = useMemo(() => {
    if (!requestsData) return [];
    return Array.isArray(requestsData)
      ? requestsData
      : (requestsData as any)?.requests || [];
  }, [requestsData]);

  const sentInvitations: any[] = useMemo(() => {
    if (!sentData) return [];
    return Array.isArray(sentData)
      ? sentData
      : (sentData as any)?.invitations || [];
  }, [sentData]);

  const isLoading =
    activeTab === 'sent' ? loadingSent : loadingInv || loadingReq;
  const isRefreshing =
    activeTab === 'sent' ? refetchingSent : refetchingInv || refetchingReq;
  const totalCount = invitations.length + requests.length;

  const handleRefresh = useCallback(() => {
    haptics.light();
    if (activeTab === 'sent') {
      refetchSent();
    } else {
      refetchInv();
      refetchReq();
    }
  }, [activeTab, refetchInv, refetchReq, refetchSent]);

  // Actions
  const handleAcceptInvite = useCallback(
    (id: string) => {
      haptics.medium();
      acceptInv(id);
    },
    [acceptInv],
  );

  const handleDeclineInvite = useCallback(
    (id: string) => {
      haptics.light();
      if (WEB) {
        if (window.confirm('Decline this invitation?')) declineInv(id);
      } else {
        Alert.alert('Decline Invitation', 'Are you sure you want to decline?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: () => declineInv(id),
          },
        ]);
      }
    },
    [declineInv],
  );

  const handleRevokeInvite = useCallback(
    (id: string) => {
      haptics.warning();
      const execute = () => {
        setRevokingId(id);
        cancelInv(id, {
          onSettled: () => setRevokingId(null),
        });
      };
      if (WEB) {
        if (window.confirm('Revoke and cancel this sent invitation?'))
          execute();
      } else {
        Alert.alert(
          'Revoke Invitation',
          'Are you sure you want to cancel this pending invitation?',
          [
            { text: 'Keep', style: 'cancel' },
            { text: 'Revoke', style: 'destructive', onPress: execute },
          ],
        );
      }
    },
    [cancelInv],
  );

  if (isLoading && !isRefreshing) {
    return (
      <GlobalBackground>
        <View style={styles.loadingContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading requests & invitations…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
        <GlobalBackground />
      </View>

      {/* Sticky Header */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop:
              Platform.OS === 'web' ? 20 : Math.max(insets.top, 24) + 10,
          },
        ]}
      >
        <View
          style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}
        >
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                haptics.light();
                router.back();
              }}
              style={({ pressed }) => [
                styles.headerIconBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="arrow-left"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>

            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Trip Requests & Invites
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                {totalCount} total pending item{totalCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={handleRefresh}
              disabled={isRefreshing}
              style={({ pressed }) => [
                styles.headerIconBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="refresh-cw"
                size={15}
                color={
                  isRefreshing
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.mainWrapper}>
          {/* ── BENTO METRICS HEADER ── */}
          <View style={styles.bentoMetricsRow}>
            <GlassCard
              style={[
                styles.bentoTile,
                { borderColor: theme.colors.borderLight },
              ]}
              intensity={theme.isDark ? 16 : 10}
            >
              <View style={styles.bentoTileTop}>
                <View
                  style={[
                    styles.tileIconWrap,
                    { backgroundColor: `${theme.colors.info}18` },
                  ]}
                >
                  <AppIcon name="inbox" size={13} color={theme.colors.info} />
                </View>
                <Text
                  style={[styles.tileLabel, { color: theme.colors.info }]}
                  numberOfLines={1}
                >
                  INCOMING
                </Text>
              </View>
              <Text
                style={[styles.tileValue, { color: theme.colors.textPrimary }]}
              >
                {totalCount}
              </Text>
              <Text
                style={[styles.tileSub, { color: theme.colors.textTertiary }]}
                numberOfLines={1}
              >
                Invites & joins
              </Text>
            </GlassCard>

            <GlassCard
              style={[
                styles.bentoTile,
                { borderColor: theme.colors.borderLight },
              ]}
              intensity={theme.isDark ? 16 : 10}
            >
              <View style={styles.bentoTileTop}>
                <View
                  style={[
                    styles.tileIconWrap,
                    { backgroundColor: `${theme.colors.success}18` },
                  ]}
                >
                  <AppIcon
                    name="user-check"
                    size={13}
                    color={theme.colors.success}
                  />
                </View>
                <Text
                  style={[styles.tileLabel, { color: theme.colors.success }]}
                  numberOfLines={1}
                >
                  APPROVALS
                </Text>
              </View>
              <Text style={[styles.tileValue, { color: theme.colors.success }]}>
                {requests.length}
              </Text>
              <Text
                style={[styles.tileSub, { color: theme.colors.textTertiary }]}
                numberOfLines={1}
              >
                Admin requests
              </Text>
            </GlassCard>

            <GlassCard
              style={[
                styles.bentoTile,
                { borderColor: theme.colors.borderLight },
              ]}
              intensity={theme.isDark ? 16 : 10}
            >
              <View style={styles.bentoTileTop}>
                <View
                  style={[
                    styles.tileIconWrap,
                    {
                      backgroundColor: `${theme.colors.purple || theme.colors.accent}18`,
                    },
                  ]}
                >
                  <AppIcon
                    name="send"
                    size={13}
                    color={theme.colors.purple || theme.colors.accent}
                  />
                </View>
                <Text
                  style={[
                    styles.tileLabel,
                    { color: theme.colors.purple || theme.colors.accent },
                  ]}
                  numberOfLines={1}
                >
                  SENT
                </Text>
              </View>
              <Text
                style={[
                  styles.tileValue,
                  { color: theme.colors.purple || theme.colors.accent },
                ]}
              >
                {sentInvitations.length}
              </Text>
              <Text
                style={[styles.tileSub, { color: theme.colors.textTertiary }]}
                numberOfLines={1}
              >
                Pending invites
              </Text>
            </GlassCard>
          </View>

          {/* ── SEGMENTED TAB SELECTOR ── */}
          <View
            style={[
              styles.segmentedContainer,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.04)',
                borderColor: theme.colors.borderLight,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                haptics.selection();
                setActiveTab('incoming');
              }}
              style={[
                styles.segmentedTab,
                activeTab === 'incoming' && [
                  styles.segmentedTabActive,
                  { backgroundColor: theme.colors.surface },
                ],
              ]}
            >
              <AppIcon
                name="inbox"
                size={14}
                color={
                  activeTab === 'incoming'
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.segmentedTabText,
                  {
                    color:
                      activeTab === 'incoming'
                        ? theme.colors.textPrimary
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                Incoming ({totalCount})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.selection();
                setActiveTab('sent');
              }}
              style={[
                styles.segmentedTab,
                activeTab === 'sent' && [
                  styles.segmentedTabActive,
                  { backgroundColor: theme.colors.surface },
                ],
              ]}
            >
              <AppIcon
                name="send"
                size={14}
                color={
                  activeTab === 'sent'
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.segmentedTabText,
                  {
                    color:
                      activeTab === 'sent'
                        ? theme.colors.textPrimary
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                Sent by You ({sentInvitations.length})
              </Text>
            </Pressable>
          </View>

          {/* ── TAB CONTENT ── */}
          {activeTab === 'incoming' ? (
            totalCount === 0 ? (
              <Animated.View
                entering={FadeInUp.delay(100).springify().damping(18)}
              >
                <EmptyState
                  icon="inbox"
                  title="All Caught Up"
                  description="You don't have any pending trip invitations or member join requests right now."
                  actionLabel="Explore Dashboard"
                  onAction={() => router.replace('/(app)/(tabs)/home')}
                />
              </Animated.View>
            ) : (
              <View style={styles.sectionsContainer}>
                {/* INVITATIONS SECTION */}
                {invitations.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={styles.sectionTitleGroup}>
                        <View
                          style={[
                            styles.sectionIndicatorDot,
                            { backgroundColor: '#2563EB' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.sectionHeading,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Trip Invitations
                        </Text>
                      </View>
                      <View style={styles.countBadge}>
                        <Text
                          style={[
                            styles.countBadgeText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {invitations.length}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardsGrid}>
                      {invitations.map((inv, idx) => (
                        <Animated.View
                          key={inv._id}
                          entering={FadeInDown.delay(idx * 40)
                            .springify()
                            .damping(18)}
                          layout={Layout.springify()}
                          style={styles.cardCol}
                        >
                          <InvitationCard
                            invitation={inv}
                            onAccept={handleAcceptInvite}
                            onDecline={handleDeclineInvite}
                            isAccepting={isAcceptingInv}
                            isDeclining={isDecliningInv}
                          />
                        </Animated.View>
                      ))}
                    </View>
                  </View>
                )}

                {/* JOIN REQUESTS SECTION */}
                {requests.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={styles.sectionTitleGroup}>
                        <View
                          style={[
                            styles.sectionIndicatorDot,
                            { backgroundColor: '#10B981' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.sectionHeading,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Member Join Requests
                        </Text>
                      </View>
                      <View style={styles.countBadge}>
                        <Text
                          style={[
                            styles.countBadgeText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {requests.length}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardsGrid}>
                      {requests.map((req, idx) => {
                        const tripIdStr =
                          typeof req.tripId === 'string'
                            ? req.tripId
                            : req.tripId?._id || '';
                        return (
                          <JoinRequestItemContainer
                            key={req._id}
                            request={req}
                            tripId={tripIdStr}
                            index={idx}
                          />
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )
          ) : /* OUTGOING / SENT INVITATIONS TAB */
          sentInvitations.length === 0 ? (
            <Animated.View
              entering={FadeInUp.delay(100).springify().damping(18)}
            >
              <EmptyState
                icon="send"
                title="No Outgoing Invitations"
                description="You have not sent any pending invitations to co-travelers yet."
                actionLabel="Plan a Trip"
                onAction={() => router.push('/(app)/create-trip')}
              />
            </Animated.View>
          ) : (
            <View style={styles.sectionsContainer}>
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleGroup}>
                    <View
                      style={[
                        styles.sectionIndicatorDot,
                        { backgroundColor: '#8B5CF6' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.sectionHeading,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Pending Sent Invitations
                    </Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Text
                      style={[
                        styles.countBadgeText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {sentInvitations.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardsGrid}>
                  {sentInvitations.map((inv, idx) => (
                    <Animated.View
                      key={inv._id}
                      entering={FadeInDown.delay(idx * 40)
                        .springify()
                        .damping(18)}
                      layout={Layout.springify()}
                      style={styles.cardCol}
                    >
                      <SentInvitationCard
                        invitation={inv}
                        onRevoke={handleRevokeInvite}
                        isRevoking={revokingId === inv._id}
                      />
                    </Animated.View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Wrapper to isolate mutation hooks per trip request
function JoinRequestItemContainer({
  request,
  tripId,
  index,
}: {
  request: JoinRequest;
  tripId: string;
  index: number;
}) {
  const { mutate: approveReq, isPending: isApproving } =
    useApproveJoinRequest(tripId);
  const { mutate: rejectReq, isPending: isRejecting } =
    useRejectJoinRequest(tripId);

  const handleApprove = useCallback(
    (id: string) => {
      haptics.medium();
      approveReq(id);
    },
    [approveReq],
  );

  const handleReject = useCallback(
    (id: string) => {
      haptics.light();
      if (WEB) {
        if (
          window.confirm(
            `Reject ${request.userName || request.fromName || 'traveler'}?`,
          )
        )
          rejectReq(id);
      } else {
        Alert.alert(
          'Reject Request',
          `Reject ${request.userName || request.fromName || 'traveler'}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reject',
              style: 'destructive',
              onPress: () => rejectReq(id),
            },
          ],
        );
      }
    },
    [rejectReq, request],
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40)
        .springify()
        .damping(18)}
      layout={Layout.springify()}
      style={styles.cardCol}
    >
      <JoinRequestCard
        request={request}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={isApproving}
        isRejecting={isRejecting}
      />
    </Animated.View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 13, fontWeight: '600' },

  // Header Bar
  headerBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,42,0.06)',
    zIndex: 10,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  desktopHeaderInner: {
    maxWidth: 1300,
    alignSelf: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
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
  tabSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Main Scroll Body
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  desktopScrollContent: {
    maxWidth: 1300,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  mainWrapper: {
    gap: 16,
  },

  // Bento Metrics Row
  bentoMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bentoTile: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.02)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  bentoTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tileIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  tileSub: {
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 2,
  },

  // Segmented Tab Selector
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    marginVertical: 4,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 999,
  },
  segmentedTabActive: {
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  segmentedTabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Sections
  sectionsContainer: {
    gap: 20,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: 'rgba(15,23,42,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Cards Grid
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardCol: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 360 : '100%',
  },

  // Individual Request Card
  card: {
    borderRadius: 20,
    padding: 16,
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

    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconAura: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  tripTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // Sender details
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  senderName: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Message Block
  messageBox: {
    padding: 10,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  acceptBtn: {
    backgroundColor: '#2563EB',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  declineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  declineBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
});
