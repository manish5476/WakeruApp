import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Image,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { useTheme } from '../../../providers/ThemeProvider';
import { IFeedbackItem } from '../../../services/api/feedback.api';

import AppIcon from '../../../components/common/AppIcon';
import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Typography } from '../../../components/ui/Typography';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';

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

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

const getSentiment = (rating: number, category: string) => {
  if (rating >= 4 || category === 'love')
    return { label: 'Loved it', emoji: '😍', color: 'success' };
  if (rating === 3) return { label: 'Neutral', emoji: '😐', color: 'warning' };
  if (rating < 3 || category === 'bug')
    return { label: 'Needs Attention', emoji: '😞', color: 'danger' };
  return { label: 'Positive', emoji: '😊', color: 'primary' };
};

export default function ReviewDetailScreen() {
  const { data } = useLocalSearchParams();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isDesktop = width > 1024;

  let item: IFeedbackItem | null = null;
  try {
    if (typeof data === 'string') {
      item = JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to parse feedback data', e);
  }

  if (!item) {
    return (
      <GlobalBackground>
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <Typography variant="body" color="textSecondary">
            Failed to load feedback details.
          </Typography>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </View>
      </GlobalBackground>
    );
  }

  const categoryInfo =
    CATEGORY_MAP[item.category?.toLowerCase()] || CATEGORY_MAP['other'];
  const platform = item.deviceInfo?.platform || 'Unknown';
  const screenSize = item.deviceInfo?.screenSize || 'Unknown';
  const version = item.deviceInfo?.version || 'Unknown';
  const PlatformIcon =
    platform.toLowerCase() === 'web'
      ? 'globe'
      : platform.toLowerCase() === 'ios'
        ? 'apple'
        : 'smartphone';
  const sentiment = getSentiment(item.rating || 5, item.category || 'other');

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          paddingTop:
            Platform.OS === 'web' ? theme.spacing['4'] : insets.top + 10,
        },
      ]}
    >
      <View style={styles.headerLeft}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          leftIcon={
            <AppIcon
              name="arrow-left"
              size={20}
              color={theme.colors.textPrimary}
            />
          }
          title="Back"
          style={styles.backBtn}
        />
        <Typography variant="h3" weight="bold">
          Review Details
        </Typography>
      </View>
      <View style={styles.headerRight}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {}}
          leftIcon={
            <AppIcon
              name="more-horizontal"
              size={20}
              color={theme.colors.textPrimary}
            />
          }
          title=""
        />
      </View>
    </View>
  );

  const renderProfileHero = () => (
    <GlassCard intensity={theme.isDark ? 10 : 20} style={styles.heroCard}>
      <View style={styles.heroTopRow}>
        <View style={styles.userInfo}>
          <Avatar
            fallback={(item!.displayName || 'Anonymous')
              .charAt(0)
              .toUpperCase()}
            size={'md'}
            style={styles.avatar}
          />
          <View>
            <View style={styles.userNameRow}>
              <Typography variant="title" weight="bold">
                {item!.displayName || 'Anonymous User'}
              </Typography>
              <AppIcon
                name="badge-check"
                size={16}
                color={theme.colors.primary}
                style={{ marginLeft: 4 }}
              />
            </View>
            <Typography variant="bodySm" color="textSecondary">
              ID: {item!.userId || 'Anonymous'}
            </Typography>
          </View>
        </View>
        <View style={styles.sentimentBadge}>
          <Typography variant="body" style={{ marginRight: 4 }}>
            {sentiment.emoji}
          </Typography>
          <Typography
            variant="caption"
            weight="bold"
            color={sentiment.color as any}
          >
            {sentiment.label}
          </Typography>
        </View>
      </View>
      <View style={styles.heroBottomRow}>
        <View style={styles.ratingStars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <AppIcon
              key={i}
              name="star"
              size={18}
              color={
                i < item!.rating
                  ? theme.colors.warning
                  : theme.colors.borderLight
              }
              fill={i < item!.rating ? theme.colors.warning : 'transparent'}
            />
          ))}
        </View>
        <Typography variant="bodySm" color="textSecondary">
          {getRelativeTime(item!.createdAt)}
        </Typography>
      </View>
    </GlassCard>
  );

  const renderFeedbackSection = () => (
    <View style={styles.section}>
      <Typography variant="title" weight="bold" style={styles.sectionTitle}>
        User Feedback
      </Typography>
      <GlassCard intensity={theme.isDark ? 15 : 25} style={styles.feedbackCard}>
        <View style={styles.feedbackIconWrap}>
          <AppIcon
            name="quote"
            size={24}
            color={theme.colors.primary}
            style={{ opacity: 0.5 }}
          />
        </View>
        <Typography variant="body" style={styles.feedbackText}>
          {item!.feedback || 'No written feedback provided.'}
        </Typography>
      </GlassCard>
    </View>
  );

  const renderScreenshotsGallery = () => {
    if (!item!.images || item!.images.length === 0) return null;
    return (
      <View style={styles.section}>
        <Typography variant="title" weight="bold" style={styles.sectionTitle}>
          Screenshots
        </Typography>
        <View style={styles.galleryGrid}>
          {item!.images.map((img, idx) => (
            <Pressable
              key={idx}
              onPress={() => setSelectedImage(img)}
              style={styles.galleryItem}
            >
              <Image source={{ uri: img }} style={styles.galleryImage} />
              <View style={styles.galleryOverlay}>
                <AppIcon name="maximize-2" size={20} color="#FFF" />
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderDeviceInformation = () => (
    <View style={styles.section}>
      <Typography variant="title" weight="bold" style={styles.sectionTitle}>
        Device Information
      </Typography>
      <GlassCard intensity={theme.isDark ? 10 : 20} style={styles.contextCard}>
        <View style={styles.infoRow}>
          <AppIcon
            name={PlatformIcon as any}
            size={16}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <View style={styles.infoContent}>
            <Typography variant="caption" color="textTertiary">
              Platform
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              {platform}
            </Typography>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <AppIcon
            name="info"
            size={16}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <View style={styles.infoContent}>
            <Typography variant="caption" color="textTertiary">
              App Version
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              v{version}
            </Typography>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <AppIcon
            name="monitor"
            size={16}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <View style={styles.infoContent}>
            <Typography variant="caption" color="textTertiary">
              Screen Size
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              {screenSize}
            </Typography>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <AppIcon
            name="map-pin"
            size={16}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <View style={styles.infoContent}>
            <Typography variant="caption" color="textTertiary">
              Location
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              Unknown (Not provided)
            </Typography>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <AppIcon
            name="globe"
            size={16}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <View style={styles.infoContent}>
            <Typography variant="caption" color="textTertiary">
              IP Address
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              Unknown (Not provided)
            </Typography>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderReviewMetadata = () => (
    <View style={styles.section}>
      <Typography variant="title" weight="bold" style={styles.sectionTitle}>
        Metadata
      </Typography>
      <GlassCard intensity={theme.isDark ? 10 : 20} style={styles.contextCard}>
        <View style={styles.infoRow}>
          <AppIcon
            name="hash"
            size={16}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <View style={styles.infoContent}>
            <Typography variant="caption" color="textTertiary">
              Review ID
            </Typography>
            <Typography
              variant="bodySm"
              weight="semibold"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {item!._id}
            </Typography>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <AppIcon
            name="tag"
            size={16}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <View style={styles.infoContent}>
            <Typography variant="caption" color="textTertiary">
              Category
            </Typography>
            <View style={{ alignSelf: 'flex-start', marginTop: 2 }}>
              <Badge
                label={categoryInfo.label}
                variant={categoryInfo.colorVariant as any}
              />
            </View>
          </View>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <AppIcon
            name="calendar"
            size={16}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <View style={styles.infoContent}>
            <Typography variant="caption" color="textTertiary">
              Submitted
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              {format(new Date(item!.createdAt), 'MMM d, yyyy, h:mm a')}
            </Typography>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderStickyActions = () => (
    <GlassCard intensity={theme.isDark ? 20 : 30} style={styles.actionBar}>
      <Button
        variant="primary"
        title="Reply to User"
        leftIcon={<AppIcon name="reply" size={18} color="#FFF" />}
        style={styles.actionBtn}
        onPress={() => {}}
        fullWidth={!isDesktop}
      />
      <Button
        variant="outline"
        title="Mark Resolved"
        leftIcon={
          <AppIcon
            name="check-circle"
            size={18}
            color={theme.colors.textPrimary}
          />
        }
        style={styles.actionBtn}
        onPress={() => {}}
        fullWidth={!isDesktop}
      />
    </GlassCard>
  );

  const renderTimelinePlaceholder = () => (
    <View style={styles.section}>
      <Typography variant="title" weight="bold" style={styles.sectionTitle}>
        Timeline
      </Typography>
      <GlassCard intensity={theme.isDark ? 10 : 20} style={styles.timelineCard}>
        <View style={styles.timelineItem}>
          <View style={styles.timelineIconLine}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                styles.timelineLine,
                { backgroundColor: theme.colors.border },
              ]}
            />
          </View>
          <View style={styles.timelineContent}>
            <Typography variant="bodySm" weight="bold">
              Review Submitted
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {getRelativeTime(item!.createdAt)}
            </Typography>
          </View>
        </View>
        <View style={styles.timelineItem}>
          <View style={styles.timelineIconLine}>
            <View
              style={[
                styles.timelineDot,
                {
                  backgroundColor: theme.colors.border,
                  borderWidth: 2,
                  borderColor: theme.colors.surface,
                },
              ]}
            />
          </View>
          <View style={styles.timelineContent}>
            <Typography variant="bodySm" weight="semibold" color="textTertiary">
              Awaiting Developer Reply
            </Typography>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  return (
    <GlobalBackground>
      <View style={styles.container}>
        {renderHeader()}

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isDesktop ? (
            <View style={styles.desktopLayout}>
              <View style={styles.columnLeft}>
                {renderProfileHero()}
                {renderFeedbackSection()}
                {renderScreenshotsGallery()}
              </View>
              <View style={styles.columnRight}>
                {renderStickyActions()}
                {renderReviewMetadata()}
                {renderDeviceInformation()}
                {renderTimelinePlaceholder()}
              </View>
            </View>
          ) : (
            <View style={styles.mobileLayout}>
              {renderProfileHero()}
              {renderFeedbackSection()}
              {renderScreenshotsGallery()}
              {renderStickyActions()}
              {renderReviewMetadata()}
              {renderDeviceInformation()}
              {renderTimelinePlaceholder()}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Fullscreen Image Preview */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.lightboxContainer}>
          <Pressable
            style={styles.lightboxClose}
            onPress={() => setSelectedImage(null)}
          >
            <AppIcon name="x" size={28} color="#FFF" />
          </Pressable>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </GlobalBackground>
  );
}

const useStyles = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: 'transparent' },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing['4'],
          paddingBottom: theme.spacing['4'],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
          backgroundColor: theme.colors.surface,
          zIndex: 10,
          ...(Platform.OS === 'web'
            ? ({ position: 'sticky', top: 0 } as any)
            : {}),
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing['2'],
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        backBtn: {
          marginLeft: -8,
        },
        scrollContent: {
          padding: theme.spacing['4'],
          paddingBottom: 80,
        },
        scrollContentDesktop: {
          paddingVertical: theme.spacing['8'],
          paddingHorizontal: theme.spacing['6'],
          alignItems: 'center',
        },
        desktopLayout: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          width: '100%',
          maxWidth: 1200,
          gap: theme.spacing['8'],
        },
        columnLeft: {
          flex: 2,
          gap: theme.spacing['6'],
        },
        columnRight: {
          flex: 1,
          maxWidth: 400,
          gap: theme.spacing['6'],
        },
        mobileLayout: {
          gap: theme.spacing['6'],
        },
        section: {
          gap: theme.spacing['3'],
        },
        sectionTitle: {
          paddingHorizontal: 4,
        },
        heroCard: {
          padding: theme.spacing['5'],
          borderRadius: theme.borderRadius['2xl'],
        },
        heroTopRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing['4'],
        },
        userInfo: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        avatar: {
          marginRight: theme.spacing['4'],
        },
        userNameRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 2,
        },
        sentimentBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.03)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: theme.borderRadius.full,
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
        },
        heroBottomRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: theme.spacing['4'],
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
        },
        ratingStars: {
          flexDirection: 'row',
          gap: 4,
        },
        feedbackCard: {
          padding: theme.spacing['6'],
          paddingTop: theme.spacing['8'],
          borderRadius: theme.borderRadius['2xl'],
          position: 'relative',
        },
        feedbackIconWrap: {
          position: 'absolute',
          top: 16,
          left: 20,
        },
        feedbackText: {
          fontSize: 17,
          lineHeight: 28,
        },
        galleryGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing['4'],
        },
        galleryItem: {
          width: 160,
          height: 160,
          borderRadius: theme.borderRadius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.borderLight,
          position: 'relative',
          ...(Platform.OS === 'web'
            ? ({ cursor: 'pointer', transition: 'transform 0.2s ease' } as any)
            : {}),
        },
        galleryImage: {
          width: '100%',
          height: '100%',
        },
        galleryOverlay: {
          ...StyleSheet.absoluteFill,
          backgroundColor: 'rgba(0,0,0,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          ...(Platform.OS === 'web'
            ? ({ transition: 'opacity 0.2s ease' } as any)
            : {}),
        },
        contextCard: {
          padding: theme.spacing['4'],
          borderRadius: theme.borderRadius.xl,
        },
        infoRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing['2'],
        },
        infoIcon: {
          width: 24,
          marginRight: theme.spacing['3'],
          textAlign: 'center',
        },
        infoContent: {
          flex: 1,
          gap: 2,
        },
        infoDivider: {
          height: 1,
          backgroundColor: theme.colors.borderLight,
          marginVertical: theme.spacing['1'],
        },
        actionBar: {
          padding: theme.spacing['4'],
          borderRadius: theme.borderRadius.xl,
          gap: theme.spacing['3'],
          flexDirection:
            Platform.OS === 'web' && width > 1024 ? 'column' : 'row',
          flexWrap: 'wrap',
        },
        actionBtn: {
          flex: Platform.OS === 'web' && width > 1024 ? 0 : 1,
        },
        timelineCard: {
          padding: theme.spacing['5'],
          borderRadius: theme.borderRadius.xl,
        },
        timelineItem: {
          flexDirection: 'row',
          minHeight: 48,
        },
        timelineIconLine: {
          alignItems: 'center',
          width: 20,
          marginRight: theme.spacing['3'],
        },
        timelineDot: {
          width: 12,
          height: 12,
          borderRadius: 6,
          marginTop: 4,
        },
        timelineLine: {
          width: 2,
          flex: 1,
          marginVertical: 4,
        },
        timelineContent: {
          flex: 1,
          paddingBottom: theme.spacing['4'],
        },
        lightboxContainer: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.95)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        lightboxClose: {
          position: 'absolute',
          top: 40,
          right: 30,
          zIndex: 20,
          padding: 12,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 24,
        },
        lightboxImage: {
          width: '90%',
          height: '90%',
        },
      }),
    [theme, width],
  );
};
