import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  FadeInLeft,
  LinearTransition,
} from 'react-native-reanimated';
import { useTheme } from '../../../providers/ThemeProvider';
import { IItineraryDay } from '../../../types/travelPlan.types';
import AppIcon from '../../common/AppIcon';
import { haptics } from '../../../utils/haptics';

interface DayCardProps {
  day: IItineraryDay;
  index: number;
  isLast: boolean;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

function DayCard({ day, index, isLast, onEdit, onDelete }: DayCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);

  const toggleExpand = () => {
    haptics.light();
    setExpanded(!expanded);
  };

  // Clean Day Label formatting (prevents "DAY DAY 1" bug)
  const rawDay = String(day.day || index + 1);
  const dayLabel = rawDay.toLowerCase().startsWith('day')
    ? rawDay.toUpperCase()
    : `DAY ${rawDay}`;

  const dateLabel = day.date ? day.date : 'Date TBD';

  return (
    <Animated.View
      entering={FadeInLeft.delay(index * 60).springify()}
      layout={LinearTransition.springify()}
      style={styles.timelineRow}
    >
      {/* Timeline Vertical Track & Dot */}
      <View style={styles.timelineSidebar}>
        <View style={styles.dotContainer}>
          <View style={[styles.dotGlow, { backgroundColor: '#EA580C' }]} />
          <View
            style={[
              styles.dot,
              {
                borderColor: '#EA580C',
                backgroundColor: theme.isDark ? '#1E293B' : '#FFFFFF',
              },
            ]}
          >
            <Text style={[styles.dotNumber, { color: '#EA580C' }]}>
              {index + 1}
            </Text>
          </View>
        </View>
        {!isLast && (
          <View
            style={[
              styles.line,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(234,88,12,0.18)',
              },
            ]}
          />
        )}
      </View>

      {/* Content Card Wrapper */}
      <View style={styles.contentWrapper}>
        {/* Header Tag */}
        <View style={styles.dayMetaHeader}>
          <View
            style={[
              styles.dayBadge,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(234, 88, 12, 0.15)'
                  : '#FFF7ED',
              },
            ]}
          >
            <AppIcon name="calendar" size={11} color="#EA580C" />
            <Text style={styles.dayBadgeText}>{dayLabel}</Text>
          </View>
          <Text
            style={[styles.dateText, { color: theme.colors.textSecondary }]}
          >
            {dateLabel}
          </Text>
        </View>

        {/* Day Card */}
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: theme.isDark
                ? 'rgba(30, 41, 59, 0.75)'
                : '#FFFFFF',
              borderColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          {/* Card Top Title Row */}
          <Pressable onPress={toggleExpand} style={styles.cardHeader}>
            <View style={styles.titleBlock}>
              <View style={styles.destinationRow}>
                <View
                  style={[
                    styles.destPinWrap,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(234, 88, 12, 0.15)'
                        : '#FFF7ED',
                    },
                  ]}
                >
                  <AppIcon name="map-pin" size={14} color="#EA580C" />
                </View>
                <Text
                  style={[styles.dayTitle, { color: theme.colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {day.destination || 'Destination pending'}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                onPress={e => {
                  e.stopPropagation();
                  haptics.light();
                  onEdit(index);
                }}
                style={({ pressed }) => [
                  styles.iconBtn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : '#F1F5F9',
                  },
                  pressed && { opacity: 0.6 },
                ]}
                hitSlop={10}
              >
                <AppIcon
                  name="pencil"
                  size={13}
                  color={theme.colors.textSecondary}
                />
              </Pressable>

              <Pressable
                onPress={e => {
                  e.stopPropagation();
                  haptics.light();
                  onDelete(index);
                }}
                style={({ pressed }) => [
                  styles.iconBtn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : '#FEE2E2',
                  },
                  pressed && { opacity: 0.6 },
                ]}
                hitSlop={10}
              >
                <AppIcon name="trash" size={13} color="#EF4444" />
              </Pressable>

              <View style={styles.chevronWrap}>
                <AppIcon
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={theme.colors.textTertiary}
                />
              </View>
            </View>
          </Pressable>

          {/* Expandable Stops & Notes */}
          {expanded && (
            <Animated.View
              entering={FadeInLeft.duration(160)}
              style={[
                styles.detailsList,
                {
                  borderTopColor: theme.isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                },
              ]}
            >
              {/* Accommodation / Stay */}
              {day.accommodation ? (
                <View
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(15, 23, 42, 0.6)'
                        : '#F8FAFC',
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : '#F1F5F9',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(59, 130, 246, 0.18)'
                          : '#EFF6FF',
                      },
                    ]}
                  >
                    <AppIcon name="bed" size={14} color="#3B82F6" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailCategory}>STAY & CHECK-IN</Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textPrimary },
                      ]}
                      numberOfLines={2}
                    >
                      {day.accommodation}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Transport / Transit */}
              {day.transport ? (
                <View
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(15, 23, 42, 0.6)'
                        : '#F8FAFC',
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : '#F1F5F9',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(16, 185, 129, 0.18)'
                          : '#ECFDF5',
                      },
                    ]}
                  >
                    <AppIcon name="train" size={14} color="#10B981" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailCategory}>
                      TRANSPORT & COMMUTE
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textPrimary },
                      ]}
                      numberOfLines={2}
                    >
                      {day.transport}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Activity / Notes */}
              {day.notes ? (
                <View
                  style={[
                    styles.detailCard,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(15, 23, 42, 0.6)'
                        : '#F8FAFC',
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : '#F1F5F9',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: theme.isDark
                          ? 'rgba(139, 92, 246, 0.18)'
                          : '#F5F3FF',
                      },
                    ]}
                  >
                    <AppIcon name="compass" size={14} color="#8B5CF6" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailCategory}>
                      ACTIVITIES & NOTES
                    </Text>
                    <Text
                      style={[
                        styles.detailText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {day.notes}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Empty Prompt if no items added */}
              {!day.accommodation && !day.transport && !day.notes && (
                <Pressable
                  onPress={() => onEdit(index)}
                  style={({ pressed }) => [
                    styles.emptyDayAddBtn,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(234, 88, 12, 0.12)'
                        : '#FFF7ED',
                      borderColor: 'rgba(234, 88, 12, 0.25)',
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <AppIcon name="plus" size={13} color="#EA580C" />
                  <Text style={[styles.emptyDayAddText, { color: '#EA580C' }]}>
                    Add stays, transport or activities for this day
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export function ItineraryTimeline({
  days,
  onEdit,
  onDelete,
}: {
  days: IItineraryDay[];
  onEdit: (i: number) => void;
  onDelete: (i: number) => void;
}) {
  const theme = useTheme();

  if (!days || days.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
            borderColor: theme.isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <View
          style={[
            styles.emptyIconCircle,
            {
              backgroundColor: theme.isDark
                ? 'rgba(234, 88, 12, 0.15)'
                : '#FFF7ED',
            },
          ]}
        >
          <AppIcon name="map-pin" size={28} color="#EA580C" />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
          No itinerary days added yet
        </Text>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Plan your journey day-by-day with customized stops, stays, and
          activities.
        </Text>
        <Pressable
          onPress={() => onEdit(0)}
          style={({ pressed }) => [
            styles.emptyAddBtn,
            { backgroundColor: '#EA580C' },
            pressed && { opacity: 0.8 },
          ]}
        >
          <AppIcon name="plus" size={15} color="#FFFFFF" />
          <Text style={styles.emptyAddBtnText}>Add Day 1</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {days.map((day, index) => (
        <DayCard
          key={day._id || index}
          day={day}
          index={index}
          isLast={index === days.length - 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    width: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1.5,
    marginTop: 12,

    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
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
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 18,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,

    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
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

    cursor: 'pointer',
  } as any,
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  timelineRow: {
    flexDirection: 'row',
    width: '100%',
    paddingBottom: 16,
  },
  timelineSidebar: {
    width: 38,
    alignItems: 'center',
  },
  dotContainer: {
    width: 26,
    height: 26,
    marginTop: 18,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGlow: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    opacity: 0.15,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotNumber: {
    fontSize: 10,
    fontWeight: '900',
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: -20,
    borderRadius: 1,
  },

  contentWrapper: {
    flex: 1,
    paddingBottom: 4,
  },
  dayMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: '#EA580C',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },

  cardContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    cursor: 'pointer',
  } as any,
  titleBlock: {
    flex: 1,
    paddingRight: 10,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  destPinWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as any,
  chevronWrap: {
    marginLeft: 2,
  },

  detailsList: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    gap: 8,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },

  emptyDayAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    cursor: 'pointer',
  } as any,
  emptyDayAddText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
