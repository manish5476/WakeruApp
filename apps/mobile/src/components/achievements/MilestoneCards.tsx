// src/components/achievements/MilestoneCards.tsx

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { MilestoneUI, TIER_GRADIENTS } from './PresentationModels';
import AppIcon from '../common/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';

interface MilestoneCardsProps {
  milestones: MilestoneUI[];
}

function MilestoneItem({
  milestone,
  index,
}: {
  milestone: MilestoneUI;
  index: number;
}) {
  const theme = useTheme();
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(
      Math.min(100, Math.max(0, milestone.progress)),
      {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      },
    );
  }, [milestone.progress]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const tierGradient = TIER_GRADIENTS[milestone.tier] || ['#EA580C', '#B45309'];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={styles.cardWrap}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
            borderColor: theme.isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={tierGradient} style={styles.iconWrap}>
              <Text style={styles.emoji}>{milestone.icon}</Text>
            </LinearGradient>
            <View style={styles.titleWrap}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text
                  style={[styles.title, { color: theme.colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {milestone.name}
                </Text>
                <View
                  style={[
                    styles.tierTag,
                    { backgroundColor: milestone.tierColor + '20' },
                  ]}
                >
                  <Text
                    style={[styles.tierTagText, { color: milestone.tierColor }]}
                  >
                    {milestone.tier.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.desc, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {milestone.description}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.rewardBadge,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(234, 88, 12, 0.18)'
                  : '#FFF7ED',
              },
            ]}
          >
            <AppIcon name="sparkles" size={11} color="#EA580C" />
            <Text style={styles.rewardText}>+{milestone.pointsValue} XP</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text
              style={[
                styles.progressValues,
                { color: theme.colors.textSecondary },
              ]}
            >
              {milestone.currentValue} / {milestone.targetValue}
            </Text>
            <Text style={[styles.percentText, { color: milestone.tierColor }]}>
              {Math.round(milestone.progress)}%
            </Text>
          </View>

          <View
            style={[
              styles.progressBarBg,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.06)'
                  : '#F1F5F9',
              },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: milestone.tierColor },
                animatedProgressStyle,
              ]}
            />
          </View>

          <Text
            style={[styles.remainingText, { color: theme.colors.textTertiary }]}
          >
            🎯 Just{' '}
            <Text
              style={{ fontWeight: '800', color: theme.colors.textSecondary }}
            >
              {milestone.remainingValue}
            </Text>{' '}
            more to unlock!
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function MilestoneCards({ milestones }: MilestoneCardsProps) {
  const theme = useTheme();

  if (!milestones || milestones.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppIcon name="target" size={16} color="#EA580C" />
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Next Milestones
          </Text>
        </View>
        <Text style={[styles.sectionSub, { color: theme.colors.textTertiary }]}>
          Closest badges to your next rank
        </Text>
      </View>
      <View style={styles.list}>
        {milestones.map((m, i) => (
          <MilestoneItem key={m.id} milestone={m} index={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  list: {
    gap: 12,
  },
  cardWrap: {
    width: '100%',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',

    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
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
  emoji: {
    fontSize: 22,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tierTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tierTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.25)',
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  progressContainer: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressValues: {
    fontSize: 12,
    fontWeight: '700',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
