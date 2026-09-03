// src/components/achievements/CategoryProgressGrid.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { CategoryStatUI } from './PresentationModels';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';

interface CategoryProgressGridProps {
  categories: CategoryStatUI[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryProgressGrid({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryProgressGridProps) {
  const theme = useTheme();

  if (!categories || categories.length === 0) return null;

  const allUnlocked = categories.reduce((s, c) => s + c.unlocked, 0);
  const allTotal = categories.reduce((s, c) => s + c.total, 0);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
        >
          Categories
        </Text>
        <Text style={[styles.sectionSub, { color: theme.colors.textTertiary }]}>
          Filter achievements by domain
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 'All' Tab Pill */}
        <Pressable
          onPress={() => {
            haptics.light();
            onSelectCategory(null);
          }}
          style={({ pressed, hovered }: any) => [
            styles.catPill,
            {
              backgroundColor: !selectedCategoryId
                ? theme.isDark
                  ? '#EA580C'
                  : '#EA580C'
                : theme.isDark
                  ? 'rgba(30, 41, 59, 0.8)'
                  : '#FFFFFF',
              borderColor: !selectedCategoryId
                ? '#EA580C'
                : theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
            },
            Platform.OS === 'web' &&
              hovered &&
              !selectedCategoryId && { opacity: 0.9 },
            pressed && { transform: [{ scale: 0.96 }] },
          ]}
        >
          <View
            style={[
              styles.iconBubble,
              {
                backgroundColor: !selectedCategoryId
                  ? 'rgba(255,255,255,0.2)'
                  : theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : '#F1F5F9',
              },
            ]}
          >
            <AppIcon
              name="award"
              size={14}
              color={
                !selectedCategoryId ? '#FFFFFF' : theme.colors.textSecondary
              }
            />
          </View>
          <View>
            <Text
              style={[
                styles.pillTitle,
                {
                  color: !selectedCategoryId
                    ? '#FFFFFF'
                    : theme.colors.textPrimary,
                },
              ]}
            >
              All Badges
            </Text>
            <Text
              style={[
                styles.pillCount,
                {
                  color: !selectedCategoryId
                    ? 'rgba(255,255,255,0.85)'
                    : theme.colors.textTertiary,
                },
              ]}
            >
              {allUnlocked}/{allTotal}
            </Text>
          </View>
        </Pressable>

        {/* Individual Categories */}
        {categories.map((cat, i) => {
          const isSelected = selectedCategoryId === cat.id;
          const isCompleted = cat.unlocked === cat.total && cat.total > 0;

          return (
            <Animated.View
              key={cat.id}
              entering={FadeInDown.delay(i * 40).duration(300)}
            >
              <Pressable
                onPress={() => {
                  haptics.light();
                  onSelectCategory(isSelected ? null : cat.id);
                }}
                style={({ pressed, hovered }: any) => [
                  styles.catPill,
                  {
                    backgroundColor: isSelected
                      ? '#EA580C'
                      : theme.isDark
                        ? 'rgba(30, 41, 59, 0.8)'
                        : '#FFFFFF',
                    borderColor: isSelected
                      ? '#EA580C'
                      : theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)',
                  },
                  Platform.OS === 'web' &&
                    hovered &&
                    !isSelected && { transform: [{ translateY: -2 }] },
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <View
                  style={[
                    styles.iconBubble,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255,255,255,0.2)'
                        : isCompleted
                          ? theme.isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : '#ECFDF5'
                          : theme.isDark
                            ? 'rgba(255,255,255,0.06)'
                            : '#F1F5F9',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
                </View>
                <View>
                  <Text
                    style={[
                      styles.pillTitle,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : theme.colors.textPrimary,
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                  <Text
                    style={[
                      styles.pillCount,
                      {
                        color: isSelected
                          ? 'rgba(255,255,255,0.85)'
                          : isCompleted
                            ? theme.colors.success
                            : theme.colors.textTertiary,
                      },
                    ]}
                  >
                    {isCompleted ? 'Done 🏆' : `${cat.unlocked}/${cat.total}`}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 10,
    paddingVertical: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    cursor: 'pointer',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      } as any,

      default: {
        shadowColor: '#000',

        shadowOffset: {
          width: 0,
          height: 4,
        },

        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  } as any,
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pillCount: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
});
