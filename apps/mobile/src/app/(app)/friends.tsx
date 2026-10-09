// app/(app)/friends.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  SlideInRight,
  SlideOutRight,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { FriendSidebar } from '../../components/friends/FriendSidebar';
import { FriendDetailsPanel } from '../../components/friends/FriendDetailsPanel';
import { SendRequestModal } from '../../components/friends/SendRequestModal';
import { useSendFriendRequest } from '../../hooks/useFriends';
import AppIcon from '../../components/common/AppIcon';
import type { Theme } from '../../theme';

export default function FriendsScreen() {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Responsive Layout breakpoints
  const isSplitView = width >= 768;
  const isWideDesktop = width >= 1180;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [requestModalUser, setRequestModalUser] = useState<any>(null);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

  const { mutate: sendRequest, isPending: sending } = useSendFriendRequest();

  const handleSelectFriend = (userId: string) => {
    setSelectedUserId(userId);
    if (!isSplitView) {
      setIsMobileDetailsOpen(true);
    }
  };

  const handleSendRequest = (message: string) => {
    if (requestModalUser) {
      sendRequest(
        { toUserId: requestModalUser.userId, message },
        {
          onSuccess: () => {
            setRequestModalUser(null);
          },
        },
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      <View style={[styles.mainWrapper, isSplitView && styles.splitWrapper]}>
        <View
          style={[
            styles.contentLayout,
            { paddingTop: Platform.OS === 'web' ? 16 : insets.top + 10 },
          ]}
        >
          {/* ── LEFT BENTO COLUMN: Friends List & Discovery Sidebar (≈30% Rail) ── */}
          <View
            style={[styles.sidebarCol, isSplitView && styles.sidebarColSplit]}
          >
            <View
              style={[
                styles.sidebarSurface,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(15, 23, 42, 0.88)'
                    : 'rgba(255, 255, 255, 0.92)',
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(15,23,42,0.06)',
                },
              ]}
            >
              <FriendSidebar
                selectedUserId={selectedUserId}
                onSelectFriend={handleSelectFriend}
                onRequestModal={setRequestModalUser}
              />
            </View>
          </View>

          {/* ── RIGHT BENTO COLUMN: Detailed Profile & Shared Ledger (≈70% Workspace) ── */}
          {isSplitView && (
            <View style={styles.detailsCol}>
              <View
                style={[
                  styles.detailsSurface,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(15, 23, 42, 0.88)'
                      : 'rgba(255, 255, 255, 0.92)',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(15,23,42,0.06)',
                  },
                ]}
              >
                {selectedUserId ? (
                  <FriendDetailsPanel userId={selectedUserId} />
                ) : (
                  <View style={styles.unselectedPlaceholder}>
                    <View
                      style={[
                        styles.placeholderIconAura,
                        { backgroundColor: `${theme.colors.primary}15` },
                      ]}
                    >
                      <AppIcon
                        name="users"
                        size={36}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Animated.Text
                      entering={FadeIn.duration(200)}
                      style={[
                        styles.placeholderTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      Select a Travel Companion
                    </Animated.Text>
                    <Animated.Text
                      entering={FadeIn.duration(200).delay(50)}
                      style={[
                        styles.placeholderSub,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Choose a friend on the left to view shared expeditions,
                      collaborative balances, and travel synergy.
                    </Animated.Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── MOBILE DETAILS MODAL ── */}
      {!isSplitView && (
        <Modal
          visible={isMobileDetailsOpen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsMobileDetailsOpen(false)}
          statusBarTranslucent
        >
          <View
            style={{
              flex: 1,
              backgroundColor: theme.colors.background,
              paddingTop: insets.top,
            }}
          >
            <FriendDetailsPanel
              userId={selectedUserId}
              onClose={() => setIsMobileDetailsOpen(false)}
            />
          </View>
        </Modal>
      )}

      {/* ── SEND REQUEST MODAL ── */}
      <SendRequestModal
        visible={!!requestModalUser}
        onClose={() => setRequestModalUser(null)}
        onSend={handleSendRequest}
        user={requestModalUser}
        isPending={sending}
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    mainWrapper: {
      flex: 1,
      width: '100%',
    },
    splitWrapper: {
      maxWidth: 1560,
      alignSelf: 'center',
      paddingHorizontal: 20,
    },
    contentLayout: {
      flex: 1,
      flexDirection: 'row',
      gap: 18,
      paddingBottom: 20,
    },
    sidebarCol: {
      flex: 1,
      height: '100%',
    },
    sidebarColSplit: {
      flex: 0,
      width: '32%',
      minWidth: 320,
      maxWidth: 420,
    },
    sidebarSurface: {
      flex: 1,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      padding: 16,

      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
        } as any,

        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 6,
        },
      }),
    },
    detailsCol: {
      flex: 1,
      height: '100%',
      minWidth: 0,
    },
    detailsSurface: {
      flex: 1,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,

      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
        } as any,

        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 6,
        },
      }),
    },

    // Unselected State Placeholder
    unselectedPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      gap: 12,
    },
    placeholderIconAura: {
      width: 76,
      height: 76,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    placeholderTitle: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    placeholderSub: {
      fontSize: 14,
      textAlign: 'center',
      maxWidth: 360,
      lineHeight: 20,
      fontWeight: '500',
    },
  });
}
