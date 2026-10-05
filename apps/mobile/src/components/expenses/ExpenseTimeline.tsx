import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ExpenseCard } from './ExpenseCard';
import { ExpensePresentationModel } from '../../models/presentation/expense.model';
import { useTheme } from '../../providers/ThemeProvider';
import { Theme } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import GlobalLoader from '../common/GlobalLoader';
import AppIcon from '../common/AppIcon';

export interface TimelineData {
  _key: string;
  type: 'header' | 'row';
  title?: string;
  items?: ExpensePresentationModel[];
}

interface ExpenseTimelineProps {
  data: TimelineData[];
  isLoading: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  searchQuery: string;
  refetch: () => void;
  fetchNextPage: () => void;
  onAddExpense: () => void;
  bottomInset: number;
}

export function ExpenseTimeline({
  data,
  isLoading,
  isRefetching,
  isFetchingNextPage,
  searchQuery,
  refetch,
  fetchNextPage,
  onAddExpense,
  bottomInset,
}: ExpenseTimelineProps) {
  const { isDesktop } = useResponsive();
  const theme = useTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const numColumns = useMemo(() => (isDesktop ? 2 : 1), [isDesktop]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <GlobalLoader
          variant="inline"
          size="large"
          color={theme.colors.secondary}
        />
        <Text
          style={[styles.loadingText, { color: theme.colors.textSecondary }]}
        >
          Loading your expenses...
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      // @ts-expect-error - FlashList prop compatibility
      estimatedItemSize={120}
      data={data}
      keyExtractor={item => item._key}
      renderItem={({ item, index }) => {
        if (item.type === 'header') {
          return (
            <View style={styles.groupHeader}>
              <View style={styles.groupHeaderLine} />
              <Text
                style={[
                  styles.groupHeaderText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {item.title}
              </Text>
              <View style={styles.groupHeaderLine} />
            </View>
          );
        }
        return (
          <View style={styles.cardRow}>
            {item.items!.map((exp, i) => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                index={index * numColumns + i}
                showInlineActions={isDesktop}
              />
            ))}
            {numColumns > 1 &&
              Array.from({ length: numColumns - item.items!.length }).map(
                (_, i) => <View key={`pad-${i}`} style={styles.cardPad} />,
              )}
          </View>
        );
      }}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: bottomInset + 120 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={refetch}
          tintColor={theme.colors.secondary}
          colors={[theme.colors.secondary]}
        />
      }
      onEndReached={fetchNextPage}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footerLoader}>
            <GlobalLoader
              variant="inline"
              size="small"
              color={theme.colors.secondary}
            />
          </View>
        ) : null
      }
      ListEmptyComponent={
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          style={styles.emptyContainer}
        >
          <View
            style={[
              styles.emptyIllustration,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <AppIcon
              name="file-text"
              size={48}
              color={theme.colors.secondary}
            />
          </View>
          <Text
            style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}
          >
            No Expenses Found
          </Text>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Create your first expense to get started'}
          </Text>
          <Pressable style={styles.emptyCTA} onPress={onAddExpense}>
            <Text style={styles.emptyCTAText}>Add Expense</Text>
            <AppIcon name="plus" size={16} color={theme.colors.textInverse} />
          </Pressable>
        </Animated.View>
      }
    />
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    listContent: {
      paddingTop: 8,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 16,
      marginBottom: 12,
    },
    groupHeaderLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.surface,
    },
    groupHeaderText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    cardRow: {
      flexDirection: 'row',
      gap: 16,
      width: '100%',
      alignItems: 'flex-start',
    },
    cardPad: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 60,
      gap: 16,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '600',
    },
    footerLoader: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
      paddingHorizontal: 24,
    },
    emptyIllustration: {
      width: 100,
      height: 100,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.glass.borderTopColor,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '900',
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: 24,
    },
    emptyCTA: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 16,
    },
    emptyCTAText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textInverse,
    },
  });
