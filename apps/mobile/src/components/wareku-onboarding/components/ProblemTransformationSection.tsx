import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import AppIcon from '../../common/AppIcon';

export function ProblemTransformationSection() {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const isRowLayout = isDesktop || isTablet || isWide;

  return (
    <View style={styles.sectionOuter}>
      <View style={styles.sectionInner}>
        {/* Editorial Eyebrow & Headline */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>THE TRIPSPLIT PHILOSOPHY</Text>
          <Text
            style={[
              styles.headline,
              isDesktop ? styles.headlineDesktop : styles.headlineMobile,
            ]}
          >
            One trip. Many friends.{'\n'}
            <Text style={styles.headlineHighlight}>Too many expenses.</Text>
          </Text>
          <Text style={styles.subheadline}>
            Group travel is meant for making memories — not doing arithmetic in
            notes apps or chasing people for unpaid dinner bills.
          </Text>
        </View>

        {/* Contrast Comparison: The Old Way vs The TripSplit Way Side-by-Side in the same row */}
        <View
          style={[
            styles.contrastContainer,
            isRowLayout && styles.contrastContainerRow,
          ]}
        >
          {/* Left: The Old Way */}
          <View style={[styles.contrastBlock, styles.blockOld]}>
            <View style={styles.blockBadgeOld}>
              <AppIcon name="x" size={14} color="#EF4444" />
              <Text style={styles.badgeTextOld}>WITHOUT TRIPSPLIT</Text>
            </View>
            <Text style={styles.blockTitleOld}>The Spreadsheet Chaos</Text>
            <View style={styles.pointsList}>
              <View style={styles.pointRow}>
                <Text style={styles.pointBulletOld}>✕</Text>
                <Text style={styles.pointTextOld}>
                  Tangled group chats debating who paid for what
                </Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointBulletOld}>✕</Text>
                <Text style={styles.pointTextOld}>
                  Lost paper receipts and guessing currency exchange rates
                </Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointBulletOld}>✕</Text>
                <Text style={styles.pointTextOld}>
                  10 separate transfers when only 2 were needed
                </Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointBulletOld}>✕</Text>
                <Text style={styles.pointTextOld}>
                  Awkward money conversations weeks after returning
                </Text>
              </View>
            </View>
          </View>

          {/* Right: The TripSplit Way */}
          <View style={[styles.contrastBlock, styles.blockNew]}>
            <View style={styles.blockBadgeNew}>
              <AppIcon name="check" size={14} color="#10B981" />
              <Text style={styles.badgeTextNew}>WITH TRIPSPLIT</Text>
            </View>
            <Text style={styles.blockTitleNew}>Effortless Clarity</Text>
            <View style={styles.pointsList}>
              <View style={styles.pointRow}>
                <Text style={styles.pointBulletNew}>✓</Text>
                <Text style={styles.pointTextNew}>
                  Instant 1-tap bill capture in any global currency
                </Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointBulletNew}>✓</Text>
                <Text style={styles.pointTextNew}>
                  AI OCR extracts and itemizes receipts in seconds
                </Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointBulletNew}>✓</Text>
                <Text style={styles.pointTextNew}>
                  Net debt simplification collapses 10 debts into 2 transfers
                </Text>
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointBulletNew}>✓</Text>
                <Text style={styles.pointTextNew}>
                  1-Tap UPI settlement & Spotify-Wrapped trip story recaps
                </Text>
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 80,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  sectionInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  header: {
    maxWidth: 760,
    marginBottom: 48,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  headline: {
    color: '#0F172A',
    fontWeight: '900',
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
  headlineHighlight: {
    color: '#64748B',
  },
  subheadline: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
    marginTop: 16,
  },

  // Contrast blocks
  contrastContainer: {
    flexDirection: 'column',
    gap: 24,
  },
  contrastContainerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  contrastBlock: {
    flex: 1,
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
  },
  blockOld: {
    backgroundColor: '#FAF5F5',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  blockNew: {
    backgroundColor: '#F0FDF4',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    ...shadow.soft,
  },

  blockBadgeOld: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 16,
  },
  badgeTextOld: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.6,
  },
  blockTitleOld: {
    fontSize: 22,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 18,
    letterSpacing: -0.3,
  },

  blockBadgeNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 16,
  },
  badgeTextNew: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.6,
  },
  blockTitleNew: {
    fontSize: 22,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 18,
    letterSpacing: -0.3,
  },

  pointsList: {
    gap: 16,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pointBulletOld: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
    lineHeight: 22,
  },
  pointTextOld: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#7F1D1D',
    fontWeight: '500',
  },
  pointBulletNew: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
    lineHeight: 22,
  },
  pointTextNew: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#14532D',
    fontWeight: '600',
  },
});
