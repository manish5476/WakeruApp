import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { GlassCard } from '../ui/GlassCard';
import AppIcon from './AppIcon';
import { useTheme } from '../../providers/ThemeProvider';
import { storage } from '../../utils/storage';

interface ContextualHintProps {
  storageKey: string;
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ContextualHint({
  storageKey,
  icon = 'lightbulb',
  title,
  message,
  actionLabel,
  onAction,
}: ContextualHintProps) {
  const theme = useTheme();
  const [dismissed, setDismissed] = useState(() =>
    Boolean(storage.getBoolean(`hint_${storageKey}`)),
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    storage.setBoolean(`hint_${storageKey}`, true);
    setDismissed(true);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={styles.container}
    >
      <GlassCard
        variant="subtle"
        padding="none"
        style={[
          styles.card,
          {
            borderColor: theme.isDark
              ? 'rgba(56, 189, 248, 0.25)'
              : 'rgba(37, 99, 235, 0.2)',
            backgroundColor: theme.isDark
              ? 'rgba(15, 23, 42, 0.65)'
              : 'rgba(239, 246, 255, 0.75)',
          },
        ]}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: 'rgba(37, 99, 235, 0.12)' },
            ]}
          >
            <AppIcon name={icon} size={16} color="#2563EB" />
          </View>

          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {title}
            </Text>
            <Text
              style={[styles.message, { color: theme.colors.textSecondary }]}
            >
              {message}
            </Text>

            {actionLabel && onAction && (
              <Pressable onPress={onAction} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>{actionLabel}</Text>
                <AppIcon name="arrow-right" size={12} color="#2563EB" />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={handleDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.dismissBtn}
            accessibilityLabel="Dismiss hint"
          >
            <AppIcon name="x" size={14} color={theme.colors.textTertiary} />
          </Pressable>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  actionBtnText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  dismissBtn: {
    padding: 4,
    borderRadius: 8,
  },
});
