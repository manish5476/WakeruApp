// src/components/common/AppAboutModal.tsx
// Comprehensive In-App Modal for App Details, About Section & Support

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import AppIcon from './AppIcon';
import { haptics } from '../../utils/haptics';
import {
  APP_NAME,
  COMPANY_NAME,
  SUPPORT_EMAIL,
  APP_TAGLINE,
} from '../../config/branding';

interface AppAboutModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'about' | 'support';
}

const APP_FEATURES = [
  {
    icon: 'globe',
    title: '150+ Currencies & Live FX Rates',
    desc: 'Log expenses in any world currency; TripSplit normalizes costs into your trip currency with live interbank rates.',
    color: '#2563EB',
  },
  {
    icon: 'git-merge',
    title: 'Intelligent Debt Simplification',
    desc: 'Proprietary graph algorithms calculate the minimum cash transfers needed between group members to settle all debts.',
    color: '#8B5CF6',
  },
  {
    icon: 'map-pin',
    title: 'Interactive Travel & Geo-Map',
    desc: 'Plot trip stops, geotag expenses, and discover location-based travel deals on the interactive map.',
    color: '#EA580C',
  },
  {
    icon: 'camera',
    title: 'Smart AI Receipt Scanner (OCR)',
    desc: 'Snap a receipt photo to automatically extract items, totals, and taxes in seconds without manual entry.',
    color: '#059669',
  },
  {
    icon: 'wifi-off',
    title: 'Offline-First Resilience',
    desc: 'Works completely offline on remote trails or flights. Syncs seamlessly with SQLite storage once back online.',
    color: '#D97706',
  },
  {
    icon: 'check-circle-2',
    title: 'Instant Settlements & Proof',
    desc: 'Settle balances directly via UPI, NetBanking, cards, and payment receipts with verifiable payment tracking.',
    color: '#10B981',
  },
];

export function AppAboutModal({
  visible,
  onClose,
  initialTab = 'about',
}: AppAboutModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'about' | 'support'>(initialTab);
  const [copied, setCopied] = useState(false);

  // Sync initial tab when opening
  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const handleCopyEmail = async () => {
    try {
      await Clipboard.setStringAsync(SUPPORT_EMAIL);
      haptics.success();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleEmailSupport = () => {
    haptics.light();
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=TripSplit%20Support%20Request`,
    ).catch(err => {
      console.warn('Failed to open mail client:', err);
    });
  };

  const isDesktop = width > 768;
  const availableHeight =
    height - insets.top - insets.bottom - (Platform.OS === 'web' ? 48 : 28);
  const modalHeight = isDesktop
    ? Math.min(height * 0.85, 720)
    : Math.min(Math.max(availableHeight, 460), 660);
  const modalWidth = isDesktop ? 600 : '100%';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.backdrop,
          {
            paddingTop: Math.max(insets.top, 14),
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <GlassCard
          variant="prominent"
          padding="none"
          intensity={theme.isDark ? 55 : 75}
          style={[
            styles.modalCard,
            {
              height: modalHeight,
              width: modalWidth,
              maxWidth: 620,
              borderColor: theme.colors.borderLight,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              { borderBottomColor: theme.colors.borderLight },
            ]}
          >
            <View style={styles.headerTitleWrap}>
              <View
                style={[
                  styles.logoIcon,
                  { backgroundColor: `${theme.colors.primary}18` },
                ]}
              >
                <AppIcon
                  name="map-pin"
                  size={18}
                  color={theme.colors.primary}
                />
              </View>
              <View>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Typography
                    variant="body"
                    weight="extrabold"
                    color="textPrimary"
                  >
                    {APP_NAME}
                  </Typography>
                  <View style={styles.versionBadge}>
                    <Text style={styles.versionText}>v1.0.0</Text>
                  </View>
                </View>
                <Typography variant="caption" color="textTertiary">
                  {APP_TAGLINE}
                </Typography>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <AppIcon name="x" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Tab Selector (Segmented Pill) */}
          <View
            style={[
              styles.tabsContainer,
              { borderBottomColor: theme.colors.borderLight },
            ]}
          >
            <View
              style={[
                styles.tabsSegment,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  haptics.light();
                  setActiveTab('about');
                }}
                style={[
                  styles.tabBtn,
                  activeTab === 'about' && [
                    styles.tabBtnActive,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: theme.isDark ? 0.2 : 0.08,
                      shadowRadius: 4,
                      elevation: 2,
                    },
                  ],
                ]}
              >
                <AppIcon
                  name="info"
                  size={14}
                  color={
                    activeTab === 'about'
                      ? theme.colors.primary
                      : theme.colors.textTertiary
                  }
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color:
                        activeTab === 'about'
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                    },
                    activeTab === 'about' && { fontWeight: '800' },
                  ]}
                >
                  About {APP_NAME}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  haptics.light();
                  setActiveTab('support');
                }}
                style={[
                  styles.tabBtn,
                  activeTab === 'support' && [
                    styles.tabBtnActive,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: theme.isDark ? 0.2 : 0.08,
                      shadowRadius: 4,
                      elevation: 2,
                    },
                  ],
                ]}
              >
                <AppIcon
                  name="life-buoy"
                  size={14}
                  color={
                    activeTab === 'support'
                      ? theme.colors.primary
                      : theme.colors.textTertiary
                  }
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color:
                        activeTab === 'support'
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                    },
                    activeTab === 'support' && { fontWeight: '800' },
                  ]}
                >
                  Help & Support
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Tab Content */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            {activeTab === 'about' ? (
              <View style={styles.aboutContainer}>
                {/* Hero Pitch */}
                <View
                  style={[
                    styles.pitchBox,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.03)'
                        : '#F8FAFC',
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                >
                  <Typography
                    variant="bodySm"
                    weight="bold"
                    color="textPrimary"
                    style={{ lineHeight: 22 }}
                  >
                    {APP_NAME} is the next-generation group expense operating
                    system engineered specifically for travelers, friends,
                    roommates, and expeditions worldwide.
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    style={{ lineHeight: 20, marginTop: 8 }}
                  >
                    We designed {APP_NAME} from the ground up to solve awkward
                    money conversations on trips. It replaces error-prone
                    spreadsheets with automated debt simplification, live
                    foreign exchange conversion, offline-first reliability, and
                    interactive geotagged travel maps.
                  </Typography>
                </View>

                {/* Core Capabilities */}
                <Typography
                  variant="overline"
                  color="textTertiary"
                  style={{ marginTop: 18, marginBottom: 10 }}
                >
                  KEY CAPABILITIES
                </Typography>

                <View style={styles.featuresList}>
                  {APP_FEATURES.map((item, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.featureCard,
                        {
                          backgroundColor: theme.isDark
                            ? 'rgba(255,255,255,0.02)'
                            : '#FFFFFF',
                          borderColor: theme.colors.borderLight,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.featureIconBadge,
                          { backgroundColor: `${item.color}15` },
                        ]}
                      >
                        <AppIcon
                          name={item.icon as any}
                          size={16}
                          color={item.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          weight="bold"
                          color="textPrimary"
                          style={{ fontSize: 13 }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          style={{ fontSize: 11, marginTop: 2, lineHeight: 16 }}
                        >
                          {item.desc}
                        </Typography>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Company / Developer note */}
                <View
                  style={[
                    styles.companyFooter,
                    { borderTopColor: theme.colors.borderLight },
                  ]}
                >
                  <Typography
                    variant="caption"
                    color="textTertiary"
                    style={{ textAlign: 'center', fontSize: 11 }}
                  >
                    © {new Date().getFullYear()} {COMPANY_NAME}. All rights
                    reserved.
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textTertiary"
                    style={{ textAlign: 'center', fontSize: 10, marginTop: 2 }}
                  >
                    Crafted with precision for explorers and travelers.
                  </Typography>
                </View>
              </View>
            ) : (
              <View style={styles.supportContainer}>
                {/* Support Email Card */}
                <View
                  style={[
                    styles.supportCard,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.03)'
                        : '#F8FAFC',
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                >
                  <View style={styles.supportBadgeWrap}>
                    <AppIcon name="mail" size={20} color="#4F46E5" />
                  </View>
                  <Typography
                    variant="body"
                    weight="extrabold"
                    color="textPrimary"
                    style={{ marginTop: 10 }}
                  >
                    Official Support Contact
                  </Typography>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    style={{
                      textAlign: 'center',
                      marginTop: 4,
                      lineHeight: 18,
                    }}
                  >
                    Our engineering and customer support team is available to
                    assist you with any questions, bug reports, or feature
                    ideas.
                  </Typography>

                  <Pressable
                    onPress={handleCopyEmail}
                    style={({ pressed }) => [
                      styles.emailDisplayPill,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : '#FFFFFF',
                        borderColor: copied
                          ? '#10B981'
                          : theme.colors.borderStrong,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <AppIcon
                      name="mail"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.emailDisplayText,
                        { color: theme.colors.textPrimary },
                      ]}
                      selectable
                    >
                      {SUPPORT_EMAIL}
                    </Text>
                    <View
                      style={[
                        styles.copyBadge,
                        {
                          backgroundColor: copied
                            ? 'rgba(16, 185, 129, 0.15)'
                            : `${theme.colors.primary}12`,
                        },
                      ]}
                    >
                      <AppIcon
                        name={copied ? 'check' : 'copy'}
                        size={11}
                        color={copied ? '#10B981' : theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.copyBadgeText,
                          { color: copied ? '#10B981' : theme.colors.primary },
                        ]}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </Text>
                    </View>
                  </Pressable>

                  <View style={styles.supportActionsRow}>
                    <Pressable
                      onPress={handleEmailSupport}
                      style={({ pressed }) => [
                        styles.primaryActionBtn,
                        { backgroundColor: theme.colors.primary },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <AppIcon name="send" size={13} color="#FFFFFF" />
                      <Text style={styles.primaryActionBtnText}>
                        Email Support
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleCopyEmail}
                      style={({ pressed }) => [
                        styles.secondaryActionBtn,
                        {
                          borderColor: theme.colors.borderStrong,
                          backgroundColor: theme.colors.card,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <AppIcon
                        name={copied ? 'check' : 'copy'}
                        size={13}
                        color={copied ? '#10B981' : theme.colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.secondaryActionBtnText,
                          {
                            color: copied
                              ? '#10B981'
                              : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {copied ? 'Copied!' : 'Copy Email'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Additional Support Resources */}
                <Typography
                  variant="overline"
                  color="textTertiary"
                  style={{ marginTop: 18, marginBottom: 10 }}
                >
                  MORE RESOURCES
                </Typography>

                <Pressable
                  onPress={() => {
                    onClose();
                    router.push('/faq');
                  }}
                  style={[
                    styles.resourceRow,
                    { borderColor: theme.colors.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.resourceIconBox,
                      { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
                    ]}
                  >
                    <AppIcon name="help-circle" size={15} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      weight="bold"
                      color="textPrimary"
                    >
                      Frequently Asked Questions (FAQ)
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textTertiary"
                      style={{ fontSize: 11 }}
                    >
                      Answers to currency conversion, offline sync & debts
                    </Typography>
                  </View>
                  <AppIcon
                    name="chevron-right"
                    size={14}
                    color={theme.colors.textTertiary}
                  />
                </Pressable>

                <Pressable
                  onPress={() => {
                    onClose();
                    router.push('/(app)/profile/feedback');
                  }}
                  style={[
                    styles.resourceRow,
                    { borderColor: theme.colors.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.resourceIconBox,
                      { backgroundColor: 'rgba(234, 88, 12, 0.12)' },
                    ]}
                  >
                    <AppIcon name="message-square" size={15} color="#EA580C" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      weight="bold"
                      color="textPrimary"
                    >
                      Submit Feedback or Bug Report
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textTertiary"
                      style={{ fontSize: 11 }}
                    >
                      Directly notify our engineering team
                    </Typography>
                  </View>
                  <AppIcon
                    name="chevron-right"
                    size={14}
                    color={theme.colors.textTertiary}
                  />
                </Pressable>

                <View style={styles.supportResponseNote}>
                  <AppIcon
                    name="clock"
                    size={12}
                    color={theme.colors.textTertiary}
                  />
                  <Typography
                    variant="caption"
                    color="textTertiary"
                    style={{ fontSize: 11 }}
                  >
                    Average response time: within 24 hours
                  </Typography>
                </View>
              </View>
            )}
          </ScrollView>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionBadge: {
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
  },
  closeBtn: {
    padding: 6,
  },

  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabsSegment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabBtnActive: {},
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  modalScroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },

  aboutContainer: {},
  pitchBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  featuresList: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  featureIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },

  // Support
  supportContainer: {},
  supportCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
  },
  supportBadgeWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailDisplayPill: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailDisplayText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  copyBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  supportActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  resourceIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportResponseNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
});
