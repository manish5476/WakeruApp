// components/friends/RequestCard.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { useAuthStore } from '../../stores/auth.store';
import { Avatar } from '../ui/Avatar';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import { IFriendRequest } from '../../hooks/useFriends';
import type { Theme } from '../../theme';

interface RequestCardProps {
  request: IFriendRequest;
  onAccept: () => void;
  onDecline: () => void;
  isPending: boolean;
}

export function RequestCard({
  request,
  onAccept,
  onDecline,
  isPending,
}: RequestCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuthStore();

  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pulse.value * 4 }],
    opacity: 0.4 + pulse.value * 0.6,
  }));

  const currentUserId = user?.firebaseUid || '';
  const isIncoming = request.toUserId === currentUserId;

  const senderName = request.fromName || 'Traveler';
  const senderPhoto = request.fromPhotoURL;
  const receiverName = request.toName || 'Traveler';
  const receiverPhoto = request.toPhotoURL;

  let timeAgo = 'recently';
  try {
    timeAgo = formatDistanceToNow(new Date(request.createdAt), {
      addSuffix: true,
    });
  } catch {
    /* fallback */
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Top Type Badge & Time */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: isIncoming
                ? 'rgba(16,185,129,0.12)'
                : 'rgba(245,158,11,0.12)',
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isIncoming ? '#10B981' : '#F59E0B' },
            ]}
          />
          <Text
            style={[
              styles.typeBadgeText,
              { color: isIncoming ? '#059669' : '#D97706' },
            ]}
          >
            {isIncoming ? 'INCOMING INVITATION' : 'SENT REQUEST'}
          </Text>
        </View>

        <Text style={[styles.timeText, { color: theme.colors.textTertiary }]}>
          {timeAgo}
        </Text>
      </View>

      {/* Connection Visualizer */}
      <View
        style={[
          styles.visualizerBlock,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.userNode}>
          <Avatar
            url={senderPhoto}
            fallback={senderName.charAt(0).toUpperCase()}
            size="md"
            ringColor={!isIncoming ? theme.colors.primary : undefined}
          />
          <Text
            style={[styles.nodeName, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {!isIncoming ? 'You' : senderName.split(' ')[0]}
          </Text>
        </View>

        <View style={styles.connectorMiddle}>
          <View
            style={[
              styles.connectorLine,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.arrowCircle,
              { backgroundColor: theme.colors.surface },
              arrowAnimatedStyle,
            ]}
          >
            <AppIcon
              name="chevron-right"
              size={13}
              color={theme.colors.primary}
            />
          </Animated.View>
        </View>

        <View style={styles.userNode}>
          <Avatar
            url={receiverPhoto}
            fallback={receiverName.charAt(0).toUpperCase()}
            size="md"
            ringColor={isIncoming ? theme.colors.primary : undefined}
          />
          <Text
            style={[styles.nodeName, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {isIncoming ? 'You' : receiverName.split(' ')[0]}
          </Text>
        </View>
      </View>

      {/* Quoted Message */}
      {request.message ? (
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
            style={[styles.messageText, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            "{request.message}"
          </Text>
        </View>
      ) : null}

      {/* Actions */}
      {isIncoming && request.status === 'pending' ? (
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => {
              haptics.medium();
              onAccept();
            }}
            disabled={isPending}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.acceptBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            {isPending ? (
              <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
            ) : (
              <>
                <AppIcon name="check" size={14} color="#FFFFFF" />
                <Text style={styles.acceptBtnText}>Accept Request</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              haptics.light();
              onDecline();
            }}
            disabled={isPending}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.declineBtn,
              {
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.1)',
              },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <AppIcon name="x" size={14} color="#EF4444" />
            <Text style={styles.declineBtnText}>Decline</Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={[
            styles.pendingPill,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <AppIcon name="clock" size={13} color={theme.colors.textTertiary} />
          <Text
            style={[
              styles.pendingPillText,
              { color: theme.colors.textSecondary },
            ]}
          >
            {request.status === 'pending'
              ? 'Awaiting response from companion…'
              : request.status}
          </Text>
        </View>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
      gap: 12,

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
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    statusDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    typeBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    timeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    visualizerBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 16,
    },
    userNode: {
      alignItems: 'center',
      gap: 4,
      width: 70,
    },
    nodeName: {
      fontSize: 11,
      fontWeight: '700',
    },
    connectorMiddle: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      height: 32,
      marginHorizontal: 8,
    },
    connectorLine: {
      position: 'absolute',
      width: '100%',
      height: 2,
    },
    arrowCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
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
    actionRow: {
      flexDirection: 'row',
      gap: 8,
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
    pendingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
    },
    pendingPillText: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
}
