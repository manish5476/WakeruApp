import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';
import { Button } from './Button';
import { GlassCard } from './GlassCard';
import AppIcon from '../common/AppIcon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  iconColor?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  iconColor,
}: EmptyStateProps) {
  const theme = useTheme();
  const color = iconColor || theme.colors.primary;

  // Detect if icon is an emoji or a Lucide icon identifier
  const isEmoji =
    icon &&
    (icon.length <= 4 || /[\u{1F300}-\u{1F9FF}]/u.test(icon)) &&
    !icon.includes('-') &&
    !/^[a-zA-Z]+$/.test(icon);

  return (
    <View style={styles.outerContainer}>
      <GlassCard intensity={theme.isDark ? 20 : 60} style={styles.card}>
        <View style={styles.content}>
          {/* Icon Bubble */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${color}18`, borderColor: `${color}30` },
            ]}
          >
            {isEmoji ? (
              <Typography
                variant="display"
                style={{ fontSize: 40, lineHeight: 48 }}
              >
                {icon}
              </Typography>
            ) : (
              <AppIcon name={icon as any} size={36} color={color} />
            )}
          </View>

          {/* Text Section */}
          <View style={styles.textSection}>
            <Typography
              variant="h3"
              weight="bold"
              color="textPrimary"
              align="center"
            >
              {title}
            </Typography>
            <Typography
              variant="body"
              color="textSecondary"
              align="center"
              style={{ maxWidth: 340, lineHeight: 20 }}
            >
              {description}
            </Typography>
          </View>

          {/* Actions */}
          {(actionLabel || secondaryActionLabel) && (
            <View style={styles.actionsWrap}>
              {actionLabel && onAction && (
                <Button
                  title={actionLabel}
                  variant="primary"
                  size="md"
                  onPress={onAction}
                />
              )}

              {secondaryActionLabel && onSecondaryAction && (
                <Button
                  title={secondaryActionLabel}
                  variant="secondary"
                  size="md"
                  onPress={onSecondaryAction}
                />
              )}
            </View>
          )}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    alignItems: 'center',
    gap: 16,
    maxWidth: 420,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    gap: 6,
    alignItems: 'center',
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
