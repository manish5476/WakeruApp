import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { useThemeStore } from '../../stores/theme.store';
import { themePresets, themeMeta, ThemePreset } from '../../theme/presets';

const PRESETS = Object.keys(themePresets) as ThemePreset[];

export function ThemePicker() {
  const theme = useTheme();
  const { preset, setPreset } = useThemeStore();

  return (
    <View style={{ marginBottom: theme.spacing['6'] }}>
      <Text
        style={{
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: theme.spacing['3'],
        }}
      >
        🎨 Theme
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: theme.spacing['2'] }}>
          {PRESETS.map(p => {
            const isActive = preset === p;
            const presetTheme = themePresets[p];
            const meta = themeMeta[p];

            return (
              <TouchableOpacity
                key={p}
                style={{
                  width: 110,
                  padding: theme.spacing['3'],
                  borderRadius: theme.borderRadius.xl,
                  backgroundColor: presetTheme.colors.surface,
                  borderWidth: isActive ? 2 : 1,
                  borderColor: isActive
                    ? theme.colors.primary
                    : theme.colors.borderDefault,
                }}
                onPress={() => setPreset(p)}
                activeOpacity={0.7}
              >
                {/* Color preview row */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 4,
                    marginBottom: theme.spacing['2'],
                  }}
                >
                  {['primary', 'success', 'warning', 'danger'].map(key => (
                    <View
                      key={key}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: (presetTheme.colors as any)[key],
                      }}
                    />
                  ))}
                </View>
                {/* Name */}
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: isActive ? '700' : '500',
                    color: presetTheme.colors.textPrimary,
                  }}
                >
                  {meta.emoji} {meta.name}
                </Text>
                {/* Description */}
                <Text
                  style={{
                    fontSize: 10,
                    color: presetTheme.colors.textTertiary,
                    marginTop: 2,
                  }}
                >
                  {meta.description}
                </Text>
                {/* Active check */}
                {isActive && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: theme.colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.background,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
