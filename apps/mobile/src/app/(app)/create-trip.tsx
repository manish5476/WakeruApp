// src/app/(app)/create-trip.tsx
import React, { useState, useMemo, useRef } from 'react';
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
import { useEntitlements } from '../../hooks/useEntitlements';
import { useAds } from '../../hooks/useAds';
import { PlanLimitModal } from '../../components/subscription/PlanLimitModal';
import { useTheme } from '../../providers/ThemeProvider';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import { Avatar } from '../../components/ui/Avatar';
import { haptics } from '../../utils/haptics';
import { showToast } from '../../utils/toast';
import { locationApi } from '../../services/api/location.api';
import AppIcon from '../../components/common/AppIcon';
import GlobalLoader from '../../components/common/GlobalLoader';
import {
  SUPPORTED_CURRENCIES,
  getCurrencyInfo,
  getQuickBudgets,
} from '../../constants/countries';

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

const SPLIT_OPTIONS: Array<{
  id: SplitMethod;
  title: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'equal',
    title: 'Equal Split',
    desc: 'Split evenly across all travelers',
    icon: 'scale',
  },
  {
    id: 'percentage',
    title: 'Percentage',
    desc: 'Custom percentage ratio per member',
    icon: 'percent',
  },
  {
    id: 'exact',
    title: 'Exact Amounts',
    desc: 'Specify exact currency sums',
    icon: 'calculator',
  },
  {
    id: 'shares',
    title: 'Weighted Shares',
    desc: 'Ratio units like 1:2 or points',
    icon: 'users',
  },
];

const POPULAR_CURRENCY_CODES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SGD',
  'JPY',
  'THB',
  'AUD',
  'CAD',
];

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
                            ? theme.colors.textInverse
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

// ─── Currency Picker Modal ───────────────────────────────────
function CurrencyPickerModal({
  visible,
  onClose,
  selectedCurrency,
  onSelect,
  currencies,
}: {
  visible: boolean;
  onClose: () => void;
  selectedCurrency: string;
  onSelect: (code: string) => void;
  currencies: Array<{
    code: string;
    name: string;
    symbol: string;
    flag?: string;
  }>;
}) {
  const theme = useTheme();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return currencies;
    const q = search.toLowerCase().trim();
    return currencies.filter(
      c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q),
    );
  }, [currencies, search]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                modalStyles.currencyModalContent,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(15,23,42,0.08)',
                },
              ]}
            >
              {/* Header */}
              <View style={modalStyles.currencyHeader}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text
                    style={[
                      modalStyles.currencyModalTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Select Currency
                  </Text>
                  <Text
                    style={[
                      modalStyles.currencyModalSub,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Choose the baseline currency for expenses and settlements.
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  style={[
                    modalStyles.modalCloseBtn,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(15,23,42,0.06)',
                    },
                  ]}
                >
                  <AppIcon
                    name="x"
                    size={16}
                    color={theme.colors.textPrimary}
                  />
                </Pressable>
              </View>

              {/* Search Bar */}
              <View
                style={[
                  modalStyles.searchBox,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(15,23,42,0.06)',
                  },
                ]}
              >
                <AppIcon
                  name="search"
                  size={15}
                  color={theme.colors.textTertiary}
                />
                <TextInput
                  style={[
                    modalStyles.searchInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  placeholder="Search by name, symbol, or ISO code..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} hitSlop={8}>
                    <AppIcon
                      name="x"
                      size={14}
                      color={theme.colors.textTertiary}
                    />
                  </Pressable>
                )}
              </View>

              {/* Popular Currencies Quick Bar */}
              {!search.trim() && (
                <View style={modalStyles.popularSection}>
                  <Text
                    style={[
                      modalStyles.popularTitle,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    FREQUENTLY USED
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={modalStyles.popularScroll}
                  >
                    {POPULAR_CURRENCY_CODES.map(code => {
                      const c = currencies.find(item => item.code === code);
                      if (!c) return null;
                      const isSelected = selectedCurrency === code;
                      return (
                        <Pressable
                          key={code}
                          onPress={() => {
                            haptics.light();
                            onSelect(code);
                            onClose();
                          }}
                          style={[
                            modalStyles.popularChip,
                            {
                              backgroundColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.background,
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.isDark
                                  ? 'rgba(255,255,255,0.08)'
                                  : 'rgba(15,23,42,0.08)',
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 13 }}>{c.flag}</Text>
                          <Text
                            style={[
                              modalStyles.popularChipText,
                              {
                                color: isSelected
                                  ? theme.colors.textInverse
                                  : theme.colors.textPrimary,
                              },
                            ]}
                          >
                            {code}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Currency List */}
              <ScrollView
                style={modalStyles.currencyList}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {filtered.map(c => {
                  const isSelected = selectedCurrency === c.code;
                  return (
                    <Pressable
                      key={c.code}
                      onPress={() => {
                        haptics.light();
                        onSelect(c.code);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        modalStyles.currencyItem,
                        isSelected && {
                          backgroundColor: `${theme.colors.primary}12`,
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <View
                        style={[
                          modalStyles.currencyFlagBadge,
                          { backgroundColor: theme.colors.background },
                        ]}
                      >
                        <Text style={{ fontSize: 18 }}>{c.flag || '🌐'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={[
                            modalStyles.currencyItemName,
                            {
                              color: theme.colors.textPrimary,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {c.name}
                        </Text>
                        <Text
                          style={[
                            modalStyles.currencyItemCode,
                            { color: theme.colors.textTertiary },
                          ]}
                        >
                          {c.code} &bull; {c.symbol}
                        </Text>
                      </View>
                      {isSelected && (
                        <View
                          style={[
                            modalStyles.checkBadge,
                            { backgroundColor: theme.colors.primary },
                          ]}
                        >
                          <AppIcon
                            name="check"
                            size={12}
                            color={theme.colors.textInverse}
                          />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
                {filtered.length === 0 && (
                  <View style={modalStyles.emptySearch}>
                    <Text
                      style={{ color: theme.colors.textTertiary, fontSize: 13 }}
                    >
                      No matching currencies found
                    </Text>
                  </View>
                )}
              </ScrollView>
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

  // Calculate live trip duration in days
  const durationDays = useMemo(() => {
    const diffTime = formData.endDate.getTime() - formData.startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [formData.startDate, formData.endDate]);

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

  // Entitlements & Subscription Limits
  const { planName, getLimitStatus } = useEntitlements();
  const tripsStatus = getLimitStatus('trips');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalData, setLimitModalData] = useState<{
    message?: string;
    limitValue?: number;
    currentUsage?: number;
  }>({});

  // Queries & Mutations
  const { data: templatesData } = useTripTemplates();
  const templates = templatesData || [];
  const { mutate: createTrip, isPending } = useCreateTrip();
  const { triggerTripCreatedInterstitial } = useAds();

  const { data: countriesResponse } = useQuery({
    queryKey: ['countries'],
    queryFn: locationApi.getSupportedCountries,
  });

  const currencies = useMemo(() => {
    const raw = countriesResponse?.data?.data || [];
    const map = new Map<string, any>();

    // Seed with high-quality supported currencies
    SUPPORTED_CURRENCIES.forEach((sc: any) => {
      map.set(sc.code, {
        code: sc.code,
        symbol: sc.symbol,
        name: sc.name,
        flag: sc.flag,
      });
    });

    // Merge any additional currencies from API
    raw.forEach((c: any) => {
      if (c.currency && !map.has(c.currency)) {
        map.set(c.currency, {
          code: c.currency,
          symbol: c.currencySymbol || c.currency,
          name: c.currencyName || c.currency,
          flag: c.emoji || '',
        });
      }
    });

    return Array.from(map.values());
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
            'Trip Name Required',
            'Please enter a name for your journey to proceed.',
          );
          return false;
        }
        if (formData.endDate < formData.startDate) {
          haptics.warning();
          Alert.alert(
            'Invalid Timeline',
            'Return date must be on or after your departure date.',
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
          onSuccess: async (trip: any) => {
            showToast.success(
              'Trip Created! ✈️',
              `"${formData.title.trim()}" is ready.`,
            );
            setIsSubmitting(false);
            try {
              await triggerTripCreatedInterstitial();
            } catch (_) {}
            router.replace(`/(app)/trips/${trip._id}`);
          },
          onError: (error: any) => {
            setIsSubmitting(false);
            if (
              error?.code === 'PLAN_LIMIT_REACHED' ||
              error?.message?.includes('PLAN_LIMIT_REACHED') ||
              error?.statusCode === 403
            ) {
              setLimitModalData({
                message:
                  error.message ||
                  'You have reached your plan limit for trips. Upgrade to create more.',
                limitValue:
                  error?.details?.limit ??
                  error?.details?.maxAllowed ??
                  tripsStatus.total ??
                  5,
                currentUsage: error?.details?.currentUsage ?? tripsStatus.used,
              });
              setShowLimitModal(true);
            } else {
              showToast.fromError(error, 'Failed to Create Trip');
            }
          },
        },
      );
    } catch (error: any) {
      setIsSubmitting(false);
      showToast.fromError(error, 'Something Went Wrong');
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
          Select a tailored expedition framework or start fresh.
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

  // ── STEP 2: TRIP DETAILS (DECLUTTERED & BENTO-STRUCTURED) ──
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
          Configure your itinerary timeline, baseline currency, and group
          splitting rules.
        </Text>
      </View>

      {/* ── CARD 1: EXPEDITION IDENTITY ── */}
      <View
        style={[
          screenStyles.sectionCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={screenStyles.sectionHeaderRow}>
          <View
            style={[
              screenStyles.sectionIconBadge,
              { backgroundColor: `${theme.colors.primary}12` },
            ]}
          >
            <AppIcon name="compass" size={16} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                screenStyles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Expedition Identity
            </Text>
            <Text
              style={[
                screenStyles.sectionSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Give your adventure a name and add destination highlights
            </Text>
          </View>
        </View>

        {/* Title Input */}
        <View style={screenStyles.fieldGroup}>
          <Text
            style={[
              screenStyles.fieldLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            TRIP NAME *
          </Text>
          <View
            style={[
              screenStyles.inputBox,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(15,23,42,0.08)',
              },
            ]}
          >
            <AppIcon name="map-pin" size={16} color={theme.colors.primary} />
            <TextInput
              style={[
                screenStyles.textInput,
                { color: theme.colors.textPrimary },
              ]}
              placeholder="e.g. Kyoto Cherry Blossoms, Swiss Alps Trek..."
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.title}
              onChangeText={text => handleUpdateField('title', text)}
            />
          </View>
        </View>

        {/* Description / Notes Input */}
        <View style={screenStyles.fieldGroup}>
          <Text
            style={[
              screenStyles.fieldLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            TRIP NOTES & DESCRIPTION (OPTIONAL)
          </Text>
          <View
            style={[
              screenStyles.notesBox,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(15,23,42,0.08)',
              },
            ]}
          >
            <TextInput
              style={[
                screenStyles.notesInput,
                { color: theme.colors.textPrimary },
              ]}
              placeholder="Key destinations, flight numbers, hotel bookings, or packing reminders..."
              placeholderTextColor={theme.colors.textTertiary}
              value={formData.description}
              onChangeText={text => handleUpdateField('description', text)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </View>

      {/* ── CARD 2: TRAVEL TIMELINE & DURATION ── */}
      <View
        style={[
          screenStyles.sectionCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={screenStyles.sectionHeaderRow}>
          <View
            style={[
              screenStyles.sectionIconBadge,
              { backgroundColor: 'rgba(56, 189, 248, 0.15)' },
            ]}
          >
            <AppIcon name="calendar" size={16} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                screenStyles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Dates & Duration
            </Text>
            <Text
              style={[
                screenStyles.sectionSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Set departure and return window
            </Text>
          </View>
        </View>

        {/* Live Duration Highlight Pill */}
        <View
          style={[
            screenStyles.durationBanner,
            {
              backgroundColor: `${theme.colors.primary}0C`,
              borderColor: `${theme.colors.primary}22`,
            },
          ]}
        >
          <AppIcon name="clock" size={14} color={theme.colors.primary} />
          <Text
            style={[
              screenStyles.durationBannerText,
              { color: theme.colors.textPrimary },
            ]}
          >
            <Text style={{ fontWeight: '800', color: theme.colors.primary }}>
              {durationDays} Day{durationDays > 1 ? 's' : ''} Journey
            </Text>
            {'  '}&bull;{'  '}
            {format(formData.startDate, 'MMM d')} &rarr;{' '}
            {format(formData.endDate, 'MMM d, yyyy')}
          </Text>
        </View>

        {/* Boarding-Pass Style Date Tiles */}
        <View style={screenStyles.dateTilesRow}>
          <Pressable
            onPress={() => {
              haptics.light();
              setShowStartDate(true);
            }}
            style={({ pressed }) => [
              screenStyles.dateTile,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(15,23,42,0.08)',
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={screenStyles.dateTileHeader}>
              <Text
                style={[
                  screenStyles.dateTileCaption,
                  { color: theme.colors.textTertiary },
                ]}
              >
                DEPARTURE
              </Text>
              <AppIcon name="calendar" size={13} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                screenStyles.dateTileDay,
                { color: theme.colors.textPrimary },
              ]}
            >
              {format(formData.startDate, 'EEE, MMM d')}
            </Text>
            <Text
              style={[
                screenStyles.dateTileYear,
                { color: theme.colors.textTertiary },
              ]}
            >
              {format(formData.startDate, 'yyyy')}
            </Text>
          </Pressable>

          <View style={screenStyles.dateArrowWrap}>
            <AppIcon
              name="arrow-right"
              size={14}
              color={theme.colors.textTertiary}
            />
          </View>

          <Pressable
            onPress={() => {
              haptics.light();
              setShowEndDate(true);
            }}
            style={({ pressed }) => [
              screenStyles.dateTile,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(15,23,42,0.08)',
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={screenStyles.dateTileHeader}>
              <Text
                style={[
                  screenStyles.dateTileCaption,
                  { color: theme.colors.textTertiary },
                ]}
              >
                RETURN
              </Text>
              <AppIcon name="calendar" size={13} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                screenStyles.dateTileDay,
                { color: theme.colors.textPrimary },
              ]}
            >
              {format(formData.endDate, 'EEE, MMM d')}
            </Text>
            <Text
              style={[
                screenStyles.dateTileYear,
                { color: theme.colors.textTertiary },
              ]}
            >
              {format(formData.endDate, 'yyyy')}
            </Text>
          </Pressable>
        </View>

        {Platform.OS !== 'web' && showStartDate && (
          <DateTimePicker
            value={formData.startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDate(false);
              if (selectedDate) handleUpdateField('startDate', selectedDate);
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

      {/* ── CARD 3: FINANCIAL BASELINE & BUDGET ── */}
      <View
        style={[
          screenStyles.sectionCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={screenStyles.sectionHeaderRow}>
          <View
            style={[
              screenStyles.sectionIconBadge,
              { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
            ]}
          >
            <AppIcon name="banknote" size={16} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                screenStyles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Financial Baseline
            </Text>
            <Text
              style={[
                screenStyles.sectionSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Base currency and optional group spending cap
            </Text>
          </View>
        </View>

        {/* Currency Trigger Button (Dedicated Modal) */}
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
              setShowCurrencies(true);
            }}
            style={({ pressed }) => [
              screenStyles.currencyCardBtn,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(15,23,42,0.08)',
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                flex: 1,
              }}
            >
              <View
                style={[
                  screenStyles.currencySymbolBadgeLarge,
                  { backgroundColor: `${theme.colors.primary}15` },
                ]}
              >
                <Text
                  style={[
                    screenStyles.currencySymbolTextLarge,
                    { color: theme.colors.primary },
                  ]}
                >
                  {getCurrencyInfo(formData.baseCurrency).symbol.trim()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    screenStyles.currencyNameTextLarge,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {getCurrencyInfo(formData.baseCurrency).flag
                    ? `${getCurrencyInfo(formData.baseCurrency).flag} `
                    : ''}
                  {getCurrencyInfo(formData.baseCurrency).name}
                </Text>
                <Text
                  style={[
                    screenStyles.currencyCodeSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {formData.baseCurrency} &bull; Primary ledger baseline
                </Text>
              </View>
            </View>
            <View
              style={[
                screenStyles.changeCurrencyPill,
                { backgroundColor: `${theme.colors.primary}10` },
              ]}
            >
              <Text
                style={[
                  screenStyles.changeCurrencyText,
                  { color: theme.colors.primary },
                ]}
              >
                Change
              </Text>
              <AppIcon
                name="chevron-right"
                size={13}
                color={theme.colors.primary}
              />
            </View>
          </Pressable>
        </View>

        {/* Estimated Budget Input */}
        <View style={screenStyles.fieldGroup}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={[
                screenStyles.fieldLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              ESTIMATED TOTAL BUDGET (OPTIONAL)
            </Text>
            {formData.totalBudget ? (
              <Pressable
                onPress={() => {
                  haptics.light();
                  handleUpdateField('totalBudget', '');
                }}
                hitSlop={8}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: theme.colors.danger,
                  }}
                >
                  Clear
                </Text>
              </Pressable>
            ) : null}
          </View>

          <View
            style={[
              screenStyles.budgetInputContainer,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(15,23,42,0.08)',
              },
            ]}
          >
            <View
              style={[
                screenStyles.budgetPrefixBadge,
                { backgroundColor: `${theme.colors.primary}10` },
              ]}
            >
              <Text
                style={[
                  screenStyles.budgetSymbolPrefixLarge,
                  { color: theme.colors.primary },
                ]}
              >
                {getCurrencyInfo(formData.baseCurrency).symbol.trim()}
              </Text>
            </View>
            <TextInput
              style={[
                screenStyles.budgetTextInput,
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

          {/* Quick Add Budget Pills */}
          <View style={screenStyles.quickBudgetRow}>
            {getQuickBudgets(formData.baseCurrency).map((item: any) => (
              <Pressable
                key={item.amount}
                onPress={() => handleAddBudget(item.amount)}
                style={({ pressed }) => [
                  screenStyles.quickBudgetPill,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(15,23,42,0.08)',
                  },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text
                  style={[
                    screenStyles.quickBudgetText,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            style={[
              screenStyles.fieldHelperText,
              { color: theme.colors.textTertiary },
            ]}
          >
            Leave blank to track expenses flexibly without a budget limit.
          </Text>
        </View>
      </View>

      {/* ── CARD 4: SPLITTING PREFERENCES & ACCESS ── */}
      <View
        style={[
          screenStyles.sectionCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={screenStyles.sectionHeaderRow}>
          <View
            style={[
              screenStyles.sectionIconBadge,
              { backgroundColor: 'rgba(168, 85, 247, 0.15)' },
            ]}
          >
            <AppIcon name="users" size={16} color="#9333EA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                screenStyles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Split Method & Access
            </Text>
            <Text
              style={[
                screenStyles.sectionSubtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              Expense allocation rule and co-traveler spending privileges
            </Text>
          </View>
        </View>

        {/* 2x2 Segmented Split Cards */}
        <View style={screenStyles.fieldGroup}>
          <Text
            style={[
              screenStyles.fieldLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            DEFAULT SPLIT METHOD
          </Text>
          <View style={screenStyles.splitGrid2x2}>
            {SPLIT_OPTIONS.map(opt => {
              const isSelected = formData.defaultSplitMethod === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    haptics.light();
                    handleUpdateField('defaultSplitMethod', opt.id);
                  }}
                  style={({ pressed }) => [
                    screenStyles.splitOptionCard,
                    {
                      backgroundColor: isSelected
                        ? `${theme.colors.primary}10`
                        : theme.colors.background,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(15,23,42,0.06)',
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={screenStyles.splitOptionTop}>
                    <View
                      style={[
                        screenStyles.splitIconCircle,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : `${theme.colors.primary}15`,
                        },
                      ]}
                    >
                      <AppIcon
                        name={opt.icon as any}
                        size={14}
                        color={
                          isSelected
                            ? theme.colors.textInverse
                            : theme.colors.primary
                        }
                      />
                    </View>
                    {isSelected && (
                      <View
                        style={[
                          screenStyles.splitCheckmarkPill,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <AppIcon
                          name="check"
                          size={10}
                          color={theme.colors.textInverse}
                        />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      screenStyles.splitOptionTitle,
                      {
                        color: theme.colors.textPrimary,
                        fontWeight: isSelected ? '800' : '700',
                      },
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text
                    style={[
                      screenStyles.splitOptionDesc,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {opt.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Payer Permission Switch */}
        <Pressable
          onPress={() => {
            haptics.light();
            handleUpdateField('allowAnyPayer', !formData.allowAnyPayer);
          }}
          style={[
            screenStyles.permissionCard,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(15,23,42,0.06)',
            },
          ]}
        >
          <View
            style={[
              screenStyles.permissionIconBadge,
              { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
            ]}
          >
            <AppIcon name="credit-card" size={18} color="#10B981" />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text
              style={[
                screenStyles.permissionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Co-Travelers Can Record Expenses
            </Text>
            <Text
              style={[
                screenStyles.permissionSub,
                { color: theme.colors.textTertiary },
              ]}
            >
              When active, all members can log group expenses and settlements.
            </Text>
          </View>
          <View
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
          </View>
        </Pressable>
      </View>

      {/* ── BOTTOM NAVIGATION ACTIONS ── */}
      <View style={screenStyles.bottomNavRow}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            screenStyles.secondaryNavBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(15,23,42,0.08)',
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <AppIcon
            name="arrow-left"
            size={16}
            color={theme.colors.textPrimary}
          />
          <Text
            style={[
              screenStyles.secondaryNavBtnText,
              { color: theme.colors.textPrimary },
            ]}
          >
            Back
          </Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            screenStyles.primaryNavBtn,
            { backgroundColor: theme.colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text
            style={[
              screenStyles.primaryNavBtnText,
              { color: theme.colors.textInverse },
            ]}
          >
            Continue to Members
          </Text>
          <AppIcon
            name="arrow-right"
            size={16}
            color={theme.colors.textInverse}
          />
        </Pressable>
      </View>
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
          Add friends to split bills and synchronize itineraries in real time.
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
                INVITED CREW ({selectedUsers.length})
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
                          isSelected
                            ? theme.colors.textInverse
                            : theme.colors.textSecondary
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
                          isSelected
                            ? theme.colors.textInverse
                            : theme.colors.textSecondary
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

      {/* Navigation Actions */}
      <View style={screenStyles.bottomNavRow}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            screenStyles.secondaryNavBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(15,23,42,0.08)',
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <AppIcon
            name="arrow-left"
            size={16}
            color={theme.colors.textPrimary}
          />
          <Text
            style={[
              screenStyles.secondaryNavBtnText,
              { color: theme.colors.textPrimary },
            ]}
          >
            Back
          </Text>
        </Pressable>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            screenStyles.primaryNavBtn,
            { backgroundColor: theme.colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text
            style={[
              screenStyles.primaryNavBtnText,
              { color: theme.colors.textInverse },
            ]}
          >
            Review & Confirm
          </Text>
          <AppIcon
            name="arrow-right"
            size={16}
            color={theme.colors.textInverse}
          />
        </Pressable>
      </View>
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
          Verify your expedition configuration before initialization.
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
            Trip Title
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
            {format(formData.endDate, 'MMM d, yyyy')} ({durationDays} days)
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
                ? 'Primary destination stop will be generated automatically.'
                : 'Add multi-destination itinerary stops anytime in trip view.'}
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
                : 'You are the trip admin. You can invite friends anytime later.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Launch Triggers */}
      <View style={{ gap: 10, marginTop: 4 }}>
        <Pressable
          onPress={() => handleCreate('active')}
          disabled={isPending || isSubmitting}
          style={({ pressed }) => [
            screenStyles.primaryNavBtn,
            { backgroundColor: theme.colors.primary, paddingVertical: 16 },
            pressed && { opacity: 0.9 },
          ]}
        >
          {isPending || isSubmitting ? (
            <GlobalLoader
              variant="inline"
              size="small"
              color={theme.colors.textInverse}
            />
          ) : (
            <>
              <AppIcon name="zap" size={17} color={theme.colors.textInverse} />
              <Text
                style={[
                  screenStyles.primaryNavBtnText,
                  { color: theme.colors.textInverse, fontSize: 15 },
                ]}
              >
                Launch Active Expedition
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => handleCreate('planning')}
          disabled={isPending || isSubmitting}
          style={({ pressed }) => [
            screenStyles.draftBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(15,23,42,0.08)',
            },
            pressed && { opacity: 0.8 },
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

        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            { alignItems: 'center', paddingVertical: 8 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: theme.colors.textTertiary,
            }}
          >
            Back to Edit Members
          </Text>
        </Pressable>
      </View>
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
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(15,23,42,0.06)',
                },
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
          keyboardShouldPersistTaps="handled"
        >
          {tripsStatus.total !== null &&
            (tripsStatus.isApproaching || tripsStatus.isReached) && (
              <View
                style={[
                  screenStyles.limitWarningBanner,
                  {
                    backgroundColor: tripsStatus.isReached
                      ? `${theme.colors.danger}15`
                      : `${theme.colors.warning}15`,
                    borderColor: tripsStatus.isReached
                      ? `${theme.colors.danger}40`
                      : `${theme.colors.warning}40`,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <AppIcon
                    name="shield"
                    size={14}
                    color={
                      tripsStatus.isReached
                        ? theme.colors.danger
                        : theme.colors.warning
                    }
                  />
                  <Text
                    style={[
                      screenStyles.limitWarningText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {tripsStatus.isReached
                      ? `You have reached your limit of ${tripsStatus.total} trips on ${planName}.`
                      : `${tripsStatus.used}/${tripsStatus.total} trips created on ${planName}.`}
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/(app)/plans' as any)}>
                  <Text
                    style={[
                      screenStyles.limitUpgradeLink,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Upgrade
                  </Text>
                </Pressable>
              </View>
            )}

          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dedicated Currency Picker Modal */}
      <CurrencyPickerModal
        visible={showCurrencies}
        onClose={() => setShowCurrencies(false)}
        selectedCurrency={formData.baseCurrency}
        onSelect={code => handleUpdateField('baseCurrency', code)}
        currencies={currencies}
      />

      {/* Plan Limit Modal */}
      <PlanLimitModal
        visible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        title="Trip Limit Reached"
        limitKey="trips"
        currentPlanName={planName}
        limitValue={limitModalData.limitValue ?? tripsStatus.total ?? 5}
        currentUsage={limitModalData.currentUsage ?? tripsStatus.used}
        message={limitModalData.message}
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },

  limitWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  limitWarningText: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  limitUpgradeLink: {
    fontSize: 12.5,
    fontWeight: '800',
    marginLeft: 12,
  },

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
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 18,
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

  // ─── Bento Section Cards ──────────────────────────────────
  sectionCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    gap: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
      },
    }),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },

  formCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
    gap: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  fieldHelperText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    padding: 0,
  },
  notesBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  notesInput: {
    fontSize: 13,
    fontWeight: '500',
    minHeight: 64,
    textAlignVertical: 'top',
    padding: 0,
  },

  // Dates & Duration
  durationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  durationBannerText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  dateTilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTile: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateTileCaption: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dateTileDay: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dateTileYear: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  dateArrowWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Currency Card Trigger
  currencyCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  currencySymbolBadgeLarge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbolTextLarge: {
    fontSize: 16,
    fontWeight: '900',
  },
  currencyNameTextLarge: {
    fontSize: 14,
    fontWeight: '800',
  },
  currencyCodeSub: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  changeCurrencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeCurrencyText: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Budget
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  budgetPrefixBadge: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetSymbolPrefixLarge: {
    fontSize: 16,
    fontWeight: '900',
  },
  budgetTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  quickBudgetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  quickBudgetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickBudgetText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Split Options 2x2 Grid
  splitGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  splitOptionCard: {
    width: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 4,
  },
  splitOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  splitIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitCheckmarkPill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitOptionTitle: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  splitOptionDesc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },

  // Payer Permission
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  permissionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  permissionSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },

  // ─── Bottom Navigation Row ─────────────────────────────────
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  secondaryNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryNavBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  primaryNavBtn: {
    flex: 1,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  primaryNavBtnText: {
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
        shadowOffset: { width: 0, height: 4 },
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
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBtnText: {
    fontSize: 13.5,
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
        shadowOffset: { width: 0, height: 4 },
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
        shadowOffset: { width: 0, height: 4 },
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
        shadowOffset: { width: 0, height: 4 },
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

  // ─── Dedicated Currency Picker Modal Styles ───────────────
  currencyModalContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
      },
    }),
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  currencyModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  currencyModalSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    padding: 0,
  },
  popularSection: {
    marginBottom: 12,
    gap: 6,
  },
  popularTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  popularScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  popularChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  currencyList: {
    maxHeight: 280,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 4,
  },
  currencyFlagBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyItemName: {
    fontSize: 13.5,
  },
  currencyItemCode: {
    fontSize: 11.5,
    marginTop: 1,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearch: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
