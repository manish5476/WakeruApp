import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../../providers/ThemeProvider';
import { GlassCard } from '../../ui/GlassCard';
import { Typography } from '../../ui/Typography';
import AppIcon from '../../common/AppIcon';
import type { Theme } from '../../../theme';

interface PlannerProgressCardProps {
  planningProgress: number; // 0-100
  bookingsCount: number;
  bookingsTotal: number;
  packingProgress: number; // 0-100
  tasksCompleted: number;
  tasksTotal: number;
}

export function PlannerProgressCard({
  planningProgress,
  bookingsCount,
  bookingsTotal,
  packingProgress,
  tasksCompleted,
  tasksTotal,
}: PlannerProgressCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Calculate effective totals to avoid division by zero or weird UI states
  const effectiveBookingsTotal = bookingsTotal || Math.max(bookingsCount, 4);
  const effectiveTasksTotal = tasksTotal || Math.max(tasksCompleted, 1);
  const safePlanningProgress = Math.min(planningProgress, 100);
  const safePackingProgress = Math.min(packingProgress, 100);

  return (
    <GlassCard variant="medium" padding="lg" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: `${theme.colors.primary}15` },
            ]}
          >
            <AppIcon
              name="bar-chart-2"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <Typography variant="body" weight="bold" color="textPrimary">
            Planning Progress
          </Typography>
        </View>
        <Typography
          variant="h3"
          weight="extrabold"
          color="primary"
          style={{ letterSpacing: -0.5 }}
        >
          {safePlanningProgress}%
        </Typography>
      </View>

      {/* Main Progress Bar */}
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <LinearGradient
          colors={
            theme.gradients.primary as readonly [string, string, ...string[]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${safePlanningProgress}%` }]}
        />
      </View>

      {/* Divider */}
      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Bookings */}
        <View style={styles.statItem}>
          <Typography
            variant="caption"
            weight="semibold"
            color="textSecondary"
            style={styles.statLabel}
          >
            Bookings
          </Typography>
          <View style={styles.statValueRow}>
            <Typography variant="h3" weight="extrabold" color="textPrimary">
              {bookingsCount}
            </Typography>
            <Typography variant="caption" weight="medium" color="textTertiary">
              / {effectiveBookingsTotal}
            </Typography>
          </View>
        </View>

        {/* Packing */}
        <View style={styles.statItem}>
          <Typography
            variant="caption"
            weight="semibold"
            color="textSecondary"
            style={styles.statLabel}
          >
            Packing
          </Typography>
          <View style={styles.statValueRow}>
            <Typography variant="h3" weight="extrabold" color="textPrimary">
              {safePackingProgress}%
            </Typography>
          </View>
        </View>

        {/* Tasks */}
        <View style={styles.statItem}>
          <Typography
            variant="caption"
            weight="semibold"
            color="textSecondary"
            style={styles.statLabel}
          >
            Tasks
          </Typography>
          <View style={styles.statValueRow}>
            <Typography variant="h3" weight="extrabold" color="textPrimary">
              {tasksCompleted}
            </Typography>
            <Typography variant="caption" weight="medium" color="textTertiary">
              / {effectiveTasksTotal}
            </Typography>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginBottom: theme.spacing[5],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing[4],
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[3],
    },
    iconBox: {
      width: theme.spacing[8], // 32px
      height: theme.spacing[8],
      borderRadius: theme.borderRadius.lg, // 12px
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressTrack: {
      height: theme.spacing[2], // 8px
      borderRadius: theme.borderRadius.full,
      overflow: 'hidden',
      marginBottom: theme.spacing[5],
    },
    progressFill: {
      height: '100%',
      borderRadius: theme.borderRadius.full,
    },
    divider: {
      height: 1,
      marginBottom: theme.spacing[4],
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing[4],
    },
    statItem: {
      flex: 1,
      gap: theme.spacing[1],
    },
    statLabel: {
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline', // Ensures the main number and "/ total" align perfectly at the bottom
      gap: theme.spacing[1],
    },
  });
}
