import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AppIcon from '../../common/AppIcon';
import { radius, shadow } from '../theme/tokens';

interface AppStoreBadgesProps {
  onPressAppStore?: () => void;
  onPressGooglePlay?: () => void;
  compact?: boolean;
}

export function AppStoreBadges({
  onPressAppStore,
  onPressGooglePlay,
  compact = false,
}: AppStoreBadgesProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* App Store */}
      <Pressable
        onPress={onPressAppStore}
        style={({ pressed }) => [
          styles.badge,
          compact && styles.badgeCompact,
          pressed && styles.badgePressed,
        ]}
      >
        <AppIcon name="apple" size={compact ? 18 : 22} color="#FFFFFF" />
        <View style={styles.textWrap}>
          <Text style={styles.subtext}>Download on the</Text>
          <Text style={styles.title}>App Store</Text>
        </View>
      </Pressable>

      {/* Google Play */}
      <Pressable
        onPress={onPressGooglePlay}
        style={({ pressed }) => [
          styles.badge,
          compact && styles.badgeCompact,
          pressed && styles.badgePressed,
        ]}
      >
        <AppIcon name="play" size={compact ? 16 : 20} color="#FFFFFF" />
        <View style={styles.textWrap}>
          <Text style={styles.subtext}>GET IT ON</Text>
          <Text style={styles.title}>Google Play</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  containerCompact: {
    gap: 8,
  },
  badge: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: 10,
    ...shadow.soft,
  },
  badgeCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    gap: 8,
  },
  badgePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  textWrap: {
    flexDirection: 'column',
  },
  subtext: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
