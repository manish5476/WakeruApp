// src/components/trips/StopDetails/MiniMapCard.tsx
import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import AppIcon from '../../common/AppIcon';
import { GlassCard } from '../../ui';
import { LocationPreviewUI } from './PresentationModels';
import { LeafletMap } from '../../map/LeafletMap';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { haptics } from '../../../utils/haptics';

interface Props {
  data: LocationPreviewUI;
  onPressMap: () => void;
  onPressNavigate?: () => void;
}

export function MiniMapCard({ data, onPressMap, onPressNavigate }: Props) {
  const theme = useTheme();

  const handleCopy = async () => {
    haptics.selection();
    await Clipboard.setStringAsync(
      `${data.coordinates.lat}, ${data.coordinates.lng}`,
    );
  };

  const handleDirections = () => {
    haptics.light();
    if (onPressNavigate) {
      onPressNavigate();
    } else {
      const url = Platform.select({
        ios: `maps://app?daddr=${data.coordinates.lat},${data.coordinates.lng}`,
        android: `google.navigation:q=${data.coordinates.lat},${data.coordinates.lng}`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${data.coordinates.lat},${data.coordinates.lng}`,
      });
      Linking.openURL(url as string);
    }
  };

  const markers = useMemo(
    () => [
      {
        id: 'stop-pin',
        latitude: data.coordinates.lat,
        longitude: data.coordinates.lng,
        name: data.address || 'Destination',
        emoji: '\uD83D\uDCCD',
        type: 'stop' as const,
      },
    ],
    [data.coordinates, data.address],
  );

  return (
    <Animated.View
      entering={FadeInUp.delay(160).duration(400)}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Location & Map
          </Text>
        </View>
        {data.distanceFromPrevious && (
          <View style={styles.distancePill}>
            <AppIcon name="navigation-2" size={12} color="#EA580C" />
            <Text style={styles.distanceText}>{data.distanceFromPrevious}</Text>
          </View>
        )}
      </View>

      <GlassCard
        variant="prominent"
        padding="none"
        style={styles.card}
        intensity={theme.isDark ? 35 : 55}
      >
        {/* Live Embedded Mini Map */}
        <View style={styles.mapContainer}>
          <LeafletMap
            style={styles.map}
            markers={markers}
            initialRegion={{
              latitude: data.coordinates.lat,
              longitude: data.coordinates.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showControls={false}
            controls={{
              showZoom: false,
              showFullscreen: false,
              showLocate: false,
              showScale: false,
              showAttribution: false,
              showLayerToggle: false,
            }}
            darkMode={theme.isDark}
          />

          {/* Floating Controls Overlay */}
          <View style={styles.mapControlsOverlay}>
            <TouchableOpacity
              style={styles.floatingActionBtn}
              onPress={onPressMap}
              activeOpacity={0.8}
            >
              <AppIcon name="maximize-2" size={13} color="#FFF" />
              <Text style={styles.floatingActionText}>Full Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.floatingActionBtn, { backgroundColor: '#EA580C' }]}
              onPress={handleDirections}
              activeOpacity={0.8}
            >
              <AppIcon name="navigation" size={13} color="#FFF" />
              <Text style={styles.floatingActionText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer with Address & Coordinates */}
        <View
          style={[styles.footer, { borderTopColor: theme.colors.borderLight }]}
        >
          <View style={styles.addressRow}>
            <View style={styles.pinBubble}>
              <AppIcon name="map-pin" size={15} color="#EA580C" />
            </View>
            <View style={styles.addressTextWrap}>
              <Text
                style={[styles.address, { color: theme.colors.textPrimary }]}
                numberOfLines={2}
              >
                {data.address}
              </Text>
              <View style={styles.coordRow}>
                <Text
                  style={[
                    styles.coordinates,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {data.coordinates.lat.toFixed(4)},{' '}
                  {data.coordinates.lng.toFixed(4)}
                </Text>
                <TouchableOpacity
                  onPress={handleCopy}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={styles.copyPill}>
                    <AppIcon
                      name="copy"
                      size={11}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.copyText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Copy
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
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
  mapContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapControlsOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 50,
  },
  floatingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(12px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 5,
    cursor: 'pointer',
  } as any,
  floatingActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pinBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextWrap: {
    flex: 1,
    gap: 3,
  },
  address: {
    fontSize: 13,
    fontWeight: '700',
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordinates: {
    fontSize: 11,
    fontWeight: '600',
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  copyText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
