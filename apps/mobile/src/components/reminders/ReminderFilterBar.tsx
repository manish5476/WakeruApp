import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { TabBar, TabItem } from '../ui/TabBar';
import { useTheme } from '../../providers/ThemeProvider';
import type { Theme } from '../../theme';

export const FILTERS = [
  'All',
  'Active',
  'Incoming',
  'Completed',
  'Paused',
  'Cancelled',
  'Payment',
  'Custom',
  'Recurring',
  'One Time',
  'Today',
  'This Week',
  'High Priority',
];

interface ReminderFilterBarProps {
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export function ReminderFilterBar({
  activeFilter,
  onSelectFilter,
}: ReminderFilterBarProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tabs: TabItem[] = FILTERS.map(f => ({ key: f, label: f }));

  return (
    <View style={styles.container}>
      <TabBar
        tabs={tabs}
        activeKey={activeFilter}
        onTabChange={onSelectFilter}
        variant="segmented"
        scrollable
        size="sm"
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginBottom: theme.spacing[4],
    },
  });
}
