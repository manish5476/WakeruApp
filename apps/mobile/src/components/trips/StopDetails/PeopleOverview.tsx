// src/components/trips/StopDetails/PeopleOverview.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { GlassCard, Avatar } from '../../ui';
import { ContributorUI } from './PresentationModels';
import AppIcon from '../../common/AppIcon';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface Props {
  contributors: ContributorUI[];
}

export function PeopleOverview({ contributors }: Props) {
  const theme = useTheme();

  if (!contributors || contributors.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Who Paid
        </Text>
        <Text
          style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}
        >
          {contributors.length} contributor
          {contributors.length === 1 ? '' : 's'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {contributors.map((contributor, index) => {
          const isTop = contributor.isLargestContributor || index === 0;
          const accentColor = isTop
            ? '#EA580C'
            : index === 1
              ? '#8B5CF6'
              : '#3B82F6';

          return (
            <Animated.View
              key={contributor.userId}
              entering={FadeInRight.delay(index * 70).duration(350)}
            >
              <GlassCard
                variant="prominent"
                style={[
                  styles.card,
                  isTop && { borderColor: 'rgba(234, 88, 12, 0.4)' },
                ]}
                intensity={theme.isDark ? 35 : 55}
              >
                <View style={styles.headerRow}>
                  <Avatar
                    url={contributor.avatarUrl}
                    fallback={contributor.name[0]}
                    size="sm"
                  />
                  {isTop && (
                    <View style={styles.topBadge}>
                      <AppIcon name="award" size={11} color="#EA580C" />
                      <Text style={styles.topBadgeText}>Top Payer</Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoGroup}>
                  <Text
                    style={[styles.name, { color: theme.colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {contributor.name}
                  </Text>
                  <Text
                    style={[styles.amount, { color: theme.colors.textPrimary }]}
                  >
                    {contributor.paidAmountFormatted}
                  </Text>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text
                      style={[
                        styles.percentageText,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      Contribution
                    </Text>
                    <Text
                      style={[styles.percentageValue, { color: accentColor }]}
                    >
                      {contributor.percentage.toFixed(0)}%
                    </Text>
                  </View>
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
                          width: `${Math.max(contributor.percentage, 4)}%`,
                          backgroundColor: accentColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </GlassCard>
            </Animated.View>
          );
        })}
      </ScrollView>
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
  scrollContent: {
    gap: 12,
    paddingVertical: 2,
  },
  card: {
    width: 170,
    padding: 14,
    gap: 12,
    borderRadius: 20,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
  },
  topBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EA580C',
    textTransform: 'uppercase',
  },
  infoGroup: {
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
  },
  amount: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 10,
    fontWeight: '600',
  },
  percentageValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 5,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
