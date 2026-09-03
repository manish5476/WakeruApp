// src/components/ui/AchievementPopup.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import type { Theme } from '../../theme';

// ─── Types ───────────────────────────────────────────────────
export type AchievementLevel =
  'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Achievement {
  title: string;
  description: string;
  emoji?: string;
  icon?: string;
  color?: string;
  points?: number;
  level?: AchievementLevel;
}

interface AchievementPopupProps {
  achievement: Achievement;
  onDismiss: () => void;
  onAction?: () => void;
  duration?: number;
  showConfetti?: boolean;
  showProgress?: boolean;
  showLevel?: boolean;
  actionLabel?: string;
  dismissOnOutsideTap?: boolean;
}

// ─── Level Tier Configuration ────────────────────────────────
const LEVEL_CONFIG: Record<
  AchievementLevel,
  { color: string; bg: string; label: string; icon: string }
> = {
  bronze: {
    color: '#CD7F32',
    bg: 'rgba(205, 127, 50, 0.15)',
    label: 'Bronze Tier',
    icon: 'award',
  },
  silver: {
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.15)',
    label: 'Silver Tier',
    icon: 'award',
  },
  gold: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.18)',
    label: 'Gold Tier',
    icon: 'star',
  },
  platinum: {
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.18)',
    label: 'Platinum Tier',
    icon: 'shield',
  },
  diamond: {
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.2)',
    label: 'Diamond Tier',
    icon: 'zap',
  },
};

// ─── Confetti Particles ──────────────────────────────────────
const NUM_CONFETTI = 36;
const CONFETTI_COLORS = [
  '#F59E0B',
  '#EC4899',
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#EF4444',
  '#06B6D4',
  '#F97316',
  '#34D399',
  '#38BDF8',
];

const ConfettiParticle = ({
  index,
  total,
  width,
  height,
}: {
  index: number;
  total: number;
  width: number;
  height: number;
}) => {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 5 + (index % 5) * 1.5;
  const startX = Math.random() * (width || 340);
  const startY = -20 - Math.random() * 40;
  const endX = startX + (Math.random() - 0.5) * 180;
  const endY = (height || 360) + 30 + Math.random() * 80;
  const rotation = Math.random() * 360;
  const delay = (index / total) * 180;

  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withSpring(endX, { damping: 14, stiffness: 70 }),
    );
    translateY.value = withDelay(
      delay,
      withSpring(endY, { damping: 12, stiffness: 50 }),
    );
    rotate.value = withDelay(
      delay,
      withSpring(rotation, { damping: 10, stiffness: 35 }),
    );
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 500 }),
      ),
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 450 }),
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          width: size,
          height: size * 0.6,
          backgroundColor: color,
          borderRadius: 2,
        },
      ]}
    />
  );
};

// ─── Main Achievement Popup Component ────────────────────────
export function AchievementPopup({
  achievement,
  onDismiss,
  onAction,
  duration = 4200,
  showConfetti = true,
  showProgress = true,
  showLevel = true,
  actionLabel = 'Claim & Continue',
  dismissOnOutsideTap = true,
}: AchievementPopupProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Animation values
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);
  const progress = useSharedValue(1);
  const pulse = useSharedValue(1);

  const level = achievement.level || 'gold';
  const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG.gold;
  const accentColor = achievement.color || levelConfig.color;
  const iconName = achievement.icon || 'award';

  const dismissPopup = useCallback(() => {
    scale.value = withTiming(0.85, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(-20, { duration: 250 });

    setTimeout(() => {
      onDismiss();
    }, 280);
  }, [onDismiss]);

  useEffect(() => {
    // Entrance
    scale.value = withSpring(1, { damping: 14, stiffness: 130 });
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 140 });

    // Icon subtle pulse
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Progress bar depletion
    progress.value = withTiming(0, {
      duration,
      easing: Easing.linear,
    });

    haptics.success();

    const timer = setTimeout(() => {
      dismissPopup();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, dismissPopup]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.overlay}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={dismissOnOutsideTap ? dismissPopup : undefined}
      />

      <Animated.View
        style={[styles.container, containerStyle]}
        onLayout={e => setDimensions(e.nativeEvent.layout)}
      >
        <LinearGradient
          colors={['#0F172A', '#1E1B4B', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { borderColor: `${accentColor}40` }]}
        >
          {/* Confetti Particles */}
          {showConfetti && dimensions.width > 0 && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {Array.from({ length: NUM_CONFETTI }).map((_, i) => (
                <ConfettiParticle
                  key={i}
                  index={i}
                  total={NUM_CONFETTI}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              ))}
            </View>
          )}

          {/* Level Badge */}
          {showLevel && (
            <View
              style={[
                styles.levelPill,
                {
                  backgroundColor: levelConfig.bg,
                  borderColor: `${levelConfig.color}40`,
                },
              ]}
            >
              <AppIcon
                name={levelConfig.icon as any}
                size={12}
                color={levelConfig.color}
              />
              <Text
                style={[styles.levelPillText, { color: levelConfig.color }]}
              >
                {levelConfig.label.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Icon Aura */}
          <Animated.View style={[styles.iconWrap, pulseStyle]}>
            <View
              style={[
                styles.iconAura,
                {
                  backgroundColor: `${accentColor}20`,
                  borderColor: `${accentColor}50`,
                },
              ]}
            >
              {achievement.emoji ? (
                <Text style={styles.emojiText}>{achievement.emoji}</Text>
              ) : (
                <AppIcon name={iconName as any} size={34} color={accentColor} />
              )}
            </View>
          </Animated.View>

          {/* Unlock Notification Pill */}
          <View
            style={[styles.badgePill, { backgroundColor: `${accentColor}20` }]}
          >
            <AppIcon name="award" size={13} color={accentColor} />
            <Text style={[styles.badgeText, { color: accentColor }]}>
              ACHIEVEMENT UNLOCKED
            </Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.titleText}>{achievement.title}</Text>
          <Text style={styles.descText}>{achievement.description}</Text>

          {/* XP Reward Chip */}
          {Boolean(achievement.points) && (
            <View
              style={[
                styles.xpChip,
                { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
              ]}
            >
              <AppIcon name="star" size={14} color="#F59E0B" />
              <Text style={styles.xpText}>
                +{achievement.points} EXP EARNED
              </Text>
            </View>
          )}

          {/* Progress Timer Track */}
          {showProgress && (
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { backgroundColor: accentColor },
                  progressStyle,
                ]}
              />
            </View>
          )}

          {/* Action Trigger */}
          {onAction && (
            <Pressable
              onPress={() => {
                haptics.medium();
                onAction();
                dismissPopup();
              }}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: accentColor },
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.actionBtnText}>{actionLabel}</Text>
              <AppIcon name="arrow-right" size={15} color="#FFFFFF" />
            </Pressable>
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ─── Hook for State Management ───────────────────────────────
interface AchievementState {
  visible: boolean;
  achievement: Achievement | null;
}

export function useAchievement() {
  const [state, setState] = useState<AchievementState>({
    visible: false,
    achievement: null,
  });

  const showAchievement = useCallback((achievement: Achievement) => {
    setState({
      visible: true,
      achievement,
    });
  }, []);

  const hideAchievement = useCallback(() => {
    setState({
      visible: false,
      achievement: null,
    });
  }, []);

  const AchievementComponent = useCallback(() => {
    if (!state.visible || !state.achievement) return null;

    return (
      <AchievementPopup
        achievement={state.achievement}
        onDismiss={hideAchievement}
        showConfetti
        showProgress
      />
    );
  }, [state, hideAchievement]);

  return {
    showAchievement,
    hideAchievement,
    AchievementComponent,
    isVisible: state.visible,
  };
}

// ─── Predefined Badges ───────────────────────────────────────
export const ACHIEVEMENTS = {
  FIRST_TRIP: {
    title: 'First Expedition',
    description: 'Created your inaugural adventure and started tracking.',
    emoji: '🌍',
    icon: 'map',
    color: '#38BDF8',
    points: 50,
    level: 'bronze' as const,
  },
  EXPENSE_MASTER: {
    title: 'Ledger Virtuoso',
    description: 'Logged 100 expenses with zero friction.',
    emoji: '🔥',
    icon: 'credit-card',
    color: '#F59E0B',
    points: 100,
    level: 'silver' as const,
  },
  SOCIAL_BUTTERFLY: {
    title: 'Crew Commander',
    description: 'Traveled with 10+ companions across trips.',
    emoji: '🦋',
    icon: 'users',
    color: '#EC4899',
    points: 75,
    level: 'silver' as const,
  },
  BUDGET_GURU: {
    title: 'Budget Maestro',
    description: 'Maintained strict budget discipline for 5 consecutive trips.',
    emoji: '🧘',
    icon: 'pie-chart',
    color: '#10B981',
    points: 150,
    level: 'gold' as const,
  },
  SETTLEMENT_STAR: {
    title: 'Zero Debt Champion',
    description: 'Settled 50 shared splits promptly without disputes.',
    emoji: '⭐',
    icon: 'check-circle',
    color: '#8B5CF6',
    points: 200,
    level: 'platinum' as const,
  },
  TRAVEL_EXPERT: {
    title: 'Global Explorer',
    description: 'Explored 20+ destinations with your crew on Wakeru.',
    emoji: '✈️',
    icon: 'globe',
    color: '#06B6D4',
    points: 300,
    level: 'diamond' as const,
  },
};

// ─── STYLES ──────────────────────────────────────────────────
function createStyles(theme: Theme) {
  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
      padding: 16,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
    },
    container: {
      width: '100%',
      maxWidth: 380,
      alignSelf: 'center',
    },
    card: {
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      borderWidth: 2,
      overflow: 'hidden',
      position: 'relative',

      ...Platform.select({
        web: {
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
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
    },
    levelPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      marginBottom: 16,
    },
    levelPillText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    iconWrap: {
      marginBottom: 14,
    },
    iconAura: {
      width: 76,
      height: 76,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    emojiText: {
      fontSize: 34,
      lineHeight: 40,
    },
    badgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      marginBottom: 10,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.6,
    },
    titleText: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
      textAlign: 'center',
      letterSpacing: -0.4,
      marginBottom: 4,
    },
    descText: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.75)',
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 8,
    },
    xpChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      marginTop: 14,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    xpText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FBBF24',
      letterSpacing: 0.5,
    },
    progressTrack: {
      width: '100%',
      height: 3,
      borderRadius: 1.5,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      overflow: 'hidden',
      marginTop: 18,
    },
    progressFill: {
      height: '100%',
      borderRadius: 1.5,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      width: '100%',
      paddingVertical: 12,
      borderRadius: 14,
      marginTop: 16,
    },
    actionBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
  });
}
// // src/components/ui/AchievementPopup.tsx
// import {
//     View,
//     StyleSheet,
//     Platform,
//     Dimensions,
//     TouchableWithoutFeedback,
// } from 'react-native';
// import Animated, {
//     useSharedValue,
//     useAnimatedStyle,
//     withSpring,
//     withTiming,
//     runOnJS,
//     Easing,
//     withRepeat,
//     withSequence,
//     withDelay,
//     useDerivedValue,
//     interpolate,
//     Extrapolate,
// } from 'react-native-reanimated';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useTheme } from '../../providers/ThemeProvider';

// import { haptics } from '../../utils/haptics';
// import AppIcon from '../common/AppIcon';

// // --- Types ---
// interface Achievement {
//     title: string;
//     description: string;
//     emoji?: string;
//     icon?: string;
//     color?: string;
//     points?: number;
//     level?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
// }

// interface AchievementPopupProps {
//     achievement: Achievement;
//     onDismiss: () => void;
//     onAction?: () => void;
//     duration?: number;
//     /**
//      * If true, shows a confetti animation
//      */
//     showConfetti?: boolean;
//     /**
//      * If true, shows a progress bar animation
//      */
//     showProgress?: boolean;
//     /**
//      * If true, shows the achievement level badge
//      */
//     showLevel?: boolean;
//     /**
//      * Custom action button label
//      */
//     actionLabel?: string;
//     /**
//      * If true, the popup can be dismissed by tapping outside
//      */
//     dismissOnOutsideTap?: boolean;
// }

// // --- Level Config ---
// const LEVEL_CONFIG = {
//     bronze: { color: '#CD7F32', label: 'Bronze', emoji: '🥉' },
//     silver: { color: '#C0C0C0', label: 'Silver', emoji: '🥈' },
//     gold: { color: '#FFD700', label: 'Gold', emoji: '🥇' },
//     platinum: { color: '#E5E4E2', label: 'Platinum', emoji: '💎' },
//     diamond: { color: '#B9F2FF', label: 'Diamond', emoji: '💠' },
// };

// // --- Confetti Particle Component ---
// const NUM_CONFETTI = 40;

// const ConfettiParticle = ({
//     index,
//     total,
//     width,
//     height,
// }: {
//     index: number;
//     total: number;
//     width: number;
//     height: number;
// }) => {
//     const theme = useTheme();
//     const colors = [
//         '#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#8B5CF6',
//         '#EF4444', '#F472B6', '#06B6D4', '#84CC16', '#F97316',
//     ];

//     const color = colors[index % colors.length];
//     const size = 4 + Math.random() * 6;
//     const startX = Math.random() * width;
//     const startY = -20 - Math.random() * 50;
//     const endX = startX + (Math.random() - 0.5) * 200;
//     const endY = height + 20 + Math.random() * 100;
//     const rotation = Math.random() * 360;
//     const delay = (index / total) * 200;

//     const translateX = useSharedValue(startX);
//     const translateY = useSharedValue(startY);
//     const rotate = useSharedValue(0);
//     const opacity = useSharedValue(1);
//     const scale = useSharedValue(0);

//     useEffect(() => {
//         translateX.value = withDelay(
//             delay,
//             withSpring(endX, { damping: 15, stiffness: 80 })
//         );
//         translateY.value = withDelay(
//             delay,
//             withSpring(endY, { damping: 12, stiffness: 60 })
//         );
//         rotate.value = withDelay(
//             delay,
//             withSpring(rotation, { damping: 10, stiffness: 40 })
//         );
//         scale.value = withDelay(
//             delay,
//             withSequence(
//                 withTiming(1, { duration: 100 }),
//                 withTiming(0, { duration: 500 })
//             )
//         );
//         opacity.value = withDelay(
//             delay,
//             withSequence(
//                 withTiming(1, { duration: 100 }),
//                 withTiming(0, { duration: 400 })
//             )
//         );
//     }, []);

//     const style = useAnimatedStyle(() => ({
//         transform: [
//             { translateX: translateX.value },
//             { translateY: translateY.value },
//             { rotate: `${rotate.value}deg` },
//             { scale: scale.value },
//         ],
//         opacity: opacity.value,
//     }));

//     return (
//         <Animated.View
//             style={[
//                 style,
//                 {
//                     position: 'absolute',
//                     width: size,
//                     height: size * 0.6,
//                     backgroundColor: color,
//                     borderRadius: 2,
//                     transform: [{ rotate: `${rotation}deg` }],
//                 },
//             ]}
//         />
//     );
// };

// // --- Main Component ---
// export function AchievementPopup({
//     achievement,
//     onDismiss,
//     onAction,
//     duration = 4000,
//     showConfetti = true,
//     showProgress = true,
//     showLevel = true,
//     actionLabel = 'Continue',
//     dismissOnOutsideTap = true,
// }: AchievementPopupProps) {
//     const theme = useTheme();
//     const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
//     const containerRef = useRef<View>(null);

//     // --- Animation Values ---
//     const scale = useSharedValue(0.5);
//     const opacity = useSharedValue(0);
//     const translateY = useSharedValue(50);
//     const progress = useSharedValue(1);
//     const pulse = useSharedValue(1);

//     // --- Derived Values ---
//     const iconName = achievement.icon || 'award';
//     const accentColor = achievement.color || theme.colors.secondary;
//     const level = achievement.level || 'gold';
//     const levelConfig = LEVEL_CONFIG[level];

//     // --- Confetti ---
//     const renderConfetti = () => {
//         if (!showConfetti || dimensions.width === 0) return null;

//         return (
//             <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
//                 {Array.from({ length: NUM_CONFETTI }).map((_, i) => (
//                     <ConfettiParticle
//                         key={i}
//                         index={i}
//                         total={NUM_CONFETTI}
//                         width={dimensions.width}
//                         height={dimensions.height}
//                     />
//                 ))}
//             </View>
//         );
//     };

//     // --- Animations ---
//     useEffect(() => {
//         // Animate in
//         scale.value = withSpring(1, { damping: 15, stiffness: 120 });
//         opacity.value = withTiming(1, { duration: 400 });
//         translateY.value = withSpring(0, { damping: 20, stiffness: 150 });

//         // Pulse animation
//         pulse.value = withRepeat(
//             withSequence(
//                 withTiming(1.05, { duration: 1000 }),
//                 withTiming(1, { duration: 1000 })
//             ),
//             -1,
//             true
//         );

//         // Progress bar
//         progress.value = withTiming(0, {
//             duration: duration,
//             easing: Easing.linear,
//         });

//         // Haptic feedback
//         haptics.success();

//         // Auto dismiss timer
//         const timer = setTimeout(() => {
//             dismissPopup();
//         }, duration);

//         return () => {
//             clearTimeout(timer);
//         };
//     }, []);

//     // --- Dismiss ---
//     const dismissPopup = () => {
//         scale.value = withTiming(0.8, { duration: 300 });
//         opacity.value = withTiming(0, { duration: 300 });
//         translateY.value = withTiming(-30, { duration: 300 });

//         setTimeout(() => {
//             onDismiss();
//         }, 350);
//     };

//     // --- Animated Styles ---
//     const containerStyle = useAnimatedStyle(() => ({
//         transform: [
//             { scale: scale.value },
//             { translateY: translateY.value },
//         ],
//         opacity: opacity.value,
//     }));

//     const pulseStyle = useAnimatedStyle(() => ({
//         transform: [{ scale: pulse.value }],
//     }));

//     const progressStyle = useAnimatedStyle(() => ({
//         width: `${progress.value * 100}%`,
//     }));

//     // --- Handle layout ---
//     const handleLayout = (event: any) => {
//         const { width, height } = event.nativeEvent.layout;
//         setDimensions({ width, height });
//     };

//     return (
//         <TouchableWithoutFeedback
//             onPress={dismissOnOutsideTap ? dismissPopup : undefined}
//         >
//             <View style={styles.overlay}>
//                 <Animated.View
//                     ref={containerRef}
//                     style={[styles.container, containerStyle]}
//                     onLayout={handleLayout}
//                 >
//                     <GlassCard
//                         variant="prominent"
//                         padding="xl"
//                         intensity={theme.isDark ? 30 : 50}
//                         style={[
//                             styles.card,
//                             {
//                                 borderColor: accentColor + '40',
//                                 borderWidth: 2,
//                             }
//                         ]}
//                     >
//                         {/* Glow Effects */}
//                         <View style={[
//                             styles.glowEffect,
//                             { backgroundColor: accentColor, opacity: 0.1 }
//                         ]} />
//                         <View style={[
//                             styles.glowEffect2,
//                             { backgroundColor: accentColor, opacity: 0.08 }
//                         ]} />

//                         {/* Confetti */}
//                         {renderConfetti()}

//                         {/* Level Badge */}
//                         {showLevel && (
//                             <Animated.View style={[styles.levelBadge, pulseStyle]}>
//                                 <Typography
//                                     variant="caption"
//                                     weight="bold"
//                                     style={[
//                                         styles.levelBadgeText,
//                                         { color: levelConfig.color }
//                                     ]}
//                                 >
//                                     {levelConfig.emoji} {levelConfig.label}
//                                 </Typography>
//                             </Animated.View>
//                         )}

//                         {/* Icon */}
//                         <Animated.View style={[styles.iconWrap, pulseStyle]}>
//                             <LinearGradient
//                                 colors={[accentColor + '30', accentColor + '10']}
//                                 style={StyleSheet.absoluteFill}

//                             />
//                             <View style={[
//                                 styles.iconBackground,
//                                 {
//                                     borderColor: accentColor + '40',
//                                     backgroundColor: accentColor + '15',
//                                 }
//                             ]}>
//                                 {achievement.emoji ? (
//                                     <Typography variant="display" style={styles.emojiText}>
//                                         {achievement.emoji}
//                                     </Typography>
//                                 ) : (
//                                     <AppIcon name={iconName} size={36} color={accentColor} />
//                                 )}
//                             </View>
//                         </Animated.View>

//                         {/* Badge Label */}
//                         <View style={[
//                             styles.badge,
//                             { backgroundColor: accentColor + '15' }
//                         ]}>
//                             <AppIcon name="award" size={14} color={accentColor} />
//                             <Typography
//                                 variant="caption"
//                                 weight="bold"
//                                 style={{ color: accentColor }}
//                             >
//                                 ACHIEVEMENT UNLOCKED!
//                             </Typography>
//                         </View>

//                         {/* Title */}
//                         <Typography
//                             variant="h2"
//                             weight="bold"
//                             color="textPrimary"
//                             style={styles.title}
//                         >
//                             {achievement.title}
//                         </Typography>

//                         {/* Description */}
//                         <Typography
//                             variant="body"
//                             color="textSecondary"
//                             style={styles.description}
//                         >
//                             {achievement.description}
//                         </Typography>

//                         {/* Points */}
//                         {achievement.points && (
//                             <View style={styles.pointsContainer}>
//                                 <AppIcon name="star" size={16} color={accentColor} />
//                                 <Typography
//                                     variant="caption"
//                                     weight="semibold"
//                                     style={{ color: accentColor }}
//                                 >
//                                     +{achievement.points} XP
//                                 </Typography>
//                             </View>
//                         )}

//                         {/* Progress Bar */}
//                         {showProgress && (
//                             <View style={[
//                                 styles.progressTrack,
//                                 {
//                                     backgroundColor: theme.isDark
//                                         ? 'rgba(255,255,255,0.08)'
//                                         : 'rgba(0,0,0,0.06)',
//                                 }
//                             ]}>
//                                 <Animated.View
//                                     style={[
//                                         styles.progressFill,
//                                         { backgroundColor: accentColor },
//                                         progressStyle,
//                                     ]}
//                                 />
//                             </View>
//                         )}

//                         {/* Action Button */}
//                         {onAction && (
//                             <InteractiveWrapper
//                                 onPress={() => {
//                                     haptics.medium();
//                                     onAction();
//                                     dismissPopup();
//                                 }}
//                                 style={styles.actionButtonWrapper}
//                             >
//                                 <View style={[
//                                     styles.actionButton,
//                                     { backgroundColor: accentColor }
//                                 ]}>
//                                     <Typography
//                                         variant="body"
//                                         weight="semibold"
//                                         color="textInverse"
//                                     >
//                                         {actionLabel}
//                                     </Typography>
//                                     <AppIcon
//                                         name="arrow-right"
//                                         size={18}
//                                         color="#FFF"
//                                     />
//                                 </View>
//                             </InteractiveWrapper>
//                         )}
//                     </GlassCard>
//                 </Animated.View>
//             </View>
//         </TouchableWithoutFeedback>
//     );
// }

// // --- Styles ---
// const styles = StyleSheet.create({
//     overlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 9999,
//         padding: 20,
//         ...Platform.select({
//             web: {
//                 backgroundColor: 'rgba(0,0,0,0.3)',
//             },
//         }),
//     },
//     container: {
//         width: '100%',
//         maxWidth: 400,
//         alignSelf: 'center',
//     },
//     card: {
//         padding: 24,
//         alignItems: 'center',
//         borderRadius: 24,
//         position: 'relative',
//         overflow: 'hidden',
//         width: '100%',
//     },
//     glowEffect: {
//         position: 'absolute',
//         top: -50,
//         right: -50,
//         width: 120,
//         height: 120,
//         borderRadius: 60,
//     },
//     glowEffect2: {
//         position: 'absolute',
//         bottom: -30,
//         left: -30,
//         width: 80,
//         height: 80,
//         borderRadius: 40,
//     },
//     levelBadge: {
//         alignSelf: 'center',
//         marginBottom: 12,
//         paddingHorizontal: 14,
//         paddingVertical: 4,
//         borderRadius: 16,
//         borderWidth: 1,
//         borderColor: 'rgba(255,255,255,0.1)',
//         backgroundColor: 'rgba(255,255,255,0.05)',
//     },
//     levelBadgeText: {
//         fontSize: 11,
//         letterSpacing: 0.5,
//     },
//     iconWrap: {
//         width: 80,
//         height: 80,
//         borderRadius: 40,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginBottom: 16,
//         position: 'relative',
//     },
//     iconBackground: {
//         width: 72,
//         height: 72,
//         borderRadius: 36,
//         alignItems: 'center',
//         justifyContent: 'center',
//         borderWidth: 2,
//     },
//     emojiText: {
//         fontSize: 36,
//         lineHeight: 44,
//     },
//     badge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//         paddingHorizontal: 14,
//         paddingVertical: 6,
//         borderRadius: 20,
//         marginBottom: 12,
//     },
//     title: {
//         textAlign: 'center',
//         marginBottom: 4,
//         fontSize: 24,
//         lineHeight: 30,
//     },
//     description: {
//         textAlign: 'center',
//         marginTop: 4,
//         lineHeight: 22,
//         paddingHorizontal: 12,
//     },
//     pointsContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//         marginTop: 12,
//         paddingHorizontal: 14,
//         paddingVertical: 4,
//         borderRadius: 16,
//         backgroundColor: 'rgba(255,255,255,0.05)',
//     },
//     progressTrack: {
//         height: 3,
//         borderRadius: 1.5,
//         overflow: 'hidden',
//         width: '100%',
//         marginTop: 20,
//     },
//     progressFill: {
//         height: '100%',
//         borderRadius: 1.5,
//     },
//     actionButtonWrapper: {
//         width: '100%',
//         marginTop: 16,
//     },
//     actionButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 8,
//         paddingVertical: 12,
//         paddingHorizontal: 24,
//         borderRadius: 12,
//         width: '100%',
//     },
// });

// // --- Helper Hook for Achievement Management ---
// import { useState, useCallback, useEffect, useRef } from 'react';
// import { GlassCard, Typography } from '../ui';
// import { InteractiveWrapper } from '../ui/InteractiveWrapper';

// interface AchievementState {
//     visible: boolean;
//     achievement: Achievement | null;
// }

// export function useAchievement() {
//     const [state, setState] = useState<AchievementState>({
//         visible: false,
//         achievement: null,
//     });

//     const showAchievement = useCallback((achievement: Achievement) => {
//         setState({
//             visible: true,
//             achievement,
//         });
//     }, []);

//     const hideAchievement = useCallback(() => {
//         setState({
//             visible: false,
//             achievement: null,
//         });
//     }, []);

//     const AchievementComponent = useCallback(() => {
//         if (!state.visible || !state.achievement) return null;

//         return (
//             <AchievementPopup
//                 achievement={state.achievement}
//                 onDismiss={hideAchievement}
//                 showConfetti
//                 showProgress
//             />
//         );
//     }, [state, hideAchievement]);

//     return {
//         showAchievement,
//         hideAchievement,
//         AchievementComponent,
//         isVisible: state.visible,
//     };
// }

// // --- Predefined Achievements ---
// export const ACHIEVEMENTS = {
//     FIRST_TRIP: {
//         title: 'First Trip',
//         description: 'Created your first trip! The journey begins.',
//         emoji: '🌍',
//         color: '#3B82F6',
//         points: 50,
//         level: 'bronze' as const,
//     },
//     EXPENSE_MASTER: {
//         title: 'Expense Master',
//         description: 'Added 100 expenses. You\'re on fire!',
//         emoji: '🔥',
//         color: '#F59E0B',
//         points: 100,
//         level: 'silver' as const,
//     },
//     SOCIAL_BUTTERFLY: {
//         title: 'Social Butterfly',
//         description: 'Added 10 members to your trips.',
//         emoji: '🦋',
//         color: '#EC4899',
//         points: 75,
//         level: 'silver' as const,
//     },
//     BUDGET_GURU: {
//         title: 'Budget Guru',
//         description: 'Stayed under budget for 5 trips in a row.',
//         emoji: '🧘',
//         color: '#10B981',
//         points: 150,
//         level: 'gold' as const,
//     },
//     SETTLEMENT_STAR: {
//         title: 'Settlement Star',
//         description: 'Settled 50 expenses without a dispute.',
//         emoji: '⭐',
//         color: '#8B5CF6',
//         points: 200,
//         level: 'platinum' as const,
//     },
//     TRAVEL_EXPERT: {
//         title: 'Travel Expert',
//         description: 'Visited 20 destinations with TripSplit.',
//         emoji: '✈️',
//         color: '#06B6D4',
//         points: 300,
//         level: 'diamond' as const,
//     },
// };
