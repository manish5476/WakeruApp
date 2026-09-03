import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { GlassCard } from '../../ui/GlassCard';
import { PlayerCardUI } from './PresentationModels';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

interface Props {
  topPlayers: PlayerCardUI[];
}

export function Podium({ topPlayers }: Props) {
  const theme = useTheme();

  if (!topPlayers || topPlayers.length === 0) return null;

  // We expect exactly up to 3 players. We reorder them for layout: [2nd, 1st, 3rd]
  const first = topPlayers[0];
  const second = topPlayers[1];
  const third = topPlayers[2];

  const podiumOrder = [
    {
      player: second,
      position: 2,
      height: 120,
      delay: 200,
      color: '#C0C0C0',
      icon: '🥈',
    },
    {
      player: first,
      position: 1,
      height: 160,
      delay: 0,
      color: '#FFD700',
      icon: '🥇',
    },
    {
      player: third,
      position: 3,
      height: 100,
      delay: 400,
      color: '#CD7F32',
      icon: '🥉',
    },
  ];

  return (
    <View style={styles.container}>
      {podiumOrder.map((item, index) => {
        if (!item.player)
          return <View key={`empty-${index}`} style={styles.emptySlot} />;

        return (
          <PodiumBar
            key={item.player.userId}
            player={item.player}
            height={item.height}
            delay={item.delay}
            color={item.color}
            icon={item.icon}
            theme={theme}
          />
        );
      })}
    </View>
  );
}

function PodiumBar({ player, height, delay, color, icon, theme }: any) {
  const translateY = useSharedValue(200);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withSpring(0, { damping: 12 }));
    opacity.value = withDelay(delay, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.podiumWrapper}>
      <Animated.View style={[styles.avatarContainer, animatedStyle]}>
        <Image
          source={{ uri: player.avatarUrl }}
          style={[styles.avatar, { borderColor: color }]}
        />
        <View
          style={[styles.medalBadge, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={styles.medalText}>{icon}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.barContainer, animatedStyle]}>
        <Text
          style={[styles.name, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {player.displayName}
        </Text>

        <GlassCard
          intensity={theme.isDark ? 20 : 15}
          style={[
            styles.bar,
            { height, borderTopColor: color, borderTopWidth: 2 },
          ]}
        >
          <Text style={[styles.points, { color: theme.colors.textPrimary }]}>
            {player.pointsFormatted}
          </Text>
          <Text
            style={[styles.ptsLabel, { color: theme.colors.textSecondary }]}
          >
            PTS
          </Text>

          {player.topAchievement && (
            <View style={styles.achievementContainer}>
              <Text style={styles.achievementIcon}>
                {player.topAchievement.icon}
              </Text>
            </View>
          )}
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    height: 260,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptySlot: {
    flex: 1,
  },
  podiumWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: '#CCC',
  },
  medalBadge: {
    position: 'absolute',
    bottom: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  medalText: {
    fontSize: 12,
  },
  barContainer: {
    width: '100%',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center',
    paddingTop: 16,
  },
  points: {
    fontSize: 18,
    fontWeight: '900',
  },
  ptsLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  achievementContainer: {
    marginTop: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIcon: {
    fontSize: 16,
  },
});
