import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  RefreshControl,
  ScrollView,
  Pressable,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { remindersApi } from '../../services/api/reminders.api';
import { useIncomingReminders } from '../../hooks/useReminders';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';

import AppIcon from '../../components/common/AppIcon';
import GlobalLoader from '../../components/common/GlobalLoader';
import { GlobalBackground } from '../../components/ui/GlobalBackground';

import {
  ReminderAPIModel,
  calculateCompletionRate,
  groupRemindersByTimeline,
  TimelineGroup,
} from '../../utils/reminder.utils';

import { ReminderCard } from '../../components/reminders/ReminderCard';
import { PaymentReminderCard } from '../../components/reminders/PaymentReminderCard';
import { ReminderEmptyState } from '../../components/reminders/ReminderEmptyState';
import { ReminderFAB } from '../../components/reminders/ReminderFAB';
import { CreateReminderModal } from './CreateReminderModal';

import type { Theme } from '../../theme';

const FILTER_PILLS = [
  { key: 'All', label: 'All', icon: 'layers' },
  { key: 'Active', label: 'Active', icon: 'bell' },
  { key: 'Payment', label: 'Payment Pings', icon: 'dollar-sign' },
  { key: 'High Priority', label: 'High Priority', icon: 'alert-triangle' },
  { key: 'Completed', label: 'Completed', icon: 'check-circle' },
  { key: 'Paused', label: 'Paused', icon: 'pause-circle' },
];

export default function RemindersScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 860;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);

  // Queries
  const {
    data: remindersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersApi.getMyReminders(),
  });

  const {
    data: incomingRemindersData,
    isLoading: isLoadingIncoming,
    refetch: refetchIncoming,
  } = useIncomingReminders();

  const handleRefetch = useCallback(() => {
    refetch();
    refetchIncoming();
  }, [refetch, refetchIncoming]);

  const allReminders: ReminderAPIModel[] = useMemo(() => {
    const myReminders = remindersData?.data?.reminders || [];
    const incomingReminders = incomingRemindersData || [];
    const combined = [...myReminders, ...incomingReminders];
    return Array.from(new Map(combined.map(item => [item._id, item])).values());
  }, [remindersData, incomingRemindersData]);

  // Mutations
  const pauseMutation = useMutation({
    mutationFn: (id: string) => remindersApi.pause(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => remindersApi.resume(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => remindersApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const pingMutation = useMutation({
    mutationFn: (data: any) => remindersApi.pingUser(data),
    onSuccess: () => {
      haptics.success();
      Alert.alert('Ping Sent!', 'They have been reminded successfully.');
    },
  });

  // Aggregated Counts
  const activeCount = useMemo(
    () => allReminders.filter(r => r.status === 'active').length,
    [allReminders],
  );
  const completedCount = useMemo(
    () => allReminders.filter(r => r.status === 'completed').length,
    [allReminders],
  );
  //   const overdueCount = useMemo(() => allReminders.filter((r) => r.status === 'overdue' || (r.dueDate && new Date(r.dueDate) < new Date() && r.status === 'active')).length, [allReminders]);
  const paymentCount = useMemo(
    () =>
      allReminders.filter(r => r.type === 'payment' || r.type === 'settlement')
        .length,
    [allReminders],
  );
  const completionRate = useMemo(
    () => calculateCompletionRate(allReminders),
    [allReminders],
  );
  const overdueCount = useMemo(
    () =>
      allReminders.filter(
        r =>
          r.status === 'active' &&
          Boolean(r.dueDate) &&
          new Date(r.dueDate as unknown as string | number | Date).getTime() <
            Date.now(),
      ).length,
    [allReminders],
  );
  // Filtering & Searching
  const filteredReminders = useMemo(() => {
    let filtered = [...allReminders];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.title?.toLowerCase().includes(query) ||
          r.message?.toLowerCase().includes(query) ||
          (r.targetUserName &&
            r.targetUserName.toLowerCase().includes(query)) ||
          (r.tripName && r.tripName.toLowerCase().includes(query)),
      );
    }
    switch (activeFilter) {
      case 'Active':
        filtered = filtered.filter(r => r.status === 'active');
        break;
      case 'Completed':
        filtered = filtered.filter(r => r.status === 'completed');
        break;
      case 'Paused':
        filtered = filtered.filter(r => r.status === 'paused');
        break;
      case 'Payment':
        filtered = filtered.filter(
          r => r.type === 'payment' || r.type === 'settlement',
        );
        break;
      case 'High Priority':
        filtered = filtered.filter(r => r.escalationLevel >= 2);
        break;
      default:
        break;
    }
    return filtered;
  }, [allReminders, searchQuery, activeFilter]);

  const sections = useMemo(() => {
    const grouped = groupRemindersByTimeline(filteredReminders);
    const order: TimelineGroup[] = [
      'Overdue',
      'Today',
      'Tomorrow',
      'This Week',
      'Later',
      'Completed',
      'Paused',
      'Cancelled',
    ];
    return order
      .filter(key => grouped[key] && grouped[key].length > 0)
      .map(key => ({ title: key, data: grouped[key] }));
  }, [filteredReminders]);

  const renderItem = (item: ReminderAPIModel, index: number) => {
    const handleCancel = () => {
      Alert.alert(
        'Cancel Reminder',
        'Are you sure you want to cancel this reminder?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes, Cancel',
            onPress: () => cancelMutation.mutate(item._id),
            style: 'destructive',
          },
        ],
      );
    };

    const handlePing = () => {
      if (item.targetUserId) {
        pingMutation.mutate({
          targetUserId: item.targetUserId,
          amount: 0,
          tripName: item.tripName || 'Trip',
          message: item.message,
          expenseTitle: item.title,
        });
      }
    };

    if (item.type === 'payment' || item.type === 'settlement') {
      return (
        <View key={item._id} style={styles.cardCol}>
          <PaymentReminderCard
            reminder={item}
            index={index}
            onDone={() => cancelMutation.mutate(item._id)}
            onPing={handlePing}
          />
        </View>
      );
    }

    return (
      <View key={item._id} style={styles.cardCol}>
        <ReminderCard
          reminder={item}
          index={index}
          onDone={() => cancelMutation.mutate(item._id)}
          onPause={() => pauseMutation.mutate(item._id)}
          onResume={() => resumeMutation.mutate(item._id)}
          onCancel={handleCancel}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <GlobalBackground>
        <View style={styles.loadingContainer}>
          <GlobalLoader
            variant="inline"
            size="large"
            color={theme.colors.primary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading reminders…
          </Text>
        </View>
      </GlobalBackground>
    );
  }

  return (
    <GlobalBackground>
      <View style={styles.container}>
        {/* Sticky Header Bar */}
        <View
          style={[
            styles.headerBar,
            { paddingTop: Platform.OS === 'web' ? 20 : insets.top + 10 },
          ]}
        >
          <View
            style={[styles.headerInner, isDesktop && styles.desktopHeaderInner]}
          >
            <View style={styles.headerLeft}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  router.back();
                }}
                style={({ pressed }) => [
                  styles.backBtn,
                  { backgroundColor: theme.colors.surface },
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
              >
                <AppIcon
                  name="arrow-left"
                  size={18}
                  color={theme.colors.textPrimary}
                />
              </Pressable>

              <View>
                <Text
                  style={[
                    styles.headerTitle,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  Reminders Command Center
                </Text>
                <Text
                  style={[
                    styles.headerSub,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  {activeCount} active tasks · {paymentCount} settlement
                  follow-ups
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={handleRefetch}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: theme.colors.surface },
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
              >
                <AppIcon
                  name="refresh-cw"
                  size={15}
                  color={theme.colors.textSecondary}
                />
              </Pressable>

              {isDesktop && (
                <Pressable
                  onPress={() => {
                    haptics.light();
                    setShowCreate(true);
                  }}
                  style={styles.desktopCreateBtn}
                >
                  <AppIcon name="plus" size={15} color="#FFFFFF" />
                  <Text style={styles.desktopCreateText}>New Reminder</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.listContent,
            isDesktop && styles.desktopListContent,
            { paddingBottom: insets.bottom + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading || isLoadingIncoming}
              onRefresh={handleRefetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          <View style={styles.mainWrapper}>
            {/* ── UNIFIED EXECUTIVE BENTO HERO ROW ── */}
            <View
              style={[styles.heroBentoRow, !isDesktop && styles.stackLayout]}
            >
              {/* Tile 1: Command Center Overview (Gradient Hero) */}
              <LinearGradient
                colors={['#0F172A', '#1E1B4B', '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.heroCard, isDesktop && { flex: 1.5 }]}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroTitleGroup}>
                    <Text style={styles.heroLabel}>EXECUTION OVERVIEW</Text>
                    <Text style={styles.heroTitle}>
                      {allReminders.length} Total Task
                      {allReminders.length !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <View style={styles.resolutionPill}>
                    <AppIcon name="check-circle" size={14} color="#34D399" />
                    <Text style={styles.resolutionRateText}>
                      {completionRate.toFixed(0)}% Resolved
                    </Text>
                  </View>
                </View>

                <View style={styles.heroStatsStrip}>
                  <View style={styles.heroStatItem}>
                    <Text style={[styles.heroStatValue, { color: '#38BDF8' }]}>
                      {activeCount}
                    </Text>
                    <Text style={styles.heroStatLabel}>ACTIVE</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={[styles.heroStatValue, { color: '#F87171' }]}>
                      {overdueCount}
                    </Text>
                    <Text style={styles.heroStatLabel}>OVERDUE</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={[styles.heroStatValue, { color: '#34D399' }]}>
                      {completedCount}
                    </Text>
                    <Text style={styles.heroStatLabel}>DONE</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Tile 2: Action Focus Tile (Payment Pings & Settlements) */}
              <View
                style={[
                  styles.actionFocusTile,
                  { backgroundColor: theme.colors.surface },
                  isDesktop && { flex: 1 },
                ]}
              >
                <View style={styles.focusHeader}>
                  <View
                    style={[
                      styles.focusIconWrap,
                      { backgroundColor: '#ECFDF5' },
                    ]}
                  >
                    <AppIcon name="dollar-sign" size={16} color="#10B981" />
                  </View>
                  <Text style={[styles.focusTag, { color: '#10B981' }]}>
                    PAYMENT SETTLEMENTS
                  </Text>
                </View>

                <Text
                  style={[
                    styles.focusValue,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {paymentCount} Pending Ping{paymentCount !== 1 ? 's' : ''}
                </Text>
                <Text
                  style={[
                    styles.focusSub,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {paymentCount > 0
                    ? 'Remind members to clear outstanding balances'
                    : 'All trip expense splits are currently settled'}
                </Text>

                <Pressable
                  onPress={() => setActiveFilter('Payment')}
                  style={styles.focusActionLink}
                >
                  <Text
                    style={[
                      styles.focusActionText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    View Payment Pings
                  </Text>
                  <AppIcon
                    name="arrow-right"
                    size={13}
                    color={theme.colors.primary}
                  />
                </Pressable>
              </View>
            </View>

            {/* ── SLEEK SEARCH & FILTER TOOLBAR ── */}
            <View
              style={[
                styles.toolbarContainer,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              {/* Search Bar */}
              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: theme.colors.background },
                ]}
              >
                <AppIcon
                  name="search"
                  size={16}
                  color={theme.colors.textTertiary}
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: theme.colors.textPrimary },
                  ]}
                  placeholder="Search by trip, member name, description..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                    <AppIcon
                      name="x"
                      size={14}
                      color={theme.colors.textTertiary}
                    />
                  </Pressable>
                )}
              </View>

              {/* Horizontal Pill Filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPillsRow}
              >
                {FILTER_PILLS.map(pill => {
                  const isActive = activeFilter === pill.key;
                  return (
                    <Pressable
                      key={pill.key}
                      onPress={() => {
                        haptics.light();
                        setActiveFilter(pill.key);
                      }}
                      style={[
                        styles.filterPill,
                        isActive
                          ? { backgroundColor: theme.colors.primary }
                          : { backgroundColor: theme.colors.background },
                      ]}
                    >
                      <AppIcon
                        name={pill.icon as any}
                        size={12}
                        color={
                          isActive ? '#FFFFFF' : theme.colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.filterPillText,
                          {
                            color: isActive
                              ? '#FFFFFF'
                              : theme.colors.textSecondary,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {pill.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── TIMELINE SECTIONS & BALANCED GRID ── */}
            {sections.length === 0 ? (
              <ReminderEmptyState filter={activeFilter} />
            ) : (
              sections.map(section => (
                <View key={section.title} style={styles.timelineSection}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleGroup}>
                      <View
                        style={[
                          styles.timelineStatusDot,
                          {
                            backgroundColor:
                              section.title === 'Overdue'
                                ? '#EF4444'
                                : section.title === 'Today'
                                  ? '#2563EB'
                                  : section.title === 'Completed'
                                    ? '#10B981'
                                    : theme.colors.textTertiary,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {section.title}
                      </Text>
                    </View>

                    <View style={styles.sectionBadge}>
                      <Text
                        style={[
                          styles.sectionBadgeText,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {section.data.length}
                      </Text>
                    </View>
                  </View>

                  {/* Adaptive Grid: 2 columns on Desktop for balanced width */}
                  <View style={styles.cardsGrid}>
                    {section.data.map((item, index) => renderItem(item, index))}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Floating Action Button (Mobile Only) */}
        {!isDesktop && (
          <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
            <ReminderFAB
              onPress={() => {
                haptics.light();
                setShowCreate(true);
              }}
              onLongPress={() => {
                haptics.light();
                setShowCreate(true);
              }}
            />
          </View>
        )}

        <CreateReminderModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
        />
      </View>
    </GlobalBackground>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    scrollView: { flex: 1 },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
    },
    loadingText: { fontSize: 13, fontWeight: '600' },

    // Header Bar
    headerBar: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
      zIndex: 10,
    },
    headerInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    desktopHeaderInner: {
      maxWidth: 1300,
      alignSelf: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    headerSub: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    desktopCreateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    desktopCreateText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },

    // Content Wrapper
    listContent: {
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    desktopListContent: {
      maxWidth: 1300,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 24,
    },
    mainWrapper: {
      gap: 16,
    },

    // Bento Hero Top Cluster
    heroBentoRow: {
      flexDirection: 'row',
      gap: 14,
      alignItems: 'stretch',
    },
    stackLayout: {
      flexDirection: 'column',
    },
    heroCard: {
      borderRadius: 22,
      padding: 20,
      justifyContent: 'space-between',

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

      gap: 16,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    heroTitleGroup: {
      gap: 3,
    },
    heroLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: 0.8,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    resolutionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    resolutionRateText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#34D399',
    },
    heroStatsStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    heroStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    heroStatValue: {
      fontSize: 18,
      fontWeight: '900',
    },
    heroStatLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.6)',
      letterSpacing: 0.6,
      marginTop: 2,
    },
    heroDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },

    // Action Focus Tile
    actionFocusTile: {
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

      justifyContent: 'space-between',
      gap: 8,
    },
    focusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    focusIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    focusTag: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    focusValue: {
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    focusSub: {
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 16,
    },
    focusActionLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    focusActionText: {
      fontSize: 12,
      fontWeight: '800',
    },

    // Toolbar
    toolbarContainer: {
      borderRadius: 20,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      gap: 10,

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
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      padding: 0,
    },
    filterPillsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    filterPillText: {
      fontSize: 11,
    },

    // Timeline Sections
    timelineSection: {
      gap: 10,
      marginTop: 6,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    sectionTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timelineStatusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    sectionBadge: {
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    sectionBadgeText: {
      fontSize: 11,
      fontWeight: '800',
    },

    // Adaptive Cards Grid
    cardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    cardCol: {
      flex: 1,
      minWidth: Platform.OS === 'web' ? 380 : '100%',
    },

    // FAB
    fabContainer: {
      position: 'absolute',
      right: 20,
      zIndex: 100,
    },
  });
} // import React, { useState, useMemo } from 'react';
// import {
//     View,
//     StyleSheet,
//     Platform,
//     Alert,
//     RefreshControl,
//     ScrollView,
// } from 'react-native';
// import { router } from 'expo-router';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// import { remindersApi } from '../../services/api/reminders.api';
// import { useIncomingReminders } from '../../hooks/useReminders';
// import { useTheme } from '../../providers/ThemeProvider';
// import { useResponsive } from '../../hooks/useResponsive';
// import { haptics } from '../../utils/haptics';

// import AppIcon from '../../components/common/AppIcon';
// import GlobalLoader from '../../components/common/GlobalLoader';
// import { GlobalBackground } from '../../components/ui/GlobalBackground';
// import { Typography } from '../../components/ui/Typography';
// import { GlassCard } from '../../components/ui/GlassCard';
// import { Grid } from '../../components/ui/Grid';
// import { InteractiveWrapper } from '../../components/ui/InteractiveWrapper';

// import { ReminderAPIModel, calculateCompletionRate, groupRemindersByTimeline, TimelineGroup } from '../../utils/reminder.utils';

// import { ReminderSummaryCard } from '../../components/reminders/ReminderSummaryCard';
// import { ReminderInsights } from '../../components/reminders/ReminderInsights';
// import { ReminderFilterBar } from '../../components/reminders/ReminderFilterBar';
// import { ReminderSearchBar } from '../../components/reminders/ReminderSearchBar';
// import { ReminderCard } from '../../components/reminders/ReminderCard';
// import { PaymentReminderCard } from '../../components/reminders/PaymentReminderCard';
// import { ReminderEmptyState } from '../../components/reminders/ReminderEmptyState';
// import { ReminderFAB } from '../../components/reminders/ReminderFAB';
// import { CreateReminderModal } from './CreateReminderModal';

// import type { Theme } from '../../theme';

// export default function RemindersScreen() {
//     const theme = useTheme();
//     const styles = useMemo(() => createStyles(theme), [theme]);
//     const insets = useSafeAreaInsets();
//     const queryClient = useQueryClient();

//     const { isDesktop, isTablet, width } = useResponsive();

//     // State
//     const [searchQuery, setSearchQuery] = useState('');
//     const [activeFilter, setActiveFilter] = useState('All');
//     const [showCreate, setShowCreate] = useState(false);

//     // Queries
//     const { data: remindersData, isLoading, refetch } = useQuery({
//         queryKey: ['reminders'],
//         queryFn: () => remindersApi.getMyReminders()
//     });

//     const { data: incomingRemindersData, isLoading: isLoadingIncoming, refetch: refetchIncoming } = useIncomingReminders();

//     const handleRefetch = () => {
//         refetch();
//         refetchIncoming();
//     };

//     const allReminders: ReminderAPIModel[] = useMemo(() => {
//         const myReminders = remindersData?.data?.reminders || [];
//         const incomingReminders = incomingRemindersData || [];
//         const combined = [...myReminders, ...incomingReminders];
//         return Array.from(new Map(combined.map(item => [item._id, item])).values());
//     }, [remindersData, incomingRemindersData]);

//     // Mutations
//     const pauseMutation = useMutation({
//         mutationFn: (id: string) => remindersApi.pause(id),
//         onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] })
//     });

//     const resumeMutation = useMutation({
//         mutationFn: (id: string) => remindersApi.resume(id),
//         onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] })
//     });

//     const cancelMutation = useMutation({
//         mutationFn: (id: string) => remindersApi.cancel(id),
//         onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] })
//     });

//     const pingMutation = useMutation({
//         mutationFn: (data: any) => remindersApi.pingUser(data),
//         onSuccess: () => {
//             haptics.success();
//             Alert.alert('Ping Sent!', 'They have been reminded successfully.');
//         }
//     });

//     // Filtering & Searching
//     const filteredReminders = useMemo(() => {
//         let filtered = [...allReminders];
//         if (searchQuery.trim()) {
//             const query = searchQuery.toLowerCase();
//             filtered = filtered.filter(r =>
//                 r.title.toLowerCase().includes(query) ||
//                 r.message.toLowerCase().includes(query) ||
//                 (r.targetUserName && r.targetUserName.toLowerCase().includes(query)) ||
//                 (r.tripName && r.tripName.toLowerCase().includes(query))
//             );
//         }
//         switch (activeFilter) {
//             case 'Active': filtered = filtered.filter(r => r.status === 'active'); break;
//             case 'Completed': filtered = filtered.filter(r => r.status === 'completed'); break;
//             case 'Paused': filtered = filtered.filter(r => r.status === 'paused'); break;
//             case 'Cancelled': filtered = filtered.filter(r => r.status === 'cancelled'); break;
//             case 'Payment': filtered = filtered.filter(r => r.type === 'payment' || r.type === 'settlement'); break;
//             case 'Custom': filtered = filtered.filter(r => r.type === 'custom'); break;
//             case 'Recurring': filtered = filtered.filter(r => r.frequency !== 'once'); break;
//             case 'One Time': filtered = filtered.filter(r => r.frequency === 'once'); break;
//             case 'High Priority': filtered = filtered.filter(r => r.escalationLevel >= 2); break;
//             default: break;
//         }
//         return filtered;
//     }, [allReminders, searchQuery, activeFilter]);

//     const sections = useMemo(() => {
//         const grouped = groupRemindersByTimeline(filteredReminders);
//         const order: TimelineGroup[] = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Later', 'Completed', 'Paused', 'Cancelled'];
//         return order
//             .filter(key => grouped[key] && grouped[key].length > 0)
//             .map(key => ({ title: key, data: grouped[key] }));
//     }, [filteredReminders]);

//     const completionRate = useMemo(() => calculateCompletionRate(allReminders), [allReminders]);

//     // Render Helpers
//     const renderItem = ({ item, index }: { item: ReminderAPIModel, index: number }) => {
//         const handleCancel = () => {
//             Alert.alert('Cancel Reminder', 'Are you sure?', [
//                 { text: 'No', style: 'cancel' },
//                 { text: 'Yes', onPress: () => cancelMutation.mutate(item._id), style: 'destructive' }
//             ]);
//         };

//         const handlePing = () => {
//             if (item.targetUserId) {
//                 pingMutation.mutate({
//                     targetUserId: item.targetUserId,
//                     amount: 0,
//                     tripName: item.tripName || 'Trip',
//                     message: item.message,
//                     expenseTitle: item.title
//                 });
//             }
//         };

//         if (item.type === 'payment' || item.type === 'settlement') {
//             return (
//                 <PaymentReminderCard
//                     key={item._id}
//                     reminder={item}
//                     index={index}
//                     onDone={() => cancelMutation.mutate(item._id)}
//                     onPing={handlePing}
//                 />
//             );
//         }

//         return (
//             <ReminderCard
//                 key={item._id}
//                 reminder={item}
//                 index={index}
//                 onDone={() => cancelMutation.mutate(item._id)}
//                 onPause={() => pauseMutation.mutate(item._id)}
//                 onResume={() => resumeMutation.mutate(item._id)}
//                 onCancel={handleCancel}
//             />
//         );
//     };

//     if (isLoading) {
//         return (
//             <GlobalBackground>
//                 <View style={styles.loadingContainer}>
//                     <GlobalLoader variant="inline" size="large" color={theme.colors.primary} />
//                     <Typography variant="bodySm" color="textSecondary" style={{ marginTop: theme.spacing[3] }}>
//                         Loading reminders…
//                     </Typography>
//                 </View>
//             </GlobalBackground>
//         );
//     }

//     return (
//         <GlobalBackground>
//             <View style={styles.container}>
//                 <ScrollView
//                     style={styles.scrollView}
//                     contentContainerStyle={[
//                         styles.listContent,
//                         { paddingTop: insets.top + theme.spacing[3] },
//                     ]}
//                     showsVerticalScrollIndicator={false}
//                     refreshControl={
//                         <RefreshControl
//                             refreshing={isLoading || isLoadingIncoming}
//                             onRefresh={handleRefetch}
//                             tintColor={theme.colors.primary}
//                         />
//                     }
//                 >
//                     <View style={[styles.maxWidthContainer, { paddingHorizontal: isDesktop ? theme.spacing[8] : theme.spacing[4] }]}>

//                         {/* ── HEADER ── */}
//                         <View style={styles.headerRow}>
//                             <InteractiveWrapper onPress={() => { haptics.light(); router.back(); }} hoverElevation={false}>
//                                 <GlassCard variant="subtle" padding="sm" style={styles.headerBackBtn}>
//                                     <AppIcon name="arrow-left" size={24} color={theme.colors.textPrimary} />
//                                 </GlassCard>
//                             </InteractiveWrapper>
//                             <Typography variant="h2" weight="extrabold" color="textPrimary" style={{ flex: 1, textAlign: 'center' }}>
//                                 Reminders
//                             </Typography>
//                             <View style={{ width: theme.spacing[11] }} />
//                         </View>

//                         {/* ── TOP INSIGHTS ── */}
//                         <View style={styles.insightsWrapper}>
//                             <ReminderSummaryCard reminders={allReminders} completionRate={completionRate} />
//                             <ReminderInsights reminders={allReminders} />
//                         </View>

//                         {/* ── FILTERS & SEARCH ── */}
//                         <View style={[styles.filtersWrapper, isDesktop && styles.filtersWrapperDesktop]}>
//                             <ReminderFilterBar
//                                 activeFilter={activeFilter}
//                                 onSelectFilter={(f) => { haptics.light(); setActiveFilter(f); }}
//                             />
//                             <ReminderSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
//                         </View>

//                         {/* ── REMINDER GRID ── */}
//                         {sections.length === 0 ? (
//                             <ReminderEmptyState filter={activeFilter} />
//                         ) : (
//                             sections.map((section) => (
//                                 <View key={section.title} style={styles.sectionWrapper}>
//                                     <Typography variant="h3" weight="extrabold" color="textPrimary" style={styles.sectionTitle}>
//                                         {section.title}
//                                     </Typography>
//                                     <Grid cols={isDesktop ? 3 : isTablet ? 2 : 1} gap={theme.spacing[3]}>
//                                         {section.data.map((item, index) => renderItem({ item, index }))}
//                                     </Grid>
//                                 </View>
//                             ))
//                         )}

//                         <View style={{ height: theme.spacing['5xl'] }} />
//                     </View>
//                 </ScrollView>

//                 {/* ── FAB ── */}
//                 <View style={[styles.fabContainer, { bottom: insets.bottom + theme.spacing[10] }]}>
//                     <ReminderFAB
//                         onPress={() => { haptics.light(); setShowCreate(true); }}
//                         onLongPress={() => { haptics.light(); setShowCreate(true); }}
//                     />
//                 </View>

//                 <CreateReminderModal
//                     visible={showCreate}
//                     onClose={() => setShowCreate(false)}
//                 />
//             </View>
//         </GlobalBackground>
//     );
// }

// // ============================================================
// // STYLES
// // ============================================================

// function createStyles(theme: Theme) {
//     return StyleSheet.create({
//         container: { flex: 1 },
//         loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//         scrollView: { flex: 1 },
//         listContent: { paddingBottom: 120 }, // Specific large padding to clear the FAB
//         maxWidthContainer: { width: '100%', maxWidth: 1400, alignSelf: 'center' },

//         // Header
//         headerRow: {
//             flexDirection: 'row',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             marginBottom: theme.spacing[6],
//         },
//         headerBackBtn: {
//             width: theme.spacing[11], // 44px
//             height: theme.spacing[11],
//             borderRadius: theme.borderRadius.full,
//             alignItems: 'center',
//             justifyContent: 'center',
//         },

//         // Insights
//         insightsWrapper: { marginBottom: theme.spacing[6], gap: theme.spacing[4] },

//         // Filters
//         filtersWrapper: { flexDirection: 'column', gap: theme.spacing[4], marginBottom: theme.spacing[8] },
//         filtersWrapperDesktop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[5] },

//         // Sections
//         sectionWrapper: { marginBottom: theme.spacing[8] },
//         sectionTitle: { marginBottom: theme.spacing[4], marginLeft: theme.spacing[0.5] },

//         // FAB
//         fabContainer: {
//             position: 'absolute',
//             alignSelf: 'center',
//             zIndex: 100,
//         },
//     });
// }
