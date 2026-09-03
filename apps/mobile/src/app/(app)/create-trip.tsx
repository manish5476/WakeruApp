// src/app/(app)/create-trip.tsx
import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  useTripTemplates,
  useCreateTrip,
  useSearchUsers,
  useDebounce,
  useFriends,
} from '../../hooks';
import { useTheme } from '../../providers/ThemeProvider';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { Avatar } from '../../components/ui/Avatar';
import { haptics } from '../../utils/haptics';
import { locationApi } from '../../services/api/location.api';
import AppIcon from '../../components/common/AppIcon';
import GlobalLoader from '../../components/common/GlobalLoader';
import type { Theme } from '../../theme';

// ─── Types & Constants ───────────────────────────────────────
type SplitMethod = 'equal' | 'percentage' | 'exact' | 'shares';

interface TripFormData {
  template?: string;
  title: string;
  description: string;
  coverImage?: string;
  startDate: Date;
  endDate: Date;
  baseCurrency: string;
  totalBudget: string;
  defaultSplitMethod: SplitMethod;
  allowAnyPayer: boolean;
  memberIds: string[];
}

const STEPS = [
  { key: 'template', label: 'Template', icon: 'sparkles' },
  { key: 'details', label: 'Details', icon: 'file-text' },
  { key: 'members', label: 'Members', icon: 'users' },
  { key: 'review', label: 'Review', icon: 'check-circle' },
] as const;

const FORM_MAX_WIDTH = 740;

const TEMPLATE_META: Record<
  string,
  { icon: string; gradient: [string, string]; color: string; badge: string }
> = {
  quick: {
    icon: 'zap',
    gradient: ['#F59E0B', '#D97706'],
    color: '#F59E0B',
    badge: 'Weekend & Quick',
  },
  domestic: {
    icon: 'map',
    gradient: ['#38BDF8', '#2563EB'],
    color: '#2563EB',
    badge: 'Domestic Route',
  },
  international: {
    icon: 'globe',
    gradient: ['#A855F7', '#7C3AED'],
    color: '#7C3AED',
    badge: 'Global Expedition',
  },
};

const QUICK_BUDGETS = [20000, 50000, 100000, 250000];

// ─── Step Indicator Component ────────────────────────────────
function StepIndicator({
  currentStep,
  onStepPress,
}: {
  currentStep: number;
  onStepPress?: (step: number) => void;
}) {
  const theme = useTheme();

  return (
    <View style={indicatorStyles.container}>
      <View style={indicatorStyles.stepperRow}>
        {STEPS.map((s, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <React.Fragment key={s.key}>
              <Pressable
                onPress={() => isCompleted && onStepPress?.(index)}
                disabled={!isCompleted}
                style={({ pressed }) => [
                  indicatorStyles.stepItem,
                  pressed && isCompleted && { opacity: 0.7 },
                ]}
              >
                <View
                  style={[
                    indicatorStyles.stepIconCircle,
                    {
                      backgroundColor: isActive
                        ? theme.colors.primary
                        : isCompleted
                          ? 'rgba(16, 185, 129, 0.15)'
                          : theme.colors.surface,
                      borderColor: isActive
                        ? theme.colors.primary
                        : isCompleted
                          ? '#10B981'
                          : theme.isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(15,23,42,0.08)',
                    },
                  ]}
                >
                  {isCompleted ? (
                    <AppIcon name="check" size={13} color="#10B981" />
                  ) : (
                    <Text
                      style={[
                        indicatorStyles.stepNumber,
                        {
                          color: isActive
                            ? '#FFFFFF'
                            : theme.colors.textTertiary,
                        },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    indicatorStyles.stepText,
                    {
                      color: isActive
                        ? theme.colors.textPrimary
                        : isCompleted
                          ? theme.colors.textSecondary
                          : theme.colors.textTertiary,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>

              {index < STEPS.length - 1 && (
                <View
                  style={[
                    indicatorStyles.stepConnectingLine,
                    {
                      backgroundColor:
                        index < currentStep
                          ? '#10B981'
                          : theme.isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(15,23,42,0.06)',
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// ─── Template Card Component ─────────────────────────────────
function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: any;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const meta = TEMPLATE_META[template.id] || {
    icon: 'compass',
    gradient: ['#2563EB', '#1D4ED8'],
    color: '#2563EB',
    badge: 'Standard Trip',
  };

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onSelect();
      }}
      style={({ pressed }) => [
        cardStyles.templateCard,
        {
          backgroundColor: selected
            ? `${theme.colors.primary}10`
            : theme.colors.surface,
          borderColor: selected
            ? theme.colors.primary
            : theme.isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(15,23,42,0.05)',
        },
        selected && cardStyles.cardSelected,
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.9 },
      ]}
    >
      <View style={cardStyles.cardTopRow}>
        <LinearGradient colors={meta.gradient} style={cardStyles.iconAura}>
          <AppIcon name={meta.icon as any} size={20} color="#FFFFFF" />
        </LinearGradient>

        <View
          style={[
            cardStyles.radioCircle,
            {
              backgroundColor: selected ? theme.colors.primary : 'transparent',
              borderColor: selected
                ? theme.colors.primary
                : theme.isDark
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(15,23,42,0.15)',
            },
          ]}
        >
          {selected && <AppIcon name="check" size={11} color="#FFFFFF" />}
        </View>
      </View>

      <View style={cardStyles.cardBody}>
        <View style={cardStyles.badgeRow}>
          <View
            style={[
              cardStyles.typeBadge,
              { backgroundColor: `${meta.color}15` },
            ]}
          >
            <Text style={[cardStyles.typeBadgeText, { color: meta.color }]}>
              {meta.badge.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text
          style={[cardStyles.templateName, { color: theme.colors.textPrimary }]}
        >
          {template.name}
        </Text>
        <Text
          style={[
            cardStyles.templateDesc,
            { color: theme.colors.textSecondary },
          ]}
          numberOfLines={3}
        >
          {template.description}
        </Text>

        {template.autoCreateStop && (
          <View
            style={[
              cardStyles.autoStopBadge,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(16, 185, 129, 0.15)'
                  : '#ECFDF5',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              },
            ]}
          >
            <AppIcon name="sparkles" size={11} color="#10B981" />
            <Text style={cardStyles.autoStopText}>
              Auto-creates primary stop
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Web Date Modal ──────────────────────────────────────────
function WebDateModal({
  currentDate,
  onClose,
  onSave,
}: {
  currentDate: Date;
  onClose: () => void;
  onSave: (date: Date) => void;
}) {
  const theme = useTheme();
  const [tempDate, setTempDate] = useState(currentDate);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                modalStyles.content,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(15,23,42,0.08)',
                },
              ]}
            >
              <View style={modalStyles.headerRow}>
                <Text
                  style={[
                    modalStyles.title,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Select Date
                </Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <AppIcon
                    name="x"
                    size={18}
                    color={theme.colors.textTertiary}
                  />
                </Pressable>
              </View>

              {/* @ts-ignore */}
              <input
                type="date"
                value={format(tempDate, 'yyyy-MM-dd')}
                onChange={(e: any) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    setTempDate(newDate);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.background,
                  marginTop: '10px',
                  marginBottom: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <View style={modalStyles.actionRow}>
                <Pressable
                  onPress={onClose}
                  style={[
                    modalStyles.cancelBtn,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <Text
                    style={[
                      modalStyles.cancelBtnText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onSave(tempDate);
                    onClose();
                  }}
                  style={[
                    modalStyles.saveBtn,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text style={modalStyles.saveBtnText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Main Create Trip Screen ─────────────────────────────────
export default function CreateTripScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const isDesktop = width >= 860;

  // Form state
  const [formData, setFormData] = useState<TripFormData>({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    baseCurrency: 'INR',
    totalBudget: '',
    defaultSplitMethod: 'equal',
    allowAnyPayer: true,
    memberIds: [],
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 250);
  const { data: searchResults = [], isFetching: isSearching } =
    useSearchUsers(debouncedSearchQuery);
  const { data: friendsList = [] } = useFriends();
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  // Modals & Selectors
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries & Mutations
  const { data: templatesData } = useTripTemplates();
  const templates = templatesData || [];
  const { mutate: createTrip, isPending } = useCreateTrip();

  const { data: countriesResponse } = useQuery({
    queryKey: ['countries'],
    queryFn: locationApi.getSupportedCountries,
  });

  const currencies = useMemo(() => {
    const raw = countriesResponse?.data?.data || [];
    const map = new Map();
    raw.forEach((c: any) => {
      if (!map.has(c.currency)) {
        map.set(c.currency, {
          code: c.currency,
          symbol: c.currencySymbol || c.currency,
          name: c.currencyName || c.currency,
        });
      }
    });
    const arr = Array.from(map.values());
    return arr.length > 0
      ? arr
      : [
          { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
          { code: 'USD', symbol: '$', name: 'US Dollar' },
          { code: 'EUR', symbol: '€', name: 'Euro' },
          { code: 'GBP', symbol: '£', name: 'British Pound' },
        ];
  }, [countriesResponse]);

  // ── Handlers ──
  const handleSelectTemplate = (templateId: string) => {
    haptics.medium();
    setFormData(prev => ({ ...prev, template: templateId }));
    setTimeout(() => setCurrentStep(1), 220);
  };

  const handleUpdateField = (field: keyof TripFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          haptics.warning();
          Alert.alert(
            'Title Required',
            'Please enter a name for your expedition.',
          );
          return false;
        }
        if (formData.endDate < formData.startDate) {
          haptics.warning();
          Alert.alert(
            'Invalid Dates',
            'The end date must be on or after the start date.',
          );
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    haptics.light();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleBack = () => {
    haptics.light();
    if (currentStep === 0) {
      router.back();
    } else {
      setCurrentStep(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleAddBudget = (val: number) => {
    haptics.light();
    const cur = Number(formData.totalBudget) || 0;
    handleUpdateField('totalBudget', String(cur + val));
  };

  const handleCreate = async (status: 'planning' | 'active') => {
    haptics.medium();
    setIsSubmitting(true);

    try {
      const initialStop = {
        name: formData.title.trim(),
        currency: formData.baseCurrency,
        currentExchangeRate: 1.0,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
      };

      createTrip(
        {
          template: formData.template,
          data: {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            coverImage: formData.coverImage?.trim() || undefined,
            startDate: formData.startDate.toISOString(),
            endDate: formData.endDate.toISOString(),
            baseCurrency: formData.baseCurrency,
            totalBudget: formData.totalBudget
              ? parseFloat(formData.totalBudget)
              : undefined,
            defaultSplitMethod: formData.defaultSplitMethod,
            allowAnyPayer: formData.allowAnyPayer,
            memberIds: formData.memberIds,
            status,
            initialStop,
          },
        },
        {
          onSuccess: (trip: any) => {
            haptics.success();
            setIsSubmitting(false);
            router.replace(`/(app)/trips/${trip._id}`);
          },
          onError: (error: any) => {
            setIsSubmitting(false);
            Alert.alert('Error', error.message || 'Failed to create trip.');
          },
        },
      );
    } catch (error: any) {
      setIsSubmitting(false);
      Alert.alert('Error', error.message || 'Something went wrong.');
    }
  };

  // ── STEP 1: TEMPLATE SELECTION ──
  const renderTemplateStep = () => (
    <View style={screenStyles.stepBox}>
      <View style={screenStyles.stepHeader}>
        <Text
          style={[screenStyles.stepTitle, { color: theme.colors.textPrimary }]}
        >
          Choose a Template
        </Text>
        <Text
          style={[
            screenStyles.stepSubtitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          Select a preconfigured framework or start fresh.
        </Text>
      </View>

      <View style={screenStyles.templatesGrid}>
        {templates.map((tpl: any) => (
          <TemplateCard
            key={tpl.id}
            template={tpl}
            selected={formData.template === tpl.id}
            onSelect={() => handleSelectTemplate(tpl.id)}
          />
        ))}
      </View>

      <Pressable
        onPress={() => {
          handleUpdateField('template', undefined);
          setCurrentStep(1);
        }}
        style={({ pressed }) => [
          screenStyles.skipBtn,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(15,23,42,0.06)',
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <AppIcon name="sparkles" size={16} color={theme.colors.primary} />
        <Text
          style={[
            screenStyles.skipBtnText,
            { color: theme.colors.textPrimary },
          ]}
        >
          Skip & Start from Scratch
        </Text>
      </Pressable>
    </View>
  );

  // ── STEP 2: TRIP DETAILS ──
  const renderDetailsStep = () => (
    <View style={screenStyles.stepBox}>
      <View style={screenStyles.stepHeader}>
        <Text
          style={[screenStyles.stepTitle, { color: theme.colors.textPrimary }]}
        >
          Trip Details
        </Text>
        <Text
          style={[
            screenStyles.stepSubtitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          Configure your title, itinerary timeframe, and currency baseline.
        </Text>
      </View>

      <View
        style={[
          screenStyles.formCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Title */}
        <View style={screenStyles.fieldGroup}>
          <Text
            style={[
              screenStyles.fieldLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            TRIP TITLE *
          </Text>
          <View
            style={[
              screenStyles.inputBox,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <AppIcon
              name="compass"
              size={16}
              color={theme.colors.textTertiary}
            />
            <TextInput
              style={[
                screenStyles.textInput,
                { color: theme.colors.textPrimary },
              ]}
              placeholder="e.g. Goa Beach Expedition, Tokyo Explorer..."
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.title}
              onChangeText={text => handleUpdateField('title', text)}
            />
          </View>
        </View>

        {/* Description */}
        <View style={screenStyles.fieldGroup}>
          <Text
            style={[
              screenStyles.fieldLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            DESCRIPTION (OPTIONAL)
          </Text>
          <View
            style={[
              screenStyles.notesBox,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <TextInput
              style={[
                screenStyles.notesInput,
                { color: theme.colors.textPrimary },
              ]}
              placeholder="Add key destinations, itinerary notes, or reminders..."
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.description}
              onChangeText={text => handleUpdateField('description', text)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Dates Row */}
        <View style={screenStyles.dateRow}>
          <View style={[screenStyles.fieldGroup, { flex: 1 }]}>
            <Text
              style={[
                screenStyles.fieldLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              START DATE *
            </Text>
            <Pressable
              onPress={() => {
                haptics.light();
                setShowStartDate(true);
              }}
              style={[
                screenStyles.dateBtn,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <AppIcon name="calendar" size={15} color={theme.colors.primary} />
              <Text
                style={[
                  screenStyles.dateText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {format(formData.startDate, 'MMM d, yyyy')}
              </Text>
            </Pressable>

            {Platform.OS !== 'web' && showStartDate && (
              <DateTimePicker
                value={formData.startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDate(false);
                  if (selectedDate)
                    handleUpdateField('startDate', selectedDate);
                }}
              />
            )}
            {Platform.OS === 'web' && showStartDate && (
              <WebDateModal
                currentDate={formData.startDate}
                onClose={() => setShowStartDate(false)}
                onSave={date => handleUpdateField('startDate', date)}
              />
            )}
          </View>

          <View style={[screenStyles.fieldGroup, { flex: 1 }]}>
            <Text
              style={[
                screenStyles.fieldLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              END DATE *
            </Text>
            <Pressable
              onPress={() => {
                haptics.light();
                setShowEndDate(true);
              }}
              style={[
                screenStyles.dateBtn,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <AppIcon name="calendar" size={15} color={theme.colors.primary} />
              <Text
                style={[
                  screenStyles.dateText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {format(formData.endDate, 'MMM d, yyyy')}
              </Text>
            </Pressable>

            {Platform.OS !== 'web' && showEndDate && (
              <DateTimePicker
                value={formData.endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndDate(false);
                  if (selectedDate) handleUpdateField('endDate', selectedDate);
                }}
              />
            )}
            {Platform.OS === 'web' && showEndDate && (
              <WebDateModal
                currentDate={formData.endDate}
                onClose={() => setShowEndDate(false)}
                onSave={date => handleUpdateField('endDate', date)}
              />
            )}
          </View>
        </View>

        {/* Currency Selector */}
        <View style={screenStyles.fieldGroup}>
          <Text
            style={[
              screenStyles.fieldLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            BASE CURRENCY
          </Text>
          <Pressable
            onPress={() => {
              haptics.light();
              setShowCurrencies(!showCurrencies);
            }}
            style={[
              screenStyles.currencySelectBtn,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View
                style={[
                  screenStyles.currencySymbolBadge,
                  { backgroundColor: `${theme.colors.primary}18` },
                ]}
              >
                <Text
                  style={[
                    screenStyles.currencySymbolText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {
                    currencies.find(
                      (c: any) => c.code === formData.baseCurrency,
                    )?.symbol
                  }
                </Text>
              </View>
              <Text
                style={[
                  screenStyles.currencyNameText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {
                  currencies.find((c: any) => c.code === formData.baseCurrency)
                    ?.name
                }{' '}
                ({formData.baseCurrency})
              </Text>
            </View>
            <AppIcon
              name={showCurrencies ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={theme.colors.textTertiary}
            />
          </Pressable>

          {showCurrencies && (
            <View
              style={[
                screenStyles.currencyDropdown,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                {currencies.map((c: any) => (
                  <Pressable
                    key={c.code}
                    onPress={() => {
                      haptics.light();
                      handleUpdateField('baseCurrency', c.code);
                      setShowCurrencies(false);
                    }}
                    style={[
                      screenStyles.currencyOption,
                      formData.baseCurrency === c.code && {
                        backgroundColor: `${theme.colors.primary}12`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        screenStyles.currencyOptionSymbol,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {c.symbol}
                    </Text>
                    <Text
                      style={[
                        screenStyles.currencyOptionName,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {c.name}
                    </Text>
                    <Text
                      style={[
                        screenStyles.currencyOptionCode,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      {c.code}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Total Budget */}
        <View style={screenStyles.fieldGroup}>
          <Text
            style={[
              screenStyles.fieldLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            ESTIMATED BUDGET (OPTIONAL)
          </Text>
          <View
            style={[
              screenStyles.inputBox,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Text
              style={[
                screenStyles.budgetSymbolPrefix,
                { color: theme.colors.primary },
              ]}
            >
              {
                currencies.find((c: any) => c.code === formData.baseCurrency)
                  ?.symbol
              }
            </Text>
            <TextInput
              style={[
                screenStyles.textInput,
                { color: theme.colors.textPrimary },
              ]}
              placeholder="e.g. 50,000"
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.totalBudget}
              onChangeText={text =>
                handleUpdateField('totalBudget', text.replace(/[^0-9]/g, ''))
              }
              keyboardType="numeric"
            />
          </View>

          <View style={screenStyles.quickBudgetRow}>
            {QUICK_BUDGETS.map(amt => (
              <Pressable
                key={amt}
                onPress={() => handleAddBudget(amt)}
                style={[
                  screenStyles.quickBudgetChip,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <Text
                  style={[
                    screenStyles.quickBudgetText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  +₹{(amt / 1000).toFixed(0)}k
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Default Split Method */}
        <View style={screenStyles.fieldGroup}>
          <Text
            style={[
              screenStyles.fieldLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            DEFAULT EXPENSE SPLIT
          </Text>
          <View style={screenStyles.splitGrid}>
            {(
              [
                { id: 'equal', label: 'Equal ⚖️' },
                { id: 'percentage', label: 'Percentage 📊' },
                { id: 'exact', label: 'Exact 🔢' },
                { id: 'shares', label: 'Shares 🤝' },
              ] as const
            ).map(m => {
              const isSelected = formData.defaultSplitMethod === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    haptics.light();
                    handleUpdateField('defaultSplitMethod', m.id);
                  }}
                  style={[
                    screenStyles.splitChip,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.background,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      screenStyles.splitChipText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : theme.colors.textPrimary,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Allow Anyone to Pay Switch */}
        <View style={screenStyles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text
              style={[
                screenStyles.toggleTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Allow Any Member to Pay
            </Text>
            <Text
              style={[
                screenStyles.toggleSub,
                { color: theme.colors.textTertiary },
              ]}
            >
              When active, all travelers can record payments on behalf of the
              group.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              haptics.light();
              handleUpdateField('allowAnyPayer', !formData.allowAnyPayer);
            }}
            style={[
              screenStyles.toggleTrack,
              {
                backgroundColor: formData.allowAnyPayer
                  ? '#10B981'
                  : theme.isDark
                    ? 'rgba(255,255,255,0.15)'
                    : '#CBD5E1',
              },
            ]}
          >
            <View
              style={[
                screenStyles.toggleThumb,
                formData.allowAnyPayer
                  ? { alignSelf: 'flex-end' }
                  : { alignSelf: 'flex-start' },
              ]}
            />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={handleNext}
        style={[
          screenStyles.primaryActionBtn,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <Text style={screenStyles.primaryActionBtnText}>
          Continue to Members
        </Text>
        <AppIcon name="arrow-right" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  // ── STEP 3: INVITE MEMBERS ──
  const renderMembersStep = () => (
    <View style={screenStyles.stepBox}>
      <View style={screenStyles.stepHeader}>
        <Text
          style={[screenStyles.stepTitle, { color: theme.colors.textPrimary }]}
        >
          Invite Co-Travelers
        </Text>
        <Text
          style={[
            screenStyles.stepSubtitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          Add friends to split costs and sync itineraries.
        </Text>
      </View>

      <View
        style={[
          screenStyles.formCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Search */}
        <View
          style={[
            screenStyles.inputBox,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <AppIcon name="search" size={15} color={theme.colors.textTertiary} />
          <TextInput
            style={[
              screenStyles.textInput,
              { color: theme.colors.textPrimary },
            ]}
            placeholder="Search by name, email, or handle..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <AppIcon name="x" size={14} color={theme.colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {isSearching && (
          <View style={screenStyles.searchingWrap}>
            <GlobalLoader
              variant="inline"
              size="small"
              color={theme.colors.primary}
            />
            <Text style={{ fontSize: 12, color: theme.colors.textTertiary }}>
              Searching traveler directory...
            </Text>
          </View>
        )}

        {/* Selected Members */}
        {selectedUsers.length > 0 && (
          <View style={screenStyles.selectedMembersBox}>
            <View style={screenStyles.selectedMembersHeader}>
              <Text
                style={[
                  screenStyles.fieldLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                INVITED MEMBERS ({selectedUsers.length})
              </Text>
              <Pressable
                onPress={() => {
                  haptics.light();
                  setSelectedUsers([]);
                  handleUpdateField('memberIds', []);
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: theme.colors.danger,
                  }}
                >
                  Clear all
                </Text>
              </Pressable>
            </View>

            <View style={screenStyles.selectedChipsWrap}>
              {selectedUsers.map(user => {
                const uid = user._id || user.userId;
                return (
                  <View
                    key={uid}
                    style={[
                      screenStyles.memberChip,
                      {
                        backgroundColor: `${theme.colors.primary}12`,
                        borderColor: `${theme.colors.primary}30`,
                      },
                    ]}
                  >
                    <Avatar
                      size="sm"
                      fallback={user.displayName?.charAt(0) || 'U'}
                      url={user.photoURL}
                    />
                    <Text
                      style={[
                        screenStyles.memberChipName,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {user.displayName}
                    </Text>
                    <Pressable
                      onPress={() => {
                        haptics.light();
                        setSelectedUsers(prev =>
                          prev.filter(u => (u._id || u.userId) !== uid),
                        );
                        handleUpdateField(
                          'memberIds',
                          formData.memberIds.filter(id => id !== uid),
                        );
                      }}
                      hitSlop={8}
                    >
                      <AppIcon
                        name="x"
                        size={13}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Directory Search Results */}
        {searchQuery.trim().length >= 2 &&
          searchResults.length > 0 &&
          !isSearching && (
            <View style={screenStyles.userList}>
              {searchResults.map((user: any) => {
                const uid = user._id || user.userId;
                const isSelected = selectedUsers.some(
                  u => (u._id || u.userId) === uid,
                );

                return (
                  <Pressable
                    key={uid}
                    onPress={() => {
                      haptics.light();
                      if (isSelected) {
                        setSelectedUsers(prev =>
                          prev.filter(u => (u._id || u.userId) !== uid),
                        );
                        handleUpdateField(
                          'memberIds',
                          formData.memberIds.filter(id => id !== uid),
                        );
                      } else {
                        setSelectedUsers(prev => [...prev, user]);
                        handleUpdateField('memberIds', [
                          ...formData.memberIds,
                          uid,
                        ]);
                      }
                    }}
                    style={[
                      screenStyles.userItem,
                      {
                        backgroundColor: isSelected
                          ? `${theme.colors.primary}10`
                          : theme.colors.background,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    <Avatar
                      size="sm"
                      fallback={user.displayName?.charAt(0) || 'U'}
                      url={user.photoURL}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={[
                          screenStyles.userName,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {user.displayName}
                      </Text>
                      {user.email && (
                        <Text
                          style={[
                            screenStyles.userEmail,
                            { color: theme.colors.textTertiary },
                          ]}
                        >
                          {user.email}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        screenStyles.addIconCircle,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surface,
                        },
                      ]}
                    >
                      <AppIcon
                        name={isSelected ? 'check' : 'plus'}
                        size={13}
                        color={
                          isSelected ? '#FFFFFF' : theme.colors.textSecondary
                        }
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

        {/* Quick Add Friends */}
        {searchQuery.trim().length === 0 && friendsList.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text
              style={[
                screenStyles.fieldLabel,
                { color: theme.colors.textSecondary, marginBottom: 8 },
              ]}
            >
              FREQUENT COMPANIONS ({friendsList.length})
            </Text>
            <View style={screenStyles.userList}>
              {friendsList.map((friend: any) => {
                const friendId = friend.userId || friend._id;
                const isSelected = selectedUsers.some(
                  u => (u.userId || u._id) === friendId,
                );

                return (
                  <Pressable
                    key={friendId}
                    onPress={() => {
                      haptics.light();
                      if (isSelected) {
                        setSelectedUsers(prev =>
                          prev.filter(u => (u.userId || u._id) !== friendId),
                        );
                        handleUpdateField(
                          'memberIds',
                          formData.memberIds.filter(id => id !== friendId),
                        );
                      } else {
                        setSelectedUsers(prev => [
                          ...prev,
                          { ...friend, _id: friendId },
                        ]);
                        handleUpdateField('memberIds', [
                          ...formData.memberIds,
                          friendId,
                        ]);
                      }
                    }}
                    style={[
                      screenStyles.userItem,
                      {
                        backgroundColor: isSelected
                          ? `${theme.colors.primary}10`
                          : theme.colors.background,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    <Avatar
                      size="sm"
                      fallback={friend.displayName?.charAt(0) || 'U'}
                      url={friend.photoURL}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={[
                          screenStyles.userName,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {friend.displayName}
                      </Text>
                      {friend.email && (
                        <Text
                          style={[
                            screenStyles.userEmail,
                            { color: theme.colors.textTertiary },
                          ]}
                        >
                          {friend.email}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        screenStyles.addIconCircle,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surface,
                        },
                      ]}
                    >
                      <AppIcon
                        name={isSelected ? 'check' : 'plus'}
                        size={13}
                        color={
                          isSelected ? '#FFFFFF' : theme.colors.textSecondary
                        }
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <Pressable
        onPress={handleNext}
        style={[
          screenStyles.primaryActionBtn,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <Text style={screenStyles.primaryActionBtnText}>Review & Confirm</Text>
        <AppIcon name="arrow-right" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  // ── STEP 4: REVIEW & CONFIRM ──
  const renderReviewStep = () => (
    <View style={screenStyles.stepBox}>
      <View style={screenStyles.stepHeader}>
        <Text
          style={[screenStyles.stepTitle, { color: theme.colors.textPrimary }]}
        >
          Review & Launch
        </Text>
        <Text
          style={[
            screenStyles.stepSubtitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          Verify expedition parameters before initialization.
        </Text>
      </View>

      {/* Bento Review Card */}
      <View
        style={[
          screenStyles.formCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {formData.template && (
          <View style={screenStyles.reviewRow}>
            <Text
              style={[
                screenStyles.reviewLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Template
            </Text>
            <View
              style={[
                screenStyles.reviewTag,
                { backgroundColor: `${theme.colors.primary}15` },
              ]}
            >
              <Text
                style={[
                  screenStyles.reviewTagText,
                  { color: theme.colors.primary },
                ]}
              >
                {formData.template.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        <View style={screenStyles.reviewRow}>
          <Text
            style={[
              screenStyles.reviewLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Expedition Title
          </Text>
          <Text
            style={[
              screenStyles.reviewValue,
              { color: theme.colors.textPrimary, fontWeight: '800' },
            ]}
          >
            {formData.title || '—'}
          </Text>
        </View>

        {formData.description ? (
          <View style={screenStyles.reviewRow}>
            <Text
              style={[
                screenStyles.reviewLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Notes
            </Text>
            <Text
              style={[
                screenStyles.reviewValue,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {formData.description}
            </Text>
          </View>
        ) : null}

        <View style={screenStyles.reviewRow}>
          <Text
            style={[
              screenStyles.reviewLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Timeline
          </Text>
          <Text
            style={[
              screenStyles.reviewValue,
              { color: theme.colors.textPrimary, fontWeight: '700' },
            ]}
          >
            {format(formData.startDate, 'MMM d')} —{' '}
            {format(formData.endDate, 'MMM d, yyyy')}
          </Text>
        </View>

        <View style={screenStyles.reviewRow}>
          <Text
            style={[
              screenStyles.reviewLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Base Currency
          </Text>
          <Text
            style={[
              screenStyles.reviewValue,
              { color: theme.colors.textPrimary, fontWeight: '700' },
            ]}
          >
            {
              currencies.find((c: any) => c.code === formData.baseCurrency)
                ?.symbol
            }{' '}
            {formData.baseCurrency}
          </Text>
        </View>

        {formData.totalBudget ? (
          <View style={screenStyles.reviewRow}>
            <Text
              style={[
                screenStyles.reviewLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Budget Limit
            </Text>
            <Text
              style={[
                screenStyles.reviewValue,
                { color: theme.colors.primary, fontWeight: '900' },
              ]}
            >
              {
                currencies.find((c: any) => c.code === formData.baseCurrency)
                  ?.symbol
              }{' '}
              {parseInt(formData.totalBudget, 10).toLocaleString('en-IN')}
            </Text>
          </View>
        ) : null}

        <View style={[screenStyles.reviewRow, { borderBottomWidth: 0 }]}>
          <Text
            style={[
              screenStyles.reviewLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Split Rule
          </Text>
          <Text
            style={[
              screenStyles.reviewValue,
              { color: theme.colors.textPrimary, fontWeight: '700' },
            ]}
          >
            {formData.defaultSplitMethod.charAt(0).toUpperCase() +
              formData.defaultSplitMethod.slice(1)}
          </Text>
        </View>
      </View>

      {/* Mini Feature Highlights */}
      <View style={screenStyles.summaryCardsRow}>
        <View
          style={[
            screenStyles.miniSummaryCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View
            style={[
              screenStyles.miniSummaryIcon,
              { backgroundColor: '#EFF6FF' },
            ]}
          >
            <AppIcon name="map-pin" size={16} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                screenStyles.miniSummaryTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Initial Route Stop
            </Text>
            <Text
              style={[
                screenStyles.miniSummarySub,
                { color: theme.colors.textTertiary },
              ]}
            >
              {formData.template === 'quick'
                ? 'Primary stop will be created automatically.'
                : 'Add multi-destination itinerary stops in trip view.'}
            </Text>
          </View>
        </View>

        <View
          style={[
            screenStyles.miniSummaryCard,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View
            style={[
              screenStyles.miniSummaryIcon,
              { backgroundColor: '#ECFDF5' },
            ]}
          >
            <AppIcon name="users" size={16} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                screenStyles.miniSummaryTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Invited Crew
            </Text>
            <Text
              style={[
                screenStyles.miniSummarySub,
                { color: theme.colors.textTertiary },
              ]}
            >
              {selectedUsers.length > 0
                ? `${selectedUsers.length} co-traveler${selectedUsers.length > 1 ? 's' : ''} ready to sync`
                : 'You are the admin. Invite friends anytime later.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Launch Triggers */}
      <Pressable
        onPress={() => handleCreate('active')}
        disabled={isPending || isSubmitting}
        style={[
          screenStyles.primaryActionBtn,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        {isPending || isSubmitting ? (
          <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
        ) : (
          <>
            <AppIcon name="zap" size={17} color="#FFFFFF" />
            <Text style={screenStyles.primaryActionBtnText}>
              Launch Active Expedition
            </Text>
          </>
        )}
      </Pressable>

      <Pressable
        onPress={() => handleCreate('planning')}
        disabled={isPending || isSubmitting}
        style={[
          screenStyles.draftBtn,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text
          style={[
            screenStyles.draftBtnText,
            { color: theme.colors.textSecondary },
          ]}
        >
          Save as Planning Draft
        </Text>
      </Pressable>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderTemplateStep();
      case 1:
        return renderDetailsStep();
      case 2:
        return renderMembersStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <View style={screenStyles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      <KeyboardAvoidingView
        style={screenStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top App Header */}
        <View
          style={[
            screenStyles.topBar,
            { paddingTop: Math.max(insets.top, 12) },
          ]}
        >
          <View style={screenStyles.topBarInner}>
            <Pressable
              onPress={handleBack}
              style={[
                screenStyles.navIconBtn,
                { backgroundColor: theme.colors.surface },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="arrow-left"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>

            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text
                style={[
                  screenStyles.navTitle,
                  { color: theme.colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {currentStep === 0
                  ? 'Create an Expedition'
                  : formData.title || 'New Trip'}
              </Text>
            </View>

            <View
              style={[
                screenStyles.stepCounterPill,
                { backgroundColor: `${theme.colors.primary}15` },
              ]}
            >
              <Text
                style={[
                  screenStyles.stepCounterText,
                  { color: theme.colors.primary },
                ]}
              >
                Step {currentStep + 1}/4
              </Text>
            </View>
          </View>
        </View>

        {/* Step Progression Bar */}
        <StepIndicator currentStep={currentStep} onStepPress={setCurrentStep} />

        {/* Form Container */}
        <ScrollView
          ref={scrollViewRef}
          style={screenStyles.scrollView}
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },

  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,42,0.06)',
    zIndex: 10,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  stepCounterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '800',
  },

  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  desktopScrollContent: {
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },

  stepBox: {
    width: '100%',
    gap: 16,
  },
  stepHeader: {
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },

  // Templates
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Forms
  formCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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

    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    padding: 0,
  },
  notesBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
  },
  notesInput: {
    fontSize: 13,
    fontWeight: '500',
    minHeight: 56,
    textAlignVertical: 'top',
    padding: 0,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Currency
  currencySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
  },
  currencySymbolBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currencySymbolText: {
    fontSize: 12,
    fontWeight: '900',
  },
  currencyNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  currencyDropdown: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    overflow: 'hidden',
    marginTop: 6,

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
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
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currencyOptionSymbol: {
    fontWeight: '800',
    width: 28,
  },
  currencyOptionName: {
    fontSize: 13,
    flex: 1,
  },
  currencyOptionCode: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Budget
  budgetSymbolPrefix: {
    fontSize: 15,
    fontWeight: '900',
    marginRight: 4,
  },
  quickBudgetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  quickBudgetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickBudgetText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Splits
  splitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  splitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  splitChipText: {
    fontSize: 12,
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,23,42,0.05)',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  toggleSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',

    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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

  // Actions
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
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
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // Member Management
  searchingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  selectedMembersBox: {
    gap: 6,
  },
  selectedMembersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  memberChipName: {
    fontSize: 11,
    fontWeight: '700',
  },
  userList: {
    gap: 6,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 11,
  },
  addIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Review
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,42,0.05)',
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  reviewValue: {
    fontSize: 13,
    maxWidth: '65%',
    textAlign: 'right',
  },
  reviewTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reviewTagText: {
    fontSize: 10,
    fontWeight: '900',
  },
  summaryCardsRow: {
    gap: 10,
  },
  miniSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
  miniSummaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  miniSummarySub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  draftBtn: {
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

const indicatorStyles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  stepNumber: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  stepText: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
  stepConnectingLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 1,
  },
});

const cardStyles = StyleSheet.create({
  templateCard: {
    flex: 1,
    minWidth: 190,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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
  cardSelected: {
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconAura: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    gap: 4,
  },
  badgeRow: {
    marginBottom: 2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  templateDesc: {
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
    minHeight: 32,
  },
  autoStopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  autoStopText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10B981',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,

    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
// // src/app/(app)/create-trip.tsx

// import React, { useState, useMemo, useRef, useEffect } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     ScrollView,
//     TextInput,
//     Alert,
//     KeyboardAvoidingView,
//     Platform,
//     useWindowDimensions,
//     Pressable,
//     Modal,
//     TouchableWithoutFeedback,
//     Animated,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { router } from 'expo-router';
// import { useTripTemplates, useCreateTrip, useSearchUsers, useDebounce, useFriends } from '../../hooks';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { format } from 'date-fns';
// import { useQuery } from '@tanstack/react-query';
// import { LinearGradient } from 'expo-linear-gradient';

// import { useTheme } from '../../providers/ThemeProvider';
// import { GlobalBackground } from '../../components/ui/GlobalBackground';
// import { Typography } from '../../components/ui/Typography';
// import { Avatar } from '../../components/ui/Avatar';
// import { haptics } from '../../utils/haptics';
// import { locationApi } from '../../services/api/location.api';
// import AppIcon from '../../components/common/AppIcon';
// import GlobalLoader from '../../components/common/GlobalLoader';
// import type { Theme } from '../../theme';

// // ============================================================
// // Types & Constants
// // ============================================================

// type Step = 'template' | 'details' | 'members' | 'review';

// interface TripFormData {
//     template?: string;
//     title: string;
//     description: string;
//     coverImage?: string;
//     startDate: Date;
//     endDate: Date;
//     baseCurrency: string;
//     totalBudget: string;
//     defaultSplitMethod: 'equal' | 'percentage' | 'exact' | 'shares';
//     allowAnyPayer: boolean;
//     memberIds: string[];
// }

// const STEPS = [
//     { key: 'template', label: 'Template', icon: 'sparkles' },
//     { key: 'details', label: 'Details', icon: 'file-text' },
//     { key: 'members', label: 'Members', icon: 'users' },
//     { key: 'review', label: 'Review', icon: 'check-circle' }
// ];

// const FORM_MAX_WIDTH = 700;

// const TEMPLATE_META: Record<string, { emoji: string; icon: string; gradient: [string, string]; color: string }> = {
//     quick: { emoji: '⚡', icon: 'zap', gradient: ['#F59E0B', '#D97706'], color: '#F59E0B' },
//     domestic: { emoji: '🗺️', icon: 'map', gradient: ['#3B82F6', '#1D4ED8'], color: '#3B82F6' },
//     international: { emoji: '✈️', icon: 'plane', gradient: ['#8B5CF6', '#6D28D9'], color: '#8B5CF6' },
// };

// const QUICK_BUDGETS = [20000, 50000, 100000, 250000];

// // ============================================================
// // Step Indicator Component
// // ============================================================

// function StepIndicator({ currentStep, onStepPress }: { currentStep: number; onStepPress?: (step: number) => void }) {
//     const theme = useTheme();

//     return (
//         <View style={indicatorStyles.container}>
//             <View style={indicatorStyles.stepperRow}>
//                 {STEPS.map((s, index) => {
//                     const isActive = index === currentStep;
//                     const isCompleted = index < currentStep;

//                     return (
//                         <React.Fragment key={s.key}>
//                             <Pressable
//                                 onPress={() => isCompleted && onStepPress?.(index)}
//                                 style={({ pressed }: any) => [
//                                     indicatorStyles.stepItem,
//                                     isCompleted && { cursor: 'pointer' },
//                                     pressed && isCompleted && { opacity: 0.7 }
//                                 ]}
//                             >
//                                 <View style={[
//                                     indicatorStyles.stepIconCircle,
//                                     {
//                                         backgroundColor: isActive
//                                             ? '#EA580C'
//                                             : (isCompleted
//                                                 ? (theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
//                                                 : (theme.isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9')),
//                                         borderColor: isActive
//                                             ? '#EA580C'
//                                             : (isCompleted
//                                                 ? '#10B981'
//                                                 : (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')),
//                                     }
//                                 ]}>
//                                     {isCompleted ? (
//                                         <AppIcon name="check" size={13} color="#10B981" />
//                                     ) : (
//                                         <Text style={[
//                                             indicatorStyles.stepNumber,
//                                             { color: isActive ? '#FFFFFF' : theme.colors.textTertiary }
//                                         ]}>
//                                             {index + 1}
//                                         </Text>
//                                     )}
//                                 </View>
//                                 <Text style={[
//                                     indicatorStyles.stepText,
//                                     {
//                                         color: isActive
//                                             ? theme.colors.textPrimary
//                                             : (isCompleted ? theme.colors.textSecondary : theme.colors.textTertiary),
//                                         fontWeight: isActive ? '800' : '600'
//                                     }
//                                 ]}>
//                                     {s.label}
//                                 </Text>
//                             </Pressable>

//                             {index < STEPS.length - 1 && (
//                                 <View style={[
//                                     indicatorStyles.stepConnectingLine,
//                                     {
//                                         backgroundColor: index < currentStep
//                                             ? '#10B981'
//                                             : (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
//                                     }
//                                 ]} />
//                             )}
//                         </React.Fragment>
//                     );
//                 })}
//             </View>
//         </View>
//     );
// }

// const indicatorStyles = StyleSheet.create({
//     container: {
//         width: '100%',
//         maxWidth: FORM_MAX_WIDTH,
//         alignSelf: 'center',
//         paddingHorizontal: 20,
//         paddingVertical: 12,
//     },
//     stepperRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//     },
//     stepItem: {
//         alignItems: 'center',
//         gap: 6,
//     },
//     stepIconCircle: {
//         width: 32,
//         height: 32,
//         borderRadius: 16,
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 1.5,
//     },
//     stepNumber: {
//         fontSize: 12,
//         fontWeight: '800',
//     },
//     stepText: {
//         fontSize: 11,
//         letterSpacing: -0.2,
//     },
//     stepConnectingLine: {
//         flex: 1,
//         height: 2,
//         marginHorizontal: 8,
//         marginBottom: 18,
//         borderRadius: 1,
//     }
// });

// // ============================================================
// // Template Card Component
// // ============================================================

// function TemplateCard({
//     template,
//     selected,
//     onSelect,
// }: {
//     template: any;
//     selected: boolean;
//     onSelect: () => void;
// }) {
//     const theme = useTheme();
//     const meta = TEMPLATE_META[template.id] || { emoji: '📍', icon: 'map-pin', gradient: ['#EA580C', '#C2410C'], color: '#EA580C' };

//     return (
//         <Pressable
//             onPress={() => { haptics.light(); onSelect(); }}
//             style={({ hovered, pressed }: any) => [
//                 cardStyles.templateCard,
//                 {
//                     backgroundColor: theme.isDark
//                         ? (selected ? 'rgba(234, 88, 12, 0.12)' : 'rgba(30, 41, 59, 0.75)')
//                         : (selected ? '#FFF7ED' : '#FFFFFF'),
//                     borderColor: selected
//                         ? '#EA580C'
//                         : (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
//                 },
//                 Platform.OS === 'web' && hovered && !selected && { transform: [{ translateY: -2 }] },
//                 pressed && { transform: [{ scale: 0.98 }] }
//             ]}
//         >
//             <View style={cardStyles.cardTopRow}>
//                 <LinearGradient
//                     colors={meta.gradient}
//                     style={cardStyles.emojiBubble}
//                 >
//                     <Text style={cardStyles.cardEmoji}>{meta.emoji}</Text>
//                 </LinearGradient>

//                 <View style={[
//                     cardStyles.radioCircle,
//                     {
//                         backgroundColor: selected ? '#EA580C' : 'transparent',
//                         borderColor: selected ? '#EA580C' : (theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
//                     }
//                 ]}>
//                     {selected && <AppIcon name="check" size={12} color="#FFFFFF" />}
//                 </View>
//             </View>

//             <View style={cardStyles.cardBody}>
//                 <Text style={[cardStyles.templateName, { color: theme.colors.textPrimary }]}>
//                     {template.name}
//                 </Text>
//                 <Text style={[cardStyles.templateDesc, { color: theme.colors.textSecondary }]} numberOfLines={3}>
//                     {template.description}
//                 </Text>

//                 {template.autoCreateStop && (
//                     <View style={[cardStyles.autoStopBadge, { backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
//                         <AppIcon name="sparkles" size={11} color="#10B981" />
//                         <Text style={cardStyles.autoStopText}>Auto-stop included</Text>
//                     </View>
//                 )}
//             </View>
//         </Pressable>
//     );
// }

// const cardStyles = StyleSheet.create({
//     templateCard: {
//         flex: 1,
//         minWidth: 200,
//         borderRadius: 20,
//         borderWidth: 1.5,
//         padding: 18,
//         cursor: 'pointer',
//         boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
//     } as any,
//     cardTopRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         marginBottom: 14,
//     },
//     emojiBubble: {
//         width: 44,
//         height: 44,
//         borderRadius: 14,
//         alignItems: 'center',
//         justifyContent: 'center',
//         boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
//     } as any,
//     cardEmoji: {
//         fontSize: 22,
//     },
//     radioCircle: {
//         width: 22,
//         height: 22,
//         borderRadius: 11,
//         borderWidth: 1.5,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     cardBody: {
//         gap: 6,
//     },
//     templateName: {
//         fontSize: 16,
//         fontWeight: '800',
//         letterSpacing: -0.3,
//     },
//     templateDesc: {
//         fontSize: 12,
//         fontWeight: '500',
//         lineHeight: 17,
//         minHeight: 34,
//     },
//     autoStopBadge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 4,
//         alignSelf: 'flex-start',
//         paddingHorizontal: 8,
//         paddingVertical: 3,
//         borderRadius: 6,
//         borderWidth: 1,
//         marginTop: 4,
//     },
//     autoStopText: {
//         fontSize: 10,
//         fontWeight: '800',
//         color: '#10B981',
//     }
// });

// // ============================================================
// // Web Date Modal
// // ============================================================

// function WebDateModal({
//     currentDate,
//     onClose,
//     onSave,
//     mode = 'date',
// }: {
//     currentDate: Date;
//     onClose: () => void;
//     onSave: (date: Date) => void;
//     mode?: 'date' | 'datetime';
// }) {
//     const theme = useTheme();
//     const [tempDate, setTempDate] = useState(currentDate);

//     return (
//         <Modal transparent animationType="fade" visible={true} onRequestClose={onClose}>
//             <TouchableWithoutFeedback onPress={onClose}>
//                 <View style={modalStyles.overlay}>
//                     <TouchableWithoutFeedback>
//                         <View style={[modalStyles.content, { backgroundColor: theme.isDark ? '#1E293B' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
//                             <View style={modalStyles.headerRow}>
//                                 <Text style={[modalStyles.title, { color: theme.colors.textPrimary }]}>Select Date</Text>
//                                 <Pressable onPress={onClose} hitSlop={8}>
//                                     <AppIcon name="x" size={18} color={theme.colors.textTertiary} />
//                                 </Pressable>
//                             </View>

//                             {/* @ts-ignore */}
//                             <input
//                                 type={mode === 'datetime' ? 'datetime-local' : 'date'}
//                                 value={format(tempDate, mode === 'datetime' ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd')}
//                                 onChange={(e: any) => {
//                                     const newDate = new Date(e.target.value);
//                                     if (!isNaN(newDate.getTime())) {
//                                         setTempDate(newDate);
//                                     }
//                                 }}
//                                 style={{
//                                     width: '100%',
//                                     padding: '12px',
//                                     fontSize: '15px',
//                                     borderRadius: '12px',
//                                     border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0'}`,
//                                     color: theme.colors.textPrimary,
//                                     backgroundColor: theme.isDark ? 'rgba(15,23,42,0.6)' : '#F8FAFC',
//                                     marginTop: '12px',
//                                     marginBottom: '16px',
//                                     outline: 'none',
//                                     boxSizing: 'border-box',
//                                 } as any}
//                             />

//                             <View style={modalStyles.actionRow}>
//                                 <Pressable onPress={onClose} style={[modalStyles.cancelBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
//                                     <Text style={[modalStyles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
//                                 </Pressable>
//                                 <Pressable onPress={() => { onSave(tempDate); onClose(); }} style={[modalStyles.saveBtn, { backgroundColor: '#EA580C' }]}>
//                                     <Text style={modalStyles.saveBtnText}>Done</Text>
//                                 </Pressable>
//                             </View>
//                         </View>
//                     </TouchableWithoutFeedback>
//                 </View>
//             </TouchableWithoutFeedback>
//         </Modal>
//     );
// }

// const modalStyles = StyleSheet.create({
//     overlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.6)',
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: 20,
//     },
//     content: {
//         width: '100%',
//         maxWidth: 360,
//         padding: 20,
//         borderRadius: 24,
//         borderWidth: 1,
//         boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
//     } as any,
//     headerRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         marginBottom: 8,
//     },
//     title: {
//         fontSize: 17,
//         fontWeight: '800',
//     },
//     actionRow: {
//         flexDirection: 'row',
//         justifyContent: 'flex-end',
//         gap: 10,
//     },
//     cancelBtn: {
//         paddingHorizontal: 16,
//         paddingVertical: 9,
//         borderRadius: 10,
//     },
//     cancelBtnText: {
//         fontSize: 13,
//         fontWeight: '700',
//     },
//     saveBtn: {
//         paddingHorizontal: 18,
//         paddingVertical: 9,
//         borderRadius: 10,
//     },
//     saveBtnText: {
//         color: '#FFFFFF',
//         fontSize: 13,
//         fontWeight: '800',
//     }
// });

// // ============================================================
// // Main Create Trip Screen
// // ============================================================

// export default function CreateTripScreen() {
//     const theme = useTheme();
//     const insets = useSafeAreaInsets();
//     const { width } = useWindowDimensions();
//     const scrollViewRef = useRef<ScrollView>(null);

//     const [currentStep, setCurrentStep] = useState<number>(0);
//     const isWebDesktop = Platform.OS === 'web' && width > 768;

//     // Form state
//     const [formData, setFormData] = useState<TripFormData>({
//         title: '',
//         description: '',
//         startDate: new Date(),
//         endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//         baseCurrency: 'INR',
//         totalBudget: '',
//         defaultSplitMethod: 'equal',
//         allowAnyPayer: true,
//         memberIds: [],
//     });

//     // Search state with debouncing
//     const [searchQuery, setSearchQuery] = useState('');
//     const debouncedSearchQuery = useDebounce(searchQuery.trim(), 250);
//     const { data: searchResults = [], isFetching: isSearching } = useSearchUsers(debouncedSearchQuery);
//     const { data: friendsList = [] } = useFriends();
//     const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

//     // Toggles
//     const [showStartDate, setShowStartDate] = useState(false);
//     const [showEndDate, setShowEndDate] = useState(false);
//     const [showCurrencies, setShowCurrencies] = useState(false);
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     // Hooks
//     const { data: templatesData } = useTripTemplates();
//     const templates = templatesData || [];
//     const { mutate: createTrip, isPending } = useCreateTrip();

//     // Fetch currencies
//     const { data: countriesResponse } = useQuery({
//         queryKey: ['countries'],
//         queryFn: locationApi.getSupportedCountries,
//     });

//     const currencies = useMemo(() => {
//         const raw = countriesResponse?.data?.data || [];
//         const map = new Map();
//         raw.forEach((c: any) => {
//             if (!map.has(c.currency)) {
//                 map.set(c.currency, {
//                     code: c.currency,
//                     symbol: c.currencySymbol || c.currency,
//                     name: c.currencyName || c.currency,
//                 });
//             }
//         });
//         const arr = Array.from(map.values());
//         return arr.length > 0 ? arr : [
//             { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
//             { code: 'USD', symbol: '$', name: 'US Dollar' },
//             { code: 'EUR', symbol: '€', name: 'Euro' },
//             { code: 'GBP', symbol: '£', name: 'British Pound' },
//         ];
//     }, [countriesResponse]);

//     // ── Handlers ──
//     const handleSelectTemplate = (templateId: string) => {
//         haptics.medium();
//         setFormData((prev) => ({ ...prev, template: templateId }));
//         setTimeout(() => setCurrentStep(1), 250);
//     };

//     const handleUpdateField = (field: keyof TripFormData, value: any) => {
//         setFormData((prev) => ({ ...prev, [field]: value }));
//     };

//     const validateStep = (step: number): boolean => {
//         switch (step) {
//             case 1:
//                 if (!formData.title.trim()) {
//                     haptics.warning();
//                     Alert.alert('Missing Title', 'Please enter a title for your trip.');
//                     return false;
//                 }
//                 if (formData.endDate < formData.startDate) {
//                     haptics.warning();
//                     Alert.alert('Invalid Dates', 'End date must be after start date.');
//                     return false;
//                 }
//                 return true;
//             default:
//                 return true;
//         }
//     };

//     const handleNext = () => {
//         if (!validateStep(currentStep)) return;
//         haptics.light();
//         if (currentStep < STEPS.length - 1) {
//             setCurrentStep((prev) => prev + 1);
//             scrollViewRef.current?.scrollTo({ y: 0, animated: true });
//         }
//     };

//     const handleBack = () => {
//         haptics.light();
//         if (currentStep === 0) {
//             router.back();
//         } else {
//             setCurrentStep((prev) => prev - 1);
//             scrollViewRef.current?.scrollTo({ y: 0, animated: true });
//         }
//     };

//     const handleAddBudget = (val: number) => {
//         haptics.light();
//         const cur = Number(formData.totalBudget) || 0;
//         handleUpdateField('totalBudget', String(cur + val));
//     };

//     // Fast trip creation
//     const handleCreate = async (status: 'planning' | 'active') => {
//         haptics.medium();
//         setIsSubmitting(true);

//         try {
//             const initialStop = {
//                 name: formData.title.trim(),
//                 currency: formData.baseCurrency,
//                 currentExchangeRate: 1.0,
//                 startDate: formData.startDate.toISOString(),
//                 endDate: formData.endDate.toISOString(),
//             };

//             createTrip(
//                 {
//                     template: formData.template,
//                     data: {
//                         title: formData.title.trim(),
//                         description: formData.description.trim() || undefined,
//                         coverImage: formData.coverImage?.trim() || undefined,
//                         startDate: formData.startDate.toISOString(),
//                         endDate: formData.endDate.toISOString(),
//                         baseCurrency: formData.baseCurrency,
//                         totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : undefined,
//                         defaultSplitMethod: formData.defaultSplitMethod,
//                         allowAnyPayer: formData.allowAnyPayer,
//                         memberIds: formData.memberIds,
//                         status,
//                         initialStop,
//                     },
//                 },
//                 {
//                     onSuccess: (trip: any) => {
//                         haptics.success();
//                         setIsSubmitting(false);
//                         router.replace(`/(app)/trips/${trip._id}`);
//                     },
//                     onError: (error: any) => {
//                         setIsSubmitting(false);
//                         Alert.alert('Error', error.message || 'Failed to create trip');
//                     },
//                 }
//             );
//         } catch (error: any) {
//             setIsSubmitting(false);
//             Alert.alert('Error', error.message || 'Something went wrong');
//         }
//     };

//     // ── STEP 1: CHOOSE A TEMPLATE ──
//     const renderTemplateStep = () => (
//         <View style={screenStyles.stepBox}>
//             <View style={screenStyles.stepHeader}>
//                 <Text style={[screenStyles.stepTitle, { color: theme.colors.textPrimary }]}>
//                     Choose a Template
//                 </Text>
//                 <Text style={[screenStyles.stepSubtitle, { color: theme.colors.textSecondary }]}>
//                     Pick the style that best matches your upcoming journey.
//                 </Text>
//             </View>

//             <View style={screenStyles.templatesGrid}>
//                 {templates.map((tpl: any) => (
//                     <TemplateCard
//                         key={tpl.id}
//                         template={tpl}
//                         selected={formData.template === tpl.id}
//                         onSelect={() => handleSelectTemplate(tpl.id)}
//                     />
//                 ))}
//             </View>

//             <Pressable
//                 onPress={() => {
//                     handleUpdateField('template', undefined);
//                     setCurrentStep(1);
//                 }}
//                 style={({ pressed, hovered }: any) => [
//                     screenStyles.skipBtn,
//                     {
//                         backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
//                         borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
//                     },
//                     Platform.OS === 'web' && hovered && { transform: [{ translateY: -1 }] },
//                     pressed && { opacity: 0.7 }
//                 ]}
//             >
//                 <AppIcon name="sparkles" size={16} color={theme.colors.textSecondary} />
//                 <Text style={[screenStyles.skipBtnText, { color: theme.colors.textPrimary }]}>
//                     Skip & Start from Scratch
//                 </Text>
//             </Pressable>
//         </View>
//     );

//     // ── STEP 2: TRIP DETAILS ──
//     const renderDetailsStep = () => (
//         <View style={screenStyles.stepBox}>
//             <View style={screenStyles.stepHeader}>
//                 <Text style={[screenStyles.stepTitle, { color: theme.colors.textPrimary }]}>
//                     Trip Details
//                 </Text>
//                 <Text style={[screenStyles.stepSubtitle, { color: theme.colors.textSecondary }]}>
//                     Fill in the essential information for your journey.
//                 </Text>
//             </View>

//             <View style={[
//                 screenStyles.formCard,
//                 {
//                     backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
//                     borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
//                 }
//             ]}>
//                 {/* Title */}
//                 <View style={screenStyles.fieldGroup}>
//                     <Text style={[screenStyles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                         TRIP TITLE *
//                     </Text>
//                     <View style={[screenStyles.inputBox, { backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
//                         <AppIcon name="compass" size={16} color={theme.colors.textTertiary} />
//                         <TextInput
//                             style={[screenStyles.textInput, { color: theme.colors.textPrimary }]}
//                             placeholder="e.g. Goa Beach Vacation, Tokyo Exploration..."
//                             placeholderTextColor={theme.colors.textTertiary}
//                             value={formData.title}
//                             onChangeText={(text) => handleUpdateField('title', text)}
//                         />
//                     </View>
//                 </View>

//                 {/* Description */}
//                 <View style={screenStyles.fieldGroup}>
//                     <Text style={[screenStyles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                         DESCRIPTION (OPTIONAL)
//                     </Text>
//                     <View style={[screenStyles.notesBox, { backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
//                         <TextInput
//                             style={[screenStyles.notesInput, { color: theme.colors.textPrimary }]}
//                             placeholder="Add trip itinerary highlights or travel notes..."
//                             placeholderTextColor={theme.colors.textTertiary}
//                             value={formData.description}
//                             onChangeText={(text) => handleUpdateField('description', text)}
//                             multiline
//                             numberOfLines={3}
//                         />
//                     </View>
//                 </View>

//                 {/* Dates Row */}
//                 <View style={screenStyles.dateRow}>
//                     <View style={[screenStyles.fieldGroup, { flex: 1 }]}>
//                         <Text style={[screenStyles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                             START DATE *
//                         </Text>
//                         <Pressable
//                             onPress={() => { haptics.light(); setShowStartDate(true); }}
//                             style={({ pressed }) => [
//                                 screenStyles.dateBtn,
//                                 { backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
//                                 pressed && { opacity: 0.7 }
//                             ]}
//                         >
//                             <AppIcon name="calendar" size={15} color="#EA580C" />
//                             <Text style={[screenStyles.dateText, { color: theme.colors.textPrimary }]}>
//                                 {format(formData.startDate, 'MMM d, yyyy')}
//                             </Text>
//                         </Pressable>

//                         {Platform.OS !== 'web' && showStartDate && (
//                             <DateTimePicker
//                                 value={formData.startDate}
//                                 mode="date"
//                                 display="default"
//                                 onChange={(event, selectedDate) => {
//                                     setShowStartDate(false);
//                                     if (selectedDate) handleUpdateField('startDate', selectedDate);
//                                 }}
//                             />
//                         )}
//                         {Platform.OS === 'web' && showStartDate && (
//                             <WebDateModal
//                                 currentDate={formData.startDate}
//                                 onClose={() => setShowStartDate(false)}
//                                 onSave={(date) => handleUpdateField('startDate', date)}
//                             />
//                         )}
//                     </View>

//                     <View style={[screenStyles.fieldGroup, { flex: 1 }]}>
//                         <Text style={[screenStyles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                             END DATE *
//                         </Text>
//                         <Pressable
//                             onPress={() => { haptics.light(); setShowEndDate(true); }}
//                             style={({ pressed }) => [
//                                 screenStyles.dateBtn,
//                                 { backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
//                                 pressed && { opacity: 0.7 }
//                             ]}
//                         >
//                             <AppIcon name="calendar" size={15} color="#EA580C" />
//                             <Text style={[screenStyles.dateText, { color: theme.colors.textPrimary }]}>
//                                 {format(formData.endDate, 'MMM d, yyyy')}
//                             </Text>
//                         </Pressable>

//                         {Platform.OS !== 'web' && showEndDate && (
//                             <DateTimePicker
//                                 value={formData.endDate}
//                                 mode="date"
//                                 display="default"
//                                 onChange={(event, selectedDate) => {
//                                     setShowEndDate(false);
//                                     if (selectedDate) handleUpdateField('endDate', selectedDate);
//                                 }}
//                             />
//                         )}
//                         {Platform.OS === 'web' && showEndDate && (
//                             <WebDateModal
//                                 currentDate={formData.endDate}
//                                 onClose={() => setShowEndDate(false)}
//                                 onSave={(date) => handleUpdateField('endDate', date)}
//                             />
//                         )}
//                     </View>
//                 </View>

//                 {/* Base Currency */}
//                 <View style={screenStyles.fieldGroup}>
//                     <Text style={[screenStyles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                         BASE CURRENCY
//                     </Text>
//                     <Pressable
//                         onPress={() => { haptics.light(); setShowCurrencies(!showCurrencies); }}
//                         style={[
//                             screenStyles.currencySelectBtn,
//                             { backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
//                         ]}
//                     >
//                         <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
//                             <View style={screenStyles.currencySymbolBadge}>
//                                 <Text style={screenStyles.currencySymbolText}>
//                                     {currencies.find((c: any) => c.code === formData.baseCurrency)?.symbol}
//                                 </Text>
//                             </View>
//                             <Text style={[screenStyles.currencyNameText, { color: theme.colors.textPrimary }]}>
//                                 {currencies.find((c: any) => c.code === formData.baseCurrency)?.name} ({formData.baseCurrency})
//                             </Text>
//                         </View>
//                         <AppIcon name={showCurrencies ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textTertiary} />
//                     </Pressable>

//                     {showCurrencies && (
//                         <View style={[screenStyles.currencyDropdown, { backgroundColor: theme.isDark ? '#1E293B' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
//                             <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
//                                 {currencies.map((c: any) => (
//                                     <Pressable
//                                         key={c.code}
//                                         onPress={() => {
//                                             haptics.light();
//                                             handleUpdateField('baseCurrency', c.code);
//                                             setShowCurrencies(false);
//                                         }}
//                                         style={({ hovered }: any) => [
//                                             screenStyles.currencyOption,
//                                             formData.baseCurrency === c.code && { backgroundColor: theme.isDark ? 'rgba(234,88,12,0.15)' : '#FFF7ED' },
//                                             Platform.OS === 'web' && hovered && { opacity: 0.8 }
//                                         ]}
//                                     >
//                                         <Text style={{ fontWeight: '800', color: '#EA580C', width: 28 }}>{c.symbol}</Text>
//                                         <Text style={{ fontSize: 13, color: theme.colors.textPrimary, flex: 1 }}>{c.name}</Text>
//                                         <Text style={{ fontSize: 12, color: theme.colors.textTertiary, fontWeight: '700' }}>{c.code}</Text>
//                                     </Pressable>
//                                 ))}
//                             </ScrollView>
//                         </View>
//                     )}
//                 </View>

//                 {/* Total Budget */}
//                 <View style={screenStyles.fieldGroup}>
//                     <Text style={[screenStyles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                         TOTAL BUDGET (OPTIONAL)
//                     </Text>
//                     <View style={[screenStyles.inputBox, { backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
//                         <Text style={{ fontSize: 15, fontWeight: '900', color: '#EA580C', marginRight: 4 }}>
//                             {currencies.find((c: any) => c.code === formData.baseCurrency)?.symbol}
//                         </Text>
//                         <TextInput
//                             style={[screenStyles.textInput, { color: theme.colors.textPrimary }]}
//                             placeholder="e.g. 50,000"
//                             placeholderTextColor={theme.colors.textTertiary}
//                             value={formData.totalBudget}
//                             onChangeText={(text) => handleUpdateField('totalBudget', text.replace(/[^0-9]/g, ''))}
//                             keyboardType="numeric"
//                         />
//                     </View>

//                     {/* Quick Budget Chips */}
//                     <View style={screenStyles.quickBudgetRow}>
//                         {QUICK_BUDGETS.map((amt) => (
//                             <Pressable
//                                 key={amt}
//                                 onPress={() => handleAddBudget(amt)}
//                                 style={({ pressed }) => [
//                                     screenStyles.quickBudgetChip,
//                                     { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' },
//                                     pressed && { opacity: 0.6 }
//                                 ]}
//                             >
//                                 <Text style={[screenStyles.quickBudgetText, { color: theme.colors.textSecondary }]}>
//                                     +₹{(amt / 1000).toFixed(0)}k
//                                 </Text>
//                             </Pressable>
//                         ))}
//                     </View>
//                 </View>

//                 {/* Default Split Method */}
//                 <View style={screenStyles.fieldGroup}>
//                     <Text style={[screenStyles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                         DEFAULT EXPENSE SPLIT
//                     </Text>
//                     <View style={screenStyles.splitGrid}>
//                         {([
//                             { id: 'equal', label: 'Equal ⚖️' },
//                             { id: 'percentage', label: 'Percentage 📊' },
//                             { id: 'exact', label: 'Exact 🔢' },
//                             { id: 'shares', label: 'Shares 🤝' }
//                         ] as const).map((m) => {
//                             const isSelected = formData.defaultSplitMethod === m.id;
//                             return (
//                                 <Pressable
//                                     key={m.id}
//                                     onPress={() => { haptics.light(); handleUpdateField('defaultSplitMethod', m.id); }}
//                                     style={({ pressed }: any) => [
//                                         screenStyles.splitChip,
//                                         {
//                                             backgroundColor: isSelected
//                                                 ? '#EA580C'
//                                                 : (theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC'),
//                                             borderColor: isSelected
//                                                 ? '#EA580C'
//                                                 : (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
//                                         },
//                                         pressed && { transform: [{ scale: 0.96 }] }
//                                     ]}
//                                 >
//                                     <Text style={[
//                                         screenStyles.splitChipText,
//                                         { color: isSelected ? '#FFFFFF' : theme.colors.textPrimary, fontWeight: isSelected ? '800' : '600' }
//                                     ]}>
//                                         {m.label}
//                                     </Text>
//                                 </Pressable>
//                             );
//                         })}
//                     </View>
//                 </View>

//                 {/* Allow Anyone to Pay Toggle */}
//                 <View style={[screenStyles.toggleRow, { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
//                     <View style={{ flex: 1, paddingRight: 16 }}>
//                         <Text style={[screenStyles.toggleTitle, { color: theme.colors.textPrimary }]}>
//                             Allow Anyone to Pay
//                         </Text>
//                         <Text style={[screenStyles.toggleSub, { color: theme.colors.textTertiary }]}>
//                             When enabled, any member can record an expense paid by them or others.
//                         </Text>
//                     </View>
//                     <Pressable
//                         onPress={() => { haptics.light(); handleUpdateField('allowAnyPayer', !formData.allowAnyPayer); }}
//                         style={[
//                             screenStyles.toggleTrack,
//                             { backgroundColor: formData.allowAnyPayer ? '#10B981' : (theme.isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1') }
//                         ]}
//                     >
//                         <View style={[
//                             screenStyles.toggleThumb,
//                             formData.allowAnyPayer ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
//                         ]} />
//                     </Pressable>
//                 </View>
//             </View>

//             {/* Next Step Button */}
//             <Pressable
//                 onPress={handleNext}
//                 style={({ pressed, hovered }: any) => [
//                     screenStyles.primaryActionBtn,
//                     Platform.OS === 'web' && hovered && { transform: [{ translateY: -1 }], opacity: 0.95 },
//                     pressed && { transform: [{ scale: 0.98 }] }
//                 ]}
//             >
//                 <Text style={screenStyles.primaryActionBtnText}>Continue to Members</Text>
//                 <AppIcon name="arrow-right" size={16} color="#FFFFFF" />
//             </Pressable>
//         </View>
//     );

//     // ── STEP 3: INVITE MEMBERS ──
//     const renderMembersStep = () => (
//         <View style={screenStyles.stepBox}>
//             <View style={screenStyles.stepHeader}>
//                 <Text style={[screenStyles.stepTitle, { color: theme.colors.textPrimary }]}>
//                     Invite Trip Members
//                 </Text>
//                 <Text style={[screenStyles.stepSubtitle, { color: theme.colors.textSecondary }]}>
//                     Add friends and co-travelers to split expenses smoothly.
//                 </Text>
//             </View>

//             <View style={[
//                 screenStyles.formCard,
//                 {
//                     backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
//                     borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
//                 }
//             ]}>
//                 {/* Search Bar */}
//                 <View style={[screenStyles.inputBox, { backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
//                     <AppIcon name="search" size={16} color={theme.colors.textTertiary} />
//                     <TextInput
//                         style={[screenStyles.textInput, { color: theme.colors.textPrimary }]}
//                         placeholder="Search by name or email..."
//                         placeholderTextColor={theme.colors.textTertiary}
//                         value={searchQuery}
//                         onChangeText={setSearchQuery}
//                     />
//                     {searchQuery.length > 0 && (
//                         <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
//                             <AppIcon name="x" size={15} color={theme.colors.textTertiary} />
//                         </Pressable>
//                     )}
//                 </View>

//                 {isSearching && (
//                     <View style={screenStyles.searchingWrap}>
//                         <GlobalLoader variant="inline" size="small" color="#EA580C" />
//                         <Text style={{ fontSize: 12, color: theme.colors.textTertiary }}>Searching directory...</Text>
//                     </View>
//                 )}

//                 {/* Selected Members Rack */}
//                 {selectedUsers.length > 0 && (
//                     <View style={screenStyles.selectedMembersBox}>
//                         <View style={screenStyles.selectedMembersHeader}>
//                             <Text style={[screenStyles.fieldLabel, { color: theme.colors.textSecondary }]}>
//                                 INVITED ({selectedUsers.length})
//                             </Text>
//                             <Pressable onPress={() => {
//                                 haptics.light();
//                                 setSelectedUsers([]);
//                                 handleUpdateField('memberIds', []);
//                             }}>
//                                 <Text style={{ fontSize: 11, fontWeight: '700', color: theme.colors.danger }}>Clear all</Text>
//                             </Pressable>
//                         </View>
//                         <View style={screenStyles.selectedChipsWrap}>
//                             {selectedUsers.map((user) => {
//                                 const uid = user._id || user.userId;
//                                 return (
//                                     <View key={uid} style={[screenStyles.memberChip, { backgroundColor: theme.isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED', borderColor: 'rgba(234, 88, 12, 0.3)' }]}>
//                                         <Avatar size="sm" fallback={user.displayName?.charAt(0) || 'U'} url={user.photoURL} />
//                                         <Text style={[screenStyles.memberChipName, { color: theme.colors.textPrimary }]}>
//                                             {user.displayName}
//                                         </Text>
//                                         <Pressable
//                                             onPress={() => {
//                                                 haptics.light();
//                                                 setSelectedUsers(prev => prev.filter(u => (u._id || u.userId) !== uid));
//                                                 handleUpdateField('memberIds', formData.memberIds.filter(id => id !== uid));
//                                             }}
//                                             hitSlop={8}
//                                         >
//                                             <AppIcon name="x" size={13} color={theme.colors.textSecondary} />
//                                         </Pressable>
//                                     </View>
//                                 );
//                             })}
//                         </View>
//                     </View>
//                 )}

//                 {/* Search Results */}
//                 {searchQuery.trim().length >= 2 && searchResults.length > 0 && !isSearching && (
//                     <View style={screenStyles.userList}>
//                         {searchResults.map((user: any) => {
//                             const uid = user._id || user.userId;
//                             const isSelected = selectedUsers.some(u => (u._id || u.userId) === uid);
//                             return (
//                                 <Pressable
//                                     key={uid}
//                                     onPress={() => {
//                                         haptics.light();
//                                         if (isSelected) {
//                                             setSelectedUsers(prev => prev.filter(u => (u._id || u.userId) !== uid));
//                                             handleUpdateField('memberIds', formData.memberIds.filter(id => id !== uid));
//                                         } else {
//                                             setSelectedUsers(prev => [...prev, user]);
//                                             handleUpdateField('memberIds', [...formData.memberIds, uid]);
//                                         }
//                                     }}
//                                     style={({ hovered }: any) => [
//                                         screenStyles.userItem,
//                                         {
//                                             backgroundColor: isSelected
//                                                 ? (theme.isDark ? 'rgba(234, 88, 12, 0.12)' : '#FFF7ED')
//                                                 : (theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC'),
//                                             borderColor: isSelected ? '#EA580C' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
//                                         },
//                                         Platform.OS === 'web' && hovered && !isSelected && { transform: [{ translateY: -1 }] }
//                                     ]}
//                                 >
//                                     <Avatar size="sm" fallback={user.displayName?.charAt(0) || 'U'} url={user.photoURL} />
//                                     <View style={{ flex: 1, marginLeft: 10 }}>
//                                         <Text style={[screenStyles.userName, { color: theme.colors.textPrimary }]}>{user.displayName}</Text>
//                                         {user.email && <Text style={[screenStyles.userEmail, { color: theme.colors.textTertiary }]}>{user.email}</Text>}
//                                     </View>
//                                     <View style={[screenStyles.addIconCircle, { backgroundColor: isSelected ? '#EA580C' : (theme.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0') }]}>
//                                         <AppIcon name={isSelected ? 'check' : 'plus'} size={13} color={isSelected ? '#FFFFFF' : theme.colors.textSecondary} />
//                                     </View>
//                                 </Pressable>
//                             );
//                         })}
//                     </View>
//                 )}

//                 {/* Quick Add Friends List */}
//                 {searchQuery.trim().length === 0 && friendsList.length > 0 && (
//                     <View style={{ marginTop: 12 }}>
//                         <Text style={[screenStyles.fieldLabel, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
//                             QUICK ADD FRIENDS ({friendsList.length})
//                         </Text>
//                         <View style={screenStyles.userList}>
//                             {friendsList.map((friend: any) => {
//                                 const friendId = friend.userId || friend._id;
//                                 const isSelected = selectedUsers.some(u => (u.userId || u._id) === friendId);
//                                 return (
//                                     <Pressable
//                                         key={friendId}
//                                         onPress={() => {
//                                             haptics.light();
//                                             if (isSelected) {
//                                                 setSelectedUsers(prev => prev.filter(u => (u.userId || u._id) !== friendId));
//                                                 handleUpdateField('memberIds', formData.memberIds.filter(id => id !== friendId));
//                                             } else {
//                                                 setSelectedUsers(prev => [...prev, { ...friend, _id: friendId }]);
//                                                 handleUpdateField('memberIds', [...formData.memberIds, friendId]);
//                                             }
//                                         }}
//                                         style={({ hovered }: any) => [
//                                             screenStyles.userItem,
//                                             {
//                                                 backgroundColor: isSelected
//                                                     ? (theme.isDark ? 'rgba(234, 88, 12, 0.12)' : '#FFF7ED')
//                                                     : (theme.isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC'),
//                                                 borderColor: isSelected ? '#EA580C' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
//                                             },
//                                             Platform.OS === 'web' && hovered && !isSelected && { transform: [{ translateY: -1 }] }
//                                         ]}
//                                     >
//                                         <Avatar size="sm" fallback={friend.displayName?.charAt(0) || 'U'} url={friend.photoURL} />
//                                         <View style={{ flex: 1, marginLeft: 10 }}>
//                                             <Text style={[screenStyles.userName, { color: theme.colors.textPrimary }]}>{friend.displayName}</Text>
//                                             {friend.email && <Text style={[screenStyles.userEmail, { color: theme.colors.textTertiary }]}>{friend.email}</Text>}
//                                         </View>
//                                         <View style={[screenStyles.addIconCircle, { backgroundColor: isSelected ? '#EA580C' : (theme.isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0') }]}>
//                                             <AppIcon name={isSelected ? 'check' : 'plus'} size={13} color={isSelected ? '#FFFFFF' : theme.colors.textSecondary} />
//                                         </View>
//                                     </Pressable>
//                                 );
//                             })}
//                         </View>
//                     </View>
//                 )}
//             </View>

//             {/* Next Button */}
//             <Pressable
//                 onPress={handleNext}
//                 style={({ pressed, hovered }: any) => [
//                     screenStyles.primaryActionBtn,
//                     Platform.OS === 'web' && hovered && { transform: [{ translateY: -1 }], opacity: 0.95 },
//                     pressed && { transform: [{ scale: 0.98 }] }
//                 ]}
//             >
//                 <Text style={screenStyles.primaryActionBtnText}>Review & Confirm</Text>
//                 <AppIcon name="arrow-right" size={16} color="#FFFFFF" />
//             </Pressable>
//         </View>
//     );

//     // ── STEP 4: REVIEW & CREATE ──
//     const renderReviewStep = () => (
//         <View style={screenStyles.stepBox}>
//             <View style={screenStyles.stepHeader}>
//                 <Text style={[screenStyles.stepTitle, { color: theme.colors.textPrimary }]}>
//                     Review Your Trip
//                 </Text>
//                 <Text style={[screenStyles.stepSubtitle, { color: theme.colors.textSecondary }]}>
//                     Verify all details before we initialize your workspace.
//                 </Text>
//             </View>

//             <View style={[
//                 screenStyles.formCard,
//                 {
//                     backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.75)' : '#FFFFFF',
//                     borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
//                 }
//             ]}>
//                 {formData.template && (
//                     <View style={[screenStyles.reviewRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
//                         <Text style={[screenStyles.reviewLabel, { color: theme.colors.textSecondary }]}>Template</Text>
//                         <View style={[screenStyles.reviewTag, { backgroundColor: theme.isDark ? 'rgba(234, 88, 12, 0.18)' : '#FFF7ED' }]}>
//                             <Text style={screenStyles.reviewTagText}>
//                                 {TEMPLATE_META[formData.template]?.emoji || '📍'} {formData.template.toUpperCase()}
//                             </Text>
//                         </View>
//                     </View>
//                 )}

//                 <View style={[screenStyles.reviewRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
//                     <Text style={[screenStyles.reviewLabel, { color: theme.colors.textSecondary }]}>Trip Name</Text>
//                     <Text style={[screenStyles.reviewValue, { color: theme.colors.textPrimary, fontWeight: '800' }]}>
//                         {formData.title || '—'}
//                     </Text>
//                 </View>

//                 {formData.description ? (
//                     <View style={[screenStyles.reviewRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
//                         <Text style={[screenStyles.reviewLabel, { color: theme.colors.textSecondary }]}>Description</Text>
//                         <Text style={[screenStyles.reviewValue, { color: theme.colors.textSecondary }]} numberOfLines={2}>
//                             {formData.description}
//                         </Text>
//                     </View>
//                 ) : null}

//                 <View style={[screenStyles.reviewRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
//                     <Text style={[screenStyles.reviewLabel, { color: theme.colors.textSecondary }]}>Dates</Text>
//                     <Text style={[screenStyles.reviewValue, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
//                         {format(formData.startDate, 'MMM d')} — {format(formData.endDate, 'MMM d, yyyy')}
//                     </Text>
//                 </View>

//                 <View style={[screenStyles.reviewRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
//                     <Text style={[screenStyles.reviewLabel, { color: theme.colors.textSecondary }]}>Currency</Text>
//                     <Text style={[screenStyles.reviewValue, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
//                         {currencies.find((c: any) => c.code === formData.baseCurrency)?.symbol} {formData.baseCurrency}
//                     </Text>
//                 </View>

//                 {formData.totalBudget ? (
//                     <View style={[screenStyles.reviewRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
//                         <Text style={[screenStyles.reviewLabel, { color: theme.colors.textSecondary }]}>Total Budget</Text>
//                         <Text style={[screenStyles.reviewValue, { color: '#EA580C', fontWeight: '900' }]}>
//                             {currencies.find((c: any) => c.code === formData.baseCurrency)?.symbol} {parseInt(formData.totalBudget).toLocaleString()}
//                         </Text>
//                     </View>
//                 ) : null}

//                 <View style={[screenStyles.reviewRow, { borderBottomWidth: 0 }]}>
//                     <Text style={[screenStyles.reviewLabel, { color: theme.colors.textSecondary }]}>Split Method</Text>
//                     <Text style={[screenStyles.reviewValue, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
//                         {formData.defaultSplitMethod.charAt(0).toUpperCase() + formData.defaultSplitMethod.slice(1)}
//                     </Text>
//                 </View>
//             </View>

//             {/* Quick Summary Cards */}
//             <View style={screenStyles.summaryCardsRow}>
//                 <View style={[screenStyles.miniSummaryCard, { backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
//                     <Text style={{ fontSize: 20 }}>📍</Text>
//                     <View style={{ flex: 1 }}>
//                         <Text style={[screenStyles.miniSummaryTitle, { color: theme.colors.textPrimary }]}>Stops & Itinerary</Text>
//                         <Text style={[screenStyles.miniSummarySub, { color: theme.colors.textTertiary }]}>
//                             {formData.template === 'quick' ? '1 initial stop created automatically.' : 'Add custom stops anytime in trip view.'}
//                         </Text>
//                     </View>
//                 </View>

//                 <View style={[screenStyles.miniSummaryCard, { backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
//                     <Text style={{ fontSize: 20 }}>👥</Text>
//                     <View style={{ flex: 1 }}>
//                         <Text style={[screenStyles.miniSummaryTitle, { color: theme.colors.textPrimary }]}>Members</Text>
//                         <Text style={[screenStyles.miniSummarySub, { color: theme.colors.textTertiary }]}>
//                             {selectedUsers.length > 0 ? `${selectedUsers.length} member${selectedUsers.length > 1 ? 's' : ''} invited` : 'You are the admin. Invite co-travelers anytime.'}
//                         </Text>
//                     </View>
//                 </View>
//             </View>

//             {/* Final Action Buttons */}
//             <Pressable
//                 onPress={() => handleCreate('active')}
//                 disabled={isPending || isSubmitting}
//                 style={({ pressed, hovered }: any) => [
//                     screenStyles.primaryActionBtn,
//                     Platform.OS === 'web' && hovered && { transform: [{ translateY: -1 }], opacity: 0.95 },
//                     pressed && { transform: [{ scale: 0.98 }] }
//                 ]}
//             >
//                 {isPending || isSubmitting ? (
//                     <GlobalLoader variant="inline" size="small" color="#FFFFFF" />
//                 ) : (
//                     <>
//                         <AppIcon name="circle-check" size={18} color="#FFFFFF" />
//                         <Text style={screenStyles.primaryActionBtnText}>Launch Active Trip</Text>
//                     </>
//                 )}
//             </Pressable>

//             <Pressable
//                 onPress={() => handleCreate('planning')}
//                 disabled={isPending || isSubmitting}
//                 style={({ pressed, hovered }: any) => [
//                     screenStyles.draftBtn,
//                     { backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF', borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
//                     Platform.OS === 'web' && hovered && { opacity: 0.9 },
//                     pressed && { opacity: 0.7 }
//                 ]}
//             >
//                 <Text style={[screenStyles.draftBtnText, { color: theme.colors.textSecondary }]}>
//                     Save as Draft (Planning Only)
//                 </Text>
//             </Pressable>
//         </View>
//     );

//     const renderStepContent = () => {
//         switch (currentStep) {
//             case 0: return renderTemplateStep();
//             case 1: return renderDetailsStep();
//             case 2: return renderMembersStep();
//             case 3: return renderReviewStep();
//             default: return null;
//         }
//     };

//     return (
//         <GlobalBackground>
//             <KeyboardAvoidingView
//                 style={screenStyles.container}
//                 behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//             >
//                 {/* Top Nav Bar */}
//                 <View style={[screenStyles.topBar, { paddingTop: Math.max(insets.top, 12), borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
//                     <View style={[screenStyles.topBarInner, isWebDesktop && { maxWidth: FORM_MAX_WIDTH, alignSelf: 'center', width: '100%' }]}>
//                         <Pressable
//                             onPress={handleBack}
//                             style={({ pressed }) => [
//                                 screenStyles.navIconBtn,
//                                 { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' },
//                                 pressed && { opacity: 0.6 }
//                             ]}
//                         >
//                             <AppIcon name="arrow-left" size={18} color={theme.colors.textPrimary} />
//                         </Pressable>

//                         <Text style={[screenStyles.navTitle, { color: theme.colors.textPrimary }]}>
//                             {currentStep === 0 ? 'Create a Trip' : (formData.title || 'New Trip')}
//                         </Text>

//                         <View style={screenStyles.stepCounterPill}>
//                             <Text style={screenStyles.stepCounterText}>Step {currentStep + 1}/4</Text>
//                         </View>
//                     </View>
//                 </View>

//                 {/* Step Indicator */}
//                 <StepIndicator currentStep={currentStep} onStepPress={setCurrentStep} />

//                 {/* Main Scroll Content */}
//                 <ScrollView
//                     ref={scrollViewRef}
//                     style={screenStyles.scrollView}
//                     contentContainerStyle={[
//                         screenStyles.scrollContent,
//                         isWebDesktop && { maxWidth: FORM_MAX_WIDTH, alignSelf: 'center', width: '100%' },
//                         { paddingBottom: Math.max(insets.bottom, 20) + 40 }
//                     ]}
//                     showsVerticalScrollIndicator={false}
//                 >
//                     {renderStepContent()}
//                 </ScrollView>
//             </KeyboardAvoidingView>
//         </GlobalBackground>
//     );
// }

// // ============================================================
// // Styles
// // ============================================================

// const screenStyles = StyleSheet.create({
//     container: { flex: 1 },
//     topBar: {
//         paddingHorizontal: 20,
//         paddingBottom: 12,
//         borderBottomWidth: 1,
//     },
//     topBarInner: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//     },
//     navIconBtn: {
//         width: 36,
//         height: 36,
//         borderRadius: 10,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     navTitle: {
//         fontSize: 17,
//         fontWeight: '900',
//         letterSpacing: -0.3,
//     },
//     stepCounterPill: {
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 8,
//         backgroundColor: 'rgba(234, 88, 12, 0.15)',
//     },
//     stepCounterText: {
//         fontSize: 11,
//         fontWeight: '800',
//         color: '#EA580C',
//     },
//     scrollView: { flex: 1 },
//     scrollContent: {
//         paddingHorizontal: 20,
//         paddingTop: 8,
//     },
//     stepBox: {
//         width: '100%',
//         gap: 16,
//     },
//     stepHeader: {
//         marginBottom: 4,
//     },
//     stepTitle: {
//         fontSize: 22,
//         fontWeight: '900',
//         letterSpacing: -0.5,
//     },
//     stepSubtitle: {
//         fontSize: 13,
//         fontWeight: '500',
//         marginTop: 4,
//     },
//     templatesGrid: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 12,
//     },
//     skipBtn: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 8,
//         paddingVertical: 14,
//         borderRadius: 16,
//         borderWidth: 1.5,
//         cursor: 'pointer',
//     } as any,
//     skipBtnText: {
//         fontSize: 14,
//         fontWeight: '800',
//     },
//     formCard: {
//         padding: 20,
//         borderRadius: 24,
//         borderWidth: 1.5,
//         gap: 16,
//         boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
//     } as any,
//     fieldGroup: {
//         gap: 6,
//     },
//     fieldLabel: {
//         fontSize: 11,
//         fontWeight: '800',
//         letterSpacing: 0.6,
//         textTransform: 'uppercase',
//     },
//     inputBox: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 10,
//         paddingHorizontal: 14,
//         paddingVertical: 11,
//         borderRadius: 14,
//         borderWidth: 1,
//     },
//     textInput: {
//         flex: 1,
//         fontSize: 14,
//         fontWeight: '600',
//         padding: 0,
//     },
//     notesBox: {
//         paddingHorizontal: 14,
//         paddingVertical: 11,
//         borderRadius: 14,
//         borderWidth: 1,
//     },
//     notesInput: {
//         fontSize: 13,
//         fontWeight: '500',
//         minHeight: 56,
//         textAlignVertical: 'top',
//         padding: 0,
//     },
//     dateRow: {
//         flexDirection: 'row',
//         gap: 12,
//     },
//     dateBtn: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//         paddingHorizontal: 14,
//         paddingVertical: 11,
//         borderRadius: 14,
//         borderWidth: 1,
//     },
//     dateText: {
//         fontSize: 13,
//         fontWeight: '700',
//     },
//     currencySelectBtn: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 14,
//         paddingVertical: 11,
//         borderRadius: 14,
//         borderWidth: 1,
//     },
//     currencySymbolBadge: {
//         paddingHorizontal: 7,
//         paddingVertical: 2,
//         borderRadius: 6,
//         backgroundColor: 'rgba(234, 88, 12, 0.15)',
//     },
//     currencySymbolText: {
//         fontSize: 12,
//         fontWeight: '900',
//         color: '#EA580C',
//     },
//     currencyNameText: {
//         fontSize: 13,
//         fontWeight: '700',
//     },
//     currencyDropdown: {
//         borderRadius: 16,
//         borderWidth: 1,
//         overflow: 'hidden',
//         marginTop: 6,
//         boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
//     } as any,
//     currencyOption: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingHorizontal: 14,
//         paddingVertical: 10,
//         cursor: 'pointer',
//     } as any,
//     quickBudgetRow: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 6,
//         marginTop: 4,
//     },
//     quickBudgetChip: {
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 8,
//     },
//     quickBudgetText: {
//         fontSize: 11,
//         fontWeight: '700',
//     },
//     splitGrid: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 8,
//     },
//     splitChip: {
//         paddingHorizontal: 12,
//         paddingVertical: 8,
//         borderRadius: 12,
//         borderWidth: 1,
//         cursor: 'pointer',
//     } as any,
//     splitChipText: {
//         fontSize: 12,
//     },
//     toggleRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingTop: 12,
//         borderTopWidth: 1,
//     },
//     toggleTitle: {
//         fontSize: 13,
//         fontWeight: '800',
//     },
//     toggleSub: {
//         fontSize: 11,
//         fontWeight: '500',
//         marginTop: 2,
//     },
//     toggleTrack: {
//         width: 48,
//         height: 28,
//         borderRadius: 14,
//         justifyContent: 'center',
//         padding: 2,
//     },
//     toggleThumb: {
//         width: 24,
//         height: 24,
//         borderRadius: 12,
//         backgroundColor: '#FFFFFF',
//         boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
//     } as any,
//     primaryActionBtn: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 8,
//         backgroundColor: '#EA580C',
//         paddingVertical: 15,
//         borderRadius: 16,
//         boxShadow: '0 8px 24px rgba(234, 88, 12, 0.4)',
//         cursor: 'pointer',
//         marginTop: 4,
//     } as any,
//     primaryActionBtnText: {
//         color: '#FFFFFF',
//         fontSize: 15,
//         fontWeight: '800',
//         letterSpacing: -0.2,
//     },
//     searchingWrap: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//         paddingVertical: 8,
//     },
//     selectedMembersBox: {
//         gap: 6,
//     },
//     selectedMembersHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//     },
//     selectedChipsWrap: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 6,
//     },
//     memberChip: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 999,
//         borderWidth: 1,
//     },
//     memberChipName: {
//         fontSize: 11,
//         fontWeight: '700',
//     },
//     userList: {
//         gap: 6,
//     },
//     userItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 10,
//         borderRadius: 14,
//         borderWidth: 1,
//         cursor: 'pointer',
//     } as any,
//     userName: {
//         fontSize: 13,
//         fontWeight: '700',
//     },
//     userEmail: {
//         fontSize: 11,
//     },
//     addIconCircle: {
//         width: 26,
//         height: 26,
//         borderRadius: 13,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     reviewRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingVertical: 10,
//         borderBottomWidth: 1,
//     },
//     reviewLabel: {
//         fontSize: 12,
//         fontWeight: '700',
//     },
//     reviewValue: {
//         fontSize: 13,
//         maxWidth: '65%',
//         textAlign: 'right',
//     },
//     reviewTag: {
//         paddingHorizontal: 8,
//         paddingVertical: 3,
//         borderRadius: 6,
//     },
//     reviewTagText: {
//         fontSize: 11,
//         fontWeight: '900',
//         color: '#EA580C',
//     },
//     summaryCardsRow: {
//         gap: 10,
//     },
//     miniSummaryCard: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 12,
//         padding: 12,
//         borderRadius: 16,
//         borderWidth: 1,
//     },
//     miniSummaryTitle: {
//         fontSize: 13,
//         fontWeight: '800',
//     },
//     miniSummarySub: {
//         fontSize: 11,
//         fontWeight: '500',
//         marginTop: 2,
//     },
//     draftBtn: {
//         paddingVertical: 13,
//         borderRadius: 16,
//         borderWidth: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//         cursor: 'pointer',
//     } as any,
//     draftBtnText: {
//         fontSize: 13,
//         fontWeight: '700',
//     }
// });
