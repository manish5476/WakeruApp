// src/app/(app)/finance/add.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../../providers/ThemeProvider';
import {
  useCreateTransaction,
  useCreateLending,
} from '../../../hooks/useFinance';
import {
  ContactPickerModal,
  SelectedContact,
} from '../../../components/finance/ContactPickerModal';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import { haptics } from '../../../utils/haptics';
import { APP_NAME } from '../../../config/branding';

export type TransactionFormType = 'expense' | 'income' | 'lent' | 'borrowed';

const EXPENSE_CATEGORIES: {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  color: string;
}[] = [
  {
    id: 'Food',
    name: 'Food & Dining',
    emoji: '🍽️',
    icon: 'utensils',
    color: '#F59E0B',
  },
  {
    id: 'Transport',
    name: 'Transport',
    emoji: '🚗',
    icon: 'car',
    color: '#3B82F6',
  },
  {
    id: 'Shopping',
    name: 'Shopping',
    emoji: '🛍️',
    icon: 'shopping-bag',
    color: '#EC4899',
  },
  {
    id: 'Entertainment',
    name: 'Entertainment',
    emoji: '🎬',
    icon: 'film',
    color: '#8B5CF6',
  },
  {
    id: 'Bills',
    name: 'Bills & Utilities',
    emoji: '📄',
    icon: 'file-text',
    color: '#64748B',
  },
  {
    id: 'Healthcare',
    name: 'Healthcare',
    emoji: '💊',
    icon: 'heart-pulse',
    color: '#EF4444',
  },
  {
    id: 'Education',
    name: 'Education',
    emoji: '🎓',
    icon: 'graduation-cap',
    color: '#10B981',
  },
  {
    id: 'Rent',
    name: 'Rent & Living',
    emoji: '🏠',
    icon: 'building',
    color: '#6366F1',
  },
  {
    id: 'Travel',
    name: 'Travel & Stays',
    emoji: '✈️',
    icon: 'plane',
    color: '#06B6D4',
  },
  {
    id: 'Other',
    name: 'General / Other',
    emoji: '📌',
    icon: 'tag',
    color: '#94A3B8',
  },
];

const INCOME_CATEGORIES: {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  color: string;
}[] = [
  {
    id: 'Salary',
    name: 'Salary / Wages',
    emoji: '💼',
    icon: 'briefcase',
    color: '#10B981',
  },
  {
    id: 'Freelance',
    name: 'Freelance / Projects',
    emoji: '💻',
    icon: 'laptop',
    color: '#3B82F6',
  },
  {
    id: 'Investments',
    name: 'Investments / Dividends',
    emoji: '📈',
    icon: 'trending-up',
    color: '#6366F1',
  },
  {
    id: 'Business',
    name: 'Business Income',
    emoji: '🏢',
    icon: 'building',
    color: '#8B5CF6',
  },
  {
    id: 'Gifts',
    name: 'Gifts & Grants',
    emoji: '🎁',
    icon: 'gift',
    color: '#EC4899',
  },
  {
    id: 'Refunds',
    name: 'Refunds / Cashback',
    emoji: '🔄',
    icon: 'refresh-cw',
    color: '#F59E0B',
  },
  {
    id: 'Rental',
    name: 'Rental Income',
    emoji: '🏠',
    icon: 'home',
    color: '#06B6D4',
  },
  {
    id: 'Other Income',
    name: 'Other Income',
    emoji: '💰',
    icon: 'banknote',
    color: '#10B981',
  },
];

const PAYMENT_METHODS: { id: string; name: string; icon: string }[] = [
  { id: 'UPI', name: 'UPI / QR', icon: 'smartphone' },
  { id: 'Cash', name: 'Cash', icon: 'banknote' },
  { id: 'Card', name: 'Card', icon: 'credit-card' },
  { id: 'Net Banking', name: 'Net Banking', icon: 'building' },
  { id: 'Wallet', name: 'Wallet', icon: 'wallet' },
  { id: 'Other', name: 'Other', icon: 'tag' },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

const DUE_DATE_OPTIONS = [
  { label: 'None', days: 0 },
  { label: '7 Days', days: 7 },
  { label: '15 Days', days: 15 },
  { label: '30 Days', days: 30 },
];

export default function AddTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const params = useLocalSearchParams<{
    type?: string;
    personName?: string;
    personPhone?: string;
    personUserId?: string;
  }>();

  const createTransaction = useCreateTransaction();
  const createLending = useCreateLending();

  const initialType: TransactionFormType =
    params.type === 'income' ||
    params.type === 'lent' ||
    params.type === 'borrowed'
      ? (params.type as TransactionFormType)
      : 'expense';

  const [type, setType] = useState<TransactionFormType>(initialType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [notes, setNotes] = useState('');

  // Personal Lending / Borrowing specific state
  const [selectedContact, setSelectedContact] =
    useState<SelectedContact | null>(() => {
      if (params.personName) {
        return {
          name: params.personName,
          phone: params.personPhone,
          userId: params.personUserId,
        };
      }
      return null;
    });
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const [selectedDueDays, setSelectedDueDays] = useState<number>(0);

  const isLending = type === 'lent' || type === 'borrowed';
  const isSubmitting = createTransaction.isPending || createLending.isPending;

  const activeCategories = useMemo(() => {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  }, [type]);

  const handleTypeChange = (newType: TransactionFormType) => {
    haptics.selection();
    setType(newType);
    if (newType === 'income') {
      setCategory('Salary');
    } else if (newType === 'expense') {
      setCategory('Food');
    } else if (newType === 'lent') {
      setCategory('Lending');
    } else {
      setCategory('Borrowing');
    }
  };

  const handleAddAmount = (addVal: number) => {
    haptics.light();
    const current = Number(amount) || 0;
    setAmount(String(current + addVal));
  };

  const typeAccentColor = useMemo(() => {
    switch (type) {
      case 'expense':
        return '#EF4444';
      case 'income':
        return '#10B981';
      case 'lent':
        return '#F59E0B';
      case 'borrowed':
        return '#EC4899';
    }
  }, [type]);

  const headerTitle = useMemo(() => {
    switch (type) {
      case 'expense':
        return 'Add Expense';
      case 'income':
        return 'Add Income';
      case 'lent':
        return 'Record Money Lent';
      case 'borrowed':
        return 'Record Money Borrowed';
    }
  }, [type]);

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      haptics.warning();
      Alert.alert(
        'Amount Required',
        'Please enter a valid amount greater than 0.',
      );
      return;
    }

    if (isLending) {
      if (!selectedContact || !selectedContact.name?.trim()) {
        haptics.warning();
        Alert.alert(
          'Contact Required',
          `Please select the person you ${type === 'lent' ? 'lent money to' : 'borrowed money from'}.`,
        );
        return;
      }

      haptics.success();

      let dueDateIso: string | undefined = undefined;
      if (selectedDueDays > 0) {
        const target = new Date();
        target.setDate(target.getDate() + selectedDueDays);
        dueDateIso = target.toISOString();
      }

      createLending.mutate(
        {
          personName: selectedContact.name.trim(),
          personPhone: selectedContact.phone?.trim() || undefined,
          personUserId: selectedContact.userId || undefined,
          type,
          amount: Number(amount),
          notes: notes.trim() || undefined,
          dueDate: dueDateIso,
          paymentMethod: paymentMethod as any,
        },
        {
          onSuccess: () => {
            router.back();
          },
          onError: (error: any) => {
            Alert.alert(
              'Error',
              error?.message || 'Failed to record lending transaction',
            );
          },
        },
      );
      return;
    }

    // Standard Expense / Income
    if (!title.trim()) {
      haptics.warning();
      Alert.alert(
        'Title Required',
        'Please provide a short description for this transaction.',
      );
      return;
    }

    haptics.success();

    const data = {
      title: title.trim(),
      amount: Number(amount),
      category,
      type,
      paymentMethod: paymentMethod as any,
      notes: notes.trim(),
      date: new Date().toISOString(),
      currency: 'INR',
    };

    createTransaction.mutate(data, {
      onSuccess: () => {
        router.back();
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.message || 'Failed to add transaction');
      },
    });
  };

  const selectedCategoryObj = useMemo(() => {
    return activeCategories.find(c => c.id === category) || activeCategories[0];
  }, [activeCategories, category]);

  const contactInitials = useMemo(() => {
    if (!selectedContact?.name) return '?';
    return selectedContact.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase())
      .join('');
  }, [selectedContact]);

  return (
    <GlobalBackground>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Nav Bar */}
        <View
          style={[
            styles.topBar,
            {
              borderBottomColor: theme.isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <View
            style={[styles.topBarInner, isDesktop && styles.desktopContainer]}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.navIconBtn,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#F1F5F9',
                },
                pressed && { opacity: 0.6 },
              ]}
            >
              <AppIcon name="x" size={18} color={theme.colors.textPrimary} />
            </Pressable>

            <Text
              style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            >
              {headerTitle}
            </Text>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.saveHeaderBtn,
                { backgroundColor: typeAccentColor },
                pressed && { opacity: 0.8 },
              ]}
            >
              {isSubmitting ? (
                <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveHeaderText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Main Scroll Content */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopContainer,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. TYPE SELECTOR (4-Tab Segmented Matrix) */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <View
              style={[
                styles.typePillContainer,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(30, 41, 59, 0.7)'
                    : '#F1F5F9',
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                },
              ]}
            >
              <Pressable
                onPress={() => handleTypeChange('expense')}
                style={[
                  styles.typePillBtn,
                  type === 'expense' && styles.typePillExpenseActive,
                ]}
              >
                <AppIcon
                  name="arrow-down-left"
                  size={14}
                  color={
                    type === 'expense' ? '#FFFFFF' : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typePillText,
                    {
                      color:
                        type === 'expense'
                          ? '#FFFFFF'
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Expense
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleTypeChange('income')}
                style={[
                  styles.typePillBtn,
                  type === 'income' && styles.typePillIncomeActive,
                ]}
              >
                <AppIcon
                  name="arrow-up-right"
                  size={14}
                  color={
                    type === 'income' ? '#FFFFFF' : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typePillText,
                    {
                      color:
                        type === 'income'
                          ? '#FFFFFF'
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Income
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleTypeChange('lent')}
                style={[
                  styles.typePillBtn,
                  type === 'lent' && styles.typePillLentActive,
                ]}
              >
                <AppIcon
                  name="arrow-up-right"
                  size={14}
                  color={type === 'lent' ? '#FFFFFF' : '#F59E0B'}
                />
                <Text
                  style={[
                    styles.typePillText,
                    {
                      color:
                        type === 'lent'
                          ? '#FFFFFF'
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  I Lent
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleTypeChange('borrowed')}
                style={[
                  styles.typePillBtn,
                  type === 'borrowed' && styles.typePillBorrowedActive,
                ]}
              >
                <AppIcon
                  name="arrow-down-left"
                  size={14}
                  color={type === 'borrowed' ? '#FFFFFF' : '#EC4899'}
                />
                <Text
                  style={[
                    styles.typePillText,
                    {
                      color:
                        type === 'borrowed'
                          ? '#FFFFFF'
                          : theme.colors.textSecondary,
                    },
                  ]}
                >
                  Borrowed
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* 2. HERO AMOUNT CARD */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)}>
            <View
              style={[
                styles.heroAmountCard,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(30, 41, 59, 0.85)'
                    : '#FFFFFF',
                  borderColor: `${typeAccentColor}35`,
                },
              ]}
            >
              <View style={styles.amountHeaderRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {type === 'expense'
                    ? 'EXPENSE AMOUNT'
                    : type === 'income'
                      ? 'INCOME AMOUNT'
                      : type === 'lent'
                        ? 'AMOUNT LENT (THEY OWE YOU)'
                        : 'AMOUNT BORROWED (YOU OWE)'}
                </Text>
                <View
                  style={[
                    styles.currencyPill,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyPillText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    INR (₹)
                  </Text>
                </View>
              </View>

              <View style={styles.amountInputRow}>
                <Text
                  style={[styles.currencySymbol, { color: typeAccentColor }]}
                >
                  ₹
                </Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus={false}
                />
              </View>

              {/* Quick Amount Shortcuts */}
              <View style={styles.quickAmountsRow}>
                {QUICK_AMOUNTS.map(val => (
                  <Pressable
                    key={val}
                    onPress={() => handleAddAmount(val)}
                    style={({ pressed }) => [
                      styles.quickAmountBtn,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#F8FAFC',
                      },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      +₹{val.toLocaleString()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* 3. CONTACT SELECTION CARD (LENT / BORROWED ONLY) */}
          {isLending && (
            <Animated.View entering={FadeInDown.delay(90).duration(300)}>
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(30, 41, 59, 0.75)'
                      : '#FFFFFF',
                    borderColor: selectedContact
                      ? `${typeAccentColor}40`
                      : theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <View style={styles.contactHeaderRow}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {type === 'lent'
                      ? 'PERSON YOU LENT TO *'
                      : 'PERSON YOU BORROWED FROM *'}
                  </Text>
                  {selectedContact && (
                    <Pressable
                      onPress={() => setContactPickerVisible(true)}
                      hitSlop={6}
                    >
                      <Text
                        style={[
                          styles.changeContactLink,
                          { color: typeAccentColor },
                        ]}
                      >
                        Change
                      </Text>
                    </Pressable>
                  )}
                </View>

                {selectedContact ? (
                  <View
                    style={[
                      styles.selectedContactCard,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(15, 23, 42, 0.6)'
                          : '#F8FAFC',
                        borderColor: theme.isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.contactAvatar,
                        { backgroundColor: `${typeAccentColor}22` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.contactAvatarText,
                          { color: typeAccentColor },
                        ]}
                      >
                        {contactInitials}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.contactName,
                          { color: theme.colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {selectedContact.name}
                      </Text>
                      {Boolean(selectedContact.phone) && (
                        <Text
                          style={[
                            styles.contactPhone,
                            { color: theme.colors.textTertiary },
                          ]}
                          numberOfLines={1}
                        >
                          {selectedContact.phone}
                        </Text>
                      )}
                      {Boolean(selectedContact.userId) && (
                        <View style={styles.tripSplitUserBadge}>
                          <AppIcon name="users" size={10} color="#3B82F6" />
                          <Text style={styles.tripSplitUserText}>
                            {APP_NAME} Friend
                          </Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      onPress={() => setSelectedContact(null)}
                      style={styles.clearContactBtn}
                      hitSlop={8}
                    >
                      <AppIcon
                        name="x"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setContactPickerVisible(true)}
                    style={({ pressed, hovered }: any) => [
                      styles.chooseContactBtn,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(15, 23, 42, 0.6)'
                          : '#F8FAFC',
                        borderColor: `${typeAccentColor}35`,
                      },
                      Platform.OS === 'web' &&
                        hovered && { borderColor: typeAccentColor },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View
                      style={[
                        styles.chooseContactIconWrap,
                        { backgroundColor: `${typeAccentColor}18` },
                      ]}
                    >
                      <AppIcon
                        name="user-plus"
                        size={18}
                        color={typeAccentColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.chooseContactTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        Choose Contact or Friend
                      </Text>
                      <Text
                        style={[
                          styles.chooseContactSub,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Tap to select from friends, recent contacts, or manual
                        entry
                      </Text>
                    </View>
                    <AppIcon
                      name="chevron-right"
                      size={18}
                      color={theme.colors.textTertiary}
                    />
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}

          {/* 4. TITLE / DESCRIPTION INPUT */}
          <Animated.View entering={FadeInDown.delay(120).duration(300)}>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(30, 41, 59, 0.75)'
                    : '#FFFFFF',
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isLending
                  ? 'DESCRIPTION / PURPOSE (OPTIONAL)'
                  : 'TITLE / DESCRIPTION *'}
              </Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(15, 23, 42, 0.6)'
                      : '#F8FAFC',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <AppIcon
                  name="file-text"
                  size={16}
                  color={theme.colors.textTertiary}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  placeholder={
                    isLending
                      ? selectedContact
                        ? `${type === 'lent' ? 'Lent to' : 'Borrowed from'} ${selectedContact.name}`
                        : 'e.g. For dinner bill, concert ticket...'
                      : 'e.g. Dinner with team, Taxi to hotel...'
                  }
                  placeholderTextColor={theme.colors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>
          </Animated.View>

          {/* 5. DUE DATE PICKER (LENT / BORROWED ONLY) */}
          {isLending && (
            <Animated.View entering={FadeInDown.delay(150).duration(300)}>
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(30, 41, 59, 0.75)'
                      : '#FFFFFF',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <View style={styles.categoryHeader}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    EXPECTED REPAYMENT BY (OPTIONAL)
                  </Text>
                  {selectedDueDays > 0 && (
                    <Text
                      style={[
                        styles.selectedCategoryNote,
                        { color: typeAccentColor },
                      ]}
                    >
                      In {selectedDueDays} Days
                    </Text>
                  )}
                </View>

                <View style={styles.paymentMethodsRow}>
                  {DUE_DATE_OPTIONS.map(opt => {
                    const isSelected = selectedDueDays === opt.days;
                    return (
                      <Pressable
                        key={opt.days}
                        onPress={() => {
                          haptics.light();
                          setSelectedDueDays(opt.days);
                        }}
                        style={({ pressed, hovered }: any) => [
                          styles.paymentMethodChip,
                          {
                            backgroundColor: isSelected
                              ? typeAccentColor
                              : theme.isDark
                                ? 'rgba(15, 23, 42, 0.6)'
                                : '#F8FAFC',
                            borderColor: isSelected
                              ? typeAccentColor
                              : theme.isDark
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(0,0,0,0.06)',
                          },
                          Platform.OS === 'web' &&
                            hovered &&
                            !isSelected && { transform: [{ translateY: -1 }] },
                          pressed && { transform: [{ scale: 0.96 }] },
                        ]}
                      >
                        <AppIcon
                          name="calendar"
                          size={13}
                          color={
                            isSelected ? '#FFFFFF' : theme.colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.paymentMethodText,
                            {
                              color: isSelected
                                ? '#FFFFFF'
                                : theme.colors.textPrimary,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}

          {/* 6. CATEGORY SELECTOR (EXPENSE / INCOME ONLY) */}
          {!isLending && (
            <Animated.View entering={FadeInDown.delay(180).duration(300)}>
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(30, 41, 59, 0.75)'
                      : '#FFFFFF',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <View style={styles.categoryHeader}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    CATEGORY
                  </Text>
                  <Text
                    style={[
                      styles.selectedCategoryNote,
                      { color: selectedCategoryObj.color },
                    ]}
                  >
                    {selectedCategoryObj.emoji} {selectedCategoryObj.name}
                  </Text>
                </View>

                <View style={styles.categoriesGrid}>
                  {activeCategories.map(cat => {
                    const isSelected = category === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          haptics.light();
                          setCategory(cat.id);
                        }}
                        style={({ pressed, hovered }: any) => [
                          styles.categoryChip,
                          {
                            backgroundColor: isSelected
                              ? theme.isDark
                                ? 'rgba(234, 88, 12, 0.2)'
                                : '#FFF7ED'
                              : theme.isDark
                                ? 'rgba(15, 23, 42, 0.6)'
                                : '#F8FAFC',
                            borderColor: isSelected
                              ? '#EA580C'
                              : theme.isDark
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(0,0,0,0.06)',
                          },
                          Platform.OS === 'web' &&
                            hovered &&
                            !isSelected && { transform: [{ translateY: -1 }] },
                          pressed && { transform: [{ scale: 0.96 }] },
                        ]}
                      >
                        <Text style={styles.catEmoji}>{cat.emoji}</Text>
                        <Text
                          style={[
                            styles.catName,
                            {
                              color: isSelected
                                ? '#EA580C'
                                : theme.colors.textPrimary,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          )}

          {/* 7. PAYMENT METHOD */}
          <Animated.View entering={FadeInDown.delay(210).duration(300)}>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(30, 41, 59, 0.75)'
                    : '#FFFFFF',
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {isLending ? 'PAYMENT / TRANSFER METHOD' : 'PAYMENT METHOD'}
              </Text>

              <View style={styles.paymentMethodsRow}>
                {PAYMENT_METHODS.map(method => {
                  const isSelected = paymentMethod === method.id;
                  return (
                    <Pressable
                      key={method.id}
                      onPress={() => {
                        haptics.light();
                        setPaymentMethod(method.id);
                      }}
                      style={({ pressed, hovered }: any) => [
                        styles.paymentMethodChip,
                        {
                          backgroundColor: isSelected
                            ? typeAccentColor
                            : theme.isDark
                              ? 'rgba(15, 23, 42, 0.6)'
                              : '#F8FAFC',
                          borderColor: isSelected
                            ? typeAccentColor
                            : theme.isDark
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(0,0,0,0.06)',
                        },
                        Platform.OS === 'web' &&
                          hovered &&
                          !isSelected && { transform: [{ translateY: -1 }] },
                        pressed && { transform: [{ scale: 0.96 }] },
                      ]}
                    >
                      <AppIcon
                        name={method.icon}
                        size={14}
                        color={
                          isSelected ? '#FFFFFF' : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.paymentMethodText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {method.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* 8. NOTES (OPTIONAL) */}
          <Animated.View entering={FadeInDown.delay(240).duration(300)}>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(30, 41, 59, 0.75)'
                    : '#FFFFFF',
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                NOTES & DETAILS (OPTIONAL)
              </Text>
              <View
                style={[
                  styles.notesInputBox,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(15, 23, 42, 0.6)'
                      : '#F8FAFC',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.notesTextInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  placeholder={
                    isLending
                      ? 'e.g. Promised repayment by weekend, cash given at cafe...'
                      : 'Add any extra details, receipts, or breakdown notes...'
                  }
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>
          </Animated.View>

          {/* 9. BOTTOM ACTION BUTTON */}
          <Animated.View
            entering={FadeInDown.delay(270).duration(300)}
            style={{ marginTop: 8, marginBottom: insets.bottom + 28 }}
          >
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed, hovered }: any) => [
                styles.primarySaveButton,
                { backgroundColor: typeAccentColor },
                Platform.OS === 'web' &&
                  hovered && { transform: [{ translateY: -2 }], opacity: 0.95 },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              {isSubmitting ? (
                <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="circle-check" size={18} color="#FFFFFF" />
                  <Text style={styles.primarySaveButtonText}>
                    {type === 'expense'
                      ? 'Save Expense'
                      : type === 'income'
                        ? 'Save Income'
                        : type === 'lent'
                          ? 'Record Lent Money'
                          : 'Record Borrowed Money'}{' '}
                    • ₹{Number(amount || 0).toLocaleString()}
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Contact Picker Modal for Lent & Borrowed */}
      <ContactPickerModal
        visible={contactPickerVisible}
        onClose={() => setContactPickerVisible(false)}
        onSelectContact={(contact: any) => {
          setSelectedContact(contact);
        }}
        selectedContact={selectedContact}
      />
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  desktopContainer: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  saveHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveHeaderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  typePillContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  typePillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 12,
    cursor: 'pointer',
  } as any,
  typePillExpenseActive: {
    backgroundColor: '#EF4444',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  } as any,
  typePillIncomeActive: {
    backgroundColor: '#10B981',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  } as any,
  typePillLentActive: {
    backgroundColor: '#F59E0B',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  } as any,
  typePillBorrowedActive: {
    backgroundColor: '#EC4899',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  } as any,
  typePillText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  heroAmountCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.06)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  } as any,
  amountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  currencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currencyPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '900',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '900',
    flex: 1,
    padding: 0,
    letterSpacing: -1,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.08)',
  },
  quickAmountBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
    cursor: 'pointer',
  } as any,
  quickAmountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.04)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  } as any,
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  changeContactLink: {
    fontSize: 12,
    fontWeight: '800',
    cursor: 'pointer',
  } as any,
  selectedContactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: 15,
    fontWeight: '900',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '800',
  },
  contactPhone: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  tripSplitUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  tripSplitUserText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  clearContactBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 6,
    cursor: 'pointer',
  } as any,
  chooseContactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseContactTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  chooseContactSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  selectedCategoryNote: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    cursor: 'pointer',
  } as any,
  catEmoji: {
    fontSize: 14,
  },
  catName: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    cursor: 'pointer',
  } as any,
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesInputBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  notesTextInput: {
    fontSize: 13,
    fontWeight: '500',
    minHeight: 64,
    textAlignVertical: 'top',
    padding: 0,
  },
  primarySaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
    cursor: 'pointer',
  } as any,
  primarySaveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
