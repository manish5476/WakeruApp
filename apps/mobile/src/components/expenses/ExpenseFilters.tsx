import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  PressableStateCallbackType,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { useTheme } from '../../providers/ThemeProvider';
import { Theme } from '../../theme';
import { haptics } from '../../utils/haptics';

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean;
  pressed?: boolean;
};

export const EXPENSE_FILTERS = [
  { key: 'all', label: 'All Expenses', icon: 'layers' },
  { key: 'you_owe', label: 'You Owe', icon: 'arrow-down-circle' },
  { key: 'you_paid', label: 'You Paid', icon: 'arrow-up-circle' },
  { key: 'unsettled', label: 'Pending', icon: 'clock' },
  { key: 'settled', label: 'Settled', icon: 'check-circle' },
  { key: 'archived', label: 'Archived', icon: 'archive' },
];

export const EXPENSE_GROUPINGS = [
  { key: 'date', label: 'Date', icon: 'calendar' },
  { key: 'tripId', label: 'Trip', icon: 'briefcase' },
  { key: 'paidBy', label: 'Payer', icon: 'user' },
];

interface ExpenseFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: string;
  setFilterType: (f: string) => void;
  groupBy: string;
  setGroupBy: (g: string) => void;
  isFocused: boolean;
  setIsFocused: (f: boolean) => void;
}

export function ExpenseFilters({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  groupBy,
  setGroupBy,
  isFocused,
  setIsFocused,
}: ExpenseFiltersProps) {
  const theme = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(600).springify()}
      style={styles.container}
    >
      <GlassCard style={styles.searchGlass} intensity={theme.isDark ? 15 : 8}>
        <View
          style={[
            styles.searchBarContainer,
            isFocused && styles.searchBarFocused,
          ]}
        >
          <AppIcon name="search" size={18} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search expenses, trips, or merchants..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <AppIcon
                name="x-circle"
                size={16}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
      </GlassCard>

      <View style={styles.filtersSection}>
        <PremiumSegmentedControl
          options={EXPENSE_FILTERS}
          selectedKey={filterType}
          onChange={setFilterType}
          theme={theme}
          styles={styles}
        />

        <View style={styles.groupingSection}>
          <Text
            style={[styles.groupingLabel, { color: theme.colors.textTertiary }]}
          >
            GROUP BY
          </Text>
          <PremiumSegmentedControl
            options={EXPENSE_GROUPINGS}
            selectedKey={groupBy}
            onChange={setGroupBy}
            isSmall
            theme={theme}
            styles={styles}
          />
        </View>
      </View>
    </Animated.View>
  );
}

import { TabBar, TabItem } from '../ui/TabBar';

function PremiumSegmentedControl({
  options,
  selectedKey,
  onChange,
  isSmall = false,
}: {
  options: any[];
  selectedKey: string;
  onChange: (key: string) => void;
  isSmall?: boolean;
  theme?: any;
  styles?: any;
}) {
  const tabs: TabItem[] = options.map(opt => ({
    key: opt.key,
    label: opt.label,
  }));

  return (
    <TabBar
      tabs={tabs}
      activeKey={selectedKey}
      onTabChange={onChange}
      variant="segmented"
      scrollable
      size={isSmall ? 'sm' : 'md'}
    />
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: 12,
      marginBottom: 8,
    },
    searchGlass: {
      padding: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.glass.borderTopColor,
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 10,
    },
    searchBarFocused: {
      backgroundColor: theme.colors.surface,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      padding: 0,
      outlineWidth: 0, // Web specific
    },
    filtersSection: {
      gap: 8,
    },
    groupingSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 2,
    },
    groupingLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    segmentedScroll: {
      gap: 8,
      paddingVertical: 4,
    },
    segmentBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 100,
      borderWidth: 1,
    },
    segmentBtnSmall: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    segmentBtnActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    segmentBtnInactive: {
      backgroundColor: 'transparent',
      borderColor: theme.glass.borderTopColor,
    },
    segmentBtnHovered: {
      backgroundColor: theme.colors.surface,
    },
    segmentIcon: {
      marginRight: 2,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
    },
    segmentTextSmall: {
      fontSize: 11,
    },
    segmentTextActive: {
      color: theme.colors.textInverse,
    },
    segmentTextInactive: {
      color: theme.colors.textSecondary,
    },
  });
