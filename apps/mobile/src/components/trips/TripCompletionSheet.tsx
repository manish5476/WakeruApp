/**
 * TripCompletionSheet
 *
 * A premium celebration modal shown when a trip is marked as completed.
 * Gives users a dopamine hit at the right moment — the "trip closing" event.
 *
 * What it does:
 *  ✓ Confetti-like pulsing celebration animation
 *  ✓ Shows trip stats summary (total spent, members, days, stops)
 *  ✓ CTA to view trip report or share trip summary card
 *  ✓ Haptic feedback on mount and on CTA press
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  Share,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import { GlassCard } from '../ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';

export interface TripCompletionData {
  tripTitle: string;
  totalSpent: number;
  currency: string;
  memberCount: number;
  durationDays: number;
  stopCount: number;
  inviteCode?: string;
}

interface TripCompletionSheetProps {
  visible: boolean;
  data: TripCompletionData | null;
  onClose: () => void;
  onViewReport?: () => void;
  onShareSummary?: () => void;
}

const EMOJIS = ['🎉', '✈️', '🌍', '💫', '🥂', '🗺️'];

export function TripCompletionSheet({
  visible,
  data,
  onClose,
  onViewReport,
  onShareSummary,
}: TripCompletionSheetProps) {
  const theme = useTheme();

  // Scale-in animation for the card
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Floating emoji animations
  const emojiAnims = useRef(
    EMOJIS.map(() => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      x: new Animated.Value(0),
    })),
  ).current;

  // Pulse animation for the celebration icon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    haptics.success?.() ?? haptics.medium();

    // Card entrance
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating emoji burst
    emojiAnims.forEach((anim, i) => {
      const delay = i * 80;
      const targetY = -120 - Math.random() * 80;
      const targetX = (Math.random() - 0.5) * 160;

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: targetY,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(anim.x, {
            toValue: targetX,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(600),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });

    // Pulse loop on the celebration icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Reset animations on unmount
    return () => {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      emojiAnims.forEach(a => {
        a.y.setValue(0);
        a.x.setValue(0);
        a.opacity.setValue(0);
      });
      pulseAnim.setValue(1);
    };
  }, [visible]);

  if (!data) return null;

  const cs = data.currency === 'INR' ? '₹' : data.currency;

  const handleShare = async () => {
    haptics.light();
    if (onShareSummary) {
      onShareSummary();
    } else {
      try {
        await Share.share({
          message: `Just wrapped up "${data.tripTitle}" on Wakeru! ✈️\n${data.memberCount} people · ${data.durationDays} days · ${cs}${data.totalSpent.toLocaleString()} total`,
          title: `${data.tripTitle} — Trip Complete`,
        });
      } catch {
        // user dismissed
      }
    }
  };

  const handleReport = () => {
    haptics.medium();
    onViewReport?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss trip completion celebration"
      />

      {/* Floating emojis */}
      <View style={styles.emojiContainer} pointerEvents="none">
        {EMOJIS.map((emoji, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.floatingEmoji,
              {
                transform: [
                  { translateY: emojiAnims[i].y },
                  { translateX: emojiAnims[i].x },
                ],
                opacity: emojiAnims[i].opacity,
              },
            ]}
          >
            {emoji}
          </Animated.Text>
        ))}
      </View>

      {/* Card */}
      <View style={styles.centeredView} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <GlassCard style={styles.card} intensity={theme.isDark ? 30 : 20}>
            {/* Close button */}
            <Pressable
              style={[
                styles.closeBtn,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close celebration"
            >
              <AppIcon name="x" size={16} color={theme.colors.textTertiary} />
            </Pressable>

            {/* Celebration icon */}
            <View style={styles.iconArea}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <LinearGradient
                  colors={[theme.colors.accent, theme.colors.primary]}
                  style={styles.celebIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.celebEmoji}>🎉</Text>
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Trip Complete!
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              {data.tripTitle}
            </Text>

            {/* Stats grid */}
            <View
              style={[
                styles.statsGrid,
                { borderColor: theme.colors.borderLight },
              ]}
            >
              <StatCell
                label="Total Spent"
                value={`${cs}${data.totalSpent.toLocaleString()}`}
                icon="credit-card"
                color={theme.colors.accent}
                theme={theme}
              />
              <StatCell
                label="Travelers"
                value={`${data.memberCount}`}
                icon="users"
                color={theme.colors.primary}
                theme={theme}
              />
              <StatCell
                label="Days"
                value={`${data.durationDays}`}
                icon="calendar"
                color={theme.colors.info}
                theme={theme}
              />
              <StatCell
                label="Stops"
                value={`${data.stopCount}`}
                icon="map-pin"
                color={theme.colors.success}
                theme={theme}
              />
            </View>

            {/* CTAs */}
            <View style={styles.actions}>
              <Pressable
                style={[
                  styles.btnSecondary,
                  {
                    borderColor: theme.colors.borderLight,
                    backgroundColor: theme.colors.card,
                  },
                ]}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share trip summary"
              >
                <AppIcon
                  name="share-2"
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.btnSecondaryText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Share
                </Text>
              </Pressable>

              <Pressable
                style={styles.btnPrimary}
                onPress={handleReport}
                accessibilityRole="button"
                accessibilityLabel="View full trip report"
              >
                <LinearGradient
                  colors={[theme.colors.accent, theme.colors.primary]}
                  style={styles.btnPrimaryInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <AppIcon name="bar-chart-2" size={16} color="#FFF" />
                  <Text style={styles.btnPrimaryText}>View Report</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Footer nudge */}
            <Text
              style={[styles.footerNote, { color: theme.colors.textTertiary }]}
            >
              Settle remaining balances to close the trip ✓
            </Text>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Stat Cell sub-component ─────────────────────────────────────────────────
function StatCell({
  label,
  value,
  icon,
  color,
  theme,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  theme: any;
}) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <AppIcon name={icon as any} size={14} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  emojiContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 28,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconArea: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  celebIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 20,
    marginBottom: 20,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnPrimary: {
    flex: 1.8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnPrimaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 16,
  },
  btnPrimaryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
  },
});
