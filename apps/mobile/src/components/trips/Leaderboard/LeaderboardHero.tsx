import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { GlassCard } from '../../ui/GlassCard';
import { LeaderboardHeroUI } from './PresentationModels';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  data: LeaderboardHeroUI;
}

export function LeaderboardHero({ data }: Props) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()}>
      <GlassCard style={styles.container} intensity={theme.isDark ? 15 : 20}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.superTitle, { color: theme.colors.primary }]}>
              🏆 LEADERBOARD
            </Text>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {data.tripName}
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              {data.subtitle}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statsRow,
            { borderTopColor: theme.colors.borderLight },
          ]}
        >
          <View style={styles.statBox}>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Total Points
            </Text>
            <Text
              style={[styles.statValue, { color: theme.colors.textPrimary }]}
            >
              {data.combinedPointsFormatted}
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.borderLight },
            ]}
          />
          <View style={styles.statBox}>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Participants
            </Text>
            <Text
              style={[styles.statValue, { color: theme.colors.textPrimary }]}
            >
              {data.totalParticipants}
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              { backgroundColor: theme.colors.borderLight },
            ]}
          />
          <View style={styles.statBox}>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Leader
            </Text>
            <Text
              style={[styles.statValue, { color: theme.colors.success }]}
              numberOfLines={1}
            >
              {data.currentLeaderName || '-'}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  headerRow: {
    marginBottom: 20,
  },
  superTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
});
