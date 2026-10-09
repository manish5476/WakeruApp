// components/common/GlobalLoader.tsx
import React, { useEffect, useState } from 'react';
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
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';

// ─── Preset mutation messages ────────────────────────────────
const MESSAGES: Record<string, string> = {
  'create-trip': 'Creating your trip…',
  'update-trip': 'Saving trip changes…',
  'delete-trip': 'Archiving trip…',
  'create-expense': 'Saving expense…',
  'update-expense': 'Saving expense…',
  'delete-expense': 'Removing expense…',
  'settle-balance': 'Calculating settlements…',
  'update-profile': 'Saving profile…',
  default: 'Working on it…',
};

// Fullscreen overlays wait this long before appearing, so quick requests
// don't flash a loader on screen.
const FULLSCREEN_DELAY_MS = 150;

export type GlobalLoaderProps = {
  visible?: boolean;
  trackMutations?: boolean;
  message?: string;
  /** Optional second line under the message, shown in a quieter colour. */
  description?: string;
  size?: 'small' | 'medium' | 'large' | number;
  color?: ColorValue;
  variant?: 'fullscreen' | 'inline';
  style?: StyleProp<ViewStyle>;
};

// ─── Helpers ─────────────────────────────────────────────────
/** Applies alpha to #rgb / #rrggbb / rgb() colours. Returns the input unchanged otherwise. */
function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split('')
        .map(c => c + c)
        .join('');
    if (hex.length >= 6) {
      const a = Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0');
      return `#${hex.slice(0, 6)}${a}`;
    }
  }
  const rgb = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})`;
  return color;
}

function useDelayedFlag(flag: boolean, delayMs: number): boolean {
  const [ready, setReady] = useState(delayMs === 0 ? flag : false);

  useEffect(() => {
    if (!flag) {
      setReady(false);
      return;
    }
    if (delayMs === 0) {
      setReady(true);
      return;
    }
    const timer = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(timer);
  }, [flag, delayMs]);

  return ready;
}

// ─── Spinner ─────────────────────────────────────────────────
// Kept under its original export name so existing imports keep working.
export function LuminousOrbLoader({
  size = 44,
  color,
}: {
  size?: number;
  color?: ColorValue;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const tone = (color || theme.colors.primary) as string;

  const outer = useSharedValue(0);
  const inner = useSharedValue(0);

  useEffect(() => {
    const slow = reduceMotion ? 2.5 : 1;
    outer.value = withRepeat(
      withTiming(360, { duration: 1000 * slow, easing: Easing.linear }),
      -1,
      false,
    );
    inner.value = withRepeat(
      withTiming(-360, { duration: 1700 * slow, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(outer);
      cancelAnimation(inner);
    };
  }, [outer, inner, reduceMotion]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${outer.value}deg` }],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${inner.value}deg` }],
  }));

  const stroke = Math.max(2, Math.round(size * 0.075));
  const innerSize = size * 0.62;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      {/* Track */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: withAlpha(tone, 0.14),
          },
        ]}
      />

      {/* Outer arc: fast, clockwise, with a fading tail */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: 'transparent',
            borderTopColor: tone,
            borderRightColor: withAlpha(tone, 0.35),
          },
          outerStyle,
        ]}
      />

      {/* Inner arc: slower, counter-clockwise, quieter */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            borderWidth: Math.max(1.5, stroke - 1),
            borderColor: 'transparent',
            borderBottomColor: withAlpha(tone, 0.55),
            borderLeftColor: withAlpha(tone, 0.2),
          },
          innerStyle,
        ]}
      />
    </View>
  );
}

// ─── Main loader ─────────────────────────────────────────────
export default function GlobalLoader({
  visible,
  trackMutations = false,
  message,
  description,
  size = 'large',
  color,
  variant = 'fullscreen',
  style,
}: GlobalLoaderProps) {
  const theme = useTheme();
  const mutationCount = useIsMutating();
  const pendingKeys = useMutationState({
    filters: { status: 'pending' },
    select: mutation => mutation.options.mutationKey?.[0] as string | undefined,
  });

  const wantsVisible = visible ?? (trackMutations ? mutationCount > 0 : true);
  const resolvedVisible = useDelayedFlag(
    wantsVisible,
    variant === 'fullscreen' ? FULLSCREEN_DELAY_MS : 0,
  );

  const resolvedSize =
    typeof size === 'number'
      ? size
      : size === 'small'
        ? 24
        : size === 'medium'
          ? 36
          : 48;

  const mutationKey = pendingKeys[0];
  const resolvedMessage =
    message ??
    (trackMutations
      ? (MESSAGES[mutationKey ?? 'default'] ?? MESSAGES.default)
      : undefined);

  if (!resolvedVisible) return null;

  const body = (
    <>
      <LuminousOrbLoader size={resolvedSize} color={color} />
      {resolvedMessage ? (
        <Typography
          variant="bodySm"
          weight="bold"
          color="textPrimary"
          align="center"
          style={styles.message}
        >
          {resolvedMessage}
        </Typography>
      ) : null}
      {description ? (
        <Typography
          variant="caption"
          color="textSecondary"
          align="center"
          style={styles.description}
        >
          {description}
        </Typography>
      ) : null}
    </>
  );

  if (variant === 'inline') {
    return (
      <View
        style={[styles.inlineWrapper, style]}
        accessibilityLiveRegion="polite"
      >
        {body}
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      style={[styles.overlay, style]}
      pointerEvents="auto"
      accessibilityLiveRegion="polite"
    >
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: theme.isDark
              ? 'rgba(10, 15, 28, 0.72)'
              : 'rgba(248, 250, 252, 0.72)',
          },
        ]}
      />
      <GlassCard
        variant="prominent"
        padding="lg"
        intensity={theme.isDark ? 50 : 35}
        style={[
          styles.card,
          {
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(15,23,42,0.06)',
          },
        ]}
      >
        {body}
      </GlassCard>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  inlineWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  card: {
    minWidth: 200,
    maxWidth: 280,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow:
          '0 20px 40px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06)',
      } as any,
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
        elevation: 8,
      },
    }),
  },
  message: {
    marginTop: 18,
    letterSpacing: -0.1,
  },
  description: {
    marginTop: 4,
  },
  ring: {
    position: 'absolute',
  },
});
// // components/common/GlobalLoader.tsx
// import React, { useEffect, useMemo } from 'react';
// import { ColorValue, StyleProp, StyleSheet, View, ViewStyle, Platform } from 'react-native';
// import { useIsMutating, useMutationState } from '@tanstack/react-query';
// import Animated, {
//   Easing,
//   cancelAnimation,
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withTiming,
// } from 'react-native-reanimated';
// import { useTheme } from '../../providers/ThemeProvider';
// import { GlassCard } from '../ui/GlassCard';
// import { Typography } from '../ui/Typography';

// // ─── Preset Mutation Messages ────────────────────────────────
// const MESSAGES: Record<string, string> = {
//   'create-trip': 'Creating your expedition…',
//   'update-trip': 'Updating trip telemetry…',
//   'delete-trip': 'Archiving trip…',
//   'create-expense': 'Recording expense…',
//   'update-expense': 'Updating expense…',
//   'delete-expense': 'Removing transaction…',
//   'settle-balance': 'Optimizing settlements…',
//   'update-profile': 'Syncing profile…',
//   default: 'Processing request…',
// };

// export type GlobalLoaderProps = {
//   visible?: boolean;
//   trackMutations?: boolean;
//   message?: string;
//   size?: 'small' | 'medium' | 'large' | number;
//   color?: ColorValue;
//   variant?: 'fullscreen' | 'inline';
//   style?: StyleProp<ViewStyle>;
// };

// // ─── Luminous Fluid Orb Component ─────────────────────────────
// export function LuminousOrbLoader({
//   size = 44,
//   color,
// }: {
//   size?: number;
//   color?: ColorValue;
// }) {
//   const theme = useTheme();
//   const primaryColor = (color || theme.colors.primary) as string;

//   // Concentric harmonic animation values
//   const pulse = useSharedValue(0);
//   const orbit = useSharedValue(0);

//   useEffect(() => {
//     pulse.value = withRepeat(
//       withTiming(1, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
//       -1,
//       true
//     );
//     orbit.value = withRepeat(
//       withTiming(360, { duration: 6000, easing: Easing.linear }),
//       -1,
//       false
//     );

//     return () => {
//       cancelAnimation(pulse);
//       cancelAnimation(orbit);
//     };
//   }, []);

//   // Outer ambient fluid aura
//   const outerAuraStyle = useAnimatedStyle(() => {
//     const scale = 1 + pulse.value * 0.25;
//     const opacity = 0.25 + (1 - pulse.value) * 0.25;
//     return {
//       transform: [{ scale }],
//       opacity,
//     };
//   });

//   // Intermediate orbital wave
//   const orbitalWaveStyle = useAnimatedStyle(() => {
//     const scale = 1.15 - pulse.value * 0.15;
//     return {
//       transform: [
//         { rotate: `${orbit.value}deg` },
//         { scale },
//       ],
//     };
//   });

//   // Inner core fluid pulse
//   const innerCoreStyle = useAnimatedStyle(() => {
//     const scale = 0.85 + pulse.value * 0.2;
//     return {
//       transform: [{ scale }],
//     };
//   });

//   const baseDimension = size;
//   const coreDimension = size * 0.45;

//   return (
//     <View style={[styles.orbContainer, { width: baseDimension * 1.5, height: baseDimension * 1.5 }]}>
//       {/* Layer 1: Ambient Glowing Halo */}
//       <Animated.View
//         style={[
//           styles.ambientHalo,
//           {
//             width: baseDimension * 1.3,
//             height: baseDimension * 1.3,
//             borderRadius: (baseDimension * 1.3) / 2,
//             backgroundColor: `${primaryColor}22`,
//           },
//           outerAuraStyle,
//         ]}
//       />

//       {/* Layer 2: Translucent Orbital Ring */}
//       <Animated.View
//         style={[
//           styles.orbitalRing,
//           {
//             width: baseDimension,
//             height: baseDimension,
//             borderRadius: baseDimension / 2,
//             borderColor: `${primaryColor}55`,
//             borderTopColor: `${primaryColor}CC`,
//             borderRightColor: `${primaryColor}15`,
//           },
//           orbitalWaveStyle,
//         ]}
//       />

//       {/* Layer 3: Central Luminous Core */}
//       <Animated.View
//         style={[
//           styles.fluidCore,
//           {
//             width: coreDimension,
//             height: coreDimension,
//             borderRadius: coreDimension / 2,
//             backgroundColor: primaryColor,
//             shadowColor: primaryColor,
//           },
//           innerCoreStyle,
//         ]}
//       />
//     </View>
//   );
// }

// // ─── Main Global Loader ──────────────────────────────────────
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

//   const resolvedVisible = visible ?? (trackMutations ? mutationCount > 0 : true);
//   const resolvedSize =
//     typeof size === 'number'
//       ? size
//       : size === 'small'
//       ? 24
//       : size === 'medium'
//       ? 36
//       : 48;

//   const mutationKey = mutations[0]?.options?.mutationKey?.[0] as string | undefined;
//   const resolvedMessage =
//     message ??
//     (trackMutations ? MESSAGES[mutationKey ?? 'default'] ?? MESSAGES.default : undefined);

//   if (!resolvedVisible) return null;

//   const innerContent = (
//     <>
//       <LuminousOrbLoader size={resolvedSize} color={color} />
//       {resolvedMessage ? (
//         <Typography
//           variant="bodySm"
//           weight="bold"
//           color="textPrimary"
//           align="center"
//           style={{ marginTop: 14, letterSpacing: -0.2 }}
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
//         intensity={theme.isDark ? 50 : 35}
//         style={styles.fullscreenCard}
//       >
//         {innerContent}
//       </GlassCard>
//     ) : (
//       <View style={styles.inlineContent}>{innerContent}</View>
//     );

//   if (variant === 'inline') {
//     return <View style={[styles.inlineWrapper, style]}>{content}</View>;
//   }

//   return (
//     <View style={[styles.overlay, style]} pointerEvents="auto">
//       <View
//         style={[
//           styles.backdrop,
//           {
//             backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)',
//           },
//         ]}
//       />
//       {content}
//     </View>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   overlay: {
//     ...StyleSheet.absoluteFill,
//     zIndex: 99999,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   backdrop: {
//     ...StyleSheet.absoluteFill,
//   },
//   inlineWrapper: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: 44,
//   },
//   inlineContent: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   fullscreenCard: {
//     minWidth: 190,
//     paddingHorizontal: 28,
//     paddingVertical: 26,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 24,
//     ...Platform.select({
//       web: {
//         boxShadow: '0 24px 48px rgba(0,0,0,0.22)',
//       } as any,
//       default: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 6 },
//         shadowOpacity: 0.15,
//         shadowRadius: 14,
//         elevation: 6,
//       },
//     }),
//   },
//   orbContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   ambientHalo: {
//     position: 'absolute',
//   },
//   orbitalRing: {
//     position: 'absolute',
//     borderWidth: 2,
//   },
//   fluidCore: {
//     position: 'absolute',
//     shadowOffset: { width: 0, height: 0 },
//     shadowOpacity: 0.6,
//     shadowRadius: 10,
//     elevation: 4,
//   },
// });
