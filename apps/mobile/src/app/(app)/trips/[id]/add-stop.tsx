import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
// app/(app)/trips/[id]/add-stop.tsx
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
  Pressable,
  PressableStateCallbackType,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import Animated, {
  FadeInDown,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useAddStop, useTrip } from '../../../../hooks';
import { useEntitlements } from '../../../../hooks/useEntitlements';
import { PlanLimitModal } from '../../../../components/subscription/PlanLimitModal';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useThemeStore } from '../../../../stores/theme.store';
import { haptics } from '../../../../utils/haptics';
import { showToast } from '../../../../utils/toast';
import { LeafletMap } from '../../../../components/map/LeafletMap';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { locationApi } from '../../../../services/api/location.api';
import {
  COUNTRY_CURRENCY_MAP as DEFAULT_COUNTRY_MAP,
  POPULAR_COUNTRY_CODES,
  getCurrencyInfo,
} from '../../../../constants/countries';

// Safe web pressable type
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================
// Constants
// ============================================================

import { useQuery } from '@tanstack/react-query';

const POPULAR_COUNTRIES = [
  'IN',
  'AE',
  'US',
  'GB',
  'FR',
  'SG',
  'TH',
  'ID',
  'AU',
  'CH',
  'JP',
  'MY',
];

// ============================================================
// Main Screen
// ============================================================

export default function AddStopScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string; backTo?: string }>();
  const tripId = params.id;
  const backTo = params.backTo || `/(app)/trips/${tripId}`;
  const isDarkMode = useThemeStore(s => s.mode) === 'dark';
  const insets = useSafeAreaInsets();

  const { data: trip } = useTrip(tripId);
  const baseTripCurrency =
    trip?.baseCurrency || (trip as any)?.currency || 'INR';

  const { planName, getLimitStatus } = useEntitlements();
  const stopsStatus = getLimitStatus('stopsPerTrip');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalData, setLimitModalData] = useState<{
    message?: string;
    limitValue?: number;
    currentUsage?: number;
  }>({});
  const tripStopsCount = trip?.stops?.length ?? 0;
  const isStopLimitReached =
    stopsStatus.total !== null && tripStopsCount >= stopsStatus.total;

  const { mutate: addStop, isPending } = useAddStop();

  const { data: countriesResponse } = useQuery({
    queryKey: ['countries'],
    queryFn: locationApi.getSupportedCountries,
  });

  const COUNTRY_CURRENCY_MAP = useMemo(() => {
    const raw = countriesResponse?.data?.data || [];
    const map: Record<
      string,
      { currency: string; emoji: string; name: string }
    > = { ...DEFAULT_COUNTRY_MAP };
    raw.forEach((c: any) => {
      map[c.code] = { currency: c.currency, emoji: c.emoji, name: c.name };
    });
    return map;
  }, [countriesResponse]);

  const isWebDesktop = Platform.OS === 'web' && width > 768;

  // Form state
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [currency, setCurrency] = useState(baseTripCurrency);
  const [hasInitializedCurrency, setHasInitializedCurrency] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('1.0');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  );
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (trip && !hasInitializedCurrency) {
      setCurrency(baseTripCurrency);
      setHasInitializedCurrency(true);
    }
  }, [trip, baseTripCurrency, hasInitializedCurrency]);

  // UI State
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showCountries, setShowCountries] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [tempLocation, setTempLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isGeocodingPin, setIsGeocodingPin] = useState(false);

  // Location search state
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Focus States
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isCityFocused, setIsCityFocused] = useState(false);
  const [isCoverImageFocused, setIsCoverImageFocused] = useState(false);
  const [isRateFocused, setIsRateFocused] = useState(false);
  const [isBudgetFocused, setIsBudgetFocused] = useState(false);
  const [isNotesFocused, setIsNotesFocused] = useState(false);
  const [isLocationSearchFocused, setIsLocationSearchFocused] = useState(false);

  // Physics
  const submitBtnScale = useSharedValue(1);

  // Derived state
  const selectedCountry = COUNTRY_CURRENCY_MAP[country];
  const isSameCurrency = currency === baseTripCurrency;

  // Location search handler
  const handleLocationSearch = (text: string) => {
    setLocationQuery(text);
    if (locationSearchTimeout.current)
      clearTimeout(locationSearchTimeout.current);
    if (!text.trim()) {
      setLocationResults([]);
      return;
    }
    locationSearchTimeout.current = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = (await locationApi.searchLocations(text.trim())) as any;
        setLocationResults(res?.data?.results || []);
      } catch {
        setLocationResults([]);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);
  };

  const handleLocationResultSelect = (result: any) => {
    haptics.light();
    setName(result.name || result.displayName || name);
    setCity(result.city || result.district || '');
    if (result.countryCode) {
      const mapped = COUNTRY_CURRENCY_MAP[result.countryCode];
      if (mapped) {
        setCountry(result.countryCode);
        setCurrency(mapped.currency);
        if (mapped.currency === baseTripCurrency) setExchangeRate('1.0');
      }
    }
    if (result.lat && result.lng) {
      setLocation({ latitude: result.lat, longitude: result.lng });
    }
    setLocationQuery('');
    setLocationResults([]);
  };

  // Handlers
  const handleCountrySelect = (code: string) => {
    haptics.light();
    setCountry(code);
    const countryData = COUNTRY_CURRENCY_MAP[code];
    if (countryData) {
      setCurrency(countryData.currency);
      if (countryData.currency === baseTripCurrency) {
        setExchangeRate('1.0');
      }
    }
    setShowCountries(false);
  };

  const handleSubmit = () => {
    haptics.medium();
    if (!name.trim()) {
      showToast.warning('Missing Name', 'Please enter a stop name.');
      return;
    }
    if (!currency) {
      showToast.warning(
        'Missing Currency',
        'Please select a currency for this stop.',
      );
      return;
    }

    const stopData = {
      name: [city, name].filter(Boolean).join(', ') || name.trim(),
      coverImage: coverImage.trim() || undefined,
      emoji: selectedCountry?.emoji || '📍',
      country: country || undefined,
      currency: currency,
      currentExchangeRate: parseFloat(exchangeRate) || 1.0,
      budget: budget ? parseFloat(budget) : undefined,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      notes: notes.trim() || undefined,
      order: 99,
      location: location
        ? { lat: location.latitude, lng: location.longitude }
        : undefined,
    };

    addStop(
      { tripId, data: stopData },
      {
        onSuccess: () => {
          haptics.success();
          router.back();
        },
        onError: (error: any) => {
          if (
            error?.code === 'PLAN_LIMIT_REACHED' ||
            error?.message?.includes('PLAN_LIMIT_REACHED') ||
            error?.statusCode === 403
          ) {
            setLimitModalData({
              message:
                error.message ||
                'You have reached your plan limit for stops per trip. Upgrade to add more stops.',
              limitValue: error?.details?.maxAllowed ?? stopsStatus.total ?? 10,
              currentUsage: error?.details?.currentUsage ?? tripStopsCount,
            });
            setShowLimitModal(true);
          } else {
            showToast.fromError(error, 'Failed to add stop');
          }
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Global Background */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
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
          Add Stop
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentInner,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[styles.formWrapper, isWebDesktop && styles.webDesktopForm]}
        >
          {stopsStatus.total !== null &&
            (isStopLimitReached || stopsStatus.isApproaching) && (
              <View
                style={[
                  styles.limitWarningBanner,
                  {
                    backgroundColor: isStopLimitReached
                      ? `${theme.colors.danger}15`
                      : `${theme.colors.warning}15`,
                    borderColor: isStopLimitReached
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
                      isStopLimitReached
                        ? theme.colors.danger
                        : theme.colors.warning
                    }
                  />
                  <Text
                    style={[
                      styles.limitWarningText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {isStopLimitReached
                      ? `You have reached your limit of ${stopsStatus.total} stops per trip on ${planName}.`
                      : `${tripStopsCount}/${stopsStatus.total} stops added on this trip (${planName}).`}
                  </Text>
                </View>
                <Pressable onPress={() => router.push('/(app)/plans' as any)}>
                  <Text
                    style={[
                      styles.limitUpgradeLink,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Upgrade
                  </Text>
                </Pressable>
              </View>
            )}

          {/* Section 1: Basic Info */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500).springify()}
          >
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Location Details
            </Text>
            <GlassCard
              style={styles.glassCard}
              intensity={theme.isDark ? 15 : 8}
            >
              <View style={styles.cardInner}>
                {/* Live Location Search */}
                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Search Location{' '}
                    <Text
                      style={[
                        styles.optionalText,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      (optional)
                    </Text>
                  </Text>
                  <View
                    style={[
                      styles.input,
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderColor: isLocationSearchFocused
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                        paddingVertical: 0,
                      },
                      isLocationSearchFocused && styles.inputFocused,
                    ]}
                  >
                    <AppIcon
                      name="search"
                      size={15}
                      color={theme.colors.textTertiary}
                      style={{ marginLeft: 4, marginRight: 8 }}
                    />
                    <TextInput
                      style={[
                        {
                          flex: 1,
                          color: theme.colors.textPrimary,
                          height: 44,
                        },
                      ]}
                      placeholder="Search Dubai, Goa, Paris…"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={locationQuery}
                      onChangeText={handleLocationSearch}
                      onFocus={() => setIsLocationSearchFocused(true)}
                      onBlur={() => setIsLocationSearchFocused(false)}
                    />
                    {isSearchingLocation && (
                      <GlobalLoader
                        variant="inline"
                        size="small"
                        color={theme.colors.primary}
                        style={{ marginRight: 8 }}
                      />
                    )}
                  </View>
                  {locationResults.length > 0 && (
                    <View
                      style={[
                        styles.locationResultsList,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.borderLight,
                        },
                      ]}
                    >
                      {locationResults.slice(0, 5).map((r: any, i: number) => (
                        <Pressable
                          key={`loc-${i}`}
                          onPress={() => handleLocationResultSelect(r)}
                          style={({ hovered }: WebPressableState) => [
                            styles.locationResultItem,
                            { borderBottomColor: theme.colors.borderLight },
                            i === locationResults.length - 1 && {
                              borderBottomWidth: 0,
                            },
                            Platform.OS === 'web' &&
                              hovered &&
                              ({
                                backgroundColor: theme.colors.primaryBg,
                              } as any),
                          ]}
                        >
                          <AppIcon
                            name="map-pin"
                            size={13}
                            color={theme.colors.primary}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: theme.colors.textPrimary,
                                fontSize: 13,
                                fontWeight: '600',
                              }}
                              numberOfLines={1}
                            >
                              {r.name || r.displayName}
                            </Text>
                            {(r.city || r.country) && (
                              <Text
                                style={{
                                  color: theme.colors.textSecondary,
                                  fontSize: 11,
                                }}
                                numberOfLines={1}
                              >
                                {[r.city, r.country].filter(Boolean).join(', ')}
                              </Text>
                            )}
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Stop Name{' '}
                    <Text
                      style={[
                        styles.requiredAsterisk,
                        { color: theme.colors.danger },
                      ]}
                    >
                      *
                    </Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.textPrimary,
                        borderColor: isNameFocused
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      isNameFocused && styles.inputFocused,
                    ]}
                    placeholder="e.g., Downtown Dubai, Eiffel Tower"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => {
                      haptics.light();
                      setIsNameFocused(true);
                    }}
                    onBlur={() => setIsNameFocused(false)}
                    maxLength={100}
                    autoFocus
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    City / Area{' '}
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
                      {
                        color: theme.colors.textPrimary,
                        borderColor: isCityFocused
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      isCityFocused && styles.inputFocused,
                    ]}
                    placeholder="e.g., Marina District, South Goa"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={city}
                    onChangeText={setCity}
                    onFocus={() => {
                      haptics.light();
                      setIsCityFocused(true);
                    }}
                    onBlur={() => setIsCityFocused(false)}
                    maxLength={100}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Cover Image URL{' '}
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
                      {
                        color: theme.colors.textPrimary,
                        borderColor: isCoverImageFocused
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      isCoverImageFocused && styles.inputFocused,
                    ]}
                    placeholder="https://example.com/image.jpg"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={coverImage}
                    onChangeText={setCoverImage}
                    onFocus={() => {
                      haptics.light();
                      setIsCoverImageFocused(true);
                    }}
                    onBlur={() => setIsCoverImageFocused(false)}
                    keyboardType="url"
                  />
                </View>

                <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
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
                        ({ backgroundColor: theme.colors.primaryBg } as any),
                    ]}
                    onPress={() => {
                      haptics.light();
                      setTempLocation(location);
                      setShowMapPicker(true);
                    }}
                  >
                    <AppIcon
                      name="map-pin"
                      size={16}
                      color={
                        isGeocodingPin
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.locationBtnText,
                        {
                          color: location
                            ? theme.colors.textPrimary
                            : theme.colors.textTertiary,
                        },
                      ]}
                    >
                      {isGeocodingPin
                        ? 'Getting location details…'
                        : location
                          ? `📍 Selected (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
                          : 'Tap to pick location on map'}
                    </Text>
                    {isGeocodingPin ? (
                      <GlobalLoader
                        variant="inline"
                        size="small"
                        color={theme.colors.primary}
                      />
                    ) : (
                      <AppIcon
                        name="chevron-right"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                    )}
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Section 2: Country & Currency */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
          >
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Region & Money
            </Text>
            <GlassCard
              style={styles.glassCard}
              intensity={theme.isDark ? 15 : 8}
            >
              <View style={styles.cardInner}>
                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Country
                  </Text>
                  <Pressable
                    style={({ hovered }: WebPressableState) => [
                      styles.countrySelector,
                      {
                        borderColor: theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      Platform.OS === 'web' &&
                        hovered &&
                        ({ backgroundColor: theme.colors.primaryBg } as any),
                    ]}
                    onPress={() => {
                      haptics.light();
                      setShowCountries(!showCountries);
                    }}
                  >
                    {selectedCountry ? (
                      <View style={styles.countrySelected}>
                        <Text style={styles.countryEmoji}>
                          {selectedCountry.emoji}
                        </Text>
                        <Text
                          style={[
                            styles.countryName,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {selectedCountry.name}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.countryPlaceholder,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Select a country
                      </Text>
                    )}
                    <AppIcon
                      name={showCountries ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={theme.colors.textTertiary}
                    />
                  </Pressable>

                  {showCountries && (
                    <View
                      style={[
                        styles.countryListWrap,
                        {
                          borderColor: theme.colors.borderLight,
                          backgroundColor: theme.colors.surface,
                        },
                      ]}
                    >
                      <TextInput
                        style={[
                          styles.countrySearch,
                          {
                            color: theme.colors.textPrimary,
                            borderBottomColor: theme.colors.borderLight,
                          },
                        ]}
                        placeholder="Search countries..."
                        placeholderTextColor={theme.colors.textTertiary}
                        value={searchCountry}
                        onChangeText={setSearchCountry}
                      />

                      {!searchCountry && (
                        <View style={styles.popularSection}>
                          <Text
                            style={[
                              styles.popularTitle,
                              { color: theme.colors.textTertiary },
                            ]}
                          >
                            Popular Destinations
                          </Text>
                          <View style={styles.popularGrid}>
                            {POPULAR_COUNTRIES.map(code => {
                              const c = COUNTRY_CURRENCY_MAP[code];
                              if (!c) return null;
                              const isActive = country === code;
                              return (
                                <Pressable
                                  key={code}
                                  style={({ hovered }: WebPressableState) => [
                                    styles.popularPill,
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
                                        borderColor: theme.colors.border,
                                      } as any),
                                  ]}
                                  onPress={() => handleCountrySelect(code)}
                                >
                                  <Text style={styles.popularPillEmoji}>
                                    {c.emoji}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.popularPillText,
                                      {
                                        color: isActive
                                          ? '#FFF'
                                          : theme.colors.textSecondary,
                                      },
                                    ]}
                                  >
                                    {c.name}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      <ScrollView
                        style={styles.allCountriesList}
                        nestedScrollEnabled
                      >
                        {Object.entries(COUNTRY_CURRENCY_MAP)
                          .filter(
                            ([, c]) =>
                              !searchCountry ||
                              c.name
                                .toLowerCase()
                                .includes(searchCountry.toLowerCase()),
                          )
                          .map(([code, c]) => {
                            const isActive = country === code;
                            return (
                              <Pressable
                                key={code}
                                style={({ hovered }: WebPressableState) => [
                                  styles.countryOption,
                                  {
                                    borderBottomColor: theme.colors.borderLight,
                                  },
                                  isActive && [
                                    styles.countryOptionActive,
                                    { backgroundColor: theme.colors.primaryBg },
                                  ],
                                  Platform.OS === 'web' &&
                                    hovered &&
                                    !isActive &&
                                    ({
                                      backgroundColor:
                                        theme.colors.overlayLight,
                                    } as any),
                                ]}
                                onPress={() => handleCountrySelect(code)}
                              >
                                <Text style={styles.countryOptionEmoji}>
                                  {c.emoji}
                                </Text>
                                <View style={styles.countryOptionInfo}>
                                  <Text
                                    style={[
                                      styles.countryOptionName,
                                      {
                                        color: isActive
                                          ? theme.colors.primary
                                          : theme.colors.textPrimary,
                                      },
                                      isActive &&
                                        styles.countryOptionNameActive,
                                    ]}
                                  >
                                    {c.name}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.countryOptionCurrency,
                                      { color: theme.colors.textTertiary },
                                    ]}
                                  >
                                    {c.currency}{' '}
                                    {c.currency !== baseTripCurrency
                                      ? '• Foreign'
                                      : '• Trip Base'}
                                  </Text>
                                </View>
                                {isActive && (
                                  <AppIcon
                                    name="check"
                                    size={16}
                                    color={theme.colors.primary}
                                  />
                                )}
                              </Pressable>
                            );
                          })}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.fieldRow}>
                  <View
                    style={[styles.fieldGroup, { flex: 1, marginBottom: 0 }]}
                  >
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Currency
                    </Text>
                    <View
                      style={[
                        styles.currencyDisplay,
                        { backgroundColor: theme.colors.surface },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currencyDisplayText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {currency}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[styles.fieldGroup, { flex: 1, marginBottom: 0 }]}
                  >
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Exch. Rate{' '}
                      {isSameCurrency ? (
                        <Text
                          style={[
                            styles.autoText,
                            { color: theme.colors.primary },
                          ]}
                        >
                          (Auto)
                        </Text>
                      ) : (
                        <Text
                          style={[
                            styles.requiredAsterisk,
                            { color: theme.colors.danger },
                          ]}
                        >
                          *
                        </Text>
                      )}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: isSameCurrency
                            ? theme.colors.textTertiary
                            : theme.colors.textPrimary,
                          borderColor:
                            isRateFocused && !isSameCurrency
                              ? theme.colors.primary
                              : theme.colors.borderLight,
                          backgroundColor: isSameCurrency
                            ? theme.colors.overlayLight
                            : theme.colors.surface,
                        },
                        isSameCurrency && styles.inputDisabled,
                        isRateFocused && !isSameCurrency && styles.inputFocused,
                      ]}
                      placeholder="1.0"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={isSameCurrency ? '1.0' : exchangeRate}
                      onChangeText={setExchangeRate}
                      onFocus={() => {
                        haptics.light();
                        setIsRateFocused(true);
                      }}
                      onBlur={() => setIsRateFocused(false)}
                      keyboardType="decimal-pad"
                      editable={!isSameCurrency}
                    />
                    {!isSameCurrency ? (
                      <Text
                        style={[
                          styles.fieldHint,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        1 {currency} = ? {baseTripCurrency}
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.fieldHint,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Same as trip base ({baseTripCurrency})
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Section 3: Planning */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500).springify()}
          >
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Planning
            </Text>
            <GlassCard
              style={styles.glassCard}
              intensity={theme.isDark ? 15 : 8}
            >
              <View style={styles.cardInner}>
                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Budget{' '}
                    <Text
                      style={[
                        styles.optionalText,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      (optional)
                    </Text>
                  </Text>
                  <View
                    style={[
                      styles.budgetInputRow,
                      {
                        borderColor: isBudgetFocused
                          ? theme.colors.primary
                          : theme.colors.borderLight,
                        backgroundColor: theme.colors.surface,
                      },
                      isBudgetFocused && styles.inputFocused,
                    ]}
                  >
                    <Text
                      style={[
                        styles.budgetCurrency,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      {getCurrencyInfo(currency).symbol.trim() || currency}
                    </Text>
                    <TextInput
                      style={[
                        styles.budgetInput,
                        { color: theme.colors.textPrimary },
                      ]}
                      placeholder="0"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={budget}
                      onChangeText={setBudget}
                      onFocus={() => {
                        haptics.light();
                        setIsBudgetFocused(true);
                      }}
                      onBlur={() => setIsBudgetFocused(false)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View
                    style={[styles.fieldGroup, { flex: 1, marginBottom: 0 }]}
                  >
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Arrival
                    </Text>
                    <Pressable
                      style={({ hovered }: WebPressableState) => [
                        styles.dateButton,
                        {
                          borderColor: theme.colors.borderLight,
                          backgroundColor: theme.colors.surface,
                        },
                        Platform.OS === 'web' &&
                          hovered &&
                          ({ backgroundColor: theme.colors.primaryBg } as any),
                      ]}
                      onPress={() => {
                        haptics.light();
                        setShowStartDate(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {format(startDate, 'MMM d, yyyy')}
                      </Text>
                      <AppIcon
                        name="calendar"
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                    {showStartDate && (
                      <DateTimePicker
                        value={startDate}
                        mode="date"
                        onChange={(_, date) => {
                          setShowStartDate(false);
                          if (date) {
                            setStartDate(date);
                            if (date > endDate) setEndDate(date);
                          }
                        }}
                      />
                    )}
                  </View>

                  <View
                    style={[styles.fieldGroup, { flex: 1, marginBottom: 0 }]}
                  >
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Departure
                    </Text>
                    <Pressable
                      style={({ hovered }: WebPressableState) => [
                        styles.dateButton,
                        {
                          borderColor: theme.colors.borderLight,
                          backgroundColor: theme.colors.surface,
                        },
                        Platform.OS === 'web' &&
                          hovered &&
                          ({ backgroundColor: theme.colors.primaryBg } as any),
                      ]}
                      onPress={() => {
                        haptics.light();
                        setShowEndDate(true);
                      }}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {format(endDate, 'MMM d, yyyy')}
                      </Text>
                      <AppIcon
                        name="calendar"
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                    {showEndDate && (
                      <DateTimePicker
                        value={endDate}
                        mode="date"
                        minimumDate={startDate}
                        onChange={(_, date) => {
                          setShowEndDate(false);
                          if (date) setEndDate(date);
                        }}
                      />
                    )}
                  </View>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Section 4: Notes */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500).springify()}
          >
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Extra Details
            </Text>
            <GlassCard
              style={styles.glassCard}
              intensity={theme.isDark ? 15 : 8}
            >
              <View style={styles.cardInner}>
                <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
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
                    placeholder="Add hotel confirmation numbers, flight details..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={notes}
                    onChangeText={setNotes}
                    onFocus={() => {
                      haptics.light();
                      setIsNotesFocused(true);
                    }}
                    onBlur={() => setIsNotesFocused(false)}
                    maxLength={1000}
                    multiline
                  />
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom Bar Actions */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 16,
            borderTopColor: theme.colors.borderLight,
            backgroundColor: 'transparent',
          },
        ]}
      >
        <View
          style={[styles.bottomButtons, isWebDesktop && styles.webDesktopForm]}
        >
          <AnimatedPressable
            style={[
              styles.submitBtnWrap,
              { transform: [{ scale: submitBtnScale }] },
              isPending && { opacity: 0.7 },
            ]}
            onPressIn={() => (submitBtnScale.value = withSpring(0.96))}
            onPressOut={() => (submitBtnScale.value = withSpring(1))}
            onPress={handleSubmit}
            disabled={isPending}
          >
            <LinearGradient
              colors={[
                theme.colors.success,
                theme.colors.successBg || '#059669',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnGradient}
            >
              {isPending ? (
                <GlobalLoader variant="inline" color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>📍 Add Stop</Text>
              )}
            </LinearGradient>
          </AnimatedPressable>
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
                backgroundColor: theme.colors.surface,
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
              onPress={async () => {
                if (tempLocation) {
                  setLocation(tempLocation);
                  setShowMapPicker(false);
                  // Auto-geocode the pin to fill stop details
                  setIsGeocodingPin(true);
                  try {
                    const geoRes = (await locationApi.getLocationInfo(
                      tempLocation.latitude,
                      tempLocation.longitude,
                    )) as any;
                    const place = geoRes?.data;
                    if (place) {
                      if (!name.trim() && place.city) setName(place.city);
                      if (!city.trim())
                        setCity(place.city || place.state || '');
                      if (place.countryCode) {
                        setCountry(place.countryCode);
                        if (place.currency) {
                          setCurrency(place.currency);
                          if (place.currency === 'INR') setExchangeRate('1.0');
                        }
                      }
                    }
                  } catch {
                    /* silent fail */
                  } finally {
                    setIsGeocodingPin(false);
                  }
                } else {
                  setShowMapPicker(false);
                }
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
              latitude: location?.latitude || 20.5937,
              longitude: location?.longitude || 78.9629,
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
            darkMode={isDarkMode}
          />
        </View>
      </Modal>

      <PlanLimitModal
        visible={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        title="Stop Limit Reached"
        limitKey="stopsPerTrip"
        currentPlanName={planName}
        limitValue={limitModalData.limitValue ?? stopsStatus.total ?? 10}
        currentUsage={limitModalData.currentUsage ?? tripStopsCount}
        message={limitModalData.message}
      />
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

        limitWarningBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 14,
          borderWidth: 1,
          marginBottom: 16,
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

        content: { flex: 1 },
        contentInner: { paddingHorizontal: 20, paddingTop: 24 },

        // Sections & Glass Cards
        sectionLabel: {
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: 12,
          marginLeft: 4,
        },
        glassCard: {
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
          marginBottom: 32,
        },
        cardInner: { padding: 20 },

        // Fields
        fieldGroup: { marginBottom: 20 },
        fieldRow: { flexDirection: 'row', gap: 12 },
        fieldLabel: {
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 8,
          letterSpacing: 0.5,
        },
        requiredAsterisk: { fontWeight: '700' },
        optionalText: { fontWeight: '500' },
        autoText: { fontWeight: '600' },
        fieldHint: { fontSize: 11, fontWeight: '600', marginTop: 6 },

        // Inputs
        input: {
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 14,
          fontWeight: '500',
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
        } as any,
        inputFocused: {
          borderColor: theme.colors.primary,
          ...Platform.select({
            web: { boxShadow: `0 0 0 4px ${theme.colors.primary}25` } as any,
          }),
        },
        inputDisabled: { borderColor: 'transparent', opacity: 0.7 },
        textArea: { height: 100, textAlignVertical: 'top', paddingTop: 16 },

        // Location search results
        locationResultsList: {
          borderWidth: 1,
          borderTopWidth: 0,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          marginTop: -8,
          overflow: 'hidden',
        },
        locationResultItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
        },

        // Budget Input
        budgetInputRow: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
        },
        budgetCurrency: { fontSize: 18, fontWeight: '800', marginRight: 12 },
        budgetInput: {
          flex: 1,
          fontSize: 16,
          fontWeight: '800',
          paddingVertical: 14,
          backgroundColor: 'transparent',
          borderWidth: 0,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
        } as any,

        // Dates
        dateButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        dateText: { fontSize: 13, fontWeight: '600' },

        // Location Button
        locationBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        locationBtnText: { fontSize: 13, fontWeight: '500', flex: 1 },

        // Country Selector
        countrySelector: {
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        countrySelected: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        countryEmoji: { fontSize: 20 },
        countryName: { fontSize: 14, fontWeight: '700' },
        countryPlaceholder: { fontSize: 14, fontWeight: '500' },

        countryListWrap: {
          borderWidth: 1,
          borderRadius: 16,
          marginTop: 8,
          overflow: 'hidden',
        },
        countrySearch: {
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          fontSize: 13,
          fontWeight: '500',
          backgroundColor: 'transparent',
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
        } as any,

        popularSection: {
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
        },
        popularTitle: {
          fontSize: 10,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        },
        popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        popularPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 16,
          borderWidth: 1,
        },
        popularPillEmoji: { fontSize: 16 },
        popularPillText: { fontSize: 12, fontWeight: '600' },

        allCountriesList: { maxHeight: 250 },
        countryOption: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          gap: 12,
        },
        countryOptionActive: {},
        countryOptionEmoji: { fontSize: 20 },
        countryOptionInfo: { flex: 1 },
        countryOptionName: { fontSize: 14, fontWeight: '700' },
        countryOptionNameActive: { fontWeight: '800' },
        countryOptionCurrency: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },

        // Currency Readonly
        currencyDisplay: {
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          alignItems: 'center',
          justifyContent: 'center',
        },
        currencyDisplayText: { fontSize: 14, fontWeight: '800' },

        // Bottom Bar
        bottomBar: {
          borderTopWidth: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
        },
        bottomButtons: { width: '100%' },
        submitBtnWrap: { borderRadius: 16, overflow: 'hidden' },
        submitBtnGradient: {
          height: 56,
          alignItems: 'center',
          justifyContent: 'center',
        },
        submitBtnText: {
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
          paddingHorizontal: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
        },
        mapModalTitle: { fontSize: 16, fontWeight: '700' },
        mapModalBtn: { padding: 8 },
        mapModalBtnText: { fontSize: 16, fontWeight: '600' },
        mapModalBtnDone: { fontWeight: '700' },
        mapInstructionBar: {
          paddingVertical: 10,
          paddingHorizontal: 16,
          alignItems: 'center',
        },
        mapInstructionText: { fontSize: 13, fontWeight: '600' },
        mapModalMap: { flex: 1 },
      }),
    [theme],
  );
};
