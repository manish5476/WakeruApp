// src/components/ui/TagSelector.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';

import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import { Typography } from '../ui';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';

import type { Theme } from '../../theme';

// --- Types ---
interface Tag {
  label: string;
  emoji?: string;
  color?: string;
  category?: 'default' | 'custom';
}

interface TagSelectorProps {
  selected: string[];
  onToggle: (tag: string) => void;
  onCreateTag: (tag: string) => void;
  maxTags?: number;
  /**
   * Custom tags to display
   */
  customTags?: Tag[];
  /**
   * If true, shows the tag count
   */
  showCount?: boolean;
  /**
   * If true, allows creating custom tags
   */
  allowCustom?: boolean;
  /**
   * Placeholder for custom tag input
   */
  customPlaceholder?: string;
  /**
   * If true, tags are displayed in a compact layout
   */
  compact?: boolean;
  /**
   * Label for the tag section
   */
  label?: string;
  /**
   * If true, shows emojis in tags
   */
  showEmojis?: boolean;
}

// --- Default Tags ---
const DEFAULT_TAGS: Tag[] = [
  { label: 'Reimbursable', emoji: '💰', color: '#059669' },
  { label: 'Business', emoji: '🏢', color: '#1A56DB' },
  { label: 'Personal', emoji: '👤', color: '#7C3AED' },
  { label: 'Split with partner', emoji: '🍕', color: '#D97706' },
  { label: 'Need receipt', emoji: '📝', color: '#DC2626' },
  { label: 'Household', emoji: '🏠', color: '#059669' },
  { label: 'Gift', emoji: '🎁', color: '#EC4899' },
  { label: 'Subscription', emoji: '📅', color: '#6366F1' },
];

export function TagSelector({
  selected,
  onToggle,
  onCreateTag,
  maxTags = 10,
  customTags = [],
  showCount = true,
  allowCustom = true,
  customPlaceholder = 'Add custom tag...',
  compact = false,
  label = 'Tags',
  showEmojis = true,
}: TagSelectorProps) {
  const theme = useTheme();
  const styles = useMemo(() => tagStyles(theme), [theme]);

  const [customTag, setCustomTag] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // --- Animation Values ---
  const scale = useSharedValue(1);

  // --- Computed ---
  const allTags = useMemo(() => [...DEFAULT_TAGS, ...customTags], [customTags]);
  const isAtMaxTags = selected.length >= maxTags;
  const isTagSelected = (tagLabel: string) => selected.includes(tagLabel);
  const visibleTags = showAllTags ? allTags : allTags.slice(0, compact ? 4 : 8);
  const hasMoreTags = allTags.length > (compact ? 4 : 8);

  // --- Handlers ---
  const handleAddCustom = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;

    if (isAtMaxTags) {
      haptics.warning?.();
      return;
    }

    haptics.medium();
    onCreateTag(trimmed);
    setCustomTag('');
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleToggle = (tagLabel: string) => {
    if (isAtMaxTags && !isTagSelected(tagLabel)) {
      haptics.warning?.();
      return;
    }

    haptics.light();
    onToggle(tagLabel);
  };

  const handleClearAll = () => {
    if (selected.length === 0) return;
    haptics.medium();
    selected.forEach(tag => onToggle(tag));
  };

  // --- Render Tag ---
  const renderTag = (tag: Tag, index: number) => {
    const isActive = isTagSelected(tag.label);
    const isDisabled = isAtMaxTags && !isActive;

    return (
      <InteractiveWrapper
        key={`${tag.label}-${index}`}
        onPress={() => handleToggle(tag.label)}
        disabled={isDisabled}
        style={styles.tagWrapper}
      >
        <Animated.View
          style={[
            styles.tag,
            {
              borderColor: isActive
                ? theme.colors.primary
                : theme.colors.borderLight,
              backgroundColor: isActive
                ? `${theme.colors.primary}15`
                : theme.colors.surface,
              opacity: isDisabled ? 0.5 : 1,
            },
            isActive && styles.tagActive,
            isDisabled && styles.tagDisabled,
          ]}
        >
          {showEmojis && tag.emoji && (
            <Typography variant="caption" style={styles.tagEmoji}>
              {tag.emoji}
            </Typography>
          )}
          <Typography
            variant="caption"
            weight={isActive ? 'bold' : 'medium'}
            color={isActive ? 'primary' : 'textSecondary'}
            style={isActive && styles.tagTextActive}
            premium={isActive}
          >
            {tag.label}
          </Typography>
          {isActive && (
            <View style={styles.checkmark}>
              <AppIcon name="check" size={11} color={theme.colors.primary} />
            </View>
          )}
        </Animated.View>
      </InteractiveWrapper>
    );
  };

  // --- Render Selected Tags ---
  const renderSelectedTags = () => {
    if (selected.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Typography
            variant="caption"
            color="textTertiary"
            style={styles.emptyStateText}
          >
            No tags selected. Tap a tag or create your own.
          </Typography>
        </View>
      );
    }

    return (
      <View style={styles.selectedRow}>
        {selected.map(tagLabel => {
          const tag = allTags.find(t => t.label === tagLabel);
          return (
            <View
              key={tagLabel}
              style={[
                styles.selectedTag,
                {
                  backgroundColor: `${theme.colors.primary}15`,
                  borderColor: `${theme.colors.primary}30`,
                },
              ]}
            >
              {tag?.emoji && showEmojis && (
                <Typography variant="caption" style={styles.selectedTagEmoji}>
                  {tag.emoji}
                </Typography>
              )}
              <Typography
                variant="caption"
                weight="bold"
                color="primary"
                style={styles.selectedTagText}
                premium
              >
                {tagLabel}
              </Typography>
              <InteractiveWrapper
                onPress={() => handleToggle(tagLabel)}
                style={styles.selectedTagRemove}
              >
                <AppIcon name="x" size={12} color={theme.colors.primary} />
              </InteractiveWrapper>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography
          variant="caption"
          weight="extrabold"
          color="textSecondary"
          style={styles.label}
          premium
        >
          {label}
        </Typography>
        <View style={styles.headerRight}>
          {showCount && (
            <Typography
              variant="caption"
              weight="bold"
              color="textTertiary"
              style={styles.tagCount}
            >
              {selected.length}/{maxTags}
            </Typography>
          )}
          {selected.length > 0 && (
            <InteractiveWrapper
              onPress={handleClearAll}
              style={styles.clearButton}
            >
              <Typography
                variant="caption"
                weight="bold"
                color="textTertiary"
                style={styles.clearText}
              >
                Clear all
              </Typography>
            </InteractiveWrapper>
          )}
        </View>
      </View>

      {/* Tag List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsRow}
        contentContainerStyle={styles.tagsContent}
      >
        {visibleTags.map((tag, index) => renderTag(tag, index))}

        {hasMoreTags && !showAllTags && (
          <InteractiveWrapper
            onPress={() => {
              haptics.light();
              setShowAllTags(true);
            }}
            style={styles.showMoreButton}
          >
            <View
              style={[
                styles.showMoreTag,
                {
                  borderColor: theme.colors.borderLight,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Typography variant="caption" weight="bold" color="textSecondary">
                +{allTags.length - visibleTags.length} more
              </Typography>
              <AppIcon
                name="chevron-down"
                size={12}
                color={theme.colors.textTertiary}
              />
            </View>
          </InteractiveWrapper>
        )}

        {showAllTags && (
          <InteractiveWrapper
            onPress={() => {
              haptics.light();
              setShowAllTags(false);
            }}
            style={styles.showMoreButton}
          >
            <View
              style={[
                styles.showMoreTag,
                {
                  borderColor: theme.colors.borderLight,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Typography variant="caption" weight="bold" color="textSecondary">
                Show less
              </Typography>
              <AppIcon
                name="chevron-up"
                size={12}
                color={theme.colors.textTertiary}
              />
            </View>
          </InteractiveWrapper>
        )}
      </ScrollView>

      {/* Custom Tag Input */}
      {allowCustom && (
        <View style={styles.customRow}>
          <View
            style={[
              styles.customInputContainer,
              {
                borderColor: isFocused
                  ? theme.colors.primary
                  : theme.colors.borderLight,
                backgroundColor: theme.colors.surface,
              },
              isFocused && styles.customInputFocused,
            ]}
          >
            <AppIcon
              name="tag"
              size={16}
              color={
                isFocused ? theme.colors.primary : theme.colors.textTertiary
              }
            />
            <TextInput
              ref={inputRef}
              style={[
                styles.customInput,
                {
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder={isAtMaxTags ? 'Max tags reached' : customPlaceholder}
              placeholderTextColor={theme.colors.textTertiary}
              value={customTag}
              onChangeText={setCustomTag}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={handleAddCustom}
              editable={!isAtMaxTags}
              returnKeyType="done"
            />
            {customTag.length > 0 && (
              <InteractiveWrapper
                onPress={() => setCustomTag('')}
                style={styles.clearInputButton}
              >
                <AppIcon
                  name="x-circle"
                  size={16}
                  color={theme.colors.textTertiary}
                />
              </InteractiveWrapper>
            )}
          </View>

          <InteractiveWrapper
            onPress={handleAddCustom}
            disabled={isAtMaxTags || !customTag.trim()}
            style={[
              styles.addButtonWrapper,
              (isAtMaxTags || !customTag.trim()) && styles.addButtonDisabled,
            ]}
          >
            <View
              style={[
                styles.addButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: isAtMaxTags || !customTag.trim() ? 0.5 : 1,
                },
              ]}
            >
              <AppIcon name="plus" size={16} color="#FFF" />
              <Typography
                variant="caption"
                weight="bold"
                color="textInverse"
                style={styles.addButtonText}
                premium
              >
                Add
              </Typography>
            </View>
          </InteractiveWrapper>
        </View>
      )}

      {/* Selected Tags */}
      {renderSelectedTags()}
    </View>
  );
}

// --- Extended Version with Search ---
interface TagSelectorWithSearchProps extends TagSelectorProps {
  searchable?: boolean;
}

export function TagSelectorWithSearch({
  searchable = true,
  ...props
}: TagSelectorWithSearchProps) {
  const theme = useTheme();
  const styles = useMemo(() => tagStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);

  const allTags = useMemo(
    () => [...DEFAULT_TAGS, ...(props.customTags || [])],
    [props.customTags],
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTags(allTags);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allTags.filter(tag =>
      tag.label.toLowerCase().includes(query),
    );
    setFilteredTags(filtered);
  }, [searchQuery, allTags]);

  if (!searchable) {
    return <TagSelector {...props} />;
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Search Input */}
      <View
        style={[
          styles.customInputContainer,
          {
            borderColor: theme.colors.borderLight,
            backgroundColor: theme.colors.surface,
            marginBottom: 4,
          },
        ]}
      >
        <AppIcon name="search" size={16} color={theme.colors.textTertiary} />
        <TextInput
          style={[styles.customInput, { color: theme.colors.textPrimary }]}
          placeholder="Search tags..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <InteractiveWrapper
            onPress={() => setSearchQuery('')}
            style={styles.clearInputButton}
          >
            <AppIcon
              name="x-circle"
              size={16}
              color={theme.colors.textTertiary}
            />
          </InteractiveWrapper>
        )}
      </View>

      <TagSelector {...props} customTags={filteredTags} />
    </View>
  );
}

// --- Styles ---
function tagStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginBottom: 16,
      width: '100%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    label: {
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontSize: 10,
    },
    tagCount: {
      fontSize: 11,
      fontWeight: '800',
    },
    clearButton: {
      padding: 4,
    },
    clearText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    tagsRow: {
      marginBottom: 12,
    },
    tagsContent: {
      gap: 8,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    tagWrapper: {
      flexShrink: 0,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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
    tagActive: {
      borderWidth: 1.5,

      ...Platform.select({
        web: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
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
    tagDisabled: {
      opacity: 0.5,
    },
    tagEmoji: {
      fontSize: 13,
      lineHeight: 15,
    },
    tagTextActive: {
      fontWeight: '800',
    },
    checkmark: {
      marginLeft: 2,
    },
    showMoreButton: {
      flexShrink: 0,
    },
    showMoreTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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
    customRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    customInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 44,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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

      ...Platform.select({
        web: {
          transition: 'all 0.2s ease',
        },
      }),
    },
    customInputFocused: {
      borderWidth: 1.5,
      ...Platform.select({
        web: {
          boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
        },
      }),
    },
    customInput: {
      flex: 1,
      fontSize: 13.5,
      fontWeight: '600',
      height: 40,
      paddingVertical: 0,
      paddingHorizontal: 8,
      ...Platform.select({
        web: {
          outlineWidth: 0,
        },
      }),
    },
    clearInputButton: {
      padding: 4,
    },
    addButtonWrapper: {
      flexShrink: 0,
    },
    addButtonDisabled: {
      opacity: 0.5,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
      height: 44,
      justifyContent: 'center',
      minWidth: 70,

      ...Platform.select({
        web: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
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
    addButtonText: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    selectedRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    selectedTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      borderWidth: 1,

      ...Platform.select({
        web: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
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
    selectedTagEmoji: {
      fontSize: 12,
      lineHeight: 14,
    },
    selectedTagText: {
      fontSize: 12,
      fontWeight: '800',
    },
    selectedTagRemove: {
      padding: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    emptyStateText: {
      fontSize: 12,
      textAlign: 'center',
      fontWeight: '500',
    },
  });
}
