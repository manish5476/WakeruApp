import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { useCreateBill, useUpdateBill } from '../../hooks/useFinance';

import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import type { Theme } from '../../theme';

type BillFrequency = 'monthly' | 'yearly' | 'weekly' | 'daily';

// Aligned with the new premium palette
const PREDEFINED_CATEGORIES = [
  { name: 'Utilities', icon: 'zap', color: '#D4A03C' }, // Gold
  { name: 'Subscriptions', icon: 'tv', color: '#8B5CF6' }, // Violet
  { name: 'Rent', icon: 'home', color: '#06B6D4' }, // Cyan
  { name: 'Food', icon: 'utensils', color: '#F43F5E' }, // Rose
  { name: 'Transport', icon: 'car', color: '#06B6D4' }, // Cyan
  { name: 'Insurance', icon: 'shield', color: '#10B981' }, // Green
  { name: 'Other', icon: 'file-text', color: '#71717A' }, // Neutral
];

const FREQUENCIES: { key: BillFrequency; label: string }[] = [
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'daily', label: 'Daily' },
];

interface AddBillModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialBill?: any;
}

export function AddBillModal({
  visible,
  onClose,
  onSuccess,
  initialBill,
}: AddBillModalProps) {
  const theme = useTheme();
  const styles = modalStyles(theme);

  const { mutate: createBill, isPending: isCreating } = useCreateBill();
  const { mutate: updateBill, isPending: isUpdating } = useUpdateBill();
  const isPending = isCreating || isUpdating;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [category, setCategory] = useState('Utilities');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [autoPay, setAutoPay] = useState(false);
  const [reminderDays, setReminderDays] = useState('3');

  useEffect(() => {
    if (initialBill) {
      setTitle(initialBill.title || '');
      setAmount(initialBill.amount?.toString() || '');
      setDueDate(
        initialBill.dueDate ? new Date(initialBill.dueDate) : new Date(),
      );
      setFrequency((initialBill.frequency as BillFrequency) || 'monthly');
      const isPredefined = PREDEFINED_CATEGORIES.some(
        c => c.name === initialBill.category,
      );
      if (isPredefined) {
        setCategory(initialBill.category || 'Utilities');
        setShowCustomCategory(false);
      } else {
        setShowCustomCategory(true);
        setCustomCategory(initialBill.category || '');
      }
      setAutoPay(initialBill.autoPay || false);
      setReminderDays(initialBill.reminderDays?.toString() || '3');
    } else {
      setTitle('');
      setAmount('');
      setDueDate(new Date());
      setFrequency('monthly');
      setCategory('Utilities');
      setShowCustomCategory(false);
      setCustomCategory('');
      setAutoPay(false);
      setReminderDays('3');
    }
  }, [initialBill, visible]);

  const handleSave = () => {
    if (!title.trim() || !amount.trim() || isNaN(parseFloat(amount))) {
      alert('Please enter a valid bill name and amount');
      return;
    }
    haptics.medium();

    const finalCategory = showCustomCategory ? customCategory : category;

    const payload = {
      title: title.trim(),
      amount: parseFloat(amount),
      currency: 'INR',
      dueDate: dueDate.toISOString(),
      frequency,
      category: finalCategory || 'Other',
      autoPay,
      isActive: true,
      reminderDays: parseInt(reminderDays, 10) || 3,
    };

    const handleSuccess = () => {
      onClose();
      if (onSuccess) onSuccess();
    };

    const handleError = () => {
      alert(`Failed to ${initialBill ? 'update' : 'create'} bill`);
    };

    if (initialBill) {
      updateBill(
        { id: initialBill._id, data: payload },
        { onSuccess: handleSuccess, onError: handleError },
      );
    } else {
      createBill(payload, { onSuccess: handleSuccess, onError: handleError });
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={ZoomIn.duration(250).springify().damping(18)}
          style={styles.dialogContainer}
        >
          <GlassCard
            variant="prominent"
            padding="none"
            style={styles.card}
            intensity={theme.isDark ? 40 : 80}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.headerIconBubble,
                    {
                      backgroundColor: `${theme.colors.primary}18`,
                      borderColor: `${theme.colors.primary}30`,
                    },
                  ]}
                >
                  <AppIcon
                    name="file-text"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View>
                  <Typography variant="h3" weight="bold" color="textPrimary">
                    {initialBill ? 'Edit Recurring Bill' : 'Add Recurring Bill'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Track your upcoming payment deadlines
                  </Typography>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  haptics.light();
                  onClose();
                }}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.05)',
                  },
                ]}
                hitSlop={10}
              >
                <AppIcon
                  name="x"
                  size={16}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            {/* Scrollable Form Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Bill Name */}
              <View style={styles.fieldWrap}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing[1],
                  }}
                >
                  BILL NAME
                </Typography>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.85)',
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <AppIcon
                    name="file-text"
                    size={16}
                    color={theme.colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="e.g. Electricity, Netflix, Wifi"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
              </View>

              {/* Amount */}
              <View style={styles.fieldWrap}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing[1],
                  }}
                >
                  AMOUNT (₹)
                </Typography>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.85)',
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <AppIcon
                    name="banknote"
                    size={16}
                    color={theme.colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>
              </View>

              {/* Category Chips */}
              <View style={styles.fieldWrap}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing[1],
                  }}
                >
                  CATEGORY
                </Typography>
                <View style={styles.chipRow}>
                  {PREDEFINED_CATEGORIES.map(cat => {
                    const selected =
                      !showCustomCategory && category === cat.name;
                    return (
                      <Pressable
                        key={cat.name}
                        onPress={() => {
                          haptics.light();
                          setShowCustomCategory(false);
                          setCategory(cat.name);
                        }}
                        style={[
                          styles.categoryChip,
                          selected
                            ? {
                                backgroundColor: theme.colors.primary,
                                borderColor: theme.colors.primary,
                              }
                            : {
                                backgroundColor: theme.isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : 'rgba(0,0,0,0.04)',
                                borderColor: theme.colors.border,
                              },
                        ]}
                      >
                        <AppIcon
                          name={cat.icon as any}
                          size={12}
                          color={selected ? '#FFF' : theme.colors.textSecondary}
                        />
                        <Typography
                          variant="caption"
                          weight={selected ? 'bold' : 'semibold'}
                          color={selected ? 'textInverse' : 'textPrimary'}
                        >
                          {cat.name}
                        </Typography>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => {
                      haptics.light();
                      setShowCustomCategory(true);
                    }}
                    style={[
                      styles.categoryChip,
                      showCustomCategory
                        ? {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.primary,
                          }
                        : {
                            backgroundColor: theme.isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.04)',
                            borderColor: theme.colors.border,
                          },
                    ]}
                  >
                    <Typography
                      variant="caption"
                      weight={showCustomCategory ? 'bold' : 'semibold'}
                      color={showCustomCategory ? 'textInverse' : 'textPrimary'}
                    >
                      + Custom
                    </Typography>
                  </Pressable>
                </View>

                {showCustomCategory && (
                  <View
                    style={[
                      styles.inputBox,
                      {
                        marginTop: theme.spacing[2],
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,255,255,0.85)',
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.colors.textPrimary },
                      ]}
                      placeholder="Enter custom category name"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={customCategory}
                      onChangeText={setCustomCategory}
                      autoFocus
                    />
                  </View>
                )}
              </View>

              {/* Due Date & Reminder Grid */}
              <View style={styles.twoColGrid}>
                {/* Due Date */}
                <View style={styles.col}>
                  <Typography
                    variant="caption"
                    weight="bold"
                    color="textSecondary"
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: theme.spacing[1],
                    }}
                  >
                    NEXT DUE DATE
                  </Typography>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,255,255,0.85)',
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <AppIcon
                      name="calendar"
                      size={16}
                      color={theme.colors.textTertiary}
                      style={styles.inputIcon}
                    />
                    {Platform.OS === 'web' ? (
                      /* @ts-ignore */
                      <input
                        type="date"
                        value={format(dueDate, 'yyyy-MM-dd')}
                        onChange={(e: any) => {
                          if (e.target.value) {
                            const d = new Date(e.target.value);
                            if (!isNaN(d.getTime())) setDueDate(d);
                          }
                        }}
                        style={
                          {
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: theme.colors.textPrimary,
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.semibold,
                            outline: 'none',
                            colorScheme: theme.isDark ? 'dark' : 'light',
                            fontFamily: theme.typography.fontFamily.sans,
                            cursor: 'pointer',
                          } as any
                        }
                      />
                    ) : (
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          setShowDatePicker(true);
                        }}
                        style={{ flex: 1 }}
                      >
                        <Typography
                          variant="bodySm"
                          weight="semibold"
                          color="textPrimary"
                        >
                          {format(dueDate, 'MMM d, yyyy')}
                        </Typography>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Reminder Days */}
                <View style={styles.col}>
                  <Typography
                    variant="caption"
                    weight="bold"
                    color="textSecondary"
                    style={{
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: theme.spacing[1],
                    }}
                  >
                    REMIND DAYS BEFORE
                  </Typography>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(255,255,255,0.85)',
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <AppIcon
                      name="bell"
                      size={16}
                      color={theme.colors.textTertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { color: theme.colors.textPrimary },
                      ]}
                      placeholder="3"
                      placeholderTextColor={theme.colors.textTertiary}
                      keyboardType="number-pad"
                      value={reminderDays}
                      onChangeText={setReminderDays}
                    />
                  </View>
                </View>
              </View>

              {/* Frequency */}
              <View style={styles.fieldWrap}>
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textSecondary"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: theme.spacing[1],
                  }}
                >
                  BILL FREQUENCY
                </Typography>
                <View style={styles.chipRow}>
                  {FREQUENCIES.map(f => {
                    const selected = frequency === f.key;
                    return (
                      <Pressable
                        key={f.key}
                        onPress={() => {
                          haptics.light();
                          setFrequency(f.key);
                        }}
                        style={[
                          styles.frequencyChip,
                          selected
                            ? {
                                backgroundColor: theme.colors.primary,
                                borderColor: theme.colors.primary,
                              }
                            : {
                                backgroundColor: theme.isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : 'rgba(0,0,0,0.04)',
                                borderColor: theme.colors.border,
                              },
                        ]}
                      >
                        <Typography
                          variant="caption"
                          weight={selected ? 'bold' : 'semibold'}
                          color={selected ? 'textInverse' : 'textPrimary'}
                        >
                          {f.label}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Auto Pay Switch */}
              <View
                style={[
                  styles.autoPayRow,
                  { borderColor: theme.colors.border },
                ]}
              >
                <View style={{ flex: 1, gap: theme.spacing[1] }}>
                  <Typography
                    variant="bodySm"
                    weight="semibold"
                    color="textPrimary"
                  >
                    Auto-Debit Configured
                  </Typography>
                  <Typography variant="caption" color="textTertiary">
                    Bill is deducted automatically from bank/card
                  </Typography>
                </View>
                <Switch
                  value={autoPay}
                  onValueChange={val => {
                    haptics.light();
                    setAutoPay(val);
                  }}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                  thumbColor="#FFF"
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View
              style={[styles.footer, { borderTopColor: theme.colors.border }]}
            >
              <Pressable
                onPress={() => {
                  haptics.light();
                  onClose();
                }}
                style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
              >
                <Typography
                  variant="bodySm"
                  weight="semibold"
                  color="textSecondary"
                >
                  Cancel
                </Typography>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={isPending}
                style={[styles.saveBtnWrap, isPending && { opacity: 0.7 }]}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveBtn}
                >
                  {isPending ? (
                    <GlobalLoader
                      variant="inline"
                      color="#FFFFFF"
                      size="small"
                    />
                  ) : (
                    <>
                      <AppIcon name="check" size={16} color="#FFFFFF" />
                      <Typography
                        variant="bodySm"
                        weight="bold"
                        color="textInverse"
                      >
                        {initialBill ? 'Update Bill' : 'Save Bill'}
                      </Typography>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {Platform.OS !== 'web' && showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDueDate(selectedDate);
                }}
              />
            )}
          </GlassCard>
        </Animated.View>
      </KeyboardAvoidingView>
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
      backgroundColor: theme.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing[4],
    },
    dialogContainer: {
      width: '100%',
      maxWidth: 540,
      maxHeight: '90%',
    },
    card: {
      borderRadius: theme.borderRadius['3xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(255,255,255,0.2)',
      ...theme.shadows.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing[5],
      paddingVertical: theme.spacing[4],
      borderBottomWidth: 1,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[3],
      flex: 1,
    },
    headerIconBubble: {
      width: 42,
      height: 42,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formContent: {
      padding: theme.spacing[5],
      gap: theme.spacing[4],
    },
    fieldWrap: {
      gap: theme.spacing[2],
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      paddingHorizontal: theme.spacing[3],
      minHeight: 46,
    },
    inputIcon: {
      marginRight: theme.spacing[2],
    },
    input: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      paddingVertical: theme.spacing[2],
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[2],
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      gap: theme.spacing[2],
    },
    frequencyChip: {
      flex: 1,
      minWidth: 70,
      alignItems: 'center',
      paddingVertical: theme.spacing[2],
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
    },
    twoColGrid: {
      flexDirection: 'row',
      gap: theme.spacing[3],
    },
    col: {
      flex: 1,
      gap: theme.spacing[2],
    },
    autoPayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: theme.spacing[3],
      borderTopWidth: 1,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing[3],
      paddingHorizontal: theme.spacing[5],
      paddingVertical: theme.spacing[4],
      borderTopWidth: 1,
    },
    cancelBtn: {
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[3],
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
    },
    saveBtnWrap: {
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2],
      paddingHorizontal: theme.spacing[5],
      paddingVertical: theme.spacing[3],
      borderRadius: theme.borderRadius.xl,
    },
  });
}
