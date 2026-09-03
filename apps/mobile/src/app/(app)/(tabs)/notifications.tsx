import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  Pressable,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isToday, isYesterday } from 'date-fns';

// Hooks & Providers
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from '../../../hooks';
import {
  useAcceptInvitation,
  useDeclineInvitation,
} from '../../../hooks/useInvitations';
import {
  useAcceptFriendRequest,
  useDeclineFriendRequest,
} from '../../../hooks/useFriends';
import { useResponsive } from '../../../hooks/useResponsive';
import { useTheme } from '../../../providers/ThemeProvider';
import { useQueryClient } from '@tanstack/react-query';

// UI Components
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import AppIcon from '../../../components/common/AppIcon';
import type { Theme } from '../../../theme';

// ============================================================
// CONSTANTS & CATEGORY HELPERS
// ============================================================

type FilterType = 'ALL' | 'UNREAD' | 'ACTIONABLE' | 'FINANCE' | 'TRIPS';

const TYPE_ICONS: Record<string, string> = {
  EXPENSE_ADDED: 'credit-card',
  EXPENSE_UPDATED: 'edit-2',
  EXPENSE_DELETED: 'trash-2',
  EXPENSE_COMMENT_ADDED: 'message-circle',
  EXPENSE_SPLIT_PAID: 'check-circle',
  SETTLEMENT_REQUEST: 'send',
  SETTLEMENT_COMPLETED: 'check-circle',
  SETTLEMENT_DISPUTED: 'alert-circle',
  SETTLEMENT_CALCULATED: 'pie-chart',
  PAYMENT_REMINDER: 'bell',
  TRIP_FULLY_SETTLED: 'award',
  TRIP_INVITATION: 'mail',
  TRIP_INVITATION_ACCEPTED: 'check',
  TRIP_INVITATION_DECLINED: 'x',
  TRIP_JOIN_REQUEST: 'user-plus',
  TRIP_JOIN_APPROVED: 'thumbs-up',
  TRIP_JOIN_REJECTED: 'thumbs-down',
  TRIP_JOINED: 'user-check',
  TRIP_MEMBER_REMOVED: 'user-minus',
  TRIP_UPDATED: 'edit',
  TRIP_ARCHIVED: 'archive',
  TRIP_COMPLETED: 'flag',
  STOP_ADDED: 'map-pin',
  STOP_UPDATED: 'edit-2',
  STOP_DELETED: 'trash-2',
  EXCHANGE_RATE_UPDATED: 'refresh-cw',
  FRIEND_REQUEST: 'user-plus',
  FRIEND_ACCEPTED: 'user-check',
  FRIEND_REMOVED: 'user-minus',
  FRIEND_BLOCKED: 'slash',
  TRIP_FRIEND_INVITE: 'users',
  TRIP_INVITE_RESPONSE: 'message-square',
  BUDGET_WARNING: 'alert-triangle',
  BUDGET_EXCEEDED: 'alert-octagon',
  BUDGET_ALERT: 'bell',
  ACHIEVEMENT_UNLOCKED: 'star',
  ACHIEVEMENT_PROGRESS: 'trending-up',
  RATE_ALERT_TRIGGERED: 'activity',
  RATE_ALERT: 'trending-down',
  FORGOT_EXPENSE_REMINDER: 'clock',
  WEEKEND_TRIP_REMINDER: 'calendar',
  FRIEND_ACTIVITY: 'activity',
  SETTLEMENT_REMINDER: 'bell',
  MONTHLY_REPORT: 'bar-chart-2',
  SYSTEM_UPDATE: 'zap',
  SYSTEM: 'info',
  WELCOME: 'smile',
  ACCOUNT_VERIFICATION: 'shield',
  PASSWORD_RESET: 'key',
  NEW_DEVICE_LOGIN: 'smartphone',
};

const TYPE_COLORS: Record<string, string> = {
  EXPENSE_ADDED: '#06B6D4',
  EXPENSE_UPDATED: '#8B5CF6',
  EXPENSE_DELETED: '#F43F5E',
  EXPENSE_COMMENT_ADDED: '#10B981',
  EXPENSE_SPLIT_PAID: '#10B981',
  SETTLEMENT_REQUEST: '#F59E0B',
  SETTLEMENT_COMPLETED: '#10B981',
  SETTLEMENT_DISPUTED: '#F43F5E',
  SETTLEMENT_CALCULATED: '#06B6D4',
  PAYMENT_REMINDER: '#F59E0B',
  TRIP_FULLY_SETTLED: '#10B981',
  TRIP_INVITATION: '#6366F1',
  TRIP_INVITATION_ACCEPTED: '#10B981',
  TRIP_INVITATION_DECLINED: '#F43F5E',
  TRIP_JOIN_REQUEST: '#6366F1',
  TRIP_JOIN_APPROVED: '#10B981',
  TRIP_JOIN_REJECTED: '#F43F5E',
  TRIP_JOINED: '#10B981',
  TRIP_MEMBER_REMOVED: '#F43F5E',
  TRIP_UPDATED: '#06B6D4',
  TRIP_ARCHIVED: '#71717A',
  TRIP_COMPLETED: '#10B981',
  STOP_ADDED: '#6366F1',
  STOP_UPDATED: '#06B6D4',
  STOP_DELETED: '#F43F5E',
  EXCHANGE_RATE_UPDATED: '#F59E0B',
  FRIEND_REQUEST: '#EC4899',
  FRIEND_ACCEPTED: '#10B981',
  FRIEND_REMOVED: '#F43F5E',
  FRIEND_BLOCKED: '#18181B',
  TRIP_FRIEND_INVITE: '#6366F1',
  TRIP_INVITE_RESPONSE: '#06B6D4',
  BUDGET_WARNING: '#F59E0B',
  BUDGET_EXCEEDED: '#F43F5E',
  BUDGET_ALERT: '#F59E0B',
  ACHIEVEMENT_UNLOCKED: '#F59E0B',
  ACHIEVEMENT_PROGRESS: '#06B6D4',
  RATE_ALERT_TRIGGERED: '#F59E0B',
  RATE_ALERT: '#06B6D4',
  FORGOT_EXPENSE_REMINDER: '#F59E0B',
  WEEKEND_TRIP_REMINDER: '#6366F1',
  FRIEND_ACTIVITY: '#06B6D4',
  SETTLEMENT_REMINDER: '#F59E0B',
  MONTHLY_REPORT: '#06B6D4',
  SYSTEM_UPDATE: '#71717A',
  SYSTEM: '#71717A',
  WELCOME: '#10B981',
  ACCOUNT_VERIFICATION: '#10B981',
  PASSWORD_RESET: '#F59E0B',
  NEW_DEVICE_LOGIN: '#71717A',
};

const getCategoryName = (type: string): string => {
  if (
    type.startsWith('EXPENSE') ||
    type.startsWith('SETTLEMENT') ||
    type.startsWith('BUDGET') ||
    type.startsWith('PAYMENT')
  ) {
    return 'Finance';
  }
  if (type.startsWith('TRIP') || type.startsWith('STOP')) {
    return 'Trip';
  }
  if (type.startsWith('FRIEND')) {
    return 'Social';
  }
  return 'System';
};

const formatNotificationDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
};

const isWeb = Platform.OS === 'web';
const BP_TABLET = 768;
const BP_DESKTOP = 1100;

function useGridColumns() {
  const { width } = useWindowDimensions();
  if (!isWeb) return 1;
  if (width >= BP_DESKTOP) return 2;
  if (width >= BP_TABLET) return 2;
  return 1;
}

// ============================================================
// COMPONENT
// ============================================================

export default function NotificationsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isDesktop } = useResponsive();
  const columns = useGridColumns();
  const isGrid = columns > 1;

  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const styles = useStyles(theme, isDesktop, columns, isGrid);

  const { data, isRefetching, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: clearAllNotifications } = useClearAllNotifications();
  const { mutate: acceptInvitation } = useAcceptInvitation();
  const { mutate: declineInvitation } = useDeclineInvitation();
  const { mutate: acceptFriendRequest } = useAcceptFriendRequest();
  const { mutate: declineFriendRequest } = useDeclineFriendRequest();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Filter Logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item: any) => {
      const isActionable =
        [
          'TRIP_INVITATION',
          'TRIP_JOIN_REQUEST',
          'FRIEND_REQUEST',
          'TRIP_FRIEND_INVITE',
        ].includes(item.type) ||
        (item.actionButtons && item.actionButtons.length > 0);

      if (activeFilter === 'UNREAD') return !item.isRead;
      if (activeFilter === 'ACTIONABLE') return isActionable;
      if (activeFilter === 'FINANCE')
        return getCategoryName(item.type) === 'Finance';
      if (activeFilter === 'TRIPS')
        return getCategoryName(item.type) === 'Trip';
      return true;
    });
  }, [notifications, activeFilter]);

  const actionableCount = useMemo(() => {
    return notifications.filter(
      (item: any) =>
        [
          'TRIP_INVITATION',
          'TRIP_JOIN_REQUEST',
          'FRIEND_REQUEST',
          'TRIP_FRIEND_INVITE',
        ].includes(item.type) ||
        (item.actionButtons && item.actionButtons.length > 0),
    ).length;
  }, [notifications]);

  const findInvitationByTripId = useCallback(
    async (tripId: string): Promise<string | null> => {
      try {
        const { invitationsApi } =
          await import('../../../services/api/invitations.api');
        const response = await invitationsApi.getPending();

        let pendingInvitations: any[] = [];
        if (response?.data?.invitations) {
          pendingInvitations = response.data.invitations;
        } else if (Array.isArray(response?.data)) {
          pendingInvitations = response.data;
        } else if (Array.isArray(response)) {
          pendingInvitations = response;
        }

        const matchingInvitation = pendingInvitations.find((inv: any) => {
          const invTripId =
            typeof inv.tripId === 'string'
              ? inv.tripId
              : inv.tripId?._id || inv.tripId?.toString();
          return invTripId === tripId && inv.status === 'pending';
        });

        return matchingInvitation?._id || null;
      } catch (error) {
        console.error('Error finding invitation:', error);
        return null;
      }
    },
    [],
  );

  const handleAction = useCallback(
    async (item: any, action: string) => {
      const notificationData = item.data || {};
      const invitationId = notificationData.invitationId;
      const requestId = notificationData.requestId;
      const tripId = notificationData.tripId;

      const isAcceptAction =
        action === 'accept' || action === 'accept_invitation';
      const isDeclineAction =
        action === 'decline' || action === 'decline_invitation';

      if (item.type === 'FRIEND_REQUEST') {
        if (!requestId) {
          Alert.alert('Error', 'Request ID is missing.');
          return;
        }
        if (isAcceptAction) {
          acceptFriendRequest(requestId, {
            onSuccess: () => {
              Alert.alert('Success', 'Friend request accepted!');
              if (!item.isRead) markAsRead(item._id);
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            },
            onError: (error: any) => {
              Alert.alert(
                'Error',
                error.message || 'Failed to accept friend request.',
              );
            },
          });
        } else if (isDeclineAction) {
          declineFriendRequest(requestId, {
            onSuccess: () => {
              Alert.alert('Success', 'Friend request declined.');
              if (!item.isRead) markAsRead(item._id);
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            },
            onError: (error: any) => {
              Alert.alert(
                'Error',
                error.message || 'Failed to decline friend request.',
              );
            },
          });
        }
        return;
      }

      if (isAcceptAction) {
        const doAccept = (id: string) => {
          acceptInvitation(id, {
            onSuccess: () => {
              Alert.alert(
                'Success',
                'Invitation accepted! You have joined the trip.',
              );
              if (!item.isRead) markAsRead(item._id);
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            },
            onError: (err: any) => {
              Alert.alert(
                'Notice',
                err?.response?.data?.message ||
                  err?.message ||
                  'Failed to accept invitation',
              );
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            },
          });
        };

        if (invitationId) {
          doAccept(invitationId);
          return;
        }

        if (tripId) {
          const foundId = await findInvitationByTripId(tripId);
          if (foundId) {
            doAccept(foundId);
          } else {
            Alert.alert(
              'Invitation Not Found',
              'This invitation may have already been accepted, declined, or expired.',
            );
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
          return;
        }

        router.push('/(app)/requests');
      } else if (isDeclineAction) {
        const doDecline = (id: string) => {
          declineInvitation(id, {
            onSuccess: () => {
              if (!item.isRead) markAsRead(item._id);
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            },
            onError: (err: any) => {
              Alert.alert(
                'Notice',
                err?.response?.data?.message ||
                  err?.message ||
                  'Failed to decline invitation',
              );
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            },
          });
        };

        if (invitationId) {
          Alert.alert(
            'Decline Invitation',
            'Are you sure you want to decline?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Decline',
                style: 'destructive',
                onPress: () => doDecline(invitationId),
              },
            ],
          );
          return;
        }

        if (tripId) {
          const foundId = await findInvitationByTripId(tripId);
          if (foundId) {
            Alert.alert(
              'Decline Invitation',
              'Are you sure you want to decline?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Decline',
                  style: 'destructive',
                  onPress: () => doDecline(foundId),
                },
              ],
            );
          } else {
            Alert.alert(
              'Not Found',
              'This invitation may have already been responded to or expired.',
            );
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
          return;
        }

        router.push('/(app)/requests');
      }
    },
    [
      acceptInvitation,
      declineInvitation,
      acceptFriendRequest,
      declineFriendRequest,
      markAsRead,
      queryClient,
      findInvitationByTripId,
    ],
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const iconName = TYPE_ICONS[item.type] || 'bell';
      const iconColor = TYPE_COLORS[item.type] || theme.colors.primary;
      const category = getCategoryName(item.type);

      const hasActionButtons =
        item.actionButtons && item.actionButtons.length > 0;
      const isActionableType = [
        'TRIP_INVITATION',
        'TRIP_JOIN_REQUEST',
        'FRIEND_REQUEST',
        'TRIP_FRIEND_INVITE',
      ].includes(item.type);
      const showActions = hasActionButtons || isActionableType;

      return (
        <View style={styles.notifCardWrapper}>
          <Pressable
            style={({ pressed }) => [
              styles.notifCard,
              !item.isRead && styles.notifUnreadCard,
              isWeb && styles.webHoverable,
              pressed && styles.pressedState,
            ]}
            onPress={() => {
              if (!item.isRead) markAsRead(item._id);
              if (item.data?.tripId) {
                router.push(`/(app)/trips/${item.data.tripId}`);
              } else if (item.actionUrl) {
                if (item.actionUrl.startsWith('http')) {
                  Linking.openURL(item.actionUrl).catch(err =>
                    console.error("Couldn't open URL", err),
                  );
                } else {
                  router.push(item.actionUrl as any);
                }
              }
            }}
            onLongPress={() => {
              Alert.alert('Delete Notification', 'Delete this notification?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteNotification(item._id),
                },
              ]);
            }}
          >
            {/* Unread Glowing Side Pillar */}
            {!item.isRead && (
              <View
                style={[styles.unreadPillar, { backgroundColor: iconColor }]}
              />
            )}

            <View style={styles.cardMain}>
              {/* Top Header Row of Card */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardCategoryGroup}>
                  <View
                    style={[
                      styles.iconAura,
                      { backgroundColor: `${iconColor}18` },
                    ]}
                  >
                    <AppIcon name={iconName} size={18} color={iconColor} />
                  </View>
                  <View style={styles.categoryBadgeWrap}>
                    <Text
                      style={[styles.categoryBadgeText, { color: iconColor }]}
                    >
                      {category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.headerRightControls}>
                  {!item.isRead && (
                    <View style={styles.newIndicatorDot}>
                      <View
                        style={[styles.dotCore, { backgroundColor: iconColor }]}
                      />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.timeText,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {formatNotificationDate(item.createdAt)}
                  </Text>
                  <Pressable
                    onPress={e => {
                      e.stopPropagation();
                      deleteNotification(item._id);
                    }}
                    hitSlop={10}
                    style={styles.deleteIconButton}
                  >
                    <AppIcon
                      name="x"
                      size={13}
                      color={theme.colors.textTertiary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Text Body */}
              <View style={styles.cardBody}>
                <Text
                  style={[
                    styles.notifTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.notifMessage,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={3}
                >
                  {item.message}
                </Text>
              </View>

              {/* Interactive Buttons */}
              {showActions && (
                <View style={styles.actionsCluster}>
                  {hasActionButtons ? (
                    item.actionButtons.map((button: any) => (
                      <Pressable
                        key={button.value}
                        style={({ pressed }) => [
                          styles.actionBtnBase,
                          button.style === 'primary'
                            ? styles.actionBtnPrimary
                            : styles.actionBtnDanger,
                          pressed && styles.pressedState,
                        ]}
                        onPress={e => {
                          e.stopPropagation();
                          handleAction(item, button.action);
                        }}
                      >
                        <Text
                          style={[
                            styles.actionBtnLabel,
                            button.style === 'danger'
                              ? styles.actionLabelDanger
                              : styles.actionLabelPrimary,
                          ]}
                        >
                          {button.label}
                        </Text>
                      </Pressable>
                    ))
                  ) : item.type === 'FRIEND_REQUEST' ? (
                    <>
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionBtnBase,
                          styles.actionBtnPrimary,
                          pressed && styles.pressedState,
                        ]}
                        onPress={e => {
                          e.stopPropagation();
                          handleAction(item, 'accept');
                        }}
                      >
                        <AppIcon name="check" size={14} color="#FFF" />
                        <Text
                          style={[
                            styles.actionBtnLabel,
                            styles.actionLabelPrimary,
                          ]}
                        >
                          Accept
                        </Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionBtnBase,
                          styles.actionBtnDanger,
                          pressed && styles.pressedState,
                        ]}
                        onPress={e => {
                          e.stopPropagation();
                          handleAction(item, 'decline');
                        }}
                      >
                        <AppIcon
                          name="x"
                          size={14}
                          color={theme.colors.danger}
                        />
                        <Text
                          style={[
                            styles.actionBtnLabel,
                            styles.actionLabelDanger,
                          ]}
                        >
                          Decline
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtnBase,
                        styles.actionBtnPrimary,
                        pressed && styles.pressedState,
                      ]}
                      onPress={e => {
                        e.stopPropagation();
                        router.push('/(app)/requests');
                      }}
                    >
                      <Text
                        style={[
                          styles.actionBtnLabel,
                          styles.actionLabelPrimary,
                        ]}
                      >
                        View Details
                      </Text>
                      <AppIcon name="arrow-right" size={14} color="#FFF" />
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        </View>
      );
    },
    [theme, styles, markAsRead, deleteNotification, handleAction],
  );

  const filterOptions: { label: string; key: FilterType; count?: number }[] = [
    { label: 'All', key: 'ALL', count: notifications.length },
    { label: 'Unread', key: 'UNREAD', count: unreadCount },
    { label: 'Actionable', key: 'ACTIONABLE', count: actionableCount },
    { label: 'Finances', key: 'FINANCE' },
    { label: 'Trips', key: 'TRIPS' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Top Navigation Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 12 },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLeftGroup}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtnWrap,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={10}
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
                Notifications
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                {unreadCount > 0
                  ? `You have ${unreadCount} unread alerts`
                  : 'All caught up'}
              </Text>
            </View>
          </View>

          {/* Batch Action Buttons */}
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <Pressable
                onPress={() => markAllAsRead()}
                style={({ pressed }) => [
                  styles.batchBtn,
                  { backgroundColor: theme.colors.surface },
                  pressed && styles.pressedState,
                ]}
              >
                <AppIcon
                  name="check-check"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.batchBtnText, { color: theme.colors.primary }]}
                >
                  Mark all read
                </Text>
              </Pressable>
            )}
            {notifications.length > 0 && (
              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Clear All',
                    'Delete all notifications from your feed?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear All',
                        style: 'destructive',
                        onPress: () => clearAllNotifications(),
                      },
                    ],
                  );
                }}
                style={({ pressed }) => [
                  styles.batchBtn,
                  { backgroundColor: theme.colors.surface },
                  pressed && styles.pressedState,
                ]}
              >
                <AppIcon
                  name="trash-2"
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.batchBtnText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Clear
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Pill Row */}
        <View style={styles.filterRowWrapper}>
          <FlatList
            horizontal
            data={filterOptions}
            keyExtractor={item => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterListContainer}
            renderItem={({ item }) => {
              const isActive = activeFilter === item.key;
              return (
                <Pressable
                  onPress={() => setActiveFilter(item.key)}
                  style={[
                    styles.filterPill,
                    isActive
                      ? styles.filterPillActive
                      : { backgroundColor: theme.colors.surface },
                    {
                      borderColor: isActive
                        ? theme.colors.primary
                        : theme.colors.borderLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive
                        ? styles.filterPillTextActive
                        : { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.count !== undefined && item.count > 0 && (
                    <View
                      style={[
                        styles.filterCountBadge,
                        isActive
                          ? styles.filterCountBadgeActive
                          : {
                              backgroundColor: `${theme.colors.textSecondary}20`,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterCountText,
                          isActive
                            ? styles.filterCountTextActive
                            : { color: theme.colors.textSecondary },
                        ]}
                      >
                        {item.count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>

      {/* List Feed */}
      <View style={styles.webWrapper}>
        <FlatList
          key={`cols-${columns}`}
          data={filteredNotifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          numColumns={columns}
          columnWrapperStyle={isGrid ? styles.row : undefined}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="🎉"
                title={
                  activeFilter === 'ALL'
                    ? 'Zero inbox achieved'
                    : 'No notifications in this filter'
                }
                description={
                  activeFilter === 'ALL'
                    ? 'You are up to date on all group activities, payments, and trip schedules.'
                    : 'Switch filters to see other notifications or check back later.'
                }
              />
            </View>
          }
        />
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const useStyles = (
  theme: Theme,
  isDesktop: boolean,
  columns: number,
  isGrid: boolean,
) => {
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: 'transparent' },
        webWrapper: { flex: 1, width: '100%' },
        pressedState: { opacity: 0.85, transform: [{ scale: 0.985 }] },
        webHoverable: {
          ...(isWeb
            ? {
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }
            : {}),
        } as any,

        // Top Navigation
        headerContainer: {
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.05)',
          zIndex: 10,
        },
        headerInner: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: 1300,
          alignSelf: 'center',
          paddingHorizontal: isDesktop ? 24 : 16,
          marginBottom: 12,
        },
        headerLeftGroup: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        },
        backBtnWrap: {
          width: 38,
          height: 38,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.05)',

          ...Platform.select({
            web: {
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
        headerTitle: {
          fontSize: 20,
          fontWeight: '900',
          letterSpacing: -0.5,
        },
        headerSub: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 1,
        },
        headerActions: {
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
        },
        batchBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.05)',
        },
        batchBtnText: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.2,
        },

        // Filter Pills
        filterRowWrapper: {
          width: '100%',
          maxWidth: 1300,
          alignSelf: 'center',
        },
        filterListContainer: {
          paddingHorizontal: isDesktop ? 24 : 16,
          gap: 8,
          paddingBottom: 4,
        },
        filterPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
        },
        filterPillActive: {
          backgroundColor: theme.colors.primary,
        },
        filterPillText: {
          fontSize: 12,
          fontWeight: '700',
        },
        filterPillTextActive: {
          color: '#FFFFFF',
        },
        filterCountBadge: {
          paddingHorizontal: 6,
          paddingVertical: 1,
          borderRadius: 999,
        },
        filterCountBadgeActive: {
          backgroundColor: 'rgba(255,255,255,0.25)',
        },
        filterCountText: {
          fontSize: 10,
          fontWeight: '800',
        },
        filterCountTextActive: {
          color: '#FFFFFF',
        },

        // List
        listContent: {
          width: '100%',
          maxWidth: 1300,
          alignSelf: 'center',
          padding: isDesktop ? 24 : 16,
          gap: 12,
        },
        row: {
          gap: 12,
        },
        emptyContainer: {
          paddingVertical: 60,
          alignItems: 'center',
          justifyContent: 'center',
        },

        // Notification Cards
        notifCardWrapper: {
          flex: isGrid ? 1 : undefined,
          maxWidth: isGrid ? `${100 / columns}%` : '100%',
        },
        notifCard: {
          borderRadius: 20,
          padding: 16,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.04)',

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

          position: 'relative',
          overflow: 'hidden',
        },
        notifUnreadCard: {
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.14)'
            : 'rgba(37,99,235,0.2)',

          ...Platform.select({
            web: {
              boxShadow: '0 6px 20px rgba(37,99,235,0.05)',
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
        unreadPillar: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
        },
        cardMain: {
          flex: 1,
        },

        // Card Top Row
        cardHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        },
        cardCategoryGroup: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        iconAura: {
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        categoryBadgeWrap: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.03)',
        },
        categoryBadgeText: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.6,
        },
        headerRightControls: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        newIndicatorDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          alignItems: 'center',
          justifyContent: 'center',
        },
        dotCore: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        timeText: {
          fontSize: 11,
          fontWeight: '600',
        },
        deleteIconButton: {
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(0,0,0,0.03)',
          marginLeft: 2,
        },

        // Content
        cardBody: {
          gap: 3,
        },
        notifTitle: {
          fontSize: 14,
          fontWeight: '800',
          letterSpacing: -0.2,
        },
        notifMessage: {
          fontSize: 13,
          lineHeight: 19,
          fontWeight: '500',
        },

        // Actions Cluster
        actionsCluster: {
          flexDirection: 'row',
          gap: 8,
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.04)',
        },
        actionBtnBase: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 12,
          borderWidth: 1,
        },
        actionBtnPrimary: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        actionBtnDanger: {
          backgroundColor: theme.colors.dangerBg,
          borderColor: theme.colors.danger,
        },
        actionBtnLabel: {
          fontSize: 12,
          fontWeight: '700',
        },
        actionLabelPrimary: {
          color: '#FFFFFF',
        },
        actionLabelDanger: {
          color: theme.colors.danger,
        },
      }),
    [theme, isDesktop, columns, isGrid],
  );
};
