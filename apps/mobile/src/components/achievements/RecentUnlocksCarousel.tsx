// src/components/achievements/RecentUnlocksCarousel.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../providers/ThemeProvider';
import { AchievementUI, TIER_GRADIENTS } from './PresentationModels';
import { getRelativeTime } from '../../utils/formatters';
import AppIcon from '../common/AppIcon';

interface RecentUnlocksCarouselProps {
  unlocks: AchievementUI[];
}

function UnlockCard({
  achievement,
  index,
}: {
  achievement: AchievementUI;
  index: number;
}) {
  const theme = useTheme();
  const tierGradient = TIER_GRADIENTS[achievement.tier] || [
    '#EA580C',
    '#B45309',
  ];

  return (
    <Animated.View entering={FadeInRight.delay(index * 60).springify()}>
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={
            theme.isDark
              ? ['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)']
              : ['#FFFFFF', 'rgba(248, 250, 252, 0.95)']
          }
          style={[
            styles.card,
            {
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <View style={styles.cardTopRow}>
            <LinearGradient colors={tierGradient} style={styles.iconWrap}>
              <Text style={styles.emoji}>{achievement.icon}</Text>
            </LinearGradient>
            <View
              style={[
                styles.tierTag,
                { backgroundColor: achievement.tierColor + '20' },
              ]}
            >
              <Text
                style={[styles.tierTagText, { color: achievement.tierColor }]}
              >
                {achievement.tier.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.info}>
            <Text
              style={[styles.title, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {achievement.name}
            </Text>
            <Text
              style={[styles.desc, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {achievement.description}
            </Text>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.pointsBadge,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(234, 88, 12, 0.18)'
                      : '#FFF7ED',
                  },
                ]}
              >
                <AppIcon name="sparkles" size={10} color="#EA580C" />
                <Text style={styles.pointsText}>
                  +{achievement.pointsValue} XP
                </Text>
              </View>
              <Text
                style={[styles.dateText, { color: theme.colors.textTertiary }]}
              >
                {achievement.lastEarnedAt
                  ? getRelativeTime(new Date(achievement.lastEarnedAt))
                  : 'Earned'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

export function RecentUnlocksCarousel({ unlocks }: RecentUnlocksCarouselProps) {
  const theme = useTheme();

  if (!unlocks || unlocks.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AppIcon name="trophy" size={16} color="#EA580C" />
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
          >
            Recent Unlocks
          </Text>
        </View>
        <Text style={[styles.sectionSub, { color: theme.colors.textTertiary }]}>
          Your latest trophy achievements
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {unlocks.map((ach, i) => (
          <UnlockCard key={ach.id} achievement={ach} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
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
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingVertical: 4,
  },
  cardContainer: {
    width: 220,
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  tierTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  info: {
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    minHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
