import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import AppIcon from '../../common/AppIcon';
import { colors, radius, spacing, shadow } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Person {
  id: string;
  name: string;
  uri: string;
}

interface SettlementGraphProps {
  people: [Person, Person, Person, Person]; // A, B, C, D
}

/**
 * Visualizes the debt-simplification engine:
 * BEFORE — A→B→C→D chain (3 transactions)
 * AFTER  — A→D only (1 transaction), drawn with an animated stroke
 * to feel like the optimization is happening live.
 */
export default function SettlementGraph({ people }: SettlementGraphProps) {
  const draw = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(draw, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const strokeDashoffset = draw.interpolate({
    inputRange: [0, 1],
    outputRange: [240, 0],
  });
  const badgeScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const [a, b, c, d] = people;

  return (
    <View style={[styles.card, shadow.card]}>
      {/* BEFORE state */}
      <View style={styles.beforeRow}>
        <Text style={styles.sectionLabel}>BEFORE · 3 TRANSFERS</Text>
        <View style={styles.chainRow}>
          {[a, b, c, d].map((p, i) => (
            <React.Fragment key={p.id}>
              <View style={styles.miniAvatarWrap}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>{p.name[0]}</Text>
                </View>
              </View>
              {i < 3 && (
                <AppIcon
                  name="arrow-right"
                  size={12}
                  color={colors.textOnDarkFaint}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Optimization divider */}
      <View style={styles.optimizeDivider}>
        <View style={styles.dashLine} />
        <Animated.View
          style={[styles.optimizeBadge, { transform: [{ scale: badgeScale }] }]}
        >
          <AppIcon name="sparkles" size={12} color={colors.textOnDark} />
          <Text style={styles.optimizeText}>AI optimizing…</Text>
        </Animated.View>
        <View style={styles.dashLine} />
      </View>

      {/* AFTER state */}
      <View>
        <Text style={styles.sectionLabel}>AFTER · 1 TRANSFER</Text>
        <View style={styles.afterRow}>
          <View style={styles.personBlock}>
            <View
              style={[styles.avatarLg, { backgroundColor: colors.oceanBlue }]}
            >
              <Text style={styles.avatarLgText}>{a.name[0]}</Text>
            </View>
            <Text style={styles.personName}>{a.name}</Text>
          </View>

          <View style={styles.pathWrap}>
            <Svg width="100%" height="40" viewBox="0 0 160 40">
              <Defs>
                <SvgGradient id="settleLine" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={colors.oceanBlue} />
                  <Stop offset="1" stopColor={colors.emerald} />
                </SvgGradient>
              </Defs>
              <AnimatedPath
                d="M4,20 C50,4 110,4 156,20"
                stroke="url(#settleLine)"
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
                strokeDasharray="240"
                strokeDashoffset={strokeDashoffset as unknown as number}
              />
            </Svg>
            <View style={styles.amountPill}>
              <Text style={styles.amountPillText}>₹4,200</Text>
            </View>
          </View>

          <View style={styles.personBlock}>
            <View
              style={[styles.avatarLg, { backgroundColor: colors.emerald }]}
            >
              <Text style={styles.avatarLgText}>{d.name[0]}</Text>
            </View>
            <Text style={styles.personName}>{d.name}</Text>
          </View>
        </View>

        <View style={styles.successRow}>
          <View style={styles.successIconWrap}>
            <AppIcon name="check" size={12} color={colors.emerald} />
          </View>
          <Text style={styles.successText}>
            Settlement ready — one tap to pay
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  sectionLabel: {
    color: colors.textOnDarkFaint,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  beforeRow: { marginBottom: spacing.md },
  chainRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniAvatarWrap: {},
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    color: colors.textOnDarkMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  optimizeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dashLine: { flex: 1, height: 1, backgroundColor: colors.glassBorder },
  optimizeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(37,99,235,0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  optimizeText: { color: colors.travelCyan, fontSize: 10, fontWeight: '700' },
  afterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personBlock: { alignItems: 'center', width: 56 },
  avatarLg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLgText: { color: colors.textOnDark, fontSize: 16, fontWeight: '800' },
  personName: {
    color: colors.textOnDark,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  pathWrap: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  amountPill: {
    position: 'absolute',
    top: -6,
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  amountPillText: { color: colors.textOnDark, fontSize: 11, fontWeight: '800' },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  successIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: colors.textOnDarkMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
