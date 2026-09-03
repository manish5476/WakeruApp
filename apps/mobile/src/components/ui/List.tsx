// src/components/ui/ListItem.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  destructive,
  disabled,
  showChevron,
  style,
}: ListItemProps) {
  const theme = useTheme();

  const Content = (
    <View
      style={[styles.itemContainer, style, { opacity: disabled ? 0.5 : 1 }]}
    >
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <View style={styles.textContainer}>
        <Typography
          variant="body"
          weight="medium"
          color={destructive ? 'danger' : 'textPrimary'}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="bodySm" color="textSecondary">
            {subtitle}
          </Typography>
        )}
      </View>
      <View style={styles.rightContent}>
        {rightIcon}
        {showChevron && (
          <AppIcon
            name="chevron-right"
            size={20}
            color={theme.colors.textTertiary}
          />
        )}
      </View>
    </View>
  );

  if (onPress)
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {Content}
      </TouchableOpacity>
    );
  return Content;
}

export function ListSection({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.sectionContainer, style]}>
      {title && (
        <Typography
          variant="overline"
          color="textSecondary"
          style={[styles.sectionTitle, { marginBottom: theme.spacing['3'] }]}
        >
          {title}
        </Typography>
      )}
      <View
        style={[
          styles.sectionContent,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  leftIcon: { marginRight: 16 },
  textContainer: { flex: 1, justifyContent: 'center' },
  rightContent: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
  sectionContainer: { marginBottom: 24 },
  sectionTitle: { marginLeft: 16 },
  sectionContent: { overflow: 'hidden' },
});
