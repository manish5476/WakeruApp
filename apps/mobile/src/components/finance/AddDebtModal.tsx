import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { useCreateDebt } from '../../hooks/useFinance';

import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { Avatar } from '../ui/Avatar';
import AppIcon from '../common/AppIcon';

import type { Theme } from '../../theme';

// ─── Constants ───────────────────────────────────────────────
const WEB = Platform.OS === 'web';
const SLIDE_UP_DISTANCE = 300;

interface AddDebtModalProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Main Component ──────────────────────────────────────────
export function AddDebtModal({ visible, onClose }: AddDebtModalProps) {
  const theme = useTheme();
  const styles = modalStyles(theme);

  // Form State
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [name, setName] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Animation
  const translateY = useSharedValue(SLIDE_UP_DISTANCE);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, theme.animation.easing.spring);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(SLIDE_UP_DISTANCE, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Data
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { friendsApi } = await import('../../services/api/friends.api');
      return friendsApi.getFriends();
    },
    enabled: visible,
  });

  const friends =
    (Array.isArray(friendsData?.data)
      ? friendsData.data
      : friendsData?.data?.friends) || [];

  const filteredFriends = friends.filter((friend: any) => {
    const friendName = friend.name || friend.username || '';
    return friendName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const { mutate: createDebt, isPending } = useCreateDebt();

  const handleSave = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedFriendId && !name.trim()) {
      Alert.alert('Error', 'Please select a friend or enter a name');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason or title for this debt');
      return;
    }

    haptics.medium();

    createDebt(
      {
        amount: Number(amount),
        type,
        reason,
        ...(selectedFriendId ? { friendUserId: selectedFriendId } : { name }),
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Debt added successfully!');
          resetForm();
          onClose();
        },
        onError: (err: any) => {
          Alert.alert('Error', err.message || 'Failed to add debt');
        },
      },
    );
  };

  const resetForm = () => {
    setType('lent');
    setAmount('');
    setReason('');
    setName('');
    setSelectedFriendId(null);
    setSearchQuery('');
  };

  const handleClose = () => {
    haptics.light();
    resetForm();
    onClose();
  };

  if (!visible) return null;

  const isValid =
    amount.trim().length > 0 &&
    !isNaN(Number(amount)) &&
    Number(amount) > 0 &&
    reason.trim().length > 0 &&
    (!!selectedFriendId || name.trim().length > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.overlay },
            backdropAnimatedStyle,
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View style={[styles.container, modalAnimatedStyle]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.colors.borderStrong },
                ]}
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Typography variant="h3" weight="bold" color="textPrimary">
                  Add Debt
                </Typography>
                <Typography
                  variant="bodySm"
                  color="textSecondary"
                  style={{ marginTop: theme.spacing[1] }}
                >
                  Track money you lent or borrowed
                </Typography>
              </View>
              <InteractiveWrapper onPress={handleClose} hoverElevation={false}>
                <View style={styles.closeBtn}>
                  <AppIcon
                    name="x"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </InteractiveWrapper>
            </View>

            {/* Form */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                gap: theme.spacing[5],
                paddingBottom: theme.spacing[5],
              }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Type Toggle */}
              <GlassCard variant="subtle" padding="xs">
                <View style={{ flexDirection: 'row', gap: theme.spacing[1] }}>
                  <InteractiveWrapper
                    onPress={() => {
                      haptics.light();
                      setType('lent');
                    }}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={[
                        styles.toggleBtn,
                        type === 'lent' && {
                          backgroundColor: theme.colors.success,
                          ...theme.shadows.sm,
                        },
                      ]}
                    >
                      <AppIcon
                        name="arrow-down"
                        size={16}
                        color={
                          type === 'lent'
                            ? theme.colors.textInverse
                            : theme.colors.textSecondary
                        }
                      />
                      <Typography
                        variant="bodySm"
                        weight="bold"
                        color={
                          type === 'lent' ? 'textInverse' : 'textSecondary'
                        }
                      >
                        I Lent
                      </Typography>
                    </View>
                  </InteractiveWrapper>
                  <InteractiveWrapper
                    onPress={() => {
                      haptics.light();
                      setType('borrowed');
                    }}
                    style={{ flex: 1 }}
                  >
                    <View
                      style={[
                        styles.toggleBtn,
                        type === 'borrowed' && {
                          backgroundColor: theme.colors.danger,
                          ...theme.shadows.sm,
                        },
                      ]}
                    >
                      <AppIcon
                        name="arrow-up"
                        size={16}
                        color={
                          type === 'borrowed'
                            ? theme.colors.textInverse
                            : theme.colors.textSecondary
                        }
                      />
                      <Typography
                        variant="bodySm"
                        weight="bold"
                        color={
                          type === 'borrowed' ? 'textInverse' : 'textSecondary'
                        }
                      >
                        I Borrowed
                      </Typography>
                    </View>
                  </InteractiveWrapper>
                </View>
              </GlassCard>

              {/* Amount */}
              <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textSecondary"
                  style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Amount
                </Typography>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="display"
                    weight="black"
                    color="textPrimary"
                    style={{ lineHeight: 1 }}
                  >
                    ₹
                  </Typography>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textTertiary}
                    autoFocus
                  />
                </View>
              </View>

              {/* Reason */}
              <View style={{ gap: theme.spacing[2] }}>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textSecondary"
                  style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  What is this for?
                </Typography>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: theme.colors.primaryBg,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <AppIcon
                    name="file-text"
                    size={18}
                    color={theme.colors.textTertiary}
                  />
                  <TextInput
                    style={styles.input}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="e.g., Dinner, Rent, Loan..."
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>
              </View>

              {/* Who is involved? */}
              <View style={{ gap: theme.spacing[3] }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color="textSecondary"
                    style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    Who is involved?
                  </Typography>
                  {friends.length > 0 && (
                    <View
                      style={[
                        styles.searchWrapper,
                        {
                          backgroundColor: theme.colors.primaryBg,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <AppIcon
                        name="search"
                        size={14}
                        color={theme.colors.textTertiary}
                      />
                      <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search..."
                        placeholderTextColor={theme.colors.textTertiary}
                      />
                    </View>
                  )}
                </View>

                {/* Friends List */}
                {friendsLoading ? (
                  <View
                    style={{
                      paddingVertical: theme.spacing[6],
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="bodySm" color="textTertiary">
                      Loading friends…
                    </Typography>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      gap: theme.spacing[3],
                      paddingHorizontal: theme.spacing[1],
                    }}
                  >
                    {filteredFriends.map((friend: any) => {
                      const isSelected = selectedFriendId === friend._id;
                      const friendName =
                        friend.name || friend.username || 'Friend';
                      const avatarUrl = friend.avatar || friend.photoURL;

                      return (
                        <InteractiveWrapper
                          key={friend._id}
                          onPress={() => {
                            haptics.light();
                            setSelectedFriendId(isSelected ? null : friend._id);
                            if (!isSelected) setName('');
                          }}
                        >
                          <View
                            style={[
                              styles.friendChip,
                              isSelected && {
                                borderColor: theme.colors.primary,
                                backgroundColor: `${theme.colors.primary}15`,
                              },
                            ]}
                          >
                            <Avatar
                              url={avatarUrl}
                              fallback={friendName.charAt(0).toUpperCase()}
                              size="lg"
                              ringColor={
                                isSelected ? theme.colors.primary : undefined
                              }
                            />
                            <Typography
                              variant="caption"
                              weight="semibold"
                              color={isSelected ? 'primary' : 'textPrimary'}
                              numberOfLines={1}
                              align="center"
                              style={{
                                marginTop: theme.spacing[2],
                                maxWidth: 72,
                              }}
                            >
                              {friendName}
                            </Typography>
                          </View>
                        </InteractiveWrapper>
                      );
                    })}
                    {filteredFriends.length === 0 && !friendsLoading && (
                      <View style={{ paddingVertical: theme.spacing[3] }}>
                        <Typography
                          variant="caption"
                          color="textTertiary"
                          style={{ fontStyle: 'italic' }}
                        >
                          No friends found
                        </Typography>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>

              {/* Manual Name */}
              {!selectedFriendId && (
                <View style={{ gap: theme.spacing[2] }}>
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color="textSecondary"
                    style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    Or enter manually
                  </Typography>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: theme.colors.primaryBg,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <AppIcon
                      name="user"
                      size={18}
                      color={theme.colors.textTertiary}
                    />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter name..."
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View
              style={[styles.footer, { borderTopColor: theme.colors.border }]}
            >
              <Button
                title="Save Debt"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleSave}
                disabled={!isValid || isPending}
                loading={isPending}
                leftIcon={
                  <AppIcon
                    name="check"
                    size={18}
                    color={theme.colors.textInverse}
                  />
                }
              />
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================================
// STYLES
// ============================================================

function modalStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius['3xl'],
      borderTopRightRadius: theme.borderRadius['3xl'],
      maxHeight: '90%',
      ...(WEB
        ? {
            width: 520,
            alignSelf: 'center',
            marginBottom: theme.spacing[5],
            borderRadius: theme.borderRadius['3xl'],
          }
        : {}),
    },
    handleContainer: {
      alignItems: 'center',
      paddingTop: theme.spacing[3],
      paddingBottom: theme.spacing[2],
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: theme.spacing[6],
      paddingBottom: theme.spacing[4],
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
    },
    toggleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2],
      paddingVertical: theme.spacing[3],
      borderRadius: theme.borderRadius.lg,
    },
    amountInput: {
      fontSize: theme.typography.fontSize['5xl'], // 48
      fontWeight: theme.typography.fontWeight.black, // 900
      minWidth: 150,
      padding: 0,
      marginLeft: theme.spacing[1],
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily.sans,
      textAlign: 'center',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing[4],
      minHeight: 52,
      gap: theme.spacing[3],
    },
    input: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm, // 14/15
      fontWeight: theme.typography.fontWeight.medium,
      height: '100%',
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily.sans,
    },
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing[2],
      height: 36,
      width: 150,
      gap: theme.spacing[2],
    },
    searchInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.xs, // 12/13
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily.sans,
    },
    friendChip: {
      alignItems: 'center',
      padding: theme.spacing[3],
      borderRadius: theme.borderRadius.xl,
      borderWidth: 2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primaryBg,
      width: 88,
    },
    footer: {
      padding: theme.spacing[6],
      paddingBottom:
        Platform.OS === 'ios' ? theme.spacing[10] : theme.spacing[6],
      borderTopWidth: 1,
    },
  });
}

// // components/finance/AddDebtModal.tsx
// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   Modal,
//   TextInput,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   Image,
//   Pressable,
// } from 'react-native';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withSpring,
//   withTiming,
//   FadeInUp,
// } from 'react-native-reanimated';
// import { useQuery } from '@tanstack/react-query';

// import { useTheme } from '../../providers/ThemeProvider';
// import { haptics } from '../../utils/haptics';
// import { useCreateDebt } from '../../hooks/useFinance';

// import { GlassCard } from '../ui/GlassCard';
// import { Typography } from '../ui/Typography';
// import { Badge } from '../ui/Badge';
// import { Button } from '../ui/Button';
// import { InteractiveWrapper } from '../ui/InteractiveWrapper';
// import { IconButton } from '../ui/IconButton';
// import { Avatar } from '../ui/Avatar';
// import AppIcon from '../common/AppIcon';

// import type { Theme } from '../../theme';

// // ─── Constants ───────────────────────────────────────────────
// const WEB = Platform.OS === 'web';

// interface AddDebtModalProps {
//   visible: boolean;
//   onClose: () => void;
// }

// // ─── Main Component ──────────────────────────────────────────
// export function AddDebtModal({ visible, onClose }: AddDebtModalProps) {
//   const theme = useTheme();

//   // Form State
//   const [type, setType] = useState<'lent' | 'borrowed'>('lent');
//   const [amount, setAmount] = useState('');
//   const [reason, setReason] = useState('');
//   const [name, setName] = useState('');
//   const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');

//   // Animation
//   const translateY = useSharedValue(300);
//   const backdropOpacity = useSharedValue(0);

//   useEffect(() => {
//     if (visible) {
//       translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
//       backdropOpacity.value = withTiming(1, { duration: 250 });
//     } else {
//       translateY.value = withTiming(300, { duration: 200 });
//       backdropOpacity.value = withTiming(0, { duration: 200 });
//     }
//   }, [visible]);

//   const modalAnimatedStyle = useAnimatedStyle(() => ({
//     transform: [{ translateY: translateY.value }],
//   }));

//   const backdropAnimatedStyle = useAnimatedStyle(() => ({
//     opacity: backdropOpacity.value,
//   }));

//   // Data
//   const { data: friendsData, isLoading: friendsLoading } = useQuery({
//     queryKey: ['friends'],
//     queryFn: async () => {
//       const { friendsApi } = await import('../../services/api/friends.api');
//       return friendsApi.getFriends();
//     },
//     enabled: visible,
//   });

//   const friends =
//     (Array.isArray(friendsData?.data) ? friendsData.data : friendsData?.data?.friends) || [];

//   const filteredFriends = friends.filter((friend: any) => {
//     const friendName = friend.name || friend.username || '';
//     return friendName.toLowerCase().includes(searchQuery.toLowerCase());
//   });

//   const { mutate: createDebt, isPending } = useCreateDebt();

//   const handleSave = () => {
//     if (!amount || isNaN(Number(amount))) {
//       Alert.alert('Error', 'Please enter a valid amount');
//       return;
//     }
//     if (!selectedFriendId && !name.trim()) {
//       Alert.alert('Error', 'Please select a friend or enter a name');
//       return;
//     }
//     if (!reason.trim()) {
//       Alert.alert('Error', 'Please enter a reason or title for this debt');
//       return;
//     }

//     haptics.medium();

//     createDebt(
//       {
//         amount: Number(amount),
//         type,
//         reason,
//         ...(selectedFriendId ? { friendUserId: selectedFriendId } : { name }),
//       },
//       {
//         onSuccess: () => {
//           Alert.alert('Success', 'Debt added successfully!');
//           resetForm();
//           onClose();
//         },
//         onError: (err: any) => {
//           Alert.alert('Error', err.message || 'Failed to add debt');
//         },
//       }
//     );
//   };

//   const resetForm = () => {
//     setType('lent');
//     setAmount('');
//     setReason('');
//     setName('');
//     setSelectedFriendId(null);
//     setSearchQuery('');
//   };

//   const handleClose = () => {
//     resetForm();
//     onClose();
//   };

//   if (!visible) return null;

//   const isValid =
//     amount.trim().length > 0 &&
//     !isNaN(Number(amount)) &&
//     Number(amount) > 0 &&
//     reason.trim().length > 0 &&
//     (!!selectedFriendId || name.trim().length > 0);

//   return (
//     <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
//       <View style={styles.overlay}>
//         {/* Backdrop */}
//         <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }, backdropAnimatedStyle]}>
//           <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
//         </Animated.View>

//         {/* Modal Content */}
//         <Animated.View
//           style={[
//             modalStyles(theme).container,
//             modalAnimatedStyle,
//           ]}
//         >
//           <KeyboardAvoidingView
//             behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//             style={{ flex: 1 }}
//           >
//             {/* Handle */}
//             <View style={modalStyles(theme).handleContainer}>
//               <View style={[modalStyles(theme).handle, { backgroundColor: theme.colors.borderStrong }]} />
//             </View>

//             {/* Header */}
//             <View style={modalStyles(theme).header}>
//               <View>
//                 <Typography variant="h3" weight="bold" color="textPrimary">
//                   Add Debt
//                 </Typography>
//                 <Typography variant="bodySm" color="textSecondary" style={{ marginTop: 2 }}>
//                   Track money you lent or borrowed
//                 </Typography>
//               </View>
//               <IconButton
//                 icon={<AppIcon name="x" size={20} color={theme.colors.textPrimary} />}
//                 size="sm"
//                 variant="ghost"
//                 onPress={handleClose}
//               />
//             </View>

//             {/* Form */}
//             <ScrollView
//               showsVerticalScrollIndicator={false}
//               contentContainerStyle={{ gap: theme.spacing.xl, paddingBottom: theme.spacing.xl }}
//             >
//               {/* Type Toggle */}
//               <GlassCard variant="subtle" padding="xs">
//                 <View style={{ flexDirection: 'row', gap: 4 }}>
//                   <InteractiveWrapper
//                     onPress={() => {
//                       haptics.light();
//                       setType('lent');
//                     }}
//                     style={{ flex: 1 }}
//                   >
//                     <View
//                       style={[
//                         toggleStyles(theme).btn,
//                         type === 'lent' && toggleStyles(theme).btnActive,
//                         type === 'lent' && { backgroundColor: theme.colors.success },
//                       ]}
//                     >
//                       <AppIcon
//                         name="arrow-down"
//                         size={16}
//                         color={type === 'lent' ? theme.colors.textInverse : theme.colors.textSecondary}
//                       />
//                       <Typography
//                         variant="bodySm"
//                         weight="bold"
//                         color={type === 'lent' ? 'textInverse' : 'textSecondary'}
//                       >
//                         I Lent
//                       </Typography>
//                     </View>
//                   </InteractiveWrapper>
//                   <InteractiveWrapper
//                     onPress={() => {
//                       haptics.light();
//                       setType('borrowed');
//                     }}
//                     style={{ flex: 1 }}
//                   >
//                     <View
//                       style={[
//                         toggleStyles(theme).btn,
//                         type === 'borrowed' && toggleStyles(theme).btnActive,
//                         type === 'borrowed' && { backgroundColor: theme.colors.danger },
//                       ]}
//                     >
//                       <AppIcon
//                         name="arrow-up"
//                         size={16}
//                         color={type === 'borrowed' ? theme.colors.textInverse : theme.colors.textSecondary}
//                       />
//                       <Typography
//                         variant="bodySm"
//                         weight="bold"
//                         color={type === 'borrowed' ? 'textInverse' : 'textSecondary'}
//                       >
//                         I Borrowed
//                       </Typography>
//                     </View>
//                   </InteractiveWrapper>
//                 </View>
//               </GlassCard>

//               {/* Amount */}
//               <View style={{ alignItems: 'center', gap: theme.spacing.sm }}>
//                 <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                   Amount
//                 </Typography>
//                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
//                   <Typography variant="display" weight="extrabold" color="textPrimary">
//                     ₹
//                   </Typography>
//                   <TextInput
//                     style={amountStyles(theme).input}
//                     value={amount}
//                     onChangeText={setAmount}
//                     keyboardType="decimal-pad"
//                     placeholder="0.00"
//                     placeholderTextColor={theme.colors.textTertiary}
//                     autoFocus
//                   />
//                 </View>
//               </View>

//               {/* Reason */}
//               <View style={{ gap: theme.spacing.xs }}>
//                 <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                   What is this for?
//                 </Typography>
//                 <View style={[inputStyles(theme).wrapper, { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.borderLight }]}>
//                   <AppIcon name="file-text" size={18} color={theme.colors.textSecondary} />
//                   <TextInput
//                     style={inputStyles(theme).input}
//                     value={reason}
//                     onChangeText={setReason}
//                     placeholder="e.g., Dinner, Rent, Loan..."
//                     placeholderTextColor={theme.colors.textTertiary}
//                   />
//                 </View>
//               </View>

//               {/* Who is involved? */}
//               <View style={{ gap: theme.spacing.md }}>
//                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//                   <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Who is involved?
//                   </Typography>
//                   {friends.length > 0 && (
//                     <View style={[inputStyles(theme).searchWrapper, { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.borderLight }]}>
//                       <AppIcon name="search" size={12} color={theme.colors.textTertiary} />
//                       <TextInput
//                         style={inputStyles(theme).searchInput}
//                         value={searchQuery}
//                         onChangeText={setSearchQuery}
//                         placeholder="Search..."
//                         placeholderTextColor={theme.colors.textTertiary}
//                       />
//                     </View>
//                   )}
//                 </View>

//                 {/* Friends List */}
//                 {friendsLoading ? (
//                   <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
//                     <Typography variant="bodySm" color="textTertiary">Loading friends…</Typography>
//                   </View>
//                 ) : (
//                   <ScrollView
//                     horizontal
//                     showsHorizontalScrollIndicator={false}
//                     contentContainerStyle={{ gap: theme.spacing.md }}
//                   >
//                     {filteredFriends.map((friend: any) => {
//                       const isSelected = selectedFriendId === friend._id;
//                       const friendName = friend.name || friend.username || 'Friend';
//                       const avatarUrl = friend.avatar || friend.photoURL;

//                       return (
//                         <InteractiveWrapper
//                           key={friend._id}
//                           onPress={() => {
//                             haptics.light();
//                             setSelectedFriendId(isSelected ? null : friend._id);
//                             if (!isSelected) setName('');
//                           }}
//                         >
//                           <View
//                             style={[
//                               friendStyles(theme).chip,
//                               isSelected && friendStyles(theme).chipSelected,
//                             ]}
//                           >
//                             <Avatar
//                               url={avatarUrl}
//                               fallback={friendName.charAt(0).toUpperCase()}
//                               size="lg"
//                               ringColor={isSelected ? theme.colors.primary : undefined}
//                             />
//                             <Typography
//                               variant="caption"
//                               weight="semibold"
//                               color={isSelected ? 'primary' : 'textPrimary'}
//                               numberOfLines={1}
//                               align="center"
//                               style={{ marginTop: theme.spacing.sm, maxWidth: 72 }}
//                             >
//                               {friendName}
//                             </Typography>
//                           </View>
//                         </InteractiveWrapper>
//                       );
//                     })}
//                     {filteredFriends.length === 0 && !friendsLoading && (
//                       <View style={{ paddingVertical: theme.spacing.md }}>
//                         <Typography variant="caption" color="textTertiary" style={{ fontStyle: 'italic' }}>
//                           No friends found
//                         </Typography>
//                       </View>
//                     )}
//                   </ScrollView>
//                 )}
//               </View>

//               {/* Manual Name */}
//               {!selectedFriendId && (
//                 <View style={{ gap: theme.spacing.xs }}>
//                   <Typography variant="caption" weight="semibold" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
//                     Or enter manually
//                   </Typography>
//                   <View style={[inputStyles(theme).wrapper, { backgroundColor: theme.colors.primaryBg, borderColor: theme.colors.borderLight }]}>
//                     <AppIcon name="user" size={18} color={theme.colors.textSecondary} />
//                     <TextInput
//                       style={inputStyles(theme).input}
//                       value={name}
//                       onChangeText={setName}
//                       placeholder="Enter name..."
//                       placeholderTextColor={theme.colors.textTertiary}
//                     />
//                   </View>
//                 </View>
//               )}
//             </ScrollView>

//             {/* Footer */}
//             <View style={[footerStyles(theme).container, { borderTopColor: theme.colors.borderLight }]}>
//               <Button
//                 title="Save Debt"
//                 variant="primary"
//                 size="lg"
//                 fullWidth
//                 onPress={handleSave}
//                 disabled={!isValid || isPending}
//                 loading={isPending}
//                 leftIcon={<AppIcon name="check" size={18} color={theme.colors.textInverse} />}
//               />
//             </View>
//           </KeyboardAvoidingView>
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     justifyContent: 'flex-end',
//   },
// });

// // ─── Modal Styles ────────────────────────────────────────────
// function modalStyles(theme: Theme) {
//   return StyleSheet.create({
//     container: {
//       backgroundColor: theme.colors.surface,
//       borderTopLeftRadius: theme.borderRadius['3xl'],
//       borderTopRightRadius: theme.borderRadius['3xl'],
//       maxHeight: '90%',
//       ...(WEB
//         ? {
//             width: 520,
//             alignSelf: 'center',
//             marginBottom: 20,
//             borderRadius: theme.borderRadius['3xl'],
//           }
//         : {}),
//     },
//     handleContainer: {
//       alignItems: 'center',
//       paddingTop: 12,
//       paddingBottom: 8,
//     },
//     handle: {
//       width: 40,
//       height: 5,
//       borderRadius: 3,
//     },
//     header: {
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'flex-start',
//       paddingHorizontal: 24,
//       paddingBottom: 16,
//     },
//   });
// }

// // ─── Toggle Styles ───────────────────────────────────────────
// function toggleStyles(theme: Theme) {
//   return StyleSheet.create({
//     btn: {
//       flex: 1,
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       gap: 8,
//       paddingVertical: 12,
//       borderRadius: theme.borderRadius.lg,
//     },
//     btnActive: {
//       shadowColor: '#000',
//       shadowOffset: { width: 0, height: 2 },
//       shadowOpacity: 0.15,
//       shadowRadius: 6,
//       elevation: 3,
//     },
//   });
// }

// // ─── Amount Styles ───────────────────────────────────────────
// function amountStyles(theme: Theme) {
//   return StyleSheet.create({
//     input: {
//       fontSize: 48,
//       fontWeight: '900',
//       minWidth: 150,
//       padding: 0,
//       marginLeft: 4,
//       color: theme.colors.textPrimary,
//       fontFamily: theme.typography.fontFamily.sans,
//       textAlign: 'center',
//     },
//   });
// }

// // ─── Input Styles ────────────────────────────────────────────
// function inputStyles(theme: Theme) {
//   return StyleSheet.create({
//     wrapper: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       borderWidth: 1,
//       borderRadius: theme.borderRadius.lg,
//       paddingHorizontal: 16,
//       height: 52,
//       gap: 12,
//     },
//     input: {
//       flex: 1,
//       fontSize: 15,
//       fontWeight: '500',
//       height: '100%',
//       color: theme.colors.textPrimary,
//       fontFamily: theme.typography.fontFamily.sans,
//     },
//     searchWrapper: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       borderWidth: 1,
//       borderRadius: theme.borderRadius.lg,
//       paddingHorizontal: 10,
//       height: 36,
//       width: 150,
//       gap: 6,
//     },
//     searchInput: {
//       flex: 1,
//       fontSize: 13,
//       color: theme.colors.textPrimary,
//       fontFamily: theme.typography.fontFamily.sans,
//     },
//   });
// }

// // ─── Friend Styles ───────────────────────────────────────────
// function friendStyles(theme: Theme) {
//   return StyleSheet.create({
//     chip: {
//       alignItems: 'center',
//       padding: 12,
//       borderRadius: theme.borderRadius.xl,
//       borderWidth: 2,
//       borderColor: theme.colors.borderLight,
//       backgroundColor: theme.colors.primaryBg,
//       width: 88,
//     },
//     chipSelected: {
//       borderColor: theme.colors.primary,
//       backgroundColor: theme.colors.primaryBg,
//     },
//   });
// }

// // ─── Footer Styles ───────────────────────────────────────────
// function footerStyles(theme: Theme) {
//   return StyleSheet.create({
//     container: {
//       padding: 24,
//       paddingBottom: Platform.OS === 'ios' ? 40 : 24,
//       borderTopWidth: 1,
//     },
//   });
// }
