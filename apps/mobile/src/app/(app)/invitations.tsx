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
  useMyTripInvites,
  useRespondToTripInvite,
} from '../../hooks/useFriends';
import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { haptics } from '../../utils/haptics';
import type { Theme } from '../../theme';

interface Invitation {
  _id: string;
  tripTitle?: string;
  fromName?: string;
  message?: string;
  status: string;
  isSentToMe: boolean;
  tripId?: { _id: string; title: string; coverImage?: string };
  fromUser?: { displayName: string; photoURL?: string; email?: string };
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
  } = useMyTripInvites();
  const { mutate: respondToInvite, isPending: isResponding } =
    useRespondToTripInvite();

  // Filter to only show invites sent TO the current user that are pending
  const pendingInvites: Invitation[] = useMemo(() => {
    return (invitations || []).filter(
      (i: any) => i.isSentToMe && i.status === 'pending',
    );
  }, [invitations]);

  const handleAction = useCallback(
    (invitationId: string, action: 'accept' | 'decline') => {
      const status = action === 'accept' ? 'going' : 'declined';
      haptics.medium();

      const confirmAction = () => {
        respondToInvite(
          { inviteId: invitationId, status },
          {
            onSuccess: () => {
              haptics.success();
              Alert.alert(
                `Invitation ${action === 'accept' ? 'Accepted' : 'Declined'}`,
                `You have successfully ${action === 'accept' ? 'joined' : 'declined'} the expedition.`,
              );
            },
            onError: (error: any) => {
              Alert.alert(
                'Notice',
                error.message || `Failed to ${action} invitation`,
              );
            },
          },
        );
      };

      if (action === 'decline') {
        if (Platform.OS === 'web') {
          if (
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
    [respondToInvite],
  );

  const renderItem = ({ item, index }: { item: Invitation; index: number }) => {
    const inviterName =
      item.fromUser?.displayName || item.fromName || 'Trip Organizer';
    const tripTitle =
      item.tripTitle || item.tripId?.title || 'Untitled Expedition';

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
              url={item.fromUser?.photoURL}
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
              onPress={() => handleAction(item._id, 'accept')}
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
// import GlobalLoader from '../../components/common/GlobalLoader';
// import React, { useMemo } from 'react';
// import { View, Text, StyleSheet, FlatList, Platform, useWindowDimensions, Pressable, PressableStateCallbackType, Alert } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { GlobalBackground } from '../../components/ui/GlobalBackground';
// import { GlassCard } from '../../components/ui/GlassCard';
// import { useGlobalStyles } from '../../hooks/useGlobalStyles';
// import { useMyTripInvites, useRespondToTripInvite } from '../../hooks/useFriends';
// import { useTheme } from '../../providers/ThemeProvider';

// // Safe web pressable type
// type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

// export default function InvitationsScreen() {
//     const theme = useTheme();
//     const globalStyles = useGlobalStyles();
//     const styles = useStyles();
//     const insets = useSafeAreaInsets();
//     const { width } = useWindowDimensions();
//     const router = useRouter();

//     // Check for widescreen desktop browser
//     const isWebDesktop = Platform.OS === 'web' && width > 768;

//     const { data: invitations, isLoading } = useMyTripInvites();
//     const { mutate: respondToInvite } = useRespondToTripInvite();

//     // Filter to only show invites sent TO the current user that are pending
//     const pendingInvites = useMemo(() => {
//         return (invitations || []).filter((i: any) => i.isSentToMe && i.status === 'pending');
//     }, [invitations]);

//     const handleAction = (invitationId: string, action: 'accept' | 'decline') => {
//         const status = action === 'accept' ? 'going' : 'declined';
//         respondToInvite({ inviteId: invitationId, status }, {
//             onSuccess: () => {
//                 Alert.alert(
//                     `Invitation ${action === 'accept' ? 'Accepted' : 'Declined'}`,
//                     `You have successfully ${action === 'accept' ? 'accepted' : 'declined'} the invitation.`
//                 );
//             },
//             onError: (error: any) => {
//                 Alert.alert('Error', error.message || `Failed to ${action} invitation`);
//             }
//         });
//     };

//     const renderItem = ({ item }: { item: any }) => (
//         <GlassCard style={styles.notifCard} intensity={theme.isDark ? 10 : 5}>
//             <View style={styles.notifHeader}>
//                 <Text style={styles.notifTitle}>Trip Invitation from {item.fromName}</Text>
//             </View>
//             <Text style={styles.notifMessage}>
//                 {item.fromName} invited you to join their trip "{item.tripTitle}".
//                 {item.message ? `\n\n"${item.message}"` : ''}
//             </Text>
//             <View style={styles.actionButtonsContainer}>
//                 <Pressable
//                     style={({ hovered, pressed }: WebPressableState) => [
//                         styles.actionButton,
//                         styles.actionButton_primary,
//                         Platform.OS === 'web' && hovered && styles.hoverLift,
//                         pressed && styles.pressedState
//                     ]}
//                     onPress={() => handleAction(item._id, 'accept')}
//                 >
//                     <Text style={[styles.actionButtonText, styles.actionButtonText_primary]}>✅ Accept</Text>
//                 </Pressable>
//                 <Pressable
//                     style={({ hovered, pressed }: WebPressableState) => [
//                         styles.actionButton,
//                         styles.actionButton_danger,
//                         Platform.OS === 'web' && hovered && styles.hoverLift,
//                         pressed && styles.pressedState
//                     ]}
//                     onPress={() => handleAction(item._id, 'decline')}
//                 >
//                     <Text style={[styles.actionButtonText, styles.actionButtonText_danger]}>❌ Decline</Text>
//                 </Pressable>
//             </View>
//         </GlassCard>
//     );

//     return (
//         <GlobalBackground>
//             <View style={[styles.webDesktopContent, isWebDesktop && styles.webDesktopContentCentered]}>
//                 <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? theme.spacing['4'] : insets.top + 12 }]}>
//                     <Text style={styles.title}>Pending Invitations</Text>
//                 </View>

//                 {isLoading ? (
//                     <View style={globalStyles.loadingContainer}>
//                         <GlobalLoader variant="inline" size="large" color={theme.colors.primary}  />
//                     </View>
//                 ) : (
//                     <FlatList
//                         data={pendingInvites}
//                         keyExtractor={(item) => item._id}
//                         renderItem={renderItem}
//                         contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 }]}
//                         showsVerticalScrollIndicator={false}
//                         ListEmptyComponent={
//                             <View style={styles.emptyContainer}>
//                                 <GlassCard style={styles.emptyIconCircle} intensity={theme.isDark ? 12 : 6}>
//                                     <Text style={styles.emptyEmoji}>📨</Text>
//                                 </GlassCard>
//                                 <Text style={styles.emptyTitle}>No Pending Invitations</Text>
//                                 <Text style={styles.emptyText}>You don't have any pending trip invitations.</Text>
//                             </View>
//                         }
//                     />
//                 )}
//             </View>
//         </GlobalBackground>
//     );
// }

// const useStyles = () => {
//     const theme = useTheme();
//     return useMemo(() => StyleSheet.create({
//         webDesktopContent: {
//             flex: 1,
//             width: '100%',
//         },
//         webDesktopContentCentered: {
//             maxWidth: 1024,
//             alignSelf: 'center',
//             backgroundColor: 'transparent',
//         },
//         hoverLift: {
//             transform: [{ translateY: -2 }],
//             ...theme.shadows.md,
//             ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } : {}),
//         } as any,
//         pressedState: {
//             transform: [{ translateY: 0 }],
//             opacity: 0.8,
//         },
//         header: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             paddingHorizontal: theme.spacing['5'],
//             paddingBottom: theme.spacing['4'],
//         },
//         title: {
//             fontSize: theme.typography.fontSize['3xl'],
//             fontWeight: theme.typography.fontWeight.extrabold,
//             color: theme.colors.textPrimary,
//             letterSpacing: theme.typography.letterSpacing.tight,
//         },
//         listContent: {
//             paddingHorizontal: theme.spacing['5'],
//             paddingTop: theme.spacing['2'],
//             gap: theme.spacing['3'],
//         },
//         notifCard: {
//             borderRadius: theme.borderRadius.xl,
//             padding: theme.spacing['4'],
//             borderWidth: 1,
//             borderColor: theme.colors.borderLight,
//             overflow: 'hidden',
//             ...theme.shadows.xs,
//         },
//         notifHeader: {
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             marginBottom: theme.spacing['2'],
//         },
//         notifTitle: {
//             fontSize: theme.typography.fontSize.base,
//             fontWeight: theme.typography.fontWeight.bold,
//             color: theme.colors.textPrimary,
//             flex: 1,
//         },
//         notifMessage: {
//             fontSize: theme.typography.fontSize.sm,
//             color: theme.colors.textSecondary,
//             lineHeight: 20,
//             marginBottom: theme.spacing['3'],
//         },
//         actionButtonsContainer: {
//             flexDirection: 'row',
//             justifyContent: 'flex-end',
//             marginTop: theme.spacing['3'],
//             gap: theme.spacing['2'],
//         },
//         actionButton: {
//             paddingHorizontal: theme.spacing['3'],
//             paddingVertical: theme.spacing['2'],
//             borderRadius: theme.borderRadius.md,
//             borderWidth: 1,
//         },
//         actionButton_primary: {
//             backgroundColor: theme.colors.primary,
//             borderColor: theme.colors.primary,
//         },
//         actionButton_danger: {
//             backgroundColor: 'transparent',
//             borderColor: theme.colors.danger,
//         },
//         actionButtonText: {
//             fontSize: theme.typography.fontSize.sm,
//             fontWeight: theme.typography.fontWeight.semibold,
//         },
//         actionButtonText_primary: {
//             color: theme.colors.textInverse,
//         },
//         actionButtonText_danger: {
//             color: theme.colors.danger,
//         },
//         emptyContainer: {
//             flex: 1,
//             justifyContent: 'center',
//             alignItems: 'center',
//             paddingTop: theme.spacing['5xl'],
//             paddingHorizontal: theme.spacing['8'],
//         },
//         emptyIconCircle: {
//             width: 80,
//             height: 80,
//             borderRadius: theme.borderRadius.full,
//             alignItems: 'center',
//             justifyContent: 'center',
//             marginBottom: theme.spacing['5'],
//         },
//         emptyEmoji: {
//             fontSize: 36,
//         },
//         emptyTitle: {
//             fontSize: theme.typography.fontSize.xl,
//             fontWeight: theme.typography.fontWeight.bold,
//             color: theme.colors.textPrimary,
//             marginBottom: theme.spacing['2']
//         },
//         emptyText: {
//             fontSize: theme.typography.fontSize.sm,
//             color: theme.colors.textSecondary,
//             textAlign: 'center',
//             lineHeight: 22,
//         },
//     }), [theme]);
// };
