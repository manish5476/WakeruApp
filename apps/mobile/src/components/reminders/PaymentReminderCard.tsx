import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { format } from 'date-fns';

import { useTheme } from '../../providers/ThemeProvider';
import {
  ReminderAPIModel,
  extractAmount,
  getInitials,
} from '../../utils/reminder.utils';
import AppIcon from '../common/AppIcon';
import { Badge } from '../ui/Badge';
import { Typography } from '../ui/Typography';
import { haptics } from '../../utils/haptics';
import { GlassCard } from '../ui/GlassCard';
import type { Theme } from '../../theme';

interface PaymentReminderCardProps {
  reminder: ReminderAPIModel;
  index: number;
  onDone?: () => void;
  onPing?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PaymentReminderCard = React.memo(
  ({ reminder, index, onDone, onPing }: PaymentReminderCardProps) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [expanded, setExpanded] = useState(false);
    const expandProgress = useSharedValue(0);
    const scale = useSharedValue(1);

    const isActive = reminder.status === 'active';
    const isOverdue =
      isActive &&
      reminder.nextTriggerAt &&
      new Date(reminder.nextTriggerAt) < new Date();
    const amount = extractAmount(reminder.message);

    let color = theme.colors.primary;
    if (reminder.status === 'completed') color = theme.colors.success;
    if (isOverdue) color = theme.colors.danger;

    const toggleExpand = () => {
      haptics.light();
      setExpanded(!expanded);
      expandProgress.value = withTiming(expanded ? 0 : 1, { duration: 300 });
    };

    const expandStyle = useAnimatedStyle(() => ({
      maxHeight: expandProgress.value * 200 + 10,
      opacity: expandProgress.value,
      marginTop: expandProgress.value * theme.spacing[4],
      overflow: 'hidden',
    }));

    const renderLeftActions = () => {
      if (!onDone || !isActive) return null;
      return (
        <Pressable
          style={[
            styles.swipeAction,
            { backgroundColor: theme.colors.success },
          ]}
          onPress={() => {
            haptics.success();
            onDone();
          }}
        >
          <AppIcon
            name="check-circle"
            size={24}
            color={theme.colors.textInverse}
          />
          <Typography
            variant="caption"
            weight="bold"
            color="textInverse"
            style={{ marginTop: theme.spacing[1] }}
          >
            Settled
          </Typography>
        </Pressable>
      );
    };

    return (
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 50, 400))
          .duration(500)
          .springify()}
      >
        <Swipeable renderLeftActions={renderLeftActions} overshootLeft={false}>
          <AnimatedPressable
            onPress={toggleExpand}
            onPressIn={() => (scale.value = withSpring(0.98))}
            onPressOut={() => (scale.value = withSpring(1))}
            style={({ hovered }: any) => [
              styles.cardWrapper,
              { transform: [{ scale: scale.value }] },
              Platform.OS === 'web' && hovered && styles.cardHover,
            ]}
          >
            <GlassCard variant="medium" padding="none" style={styles.card}>
              <View style={styles.content}>
                {/* Header Row */}
                <View style={styles.headerRow}>
                  <View
                    style={[
                      styles.badgeWrap,
                      { backgroundColor: `${color}15` },
                    ]}
                  >
                    <AppIcon name="credit-card" size={14} color={color} />
                    <Typography
                      variant="caption"
                      weight="black"
                      style={{ color, letterSpacing: 0.5 }}
                    >
                      PAYMENT
                    </Typography>
                  </View>
                  <Badge
                    label={
                      isOverdue ? 'OVERDUE' : reminder.status.toUpperCase()
                    }
                    variant={
                      isOverdue
                        ? 'danger'
                        : reminder.status === 'completed'
                          ? 'success'
                          : 'primary'
                    }
                  />
                </View>

                {/* Amount & Person */}
                <View style={styles.mainInfo}>
                  <Typography
                    variant="h2"
                    weight="black"
                    color="textPrimary"
                    style={{ lineHeight: theme.typography.lineHeight.tight }}
                  >
                    ₹{amount || '0'}
                  </Typography>
                  <View style={styles.personWrap}>
                    <Typography
                      variant="caption"
                      weight="medium"
                      color="textTertiary"
                    >
                      from
                    </Typography>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: theme.colors.primaryBg },
                      ]}
                    >
                      <Typography
                        variant="caption"
                        weight="black"
                        color="primary"
                        style={{ fontSize: 10 }}
                      >
                        {getInitials(reminder.targetUserName)}
                      </Typography>
                    </View>
                    <Typography
                      variant="bodySm"
                      weight="bold"
                      color="textSecondary"
                    >
                      {reminder.targetUserName || 'Someone'}
                    </Typography>
                  </View>
                </View>

                <Typography
                  variant="body"
                  weight="bold"
                  color="textPrimary"
                  numberOfLines={1}
                  style={styles.title}
                >
                  {reminder.title}
                </Typography>

                {reminder.tripName && (
                  <Typography
                    variant="caption"
                    weight="semibold"
                    color="primary"
                    numberOfLines={1}
                    style={styles.tripName}
                  >
                    🧳 {reminder.tripName}
                  </Typography>
                )}

                {/* Action Buttons */}
                {isActive && (
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[styles.primaryBtn, { backgroundColor: color }]}
                      onPress={() => {
                        haptics.light();
                        onPing?.();
                      }}
                    >
                      <AppIcon
                        name="send"
                        size={14}
                        color={theme.colors.textInverse}
                      />
                      <Typography
                        variant="bodySm"
                        weight="bold"
                        color="textInverse"
                      >
                        Send Again
                      </Typography>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.iconBtn,
                        { borderColor: theme.colors.border },
                      ]}
                      onPress={() => haptics.light()}
                    >
                      <AppIcon
                        name="phone"
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                    <Pressable
                      style={[
                        styles.iconBtn,
                        { borderColor: theme.colors.border },
                      ]}
                      onPress={() => haptics.light()}
                    >
                      <AppIcon
                        name="message-circle"
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                )}

                {/* Expanded Details */}
                <Animated.View style={expandStyle}>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                  <Typography
                    variant="bodySm"
                    color="textSecondary"
                    style={styles.message}
                  >
                    {reminder.message}
                  </Typography>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <AppIcon
                        name="clock"
                        size={14}
                        color={theme.colors.textTertiary}
                      />
                      <Typography
                        variant="caption"
                        weight="medium"
                        color="textTertiary"
                      >
                        {reminder.nextTriggerAt
                          ? format(
                              new Date(reminder.nextTriggerAt),
                              'MMM d, h:mm a',
                            )
                          : 'No upcoming trigger'}
                      </Typography>
                    </View>
                    <View style={styles.metaItem}>
                      <AppIcon
                        name="alert-triangle"
                        size={14}
                        color={theme.colors.textTertiary}
                      />
                      <Typography
                        variant="caption"
                        weight="medium"
                        color="textTertiary"
                      >
                        Escalation Level {reminder.escalationLevel}
                      </Typography>
                    </View>
                  </View>
                </Animated.View>
              </View>
            </GlassCard>
          </AnimatedPressable>
        </Swipeable>
      </Animated.View>
    );
  },
);

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme) {
  return StyleSheet.create({
    cardWrapper: {
      marginBottom: theme.spacing[4],
    },
    card: {
      borderRadius: theme.borderRadius['3xl'],
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardHover: {
      transform: [{ translateY: -2 }],
    } as any,
    content: {
      padding: theme.spacing[5],
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing[4],
    },
    badgeWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing[2.5],
      paddingVertical: theme.spacing[1],
      borderRadius: theme.borderRadius.full,
      gap: theme.spacing[1.5],
    },
    mainInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: theme.spacing[3],
    },
    personWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[1.5],
      paddingBottom: theme.spacing[1],
    },
    avatar: {
      width: theme.spacing[6], // 24px
      height: theme.spacing[6],
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginBottom: theme.spacing[1],
    },
    tripName: {
      marginBottom: theme.spacing[4],
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing[3],
      marginTop: theme.spacing[2],
    },
    primaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing[2],
      borderRadius: theme.borderRadius.lg,
      paddingVertical: theme.spacing[3],
    },
    iconBtn: {
      width: theme.spacing[11], // 44px
      height: theme.spacing[11],
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      height: 1,
      width: '100%',
      marginVertical: theme.spacing[4],
    },
    message: {
      lineHeight: theme.typography.lineHeight.relaxed,
      marginBottom: theme.spacing[4],
    },
    metaRow: {
      gap: theme.spacing[2.5],
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[2],
    },
    swipeAction: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 90,
      borderTopLeftRadius: theme.borderRadius['3xl'],
      borderBottomLeftRadius: theme.borderRadius['3xl'],
      marginBottom: theme.spacing[4],
    },
  });
}
