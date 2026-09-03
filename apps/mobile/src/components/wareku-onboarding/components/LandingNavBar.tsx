import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, shadow, typography } from '../theme/tokens';
import { useResponsive } from '../theme/useResponsive';
import { TripSplitLogo } from '../icons/LandingIcons';

interface LandingNavBarProps {
  onLogin: () => void;
  onGetApp: () => void;
  onNavigateSection?: (section: string) => void;
}

export function LandingNavBar({
  onLogin,
  onGetApp,
  onNavigateSection,
}: LandingNavBarProps) {
  const { isDesktop, isTablet, isWide } = useResponsive();

  return (
    <View style={styles.headerOuter}>
      <View
        style={[
          styles.headerInner,
          (isDesktop || isWide) && styles.headerInnerWide,
        ]}
      >
        {/* Left: Logo */}
        <Pressable
          onPress={() => onNavigateSection?.('hero')}
          style={styles.logoWrap}
        >
          <TripSplitLogo size={36} showWordmark />
        </Pressable>

        {/* Center: Desktop Navigation Links */}
        {(isDesktop || isTablet) && (
          <View style={styles.navLinks}>
            <Pressable
              onPress={() => onNavigateSection?.('features')}
              style={styles.navLinkItem}
            >
              <Text style={styles.navLinkText}>Features</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigateSection?.('how-it-works')}
              style={styles.navLinkItem}
            >
              <Text style={styles.navLinkText}>How it works</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigateSection?.('groups')}
              style={styles.navLinkItem}
            >
              <Text style={styles.navLinkText}>For Groups</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigateSection?.('security')}
              style={styles.navLinkItem}
            >
              <Text style={styles.navLinkText}>Security</Text>
            </Pressable>
            <Pressable
              onPress={() => onNavigateSection?.('pricing')}
              style={styles.navLinkItem}
            >
              <Text style={styles.navLinkText}>Pricing</Text>
            </Pressable>
          </View>
        )}

        {/* Right: Auth & CTA Actions */}
        <View style={styles.navActions}>
          <Pressable
            onPress={onLogin}
            style={({ pressed }) => [
              styles.loginBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.loginBtnText}>Log in</Text>
          </Pressable>

          <Pressable
            onPress={onGetApp}
            style={({ pressed }) => [
              styles.getAppBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.getAppBtnText}>Get TripSplit</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerOuter: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.06)',
    zIndex: 50,
  },
  headerInner: {
    maxWidth: 1360,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 76,
  },
  headerInnerWide: {
    paddingHorizontal: 36,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLinkItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: -0.2,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  getAppBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  getAppBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
