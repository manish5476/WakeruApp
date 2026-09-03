// components/friends/SearchUserCard.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { Avatar } from '../ui/Avatar';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import type { Theme } from '../../theme';

interface SearchUserCardProps {
  user: any;
  onAdd: () => void;
  isPending: boolean;
}

export function SearchUserCard({
  user,
  onAdd,
  isPending,
}: SearchUserCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isConnected =
    user.isFriend ||
    user.hasPendingRequest ||
    user.incomingRequest ||
    user.outgoingRequest;

  const buttonConfig = useMemo(() => {
    if (user.isFriend)
      return {
        label: 'Friend',
        icon: 'check',
        isPrimary: false,
        disabled: true,
      };
    if (user.hasPendingRequest || user.outgoingRequest)
      return {
        label: 'Requested',
        icon: 'clock',
        isPrimary: false,
        disabled: true,
      };
    if (user.incomingRequest)
      return {
        label: 'Respond',
        icon: 'inbox',
        isPrimary: true,
        disabled: false,
      };
    return {
      label: 'Add Friend',
      icon: 'user-plus',
      isPrimary: true,
      disabled: false,
    };
  }, [user]);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Avatar
        url={user.photoURL}
        fallback={user.displayName?.charAt(0)?.toUpperCase() || '?'}
        size="md"
      />

      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.nameText, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {user.displayName}
          </Text>
          {(user.reason || user.isFriend) && (
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: theme.colors.textTertiary },
                ]}
              >
                {user.isFriend ? 'Companion' : user.reason}
              </Text>
            </View>
          )}
        </View>

        {user.email ? (
          <Text
            style={[styles.emailText, { color: theme.colors.textTertiary }]}
            numberOfLines={1}
          >
            {user.email}
          </Text>
        ) : (
          <Text
            style={[styles.emailText, { color: theme.colors.textTertiary }]}
          >
            Traveler on Wakeru
          </Text>
        )}
      </View>

      {/* Action Trigger */}
      <Pressable
        onPress={() => {
          if (!buttonConfig.disabled) {
            haptics.medium();
            onAdd();
          }
        }}
        disabled={isPending || buttonConfig.disabled}
        style={({ pressed }) => [
          styles.actionBtn,
          buttonConfig.isPrimary
            ? { backgroundColor: theme.colors.primary }
            : {
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
              },
          pressed &&
            !buttonConfig.disabled && {
              opacity: 0.85,
              transform: [{ scale: 0.98 }],
            },
        ]}
      >
        {isPending ? (
          <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
        ) : (
          <>
            <AppIcon
              name={buttonConfig.icon as any}
              size={13}
              color={
                buttonConfig.isPrimary ? '#FFFFFF' : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.actionBtnText,
                {
                  color: buttonConfig.isPrimary
                    ? '#FFFFFF'
                    : theme.colors.textSecondary,
                },
              ]}
            >
              {buttonConfig.label}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 18,
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
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    roleBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    roleBadgeText: {
      fontSize: 9,
      fontWeight: '700',
    },
    emailText: {
      fontSize: 11,
      fontWeight: '500',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    actionBtnText: {
      fontSize: 11,
      fontWeight: '800',
    },
  });
}
