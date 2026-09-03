// components/friends/FriendPicker.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { friendsService, Friend } from '../../services/friends/friends.service';

import { Avatar } from '../ui/Avatar';
import { EmptyState } from '../ui/EmptyState';
import AppIcon from '../common/AppIcon';
import type { Theme } from '../../theme';

interface FriendPickerProps {
  selected: string[];
  onToggle: (userId: string) => void;
  onAddFriend?: () => void;
  compact?: boolean;
}

// ─── Individual Selectable Friend Row ────────────────────────
function FriendPickerRow({
  friend,
  isSelected,
  onToggle,
}: {
  friend: Friend;
  isSelected: boolean;
  onToggle: (userId: string) => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createRowStyles(theme), [theme]);

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onToggle(friend.userId);
      }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: isSelected
            ? `${theme.colors.primary}12`
            : theme.colors.surface,
          borderColor: isSelected
            ? theme.colors.primary
            : theme.isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(15,23,42,0.05)',
        },
        pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
      ]}
    >
      <Avatar
        url={friend.photoURL}
        fallback={friend.displayName?.charAt(0)?.toUpperCase() || '?'}
        size="md"
        ringColor={isSelected ? theme.colors.primary : undefined}
      />

      <View style={styles.infoCol}>
        <Text
          style={[styles.nameText, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {friend.displayName}
        </Text>
        {friend.tags && friend.tags.length > 0 ? (
          <Text
            style={[styles.tagText, { color: theme.colors.textTertiary }]}
            numberOfLines={1}
          >
            {friend.tags.slice(0, 2).join(' · ')}
          </Text>
        ) : (
          <Text style={[styles.tagText, { color: theme.colors.textTertiary }]}>
            Travel Buddy
          </Text>
        )}
      </View>

      {/* Checkbox Indicator */}
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.textTertiary,
          },
        ]}
      >
        {isSelected && <AppIcon name="check" size={12} color="#FFFFFF" />}
      </View>
    </Pressable>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function FriendPicker({
  selected,
  onToggle,
  onAddFriend,
  compact = false,
}: FriendPickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [search, setSearch] = useState('');
  const [friends] = useState<Friend[]>(() => friendsService.getAll());
  const [showAll, setShowAll] = useState(false);

  const filteredFriends = useMemo(
    () => (search ? friendsService.search(search) : friends),
    [search, friends],
  );

  const displayFriends = useMemo(
    () =>
      showAll ? filteredFriends : filteredFriends.slice(0, compact ? 4 : 8),
    [showAll, filteredFriends, compact],
  );

  const handleClearAll = useCallback(() => {
    haptics.light();
    selected.forEach(id => onToggle(id));
  }, [selected, onToggle]);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text
            style={[styles.headerLabel, { color: theme.colors.textTertiary }]}
          >
            SELECT COMPANIONS
          </Text>
          <Text
            style={[styles.headerSub, { color: theme.colors.textSecondary }]}
          >
            Choose members to split or invite
          </Text>
        </View>

        {selected.length > 0 && (
          <View style={styles.selectionBadgeGroup}>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: `${theme.colors.primary}18` },
              ]}
            >
              <Text
                style={[styles.countBadgeText, { color: theme.colors.primary }]}
              >
                {selected.length} Selected
              </Text>
            </View>
            <Pressable
              onPress={handleClearAll}
              hitSlop={6}
              style={styles.clearBtn}
            >
              <Text style={[styles.clearBtnText, { color: '#EF4444' }]}>
                Clear
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Embedded Search Input */}
      <View
        style={[styles.searchBox, { backgroundColor: theme.colors.surface }]}
      >
        <AppIcon name="search" size={15} color={theme.colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          placeholder="Filter friends by name..."
          placeholderTextColor={theme.colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={6}>
            <AppIcon name="x" size={13} color={theme.colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Selectable Friend List */}
      <FlatList
        data={displayFriends}
        keyExtractor={item => item.userId || item.id || item.displayName}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 20)
              .springify()
              .damping(18)}
            layout={Layout.springify()}
          >
            <FriendPickerRow
              friend={item}
              isSelected={selected.includes(item.userId)}
              onToggle={onToggle}
            />
          </Animated.View>
        )}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title={search ? 'No friends found' : 'No friends added yet'}
            description={
              search
                ? `No companions match "${search}".`
                : 'Connect with friends to start splitting expenses.'
            }
            actionLabel={onAddFriend ? 'Add Friends' : undefined}
            onAction={onAddFriend}
          />
        }
      />

      {/* Expand / Collapse Control */}
      {filteredFriends.length > (compact ? 4 : 8) && (
        <Pressable
          onPress={() => {
            haptics.light();
            setShowAll(!showAll);
          }}
          style={styles.expandBtn}
        >
          <Text style={[styles.expandBtnText, { color: theme.colors.primary }]}>
            {showAll ? 'Show Less' : `View All (${filteredFriends.length})`}
          </Text>
          <AppIcon
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={theme.colors.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: 2,
    },
    titleGroup: {
      gap: 2,
    },
    headerLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    headerSub: {
      fontSize: 12,
      fontWeight: '500',
    },
    selectionBadgeGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: '800',
    },
    clearBtn: {
      paddingVertical: 2,
      paddingHorizontal: 4,
    },
    clearBtnText: {
      fontSize: 11,
      fontWeight: '700',
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
    listContent: {
      gap: 8,
    },
    expandBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
    },
    expandBtnText: {
      fontSize: 12,
      fontWeight: '800',
    },
  });
}

function createRowStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 1,
      gap: 12,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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
    infoCol: {
      flex: 1,
      gap: 2,
    },
    nameText: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '500',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
// // components/friends/FriendPicker.tsx
// import React, { useState, useMemo, useCallback } from 'react';
// import {
//   View,
//   StyleSheet,
//   FlatList,
//   TextInput,
//   Platform,
// } from 'react-native';
// import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

// import { useTheme } from '../../providers/ThemeProvider';
// import { useResponsive } from '../../hooks/useResponsive';
// import { haptics } from '../../utils/haptics';
// import { friendsService, Friend } from '../../services/friends/friends.service';

// import { GlassCard } from '../ui/GlassCard';
// import { Typography } from '../ui/Typography';
// import { Badge } from '../ui/Badge';
// import { Button } from '../ui/Button';
// import { InteractiveWrapper } from '../ui/InteractiveWrapper';
// import { Avatar } from '../ui/Avatar';
// import { EmptyState } from '../ui/EmptyState';
// import { SearchBar } from '../ui/SearchBar';
// import AppIcon from '../common/AppIcon';

// import type { Theme } from '../../theme';

// // ─── Constants ───────────────────────────────────────────────
// const WEB = Platform.OS === 'web';

// interface FriendPickerProps {
//   selected: string[];
//   onToggle: (userId: string) => void;
//   onAddFriend?: () => void;
//   compact?: boolean;
// }

// // ─── Friend Row ──────────────────────────────────────────────
// function FriendRow({
//   friend,
//   isSelected,
//   onToggle,
// }: {
//   friend: Friend;
//   isSelected: boolean;
//   onToggle: (userId: string) => void;
// }) {
//   const theme = useTheme();

//   return (
//     <Animated.View entering={FadeInDown.springify().damping(18)} layout={Layout.springify()}>
//       <InteractiveWrapper
//         onPress={() => {
//           haptics.light();
//           onToggle(friend.userId);
//         }}
//       >
//         <View
//           style={[
//             rowStyles(theme).container,
//             isSelected && rowStyles(theme).containerSelected,
//           ]}
//         >
//           {/* Avatar */}
//           <Avatar
//             url={friend.photoURL}
//             fallback={friend.displayName?.charAt(0)?.toUpperCase() || '?'}
//             size="md"
//             ringColor={isSelected ? theme.colors.primary : undefined}
//           />

//           {/* Info */}
//           <View style={{ flex: 1, gap: 2 }}>
//             <Typography variant="bodySm" weight="bold" color="textPrimary" numberOfLines={1}>
//               {friend.displayName}
//             </Typography>
//             {friend.tags && friend.tags.length > 0 && (
//               <Typography variant="caption" color="textTertiary" numberOfLines={1}>
//                 {friend.tags.slice(0, 2).join(', ')}
//               </Typography>
//             )}
//           </View>

//           {/* Check Circle */}
//           <View
//             style={[
//               rowStyles(theme).checkCircle,
//               isSelected && rowStyles(theme).checkCircleSelected,
//             ]}
//           >
//             {isSelected && (
//               <AppIcon name="check" size={12} color={theme.colors.textInverse} />
//             )}
//           </View>
//         </View>
//       </InteractiveWrapper>
//     </Animated.View>
//   );
// }

// // ─── Main Component ──────────────────────────────────────────
// export function FriendPicker({
//   selected,
//   onToggle,
//   onAddFriend,
//   compact = false,
// }: FriendPickerProps) {
//   const theme = useTheme();
//   const { isDesktop } = useResponsive();

//   const [search, setSearch] = useState('');
//   const [friends, setFriends] = useState<Friend[]>(() => friendsService.getAll());
//   const [showAll, setShowAll] = useState(false);

//   const filteredFriends = useMemo(
//     () => (search ? friendsService.search(search) : friends),
//     [search, friends]
//   );

//   const displayFriends = useMemo(
//     () => (showAll ? filteredFriends : filteredFriends.slice(0, compact ? 4 : 8)),
//     [showAll, filteredFriends, compact]
//   );

//   const handleClearAll = useCallback(() => {
//     haptics.light();
//     selected.forEach((id) => onToggle(id));
//   }, [selected, onToggle]);

//   const renderFriend = useCallback(
//     ({ item }: { item: Friend }) => (
//       <FriendRow
//         friend={item}
//         isSelected={selected.includes(item.userId)}
//         onToggle={onToggle}
//       />
//     ),
//     [selected, onToggle]
//   );

//   const keyExtractor = useCallback(
//     (item: Friend) => item.userId || item.id || item.displayName,
//     []
//   );

//   return (
//     <View style={{ gap: theme.spacing.md }}>
//       {/* Header */}
//       <View>
//         <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//           Select Friends
//         </Typography>
//       </View>

//       {/* Search */}
//       <SearchBar
//         value={search}
//         onChangeText={setSearch}
//         onClear={() => setSearch('')}
//         placeholder="Search friends…"
//       />

//       {/* Selected Count + Clear */}
//       {selected.length > 0 && (
//         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//           <Badge label={`${selected.length} selected`} variant="primary" />
//           <InteractiveWrapper onPress={handleClearAll}>
//             <View style={{ paddingVertical: 4, paddingHorizontal: 8 }}>
//               <Typography variant="caption" weight="bold" color="danger">
//                 Clear All
//               </Typography>
//             </View>
//           </InteractiveWrapper>
//         </View>
//       )}

//       {/* Friend List */}
//       <FlatList
//         data={displayFriends}
//         keyExtractor={keyExtractor}
//         renderItem={renderFriend}
//         scrollEnabled={false}
//         contentContainerStyle={{ gap: theme.spacing.sm }}
//         ListEmptyComponent={
//           <EmptyState
//             icon="👥"
//             title={search ? 'No friends found' : 'No friends yet'}
//             description={
//               search
//                 ? 'Try a different search term.'
//                 : 'Add friends to quickly split expenses.'
//             }
//             actionLabel={onAddFriend ? 'Add Friends' : undefined}
//             onAction={onAddFriend}
//           />
//         }
//       />

//       {/* Show More / Less */}
//       {filteredFriends.length > displayFriends.length && (
//         <InteractiveWrapper
//           onPress={() => {
//             haptics.light();
//             setShowAll(!showAll);
//           }}
//         >
//           <View style={{ alignItems: 'center', paddingVertical: theme.spacing.sm }}>
//             <Typography variant="bodySm" weight="bold" color="primary">
//               {showAll
//                 ? 'Show Less ↑'
//                 : `Show All (${filteredFriends.length}) ↓`}
//             </Typography>
//           </View>
//         </InteractiveWrapper>
//       )}
//     </View>
//   );
// }

// // ─── Row Styles ──────────────────────────────────────────────
// function rowStyles(theme: Theme) {
//   return StyleSheet.create({
//     container: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       gap: theme.spacing.md,
//       paddingVertical: theme.spacing.md,
//       paddingHorizontal: theme.spacing.lg,
//       borderRadius: theme.borderRadius.xl,
//       backgroundColor: theme.colors.primaryBg,
//       borderWidth: 1,
//       borderColor: theme.colors.borderLight,
//     },
//     containerSelected: {
//       borderColor: theme.colors.primary,
//       backgroundColor: theme.colors.primaryBg,
//     },
//     checkCircle: {
//       width: 24,
//       height: 24,
//       borderRadius: 12,
//       borderWidth: 2,
//       borderColor: theme.colors.borderStrong,
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     checkCircleSelected: {
//       backgroundColor: theme.colors.primary,
//       borderColor: theme.colors.primary,
//     },
//   });
// }
