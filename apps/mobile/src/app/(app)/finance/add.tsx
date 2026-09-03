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
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../../providers/ThemeProvider';
import { useCreateTransaction } from '../../../hooks/useFinance';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import { haptics } from '../../../utils/haptics';

const CATEGORIES: {
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

const PAYMENT_METHODS: { id: string; name: string; icon: string }[] = [
  { id: 'Cash', name: 'Cash', icon: 'banknote' },
  { id: 'Card', name: 'Card', icon: 'credit-card' },
  { id: 'UPI', name: 'UPI / QR', icon: 'smartphone' },
  { id: 'Net Banking', name: 'Net Banking', icon: 'building' },
  { id: 'Wallet', name: 'Wallet', icon: 'wallet' },
  { id: 'Other', name: 'Other', icon: 'tag' },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function AddTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const createTransaction = useCreateTransaction();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [notes, setNotes] = useState('');

  const handleAddAmount = (addVal: number) => {
    haptics.light();
    const current = Number(amount) || 0;
    setAmount(String(current + addVal));
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      haptics.warning();
      Alert.alert(
        'Amount Required',
        'Please enter a valid amount greater than 0.',
      );
      return;
    }

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
    return CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  }, [category]);

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
              {type === 'expense' ? 'Add Expense' : 'Add Income'}
            </Text>

            <Pressable
              onPress={handleSubmit}
              disabled={createTransaction.isPending}
              style={({ pressed }) => [
                styles.saveHeaderBtn,
                pressed && { opacity: 0.8 },
              ]}
            >
              {createTransaction.isPending ? (
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
          {/* 1. TYPE SELECTOR (Segmented Pill) */}
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
                onPress={() => {
                  haptics.selection();
                  setType('expense');
                }}
                style={[
                  styles.typePillBtn,
                  type === 'expense' && styles.typePillExpenseActive,
                ]}
              >
                <AppIcon
                  name="arrow-down-left"
                  size={16}
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
                onPress={() => {
                  haptics.selection();
                  setType('income');
                }}
                style={[
                  styles.typePillBtn,
                  type === 'income' && styles.typePillIncomeActive,
                ]}
              >
                <AppIcon
                  name="arrow-up-right"
                  size={16}
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
                  borderColor:
                    type === 'expense'
                      ? theme.isDark
                        ? 'rgba(239, 68, 68, 0.25)'
                        : 'rgba(239, 68, 68, 0.15)'
                      : theme.isDark
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(16, 185, 129, 0.15)',
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
                  {type === 'expense' ? 'EXPENSE AMOUNT' : 'INCOME AMOUNT'}
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
                  style={[
                    styles.currencySymbol,
                    { color: type === 'expense' ? '#EF4444' : '#10B981' },
                  ]}
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

          {/* 3. TITLE INPUT */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
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
                TITLE / DESCRIPTION *
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
                  placeholder="e.g. Dinner with team, Taxi to hotel..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>
          </Animated.View>

          {/* 4. CATEGORY SELECTOR */}
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
                {CATEGORIES.map(cat => {
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

          {/* 5. PAYMENT METHOD */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
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
                PAYMENT METHOD
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
                            ? '#EA580C'
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

          {/* 6. NOTES (OPTIONAL) */}
          <Animated.View entering={FadeInDown.delay(250).duration(300)}>
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
                NOTES & ATTACHMENTS (OPTIONAL)
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
                  placeholder="Add any extra details, receipts, or breakdown notes..."
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>
          </Animated.View>

          {/* 7. BOTTOM ACTION BUTTON */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(300)}
            style={{ marginTop: 8, marginBottom: insets.bottom + 24 }}
          >
            <Pressable
              onPress={handleSubmit}
              disabled={createTransaction.isPending}
              style={({ pressed, hovered }: any) => [
                styles.primarySaveButton,
                Platform.OS === 'web' &&
                  hovered && { transform: [{ translateY: -2 }], opacity: 0.95 },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              {createTransaction.isPending ? (
                <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="circle-check" size={18} color="#FFFFFF" />
                  <Text style={styles.primarySaveButtonText}>
                    Save {type === 'expense' ? 'Expense' : 'Income'} • ₹
                    {Number(amount || 0).toLocaleString()}
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
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
    backgroundColor: '#EA580C',
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
    gap: 6,
  },
  typePillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    cursor: 'pointer',
  } as any,
  typePillExpenseActive: {
    backgroundColor: '#EF4444',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
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
  } as any,
  typePillIncomeActive: {
    backgroundColor: '#10B981',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
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
  } as any,
  typePillText: {
    fontSize: 14,
    fontWeight: '800',
  },
  heroAmountCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
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
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
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
  } as any,
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
    backgroundColor: '#EA580C',
    paddingVertical: 15,
    borderRadius: 16,

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(234, 88, 12, 0.4)',
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

    cursor: 'pointer',
  } as any,
  primarySaveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
