import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Circle, Polyline, G } from 'react-native-svg';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import { IconPin } from '../icons/LandingIcons';

const MAP_STOPS = [
  {
    id: '1',
    name: 'Goa Airport',
    x: 40,
    y: 140,
    date: 'Aug 16',
    spend: '₹1,200',
  },
  {
    id: '2',
    name: 'Panjim City',
    x: 100,
    y: 95,
    date: 'Aug 17',
    spend: '₹6,840',
  },
  {
    id: '3',
    name: 'Baga Beach',
    x: 180,
    y: 50,
    date: 'Aug 18',
    spend: '₹21,300',
  },
  {
    id: '4',
    name: 'Anjuna Bay',
    x: 260,
    y: 75,
    date: 'Aug 19',
    spend: '₹4,420',
  },
];

export function InteractiveMapSection() {
  const [activeStop, setActiveStop] = useState(2);
  const current = MAP_STOPS[activeStop] || MAP_STOPS[0]!;
  const polylinePoints = MAP_STOPS.map(s => `${s.x},${s.y}`).join(' ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <IconPin size={16} color={colors.brand.primary} />
          <Text style={styles.badgeText}>GEOGRAPHIC EXPENSE TRACKER</Text>
        </View>
        <Text style={styles.title}>Map Route & Locations</Text>
      </View>

      <View style={styles.mapCanvas}>
        <Svg width="100%" height={190} viewBox="0 0 300 180">
          {/* Light theme grid lines */}
          <Path
            d="M0 45 H300 M0 90 H300 M0 135 H300"
            stroke={colors.light.borderStrong}
            strokeWidth={1}
          />
          <Path
            d="M75 0 V180 M150 0 V180 M225 0 V180"
            stroke={colors.light.borderStrong}
            strokeWidth={1}
          />

          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={colors.brand.primary}
            strokeWidth={3}
            strokeDasharray="6, 6"
          />

          {MAP_STOPS.map((stop, idx) => {
            const isActive = idx === activeStop;
            return (
              <G key={stop.id}>
                {isActive && (
                  <Circle
                    cx={stop.x}
                    cy={stop.y}
                    r={12}
                    fill="none"
                    stroke="rgba(37, 99, 235, 0.3)"
                    strokeWidth={3}
                  />
                )}
                <Circle
                  cx={stop.x}
                  cy={stop.y}
                  r={isActive ? 8 : 5}
                  fill={isActive ? colors.brand.primary : colors.light.surface}
                  stroke={colors.brand.primary}
                  strokeWidth={isActive ? 3 : 2}
                  onPress={() => setActiveStop(idx)}
                />
              </G>
            );
          })}
        </Svg>

        <View style={styles.stopCard}>
          <View style={styles.stopCardTop}>
            <Text style={styles.stopCardTitle}>{current.name}</Text>
            <Text style={styles.stopCardDate}>{current.date}</Text>
          </View>
          <Text style={styles.stopCardSpend}>Spend here: {current.spend}</Text>
        </View>
      </View>

      <View style={styles.stopsRow}>
        {MAP_STOPS.map((stop, idx) => {
          const isActive = idx === activeStop;
          return (
            <Pressable
              key={stop.id}
              onPress={() => setActiveStop(idx)}
              style={[styles.stopChip, isActive && styles.stopChipActive]}
            >
              <Text
                style={[
                  styles.stopChipText,
                  isActive && styles.stopChipTextActive,
                ]}
              >
                {stop.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadow.cardHover,
    marginBottom: spacing.sectionSm,
  },
  header: {
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.label,
    color: colors.brand.primary,
    marginLeft: 6,
  },
  title: {
    ...typography.heading3.mobile,
    color: colors.light.textPrimary,
  },
  mapCanvas: {
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.xl,
    padding: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  stopCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: colors.light.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadow.card,
  },
  stopCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.light.textPrimary,
  },
  stopCardDate: {
    fontSize: 11,
    color: colors.light.textMuted,
  },
  stopCardSpend: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.primary,
    marginTop: 2,
  },
  stopsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  stopChip: {
    backgroundColor: colors.light.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  stopChipActive: {
    backgroundColor: colors.brand.primarySoft,
    borderColor: colors.brand.primary,
  },
  stopChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.light.textSecondary,
  },
  stopChipTextActive: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
});
