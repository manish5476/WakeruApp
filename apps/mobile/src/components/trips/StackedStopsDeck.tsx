// src/components/trips/StackedStopsDeck.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';
import { GlassCard } from '../ui/GlassCard';
import { haptics } from '../../utils/haptics';
import {
  getStopCoverImage,
  GUARANTEED_FALLBACK_COVER,
} from '../../utils/tripImage';
import { formatAmount } from '../../utils/formatters';

function DeckImage({
  uri,
  style,
  resizeMode = 'cover',
}: {
  uri: string;
  style: any;
  resizeMode?: any;
}) {
  const [src, setSrc] = useState(uri || GUARANTEED_FALLBACK_COVER);
  React.useEffect(() => {
    setSrc(uri || GUARANTEED_FALLBACK_COVER);
  }, [uri]);

  return (
    <Image
      source={{ uri: src }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (src !== GUARANTEED_FALLBACK_COVER) {
          setSrc(GUARANTEED_FALLBACK_COVER);
        }
      }}
    />
  );
}

export interface StopData {
  _id: string;
  name: string;
  startDate?: string | Date;
  endDate?: string | Date;
  budgetBase?: number;
  totalSpentBase?: number;
  totalSpentLocal?: number;
  currency?: string;
  baseCurrency?: string;
  expenseCount?: number;
  emoji?: string;
  location?: string;
}

interface StackedStopsDeckProps {
  stops: StopData[];
  tripTitle?: string;
  tripId: string;
  baseCurrency?: string;
  onSelectStop: (stopId: string) => void;
  onAddStop: () => void;
  onAddExpenseToStop?: (stopId: string) => void;
  onReorderStops?: () => void;
}

export function StackedStopsDeck({
  stops,
  tripTitle,
  tripId,
  baseCurrency = 'INR',
  onSelectStop,
  onAddStop,
  onAddExpenseToStop,
  onReorderStops,
}: StackedStopsDeckProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'deck' | 'grid'>('deck');

  const isSmallScreen = width < 380;
  const isWebDesktop = Platform.OS === 'web' && width > 768;

  // Safe clamping in case stops change
  const currentIdx = Math.min(activeIndex, Math.max(0, stops.length - 1));

  const activeStop = stops[currentIdx] || null;

  const handlePrev = () => {
    if (currentIdx > 0) {
      haptics.selection();
      setActiveIndex(currentIdx - 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < stops.length - 1) {
      haptics.selection();
      setActiveIndex(currentIdx + 1);
    }
  };

  if (!stops || stops.length === 0) {
    return (
      <GlassCard style={styles.emptyCard} intensity={theme.isDark ? 15 : 8}>
        <View
          style={[
            styles.emptyIconWrap,
            { backgroundColor: theme.colors.primaryBg },
          ]}
        >
          <AppIcon name="map-pin" size={28} color={theme.colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
          No Stops Added Yet
        </Text>
        <Text
          style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}
        >
          Stack destinations along your journey to organize expenses by
          location.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.addFirstStopBtn,
            { backgroundColor: theme.colors.primary },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => {
            haptics.medium();
            onAddStop();
          }}
        >
          <AppIcon name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addFirstStopBtnText}>Add First Destination</Text>
        </Pressable>
      </GlassCard>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Controls Row */}
      <View style={styles.controlsRow}>
        <View style={styles.controlsLeft}>
          <View
            style={[
              styles.badgePill,
              { backgroundColor: `${theme.colors.primary}20` },
            ]}
          >
            <AppIcon name="map-pin" size={12} color={theme.colors.primary} />
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
              {stops.length}{' '}
              {stops.length === 1 ? 'Destination' : 'Destinations'}
            </Text>
          </View>
          {stops.length > 1 && onReorderStops && (
            <Pressable
              onPress={() => {
                haptics.selection();
                onReorderStops();
              }}
              style={styles.reorderBtn}
            >
              <Text
                style={[styles.reorderText, { color: theme.colors.primary }]}
              >
                Reorder
              </Text>
            </Pressable>
          )}
        </View>

        {/* View Toggle */}
        <View
          style={[
            styles.viewToggleWrap,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Pressable
            style={[
              styles.viewToggleBtn,
              viewMode === 'deck' && [
                styles.viewToggleBtnActive,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.12)'
                    : theme.colors.card,
                },
              ],
            ]}
            onPress={() => {
              haptics.selection();
              setViewMode('deck');
            }}
          >
            <AppIcon
              name="layers"
              size={14}
              color={
                viewMode === 'deck'
                  ? theme.colors.primary
                  : theme.colors.textTertiary
              }
            />
          </Pressable>
          <Pressable
            style={[
              styles.viewToggleBtn,
              viewMode === 'grid' && [
                styles.viewToggleBtnActive,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.12)'
                    : theme.colors.card,
                },
              ],
            ]}
            onPress={() => {
              haptics.selection();
              setViewMode('grid');
            }}
          >
            <AppIcon
              name="grid"
              size={14}
              color={
                viewMode === 'grid'
                  ? theme.colors.primary
                  : theme.colors.textTertiary
              }
            />
          </Pressable>
        </View>
      </View>

      {/* ============================================================
          DECK VIEW: PINTEREST-INSPIRED STACKED CARD DECK
         ============================================================ */}
      {viewMode === 'deck' ? (
        <View style={styles.deckContainer}>
          {/* Peeking Background Cards Stack */}
          {stops.map((stop, index) => {
            if (index >= currentIdx) return null;
            const depth = currentIdx - index;
            if (depth > 2) return null; // Show up to 2 peeked tabs

            const topOffset = depth === 2 ? -44 : -24;
            const scale = depth === 2 ? 0.9 : 0.95;

            return (
              <Pressable
                key={`peek-${stop._id}`}
                onPress={() => {
                  haptics.selection();
                  setActiveIndex(index);
                }}
                style={[
                  styles.peekingCardTab,
                  {
                    top: topOffset,
                    transform: [{ scale }],
                    backgroundColor: theme.isDark ? '#1E293B' : '#E2E8F0',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.08)',
                    zIndex: 5 - depth,
                  },
                ]}
              >
                <View style={styles.peekingTabInner}>
                  <DeckImage
                    uri={getStopCoverImage(stop, tripTitle)}
                    style={styles.peekingThumb}
                  />
                  <Text
                    style={[
                      styles.peekingTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {stop.name}
                  </Text>
                  <View style={styles.peekingBadge}>
                    <Text style={styles.peekingBadgeText}>
                      Stop {index + 1}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* Active Card Foreground */}
          {activeStop && (
            <GlassCard
              style={[
                styles.activeCard,
                {
                  backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                  borderColor: theme.isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.08)',
                },
              ]}
              intensity={theme.isDark ? 25 : 12}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.stopNumberChip,
                      { backgroundColor: theme.colors.primaryBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stopNumberChipText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      STOP 0{currentIdx + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {activeStop.name}
                  </Text>
                  {activeStop.startDate && (
                    <Text
                      style={[
                        styles.cardDates,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {format(new Date(activeStop.startDate), 'MMM d')}
                      {activeStop.endDate
                        ? ` – ${format(new Date(activeStop.endDate), 'MMM d, yyyy')}`
                        : ''}
                    </Text>
                  )}
                </View>

                {activeStop.emoji ? (
                  <View style={styles.cardEmojiWrap}>
                    <Text style={styles.cardEmojiText}>{activeStop.emoji}</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.cardIconWrap,
                      { backgroundColor: theme.colors.primaryBg },
                    ]}
                  >
                    <AppIcon
                      name="map-pin"
                      size={16}
                      color={theme.colors.primary}
                    />
                  </View>
                )}
              </View>

              {/* Panoramic Destination Photo */}
              <Pressable
                onPress={() => {
                  haptics.selection();
                  onSelectStop(activeStop._id);
                }}
                style={styles.photoContainer}
              >
                <DeckImage
                  uri={getStopCoverImage(activeStop, tripTitle)}
                  style={styles.coverPhoto}
                />
                <LinearGradient
                  colors={[
                    'rgba(0,0,0,0.05)',
                    'rgba(0,0,0,0.2)',
                    'rgba(15,23,42,0.85)',
                  ]}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />

                {/* Floating Chips on Photo */}
                <View style={styles.photoChipsRow}>
                  <View style={styles.photoGlassChip}>
                    <AppIcon name="receipt" size={12} color="#FFFFFF" />
                    <Text style={styles.photoChipText}>
                      {activeStop.expenseCount || 0} Expenses
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.photoGlassChip,
                      { backgroundColor: 'rgba(0,0,0,0.5)' },
                    ]}
                  >
                    <Text style={styles.photoChipText}>
                      {activeStop.currency || baseCurrency}
                    </Text>
                  </View>
                </View>
              </Pressable>

              {/* Financial Progress & Stats */}
              <View style={styles.cardStatsBlock}>
                <View style={styles.statsRow}>
                  <View>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      TOTAL SPENT
                    </Text>
                    <Text
                      style={[
                        styles.statAmount,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {formatAmount(
                        activeStop.totalSpentBase || 0,
                        baseCurrency,
                      )}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      STOP BUDGET
                    </Text>
                    <Text
                      style={[
                        styles.statBudget,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {activeStop.budgetBase && activeStop.budgetBase > 0
                        ? formatAmount(activeStop.budgetBase, baseCurrency)
                        : 'No limit'}
                    </Text>
                  </View>
                </View>

                {/* Budget Progress Bar */}
                {activeStop.budgetBase && activeStop.budgetBase > 0 && (
                  <View style={styles.progressBarWrap}>
                    <View
                      style={[
                        styles.progressBarBg,
                        {
                          backgroundColor: theme.isDark
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.06)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(
                              100,
                              ((activeStop.totalSpentBase || 0) /
                                activeStop.budgetBase) *
                                100,
                            )}%`,
                            backgroundColor:
                              (activeStop.totalSpentBase || 0) >
                              activeStop.budgetBase
                                ? theme.colors.danger
                                : theme.colors.success,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.progressPercentText,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      {(
                        ((activeStop.totalSpentBase || 0) /
                          activeStop.budgetBase) *
                        100
                      ).toFixed(0)}
                      %
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons Row */}
              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryCardBtn,
                    { backgroundColor: theme.colors.primary },
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => {
                    haptics.medium();
                    onSelectStop(activeStop._id);
                  }}
                >
                  <Text style={styles.primaryCardBtnText}>
                    Explore Destination
                  </Text>
                  <AppIcon name="arrow-right" size={14} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryCardBtn,
                    {
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(0,0,0,0.1)',
                      backgroundColor: theme.colors.surface,
                    },
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => {
                    haptics.selection();
                    if (onAddExpenseToStop) {
                      onAddExpenseToStop(activeStop._id);
                    }
                  }}
                >
                  <AppIcon
                    name="plus"
                    size={14}
                    color={theme.colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.secondaryCardBtnText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Add Expense
                  </Text>
                </Pressable>
              </View>
            </GlassCard>
          )}

          {/* Deck Stepper Navigation Row */}
          <View style={styles.deckNavRow}>
            <Pressable
              onPress={handlePrev}
              disabled={currentIdx === 0}
              style={[
                styles.navArrowBtn,
                { backgroundColor: theme.colors.surface },
                currentIdx === 0 && { opacity: 0.3 },
              ]}
            >
              <AppIcon
                name="chevron-left"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>

            {/* Dots Indicator */}
            <View style={styles.dotsRow}>
              {stops.map((_, i) => (
                <Pressable
                  key={`dot-${i}`}
                  onPress={() => {
                    haptics.selection();
                    setActiveIndex(i);
                  }}
                  style={[
                    styles.dot,
                    i === currentIdx
                      ? [
                          styles.dotActive,
                          { backgroundColor: theme.colors.primary },
                        ]
                      : {
                          backgroundColor: theme.isDark
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(0,0,0,0.15)',
                        },
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={handleNext}
              disabled={currentIdx === stops.length - 1}
              style={[
                styles.navArrowBtn,
                { backgroundColor: theme.colors.surface },
                currentIdx === stops.length - 1 && { opacity: 0.3 },
              ]}
            >
              <AppIcon
                name="chevron-right"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Add Another Stop CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.addStopDashedCard,
              {
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(0,0,0,0.12)',
                backgroundColor: theme.colors.surface,
              },
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
            onPress={() => {
              haptics.medium();
              onAddStop();
            }}
          >
            <View
              style={[
                styles.addStopCircle,
                { backgroundColor: theme.colors.primaryBg },
              ]}
            >
              <AppIcon name="plus" size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.addStopTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Add Next Stop
              </Text>
              <Text
                style={[
                  styles.addStopSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Stack another destination into this journey
              </Text>
            </View>
            <AppIcon
              name="chevron-right"
              size={16}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        </View>
      ) : (
        /* ============================================================
           GRID VIEW: 2-COLUMN OR LIST OF STOPS
           ============================================================ */
        <View style={styles.gridContainer}>
          <View style={isWebDesktop ? styles.webGrid : styles.mobileGrid}>
            {stops.map((stop, index) => {
              const budget = stop.budgetBase || 0;
              const spent = stop.totalSpentBase || 0;
              const percent =
                budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

              return (
                <Pressable
                  key={stop._id}
                  style={({ pressed }) => [
                    styles.gridItem,
                    isWebDesktop && styles.webGridItem,
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => {
                    haptics.selection();
                    onSelectStop(stop._id);
                  }}
                >
                  <GlassCard
                    style={styles.gridCard}
                    intensity={theme.isDark ? 15 : 8}
                  >
                    <View style={styles.gridPhotoWrap}>
                      <DeckImage
                        uri={getStopCoverImage(stop, tripTitle)}
                        style={styles.gridPhoto}
                      />
                      <LinearGradient
                        colors={['rgba(0,0,0,0.1)', 'rgba(15,23,42,0.85)']}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.gridBadge}>
                        <Text style={styles.gridBadgeText}>#{index + 1}</Text>
                      </View>
                    </View>

                    <View style={styles.gridCardContent}>
                      <Text
                        style={[
                          styles.gridTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {stop.name}
                      </Text>
                      <Text
                        style={[
                          styles.gridDates,
                          { color: theme.colors.textTertiary },
                        ]}
                        numberOfLines={1}
                      >
                        {stop.startDate
                          ? format(new Date(stop.startDate), 'MMM d')
                          : ''}
                        {stop.endDate
                          ? ` – ${format(new Date(stop.endDate), 'MMM d')}`
                          : ''}
                      </Text>

                      <View style={styles.gridStatsRow}>
                        <Text
                          style={[
                            styles.gridSpent,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {formatAmount(spent, baseCurrency)}
                        </Text>
                        <Text
                          style={[
                            styles.gridExpCount,
                            { color: theme.colors.textTertiary },
                          ]}
                        >
                          {stop.expenseCount || 0} exp
                        </Text>
                      </View>

                      {budget > 0 && (
                        <View style={styles.gridProgressBg}>
                          <View
                            style={[
                              styles.gridProgressFill,
                              {
                                width: `${percent}%`,
                                backgroundColor:
                                  spent > budget
                                    ? theme.colors.danger
                                    : theme.colors.primary,
                              },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addStopDashedCard,
              {
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(0,0,0,0.12)',
                backgroundColor: theme.colors.surface,
                marginTop: 16,
              },
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
            onPress={() => {
              haptics.medium();
              onAddStop();
            }}
          >
            <View
              style={[
                styles.addStopCircle,
                { backgroundColor: theme.colors.primaryBg },
              ]}
            >
              <AppIcon name="plus" size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.addStopTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Add Another Stop
              </Text>
              <Text
                style={[
                  styles.addStopSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Add more destinations to your itinerary
              </Text>
            </View>
            <AppIcon
              name="chevron-right"
              size={16}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reorderBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  viewToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 12,
    gap: 2,
  },
  viewToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },

  // Deck Styling
  deckContainer: {
    position: 'relative',
    paddingTop: 36, // room for peeking tabs
    marginBottom: 16,
  },
  peekingCardTab: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 60,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    overflow: 'hidden',
  },
  peekingTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  peekingThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  peekingTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  peekingBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  peekingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  activeCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } as any,
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 12,
  },
  stopNumberChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  stopNumberChipText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  cardDates: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmojiText: {
    fontSize: 20,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoContainer: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
    backgroundColor: '#1E293B',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  photoChipsRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoGlassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,23,42,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  photoChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  cardStatsBlock: {
    marginBottom: 16,
    paddingTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  statBudget: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
  },
  primaryCardBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryCardBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  deckNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  navArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
    borderRadius: 5,
  },

  addStopDashedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addStopCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStopTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  addStopSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  // Grid View Styling
  gridContainer: {
    width: '100%',
  },
  mobileGrid: {
    gap: 12,
  },
  webGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '100%',
  },
  webGridItem: {
    width: '48%',
  },
  gridCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gridPhotoWrap: {
    height: 110,
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  gridPhoto: {
    width: '100%',
    height: '100%',
  },
  gridBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gridBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  gridCardContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  gridDates: {
    fontSize: 11,
    marginBottom: 8,
  },
  gridStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridSpent: {
    fontSize: 14,
    fontWeight: '800',
  },
  gridExpCount: {
    fontSize: 11,
  },
  gridProgressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  gridProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  addFirstStopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  addFirstStopBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
