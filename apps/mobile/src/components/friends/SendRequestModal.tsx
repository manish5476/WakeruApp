// components/friends/SendRequestModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { Avatar } from '../ui/Avatar';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import type { Theme } from '../../theme';

interface SendRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  user: any;
  isPending: boolean;
}

export function SendRequestModal({
  visible,
  onClose,
  onSend,
  user,
  isPending,
}: SendRequestModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [message, setMessage] = useState(
    "Hey! Let's connect on Wakeru to plan trips & split costs.",
  );

  useEffect(() => {
    if (visible) {
      setMessage("Hey! Let's connect on Wakeru to plan trips & split costs.");
    }
  }, [visible]);

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={FadeInDown.duration(260).springify().damping(18)}
          style={styles.animatedWrap}
        >
          <View
            style={[styles.content, { backgroundColor: theme.colors.surface }]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleGroup}>
                <View
                  style={[
                    styles.headerIconAura,
                    { backgroundColor: `${theme.colors.primary}15` },
                  ]}
                >
                  <AppIcon
                    name="user-plus"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Send Invitation
                  </Text>
                  <Text
                    style={[
                      styles.modalSub,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Connect with your travel buddy
                  </Text>
                </View>
              </View>

              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <AppIcon
                  name="x"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Recipient Preview Card */}
            <View
              style={[
                styles.recipientCard,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Avatar
                url={user?.photoURL}
                fallback={user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                size="lg"
              />
              <View style={styles.recipientInfo}>
                <Text
                  style={[
                    styles.recipientName,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {user?.displayName || 'Traveler'}
                </Text>
                <Text
                  style={[
                    styles.recipientEmail,
                    { color: theme.colors.textTertiary },
                  ]}
                  numberOfLines={1}
                >
                  {user?.email || 'Wakeru explorer'}
                </Text>
              </View>
            </View>

            {/* Custom Invitation Message */}
            <View style={styles.inputSection}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.colors.textTertiary },
                ]}
              >
                OPTIONAL MESSAGE
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.colors.textPrimary }]}
                  placeholder="Write a greeting note..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={3}
                  maxLength={180}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={onClose}
                disabled={isPending}
                style={[
                  styles.cancelBtn,
                  { borderColor: theme.colors.borderLight },
                ]}
              >
                <Text
                  style={[
                    styles.cancelBtnText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.medium();
                  onSend(message);
                }}
                disabled={isPending}
                style={[
                  styles.sendBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                {isPending ? (
                  <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.sendBtnText}>Send Request</Text>
                    <AppIcon name="send" size={14} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    animatedWrap: {
      width: '100%',
      maxWidth: 440,
    },
    content: {
      width: '100%',
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      gap: 16,

      ...Platform.select({
        web: {
          boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
    },
    headerTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerIconAura: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    modalSub: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 1,
    },
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.03)',
    },

    // Recipient Card
    recipientCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
    },
    recipientInfo: {
      flex: 1,
      gap: 2,
    },
    recipientName: {
      fontSize: 14,
      fontWeight: '800',
    },
    recipientEmail: {
      fontSize: 11,
      fontWeight: '500',
    },

    // Input
    inputSection: {
      gap: 6,
    },
    inputLabel: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    inputWrap: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 12,
    },
    input: {
      fontSize: 13,
      fontWeight: '500',
      minHeight: 64,
      textAlignVertical: 'top',
      padding: 0,
    },

    // Actions
    actionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    cancelBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
    },
    cancelBtnText: {
      fontSize: 12,
      fontWeight: '700',
    },
    sendBtn: {
      flex: 1.4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 14,
    },
    sendBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
  });
}
