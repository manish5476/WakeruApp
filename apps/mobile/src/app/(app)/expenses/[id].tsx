import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  useWindowDimensions,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../../providers/ThemeProvider';
import { useResponsive } from '../../../hooks/useResponsive';
import {
  useExpense,
  useArchiveExpense,
  useUnarchiveExpense,
  useDeleteExpensePermanent,
  useMarkSplitPaid,
  useAddComment,
  useDeleteComment,
} from '../../../hooks';
import { useAuthStore } from '../../../stores/auth.store';
import { haptics } from '../../../utils/haptics';
import { safeFormatCurrency } from '../../../utils/formatters';

import { GlobalBackground } from '../../../components/ui/GlobalBackground';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import GlobalLoader from '../../../components/common/GlobalLoader';
import AppIcon from '../../../components/common/AppIcon';
import type { Theme } from '../../../theme';
import type { IExpense } from '../../../types/expense.types';

interface Split {
  userId: string;
  displayName: string;
  amountLocal: number;
  isPaid: boolean;
  user?: { userId: string; displayName: string; photoURL?: string };
}

interface Comment {
  _id?: string;
  id?: string;
  userId: string;
  displayName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

const CATEGORY_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  food: { icon: 'utensils', color: '#F43F5E', label: 'Food & Dining' },
  stay: { icon: 'hotel', color: '#8B5CF6', label: 'Accommodation' },
  transport: { icon: 'car', color: '#06B6D4', label: 'Transportation' },
  activity: { icon: 'zap', color: '#F43F5E', label: 'Activities' },
  shopping: { icon: 'shopping-bag', color: '#F59E0B', label: 'Shopping' },
  health: { icon: 'heart-pulse', color: '#EF4444', label: 'Healthcare' },
  entertainment: { icon: 'film', color: '#8B5CF6', label: 'Entertainment' },
  bills: { icon: 'file-text', color: '#6366F1', label: 'Bills & Utilities' },
  education: { icon: 'book', color: '#14B8A6', label: 'Education' },
  rent: { icon: 'home', color: '#8B5CF6', label: 'Rent' },
  travel: { icon: 'plane', color: '#10B981', label: 'Travel' },
  income: { icon: 'banknote', color: '#10B981', label: 'Income' },
  other: { icon: 'tag', color: '#71717A', label: 'Other' },
};

export default function ExpenseDetailScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const isDesktop = width >= 860;

  const [commentText, setCommentText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const validId = id && id !== 'new' ? id : '';
  const { data: expense, isLoading, refetch } = useExpense(validId);
  const { mutate: archiveExpense, isPending: isArchiving } =
    useArchiveExpense();
  const { mutate: unarchiveExpense, isPending: isUnarchiving } =
    useUnarchiveExpense();
  const { mutate: deletePermanent, isPending: isDeleting } =
    useDeleteExpensePermanent();
  const { mutate: markPaid, isPending: isMarkingPaid } = useMarkSplitPaid();
  const { mutate: addComment, isPending: isAddingComment } = useAddComment();
  const { mutate: deleteComment } = useDeleteComment();

  const categoryConfig = useMemo(() => {
    const key = expense?.category?.toLowerCase() || 'other';
    return CATEGORY_CONFIG[key] || CATEGORY_CONFIG.other;
  }, [expense]);

  if (id === 'new') {
    return <Redirect href="/(app)/quick-actions" />;
  }

  const handleBack = () => {
    haptics.light();
    router.back();
  };

  const handleArchive = () => {
    haptics.warning();
    Alert.alert(
      'Archive Expense',
      'This expense will be moved to the archive and removed from active balances.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            archiveExpense(id, {
              onSuccess: () => {
                haptics.success();
                router.back();
              },
            });
          },
        },
      ],
    );
  };

  const handleUnarchive = () => {
    haptics.medium();
    Alert.alert(
      'Unarchive Expense',
      'This expense will be restored and its balances re-applied.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unarchive',
          onPress: () => {
            unarchiveExpense(id, {
              onSuccess: () => {
                haptics.success();
                refetch();
              },
            });
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    haptics.warning();
    Alert.alert(
      'Delete Permanently',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePermanent(id, {
              onSuccess: () => {
                haptics.success();
                router.back();
              },
            });
          },
        },
      ],
    );
  };

  const handleMarkPaid = (userId: string) => {
    haptics.medium();
    markPaid(
      { expenseId: id, userId },
      {
        onSuccess: (data?: { isFullySettled?: boolean }) => {
          haptics.success();
          if (data?.isFullySettled) {
            Alert.alert('All Settled!', 'This expense is now fully settled.');
          }
          refetch();
        },
      },
    );
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    haptics.light();
    addComment(
      { expenseId: id, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('');
          refetch();
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 300);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <GlobalBackground>
        <View style={styles.centerBox}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading expense details...
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  if (!expense) {
    return (
      <GlobalBackground>
        <View style={styles.centerBox}>
          <View style={styles.errorIconWrap}>
            <AppIcon name="alert-circle" size={44} color="#EF4444" />
          </View>
          <Text
            style={[styles.errorTitle, { color: theme.colors.textPrimary }]}
          >
            Expense Not Found
          </Text>
          <Text
            style={[styles.errorSub, { color: theme.colors.textSecondary }]}
          >
            The expense you're looking for doesn't exist or has been deleted.
          </Text>
          <Pressable onPress={handleBack} style={styles.errorBackBtn}>
            <Text style={styles.errorBackBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </GlobalBackground>
    );
  }

  const isForeign = expense.localCurrency !== expense.baseCurrency;
  const isArchived = expense.isArchived;
  const isSettled = expense.isSettled;
  const totalSplits = expense.splits?.length || 0;
  const paidSplits = expense.splits?.filter((s: Split) => s.isPaid).length || 0;
  const settlementProgress =
    totalSplits > 0 ? (paidSplits / totalSplits) * 100 : 0;
  const isPayer = expense.paidBy === user?._id;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlobalBackground />
      </View>

      {/* Top Navigation Bar */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 12 },
        ]}
      >
        <View
          style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}
        >
          <Pressable onPress={handleBack} style={styles.headerBtn} hitSlop={10}>
            <AppIcon
              name="arrow-left"
              size={20}
              color={theme.colors.textPrimary}
            />
          </Pressable>

          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          >
            Expense Details
          </Text>

          <View style={styles.headerActions}>
            {isArchived ? (
              <>
                <Pressable
                  onPress={handleUnarchive}
                  disabled={isUnarchiving}
                  style={styles.headerBtn}
                  hitSlop={8}
                >
                  <AppIcon
                    name="refresh-cw"
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={isDeleting}
                  style={styles.headerBtn}
                  hitSlop={8}
                >
                  <AppIcon name="trash-2" size={18} color="#EF4444" />
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={handleArchive}
                  disabled={isArchiving}
                  style={styles.headerBtn}
                  hitSlop={8}
                >
                  <AppIcon
                    name="archive"
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/expenses/edit/${id}`)}
                  style={styles.headerBtn}
                  hitSlop={8}
                >
                  <AppIcon
                    name="edit-2"
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  disabled={isDeleting}
                  style={styles.headerBtn}
                  hitSlop={8}
                >
                  <AppIcon name="trash-2" size={18} color="#EF4444" />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopScrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2-Column Bento Grid Container */}
        <View style={[styles.bentoContainer, !isDesktop && styles.stackLayout]}>
          {/* ======================================================== */}
          {/* LEFT COLUMN: Hero Overview + Split Distribution Matrix  */}
          {/* ======================================================== */}
          <View style={[styles.bentoColumn, isDesktop && { flex: 1.15 }]}>
            {/* Executive Amount Hero Card */}
            <LinearGradient
              colors={['#0F172A', '#1E1B4B', '#1E293B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <View
                  style={[
                    styles.categoryIconWrap,
                    { backgroundColor: `${categoryConfig.color}25` },
                  ]}
                >
                  <AppIcon
                    name={categoryConfig.icon}
                    size={22}
                    color={categoryConfig.color}
                  />
                </View>
                <View style={styles.heroBadgeRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: 'rgba(255,255,255,0.12)' },
                    ]}
                  >
                    <Text style={styles.categoryBadgeText}>
                      {categoryConfig.label}
                    </Text>
                  </View>
                  {isArchived ? (
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: 'rgba(113,113,122,0.3)' },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>Archived</Text>
                    </View>
                  ) : isSettled ? (
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: 'rgba(16,185,129,0.25)' },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: '#10B981' },
                        ]}
                      />
                      <Text
                        style={[styles.statusBadgeText, { color: '#10B981' }]}
                      >
                        Settled
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: 'rgba(245,158,11,0.25)' },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: '#F59E0B' },
                        ]}
                      />
                      <Text
                        style={[styles.statusBadgeText, { color: '#F59E0B' }]}
                      >
                        Pending
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.heroExpenseTitle}>{expense.title}</Text>

              {/* Large High-Contrast Amount Box */}
              <View style={styles.amountDisplayBlock}>
                <Text style={styles.amountCurrencyLabel}>
                  {expense.localCurrency}
                </Text>
                <Text style={styles.amountMainValue}>
                  {safeFormatCurrency(expense.amountLocal)}
                </Text>
              </View>

              {isForeign && (
                <View style={styles.foreignConversionRow}>
                  <AppIcon
                    name="refresh-cw"
                    size={12}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={styles.foreignConversionText}>
                    ≈ {safeFormatCurrency(expense.amountBase)}{' '}
                    {expense.baseCurrency} (Rate: {expense.exchangeRateUsed})
                  </Text>
                </View>
              )}

              {/* Settlement Progress Strip */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Settlement Progress</Text>
                  <Text style={styles.progressValueText}>
                    {paidSplits} of {totalSplits} Paid (
                    {settlementProgress.toFixed(0)}%)
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <LinearGradient
                    colors={
                      settlementProgress === 100
                        ? ['#10B981', '#059669']
                        : ['#38BDF8', '#2563EB']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressBarFill,
                      { width: `${settlementProgress}%` },
                    ]}
                  />
                </View>
              </View>
            </LinearGradient>

            {/* Split Distribution Matrix Tile */}
            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.tileHeader}>
                <Text
                  style={[
                    styles.tileTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Split Details
                </Text>
                <View style={styles.splitCountBadge}>
                  <Text style={styles.splitCountText}>
                    {expense.splits?.length || 0} MEMBERS
                  </Text>
                </View>
              </View>

              <View style={styles.splitsList}>
                {expense.splits?.map((split: Split) => {
                  const isSplitCurrentUser = split.userId === user?._id;
                  const canMarkPaid =
                    !split.isPaid && isPayer && !isSplitCurrentUser;

                  return (
                    <View
                      key={split.userId}
                      style={[
                        styles.splitCardItem,
                        { backgroundColor: theme.colors.background },
                      ]}
                    >
                      <View style={styles.splitLeft}>
                        <Avatar
                          size="md"
                          fallback={split.displayName?.charAt(0) || '?'}
                          url={split.user?.photoURL}
                        />
                        <View style={styles.splitNameBlock}>
                          <Text
                            style={[
                              styles.splitUserName,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            {split.displayName}{' '}
                            {isSplitCurrentUser ? '(You)' : ''}
                          </Text>
                          <Text
                            style={[
                              styles.splitAmountText,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {safeFormatCurrency(split.amountLocal)}{' '}
                            {expense.localCurrency}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.splitRight}>
                        {split.isPaid ? (
                          <View style={styles.paidBadge}>
                            <AppIcon name="check" size={12} color="#059669" />
                            <Text style={styles.paidBadgeText}>Paid</Text>
                          </View>
                        ) : (
                          <View style={styles.actionButtonGroup}>
                            {canMarkPaid && (
                              <Pressable
                                onPress={() => handleMarkPaid(split.userId)}
                                disabled={isMarkingPaid}
                                style={styles.markPaidBtn}
                              >
                                <Text style={styles.markPaidBtnText}>
                                  Mark Paid
                                </Text>
                              </Pressable>
                            )}
                            {isSplitCurrentUser && !isPayer && (
                              <Pressable
                                onPress={() =>
                                  router.push(
                                    `/settlements/create?expenseId=${expense._id}`,
                                  )
                                }
                                style={styles.payNowBtn}
                              >
                                <Text style={styles.payNowBtnText}>
                                  Pay Now
                                </Text>
                              </Pressable>
                            )}
                            {!canMarkPaid && !isSplitCurrentUser && (
                              <View style={styles.pendingBadge}>
                                <Text style={styles.pendingBadgeText}>
                                  Pending
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Transaction Info + Discussion Feed        */}
          {/* ======================================================== */}
          <View style={[styles.bentoColumn, isDesktop && { flex: 1 }]}>
            {/* Transaction Meta Bento Card */}
            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.tileHeader}>
                <Text
                  style={[
                    styles.tileTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Transaction Information
                </Text>
              </View>

              <View style={styles.metaList}>
                <View style={styles.metaRow}>
                  <View style={styles.metaLabelGroup}>
                    <AppIcon
                      name="user-check"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.metaLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Paid by
                    </Text>
                  </View>
                  <View style={styles.metaValueGroup}>
                    <Avatar
                      size="sm"
                      fallback={expense.paidByName?.charAt(0) || '?'}
                    />
                    <Text
                      style={[
                        styles.metaValueText,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {expense.paidByName}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaRow}>
                  <View style={styles.metaLabelGroup}>
                    <AppIcon
                      name="calendar"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.metaLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Date
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.metaValueText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </Text>
                </View>

                <View style={styles.metaDivider} />

                <View style={styles.metaRow}>
                  <View style={styles.metaLabelGroup}>
                    <AppIcon
                      name="pie-chart"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.metaLabel,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Split Method
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.metaValueText,
                      { color: theme.colors.textPrimary },
                    ]}
                  >
                    {expense.splitMethod
                      ? expense.splitMethod.charAt(0).toUpperCase() +
                        expense.splitMethod.slice(1)
                      : 'Equal'}
                  </Text>
                </View>

                {expense.notes ? (
                  <>
                    <View style={styles.metaDivider} />
                    <View style={styles.notesContainer}>
                      <Text
                        style={[
                          styles.notesLabel,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        NOTES
                      </Text>
                      <Text
                        style={[
                          styles.notesBody,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {expense.notes}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>

            {/* Discussion & Activity Feed Tile */}
            <View
              style={[
                styles.bentoTile,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.tileHeader}>
                <Text
                  style={[
                    styles.tileTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Discussion
                </Text>
                <Text
                  style={[
                    styles.commentCountText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {expense.comments?.length || 0} messages
                </Text>
              </View>

              <View style={styles.commentsList}>
                {expense.comments?.length > 0 ? (
                  expense.comments.map((comment: Comment, index: number) => {
                    const isOwn = comment.userId === user?._id;
                    const commentId = comment._id || comment.id;

                    return (
                      <View
                        key={commentId || String(index)}
                        style={[
                          styles.commentRow,
                          isOwn && styles.commentRowOwn,
                        ]}
                      >
                        <Avatar
                          size="sm"
                          fallback={comment.displayName?.charAt(0) || '?'}
                          url={comment.userAvatar}
                        />
                        <View
                          style={[
                            styles.commentBubble,
                            isOwn
                              ? styles.commentBubbleOwn
                              : { backgroundColor: theme.colors.background },
                          ]}
                        >
                          <View style={styles.commentHeader}>
                            <Text
                              style={[
                                styles.commentAuthor,
                                { color: theme.colors.textPrimary },
                              ]}
                            >
                              {comment.displayName}
                            </Text>
                            <Text
                              style={[
                                styles.commentTime,
                                { color: theme.colors.textTertiary },
                              ]}
                            >
                              {format(
                                new Date(comment.createdAt),
                                'MMM d, h:mm a',
                              )}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.commentContent,
                              { color: theme.colors.textPrimary },
                            ]}
                          >
                            {comment.text}
                          </Text>
                        </View>

                        {isOwn && commentId && (
                          <Pressable
                            onPress={() =>
                              deleteComment(
                                { expenseId: id, commentId },
                                { onSuccess: () => refetch() },
                              )
                            }
                            style={styles.commentDeleteBtn}
                            hitSlop={8}
                          >
                            <AppIcon name="trash-2" size={14} color="#EF4444" />
                          </Pressable>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyCommentsBox}>
                    <AppIcon
                      name="message-circle"
                      size={28}
                      color={theme.colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.emptyCommentsText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      No comments yet. Start the conversation below.
                    </Text>
                  </View>
                )}
              </View>

              {/* Comment Input Dock */}
              <View
                style={[
                  styles.commentInputRow,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <TextInput
                  style={[
                    styles.commentInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  placeholder="Add a note or comment..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                />
                <Pressable
                  onPress={handleAddComment}
                  disabled={!commentText.trim() || isAddingComment}
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: commentText.trim()
                        ? theme.colors.primary
                        : `${theme.colors.primary}40`,
                    },
                  ]}
                >
                  {isAddingComment ? (
                    <GlobalLoader variant="inline" size="small" color="#FFF" />
                  ) : (
                    <AppIcon name="send" size={16} color="#FFF" />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    centerBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      gap: 12,
    },
    loadingText: { fontSize: 13, fontWeight: '600' },
    errorIconWrap: { marginBottom: 8 },
    errorTitle: { fontSize: 18, fontWeight: '800' },
    errorSub: {
      fontSize: 13,
      textAlign: 'center',
      maxWidth: 320,
      lineHeight: 18,
    },
    errorBackBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      marginTop: 8,
    },
    errorBackBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

    // Header
    headerBar: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      zIndex: 10,
    },
    headerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

      ...Platform.select({
        web: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
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
    },
    desktopHeaderInner: {
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },

    // Content
    scrollContent: {
      padding: 16,
      paddingBottom: 80,
    },
    desktopScrollContent: {
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 24,
    },

    // Bento Architecture
    bentoContainer: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'flex-start',
    },
    stackLayout: {
      flexDirection: 'column',
    },
    bentoColumn: {
      flex: 1,
      gap: 16,
      width: '100%',
    },
    bentoTile: {
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',

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
    },
    tileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    tileTitle: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.3,
    },

    // Hero Card
    heroCard: {
      borderRadius: 24,
      padding: 24,

      ...Platform.select({
        web: {
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.15)',
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
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    categoryIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBadgeRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    categoryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFF',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFF',
    },
    heroExpenseTitle: {
      fontSize: 26,
      fontWeight: '900',
      color: '#FFF',
      letterSpacing: -0.6,
      marginBottom: 12,
    },
    amountDisplayBlock: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      marginBottom: 6,
    },
    amountCurrencyLabel: {
      fontSize: 20,
      fontWeight: '800',
      color: '#38BDF8',
    },
    amountMainValue: {
      fontSize: 34,
      fontWeight: '900',
      color: '#FFF',
      letterSpacing: -1,
    },
    foreignConversionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 20,
    },
    foreignConversionText: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '600',
    },
    progressSection: {
      gap: 6,
      marginTop: 8,
    },
    progressLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.7)',
    },
    progressValueText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFF',
    },
    progressBarTrack: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },

    // Splits List
    splitCountBadge: {
      backgroundColor: '#EFF6FF',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    splitCountText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#2563EB',
      letterSpacing: 0.5,
    },
    splitsList: {
      gap: 10,
    },
    splitCardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(15,23,42,0.04)',
    },
    splitLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    splitNameBlock: {
      flex: 1,
      gap: 2,
    },
    splitUserName: {
      fontSize: 13,
      fontWeight: '800',
    },
    splitAmountText: {
      fontSize: 12,
      fontWeight: '600',
    },
    splitRight: {
      alignItems: 'flex-end',
    },
    paidBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#ECFDF5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    paidBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#059669',
    },
    actionButtonGroup: {
      flexDirection: 'row',
      gap: 6,
    },
    markPaidBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    markPaidBtnText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '800',
    },
    payNowBtn: {
      borderWidth: 1,
      borderColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    payNowBtnText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '800',
    },
    pendingBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    pendingBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#D97706',
    },

    // Meta Info
    metaList: {
      gap: 12,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaLabelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    metaValueGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    metaValueText: {
      fontSize: 13,
      fontWeight: '800',
    },
    metaDivider: {
      height: 1,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.05)',
    },
    notesContainer: {
      gap: 4,
      paddingTop: 4,
    },
    notesLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    notesBody: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
    },

    // Discussion
    commentCountText: {
      fontSize: 12,
      fontWeight: '600',
    },
    commentsList: {
      gap: 12,
      marginBottom: 16,
    },
    commentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    commentRowOwn: {
      flexDirection: 'row-reverse',
    },
    commentBubble: {
      flex: 1,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(15,23,42,0.04)',
    },
    commentBubbleOwn: {
      backgroundColor: 'rgba(37,99,235,0.1)',
      borderColor: 'rgba(37,99,235,0.2)',
    },
    commentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    commentAuthor: {
      fontSize: 12,
      fontWeight: '800',
    },
    commentTime: {
      fontSize: 10,
      fontWeight: '600',
    },
    commentContent: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
    },
    commentDeleteBtn: {
      padding: 4,
      alignSelf: 'center',
    },
    emptyCommentsBox: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    emptyCommentsText: {
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'center',
    },
    commentInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 6,
      paddingLeft: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(15,23,42,0.06)',
    },
    commentInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      maxHeight: 80,
      paddingVertical: 6,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
