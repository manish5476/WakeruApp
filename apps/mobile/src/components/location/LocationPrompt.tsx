// src/components/ui/LocationPrompt.tsx (Fixed Version)
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';

import { haptics } from '../../utils/haptics';
import { locationApi } from '../../services/api/location.api';
import AppIcon from '../common/AppIcon';
import { GlassCard, Typography, Badge } from '../ui';

// --- Types ---
interface LocationData {
  country: string;
  countryName: string;
  currency: string;
  emoji: string;
  city: string;
  region?: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  timezone?: string;
}

interface LocationPromptProps {
  tripId: string;
  onStopCreated?: () => void;
  onLocationDetected?: (location: LocationData) => void;
  autoDetect?: boolean;
  title?: string;
  subtitle?: string;
  showLocationCard?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  skeleton?: boolean;
}

// --- Loading Skeleton ---
const LocationSkeleton = () => {
  const theme = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        withTiming(0, { duration: 1000, easing: Easing.linear }),
      ),
      -1,
      true,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + 0.3 * shimmer.value,
  }));

  return (
    <GlassCard variant="medium" padding="md" style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <View
          style={[
            styles.skeletonIcon,
            { backgroundColor: theme.colors.border },
          ]}
        />
        <View style={styles.skeletonContent}>
          <Animated.View
            style={[
              styles.skeletonLine,
              {
                backgroundColor: theme.colors.border,
                width: '60%',
              },
              shimmerStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonLine,
              {
                backgroundColor: theme.colors.border,
                width: '40%',
                marginTop: 6,
              },
              shimmerStyle,
            ]}
          />
        </View>
      </View>
    </GlassCard>
  );
};

// --- Main Component ---
export function LocationPrompt({
  tripId,
  onStopCreated,
  onLocationDetected,
  autoDetect = false,
  title = 'Detect Location',
  subtitle = 'Auto-create a stop based on your location',
  showLocationCard = true,
  variant = 'default',
  skeleton = false,
}: LocationPromptProps) {
  const theme = useTheme();
  const [locationInfo, setLocationInfo] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Animation Values ---
  const pulse = useSharedValue(1);
  const cardTranslateY = useSharedValue(20);
  const cardOpacity = useSharedValue(0);

  // --- Auto Detect ---
  useEffect(() => {
    if (autoDetect) {
      detectLocation();
    }
  }, [autoDetect]);

  // --- Animation Effects ---
  useEffect(() => {
    if (locationInfo) {
      cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 150 });
      cardOpacity.value = withTiming(1, { duration: 400 });
    }
  }, [locationInfo]);

  // --- Detect Location ---
  const detectLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      haptics.medium();

      // Pulse animation
      pulse.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(1, { duration: 200 }),
      );

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Location permission is required to detect your current location.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ],
        );
        setLoading(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { lat, lng } = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      // Reverse geocode
      const geoRes = (await locationApi.getLocationInfo(lat, lng)) as any;
      const place = geoRes?.data;

      if (place) {
        const locationData: LocationData = {
          country: place.countryCode || 'IN',
          countryName: place.country || 'India',
          currency: place.currency || 'INR',
          emoji: place.emoji || '📍',
          city: place.city || place.state || 'Unknown',
          region: place.state,
          latitude: lat,
          longitude: lng,
          formattedAddress:
            place.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          timezone: place.timezone,
        };

        setLocationInfo(locationData);
        haptics.success();

        if (onLocationDetected) {
          onLocationDetected(locationData);
        }
      } else {
        // Fallback
        const locationData: LocationData = {
          country: 'IN',
          countryName: 'India',
          currency: 'INR',
          emoji: '🇮🇳',
          city: 'Unknown',
          latitude: lat,
          longitude: lng,
          formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        };
        setLocationInfo(locationData);
        haptics.success();

        if (onLocationDetected) {
          onLocationDetected(locationData);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Could not detect location';
      setError(errorMessage);
      haptics.error?.();

      Alert.alert(
        'Location Error',
        'Could not detect your location. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Create Stop ---
  const handleCreateStop = () => {
    haptics.medium();
    if (onStopCreated) {
      onStopCreated();
    }
  };

  // --- Retry ---
  const handleRetry = () => {
    haptics.light();
    detectLocation();
  };

  // --- Animated Styles ---
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  // --- Variant Config ---
  const config = {
    default: {
      padding: theme.spacing.lg,
      iconSize: 44,
      titleVariant: 'body' as const,
      subtitleVariant: 'caption' as const,
      showBadge: true,
    },
    compact: {
      padding: theme.spacing.md,
      iconSize: 36,
      titleVariant: 'bodySm' as const,
      subtitleVariant: 'caption' as const,
      showBadge: false,
    },
    minimal: {
      padding: theme.spacing.sm,
      iconSize: 32,
      titleVariant: 'caption' as const,
      subtitleVariant: 'caption' as const,
      showBadge: false,
    },
  };

  const currentConfig = config[variant];

  // --- Render Skeleton ---
  if (skeleton) {
    return <LocationSkeleton />;
  }

  // --- Render Error ---
  if (error) {
    return (
      <Animated.View style={styles.container}>
        <GlassCard
          variant="medium"
          padding="md"
          style={[
            styles.errorCard,
            { borderColor: theme.colors.danger + '30' },
          ]}
        >
          <View style={styles.errorContent}>
            <View
              style={[
                styles.errorIcon,
                { backgroundColor: theme.colors.dangerBg },
              ]}
            >
              <AppIcon
                name="alert-circle"
                size={24}
                color={theme.colors.danger}
              />
            </View>
            <View style={styles.errorTextContent}>
              <Typography variant="body" weight="semibold" color="textPrimary">
                Location Error
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {error}
              </Typography>
            </View>
            <TouchableOpacity
              style={[
                styles.retryButton,
                {
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                },
              ]}
              onPress={handleRetry}
            >
              <Typography
                variant="caption"
                weight="semibold"
                color="textInverse"
              >
                Retry
              </Typography>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  // --- Render Location Prompt ---
  if (!locationInfo) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={detectLocation}
          disabled={loading}
          activeOpacity={0.8}
        >
          <GlassCard
            variant="prominent"
            padding="none"
            style={styles.promptCard}
          >
            <LinearGradient
              colors={theme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promptGradient}
            >
              <View
                style={[
                  styles.promptIconWrap,
                  {
                    width: currentConfig.iconSize,
                    height: currentConfig.iconSize,
                    borderRadius: currentConfig.iconSize / 2,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <AppIcon name="map-pin" size={20} color="#FFF" />
                )}
              </View>

              <View style={styles.promptContent}>
                <Typography
                  variant={currentConfig.titleVariant}
                  weight="semibold"
                  color="textInverse"
                >
                  {loading ? 'Detecting Location...' : title}
                </Typography>
                <Typography
                  variant={currentConfig.subtitleVariant}
                  color="textInverse"
                  style={styles.promptSub}
                  opacity={0.8}
                >
                  {loading ? 'Getting your current position' : subtitle}
                </Typography>
              </View>

              {!loading && (
                <AppIcon
                  name="chevron-right"
                  size={18}
                  color="rgba(255,255,255,0.5)"
                />
              )}
            </LinearGradient>
          </GlassCard>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Render Location Card ---
  if (!showLocationCard) return null;

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      <GlassCard variant="prominent" padding="md" style={styles.locationCard}>
        <View style={styles.locationContent}>
          {/* Emoji */}
          <Animated.View style={[styles.locationEmojiWrap, pulseStyle]}>
            <Typography variant="display" style={styles.locationEmoji}>
              {locationInfo.emoji}
            </Typography>
          </Animated.View>

          {/* Location Info */}
          <View style={styles.locationInfo}>
            <Typography variant="body" weight="semibold" color="textPrimary">
              You're in {locationInfo.city}, {locationInfo.countryName}
            </Typography>
            <View style={styles.locationMeta}>
              <Typography variant="caption" color="textSecondary">
                Currency: {locationInfo.currency}
              </Typography>
              {currentConfig.showBadge && (
                <Badge label="Detected" variant="success" />
              )}
            </View>
            {locationInfo.formattedAddress && (
              <Typography
                variant="caption"
                color="textTertiary"
                style={styles.addressText}
              >
                {locationInfo.formattedAddress}
              </Typography>
            )}
          </View>

          {/* Actions */}
          <View style={styles.locationActions}>
            <TouchableOpacity
              style={[
                styles.refreshBtn,
                { backgroundColor: theme.colors.secondaryBg },
              ]}
              onPress={detectLocation}
              disabled={loading}
            >
              <AppIcon
                name="refresh-cw"
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleCreateStop}
            >
              <AppIcon name="plus" size={14} color="#FFF" />
              <Typography
                variant="caption"
                weight="semibold"
                color="textInverse"
              >
                Create
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.loadingOverlay,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(0,0,0,0.5)'
                  : 'rgba(255,255,255,0.5)',
                borderRadius: theme.borderRadius.xl,
              },
            ]}
          >
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  promptCard: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  promptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    minHeight: 64,
  },
  promptIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  promptContent: {
    flex: 1,
    gap: 2,
  },
  promptSub: {
    opacity: 0.8,
  },
  locationCard: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationEmojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  locationEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  locationInfo: {
    flex: 1,
    gap: 4,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  addressText: {
    marginTop: 2,
    opacity: 0.6,
  },
  locationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  errorCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTextContent: {
    flex: 1,
    gap: 2,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  // Skeleton Styles
  skeletonCard: {
    padding: 16,
    borderRadius: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  skeletonContent: {
    flex: 1,
    gap: 4,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});

// import GlobalLoader from '../common/GlobalLoader';
// import AppIcon from '../common/AppIcon';
// // components/ui/LocationPrompt.tsx
// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import * as Location from 'expo-location';
// import { useTheme } from '../../providers/ThemeProvider';
// import { Badge } from '../ui/Badge';
// import { GlassCard } from '../ui/GlassCard';
// import { locationApi } from '../../services/api/location.api';

// interface LocationPromptProps {
//     tripId: string;
//     onStopCreated?: () => void;
//     onLocationDetected?: (location: any) => void;
// }

// export function LocationPrompt({ tripId, onStopCreated, onLocationDetected }: LocationPromptProps) {
//     const theme = useTheme();
//     const [locationInfo, setLocationInfo] = React.useState<any>(null);
//     const [loading, setLoading] = React.useState(false);
//     const [error, setError] = React.useState<string | null>(null);

//     const openAppSettings = () => {
//         if (Platform.OS === 'ios') {
//             Linking.openURL('app-settings:');
//         } else {
//             Linking.openSettings();
//         }
//     };

//     const detectLocation = async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             const { status } = await Location.requestForegroundPermissionsAsync();
//             if (status !== 'granted') {
//                 Alert.alert(
//                     'Permission Needed',
//                     'Location permission is required to detect your current location. Please grant permission in settings.',
//                     [
//                         { text: 'Cancel', style: 'cancel' },
//                         { text: 'Settings', onPress: openAppSettings }
//                     ]
//                 );
//                 setLoading(false);
//                 return;
//             }

//             const location = await Location.getCurrentPositionAsync({
//                 accuracy: Location.Accuracy.Balanced,
//             });

//             // Use the backend reverse-geocode API (150+ countries, consistent currency data)
//             const { lat, lng } = { lat: location.coords.latitude, lng: location.coords.longitude };
//             const geoRes = await locationApi.getLocationInfo(lat, lng) as any;
//             const place = geoRes?.data;

//             if (place) {
//                 const locationData = {
//                     country: place.countryCode || 'IN',
//                     countryName: place.country || 'India',
//                     currency: place.currency || 'INR',
//                     emoji: place.emoji || '📍',
//                     city: place.city || place.state || 'Unknown',
//                     region: place.state,
//                     latitude: lat,
//                     longitude: lng,
//                     formattedAddress: place.formattedAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
//                     timezone: place.timezone,
//                 };

//                 setLocationInfo(locationData);
//                 if (onLocationDetected) {
//                     onLocationDetected(locationData);
//                 }
//             } else {
//                 // Fallback if backend geocode fails
//                 const locationData = {
//                     country: 'IN',
//                     countryName: 'India',
//                     currency: 'INR',
//                     emoji: '🇮🇳',
//                     city: 'Unknown',
//                     latitude: lat,
//                     longitude: lng,
//                     formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
//                 };
//                 setLocationInfo(locationData);
//                 if (onLocationDetected) {
//                     onLocationDetected(locationData);
//                 }
//             }
//         } catch (error: any) {
//             setError(error.message || 'Could not detect location');
//             Alert.alert(
//                 'Location Error',
//                 'Could not detect your location. Please try again or enter your location manually.',
//                 [{ text: 'OK' }]
//             );
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleCreateStop = () => {
//         if (onStopCreated) {
//             onStopCreated();
//         }
//     };

//     const styles = StyleSheet.create({
//         container: {
//             marginBottom: theme.spacing['4'],
//         },
//         promptButton: {
//             borderRadius: theme.borderRadius.xl,
//             overflow: 'hidden',
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
//         },
//         promptGradient: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing['3'],
//             padding: theme.spacing['4'],
//         },
//         promptIconWrap: {
//             width: 44,
//             height: 44,
//             borderRadius: 22,
//             backgroundColor: 'rgba(255,255,255,0.15)',
//             alignItems: 'center',
//             justifyContent: 'center',
//         },
//         promptContent: {
//             flex: 1,
//         },
//         promptTitle: {
//             fontSize: theme.typography.fontSize.sm,
//             fontWeight: theme.typography.fontWeight.semibold,
//             color: '#FFFFFF',
//         },
//         promptSub: {
//             fontSize: theme.typography.fontSize.xs,
//             color: 'rgba(255,255,255,0.8)',
//             marginTop: 2,
//             fontWeight: '500',
//         },
//         promptLoading: {
//             marginLeft: theme.spacing['2'],
//         },
//         locationCard: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing['3'],
//             padding: theme.spacing['4'],
//             borderRadius: theme.borderRadius.xl,
//             borderWidth: 1,
//             borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
//         },
//         locationEmoji: {
//             fontSize: 32,
//         },
//         locationInfo: {
//             flex: 1,
//         },
//         locationTitle: {
//             fontSize: theme.typography.fontSize.sm,
//             fontWeight: theme.typography.fontWeight.semibold,
//             color: theme.colors.textPrimary,
//         },
//         locationSub: {
//             fontSize: theme.typography.fontSize.xs,
//             color: theme.colors.textSecondary,
//             marginTop: 2,
//             fontWeight: '500',
//         },
//         locationActions: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: theme.spacing['2'],
//         },
//         createBtn: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             gap: 4,
//             backgroundColor: theme.colors.primary,
//             paddingHorizontal: theme.spacing['3'],
//             paddingVertical: theme.spacing['2'],
//             borderRadius: theme.borderRadius.lg,
//         },
//         createBtnText: {
//             color: '#FFFFFF',
//             fontSize: theme.typography.fontSize.sm,
//             fontWeight: theme.typography.fontWeight.semibold,
//         },
//         refreshBtn: {
//             padding: theme.spacing['2'],
//             borderRadius: theme.borderRadius.full,
//             backgroundColor: theme.colors.secondaryBg,
//         },
//         errorText: {
//             fontSize: theme.typography.fontSize.xs,
//             color: theme.colors.danger,
//             marginTop: theme.spacing['1'],
//             fontWeight: '500',
//         },
//         badge: {
//             paddingHorizontal: 6,
//             paddingVertical: 1,
//         },
//     });

//     if (error) {
//         return (
//             <View style={styles.container}>
//                 <GlassCard style={styles.promptButton} intensity={theme.isDark ? 15 : 8}>
//                     <View style={styles.promptGradient}>
//                         <View style={styles.promptIconWrap}>
//                             <AppIcon name="alert-circle" size={20} color="#FFF" />
//                         </View>
//                         <View style={styles.promptContent}>
//                             <Text style={styles.promptTitle}>Location Error</Text>
//                             <Text style={styles.promptSub}>{error}</Text>
//                         </View>
//                         <TouchableOpacity onPress={detectLocation} style={styles.refreshBtn}>
//                             <AppIcon name="refresh-cw" size={16} color="#FFF" />
//                         </TouchableOpacity>
//                     </View>
//                 </GlassCard>
//             </View>
//         );
//     }

//     if (!locationInfo) {
//         return (
//             <View style={styles.container}>
//                 <TouchableOpacity
//                     style={styles.promptButton}
//                     onPress={detectLocation}
//                     activeOpacity={0.8}
//                     disabled={loading}
//                 >
//                     <LinearGradient
//                         colors={theme.gradients.primary}
//                         start={{ x: 0, y: 0 }}
//                         end={{ x: 1, y: 1 }}
//                         style={styles.promptGradient}
//                     >
//                         <View style={styles.promptIconWrap}>
//                             {loading ? (
//                                 <GlobalLoader variant="inline" color="#FFF" size="small" />
//                             ) : (
//                                 <AppIcon name="map-pin" size={20} color="#FFF" />
//                             )}
//                         </View>
//                         <View style={styles.promptContent}>
//                             <Text style={styles.promptTitle}>
//                                 {loading ? 'Detecting Location...' : 'Detect Location'}
//                             </Text>
//                             <Text style={styles.promptSub}>
//                                 {loading ? 'Getting your current position' : 'Auto-create a stop based on your location'}
//                             </Text>
//                         </View>
//                         {!loading && (
//                             <AppIcon name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
//                         )}
//                     </LinearGradient>
//                 </TouchableOpacity>
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             <GlassCard style={styles.locationCard} intensity={theme.isDark ? 12 : 6}>
//                 <Text style={styles.locationEmoji}>{locationInfo.emoji}</Text>
//                 <View style={styles.locationInfo}>
//                     <Text style={styles.locationTitle}>
//                         You're in {locationInfo.city}, {locationInfo.countryName}
//                     </Text>
//                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
//                         <Text style={styles.locationSub}>
//                             Currency: {locationInfo.currency}
//                         </Text>
//                         <Badge label="Detected" variant="success" style={styles.badge} />
//                     </View>
//                 </View>
//                 <View style={styles.locationActions}>
//                     <TouchableOpacity
//                         style={styles.refreshBtn}
//                         onPress={detectLocation}
//                         disabled={loading}
//                     >
//                         <AppIcon name="refresh-cw" size={14} color={theme.colors.textSecondary} />
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                         style={styles.createBtn}
//                         onPress={handleCreateStop}
//                     >
//                         <AppIcon name="plus" size={14} color="#FFF" />
//                         <Text style={styles.createBtnText}>Create</Text>
//                     </TouchableOpacity>
//                 </View>
//             </GlassCard>
//         </View>
//     );
// }
