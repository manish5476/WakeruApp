// app/(app)/quick-actions.tsx
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Share,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { useAuthStore } from '../../stores/auth.store';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../providers/ThemeProvider';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import AppIcon from '../../components/common/AppIcon';
import { QuickAddBottomSheet } from '../../components/expenses/QuickAddBottomSheet';
import type { Theme } from '../../theme';

// ─── Hero Card Component ─────────────────────────────────────
function HeroActionCard({
  icon,
  title,
  subtitle,
  gradient,
  onPress,
  delay,
}: {
  icon: string;
  title: string;
  subtitle: string;
  gradient: readonly [string, string];
  onPress: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { stiffness: 400, damping: 25 });
    haptics.light();
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 25 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(350).springify()}
      style={[animatedStyle, { flex: 1 }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={heroStyles.cardPressable}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={heroStyles.card}
        >
          <View style={heroStyles.topRow}>
            <View style={heroStyles.iconWrap}>
              <AppIcon name={icon as any} size={22} color="#FFFFFF" />
            </View>
            <View style={heroStyles.arrowPill}>
              <AppIcon name="arrow-right" size={13} color="#FFFFFF" />
            </View>
          </View>

          <View style={heroStyles.textBlock}>
            <Text style={heroStyles.titleText}>{title}</Text>
            <Text style={heroStyles.subText}>{subtitle}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Quick Shortcut Tool Card ────────────────────────────────
function QuickToolCard({
  icon,
  label,
  color,
  bg,
  onPress,
  delay,
  theme,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
  delay: number;
  theme: Theme;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { stiffness: 400, damping: 25 });
    haptics.light();
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 25 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(350).springify()}
      style={[animatedStyle, { flex: 1 }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          toolStyles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(15,23,42,0.05)',
          },
        ]}
      >
        <View style={[toolStyles.iconAura, { backgroundColor: bg }]}>
          <AppIcon name={icon as any} size={18} color={color} />
        </View>
        <Text
          style={[toolStyles.label, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen Component ───────────────────────────────────
export default function QuickActionsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isTablet = width >= 640 && width < 860;

  const { user } = useAuthStore();
  const userName = user?.displayName?.split(' ')[0] || 'Traveler';
  const quickAddRef = useRef<BottomSheetModal>(null);

  const closeMenu = () => {
    haptics.light();
    router.back();
  };

  const handleAction = (route: string) => {
    haptics.medium();
    router.push(route as any);
  };

  const handleScanReceipt = async () => {
    haptics.medium();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera access is required to scan receipts.',
        [
          { text: 'Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      router.push({
        pathname: '/(app)/receipts/upload',
        params: { imageUri: result.assets[0].uri },
      } as any);
    }
  };

  const handleShare = async () => {
    haptics.medium();
    try {
      await Share.share({
        message:
          'Join me on Wakeru — the ultimate tool for splitting expenses & traveling together! ✈️',
      });
    } catch (error: any) {
      Alert.alert('Notice', error.message);
    }
  };

  const heroActions = [
    {
      icon: 'map',
      title: 'New Trip',
      subtitle: 'Plan expedition',
      gradient: ['#38BDF8', '#2563EB'] as const,
      onPress: () => handleAction('/create-trip'),
    },
    {
      icon: 'credit-card',
      title: 'Add Expense',
      subtitle: 'Log direct cost',
      gradient: ['#F43F5E', '#E11D48'] as const,
      onPress: () => {
        haptics.medium();
        quickAddRef.current?.present();
      },
    },
    {
      icon: 'camera',
      title: 'Scan Receipt',
      subtitle: 'Auto-extract items',
      gradient: ['#A855F7', '#6D28D9'] as const,
      onPress: handleScanReceipt,
    },
    {
      icon: 'check-circle',
      title: 'Settle Balances',
      subtitle: 'Clear IOUs',
      gradient: ['#10B981', '#059669'] as const,
      onPress: () => handleAction('/(app)/settlements'),
    },
  ];

  const tools = [
    {
      icon: 'user-plus',
      label: 'Join Trip',
      color: '#2563EB',
      bg: '#EFF6FF',
      onPress: () => handleAction('/(app)/trips/join'),
    },
    {
      icon: 'zap',
      label: 'UPI Settle',
      color: '#10B981',
      bg: '#ECFDF5',
      onPress: () => handleAction('/(app)/settlements'),
    },
    {
      icon: 'share-2',
      label: 'Share App',
      color: '#8B5CF6',
      bg: '#EDE9FE',
      onPress: handleShare,
    },
    {
      icon: 'bar-chart-2',
      label: 'Analytics',
      color: '#06B6D4',
      bg: '#CFFAFE',
      onPress: () => handleAction('/(app)/analytics'),
    },
    {
      icon: 'users',
      label: 'Companions',
      color: '#F59E0B',
      bg: '#FEF3C7',
      onPress: () => handleAction('/(app)/friends'),
    },
    {
      icon: 'settings',
      label: 'Preferences',
      color: '#71717A',
      bg: '#F4F4F5',
      onPress: () => handleAction('/(app)/settings/privacy'),
    },
  ];

  return (
    <View style={styles.root}>
      <GlobalBackground>
        <View style={styles.container}>
          {/* Backdrop Dismiss Trigger */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />

          {/* Modal Centered Wrapper */}
          <View
            style={[
              styles.contentWrapper,
              isDesktop && styles.desktopContentWrapper,
              {
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 40,
              },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
            >
              {/* Header Greeting & Close Pill */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.greetingTitle,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    Hey {userName}! 👋
                  </Text>
                  <Text
                    style={[
                      styles.greetingSub,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    What action would you like to take?
                  </Text>
                </View>

                <Pressable
                  onPress={closeMenu}
                  style={[
                    styles.closeBtn,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(15,23,42,0.06)',
                    },
                  ]}
                  hitSlop={8}
                >
                  <AppIcon
                    name="x"
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                </Pressable>
              </View>

              {/* ── BENTO HERO QUICK ACTIONS ── */}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colors.textTertiary },
                ]}
              >
                PRIMARY ACTIONS
              </Text>

              <View style={styles.heroGrid}>
                {heroActions.map((action, idx) => (
                  <View
                    key={action.title}
                    style={[
                      styles.heroGridCol,
                      isDesktop && { minWidth: '23.5%' },
                      isTablet && { minWidth: '48%' },
                    ]}
                  >
                    <HeroActionCard {...action} delay={80 + idx * 40} />
                  </View>
                ))}
              </View>

              {/* ── BENTO UTILITY SHORTCUTS ── */}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: theme.colors.textTertiary, marginTop: 24 },
                ]}
              >
                TOOLS & EXPLORATION
              </Text>

              <View style={styles.toolsGrid}>
                {tools.map((tool, idx) => (
                  <View
                    key={tool.label}
                    style={[
                      styles.toolGridCol,
                      isDesktop && { minWidth: '15%' },
                      isTablet && { minWidth: '31%' },
                    ]}
                  >
                    <QuickToolCard
                      {...tool}
                      delay={180 + idx * 30}
                      theme={theme}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <QuickAddBottomSheet ref={quickAddRef} />
        </View>
      </GlobalBackground>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 16,
  },
  desktopContentWrapper: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  scrollBody: {
    paddingBottom: 40,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 2,
  },

  // Hero Grid
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroGridCol: {
    flex: 1,
    minWidth: '47%',
  },

  // Tools Grid
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolGridCol: {
    flex: 1,
    minWidth: '30%',
  },
});

const heroStyles = StyleSheet.create({
  cardPressable: {
    flex: 1,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    height: 125,
    justifyContent: 'space-between',

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      } as any,

      default: {
        shadowColor: '#000',

        shadowOffset: {
          width: 0,
          height: 4,
        },

        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    gap: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
});

const toolStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 8,
    minHeight: 90,

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
      } as any,

      default: {
        shadowColor: '#000',

        shadowOffset: {
          width: 0,
          height: 4,
        },

        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  },
  iconAura: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
