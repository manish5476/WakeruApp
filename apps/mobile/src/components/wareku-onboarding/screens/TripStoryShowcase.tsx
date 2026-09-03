import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import {
  IconSparkles,
  IconMusic,
  IconTrophy,
  IconArrowRight,
} from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

interface StorySlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  gradient: readonly [string, string, ...string[]];
  content: React.ReactNode;
}

export function TripStoryShowcase() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides: StorySlide[] = [
    {
      id: 'stats',
      tag: 'JOURNEY STATS',
      title: 'Euro-Tour 2026',
      subtitle: 'London · Paris · Amsterdam',
      image:
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
      gradient: ['rgba(15,23,42,0.1)', 'rgba(15,23,42,0.85)', '#0B1220'],
      content: (
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>4,280 km</Text>
            <Text style={styles.statLabel}>Distance Covered</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>3 Nations</Text>
            <Text style={styles.statLabel}>UK · FR · NL</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>28 Stops</Text>
            <Text style={styles.statLabel}>Curated Moments</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>₹2.4L</Text>
            <Text style={styles.statLabel}>Total Trip Spend</Text>
          </View>
        </View>
      ),
    },
    {
      id: 'superstars',
      tag: 'SPENDING SUPERSTARS',
      title: 'Who Carried The Crew',
      subtitle: 'Breakdown of group contributions',
      image:
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80',
      gradient: ['rgba(15,23,42,0.2)', 'rgba(15,23,42,0.85)', '#0B1220'],
      content: (
        <View style={styles.cardList}>
          <View style={styles.superstarRow}>
            <View
              style={[styles.superstarAvatar, { backgroundColor: '#2563EB' }]}
            >
              <Text style={styles.avatarLetter}>A</Text>
            </View>
            <View style={styles.superstarInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.superstarName}>Arjun</Text>
                <View style={styles.crownPill}>
                  <Text style={styles.crownText}>👑 The Bank</Text>
                </View>
              </View>
              <Text style={styles.superstarDetail}>
                Fronted ₹1,12,000 for villas & flights
              </Text>
            </View>
          </View>

          <View style={styles.superstarRow}>
            <View
              style={[styles.superstarAvatar, { backgroundColor: '#10B981' }]}
            >
              <Text style={styles.avatarLetter}>R</Text>
            </View>
            <View style={styles.superstarInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.superstarName}>Rahul</Text>
                <View
                  style={[
                    styles.crownPill,
                    { backgroundColor: 'rgba(16,185,129,0.15)' },
                  ]}
                >
                  <Text style={[styles.crownText, { color: '#10B981' }]}>
                    💡 Frugal Champ
                  </Text>
                </View>
              </View>
              <Text style={styles.superstarDetail}>
                Saved group €180 using group transit passes
              </Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 'soundtrack',
      tag: 'TRIP SOUNDTRACK',
      title: 'The Road Trip Vibe',
      subtitle: 'Songs synced with your coordinates',
      image:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80',
      gradient: ['rgba(15,23,42,0.2)', 'rgba(15,23,42,0.88)', '#0B1220'],
      content: (
        <View style={styles.playlistContainer}>
          {[
            { song: 'Midnight City', artist: 'M83', time: 'London Eurostar' },
            {
              song: 'La Vie En Rose',
              artist: 'Édith Piaf',
              time: 'Paris Sunset Walk',
            },
            {
              song: 'Canals',
              artist: 'Joakim Karud',
              time: 'Amsterdam Boat Ride',
            },
          ].map((item, idx) => (
            <View key={item.song} style={styles.trackRow}>
              <View style={styles.trackIndex}>
                <Text style={styles.trackIndexText}>0{idx + 1}</Text>
              </View>
              <View style={styles.trackDetails}>
                <Text style={styles.songTitle}>{item.song}</Text>
                <Text style={styles.artistName}>
                  {item.artist} ·{' '}
                  <Text style={styles.trackMoment}>{item.time}</Text>
                </Text>
              </View>
              <View style={styles.waveBarGroup}>
                <View style={[styles.waveBar, { height: 14 }]} />
                <View style={[styles.waveBar, { height: 22 }]} />
                <View style={[styles.waveBar, { height: 12 }]} />
              </View>
            </View>
          ))}
        </View>
      ),
    },
    {
      id: 'badges',
      tag: 'CREW SUPERLATIVES',
      title: 'Unlocked Memories',
      subtitle: 'Automated honors for your crew',
      image:
        'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200&q=80',
      gradient: ['rgba(15,23,42,0.2)', 'rgba(15,23,42,0.88)', '#0B1220'],
      content: (
        <View style={styles.badgeGrid}>
          <View style={styles.badgeTile}>
            <Text style={styles.badgeEmoji}>🧭</Text>
            <Text style={styles.badgeName}>Master Navigator</Text>
            <Text style={styles.badgeSub}>Sarah · 18k steps/day</Text>
          </View>
          <View style={styles.badgeTile}>
            <Text style={styles.badgeEmoji}>☕</Text>
            <Text style={styles.badgeName}>Café Hunter</Text>
            <Text style={styles.badgeSub}>Nehal · 9 hidden gems</Text>
          </View>
          <View style={styles.badgeTile}>
            <Text style={styles.badgeEmoji}>⚡</Text>
            <Text style={styles.badgeName}>Speed Settler</Text>
            <Text style={styles.badgeSub}>Arjun · Paid in 42s</Text>
          </View>
          <View style={styles.badgeTile}>
            <Text style={styles.badgeEmoji}>📸</Text>
            <Text style={styles.badgeName}>Memory Keeper</Text>
            <Text style={styles.badgeSub}>Mike · 340 photos</Text>
          </View>
        </View>
      ),
    },
  ];

  const current = slides[activeSlide] || slides[0]!;

  const nextSlide = () => {
    setActiveSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <IconSparkles size={14} color={colors.brand.primary} />
          <Text style={styles.badgeText}>SPOTIFY-WRAPPED FOR TRIPS</Text>
        </View>
        <Text style={styles.title}>Trip Stories & Wrapped</Text>
        <Text style={styles.subtitle}>
          Transform your shared expenses and route history into a personalized,
          shareable visual story at the end of every adventure.
        </Text>
      </View>

      {/* Story Reel Interactive Frame */}
      <View style={styles.storyFrame}>
        {/* Story Background Image */}
        <Image
          source={{ uri: current.image }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Dynamic Dark Gradient Overlay */}
        <LinearGradient
          colors={current.gradient}
          style={StyleSheet.absoluteFill}
        />

        {/* Progress Bar Indicators */}
        <View style={styles.progressBarRow}>
          {slides.map((s, idx) => {
            const isFilled = idx <= activeSlide;
            const isCurrent = idx === activeSlide;
            return (
              <Pressable
                key={s.id}
                onPress={() => setActiveSlide(idx)}
                style={styles.progressTrack}
              >
                <View
                  style={[
                    styles.progressFill,
                    isFilled && styles.progressFillActive,
                    isCurrent && styles.progressFillGlowing,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Top Story Header */}
        <View style={styles.storyTopBar}>
          <View style={styles.tagPill}>
            <Text style={styles.tagPillText}>{current.tag}</Text>
          </View>
          <View style={styles.storyCountBadge}>
            <Text style={styles.storyCountText}>
              {activeSlide + 1}/{slides.length}
            </Text>
          </View>
        </View>

        {/* Story Center Interactive Content */}
        <View style={styles.storyCenterContent}>
          <Text style={styles.storyTitle}>{current.title}</Text>
          <Text style={styles.storySubtitle}>{current.subtitle}</Text>

          <View style={styles.storyBodyContainer}>{current.content}</View>
        </View>

        {/* Tap Left / Right Overlay zones */}
        <View style={styles.touchAreaRow}>
          <Pressable style={styles.touchLeft} onPress={prevSlide} />
          <Pressable style={styles.touchRight} onPress={nextSlide} />
        </View>

        {/* Bottom Interactive Nav Controls */}
        <View style={styles.storyBottomBar}>
          <Pressable
            onPress={prevSlide}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && styles.navBtnPressed,
            ]}
          >
            <AppIcon name="chevron-left" size={18} color="#FFFFFF" />
            <Text style={styles.navBtnText}>Previous</Text>
          </Pressable>

          <View style={styles.slidePillsGroup}>
            {slides.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => setActiveSlide(i)}
                style={[
                  styles.dotPill,
                  i === activeSlide && styles.dotPillActive,
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={nextSlide}
            style={({ pressed }) => [
              styles.navBtn,
              styles.navBtnNext,
              pressed && styles.navBtnPressed,
            ]}
          >
            <Text style={styles.navBtnTextNext}>Next</Text>
            <AppIcon name="chevron-right" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...shadow.card,
  },
  header: {
    marginBottom: spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  badgeText: {
    ...typography.label,
    color: colors.brand.primary,
    marginLeft: 6,
  },
  title: {
    ...typography.heading3.desktop,
    color: colors.light.textPrimary,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body.desktop,
    color: colors.light.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 22,
  },

  // Story Frame
  storyFrame: {
    width: '100%',
    minHeight: 460,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.brand.midnight,
    justifyContent: 'space-between',
    padding: spacing.xl,
    ...shadow.xl,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  progressFillActive: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  progressFillGlowing: {
    backgroundColor: colors.brand.cyan,
  },

  storyTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    zIndex: 10,
  },
  tagPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tagPillText: {
    ...typography.label,
    color: colors.brand.white,
    fontSize: 10,
  },
  storyCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  storyCountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
  },

  storyCenterContent: {
    zIndex: 10,
    marginVertical: spacing.md,
  },
  storyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.brand.white,
    letterSpacing: -0.5,
  },
  storySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  storyBodyContainer: {
    width: '100%',
  },

  // Touch zones for fast tap
  touchAreaRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    zIndex: 5,
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 1,
  },

  // Stats Grid Slide
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.brand.cyan,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Superstar Slide
  cardList: {
    gap: spacing.sm,
  },
  superstarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: spacing.md,
  },
  superstarAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  superstarInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  superstarName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  crownPill: {
    backgroundColor: 'rgba(37,99,235,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  crownText: {
    color: colors.brand.cyan,
    fontSize: 10,
    fontWeight: '700',
  },
  superstarDetail: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },

  // Playlist Slide
  playlistContainer: {
    gap: spacing.sm,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  trackIndex: {
    width: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackIndexText: {
    color: colors.brand.cyan,
    fontWeight: '800',
    fontSize: 12,
  },
  trackDetails: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  songTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  artistName: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
  },
  trackMoment: {
    color: colors.brand.cyan,
  },
  waveBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 24,
    paddingHorizontal: 6,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.brand.cyan,
    borderRadius: 2,
  },

  // Badge Grid Slide
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeTile: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  badgeSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },

  // Bottom Navigation Controls
  storyBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    paddingTop: spacing.sm,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    gap: 4,
  },
  navBtnNext: {
    backgroundColor: colors.brand.primary,
  },
  navBtnPressed: {
    opacity: 0.8,
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  navBtnTextNext: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  slidePillsGroup: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dotPill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotPillActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.cyan,
  },
});
