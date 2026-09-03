// components/map/TripMap.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { LeafletMap } from './LeafletMap';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Stop {
  _id: string;
  name: string;
  emoji?: string;
  location?: { lat: number; lng: number; formattedAddress: string };
  totalSpentBase: number;
  currency: string;
  expenseCount?: number;
}

interface TripMapProps {
  stops: Stop[];
  baseCurrency: string;
  onStopPress?: (stopId: string) => void;
  height?: number;
}

export function TripMap({
  stops,
  baseCurrency,
  onStopPress,
  height = 400,
}: TripMapProps) {
  const theme = useTheme();

  // Move styles INSIDE the component after theme is defined
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      borderRadius: theme.borderRadius['2xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
      backgroundColor: theme.colors.surface,
    },
    map: {
      width: '100%',
      height: height,
    },
    overlayContainer: {
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    statsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      backgroundColor: 'rgba(15,23,42,0.8)',
    },
    statsText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    statsEmoji: {
      fontSize: 14,
    },
    bottomOverlay: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      zIndex: 10,
    },
    stopList: {
      maxHeight: 80,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: 'rgba(15,23,42,0.85)',
      padding: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    stopScroll: {
      gap: 4,
    },
    stopItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: theme.borderRadius.md,
    },
    stopItemActive: {
      backgroundColor: 'rgba(234, 88, 12, 0.15)',
    },
    stopIndex: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopIndexText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
    stopInfo: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    stopName: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    stopAmount: {
      fontSize: 12,
      fontWeight: '700',
      color: '#EA580C',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      borderRadius: theme.borderRadius['2xl'],
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 4,
      color: theme.colors.textPrimary,
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
  });

  const stopsWithLocation = stops.filter(
    s => s.location?.lat && s.location?.lng,
  );

  if (stopsWithLocation.length === 0) {
    return (
      <GlassCard
        style={styles.emptyContainer}
        intensity={theme.isDark ? 10 : 5}
      >
        <AppIcon name="map-pin" size={48} color={theme.colors.textTertiary} />
        <Text style={styles.emptyTitle}>No Locations Yet</Text>
        <Text style={styles.emptyText}>
          Add locations to stops to see them on the map
        </Text>
      </GlassCard>
    );
  }

  const coordinates = stopsWithLocation.map(s => ({
    latitude: s.location!.lat,
    longitude: s.location!.lng,
  }));

  // Calculate center
  const center = coordinates.reduce(
    (acc, c) => ({
      latitude: acc.latitude + c.latitude / coordinates.length,
      longitude: acc.longitude + c.longitude / coordinates.length,
    }),
    { latitude: 0, longitude: 0 },
  );

  const leafletMarkers = stopsWithLocation.map(stop => ({
    id: stop._id,
    latitude: stop.location!.lat,
    longitude: stop.location!.lng,
    name: stop.name,
    subtitle: `₹${stop.totalSpentBase.toLocaleString()}`,
    emoji: stop.emoji || '📍',
    type: 'stop' as const,
  }));

  // Calculate total spent
  const totalSpent = stopsWithLocation.reduce(
    (sum, s) => sum + s.totalSpentBase,
    0,
  );

  return (
    <View style={styles.container}>
      <LeafletMap
        style={styles.map}
        markers={leafletMarkers}
        polylines={coordinates}
        initialRegion={center}
        onMarkerPress={onStopPress}
        darkMode={theme.isDark}
        height={height}
      />

      {/* Top Overlay */}
      <View style={styles.overlayContainer}>
        <View style={styles.statsBadge}>
          <Text style={styles.statsEmoji}>📍</Text>
          <Text style={styles.statsText}>{stopsWithLocation.length} stops</Text>
        </View>
        <View style={styles.statsBadge}>
          <Text style={styles.statsEmoji}>💰</Text>
          <Text style={styles.statsText}>₹{totalSpent.toLocaleString()}</Text>
        </View>
      </View>

      {/* Bottom Overlay */}
      {stopsWithLocation.length > 0 && (
        <View style={styles.bottomOverlay}>
          <View style={styles.stopList}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stopScroll}
            >
              {stopsWithLocation.map((stop, index) => (
                <TouchableOpacity
                  key={stop._id}
                  style={styles.stopItem}
                  onPress={() => onStopPress?.(stop._id)}
                >
                  <View style={styles.stopIndex}>
                    <Text style={styles.stopIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>
                      {stop.emoji || '📍'} {stop.name}
                    </Text>
                    <Text style={styles.stopAmount}>
                      ₹{stop.totalSpentBase.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

// // src/components/map/TripMap.tsx
// import React, { useState, useRef, useCallback, useMemo } from 'react';
// import {
//   View,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   Dimensions,
//   Platform,
//   Animated,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { LeafletMap, LeafletMapRef } from './LeafletMap';
// import { useTheme } from '../../providers/ThemeProvider';
// import { GlassCard } from '../ui/GlassCard';
// import { Typography } from '../ui/Typography';
// import { AmountDisplay } from '../ui/AmountDisplay';
// import { Badge } from '../ui/Badge';
// import { InteractiveWrapper } from '../ui/InteractiveWrapper';
// import { haptics } from '../../utils/haptics';
// import { useResponsive } from '../../hooks/useResponsive';
// import AppIcon from '../common/AppIcon';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// // ─── Types ────────────────────────────────────────────────────

// interface Stop {
//     _id: string;
//     name: string;
//     emoji?: string;
//     location?: { lat: number; lng: number; formattedAddress: string };
//     totalSpentBase: number;
//     currency: string;
//     expenseCount?: number;
//     startDate?: string;
//     endDate?: string;
// }

// interface TripMapProps {
//     stops: Stop[];
//     baseCurrency: string;
//     onStopPress?: (stopId: string) => void;
//     height?: number;
//     interactive?: boolean;
//     showStopList?: boolean;
//     showStats?: boolean;
//     compact?: boolean;
// }

// // ─── Stop List Item ──────────────────────────────────────────

// function StopListItem({
//   stop,
//   index,
//   totalStops,
//   isActive,
//   onPress,
//   theme,
// }: {
//   stop: Stop;
//   index: number;
//   totalStops: number;
//   isActive: boolean;
//   onPress: () => void;
//   theme: any;
// }) {
//   const scaleAnim = useRef(new Animated.Value(1)).current;

//   const handlePressIn = () => {
//     Animated.spring(scaleAnim, {
//       toValue: 0.96,
//       useNativeDriver: true,
//       damping: 15,
//       stiffness: 300,
//     }).start();
//   };

//   const handlePressOut = () => {
//     Animated.spring(scaleAnim, {
//       toValue: 1,
//       useNativeDriver: true,
//       damping: 15,
//       stiffness: 300,
//     }).start();
//   };

//   return (
//     <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
//       <TouchableOpacity
//         onPress={onPress}
//         onPressIn={handlePressIn}
//         onPressOut={handlePressOut}
//         activeOpacity={1}
//         style={[
//           styles.stopItem,
//           isActive && styles.stopItemActive,
//           {
//             borderColor: isActive ? theme.colors.primary : 'transparent',
//             backgroundColor: isActive ? `${theme.colors.primary}10` : 'transparent',
//           }
//         ]}
//       >
//         <View style={[
//           styles.stopIndex,
//           {
//             backgroundColor: isActive ? theme.colors.primary : theme.colors.borderLight,
//           }
//         ]}>
//           <Typography
//             variant="caption"
//             weight="bold"
//             color={isActive ? 'textInverse' : 'textSecondary'}
//             style={styles.stopIndexText}
//           >
//             {index + 1}
//           </Typography>
//         </View>

//         <View style={styles.stopInfo}>
//           <View style={styles.stopNameContainer}>
//             <Typography variant="caption" style={styles.stopEmoji}>
//               {stop.emoji || '📍'}
//             </Typography>
//             <Typography
//               variant="bodySm"
//               weight={isActive ? 'semibold' : 'medium'}
//               color="textPrimary"
//               numberOfLines={1}
//               style={styles.stopName}
//             >
//               {stop.name}
//             </Typography>
//           </View>
//           <AmountDisplay
//             amount={stop.totalSpentBase}
//             currency={stop.currency || 'INR'}
//             size="sm"
//             compact
//             variant="negative"
//           />
//         </View>

//         {stop.expenseCount && stop.expenseCount > 0 && (
//           <Badge
//             label={`${stop.expenseCount} expenses`}
//             variant="neutral"
//             style={styles.stopBadge}
//           />
//         )}
//       </TouchableOpacity>
//     </Animated.View>
//   );
// }

// // ─── Main Component ──────────────────────────────────────────

// export function TripMap({
//   stops,
//   baseCurrency,
//   onStopPress,
//   height = 400,
//   interactive = true,
//   showStopList = true,
//   showStats = true,
//   compact = false,
// }: TripMapProps) {
//   const theme = useTheme();
//   const router = useRouter();
//   const { isMobile } = useResponsive();
//   const mapRef = useRef<LeafletMapRef>(null);
//   const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
//   const [mapReady, setMapReady] = useState(false);

//   // ── Filter stops with location ──
//   const stopsWithLocation = useMemo(() =>
//     stops.filter((s) => s.location?.lat && s.location?.lng),
//     [stops]
//   );

//   // ── Calculate center ──
//   const center = useMemo(() => {
//     if (stopsWithLocation.length === 0) {
//       return { latitude: 20.5937, longitude: 78.9629 };
//     }
//     return stopsWithLocation.reduce(
//       (acc, c) => ({
//         latitude: acc.latitude + c.location!.lat / stopsWithLocation.length,
//         longitude: acc.longitude + c.location!.lng / stopsWithLocation.length
//       }),
//       { latitude: 0, longitude: 0 }
//     );
//   }, [stopsWithLocation]);

//   // ── Prepare markers ──
//   const leafletMarkers = useMemo(() =>
//     stopsWithLocation.map((stop) => ({
//       id: stop._id,
//       latitude: stop.location!.lat,
//       longitude: stop.location!.lng,
//       name: stop.name,
//       subtitle: `${stop.totalSpentBase.toLocaleString()} ${stop.currency || baseCurrency}`,
//       emoji: stop.emoji || '📍',
//       type: 'stop' as const,
//       isHighlighted: selectedStopId === stop._id,
//     })),
//     [stopsWithLocation, baseCurrency, selectedStopId]
//   );

//   // ── Prepare polylines ──
//   const polylines = useMemo(() =>
//     stopsWithLocation.map((s) => ({
//       latitude: s.location!.lat,
//       longitude: s.location!.lng,
//     })),
//     [stopsWithLocation]
//   );

//   // ── Handlers ──
//   const handleMarkerPress = useCallback((markerId: string) => {
//     haptics.light();
//     setSelectedStopId(markerId);
//     if (onStopPress) {
//       onStopPress(markerId);
//     } else {
//       // Navigate to stop details
//       router.push(`/trips/stop/${markerId}`);
//     }
//   }, [onStopPress, router]);

//   const handleStopPress = useCallback((stopId: string) => {
//     haptics.light();
//     setSelectedStopId(stopId);
//     // Animate to stop location
//     const stop = stopsWithLocation.find(s => s._id === stopId);
//     if (stop?.location) {
//       mapRef.current?.flyTo(
//         { latitude: stop.location.lat, longitude: stop.location.lng },
//         14
//       );
//     }
//     if (onStopPress) {
//       onStopPress(stopId);
//     }
//   }, [stopsWithLocation, onStopPress]);

//   const handleMapPress = useCallback((coordinate: { latitude: number; longitude: number }) => {
//     haptics.medium();
//     // Could add a marker or navigate to create stop at location
//     router.push(`/trips/add-stop?lat=${coordinate.latitude}&lng=${coordinate.longitude}`);
//   }, [router]);

//   const handleFitToMarkers = useCallback(() => {
//     haptics.light();
//     mapRef.current?.fitToMarkers();
//   }, []);

//   // ── Calculate totals ──
//   const totalSpent = useMemo(() =>
//     stopsWithLocation.reduce((sum, s) => sum + s.totalSpentBase, 0),
//     [stopsWithLocation]
//   );

//   const totalExpenses = useMemo(() =>
//     stopsWithLocation.reduce((sum, s) => sum + (s.expenseCount || 0), 0),
//     [stopsWithLocation]
//   );

//   // ── Empty State ──
//   if (stopsWithLocation.length === 0) {
//     return (
//       <GlassCard variant="medium" padding="xl" style={styles.emptyContainer}>
//         <View style={styles.emptyContent}>
//           <View style={[styles.emptyIconWrap, { backgroundColor: `${theme.colors.primary}10` }]}>
//             <AppIcon name="map-pin" size={40} color={theme.colors.textTertiary} />
//           </View>
//           <Typography variant="h3" weight="bold" color="textPrimary" style={styles.emptyTitle}>
//             No Locations Yet
//           </Typography>
//           <Typography variant="body" color="textSecondary" style={styles.emptyText}>
//             Add locations to stops to see them on the map
//           </Typography>
//           <InteractiveWrapper onPress={() => router.push('/trips/add-stop')}>
//             <View style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}>
//               <AppIcon name="plus" size={16} color="#FFF" />
//               <Typography variant="caption" weight="bold" color="textInverse">
//                 Add First Stop
//               </Typography>
//             </View>
//           </InteractiveWrapper>
//         </View>
//       </GlassCard>
//     );
//   }

//   // ── Render ──
//   const mapHeight = compact ? Math.min(height, 250) : height;

//   return (
//     <View style={styles.container}>
//       {/* Map */}
//       <View style={[
//         styles.mapContainer,
//         {
//           height: mapHeight,
//           borderRadius: theme.borderRadius['2xl'],
//           borderWidth: 1,
//           borderColor: theme.colors.borderLight,
//         }
//       ]}>
//         <LeafletMap
//           ref={mapRef}
//           style={styles.map}
//           markers={leafletMarkers}
//           polylines={polylines}
//           initialRegion={center}
//           interactive={interactive}
//           onMarkerPress={handleMarkerPress}
//           onMapPress={handleMapPress}
//           onMapReady={() => setMapReady(true)}
//           darkMode={theme.isDark}
//           height={mapHeight}
//           showControls={!compact}
//           controls={{
//             showZoom: true,
//             showFullscreen: !compact,
//             showLocate: true,
//             showLegend: false,
//           }}
//           autoFitOnUpdate={true}
//         />

//         {/* Top Overlay - Stats */}
//         {showStats && !compact && (
//           <View style={styles.overlayContainer}>
//             <View style={[styles.statsBadge, { backgroundColor: theme.isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)' }]}>
//               <Typography variant="body" style={styles.statsEmoji}>📍</Typography>
//               <Typography variant="caption" weight="semibold" color="textPrimary" style={styles.statsText}>
//                 {stopsWithLocation.length} stops
//               </Typography>
//             </View>

//             <View style={[styles.statsBadge, { backgroundColor: theme.isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)' }]}>
//               <Typography variant="body" style={styles.statsEmoji}>💰</Typography>
//               <AmountDisplay
//                 amount={totalSpent}
//                 currency={baseCurrency}
//                 size="sm"
//                 compact
//                 variant="negative"
//               />
//             </View>

//             <InteractiveWrapper onPress={handleFitToMarkers}>
//               <View style={[styles.fitButton, { backgroundColor: theme.isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)' }]}>
//                 <AppIcon name="maximize" size={16} color={theme.colors.textPrimary} />
//               </View>
//             </InteractiveWrapper>
//           </View>
//         )}

//         {/* Bottom Overlay - Stop List */}
//         {showStopList && stopsWithLocation.length > 0 && !compact && (
//           <View style={styles.bottomOverlay}>
//             <GlassCard
//               variant="medium"
//               padding="sm"
//               intensity={theme.isDark ? 30 : 50}
//               style={styles.stopListContainer}
//             >
//               <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.stopScroll}
//                 decelerationRate="fast"
//               >
//                 {stopsWithLocation.map((stop, index) => (
//                   <StopListItem
//                     key={stop._id}
//                     stop={stop}
//                     index={index}
//                     totalStops={stopsWithLocation.length}
//                     isActive={selectedStopId === stop._id}
//                     onPress={() => handleStopPress(stop._id)}
//                     theme={theme}
//                   />
//                 ))}
//               </ScrollView>
//             </GlassCard>
//           </View>
//         )}

//         {/* Compact Bottom Info */}
//         {compact && (
//           <View style={styles.compactOverlay}>
//             <View style={[styles.compactInfo, { backgroundColor: theme.isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)' }]}>
//               <Typography variant="caption" weight="semibold" color="textPrimary">
//                 {stopsWithLocation.length} stops • {totalExpenses} expenses
//               </Typography>
//               <AmountDisplay
//                 amount={totalSpent}
//                 currency={baseCurrency}
//                 size="sm"
//                 compact
//                 variant="negative"
//               />
//             </View>
//           </View>
//         )}
//       </View>

//       {/* Mobile Stop List Below Map */}
//       {showStopList && isMobile && !compact && (
//         <View style={styles.mobileStopList}>
//           {stopsWithLocation.slice(0, 3).map((stop, index) => (
//             <StopListItem
//               key={stop._id}
//               stop={stop}
//               index={index}
//               totalStops={stopsWithLocation.length}
//               isActive={selectedStopId === stop._id}
//               onPress={() => handleStopPress(stop._id)}
//               theme={theme}
//             />
//           ))}
//           {stopsWithLocation.length > 3 && (
//             <InteractiveWrapper onPress={() => router.push('/trips/stops')}>
//               <Typography variant="caption" color="textTertiary" style={styles.seeAllText}>
//                 +{stopsWithLocation.length - 3} more stops
//               </Typography>
//             </InteractiveWrapper>
//           )}
//         </View>
//       )}
//     </View>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   container: {
//     width: '100%',
//     gap: 12,
//   },
//   mapContainer: {
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   map: {
//     width: '100%',
//     height: '100%',
//   },

//   // Overlays
//   overlayContainer: {
//     position: 'absolute',
//     top: 12,
//     left: 12,
//     right: 12,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     zIndex: 10,
//     gap: 8,
//   },
//   statsBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.1)',
//     ...Platform.select({
//       web: { backdropFilter: 'blur(12px)' },
//     }),
//   },
//   statsEmoji: {
//     fontSize: 14,
//     lineHeight: 18,
//   },
//   statsText: {
//     fontSize: 11,
//     lineHeight: 14,
//   },
//   fitButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.1)',
//     ...Platform.select({
//       web: { backdropFilter: 'blur(12px)' },
//     }),
//   },

//   // Bottom Overlay
//   bottomOverlay: {
//     position: 'absolute',
//     bottom: 12,
//     left: 12,
//     right: 12,
//     zIndex: 10,
//   },
//   stopListContainer: {
//     padding: 6,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.06)',
//     overflow: 'hidden',
//   },
//   stopScroll: {
//     gap: 6,
//     paddingHorizontal: 2,
//   },

//   // Stop Item
//   stopItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     borderRadius: 12,
//     borderWidth: 1,
//     minWidth: 180,
//     maxWidth: 260,
//   },
//   stopItemActive: {
//     borderWidth: 1.5,
//   },
//   stopIndex: {
//     width: 22,
//     height: 22,
//     borderRadius: 11,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexShrink: 0,
//   },
//   stopIndexText: {
//     fontSize: 10,
//     lineHeight: 14,
//   },
//   stopInfo: {
//     flex: 1,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     gap: 8,
//     minWidth: 0,
//   },
//   stopNameContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//     flex: 1,
//     minWidth: 0,
//   },
//   stopEmoji: {
//     fontSize: 12,
//     lineHeight: 16,
//   },
//   stopName: {
//     fontSize: 12,
//     lineHeight: 16,
//     flexShrink: 1,
//   },
//   stopBadge: {
//     marginLeft: 4,
//   },

//   // Compact
//   compactOverlay: {
//     position: 'absolute',
//     bottom: 8,
//     left: 8,
//     right: 8,
//     zIndex: 10,
//   },
//   compactInfo: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: 'rgba(255,255,255,0.06)',
//     ...Platform.select({
//       web: { backdropFilter: 'blur(12px)' },
//     }),
//   },

//   // Mobile Stop List
//   mobileStopList: {
//     gap: 6,
//     paddingHorizontal: 4,
//   },
//   seeAllText: {
//     textAlign: 'center',
//     paddingVertical: 8,
//     fontSize: 12,
//     fontWeight: '600',
//   },

//   // Empty State
//   emptyContainer: {
//     padding: 32,
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: 200,
//   },
//   emptyContent: {
//     alignItems: 'center',
//     gap: 12,
//   },
//   emptyIconWrap: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   emptyTitle: {
//     fontSize: 20,
//     marginTop: 4,
//   },
//   emptyText: {
//     fontSize: 14,
//     textAlign: 'center',
//     maxWidth: 280,
//   },
//   emptyButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     borderRadius: 12,
//     marginTop: 8,
//   },
// });

// // ─── Helper Hook ─────────────────────────────────────────────

// export function useTripMap() {
//   const mapRef = useRef<LeafletMapRef>(null);

//   const fitToStops = useCallback(() => {
//     mapRef.current?.fitToMarkers();
//   }, []);

//   const flyToStop = useCallback((latitude: number, longitude: number) => {
//     mapRef.current?.flyTo({ latitude, longitude }, 14);
//   }, []);

//   const animateToStop = useCallback((latitude: number, longitude: number) => {
//     mapRef.current?.animateToRegion({ latitude, longitude }, 14);
//   }, []);

//   const resetView = useCallback(() => {
//     mapRef.current?.resetBounds();
//   }, []);

//   return {
//     mapRef,
//     fitToStops,
//     flyToStop,
//     animateToStop,
//     resetView,
//   };
// }
// // import AppIcon  from '../common/AppIcon';
// // // components/map/TripMap.tsx
// // import React from 'react';
// // import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
// // import { LeafletMap } from './LeafletMap';
// // import { useTheme } from '../../providers/ThemeProvider';
// // import { GlassCard } from '../ui/GlassCard';

// // const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// // interface Stop {
// //     _id: string;
// //     name: string;
// //     emoji?: string;
// //     location?: { lat: number; lng: number; formattedAddress: string };
// //     totalSpentBase: number;
// //     currency: string;
// //     expenseCount?: number;
// // }

// // interface TripMapProps {
// //     stops: Stop[];
// //     baseCurrency: string;
// //     onStopPress?: (stopId: string) => void;
// //     height?: number;
// // }

// // export function TripMap({ stops, baseCurrency, onStopPress, height = 400 }: TripMapProps) {
// //     const theme = useTheme();

// //     // Move styles INSIDE the component after theme is defined
// //     const styles = StyleSheet.create({
// //         container: {
// //             flex: 1,
// //             borderRadius: theme.borderRadius['2xl'],
// //             overflow: 'hidden',
// //             borderWidth: 1,
// //             borderColor: theme.colors.borderLight,
// //             backgroundColor: theme.colors.surface,
// //         },
// //         map: {
// //             width: '100%',
// //             height: height
// //         },
// //         overlayContainer: {
// //             position: 'absolute',
// //             top: 12,
// //             left: 12,
// //             right: 12,
// //             flexDirection: 'row',
// //             justifyContent: 'space-between',
// //             alignItems: 'center',
// //             zIndex: 10,
// //         },
// //         statsBadge: {
// //             flexDirection: 'row',
// //             alignItems: 'center',
// //             gap: 6,
// //             paddingHorizontal: 12,
// //             paddingVertical: 6,
// //             borderRadius: theme.borderRadius.full,
// //             borderWidth: 1,
// //             borderColor: 'rgba(255,255,255,0.2)',
// //             backgroundColor: 'rgba(15,23,42,0.8)',
// //         },
// //         statsText: {
// //             fontSize: 11,
// //             fontWeight: '700',
// //             color: '#FFFFFF',
// //         },
// //         statsEmoji: {
// //             fontSize: 14,
// //         },
// //         bottomOverlay: {
// //             position: 'absolute',
// //             bottom: 16,
// //             left: 16,
// //             right: 16,
// //             zIndex: 10,
// //         },
// //         stopList: {
// //             maxHeight: 80,
// //             borderRadius: theme.borderRadius.lg,
// //             backgroundColor: 'rgba(15,23,42,0.85)',
// //             padding: 8,
// //             borderWidth: 1,
// //             borderColor: 'rgba(255,255,255,0.08)',
// //         },
// //         stopScroll: {
// //             gap: 4,
// //         },
// //         stopItem: {
// //             flexDirection: 'row',
// //             alignItems: 'center',
// //             gap: 10,
// //             paddingVertical: 6,
// //             paddingHorizontal: 10,
// //             borderRadius: theme.borderRadius.md,
// //         },
// //         stopItemActive: {
// //             backgroundColor: 'rgba(234, 88, 12, 0.15)',
// //         },
// //         stopIndex: {
// //             width: 22,
// //             height: 22,
// //             borderRadius: 11,
// //             backgroundColor: theme.colors.primary,
// //             alignItems: 'center',
// //             justifyContent: 'center',
// //         },
// //         stopIndexText: {
// //             color: '#FFFFFF',
// //             fontSize: 10,
// //             fontWeight: '800',
// //         },
// //         stopInfo: {
// //             flex: 1,
// //             flexDirection: 'row',
// //             justifyContent: 'space-between',
// //             alignItems: 'center',
// //         },
// //         stopName: {
// //             fontSize: 12,
// //             fontWeight: '600',
// //             color: '#FFFFFF',
// //         },
// //         stopAmount: {
// //             fontSize: 12,
// //             fontWeight: '700',
// //             color: '#EA580C',
// //         },
// //         emptyContainer: {
// //             alignItems: 'center',
// //             justifyContent: 'center',
// //             padding: 24,
// //             borderRadius: theme.borderRadius['2xl'],
// //             borderWidth: 1,
// //             borderColor: theme.colors.borderLight,
// //         },
// //         emptyTitle: {
// //             fontSize: 18,
// //             fontWeight: '700',
// //             marginTop: 16,
// //             marginBottom: 4,
// //             color: theme.colors.textPrimary,
// //         },
// //         emptyText: {
// //             fontSize: 14,
// //             textAlign: 'center',
// //             fontWeight: '500',
// //             color: theme.colors.textSecondary,
// //         },
// //     });

// //     const stopsWithLocation = stops.filter((s) => s.location?.lat && s.location?.lng);

// //     if (stopsWithLocation.length === 0) {
// //         return (
// //             <GlassCard
// //                 style={styles.emptyContainer}
// //                 intensity={theme.isDark ? 10 : 5}
// //             >
// //                 <AppIcon name="map-pin" size={48} color={theme.colors.textTertiary} />
// //                 <Text style={styles.emptyTitle}>
// //                     No Locations Yet
// //                 </Text>
// //                 <Text style={styles.emptyText}>
// //                     Add locations to stops to see them on the map
// //                 </Text>
// //             </GlassCard>
// //         );
// //     }

// //     const coordinates = stopsWithLocation.map((s) => ({
// //         latitude: s.location!.lat,
// //         longitude: s.location!.lng,
// //     }));

// //     // Calculate center
// //     const center = coordinates.reduce(
// //         (acc, c) => ({
// //             latitude: acc.latitude + c.latitude / coordinates.length,
// //             longitude: acc.longitude + c.longitude / coordinates.length
// //         }),
// //         { latitude: 0, longitude: 0 }
// //     );

// //     const leafletMarkers = stopsWithLocation.map((stop) => ({
// //         id: stop._id,
// //         latitude: stop.location!.lat,
// //         longitude: stop.location!.lng,
// //         name: stop.name,
// //         subtitle: `₹${stop.totalSpentBase.toLocaleString()}`,
// //         emoji: stop.emoji || '📍',
// //         type: 'stop' as const,
// //     }));

// //     // Calculate total spent
// //     const totalSpent = stopsWithLocation.reduce((sum, s) => sum + s.totalSpentBase, 0);

// //     return (
// //         <View style={styles.container}>
// //             <LeafletMap
// //                 style={styles.map}
// //                 markers={leafletMarkers}
// //                 polylines={coordinates}
// //                 initialRegion={center}
// //                 onMarkerPress={onStopPress}
// //                 darkMode={theme.isDark}
// //                 height={height}
// //             />

// //             {/* Top Overlay */}
// //             <View style={styles.overlayContainer}>
// //                 <View style={styles.statsBadge}>
// //                     <Text style={styles.statsEmoji}>📍</Text>
// //                     <Text style={styles.statsText}>
// //                         {stopsWithLocation.length} stops
// //                     </Text>
// //                 </View>
// //                 <View style={styles.statsBadge}>
// //                     <Text style={styles.statsEmoji}>💰</Text>
// //                     <Text style={styles.statsText}>
// //                         ₹{totalSpent.toLocaleString()}
// //                     </Text>
// //                 </View>
// //             </View>

// //             {/* Bottom Overlay */}
// //             {stopsWithLocation.length > 0 && (
// //                 <View style={styles.bottomOverlay}>
// //                     <View style={styles.stopList}>
// //                         <ScrollView
// //                             horizontal
// //                             showsHorizontalScrollIndicator={false}
// //                             contentContainerStyle={styles.stopScroll}
// //                         >
// //                             {stopsWithLocation.map((stop, index) => (
// //                                 <TouchableOpacity
// //                                     key={stop._id}
// //                                     style={styles.stopItem}
// //                                     onPress={() => onStopPress?.(stop._id)}
// //                                 >
// //                                     <View style={styles.stopIndex}>
// //                                         <Text style={styles.stopIndexText}>{index + 1}</Text>
// //                                     </View>
// //                                     <View style={styles.stopInfo}>
// //                                         <Text style={styles.stopName}>
// //                                             {stop.emoji || '📍'} {stop.name}
// //                                         </Text>
// //                                         <Text style={styles.stopAmount}>
// //                                             ₹{stop.totalSpentBase.toLocaleString()}
// //                                         </Text>
// //                                     </View>
// //                                 </TouchableOpacity>
// //                             ))}
// //                         </ScrollView>
// //                     </View>
// //                 </View>
// //             )}
// //         </View>
// //     );
// // }
