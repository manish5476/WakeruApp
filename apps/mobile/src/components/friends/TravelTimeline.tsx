// components/friends/TravelTimeline.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';
import type { Theme } from '../../theme';

export interface TimelineEvent {
  id: string;
  type:
    'trip_completed' | 'settlement' | 'achievement' | 'friend_added' | string;
  title: string;
  description: string;
  date: string;
}

interface TravelTimelineProps {
  events: TimelineEvent[];
}

export function TravelTimeline({ events }: TravelTimelineProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!events || events.length === 0) return null;

  const getEventMeta = (type: string) => {
    switch (type) {
      case 'trip_completed':
        return {
          name: 'map-pin',
          color: '#2563EB',
          bg: '#EFF6FF',
          tag: 'EXPEDITION',
        };
      case 'settlement':
        return {
          name: 'dollar-sign',
          color: '#10B981',
          bg: '#ECFDF5',
          tag: 'SETTLEMENT',
        };
      case 'achievement':
        return {
          name: 'award',
          color: '#F59E0B',
          bg: '#FEF3C7',
          tag: 'ACHIEVEMENT',
        };
      case 'friend_added':
        return {
          name: 'user-plus',
          color: '#8B5CF6',
          bg: '#EDE9FE',
          tag: 'CONNECTED',
        };
      default:
        return {
          name: 'activity',
          color: '#06B6D4',
          bg: '#CFFAFE',
          tag: 'ACTIVITY',
        };
    }
  };

  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const meta = getEventMeta(event.type);

        let formattedDateStr = '';
        try {
          formattedDateStr = format(new Date(event.date), 'MMM d, yyyy');
        } catch {
          formattedDateStr = event.date;
        }

        return (
          <View key={event.id || index} style={styles.eventRow}>
            {/* Timeline Guide Column */}
            <View style={styles.timelineCol}>
              <View
                style={[
                  styles.nodeIconAura,
                  {
                    backgroundColor: theme.isDark ? `${meta.color}15` : meta.bg,
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(15,23,42,0.06)',
                  },
                ]}
              >
                <AppIcon name={meta.name as any} size={14} color={meta.color} />
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(15,23,42,0.06)',
                    },
                  ]}
                />
              )}
            </View>

            {/* Event Surface Card */}
            <View
              style={[
                styles.eventCard,
                { backgroundColor: theme.colors.surface },
                !isLast && { marginBottom: 14 },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: theme.isDark
                        ? `${meta.color}18`
                        : meta.bg,
                    },
                  ]}
                >
                  <Text style={[styles.tagBadgeText, { color: meta.color }]}>
                    {meta.tag}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.dateText,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {formattedDateStr}
                </Text>
              </View>

              <Text
                style={[styles.eventTitle, { color: theme.colors.textPrimary }]}
              >
                {event.title}
              </Text>

              {event.description ? (
                <Text
                  style={[
                    styles.eventDesc,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {event.description}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      paddingVertical: 4,
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    timelineCol: {
      width: 38,
      alignItems: 'center',
    },
    nodeIconAura: {
      width: 32,
      height: 32,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      zIndex: 2,
    },
    connectorLine: {
      width: 2,
      flex: 1,
      marginVertical: 4,
      borderRadius: 1,
    },
    eventCard: {
      flex: 1,
      marginLeft: 12,
      padding: 14,
      borderRadius: 18,
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

      gap: 4,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    tagBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    tagBadgeText: {
      fontSize: 8.5,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    dateText: {
      fontSize: 10.5,
      fontWeight: '600',
    },
    eventTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    eventDesc: {
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '500',
    },
  });
}
