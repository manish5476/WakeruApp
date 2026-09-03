import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
  Line,
} from 'react-native-svg';
import { colors } from '../theme/tokens';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const WORLD_DOTS = [
  [40, 60],
  [80, 40],
  [120, 55],
  [160, 35],
  [200, 50],
  [240, 40],
  [280, 60],
  [60, 100],
  [100, 90],
  [140, 100],
  [180, 85],
  [220, 95],
  [260, 100],
  [50, 140],
  [90, 135],
  [130, 145],
  [170, 130],
  [210, 140],
  [250, 135],
];

const ROUTE_D = 'M64,150 C110,90 150,190 200,110 S 300,60 320,90';
const PINS: [number, number][] = [
  [64, 150],
  [200, 110],
  [320, 90],
];

interface TravelHeroSceneProps {
  width?: number;
  height?: number;
}

/**
 * Premium isometric hero scene for the Welcome screen:
 * world-map dot grid · animated route line · destination pins ·
 * floating phone mock showing a Wareku balance card · floating
 * expense chip. Pure SVG + Animated — no heavy 3D rendering,
 * fully native-compatible.
 */
export default function TravelHeroScene({
  width = 360,
  height = 360,
}: TravelHeroSceneProps) {
  const dash = useRef(new Animated.Value(0)).current;
  const floatCard = useRef(new Animated.Value(0)).current;
  const floatPhone = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(dash, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatCard, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatCard, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatPhone, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatPhone, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const dashOffset = dash.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const cardTranslateY = floatCard.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const phoneTranslateY = floatPhone.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });
  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 360 360">
        <Defs>
          <SvgGradient id="glow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.oceanBlue} stopOpacity="0.35" />
            <Stop offset="1" stopColor={colors.travelCyan} stopOpacity="0.05" />
          </SvgGradient>
          <SvgGradient id="phoneScreen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.oceanBlue} />
            <Stop offset="1" stopColor={colors.travelCyan} />
          </SvgGradient>
        </Defs>

        {/* Ambient glow */}
        <Circle cx="180" cy="150" r="150" fill="url(#glow)" />

        {/* World dot grid */}
        {WORLD_DOTS.map(([cx, cy], i) => (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={i % 3 === 0 ? 2.4 : 1.6}
            fill="rgba(248,250,252,0.28)"
          />
        ))}

        {/* Animated route path */}
        <Path
          d={ROUTE_D}
          stroke={colors.travelCyan}
          strokeWidth={2.5}
          strokeDasharray="6,6"
          fill="none"
          opacity={0.9}
        />
        <AnimatedCircle
          r={0}
          opacity={0} /* keep Animated import tree-shake safe */
        />

        {/* Destination pins */}
        {PINS.map(([cx, cy], i) => (
          <G key={i}>
            {i === PINS.length - 1 && (
              <AnimatedCircle
                cx={cx}
                cy={cy}
                r={8}
                fill={colors.emerald}
                opacity={pulseOpacity as unknown as number}
                transform={`scale(${1})`}
              />
            )}
            <Circle
              cx={cx}
              cy={cy}
              r={6}
              fill={i === PINS.length - 1 ? colors.emerald : colors.oceanBlue}
              stroke="#fff"
              strokeWidth={2}
            />
          </G>
        ))}

        {/* Floating expense chip (top-right) */}
        <AnimatedG transform={[{ translateY: cardTranslateY }]}>
          <G transform="translate(236, 30)">
            <Rect
              x="0"
              y="0"
              width="100"
              height="46"
              rx="14"
              fill={colors.surfaceDark}
              opacity={0.94}
            />
            <Rect
              x="0"
              y="0"
              width="100"
              height="46"
              rx="14"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
            <Circle cx="20" cy="23" r="9" fill="rgba(16,185,129,0.2)" />
            <Path
              d="M16,23 l3,3 l6,-7"
              stroke={colors.emerald}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Rect
              x="36"
              y="14"
              width="48"
              height="7"
              rx="3.5"
              fill="rgba(255,255,255,0.85)"
            />
            <Rect
              x="36"
              y="26"
              width="32"
              height="6"
              rx="3"
              fill="rgba(255,255,255,0.35)"
            />
          </G>
        </AnimatedG>

        {/* Floating passport / route card (bottom-left) */}
        <AnimatedG transform={[{ translateY: cardTranslateY }]}>
          <G transform="translate(24, 236)">
            <Rect
              x="0"
              y="0"
              width="86"
              height="60"
              rx="14"
              fill={colors.surfaceDark}
              opacity={0.94}
            />
            <Rect
              x="0"
              y="0"
              width="86"
              height="60"
              rx="14"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
            <Rect
              x="14"
              y="14"
              width="58"
              height="6"
              rx="3"
              fill="rgba(255,255,255,0.85)"
            />
            <Rect
              x="14"
              y="26"
              width="40"
              height="5"
              rx="2.5"
              fill="rgba(255,255,255,0.35)"
            />
            <Circle cx="20" cy="42" r="7" fill={colors.oceanBlue} />
            <Circle cx="32" cy="42" r="7" fill={colors.travelCyan} />
            <Circle cx="44" cy="42" r="7" fill={colors.emerald} />
          </G>
        </AnimatedG>

        {/* Phone mock with Wareku dashboard */}
        <AnimatedG transform={[{ translateY: phoneTranslateY }]}>
          <G transform="translate(140, 118)">
            <Rect
              x="0"
              y="0"
              width="90"
              height="150"
              rx="20"
              fill={colors.midnightNavy}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth={2}
            />
            <Rect
              x="6"
              y="10"
              width="78"
              height="134"
              rx="14"
              fill="url(#phoneScreen)"
            />
            <Rect
              x="16"
              y="24"
              width="40"
              height="6"
              rx="3"
              fill="rgba(255,255,255,0.85)"
            />
            <Rect
              x="16"
              y="36"
              width="24"
              height="10"
              rx="5"
              fill="rgba(255,255,255,0.5)"
            />
            <Rect
              x="16"
              y="66"
              width="58"
              height="34"
              rx="10"
              fill="rgba(255,255,255,0.16)"
            />
            <Rect
              x="24"
              y="76"
              width="30"
              height="6"
              rx="3"
              fill="rgba(255,255,255,0.9)"
            />
            <Rect
              x="24"
              y="86"
              width="20"
              height="5"
              rx="2.5"
              fill="rgba(255,255,255,0.55)"
            />
            <Rect
              x="16"
              y="108"
              width="58"
              height="16"
              rx="8"
              fill="rgba(255,255,255,0.9)"
            />
          </G>
        </AnimatedG>
      </Svg>
    </View>
  );
}
