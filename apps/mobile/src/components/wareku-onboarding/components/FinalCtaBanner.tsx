import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import { AppStoreBadges } from './AppStoreBadges';
import { IconCheck } from '../icons/LandingIcons';
import AppIcon from '../../common/AppIcon';

interface FinalCtaBannerProps {
  onStartTrip: () => void;
}

export function FinalCtaBanner({ onStartTrip }: FinalCtaBannerProps) {
  const { isDesktop, isTablet, isWide } = useResponsive();
  const isRowLayout = isDesktop || isWide;

  return (
    <View style={styles.sectionOuter}>
      <View style={styles.sectionInner}>
        <LinearGradient
          colors={['#EEF2FF', '#F0F9FF', '#ECFEFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bannerContainer, isRowLayout && styles.bannerDesktop]}
        >
          {/* Left Column: Copy & Perks */}
          <View style={[styles.copyCol, isRowLayout && styles.copyColDesktop]}>
            <Text style={styles.eyebrow}>READY FOR YOUR NEXT ADVENTURE?</Text>
            <Text style={styles.heading}>
              Your next trip deserves less math.
            </Text>

            <View style={styles.perksRow}>
              <View style={styles.perkItem}>
                <IconCheck size={14} color="#2563EB" />
                <Text style={styles.perkText}>100% Free forever</Text>
              </View>
              <View style={styles.perkItem}>
                <IconCheck size={14} color="#2563EB" />
                <Text style={styles.perkText}>No hidden bank fees</Text>
              </View>
              <View style={styles.perkItem}>
                <IconCheck size={14} color="#2563EB" />
                <Text style={styles.perkText}>End-to-end encrypted</Text>
              </View>
            </View>
          </View>

          {/* Right Column: Badges & QR Code */}
          <View
            style={[styles.actionCol, isRowLayout && styles.actionColDesktop]}
          >
            <View style={styles.badgesWrapper}>
              <AppStoreBadges
                onPressAppStore={onStartTrip}
                onPressGooglePlay={onStartTrip}
              />
            </View>

            {/* QR Card */}
            {(isDesktop || isTablet || isWide) && (
              <View style={styles.qrCard}>
                <AppIcon name="qr-code" size={56} color="#0F172A" />
                <Text style={styles.qrLabel}>Scan to download</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionOuter: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 56,
  },
  sectionInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  bannerContainer: {
    borderRadius: 32,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
    flexDirection: 'column',
    gap: 36,
    ...shadow.card,
  },
  bannerDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 56,
  },

  copyCol: {
    width: '100%',
  },
  copyColDesktop: {
    flex: 1.2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heading: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 18,
  },
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  actionColDesktop: {
    justifyContent: 'flex-end',
  },
  badgesWrapper: {
    gap: 12,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadow.soft,
  },
  qrLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
});
