import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../../../providers/ThemeProvider';
import { financeApi } from '../../../../../services/api';
import { GlobalBackground } from '../../../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../../../components/ui/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../../../../../utils/haptics';
import { useTransaction } from '../../../../../hooks/useFinance';
import GlobalLoader from '../../../../../components/common/GlobalLoader';
import 'react-native';

declare module 'react-native' {
  interface PressableStateCallbackType {
    hovered?: boolean;
  }
}
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
          style={({ pressed, hovered }) => [
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

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: transaction, isLoading: isTransactionLoading } =
    useTransaction(id);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type as 'income' | 'expense');
      setAmount(transaction.amount.toString());
      setTitle(transaction.title);
      setCategory(transaction.category);
      setPaymentMethod(transaction.paymentMethod);
      setNotes(transaction.notes || '');
    }
  }, [transaction]);

  const mutation = useMutation({
    mutationFn: (updatedTransaction: any) =>
      financeApi.updateTransaction(id as string, updatedTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update transaction.');
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

  const deleteMutation = useMutation({
    mutationFn: () => financeApi.deleteTransaction(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete transaction.');
    },
  });

  const handleDelete = () => {
    haptics.heavy();
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  };

  if (isTransactionLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transaparent',
        }}
      >
        <GlobalBackground />
        <GlobalLoader />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <GlobalBackground />
      <Stack.Screen
        options={{
          headerTitle: `Edit ${transaction?.type === 'expense' ? 'Expense' : 'Income'}`,
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
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Text>
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Text style={styles.deleteButtonText}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Transaction'}
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
        deleteButton: {
          padding: 16,
          alignItems: 'center',
        },
        deleteButtonText: {
          color: theme.colors.danger,
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [theme],
  );
};
