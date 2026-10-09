// src/components/map/MapTravelSuggestions.tsx
// Smart Contextual Travel Deals & Suggestions on the Map View
// Supports GPS location detection, active stop awareness, and Travelpayouts affiliate deep-links

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { Typography } from '../ui/Typography';
import AppIcon from '../common/AppIcon';
import { useAds } from '../../hooks/useAds';
import { haptics } from '../../utils/haptics';
import { locationApi } from '../../services/api/location.api';
import {
  getHotelDealUrl,
  getActivityDealUrl,
  getFlightDealUrl,
  getForexCardDealUrl,
} from '../../utils/affiliateLinks';

export interface MapTravelSuggestionsProps {
  trip?: any;
  stops?: any[];
  selectedStopId?: string | null;
  selectedExpenseId?: string | null;
  expenses?: any[];
  variant?: 'floating' | 'embedded';
  topOffset?: number;
  onDismiss?: () => void;
}

interface DetectedLocation {
  name: string;
  lat?: number;
  lng?: number;
  isGps?: boolean;
}

/** Cleans titles like "Goa Trip 2026" or "Paris Vacation" into clean place names */
function cleanDestinationName(raw?: string): string {
  if (!raw) return 'Destination';
  return (
    raw
      .replace(
        /\b(trip|vacation|tour|holiday|getaway|travel|journey|202[4-9])\b/gi,
        '',
      )
      .replace(/[^\w\s]/g, '')
      .trim() || raw
  );
}

export function MapTravelSuggestions({
  trip,
  stops = [],
  selectedStopId,
  selectedExpenseId,
  expenses = [],
  variant = 'floating',
  topOffset = 76,
  onDismiss,
}: MapTravelSuggestionsProps) {
  const theme = useTheme();
  const { isAdFree } = useAds();

  const [dismissed, setDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<DetectedLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [useGpsMode, setUseGpsMode] = useState(false);

  // Silently check if location permission is already granted on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const lastLoc = await Location.getLastKnownPositionAsync();
          if (lastLoc && isMounted) {
            const { latitude, longitude } = lastLoc.coords;
            try {
              const res = (await locationApi.getLocationInfo(
                latitude,
                longitude,
              )) as any;
              const place = res?.data;
              if (place?.city && isMounted) {
                setGpsLocation({
                  name: place.city,
                  lat: latitude,
                  lng: longitude,
                  isGps: true,
                });
              }
            } catch {
              // Ignore silent geocode error
            }
          }
        }
      } catch {
        // Location check silently omitted
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handler for explicit GPS detection
  const handleDetectGPS = useCallback(async () => {
    try {
      setIsLocating(true);
      haptics.light();
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const res = (await locationApi.getLocationInfo(
        latitude,
        longitude,
      )) as any;
      const place = res?.data;
      const resolvedName = place?.city || place?.state || 'Current Location';

      setGpsLocation({
        name: resolvedName,
        lat: latitude,
        lng: longitude,
        isGps: true,
      });
      setUseGpsMode(true);
      haptics.success();
    } catch (e) {
      console.warn('[MapTravelSuggestions] GPS detection failed:', e);
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Determine active context location
  const activeLocation = useMemo<DetectedLocation>(() => {
    // 1. If GPS mode is explicitly toggled and available
    if (useGpsMode && gpsLocation) {
      return gpsLocation;
    }

    // 2. If a specific stop is selected
    if (selectedStopId) {
      const stop = stops.find(s => s._id === selectedStopId);
      if (stop?.name) {
        return {
          name: stop.name,
          lat: stop.location?.lat,
          lng: stop.location?.lng,
          isGps: false,
        };
      }
    }

    // 3. If an expense is selected
    if (selectedExpenseId) {
      const exp = expenses.find(e => e._id === selectedExpenseId);
      if (exp) {
        const stop = stops.find(s => s._id === exp.stopId);
        return {
          name: stop?.name || exp.stopName || cleanDestinationName(trip?.title),
          lat: exp.location?.latitude || stop?.location?.lat,
          lng: exp.location?.longitude || stop?.location?.lng,
          isGps: false,
        };
      }
    }

    // 4. Default to first stop with valid coordinates
    const firstStopWithLoc = stops.find(
      s => s.location?.lat && s.location?.lng,
    );
    if (firstStopWithLoc?.name) {
      return {
        name: firstStopWithLoc.name,
        lat: firstStopWithLoc.location.lat,
        lng: firstStopWithLoc.location.lng,
        isGps: false,
      };
    }

    // 5. Fallback to trip title or GPS
    if (gpsLocation) return gpsLocation;
    return {
      name: cleanDestinationName(
        trip?.destination || trip?.title || 'Destinations',
      ),
      isGps: false,
    };
  }, [
    useGpsMode,
    gpsLocation,
    selectedStopId,
    selectedExpenseId,
    stops,
    expenses,
    trip,
  ]);

  // If user is paid/premium or explicitly dismissed, render nothing
  if (isAdFree || dismissed) return null;

  const locCoords =
    activeLocation.lat && activeLocation.lng
      ? { lat: activeLocation.lat, lng: activeLocation.lng }
      : undefined;

  const deals = [
    {
      id: 'stays',
      title: `Stays & Hotels`,
      subtitle: `Top-rated stays in ${activeLocation.name}`,
      badge: 'Booking.com',
      badgeColor: '#2563EB',
      icon: 'hotel',
      iconColor: '#3B82F6',
      cta: 'View Hotels',
      url: getHotelDealUrl(activeLocation.name, locCoords),
    },
    {
      id: 'activities',
      title: `Things to Do`,
      subtitle: `Sights & tours near ${activeLocation.name}`,
      badge: 'GetYourGuide',
      badgeColor: '#D97706',
      icon: 'compass',
      iconColor: '#F59E0B',
      cta: 'Explore Tours',
      url: getActivityDealUrl(activeLocation.name, locCoords),
    },
    {
      id: 'flights',
      title: `Flights & Transit`,
      subtitle: `Best rates to ${activeLocation.name}`,
      badge: 'WayAway',
      badgeColor: '#059669',
      icon: 'plane',
      iconColor: '#10B981',
      cta: 'Compare Fares',
      url: getFlightDealUrl(activeLocation.name),
    },
  ];

  const handleOpenDeal = (url: string) => {
    haptics.light();
    Linking.openURL(url).catch(err => {
      console.warn('[MapTravelSuggestions] Failed to open deal link:', err);
    });
  };

  const handleDismiss = () => {
    haptics.selection();
    setDismissed(true);
    onDismiss?.();
  };

  // ─────────────────────────────────────────────────────────────
  // EMBEDDED VARIANT (inside sidebar/bottom sheet)
  // ─────────────────────────────────────────────────────────────
  if (variant === 'embedded') {
    return (
      <View style={styles.embeddedWrapper}>
        <GlassCard variant="subtle" padding="none" style={styles.embeddedCard}>
          <View style={styles.embeddedHeader}>
            <View style={styles.headerLeftRow}>
              <View style={styles.sparkleBadge}>
                <AppIcon name="sparkles" size={13} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Typography
                    variant="caption"
                    weight="extrabold"
                    color="textPrimary"
                    style={{ fontSize: 13 }}
                  >
                    Suggested in {activeLocation.name}
                  </Typography>
                  <View style={styles.partnerTag}>
                    <Text style={styles.partnerTagText}>PARTNER</Text>
                  </View>
                </View>
                <Typography
                  variant="caption"
                  color="textTertiary"
                  style={{ fontSize: 11 }}
                >
                  {activeLocation.isGps
                    ? 'Based on your current GPS'
                    : 'Contextual travel deals for this stop'}
                </Typography>
              </View>
            </View>

            <Pressable
              onPress={handleDismiss}
              hitSlop={10}
              style={styles.closeIconBtn}
              accessibilityLabel="Dismiss recommendations"
            >
              <AppIcon name="x" size={14} color={theme.colors.textTertiary} />
            </Pressable>
          </View>

          {/* Quick horizontal deal cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dealsScrollContainer}
          >
            {deals.map(deal => (
              <InteractiveWrapper
                key={deal.id}
                onPress={() => handleOpenDeal(deal.url)}
                hoverElevation
                style={styles.dealCardOuter}
              >
                <GlassCard
                  variant="prominent"
                  padding="sm"
                  style={styles.dealCard}
                >
                  <View style={styles.dealCardHeader}>
                    <View
                      style={[
                        styles.dealIconBox,
                        { backgroundColor: `${deal.iconColor}15` },
                      ]}
                    >
                      <AppIcon
                        name={deal.icon as any}
                        size={15}
                        color={deal.iconColor}
                      />
                    </View>
                    <View
                      style={[
                        styles.dealBadgePill,
                        { backgroundColor: `${deal.badgeColor}18` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dealBadgeText,
                          { color: deal.badgeColor },
                        ]}
                      >
                        {deal.badge}
                      </Text>
                    </View>
                  </View>

                  <Typography
                    variant="bodySm"
                    weight="bold"
                    color="textPrimary"
                    numberOfLines={1}
                    style={{ marginTop: 6 }}
                  >
                    {deal.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    numberOfLines={1}
                    style={{ fontSize: 11, marginTop: 2 }}
                  >
                    {deal.subtitle}
                  </Typography>

                  <View style={styles.dealCtaRow}>
                    <Text
                      style={[styles.dealCtaText, { color: deal.iconColor }]}
                    >
                      {deal.cta} →
                    </Text>
                  </View>
                </GlassCard>
              </InteractiveWrapper>
            ))}
          </ScrollView>
        </GlassCard>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // FLOATING VARIANT (overlay directly on the Leaflet Map)
  // ─────────────────────────────────────────────────────────────
  return (
    <View
      style={[styles.floatingContainer, { top: topOffset }]}
      pointerEvents="box-none"
    >
      {/* Collapsed Pill */}
      {!isExpanded ? (
        <InteractiveWrapper
          onPress={() => {
            haptics.light();
            setIsExpanded(true);
          }}
          hoverElevation
        >
          <GlassCard
            variant="prominent"
            padding="none"
            intensity={theme.isDark ? 65 : 85}
            style={styles.collapsedPill}
          >
            <View style={styles.collapsedContent}>
              <View style={styles.pulseDot}>
                <View style={styles.pulseDotInner} />
              </View>
              <AppIcon name="sparkles" size={13} color="#EA580C" />
              <Typography
                variant="caption"
                weight="bold"
                color="textPrimary"
                numberOfLines={1}
                style={{ fontSize: 12 }}
              >
                Deals near {activeLocation.name}
              </Typography>
              <View style={styles.miniBadge}>
                <Typography
                  variant="caption"
                  style={{ fontSize: 10, color: '#EA580C', fontWeight: '800' }}
                >
                  Stays & Tours
                </Typography>
              </View>
              <AppIcon
                name="chevron-down"
                size={13}
                color={theme.colors.textSecondary}
              />

              <Pressable
                onPress={e => {
                  e.stopPropagation?.();
                  handleDismiss();
                }}
                hitSlop={10}
                style={styles.collapsedCloseBtn}
                accessibilityLabel="Close recommendations"
              >
                <AppIcon name="x" size={11} color={theme.colors.textTertiary} />
              </Pressable>
            </View>
          </GlassCard>
        </InteractiveWrapper>
      ) : (
        /* Expanded Floating Card */
        <GlassCard
          variant="prominent"
          padding="none"
          intensity={theme.isDark ? 75 : 90}
          style={styles.expandedCard}
        >
          {/* Card Header */}
          <View style={styles.expandedHeader}>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <AppIcon name="map-pin" size={13} color="#EA580C" />
                <Typography
                  variant="bodySm"
                  weight="extrabold"
                  color="textPrimary"
                  numberOfLines={1}
                >
                  Suggested for {activeLocation.name}
                </Typography>
                <View style={styles.partnerTag}>
                  <Text style={styles.partnerTagText}>PARTNER</Text>
                </View>
              </View>
              <Typography
                variant="caption"
                color="textTertiary"
                style={{ fontSize: 10, marginTop: 2 }}
              >
                {activeLocation.isGps
                  ? 'Matched with your live GPS location'
                  : 'Contextual recommendations for this destination'}
              </Typography>
            </View>

            {/* GPS Toggle Button */}
            <Pressable
              onPress={handleDetectGPS}
              disabled={isLocating}
              style={({ pressed }) => [
                styles.gpsToggleBtn,
                useGpsMode && styles.gpsToggleBtnActive,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#EA580C" />
              ) : (
                <>
                  <AppIcon
                    name="navigation"
                    size={11}
                    color={useGpsMode ? '#FFF' : '#EA580C'}
                  />
                  <Text
                    style={[
                      styles.gpsToggleText,
                      useGpsMode && { color: '#FFF' },
                    ]}
                  >
                    {useGpsMode ? 'GPS Active' : 'Near Me'}
                  </Text>
                </>
              )}
            </Pressable>

            {/* Collapse & Close Controls */}
            <Pressable
              onPress={() => {
                haptics.light();
                setIsExpanded(false);
              }}
              hitSlop={8}
              style={styles.controlIconBtn}
              accessibilityLabel="Collapse"
            >
              <AppIcon
                name="chevron-up"
                size={14}
                color={theme.colors.textSecondary}
              />
            </Pressable>

            <Pressable
              onPress={handleDismiss}
              hitSlop={8}
              style={styles.controlIconBtn}
              accessibilityLabel="Dismiss"
            >
              <AppIcon name="x" size={13} color={theme.colors.textTertiary} />
            </Pressable>
          </View>

          {/* Quick Deals Grid */}
          <View style={styles.dealsRow}>
            {deals.map(deal => (
              <InteractiveWrapper
                key={deal.id}
                onPress={() => handleOpenDeal(deal.url)}
                hoverElevation
                style={{ flex: 1 }}
              >
                <View
                  style={[
                    styles.floatingDealItem,
                    { borderColor: theme.colors.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.floatingIconBadge,
                      { backgroundColor: `${deal.iconColor}15` },
                    ]}
                  >
                    <AppIcon
                      name={deal.icon as any}
                      size={14}
                      color={deal.iconColor}
                    />
                  </View>
                  <Typography
                    variant="caption"
                    weight="bold"
                    color="textPrimary"
                    numberOfLines={1}
                    style={{ fontSize: 11, marginTop: 4 }}
                  >
                    {deal.title}
                  </Typography>
                  <Text
                    style={[styles.floatingDealCta, { color: deal.iconColor }]}
                  >
                    {deal.cta} →
                  </Text>
                </View>
              </InteractiveWrapper>
            ))}
          </View>
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Floating Variant Styles
  floatingContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 999,
    width: '94%',
    maxWidth: 480,
  },
  collapsedPill: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.25)',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 7,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(234, 88, 12, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EA580C',
  },
  miniBadge: {
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  collapsedCloseBtn: {
    padding: 4,
    marginLeft: 2,
  },

  // Expanded Floating Card
  expandedCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.2)',
    overflow: 'hidden',
    padding: 12,
    ...Platform.select({
      web: { boxShadow: '0 12px 32px rgba(0,0,0,0.18)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.12)',
  },
  partnerTag: {
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  partnerTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.5,
  },
  gpsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.2)',
  },
  gpsToggleBtnActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  gpsToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
  },
  controlIconBtn: {
    padding: 4,
  },
  dealsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  floatingDealItem: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  floatingIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDealCta: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },

  // Embedded Variant Styles
  embeddedWrapper: {
    marginVertical: 10,
  },
  embeddedCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.18)',
    overflow: 'hidden',
  },
  embeddedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sparkleBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconBtn: {
    padding: 6,
  },
  dealsScrollContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  dealCardOuter: {
    width: 170,
  },
  dealCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.15)',
    padding: 10,
  },
  dealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dealIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dealBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  dealCtaRow: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  dealCtaText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
