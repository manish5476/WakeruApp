// src/components/trips/Expenses/CategoryFilters.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  PressableStateCallbackType,
} from 'react-native';
import { GlassCard } from '../../ui/GlassCard';
import { useTheme } from '../../../providers/ThemeProvider';
import { useResponsive } from '../../../hooks/useResponsive';
import { haptics } from '../../../utils/haptics';

const CATEGORIES = [
  'all',
  'food',
  'stay',
  'transport',
  'activity',
  'shopping',
  'health',
  'other',
  'archived',
];
const CATEGORY_EMOJIS: Record<string, string> = {
  all: '📋',
  food: '🍽️',
  stay: '🏨',
  transport: '🚗',
  activity: '🎯',
  shopping: '🛍️',
  health: '💊',
  other: '📌',
  archived: '📦',
};

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean;
  pressed?: boolean;
};

import { SortOption } from './ExpenseMappers';

interface CategoryFiltersProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  sortBy: SortOption;
  onSelectSort: (sort: SortOption) => void;
}

const SORT_OPTIONS = [
  { id: 'date_desc', label: 'Newest First' },
  { id: 'date_asc', label: 'Oldest First' },
  { id: 'amount_desc', label: 'Highest Amount' },
  { id: 'amount_asc', label: 'Lowest Amount' },
] as const;

import { TabBar, TabItem } from '../../ui/TabBar';

export function CategoryFilters({
  selectedCategory,
  onSelectCategory,
  sortBy,
  onSelectSort,
}: CategoryFiltersProps) {
  const categoryTabs: TabItem[] = CATEGORIES.map(cat => ({
    key: cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    icon: CATEGORY_EMOJIS[cat],
  }));

  const sortTabs: TabItem[] = SORT_OPTIONS.map(opt => ({
    key: opt.id,
    label: opt.label,
  }));

  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      <TabBar
        tabs={categoryTabs}
        activeKey={selectedCategory}
        onTabChange={onSelectCategory}
        variant="segmented"
        scrollable
        size="sm"
      />
      <TabBar
        tabs={sortTabs}
        activeKey={sortBy}
        onTabChange={key => onSelectSort(key as SortOption)}
        variant="segmented"
        scrollable
        size="sm"
      />
    </View>
  );
}

const useStyles = () => {
  const theme = useTheme();
  const { isMobile } = useResponsive();

  return StyleSheet.create({
    stickyFilterContainer: {
      position: 'sticky' as any,
      top: 0,
      zIndex: 20,
      paddingVertical: 16,
      backgroundColor: 'transparent',
      ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
      marginHorizontal: isMobile ? -16 : -24,
      paddingHorizontal: isMobile ? 16 : 24,
      marginBottom: 24,
    } as any,
    filterGlass: {
      padding: 6,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(255,255,255,0.2)',
    },
    filterContent: {
      gap: 6,
      paddingHorizontal: 4,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 100,
      ...(Platform.OS === 'web'
        ? { transition: 'all 0.2s ease', cursor: 'pointer' }
        : {}),
    },
    filterEmoji: {
      fontSize: 14,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '700',
    },
    filterTextActive: {
      fontWeight: '800',
    },
    sortChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 100,
      borderWidth: 1,
      ...(Platform.OS === 'web'
        ? { transition: 'all 0.2s ease', cursor: 'pointer' }
        : {}),
    },
    sortText: {
      fontSize: 12,
      fontWeight: '600',
    },
    sortTextActive: {
      fontWeight: '800',
    },
  });
};
