import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Typography } from '../../ui/Typography';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { useTheme } from '../../../providers/ThemeProvider';
import AppIcon from '../../common/AppIcon';

const SHEET_HEIGHT_RATIO = 0.85;
const SHEET_DRAG_THRESHOLD = 150;
const DRAWER_WIDTH = 400;

// Native (iOS/Android) always bottom-sheet.
// Web/PWA: phone-width (<768px) -> sheet, wider -> side drawer.
function getIsMobile(w: number): boolean {
  if (Platform.OS !== 'web') return true;
  return w < 768;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatusBadge({
  isSettled,
  isPaid,
}: {
  isSettled: boolean;
  isPaid?: boolean;
  theme: any;
}) {
  let variant: 'success' | 'warning' | 'neutral' = 'neutral';
  let label = 'Pending';
  if (isSettled) {
    variant = 'success';
    label = 'Settled';
  } else if (isPaid) {
    variant = 'success';
    label = 'Paid';
  } else {
    variant = 'warning';
    label = 'Pending';
  }
  return <Badge label={label} variant={variant} />;
}

function SplitMemberRow({
  split,
  isMe,
  theme,
}: {
  split: any;
  isMe: boolean;
  theme: any;
}) {
  const amount = split.amountLocal || 0;
  const isPaid = split.isPaid;
  const statusLabel = isPaid ? 'Paid' : isMe ? 'You owe' : 'Pending';
  const statusVariant = isPaid ? 'success' : isMe ? 'danger' : 'warning';

  return (
    <View
      style={[
        splitStyles(theme).row,
        { borderBottomColor: theme.colors.borderLight },
      ]}
    >
      <Avatar
        url={split.user?.photoURL || undefined}
        fallback={(split.displayName || '?').charAt(0).toUpperCase()}
        size="sm"
      />
      <View style={splitStyles(theme).info}>
        <View style={splitStyles(theme).nameLine}>
          <Typography variant="bodySm" weight="semibold" color="textPrimary">
            {isMe ? 'You' : split.displayName}
          </Typography>
          <Typography
            variant="bodySm"
            weight="bold"
            color="textPrimary"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              minimumFractionDigits: 0,
            }).format(
              parseFloat(String(amount).replace(/[^0-9.-]+/g, '')) || 0,
            )}
          </Typography>
        </View>
        <Badge label={statusLabel} variant={statusVariant as any} />
      </View>
    </View>
  );
}

// ============================================================
// MAIN MODAL
// ============================================================

export interface ExpenseDetailsModalProps {
  expense: any | null;
  onClose: () => void;
}

export function ExpenseDetailsModal({
  expense,
  onClose,
}: ExpenseDetailsModalProps) {
  const theme = useTheme();

  // Reactive dimensions
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const SHEET_HEIGHT = windowHeight * SHEET_HEIGHT_RATIO;

  // Platform-safe isMobile
  const isMobile = getIsMobile(windowWidth);
  const isNativeMobile = Platform.OS !== 'web';

  // Shared values
  const translateY = useSharedValue(windowHeight);
  const translateX = useSharedValue(DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const isClosing = useSharedValue(false);

  useEffect(() => {
    if (expense) {
      if (isMobile) {
        translateY.value = withSpring(0, { stiffness: 300, damping: 30 });
      } else {
        translateX.value = withSpring(0, { stiffness: 300, damping: 30 });
      }
      backdropOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [expense, isMobile]);

  const closeSheet = useCallback(() => {
    if (isClosing.value) return;
    isClosing.value = true;
    backdropOpacity.value = withTiming(0, { duration: 200 });
    if (isMobile) {
      translateY.value = withSpring(
        SHEET_HEIGHT,
        { stiffness: 300, damping: 30 },
        () => {
          runOnJS(onClose)();
          isClosing.value = false;
        },
      );
    } else {
      translateX.value = withSpring(
        DRAWER_WIDTH,
        { stiffness: 300, damping: 30 },
        () => {
          runOnJS(onClose)();
          isClosing.value = false;
        },
      );
    }
  }, [onClose, isMobile, SHEET_HEIGHT]);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      if (isMobile) {
        if (e.translationY > 0) translateY.value = e.translationY;
      } else {
        if (e.translationX > 0) translateX.value = e.translationX;
      }
    })
    .onEnd(e => {
      if (isMobile) {
        if (e.translationY > SHEET_DRAG_THRESHOLD || e.velocityY > 500) {
          runOnJS(closeSheet)();
        } else {
          translateY.value = withSpring(0, { stiffness: 300, damping: 30 });
        }
      } else {
        if (e.translationX > SHEET_DRAG_THRESHOLD || e.velocityX > 500) {
          runOnJS(closeSheet)();
        } else {
          translateX.value = withSpring(0, { stiffness: 300, damping: 30 });
        }
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: isMobile
      ? [{ translateY: translateY.value }]
      : [{ translateX: translateX.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!expense) return null;

  const yourShare =
    expense.splits?.find((s: any) => s.userId === expense.paidBy)
      ?.amountLocal || 0;
  const isYouPayer = expense.paidBy === expense.currentUserId;

  return (
    <Modal
      visible={!!expense}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
    >
      {/* Animated backdrop */}
      <Animated.View style={[sheetStyles.backdrop, backdropAnimatedStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      {/* Height injected inline using reactive SHEET_HEIGHT */}
      <Animated.View
        style={[
          isMobile
            ? { ...sheetStyles.sheetMobile, height: SHEET_HEIGHT }
            : sheetStyles.sheetWeb,
          sheetAnimatedStyle,
        ]}
      >
        <View
          style={[
            isMobile ? sheetStyles.sheetSolidMobile : sheetStyles.sheetSolidWeb,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderLight,
            },
            theme.shadows.xl,
          ]}
        >
          {/* Web/PWA-desktop: plain close button, no GestureDetector */}
          {!isMobile && (
            <View style={sheetStyles.webHeaderPadding}>
              <Pressable
                onPress={closeSheet}
                style={sheetStyles.webCloseBtn}
                hitSlop={12}
              >
                <AppIcon
                  name="x"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>
          )}

          {/* GestureDetector only on NATIVE */}
          {isMobile && isNativeMobile && (
            <GestureDetector gesture={panGesture}>
              <View style={sheetStyles.dragHandleContainer}>
                <View
                  style={[
                    sheetStyles.dragHandle,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              </View>
            </GestureDetector>
          )}

          {/* Mobile PWA: tap handle to close */}
          {isMobile && !isNativeMobile && (
            <Pressable
              onPress={closeSheet}
              style={sheetStyles.dragHandleContainer}
            >
              <View
                style={[
                  sheetStyles.dragHandle,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </Pressable>
          )}

          <ScrollView
            style={{ flex: 1, minHeight: 0 }}
            showsVerticalScrollIndicator={false}
            bounces={isNativeMobile}
            scrollEventThrottle={16}
            contentContainerStyle={sheetStyles.sheetContent}
          >
            {/* Header */}
            <View style={sheetStyles.sheetHeader}>
              <View
                style={[
                  sheetStyles.sheetCategoryIcon,
                  {
                    backgroundColor: theme.colors.primaryBg,
                    borderColor: theme.colors.borderLight,
                  },
                ]}
              >
                <Typography variant="h2">📄</Typography>
              </View>
              <View style={sheetStyles.sheetHeaderText}>
                <Typography variant="h3" weight="extrabold" color="textPrimary">
                  {expense.title || 'Expense'}
                </Typography>
                <Typography variant="bodySm" color="textTertiary">
                  {expense.tripId?.title || 'General'} · {expense.category}
                </Typography>
              </View>
              <StatusBadge
                isSettled={expense.isSettled}
                isPaid={expense.yourShare?.isPaid}
                theme={theme}
              />
            </View>

            {/* Amount */}
            <View style={sheetStyles.sheetAmountSection}>
              <Typography
                variant="display"
                weight="black"
                color="textPrimary"
                style={{ letterSpacing: -1.5 }}
              >
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: expense.localCurrency || 'INR',
                  minimumFractionDigits: 0,
                }).format(
                  parseFloat(
                    String(expense.amountLocal).replace(/[^0-9.-]+/g, ''),
                  ) || 0,
                )}
              </Typography>
            </View>

            {/* Payment Summary */}
            <View style={sheetStyles.section}>
              <Typography
                variant="overline"
                color="textTertiary"
                style={{ marginBottom: 12 }}
              >
                PAYMENT SUMMARY
              </Typography>
              <View
                style={[
                  sheetStyles.summaryCard,
                  {
                    backgroundColor: theme.colors.primaryBg,
                    borderColor: theme.colors.borderLight,
                  },
                ]}
              >
                <View style={sheetStyles.summaryRow}>
                  <Typography
                    variant="bodySm"
                    weight="semibold"
                    color="textTertiary"
                  >
                    Paid by
                  </Typography>
                  <View style={sheetStyles.summaryPayer}>
                    <Avatar
                      url={expense.payer?.photoURL || undefined}
                      fallback={(
                        expense.payer?.displayName ||
                        expense.paidByName ||
                        '?'
                      )
                        .charAt(0)
                        .toUpperCase()}
                      size="sm"
                    />
                    <Typography
                      variant="body"
                      weight="bold"
                      color="textPrimary"
                    >
                      {expense.payer?.displayName ||
                        expense.paidByName ||
                        'Unknown'}
                    </Typography>
                  </View>
                </View>
                {!isYouPayer && (
                  <View
                    style={[
                      sheetStyles.summaryRow,
                      sheetStyles.summaryRowBorder,
                      { borderTopColor: theme.colors.borderLight },
                    ]}
                  >
                    <Typography
                      variant="bodySm"
                      weight="semibold"
                      color="textTertiary"
                    >
                      Your share
                    </Typography>
                    <Typography
                      variant="body"
                      weight="bold"
                      color={expense.yourShare?.isPaid ? 'success' : 'danger'}
                    >
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: expense.localCurrency || 'INR',
                        minimumFractionDigits: 0,
                      }).format(
                        parseFloat(
                          String(yourShare).replace(/[^0-9.-]+/g, ''),
                        ) || 0,
                      )}
                    </Typography>
                  </View>
                )}
              </View>
            </View>

            {/* Split Breakdown */}
            <View style={sheetStyles.section}>
              <Typography
                variant="overline"
                color="textTertiary"
                style={{ marginBottom: 12 }}
              >
                SPLIT BREAKDOWN · {expense.splits?.length || 0}
              </Typography>
              <View
                style={[
                  sheetStyles.splitCard,
                  {
                    backgroundColor: theme.colors.primaryBg,
                    borderColor: theme.colors.borderLight,
                  },
                ]}
              >
                {(expense.splits || []).map((split: any, idx: number) => {
                  const isMe = split.userId === expense.currentUserId;
                  return (
                    <SplitMemberRow
                      key={split.userId ?? idx}
                      split={split}
                      isMe={isMe}
                      theme={theme}
                    />
                  );
                })}
              </View>
            </View>

            {/* Details */}
            <View style={sheetStyles.section}>
              <Typography
                variant="overline"
                color="textTertiary"
                style={{ marginBottom: 12 }}
              >
                DETAILS
              </Typography>
              <View style={sheetStyles.detailsGrid}>
                <View
                  style={[
                    sheetStyles.detailMiniCard,
                    {
                      backgroundColor: theme.colors.primaryBg,
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                >
                  <AppIcon
                    name="calendar"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color="textTertiary"
                    style={{ textTransform: 'uppercase' }}
                  >
                    Date
                  </Typography>
                  <Typography variant="body" weight="bold" color="textPrimary">
                    {expense.date
                      ? new Date(expense.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Unknown'}
                  </Typography>
                </View>
                <View
                  style={[
                    sheetStyles.detailMiniCard,
                    {
                      backgroundColor: theme.colors.primaryBg,
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                >
                  <AppIcon
                    name="users"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color="textTertiary"
                    style={{ textTransform: 'uppercase' }}
                  >
                    People
                  </Typography>
                  <Typography variant="body" weight="bold" color="textPrimary">
                    {expense.splits?.length || 0}
                  </Typography>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={sheetStyles.section}>
              <Typography
                variant="overline"
                color="textTertiary"
                style={{ marginBottom: 12 }}
              >
                ACTIONS
              </Typography>
              <View style={sheetStyles.actionsContainer}>
                <Pressable
                  style={({ pressed }) => [
                    { flex: 1 },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => {
                    router.push(
                      `/(app)/trips/${expense.tripId}/edit-expense?expenseId=${expense._id}`,
                    );
                    closeSheet();
                  }}
                >
                  <View
                    style={[
                      sheetStyles.actionButton,
                      {
                        backgroundColor: theme.colors.primaryBg,
                        borderColor: theme.colors.borderLight,
                      },
                    ]}
                  >
                    <AppIcon
                      name="edit-3"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                    <Typography
                      variant="bodySm"
                      weight="semibold"
                      color="textSecondary"
                    >
                      Edit
                    </Typography>
                  </View>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    { flex: 1 },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => {
                    router.push(`/(app)/trips/${expense.tripId}/map`);
                    closeSheet();
                  }}
                >
                  <View
                    style={[
                      sheetStyles.actionButton,
                      {
                        backgroundColor: theme.colors.primaryBg,
                        borderColor: theme.colors.borderLight,
                      },
                    ]}
                  >
                    <AppIcon
                      name="map"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                    <Typography
                      variant="bodySm"
                      weight="semibold"
                      color="textSecondary"
                    >
                      View Map
                    </Typography>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ============================================================
// STYLES
// ============================================================

const sheetStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetMobile: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheetWeb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: DRAWER_WIDTH,
  },
  sheetSolidMobile: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  sheetSolidWeb: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  webHeaderPadding: {
    width: '100%',
    alignItems: 'flex-end',
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 8,
  },
  webCloseBtn: { padding: 4 },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  dragHandle: { width: 40, height: 4, borderRadius: 2, opacity: 0.6 },
  sheetContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  sheetCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  sheetHeaderText: { flex: 1 },
  sheetAmountSection: { alignItems: 'center', marginBottom: 32 },
  section: { marginBottom: 28 },
  summaryCard: { borderRadius: 20, padding: 16, borderWidth: 1 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryRowBorder: { borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  summaryPayer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  splitCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
  },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailMiniCard: {
    flex: 1,
    minWidth: 100,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  actionsContainer: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
});

function splitStyles(theme: any) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    info: { flex: 1, gap: 6, marginLeft: 12 },
    nameLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
}
