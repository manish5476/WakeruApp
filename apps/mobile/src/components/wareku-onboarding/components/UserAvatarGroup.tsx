import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme/tokens';

interface Traveler {
  name: string;
  uri: string;
}

interface UserAvatarGroupProps {
  travelers: Traveler[];
  extraCount?: number;
  size?: number;
  ringColor?: string;
}

/**
 * Overlapping avatar stack used on the Trip Planning card and the
 * Welcome screen's "50K+ travelers" social proof block.
 */
export default function UserAvatarGroup({
  travelers,
  extraCount = 0,
  size = 32,
  ringColor = colors.surfaceDark,
}: UserAvatarGroupProps) {
  return (
    <View style={styles.row}>
      {travelers.map((traveler, i) => (
        <Image
          key={traveler.name}
          source={{ uri: traveler.uri }}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: i > 0 ? -size * 0.32 : 0,
              borderColor: ringColor,
            },
          ]}
        />
      ))}
      {extraCount > 0 && (
        <View
          style={[
            styles.extra,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size * 0.32,
              borderColor: ringColor,
            },
          ]}
        >
          <Text style={[styles.extraText, { fontSize: size * 0.34 }]}>
            +{extraCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { borderWidth: 2 },
  extra: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oceanBlue,
    borderWidth: 2,
  },
  extraText: {
    color: colors.textOnDark,
    fontWeight: typography.label.fontWeight,
  },
});
