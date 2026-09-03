import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import AppIcon from '../common/AppIcon';
import { TimelineGroup } from '../../utils/reminder.utils';
import type { Theme } from '../../theme';

interface ReminderEmptyStateProps {
  filter: string;
  group?: TimelineGroup;
}

export function ReminderEmptyState({ filter, group }: ReminderEmptyStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  let iconName = 'inbox';
  let iconColor = theme.colors.textTertiary;
  let title = "You're all caught up.";
  let message = 'No active reminders right now.';

  if (filter === 'Completed' || group === 'Completed') {
    iconName = 'check-circle';
    iconColor = theme.colors.success;
    title = 'Tidy work!';
    message = 'All reminders completed.';
  } else if (filter === 'Cancelled' || group === 'Cancelled') {
    iconName = 'trash-2';
    iconColor = theme.colors.textTertiary;
    title = 'Clean slate.';
    message = 'No cancelled reminders.';
  } else if (filter === 'Overdue' || group === 'Overdue') {
    iconName = 'award';
    iconColor = theme.colors.success;
    title = 'Nothing overdue!';
    message = 'You are on top of things.';
  } else if (filter === 'Payment') {
    iconName = 'credit-card';
    iconColor = theme.colors.info;
    title = 'No payments due.';
    message = 'Your wallet can rest for now.';
  }

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
        <AppIcon name={iconName} size={32} color={iconColor} />
      </View>
      <Typography
        variant="h3"
        weight="extrabold"
        color="textPrimary"
        align="center"
        style={styles.title}
      >
        {title}
      </Typography>
      <Typography variant="bodySm" color="textSecondary" align="center">
        {message}
      </Typography>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing['5xl'],
      paddingHorizontal: theme.spacing[8],
      maxWidth: 500,
      width: '100%',
      alignSelf: 'center',
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing[6],
    },
    title: {
      marginBottom: theme.spacing[2],
    },
  });
}

// // src/components/reminders/ReminderEmptyState.tsx
// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';
// import { useTheme } from '../../providers/ThemeProvider';
// import { TimelineGroup } from '../../utils/reminder.utils';

// interface ReminderEmptyStateProps {
//     filter: string;
//     group?: TimelineGroup;
// }

// export function ReminderEmptyState({ filter, group }: ReminderEmptyStateProps) {
//     const theme = useTheme();

//     let emoji = '📭';
//     let title = "You're all caught up.";
//     let message = "No active reminders right now.";

//     if (filter === 'Completed' || group === 'Completed') {
//         emoji = '✨';
//         title = "Tidy work!";
//         message = "All reminders completed.";
//     } else if (filter === 'Cancelled' || group === 'Cancelled') {
//         emoji = '🗑️';
//         title = "Clean slate.";
//         message = "No cancelled reminders.";
//     } else if (filter === 'Overdue' || group === 'Overdue') {
//         emoji = '🙌';
//         title = "Nothing overdue!";
//         message = "You are on top of things.";
//     } else if (filter === 'Payment') {
//         emoji = '💸';
//         title = "No payments due.";
//         message = "Your wallet can rest for now.";
//     }

//     return (
//         <View style={styles.container}>
//             <Text style={styles.emoji}>{emoji}</Text>
//             <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
//             <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 60,
//         paddingHorizontal: 32,
//         maxWidth: 500,
//         width: '100%',
//         alignSelf: 'center',
//     },
//     emoji: {
//         fontSize: 64,
//         marginBottom: 24,
//     },
//     title: {
//         fontSize: 20,
//         fontWeight: '800',
//         marginBottom: 8,
//         textAlign: 'center',
//     },
//     message: {
//         fontSize: 15,
//         fontWeight: '500',
//         textAlign: 'center',
//     }
// });
