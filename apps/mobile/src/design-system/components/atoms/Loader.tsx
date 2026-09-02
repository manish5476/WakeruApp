import React from 'react';
import { View, Animated, Easing, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

export const Loader = React.forwardRef<View, LoaderProps>(
  ({ size = 'md', color, style, testID }, ref) => {
    const { colors } = useTheme();
    const spinAnim = React.useRef(new Animated.Value(0)).current;

    const sizeMap = {
      sm: 32,
      md: 48,
      lg: 64,
    };

    const loaderSize = sizeMap[size];
    const strokeWidth = size === 'sm' ? 2 : size === 'md' ? 3 : 4;

    React.useEffect(() => {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    }, [spinAnim]);

    const spin = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View
        ref={ref}
        style={[
          {
            width: loaderSize,
            height: loaderSize,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
        testID={testID}
      >
        <Animated.View
          style={{
            width: loaderSize,
            height: loaderSize,
            borderRadius: loaderSize / 2,
            borderWidth: strokeWidth,
            borderColor: color || colors.primary,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: spin }],
          }}
        />
      </View>
    );
  },
);

Loader.displayName = 'Loader';
