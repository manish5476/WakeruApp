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
import { format, formatDistanceToNow } from 'date-fns';

import { useTheme } from '../../providers/ThemeProvider';
import {
  ReminderAPIModel,
  extractAmount,
  getInitials,
} from '../../utils/reminder.utils';
import AppIcon from '../common/AppIcon';
import { Badge } from '../ui/Badge';
import { haptics } from '../../utils/haptics';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/Typography';
import type { Theme } from '../../theme';

interface ReminderCardProps {
  reminder: ReminderAPIModel;
  index: number;
  onDone?: () => void;
  onPause?: () => void;
  onCancel?: () => void;
  onResume?: () => void;
}

const FREQUENCY_ICONS: Record<string, string> = {
  once: 'circle',
  daily: 'sunrise',
  weekly: 'calendar',
  monthly: 'calendar',
  custom_days: 'clock',
};

const ESCALATION_CONFIG: Record<
  number,
  { emoji: string; label: string; color: string }
> = {
  0: { emoji: '💡', label: 'Gentle', color: '#3B82F6' },
  1: { emoji: '📣', label: 'Firm', color: '#F59E0B' },
  2: { emoji: '⚠️', label: 'Urgent', color: '#EF4444' },
  3: { emoji: '🚨', label: 'Critical', color: '#991B1B' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ReminderCard = React.memo(
  ({
    reminder,
    index,
    onDone,
    onPause,
    onCancel,
    onResume,
  }: ReminderCardProps) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [expanded, setExpanded] = useState(false);
    const expandProgress = useSharedValue(0);
    const scale = useSharedValue(1);

    const isActive = reminder.status === 'active';
    const isPaused = reminder.status === 'paused';
    const isOverdue =
      isActive &&
      reminder.nextTriggerAt &&
      new Date(reminder.nextTriggerAt) < new Date();
    const amount = extractAmount(reminder.message);
    const escalation =
      ESCALATION_CONFIG[reminder.escalationLevel] || ESCALATION_CONFIG[0];
    const freqIcon = FREQUENCY_ICONS[reminder.frequency] || 'repeat';

    let accentColor = theme.colors.info;
    if (reminder.status === 'completed') accentColor = theme.colors.success;
    else if (isPaused) accentColor = theme.colors.warning;
    else if (reminder.status === 'cancelled')
      accentColor = theme.colors.textTertiary;
    else if (isOverdue) accentColor = theme.colors.danger;

    const toggleExpand = () => {
      haptics.light();
      setExpanded(!expanded);
      expandProgress.value = withTiming(expanded ? 0 : 1, { duration: 300 });
    };

    const expandStyle = useAnimatedStyle(() => ({
      maxHeight: expandProgress.value * 200 + 10,
      opacity: expandProgress.value,
      marginTop: expandProgress.value * 12,
      overflow: 'hidden',
    }));

    const renderRightActions = () => {
      if (!onPause && !onResume) return null;
      return (
        <Pressable
          style={[
            styles.swipeAction,
            {
              backgroundColor: isActive
                ? theme.colors.warning
                : theme.colors.success,
            },
          ]}
          onPress={() => {
            haptics.light();
            isActive ? onPause?.() : onResume?.();
          }}
        >
          <AppIcon name={isActive ? 'pause' : 'play'} size={24} color="#FFF" />
          <Typography
            variant="caption"
            weight="bold"
            color="textInverse"
            style={{ marginTop: 4 }}
          >
            {isActive ? 'Pause' : 'Resume'}
          </Typography>
        </Pressable>
      );
    };

    const renderLeftActions = () => {
      if (!onDone || !isActive) return null;
      return (
        <Pressable
          style={[
            styles.swipeAction,
            styles.swipeLeftAction,
            { backgroundColor: theme.colors.success },
          ]}
          onPress={() => {
            haptics.success();
            onDone();
          }}
        >
          <AppIcon name="check-circle" size={24} color="#FFF" />
          <Typography
            variant="caption"
            weight="bold"
            color="textInverse"
            style={{ marginTop: 4 }}
          >
            Done
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
        <Swipeable
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
          overshootRight={false}
          overshootLeft={false}
        >
          <AnimatedPressable
            onPress={toggleExpand}
            onPressIn={() => (scale.value = withSpring(0.98))}
            onPressOut={() => (scale.value = withSpring(1))}
            style={({ hovered }: any) => [
              { transform: [{ scale: scale.value }] },
              Platform.OS === 'web' && hovered && styles.cardHover,
            ]}
          >
            <GlassCard variant="medium" padding="none" style={styles.card}>
              <View
                style={[styles.cardAccent, { backgroundColor: accentColor }]}
              />
              <View style={styles.content}>
                {/* Top Row */}
                <View style={styles.topRow}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: `${accentColor}15` },
                    ]}
                  >
                    <AppIcon
                      name={
                        reminder.type === 'payment' ? 'credit-card' : 'bell'
                      }
                      size={18}
                      color={accentColor}
                    />
                  </View>
                  <View style={styles.titleWrap}>
                    <Typography
                      variant="body"
                      weight="bold"
                      color="textPrimary"
                      numberOfLines={1}
                    >
                      {reminder.title}
                    </Typography>
                    {reminder.tripName && (
                      <Typography
                        variant="caption"
                        weight="semibold"
                        color="primary"
                        numberOfLines={1}
                      >
                        🧳 {reminder.tripName}
                      </Typography>
                    )}
                  </View>
                  {isOverdue && <Badge label="OVERDUE" variant="danger" />}
                  {!isOverdue && (
                    <Badge
                      label={reminder.status.toUpperCase()}
                      variant={
                        isActive ? 'primary' : isPaused ? 'warning' : 'success'
                      }
                    />
                  )}
                </View>

                {/* Message */}
                <Typography
                  variant="bodySm"
                  color="textSecondary"
                  numberOfLines={expanded ? 10 : 2}
                  style={styles.message}
                >
                  {escalation.emoji} {reminder.message}
                </Typography>

                {/* Highlights (Avatar & Amount) */}
                <View style={styles.highlightsRow}>
                  {reminder.targetUserName && (
                    <View style={styles.highlightPill}>
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
                          style={styles.avatarText}
                        >
                          {getInitials(reminder.targetUserName)}
                        </Typography>
                      </View>
                      <Typography
                        variant="caption"
                        weight="semibold"
                        color="textSecondary"
                      >
                        {reminder.targetUserName}
                      </Typography>
                    </View>
                  )}
                  {amount && (
                    <View style={styles.highlightPill}>
                      <AppIcon
                        name="dollar-sign"
                        size={14}
                        color={theme.colors.textTertiary}
                      />
                      <Typography
                        variant="caption"
                        weight="bold"
                        color="textSecondary"
                      >
                        ₹{amount}
                      </Typography>
                    </View>
                  )}
                </View>

                {/* Schedule row */}
                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleItem}>
                    <AppIcon
                      name={freqIcon}
                      size={12}
                      color={theme.colors.textTertiary}
                    />
                    <Typography
                      variant="caption"
                      weight="semibold"
                      color="textTertiary"
                    >
                      {reminder.frequency === 'once'
                        ? 'One time'
                        : reminder.frequency === 'custom_days'
                          ? `Every ${reminder.customDays || '?'}d`
                          : reminder.frequency}
                    </Typography>
                  </View>
                  <View style={styles.scheduleItem}>
                    <AppIcon
                      name="clock"
                      size={12}
                      color={theme.colors.textTertiary}
                    />
                    <Typography
                      variant="caption"
                      weight="semibold"
                      color={isOverdue ? 'danger' : 'textTertiary'}
                    >
                      {reminder.status === 'completed' &&
                      reminder.lastTriggeredAt
                        ? `Finished: ${formatDistanceToNow(new Date(reminder.lastTriggeredAt), { addSuffix: true })}`
                        : reminder.nextTriggerAt
                          ? `Next: ${format(new Date(reminder.nextTriggerAt), 'MMM d, h:mm a')}`
                          : 'No schedule'}
                    </Typography>
                  </View>
                </View>

                {/* Expanded Details */}
                <Animated.View style={expandStyle}>
                  <View
                    style={[
                      styles.expandedDivider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />

                  {/* Escalation Config */}
                  {isActive && (
                    <View
                      style={[
                        styles.escalationBox,
                        { backgroundColor: `${escalation.color}15` },
                      ]}
                    >
                      <Typography variant="body" style={styles.escalationEmoji}>
                        {escalation.emoji}
                      </Typography>
                      <View style={styles.escalationDots}>
                        {[0, 1, 2, 3].map(level => (
                          <View
                            key={level}
                            style={[
                              styles.escalationDot,
                              {
                                backgroundColor:
                                  level <= reminder.escalationLevel
                                    ? escalation.color
                                    : theme.colors.borderLight,
                                width:
                                  level === reminder.escalationLevel ? 24 : 8,
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Typography
                        variant="caption"
                        weight="bold"
                        style={{
                          color: escalation.color,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {escalation.label} Escalation
                      </Typography>
                    </View>
                  )}

                  {/* Additional Meta */}
                  <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                      <Typography
                        variant="caption"
                        weight="semibold"
                        color="textTertiary"
                        style={styles.metaLabel}
                      >
                        Created
                      </Typography>
                      <Typography
                        variant="bodySm"
                        weight="semibold"
                        color="textSecondary"
                      >
                        {format(new Date(reminder.createdAt), 'MMM d, yyyy')}
                      </Typography>
                    </View>
                    <View style={styles.metaItem}>
                      <Typography
                        variant="caption"
                        weight="semibold"
                        color="textTertiary"
                        style={styles.metaLabel}
                      >
                        Triggers
                      </Typography>
                      <Typography
                        variant="bodySm"
                        weight="semibold"
                        color="textSecondary"
                      >
                        {reminder.triggerCount} times
                      </Typography>
                    </View>
                    {Array.isArray(reminder.channels) &&
                      reminder.channels.length > 0 && (
                        <View style={styles.metaItem}>
                          <Typography
                            variant="caption"
                            weight="semibold"
                            color="textTertiary"
                            style={styles.metaLabel}
                          >
                            Channels
                          </Typography>
                          <View
                            style={{
                              flexDirection: 'row',
                              gap: theme.spacing[2],
                              marginTop: theme.spacing[1],
                            }}
                          >
                            {reminder.channels.map(c => (
                              <AppIcon
                                key={c}
                                name={
                                  c === 'push'
                                    ? 'smartphone'
                                    : c === 'email'
                                      ? 'mail'
                                      : 'message-square'
                                }
                                size={14}
                                color={theme.colors.textSecondary}
                              />
                            ))}
                          </View>
                        </View>
                      )}
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    {isActive && onPause && (
                      <Pressable
                        style={[
                          styles.actionBtn,
                          { borderColor: theme.colors.warning },
                        ]}
                        onPress={() => {
                          haptics.light();
                          onPause();
                        }}
                      >
                        <AppIcon
                          name="pause"
                          size={14}
                          color={theme.colors.warning}
                        />
                        <Typography
                          variant="caption"
                          weight="bold"
                          color="warning"
                        >
                          Pause
                        </Typography>
                      </Pressable>
                    )}
                    {isPaused && onResume && (
                      <Pressable
                        style={[
                          styles.actionBtn,
                          {
                            backgroundColor: theme.colors.success,
                            borderWidth: 0,
                          },
                        ]}
                        onPress={() => {
                          haptics.light();
                          onResume();
                        }}
                      >
                        <AppIcon name="play" size={14} color="#FFF" />
                        <Typography
                          variant="caption"
                          weight="bold"
                          color="textInverse"
                        >
                          Resume
                        </Typography>
                      </Pressable>
                    )}
                    {onCancel && (
                      <Pressable
                        style={[
                          styles.actionBtn,
                          { borderColor: theme.colors.danger },
                        ]}
                        onPress={() => {
                          haptics.light();
                          onCancel();
                        }}
                      >
                        <AppIcon
                          name="x"
                          size={14}
                          color={theme.colors.danger}
                        />
                        <Typography
                          variant="caption"
                          weight="bold"
                          color="danger"
                        >
                          Cancel
                        </Typography>
                      </Pressable>
                    )}
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

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      borderRadius: theme.borderRadius['2xl'],
      borderWidth: 1,
      flexDirection: 'row',
      overflow: 'hidden',
      marginBottom: theme.spacing[4],
    },
    cardHover: {
      transform: [{ translateY: -2 }],
    } as any,
    cardAccent: {
      width: 6,
    },
    content: {
      flex: 1,
      padding: theme.spacing[4],
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[3],
      marginBottom: theme.spacing[3],
    },
    iconWrap: {
      width: theme.spacing[10], // 40px
      height: theme.spacing[10],
      borderRadius: theme.borderRadius.lg, // 12px
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleWrap: {
      flex: 1,
    },
    message: {
      lineHeight: theme.typography.lineHeight.relaxed,
      marginBottom: theme.spacing[3],
    },
    highlightsRow: {
      flexDirection: 'row',
      gap: theme.spacing[3],
      marginBottom: theme.spacing[3],
    },
    highlightPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[1.5],
    },
    avatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 9,
    },
    scheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[4],
    },
    scheduleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[1.5],
    },
    expandedDivider: {
      height: 1,
      width: '100%',
      marginVertical: theme.spacing[3],
    },
    escalationBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing[3],
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing[3],
      marginBottom: theme.spacing[3],
    },
    escalationEmoji: {
      fontSize: 18,
    },
    escalationDots: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[1],
    },
    escalationDot: {
      height: 8,
      borderRadius: 4,
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[4],
      marginBottom: theme.spacing[4],
    },
    metaItem: {
      minWidth: '30%',
    },
    metaLabel: {
      marginBottom: theme.spacing[1],
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing[3],
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing[1.5],
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[2.5],
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
    },
    swipeAction: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      borderTopRightRadius: theme.borderRadius['2xl'],
      borderBottomRightRadius: theme.borderRadius['2xl'],
      marginBottom: theme.spacing[4],
    },
    swipeLeftAction: {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: theme.borderRadius['2xl'],
      borderBottomLeftRadius: theme.borderRadius['2xl'],
    },
  });
}

// // src/components/reminders/ReminderCard.tsx
// import React, { useState } from 'react';
// import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
// import Animated, {
//     FadeInDown,
//     useAnimatedStyle,
//     withSpring,
//     useSharedValue,
//     withTiming
// } from 'react-native-reanimated';
// import { Swipeable } from 'react-native-gesture-handler';
// import { format, formatDistanceToNow } from 'date-fns';

// import { useTheme } from '../../providers/ThemeProvider';
// import { ReminderAPIModel, extractAmount, getInitials } from '../../utils/reminder.utils';
// import AppIcon  from '../common/AppIcon';
// import { Badge } from '../ui/Badge';
// import { haptics } from '../../utils/haptics';
// import { GlassCard } from '../ui/GlassCard';

// interface ReminderCardProps {
//     reminder: ReminderAPIModel;
//     index: number;
//     onDone?: () => void;
//     onPause?: () => void;
//     onCancel?: () => void;
//     onResume?: () => void;
// }

// const FREQUENCY_ICONS: Record<string, string> = {
//     once: 'circle',
//     daily: 'sunrise',
//     weekly: 'calendar',
//     monthly: 'calendar',
//     custom_days: 'clock',
// };

// const ESCALATION_CONFIG: Record<number, { emoji: string; label: string; color: string }> = {
//     0: { emoji: '💡', label: 'Gentle', color: '#3B82F6' },
//     1: { emoji: '📣', label: 'Firm', color: '#F59E0B' },
//     2: { emoji: '⚠️', label: 'Urgent', color: '#EF4444' },
//     3: { emoji: '🚨', label: 'Critical', color: '#991B1B' },
// };

// const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// export const ReminderCard = React.memo(({ reminder, index, onDone, onPause, onCancel, onResume }: ReminderCardProps) => {
//     const theme = useTheme();
//     const [expanded, setExpanded] = useState(false);
//     const expandProgress = useSharedValue(0);
//     const scale = useSharedValue(1);

//     const isActive = reminder.status === 'active';
//     const isPaused = reminder.status === 'paused';
//     const isOverdue = isActive && reminder.nextTriggerAt && new Date(reminder.nextTriggerAt) < new Date();
//     const amount = extractAmount(reminder.message);
//     const escalation = ESCALATION_CONFIG[reminder.escalationLevel] || ESCALATION_CONFIG[0];
//     const freqIcon = FREQUENCY_ICONS[reminder.frequency] || 'repeat';

//     let accentColor = theme.colors.info;
//     if (reminder.status === 'completed') accentColor = theme.colors.success;
//     else if (isPaused) accentColor = theme.colors.warning;
//     else if (reminder.status === 'cancelled') accentColor = theme.colors.textTertiary;
//     else if (isOverdue) accentColor = theme.colors.danger;

//     const toggleExpand = () => {
//         haptics.light();
//         setExpanded(!expanded);
//         expandProgress.value = withTiming(expanded ? 0 : 1, { duration: 300 });
//     };

//     const expandStyle = useAnimatedStyle(() => ({
//         maxHeight: `${expandProgress.value * 200 + 10}px` as any,
//         opacity: expandProgress.value,
//         marginTop: expandProgress.value * 12,
//         overflow: 'hidden'
//     }));

//     const renderRightActions = () => {
//         if (!onPause && !onResume) return null;
//         return (
//             <Pressable
//                 style={[styles.swipeAction, { backgroundColor: isActive ? theme.colors.warning : theme.colors.success }]}
//                 onPress={() => {
//                     haptics.selection();
//                     isActive ? onPause?.() : onResume?.();
//                 }}
//             >
//                 <AppIcon name={isActive ? 'pause' : 'play'} size={24} color="#FFF" />
//                 <Text style={styles.swipeText}>{isActive ? 'Pause' : 'Resume'}</Text>
//             </Pressable>
//         );
//     };

//     const renderLeftActions = () => {
//         if (!onDone || !isActive) return null;
//         return (
//             <Pressable
//                 style={[styles.swipeAction, styles.swipeLeftAction, { backgroundColor: theme.colors.success }]}
//                 onPress={() => {
//                     haptics.success();
//                     onDone();
//                 }}
//             >
//                 <AppIcon name="check-circle" size={24} color="#FFF" />
//                 <Text style={styles.swipeText}>Done</Text>
//             </Pressable>
//         );
//     };

//     return (
//         <Animated.View entering={FadeInDown.delay(Math.min(index * 50, 400)).duration(500).springify()}>
//             <Swipeable renderRightActions={renderRightActions} renderLeftActions={renderLeftActions} overshootRight={false} overshootLeft={false}>
//                 <AnimatedPressable
//                     onPress={toggleExpand}
//                     onPressIn={() => scale.value = withSpring(0.98)}
//                     onPressOut={() => scale.value = withSpring(1)}
//                     style={({ hovered }: any) => [
//                         { transform: [{ scale: scale.value }] },
//                         Platform.OS === 'web' && hovered && styles.cardHover
//                     ]}
//                 >
//                     <GlassCard style={styles.card}>
//                         <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
//                         <View style={styles.content}>
//                             {/* Top Row */}
//                             <View style={styles.topRow}>
//                                 <View style={[styles.iconWrap, { backgroundColor: accentColor + '15' }]}>
//                                     <AppIcon name={reminder.type === 'payment' ? 'credit-card' : 'bell'} size={18} color={accentColor} />
//                                 </View>
//                                 <View style={styles.titleWrap}>
//                                     <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
//                                         {reminder.title}
//                                     </Text>
//                                     {reminder.tripName && (
//                                         <Text style={[styles.tripName, { color: theme.colors.primary }]} numberOfLines={1}>
//                                             🧳 {reminder.tripName}
//                                         </Text>
//                                     )}
//                                 </View>
//                                 {isOverdue && <Badge label="OVERDUE" variant="danger" />}
//                                 {!isOverdue && <Badge label={reminder.status.toUpperCase()} variant={isActive ? 'primary' : isPaused ? 'warning' : 'success'} />}
//                             </View>

//                             {/* Message */}
//                             <Text style={[styles.message, { color: theme.colors.textSecondary }]} numberOfLines={expanded ? 10 : 2}>
//                                 {escalation.emoji} {reminder.message}
//                             </Text>

//                             {/* Highlights (Avatar & Amount) */}
//                             <View style={styles.highlightsRow}>
//                                 {reminder.targetUserName && (
//                                     <View style={styles.highlightPill}>
//                                         <View style={[styles.avatar, { backgroundColor: theme.colors.primaryBg }]}>
//                                             <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
//                                                 {getInitials(reminder.targetUserName)}
//                                             </Text>
//                                         </View>
//                                         <Text style={[styles.highlightText, { color: theme.colors.textSecondary }]}>
//                                             {reminder.targetUserName}
//                                         </Text>
//                                     </View>
//                                 )}
//                                 {amount && (
//                                     <View style={styles.highlightPill}>
//                                         <AppIcon name="dollar-sign" size={14} color={theme.colors.textTertiary} />
//                                         <Text style={[styles.highlightText, { color: theme.colors.textSecondary, fontWeight: '700' }]}>
//                                             ₹{amount}
//                                         </Text>
//                                     </View>
//                                 )}
//                             </View>

//                             {/* Schedule row */}
//                             <View style={styles.scheduleRow}>
//                                 <View style={styles.scheduleItem}>
//                                     <AppIcon name={freqIcon} size={12} color={theme.colors.textTertiary} />
//                                     <Text style={[styles.scheduleText, { color: theme.colors.textTertiary }]}>
//                                         {reminder.frequency === 'once' ? 'One time' : reminder.frequency === 'custom_days' ? `Every ${reminder.customDays || '?'}d` : reminder.frequency}
//                                     </Text>
//                                 </View>
//                                 <View style={styles.scheduleItem}>
//                                     <AppIcon name="clock" size={12} color={theme.colors.textTertiary} />
//                                     <Text style={[styles.scheduleText, { color: isOverdue ? theme.colors.danger : theme.colors.textTertiary }]}>
//                                         {reminder.status === 'completed' && reminder.lastTriggeredAt
//                                             ? `Finished: ${formatDistanceToNow(new Date(reminder.lastTriggeredAt), { addSuffix: true })}`
//                                             : reminder.nextTriggerAt
//                                                 ? `Next: ${format(new Date(reminder.nextTriggerAt), 'MMM d, h:mm a')}`
//                                                 : 'No schedule'}
//                                     </Text>
//                                 </View>
//                             </View>

//                             {/* Expanded Details */}
//                             <Animated.View style={expandStyle}>
//                                 <View style={[styles.expandedDivider, { backgroundColor: theme.colors.borderLight }]} />

//                                 {/* Escalation Config */}
//                                 {isActive && (
//                                     <View style={[styles.escalationBox, { backgroundColor: escalation.color + '15' }]}>
//                                         <Text style={styles.escalationEmoji}>{escalation.emoji}</Text>
//                                         <View style={styles.escalationDots}>
//                                             {[0, 1, 2, 3].map((level) => (
//                                                 <View key={level} style={[styles.escalationDot, {
//                                                     backgroundColor: level <= reminder.escalationLevel ? escalation.color : theme.colors.borderLight,
//                                                     width: level === reminder.escalationLevel ? 24 : 8,
//                                                 }]} />
//                                             ))}
//                                         </View>
//                                         <Text style={[styles.escalationLabel, { color: escalation.color }]}>{escalation.label} Escalation</Text>
//                                     </View>
//                                 )}

//                                 {/* Additional Meta */}
//                                 <View style={styles.metaGrid}>
//                                     <View style={styles.metaItem}>
//                                         <Text style={[styles.metaLabel, { color: theme.colors.textTertiary }]}>Created</Text>
//                                         <Text style={[styles.metaValue, { color: theme.colors.textSecondary }]}>
//                                             {format(new Date(reminder.createdAt), 'MMM d, yyyy')}
//                                         </Text>
//                                     </View>
//                                     <View style={styles.metaItem}>
//                                         <Text style={[styles.metaLabel, { color: theme.colors.textTertiary }]}>Triggers</Text>
//                                         <Text style={[styles.metaValue, { color: theme.colors.textSecondary }]}>
//                                             {reminder.triggerCount} times
//                                         </Text>
//                                     </View>
//                                     {Array.isArray(reminder.channels) && reminder.channels.length > 0 && (
//                                         <View style={styles.metaItem}>
//                                             <Text style={[styles.metaLabel, { color: theme.colors.textTertiary }]}>Channels</Text>
//                                             <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
//                                                 {reminder.channels.map(c => (
//                                                     <AppIcon key={c} name={c === 'push' ? 'smartphone' : c === 'email' ? 'mail' : 'message-square'} size={14} color={theme.colors.textSecondary} />
//                                                 ))}
//                                             </View>
//                                         </View>
//                                     )}
//                                 </View>

//                                 {/* Actions */}
//                                 <View style={styles.actionsRow}>
//                                     {isActive && onPause && (
//                                         <Pressable style={[styles.actionBtn, { borderColor: theme.colors.warning }]} onPress={onPause}>
//                                             <AppIcon name="pause" size={14} color={theme.colors.warning} />
//                                             <Text style={[styles.actionText, { color: theme.colors.warning }]}>Pause</Text>
//                                         </Pressable>
//                                     )}
//                                     {isPaused && onResume && (
//                                         <Pressable style={[styles.actionBtn, { backgroundColor: theme.colors.success, borderWidth: 0 }]} onPress={onResume}>
//                                             <AppIcon name="play" size={14} color="#FFF" />
//                                             <Text style={[styles.actionText, { color: '#FFF' }]}>Resume</Text>
//                                         </Pressable>
//                                     )}
//                                     {onCancel && (
//                                         <Pressable style={[styles.actionBtn, { borderColor: theme.colors.danger }]} onPress={onCancel}>
//                                             <AppIcon name="x" size={14} color={theme.colors.danger} />
//                                             <Text style={[styles.actionText, { color: theme.colors.danger }]}>Cancel</Text>
//                                         </Pressable>
//                                     )}
//                                 </View>
//                             </Animated.View>
//                         </View>
//                     </GlassCard>
//                 </AnimatedPressable>
//             </Swipeable>
//         </Animated.View>
//     );
// });

// const styles = StyleSheet.create({
//     card: {
//         borderRadius: 20,
//         borderWidth: 1,
//         flexDirection: 'row',
//         overflow: 'hidden',
//         marginBottom: 16,
//     },
//     cardHover: {
//         transform: [{ translateY: -2 }],
//         boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
//     } as any,
//     cardAccent: {
//         width: 6,
//     },
//     content: {
//         flex: 1,
//         padding: 16,
//     },
//     topRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 12,
//         marginBottom: 12,
//     },
//     iconWrap: {
//         width: 40,
//         height: 40,
//         borderRadius: 12,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     titleWrap: {
//         flex: 1,
//     },
//     title: {
//         fontSize: 16,
//         fontWeight: '800',
//     },
//     tripName: {
//         fontSize: 12,
//         fontWeight: '600',
//         marginTop: 2,
//     },
//     message: {
//         fontSize: 14,
//         fontWeight: '500',
//         lineHeight: 20,
//         marginBottom: 12,
//     },
//     highlightsRow: {
//         flexDirection: 'row',
//         gap: 12,
//         marginBottom: 12,
//     },
//     highlightPill: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//     },
//     avatar: {
//         width: 20,
//         height: 20,
//         borderRadius: 10,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     avatarText: {
//         fontSize: 9,
//         fontWeight: '800',
//     },
//     highlightText: {
//         fontSize: 13,
//         fontWeight: '600',
//     },
//     scheduleRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 16,
//     },
//     scheduleItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//     },
//     scheduleText: {
//         fontSize: 12,
//         fontWeight: '600',
//     },
//     expandedDivider: {
//         height: 1,
//         width: '100%',
//         marginVertical: 12,
//     },
//     escalationBox: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 12,
//         borderRadius: 12,
//         gap: 12,
//         marginBottom: 12,
//     },
//     escalationEmoji: {
//         fontSize: 18,
//     },
//     escalationDots: {
//         flex: 1,
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 4,
//     },
//     escalationDot: {
//         height: 8,
//         borderRadius: 4,
//     },
//     escalationLabel: {
//         fontSize: 12,
//         fontWeight: '700',
//         textTransform: 'uppercase',
//         letterSpacing: 0.5,
//     },
//     metaGrid: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 16,
//         marginBottom: 16,
//     },
//     metaItem: {
//         minWidth: '30%',
//     },
//     metaLabel: {
//         fontSize: 11,
//         fontWeight: '600',
//         textTransform: 'uppercase',
//         letterSpacing: 0.5,
//         marginBottom: 4,
//     },
//     metaValue: {
//         fontSize: 13,
//         fontWeight: '600',
//     },
//     actionsRow: {
//         flexDirection: 'row',
//         gap: 12,
//     },
//     actionBtn: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//         paddingHorizontal: 16,
//         paddingVertical: 10,
//         borderRadius: 12,
//         borderWidth: 1,
//     },
//     actionText: {
//         fontSize: 13,
//         fontWeight: '700',
//     },
//     swipeAction: {
//         justifyContent: 'center',
//         alignItems: 'center',
//         width: 80,
//         borderTopRightRadius: 20,
//         borderBottomRightRadius: 20,
//         marginBottom: 16,
//     },
//     swipeLeftAction: {
//         borderTopRightRadius: 0,
//         borderBottomRightRadius: 0,
//         borderTopLeftRadius: 20,
//         borderBottomLeftRadius: 20,
//     },
//     swipeText: {
//         color: '#FFF',
//         fontSize: 12,
//         fontWeight: '700',
//         marginTop: 4,
//     }
// });
