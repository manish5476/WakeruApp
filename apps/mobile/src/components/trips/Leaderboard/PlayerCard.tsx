import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { GlassCard } from '../../ui/GlassCard';
import { PlayerCardUI } from './PresentationModels';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  player: PlayerCardUI;
  delay?: number;
}

export function PlayerCard({ player, delay = 0 }: Props) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <GlassCard style={styles.card} intensity={theme.isDark ? 10 : 15}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, { color: theme.colors.textSecondary }]}>
            {player.rank}
          </Text>
        </View>

        <View style={styles.avatarContainer}>
          <Image source={{ uri: player.avatarUrl }} style={styles.avatar} />
          {/* Simplified progress ring via border for performance */}
          <View
            style={[
              styles.progressRing,
              {
                borderColor: theme.colors.primary,
                borderRightColor:
                  player.progressPercentage < 50
                    ? 'transparent'
                    : theme.colors.primary,
                borderBottomColor:
                  player.progressPercentage < 75
                    ? 'transparent'
                    : theme.colors.primary,
                borderLeftColor:
                  player.progressPercentage < 100
                    ? 'transparent'
                    : theme.colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text
            style={[styles.name, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {player.displayName}
          </Text>
          {player.pointsBehindLeader > 0 ? (
            <Text style={[styles.diffText, { color: theme.colors.warning }]}>
              {player.pointsBehindLeader} points behind leader
            </Text>
          ) : (
            <Text style={[styles.diffText, { color: theme.colors.success }]}>
              Current Leader!
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          <View style={styles.pointsWrap}>
            <Text style={[styles.points, { color: theme.colors.textPrimary }]}>
              {player.pointsFormatted}
            </Text>
            <Text
              style={[styles.ptsLabel, { color: theme.colors.textTertiary }]}
            >
              pts
            </Text>
          </View>

          {player.topAchievement && (
            <View
              style={[
                styles.achievementBadge,
                { backgroundColor: theme.colors.secondaryBg },
              ]}
            >
              <Text style={styles.achievementIcon}>
                {player.topAchievement.icon}
              </Text>
              <Text
                style={[
                  styles.achievementTier,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {player.topAchievement.tier}
              </Text>
            </View>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '800',
  },
  avatarContainer: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 26,
    borderWidth: 2,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  diffText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  pointsWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 6,
  },
  points: {
    fontSize: 18,
    fontWeight: '800',
  },
  ptsLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  achievementIcon: {
    fontSize: 12,
  },
  achievementTier: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
