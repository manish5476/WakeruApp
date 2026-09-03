import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface AvatarGroupProps {
  urls: string[];
  max?: number;
  size?: number;
}

export function AvatarGroup({ urls, max = 3, size = 32 }: AvatarGroupProps) {
  const theme = useTheme();
  const visibleAvatars = urls.slice(0, max);
  const extraCount = urls.length - max;

  return (
    <View style={styles.container}>
      {visibleAvatars.map((url, index) => (
        <Image
          key={index}
          source={{ uri: url }}
          resizeMode="cover"
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: index === 0 ? 0 : -size * 0.35, // Perfect overlapping optical ratio
              borderColor: theme.colors.surface,
              borderWidth: 2,
            },
          ]}
        />
      ))}
      {extraCount > 0 && (
        <View
          style={[
            styles.extraBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size * 0.35,
              borderColor: theme.colors.surface,
              backgroundColor: theme.colors.borderLight,
            },
          ]}
        >
          <Text
            style={[
              styles.extraText,
              { fontSize: size * 0.35, color: theme.colors.textPrimary },
            ]}
          >
            +{extraCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extraBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  extraText: {
    fontWeight: '700',
  },
});
