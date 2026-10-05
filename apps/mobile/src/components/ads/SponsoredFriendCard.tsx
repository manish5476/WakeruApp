// src/components/ads/SponsoredFriendCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';

interface SponsoredFriendCardProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  url?: string;
  onPress?: () => void;
}

export function SponsoredFriendCard({
  title = 'Invite Friends, Earn Rewards',
  subtitle = 'Get ₹250 travel credits for every friend who joins Wakeru',
  ctaText = 'Invite',
  url = 'https://wakeru.app',
  onPress,
}: SponsoredFriendCardProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <Pressable
      style={({ hovered }: any) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.isDark
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.06)',
        },
        Platform.OS === 'web' &&
          hovered && { transform: [{ translateY: -1 }], shadowOpacity: 0.08 },
      ]}
      onPress={handlePress}
    >
      <View style={styles.iconWrap}>
        <AppIcon name="gift" size={20} color="#6366F1" />
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PARTNER</Text>
          </View>
        </View>
        <Text
          style={[styles.subtitle, { color: theme.colors.textTertiary }]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      <View style={styles.ctaBtn}>
        <Text style={styles.ctaText}>{ctaText}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  ctaBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
