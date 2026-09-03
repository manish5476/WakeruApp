// components/friends/PremiumFriendCard.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { Avatar } from '../ui/Avatar';
import AppIcon from '../common/AppIcon';
import type { Theme } from '../../theme';

interface PremiumFriendCardProps {
  friend: any;
  isSelected?: boolean;
  onPress: () => void;
  onAction?: (action: 'message' | 'trip' | 'settle' | 'more') => void;
}

export function PremiumFriendCard({
  friend,
  isSelected,
  onPress,
  onAction,
}: PremiumFriendCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const balance = Number(friend.settlementBalance || 0);
  const hasBalance = balance !== 0;
  const isOwed = balance > 0;

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected
            ? `${theme.colors.primary}0D`
            : theme.colors.surface,
          borderColor: isSelected
            ? theme.colors.primary
            : theme.isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(15, 23, 42, 0.05)',
        },
        isSelected && styles.cardSelected,
        pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] },
      ]}
    >
      {/* Top Header: Avatar, Name & Context Menu */}
      <View style={styles.topRow}>
        <Avatar
          url={friend.photoURL}
          fallback={friend.displayName?.charAt(0)?.toUpperCase() || '?'}
          size="md"
          online={friend.isOnline}
        />

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.nameText, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {friend.displayName}
            </Text>
            {friend.isFavorite && (
              <AppIcon name="star" size={13} color="#F59E0B" />
            )}
          </View>
          <Text
            style={[styles.handleText, { color: theme.colors.textTertiary }]}
            numberOfLines={1}
          >
            {friend.email || `@${friend.username || 'traveler'}`}
          </Text>
        </View>

        {onAction && (
          <Pressable
            onPress={e => {
              e.stopPropagation();
              haptics.light();
              onAction('more');
            }}
            style={styles.moreBtn}
            hitSlop={8}
          >
            <AppIcon
              name="more-horizontal"
              size={16}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        )}
      </View>

      {/* Meta Stats & Ledger Strip */}
      <View style={styles.metaRow}>
        <View style={styles.statPill}>
          <AppIcon name="map-pin" size={11} color={theme.colors.primary} />
          <Text
            style={[styles.statText, { color: theme.colors.textSecondary }]}
          >
            {friend.totalSharedTrips || friend.tripsTogether || 0} Trips
          </Text>
        </View>

        <View
          style={[styles.dot, { backgroundColor: theme.colors.textTertiary }]}
        />

        <View style={styles.statPill}>
          <AppIcon name="globe" size={11} color="#06B6D4" />
          <Text
            style={[styles.statText, { color: theme.colors.textSecondary }]}
          >
            {friend.countries || 0} Countries
          </Text>
        </View>

        {hasBalance && (
          <>
            <View
              style={[
                styles.dot,
                { backgroundColor: theme.colors.textTertiary },
              ]}
            />
            <View
              style={[
                styles.balanceTag,
                {
                  backgroundColor: isOwed
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(239,68,68,0.12)',
                },
              ]}
            >
              <Text
                style={[
                  styles.balanceText,
                  { color: isOwed ? '#059669' : '#DC2626' },
                ]}
              >
                {isOwed ? '+' : '−'}₹{Math.abs(balance).toLocaleString('en-IN')}
              </Text>
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      gap: 10,

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
    cardSelected: {
      borderWidth: 1.5,

      ...Platform.select({
        web: {
          boxShadow: '0 6px 20px rgba(37,99,235,0.15)',
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
      alignItems: 'center',
      gap: 12,
    },
    infoCol: {
      flex: 1,
      gap: 2,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    nameText: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    handleText: {
      fontSize: 11,
      fontWeight: '500',
    },
    moreBtn: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.03)',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.03)',
    },
    statPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 11,
      fontWeight: '600',
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
    },
    balanceTag: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 'auto',
    },
    balanceText: {
      fontSize: 10,
      fontWeight: '800',
    },
  });
}
