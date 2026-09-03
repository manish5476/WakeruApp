// src/components/trips/StopDetails/ExpenseTimelineItem.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import AppIcon from '../../common/AppIcon';
import { GlassCard } from '../../ui/GlassCard';
import { Avatar } from '../../ui/Avatar';
import { ExpenseTimelineItemUI } from './PresentationModels';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  item: ExpenseTimelineItemUI;
  onPress: () => void;
  isLast?: boolean;
  index?: number;
}

const CATEGORY_MAP: Record<
  string,
  { icon: string; color: string; emoji: string }
> = {
  food: { icon: 'utensils', color: '#F59E0B', emoji: '\uD83C\uDF7D\uFE0F' },
  transport: { icon: 'car', color: '#3B82F6', emoji: '\uD83D\uDE97' },
  stay: { icon: 'hotel', color: '#8B5CF6', emoji: '\uD83C\uDFE8' },
  health: { icon: 'heart-pulse', color: '#EF4444', emoji: '\uD83D\uDC8A' },
  shopping: {
    icon: 'shopping-bag',
    color: '#EC4899',
    emoji: '\uD83D\uDECD\uFE0F',
  },
  entertainment: { icon: 'film', color: '#F43F5E', emoji: '\uD83C\uDFAC' },
  activity: { icon: 'compass', color: '#10B981', emoji: '\uD83C\uDFAF' },
  other: { icon: 'file-text', color: '#64748B', emoji: '\uD83D\uDCCC' },
};

export function ExpenseTimelineItem({
  item,
  onPress,
  isLast = false,
  index = 0,
}: Props) {
  const theme = useTheme();

  const catConfig = useMemo(() => {
    const key = (item.category || 'other').toLowerCase();
    return CATEGORY_MAP[key] || CATEGORY_MAP.other;
  }, [item.category]);

  const formattedAmount = useMemo(() => {
    const val =
      item.rawAmount ||
      parseFloat(item.amountFormatted.toString().replace(/[^\d.]/g, '')) ||
      0;
    return `\u20B9${val.toLocaleString('en-IN')}`;
  }, [item.rawAmount, item.amountFormatted]);

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 30, 250)).duration(300)}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.touchable}
      >
        <GlassCard
          variant="prominent"
          padding="none"
          style={styles.card}
          intensity={theme.isDark ? 30 : 50}
        >
          <View style={styles.cardInner}>
            {/* Category Icon Bubble */}
            <View
              style={[
                styles.iconBubble,
                {
                  backgroundColor: `${catConfig.color}15`,
                  borderColor: `${catConfig.color}35`,
                },
              ]}
            >
              <AppIcon
                name={catConfig.icon}
                size={16}
                color={catConfig.color}
              />
            </View>

            {/* Title and Metadata */}
            <View style={styles.infoWrapper}>
              <Text
                style={[styles.title, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <View style={styles.metaRow}>
                <Avatar
                  fallback={item.paidBy?.[0] || '?'}
                  size="sm"
                  previewable={false}
                />
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  Paid by {item.paidBy?.split(' ')[0] || 'Member'} Â·{' '}
                  {item.dateFormatted}
                </Text>
              </View>
            </View>

            {/* Amount & Settled Badge */}
            <View style={styles.amountWrapper}>
              <Text
                style={[styles.amountText, { color: theme.colors.textPrimary }]}
              >
                {formattedAmount}
              </Text>

              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: item.isSettled
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(245, 158, 11, 0.12)',
                    borderColor: item.isSettled
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(245, 158, 11, 0.3)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: item.isSettled ? '#10B981' : '#F59E0B',
                    },
                  ]}
                >
                  {item.isSettled ? '\u2713 SETTLED' : 'PENDING'}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
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

    overflow: 'hidden',
  } as any,
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrapper: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  amountWrapper: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
