import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { format, isToday, isTomorrow } from 'date-fns';

import { useTheme } from '../../providers/ThemeProvider';
import { useResponsive } from '../../hooks/useResponsive';
import { ReminderAPIModel, extractAmount } from '../../utils/reminder.utils';
import AppIcon from '../common/AppIcon';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import type { Theme } from '../../theme';

interface ReminderInsightsProps {
  reminders: ReminderAPIModel[];
}

export function ReminderInsights({ reminders }: ReminderInsightsProps) {
  const theme = useTheme();
  const { isDesktop } = useResponsive();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const activeReminders = reminders.filter(r => r.status === 'active');

  // 1. Pending Due Amount
  let totalPendingAmount = 0;
  let pendingPaymentCount = 0;
  activeReminders.forEach(r => {
    if (r.type === 'payment' || r.type === 'settlement') {
      pendingPaymentCount++;
      const amt = extractAmount(r.message);
      if (amt) {
        const parsed = parseFloat(amt.replace(/,/g, ''));
        if (!isNaN(parsed)) totalPendingAmount += parsed;
      }
    }
  });

  // 2. Most Reminded Person
  const personCounts: Record<string, number> = {};
  reminders.forEach(r => {
    if (r.targetUserName) {
      personCounts[r.targetUserName] =
        (personCounts[r.targetUserName] || 0) + 1;
    }
  });
  const sortedPersons = Object.keys(personCounts).sort(
    (a, b) => personCounts[b] - personCounts[a],
  );
  const mostRemindedPerson = sortedPersons[0];
  const mostRemindedCount = mostRemindedPerson
    ? personCounts[mostRemindedPerson]
    : 0;

  // 3. Escalation & Priority
  const urgentCount = activeReminders.filter(
    r => r.escalationLevel >= 2,
  ).length;

  // 4. Next Upcoming Trigger
  const upcomingTriggers = activeReminders
    .filter(r => r.nextTriggerAt && new Date(r.nextTriggerAt) > new Date())
    .sort(
      (a, b) =>
        new Date(a.nextTriggerAt!).getTime() -
        new Date(b.nextTriggerAt!).getTime(),
    );
  const nextReminder = upcomingTriggers[0];

  let nextScheduleText = 'No queue';
  if (nextReminder && nextReminder.nextTriggerAt) {
    const d = new Date(nextReminder.nextTriggerAt);
    if (isToday(d)) {
      nextScheduleText = `Today, ${format(d, 'h:mm a')}`;
    } else if (isTomorrow(d)) {
      nextScheduleText = `Tomorrow, ${format(d, 'h:mm a')}`;
    } else {
      nextScheduleText = format(d, 'MMM d, h:mm a');
    }
  } else if (activeReminders.length > 0) {
    nextScheduleText = 'On standby';
  }

  const insights = [
    {
      label: 'Pending Dues',
      value:
        totalPendingAmount > 0
          ? `₹${totalPendingAmount.toLocaleString('en-IN')}`
          : pendingPaymentCount > 0
            ? `${pendingPaymentCount} Due`
            : '₹0',
      subtitle:
        pendingPaymentCount > 0
          ? `${pendingPaymentCount} payment reminder${pendingPaymentCount !== 1 ? 's' : ''}`
          : 'All settled up',
      icon: 'credit-card',
      color:
        totalPendingAmount > 0 ? theme.colors.warning : theme.colors.success,
      badge: totalPendingAmount > 0 ? 'DUE' : 'CLEAR',
    },
    {
      label: 'Top Contact',
      value: mostRemindedPerson || 'None',
      subtitle:
        mostRemindedCount > 0
          ? `${mostRemindedCount} reminder${mostRemindedCount !== 1 ? 's' : ''} logged`
          : 'No recipients yet',
      icon: 'users',
      color: theme.colors.purple,
      badge: mostRemindedCount > 0 ? `${mostRemindedCount}x` : undefined,
    },
    {
      label: 'Escalation Pace',
      value:
        urgentCount > 0
          ? `${urgentCount} Urgent`
          : activeReminders.length > 0
            ? 'On Track'
            : 'All Clear',
      subtitle:
        urgentCount > 0
          ? 'High priority alerts'
          : activeReminders.length > 0
            ? 'Normal cadence'
            : 'Zero pending',
      icon: urgentCount > 0 ? 'alert-triangle' : 'zap',
      color: urgentCount > 0 ? theme.colors.danger : theme.colors.info,
      badge: urgentCount > 0 ? 'ACTION' : 'NORMAL',
    },
    {
      label: 'Next Schedule',
      value: nextScheduleText,
      subtitle:
        nextReminder?.title ||
        (activeReminders.length > 0 ? 'Recurring cadence' : 'Queue is empty'),
      icon: 'clock',
      color: theme.colors.primary,
      badge: nextReminder ? 'UPCOMING' : undefined,
    },
  ];

  const renderCard = (insight: (typeof insights)[0], index: number) => (
    <GlassCard
      key={index}
      variant="subtle"
      padding="md"
      style={styles.insightCard}
    >
      <View style={styles.cardHeader}>
        <View
          style={[styles.iconWrap, { backgroundColor: `${insight.color}15` }]}
        >
          <AppIcon name={insight.icon as any} size={18} color={insight.color} />
        </View>
        {insight.badge && (
          <View
            style={[
              styles.badgeWrap,
              { backgroundColor: `${insight.color}15` },
            ]}
          >
            <Typography
              variant="caption"
              weight="black"
              style={{ color: insight.color, fontSize: 10, letterSpacing: 0.5 }}
            >
              {insight.badge}
            </Typography>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Typography
          variant="h3"
          weight="extrabold"
          color="textPrimary"
          numberOfLines={1}
          style={styles.insightValue}
        >
          {insight.value}
        </Typography>
        <Typography
          variant="caption"
          weight="bold"
          color="textSecondary"
          numberOfLines={1}
          style={styles.insightLabel}
        >
          {insight.label}
        </Typography>
        {insight.subtitle && (
          <Typography
            variant="caption"
            weight="medium"
            color="textTertiary"
            numberOfLines={1}
            style={styles.insightSubtitle}
          >
            {insight.subtitle}
          </Typography>
        )}
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <Typography
        variant="h3"
        weight="extrabold"
        color="textPrimary"
        style={styles.sectionTitle}
      >
        Insights & Activity
      </Typography>
      {isDesktop ? (
        <View style={styles.gridContent}>
          {insights.map((insight, index) => renderCard(insight, index))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {insights.map((insight, index) => renderCard(insight, index))}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginBottom: theme.spacing[6],
    },
    sectionTitle: {
      marginBottom: theme.spacing[3],
    },
    gridContent: {
      flexDirection: 'row',
      gap: theme.spacing[3],
    },
    scrollContent: {
      gap: theme.spacing[3],
      flexDirection: 'row',
      paddingRight: theme.spacing[4],
    },
    insightCard: {
      flex: 1,
      minWidth: 180,
      borderRadius: theme.borderRadius.xl,
      gap: theme.spacing[3],
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    iconWrap: {
      width: theme.spacing[9], // 36px
      height: theme.spacing[9],
      borderRadius: theme.borderRadius.lg, // 12px
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeWrap: {
      paddingHorizontal: theme.spacing[2],
      paddingVertical: theme.spacing[0.5],
      borderRadius: theme.borderRadius.full,
    },
    cardContent: {
      gap: 2,
    },
    insightValue: {
      letterSpacing: -0.3,
    },
    insightLabel: {
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    insightSubtitle: {
      marginTop: 2,
    },
  });
}
