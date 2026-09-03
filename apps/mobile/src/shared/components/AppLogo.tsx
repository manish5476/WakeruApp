import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface AppLogoProps {
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  borderRadius?: number;
}

export default function AppLogo({
  size = 40,
  width,
  height,
  style,
  borderRadius,
}: AppLogoProps) {
  const w = width || size;
  const h = height || size;
  const rad =
    borderRadius !== undefined
      ? borderRadius
      : Math.round(Math.min(w, h) * 0.22);

  return (
    <Image
      source={require('../../../assets/icon.png')}
      style={[
        {
          width: w,
          height: h,
          borderRadius: rad,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 4,
        } as ImageStyle,
        style,
      ]}
      resizeMode="contain"
    />
  );
}
