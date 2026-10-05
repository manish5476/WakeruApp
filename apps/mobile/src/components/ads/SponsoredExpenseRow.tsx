// src/components/ads/SponsoredExpenseRow.tsx
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
import { getForexCardDealUrl } from '../../utils/affiliateLinks';

interface SponsoredExpenseRowProps {
  title?: string;
  subtitle?: string;
  emoji?: string;
  badgeLabel?: string;
  url?: string;
  onPress?: () => void;
}

export function SponsoredExpenseRow({
  title = 'Zero-Fee Forex Travel Card',
  subtitle = 'Save 3.5% on international currency exchange',
  emoji = '💳',
  badgeLabel = 'SPONSORED',
  url = getForexCardDealUrl(),
  onPress,
}: SponsoredExpenseRowProps) {
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
            ? 'rgba(99, 102, 241, 0.25)'
            : 'rgba(99, 102, 241, 0.2)',
        },
        Platform.OS === 'web' &&
          hovered && { transform: [{ translateY: -1 }], shadowOpacity: 0.08 },
      ]}
      onPress={handlePress}
    >
      <View
        style={[
          styles.emojiWrap,
          { backgroundColor: 'rgba(99, 102, 241, 0.14)' },
        ]}
      >
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.title, { color: theme.colors.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[styles.meta, { color: theme.colors.textTertiary }]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
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
    borderStyle: 'dashed',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '0.15s',
  } as any,
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    fontWeight: '400',
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
});
