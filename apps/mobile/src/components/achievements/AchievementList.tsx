// src/components/achievements/AchievementList.tsx

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { AchievementUI } from './PresentationModels';
import { AchievementRow } from './AchievementRow';

interface AchievementListProps {
  achievements: AchievementUI[];
  selectedCategory: string | null;
}

export function AchievementList({
  achievements,
  selectedCategory,
}: AchievementListProps) {
  const theme = useTheme();

  const filteredAchievements = useMemo(() => {
    if (!selectedCategory) return achievements;
    return achievements.filter(a => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const renderItem: ListRenderItem<AchievementUI> = ({ item, index }) => {
    return <AchievementRow achievement={item} index={index} />;
  };

  if (filteredAchievements.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyEmoji, { opacity: 0.5 }]}>🌱</Text>
        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
          No achievements yet
        </Text>
        <Text
          style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}
        >
          Keep using the app and invite friends to unlock your first badge!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        {selectedCategory
          ? `${selectedCategory
              .split('_')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')} Achievements`
          : 'All Achievements'}
      </Text>

      <View style={styles.listContainer}>
        <FlatList
          data={filteredAchievements}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400, // Important for FlatList when inside ScrollView or nesting
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    paddingHorizontal: 24,
    letterSpacing: -0.5,
  },
  listContainer: {
    flex: 1,
    minHeight: 400,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '80%',
  },
});
