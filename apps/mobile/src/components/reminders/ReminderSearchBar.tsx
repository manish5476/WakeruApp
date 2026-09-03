// src/components/reminders/ReminderSearchBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import AppIcon from '../common/AppIcon';
import { useTheme } from '../../providers/ThemeProvider';

interface ReminderSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ReminderSearchBar({
  searchQuery,
  onSearchChange,
}: ReminderSearchBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight,
          },
        ]}
      >
        <AppIcon name="search" size={18} color={theme.colors.textTertiary} />
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary }]}
          placeholder="Search by trip, person, message..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <AppIcon
            name="x-circle"
            size={18}
            color={theme.colors.textTertiary}
            onPress={() => onSearchChange('')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
});
