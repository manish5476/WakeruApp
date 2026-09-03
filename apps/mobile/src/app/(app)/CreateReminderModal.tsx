import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { remindersApi } from '../../services/api/reminders.api';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

import GlobalLoader from '../../components/common/GlobalLoader';
import AppIcon from '../../components/common/AppIcon';
import { Typography } from '../../components/ui/Typography';
import type { Theme } from '../../theme';

interface CreateReminderModalProps {
  visible: boolean;
  onClose: () => void;
  prefill?: {
    targetUserId?: string;
    targetUserName?: string;
    tripId?: string;
    tripName?: string;
    amount?: number;
    expenseTitle?: string;
  };
}

export function CreateReminderModal({
  visible,
  onClose,
  prefill,
}: CreateReminderModalProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const queryClient = useQueryClient();

  // ── FORM STATE ────────────────────────────────────
  const [type, setType] = useState<
    'payment' | 'settlement' | 'budget' | 'custom'
  >(prefill?.targetUserId ? 'payment' : 'custom');
  const [title, setTitle] = useState(prefill?.expenseTitle || '');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(prefill?.amount?.toString() || '');
  const [frequency, setFrequency] = useState('daily');
  const [customDays, setCustomDays] = useState('3');
  const [escalationInterval, setEscalationInterval] = useState('3');

  const [targetUserId, setTargetUserId] = useState(prefill?.targetUserId || '');
  const [targetUserName, setTargetUserName] = useState(
    prefill?.targetUserName || '',
  );
  const [showUserPicker, setShowUserPicker] = useState(false);

  const [tripId, setTripId] = useState(prefill?.tripId || '');
  const [tripName, setTripName] = useState(prefill?.tripName || '');
  const [showTripPicker, setShowTripPicker] = useState(false);

  // ── DATA ──────────────────────────────────────────
  const { data: friendsData } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { friendsApi } = await import('../../services/api/friends.api');
      return friendsApi.getFriends();
    },
    enabled: showUserPicker,
  });

  const { data: tripsData } = useQuery({
    queryKey: ['active-trips'],
    queryFn: async () => {
      const { tripsApi } = await import('../../services/api/trips.api');
      return tripsApi.getMyTrips({ status: 'active' });
    },
    enabled: showTripPicker,
  });

  const friends =
    (Array.isArray(friendsData?.data)
      ? friendsData.data
      : friendsData?.data?.friends) || [];
  const trips =
    (Array.isArray(tripsData?.data)
      ? tripsData.data
      : tripsData?.data?.trips) || [];

  // ── MUTATION ──────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => remindersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      haptics.success();
      resetForm();
      onClose();
    },
    onError: (err: any) =>
      Alert.alert('Error', err.message || 'Failed to create reminder'),
  });

  // ── HANDLERS ──────────────────────────────────────
  const resetForm = () => {
    setType('custom');
    setTitle('');
    setMessage('');
    setAmount('');
    setFrequency('daily');
    setCustomDays('3');
    setEscalationInterval('3');
    setTargetUserId('');
    setTargetUserName('');
    setTripId('');
    setTripName('');
  };

  const handleSelectUser = (userId: string, userName: string) => {
    haptics.light();
    setTargetUserId(userId);
    setTargetUserName(userName);
    setShowUserPicker(false);
    if (type === 'custom') setType('payment');
  };

  const handleSelectTrip = (id: string, name: string) => {
    haptics.light();
    setTripId(id);
    setTripName(name);
    setShowTripPicker(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a reminder title');
      return;
    }

    let finalMessage = message.trim();
    if (!finalMessage && targetUserName && amount) {
      finalMessage = `Hey! Just a reminder to settle ₹${parseInt(amount).toLocaleString()}${tripName ? ` for ${tripName}` : ''}.`;
    } else if (!finalMessage) {
      finalMessage = title.trim();
    }

    createMutation.mutate({
      type,
      title: title.trim(),
      message: finalMessage,
      targetUserId: targetUserId || undefined,
      tripId: tripId || undefined,
      frequency,
      customDays:
        frequency === 'custom_days' ? parseInt(customDays) : undefined,
      escalationInterval: parseInt(escalationInterval) || 3,
    });
  };

  const handleTripSelectWithAutoTitle = (id: string, name: string) => {
    handleSelectTrip(id, name);
    if (!title.trim()) {
      setTitle(`Payment for ${name}`);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalContent}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Typography variant="h2" weight="extrabold" color="textPrimary">
              {prefill?.targetUserId ? 'Send Payment Reminder' : 'New Reminder'}
            </Typography>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <AppIcon name="x" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── TYPE SELECTOR ──────────────────── */}
            <Typography
              variant="caption"
              weight="bold"
              color="textSecondary"
              style={styles.label}
            >
              REMINDER TYPE
            </Typography>
            <View style={styles.chipRow}>
              {(
                [
                  { key: 'payment', icon: 'credit-card', label: 'Payment' },
                  {
                    key: 'settlement',
                    icon: 'check-circle',
                    label: 'Settlement',
                  },
                  { key: 'budget', icon: 'pie-chart', label: 'Budget' },
                  { key: 'custom', icon: 'bell', label: 'Custom' },
                ] as const
              ).map(({ key, icon, label: lbl }) => (
                <Pressable
                  key={key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        type === key
                          ? theme.colors.primary
                          : theme.colors.primaryBg,
                      borderColor:
                        type === key ? theme.colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setType(key);
                  }}
                >
                  <AppIcon
                    name={icon}
                    size={13}
                    color={
                      type === key
                        ? theme.colors.textInverse
                        : theme.colors.primary
                    }
                  />
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color={type === key ? 'textInverse' : 'primary'}
                  >
                    {lbl}
                  </Typography>
                </Pressable>
              ))}
            </View>

            {/* ── TARGET USER ────────────────────── */}
            <Typography
              variant="caption"
              weight="bold"
              color="textSecondary"
              style={styles.label}
            >
              WHO TO REMIND{' '}
              {!targetUserId && (
                <Typography
                  variant="caption"
                  weight="normal"
                  color="textTertiary"
                >
                  {' '}
                  (optional)
                </Typography>
              )}
            </Typography>
            {targetUserId ? (
              <View
                style={[
                  styles.selectedPill,
                  {
                    backgroundColor: theme.colors.primaryBg,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatarSmall,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="black"
                    color="textInverse"
                  >
                    {targetUserName?.charAt(0)?.toUpperCase() || '?'}
                  </Typography>
                </View>
                <Typography
                  variant="bodySm"
                  weight="semibold"
                  color="primary"
                  style={{ flex: 1 }}
                >
                  {targetUserName}
                </Typography>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setTargetUserId('');
                    setTargetUserName('');
                  }}
                >
                  <AppIcon name="x" size={16} color={theme.colors.primary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.selectBtn, { borderColor: theme.colors.border }]}
                onPress={() => {
                  haptics.light();
                  setShowUserPicker(!showUserPicker);
                }}
              >
                <AppIcon
                  name="user-plus"
                  size={16}
                  color={theme.colors.textTertiary}
                />
                <Typography
                  variant="bodySm"
                  weight="medium"
                  color="textTertiary"
                  style={{ flex: 1 }}
                >
                  Select a person to remind
                </Typography>
                <AppIcon
                  name="chevron-down"
                  size={16}
                  color={theme.colors.textTertiary}
                />
              </Pressable>
            )}

            {showUserPicker && (
              <View
                style={[
                  styles.pickerDropdown,
                  { borderColor: theme.colors.border },
                ]}
              >
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                  {friends.length === 0 ? (
                    <View style={styles.pickerEmpty}>
                      <Typography
                        variant="caption"
                        weight="medium"
                        color="textTertiary"
                        align="center"
                      >
                        No friends yet. Add friends to send reminders.
                      </Typography>
                    </View>
                  ) : (
                    friends.map((friend: any) => (
                      <Pressable
                        key={friend.userId}
                        style={[
                          styles.pickerItem,
                          { borderBottomColor: theme.colors.borderLight },
                        ]}
                        onPress={() =>
                          handleSelectUser(friend.userId, friend.displayName)
                        }
                      >
                        <View
                          style={[
                            styles.avatarSmall,
                            { backgroundColor: theme.colors.primaryBg },
                          ]}
                        >
                          <Typography
                            variant="caption"
                            weight="black"
                            color="primary"
                          >
                            {friend.displayName?.charAt(0)?.toUpperCase() ||
                              '?'}
                          </Typography>
                        </View>
                        <Typography
                          variant="bodySm"
                          weight="semibold"
                          color="textPrimary"
                          style={{ flex: 1 }}
                        >
                          {friend.displayName}
                        </Typography>
                        {friend.email && (
                          <Typography
                            variant="caption"
                            weight="medium"
                            color="textTertiary"
                          >
                            {friend.email}
                          </Typography>
                        )}
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* ── TRIP REFERENCE ──────────────────── */}
            <Typography
              variant="caption"
              weight="bold"
              color="textSecondary"
              style={styles.label}
            >
              TRIP REFERENCE{' '}
              {!tripId && (
                <Typography
                  variant="caption"
                  weight="normal"
                  color="textTertiary"
                >
                  {' '}
                  (optional)
                </Typography>
              )}
            </Typography>
            {tripId ? (
              <View
                style={[
                  styles.selectedPill,
                  {
                    backgroundColor: theme.colors.successBg,
                    borderColor: theme.colors.success,
                  },
                ]}
              >
                <AppIcon name="map" size={14} color={theme.colors.success} />
                <Typography
                  variant="bodySm"
                  weight="semibold"
                  color="success"
                  style={{ flex: 1 }}
                >
                  {tripName}
                </Typography>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setTripId('');
                    setTripName('');
                  }}
                >
                  <AppIcon name="x" size={16} color={theme.colors.success} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.selectBtn, { borderColor: theme.colors.border }]}
                onPress={() => {
                  haptics.light();
                  setShowTripPicker(!showTripPicker);
                }}
              >
                <AppIcon
                  name="map"
                  size={16}
                  color={theme.colors.textTertiary}
                />
                <Typography
                  variant="bodySm"
                  weight="medium"
                  color="textTertiary"
                  style={{ flex: 1 }}
                >
                  Link to a trip
                </Typography>
                <AppIcon
                  name="chevron-down"
                  size={16}
                  color={theme.colors.textTertiary}
                />
              </Pressable>
            )}

            {showTripPicker && (
              <View
                style={[
                  styles.pickerDropdown,
                  { borderColor: theme.colors.border },
                ]}
              >
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                  {trips.length === 0 ? (
                    <View style={styles.pickerEmpty}>
                      <Typography
                        variant="caption"
                        weight="medium"
                        color="textTertiary"
                        align="center"
                      >
                        No active trips
                      </Typography>
                    </View>
                  ) : (
                    trips.map((trip: any) => (
                      <Pressable
                        key={trip.tripId || trip._id}
                        style={[
                          styles.pickerItem,
                          { borderBottomColor: theme.colors.borderLight },
                        ]}
                        onPress={() =>
                          handleTripSelectWithAutoTitle(
                            trip.tripId || trip._id,
                            trip.title,
                          )
                        }
                      >
                        <Typography variant="body">🧳</Typography>
                        <View style={{ flex: 1 }}>
                          <Typography
                            variant="bodySm"
                            weight="semibold"
                            color="textPrimary"
                          >
                            {trip.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            weight="medium"
                            color="textTertiary"
                          >
                            {trip.memberCount || trip.members?.length || 1}{' '}
                            members
                          </Typography>
                        </View>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* ── AMOUNT ─────────────────────────── */}
            {(type === 'payment' || type === 'settlement') && (
              <>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={styles.label}
                >
                  AMOUNT{' '}
                  <Typography
                    variant="caption"
                    weight="normal"
                    color="textTertiary"
                  >
                    (optional)
                  </Typography>
                </Typography>
                <View
                  style={[
                    styles.amountInputRow,
                    { borderColor: theme.colors.border },
                  ]}
                >
                  <Typography
                    variant="h3"
                    weight="bold"
                    color="textTertiary"
                    style={styles.currencySymbol}
                  >
                    ₹
                  </Typography>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            {/* ── TITLE ──────────────────────────── */}
            <Typography
              variant="caption"
              weight="bold"
              color="textSecondary"
              style={styles.label}
            >
              TITLE *
            </Typography>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder={
                tripName
                  ? `Payment for ${tripName}`
                  : 'e.g., Settle Goa trip expenses'
              }
              placeholderTextColor={theme.colors.textTertiary}
            />

            {/* ── MESSAGE ────────────────────────── */}
            <Typography
              variant="caption"
              weight="bold"
              color="textSecondary"
              style={styles.label}
            >
              MESSAGE{' '}
              {!message && (
                <Typography
                  variant="caption"
                  weight="normal"
                  color="textTertiary"
                >
                  {' '}
                  (auto-generated if empty)
                </Typography>
              )}
            </Typography>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder={
                targetUserName && amount
                  ? `Hey! Just a reminder to settle ₹${parseInt(amount).toLocaleString()}${tripName ? ` for ${tripName}` : ''}.`
                  : 'Reminder message...'
              }
              placeholderTextColor={theme.colors.textTertiary}
              multiline
            />

            {/* ── FREQUENCY ──────────────────────── */}
            <Typography
              variant="caption"
              weight="bold"
              color="textSecondary"
              style={styles.label}
            >
              FREQUENCY
            </Typography>
            <View style={styles.chipRow}>
              {[
                { key: 'once', label: 'Once' },
                { key: 'daily', label: 'Daily' },
                { key: 'weekly', label: 'Weekly' },
                { key: 'monthly', label: 'Monthly' },
                { key: 'custom_days', label: 'Custom' },
              ].map(({ key, label: lbl }) => (
                <Pressable
                  key={key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        frequency === key
                          ? theme.colors.primary
                          : theme.colors.primaryBg,
                      borderColor:
                        frequency === key
                          ? theme.colors.primary
                          : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setFrequency(key);
                  }}
                >
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color={frequency === key ? 'textInverse' : 'primary'}
                  >
                    {lbl}
                  </Typography>
                </Pressable>
              ))}
            </View>

            {frequency === 'custom_days' && (
              <View style={styles.inlineRow}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={styles.label}
                >
                  Every
                </Typography>
                <TextInput
                  style={[
                    styles.smallInput,
                    {
                      color: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  value={customDays}
                  onChangeText={setCustomDays}
                  keyboardType="numeric"
                />
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={styles.label}
                >
                  days
                </Typography>
              </View>
            )}

            {/* ── ESCALATION ─────────────────────── */}
            <Typography
              variant="caption"
              weight="bold"
              color="textSecondary"
              style={styles.label}
            >
              ESCALATION (days between reminders)
            </Typography>
            <View style={styles.inlineRow}>
              {['1', '2', '3', '5', '7'].map(day => (
                <Pressable
                  key={day}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        escalationInterval === day
                          ? theme.colors.primary
                          : theme.colors.primaryBg,
                      borderColor:
                        escalationInterval === day
                          ? theme.colors.primary
                          : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setEscalationInterval(day);
                  }}
                >
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color={
                      escalationInterval === day ? 'textInverse' : 'primary'
                    }
                  >
                    {day}d
                  </Typography>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* ── ACTIONS ────────────────────────────── */}
          <View
            style={[
              styles.modalActions,
              { borderTopColor: theme.colors.borderLight },
            ]}
          >
            <Pressable
              style={[
                styles.modalBtn,
                styles.cancelBtn,
                { borderColor: theme.colors.border },
              ]}
              onPress={() => {
                haptics.light();
                onClose();
              }}
            >
              <Typography variant="bodySm" weight="bold" color="textSecondary">
                Cancel
              </Typography>
            </Pressable>
            <Pressable
              style={[
                styles.modalBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleSubmit}
              disabled={createMutation.isPending || !title.trim()}
            >
              {createMutation.isPending ? (
                <GlobalLoader
                  variant="inline"
                  color={theme.colors.textInverse}
                  size="small"
                />
              ) : (
                <>
                  <AppIcon
                    name="bell"
                    size={16}
                    color={theme.colors.textInverse}
                  />
                  <Typography
                    variant="bodySm"
                    weight="bold"
                    color="textInverse"
                  >
                    {targetUserId ? 'Send Reminder' : 'Create Reminder'}
                  </Typography>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.overlay,
    },
    modalContent: {
      borderTopLeftRadius: theme.borderRadius['3xl'],
      borderTopRightRadius: theme.borderRadius['3xl'],
      paddingHorizontal: theme.spacing[6],
      paddingBottom: theme.spacing[6],
      maxHeight: '90%',
      backgroundColor: theme.colors.surface,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.borderStrong,
      alignSelf: 'center',
      marginTop: theme.spacing[3],
      marginBottom: theme.spacing[4],
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[4],
    },
    closeBtn: {
      padding: theme.spacing[1],
    },
    modalScroll: {
      gap: theme.spacing[3.5],
    },

    // Labels
    label: {
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: theme.spacing[1.5],
      marginTop: theme.spacing[1],
    },

    // Chips
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[2],
      marginBottom: theme.spacing[1.5],
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[1.5],
      paddingHorizontal: theme.spacing[3.5],
      paddingVertical: theme.spacing[2],
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
    },

    // Select Button
    selectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2.5],
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing[3.5],
      paddingVertical: theme.spacing[3],
    },

    // Selected Pill
    selectedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
      paddingHorizontal: theme.spacing[3.5],
      paddingVertical: theme.spacing[2.5],
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
    },

    // Avatar
    avatarSmall: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Picker Dropdown
    pickerDropdown: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      marginTop: -4,
      marginBottom: theme.spacing[2],
    },
    pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2.5],
      paddingHorizontal: theme.spacing[3.5],
      paddingVertical: theme.spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pickerEmpty: {
      padding: theme.spacing[5],
      alignItems: 'center',
    },

    // Inputs
    input: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing[3.5],
      paddingVertical: theme.spacing[3],
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    amountInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing[3.5],
    },
    currencySymbol: {
      marginRight: theme.spacing[2],
    },
    amountInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      paddingVertical: theme.spacing[3],
    },
    smallInput: {
      width: 50,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      textAlign: 'center',
      paddingVertical: theme.spacing[2],
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    inlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2.5],
    },

    // Actions
    modalActions: {
      flexDirection: 'row',
      gap: theme.spacing[3],
      paddingTop: theme.spacing[4],
      marginTop: theme.spacing[4],
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    modalBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2],
      paddingVertical: theme.spacing[3.5],
      borderRadius: theme.borderRadius.xl,
    },
    cancelBtn: {
      borderWidth: 1,
    },
  });
}
