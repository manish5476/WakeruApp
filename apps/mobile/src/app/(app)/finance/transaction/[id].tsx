import GlobalLoader from '../../../../components/common/GlobalLoader';
import AppIcon from '../../../../components/common/AppIcon';
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  Linking,
  Alert,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInRight,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  Easing,
  withTiming,
} from 'react-native-reanimated';
import { Badge } from '../../../../components/ui/Badge';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useTransaction,
  useDeleteTransaction,
} from '../../../../hooks/useFinance';
import { useTheme } from '../../../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalBackground } from '../../../../components/ui/GlobalBackground';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { Typography } from '../../../../components/ui/Typography';
import { safeFormatCurrency } from '../../../../utils/formatters';
import { formatDate, formatTime } from '../../../../utils/formatters';

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  food: { icon: 'coffee', color: '#F59E0B' },
  stay: { icon: 'home', color: '#8B5CF6' },
  transport: { icon: 'truck', color: '#3B82F6' },
  activity: { icon: 'activity', color: '#EC4899' },
  shopping: { icon: 'shopping-bag', color: '#F97316' },
  health: { icon: 'heart', color: '#EF4444' },
  other: { icon: 'file-text', color: '#6B7280' },
  Transport: { icon: 'truck', color: '#3B82F6' },
  Food: { icon: 'coffee', color: '#F59E0B' },
  Shopping: { icon: 'shopping-bag', color: '#F97316' },
  Entertainment: { icon: 'film', color: '#EC4899' },
  Bills: { icon: 'file-text', color: '#6366F1' },
  Healthcare: { icon: 'heart', color: '#EF4444' },
  Education: { icon: 'book-open', color: '#14B8A6' },
  Rent: { icon: 'home', color: '#8B5CF6' },
  Travel: { icon: 'map', color: '#10B981' },
};

const getCategoryMeta = (category: string) =>
  CATEGORY_META[category] ||
  CATEGORY_META[category?.toLowerCase()] || {
    icon: 'shopping-bag',
    color: '#6B7280',
  };

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('');

const AVATAR_COLORS = [
  '#6366F1',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#3B82F6',
  '#EF4444',
];
const colorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const { data: tx, isLoading } = useTransaction(id);
  const { mutate: deleteTx, isPending: isDeleting } = useDeleteTransaction();

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTx(
              { id: id as string, permanent: true },
              { onSuccess: () => router.back() },
            );
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    router.push(`/(app)/finance/transaction/edit/${id}`);
  };

  const openInMaps = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  if (!tx) {
    return (
      <View style={styles.loadingContainer}>
        <Typography variant="body" color="textSecondary">
          Transaction not found.
        </Typography>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: theme.spacing[5] }}
        >
          <Typography variant="body" weight="semibold" color="primary">
            Go Back
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  const isExpense = tx.type === 'expense' || tx.type === 'trip_expense';
  const isTripExpense = tx.type === 'trip_expense';
  const meta = getCategoryMeta(tx.category);
  const coverImage = tx.tripId?.coverImage;

  const shareAmount = tx.myShare ?? tx.amount;
  const hasDifferentTotal =
    typeof tx.totalExpenseAmount === 'number' &&
    tx.totalExpenseAmount !== shareAmount;
  const splitNames: string[] = Array.isArray(tx.splitWith) ? tx.splitWith : [];
  const perPersonShare =
    hasDifferentTotal && splitNames.length > 0
      ? Math.round(tx.totalExpenseAmount / (splitNames.length + 1))
      : null;

  // Sub-components mapped to Theme
  const InfoRow = ({
    label,
    value,
    color = 'textPrimary',
  }: {
    label: string;
    value: string;
    color?: any;
  }) => (
    <View style={styles.infoRow}>
      <Typography variant="bodySm" color="textSecondary">
        {label}
      </Typography>
      <Typography
        variant="body"
        color={color}
        weight="medium"
        style={styles.infoValue}
      >
        {value}
      </Typography>
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Typography
      variant="overline"
      color="textTertiary"
      style={{
        marginLeft: theme.spacing[4],
        marginBottom: theme.spacing[2],
        marginTop: theme.spacing[6],
      }}
    >
      {title}
    </Typography>
  );

  const renderMobile = () => (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <GlobalBackground />
      </View>

      {/* Header - Simplified */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 20 : insets.top + 16,
            borderBottomColor: theme.colors.borderLight,
            backgroundColor: theme.isDark
              ? 'rgba(255,255,255,0.02)'
              : theme.colors.surface,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppIcon
            name="arrow-left"
            size={22}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <Typography variant="title" weight="bold">
          Details
        </Typography>
        <View style={styles.backBtn} /> {/* Balances Header */}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Transaction Summary Hero */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.heroIconWrapper,
              { backgroundColor: `${meta.color}15` },
            ]}
          >
            <AppIcon name={meta.icon} size={32} color={meta.color} />
          </View>
          <Typography
            variant="h3"
            weight="bold"
            color="textPrimary"
            align="center"
            style={{ marginTop: theme.spacing[4] }}
          >
            {tx.title || 'Untitled'}
          </Typography>
          <Typography
            variant="display"
            weight="black"
            color={isExpense ? 'textPrimary' : 'success'}
            align="center"
            style={{ marginVertical: theme.spacing[2] }}
          >
            {isExpense ? '−' : '+'}
            {safeFormatCurrency(shareAmount)}
          </Typography>

          {/* Status & Category Chips */}
          <View style={styles.heroPills}>
            <View
              style={[
                styles.heroPill,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: theme.colors.success },
                ]}
              />
              <Typography variant="caption" weight="medium">
                Completed
              </Typography>
            </View>
            <View
              style={[
                styles.heroPill,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <AppIcon name={meta.icon} size={12} color={meta.color} />
              <Typography
                variant="caption"
                weight="medium"
                style={{ textTransform: 'capitalize' }}
              >
                {tx.category}
              </Typography>
            </View>
          </View>
        </View>

        {/* 2. General Information */}
        <SectionHeader title="General" />
        <GlassCard style={styles.infoCard} intensity={theme.isDark ? 15 : 30}>
          <InfoRow label="Type" value={tx.type.replace('_', ' ')} />
          <View style={styles.divider} />
          <InfoRow
            label="Amount"
            value={`${isExpense ? '−' : '+'}${safeFormatCurrency(shareAmount)}`}
            color={isExpense ? 'textPrimary' : 'success'}
          />
          {tx.paymentMethod && (
            <>
              <View style={styles.divider} />
              <InfoRow label="Payment Method" value={tx.paymentMethod} />
            </>
          )}
        </GlassCard>

        {/* 3. Date & Time */}
        <SectionHeader title="Date & Time" />
        <GlassCard style={styles.infoCard} intensity={theme.isDark ? 15 : 30}>
          <InfoRow label="Date" value={formatDate(tx.date)} />
          <View style={styles.divider} />
          <InfoRow label="Time" value={formatTime(tx.date)} />
        </GlassCard>

        {/* 4. Split Details */}
        {(splitNames.length > 0 || hasDifferentTotal) && (
          <>
            <SectionHeader title="Split Breakdown" />
            <GlassCard
              style={styles.infoCard}
              intensity={theme.isDark ? 15 : 30}
            >
              <InfoRow
                label="Total Bill"
                value={safeFormatCurrency(tx.totalExpenseAmount ?? tx.amount)}
              />
              <View style={styles.divider} />
              <InfoRow
                label="Your Share"
                value={safeFormatCurrency(shareAmount)}
                color="primary"
              />

              {splitNames.length > 0 && (
                <View
                  style={{ marginTop: theme.spacing[4], gap: theme.spacing[3] }}
                >
                  {splitNames.map((name, idx) => (
                    <View
                      key={`${name}-${idx}`}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: colorForName(name) },
                        ]}
                      >
                        <Typography
                          variant="caption"
                          weight="bold"
                          color="textSecondary"
                        >
                          {initials(name)}
                        </Typography>
                      </View>
                      <Typography
                        variant="bodySm"
                        weight="medium"
                        style={{ flex: 1, marginLeft: theme.spacing[3] }}
                      >
                        {name}
                      </Typography>
                      {perPersonShare && (
                        <Typography variant="bodySm" color="textSecondary">
                          {safeFormatCurrency(perPersonShare)}
                        </Typography>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </>
        )}

        {/* 5. Related Trip / Entity */}
        {isTripExpense && (tx.tripName || tx.tripId) && (
          <>
            <SectionHeader title="Related Entity" />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (tx.tripId?._id || tx.tripId?.id) {
                  router.push(`/(app)/trips/${tx.tripId._id || tx.tripId.id}`);
                }
              }}
            >
              <GlassCard
                style={[styles.infoCard, { padding: 0, overflow: 'hidden' }]}
                intensity={theme.isDark ? 15 : 30}
              >
                {coverImage && (
                  <Image
                    source={{ uri: coverImage }}
                    style={{ width: '100%', height: 100 }}
                  />
                )}
                <View
                  style={{
                    padding: theme.spacing[4],
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[3],
                    }}
                  >
                    <View
                      style={[
                        styles.miniIconBg,
                        { backgroundColor: `${theme.colors.primary}20` },
                      ]}
                    >
                      <AppIcon
                        name="map"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View>
                      <Typography variant="caption" color="textSecondary">
                        Trip
                      </Typography>
                      <Typography variant="body" weight="semibold">
                        {tx.tripName || tx.tripId?.title || 'Trip'}
                      </Typography>
                    </View>
                  </View>
                  <AppIcon
                    name="chevron-right"
                    size={20}
                    color={theme.colors.textTertiary}
                  />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </>
        )}

        {/* 6. Location */}
        {tx.location?.latitude != null && tx.location?.longitude != null && (
          <>
            <SectionHeader title="Location" />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                openInMaps(tx.location.latitude, tx.location.longitude)
              }
            >
              <GlassCard
                style={[
                  styles.infoCard,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                ]}
                intensity={theme.isDark ? 15 : 30}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[3],
                  }}
                >
                  <View
                    style={[
                      styles.miniIconBg,
                      { backgroundColor: `${meta.color}20` },
                    ]}
                  >
                    <AppIcon name="map-pin" size={16} color={meta.color} />
                  </View>
                  <View>
                    <Typography variant="bodySm" weight="medium">
                      View on Map
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {tx.location.latitude.toFixed(4)},{' '}
                      {tx.location.longitude.toFixed(4)}
                    </Typography>
                  </View>
                </View>
                <AppIcon
                  name="external-link"
                  size={18}
                  color={theme.colors.textTertiary}
                />
              </GlassCard>
            </TouchableOpacity>
          </>
        )}

        {/* 7. Notes */}
        {!!tx.notes && (
          <>
            <SectionHeader title="Notes" />
            <GlassCard
              style={styles.infoCard}
              intensity={theme.isDark ? 15 : 30}
            >
              <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                <AppIcon
                  name="align-left"
                  size={18}
                  color={theme.colors.textTertiary}
                  style={{ marginTop: 2 }}
                />
                <Typography
                  variant="body"
                  color="textSecondary"
                  style={{ flex: 1, lineHeight: 22 }}
                >
                  "{tx.notes}"
                </Typography>
              </View>
            </GlassCard>
          </>
        )}

        {/* 8. Quick Actions */}
        <View style={{ marginTop: theme.spacing[8], gap: theme.spacing[3] }}>
          <TouchableOpacity onPress={handleEdit} activeOpacity={0.8}>
            <GlassCard
              style={styles.actionBtn}
              intensity={theme.isDark ? 20 : 40}
            >
              <AppIcon
                name="edit-2"
                size={18}
                color={theme.colors.textPrimary}
              />
              <Typography variant="body" weight="semibold">
                Edit Transaction
              </Typography>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            <GlassCard
              style={styles.actionBtn}
              intensity={theme.isDark ? 20 : 40}
            >
              <AppIcon name="trash-2" size={18} color={theme.colors.danger} />
              <Typography variant="body" weight="semibold" color="danger">
                Delete Transaction
              </Typography>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderDesktop = () => {
    // Desktop Layout
    return (
      <View style={styles.desktopContainer}>
        <View style={StyleSheet.absoluteFill}>
          <GlobalBackground />
        </View>

        {/* Top App Bar */}
        <View style={[styles.header, { paddingTop: 20, borderBottomWidth: 0 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <AppIcon
              name="arrow-left"
              size={22}
              color={theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <Typography variant="title" weight="bold">
            Transaction Details
          </Typography>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.desktopScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.desktopMaxWidth}>
            {/* Transaction Hero */}
            <Animated.View entering={FadeInDown.duration(400).springify()}>
              <GlassCard
                style={styles.desktopHeroCard}
                intensity={theme.isDark ? 20 : 40}
              >
                <View style={styles.heroHeaderRow}>
                  <View
                    style={[
                      styles.desktopHeroIcon,
                      { backgroundColor: `${meta.color}15` },
                    ]}
                  >
                    <AppIcon name={meta.icon} size={36} color={meta.color} />
                  </View>
                  <View style={styles.heroTitleCol}>
                    <Typography variant="h3" weight="bold" color="textPrimary">
                      {tx.title || 'Untitled'}
                    </Typography>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        marginTop: 4,
                      }}
                    >
                      <Badge label="Completed" variant="success" />
                      <Badge
                        label={tx.category}
                        style={{ backgroundColor: `${meta.color}20` }}
                      />
                      {tx.tripName && (
                        <Typography variant="caption" color="textSecondary">
                          • {tx.tripName}
                        </Typography>
                      )}
                    </View>
                    <Typography
                      variant="caption"
                      color="textTertiary"
                      style={{ marginTop: 4 }}
                    >
                      {formatDate(tx.date)} at {formatTime(tx.date)}
                    </Typography>
                  </View>

                  <View style={styles.heroAmountCol}>
                    <Typography
                      variant="display"
                      weight="black"
                      color={isExpense ? 'textPrimary' : 'success'}
                    >
                      {isExpense ? '−' : '+'}
                      {safeFormatCurrency(shareAmount)}
                    </Typography>
                  </View>
                </View>

                <View style={styles.heroQuickActions}>
                  <Pressable style={styles.heroActionBtn} onPress={handleEdit}>
                    <AppIcon
                      name="edit-2"
                      size={16}
                      color={theme.colors.textPrimary}
                    />
                    <Typography variant="bodySm" weight="medium">
                      Edit
                    </Typography>
                  </Pressable>
                  <Pressable style={styles.heroActionBtn}>
                    <AppIcon
                      name="copy"
                      size={16}
                      color={theme.colors.textPrimary}
                    />
                    <Typography variant="bodySm" weight="medium">
                      Duplicate
                    </Typography>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.heroActionBtn,
                      { borderColor: `${theme.colors.danger}30` },
                    ]}
                    onPress={handleDelete}
                  >
                    <AppIcon
                      name="trash-2"
                      size={16}
                      color={theme.colors.danger}
                    />
                    <Typography variant="bodySm" weight="medium" color="danger">
                      Delete
                    </Typography>
                  </Pressable>
                </View>
              </GlassCard>
            </Animated.View>

            {/* 2 Column Layout */}
            <View style={styles.desktopTwoColumn}>
              {/* LEFT COLUMN (70%) */}
              <View style={styles.desktopLeftCol}>
                <Animated.View
                  entering={FadeInDown.delay(100).duration(400).springify()}
                >
                  <Typography
                    variant="h3"
                    weight="bold"
                    style={styles.sectionTitle}
                  >
                    General Information
                  </Typography>
                  <GlassCard
                    style={styles.desktopInfoCard}
                    intensity={theme.isDark ? 15 : 30}
                  >
                    <View style={styles.infoGrid}>
                      <View style={styles.infoGridItem}>
                        <AppIcon
                          name="tag"
                          size={16}
                          color={theme.colors.textTertiary}
                        />
                        <View style={{ marginLeft: 12 }}>
                          <Typography variant="caption" color="textSecondary">
                            Type
                          </Typography>
                          <Typography
                            variant="body"
                            weight="semibold"
                            style={{ textTransform: 'capitalize' }}
                          >
                            {tx.type.replace('_', ' ')}
                          </Typography>
                        </View>
                      </View>
                      <View style={styles.infoGridItem}>
                        <AppIcon
                          name="credit-card"
                          size={16}
                          color={theme.colors.textTertiary}
                        />
                        <View style={{ marginLeft: 12 }}>
                          <Typography variant="caption" color="textSecondary">
                            Payment Method
                          </Typography>
                          <Typography variant="body" weight="semibold">
                            {tx.paymentMethod || 'Other'}
                          </Typography>
                        </View>
                      </View>
                      <View style={styles.infoGridItem}>
                        <AppIcon
                          name="dollar-sign"
                          size={16}
                          color={theme.colors.textTertiary}
                        />
                        <View style={{ marginLeft: 12 }}>
                          <Typography variant="caption" color="textSecondary">
                            Currency
                          </Typography>
                          <Typography variant="body" weight="semibold">
                            INR
                          </Typography>
                        </View>
                      </View>
                      <View style={styles.infoGridItem}>
                        <AppIcon
                          name="user"
                          size={16}
                          color={theme.colors.textTertiary}
                        />
                        <View style={{ marginLeft: 12 }}>
                          <Typography variant="caption" color="textSecondary">
                            Added By
                          </Typography>
                          <Typography variant="body" weight="semibold">
                            {tx.paidByName || 'Me'}
                          </Typography>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>

                {splitNames.length > 0 && (
                  <Animated.View
                    entering={FadeInDown.delay(200).duration(400).springify()}
                  >
                    <Typography
                      variant="h3"
                      weight="bold"
                      style={styles.sectionTitle}
                    >
                      Split Breakdown
                    </Typography>
                    <GlassCard
                      style={styles.desktopInfoCard}
                      intensity={theme.isDark ? 15 : 30}
                    >
                      <View style={{ gap: 16 }}>
                        {splitNames.map((name, idx) => (
                          <View key={`${name}-${idx}`}>
                            <View style={styles.splitUserRow}>
                              <View style={styles.splitUserLeft}>
                                <View
                                  style={[
                                    styles.avatarLg,
                                    { backgroundColor: colorForName(name) },
                                  ]}
                                >
                                  <Typography
                                    variant="body"
                                    weight="bold"
                                    color="textSecondary"
                                  >
                                    {initials(name)}
                                  </Typography>
                                </View>
                                <Typography
                                  variant="body"
                                  weight="semibold"
                                  style={{ marginLeft: 12 }}
                                >
                                  {name}
                                </Typography>
                              </View>
                              <View style={styles.splitUserRight}>
                                <View
                                  style={{
                                    alignItems: 'flex-end',
                                    marginRight: 16,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                  >
                                    Share
                                  </Typography>
                                  <Typography variant="body" weight="bold">
                                    {safeFormatCurrency(
                                      perPersonShare || shareAmount,
                                    )}
                                  </Typography>
                                </View>
                                <Badge
                                  label={idx === 0 ? 'Paid' : 'Pending'}
                                  variant={idx === 0 ? 'success' : 'warning'}
                                />
                              </View>
                            </View>
                            {/* Progress bar */}
                            <View style={styles.progressBarBg}>
                              <View
                                style={[
                                  styles.progressBarFill,
                                  {
                                    backgroundColor:
                                      idx === 0
                                        ? theme.colors.success
                                        : theme.colors.warning,
                                    width: idx === 0 ? '100%' : '30%',
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        ))}
                      </View>
                    </GlassCard>
                  </Animated.View>
                )}

                {!!tx.notes && (
                  <Animated.View
                    entering={FadeInDown.delay(300).duration(400).springify()}
                  >
                    <Typography
                      variant="h3"
                      weight="bold"
                      style={styles.sectionTitle}
                    >
                      Notes
                    </Typography>
                    <GlassCard
                      style={styles.desktopInfoCard}
                      intensity={theme.isDark ? 15 : 30}
                    >
                      <View style={{ flexDirection: 'row', gap: 16 }}>
                        <AppIcon
                          name="align-left"
                          size={20}
                          color={theme.colors.textTertiary}
                          style={{ marginTop: 2 }}
                        />
                        <Typography
                          variant="body"
                          color="textSecondary"
                          style={{ flex: 1, lineHeight: 24, fontSize: 16 }}
                        >
                          {tx.notes}
                        </Typography>
                      </View>
                    </GlassCard>
                  </Animated.View>
                )}
              </View>

              {/* RIGHT COLUMN (30%) - Sticky Sidebar */}
              <View style={styles.desktopRightCol}>
                <Animated.View
                  entering={FadeInRight.delay(200).duration(400).springify()}
                >
                  <GlassCard
                    style={styles.sidebarCard}
                    intensity={theme.isDark ? 15 : 30}
                  >
                    <Typography
                      variant="body"
                      weight="bold"
                      style={{ marginBottom: 16 }}
                    >
                      Summary
                    </Typography>

                    <InfoRow
                      label="Amount"
                      value={safeFormatCurrency(shareAmount)}
                      color={isExpense ? 'textPrimary' : 'success'}
                    />
                    <View style={styles.sidebarDivider} />
                    <InfoRow label="Status" value="Completed" color="success" />
                    <View style={styles.sidebarDivider} />
                    <InfoRow label="Category" value={tx.category} />

                    {tx.tripName && (
                      <>
                        <View style={styles.sidebarDivider} />
                        <InfoRow label="Trip" value={tx.tripName} />
                      </>
                    )}

                    <View style={styles.sidebarDivider} />
                    <InfoRow label="Paid By" value={tx.paidByName || 'Me'} />
                    <View style={styles.sidebarDivider} />
                    <InfoRow label="Split" value={tx.splitMethod || 'Equal'} />
                    <View style={styles.sidebarDivider} />
                    <InfoRow
                      label="Members"
                      value={splitNames.length.toString()}
                    />
                  </GlassCard>
                </Animated.View>

                {/* Map */}
                {tx.location?.latitude != null &&
                  tx.location?.longitude != null && (
                    <Animated.View
                      entering={FadeInRight.delay(300)
                        .duration(400)
                        .springify()}
                      style={{ marginTop: 24 }}
                    >
                      <Typography
                        variant="body"
                        weight="bold"
                        style={{ marginBottom: 12 }}
                      >
                        Location
                      </Typography>
                      <GlassCard
                        style={[
                          styles.sidebarCard,
                          { padding: 0, overflow: 'hidden' },
                        ]}
                        intensity={theme.isDark ? 15 : 30}
                      >
                        <View style={styles.mapPlaceholder}>
                          <AppIcon
                            name="map"
                            size={32}
                            color={theme.colors.textTertiary}
                          />
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            style={{ marginTop: 8 }}
                          >
                            Interactive Map Preview
                          </Typography>
                        </View>
                        <Pressable
                          style={styles.mapActionBtn}
                          onPress={() =>
                            openInMaps(
                              tx.location.latitude,
                              tx.location.longitude,
                            )
                          }
                        >
                          <Typography
                            variant="bodySm"
                            weight="semibold"
                            color="primary"
                          >
                            Open in Google Maps
                          </Typography>
                          <AppIcon
                            name="external-link"
                            size={16}
                            color={theme.colors.primary}
                          />
                        </Pressable>
                      </GlassCard>
                    </Animated.View>
                  )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  return isDesktop ? renderDesktop() : renderMobile();
}

const styles = StyleSheet.create({
  // Desktop Layout
  desktopContainer: { flex: 1 },
  desktopScrollContent: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  desktopMaxWidth: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  desktopHeroCard: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  desktopHeroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  heroTitleCol: {
    flex: 1,
  },
  heroAmountCol: {
    alignItems: 'flex-end',
  },
  heroQuickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(150,150,150,0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  desktopTwoColumn: {
    flexDirection: 'row',
    gap: 32,
  },
  desktopLeftCol: {
    flex: 7,
    gap: 32,
  },
  desktopRightCol: {
    flex: 3,
    // sticky-like behavior relies on scroll structure or absolute positioning, but usually just a static column in React Native ScrollView
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 8,
  },
  desktopInfoCard: {
    borderRadius: 20,
    padding: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  infoGridItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  splitUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitUserRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(150,150,150,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sidebarCard: {
    borderRadius: 20,
    padding: 24,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.1)',
    marginVertical: 12,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: 'rgba(150,150,150,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
  },

  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },

  content: { padding: 20 },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Standard Cards
  infoCard: {
    borderRadius: 20,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoValue: {
    maxWidth: '65%',
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.15)',
    marginVertical: 10,
  },

  // Misc
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Actions
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
});
