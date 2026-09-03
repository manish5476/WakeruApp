// app/(app)/trips/[id]/map.tsx
import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  TextInput,
  Alert,
  Pressable,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  Layout,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import {
  LeafletMap,
  LeafletMapRef,
} from '../../../../components/map/LeafletMap';
import { useTheme } from '../../../../providers/ThemeProvider';
import {
  useTrip,
  useTripExpenses,
  useDeleteExpensePermanent,
} from '../../../../hooks';
import { useAuthStore } from '../../../../stores/auth.store';
import { haptics } from '../../../../utils/haptics';
import { format, parseISO } from 'date-fns';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { Typography } from '../../../../components/ui/Typography';
import { ProgressBar } from '../../../../components/ui/ProgressBar';
import { Avatar } from '../../../../components/ui/Avatar';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { InteractiveWrapper } from '../../../../components/ui/InteractiveWrapper';
import AppIcon from '../../../../components/common/AppIcon';
import type { Theme } from '../../../../theme';

function getCategoryColor(theme: Theme, category: string): string {
  switch (category?.toLowerCase()) {
    case 'food':
      return '#F59E0B';
    case 'stay':
      return '#8B5CF6';
    case 'transport':
      return '#3B82F6';
    case 'activity':
      return '#10B981';
    case 'shopping':
      return '#EC4899';
    case 'health':
      return '#EF4444';
    default:
      return '#64748B';
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  food: 'utensils',
  stay: 'hotel',
  transport: 'car',
  activity: 'compass',
  shopping: 'shopping-bag',
  health: 'heart-pulse',
  other: 'file-text',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📌',
};

// ============================================================
// MAIN SCREEN
// ============================================================

export default function TripMapScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useStyles();
  const { width, height } = useWindowDimensions();

  const isWebDesktop = Platform.OS === 'web' && width > 1024;
  const isWebTablet = Platform.OS === 'web' && width > 768 && width <= 1024;

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip } = useTrip(id);
  const { data: expensesData } = useTripExpenses(id);
  const { mutate: deleteExpense } = useDeleteExpensePermanent();
  const user = useAuthStore(state => state.user);
  const expenses = expensesData?.expenses || [];
  const mapRef = useRef<LeafletMapRef>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null,
  );

  // Bottom Sheet Gesture Logic (Mobile Only)
  const translateY = useSharedValue(0);
  const contextY = useSharedValue(0);
  const MAX_TRANSLATE_Y = -height * 0.45;

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          contextY.value = translateY.value;
        })
        .onUpdate(event => {
          translateY.value = Math.max(
            MAX_TRANSLATE_Y,
            Math.min(0, contextY.value + event.translationY),
          );
        })
        .onEnd(event => {
          const SPRING_CONFIG = { damping: 24, stiffness: 250, mass: 0.8 };
          if (event.velocityY < -500 || event.translationY < -50) {
            translateY.value = withSpring(MAX_TRANSLATE_Y, SPRING_CONFIG);
          } else if (event.velocityY > 500 || event.translationY > 50) {
            translateY.value = withSpring(0, SPRING_CONFIG);
          } else {
            if (Math.abs(translateY.value) > Math.abs(MAX_TRANSLATE_Y / 2)) {
              translateY.value = withSpring(MAX_TRANSLATE_Y, SPRING_CONFIG);
            } else {
              translateY.value = withSpring(0, SPRING_CONFIG);
            }
          }
        }),
    [MAX_TRANSLATE_Y],
  );

  const animatedPanelStyle = useAnimatedStyle(() => {
    if (isWebDesktop || isWebTablet) return {};
    return {
      transform: [{ translateY: translateY.value }],
      height: height * 0.9 + insets.bottom,
      top: height * 0.55,
    };
  });

  // Derived Data
  const stops = trip?.stops || [];
  const stopsWithLocation = useMemo(
    () => stops.filter((s: any) => s.location?.lat && s.location?.lng),
    [stops],
  );

  const expensesWithMapData = useMemo(
    () =>
      expenses
        .map((e: any) => {
          const stop = stops.find((s: any) => s._id === e.stopId);
          const lat = e.location?.latitude || stop?.location?.lat;
          const lng = e.location?.longitude || stop?.location?.lng;
          return {
            ...e,
            mapLat: lat,
            mapLng: lng,
            isPrecise: !!e.location?.latitude,
            stopName: stop?.name || 'Main Stop',
          };
        })
        .filter((e: any) => e.mapLat && e.mapLng),
    [expenses, stops],
  );

  // Insights
  const totalSpent = useMemo(
    () =>
      expenses.reduce((acc: number, e: any) => acc + (e.amountBase || 0), 0),
    [expenses],
  );
  const budget = trip?.totalBudget || 0;
  const budgetProgress =
    budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const categoriesUsed = useMemo(
    () =>
      Array.from(new Set(expenses.map((e: any) => e.category).filter(Boolean))),
    [expenses],
  );

  // Timeline Days
  const timelineDays = useMemo(() => {
    const days: Record<string, any[]> = {};
    expenses.forEach((e: any) => {
      if (!e.date) return;
      const dateStr = format(new Date(e.date), 'yyyy-MM-dd');
      if (!days[dateStr]) days[dateStr] = [];
      days[dateStr].push(e);
    });
    return Object.keys(days)
      .sort()
      .map(d => ({
        date: d,
        expenses: days[d],
        totalAmount: days[d].reduce((sum, e) => sum + (e.amountBase || 0), 0),
      }));
  }, [expenses]);

  // Map Markers
  const leafletStopMarkers = useMemo(
    () =>
      stopsWithLocation.map((stop: any) => ({
        id: stop._id,
        latitude: stop.location.lat,
        longitude: stop.location.lng,
        name: stop.name,
        subtitle: stop.totalSpentBase
          ? `₹${stop.totalSpentBase.toLocaleString()}`
          : '',
        emoji: stop.emoji || '📍',
        type: 'stop' as const,
      })),
    [stopsWithLocation],
  );

  const leafletExpenseMarkers = useMemo(
    () =>
      expensesWithMapData.map((exp: any) => ({
        id: `exp-${exp._id}`,
        latitude: exp.mapLat,
        longitude: exp.mapLng,
        title: exp.title,
        type: 'expense' as const,
        color: getCategoryColor(theme, exp.category),
        amount: exp.amountBase,
        category: exp.category,
        paidByName: exp.paidByName,
        emoji: CATEGORY_EMOJIS[exp.category] || '📌',
        isHighlighted: selectedExpenseId === exp._id,
      })),
    [expensesWithMapData, theme, selectedExpenseId],
  );

  const allLeafletMarkers = useMemo(
    () => [...leafletStopMarkers, ...leafletExpenseMarkers],
    [leafletStopMarkers, leafletExpenseMarkers],
  );
  const polylineCoords = useMemo(
    () =>
      stopsWithLocation.map((s: any) => ({
        latitude: s.location.lat,
        longitude: s.location.lng,
      })),
    [stopsWithLocation],
  );

  const initialRegion = useMemo(() => {
    const allLats = [
      ...stopsWithLocation.map((s: any) => s.location.lat),
      ...leafletExpenseMarkers.map(e => e.latitude),
    ];
    const allLngs = [
      ...stopsWithLocation.map((s: any) => s.location.lng),
      ...leafletExpenseMarkers.map(e => e.longitude),
    ];

    if (allLats.length === 0)
      return {
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 30,
        longitudeDelta: 30,
      };

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
    };
  }, [stopsWithLocation, leafletExpenseMarkers]);

  // Filters
  const filteredExpenses = useMemo(() => {
    return expensesWithMapData.filter((e: any) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory
        ? e.category === selectedCategory
        : true;
      const matchesDay =
        selectedDay && e.date
          ? format(new Date(e.date), 'yyyy-MM-dd') === selectedDay
          : true;
      return matchesSearch && matchesCat && matchesDay;
    });
  }, [expensesWithMapData, searchQuery, selectedCategory, selectedDay]);

  const handleExpensePress = (exp: any) => {
    haptics.light();
    setSelectedExpenseId(exp._id);
    if (exp.mapLat && exp.mapLng && mapRef.current) {
      mapRef.current.flyTo({ latitude: exp.mapLat, longitude: exp.mapLng }, 15);
      mapRef.current.selectMarker(`exp-${exp._id}`);
    }
  };

  const handleRecenter = () => {
    haptics.selection();
    mapRef.current?.fitToMarkers(0.2);
  };

  const handleDelete = (expId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense(expId),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      <View
        style={[
          styles.mainLayout,
          (isWebDesktop || isWebTablet) && styles.webMainLayout,
        ]}
      >
        {/* ── MAP CONTAINER (SEPARATE FLOATING CARD) ── */}
        <View
          style={[
            styles.mapContainer,
            isWebDesktop
              ? styles.webMapContainer
              : isWebTablet
                ? styles.tabletMapContainer
                : null,
          ]}
        >
          <LeafletMap
            ref={mapRef}
            style={styles.map}
            markers={allLeafletMarkers}
            polylines={polylineCoords}
            initialRegion={initialRegion}
            autoFitOnUpdate={false}
            showControls={false}
            controls={{
              showZoom: true,
              showFullscreen: false,
              showLocate: true,
              showScale: true,
              showAttribution: false,
              showLayerToggle: true,
            }}
            onMarkerPress={id => {
              haptics.light();
              if (id.startsWith('exp-')) {
                const expId = id.replace('exp-', '');
                setSelectedExpenseId(expId);
              }
            }}
            darkMode={theme.isDark}
          />

          {/* Floating Glass Top Bar */}
          <View style={[styles.floatingTopBar, { top: insets.top + 16 }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.glassControlBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <AppIcon
                name="arrow-left"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>

            <GlassCard
              variant="prominent"
              padding="none"
              style={styles.tripBadgeCard}
            >
              <View style={styles.tripBadgeContent}>
                <AppIcon name="map-pin" size={14} color="#EA580C" />
                <Typography
                  variant="caption"
                  weight="bold"
                  color="textPrimary"
                  numberOfLines={1}
                >
                  {trip?.title || 'Trip Map'}
                </Typography>
                <View style={styles.tripBadgePill}>
                  <Typography
                    variant="caption"
                    style={{
                      fontSize: 10,
                      color: '#EA580C',
                      fontWeight: '800',
                    }}
                  >
                    {expensesWithMapData.length} pins
                  </Typography>
                </View>
              </View>
            </GlassCard>

            <Pressable
              onPress={handleRecenter}
              style={({ pressed }) => [
                styles.glassControlBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <AppIcon
                name="maximize-2"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Centered Floating Timeline Dock (Desktop/Tablet) */}
          {(isWebDesktop || isWebTablet) && timelineDays.length > 0 && (
            <View style={styles.timelineDockWrapper}>
              <GlassCard
                style={styles.timelineDock}
                intensity={theme.isDark ? 40 : 60}
                variant="prominent"
                padding="none"
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timelineScroll}
                >
                  <Pressable
                    onPress={() => {
                      haptics.light();
                      setSelectedDay(null);
                      handleRecenter();
                    }}
                    style={[
                      styles.dayChip,
                      !selectedDay && styles.dayChipActive,
                    ]}
                  >
                    <Typography
                      variant="caption"
                      weight="bold"
                      color={!selectedDay ? 'textInverse' : 'textSecondary'}
                    >
                      All Days
                    </Typography>
                    <View
                      style={[
                        styles.dayChipCount,
                        {
                          backgroundColor: !selectedDay
                            ? 'rgba(255,255,255,0.25)'
                            : theme.colors.borderLight,
                        },
                      ]}
                    >
                      <Typography
                        variant="caption"
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: !selectedDay
                            ? '#FFF'
                            : theme.colors.textSecondary,
                        }}
                      >
                        {expenses.length}
                      </Typography>
                    </View>
                  </Pressable>

                  {timelineDays.map((day, i) => {
                    const isActive = selectedDay === day.date;
                    return (
                      <Pressable
                        key={day.date}
                        onPress={() => {
                          haptics.light();
                          setSelectedDay(isActive ? null : day.date);
                        }}
                        style={[
                          styles.dayChip,
                          isActive && styles.dayChipActive,
                        ]}
                      >
                        <Typography
                          variant="caption"
                          weight="bold"
                          color={isActive ? 'textInverse' : 'textSecondary'}
                        >
                          Day {i + 1} • {format(parseISO(day.date), 'MMM d')}
                        </Typography>
                        <View style={styles.timelineDots}>
                          {day.expenses.slice(0, 4).map(e => (
                            <View
                              key={e._id}
                              style={[
                                styles.timelineDot,
                                {
                                  backgroundColor: getCategoryColor(
                                    theme,
                                    e.category,
                                  ),
                                },
                              ]}
                            />
                          ))}
                          {day.expenses.length > 4 && (
                            <Typography
                              variant="caption"
                              style={{
                                fontSize: 9,
                                color: isActive
                                  ? 'rgba(255,255,255,0.85)'
                                  : theme.colors.textTertiary,
                              }}
                            >
                              +{day.expenses.length - 4}
                            </Typography>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </GlassCard>
            </View>
          )}
        </View>

        {/* ── SIDEBAR PANEL (SEPARATE FLOATING CARD) ── */}
        <Animated.View
          style={[
            styles.panelContainer,
            isWebDesktop
              ? styles.webPanelContainer
              : isWebTablet
                ? styles.tabletPanelContainer
                : styles.mobileBottomPanel,
            animatedPanelStyle,
          ]}
        >
          <GlassCard
            variant="prominent"
            padding="none"
            style={styles.panelGlass}
            intensity={theme.isDark ? 50 : 70}
          >
            {/* Drag Handle for Mobile */}
            {!(isWebDesktop || isWebTablet) && (
              <GestureDetector gesture={panGesture}>
                <View style={styles.dragHandleContainer}>
                  <View
                    style={[
                      styles.dragHandle,
                      { backgroundColor: theme.colors.borderStrong },
                    ]}
                  />
                </View>
              </GestureDetector>
            )}

            {/* Panel Header */}
            <View
              style={[
                styles.panelHeader,
                { borderBottomColor: theme.colors.borderLight },
              ]}
            >
              <View style={styles.panelTitleRow}>
                <View style={{ flex: 1 }}>
                  <Typography
                    variant="h2"
                    weight="extrabold"
                    color="textPrimary"
                    style={{ letterSpacing: -0.5 }}
                  >
                    {trip?.title || 'Trip Map'}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    style={{ marginTop: 2 }}
                  >
                    {stops.length} stop{stops.length === 1 ? '' : 's'} •{' '}
                    {expenses.length} expenses
                  </Typography>
                </View>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <GlassCard
                  variant="subtle"
                  padding="sm"
                  style={styles.statCardGlass}
                >
                  <View style={styles.statCardHeader}>
                    <View
                      style={[
                        styles.statIconBadge,
                        { backgroundColor: 'rgba(234, 88, 12, 0.12)' },
                      ]}
                    >
                      <AppIcon name="wallet" size={13} color="#EA580C" />
                    </View>
                    <Typography
                      variant="caption"
                      weight="bold"
                      color="textTertiary"
                      style={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontSize: 9,
                      }}
                    >
                      Total Spent
                    </Typography>
                  </View>
                  <Typography
                    variant="body"
                    weight="extrabold"
                    color="textPrimary"
                    style={{ marginTop: 4, fontSize: 16 }}
                  >
                    ₹{totalSpent.toLocaleString()}
                  </Typography>
                </GlassCard>

                <GlassCard
                  variant="subtle"
                  padding="sm"
                  style={styles.statCardGlass}
                >
                  <View style={styles.statCardHeader}>
                    <View
                      style={[
                        styles.statIconBadge,
                        {
                          backgroundColor:
                            budgetProgress > 90
                              ? 'rgba(239, 68, 68, 0.12)'
                              : 'rgba(16, 185, 129, 0.12)',
                        },
                      ]}
                    >
                      <AppIcon
                        name="pie-chart"
                        size={13}
                        color={budgetProgress > 90 ? '#EF4444' : '#10B981'}
                      />
                    </View>
                    <Typography
                      variant="caption"
                      weight="bold"
                      color="textTertiary"
                      style={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontSize: 9,
                      }}
                    >
                      Budget
                    </Typography>
                  </View>
                  <View style={{ marginTop: 6 }}>
                    <ProgressBar
                      progress={budget > 0 ? budgetProgress / 100 : 0}
                      height={4}
                      variant={budgetProgress > 90 ? 'danger' : 'success'}
                    />
                    <Typography
                      variant="caption"
                      weight="semibold"
                      color="textTertiary"
                      style={{ marginTop: 3, fontSize: 9, textAlign: 'right' }}
                    >
                      {budget > 0
                        ? `${budgetProgress.toFixed(0)}% used`
                        : 'No budget'}
                    </Typography>
                  </View>
                </GlassCard>
              </View>

              {/* Search Input */}
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.borderLight,
                  },
                ]}
              >
                <AppIcon
                  name="search"
                  size={15}
                  color={theme.colors.textTertiary}
                />
                <TextInput
                  placeholder="Search expenses & places..."
                  placeholderTextColor={theme.colors.textTertiary}
                  style={[
                    styles.searchInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                    <AppIcon
                      name="x-circle"
                      size={15}
                      color={theme.colors.textTertiary}
                    />
                  </Pressable>
                )}
              </View>

              {/* Category Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setSelectedCategory(null);
                  }}
                  style={[
                    styles.categoryChip,
                    !selectedCategory && {
                      backgroundColor: theme.colors.textPrimary,
                      borderColor: theme.colors.textPrimary,
                    },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    color={!selectedCategory ? 'textInverse' : 'textSecondary'}
                  >
                    All
                  </Typography>
                </Pressable>

                {categoriesUsed.map((cat: any) => {
                  const isCatActive = selectedCategory === cat;
                  const catColor = getCategoryColor(theme, cat);
                  const iconName = CATEGORY_ICONS[cat] || 'tag';
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        haptics.light();
                        setSelectedCategory(isCatActive ? null : cat);
                      }}
                      style={[
                        styles.categoryChip,
                        isCatActive && {
                          backgroundColor: catColor,
                          borderColor: catColor,
                        },
                      ]}
                    >
                      <AppIcon
                        name={iconName}
                        size={11}
                        color={isCatActive ? '#FFF' : catColor}
                        style={{ marginRight: 3 }}
                      />
                      <Typography
                        variant="caption"
                        weight="bold"
                        color={isCatActive ? 'textInverse' : 'textSecondary'}
                      >
                        {cat}
                      </Typography>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Expense Items List */}
            <ScrollView
              style={styles.expensesList}
              contentContainerStyle={styles.expensesListContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredExpenses.length === 0 ? (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <EmptyState
                    icon="map-pin"
                    title="No expenses found"
                    description="Try adjusting your filters or search terms."
                  />
                </Animated.View>
              ) : (
                <View style={styles.listHeaderRow}>
                  <Typography variant="overline" color="textTertiary">
                    {filteredExpenses.length} EXPENSE
                    {filteredExpenses.length === 1 ? '' : 'S'} ON MAP
                  </Typography>
                  {selectedExpenseId && (
                    <Pressable
                      onPress={() => setSelectedExpenseId(null)}
                      hitSlop={10}
                    >
                      <Typography
                        variant="caption"
                        style={{ color: '#EA580C', fontWeight: '700' }}
                      >
                        Clear Focus
                      </Typography>
                    </Pressable>
                  )}
                </View>
              )}

              {filteredExpenses.map((exp: any, index: number) => {
                const isSelected = selectedExpenseId === exp._id;
                const catColor = getCategoryColor(theme, exp.category);
                const iconName = CATEGORY_ICONS[exp.category] || 'tag';
                const canDelete =
                  user && (exp.addedBy === user._id || exp.paidBy === user._id);

                return (
                  <Animated.View
                    key={exp._id}
                    entering={FadeInDown.delay(
                      Math.min(index * 30, 250),
                    ).duration(300)}
                    layout={Layout.springify()}
                  >
                    <InteractiveWrapper
                      onPress={() => handleExpensePress(exp)}
                      hoverElevation
                      style={{ marginBottom: 8 }}
                    >
                      <GlassCard
                        variant="subtle"
                        padding="none"
                        style={[
                          styles.expenseCard,
                          isSelected && {
                            borderColor: '#EA580C',
                            borderWidth: 1.5,
                            transform: [{ scale: 1.01 }],
                          },
                        ]}
                      >
                        <View style={styles.expenseCardInner}>
                          {/* Category Icon Bubble */}
                          <View
                            style={[
                              styles.expenseIconBubble,
                              {
                                backgroundColor: `${catColor}15`,
                                borderColor: `${catColor}30`,
                              },
                            ]}
                          >
                            <AppIcon
                              name={iconName}
                              size={15}
                              color={catColor}
                            />
                          </View>

                          {/* Center Info */}
                          <View style={styles.expenseInfoCenter}>
                            <Typography
                              variant="bodySm"
                              weight="bold"
                              color="textPrimary"
                              numberOfLines={1}
                            >
                              {exp.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              numberOfLines={1}
                              style={{ fontSize: 11 }}
                            >
                              {exp.stopName} •{' '}
                              {format(new Date(exp.date), 'MMM d, h:mm a')}
                            </Typography>
                            <View style={styles.paidByRow}>
                              <Avatar
                                fallback={exp.paidByName?.[0] || '?'}
                                size="sm"
                                previewable={false}
                              />
                              <Typography
                                variant="caption"
                                style={{
                                  fontSize: 10,
                                  color: theme.colors.textTertiary,
                                }}
                              >
                                Paid by{' '}
                                {exp.paidByName?.split(' ')[0] || 'User'}
                              </Typography>
                            </View>
                          </View>

                          {/* Price, Maps & Delete */}
                          <View style={styles.expensePriceColumn}>
                            <Typography
                              variant="bodySm"
                              weight="extrabold"
                              color="textPrimary"
                              style={{ letterSpacing: -0.3 }}
                            >
                              ₹{exp.amountBase?.toLocaleString()}
                            </Typography>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 2,
                              }}
                            >
                              <Pressable
                                onPress={e => {
                                  e.stopPropagation?.();
                                  const lat = exp.mapLat;
                                  const lng = exp.mapLng;
                                  if (lat && lng) {
                                    const url = Platform.select({
                                      ios: `maps://app?daddr=${lat},${lng}`,
                                      android: `google.navigation:q=${lat},${lng}`,
                                      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                                    });
                                    Linking.openURL(url as string);
                                  }
                                }}
                                style={({ pressed, hovered }: any) => [
                                  styles.gmapsActionBtn,
                                  Platform.OS === 'web' &&
                                    hovered && {
                                      backgroundColor: '#EA580C',
                                      borderColor: '#EA580C',
                                    },
                                  pressed && { opacity: 0.6 },
                                ]}
                                hitSlop={6}
                                accessibilityLabel="Open in Google Maps"
                              >
                                <AppIcon
                                  name="arrow-up-right"
                                  size={12}
                                  color="#EA580C"
                                />
                              </Pressable>
                              {canDelete && (
                                <Pressable
                                  onPress={e => {
                                    e.stopPropagation?.();
                                    handleDelete(exp._id);
                                  }}
                                  style={({ pressed }) => [
                                    styles.deleteBtnSmall,
                                    pressed && { opacity: 0.5 },
                                  ]}
                                  hitSlop={8}
                                >
                                  <AppIcon
                                    name="trash-2"
                                    size={12}
                                    color={theme.colors.danger}
                                  />
                                </Pressable>
                              )}
                            </View>
                          </View>
                        </View>
                      </GlassCard>
                    </InteractiveWrapper>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </GlassCard>
        </Animated.View>
      </View>
    </View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: 'transparent' },

        mainLayout: { flex: 1, flexDirection: 'column' },
        webMainLayout: {
          flexDirection: 'row',
          maxWidth: 1440,
          width: '95%',
          alignSelf: 'center',
          height: '92%',
          marginTop: '1.5%',
          marginBottom: '1.5%',
          gap: 16,
          backgroundColor: 'transparent',
        } as any,

        // Map container is its own isolated floating card
        mapContainer: { flex: 1, position: 'relative' },
        webMapContainer: {
          flex: 1,
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.borderLight,

          ...Platform.select({
            web: {
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
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
        tabletMapContainer: {
          flex: 0.6,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
        },
        map: { width: '100%', height: '100%' },

        // Floating Top Bar inside Map
        floatingTopBar: {
          position: 'absolute',
          left: 16,
          right: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
          pointerEvents: 'box-none',
        },
        glassControlBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.isDark
            ? 'rgba(15, 23, 42, 0.85)'
            : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(16px)',
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.08)',
          alignItems: 'center',
          justifyContent: 'center',

          ...Platform.select({
            web: {
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
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
        tripBadgeCard: {
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(0, 0, 0, 0.08)',

          ...Platform.select({
            web: {
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
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
        tripBadgeContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        tripBadgePill: {
          backgroundColor: 'rgba(234, 88, 12, 0.12)',
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 999,
        },

        // Floating Timeline Dock
        timelineDockWrapper: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          alignItems: 'center',
          zIndex: 100,
          pointerEvents: 'box-none',
        },
        timelineDock: {
          borderRadius: 999,
          padding: 6,
          maxWidth: '90%',
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(0, 0, 0, 0.08)',

          ...Platform.select({
            web: {
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.14)',
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
        timelineScroll: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 4,
        },
        dayChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: 'transparent',
          cursor: 'pointer',
        } as any,
        dayChipActive: {
          backgroundColor: '#EA580C',
        },
        dayChipCount: {
          paddingHorizontal: 5,
          paddingVertical: 1,
          borderRadius: 999,
        },
        timelineDots: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
        },
        timelineDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },

        // Sidebar / Bottom Sheet
        panelContainer: { zIndex: 10 },
        webPanelContainer: {
          width: 380,
          height: '100%',
        },
        tabletPanelContainer: {
          flex: 0.4,
          height: '100%',
        },
        mobileBottomPanel: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        panelGlass: {
          flex: 1,
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.borderLight,

          ...Platform.select({
            web: {
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
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
        dragHandleContainer: {
          alignItems: 'center',
          paddingVertical: 10,
          cursor: 'grab',
        } as any,
        dragHandle: {
          width: 36,
          height: 4,
          borderRadius: 2,
        },
        panelHeader: {
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: 1,
          gap: 12,
        },
        panelTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        statsGrid: {
          flexDirection: 'row',
          gap: 10,
        },
        statCardGlass: {
          flex: 1,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.04)',
        },
        statCardHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        statIconBadge: {
          width: 22,
          height: 22,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 12,
          borderWidth: 1,
        },
        searchInput: {
          flex: 1,
          fontSize: 12,
          padding: 0,
        },
        filterScroll: {
          gap: 6,
          paddingVertical: 2,
        },
        categoryChip: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          backgroundColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.03)',
          cursor: 'pointer',
        } as any,

        // Expenses List
        expensesList: { flex: 1 },
        expensesListContent: {
          padding: 16,
          paddingBottom: 40,
        },
        listHeaderRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        },
        expenseCard: {
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        },
        expenseCardInner: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          gap: 10,
        },
        expenseIconBubble: {
          width: 34,
          height: 34,
          borderRadius: 10,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        expenseInfoCenter: {
          flex: 1,
          gap: 2,
        },
        paidByRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          marginTop: 2,
        },
        expensePriceColumn: {
          alignItems: 'flex-end',
          gap: 4,
        },
        deleteBtnSmall: {
          padding: 2,
        },
        gmapsActionBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 5,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: theme.isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED',
          borderWidth: 1,
          borderColor: 'rgba(234, 88, 12, 0.3)',
          cursor: 'pointer',
        } as any,
      }),
    [theme],
  );
};
