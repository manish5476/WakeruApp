// src/components/trips/SearchFilterModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../providers/ThemeProvider';
import { GlobalBackground } from '../ui/GlobalBackground';
import AppIcon from '../common/AppIcon';
import { haptics } from '../../utils/haptics';

export interface SearchFilters {
  searchName: string;
  searchUser: string;
  dateRange: 'all' | 'past' | 'upcoming' | 'this_month';
  status?: string;
}

interface SearchFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}

export function SearchFilterModal({
  visible,
  onClose,
  filters,
  onApply,
}: SearchFilterModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.searchName?.trim()) count++;
    if (localFilters.searchUser?.trim()) count++;
    if (localFilters.dateRange && localFilters.dateRange !== 'all') count++;
    if (localFilters.status && localFilters.status !== 'all') count++;
    return count;
  }, [localFilters]);

  const hasActiveFilters = activeFilterCount > 0;

  const handleApply = () => {
    haptics.medium();
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    haptics.light();
    const defaultFilters: SearchFilters = {
      searchName: '',
      searchUser: '',
      dateRange: 'all',
      status: undefined,
    };
    setLocalFilters(defaultFilters);
    onApply(defaultFilters);
    onClose();
  };

  const dateRangeOptions: {
    key: SearchFilters['dateRange'];
    label: string;
    icon: string;
  }[] = [
    { key: 'all', label: 'All Time', icon: 'clock' },
    { key: 'past', label: 'Past Trips', icon: 'calendar' },
    { key: 'upcoming', label: 'Upcoming', icon: 'trending-up' },
    { key: 'this_month', label: 'This Month', icon: 'calendar' },
  ];

  const statusOptions: {
    key: string;
    label: string;
    icon: string;
  }[] = [
    { key: 'all', label: 'All Statuses', icon: 'layers' },
    { key: 'active', label: 'Active', icon: 'zap' },
    { key: 'completed', label: 'Completed', icon: 'check-circle' },
    { key: 'planning', label: 'Planning', icon: 'compass' },
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalRoot,
          {
            backgroundColor: isDesktop
              ? 'rgba(0,0,0,0.65)'
              : theme.colors.background,
          },
        ]}
      >
        {/* Full Global Background on mobile devices */}
        {!isDesktop && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <GlobalBackground />
          </View>
        )}

        {/* Backdrop Dismiss on Desktop */}
        {isDesktop && (
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.keyboardView, isDesktop && styles.desktopKeyboardView]}
        >
          <View
            style={[
              styles.modalContent,
              isDesktop
                ? styles.desktopModalContent
                : styles.mobileModalContent,
              {
                backgroundColor: isDesktop
                  ? theme.colors.surface
                  : theme.isDark
                    ? 'rgba(15,23,42,0.88)'
                    : 'rgba(255,255,255,0.92)',
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.10)'
                  : 'rgba(15,23,42,0.08)',
                paddingTop: isDesktop
                  ? 20
                  : insets.top + (Platform.OS === 'android' ? 12 : 8),
                paddingBottom: isDesktop ? 20 : Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(15,23,42,0.06)',
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  haptics.light();
                  onClose();
                }}
                style={[
                  styles.backBtn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.05)',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.08)',
                  },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close search"
              >
                <AppIcon
                  name={isDesktop ? 'x' : 'arrow-left'}
                  size={18}
                  color={theme.colors.textPrimary}
                />
              </Pressable>

              <View style={styles.headerTitleWrap}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.title, { color: theme.colors.textPrimary }]}
                  >
                    Search & Filter
                  </Text>
                  {activeFilterCount > 0 && (
                    <View
                      style={[
                        styles.activeBadge,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activeBadgeText,
                          { color: theme.colors.textInverse },
                        ]}
                      >
                        {activeFilterCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Find trips across all destinations & members
                </Text>
              </View>

              {hasActiveFilters ? (
                <Pressable
                  onPress={handleClear}
                  style={styles.headerResetBtn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Reset all filters"
                >
                  <Text
                    style={[
                      styles.headerResetText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Reset
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.headerPlaceholder} />
              )}
            </View>

            {/* Body */}
            <ScrollView
              style={styles.body}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              bounces={true}
            >
              {/* Search by Trip Name */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <View
                    style={[
                      styles.fieldIconBox,
                      { backgroundColor: `${theme.colors.primary}18` },
                    ]}
                  >
                    <AppIcon
                      name="compass"
                      size={15}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    TRIP OR DESTINATION
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.10)'
                        : 'rgba(15,23,42,0.10)',
                    },
                  ]}
                >
                  <AppIcon
                    name="search"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="e.g. Goa Trip, Tokyo Trek, Bali..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={localFilters.searchName}
                    onChangeText={text =>
                      setLocalFilters({ ...localFilters, searchName: text })
                    }
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  {Boolean(localFilters.searchName.length) && (
                    <Pressable
                      onPress={() => {
                        haptics.light();
                        setLocalFilters({ ...localFilters, searchName: '' });
                      }}
                      style={styles.inputClearBtn}
                      hitSlop={8}
                    >
                      <AppIcon
                        name="x"
                        size={14}
                        color={theme.colors.textTertiary}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Search by Traveler */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <View
                    style={[
                      styles.fieldIconBox,
                      { backgroundColor: '#10B98118' },
                    ]}
                  >
                    <AppIcon name="users" size={15} color="#10B981" />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    CO-TRAVELER / CREW MEMBER
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.04)',
                      borderColor: theme.isDark
                        ? 'rgba(255,255,255,0.10)'
                        : 'rgba(15,23,42,0.10)',
                    },
                  ]}
                >
                  <AppIcon
                    name="user"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="Search by member name or email..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={localFilters.searchUser}
                    onChangeText={text =>
                      setLocalFilters({ ...localFilters, searchUser: text })
                    }
                    returnKeyType="done"
                  />
                  {Boolean(localFilters.searchUser.length) && (
                    <Pressable
                      onPress={() => {
                        haptics.light();
                        setLocalFilters({ ...localFilters, searchUser: '' });
                      }}
                      style={styles.inputClearBtn}
                      hitSlop={8}
                    >
                      <AppIcon
                        name="x"
                        size={14}
                        color={theme.colors.textTertiary}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <View
                    style={[
                      styles.fieldIconBox,
                      { backgroundColor: '#F59E0B18' },
                    ]}
                  >
                    <AppIcon name="layers" size={15} color="#F59E0B" />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    TRIP STATUS
                  </Text>
                </View>
                <View style={styles.presetWrap}>
                  {statusOptions.map(option => {
                    const isSelected =
                      (localFilters.status || 'all') === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        style={({ pressed }) => [
                          styles.presetBtn,
                          {
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.isDark
                                ? 'rgba(255,255,255,0.10)'
                                : 'rgba(15,23,42,0.08)',
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : theme.isDark
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(0,0,0,0.03)',
                          },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => {
                          haptics.light();
                          setLocalFilters({
                            ...localFilters,
                            status:
                              option.key === 'all' ? undefined : option.key,
                          });
                        }}
                      >
                        <AppIcon
                          name={option.icon as any}
                          size={14}
                          color={
                            isSelected
                              ? theme.colors.textInverse
                              : theme.colors.textSecondary
                          }
                          style={styles.presetIcon}
                        />
                        <Text
                          style={[
                            styles.presetText,
                            {
                              color: isSelected
                                ? theme.colors.textInverse
                                : theme.colors.textPrimary,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Date Range Presets */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <View
                    style={[
                      styles.fieldIconBox,
                      { backgroundColor: '#6366F118' },
                    ]}
                  >
                    <AppIcon name="calendar" size={15} color="#6366F1" />
                  </View>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    TIMELINE WINDOW
                  </Text>
                </View>
                <View style={styles.presetWrap}>
                  {dateRangeOptions.map(option => {
                    const isSelected = localFilters.dateRange === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        style={({ pressed }) => [
                          styles.presetBtn,
                          {
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.isDark
                                ? 'rgba(255,255,255,0.10)'
                                : 'rgba(15,23,42,0.08)',
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : theme.isDark
                                ? 'rgba(255,255,255,0.05)'
                                : 'rgba(0,0,0,0.03)',
                          },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => {
                          haptics.light();
                          setLocalFilters({
                            ...localFilters,
                            dateRange: option.key,
                          });
                        }}
                      >
                        <AppIcon
                          name={option.icon as any}
                          size={14}
                          color={
                            isSelected
                              ? theme.colors.textInverse
                              : theme.colors.textSecondary
                          }
                          style={styles.presetIcon}
                        />
                        <Text
                          style={[
                            styles.presetText,
                            {
                              color: isSelected
                                ? theme.colors.textInverse
                                : theme.colors.textPrimary,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Active Filters Summary Card */}
              {hasActiveFilters && (
                <View
                  style={[
                    styles.activeFiltersCard,
                    {
                      backgroundColor: `${theme.colors.primary}12`,
                      borderColor: `${theme.colors.primary}30`,
                    },
                  ]}
                >
                  <View style={styles.activeFiltersHeader}>
                    <View style={styles.activeFiltersLeft}>
                      <AppIcon
                        name="filter"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.activeFiltersTitle,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {activeFilterCount} active condition
                        {activeFilterCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Pressable onPress={handleClear} hitSlop={6}>
                      <Text
                        style={[
                          styles.clearLink,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Reset all
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.chipsRow}>
                    {Boolean(localFilters.searchName.trim()) && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: `${theme.colors.primary}35`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Name: "{localFilters.searchName.trim()}"
                        </Text>
                        <Pressable
                          onPress={() =>
                            setLocalFilters({ ...localFilters, searchName: '' })
                          }
                          hitSlop={4}
                        >
                          <AppIcon
                            name="x"
                            size={12}
                            color={theme.colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    )}
                    {Boolean(localFilters.searchUser.trim()) && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: `${theme.colors.primary}35`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Member: "{localFilters.searchUser.trim()}"
                        </Text>
                        <Pressable
                          onPress={() =>
                            setLocalFilters({ ...localFilters, searchUser: '' })
                          }
                          hitSlop={4}
                        >
                          <AppIcon
                            name="x"
                            size={12}
                            color={theme.colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    )}
                    {localFilters.status && localFilters.status !== 'all' && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: `${theme.colors.primary}35`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Status:{' '}
                          {
                            statusOptions.find(
                              s => s.key === localFilters.status,
                            )?.label
                          }
                        </Text>
                        <Pressable
                          onPress={() =>
                            setLocalFilters({
                              ...localFilters,
                              status: undefined,
                            })
                          }
                          hitSlop={4}
                        >
                          <AppIcon
                            name="x"
                            size={12}
                            color={theme.colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    )}
                    {localFilters.dateRange !== 'all' && (
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: `${theme.colors.primary}35`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          Time:{' '}
                          {
                            dateRangeOptions.find(
                              d => d.key === localFilters.dateRange,
                            )?.label
                          }
                        </Text>
                        <Pressable
                          onPress={() =>
                            setLocalFilters({
                              ...localFilters,
                              dateRange: 'all',
                            })
                          }
                          hitSlop={4}
                        >
                          <AppIcon
                            name="x"
                            size={12}
                            color={theme.colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer Actions */}
            <View
              style={[
                styles.footer,
                {
                  borderTopColor: theme.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(15,23,42,0.06)',
                },
              ]}
            >
              <Pressable
                onPress={handleClear}
                style={({ pressed }) => [
                  styles.clearBtn,
                  {
                    backgroundColor: theme.isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)',
                    borderColor: theme.isDark
                      ? 'rgba(255,255,255,0.10)'
                      : 'rgba(15,23,42,0.08)',
                  },
                  pressed && { opacity: 0.8 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Clear all search filters"
              >
                <Text
                  style={[
                    styles.clearBtnText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Clear All
                </Text>
              </Pressable>
              <Pressable
                onPress={handleApply}
                style={({ pressed }) => [
                  styles.applyBtn,
                  { backgroundColor: theme.colors.primary },
                  pressed && { opacity: 0.9 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Apply filters"
              >
                <AppIcon
                  name="check"
                  size={16}
                  color={theme.colors.textInverse}
                  style={styles.applyIcon}
                />
                <Text
                  style={[
                    styles.applyBtnText,
                    { color: theme.colors.textInverse },
                  ]}
                >
                  {activeFilterCount > 0
                    ? `Apply Filters (${activeFilterCount})`
                    : 'Show Results'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  desktopKeyboardView: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    flex: 1,
    width: '100%',
  },
  mobileModalContent: {
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 20,
  },
  desktopModalContent: {
    maxWidth: 620,
    maxHeight: 740,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.35,
        shadowRadius: 32,
        elevation: 20,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  headerResetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerResetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerPlaceholder: {
    width: 38,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    paddingTop: 12,
    paddingBottom: 24,
    gap: 20,
  },
  fieldGroup: {
    gap: 10,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldIconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
    height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  } as any,
  inputClearBtn: {
    padding: 4,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetIcon: {
    marginRight: 2,
  },
  presetText: {
    fontSize: 13,
  },
  activeFiltersCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeFiltersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeFiltersTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  clearLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  clearBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyIcon: {
    marginRight: 2,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
