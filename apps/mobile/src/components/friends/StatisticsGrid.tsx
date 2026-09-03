// components/friends/StatisticsGrid.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';
import type { Theme } from '../../theme';

export interface StatItem {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

interface StatisticsGridProps {
  stats: StatItem[];
}

export function StatisticsGrid({ stats }: StatisticsGridProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.grid}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[styles.tile, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.topRow}>
            <View
              style={[styles.iconAura, { backgroundColor: `${stat.color}15` }]}
            >
              <AppIcon name={stat.icon as any} size={15} color={stat.color} />
            </View>
            <Text style={[styles.statLabel, { color: stat.color }]}>
              {stat.label.toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
            {stat.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    tile: {
      flex: 1,
      minWidth: 140,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

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

      justifyContent: 'space-between',
      gap: 6,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconAura: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
  });
}
