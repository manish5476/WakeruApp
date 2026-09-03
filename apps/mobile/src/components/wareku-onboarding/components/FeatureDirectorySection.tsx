import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

interface FeatureDirectorySectionProps {
  onOpenDemo?: () => void;
}

const DIRECTORIES = [
  {
    category: 'MONEY',
    color: '#2563EB',
    items: [
      'Smart 1/N & Weighted Splitting',
      'Real-Time Multi-Currency FX Engine',
      'Graph Debt Net Simplification',
      '1-Tap UPI QR Instant Settlement',
    ],
  },
  {
    category: 'TRAVEL',
    color: '#E11D48',
    items: [
      'Day-by-Day Visual Itinerary',
      'Live Flight Status & Gate Tracker',
      'Hotel & Stay Voucher Hub',
      'Collaborative Crew Packing Lists',
    ],
  },
  {
    category: 'INTELLIGENCE',
    color: '#059669',
    items: [
      'AI OCR Instant Receipt Scanner',
      'Proportional Tax & Tip Allocation',
      'Spending Velocity & Budget Gauges',
      'Personal Travel Savings Vaults',
    ],
  },
  {
    category: 'TOGETHER',
    color: '#7C3AED',
    items: [
      'Local Encrypted SQLite Offline Mode',
      'Conflict-Free Cloud Synchronization',
      'Trip Stories & Spotify-Wrapped Recaps',
      'Gamified Badges & Superlatives',
    ],
  },
];

export function FeatureDirectorySection({
  onOpenDemo,
}: FeatureDirectorySectionProps) {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const isRowLayout = isDesktop || isTablet || isWide;

  return (
    <View style={styles.sectionOuter}>
      <View style={styles.sectionInner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>CAPABILITY DIRECTORY</Text>
          <Text
            style={[
              styles.headline,
              isDesktop ? styles.headlineDesktop : styles.headlineMobile,
            ]}
          >
            Built for everything travel throws at you.
          </Text>
        </View>

        {/* Typographic Columns */}
        <View style={[styles.directoryGrid, isRowLayout && styles.gridDesktop]}>
          {DIRECTORIES.map((dir, idx) => (
            <View key={idx} style={styles.directoryCol}>
              <View style={styles.catHeader}>
                <View style={[styles.catDot, { backgroundColor: dir.color }]} />
                <Text style={[styles.catTitle, { color: dir.color }]}>
                  {dir.category}
                </Text>
              </View>

              <View style={styles.itemsList}>
                {dir.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemBullet}>·</Text>
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Demo Button */}
        <Pressable
          onPress={onOpenDemo}
          style={({ pressed }) => [
            styles.openDemoBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.openDemoText}>Open Interactive Simulator</Text>
          <AppIcon name="arrow-right" size={16} color="#0F172A" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionOuter: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 84,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    maxWidth: 720,
    marginBottom: 48,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    color: '#0F172A',
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
  headlineDesktop: {
    fontSize: 40,
    lineHeight: 48,
  },
  headlineMobile: {
    fontSize: 28,
    lineHeight: 34,
  },

  directoryGrid: {
    width: '100%',
    flexDirection: 'column',
    gap: 24,
    marginBottom: 48,
  },
  gridDesktop: {
    flexDirection: 'row',
    gap: 32,
    justifyContent: 'space-between',
  },

  directoryCol: {
    flex: 1,
    minWidth: 220,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemBullet: {
    fontSize: 16,
    lineHeight: 20,
    color: '#94A3B8',
    fontWeight: '800',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
    fontWeight: '500',
  },

  openDemoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadow.soft,
  },
  openDemoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
