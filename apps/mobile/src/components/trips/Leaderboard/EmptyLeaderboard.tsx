import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { GlassCard } from '../../ui/GlassCard';
import Animated, { FadeInUp } from 'react-native-reanimated';

export function EmptyLeaderboard() {
  const theme = useTheme();

  const waysToEarn = [
    { icon: '🧾', text: 'Adding expenses' },
    { icon: '💸', text: 'Settling balances' },
    { icon: '🗺️', text: 'Planning trips' },
    { icon: '📸', text: 'Uploading receipts' },
    { icon: '👥', text: 'Inviting friends' },
  ];

  return (
    <Animated.View entering={FadeInUp.duration(600).springify()}>
      <GlassCard style={styles.container} intensity={theme.isDark ? 15 : 20}>
        <Text style={styles.titleEmoji}>🎉</Text>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Competition starts now!
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          No one has earned points yet. Be the first to take the lead!
        </Text>

        <View
          style={[
            styles.waysContainer,
            { backgroundColor: theme.colors.secondaryBg },
          ]}
        >
          <Text
            style={[styles.waysHeader, { color: theme.colors.textPrimary }]}
          >
            Earn achievements by:
          </Text>

          {waysToEarn.map((item, index) => (
            <View key={index} style={styles.wayRow}>
              <Text style={styles.wayIcon}>{item.icon}</Text>
              <Text
                style={[styles.wayText, { color: theme.colors.textSecondary }]}
              >
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryCTA, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>Start Earning Points</Text>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 24,
    marginVertical: 16,
  },
  titleEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  waysContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  waysHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  wayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wayIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  wayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryCTA: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
