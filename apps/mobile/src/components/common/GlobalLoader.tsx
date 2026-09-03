// components/common/GlobalLoader.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ColorValue,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  Platform,
} from 'react-native';
import { useIsMutating, useMutationState } from '@tanstack/react-query';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import AppIcon from './AppIcon';

// ─── Constants ───────────────────────────────────────────────
const TRIP_ICONS = ['map', 'banknote', 'users', 'plane', 'receipt'] as const;

const MESSAGES: Record<string, string> = {
  'create-trip': 'Creating your expedition…',
  'update-trip': 'Updating trip telemetry…',
  'delete-trip': 'Archiving trip…',
  'create-expense': 'Recording expense…',
  'update-expense': 'Updating expense…',
  'delete-expense': 'Removing transaction…',
  'settle-balance': 'Optimizing settlements…',
  'update-profile': 'Syncing profile…',
  default: 'Processing request…',
};

type GlobalLoaderProps = {
  visible?: boolean;
  trackMutations?: boolean;
  message?: string;
  size?: 'small' | 'large' | number;
  color?: ColorValue;
  variant?: 'fullscreen' | 'inline';
  style?: StyleProp<ViewStyle>;
};

// ─── Animated Rotating Icon Component ────────────────────────
function AnimatedRotatingIcon({
  icon,
  size,
  color,
}: {
  icon: string;
  size: number;
  color: ColorValue;
}) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(0.75, { damping: 14, stiffness: 280 }, () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 280 });
    });
    rotation.value = withSpring(rotation.value + 360, {
      damping: 18,
      stiffness: 150,
    });
  }, [icon]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AppIcon name={icon as any} size={size} color={color} />
    </Animated.View>
  );
}

// ─── Main Loader Component ───────────────────────────────────
export default function GlobalLoader({
  visible,
  trackMutations = false,
  message,
  size = 'large',
  color,
  variant = 'fullscreen',
  style,
}: GlobalLoaderProps) {
  const theme = useTheme();
  const styles = useMemo(() => loaderStyles(theme), [theme]);
  const mutationCount = useIsMutating();
  const mutations = useMutationState({
    filters: { status: 'pending' },
    select: mutation => mutation,
  });

  const [iconIndex, setIconIndex] = useState(0);

  const resolvedVisible =
    visible ?? (trackMutations ? mutationCount > 0 : true);
  const resolvedSize =
    typeof size === 'number' ? size : size === 'small' ? 18 : 28;
  const mutationKey = mutations[0]?.options?.mutationKey?.[0] as
    string | undefined;
  const resolvedMessage =
    message ??
    (trackMutations
      ? (MESSAGES[mutationKey ?? 'default'] ?? MESSAGES.default)
      : undefined);

  // ─── Master Clock Animation Loop ───────────────────────────
  const masterClock = useSharedValue(0);

  useEffect(() => {
    if (!resolvedVisible) {
      cancelAnimation(masterClock);
      masterClock.value = 0;
      return;
    }

    masterClock.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(masterClock);
    };
  }, [resolvedVisible]);

  // Safely update icon index via JS thread bridge
  const updateIconIndex = useCallback(() => {
    setIconIndex(prev => (prev + 1) % TRIP_ICONS.length);
  }, []);

  useDerivedValue(() => {
    if (masterClock.value >= 0.95) {
      runOnJS(updateIconIndex)();
    }
  }, [masterClock, updateIconIndex]);

  if (!resolvedVisible) return null;

  const iconColor = (color ?? theme.colors.primary) as ColorValue;

  const innerContent = (
    <>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            width: resolvedSize * 2.4,
            height: resolvedSize * 2.4,
            borderRadius: resolvedSize * 1.2,
            backgroundColor: `${theme.colors.primary}15`,
            borderColor: `${theme.colors.primary}30`,
          },
        ]}
      >
        <AnimatedRotatingIcon
          icon={TRIP_ICONS[iconIndex]}
          size={resolvedSize}
          color={iconColor}
        />
      </Animated.View>

      {resolvedMessage ? (
        <Typography
          variant="bodySm"
          weight="extrabold"
          color="textPrimary"
          align="center"
          style={{ marginTop: 12, letterSpacing: -0.2 }}
        >
          {resolvedMessage}
        </Typography>
      ) : null}
    </>
  );

  const content =
    variant === 'fullscreen' ? (
      <GlassCard
        variant="prominent"
        padding="lg"
        intensity={theme.isDark ? 45 : 30}
        style={[styles.content, styles.fullscreenCard]}
      >
        {innerContent}
      </GlassCard>
    ) : (
      <View style={styles.content}>{innerContent}</View>
    );

  if (variant === 'inline') {
    return <View style={[styles.inline, style]}>{content}</View>;
  }

  return (
    <View style={[styles.overlay, style]} pointerEvents="auto">
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: theme.isDark
              ? 'rgba(15, 23, 42, 0.75)'
              : 'rgba(255, 255, 255, 0.75)',
          },
        ]}
      />
      {content}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
function loaderStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      zIndex: 99999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    inline: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullscreenCard: {
      minWidth: 180,
      paddingHorizontal: 28,
      paddingVertical: 26,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(15,23,42,0.06)',

      ...Platform.select({
        web: {
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
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
    iconWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
    },
  });
}
// // components/common/GlobalLoader.tsx
// import React, { useEffect, useState } from 'react';
// import { ColorValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
// import { useIsMutating, useMutationState } from '@tanstack/react-query';
// import Animated, {
//   Easing,
//   cancelAnimation,
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withTiming,
//   withSpring,
//   useDerivedValue,
//   runOnJS,
// } from 'react-native-reanimated';
// import { useTheme } from '../../providers/ThemeProvider';
// import { GlassCard } from '../ui/GlassCard';
// import { Typography } from '../ui/Typography';
// import AppIcon from './AppIcon';

// // ─── Constants ───────────────────────────────────────────────
// const TRIP_ICONS = ['map', 'banknote', 'users', 'plane', 'receipt'] as const;

// const MESSAGES: Record<string, string> = {
//   'create-trip': 'Creating your trip…',
//   'update-trip': 'Updating trip details…',
//   'delete-trip': 'Removing trip…',
//   'create-expense': 'Saving expense…',
//   'update-expense': 'Updating expense…',
//   'delete-expense': 'Removing expense…',
//   'settle-balance': 'Settling balances…',
//   'update-profile': 'Updating profile…',
//   default: 'Working on it…',
// };

// type GlobalLoaderProps = {
//   visible?: boolean;
//   trackMutations?: boolean;
//   message?: string;
//   size?: 'small' | 'large' | number;
//   color?: ColorValue;
//   variant?: 'fullscreen' | 'inline';
//   style?: StyleProp<ViewStyle>;
// };

// // ─── Animated Rotating Icon ──────────────────────────────────
// function AnimatedRotatingIcon({
//   icon,
//   size,
//   color,
// }: {
//   icon: string;
//   size: number;
//   color: ColorValue;
// }) {
//   const rotation = useSharedValue(0);
//   const scale = useSharedValue(1);

//   useEffect(() => {
//     // Spring crossfade when icon changes
//     scale.value = withSpring(0.8, { damping: 15, stiffness: 300 }, () => {
//       scale.value = withSpring(1, { damping: 15, stiffness: 300 });
//     });
//     rotation.value = withSpring(rotation.value + 5, { damping: 15, stiffness: 200 });
//   }, [icon]);

//   const animatedStyle = useAnimatedStyle(() => ({
//     transform: [
//       { rotate: `${rotation.value}deg` },
//       { scale: scale.value },
//     ],
//   }));

//   return (
//     <Animated.View style={animatedStyle}>
//       <AppIcon name={icon as any} size={size} color={color} />
//     </Animated.View>
//   );
// }

// // ─── Main Loader ─────────────────────────────────────────────
// export default function GlobalLoader({
//   visible,
//   trackMutations = false,
//   message,
//   size = 'large',
//   color,
//   variant = 'fullscreen',
//   style,
// }: GlobalLoaderProps) {
//   const theme = useTheme();
//   const mutationCount = useIsMutating();
//   const mutations = useMutationState({
//     filters: { status: 'pending' },
//     select: (mutation) => mutation,
//   });

//   const [iconIndex, setIconIndex] = useState(0);

//   const resolvedVisible = visible ?? (trackMutations ? mutationCount > 0 : true);
//   const resolvedSize = typeof size === 'number' ? size : size === 'small' ? 20 : 32;
//   const mutationKey = mutations[0]?.options?.mutationKey?.[0] as string | undefined;
//   const resolvedMessage =
//     message ??
//     (trackMutations ? MESSAGES[mutationKey ?? 'default'] ?? MESSAGES.default : undefined);

//   // ─── Master Clock: Reanimated Animation Loop ───────────────
//   const masterClock = useSharedValue(0);

//   useEffect(() => {
//     if (!resolvedVisible) {
//       cancelAnimation(masterClock);
//       masterClock.value = 0;
//       return;
//     }

//     masterClock.value = withRepeat(
//       withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
//       -1,
//       true
//     );

//     return () => {
//       cancelAnimation(masterClock);
//     };
//   }, [resolvedVisible]);

//   // Switch icon on each pulse cycle completion
//   useDerivedValue(() => {
//     if (masterClock.value <= 0.01 || masterClock.value >= 0.99) {
//       runOnJS(setIconIndex)((prev: number) => (prev + 1) % TRIP_ICONS.length);
//     }
//   }, [masterClock]);

//   // ─── Animated Styles ───────────────────────────────────────
//   const pulseAnimatedStyle = useAnimatedStyle(() => ({
//     transform: [{ scale: 1 + masterClock.value * 0.1 }],
//     opacity: 0.7 + masterClock.value * 0.3,
//   }));

//   // ─── Render ────────────────────────────────────────────────
//   if (!resolvedVisible) return null;

//   const iconColor = (color ?? theme.colors.primary) as ColorValue;

//   const innerContent = (
//     <>
//       <Animated.View
//         style={[
//           loaderStyles(theme).iconWrapper,
//           {
//             width: resolvedSize * 2.2,
//             height: resolvedSize * 2.2,
//             borderRadius: resolvedSize * 1.1,
//           },
//           pulseAnimatedStyle,
//         ]}
//       >
//         <AnimatedRotatingIcon
//           icon={TRIP_ICONS[iconIndex]}
//           size={resolvedSize}
//           color={iconColor}
//         />
//       </Animated.View>
//       {resolvedMessage ? (
//         <Typography
//           variant="bodySm"
//           weight="semibold"
//           color="textPrimary"
//           align="center"
//           style={{ marginTop: 14 }}
//         >
//           {resolvedMessage}
//         </Typography>
//       ) : null}
//     </>
//   );

//   const content =
//     variant === 'fullscreen' ? (
//       <GlassCard
//         variant="prominent"
//         padding="lg"
//         intensity={theme.isDark ? 40 : 20}
//         style={[loaderStyles(theme).content, loaderStyles(theme).fullscreenCard]}
//       >
//         {innerContent}
//       </GlassCard>
//     ) : (
//       <View style={loaderStyles(theme).content}>{innerContent}</View>
//     );

//   if (variant === 'inline') {
//     return <View style={[loaderStyles(theme).inline, style]}>{content}</View>;
//   }

//   return (
//     <View style={[loaderStyles(theme).overlay, style]} pointerEvents="auto">
//       <View style={[loaderStyles(theme).backdrop, { backgroundColor: theme.colors.overlay }]} />
//       {content}
//     </View>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────
// function loaderStyles(theme: ReturnType<typeof useTheme>) {
//   return StyleSheet.create({
//     overlay: {
//       ...StyleSheet.absoluteFill,
//       zIndex: 9999,
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     backdrop: {
//       ...StyleSheet.absoluteFill,
//     },
//     inline: {
//       alignItems: 'center',
//       justifyContent: 'center',
//       minHeight: 44,
//     },
//     content: {
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     fullscreenCard: {
//       minWidth: 176,
//       paddingHorizontal: 32,
//       paddingVertical: 32,
//       alignItems: 'center',
//       justifyContent: 'center',
//     },
//     iconWrapper: {
//       alignItems: 'center',
//       justifyContent: 'center',
//       backgroundColor: theme.colors.primaryBg,
//     },
//   });
// }
