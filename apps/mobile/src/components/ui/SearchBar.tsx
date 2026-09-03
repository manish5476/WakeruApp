// src/components/ui/SearchBar.tsx
import React from 'react';
import { StyleSheet, View, TextInput, Platform } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from './GlassCard';
import AppIcon from '../common/AppIcon';
import { IconButton } from './IconButton';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search...',
  autoFocus = false,
}: SearchBarProps) {
  const theme = useTheme();

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  // Web-only styles to bypass TypeScript TS errors with CSS outline props
  const webStyles: any =
    Platform.OS === 'web'
      ? {
          outlineWidth: 0,
          outlineStyle: 'none' as const, // TypeScript requires 'as const' for specific string literal
        }
      : {};

  return (
    <GlassCard
      variant="medium"
      padding="sm"
      intensity={theme.isDark ? 30 : 40}
      style={styles.container}
      // Note: 'elevated' prop removed because it doesn't exist on GlassCard.
      // Variant="medium" already handles the shadow/blur automatically via theme.
    >
      <View style={styles.row}>
        <AppIcon name="search" size={20} color={theme.colors.textTertiary} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          autoFocus={autoFocus}
          style={[
            styles.input,
            webStyles,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.fontSize.base,
              fontFamily: theme.typography.fontFamily.sans,
            },
          ]}
          selectionColor={theme.colors.primary}
          cursorColor={theme.colors.primary}
          // Accessibility
          accessibilityLabel="Search"
          accessibilityHint="Type to search for trips or expenses"
        />

        {value.length > 0 && (
          <IconButton
            icon={
              <AppIcon name="x" size={18} color={theme.colors.textSecondary} />
            }
            size="sm"
            onPress={handleClear}
            style={{ opacity: 0.7 }}
          />
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    height: Platform.OS === 'web' ? 40 : 44,
    paddingVertical: 0,
    // All outline-related styles have been moved to `webStyles`
    // within the component to satisfy TypeScript rules.
  },
});
