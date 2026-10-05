import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { BusinessCategory } from '../../types/local.types';

interface CategoryFilterBarProps {
  selectedCategory?: string;
  onSelectCategory: (category?: string) => void;
}

const CATEGORIES: { label: string; value?: BusinessCategory; icon: string }[] =
  [
    { label: 'All', value: undefined, icon: 'grid' },
    { label: 'Stays', value: 'STAY', icon: 'home' },
    { label: 'Dining', value: 'DINING', icon: 'utensils' },
    { label: 'Transport', value: 'TRANSPORT', icon: 'car' },
    { label: 'Rentals', value: 'RENTAL', icon: 'key' },
    { label: 'Activities', value: 'ACTIVITY', icon: 'compass' },
  ];

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterBarProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.value;
          return (
            <TouchableOpacity
              key={cat.label}
              activeOpacity={0.7}
              onPress={() => onSelectCategory(cat.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              <Typography
                variant="caption"
                weight={isSelected ? 'bold' : 'medium'}
                style={{
                  color: isSelected
                    ? theme.colors.textInverse
                    : theme.colors.textSecondary,
                }}
              >
                {cat.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});
