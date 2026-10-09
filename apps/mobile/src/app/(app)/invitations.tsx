// app/(app)/invitations.tsx
import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  useWindowDimensions,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import GlobalLoader from '../../components/common/GlobalLoader';
import AppIcon from '../../components/common/AppIcon';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  usePendingInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
} from '../../hooks/useInvitations';
import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { showToast } from '../../utils/toast';
import { haptics } from '../../utils/haptics';
import { format } from 'date-fns';
import type { Theme } from '../../theme';

interface Invitation {
  _id: string;
  tripTitle?: string;
  fromName?: string;
  message?: string;
  status: string;
  tripId?: {
    _id: string;
    title: string;
    coverImage?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
  fromUserId?: { displayName?: string; photoURL?: string; email?: string };
  fromUser?: { displayName?: string; photoURL?: string; email?: string };
  createdAt?: string;
}

export default function InvitationsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const isDesktop = width >= 860;

  const {
    data: invitations,
    isLoading,
    isRefetching,
    refetch,
  } = usePendingInvitations();
  const { mutate: acceptInv, isPending: isAccepting } = useAcceptInvitation();
  const { mutate: declineInv, isPending: isDeclining } = useDeclineInvitation();
  const isResponding = isAccepting || isDeclining;

  // Pending invites from canonical system
  const pendingInvites: Invitation[] = useMemo(() => {
    if (!invitations) return [];
    const list = Array.isArray(invitations)
      ? invitations
      : (invitations as any)?.invitations || [];
    return list.filter((i: any) => i.status === 'pending');
  }, [invitations]);

  const handleAction = useCallback(
    (invitationId: string, action: 'accept' | 'decline', tripId?: string) => {
      haptics.medium();

      const confirmAction = () => {
        if (action === 'accept') {
          acceptInv(invitationId, {
            onSuccess: (data: any) => {
              haptics.success();
              const destTripId =
                tripId || data?.data?.tripId || data?.data?.trip?._id;
              showToast.success(
                'Trip Joined Successfully',
                "You're now part of this expedition",
                destTripId
                  ? {
                      action: {
                        label: 'Open Trip',
                        onPress: () =>
                          router.push(`/(app)/trips/${destTripId}` as any),
                      },
                    }
                  : undefined,
              );
              if (destTripId) {
                router.push(`/(app)/trips/${destTripId}` as any);
              }
            },
            onError: (error: any) => {
              showToast.fromError(error, 'Failed to accept invitation');
            },
          });
        } else {
          declineInv(invitationId, {
            onSuccess: () => {
              haptics.success();
              showToast.info(
                'Invitation Declined',
                'The trip invitation was declined.',
              );
            },
            onError: (error: any) => {
              showToast.fromError(error, 'Failed to decline invitation');
            },
          });
        }
      };

      if (action === 'decline') {
        if (Platform.OS === 'web') {
          if (
            typeof window !== 'undefined' &&
            window.confirm(
              'Are you sure you want to decline this trip invitation?',
            )
          ) {
            confirmAction();
          }
        } else {
          Alert.alert(
            'Decline Invitation',
            'Are you sure you want to decline this invitation?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Decline', style: 'destructive', onPress: confirmAction },
            ],
          );
        }
      } else {
        confirmAction();
      }
    },
    [acceptInv, declineInv, router],
  );

  const renderItem = ({ item, index }: { item: Invitation; index: number }) => {
    const inviterName =
      item.fromUserId?.displayName ||
      item.fromUser?.displayName ||
      item.fromName ||
      'Trip Organizer';
    const inviterPhoto = item.fromUserId?.photoURL || item.fromUser?.photoURL;
    const tripTitle =
      item.tripId?.title || item.tripTitle || 'Untitled Expedition';

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30)
          .springify()
          .damping(18)}
        layout={Layout.springify()}
        style={styles.cardCol}
      >
        <View
          style={[
            styles.invitationCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {/* Card Top: Type Pill & Icon */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconAura, { backgroundColor: '#EFF6FF' }]}>
              <AppIcon name="mail" size={18} color="#2563EB" />
            </View>

            <View style={styles.headerTextGroup}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: 'rgba(37,99,235,0.12)' },
                  ]}
                >
                  <Text style={styles.typeBadgeText}>TRIP INVITATION</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.tripTitleText,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {tripTitle}
              </Text>
              {item.tripId?.startDate && item.tripId?.endDate && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 4,
                  }}
                >
                  <AppIcon
                    name="calendar"
                    size={12}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {format(new Date(item.tripId.startDate), 'MMM d')} –{' '}
                    {format(new Date(item.tripId.endDate), 'MMM d, yyyy')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Inviter Identity */}
          <View
            style={[
              styles.inviterBlock,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Avatar
              url={inviterPhoto}
              fallback={inviterName.charAt(0).toUpperCase()}
              size="md"
            />
            <View style={{ flex: 1, gap: 1 }}>
              <Text
                style={[
                  styles.inviterSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Invited by
              </Text>
              <Text
                style={[
                  styles.inviterName,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {inviterName}
              </Text>
            </View>
          </View>

          {/* Optional Message */}
          {item.message ? (
            <View
              style={[
                styles.messageBox,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <AppIcon
                name="message-square"
                size={13}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.messageText,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={3}
              >
                "{item.message}"
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => handleAction(item._id, 'accept', item.tripId?._id)}
              disabled={isResponding}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.acceptBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
            >
              <AppIcon name="check" size={14} color="#FFFFFF" />
              <Text style={styles.acceptBtnText}>Accept & Join</Text>
            </Pressable>

            <Pressable
              onPress={() => handleAction(item._id, 'decline')}
              disabled={isResponding}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.declineBtn,
                {
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.08)',
                },
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
            >
              <AppIcon name="x" size={14} color="#EF4444" />
              <Text style={styles.declineBtnText}>Decline</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (isLoading && !isRefetching) {
    return (
      <GlobalBackground>
        <View style={styles.loadingContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingSub, { color: theme.colors.textSecondary }]}
          >
            Checking pending invitations…
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

      {/* Sticky Header Bar */}
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
                styles.headerBtn,
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
                Pending Invitations
              </Text>
              <Text
                style={[styles.headerSub, { color: theme.colors.textTertiary }]}
              >
                {pendingInvites.length} pending trip request
                {pendingInvites.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                haptics.light();
                refetch();
              }}
              style={({ pressed }) => [
                styles.headerBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="refresh-cw"
                size={15}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Content Body */}
      <View
        style={[styles.mainWrapper, isDesktop && styles.desktopMainWrapper]}
      >
        {/* Top Bento Status Tile */}
        {pendingInvites.length > 0 && (
          <View
            style={[
              styles.overviewTile,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.overviewTopRow}>
              <View
                style={[
                  styles.overviewIconWrap,
                  { backgroundColor: '#EFF6FF' },
                ]}
              >
                <AppIcon name="inbox" size={16} color="#2563EB" />
              </View>
              <Text style={styles.overviewTag}>EXPEDITION ACCESS</Text>
            </View>
            <Text
              style={[
                styles.overviewTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              You have {pendingInvites.length} trip invite
              {pendingInvites.length !== 1 ? 's' : ''} awaiting your response
            </Text>
            <Text
              style={[styles.overviewSub, { color: theme.colors.textTertiary }]}
            >
              Accepting will grant you full access to trip itineraries, group
              chats, and expense split tracking.
            </Text>
          </View>
        )}

        <FlatList
          data={pendingInvites}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          numColumns={isDesktop ? 2 : 1}
          key={isDesktop ? 'desktop-grid' : 'mobile-list'}
          columnWrapperStyle={
            isDesktop ? styles.desktopColumnWrapper : undefined
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                haptics.light();
                refetch();
              }}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="📬"
                title="No Pending Invitations"
                description="You are all caught up! New group trip invitations from your travel companions will appear here."
                actionLabel="Explore Trips"
                onAction={() => router.replace('/(app)/(tabs)/home')}
              />
            </View>
          }
        />
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
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
    loadingSub: {
      fontSize: 13,
      fontWeight: '600',
    },

    // Header Bar
    headerBar: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
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
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
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

    // Main Container
    mainWrapper: {
      flex: 1,
      paddingTop: 16,
      paddingHorizontal: 16,
      gap: 14,
    },
    desktopMainWrapper: {
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 24,
    },

    // Bento Overview Tile
    overviewTile: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

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

      gap: 6,
    },
    overviewTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    overviewIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overviewTag: {
      fontSize: 9.5,
      fontWeight: '800',
      color: '#2563EB',
      letterSpacing: 0.6,
    },
    overviewTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    overviewSub: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '500',
    },

    // List & Grid
    listContent: {
      gap: 12,
      paddingTop: 4,
    },
    desktopColumnWrapper: {
      gap: 12,
    },
    cardCol: {
      flex: 1,
    },
    emptyWrap: {
      paddingTop: 40,
    },

    // Invitation Card
    invitationCard: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

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
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextGroup: {
      flex: 1,
      gap: 3,
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
      fontSize: 8.5,
      fontWeight: '800',
      color: '#2563EB',
      letterSpacing: 0.6,
    },
    tripTitleText: {
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: -0.3,
    },

    // Inviter Identity Box
    inviterBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 14,
    },
    inviterSub: {
      fontSize: 10,
      fontWeight: '600',
    },
    inviterName: {
      fontSize: 13,
      fontWeight: '800',
    },

    // Message
    messageBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 12,
    },
    messageText: {
      fontSize: 12,
      fontStyle: 'italic',
      flex: 1,
      lineHeight: 16,
    },

    // Actions
    actionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
    },
    acceptBtn: {
      flex: 1.4,
      backgroundColor: '#2563EB',
    },
    acceptBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    declineBtn: {
      flex: 1,
      backgroundColor: 'transparent',
      borderWidth: 1,
    },
    declineBtnText: {
      color: '#EF4444',
      fontSize: 12,
      fontWeight: '800',
    },
  });
}
