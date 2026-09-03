// src/components/trips/Expenses/CategoryAnalytics.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { GlassCard } from '../../ui/GlassCard';
import { useTheme } from '../../../providers/ThemeProvider';
import { CategoryAnalyticsItemUI } from './PresentationModels';

interface CategoryAnalyticsProps {
  analytics: CategoryAnalyticsItemUI[];
}

export function CategoryAnalytics({ analytics }: CategoryAnalyticsProps) {
  const theme = useTheme();
  const styles = useStyles();

  if (!analytics || analytics.length === 0) return null;

  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  let accumulatedPercentage = 0;

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
      <GlassCard style={styles.container} intensity={theme.isDark ? 15 : 10}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Top Categories
        </Text>

        <View style={styles.content}>
          {/* Donut Chart */}
          <View style={styles.chartContainer}>
            <Svg width={size} height={size}>
              <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={
                    theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                  }
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {analytics.map((item, index) => {
                  const strokeDashoffset =
                    circumference - (circumference * item.percentage) / 100;
                  const rotation = (accumulatedPercentage / 100) * 360;
                  accumulatedPercentage += item.percentage;

                  if (item.percentage === 0) return null;

                  return (
                    <Circle
                      key={item.category}
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={item.categoryColor}
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      rotation={rotation}
                      origin={`${size / 2}, ${size / 2}`}
                      strokeLinecap="round"
                    />
                  );
                })}
              </G>
            </Svg>
            <View style={styles.chartCenter}>
              <Text
                style={[
                  styles.chartCenterText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {analytics.length}
              </Text>
              <Text
                style={[
                  styles.chartCenterSub,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Categories
              </Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            {analytics.slice(0, 4).map(item => (
              <View key={item.category} style={styles.legendItem}>
                <View style={styles.legendLeft}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: item.categoryColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.categoryEmoji}{' '}
                    {item.category.charAt(0).toUpperCase() +
                      item.category.slice(1)}
                  </Text>
                </View>
                <View style={styles.legendRight}>
                  <Text
                    style={[
                      styles.legendAmount,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {item.formattedAmount}
                  </Text>
                  <Text
                    style={[
                      styles.legendPercent,
                      { color: theme.colors.textTertiary },
                    ]}
                  >
                    {Math.round(item.percentage)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return StyleSheet.create({
    container: {
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.2)',
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 20,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
    },
    chartContainer: {
      position: 'relative',
      width: 120,
      height: 120,
    },
    chartCenter: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chartCenterText: {
      fontSize: 24,
      fontWeight: '900',
    },
    chartCenterSub: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    legendContainer: {
      flex: 1,
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    legendLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    legendRight: {
      alignItems: 'flex-end',
    },
    legendAmount: {
      fontSize: 13,
      fontWeight: '700',
    },
    legendPercent: {
      fontSize: 11,
      fontWeight: '500',
    },
  });
};
