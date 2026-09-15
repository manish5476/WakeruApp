// src/components/trips/SearchFilterModal.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';
import { haptics } from '../../utils/haptics';

export interface SearchFilters {
  searchName: string;
  searchUser: string;
  dateRange: 'all' | 'past' | 'upcoming' | 'this_month';
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
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

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

  const hasActiveFilters =
    Boolean(localFilters.searchName.trim()) ||
    Boolean(localFilters.searchUser.trim()) ||
    localFilters.dateRange !== 'all';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        {/* Backdrop Dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              },
            ]}
          >
            {/* Top Drag Handle Indicator */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View
              style={[
                styles.header,
                { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' },
              ]}
            >
              <View>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Filter Trips
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Narrow down your adventure list
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  haptics.light();
                  onClose();
                }}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
                  },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <AppIcon name="x" size={18} color={theme.colors.textPrimary} />
              </Pressable>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.body}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              bounces={false}
            >
              {/* Search by Trip Name */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <AppIcon name="compass" size={15} color={theme.colors.primary} />
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    TRIP NAME
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                    },
                  ]}
                >
                  <AppIcon name="search" size={16} color={theme.colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="e.g. Goa Trip, Tokyo Trek..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={localFilters.searchName}
                    onChangeText={(text) => setLocalFilters({ ...localFilters, searchName: text })}
                  />
                  {localFilters.searchName.length > 0 && (
                    <Pressable
                      onPress={() => {
                        haptics.light();
                        setLocalFilters({ ...localFilters, searchName: '' });
                      }}
                      hitSlop={8}
                    >
                      <AppIcon name="x" size={15} color={theme.colors.textTertiary} />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Search by Traveler */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <AppIcon name="users" size={15} color={theme.colors.primary} />
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    CO-TRAVELER NAME
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                    },
                  ]}
                >
                  <AppIcon name="user" size={16} color={theme.colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="Search by member name or email..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={localFilters.searchUser}
                    onChangeText={(text) => setLocalFilters({ ...localFilters, searchUser: text })}
                  />
                  {localFilters.searchUser.length > 0 && (
                    <Pressable
                      onPress={() => {
                        haptics.light();
                        setLocalFilters({ ...localFilters, searchUser: '' });
                      }}
                      hitSlop={8}
                    >
                      <AppIcon name="x" size={15} color={theme.colors.textTertiary} />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Date Range Presets */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <AppIcon name="calendar" size={15} color={theme.colors.primary} />
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    TIMELINE WINDOW
                  </Text>
                </View>
                <View style={styles.presetWrap}>
                  {dateRangeOptions.map((option) => {
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
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(15,23,42,0.08)',
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.background,
                          },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => {
                          haptics.light();
                          setLocalFilters({ ...localFilters, dateRange: option.key });
                        }}
                      >
                        <AppIcon
                          name={option.icon as any}
                          size={13}
                          color={isSelected ? theme.colors.textInverse : theme.colors.textSecondary}
                          style={styles.presetIcon}
                        />
                        <Text
                          style={[
                            styles.presetText,
                            {
                              color: isSelected ? theme.colors.textInverse : theme.colors.textPrimary,
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

              {/* Active Filters Indicator */}
              {hasActiveFilters && (
                <View
                  style={[
                    styles.activeFilters,
                    {
                      backgroundColor: `${theme.colors.primary}10`,
                      borderColor: `${theme.colors.primary}25`,
                    },
                  ]}
                >
                  <AppIcon name="filter" size={13} color={theme.colors.primary} />
                  <Text style={[styles.activeFiltersText, { color: theme.colors.primary }]}>
                    Custom filter conditions active
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer Actions */}
            <View
              style={[
                styles.footer,
                { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' },
              ]}
            >
              <Pressable
                onPress={handleClear}
                style={({ pressed }) => [
                  styles.clearBtn,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.clearBtnText, { color: theme.colors.textSecondary }]}>
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
              >
                <AppIcon name="check" size={16} color={theme.colors.textInverse} style={styles.applyIcon} />
                <Text style={[styles.applyBtnText, { color: theme.colors.textInverse }]}>
                  Apply Filters
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
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.65)',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '88%',
    width: '100%',
    borderWidth: 1,
    borderBottomWidth: 0,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        maxWidth: 500,
        marginBottom: 'auto',
        marginTop: 'auto',
        borderRadius: 28,
        borderBottomWidth: 1,
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,150,150,0.35)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  body: {
    maxHeight: 380,
  },
  bodyContent: {
    paddingBottom: 12,
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
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
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetIcon: {
    marginRight: 2,
  },
  presetText: {
    fontSize: 12.5,
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  activeFiltersText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 4,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyIcon: {
    marginRight: 2,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
