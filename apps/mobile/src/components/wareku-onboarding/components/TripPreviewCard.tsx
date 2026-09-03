import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppIcon from '../../common/AppIcon';
import UserAvatarGroup from './UserAvatarGroup';
import { colors, radius, spacing, shadow } from '../theme/tokens';

interface Stop {
  city: string;
  dates: string;
}

interface TripPreviewCardProps {
  tripName: string;
  travelers: { name: string; uri: string }[];
  stops: Stop[];
}

/**
 * A believable slice of real Wareku product UI — trip name, member
 * avatars, and a vertical route timeline (Paris → Dubai → Rome).
 * This is the visual anchor for the "Smart Trip Planning" screen.
 */
export default function TripPreviewCard({
  tripName,
  travelers,
  stops,
}: TripPreviewCardProps) {
  return (
    <View style={[styles.card, shadow.card]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ACTIVE TRIP</Text>
          <Text style={styles.tripName}>{tripName}</Text>
        </View>
        <UserAvatarGroup
          travelers={travelers}
          size={30}
          ringColor={colors.surfaceDark}
        />
      </View>

      {/* Route timeline */}
      <View style={styles.timeline}>
        {stops.map((stop, i) => (
          <View key={stop.city} style={styles.stopRow}>
            <View style={styles.railColumn}>
              <View style={[styles.node, i === 0 && styles.nodeActive]}>
                {i === 0 && <View style={styles.nodePulse} />}
              </View>
              {i < stops.length - 1 && <View style={styles.rail} />}
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopCity}>{stop.city}</Text>
              <Text style={styles.stopDates}>{stop.dates}</Text>
            </View>
            {i === 0 && (
              <View style={styles.nowPill}>
                <Text style={styles.nowText}>NOW</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Footer action */}
      <LinearGradient
        colors={colors.gradientBrand as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.footerBtn}
      >
        <AppIcon name="calendar-plus" size={14} color={colors.textOnDark} />
        <Text style={styles.footerBtnText}>Add next destination</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.travelCyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  tripName: { color: colors.textOnDark, fontSize: 19, fontWeight: '800' },
  timeline: { marginBottom: spacing.lg },
  stopRow: { flexDirection: 'row', alignItems: 'center' },
  railColumn: { alignItems: 'center', width: 20, alignSelf: 'stretch' },
  node: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textOnDarkFaint,
    marginTop: 4,
  },
  nodeActive: { backgroundColor: colors.emerald },
  nodePulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -4,
    left: -4,
    backgroundColor: 'rgba(16,185,129,0.25)',
  },
  rail: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: colors.glassBorder,
    marginVertical: 2,
  },
  stopInfo: { flex: 1, paddingVertical: spacing.xs, marginLeft: spacing.sm },
  stopCity: { color: colors.textOnDark, fontSize: 15, fontWeight: '700' },
  stopDates: { color: colors.textOnDarkFaint, fontSize: 12, marginTop: 2 },
  nowPill: {
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  nowText: {
    color: colors.emerald,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: 13,
  },
  footerBtnText: { color: colors.textOnDark, fontSize: 13, fontWeight: '700' },
});
