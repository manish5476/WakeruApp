import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
// app/(app)/trips/[id]/add-expense.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  PressableStateCallbackType,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LeafletMap } from '../../../../components/map/LeafletMap';
import { useTrip, useUpdateExpense, useExpense } from '../../../../hooks';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useAuthStore } from '../../../../stores/auth.store';
import { haptics } from '../../../../utils/haptics';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { Badge } from '../../../../components/ui/Badge';

// Safe web pressable type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================
// Types & Constants
// ============================================================
type SplitMethod = 'equal' | 'percentage' | 'exact' | 'shares' | 'personal';
type Step = 'basic' | 'split' | 'review';

interface ExpenseFormData {
  stopId: string;
  title: string;
  category: string;
  amountLocal: string;
  paidBy: string;
  date: Date;
  notes: string;
  location?: { latitude: number; longitude: number };
  splitMethod: SplitMethod;
  splitData: any;
}

const CATEGORIES = [
  { key: 'food', emoji: '🍽️', label: 'Food' },
  { key: 'stay', emoji: '🏨', label: 'Stay' },
  { key: 'transport', emoji: '🚗', label: 'Transport' },
  { key: 'activity', emoji: '🎯', label: 'Activity' },
  { key: 'shopping', emoji: '🛍️', label: 'Shopping' },
  { key: 'health', emoji: '💊', label: 'Health' },
  { key: 'other', emoji: '📌', label: 'Other' },
];

const SPLIT_METHODS: { key: SplitMethod; label: string; desc: string }[] = [
  {
    key: 'equal',
    label: 'Equal',
    desc: 'Split equally among selected members',
  },
  { key: 'percentage', label: 'Percentage', desc: 'Assign custom percentages' },
  {
    key: 'exact',
    label: 'Exact amounts',
    desc: 'Set exact amounts per person',
  },
  { key: 'shares', label: 'Shares', desc: 'Split by shares/ratio' },
  {
    key: 'personal',
    label: 'Personal',
    desc: 'No split — you paid for yourself',
  },
];

// ============================================================
// Components
// ============================================================
function StepIndicator({ currentStep }: { currentStep: number }) {
  const styles = useStyles();
  const theme = useTheme();
  const steps = ['Details', 'Split', 'Review'];

  return (
    <View style={styles.stepRow}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <React.Fragment key={step}>
            <View style={styles.stepDotContainer}>
              <View
                style={[
                  styles.stepDot,
                  isActive && [
                    styles.stepDotActive,
                    { backgroundColor: theme.colors.primary },
                  ],
                  isCompleted && [
                    styles.stepDotCompleted,
                    { backgroundColor: theme.colors.success },
                  ],
                ]}
              >
                {isCompleted ? (
                  <AppIcon name="check" size={12} color="#FFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepName,
                  isActive && [
                    styles.stepNameActive,
                    { color: theme.colors.textPrimary },
                  ],
                ]}
              >
                {step}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  isCompleted && [
                    styles.stepConnectorActive,
                    { backgroundColor: theme.colors.success },
                  ],
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SplitPreview({
  splits,
  currency,
  baseCurrency,
}: {
  splits: any[];
  currency: string;
  baseCurrency: string;
}) {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()}>
      <GlassCard
        style={styles.splitPreviewCardWrapper}
        intensity={theme.isDark ? 15 : 8}
      >
        <View style={styles.splitPreviewCard}>
          <Text
            style={[
              styles.splitPreviewTitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Split Breakdown
          </Text>
          <View style={styles.splitPreviewList}>
            {splits.map((split, index) => (
              <View
                key={index}
                style={[
                  styles.splitRow,
                  index === splits.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.splitUser}>
                  <View
                    style={[
                      styles.splitAvatar,
                      { backgroundColor: theme.colors.primaryBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.splitInitial,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {split.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.splitName,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {split.displayName}
                    </Text>
                    {split.percentage !== undefined && split.percentage > 0 && (
                      <Text
                        style={[
                          styles.splitPercent,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        {split.percentage}% share
                      </Text>
                    )}
                    {split.shares !== undefined && split.shares > 0 && (
                      <Text
                        style={[
                          styles.splitPercent,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        {split.shares} shares
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.splitAmounts}>
                  <Text
                    style={[
                      styles.splitAmount,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {split.amountLocal?.toLocaleString()} {currency}
                  </Text>
                  {currency !== baseCurrency && (
                    <Text
                      style={[
                        styles.splitAmountBase,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      ≈ {split.amountBase?.toLocaleString()} {baseCurrency}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ============================================================
// MAIN SCREEN
// ============================================================
export default function AddExpenseScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const { id: tripId, expenseId } = useLocalSearchParams<{
    id: string;
    expenseId: string;
  }>();
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuthStore();

  const { data: trip } = useTrip(tripId);
  const { mutate: updateExpense, isPending } = useUpdateExpense();
  const { data: expenseResponse, isLoading: isLoadingExpense } =
    useExpense(expenseId);
  const expenseToEdit = expenseResponse;

  useEffect(() => {
    if (expenseToEdit) {
      let splitData = {
        method: expenseToEdit.splitMethod,
        memberIds: [] as string[],
        exactAmounts: {},
        percentages: {},
        shares: {},
      };
      if (expenseToEdit.splitMethod === 'equal') {
        splitData.memberIds = expenseToEdit.splits.map((s: any) => s.userId);
      } else if (expenseToEdit.splitMethod === 'exact') {
        splitData.exactAmounts = expenseToEdit.splits.reduce(
          (acc: any, s: any) => {
            acc[s.userId] = s.amountLocal.toString();
            return acc;
          },
          {},
        );
      } else if (expenseToEdit.splitMethod === 'percentage') {
        splitData.percentages = expenseToEdit.splits.reduce(
          (acc: any, s: any) => {
            acc[s.userId] = s.percentage.toString();
            return acc;
          },
          {},
        );
      } else if (expenseToEdit.splitMethod === 'shares') {
        splitData.shares = expenseToEdit.splits.reduce((acc: any, s: any) => {
          acc[s.userId] = s.shares.toString();
          return acc;
        }, {});
      }

      setFormData(prev => ({
        ...prev,
        stopId: expenseToEdit.stopId,
        title: expenseToEdit.title,
        category: (expenseToEdit.category || 'other').toLowerCase(),
        amountLocal: expenseToEdit.amountLocal.toString(),
        paidBy: expenseToEdit.paidBy,
        date: new Date(expenseToEdit.date),
        notes: expenseToEdit.notes || '',
        splitMethod: expenseToEdit.splitMethod,
        splitData,
      }));
    }
  }, [expenseToEdit]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = isPending || isSubmitting || isLoadingExpense;

  const activeMembers = useMemo(
    () => trip?.members?.filter((m: any) => m.isActive) || [],
    [trip],
  );
  const stops = useMemo(() => trip?.stops || [], [trip]);

  const [formData, setFormData] = useState<ExpenseFormData>({
    stopId: stops[0]?._id || '',
    title: '',
    category: 'other',
    amountLocal: '',
    paidBy: activeMembers[0]?.userId || '',
    date: new Date(),
    notes: '',
    location: undefined,
    splitMethod: 'equal',
    splitData: { memberIds: activeMembers.map((m: any) => m.userId) },
  });

  useEffect(() => {
    if (
      !expenseToEdit &&
      trip &&
      stops.length > 0 &&
      activeMembers.length > 0
    ) {
      setFormData(prev => ({
        ...prev,
        stopId: prev.stopId || stops[0]._id,
        paidBy: prev.paidBy || activeMembers[0].userId,
        splitData: {
          ...prev.splitData,
          memberIds: prev.splitData.memberIds?.length
            ? prev.splitData.memberIds
            : activeMembers.map((m: any) => m.userId),
        },
      }));
    }
  }, [trip, stops, activeMembers, expenseToEdit]);

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempLocation, setTempLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Focus States
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isNotesFocused, setIsNotesFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  // Physics
  const nextBtnScale = useSharedValue(1);
  const backBtnScale = useSharedValue(1);

  const selectedStop = stops.find((s: any) => s._id === formData.stopId);
  const currency = selectedStop?.currency || 'INR';
  const baseCurrency = trip?.baseCurrency || 'INR';
  const exchangeRate = selectedStop?.currentExchangeRate || 1;

  // Dynamic font size — shrinks as the number gets longer
  const amountFontSize = useMemo(() => {
    const len = formData.amountLocal.length;
    if (len <= 6) return 64;
    if (len <= 9) return 48;
    if (len <= 12) return 36;
    return 28;
  }, [formData.amountLocal]);

  const previewSplits = useMemo(() => {
    const amount = parseFloat(formData.amountLocal) || 0;
    if (amount <= 0) return [];

    const baseAmount = parseFloat((amount * exchangeRate).toFixed(2));
    const members = formData.splitData.memberIds || [];
    const memberDetails = formData.splitData.members || [];

    switch (formData.splitMethod) {
      case 'personal':
        return [
          {
            displayName:
              activeMembers.find((m: any) => m.userId === formData.paidBy)
                ?.displayName || 'You',
            amountLocal: amount,
            amountBase: baseAmount,
          },
        ];
      case 'equal': {
        const n = members.length || 1;
        const perPerson = Math.floor((amount / n) * 100) / 100;
        const remainder = Math.round((amount - perPerson * n) * 100);
        return members.map((uid: string, i: number) => ({
          displayName:
            activeMembers.find((m: any) => m.userId === uid)?.displayName ||
            '?',
          amountLocal: i < remainder ? perPerson + 0.01 : perPerson,
          amountBase: parseFloat(
            (
              (i < remainder ? perPerson + 0.01 : perPerson) * exchangeRate
            ).toFixed(2),
          ),
        }));
      }
      case 'percentage':
        return (memberDetails || []).map((m: any) => ({
          displayName: m.displayName,
          percentage: m.percentage,
          amountLocal: parseFloat(((amount * m.percentage) / 100).toFixed(2)),
          amountBase: parseFloat(
            ((amount * m.percentage * exchangeRate) / 100).toFixed(2),
          ),
        }));
      case 'exact':
        return (memberDetails || []).map((m: any) => ({
          displayName: m.displayName,
          amountLocal: m.amountLocal || 0,
          amountBase: parseFloat(
            ((m.amountLocal || 0) * exchangeRate).toFixed(2),
          ),
        }));
      case 'shares': {
        const totalShares = (memberDetails || []).reduce(
          (s: number, m: any) => s + (m.shares || 1),
          0,
        );
        return (memberDetails || []).map((m: any) => {
          const local = parseFloat(
            ((amount * (m.shares || 1)) / totalShares).toFixed(2),
          );
          return {
            displayName: m.displayName,
            shares: m.shares,
            amountLocal: local,
            amountBase: parseFloat((local * exchangeRate).toFixed(2)),
          };
        });
      }
      default:
        return [];
    }
  }, [formData, activeMembers, exchangeRate]);

  const handleUpdate = (field: keyof ExpenseFormData, value: any) => {
    haptics.light();
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleMember = (userId: string) => {
    haptics.light();
    const current = formData.splitData.memberIds || [];
    const newIds = current.includes(userId)
      ? current.filter((id: string) => id !== userId)
      : [...current, userId];
    handleUpdate('splitData', { ...formData.splitData, memberIds: newIds });
  };

  const handlePercentageChange = (userId: string, percentage: number) => {
    const members =
      formData.splitData.members ||
      activeMembers.map((m: any) => ({
        userId: m.userId,
        displayName: m.displayName,
        percentage: 0,
      }));
    const updated = members.map((m: any) =>
      m.userId === userId ? { ...m, percentage } : m,
    );
    setFormData(prev => ({
      ...prev,
      splitData: { ...prev.splitData, members: updated },
    }));
  };

  const handleExactChange = (userId: string, amountLocal: number) => {
    const members =
      formData.splitData.members ||
      activeMembers.map((m: any) => ({
        userId: m.userId,
        displayName: m.displayName,
        amountLocal: 0,
      }));
    const updated = members.map((m: any) =>
      m.userId === userId ? { ...m, amountLocal } : m,
    );
    setFormData(prev => ({
      ...prev,
      splitData: { ...prev.splitData, members: updated },
    }));
  };

  const handleSharesChange = (userId: string, shares: number) => {
    const members =
      formData.splitData.members ||
      activeMembers.map((m: any) => ({
        userId: m.userId,
        displayName: m.displayName,
        shares: 1,
      }));
    const updated = members.map((m: any) =>
      m.userId === userId ? { ...m, shares } : m,
    );
    setFormData(prev => ({
      ...prev,
      splitData: { ...prev.splitData, members: updated },
    }));
  };

  const handleNext = () => {
    haptics.medium();
    if (currentStep === 0) {
      if (!formData.title.trim()) {
        Alert.alert('Missing Title', 'Please enter what this expense was for.');
        return;
      }
      if (!formData.amountLocal || parseFloat(formData.amountLocal) <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
        return;
      }
      if (stops.length === 0) {
        Alert.alert(
          'No Stops Found',
          'This trip has no stops. Every expense must belong to a location/stop. Please add a stop from the trip dashboard first.',
        );
        return;
      }
      if (!formData.stopId) {
        Alert.alert('No Stop', 'Please select a location/stop.');
        return;
      }
    }
    if (currentStep < 2) setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    haptics.medium();
    if (
      formData.splitMethod !== 'personal' &&
      formData.splitMethod !== 'equal'
    ) {
      if (
        !formData.splitData.members ||
        formData.splitData.members.length === 0
      ) {
        Alert.alert(
          'Invalid Split',
          'Please configure the split details before saving.',
        );
        return;
      }
    }

    setIsSubmitting(true);

    let locationData:
      { latitude: number; longitude: number; name?: string } | undefined;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
    } catch (error) {
      console.log('Location fetch skipped/failed');
    }

    const payload = {
      stopId: formData.stopId,
      title: formData.title.trim(),
      category: formData.category,
      amountLocal: parseFloat(formData.amountLocal),
      paidBy: formData.paidBy,
      date: formData.date.toISOString(),
      notes: formData.notes || undefined,
      location: formData.location || locationData,
      split:
        formData.splitMethod === 'equal'
          ? { method: 'equal', memberIds: formData.splitData.memberIds }
          : formData.splitMethod === 'personal'
            ? { method: 'personal' }
            : {
                method: formData.splitMethod,
                members: formData.splitData.members,
              },
    };

    updateExpense(
      { expenseId, data: payload },
      {
        onSuccess: () => {
          haptics.success();
          setIsSubmitting(false);
          router.back();
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to create expense');
          setIsSubmitting(false);
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={StyleSheet.absoluteFill}>
        <GlobalBackground />
      </View>

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            borderBottomColor: theme.colors.borderLight,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={({ hovered }: WebPressableState) => [
            styles.headerBtn,
            Platform.OS === 'web' && hovered && ({ opacity: 0.6 } as any),
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon name="x" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Edit Expense
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <StepIndicator currentStep={currentStep} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.formWrapper, isWebDesktop && styles.webDesktopForm]}
        >
          {/* ================================================================ */}
          {/* STEP 1: Details */}
          {/* ================================================================ */}
          {currentStep === 0 && (
            <Animated.View
              entering={FadeInRight.duration(400).springify()}
              style={styles.stepContainer}
            >
              {/* Hero Amount Input */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(400).springify()}
              >
                <GlassCard
                  style={styles.heroAmountBox}
                  intensity={theme.isDark ? 15 : 8}
                >
                  <Text
                    style={[
                      styles.heroAmountLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Total Amount
                  </Text>
                  <View style={[styles.heroInputWrapper, { maxWidth: '100%' }]}>
                    <Text
                      style={[
                        styles.heroCurrencySymbol,
                        {
                          color: theme.colors.textPrimary,
                          fontSize: Math.min(40, amountFontSize * 0.6 + 10),
                        },
                      ]}
                    >
                      {currency === 'INR'
                        ? '₹'
                        : currency === 'USD'
                          ? '$'
                          : currency === 'EUR'
                            ? '€'
                            : currency === 'GBP'
                              ? '£'
                              : ''}
                    </Text>
                    <TextInput
                      style={[
                        styles.heroAmountInput,
                        {
                          color: theme.colors.textPrimary,
                          borderBottomColor: isAmountFocused
                            ? theme.colors.primary
                            : 'transparent',
                          fontSize: amountFontSize,
                          minWidth: 60,
                          maxWidth: '100%',
                          flexShrink: 1,
                        },
                        isAmountFocused && styles.heroAmountInputFocused,
                      ]}
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={formData.amountLocal}
                      onChangeText={text =>
                        handleUpdate(
                          'amountLocal',
                          text.replace(/[^0-9.]/g, ''),
                        )
                      }
                      onFocus={() => {
                        haptics.light();
                        setIsAmountFocused(true);
                      }}
                      onBlur={() => setIsAmountFocused(false)}
                      keyboardType="decimal-pad"
                      autoFocus
                      maxLength={15}
                      numberOfLines={1}
                    />
                    <Text
                      style={[
                        styles.heroCurrencyCode,
                        {
                          color: theme.colors.textTertiary,
                          fontSize: Math.min(20, amountFontSize * 0.3 + 8),
                          marginTop: amountFontSize * 0.25,
                        },
                      ]}
                    >
                      {currency}
                    </Text>
                  </View>
                  {currency !== baseCurrency && formData.amountLocal ? (
                    <Text
                      style={[
                        styles.heroConversion,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      ≈ {baseCurrency === 'INR' ? '₹' : ''}
                      {(
                        parseFloat(formData.amountLocal) * exchangeRate
                      ).toLocaleString()}{' '}
                      {baseCurrency}
                    </Text>
                  ) : (
                    <Text style={styles.heroConversion}> </Text>
                  )}
                </GlassCard>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(200).duration(400).springify()}
              >
                <GlassCard
                  style={styles.formCard}
                  intensity={theme.isDark ? 15 : 8}
                >
                  <View style={styles.formCardInner}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      What was it for?
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.colors.textPrimary,
                          borderColor: isTitleFocused
                            ? theme.colors.primary
                            : theme.colors.borderLight,
                          backgroundColor: theme.colors.surface,
                        },
                        isTitleFocused && styles.inputFocused,
                      ]}
                      placeholder="e.g., Desert Safari, Hotel Taj"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={formData.title}
                      onChangeText={text => handleUpdate('title', text)}
                      onFocus={() => {
                        haptics.light();
                        setIsTitleFocused(true);
                      }}
                      onBlur={() => setIsTitleFocused(false)}
                      maxLength={200}
                    />

                    {/* Stops Chips */}
                    {stops.length > 1 && (
                      <View style={styles.fieldWrapper}>
                        <Text
                          style={[
                            styles.fieldLabel,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Location / Stop
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.chipsScroll}
                        >
                          {stops.map((stop: any) => {
                            const isActive = formData.stopId === stop._id;
                            return (
                              <Pressable
                                key={stop._id}
                                style={({ hovered }: WebPressableState) => [
                                  styles.pill,
                                  {
                                    borderColor: isActive
                                      ? theme.colors.primary
                                      : theme.colors.borderLight,
                                    backgroundColor: isActive
                                      ? theme.colors.primary
                                      : theme.colors.surface,
                                  },
                                  Platform.OS === 'web' &&
                                    hovered &&
                                    !isActive &&
                                    ({
                                      backgroundColor: theme.colors.primaryBg,
                                    } as any),
                                ]}
                                onPress={() => handleUpdate('stopId', stop._id)}
                              >
                                <Text style={styles.pillEmoji}>
                                  {stop.emoji || '📍'}
                                </Text>
                                <Text
                                  style={[
                                    styles.pillText,
                                    {
                                      color: isActive
                                        ? '#FFF'
                                        : theme.colors.textSecondary,
                                    },
                                  ]}
                                >
                                  {stop.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {/* Category Grid */}
                    <View style={styles.fieldWrapper}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Category
                      </Text>
                      <View style={styles.categoryGrid}>
                        {CATEGORIES.map(cat => {
                          const isActive = formData.category === cat.key;
                          return (
                            <Pressable
                              key={cat.key}
                              style={({ hovered }: WebPressableState) => [
                                styles.catPill,
                                {
                                  borderColor: isActive
                                    ? theme.colors.primary
                                    : theme.colors.borderLight,
                                  backgroundColor: isActive
                                    ? theme.colors.primary
                                    : theme.colors.surface,
                                },
                                Platform.OS === 'web' &&
                                  hovered &&
                                  !isActive &&
                                  ({ borderColor: theme.colors.border } as any),
                              ]}
                              onPress={() => handleUpdate('category', cat.key)}
                            >
                              <Text style={styles.catEmoji}>{cat.emoji}</Text>
                              <Text
                                style={[
                                  styles.catText,
                                  {
                                    color: isActive
                                      ? '#FFF'
                                      : theme.colors.textSecondary,
                                  },
                                ]}
                              >
                                {cat.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* Paid By */}
                    <View style={styles.fieldWrapper}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Who paid?
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipsScroll}
                      >
                        {activeMembers.map((member: any) => {
                          const isActive = formData.paidBy === member.userId;
                          const isAdmin =
                            trip?.members?.find(
                              (m: any) => m.userId === user?._id,
                            )?.role === 'admin';
                          const isDisabled =
                            trip?.allowAnyPayer === false &&
                            member.userId !== user?._id &&
                            !isAdmin;
                          return (
                            <Pressable
                              key={member.userId}
                              style={({ hovered }: WebPressableState) => [
                                styles.avatarPill,
                                {
                                  borderColor: isActive
                                    ? theme.colors.primary
                                    : theme.colors.borderLight,
                                  backgroundColor: isActive
                                    ? theme.colors.primary
                                    : theme.colors.surface,
                                },
                                isDisabled && { opacity: 0.5 },
                                Platform.OS === 'web' &&
                                  hovered &&
                                  !isDisabled &&
                                  !isActive &&
                                  ({
                                    backgroundColor: theme.colors.primaryBg,
                                  } as any),
                              ]}
                              onPress={() =>
                                !isDisabled &&
                                handleUpdate('paidBy', member.userId)
                              }
                            >
                              <View
                                style={[
                                  styles.avatarCircle,
                                  {
                                    backgroundColor: isActive
                                      ? theme.colors.primary
                                      : theme.colors.primaryBg,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.avatarInitial,
                                    {
                                      color: isActive
                                        ? '#FFF'
                                        : theme.colors.primary,
                                    },
                                  ]}
                                >
                                  {member.displayName?.charAt(0)?.toUpperCase()}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.avatarPillText,
                                  {
                                    color: isActive
                                      ? '#FFF'
                                      : theme.colors.textSecondary,
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {member.displayName.split(' ')[0]}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Location Map Picker Button */}
                    <View style={styles.fieldWrapper}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Map Location{' '}
                        <Text
                          style={[
                            styles.optionalText,
                            { color: theme.colors.textTertiary },
                          ]}
                        >
                          (optional)
                        </Text>
                      </Text>
                      <Pressable
                        style={({ hovered }: WebPressableState) => [
                          styles.locationBtn,
                          {
                            borderColor: theme.colors.borderLight,
                            backgroundColor: theme.colors.surface,
                          },
                          Platform.OS === 'web' &&
                            hovered &&
                            ({
                              backgroundColor: theme.colors.primaryBg,
                            } as any),
                        ]}
                        onPress={() => {
                          haptics.light();
                          setTempLocation(formData.location || null);
                          setShowMapPicker(true);
                        }}
                      >
                        <View style={styles.locationBtnLeft}>
                          <AppIcon
                            name="map-pin"
                            size={16}
                            color={theme.colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.locationBtnText,
                              {
                                color: formData.location
                                  ? theme.colors.textPrimary
                                  : theme.colors.textTertiary,
                              },
                            ]}
                          >
                            {formData.location
                              ? 'Location selected'
                              : 'Drop a pin on the map'}
                          </Text>
                        </View>
                        {formData.location ? (
                          <Text
                            style={[
                              styles.locationBtnChange,
                              { color: theme.colors.primary },
                            ]}
                          >
                            Edit
                          </Text>
                        ) : (
                          <AppIcon
                            name="chevron-right"
                            size={18}
                            color={theme.colors.textTertiary}
                          />
                        )}
                      </Pressable>
                    </View>

                    {/* Notes */}
                    <View style={[styles.fieldWrapper, { marginBottom: 0 }]}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Notes{' '}
                        <Text
                          style={[
                            styles.optionalText,
                            { color: theme.colors.textTertiary },
                          ]}
                        >
                          (optional)
                        </Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          styles.textArea,
                          {
                            color: theme.colors.textPrimary,
                            borderColor: isNotesFocused
                              ? theme.colors.primary
                              : theme.colors.borderLight,
                            backgroundColor: theme.colors.surface,
                          },
                          isNotesFocused && styles.inputFocused,
                        ]}
                        placeholder="Add any extra details..."
                        placeholderTextColor={theme.colors.textTertiary}
                        value={formData.notes}
                        onChangeText={text => handleUpdate('notes', text)}
                        onFocus={() => {
                          haptics.light();
                          setIsNotesFocused(true);
                        }}
                        onBlur={() => setIsNotesFocused(false)}
                        maxLength={500}
                        multiline
                      />
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            </Animated.View>
          )}

          {/* ================================================================ */}
          {/* STEP 2: Split Method */}
          {/* ================================================================ */}
          {currentStep === 1 && (
            <Animated.View
              entering={FadeInRight.duration(400).springify()}
              style={styles.stepContainer}
            >
              <Text
                style={[
                  styles.stepHeroTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                How do you want to split it?
              </Text>

              <View style={styles.splitMethodsGrid}>
                {SPLIT_METHODS.map((method, index) => {
                  const isActive = formData.splitMethod === method.key;
                  return (
                    <Animated.View
                      key={method.key}
                      entering={FadeInDown.delay(index * 100)
                        .duration(400)
                        .springify()}
                    >
                      <Pressable
                        style={({ hovered }: WebPressableState) => [
                          styles.splitCard,
                          {
                            borderColor: isActive
                              ? theme.colors.primary
                              : theme.colors.borderLight,
                            backgroundColor: isActive
                              ? theme.colors.primary + '15'
                              : theme.colors.surface,
                          },
                          Platform.OS === 'web' &&
                            hovered &&
                            !isActive &&
                            ({ borderColor: theme.colors.border } as any),
                        ]}
                        onPress={() => {
                          haptics.light();
                          handleUpdate('splitMethod', method.key);
                          if (
                            method.key === 'percentage' ||
                            method.key === 'exact' ||
                            method.key === 'shares'
                          ) {
                            handleUpdate('splitData', {
                              members: activeMembers.map((m: any) => ({
                                userId: m.userId,
                                displayName: m.displayName,
                                ...(method.key === 'percentage'
                                  ? { percentage: 0 }
                                  : {}),
                                ...(method.key === 'exact'
                                  ? { amountLocal: 0 }
                                  : {}),
                                ...(method.key === 'shares'
                                  ? { shares: 1 }
                                  : {}),
                              })),
                            });
                          } else if (method.key === 'equal') {
                            handleUpdate('splitData', {
                              memberIds: activeMembers.map(
                                (m: any) => m.userId,
                              ),
                            });
                          }
                        }}
                      >
                        <View style={styles.splitCardInner}>
                          <View style={styles.splitCardHeader}>
                            <Text
                              style={[
                                styles.splitCardTitle,
                                {
                                  color: isActive
                                    ? theme.colors.primary
                                    : theme.colors.textPrimary,
                                },
                              ]}
                            >
                              {method.label}
                            </Text>
                            <View
                              style={[
                                styles.radioCircle,
                                {
                                  borderColor: isActive
                                    ? theme.colors.primary
                                    : theme.colors.borderLight,
                                },
                                isActive && styles.radioCircleActive,
                              ]}
                            >
                              {isActive && (
                                <View
                                  style={[
                                    styles.radioDot,
                                    { backgroundColor: theme.colors.primary },
                                  ]}
                                />
                              )}
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.splitCardDesc,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {method.desc}
                          </Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>

              <View style={styles.splitConfigArea}>
                {/* Equal */}
                {formData.splitMethod === 'equal' && (
                  <Animated.View
                    entering={FadeInDown.duration(400).springify()}
                  >
                    <GlassCard
                      style={styles.configCard}
                      intensity={theme.isDark ? 15 : 8}
                    >
                      <View style={styles.configCardInner}>
                        <Text
                          style={[
                            styles.configTitle,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Select Members
                        </Text>
                        {activeMembers.map((member: any) => {
                          const isSelected =
                            formData.splitData.memberIds?.includes(
                              member.userId,
                            );
                          return (
                            <Pressable
                              key={member.userId}
                              style={({ hovered }: WebPressableState) => [
                                styles.memberCheckRow,
                                { borderBottomColor: theme.colors.borderLight },
                                Platform.OS === 'web' &&
                                  hovered &&
                                  ({
                                    backgroundColor: theme.colors.primaryBg,
                                  } as any),
                              ]}
                              onPress={() => handleToggleMember(member.userId)}
                            >
                              <View style={styles.memberCheckLeft}>
                                <View
                                  style={[
                                    styles.miniAvatar,
                                    { backgroundColor: theme.colors.primaryBg },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.miniAvatarText,
                                      { color: theme.colors.primary },
                                    ]}
                                  >
                                    {member.displayName
                                      ?.charAt(0)
                                      ?.toUpperCase()}
                                  </Text>
                                </View>
                                <Text
                                  style={[
                                    styles.memberCheckName,
                                    { color: theme.colors.textPrimary },
                                  ]}
                                >
                                  {member.displayName}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.checkbox,
                                  {
                                    borderColor: isSelected
                                      ? theme.colors.primary
                                      : theme.colors.borderLight,
                                    backgroundColor: isSelected
                                      ? theme.colors.primary
                                      : 'transparent',
                                  },
                                ]}
                              >
                                {isSelected && (
                                  <AppIcon
                                    name="check"
                                    size={12}
                                    color="#FFF"
                                  />
                                )}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </GlassCard>
                  </Animated.View>
                )}

                {/* Percentage */}
                {formData.splitMethod === 'percentage' && (
                  <Animated.View
                    entering={FadeInDown.duration(400).springify()}
                  >
                    <GlassCard
                      style={styles.configCard}
                      intensity={theme.isDark ? 15 : 8}
                    >
                      <View style={styles.configCardInner}>
                        <Text
                          style={[
                            styles.configTitle,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Assign Percentages
                        </Text>
                        {(formData.splitData.members || []).map((m: any) => (
                          <View
                            key={m.userId}
                            style={[
                              styles.memberInputRow,
                              { borderBottomColor: theme.colors.borderLight },
                            ]}
                          >
                            <Text
                              style={[
                                styles.memberInputName,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              {m.displayName}
                            </Text>
                            <View
                              style={[
                                styles.inputWithSuffix,
                                {
                                  borderColor: theme.colors.borderLight,
                                  backgroundColor: theme.colors.surface,
                                },
                              ]}
                            >
                              <TextInput
                                style={[
                                  styles.numericInput,
                                  { color: theme.colors.textPrimary },
                                ]}
                                value={m.percentage?.toString() || '0'}
                                onChangeText={text =>
                                  handlePercentageChange(
                                    m.userId,
                                    parseInt(text) || 0,
                                  )
                                }
                                keyboardType="numeric"
                                maxLength={3}
                              />
                              <Text
                                style={[
                                  styles.inputSuffix,
                                  { color: theme.colors.textTertiary },
                                ]}
                              >
                                %
                              </Text>
                            </View>
                          </View>
                        ))}
                        <Text
                          style={[
                            styles.totalIndicator,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          Total:{' '}
                          {(formData.splitData.members || []).reduce(
                            (s: number, m: any) => s + (m.percentage || 0),
                            0,
                          )}
                          %
                        </Text>
                      </View>
                    </GlassCard>
                  </Animated.View>
                )}

                {/* Exact */}
                {formData.splitMethod === 'exact' && (
                  <Animated.View
                    entering={FadeInDown.duration(400).springify()}
                  >
                    <GlassCard
                      style={styles.configCard}
                      intensity={theme.isDark ? 15 : 8}
                    >
                      <View style={styles.configCardInner}>
                        <Text
                          style={[
                            styles.configTitle,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Set Exact Amounts
                        </Text>
                        {(formData.splitData.members || []).map((m: any) => (
                          <View
                            key={m.userId}
                            style={[
                              styles.memberInputRow,
                              { borderBottomColor: theme.colors.borderLight },
                            ]}
                          >
                            <Text
                              style={[
                                styles.memberInputName,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              {m.displayName}
                            </Text>
                            <View
                              style={[
                                styles.inputWithSuffix,
                                {
                                  borderColor: theme.colors.borderLight,
                                  backgroundColor: theme.colors.surface,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.inputPrefix,
                                  { color: theme.colors.textTertiary },
                                ]}
                              >
                                {currency === 'INR' ? '₹' : ''}
                              </Text>
                              <TextInput
                                style={[
                                  styles.numericInput,
                                  {
                                    color: theme.colors.textPrimary,
                                    width: 80,
                                    textAlign: 'right',
                                  },
                                ]}
                                value={m.amountLocal?.toString() || '0'}
                                onChangeText={text =>
                                  handleExactChange(
                                    m.userId,
                                    parseFloat(text) || 0,
                                  )
                                }
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                                placeholderTextColor={theme.colors.textTertiary}
                              />
                            </View>
                          </View>
                        ))}
                      </View>
                    </GlassCard>
                  </Animated.View>
                )}

                {/* Shares */}
                {formData.splitMethod === 'shares' && (
                  <Animated.View
                    entering={FadeInDown.duration(400).springify()}
                  >
                    <GlassCard
                      style={styles.configCard}
                      intensity={theme.isDark ? 15 : 8}
                    >
                      <View style={styles.configCardInner}>
                        <Text
                          style={[
                            styles.configTitle,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Set Shares (Ratio)
                        </Text>
                        {(formData.splitData.members || []).map((m: any) => (
                          <View
                            key={m.userId}
                            style={[
                              styles.memberInputRow,
                              { borderBottomColor: theme.colors.borderLight },
                            ]}
                          >
                            <Text
                              style={[
                                styles.memberInputName,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              {m.displayName}
                            </Text>
                            <View
                              style={[
                                styles.inputWithSuffix,
                                {
                                  borderColor: theme.colors.borderLight,
                                  backgroundColor: theme.colors.surface,
                                },
                              ]}
                            >
                              <TextInput
                                style={[
                                  styles.numericInput,
                                  {
                                    color: theme.colors.textPrimary,
                                    width: 50,
                                  },
                                ]}
                                value={m.shares?.toString() || '1'}
                                onChangeText={text =>
                                  handleSharesChange(
                                    m.userId,
                                    parseInt(text) || 1,
                                  )
                                }
                                keyboardType="numeric"
                                maxLength={2}
                              />
                              <Text
                                style={[
                                  styles.inputSuffix,
                                  { color: theme.colors.textTertiary },
                                ]}
                              >
                                share(s)
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </GlassCard>
                  </Animated.View>
                )}
              </View>

              {previewSplits.length > 0 && (
                <SplitPreview
                  splits={previewSplits}
                  currency={currency}
                  baseCurrency={baseCurrency}
                />
              )}
            </Animated.View>
          )}

          {/* ================================================================ */}
          {/* STEP 3: Review */}
          {/* ================================================================ */}
          {currentStep === 2 && (
            <Animated.View
              entering={FadeInRight.duration(400).springify()}
              style={styles.stepContainer}
            >
              <Text
                style={[
                  styles.stepHeroTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Review & Confirm
              </Text>

              <GlassCard
                style={styles.receiptCard}
                intensity={theme.isDark ? 15 : 8}
              >
                <View style={styles.receiptInner}>
                  <View style={styles.receiptHeader}>
                    <View
                      style={[
                        styles.receiptIconWrap,
                        { backgroundColor: theme.colors.primaryBg },
                      ]}
                    >
                      <Text style={styles.receiptEmoji}>
                        {
                          CATEGORIES.find(c => c.key === formData.category)
                            ?.emoji
                        }
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.receiptTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {formData.title}
                    </Text>
                    <Text
                      style={[
                        styles.receiptAmount,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {parseFloat(formData.amountLocal).toLocaleString()}{' '}
                      {currency}
                    </Text>
                    {currency !== baseCurrency && (
                      <Text
                        style={[
                          styles.receiptAmountBase,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        ≈{' '}
                        {(
                          parseFloat(formData.amountLocal) * exchangeRate
                        ).toLocaleString()}{' '}
                        {baseCurrency}
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.receiptDivider,
                      { backgroundColor: theme.colors.borderLight },
                    ]}
                  />

                  <View style={styles.receiptDetails}>
                    <View style={styles.receiptRow}>
                      <Text
                        style={[
                          styles.receiptLabel,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Paid By
                      </Text>
                      <Text
                        style={[
                          styles.receiptValue,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {
                          activeMembers.find(
                            (m: any) => m.userId === formData.paidBy,
                          )?.displayName
                        }
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text
                        style={[
                          styles.receiptLabel,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Category
                      </Text>
                      <Text
                        style={[
                          styles.receiptValue,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {
                          CATEGORIES.find(c => c.key === formData.category)
                            ?.label
                        }
                      </Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text
                        style={[
                          styles.receiptLabel,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Location
                      </Text>
                      <Text
                        style={[
                          styles.receiptValue,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {
                          stops.find((s: any) => s._id === formData.stopId)
                            ?.name
                        }
                      </Text>
                    </View>
                    {formData.location && (
                      <View style={styles.receiptRow}>
                        <Text
                          style={[
                            styles.receiptLabel,
                            { color: theme.colors.textTertiary },
                          ]}
                        >
                          Map Pin
                        </Text>
                        <Text
                          style={[
                            styles.receiptValue,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          📍 Added
                        </Text>
                      </View>
                    )}
                    <View style={styles.receiptRow}>
                      <Text
                        style={[
                          styles.receiptLabel,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Split Method
                      </Text>
                      <Text
                        style={[
                          styles.receiptValue,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {formData.splitMethod.charAt(0).toUpperCase() +
                          formData.splitMethod.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </GlassCard>

              {previewSplits.length > 0 && (
                <SplitPreview
                  splits={previewSplits}
                  currency={currency}
                  baseCurrency={baseCurrency}
                />
              )}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 16,
            borderTopColor: theme.colors.borderLight,
          },
        ]}
      >
        <View
          style={[styles.bottomButtons, isWebDesktop && styles.webDesktopForm]}
        >
          {currentStep > 0 && (
            <AnimatedPressable
              style={[
                styles.backBtn,
                {
                  transform: [{ scale: backBtnScale }],
                  borderColor: theme.colors.borderLight,
                },
              ]}
              onPressIn={() => (backBtnScale.value = withSpring(0.95))}
              onPressOut={() => (backBtnScale.value = withSpring(1))}
              onPress={() => {
                haptics.light();
                setCurrentStep(prev => prev - 1);
              }}
            >
              <Text
                style={[
                  styles.backBtnText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Back
              </Text>
            </AnimatedPressable>
          )}
          {currentStep < 2 ? (
            <AnimatedPressable
              style={[
                styles.nextBtnWrap,
                { transform: [{ scale: nextBtnScale }] },
              ]}
              onPressIn={() => (nextBtnScale.value = withSpring(0.96))}
              onPressOut={() => (nextBtnScale.value = withSpring(1))}
              onPress={handleNext}
            >
              <LinearGradient
                colors={theme.gradients.secondary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGradient}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
              </LinearGradient>
            </AnimatedPressable>
          ) : (
            <AnimatedPressable
              style={[
                styles.nextBtnWrap,
                { transform: [{ scale: nextBtnScale }] },
                isLoading && { opacity: 0.7 },
              ]}
              onPressIn={() => (nextBtnScale.value = withSpring(0.96))}
              onPressOut={() => (nextBtnScale.value = withSpring(1))}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[
                  theme.colors.success,
                  theme.colors.successBg || '#059669',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtnGradient}
              >
                {isLoading ? (
                  <GlobalLoader variant="inline" color="#FFF" size="small" />
                ) : (
                  <Text style={styles.nextBtnText}>Save Expense</Text>
                )}
              </LinearGradient>
            </AnimatedPressable>
          )}
        </View>
      </View>

      {/* Map Picker Modal */}
      <Modal visible={showMapPicker} animationType="slide" transparent={false}>
        <View
          style={[styles.mapModalContainer, { backgroundColor: 'transparent' }]}
        >
          <View
            style={[
              styles.mapModalHeader,
              {
                paddingTop: insets.top + 16,
                borderBottomColor: theme.colors.borderLight,
              },
            ]}
          >
            <Pressable
              onPress={() => setShowMapPicker(false)}
              style={styles.mapModalBtn}
            >
              <Text
                style={[
                  styles.mapModalBtnText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
            <Text
              style={[
                styles.mapModalTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Pick Location
            </Text>
            <Pressable
              onPress={() => {
                if (tempLocation) handleUpdate('location', tempLocation);
                setShowMapPicker(false);
              }}
              style={styles.mapModalBtn}
            >
              <Text
                style={[
                  styles.mapModalBtnText,
                  styles.mapModalBtnDone,
                  { color: theme.colors.primary },
                ]}
              >
                Done
              </Text>
            </Pressable>
          </View>
          <View
            style={[
              styles.mapInstructionBar,
              { backgroundColor: theme.colors.primaryBg },
            ]}
          >
            <Text
              style={[
                styles.mapInstructionText,
                { color: theme.colors.primary },
              ]}
            >
              Tap anywhere on the map to drop a pin.
            </Text>
          </View>
          <LeafletMap
            style={styles.mapModalMap}
            initialRegion={{
              latitude:
                formData.location?.latitude ||
                selectedStop?.location?.lat ||
                20.5937,
              longitude:
                formData.location?.longitude ||
                selectedStop?.location?.lng ||
                78.9629,
            }}
            markers={
              tempLocation
                ? [
                    {
                      id: 'temp',
                      latitude: tempLocation.latitude,
                      longitude: tempLocation.longitude,
                      title: 'Selected',
                      emoji: '📍',
                    },
                  ]
                : []
            }
            interactive={true}
            onMapPress={coord => setTempLocation(coord)}
            darkMode={theme.isDark}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// Premium Styles (Fully Themed)
// ============================================================
const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: 'transparent' },
        formWrapper: { width: '100%' },
        webDesktopForm: { maxWidth: 640, alignSelf: 'center' },

        // Header
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingBottom: 16,
          borderBottomWidth: 1,
        },
        headerBtn: { width: 40, alignItems: 'flex-start' },
        headerTitle: { fontSize: 16, fontWeight: '800' },

        // Step Indicator
        stepRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 20,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
        },
        stepDotContainer: { alignItems: 'center' },
        stepDot: {
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        stepDotActive: {},
        stepDotCompleted: {},
        stepNumber: { fontSize: 11, fontWeight: '800' },
        stepNumberActive: { color: '#FFF' },
        stepName: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        stepNameActive: {},
        stepConnector: {
          flex: 1,
          maxWidth: 40,
          height: 2,
          marginHorizontal: 8,
          marginBottom: 18,
          backgroundColor: 'rgba(255,255,255,0.1)',
        },
        stepConnectorActive: {},

        // Content
        scrollContent: {
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 40,
        },
        stepContainer: { flex: 1 },
        stepHeroTitle: {
          fontSize: 24,
          fontWeight: '900',
          marginBottom: 24,
          textAlign: 'center',
          letterSpacing: -0.5,
        },

        // Hero Amount Input
        heroAmountBox: { padding: 24, alignItems: 'center', marginBottom: 32 },
        heroAmountLabel: {
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 12,
        },
        heroInputWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 1,
          width: '100%',
        },
        heroCurrencySymbol: {
          fontSize: 40,
          fontWeight: '800',
          marginRight: 8,
          opacity: 0.8,
          flexShrink: 0,
        },
        heroAmountInput: {
          fontWeight: '900',
          flexShrink: 1,
          textAlign: 'center',
          letterSpacing: -2,
          borderBottomWidth: 2,
          ...(Platform.OS === 'web'
            ? { outlineStyle: 'none', minWidth: 60 }
            : {}),
        } as any,
        heroAmountInputFocused: {},
        heroCurrencyCode: {
          fontSize: 20,
          fontWeight: '800',
          marginLeft: 12,
          marginTop: 16,
          flexShrink: 0,
        },
        heroConversion: { fontSize: 13, fontWeight: '600', marginTop: 8 },

        // Details Form Card
        formCard: {
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        formCardInner: { padding: 20 },
        fieldWrapper: { marginTop: 24 },
        fieldLabel: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 10,
          letterSpacing: 0.5,
        },
        optionalText: { fontWeight: '500' },

        input: {
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 14,
          fontWeight: '500',
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
        } as any,
        inputFocused: {},
        textArea: { height: 80, textAlignVertical: 'top', paddingTop: 16 },

        // Chips & Pills
        chipsScroll: { gap: 10, paddingRight: 20 },
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 20,
          borderWidth: 1,
        },
        pillEmoji: { fontSize: 14 },
        pillText: { fontSize: 13, fontWeight: '600' },

        categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
        catPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 16,
          borderWidth: 1,
        },
        catEmoji: { fontSize: 14 },
        catText: { fontSize: 12, fontWeight: '600' },

        avatarPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 6,
          paddingVertical: 6,
          paddingRight: 16,
          borderRadius: 24,
          borderWidth: 1,
        },
        avatarCircle: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarInitial: { fontSize: 12, fontWeight: '800' },
        avatarPillText: { fontSize: 13, fontWeight: '600' },

        // Location Button
        locationBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        locationBtnLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        locationBtnText: { fontSize: 13, fontWeight: '600' },
        locationBtnChange: { fontSize: 12, fontWeight: '800' },

        // Split Cards
        splitMethodsGrid: { gap: 12, marginBottom: 24 },
        splitCard: {
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 2,
          ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } : {}),
        },
        splitCardInner: { padding: 16 },
        splitCardHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        },
        splitCardTitle: { fontSize: 15, fontWeight: '800' },
        radioCircle: {
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioCircleActive: {},
        radioDot: { width: 10, height: 10, borderRadius: 5 },
        splitCardDesc: { fontSize: 12, fontWeight: '500' },

        // Split Configuration
        splitConfigArea: { marginBottom: 24 },
        configCard: {
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        configCardInner: { padding: 20 },
        configTitle: {
          fontSize: 13,
          fontWeight: '800',
          marginBottom: 16,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        memberCheckRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 12,
          borderBottomWidth: 1,
        },
        memberCheckLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        miniAvatar: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        },
        miniAvatarText: { fontSize: 13, fontWeight: '800' },
        memberCheckName: { fontSize: 14, fontWeight: '600' },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: 8,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
        },

        memberInputRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 12,
          borderBottomWidth: 1,
        },
        memberInputName: { fontSize: 14, fontWeight: '600', flex: 1 },
        inputWithSuffix: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 12,
        },
        numericInput: {
          paddingVertical: 10,
          fontSize: 14,
          fontWeight: '800',
          textAlign: 'center',
          minWidth: 40,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
        } as any,
        inputSuffix: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
        inputPrefix: { fontSize: 12, fontWeight: '700', marginRight: 4 },
        totalIndicator: {
          textAlign: 'right',
          fontSize: 13,
          fontWeight: '800',
          marginTop: 16,
        },

        // Split Preview
        splitPreviewCardWrapper: {
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
          marginTop: 8,
        },
        splitPreviewCard: { padding: 20 },
        splitPreviewTitle: {
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 16,
        },
        splitPreviewList: { gap: 4 },
        splitRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
        },
        splitUser: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        splitAvatar: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        },
        splitInitial: { fontSize: 13, fontWeight: '800' },
        splitName: { fontSize: 14, fontWeight: '600' },
        splitPercent: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        splitAmounts: { alignItems: 'flex-end' },
        splitAmount: { fontSize: 14, fontWeight: '800' },
        splitAmountBase: { fontSize: 11, fontWeight: '600', marginTop: 2 },

        // Receipt Card
        receiptCard: {
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
          marginBottom: 24,
        },
        receiptInner: { padding: 24 },
        receiptHeader: { alignItems: 'center', marginBottom: 20 },
        receiptIconWrap: {
          width: 56,
          height: 56,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        },
        receiptEmoji: { fontSize: 28 },
        receiptTitle: {
          fontSize: 18,
          fontWeight: '800',
          marginBottom: 8,
          textAlign: 'center',
        },
        receiptAmount: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
        receiptAmountBase: { fontSize: 13, fontWeight: '700', marginTop: 4 },
        receiptDivider: { height: 2, marginBottom: 20 },
        receiptDetails: { gap: 16 },
        receiptRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 4,
        },
        receiptLabel: {
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        receiptValue: {
          fontSize: 13,
          fontWeight: '800',
          textAlign: 'right',
          flex: 1,
          marginLeft: 16,
        },

        // Bottom Bar
        bottomBar: {
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
        },
        bottomButtons: { flexDirection: 'row', gap: 12, width: '100%' },
        backBtn: {
          flex: 1,
          height: 56,
          borderRadius: 16,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        backBtnText: { fontSize: 15, fontWeight: '800' },
        nextBtnWrap: { flex: 2, borderRadius: 16, overflow: 'hidden' },
        nextBtnGradient: {
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
        },
        nextBtnText: {
          color: '#FFF',
          fontSize: 15,
          fontWeight: '800',
          letterSpacing: 0.5,
        },

        // Map Modal
        mapModalContainer: { flex: 1 },
        mapModalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
        },
        mapModalBtn: { padding: 8, margin: -8 },
        mapModalBtnText: { fontSize: 15, fontWeight: '600' },
        mapModalBtnDone: { fontWeight: '800' },
        mapModalTitle: { fontSize: 16, fontWeight: '800' },
        mapInstructionBar: { paddingVertical: 12, alignItems: 'center' },
        mapInstructionText: { fontSize: 12, fontWeight: '700' },
        mapModalMap: { flex: 1 },
      }),
    [theme],
  );
};
