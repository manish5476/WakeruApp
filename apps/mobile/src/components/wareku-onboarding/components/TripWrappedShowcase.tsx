import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';

export function TripWrappedShowcase() {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const isRowLayout = isDesktop || isTablet || isWide;

  return (
    <View style={styles.sectionOuter}>
      <View style={styles.sectionInner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TRIP WRAPPED & STORIES</Text>
          <Text
            style={[
              styles.headline,
              isDesktop ? styles.headlineDesktop : styles.headlineMobile,
            ]}
          >
            The trip ends.{'\n'}
            <Text style={styles.headlineAccent}>The memories don't.</Text>
          </Text>
          <Text style={styles.subheadline}>
            Relive your journey with an interactive Spotify-Wrapped style recap.
            Explore your crew superlatives, distance covered, and collectible
            travel badges.
          </Text>
        </View>

        {/* 3 Story Cards Composition */}
        <View
          style={[styles.storiesRow, isRowLayout && styles.storiesRowDesktop]}
        >
          {/* Card 1: Journey Stats */}
          <View style={[styles.storyCard, { backgroundColor: '#1E1B4B' }]}>
            <Text style={styles.storyCardTag}>JOURNEY STATS</Text>
            <Text style={styles.storyCardHero}>4,280 km</Text>
            <Text style={styles.storyCardSub}>
              Across 3 Countries & 8 Cities
            </Text>
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>14</Text>
                <Text style={styles.miniStatLbl}>Stops</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>42</Text>
                <Text style={styles.miniStatLbl}>Expenses</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatVal}>100%</Text>
                <Text style={styles.miniStatLbl}>Settled</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Crew Superlatives */}
          <View style={[styles.storyCard, { backgroundColor: '#064E3B' }]}>
            <Text style={styles.storyCardTag}>CREW SUPERLATIVES</Text>
            <View style={styles.superlativeItem}>
              <Text style={{ fontSize: 24 }}>👑</Text>
              <View>
                <Text style={styles.superlativeTitle}>The Bank</Text>
                <Text style={styles.superlativeName}>
                  Rahul (Paid 68% upfront)
                </Text>
              </View>
            </View>
            <View style={styles.superlativeItem}>
              <Text style={{ fontSize: 24 }}>⚡</Text>
              <View>
                <Text style={styles.superlativeTitle}>Speed Settler</Text>
                <Text style={styles.superlativeName}>
                  Sarah (Settled in 4 mins)
                </Text>
              </View>
            </View>
          </View>

          {/* Card 3: Collectible Badges */}
          <View style={[styles.storyCard, { backgroundColor: '#78350F' }]}>
            <Text style={styles.storyCardTag}>UNLOCKED BADGES</Text>
            <View style={styles.badgesCluster}>
              <View style={styles.badgePill}>
                <Text style={styles.badgeEmoji}>🥐</Text>
                <Text style={styles.badgeName}>Croissant Aficionado</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgeEmoji}>🚲</Text>
                <Text style={styles.badgeName}>Canal Navigator</Text>
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgeEmoji}>🧭</Text>
                <Text style={styles.badgeName}>Master Explorer</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionOuter: {
    width: '100%',
    backgroundColor: '#0B1220',
    paddingVertical: 90,
  },
  sectionInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 760,
    marginBottom: 48,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  headlineDesktop: {
    fontSize: 44,
    lineHeight: 52,
  },
  headlineMobile: {
    fontSize: 32,
    lineHeight: 38,
  },
  headlineAccent: {
    color: '#38BDF8',
  },
  subheadline: {
    fontSize: 16,
    lineHeight: 26,
    color: '#94A3B8',
    marginTop: 16,
    textAlign: 'center',
    maxWidth: 620,
  },

  storiesRow: {
    width: '100%',
    flexDirection: 'column',
    gap: 24,
  },
  storiesRowDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  storyCard: {
    flex: 1,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
    minHeight: 260,
    ...shadow.xl,
  },
  storyCardTag: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1,
    marginBottom: 14,
  },
  storyCardHero: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  storyCardSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  miniStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  miniStatLbl: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },

  superlativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    borderRadius: 14,
    marginVertical: 4,
  },
  superlativeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  superlativeName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },

  badgesCluster: {
    gap: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  badgeEmoji: {
    fontSize: 15,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
