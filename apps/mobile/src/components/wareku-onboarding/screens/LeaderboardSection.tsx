import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, shadow, typography } from '../theme/tokens';
import { IconTrophy, IconCheck, IconSparkles } from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

interface LeaderboardMember {
  id: string;
  rank: number;
  name: string;
  avatarColor: string;
  title: string;
  stat: string;
  badge: string;
  points: number;
  highlight: string;
}

const MEMBERS: LeaderboardMember[] = [
  {
    id: '1',
    rank: 1,
    name: 'Arjun',
    avatarColor: '#2563EB',
    title: 'The Group Bank 👑',
    stat: '₹1,12,000 upfront',
    badge: 'Gold Anchor',
    points: 2450,
    highlight: 'Covered 42% of trip expenses on time',
  },
  {
    id: '2',
    rank: 2,
    name: 'Sarah',
    avatarColor: '#06B6D4',
    title: 'Master Navigator 🧭',
    stat: '18,400 steps/day',
    badge: 'Silver Compass',
    points: 2180,
    highlight: 'Mapped 14 key destinations & museum slots',
  },
  {
    id: '3',
    rank: 3,
    name: 'Rahul',
    avatarColor: '#10B981',
    title: 'Frugal Champion 💡',
    stat: '€180 saved for group',
    badge: 'Bronze Vault',
    points: 1950,
    highlight: 'Scored discounted group rail passes',
  },
  {
    id: '4',
    rank: 4,
    name: 'Nehal',
    avatarColor: '#8B5CF6',
    title: 'Speed Settler ⚡',
    stat: 'Settled in 42s',
    badge: 'Lightning Bolt',
    points: 1720,
    highlight: 'Fastest 1-tap UPI debt clearance',
  },
];

const BADGES = [
  {
    id: 'b1',
    icon: 'zap',
    name: 'Instant Settler',
    desc: 'Paid group share within 5 mins of trip wrap',
    unlocked: true,
    color: '#F59E0B',
  },
  {
    id: 'b2',
    icon: 'utensils',
    name: 'Gourmet Scout',
    desc: 'Logged 8+ dining stops with receipt scans',
    unlocked: true,
    color: '#EC4899',
  },
  {
    id: 'b3',
    icon: 'globe',
    name: 'Border Crosser',
    desc: 'Split expenses across 3+ distinct currencies',
    unlocked: true,
    color: '#06B6D4',
  },
  {
    id: 'b4',
    icon: 'shield-check',
    name: 'Zero-Debt Hero',
    desc: 'Closed 100% of pending balances',
    unlocked: true,
    color: '#10B981',
  },
];

export function LeaderboardSection() {
  const [selectedMember, setSelectedMember] = useState<string>('1');
  const activeMember = MEMBERS.find(m => m.id === selectedMember) || MEMBERS[0];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <IconTrophy size={14} color={colors.brand.primary} />
          <Text style={styles.badgeText}>GAMIFIED TRAVEL SUPERLATIVES</Text>
        </View>
        <Text style={styles.title}>Trip Leaderboards & Badges</Text>
        <Text style={styles.subtitle}>
          Turn shared travel into friendly motivation with automated
          superlatives, spending badges, and trip achievement milestones.
        </Text>
      </View>

      {/* Podium Showcase */}
      <View style={styles.podiumContainer}>
        {/* 2nd Place */}
        <Pressable
          onPress={() => setSelectedMember(MEMBERS[1].id)}
          style={[
            styles.podiumColumn,
            styles.podiumTwo,
            selectedMember === MEMBERS[1].id && styles.podiumActive,
          ]}
        >
          <View
            style={[
              styles.avatarWrap,
              { backgroundColor: MEMBERS[1].avatarColor },
            ]}
          >
            <Text style={styles.avatarLetter}>S</Text>
            <View style={[styles.rankTag, { backgroundColor: '#94A3B8' }]}>
              <Text style={styles.rankTagText}>2</Text>
            </View>
          </View>
          <Text style={styles.podiumName}>{MEMBERS[1].name}</Text>
          <Text style={styles.podiumPoints}>{MEMBERS[1].points} pts</Text>
          <View style={styles.podiumPedestalTwo}>
            <Text style={styles.pedestalRank}>🥈 2nd</Text>
          </View>
        </Pressable>

        {/* 1st Place (Center / Elevated) */}
        <Pressable
          onPress={() => setSelectedMember(MEMBERS[0].id)}
          style={[
            styles.podiumColumn,
            styles.podiumOne,
            selectedMember === MEMBERS[0].id && styles.podiumActive,
          ]}
        >
          <View style={styles.crownWrapper}>
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
          <View
            style={[
              styles.avatarWrap,
              styles.avatarWrapOne,
              { backgroundColor: MEMBERS[0].avatarColor },
            ]}
          >
            <Text style={styles.avatarLetterOne}>A</Text>
            <View style={[styles.rankTag, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.rankTagText}>1</Text>
            </View>
          </View>
          <Text style={[styles.podiumName, styles.podiumNameOne]}>
            {MEMBERS[0].name}
          </Text>
          <Text style={[styles.podiumPoints, styles.podiumPointsOne]}>
            {MEMBERS[0].points} pts
          </Text>
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            style={styles.podiumPedestalOne}
          >
            <Text style={styles.pedestalRankOne}>🥇 1st</Text>
          </LinearGradient>
        </Pressable>

        {/* 3rd Place */}
        <Pressable
          onPress={() => setSelectedMember(MEMBERS[2].id)}
          style={[
            styles.podiumColumn,
            styles.podiumThree,
            selectedMember === MEMBERS[2].id && styles.podiumActive,
          ]}
        >
          <View
            style={[
              styles.avatarWrap,
              { backgroundColor: MEMBERS[2].avatarColor },
            ]}
          >
            <Text style={styles.avatarLetter}>R</Text>
            <View style={[styles.rankTag, { backgroundColor: '#D97706' }]}>
              <Text style={styles.rankTagText}>3</Text>
            </View>
          </View>
          <Text style={styles.podiumName}>{MEMBERS[2].name}</Text>
          <Text style={styles.podiumPoints}>{MEMBERS[2].points} pts</Text>
          <View style={styles.podiumPedestalThree}>
            <Text style={styles.pedestalRank}>🥉 3rd</Text>
          </View>
        </Pressable>
      </View>

      {/* Selected Member Detail Banner */}
      <View style={styles.memberHighlightCard}>
        <View style={styles.memberHighlightTop}>
          <View
            style={[
              styles.smallAvatar,
              { backgroundColor: activeMember.avatarColor },
            ]}
          >
            <Text style={styles.smallAvatarText}>{activeMember.name[0]}</Text>
          </View>
          <View style={styles.memberHighlightInfo}>
            <Text style={styles.memberName}>
              {activeMember.name} ·{' '}
              <Text style={styles.memberTitle}>{activeMember.title}</Text>
            </Text>
            <Text style={styles.memberStat}>
              {activeMember.stat} · {activeMember.highlight}
            </Text>
          </View>
        </View>
      </View>

      {/* Badges Grid */}
      <Text style={styles.sectionSubhead}>COLLECTIBLE TRAVEL BADGES</Text>
      <View style={styles.badgesGrid}>
        {BADGES.map(b => (
          <View key={b.id} style={styles.badgeCard}>
            <View
              style={[
                styles.badgeIconBubble,
                { backgroundColor: `${b.color}18` },
              ]}
            >
              <AppIcon name={b.icon as any} size={18} color={b.color} />
            </View>
            <View style={styles.badgeTextWrap}>
              <View style={styles.badgeHeaderRow}>
                <Text style={styles.badgeTitle}>{b.name}</Text>
                <View style={styles.unlockedTick}>
                  <IconCheck size={10} color={colors.brand.emerald} />
                </View>
              </View>
              <Text style={styles.badgeDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}
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

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingTop: spacing.sm,
  },
  podiumOne: {
    zIndex: 2,
  },
  podiumTwo: {
    zIndex: 1,
  },
  podiumThree: {
    zIndex: 1,
  },
  podiumActive: {
    transform: [{ scale: 1.02 }],
  },
  crownWrapper: {
    marginBottom: -4,
  },
  crownEmoji: {
    fontSize: 20,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarWrapOne: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  avatarLetterOne: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
  },
  rankTag: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  rankTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.light.textPrimary,
    marginTop: spacing.xs,
  },
  podiumNameOne: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  podiumPoints: {
    fontSize: 11,
    color: colors.light.textMuted,
    marginBottom: spacing.xs,
  },
  podiumPointsOne: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
  podiumPedestalOne: {
    width: '100%',
    height: 74,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumPedestalTwo: {
    width: '100%',
    height: 54,
    backgroundColor: '#E2E8F0',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumPedestalThree: {
    width: '100%',
    height: 42,
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pedestalRank: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.light.textSecondary,
  },
  pedestalRankOne: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Selected Member Card
  memberHighlightCard: {
    backgroundColor: colors.brand.primarySoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.15)',
  },
  memberHighlightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  memberHighlightInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  memberTitle: {
    color: colors.brand.primary,
  },
  memberStat: {
    fontSize: 12,
    color: colors.light.textSecondary,
    marginTop: 2,
  },

  // Badges Grid
  sectionSubhead: {
    ...typography.label,
    color: colors.light.textMuted,
    marginBottom: spacing.md,
  },
  badgesGrid: {
    gap: spacing.sm,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.light.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: spacing.md,
  },
  badgeIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTextWrap: {
    flex: 1,
  },
  badgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  unlockedTick: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brand.emeraldSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDesc: {
    fontSize: 12,
    color: colors.light.textSecondary,
    marginTop: 2,
  },
});
