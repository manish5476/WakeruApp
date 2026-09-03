import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { colors, radius, typography } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import { AppStoreBadges } from './AppStoreBadges';
import { PhoneMockupsHero } from './PhoneMockupsHero';
import { IconCheck } from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

interface PremiumHeroSectionProps {
  onStartTrip: () => void;
}

const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
];

export function PremiumHeroSection({ onStartTrip }: PremiumHeroSectionProps) {
  const { isDesktop, isTablet, isWide } = useResponsive();

  return (
    <View style={styles.sectionOuter}>
      <View
        style={[styles.sectionInner, isDesktop && styles.sectionInnerDesktop]}
      >
        {/* LEFT COLUMN: Editorial Copy & Actions */}
        <View
          style={[styles.copyColumn, isDesktop && styles.copyColumnDesktop]}
        >
          {/* Eyebrow Pill */}
          <View style={styles.eyebrowPill}>
            <Text style={styles.eyebrowText}>
              Smart • Simple • Stress-free ✦
            </Text>
          </View>

          {/* Large Editorial Headline */}
          <Text
            style={[
              styles.heading,
              isDesktop
                ? isWide
                  ? styles.headingWide
                  : styles.headingDesktop
                : styles.headingMobile,
            ]}
          >
            Travel together.{'\n'}
            <Text style={styles.headingAccent}>Split everything.</Text>
          </Text>

          {/* Subtitle Description */}
          <Text style={styles.description}>
            The complete operating system for group travel. Plan daily
            itineraries, track expenses in any currency, settle in 1-tap with
            UPI, and relive your journey with beautiful trip stories.
          </Text>

          {/* Feature Check Points */}
          <View style={styles.checksList}>
            <View style={styles.checkItem}>
              <IconCheck size={14} color="#10B981" />
              <Text style={styles.checkText}>No more awkward money talks</Text>
            </View>
            <View style={styles.checkItem}>
              <IconCheck size={14} color="#10B981" />
              <Text style={styles.checkText}>100% Free</Text>
            </View>
            <View style={styles.checkItem}>
              <IconCheck size={14} color="#10B981" />
              <Text style={styles.checkText}>Works offline</Text>
            </View>
            <View style={styles.checkItem}>
              <IconCheck size={14} color="#10B981" />
              <Text style={styles.checkText}>Loved by travelers</Text>
            </View>
          </View>

          {/* App Store / Play Store Badges */}
          <View style={styles.badgesWrap}>
            <AppStoreBadges
              onPressAppStore={onStartTrip}
              onPressGooglePlay={onStartTrip}
            />
          </View>

          {/* Social Proof */}
          <View style={styles.socialProofRow}>
            <View style={styles.avatarGroup}>
              {AVATARS.map((url, i) => (
                <Image
                  key={i}
                  source={{ uri: url }}
                  style={[styles.avatar, { marginLeft: i === 0 ? 0 : -8 }]}
                />
              ))}
            </View>
            <Text style={styles.socialProofText}>
              Trusted by 50,000+ travelers worldwide
            </Text>
          </View>
        </View>

        {/* RIGHT COLUMN: Dual Phone Mockup Composition */}
        <View
          style={[styles.visualColumn, isDesktop && styles.visualColumnDesktop]}
        >
          <PhoneMockupsHero />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionOuter: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
  },
  sectionInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    flexDirection: 'column',
    gap: 40,
  },
  sectionInnerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 28,
    gap: 56,
  },

  // Left Copy Column
  copyColumn: {
    width: '100%',
  },
  copyColumnDesktop: {
    flex: 1.15,
    maxWidth: 620,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: 20,
  },
  eyebrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: -0.2,
  },
  heading: {
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: -1.4,
  },
  headingWide: {
    fontSize: 60,
    lineHeight: 68,
  },
  headingDesktop: {
    fontSize: 52,
    lineHeight: 60,
  },
  headingMobile: {
    fontSize: 38,
    lineHeight: 44,
  },
  headingAccent: {
    color: '#2563EB',
  },
  description: {
    fontSize: 17,
    lineHeight: 28,
    color: '#475569',
    marginTop: 18,
    marginBottom: 26,
    maxWidth: 540,
  },

  // Checks
  checksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  // Badges
  badgesWrap: {
    marginBottom: 28,
  },

  // Social Proof
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  socialProofText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  // Right Visual Column
  visualColumn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualColumnDesktop: {
    flex: 1,
    maxWidth: 580,
  },
});
