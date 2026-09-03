import React, { useMemo, useCallback } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import { TabBar, TabItem } from '../ui/TabBar';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterChipListProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function FilterChipList({
  options,
  selectedId,
  onSelect,
  style,
}: FilterChipListProps) {
  const theme = useTheme();

  // Memoize tab mapping to prevent unnecessary re-creations on parent re-renders
  const tabs: TabItem[] = useMemo(
    () => options.map(opt => ({ key: opt.id, label: opt.label })),
    [options],
  );

  // Add tactile haptic feedback to the selection action
  const handleSelect = useCallback(
    (id: string) => {
      haptics.light();
      onSelect(id);
    },
    [onSelect],
  );

  return (
    <View style={[{ marginBottom: theme.spacing.md }, style]}>
      <TabBar
        tabs={tabs}
        activeKey={selectedId}
        onTabChange={handleSelect}
        variant="segmented"
        scrollable
        size="sm"
      />
    </View>
  );
}
