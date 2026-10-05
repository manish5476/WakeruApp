import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Pressable,
  PressableStateCallbackType,
  TextInput,
  Alert,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { format, formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../../providers/ThemeProvider';
import { haptics } from '../../../utils/haptics';
import { feedbackApi, IFeedbackItem } from '../../../services/api/feedback.api';

import AppIcon from '../../../components/common/AppIcon';
import GlobalLoader from '../../../components/common/GlobalLoader';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Typography } from '../../../components/ui/Typography';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';

type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: string; colorVariant: any }
> = {
  bug: { label: 'Bug', icon: 'bug', colorVariant: 'danger' },
  feature: {
    label: 'Feature Request',
    icon: 'lightbulb',
    colorVariant: 'primary',
  },
  suggestion: {
    label: 'Suggestion',
    icon: 'lightbulb',
    colorVariant: 'primary',
  },
  love: { label: 'Love', icon: 'heart', colorVariant: 'success' },
  performance: { label: 'Performance', icon: 'zap', colorVariant: 'warning' },
  design: { label: 'Design', icon: 'palette', colorVariant: 'accent' },
  other: { label: 'Other', icon: 'message-square', colorVariant: 'neutral' },
};

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => {
  const theme = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconWrap,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <AppIcon name="inbox" size={48} color={theme.colors.primary} />
      </View>
      <Typography variant="h3" weight="bold" style={styles.emptyTitle}>
        No feedback found
      </Typography>
      <Typography
        variant="body"
        color="textSecondary"
        align="center"
        style={styles.emptyDesc}
      >
        Try adjusting your filters or check back later for new user feedback.
      </Typography>
      <Pressable
        style={({ hovered }: WebPressableState) => [
          styles.refreshBtn,
          { backgroundColor: theme.colors.primary },
          Platform.OS === 'web' &&
            hovered &&
            ({ opacity: 0.9, cursor: 'pointer' } as any),
        ]}
        onPress={onRefresh}
      >
        <AppIcon name="refresh-cw" size={18} color="#FFF" />
        <Typography variant="body" weight="semibold" style={{ color: '#FFF' }}>
          Refresh Dashboard
        </Typography>
      </Pressable>
    </View>
  );
};

const ReviewCard = React.memo(
  ({
    item,
    onPress,
  }: {
    item: IFeedbackItem;
    onPress: (id: string) => void;
  }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);

    const categoryInfo =
      CATEGORY_MAP[item.category?.toLowerCase()] || CATEGORY_MAP.other;
    const relativeTime = formatDistanceToNow(new Date(item.createdAt), {
      addSuffix: true,
    });

    // Fallbacks for device info
    const platform = item.deviceInfo?.platform || 'unknown';
    const screenSize = item.deviceInfo?.screenSize || 'N/A';
    const version = item.deviceInfo?.version || 'N/A';

    const PlatformIcon =
      platform.toLowerCase() === 'web'
        ? 'globe'
        : platform.toLowerCase() === 'ios'
          ? 'apple'
          : 'smartphone';

    return (
      <GlassCard intensity={theme.isDark ? 10 : 20} style={styles.reviewCard}>
        <Pressable
          onPress={() => onPress(item._id)}
          style={({ hovered }: WebPressableState) => [
            styles.reviewCardInner,
            Platform.OS === 'web' &&
              hovered &&
              ({ opacity: 0.9, cursor: 'pointer' } as any),
          ]}
        >
          <View style={styles.reviewHeader}>
            <View style={styles.reviewerInfo}>
              <Avatar
                fallback={(item.displayName || 'Anonymous')
                  .charAt(0)
                  .toUpperCase()}
                size="md"
                style={styles.avatar}
              />
              <View>
                <Typography variant="body" weight="bold">
                  {item.displayName || 'Anonymous User'}
                </Typography>
                <Typography variant="caption" color="textTertiary">
                  {relativeTime}
                </Typography>
              </View>
            </View>
            <Badge
              label={categoryInfo.label}
              variant={categoryInfo.colorVariant as any}
            />
          </View>

          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <AppIcon
                key={i}
                name="star"
                size={16}
                color={
                  i < item.rating
                    ? theme.colors.warning
                    : theme.colors.borderLight
                }
                fill={i < item.rating ? theme.colors.warning : 'transparent'}
              />
            ))}
            <Typography
              variant="caption"
              color="textSecondary"
              style={styles.exactDate}
            >
              {format(new Date(item.createdAt), 'MMM d, yyyy • h:mm a')}
            </Typography>
          </View>

          <View style={styles.feedbackContainer}>
            <Typography
              variant="body"
              color="textPrimary"
              numberOfLines={expanded ? undefined : 4}
              style={styles.feedbackText}
            >
              {item.feedback}
            </Typography>
            {item.feedback.length > 150 && (
              <Pressable onPress={() => setExpanded(!expanded)} hitSlop={8}>
                <Typography
                  variant="bodySm"
                  color="primary"
                  weight="semibold"
                  style={styles.readMore}
                >
                  {expanded ? 'Show Less' : 'Read More'}
                </Typography>
              </Pressable>
            )}
          </View>

          {item.images && item.images.length > 0 && (
            <View style={styles.imageGrid}>
              {item.images.map((img, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <Image
                    source={{ uri: img }}
                    style={styles.attachedImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          )}

          <View style={styles.deviceInfoContainer}>
            <View style={styles.deviceChip}>
              <AppIcon
                name={PlatformIcon}
                size={14}
                color={theme.colors.textSecondary}
              />
              <Typography variant="caption" color="textSecondary">
                {platform}
              </Typography>
            </View>
            <View style={styles.deviceChip}>
              <AppIcon
                name="monitor"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Typography variant="caption" color="textSecondary">
                {screenSize}
              </Typography>
            </View>
            <View style={styles.deviceChip}>
              <AppIcon
                name="info"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Typography variant="caption" color="textSecondary">
                v{version}
              </Typography>
            </View>
          </View>
        </Pressable>
      </GlassCard>
    );
  },
);

export default function AdminFeedbackDashboard() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [feedbacks, setFeedbacks] = useState<IFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [ratingFilter, setRatingFilter] = useState<string>('All');
  const [hasImagesFilter, setHasImagesFilter] = useState<boolean>(false);

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const isDesktop = width > 1024;

  const fetchFeedbacks = async (showLoading = true) => {
    if (!isAuthorized) return;
    if (showLoading) setIsLoading(true);
    try {
      const response = await feedbackApi.list();
      if (response.success && response.data?.feedbacks) {
        setFeedbacks(response.data.feedbacks);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchFeedbacks();
    }
  }, [isAuthorized]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    haptics.light();
    fetchFeedbacks(false);
  }, [isAuthorized]);

  const handlePasswordSubmit = () => {
    if (passwordInput === 'ms@201426') {
      setIsAuthorized(true);
      haptics.success();
    } else {
      Alert.alert('Access Denied', 'Incorrect password.');
      haptics.error();
    }
  };

  // Calculate Summary Stats
  const stats = useMemo(() => {
    if (feedbacks.length === 0)
      return { average: 0, total: 0, breakdowns: [0, 0, 0, 0, 0] };
    const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    const breakdowns = [0, 0, 0, 0, 0]; // 1 star to 5 star
    feedbacks.forEach(f => {
      if (f.rating >= 1 && f.rating <= 5) breakdowns[f.rating - 1]++;
    });
    return {
      average: parseFloat((sum / feedbacks.length).toFixed(1)),
      total: feedbacks.length,
      breakdowns,
    };
  }, [feedbacks]);

  // Apply Filter Logics
  const filteredFeedbacks = useMemo(() => {
    return feedbacks
      .filter(f => {
        let matchesCategory = true;
        if (categoryFilter !== 'All') {
          const mapCat = categoryFilter.toLowerCase();
          const fCat = f.category?.toLowerCase();
          matchesCategory =
            (mapCat === 'bug' && fCat === 'bug') ||
            (mapCat === 'idea' &&
              (fCat === 'suggestion' || fCat === 'feature')) ||
            (mapCat === 'love' && fCat === 'love') ||
            (mapCat === 'other' &&
              !['bug', 'suggestion', 'feature', 'love'].includes(fCat));
        }

        const matchesRating =
          ratingFilter === 'All' || f.rating.toString() === ratingFilter;
        const matchesImages =
          !hasImagesFilter || (f.images && f.images.length > 0);

        return matchesCategory && matchesRating && matchesImages;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [feedbacks, categoryFilter, ratingFilter, hasImagesFilter]);

  const navigateToDetail = useCallback(
    (id: string) => {
      const item = feedbacks.find(f => f._id === id);
      if (item) {
        router.push({
          pathname: '/(app)/profile/review-detail',
          params: { data: JSON.stringify(item) },
        });
      }
    },
    [feedbacks],
  );

  if (!isAuthorized) {
    return (
      <GlobalBackground>
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
          <View style={styles.secretContainer}>
            <View style={styles.secretIconWrap}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={styles.secretIconGradient}
              >
                <AppIcon name="lock" size={28} color="#FFF" />
              </LinearGradient>
            </View>
            <Typography
              variant="h3"
              weight="bold"
              align="center"
              style={{ marginBottom: 8 }}
            >
              Admin Access
            </Typography>
            <Typography
              variant="body"
              color="textSecondary"
              align="center"
              style={{ marginBottom: 32 }}
            >
              Enter passcode to view feedback
            </Typography>

            <View
              style={[
                styles.secretInputContainer,
                {
                  borderColor: theme.colors.borderLight,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <AppIcon
                name="key"
                size={18}
                color={theme.colors.textTertiary}
                style={styles.secretInputIcon}
              />
              <TextInput
                style={[
                  styles.secretInput,
                  { color: theme.colors.textPrimary },
                ]}
                placeholder="Passcode"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry
                value={passwordInput}
                onChangeText={setPasswordInput}
                autoCapitalize="none"
                onSubmitEditing={handlePasswordSubmit}
              />
            </View>
            <Pressable
              style={[
                styles.secretBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handlePasswordSubmit}
            >
              <AppIcon name="unlock" size={18} color="#FFF" />
              <Typography
                variant="body"
                weight="semibold"
                style={{ color: '#FFF', marginLeft: 8 }}
              >
                Unlock
              </Typography>
            </Pressable>
          </View>
        </View>
      </GlobalBackground>
    );
  }

  const renderSummarySidebar = () => (
    <View style={styles.sidebarContainer}>
      <Typography variant="title" weight="bold" style={styles.sidebarTitle}>
        Analytics Overview
      </Typography>

      <GlassCard style={styles.statsCard} intensity={theme.isDark ? 10 : 20}>
        <View style={styles.avgContainer}>
          <Typography
            variant="display"
            weight="black"
            style={{ color: theme.colors.textPrimary }}
          >
            {stats.average}
          </Typography>
          <View style={styles.avgRight}>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <AppIcon
                  key={i}
                  name="star"
                  size={14}
                  color={
                    i < Math.round(stats.average)
                      ? theme.colors.warning
                      : theme.colors.borderLight
                  }
                  fill={
                    i < Math.round(stats.average)
                      ? theme.colors.warning
                      : 'transparent'
                  }
                />
              ))}
            </View>
            <Typography variant="caption" color="textSecondary">
              {stats.total} Reviews
            </Typography>
          </View>
        </View>

        <View style={styles.breakdownContainer}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = stats.breakdowns[star - 1];
            const percentage =
              stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <View key={star} style={styles.breakdownRow}>
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ width: 12 }}
                >
                  {star}
                </Typography>
                <AppIcon
                  name="star"
                  size={10}
                  color={theme.colors.textSecondary}
                  style={{ marginHorizontal: 4 }}
                />
                <View
                  style={[
                    styles.barBg,
                    { backgroundColor: theme.colors.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor:
                          star >= 4
                            ? theme.colors.success
                            : star === 3
                              ? theme.colors.warning
                              : theme.colors.danger,
                      },
                    ]}
                  />
                </View>
                <Typography
                  variant="caption"
                  color="textTertiary"
                  style={{ width: 28, textAlign: 'right' }}
                >
                  {Math.round(percentage)}%
                </Typography>
              </View>
            );
          })}
        </View>
      </GlassCard>

      <Typography
        variant="title"
        weight="bold"
        style={[styles.sidebarTitle, { marginTop: 24 }]}
      >
        Filters
      </Typography>

      <View style={styles.filterGroup}>
        <Typography
          variant="caption"
          color="textSecondary"
          weight="semibold"
          style={styles.filterLabel}
        >
          CATEGORY
        </Typography>
        <SegmentedControl
          options={['All', 'Bug', 'Idea', 'Love', 'Other']}
          selectedValue={categoryFilter}
          onChange={setCategoryFilter}
        />
      </View>

      <View style={styles.filterGroup}>
        <Typography
          variant="caption"
          color="textSecondary"
          weight="semibold"
          style={styles.filterLabel}
        >
          RATING
        </Typography>
        <SegmentedControl
          options={['All', '5', '4', '3', '2', '1']}
          selectedValue={ratingFilter}
          onChange={setRatingFilter}
        />
      </View>

      <View style={styles.filterGroupRow}>
        <Typography variant="caption" color="textSecondary" weight="semibold">
          WITH IMAGES ONLY
        </Typography>
        <Pressable
          onPress={() => setHasImagesFilter(!hasImagesFilter)}
          style={[
            styles.checkbox,
            hasImagesFilter && {
              backgroundColor: theme.colors.primary,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          {hasImagesFilter && <AppIcon name="check" size={14} color="#FFF" />}
        </Pressable>
      </View>
    </View>
  );

  return (
    <GlobalBackground>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === 'web' ? 0 : insets.top },
        ]}
      >
        {/* Sticky Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.borderLight,
              paddingTop: Platform.OS === 'web' ? theme.spacing['4'] : 16,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ hovered }: WebPressableState) => [
              styles.headerBtn,
              Platform.OS === 'web' &&
                hovered &&
                ({ opacity: 0.7, cursor: 'pointer' } as any),
            ]}
          >
            <AppIcon
              name="arrow-left"
              size={24}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Typography variant="h3" weight="bold">
              Feedback
            </Typography>
            <Badge
              label={`${filteredFeedbacks.length} found`}
              variant="neutral"
              style={{ marginLeft: 8 }}
            />
          </View>
          <Pressable
            onPress={onRefresh}
            style={({ hovered }: WebPressableState) => [
              styles.headerBtn,
              Platform.OS === 'web' &&
                hovered &&
                ({ opacity: 0.7, cursor: 'pointer' } as any),
            ]}
          >
            <AppIcon
              name="refresh-cw"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        </View>

        {isLoading && feedbacks.length === 0 ? (
          <GlobalLoader />
        ) : (
          <View
            style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}
          >
            {/* Desktop Sidebar */}
            {isDesktop && renderSummarySidebar()}

            <View style={styles.listContainer}>
              {/* Mobile/Tablet Inline Filters */}
              {!isDesktop && (
                <View style={styles.mobileFiltersWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.mobileFiltersScroll}
                  >
                    <SegmentedControl
                      options={['All', 'Bug', 'Idea', 'Love', 'Other']}
                      selectedValue={categoryFilter}
                      onChange={setCategoryFilter}
                    />
                    <View style={{ width: 16 }} />
                    <SegmentedControl
                      options={['All', '5', '4', '3', '2', '1']}
                      selectedValue={ratingFilter}
                      onChange={setRatingFilter}
                    />
                    <View style={{ width: 16 }} />
                    <Pressable
                      onPress={() => setHasImagesFilter(!hasImagesFilter)}
                      style={[
                        styles.imageFilterBtn,
                        hasImagesFilter && {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <AppIcon
                        name="image"
                        size={14}
                        color={
                          hasImagesFilter ? '#FFF' : theme.colors.textSecondary
                        }
                      />
                      <Typography
                        variant="caption"
                        color={
                          hasImagesFilter ? 'textInverse' : 'textSecondary'
                        }
                        weight="semibold"
                      >
                        Images
                      </Typography>
                    </Pressable>
                  </ScrollView>
                </View>
              )}

              {filteredFeedbacks.length === 0 ? (
                <EmptyState onRefresh={onRefresh} />
              ) : (
                <FlashList
                  data={filteredFeedbacks}
                  keyExtractor={(item: any) => item._id}
                  renderItem={({ item }: { item: any }) => (
                    <ReviewCard item={item} onPress={navigateToDetail} />
                  )}
                  contentContainerStyle={[
                    styles.flashListContent,
                    isDesktop && styles.flashListDesktop,
                  ]}
                  numColumns={isDesktop ? 2 : 1}
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </GlobalBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  sidebarContainer: {
    width: 320,
    padding: 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(150, 150, 150, 0.1)',
  },
  sidebarTitle: {
    marginBottom: 16,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  avgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avgRight: {
    marginLeft: 16,
  },
  breakdownContainer: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterLabel: {
    marginBottom: 12,
    letterSpacing: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(150, 150, 150, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  mobileFiltersWrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  mobileFiltersScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  imageFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
    gap: 6,
  },
  flashListContent: {
    padding: 16,
    paddingBottom: 40,
  },
  flashListDesktop: {
    padding: 24,
  },
  reviewCard: {
    marginBottom: 16,
    marginHorizontal: Platform.OS === 'web' && window.innerWidth > 1024 ? 8 : 0, // margin for grid
    borderRadius: 16,
    overflow: 'hidden',
  },
  reviewCardInner: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exactDate: {
    marginLeft: 12,
  },
  feedbackContainer: {
    marginBottom: 16,
  },
  feedbackText: {
    lineHeight: 22,
  },
  readMore: {
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  attachedImage: {
    width: '100%',
    height: '100%',
  },
  deviceInfoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
  },
  deviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyDesc: {
    marginBottom: 24,
    maxWidth: 300,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  secretContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  secretIconWrap: {
    marginBottom: 24,
  },
  secretIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secretInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    width: '100%',
    marginBottom: 24,
  },
  secretInputIcon: {
    marginRight: 12,
  },
  secretInput: {
    flex: 1,
    fontSize: 16,
  },
  secretBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    borderRadius: 12,
  },
});
