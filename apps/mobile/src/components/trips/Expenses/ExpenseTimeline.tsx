// src/components/trips/Expenses/ExpenseTimeline.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpenseGroupUI, ExpenseUI } from './PresentationModels';
import { useTheme } from '../../../providers/ThemeProvider';
import { ExpenseCardPremium } from './ExpenseCardPremium';
import { ExpenseDetailsModal } from './ExpenseDetailsModal';

interface ExpenseTimelineProps {
  groups: ExpenseGroupUI[];
}

export function ExpenseTimeline({ groups }: ExpenseTimelineProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  if (groups.length === 0) return null;

  return (
    <View style={styles.container}>
      {groups.map((group, groupIndex) => (
        <View key={group.date.toISOString()} style={styles.group}>
          <View style={styles.header}>
            <View style={styles.dateBadge}>
              <Text
                style={[styles.dateText, { color: theme.colors.textPrimary }]}
              >
                {group.formattedDate}
              </Text>
            </View>
            <View
              style={[
                styles.line,
                { backgroundColor: theme.colors.borderLight },
              ]}
            />
          </View>

          <View style={styles.content}>
            <View
              style={[
                styles.verticalLine,
                { backgroundColor: theme.colors.borderLight },
              ]}
            />
            <View style={styles.cards}>
              {group.items.map((expense, index) => (
                <ExpenseCardPremium
                  key={expense.id}
                  expense={expense}
                  index={index}
                  onPress={() => setSelectedExpense(expense.rawExpense)}
                />
              ))}
            </View>
          </View>
        </View>
      ))}

      <ExpenseDetailsModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />
    </View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  return StyleSheet.create({
    container: {
      paddingBottom: 40,
    },
    group: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    dateBadge: {
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    dateText: {
      fontSize: 13,
      fontWeight: '700',
    },
    line: {
      flex: 1,
      height: 1,
    },
    content: {
      flexDirection: 'row',
    },
    verticalLine: {
      width: 2,
      marginLeft: 16,
      marginRight: 20,
      borderRadius: 1,
    },
    cards: {
      flex: 1,
    },
  });
};
