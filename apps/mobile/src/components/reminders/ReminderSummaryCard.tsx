import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { ReminderAPIModel } from '../../utils/reminder.utils';
import AppIcon from '../common/AppIcon';
import type { Theme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ReminderSummaryCardProps {
  reminders: ReminderAPIModel[];
  completionRate: number;
}

export function ReminderSummaryCard({
  reminders,
  completionRate,
}: ReminderSummaryCardProps) {
  const theme = useTheme();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const activeCount = reminders.filter(r => r.status === 'active').length;
  const completedCount = reminders.filter(r => r.status === 'completed').length;
  const overdueCount = reminders.filter(r => {
    if (r.status !== 'active' || !r.nextTriggerAt) return false;
    return new Date(r.nextTriggerAt) < new Date();
  }).length;
  const recurringCount = reminders.filter(r => r.frequency !== 'once').length;

  // Progress Ring Animation
  const strokeWidth = 6;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withDelay(
      300,
      withTiming(completionRate / 100, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [completionRate]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference - circumference * progressValue.value,
    };
  });

  return (
    <GlassCard variant="medium" padding="lg" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Typography variant="h2" weight="extrabold" color="textPrimary">
            Command Center
          </Typography>
          <Typography variant="bodySm" color="textSecondary">
            {reminders.length} Total Reminders
          </Typography>
        </View>

        <View style={styles.progressContainer}>
          <Svg width={80} height={80} viewBox="0 0 80 80">
            <Circle
              cx={40}
              cy={40}
              r={radius}
              stroke={theme.colors.borderLight}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <AnimatedCircle
              cx={40}
              cy={40}
              r={radius}
              stroke={theme.colors.success}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
          </Svg>
          <View style={styles.progressTextContainer}>
            <Typography variant="h3" weight="extrabold" color="textPrimary">
              {completionRate}%
            </Typography>
          </View>
        </View>
      </View>

      <View style={styles.statsWrapper}>
        {isDesktop ? (
          <View style={styles.statsGrid}>
            <StatBox
              label="Active"
              value={activeCount}
              color={theme.colors.info}
              icon="bell"
              theme={theme}
              styles={styles}
            />
            <StatBox
              label="Completed"
              value={completedCount}
              color={theme.colors.success}
              icon="check-circle"
              theme={theme}
              styles={styles}
            />
            <StatBox
              label="Overdue"
              value={overdueCount}
              color={theme.colors.danger}
              icon="alert-circle"
              theme={theme}
              styles={styles}
            />
            <StatBox
              label="Recurring"
              value={recurringCount}
              color={theme.colors.purple}
              icon="repeat"
              theme={theme}
              styles={styles}
            />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScrollContent}
          >
            <StatBox
              label="Active"
              value={activeCount}
              color={theme.colors.info}
              icon="bell"
              theme={theme}
              styles={styles}
            />
            <StatBox
              label="Completed"
              value={completedCount}
              color={theme.colors.success}
              icon="check-circle"
              theme={theme}
              styles={styles}
            />
            <StatBox
              label="Overdue"
              value={overdueCount}
              color={theme.colors.danger}
              icon="alert-circle"
              theme={theme}
              styles={styles}
            />
            <StatBox
              label="Recurring"
              value={recurringCount}
              color={theme.colors.purple}
              icon="repeat"
              theme={theme}
              styles={styles}
            />
          </ScrollView>
        )}
      </View>
    </GlassCard>
  );
}

interface StatBoxProps {
  label: string;
  value: number;
  color: string;
  icon: string;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
}

function StatBox({ label, value, color, icon, theme, styles }: StatBoxProps) {
  return (
    <View style={[styles.statBox, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}20` }]}>
        <AppIcon name={icon as any} size={16} color={color} />
      </View>
      <View>
        <Typography variant="h3" weight="extrabold" color="textPrimary">
          {value}
        </Typography>
        <Typography
          variant="caption"
          weight="semibold"
          color="textTertiary"
          style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          {label}
        </Typography>
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing[6],
      marginTop: theme.spacing[2],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[6],
    },
    headerText: {
      gap: theme.spacing[1],
    },
    progressContainer: {
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressTextContainer: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsWrapper: {
      // Clean layout without negative margin hacks
    },
    statsScrollContent: {
      gap: theme.spacing[3],
      flexDirection: 'row',
      paddingRight: theme.spacing[6], // Ensures the last item has padding when scrolling
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[3],
    },
    statBox: {
      flex: 1,
      minWidth: 140,
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing[3],
      borderRadius: theme.borderRadius.xl,
      gap: theme.spacing[3],
    },
    statIconWrap: {
      width: theme.spacing[8], // 32px
      height: theme.spacing[8],
      borderRadius: theme.borderRadius.lg, // 12px
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
