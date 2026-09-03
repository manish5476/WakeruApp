// app/(app)/friends.tsx
import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
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
          {/* ── LEFT BENTO COLUMN: Friends List & Discovery Sidebar ── */}
          <View
            style={[
              styles.sidebarCol,
              isSplitView && {
                width: isWideDesktop ? 400 : 340,
                flex: undefined,
              },
            ]}
          >
            <FriendSidebar
              selectedUserId={selectedUserId}
              onSelectFriend={handleSelectFriend}
              onRequestModal={setRequestModalUser}
            />
          </View>

          {/* ── RIGHT BENTO COLUMN: Detailed Profile & Shared Ledger (Tablet/Desktop) ── */}
          {isSplitView && (
            <View style={styles.detailsCol}>
              <View
                style={[
                  styles.detailsSurface,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.06)'
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
                        { backgroundColor: `${theme.colors.primary}12` },
                      ]}
                    >
                      <AppIcon
                        name="users"
                        size={32}
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
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      View mutual trips, pending settlement balances, and
                      collaborative logs.
                    </Animated.Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── MOBILE SLIDE-OVER OVERLAY ── */}
          {!isSplitView && isMobileDetailsOpen && (
            <Animated.View
              entering={SlideInRight.duration(250)}
              exiting={SlideOutRight.duration(200)}
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: theme.colors.background,
                  zIndex: 100,
                  paddingTop: insets.top,
                },
              ]}
            >
              <FriendDetailsPanel
                userId={selectedUserId}
                onClose={() => setIsMobileDetailsOpen(false)}
              />
            </Animated.View>
          )}
        </View>
      </View>

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
      maxWidth: 1500,
      alignSelf: 'center',
      paddingHorizontal: 16,
    },
    contentLayout: {
      flex: 1,
      flexDirection: 'row',
      gap: 16,
      paddingBottom: 16,
    },
    sidebarCol: {
      flex: 1,
      height: '100%',
    },
    detailsCol: {
      flex: 1,
      height: '100%',
    },
    detailsSurface: {
      flex: 1,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,

      ...Platform.select({
        web: {
          boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
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

    // Unselected State Placeholder
    unselectedPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 10,
    },
    placeholderIconAura: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    placeholderTitle: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    placeholderSub: {
      fontSize: 13,
      textAlign: 'center',
      maxWidth: 320,
      lineHeight: 18,
      fontWeight: '500',
    },
  });
}
// // app/(app)/friends.tsx
// import React, { useState } from 'react';
// import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';

// import { useTheme } from '../../providers/ThemeProvider';
// import { GlobalBackground } from '../../components/ui/GlobalBackground';

// import { FriendSidebar } from '../../components/friends/FriendSidebar';
// import { FriendDetailsPanel } from '../../components/friends/FriendDetailsPanel';
// import { SendRequestModal } from '../../components/friends/SendRequestModal';
// import { useSendFriendRequest } from '../../hooks/useFriends';

// export default function FriendsScreen() {
//     const theme = useTheme();
//     const insets = useSafeAreaInsets();
//     const { width } = useWindowDimensions();

//     // Layout logic: Use split view on desktop/tablet (width > 768)
//     const isSplitView = width > 768;

//     const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
//     const [requestModalUser, setRequestModalUser] = useState<any>(null);
//     const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);

//     const { mutate: sendRequest, isPending: sending } = useSendFriendRequest();

//     const handleSelectFriend = (userId: string) => {
//         setSelectedUserId(userId);
//         if (!isSplitView) {
//             setIsMobileDetailsOpen(true);
//         }
//     };

//     const handleSendRequest = (message: string) => {
//         if (requestModalUser) {
//             sendRequest(
//                 { toUserId: requestModalUser.userId, message },
//                 {
//                     onSuccess: () => {
//                         setRequestModalUser(null);
//                     }
//                 }
//             );
//         }
//     };

//     return (
//         <View style={styles.container}>
//             <View style={StyleSheet.absoluteFill} pointerEvents="none">
//                 <GlobalBackground />
//             </View>

//             <View style={[styles.mainWrapper, isSplitView && styles.splitWrapper]}>
//                 {/* Content Layout */}
//                 <View style={[styles.contentLayout, { paddingTop: Platform.OS === 'web' ? 16 : insets.top + 12 }]}>

//                     {/* Left Sidebar */}
//                     <View style={[styles.sidebarCol, isSplitView && { width: '38%', maxWidth: 420 }]}>
//                         <FriendSidebar
//                             selectedUserId={selectedUserId}
//                             onSelectFriend={handleSelectFriend}
//                             onRequestModal={setRequestModalUser}
//                         />
//                     </View>

//                     {/* Right Details Panel (Desktop/Tablet Split View) */}
//                     {isSplitView && (
//                         <View style={[styles.detailsCol, { width: '62%' }]}>
//                             <View style={[
//                                 styles.detailsSurface,
//                                 {
//                                     backgroundColor: theme.colors.surface,
//                                     borderColor: theme.colors.borderLight,
//                                     borderRadius: theme.borderRadius['3xl']
//                                 }
//                             ]}>
//                                 <FriendDetailsPanel userId={selectedUserId} />
//                             </View>
//                         </View>
//                     )}

//                     {/* Mobile Details Overlay Slide-in */}
//                     {!isSplitView && isMobileDetailsOpen && (
//                         <Animated.View
//                             entering={SlideInRight}
//                             exiting={SlideOutRight}
//                             style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background, zIndex: 100 }]}
//                         >
//                             <FriendDetailsPanel
//                                 userId={selectedUserId}
//                                 onClose={() => setIsMobileDetailsOpen(false)}
//                             />
//                         </Animated.View>
//                     )}
//                 </View>
//             </View>

//             <SendRequestModal
//                 visible={!!requestModalUser}
//                 onClose={() => setRequestModalUser(null)}
//                 onSend={handleSendRequest}
//                 user={requestModalUser}
//                 isPending={sending}
//             />
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: 'transparent',
//     },
//     mainWrapper: {
//         flex: 1,
//         width: '100%',
//     },
//     splitWrapper: {
//         maxWidth: 1500,
//         alignSelf: 'center',
//         paddingHorizontal: 16,
//     },
//     contentLayout: {
//         flex: 1,
//         flexDirection: 'row',
//         gap: 16,
//     },
//     sidebarCol: {
//         flex: 1,
//         height: '100%',
//     },
//     detailsCol: {
//         height: '100%',
//         paddingBottom: 24,
//     },
//     detailsSurface: {
//         flex: 1,
//         overflow: 'hidden',
//         borderWidth: 1,
//     },
// });
