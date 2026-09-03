// src/components/trips/StopDetails/CategoryBreakdown.tsx
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import AppIcon from '../../common/AppIcon';
import { GlassCard } from '../../ui';
import { CategoryBreakdownUI } from './PresentationModels';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  categories: CategoryBreakdownUI[];
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
  food: { icon: 'coffee', color: '#F59E0B' },
  transport: { icon: 'map-pin', color: '#3B82F6' },
  stay: { icon: 'home', color: '#8B5CF6' },
  health: { icon: 'heart', color: '#EC4899' },
  shopping: { icon: 'shopping-bag', color: '#10B981' },
  entertainment: { icon: 'film', color: '#F43F5E' },
  activity: { icon: 'compass', color: '#06B6D4' },
  archived: { icon: 'archive', color: '#64748B' },
  other: { icon: 'tag', color: '#64748B' },
};

export function CategoryBreakdown({ categories }: Props) {
  const theme = useTheme();

  if (!categories || categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Spending by Category
        </Text>
        <Text
          style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}
        >
          {categories.length} categories
        </Text>
      </View>

      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        <GlassCard
          variant="prominent"
          padding="none"
          style={styles.card}
          intensity={theme.isDark ? 35 : 55}
        >
          {categories.map((cat, index) => {
            const config =
              CATEGORY_CONFIG[cat.category.toLowerCase()] ||
              CATEGORY_CONFIG['other'];

            return (
              <View
                key={cat.category}
                style={[
                  styles.row,
                  index > 0 && styles.rowBorder,
                  index > 0 && { borderTopColor: theme.colors.borderLight },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: config.color + '18' },
                  ]}
                >
                  <AppIcon name={config.icon} size={15} color={config.color} />
                </View>

                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <View style={styles.nameRow}>
                      <Text
                        style={[
                          styles.categoryName,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {cat.category.charAt(0).toUpperCase() +
                          cat.category.slice(1)}
                      </Text>
                      {cat.isTopCategory && (
                        <View style={styles.topBadge}>
                          <AppIcon name="zap" size={9} color="#EA580C" />
                          <Text style={styles.topBadgeText}>Top</Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.amount,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {cat.spentFormatted}
                    </Text>
                  </View>

                  <View style={styles.progressRow}>
                    <View
                      style={[
                        styles.progressBarBg,
                        { backgroundColor: theme.colors.borderLight },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.max(cat.percentage, 3)}%`,
                            backgroundColor: config.color,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.percentageText,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      {cat.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
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
  } as any,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
    gap: 3,
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EA580C',
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
});
