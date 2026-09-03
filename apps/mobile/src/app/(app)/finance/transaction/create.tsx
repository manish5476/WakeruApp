import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  PressableStateCallbackType,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../../providers/ThemeProvider';
import { financeApi } from '../../../../services/api';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../../../components/common/AppIcon';
import { haptics } from '../../../../utils/haptics';

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Healthcare',
  'Education',
  'Rent',
  'Travel',
  'Other',
];
const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'UPI',
  'Net Banking',
  'Wallet',
  'Other',
];

const FormRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <GlassCard style={styles.formRow}>
      <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      {children}
    </GlassCard>
  );
};
const ChipSelector = ({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
}) => {
  const theme = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.chipContainer}>
      {items.map(item => (
        <Pressable
          key={item}
          style={({
            pressed,
            hovered,
          }: PressableStateCallbackType & { hovered?: boolean }) => [
            styles.chip,
            {
              backgroundColor:
                selected === item ? theme.colors.primary : theme.colors.surface,
              borderColor:
                selected === item ? theme.colors.primary : theme.colors.border,
            },
            hovered && {
              backgroundColor:
                selected === item
                  ? theme.colors.primary
                  : theme.colors.primaryBg,
            },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => {
            haptics.light();
            onSelect(item);
          }}
        >
          <Text
            style={[
              styles.chipText,
              {
                color:
                  selected === item
                    ? theme.colors.textInverse
                    : theme.colors.textPrimary,
              },
            ]}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default function CreateTransactionScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: (newTransaction: any) =>
      financeApi.createTransaction(newTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create transaction.');
    },
  });

  const handleSave = () => {
    haptics.heavy();
    if (!amount || !title) {
      return Alert.alert('Missing Info', 'Please enter an amount and title.');
    }
    if (type === 'expense' && !category) {
      return Alert.alert(
        'Missing Info',
        'Please select a category for the expense.',
      );
    }
    if (type === 'expense' && !paymentMethod) {
      return Alert.alert('Missing Info', 'Please select a payment method.');
    }
    mutation.mutate({
      title,
      amount: parseFloat(amount),
      type,
      category: type === 'expense' ? category : 'Income',
      paymentMethod: type === 'expense' ? paymentMethod : 'N/A',
      notes,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <GlobalBackground />
      <Stack.Screen
        options={{
          headerTitle: type === 'expense' ? 'Add Expense' : 'Add Income',
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.typeSelector}>
          <Pressable
            style={[
              styles.typeButton,
              type === 'expense' && styles.typeButtonActive,
            ]}
            onPress={() => setType('expense')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'expense' && styles.typeButtonTextActive,
              ]}
            >
              Expense
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeButton,
              type === 'income' && styles.typeButtonActive,
            ]}
            onPress={() => setType('income')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'income' && styles.typeButtonTextActive,
              ]}
            >
              Income
            </Text>
          </Pressable>
        </View>

        <FormRow label="Amount">
          <View style={styles.amountInputContainer}>
            <Text
              style={[
                styles.currencySymbol,
                { color: theme.colors.textPrimary },
              ]}
            >
              ₹
            </Text>
            <TextInput
              style={[styles.amountInput, { color: theme.colors.textPrimary }]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textTertiary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />
          </View>
        </FormRow>

        <FormRow label="Title">
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary }]}
            placeholder="What was this for?"
            placeholderTextColor={theme.colors.textTertiary}
            value={title}
            onChangeText={setTitle}
          />
        </FormRow>

        {type === 'expense' && (
          <>
            <FormRow label="Category">
              <ChipSelector
                items={CATEGORIES}
                selected={category}
                onSelect={setCategory}
              />
            </FormRow>

            <FormRow label="Payment Method">
              <ChipSelector
                items={PAYMENT_METHODS}
                selected={paymentMethod}
                onSelect={setPaymentMethod}
              />
            </FormRow>
          </>
        )}

        <FormRow label="Notes (Optional)">
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              { color: theme.colors.textPrimary },
            ]}
            placeholder="Add any additional notes..."
            placeholderTextColor={theme.colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </FormRow>

        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={mutation.isPending}
        >
          <Text style={styles.saveButtonText}>
            {mutation.isPending ? 'Saving...' : 'Save Transaction'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: 16,
          gap: 16,
        },
        typeSelector: {
          flexDirection: 'row',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: 4,
        },
        typeButton: {
          flex: 1,
          paddingVertical: 12,
          alignItems: 'center',
          borderRadius: theme.borderRadius.md,
        },
        typeButtonActive: {
          backgroundColor: theme.colors.card,
          ...theme.shadows.sm,
        },
        typeButtonText: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.textSecondary,
        },
        typeButtonTextActive: {
          color: theme.colors.textPrimary,
        },
        formRow: {
          padding: 16,
          gap: 12,
        },
        formLabel: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        amountInputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        currencySymbol: {
          fontSize: 32,
          fontWeight: '700',
          marginRight: 8,
        },
        amountInput: {
          flex: 1,
          fontSize: 48,
          fontWeight: '800',
          letterSpacing: -1,
        },
        input: {
          fontSize: 16,
        },
        notesInput: {
          minHeight: 60,
          textAlignVertical: 'top',
        },
        chipContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        chip: {
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: theme.borderRadius.xl,
          borderWidth: 1,
        },
        chipText: {
          fontSize: 14,
          fontWeight: '600',
        },
        saveButton: {
          backgroundColor: theme.colors.primary,
          padding: 16,
          borderRadius: theme.borderRadius.xl,
          alignItems: 'center',
          marginTop: 16,
        },
        saveButtonText: {
          color: theme.colors.textInverse,
          fontSize: 16,
          fontWeight: '700',
        },
      }),
    [theme],
  );
};
