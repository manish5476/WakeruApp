/**
 * Avatar Component
 * User profile picture display with initials fallback
 */

import React from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS } from '../../tokens/tokens';
import Text from '../primitives/Text';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: { uri: string };
  name?: string;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const AVATAR_SIZES: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = 'U',
  size = 'md',
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const avatarSize = AVATAR_SIZES[size];

  // Get initials from name
  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: RADIUS.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };

  const imageStyle: ImageStyle = {
    width: avatarSize,
    height: avatarSize,
  };

  const textSize =
    size === 'xs' ? 'label' : size === 'sm' ? 'bodySmall' : 'body';
  return (
    <View style={[containerStyle, style]} testID={testID}>
      {source ? (
        <Image source={source} style={imageStyle} />
      ) : (
        <Text variant={textSize} color={colors.textInverted} align="center">
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

export default Avatar;
