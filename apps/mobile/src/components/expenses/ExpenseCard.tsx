import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  PressableStateCallbackType,
  Linking,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import Animated, {
  FadeInDown,
  LinearTransition,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from '../common/AppIcon';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../providers/ThemeProvider';
import { Theme } from '../../theme';
import { haptics } from '../../utils/haptics';
import { ExpensePresentationModel } from '../../models/presentation/expense.model';
import {
  useArchiveExpense,
  useDeleteExpensePermanent,
  useUnarchiveExpense,
} from '../../hooks';

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean;
  pressed?: boolean;
};
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ExpenseCardProps {
  expense: ExpensePresentationModel;
  index: number;
  showInlineActions?: boolean;
}

export function ExpenseCard({
  expense,
  index,
  showInlineActions = false,
}: ExpenseCardProps) {
  const theme = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(false);
  const cardScale = useSharedValue(1);

  const { mutate: deleteExpense } = useDeleteExpensePermanent();
  const { mutate: archiveExpense } = useArchiveExpense();
  const { mutate: unarchiveExpense } = useUnarchiveExpense();

  const handlePressIn = () => {
    haptics.light();
    cardScale.value = withSpring(0.98);
  };
  const handlePressOut = () => {
    cardScale.value = withSpring(1);
  };

  const handleAction = (type: 'delete' | 'archive' | 'unarchive', e?: any) => {
    if (Platform.OS === 'web') e?.stopPropagation?.();
    if (type === 'archive') archiveExpense(expense.id);
    if (type === 'unarchive') unarchiveExpense(expense.id);
    if (type === 'delete') {
      Alert.alert(
        'Delete Expense',
        'Are you sure you want to permanently delete this expense?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteExpense(expense.id),
          },
        ],
      );
    }
  };

  const handleLongPress = () => {
    if (showInlineActions) return;
    haptics.medium();
    const isArchived = expense.rawExpense?.isArchived;
    const options = ['Cancel', isArchived ? 'Unarchive' : 'Archive'];
    let destructiveButtonIndex = -1;

    if (expense.isCreator) {
      options.push('Delete');
      destructiveButtonIndex = 2;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex:
            destructiveButtonIndex > -1 ? destructiveButtonIndex : undefined,
          title: 'Manage Expense',
          message: expense.title,
        },
        buttonIndex => {
          if (buttonIndex === 1)
            handleAction(isArchived ? 'unarchive' : 'archive');
          else if (buttonIndex === 2 && expense.isCreator)
            handleAction('delete');
        },
      );
    } else {
      const buttons: import('react-native').AlertButton[] = [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isArchived ? 'Unarchive' : 'Archive',
          onPress: () => handleAction(isArchived ? 'unarchive' : 'archive'),
        },
      ];
      if (expense.isCreator) {
        buttons.push({
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleAction('delete'),
        });
      }
      Alert.alert('Manage Expense', expense.title, buttons);
    }
  };

  const handleOpenMap = () => {
    if (
      expense.rawExpense?.location?.latitude &&
      expense.rawExpense?.location?.longitude
    ) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${expense.rawExpense.location.latitude},${expense.rawExpense.location.longitude}`,
      );
    }
  };

  const animationDelay = Math.min(index * 30, 400);
  const categoryColor =
    (theme.colors as any)[expense.categoryColorToken] || theme.colors.primary;

  return (
    <Animated.View
      entering={FadeInDown.delay(animationDelay).duration(400).springify()}
      layout={LinearTransition.springify()}
      style={styles.container}
    >
      <AnimatedPressable
        style={({ hovered }: WebPressableState) => [
          styles.pressableWrapper,
          Platform.OS === 'web' && hovered && styles.hoverLift,
          { transform: [{ scale: cardScale }] },
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => setExpanded(!expanded)}
        onLongPress={handleLongPress}
        delayLongPress={350}
      >
        <GlassCard style={styles.card} intensity={theme.isDark ? 20 : 15}>
          {/* Collapsed State */}
          <View style={styles.collapsedHeader}>
            {/* Icon */}
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: `${categoryColor}15`,
                  borderColor: `${categoryColor}30`,
                },
              ]}
            >
              <Text style={styles.emoji}>{expense.categoryEmoji}</Text>
            </View>

            {/* Title & Meta */}
            <View style={styles.headerInfo}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, { color: theme.colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {expense.title}
                </Text>
                <Text
                  style={[styles.amount, { color: theme.colors.textPrimary }]}
                >
                  {expense.amountFormatted}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {expense.payerName}
                </Text>
                <View style={styles.dot} />
                <Text
                  style={[
                    styles.metaText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {expense.dateFormatted}
                </Text>
                {expense.tripName && (
                  <>
                    <View style={styles.dot} />
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {expense.tripName}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Settlement Progress (Premium version) */}
          {expense.totalSplits > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text
                  style={[
                    styles.progressLabel,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  SETTLEMENT
                </Text>
                <Text
                  style={[
                    styles.progressLabel,
                    {
                      color: expense.isSettled
                        ? theme.colors.success
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {expense.paidSplits} of {expense.totalSplits}
                </Text>
              </View>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        `${Math.round(expense.settlementPercentage * 100)}%` as any,
                      backgroundColor: expense.isSettled
                        ? theme.colors.success
                        : categoryColor,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Expanded Content (Receipt Style) */}
          {expanded && (
            <Animated.View
              entering={FadeInDown.duration(300).springify()}
              style={[
                styles.expandedContent,
                { borderTopColor: theme.glass.borderTopColor },
              ]}
            >
              <View style={styles.expandedHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  SPLIT BREAKDOWN
                </Text>
                <Badge
                  label={expense.isSettled ? 'Settled' : 'Pending'}
                  variant={expense.isSettled ? 'success' : 'warning'}
                />
              </View>

              <View style={styles.splitsList}>
                {expense.splits.map(split => (
                  <View
                    key={split.id}
                    style={[
                      styles.splitCard,
                      { backgroundColor: theme.colors.surface },
                    ]}
                  >
                    <View style={styles.splitLeft}>
                      <View
                        style={[
                          styles.splitAvatar,
                          {
                            backgroundColor: split.isPaid
                              ? theme.colors.successLight
                              : `${categoryColor}15`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.splitAvatarText,
                            {
                              color: split.isPaid
                                ? theme.colors.success
                                : categoryColor,
                            },
                          ]}
                        >
                          {split.avatarInitial}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.splitName,
                          { color: theme.colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {split.displayName}
                      </Text>
                    </View>
                    <View style={styles.splitRight}>
                      <Text
                        style={[
                          styles.splitAmount,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {split.amountFormatted}
                      </Text>
                      <View
                        style={[
                          styles.splitStatusBadge,
                          {
                            backgroundColor: split.isPaid
                              ? theme.colors.successLight
                              : theme.colors.warningLight,
                          },
                        ]}
                      >
                        <AppIcon
                          name={split.isPaid ? 'check' : 'clock'}
                          size={10}
                          color={
                            split.isPaid
                              ? theme.colors.success
                              : theme.colors.warning
                          }
                        />
                        <Text
                          style={[
                            styles.splitStatusText,
                            {
                              color: split.isPaid
                                ? theme.colors.success
                                : theme.colors.warning,
                            },
                          ]}
                        >
                          {split.isPaid ? 'Paid' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.actionsGrid}>
                {expense.rawExpense?.location?.latitude && (
                  <Pressable
                    onPress={handleOpenMap}
                    style={({ pressed, hovered }: WebPressableState) => [
                      styles.actionBtn,
                      {
                        backgroundColor: `${theme.colors.primary}10`,
                        borderColor: `${theme.colors.primary}30`,
                      },
                      (pressed || hovered) && {
                        backgroundColor: `${theme.colors.primary}15`,
                      },
                    ]}
                  >
                    <AppIcon
                      name="map-pin"
                      size={14}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Map
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => router.push(`/(app)/expenses/${expense.id}`)}
                  style={({ pressed, hovered }: WebPressableState) => [
                    styles.actionBtn,
                    styles.actionBtnPrimary,
                    { backgroundColor: theme.colors.textPrimary },
                    (pressed || hovered) && { opacity: 0.9 },
                  ]}
                >
                  <AppIcon
                    name="file-text"
                    size={14}
                    color={theme.colors.textInverse}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      { color: theme.colors.textInverse },
                    ]}
                  >
                    Full Details
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </GlassCard>
      </AnimatedPressable>
    </Animated.View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      marginBottom: 12,
    },
    pressableWrapper: {
      width: '100%',
      borderRadius: 20,
    },
    hoverLift: {
      transform: [{ translateY: -2 }],
      ...(Platform.OS === 'web'
        ? {
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
          }
        : {}),
    },
    card: {
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.glass.borderTopColor,
      overflow: 'hidden',
    },
    collapsedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    iconBox: {
      width: 46,
      height: 46,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: {
      fontSize: 24,
    },
    headerInfo: {
      flex: 1,
      gap: 6,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
    },
    amount: {
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    metaText: {
      fontSize: 12,
      fontWeight: '500',
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.glass.borderTopColor,
    },
    progressContainer: {
      marginTop: 16,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    progressLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    expandedContent: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
    },
    expandedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    splitsList: {
      gap: 8,
      marginBottom: 16,
    },
    splitCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      borderRadius: 14,
    },
    splitLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    splitAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    splitAvatarText: {
      fontSize: 13,
      fontWeight: '800',
    },
    splitName: {
      fontSize: 14,
      fontWeight: '600',
    },
    splitRight: {
      alignItems: 'flex-end',
      gap: 4,
    },
    splitAmount: {
      fontSize: 14,
      fontWeight: '800',
    },
    splitStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    splitStatusText: {
      fontSize: 9,
      fontWeight: '700',
    },
    actionsGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    actionBtnPrimary: {
      borderWidth: 0,
    },
    actionText: {
      fontSize: 13,
      fontWeight: '700',
    },
  });
