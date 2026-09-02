import React, { ReactNode, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  ViewStyle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
} from 'react-native';
import { VStack, HStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../tokens/tokens';

export interface CarouselProps {
  items: ReactNode[];
  height?: number;
  showPagination?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
  snapToInterval?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Carousel = React.forwardRef<ScrollView, CarouselProps>(
  (
    {
      items,
      height = 200,
      showPagination = true,
      autoplay = false,
      autoplayInterval = 3000,
      snapToInterval = true,
      style,
      testID,
    },
    ref,
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { colors } = useTheme();
    const scrollViewRef = useRef<ScrollView>(null);
    const screenWidth = Dimensions.get('window').width;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / screenWidth);
      setCurrentIndex(index);
    };

    React.useEffect(() => {
      if (!autoplay) return;

      const interval = setInterval(() => {
        setCurrentIndex(prev => {
          const next = (prev + 1) % items.length;
          scrollViewRef.current?.scrollTo({
            x: next * screenWidth,
            animated: true,
          });
          return next;
        });
      }, autoplayInterval);

      return () => clearInterval(interval);
    }, [autoplay, autoplayInterval, items.length, screenWidth]);

    return (
      <VStack gap="md" style={style} testID={testID}>
        <ScrollView
          ref={r => {
            scrollViewRef.current = r;
            if (typeof ref === 'function') ref(r);
            else if (ref) ref.current = r;
          }}
          horizontal
          pagingEnabled={snapToInterval}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          style={{ height }}
        >
          {items.map((item, index) => (
            <View
              key={index}
              style={{
                width: screenWidth,
                height,
              }}
            >
              {item}
            </View>
          ))}
        </ScrollView>

        {showPagination && (
          <HStack justify="center" gap="sm">
            {items.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: RADIUS.full,
                  backgroundColor:
                    index === currentIndex
                      ? colors.primary
                      : colors.surfaceVariant,
                }}
              />
            ))}
          </HStack>
        )}
      </VStack>
    );
  },
);

Carousel.displayName = 'Carousel';
