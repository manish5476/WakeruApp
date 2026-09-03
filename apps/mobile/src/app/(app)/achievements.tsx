// src/app/(app)/achievements.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  FlatList,
  ListRenderItem,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { achievementsApi } from '../../services/api';
import { useTheme } from '../../providers/ThemeProvider';
import { GlobalBackground } from '../../components/ui/GlobalBackground';
import GlobalLoader from '../../components/common/GlobalLoader';
import AppIcon from '../../components/common/AppIcon';
import { haptics } from '../../utils/haptics';

import {
  mapAchievementsData,
  AchievementUI,
} from '../../components/achievements/PresentationModels';
import { AchievementsHero } from '../../components/achievements/AchievementsHero';
import { CategoryProgressGrid } from '../../components/achievements/CategoryProgressGrid';
import { RecentUnlocksCarousel } from '../../components/achievements/RecentUnlocksCarousel';
import { MilestoneCards } from '../../components/achievements/MilestoneCards';
import { AchievementRow } from '../../components/achievements/AchievementRow';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Theme } from '../../theme';

export default function AchievementsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 860;
  const styles = useMemo(
    () => createStyles(theme, isDesktop),
    [theme, isDesktop],
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementsApi.getAchievements(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptics.light();
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Extract and map data
  const mappedData = useMemo(() => {
    if (!response?.data) return null;
    return mapAchievementsData(
      response.data.achievements || [],
      response.data.stats || {},
    );
  }, [response]);

  const filteredAchievements = useMemo(() => {
    if (!mappedData) return [];
    let list = mappedData.allAchievements;
    if (selectedCategory) {
      list = list.filter(a => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [mappedData, selectedCategory, searchQuery]);

  const renderItem: ListRenderItem<AchievementUI> = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 20)
        .springify()
        .damping(18)}
      layout={Layout.springify()}
      style={styles.cardCol}
    >
      <AchievementRow achievement={item} index={index} />
    </Animated.View>
  );

  // ── LOADING ──────────────────────────────────────
  if (isLoading || !mappedData) {
    return (
      <GlobalBackground>
        <View style={styles.centerContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Polishing your trophies & badges…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  // ── ERROR ────────────────────────────────────────
  if (error) {
    return (
      <GlobalBackground>
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.errorIconWrap,
              { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
            ]}
          >
            <AppIcon name="alert-triangle" size={32} color="#EF4444" />
          </View>
          <Text style={[styles.errorText, { color: theme.colors.textPrimary }]}>
            Failed to Load Achievements
          </Text>
          <Text style={[styles.errorSub, { color: theme.colors.textTertiary }]}>
            Check your network connection and try again.
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
          >
            <AppIcon name="refresh-cw" size={14} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      </GlobalBackground>
    );
  }

  // ── LIST HEADER (Hero, Categories, Recent, Milestones, Search) ──
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Hero Rank Section */}
      <AchievementsHero hero={mappedData.hero} />

      {/* Category Filter Tabs */}
      <CategoryProgressGrid
        categories={mappedData.categories}
        selectedCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Recent Unlocks (if viewing all) */}
      {!selectedCategory &&
        !searchQuery &&
        mappedData.recentUnlocks.length > 0 && (
          <RecentUnlocksCarousel unlocks={mappedData.recentUnlocks} />
        )}

      {/* Next Milestones (if viewing all) */}
      {!selectedCategory &&
        !searchQuery &&
        mappedData.nextMilestones.length > 0 && (
          <MilestoneCards milestones={mappedData.nextMilestones} />
        )}

      {/* Bento Search & Section Header */}
      <View
        style={[
          styles.searchBentoCard,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.sectionTitleRow}>
          <View style={styles.titleGroup}>
            <View
              style={[
                styles.titleIconAura,
                { backgroundColor: 'rgba(234, 88, 12, 0.15)' },
              ]}
            >
              <AppIcon name="award" size={16} color="#EA580C" />
            </View>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
            >
              {selectedCategory
                ? `${selectedCategory
                    .split('_')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')} Badges`
                : 'All Badges'}
            </Text>
          </View>

          <View
            style={[
              styles.countCapsule,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(15,23,42,0.05)',
              },
            ]}
          >
            <Text
              style={[styles.countText, { color: theme.colors.textSecondary }]}
            >
              {filteredAchievements.length} Total
            </Text>
          </View>
        </View>

        {/* Search Field */}
        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(15,23,42,0.05)',
            },
          ]}
        >
          <AppIcon name="search" size={15} color={theme.colors.textTertiary} />
          <TextInput
            placeholder="Search by badge name or description..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <AppIcon name="x" size={14} color={theme.colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Sticky Navigation Bar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: Platform.OS === 'web' ? 18 : insets.top + 10 },
        ]}
      >
        <View style={styles.topBarInner}>
          <View style={styles.topBarLeft}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: theme.colors.surface },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={8}
            >
              <AppIcon
                name="arrow-left"
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>

            <View>
              <Text
                style={[styles.navTitle, { color: theme.colors.textPrimary }]}
              >
                Trophy Room
              </Text>
              <Text
                style={[styles.navSub, { color: theme.colors.textTertiary }]}
              >
                Milestones, ranks & expedition XP
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.xpPill,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(234, 88, 12, 0.18)'
                  : '#FFF7ED',
                borderColor: 'rgba(234, 88, 12, 0.3)',
              },
            ]}
          >
            <AppIcon name="sparkles" size={13} color="#EA580C" />
            <Text style={styles.xpPillText}>
              {mappedData.hero.totalPoints} XP
            </Text>
          </View>
        </View>
      </View>

      {/* Main List & Grid Content */}
      <View style={styles.mainWrapper}>
        <FlatList
          data={filteredAchievements}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          key={isDesktop ? 'desktop-grid-2' : 'mobile-list-1'}
          numColumns={isDesktop ? 2 : 1}
          columnWrapperStyle={
            isDesktop ? styles.desktopColumnWrapper : undefined
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="🎯"
                title={
                  searchQuery ? 'No Matching Badges' : 'No Badges Unlocked'
                }
                description={
                  searchQuery
                    ? `No badges match "${searchQuery}". Try a different search term.`
                    : 'Track trips, split expenses, and settle balances to earn your first badge!'
                }
              />
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
        />
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

function createStyles(theme: Theme, isDesktop: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    topBar: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
      zIndex: 10,
    },
    topBarInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
    },
    topBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',
    },
    navTitle: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    navSub: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 1,
    },
    xpPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
    },
    xpPillText: {
      fontSize: 12,
      fontWeight: '900',
      color: '#EA580C',
      letterSpacing: 0.2,
    },

    // Main Wrapper
    mainWrapper: {
      flex: 1,
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
    },
    listContent: {
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    desktopColumnWrapper: {
      gap: 12,
    },
    cardCol: {
      flex: 1,
    },
    headerContainer: {
      gap: 16,
      marginBottom: 14,
    },

    // Bento Search & Section Header Card
    searchBentoCard: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.05)',

      ...Platform.select({
        web: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
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

      gap: 12,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    titleIconAura: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    countCapsule: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    countText: {
      fontSize: 11,
      fontWeight: '800',
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      borderWidth: 1,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      padding: 0,
    },

    // Empty & Loader
    emptyWrap: {
      paddingTop: 30,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      padding: 32,
    },
    loadingText: {
      fontSize: 13,
      fontWeight: '600',
    },
    errorIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    errorText: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    errorSub: {
      fontSize: 12,
      textAlign: 'center',
      maxWidth: 280,
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      marginTop: 6,
    },
    retryBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
  });
}
