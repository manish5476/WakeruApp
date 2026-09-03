// src/components/achievements/AchievementsHero.tsx

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  withTiming,
  useAnimatedProps,
  Easing,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../providers/ThemeProvider';
import { AchievementsHeroUI, TIER_GRADIENTS } from './PresentationModels';
import AppIcon from '../common/AppIcon';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AchievementsHeroProps {
  hero: AchievementsHeroUI;
}

export function AchievementsHero({ hero }: AchievementsHeroProps) {
  const theme = useTheme();
  const styles = useStyles();

  const progressValue = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    progressValue.value = withTiming(hero.completionPercentage, {
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2500 }),
        withTiming(0.35, { duration: 2500 }),
      ),
      -1,
      true,
    );
  }, [hero.completionPercentage]);

  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (circumference * progressValue.value) / 100;
    return {
      strokeDashoffset,
    };
  });

  const tierGradient = TIER_GRADIENTS[hero.currentTier] || [
    '#EA580C',
    '#B45309',
  ];
  const isMaxLevel = hero.currentTier === 'diamond';

  return (
    <Animated.View
      entering={FadeInDown.duration(600).springify()}
      style={styles.container}
    >
      <LinearGradient
        colors={
          theme.isDark
            ? ['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.98)']
            : ['#FFFFFF', 'rgba(248, 250, 252, 0.95)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            borderColor: theme.isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        {/* Ambient Decorative Back Glow */}
        <Animated.View
          style={[
            styles.glowBackground,
            { backgroundColor: hero.tierColor, opacity: glowOpacity },
          ]}
        />

        <View style={styles.contentRow}>
          {/* Left: Player Profile & Level */}
          <View style={styles.infoSection}>
            <View style={styles.tierBadgeWrap}>
              <LinearGradient
                colors={tierGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tierBadgeGradient}
              >
                <Text style={styles.tierEmoji}>{hero.tierEmoji}</Text>
                <Text style={styles.tierLabel}>
                  {hero.currentTier.toUpperCase()}
                </Text>
              </LinearGradient>
            </View>

            <Text
              style={[styles.tierTitle, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {hero.tierTitle}
            </Text>

            <View style={styles.xpRow}>
              <Text
                style={[styles.xpText, { color: theme.colors.textPrimary }]}
              >
                {hero.totalPoints.toLocaleString()}
              </Text>
              <View
                style={[
                  styles.xpCapsule,
                  { backgroundColor: hero.tierColor + '20' },
                ]}
              >
                <Text style={[styles.xpCapsuleText, { color: hero.tierColor }]}>
                  XP
                </Text>
              </View>
            </View>

            {!isMaxLevel ? (
              <View style={styles.nextTierWrap}>
                <AppIcon name="sparkles" size={12} color={hero.tierColor} />
                <Text
                  style={[
                    styles.nextTierText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: '800',
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {hero.pointsToNextTier} XP
                  </Text>{' '}
                  to next tier
                </Text>
              </View>
            ) : (
              <View style={styles.nextTierWrap}>
                <AppIcon name="crown" size={12} color={hero.tierColor} />
                <Text
                  style={[
                    styles.nextTierText,
                    { color: hero.tierColor, fontWeight: '800' },
                  ]}
                >
                  Max Rank Achieved
                </Text>
              </View>
            )}
          </View>

          {/* Right: SVG Progress Ring */}
          <View style={styles.ringSection}>
            <View style={styles.chartContainer}>
              <Svg width={size} height={size}>
                <Defs>
                  <RadialGradient
                    id="heroRingGlow"
                    cx="50%"
                    cy="50%"
                    rx="50%"
                    ry="50%"
                  >
                    <Stop
                      offset="0%"
                      stopColor={hero.tierColor}
                      stopOpacity="0.25"
                    />
                    <Stop
                      offset="100%"
                      stopColor={hero.tierColor}
                      stopOpacity="0"
                    />
                  </RadialGradient>
                </Defs>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={size / 2}
                  fill="url(#heroRingGlow)"
                />
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={
                      theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.06)'
                    }
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={hero.tierColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    animatedProps={animatedCircleProps}
                    strokeLinecap="round"
                  />
                </G>
              </Svg>
              <View style={styles.chartCenter}>
                <Text
                  style={[
                    styles.chartPercent,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {Math.round(hero.completionPercentage)}%
                </Text>
                <Text
                  style={[
                    styles.chartSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Unlocked
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Quick Stats Strip */}
        <View
          style={[
            styles.statsStrip,
            {
              borderTopColor: theme.isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: theme.colors.textPrimary }]}>
              {hero.totalUnlocked}
            </Text>
            <Text
              style={[styles.statLbl, { color: theme.colors.textSecondary }]}
            >
              Badges Earned
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: theme.colors.textPrimary }]}>
              {hero.totalAvailable}
            </Text>
            <Text
              style={[styles.statLbl, { color: theme.colors.textSecondary }]}
            >
              Total Available
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.08)',
              },
            ]}
          />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: hero.tierColor }]}>
              Top {Math.max(1, 100 - Math.round(hero.completionPercentage))}%
            </Text>
            <Text
              style={[styles.statLbl, { color: theme.colors.textSecondary }]}
            >
              Global Standing
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      marginBottom: 24,
      marginTop: 8,
    },
    card: {
      borderRadius: 28,
      borderWidth: 1.5,
      padding: 22,
      overflow: 'hidden',

      ...Platform.select({
        web: {
          boxShadow: theme.isDark
            ? '0 20px 40px -15px rgba(0,0,0,0.6)'
            : '0 20px 40px -15px rgba(0,0,0,0.08)',
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
    glowBackground: {
      position: 'absolute',
      top: -60,
      right: -60,
      width: 220,
      height: 220,
      borderRadius: 110,
      filter: 'blur(50px)' as any,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    infoSection: {
      flex: 1,
      paddingRight: 16,
    },
    tierBadgeWrap: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    tierBadgeGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
    tierEmoji: {
      fontSize: 13,
    },
    tierLabel: {
      fontSize: 11,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 0.8,
    },
    tierTitle: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.4,
      marginBottom: 6,
    },
    xpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    xpText: {
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: -1,
    },
    xpCapsule: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    xpCapsuleText: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    nextTierWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    nextTierText: {
      fontSize: 12,
      fontWeight: '500',
    },
    ringSection: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartContainer: {
      position: 'relative',
      width: 120,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartPercent: {
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    chartSub: {
      fontSize: 9,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 1,
    },
    statsStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
    },
    statNum: {
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: -0.2,
    },
    statLbl: {
      fontSize: 10,
      fontWeight: '600',
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 24,
    },
  });
};
