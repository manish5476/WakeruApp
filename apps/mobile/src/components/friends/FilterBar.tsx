// components/friends/FilterBar.tsx
import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import type { Theme } from '../../theme';

export type FilterOption =
  | 'All'
  | 'Favorites'
  | 'Recent'
  | 'Most Active'
  | 'Frequent Travelers'
  | 'Pending Requests'
  | 'Blocked'
  | 'Admins'
  | 'Mutual Friends'
  | 'Online';

interface FilterBarProps {
  filters: FilterOption[];
  activeFilter: FilterOption;
  onSelectFilter: (filter: FilterOption) => void;
}

const FILTER_ICONS: Record<FilterOption, string> = {
  All: 'layers',
  Favorites: 'star',
  Recent: 'clock',
  'Most Active': 'zap',
  'Frequent Travelers': 'compass',
  'Pending Requests': 'inbox',
  Blocked: 'slash',
  Admins: 'shield',
  'Mutual Friends': 'users',
  Online: 'activity',
};

export function FilterBar({
  filters,
  activeFilter,
  onSelectFilter,
}: FilterBarProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map(filter => {
          const isActive = activeFilter === filter;
          const iconName = FILTER_ICONS[filter] || 'tag';

          return (
            <Pressable
              key={filter}
              onPress={() => {
                haptics.light();
                onSelectFilter(filter);
              }}
              style={({ pressed }) => [
                styles.filterPill,
                isActive
                  ? { backgroundColor: theme.colors.primary }
                  : {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(15, 23, 42, 0.05)',
                    },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              {filter === 'Online' && (
                <View
                  style={[
                    styles.onlineIndicator,
                    { backgroundColor: isActive ? '#FFFFFF' : '#10B981' },
                  ]}
                />
              )}

              {filter !== 'Online' && (
                <AppIcon
                  name={iconName as any}
                  size={12}
                  color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                />
              )}

              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      width: '100%',
    },
    scrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 2,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      minHeight: 32,
    },
    filterText: {
      fontSize: 11.5,
      letterSpacing: -0.2,
    },
    onlineIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
  });
}
