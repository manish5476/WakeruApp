// components/friends/FriendSidebar.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

import { EmptyState } from '../ui/EmptyState';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';

import { FilterBar, FilterOption } from './FilterBar';
import { PremiumFriendCard } from './PremiumFriendCard';
import { RequestCard } from './RequestCard';
import { SearchUserCard } from './SearchUserCard';

import {
  useFriends,
  usePendingRequests,
  useFriendSuggestions,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useRemoveFriend,
  useSendFriendRequest,
  useSearchUsers,
  useBlockFriend,
  useMuteFriend,
} from '../../hooks/useFriends';
import { useAuthStore } from '../../stores/auth.store';

import type { Theme } from '../../theme';

interface FriendSidebarProps {
  selectedUserId: string | null;
  onSelectFriend: (userId: string) => void;
  onRequestModal: (user: any) => void;
}

const TABS = [
  { key: 'friends', label: 'Friends', icon: 'users' },
  { key: 'requests', label: 'Requests', icon: 'inbox' },
  { key: 'find', label: 'Find & Add', icon: 'user-plus' },
] as const;

export function FriendSidebar({
  selectedUserId,
  onSelectFriend,
  onRequestModal,
}: FriendSidebarProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const {
    data: friends = [],
    isLoading: friendsLoading,
    refetch: refetchFriends,
  } = useFriends(searchQuery || undefined);
  const {
    data: requests = [],
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = usePendingRequests();
  const { data: suggestions = [] } = useFriendSuggestions({
    enabled: activeTab === 2,
  });
  const { data: searchResults = [], isFetching: searchLoading } =
    useSearchUsers(searchQuery);

  // Mutations
  const { mutate: acceptRequest, isPending: accepting } =
    useAcceptFriendRequest();
  const { mutate: declineRequest, isPending: declining } =
    useDeclineFriendRequest();
  const { mutate: removeFriend } = useRemoveFriend();
  const { mutate: blockFriend } = useBlockFriend();
  const { mutate: muteFriend } = useMuteFriend();
  const { isPending: sending } = useSendFriendRequest();

  const isRequestProcessing = accepting || declining;
  const pendingCount = requests.filter(
    (r: any) => r.status === 'pending' && r.toUserId === user?.firebaseUid,
  ).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([refetchFriends(), refetchRequests()]);
    setRefreshing(false);
  }, [refetchFriends, refetchRequests]);

  const handleFriendAction = useCallback(
    (friend: any) => {
      if (Platform.OS === 'web') {
        const action = window.prompt(
          `Manage ${friend.displayName}: Type 'Mute', 'Block', or 'Remove'.`,
        );
        if (!action) return;
        const lowerAction = action.toLowerCase();
        if (lowerAction === 'mute') {
          muteFriend(friend.userId, {
            onSuccess: () =>
              window.alert(`${friend.displayName} has been muted`),
          });
        } else if (lowerAction === 'block') {
          blockFriend(friend.userId, {
            onSuccess: () =>
              window.alert(`${friend.displayName} has been blocked`),
          });
        } else if (lowerAction === 'remove') {
          removeFriend(friend.userId, {
            onSuccess: () =>
              window.alert(`${friend.displayName} has been removed`),
          });
        }
        return;
      }

      Alert.alert('Manage Companion', `Options for ${friend.displayName}`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mute Activity',
          onPress: () =>
            muteFriend(friend.userId, {
              onSuccess: () =>
                Alert.alert('Muted', `${friend.displayName} has been muted`),
            }),
        },
        {
          text: 'Block User',
          style: 'destructive',
          onPress: () =>
            blockFriend(friend.userId, {
              onSuccess: () =>
                Alert.alert(
                  'Blocked',
                  `${friend.displayName} has been blocked`,
                ),
            }),
        },
        {
          text: 'Remove Friend',
          style: 'destructive',
          onPress: () =>
            removeFriend(friend.userId, {
              onSuccess: () =>
                Alert.alert(
                  'Removed',
                  `${friend.displayName} has been removed`,
                ),
            }),
        },
      ]);
    },
    [muteFriend, blockFriend, removeFriend],
  );

  // ─── Friends List Tab ───
  const renderFriendsList = () => {
    if (friendsLoading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingSub, { color: theme.colors.textSecondary }]}
          >
            Loading travel friends…
          </Text>
        </View>
      );
    }

    if (friends.length === 0) {
      return (
        <EmptyState
          icon="👥"
          title="No Companions Found"
          description={
            searchQuery
              ? `No friends match "${searchQuery}".`
              : 'Add your travel buddies to start tracking joint balances and trips.'
          }
          actionLabel={!searchQuery ? 'Find Friends' : undefined}
          onAction={!searchQuery ? () => setActiveTab(2) : undefined}
        />
      );
    }

    return (
      <FlatList
        data={friends}
        keyExtractor={item => item.userId}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 25)
              .springify()
              .damping(18)}
            layout={Layout.springify()}
          >
            <PremiumFriendCard
              friend={item}
              isSelected={selectedUserId === item.userId}
              onPress={() => onSelectFriend(item.userId)}
              onAction={action => {
                if (action === 'more') handleFriendAction(item);
                else Alert.alert('Action', `${action} for ${item.displayName}`);
              }}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.listScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    );
  };

  // ─── Requests Tab ───
  const renderRequestsList = () => {
    if (requestsLoading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
        </View>
      );
    }

    if (requests.length === 0) {
      return (
        <EmptyState
          icon="📬"
          title="No Pending Requests"
          description="All friend requests and invitations have been resolved."
        />
      );
    }

    return (
      <FlatList
        data={requests}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 25)
              .springify()
              .damping(18)}
            layout={Layout.springify()}
          >
            <RequestCard
              request={item}
              onAccept={() => {
                haptics.medium();
                acceptRequest(item._id);
              }}
              onDecline={() => {
                haptics.light();
                declineRequest(item._id);
              }}
              isPending={isRequestProcessing}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.listScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    );
  };

  // ─── Find & Add Tab ───
  const renderFindList = () => {
    return (
      <View style={{ flex: 1, gap: 12 }}>
        {/* Search Field */}
        <View
          style={[styles.searchBox, { backgroundColor: theme.colors.surface }]}
        >
          <AppIcon name="search" size={16} color={theme.colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search by name, email, or handle..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <AppIcon name="x" size={14} color={theme.colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {searchQuery.length >= 2 ? (
          searchLoading ? (
            <View style={styles.centerContainer}>
              <GlobalLoader
                variant="inline"
                size="large"
                color={theme.colors.primary}
              />
            </View>
          ) : searchResults.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No Users Found"
              description={`We couldn't find anyone matching "${searchQuery}".`}
            />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={item => item.userId}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={FadeInDown.delay(index * 25)
                    .springify()
                    .damping(18)}
                  layout={Layout.springify()}
                >
                  <SearchUserCard
                    user={item}
                    onAdd={() => onRequestModal(item)}
                    isPending={sending}
                  />
                </Animated.View>
              )}
              contentContainerStyle={styles.listScrollContent}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : suggestions.length > 0 ? (
          <View style={{ flex: 1, gap: 8 }}>
            <View style={styles.suggestedHeader}>
              <Text
                style={[
                  styles.suggestedTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Suggested Friends
              </Text>
              <Text
                style={[
                  styles.suggestedSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Travelers active in your network
              </Text>
            </View>

            <FlatList
              data={suggestions}
              keyExtractor={item => item.userId}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={FadeInDown.delay(index * 25)
                    .springify()
                    .damping(18)}
                  layout={Layout.springify()}
                >
                  <SearchUserCard
                    user={item}
                    onAdd={() => onRequestModal(item)}
                    isPending={sending}
                  />
                </Animated.View>
              )}
              contentContainerStyle={styles.listScrollContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          <EmptyState
            icon="🧭"
            title="Discover Companions"
            description="Type a name or email address above to connect and plan trips together."
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* ── Top Header Controls ── */}
      <View style={styles.topControlWrap}>
        {/* 3-Tab Segmented Selector */}
        <View
          style={[styles.tabBarCard, { backgroundColor: theme.colors.surface }]}
        >
          {TABS.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  haptics.light();
                  setActiveTab(idx as 0 | 1 | 2);
                }}
                style={[
                  styles.tabItem,
                  isActive
                    ? { backgroundColor: theme.colors.primary }
                    : { backgroundColor: 'transparent' },
                ]}
              >
                <AppIcon
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>

                {tab.key === 'requests' && pendingCount > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: isActive
                          ? 'rgba(255,255,255,0.3)'
                          : '#EF4444',
                      },
                    ]}
                  >
                    <Text style={styles.tabBadgeText}>{pendingCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Refresh Action */}
        <Pressable
          onPress={onRefresh}
          disabled={refreshing}
          style={({ pressed }) => [
            styles.refreshBtn,
            { backgroundColor: theme.colors.surface },
            pressed && { opacity: 0.7 },
          ]}
          hitSlop={6}
        >
          <AppIcon
            name="refresh-cw"
            size={15}
            color={
              refreshing ? theme.colors.primary : theme.colors.textSecondary
            }
          />
        </Pressable>
      </View>

      {/* ── Search / Filter Bar (Friends Tab Only) ── */}
      {activeTab === 0 && (
        <View style={styles.filterSection}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <AppIcon
              name="search"
              size={16}
              color={theme.colors.textTertiary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              placeholder="Filter your friends..."
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <AppIcon name="x" size={14} color={theme.colors.textTertiary} />
              </Pressable>
            )}
          </View>

          <FilterBar
            filters={['All', 'Favorites', 'Recent', 'Most Active', 'Online']}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
          />
        </View>
      )}

      {/* ── Content View ── */}
      <View style={styles.contentBody}>
        {activeTab === 0 && renderFriendsList()}
        {activeTab === 1 && renderRequestsList()}
        {activeTab === 2 && renderFindList()}
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      gap: 12,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    loadingSub: {
      fontSize: 12,
      fontWeight: '600',
    },

    // Header Controls
    topControlWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tabBarCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

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

      gap: 4,
    },
    tabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 12,
    },
    tabLabel: {
      fontSize: 11,
      letterSpacing: -0.2,
    },
    tabBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 999,
    },
    tabBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
    },
    refreshBtn: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },

    // Filter Section
    filterSection: {
      gap: 8,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      padding: 0,
    },

    // Content Body
    contentBody: {
      flex: 1,
    },
    listScrollContent: {
      gap: 8,
      paddingBottom: 40,
    },

    // Suggestions Header
    suggestedHeader: {
      gap: 2,
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    suggestedTitle: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    suggestedSub: {
      fontSize: 11,
      fontWeight: '500',
    },
  });
}
// // components/friends/FriendSidebar.tsx
// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   StyleSheet,
//   FlatList,
//   RefreshControl,
//   Platform,
//   Alert,
// } from 'react-native';
// import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

// import { useTheme } from '../../providers/ThemeProvider';
// import { haptics } from '../../utils/haptics';

// import { GlassCard } from '../ui/GlassCard';
// import { Typography } from '../ui/Typography';
// import { Badge } from '../ui/Badge';
// import { EmptyState } from '../ui/EmptyState';
// import { InteractiveWrapper } from '../ui/InteractiveWrapper';
// import { SearchBar } from '../ui/SearchBar';
// import AppIcon from '../common/AppIcon';
// import GlobalLoader from '../common/GlobalLoader';

// import { FilterBar, FilterOption } from './FilterBar';
// import { PremiumFriendCard } from './PremiumFriendCard';
// import { RequestCard } from './RequestCard';
// import { SearchUserCard } from './SearchUserCard';

// import {
//   useFriends,
//   usePendingRequests,
//   useFriendSuggestions,
//   useAcceptFriendRequest,
//   useDeclineFriendRequest,
//   useRemoveFriend,
//   useSendFriendRequest,
//   useSearchUsers,
//   useBlockFriend,
//   useMuteFriend,
// } from '../../hooks/useFriends';
// import { useAuthStore } from '../../stores/auth.store';

// import type { Theme } from '../../theme';

// // ─── Constants ───────────────────────────────────────────────
// const TABS = ['Friends', 'Requests', 'Find'] as const;

// interface FriendSidebarProps {
//   selectedUserId: string | null;
//   onSelectFriend: (userId: string) => void;
//   onRequestModal: (user: any) => void;
// }

// // ─── Tab Bar Component ───────────────────────────────────────
// function TabBar({
//   activeTab,
//   onChange,
//   pendingCount,
//   onRefresh,
//   refreshing,
// }: {
//   activeTab: number;
//   onChange: (index: number) => void;
//   pendingCount: number;
//   onRefresh: () => void;
//   refreshing: boolean;
// }) {
//   const theme = useTheme();

//   return (
//     <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
//       <View style={{ flex: 1 }}>
//         <GlassCard variant="subtle" padding="xs" intensity={theme.isDark ? 20 : 30}>
//           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 }}>
//             {TABS.map((tab, index) => {
//               const isActive = activeTab === index;
//               return (
//                 <InteractiveWrapper
//                   key={tab}
//                   onPress={() => {
//                     haptics.light();
//                     onChange(index);
//                   }}
//                   style={{ flex: 1 }}
//                 >
//                   <View
//                     style={[
//                       tabBarStyles(theme).tabItem,
//                       isActive && tabBarStyles(theme).tabItemActive,
//                     ]}
//                   >
//                     <Typography
//                       variant="caption"
//                       weight="semibold"
//                       color={isActive ? 'textInverse' : 'textSecondary'}
//                     >
//                       {tab}
//                     </Typography>
//                     {tab === 'Requests' && pendingCount > 0 && (
//                       <Badge label={`${pendingCount}`} variant="danger" />
//                     )}
//                   </View>
//                 </InteractiveWrapper>
//               );
//             })}
//           </View>
//         </GlassCard>
//       </View>

//       {/* Refresh Button */}
//       <InteractiveWrapper onPress={onRefresh} disabled={refreshing}>
//         <View style={[tabBarStyles(theme).refreshBtn, { borderColor: theme.colors.borderLight }]}>
//           <AppIcon name="refresh-cw" size={16} color={theme.colors.textSecondary} />
//         </View>
//       </InteractiveWrapper>
//     </View>
//   );
// }

// // ─── Main Component ──────────────────────────────────────────
// export function FriendSidebar({
//   selectedUserId,
//   onSelectFriend,
//   onRequestModal,
// }: FriendSidebarProps) {
//   const theme = useTheme();
//   const { user } = useAuthStore();

//   const [activeTab, setActiveTab] = useState(0);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
//   const [refreshing, setRefreshing] = useState(false);

//   const { data: friends = [], isLoading: friendsLoading, refetch: refetchFriends } = useFriends(searchQuery || undefined);
//   const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = usePendingRequests();
//   const { data: suggestions = [] } = useFriendSuggestions({ enabled: activeTab === 2 });
//   const { data: searchResults = [], isFetching: searchLoading } = useSearchUsers(searchQuery);

//   const { mutate: acceptRequest, isPending: accepting } = useAcceptFriendRequest();
//   const { mutate: declineRequest, isPending: declining } = useDeclineFriendRequest();
//   const { mutate: removeFriend } = useRemoveFriend();
//   const { mutate: blockFriend } = useBlockFriend();
//   const { mutate: muteFriend } = useMuteFriend();
//   const { isPending: sending } = useSendFriendRequest();

//   const isRequestProcessing = accepting || declining;
//   const pendingCount = requests.filter(
//     (r) => r.status === 'pending' && r.toUserId === user?.firebaseUid
//   ).length;

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     haptics.light();
//     await Promise.all([refetchFriends(), refetchRequests()]);
//     setRefreshing(false);
//   }, [refetchFriends, refetchRequests]);

//   const handleFriendAction = useCallback(
//     (friend: any) => {
//       if (Platform.OS === 'web') {
//         const action = window.prompt(`What would you like to do with ${friend.displayName}? Type 'Mute', 'Block', or 'Remove'.`);
//         if (!action) return;
//         const lowerAction = action.toLowerCase();
//         if (lowerAction === 'mute') {
//           muteFriend(friend.userId, { onSuccess: () => window.alert(`${friend.displayName} has been muted`) });
//         } else if (lowerAction === 'block') {
//           blockFriend(friend.userId, { onSuccess: () => window.alert(`${friend.displayName} has been blocked`) });
//         } else if (lowerAction === 'remove') {
//           removeFriend(friend.userId, { onSuccess: () => window.alert(`${friend.displayName} has been removed`) });
//         }
//         return;
//       }

//       Alert.alert('Manage Friend', `What would you like to do with ${friend.displayName}?`, [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Mute',
//           onPress: () =>
//             muteFriend(friend.userId, {
//               onSuccess: () => Alert.alert('Muted', `${friend.displayName} has been muted`),
//             }),
//         },
//         {
//           text: 'Block',
//           style: 'destructive',
//           onPress: () =>
//             blockFriend(friend.userId, {
//               onSuccess: () => Alert.alert('Blocked', `${friend.displayName} has been blocked`),
//             }),
//         },
//         {
//           text: 'Remove',
//           style: 'destructive',
//           onPress: () =>
//             removeFriend(friend.userId, {
//               onSuccess: () => Alert.alert('Removed', `${friend.displayName} has been removed`),
//             }),
//         },
//       ]);
//     },
//     [muteFriend, blockFriend, removeFriend]
//   );

//   // ─── Friends Tab ───
//   const renderFriendsList = () => {
//     if (friendsLoading) {
//       return (
//         <View style={styles.centerContainer}>
//           <GlobalLoader variant="inline" size="large" color={theme.colors.primary} />
//         </View>
//       );
//     }

//     if (friends.length === 0) {
//       return (
//         <EmptyState
//           icon="👥"
//           title="No Friends Yet"
//           description={
//             searchQuery
//               ? 'No friends match your search criteria.'
//               : 'Add friends to start splitting expenses and planning trips.'
//           }
//           actionLabel={!searchQuery ? 'Find Friends' : undefined}
//           onAction={!searchQuery ? () => setActiveTab(2) : undefined}
//         />
//       );
//     }

//     return (
//       <FlatList
//         data={friends}
//         keyExtractor={(item) => item.userId}
//         renderItem={({ item }) => (
//           <Animated.View entering={FadeInDown.springify().damping(18)} layout={Layout.springify()}>
//             <PremiumFriendCard
//               friend={item}
//               isSelected={selectedUserId === item.userId}
//               onPress={() => onSelectFriend(item.userId)}
//               onAction={(action) => {
//                 if (action === 'more') handleFriendAction(item);
//                 else Alert.alert('Action', `${action} for ${item.displayName}`);
//               }}
//             />
//           </Animated.View>
//         )}
//         contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 80 }}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor={theme.colors.primary}
//             colors={[theme.colors.primary]}
//             progressBackgroundColor={theme.colors.surface}
//           />
//         }
//       />
//     );
//   };

//   // ─── Requests Tab ───
//   const renderRequestsList = () => {
//     if (requestsLoading) {
//       return (
//         <View style={styles.centerContainer}>
//           <GlobalLoader variant="inline" size="large" color={theme.colors.primary} />
//         </View>
//       );
//     }

//     if (requests.length === 0) {
//       return (
//         <EmptyState
//           icon="📬"
//           title="All Caught Up"
//           description="You don't have any pending friend requests right now."
//         />
//       );
//     }

//     return (
//       <FlatList
//         data={requests}
//         keyExtractor={(item) => item._id}
//         renderItem={({ item }) => (
//           <Animated.View entering={FadeInDown.springify().damping(18)} layout={Layout.springify()}>
//             <RequestCard
//               request={item}
//               onAccept={() => {
//                 haptics.medium();
//                 acceptRequest(item._id);
//               }}
//               onDecline={() => {
//                 haptics.light();
//                 declineRequest(item._id);
//               }}
//               isPending={isRequestProcessing}
//             />
//           </Animated.View>
//         )}
//         contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 80 }}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor={theme.colors.primary}
//             colors={[theme.colors.primary]}
//             progressBackgroundColor={theme.colors.surface}
//           />
//         }
//       />
//     );
//   };

//   // ─── Find Tab ───
//   const renderFindList = () => {
//     return (
//       <View style={{ gap: theme.spacing.lg, flex: 1 }}>
//         <SearchBar
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           onClear={() => setSearchQuery('')}
//           placeholder="Search by name or email…"
//         />

//         {searchQuery.length >= 2 ? (
//           searchLoading ? (
//             <View style={styles.centerContainer}>
//               <GlobalLoader variant="inline" size="large" color={theme.colors.primary} />
//             </View>
//           ) : searchResults.length === 0 ? (
//             <EmptyState
//               icon="🔍"
//               title="No Users Found"
//               description={`No users match "${searchQuery}".`}
//             />
//           ) : (
//             <FlatList
//               data={searchResults}
//               keyExtractor={(item) => item.userId}
//               renderItem={({ item }) => (
//                 <Animated.View entering={FadeInDown.springify().damping(18)} layout={Layout.springify()}>
//                   <SearchUserCard
//                     user={item}
//                     onAdd={() => onRequestModal(item)}
//                     isPending={sending}
//                   />
//                 </Animated.View>
//               )}
//               contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 80 }}
//               showsVerticalScrollIndicator={false}
//             />
//           )
//         ) : suggestions.length > 0 ? (
//           <View style={{ gap: theme.spacing.md, flex: 1 }}>
//             <View>
//               <Typography variant="h3" weight="extrabold" color="textPrimary" style={{ letterSpacing: -0.5 }}>
//                 Suggested Friends
//               </Typography>
//               <Typography variant="bodySm" color="textTertiary" style={{ marginTop: 2 }}>
//                 People you may know
//               </Typography>
//             </View>
//             <FlatList
//               data={suggestions}
//               keyExtractor={(item) => item.userId}
//               renderItem={({ item }) => (
//                 <Animated.View entering={FadeInDown.springify().damping(18)} layout={Layout.springify()}>
//                   <SearchUserCard
//                     user={item}
//                     onAdd={() => onRequestModal(item)}
//                     isPending={sending}
//                   />
//                 </Animated.View>
//               )}
//               contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 80 }}
//               showsVerticalScrollIndicator={false}
//             />
//           </View>
//         ) : (
//           <EmptyState
//             icon="🔍"
//             title="Find Friends"
//             description="Search for friends by name or email to connect."
//           />
//         )}
//       </View>
//     );
//   };

//   return (
//     <View style={styles.root}>
//       {/* Tab Bar */}
//       <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
//         <TabBar
//           activeTab={activeTab}
//           onChange={setActiveTab}
//           pendingCount={pendingCount}
//           onRefresh={onRefresh}
//           refreshing={refreshing}
//         />
//       </View>

//       {/* Filter Bar (Friends tab only) */}
//       {activeTab === 0 && (
//         <View style={{ paddingBottom: theme.spacing.md, paddingHorizontal: theme.spacing.md }}>
//           <FilterBar
//             filters={['All', 'Favorites', 'Recent', 'Most Active', 'Online']}
//             activeFilter={activeFilter}
//             onSelectFilter={setActiveFilter}
//           />
//         </View>
//       )}

//       {/* Content Area */}
//       <View style={{ flex: 1, paddingHorizontal: theme.spacing.md }}>
//         {activeTab === 0 && renderFriendsList()}
//         {activeTab === 1 && renderRequestsList()}
//         {activeTab === 2 && renderFindList()}
//       </View>
//     </View>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   root: {
//     flex: 1,
//   },
//   centerContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 40,
//   },
// });

// // ─── Tab Bar Styles ──────────────────────────────────────────
// function tabBarStyles(theme: Theme) {
//   return StyleSheet.create({
//     tabItem: {
//       flex: 1,
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       gap: 6,
//       paddingVertical: 10,
//       borderRadius: theme.borderRadius.lg,
//     },
//     tabItemActive: {
//       backgroundColor: theme.colors.primary,
//     },
//     refreshBtn: {
//       width: 44,
//       height: 44,
//       borderRadius: 14,
//       borderWidth: 1,
//       alignItems: 'center',
//       justifyContent: 'center',
//       backgroundColor: theme.colors.primaryBg,
//     },
//   });
// }
