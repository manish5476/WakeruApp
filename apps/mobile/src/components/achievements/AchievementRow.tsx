// src/components/achievements/AchievementRow.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  PressableStateCallbackType,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { AchievementUI, TIER_GRADIENTS } from './PresentationModels';
import { getRelativeTime } from '../../utils/formatters';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean;
  pressed?: boolean;
};

interface AchievementRowProps {
  achievement: AchievementUI;
  index: number;
}

export function AchievementRow({ achievement, index }: AchievementRowProps) {
  const theme = useTheme();
  const isUnlocked = achievement.isUnlocked;
  const tierGradient = TIER_GRADIENTS[achievement.tier] || [
    '#EA580C',
    '#B45309',
  ];

  const handlePress = () => {
    haptics.light();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 30, 250)).duration(350)}
    >
      <Pressable
        onPress={handlePress}
        style={({ hovered, pressed }: WebPressableState) => [
          styles.container,
          Platform.OS === 'web' && hovered && styles.hoverLift,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.isDark
                ? isUnlocked
                  ? 'rgba(30, 41, 59, 0.85)'
                  : 'rgba(15, 23, 42, 0.6)'
                : isUnlocked
                  ? '#FFFFFF'
                  : 'rgba(241, 245, 249, 0.7)',
              borderColor: isUnlocked
                ? theme.isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)'
                : theme.isDark
                  ? 'rgba(255, 255, 255, 0.04)'
                  : 'rgba(0, 0, 0, 0.04)',
            },
            !isUnlocked && { opacity: 0.75 },
          ]}
        >
          <View style={styles.content}>
            {/* Icon Wrap */}
            {isUnlocked ? (
              <LinearGradient colors={tierGradient} style={styles.iconWrap}>
                <Text style={styles.emoji}>{achievement.icon}</Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.06)'
                      : '#E2E8F0',
                  },
                ]}
              >
                <AppIcon
                  name="lock"
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </View>
            )}

            {/* Title & Description */}
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, { color: theme.colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {achievement.name}
                </Text>
                <View
                  style={[
                    styles.tierBadge,
                    {
                      backgroundColor: isUnlocked
                        ? achievement.tierColor + '20'
                        : theme.isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tierText,
                      {
                        color: isUnlocked
                          ? achievement.tierColor
                          : theme.colors.textTertiary,
                      },
                    ]}
                  >
                    {achievement.tier.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text
                style={[styles.desc, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {achievement.description}
              </Text>

              {/* Progress bar for locked achievements */}
              {!isUnlocked && (
                <View style={styles.progressRow}>
                  <View
                    style={[
                      styles.progressBarBg,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255,255,255,0.08)'
                          : '#E2E8F0',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.max(0, achievement.progress))}%`,
                          backgroundColor: achievement.tierColor,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {achievement.currentValue}/{achievement.targetValue}
                  </Text>
                </View>
              )}

              {/* Unlocked Earned Date */}
              {isUnlocked && achievement.lastEarnedAt && (
                <View style={styles.earnedRow}>
                  <AppIcon
                    name="circle-check"
                    size={11}
                    color={theme.colors.success}
                  />
                  <Text
                    style={[
                      styles.dateText,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    Earned {getRelativeTime(new Date(achievement.lastEarnedAt))}
                  </Text>
                </View>
              )}
            </View>

            {/* Right Points Pill */}
            <View style={styles.rightSection}>
              <View
                style={[
                  styles.pointsBadge,
                  {
                    backgroundColor: isUnlocked
                      ? theme.isDark
                        ? 'rgba(234, 88, 12, 0.18)'
                        : '#FFF7ED'
                      : theme.isDark
                        ? 'rgba(255,255,255,0.05)'
                        : '#F1F5F9',
                    borderColor: isUnlocked
                      ? 'rgba(234, 88, 12, 0.3)'
                      : theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <AppIcon
                  name="sparkles"
                  size={11}
                  color={isUnlocked ? '#EA580C' : theme.colors.textTertiary}
                />
                <Text
                  style={[
                    styles.pointsText,
                    {
                      color: isUnlocked ? '#EA580C' : theme.colors.textTertiary,
                    },
                  ]}
                >
                  +{achievement.pointsValue} XP
                </Text>
              </View>

              {achievement.timesEarned > 1 && (
                <View
                  style={[
                    styles.multiplierBadge,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : '#E2E8F0',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.multiplierText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    ×{achievement.timesEarned}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    ...(Platform.OS === 'web'
      ? { cursor: 'pointer', transition: 'all 0.2s ease' }
      : {}),
  } as any,
  hoverLift: {
    transform: [{ translateY: -2 }],
  },
  card: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',

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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
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
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '800',
  },
  multiplierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  multiplierText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
