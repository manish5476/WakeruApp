// src/components/trips/Expenses/ExpenseCardPremium.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  PressableStateCallbackType,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../ui/GlassCard';
import { AvatarGroup } from '../../ui/AvatarGroup';
import AppIcon from '../../common/AppIcon';
import { useTheme } from '../../../providers/ThemeProvider';
import { ExpenseUI } from './PresentationModels';
import { haptics } from '../../../utils/haptics';
import { formatDistanceToNow, isValid } from 'date-fns';

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean;
  pressed?: boolean;
};
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================
// DESIGN SYSTEM UTILITIES
// ============================================================

type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'stay'
  | 'health'
  | 'shopping'
  | 'entertainment'
  | 'other'
  | 'activity'
  | 'archived'
  | 'all';
type ExpenseStatus = 'paid' | 'pending' | 'settled';

interface CategoryConfig {
  icon: string;
  label: string;
  gradientKey:
    'sunset' | 'ocean' | 'aurora' | 'roseGold' | 'emerald' | 'gold' | 'primary';
}

const CATEGORY_CONFIG: Record<ExpenseCategory, CategoryConfig> = {
  food: { icon: 'coffee', label: 'Food & Drinks', gradientKey: 'sunset' },
  transport: { icon: 'map', label: 'Transport', gradientKey: 'ocean' },
  stay: { icon: 'home', label: 'Accommodation', gradientKey: 'aurora' },
  health: { icon: 'heart', label: 'Health', gradientKey: 'roseGold' },
  shopping: { icon: 'shopping-bag', label: 'Shopping', gradientKey: 'emerald' },
  entertainment: { icon: 'film', label: 'Entertainment', gradientKey: 'gold' },
  activity: { icon: 'target', label: 'Activity', gradientKey: 'ocean' },
  archived: { icon: 'archive', label: 'Archived', gradientKey: 'primary' },
  all: { icon: 'list', label: 'All', gradientKey: 'primary' },
  other: { icon: 'more-horizontal', label: 'Other', gradientKey: 'primary' },
};

function StatusBadge({ status, theme }: { status: ExpenseStatus; theme: any }) {
  const config: Record<
    ExpenseStatus,
    { icon: string; color: string; bg: string; label: string }
  > = {
    paid: {
      icon: 'check-circle',
      color: theme.colors.success,
      bg: theme.colors.successBg,
      label: 'Paid',
    },
    pending: {
      icon: 'clock',
      color: theme.colors.warning,
      bg: theme.colors.warningBg,
      label: 'Pending',
    },
    settled: {
      icon: 'check',
      color: theme.colors.success,
      bg: theme.colors.successBg,
      label: 'Settled',
    },
  };
  const c = config[status] || config.pending;

  return (
    <View
      style={[
        badgeStyles.container,
        { backgroundColor: c.bg, borderColor: c.color + '25' },
      ]}
    >
      <View style={[badgeStyles.dot, { backgroundColor: c.color }]} />
      <Text style={[badgeStyles.text, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: -0.2 },
});

interface ExpenseCardPremiumProps {
  expense: ExpenseUI;
  index: number;
  onPress: () => void;
}

export function ExpenseCardPremium({
  expense,
  index,
  onPress,
}: ExpenseCardPremiumProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { stiffness: 400, damping: 25 });
    haptics.light();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 25 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const categoryConfig =
    CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
  const isYouPayer = expense.status.label === 'You Paid';

  let mappedStatus: ExpenseStatus = 'pending';
  if (expense.isSettled) mappedStatus = 'settled';
  else if (
    expense.status.label === 'You Paid' ||
    expense.status.variant === 'success'
  )
    mappedStatus = 'paid';

  const animationDelay = Math.min(index * 25, 250);

  const timeAgo =
    expense.date && isValid(new Date(expense.date))
      ? formatDistanceToNow(new Date(expense.date), { addSuffix: true })
      : expense.formattedDate || 'Recently';

  return (
    <Animated.View
      style={[animatedStyle, { marginBottom: 8 }]}
      entering={FadeInDown.delay(animationDelay).duration(400).springify()}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ hovered }: WebPressableState) => [
          styles.pressable,
          Platform.OS === 'web' && hovered && styles.hoverLift,
        ]}
      >
        <GlassCard intensity={theme.isDark ? 15 : 12} style={styles.card}>
          <LinearGradient
            colors={
              (theme.gradients[categoryConfig.gradientKey] as readonly [
                string,
                string,
                string,
              ]) || theme.gradients.primary
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentBar}
          />

          <View style={styles.content}>
            {/* Left: Category Icon */}
            <View
              style={[
                styles.categoryIconContainer,
                { backgroundColor: theme.colors.primaryBg },
              ]}
            >
              <AppIcon
                name={categoryConfig.icon}
                size={16}
                color={theme.colors.primary}
              />
            </View>

            {/* Middle: Title + Payer & Date meta */}
            <View style={styles.middleSection}>
              <Text
                style={[styles.title, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {expense.title || categoryConfig.label}
              </Text>
              <View style={styles.metaRow}>
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {isYouPayer
                    ? 'You paid'
                    : `Paid by ${expense.paidByName ? expense.paidByName.split(' ')[0] : 'User'}`}
                </Text>
                <Text
                  style={[styles.metaDot, { color: theme.colors.textTertiary }]}
                >
                  •
                </Text>
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {categoryConfig.label}
                </Text>
                <Text
                  style={[styles.metaDot, { color: theme.colors.textTertiary }]}
                >
                  •
                </Text>
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {timeAgo}
                </Text>
              </View>
            </View>

            {/* Right: Amount + Status */}
            <View style={styles.rightSection}>
              <Text
                style={[styles.amount, { color: theme.colors.textPrimary }]}
              >
                {expense.formattedAmount}
              </Text>
              <View style={styles.rightBottomRow}>
                <StatusBadge status={mappedStatus} theme={theme} />
                {expense.splitUrls && expense.splitUrls.length > 0 && (
                  <AvatarGroup urls={expense.splitUrls} max={2} size={18} />
                )}
              </View>
            </View>
          </View>
        </GlassCard>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    ...(Platform.OS === 'web'
      ? {
          transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
        }
      : {}),
  } as any,
  hoverLift: {
    transform: [{ translateY: -1.5 }],
  } as any,
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  accentBar: {
    height: 2.5,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 10,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    flexShrink: 0,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  rightBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
