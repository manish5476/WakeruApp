import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { radius, shadow, typography } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

interface FeatureGridSectionProps {
  onExploreFeatures?: () => void;
  onSelectFeature?: (featureId: string) => void;
}

const FEATURES = [
  {
    id: 'split',
    icon: 'split',
    iconColor: '#EA580C',
    iconBg: '#FFF7ED',
    title: 'Smart Expense Splitting',
    description: 'Split equally, by shares, percentage, or custom amounts.',
  },
  {
    id: 'fx',
    icon: 'globe',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    title: 'Multi-Currency Support',
    description: 'Add expenses in any currency. We handle the conversions.',
  },
  {
    id: 'itinerary',
    icon: 'map-pin',
    iconColor: '#E11D48',
    iconBg: '#FFF1F2',
    title: 'Itinerary & Bookings',
    description: 'Plan day-by-day schedules, bookings & activities.',
  },
  {
    id: 'ocr',
    icon: 'camera',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    title: 'AI Receipt Scanner',
    description: 'Scan receipts and let AI extract details instantly.',
  },
  {
    id: 'upi',
    icon: 'zap',
    iconColor: '#7C3AED',
    iconBg: '#F5F3FF',
    title: 'Settle with 1-Tap UPI',
    description: 'Instant settlements using UPI. No more chasing.',
  },
  {
    id: 'chat',
    icon: 'message-circle',
    iconColor: '#0891B2',
    iconBg: '#ECFEFF',
    title: 'Group Chat',
    description: 'Discuss plans, share updates, all in one place.',
  },
  {
    id: 'stories',
    icon: 'sparkles',
    iconColor: '#4F46E5',
    iconBg: '#EEF2FF',
    title: 'Trip Stories',
    description: 'Create beautiful stories from your journey.',
  },
  {
    id: 'offline',
    icon: 'wifi-off',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    title: 'Works Offline',
    description: 'Add expenses and view trip data even without internet.',
  },
];

export function FeatureGridSection({
  onExploreFeatures,
  onSelectFeature,
}: FeatureGridSectionProps) {
  const { isDesktop, isTablet } = useResponsive();

  return (
    <View style={styles.sectionOuter}>
      <View style={styles.sectionInner}>
        {/* Section Header */}
        <View style={styles.header}>
          <View style={styles.eyebrowPill}>
            <Text style={styles.eyebrowText}>ALL-IN-ONE TRAVEL COMPANION</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Everything you need, in one place
          </Text>
        </View>

        {/* 4x2 / 2x4 Feature Grid */}
        <View style={styles.grid}>
          {FEATURES.map(f => (
            <Pressable
              key={f.id}
              onPress={() => onSelectFeature?.(f.id)}
              style={({ pressed }) => [
                styles.featureCard,
                isDesktop
                  ? styles.cardDesktop
                  : isTablet
                    ? styles.cardTablet
                    : styles.cardMobile,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: f.iconBg }]}>
                <AppIcon name={f.icon as any} size={20} color={f.iconColor} />
              </View>
              <Text style={styles.cardTitle}>{f.title}</Text>
              <Text style={styles.cardDesc}>{f.description}</Text>
            </Pressable>
          ))}
        </View>

        {/* Bottom Action Link */}
        <Pressable
          onPress={onExploreFeatures}
          style={({ pressed }) => [
            styles.exploreBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.exploreText}>Explore All Features</Text>
          <AppIcon name="arrow-right" size={16} color="#0F172A" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionOuter: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    paddingVertical: 64,
  },
  sectionInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  eyebrowPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.8,
  },

  // Grid
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    marginBottom: 36,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadow.soft,
  },
  cardDesktop: {
    width: '23.4%', // 4 columns with gap
    minHeight: 180,
  },
  cardTablet: {
    width: '47.5%', // 2 columns
    minHeight: 170,
  },
  cardMobile: {
    width: '100%', // 1 column
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
  },

  // Explore button
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadow.soft,
  },
  exploreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  btnPressed: {
    opacity: 0.85,
  },
});
