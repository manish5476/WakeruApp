// app/(app)/requests.tsx
import React, { useMemo, useCallback } from 'react';
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

const WEB = Platform.OS === 'web';

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
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
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
    </View>
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
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
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
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────

export default function RequestsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Invitations
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

  const isLoading = loadingInv || loadingReq;
  const isRefreshing = refetchingInv || refetchingReq;
  const totalCount = invitations.length + requests.length;

  const handleRefresh = useCallback(() => {
    haptics.light();
    refetchInv();
    refetchReq();
  }, [refetchInv, refetchReq]);

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

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Sticky Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10 },
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
                styles.backBtn,
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
                styles.actionBtn,
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
            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.bentoTileTop}>
                <View
                  style={[styles.tileIconWrap, { backgroundColor: '#EFF6FF' }]}
                >
                  <AppIcon name="inbox" size={15} color="#2563EB" />
                </View>
                <Text style={[styles.tileLabel, { color: '#2563EB' }]}>
                  TOTAL PENDING
                </Text>
              </View>
              <Text
                style={[styles.tileValue, { color: theme.colors.textPrimary }]}
              >
                {totalCount}
              </Text>
              <Text
                style={[styles.tileSub, { color: theme.colors.textTertiary }]}
              >
                Actions required
              </Text>
            </View>

            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.bentoTileTop}>
                <View
                  style={[styles.tileIconWrap, { backgroundColor: '#EDE9FE' }]}
                >
                  <AppIcon name="mail" size={15} color="#8B5CF6" />
                </View>
                <Text style={[styles.tileLabel, { color: '#8B5CF6' }]}>
                  INVITATIONS
                </Text>
              </View>
              <Text style={[styles.tileValue, { color: '#8B5CF6' }]}>
                {invitations.length}
              </Text>
              <Text
                style={[styles.tileSub, { color: theme.colors.textTertiary }]}
              >
                Incoming trip invites
              </Text>
            </View>

            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.bentoTileTop}>
                <View
                  style={[styles.tileIconWrap, { backgroundColor: '#ECFDF5' }]}
                >
                  <AppIcon name="user-check" size={15} color="#10B981" />
                </View>
                <Text style={[styles.tileLabel, { color: '#10B981' }]}>
                  JOIN REQUESTS
                </Text>
              </View>
              <Text style={[styles.tileValue, { color: '#10B981' }]}>
                {requests.length}
              </Text>
              <Text
                style={[styles.tileSub, { color: theme.colors.textTertiary }]}
              >
                Admin approvals
              </Text>
            </View>
          </View>

          {/* ── EMPTY STATE ── */}
          {totalCount === 0 ? (
            <Animated.View
              entering={FadeInUp.delay(100).springify().damping(18)}
            >
              <EmptyState
                icon="🎉"
                title="All Caught Up"
                description="You don't have any pending trip invitations or member join requests right now."
                actionLabel="Explore Dashboard"
                onAction={() => router.replace('/(app)/(tabs)/home')}
              />
            </Animated.View>
          ) : (
            <View style={styles.sectionsContainer}>
              {/* ── INVITATIONS SECTION ── */}
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

              {/* ── JOIN REQUESTS SECTION ── */}
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
    flexWrap: 'wrap',
    gap: 10,
  },
  bentoTile: {
    flex: 1,
    minWidth: 150,
    padding: 14,
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
  bentoTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tileIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  tileSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
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
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
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
// // app/(app)/requests.tsx
// import React, { useMemo, useCallback, useState } from 'react';
// import { View, ScrollView, RefreshControl, StyleSheet, Platform } from 'react-native';
// import { router, Stack } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withSpring,
//   withTiming,
//   FadeInDown,
//   FadeInUp,
//   Layout,
// } from 'react-native-reanimated';

// import { useTheme } from '../../providers/ThemeProvider';
// import { useResponsive } from '../../hooks/useResponsive';
// import { usePendingInvitations, useAcceptInvitation, useDeclineInvitation } from '../../hooks/useInvitations';
// import { useAdminJoinRequests, useApproveJoinRequest, useRejectJoinRequest } from '../../hooks/useJoinRequests';
// import { haptics } from '../../utils/haptics';

// import { GlobalBackground } from '../../components/ui/GlobalBackground';
// import { GlassCard } from '../../components/ui/GlassCard';
// import { Typography } from '../../components/ui/Typography';
// import { Badge, BadgeVariant } from '../../components/ui/Badge';
// import { Button } from '../../components/ui/Button';
// import { InteractiveWrapper } from '../../components/ui/InteractiveWrapper';
// import { Container } from '../../components/ui/Container';
// import { Section } from '../../components/ui/Section';
// import { EmptyState } from '../../components/ui/EmptyState';
// import AppIcon from '../../components/common/AppIcon';

// // ─── Types ───────────────────────────────────────────────────
// interface Invitation {
//   _id: string;
//   tripTitle?: string;
//   fromName?: string;
//   message?: string;
//   tripId?: { _id: string; title: string };
//   fromUser?: { displayName: string; photoURL?: string };
// }

// interface JoinRequest {
//   _id: string;
//   tripId: string | { _id: string; title?: string };
//   tripTitle?: string;
//   userName?: string;
//   fromName?: string;
//   message?: string;
//   user?: { displayName: string; photoURL?: string };
// }

// // ─── Constants ───────────────────────────────────────────────
// const WEB = Platform.OS === 'web';

// // ─── Sub-Components ──────────────────────────────────────────

// function PendingInvitations() {
//   const theme = useTheme();
//   const { data: invitationsData, isLoading } = usePendingInvitations();
//   const { mutate: accept, isPending: isAccepting } = useAcceptInvitation();
//   const { mutate: decline, isPending: isDeclining } = useDeclineInvitation();

//   const invitations: Invitation[] = useMemo(() => {
//     if (!invitationsData) return [];
//     return Array.isArray(invitationsData)
//       ? invitationsData
//       : (invitationsData as any)?.invitations || [];
//   }, [invitationsData]);

//   const handleAccept = useCallback(
//     (id: string) => {
//       haptics.medium();
//       if (WEB && window.confirm('Accept this invitation?')) {
//         accept(id);
//       } else if (!WEB) {
//         accept(id);
//       }
//     },
//     [accept]
//   );

//   const handleDecline = useCallback(
//     (id: string) => {
//       haptics.light();
//       if (WEB && window.confirm('Decline this invitation?')) {
//         decline(id);
//       } else if (!WEB) {
//         decline(id);
//       }
//     },
//     [decline]
//   );

//   if (isLoading) {
//     return (
//       <View style={{ paddingVertical: theme.spacing.xl }}>
//         <Typography variant="body" color="textTertiary" align="center">
//           Loading invitations…
//         </Typography>
//       </View>
//     );
//   }

//   if (invitations.length === 0) return null;

//   return (
//     <Section
//       title="Trip Invitations"
//       subtitle={`${invitations.length} pending`}
//     >
//       <View style={{ gap: theme.spacing.md }}>
//         {invitations.map((inv, index) => (
//           <Animated.View
//             key={inv._id}
//             entering={FadeInDown.delay(index * 80).springify().damping(18)}
//             layout={Layout.springify()}
//           >
//             <GlassCard variant="medium" padding="lg">
//               <View style={{ gap: theme.spacing.md }}>
//                 {/* Header */}
//                 <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
//                   <View
//                     style={{
//                       width: 44,
//                       height: 44,
//                       borderRadius: 22,
//                       backgroundColor: theme.colors.primaryBg,
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                     }}
//                   >
//                     <AppIcon name="mail" size={20} color={theme.colors.primary} />
//                   </View>
//                   <View style={{ flex: 1, gap: 2 }}>
//                     <Typography variant="body" weight="semibold" color="textPrimary" numberOfLines={1}>
//                       {inv.tripTitle || 'Untitled Trip'}
//                     </Typography>
//                     <Typography variant="caption" color="textSecondary">
//                       Invited by {inv.fromName || 'Unknown'}
//                     </Typography>
//                     {inv.message ? (
//                       <Typography variant="caption" color="textTertiary" style={{ fontStyle: 'italic', marginTop: 2 }}>
//                         "{inv.message}"
//                       </Typography>
//                     ) : null}
//                   </View>
//                 </View>

//                 {/* Actions */}
//                 <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
//                   <Button
//                     title={isAccepting ? 'Accepting…' : 'Accept'}
//                     variant="primary"
//                     size="md"
//                     fullWidth
//                     onPress={() => handleAccept(inv._id)}
//                     loading={isAccepting}
//                     disabled={isDeclining}
//                     leftIcon={<AppIcon name="check" size={16} color={theme.colors.textInverse} />}
//                   />
//                   <Button
//                     title={isDeclining ? 'Declining…' : 'Decline'}
//                     variant="outline"
//                     size="md"
//                     fullWidth
//                     onPress={() => handleDecline(inv._id)}
//                     loading={isDeclining}
//                     disabled={isAccepting}
//                   />
//                 </View>
//               </View>
//             </GlassCard>
//           </Animated.View>
//         ))}
//       </View>
//     </Section>
//   );
// }

// // ─────────────────────────────────────────────────────────────

// function JoinRequestItem({ request, tripId }: { request: JoinRequest; tripId: string }) {
//   const theme = useTheme();
//   const { mutate: approve, isPending: isApproving } = useApproveJoinRequest(tripId);
//   const { mutate: reject, isPending: isRejecting } = useRejectJoinRequest(tripId);

//   const handleApprove = useCallback(() => {
//     haptics.medium();
//     if (WEB && window.confirm(`Approve ${request.userName || request.fromName || 'user'}?`)) {
//       approve(request._id);
//     } else if (!WEB) {
//       approve(request._id);
//     }
//   }, [approve, request]);

//   const handleReject = useCallback(() => {
//     haptics.light();
//     if (WEB && window.confirm(`Reject ${request.userName || request.fromName || 'user'}?`)) {
//       reject(request._id);
//     } else if (!WEB) {
//       reject(request._id);
//     }
//   }, [reject, request]);

//   return (
//     <GlassCard variant="subtle" padding="lg">
//       <View style={{ gap: theme.spacing.md }}>
//         <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
//           <View
//             style={{
//               width: 44,
//               height: 44,
//               borderRadius: 22,
//               backgroundColor: theme.colors.infoBg,
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             <AppIcon name="user" size={20} color={theme.colors.info} />
//           </View>
//           <View style={{ flex: 1, gap: 2 }}>
//             <Typography variant="body" weight="semibold" color="textPrimary" numberOfLines={1}>
//               {request.userName || request.fromName || 'Unknown User'}
//             </Typography>
//             <Typography variant="caption" color="textSecondary">
//               Wants to join {request.tripTitle || 'this trip'}
//             </Typography>
//             {request.message ? (
//               <Typography variant="caption" color="textTertiary" style={{ fontStyle: 'italic', marginTop: 2 }}>
//                 "{request.message}"
//               </Typography>
//             ) : null}
//           </View>
//         </View>

//         <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
//           <Button
//             title={isApproving ? 'Approving…' : 'Approve'}
//             variant="primary"
//             size="sm"
//             fullWidth
//             color="success"
//             onPress={handleApprove}
//             loading={isApproving}
//             disabled={isRejecting}
//             leftIcon={<AppIcon name="check" size={14} color={theme.colors.textInverse} />}
//           />
//           <Button
//             title={isRejecting ? 'Rejecting…' : 'Reject'}
//             variant="outline"
//             size="sm"
//             fullWidth
//             onPress={handleReject}
//             loading={isRejecting}
//             disabled={isApproving}
//           />
//         </View>
//       </View>
//     </GlassCard>
//   );
// }

// // ─────────────────────────────────────────────────────────────

// function AdminJoinRequests() {
//   const theme = useTheme();
//   const { data: requestsData, isLoading, error } = useAdminJoinRequests();

//   const requests: JoinRequest[] = useMemo(() => {
//     if (!requestsData) return [];
//     return Array.isArray(requestsData)
//       ? requestsData
//       : (requestsData as any)?.requests || [];
//   }, [requestsData]);

//   const grouped = useMemo(() => {
//     const map: Record<string, JoinRequest[]> = {};
//     requests.forEach((req) => {
//       const id = typeof req.tripId === 'string' ? req.tripId : req.tripId?._id || 'unknown';
//       if (!map[id]) map[id] = [];
//       map[id].push(req);
//     });
//     return map;
//   }, [requests]);

//   if (isLoading) {
//     return (
//       <View style={{ paddingVertical: theme.spacing.xl }}>
//         <Typography variant="body" color="textTertiary" align="center">
//           Loading join requests…
//         </Typography>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={{ paddingVertical: theme.spacing.xl }}>
//         <Typography variant="body" color="danger" align="center">
//           Could not load join requests.
//         </Typography>
//       </View>
//     );
//   }

//   if (requests.length === 0) return null;

//   const tripIds = Object.keys(grouped);

//   return (
//     <Section
//       title="Join Requests"
//       subtitle={`${requests.length} across ${tripIds.length} trip${tripIds.length > 1 ? 's' : ''}`}
//     >
//       <View style={{ gap: theme.spacing.xl }}>
//         {tripIds.map((tripId) => {
//           const tripRequests = grouped[tripId];
//           const tripTitle = tripRequests[0]?.tripTitle || 'Untitled Trip';

//           return (
//             <View key={tripId} style={{ gap: theme.spacing.sm }}>
//               <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
//                 <View
//                   style={{
//                     width: 8,
//                     height: 8,
//                     borderRadius: 4,
//                     backgroundColor: theme.colors.info,
//                   }}
//                 />
//                 <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                   {tripTitle}
//                 </Typography>
//                 <Badge label={`${tripRequests.length}`} variant="info" />
//               </View>
//               <View style={{ gap: theme.spacing.sm }}>
//                 {tripRequests.map((req, index) => (
//                   <Animated.View
//                     key={req._id}
//                     entering={FadeInDown.delay(index * 60).springify().damping(20)}
//                     layout={Layout.springify()}
//                   >
//                     <JoinRequestItem request={req} tripId={tripId} />
//                   </Animated.View>
//                 ))}
//               </View>
//             </View>
//           );
//         })}
//       </View>
//     </Section>
//   );
// }

// // ─── Main Screen ─────────────────────────────────────────────

// export default function RequestsScreen() {
//   const theme = useTheme();
//   const { isDesktop } = useResponsive();
//   const insets = useSafeAreaInsets();

//   const { data: invitationsData, isRefetching: refetchingInv, refetch: refetchInv } = usePendingInvitations();
//   const { data: requestsData, isRefetching: refetchingReq, refetch: refetchReq } = useAdminJoinRequests();

//   const invitations: Invitation[] = useMemo(() => {
//     if (!invitationsData) return [];
//     return Array.isArray(invitationsData)
//       ? invitationsData
//       : (invitationsData as any)?.invitations || [];
//   }, [invitationsData]);

//   const requests: JoinRequest[] = useMemo(() => {
//     if (!requestsData) return [];
//     return Array.isArray(requestsData)
//       ? requestsData
//       : (requestsData as any)?.requests || [];
//   }, [requestsData]);

//   const isRefreshing = refetchingInv || refetchingReq;
//   const totalCount = invitations.length + requests.length;
//   const hasContent = totalCount > 0;

//   const handleRefresh = useCallback(() => {
//     haptics.light();
//     refetchInv();
//     refetchReq();
//   }, [refetchInv, refetchReq]);

//   // Animated header badge
//   const badgeScale = useSharedValue(1);
//   React.useEffect(() => {
//     badgeScale.value = withSpring(1.15, { damping: 10, stiffness: 200 }, () => {
//       badgeScale.value = withSpring(1, { damping: 15, stiffness: 250 });
//     });
//   }, [totalCount]);

//   const badgeAnimatedStyle = useAnimatedStyle(() => ({
//     transform: [{ scale: badgeScale.value }],
//   }));

//   return (
//     <View style={styles.root}>
//       <Stack.Screen options={{ headerShown: false }} />

//       {/* Background */}
//       <View style={StyleSheet.absoluteFill} pointerEvents="none">
//         <GlobalBackground />
//       </View>

//       {/* Header */}
//       <GlassCard
//         variant="medium"
//         padding="none"
//         style={[
//           styles.header,
//           { paddingTop: insets.top + theme.spacing.sm },
//         ]}
//         intensity={theme.isDark ? 20 : 15}
//       >
//         <View style={[styles.headerInner, { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg }]}>
//           {/* Back Button */}
//           <InteractiveWrapper onPress={() => { haptics.light(); router.back(); }}>
//             <View style={[styles.headerIconBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
//               <AppIcon name="arrow-left" size={20} color={theme.colors.textPrimary} />
//             </View>
//           </InteractiveWrapper>

//           {/* Title */}
//           <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
//             <Typography variant="h3" weight="bold" color="textPrimary">
//               Requests
//             </Typography>
//             {totalCount > 0 && (
//               <Animated.View style={badgeAnimatedStyle}>
//                 <Badge label={`${totalCount}`} variant="danger" />
//               </Animated.View>
//             )}
//           </View>

//           {/* Refresh Button */}
//           <InteractiveWrapper onPress={handleRefresh}>
//             <View style={[styles.headerIconBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
//               <AppIcon name="refresh-cw" size={18} color={theme.colors.textSecondary} />
//             </View>
//           </InteractiveWrapper>
//         </View>
//       </GlassCard>

//       {/* Content */}
//       <Container
//         maxWidth={800}
//         style={{ flex: 1, paddingTop: theme.spacing.lg }}
//       >
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={{
//             paddingBottom: insets.bottom + theme.spacing['5xl'],
//             paddingHorizontal: isDesktop ? 0 : theme.spacing.lg,
//           }}
//           refreshControl={
//             <RefreshControl
//               refreshing={isRefreshing}
//               onRefresh={handleRefresh}
//               tintColor={theme.colors.primary}
//               colors={[theme.colors.primary]}
//             />
//           }
//         >
//           {!hasContent ? (
//             <Animated.View entering={FadeInUp.delay(150).springify()}>
//               <EmptyState
//                 icon="📥"
//                 title="All Caught Up"
//                 description="You don't have any pending trip invitations or join requests right now."
//                 actionLabel="Go to Dashboard"
//                 onAction={() => router.replace('/(app)/(tabs)/home')}
//               />
//             </Animated.View>
//           ) : (
//             <Animated.View
//               entering={FadeInUp.springify().damping(18)}
//               style={{ gap: theme.spacing['3xl'] }}
//             >
//               <PendingInvitations />
//               <AdminJoinRequests />
//             </Animated.View>
//           )}
//         </ScrollView>
//       </Container>
//     </View>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//   },
//   header: {
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255,255,255,0.06)',
//     borderLeftWidth: 0,
//     borderRightWidth: 0,
//     borderRadius: 0,
//   },
//   headerInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   headerIconBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     ...(WEB ? { cursor: 'pointer' } : {}),
//   },
// });
