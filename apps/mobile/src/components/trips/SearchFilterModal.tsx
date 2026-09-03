import AppIcon from '../common/AppIcon';
// components/ui/SearchFilterModal.tsx
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
  PressableStateCallbackType,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from '../ui/GlassCard';

export interface SearchFilters {
  searchName: string;
  searchUser: string;
  dateRange: 'all' | 'past' | 'upcoming' | 'this_month';
}
type WebPressableState = PressableStateCallbackType & { hovered?: boolean };

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
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <GlassCard
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
            intensity={theme.isDark ? 25 : 15}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text
                  style={[styles.title, { color: theme.colors.textPrimary }]}
                >
                  Filter Trips
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Narrow down your trip list
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  { backgroundColor: theme.colors.overlayLight },
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <AppIcon
                  name="x"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bodyContent}
            >
              {/* Search by Trip Name */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <AppIcon
                    name="search"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Trip Name
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                >
                  <AppIcon
                    name="file-text"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="e.g. Goa Trip"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={localFilters.searchName}
                    onChangeText={text =>
                      setLocalFilters({ ...localFilters, searchName: text })
                    }
                  />
                  {localFilters.searchName.length > 0 && (
                    <Pressable
                      onPress={() =>
                        setLocalFilters({ ...localFilters, searchName: '' })
                      }
                    >
                      <AppIcon
                        name="x-circle"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Search by Traveler */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <AppIcon
                    name="user"
                    size={16}
                    color={theme.colors.secondary}
                  />
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Traveler Name
                  </Text>
                </View>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                >
                  <AppIcon
                    name="users"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="e.g. John"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={localFilters.searchUser}
                    onChangeText={text =>
                      setLocalFilters({ ...localFilters, searchUser: text })
                    }
                  />
                  {localFilters.searchUser.length > 0 && (
                    <Pressable
                      onPress={() =>
                        setLocalFilters({ ...localFilters, searchUser: '' })
                      }
                    >
                      <AppIcon
                        name="x-circle"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Date Range Presets */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeader}>
                  <AppIcon
                    name="calendar"
                    size={16}
                    color={theme.colors.warning}
                  />
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Timeline
                  </Text>
                </View>
                <View style={styles.presetWrap}>
                  {dateRangeOptions.map(option => {
                    const isSelected = localFilters.dateRange === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        style={({ hovered }: WebPressableState) => [
                          styles.presetBtn,
                          {
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.borderLight,
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.surface,
                          },
                          Platform.OS === 'web' &&
                            hovered &&
                            !isSelected && {
                              backgroundColor: theme.colors.overlayLight,
                            },
                        ]}
                        onPress={() =>
                          setLocalFilters({
                            ...localFilters,
                            dateRange: option.key,
                          })
                        }
                      >
                        <AppIcon
                          name={option.icon}
                          size={14}
                          color={
                            isSelected ? '#FFF' : theme.colors.textSecondary
                          }
                          style={styles.presetIcon}
                        />
                        <Text
                          style={[
                            styles.presetText,
                            {
                              color: isSelected
                                ? '#FFF'
                                : theme.colors.textSecondary,
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

              {/* Active Filters Summary */}
              {(localFilters.searchName ||
                localFilters.searchUser ||
                localFilters.dateRange !== 'all') && (
                <View
                  style={[
                    styles.activeFilters,
                    {
                      backgroundColor: theme.colors.primaryBg,
                      borderColor: theme.colors.borderLight,
                    },
                  ]}
                >
                  <AppIcon
                    name="filter"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.activeFiltersText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Active filters applied
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View
              style={[
                styles.footer,
                { borderTopColor: theme.colors.borderLight },
              ]}
            >
              <Pressable
                onPress={handleClear}
                style={[
                  styles.clearBtn,
                  { backgroundColor: theme.colors.secondaryBg },
                ]}
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
                style={[
                  styles.applyBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <AppIcon
                  name="check"
                  size={18}
                  color="#FFF"
                  style={styles.applyIcon}
                />
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </Pressable>
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        maxWidth: 480,
        marginBottom: 'auto',
        marginTop: 'auto',
        borderRadius: 32,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 0,
    height: '100%',
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
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetIcon: {
    marginRight: 2,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  activeFiltersText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 4,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyIcon: {
    marginRight: 2,
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
