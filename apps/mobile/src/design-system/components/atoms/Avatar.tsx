import React from 'react';
import { View, ViewStyle, Image, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../../theme';
import { Text } from '../primitives/Text';

export interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  source?: ImageSourcePropType;
  fallbackInitials?: string;
}

export const Avatar = ({ size = 'md', source, fallbackInitials }: AvatarProps) => {
  const { tokens } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'sm': return 32;
      case 'md': return 48;
      case 'lg': return 64;
      case 'xl': return 96;
      default: return 48;
    }
  };

  const dimensions = getSize();

  const style: ViewStyle = {
    width: dimensions,
    height: dimensions,
    borderRadius: tokens.radius.circle,
    backgroundColor: tokens.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };

  return (
    <View style={style}>
      {source ? (
        <Image source={source} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text variant={size === 'sm' ? 'bodySmall' : 'headingM'} color={tokens.colors.textSecondary}>
          {fallbackInitials ? fallbackInitials.substring(0, 2).toUpperCase() : '?'}
        </Text>
      )}
    </View>
  );
};
