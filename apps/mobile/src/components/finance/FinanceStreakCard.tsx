import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { ProgressBar } from '../ui/ProgressBar';
import AppIcon from '../common/AppIcon';
import GlobalLoader from '../common/GlobalLoader';
import { useSpendingStreak } from '../../hooks/useFinance';
import type { Theme } from '../../theme';

interface FinanceStreakCardProps {
  limit?: number;
  style?: StyleProp<ViewStyle>;
}

export function FinanceStreakCard({
  limit = 100,
  style,
}: FinanceStreakCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { data: streakInfo, isLoading } = useSpendingStreak();

  if (isLoading) {
    return (
      <GlassCard
        variant="medium"
        padding="md"
        style={[styles.loadingContainer, style]}
      >
        <View style={styles.loadingContent}>
          <GlobalLoader
            variant="inline"
            size="small"
            color={theme.colors.primary}
          />
          <Typography variant="caption" color="textTertiary">
            Calculating streak…
          </Typography>
        </View>
      </GlassCard>
    );
  }

  const {
    currentStreak = 0,
    longestStreak = 0,
    isActive = false,
  } = streakInfo || {};

  const streakProgress = longestStreak > 0 ? currentStreak / longestStreak : 0;
  const flameColor = isActive ? theme.colors.warm : theme.colors.textSecondary;

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} style={style}>
      <GlassCard variant="medium" padding="md" style={styles.card}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: isActive
                    ? `${theme.colors.warm}18`
                    : theme.colors.primaryBg,
                },
              ]}
            >
              <AppIcon name="flame" size={16} color={flameColor} />
            </View>
            <View>
              <Typography variant="bodySm" weight="bold" color="textPrimary">
                Spending Streak
              </Typography>
              <Typography variant="caption" color="textTertiary">
                {isActive ? 'Active streak' : 'No active streak'}
              </Typography>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {/* Current Streak */}
            <View style={styles.statColumn}>
              <Typography
                variant="h2"
                weight="extrabold"
                color={isActive ? 'danger' : 'textPrimary'}
                style={{ letterSpacing: -0.5 }}
              >
                {currentStreak}
              </Typography>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Current
              </Typography>
              <Typography variant="caption" color="textTertiary">
                {currentStreak === 1 ? 'day' : 'days'}
              </Typography>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Longest Streak */}
            <View style={styles.statColumn}>
              <Typography
                variant="h3"
                weight="extrabold"
                color="textPrimary"
                style={{ letterSpacing: -0.5 }}
              >
                {longestStreak}
              </Typography>
              <Typography
                variant="caption"
                weight="semibold"
                color="textSecondary"
                style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Longest
              </Typography>
              <Typography variant="caption" color="textTertiary">
                {longestStreak === 1 ? 'day' : 'days'}
              </Typography>
            </View>
          </View>

          {/* Progress Bar */}
          {longestStreak > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Typography variant="caption" color="textTertiary">
                  Progress to beat record
                </Typography>
                <Typography
                  variant="caption"
                  weight="semibold"
                  color="textSecondary"
                >
                  {Math.min(Math.round(streakProgress * 100), 100)}%
                </Typography>
              </View>
              <ProgressBar
                progress={Math.min(streakProgress, 1)}
                height={5}
                variant={isActive ? 'danger' : 'default'}
              />
            </View>
          )}

          {/* Message */}
          <Typography variant="caption" color="textTertiary" align="center">
            {isActive
              ? `You're on fire! You've logged expenses for ${currentStreak} consecutive ${currentStreak === 1 ? 'day' : 'days'}.`
              : `Start a new streak today by logging an expense!`}
          </Typography>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme) {
  return StyleSheet.create({
    loadingContainer: {
      minHeight: 200,
      justifyContent: 'center',
    },
    loadingContent: {
      alignItems: 'center',
      gap: theme.spacing[2],
    },
    card: {
      minHeight: 200,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      gap: theme.spacing[3],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
    },
    iconWrapper: {
      width: theme.spacing[8], // 32px
      height: theme.spacing[8],
      borderRadius: theme.borderRadius.lg, // 12px
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing[1], // 4px
    },
    statColumn: {
      flex: 1,
      alignItems: 'center',
      gap: theme.spacing[1],
    },
    divider: {
      width: 1,
      height: theme.spacing[8], // 32px
      backgroundColor: theme.colors.border,
      marginHorizontal: theme.spacing[2],
    },
    progressContainer: {
      gap: theme.spacing[1],
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
}
