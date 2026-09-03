import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import { TripSplitLogo } from '../icons/LandingIcons';

interface LandingFooterProps {
  onNavigateSection?: (section: string) => void;
}

export function LandingFooter({ onNavigateSection }: LandingFooterProps) {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const isRow = isDesktop || isTablet || isWide;

  return (
    <View style={styles.footerOuter}>
      <View style={styles.footerInner}>
        {/* Top Row: Logo & Links */}
        <View style={[styles.topRow, isRow && styles.topRowDesktop]}>
          <TripSplitLogo size={34} showWordmark />

          <View style={styles.linksRow}>
            <Pressable
              onPress={() => onNavigateSection?.('features')}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Features</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigateSection?.('how-it-works')}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>How it works</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigateSection?.('groups')}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>For Groups</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigateSection?.('security')}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Security</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigateSection?.('pricing')}
              style={styles.linkItem}
            >
              <Text style={styles.linkText}>Pricing</Text>
            </Pressable>
            <Pressable style={styles.linkItem}>
              <Text style={styles.linkText}>Privacy</Text>
            </Pressable>
            <Pressable style={styles.linkItem}>
              <Text style={styles.linkText}>Terms</Text>
            </Pressable>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Row: Copyright */}
        <View style={styles.bottomRow}>
          <Text style={styles.copyrightText}>
            © 2026 TripSplit Technologies Inc. All rights reserved.
          </Text>
          <Text style={styles.taglineText}>
            Travel together. Split smarter.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerOuter: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 40,
  },
  footerInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: 'column',
    gap: 20,
  },
  topRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    alignItems: 'center',
  },
  linkItem: {
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 28,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  copyrightText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  taglineText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});
