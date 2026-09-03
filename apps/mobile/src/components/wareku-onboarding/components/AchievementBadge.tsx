import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppIcon from '../../common/AppIcon';
import { colors, radius, spacing, typography } from '../theme/tokens';

interface AchievementBadgeProps {
  icon: string;
  title: string;
  subtitle: string;
  gradient?: [string, string];
}

/**
 * Trip-memory / gamification badge (Explorer, Budget Master, etc.)
 * used on the Memories & Community screen.
 */
export default function AchievementBadge({
  icon,
  title,
  subtitle,
  gradient = colors.gradientBrand as [string, string],
}: AchievementBadgeProps) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={gradient}
        style={styles.iconWrap}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AppIcon name={icon} size={20} color={colors.textOnDark} />
      </LinearGradient>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    padding: spacing.sm,
    minWidth: 168,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { color: colors.textOnDark, fontSize: 13, fontWeight: '700' },
  subtitle: { color: colors.textOnDarkFaint, fontSize: 11, marginTop: 2 },
});
