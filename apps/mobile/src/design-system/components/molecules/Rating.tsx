import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import Text from '../primitives/Text';
import { HStack, VStack } from '../primitives/Stack';
import { useTheme } from '../../hooks/useTheme';
import { SPACING } from '../../tokens/tokens';

export interface RatingProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showText?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Rating = React.forwardRef<View, RatingProps>(
  (
    {
      rating,
      maxRating = 5,
      onRatingChange,
      size = 'md',
      readOnly = false,
      showText = true,
      style,
      testID,
    },
    ref,
  ) => {
    const { colors } = useTheme();

    const sizeMap = {
      sm: 20,
      md: 28,
      lg: 36,
    };

    const starSize = sizeMap[size];

    const renderStars = () => {
      return Array.from({ length: maxRating }, (_, index) => {
        const starRating = index + 1;
        const isFilled = starRating <= Math.round(rating);

        return (
          <Pressable
            key={index}
            onPress={() => !readOnly && onRatingChange?.(starRating)}
            disabled={readOnly}
            style={{ padding: SPACING.xs }}
          >
            <Text
              style={{
                fontSize: starSize,
                color: isFilled
                  ? colors.warning || '#FFC107'
                  : colors.surfaceVariant,
              }}
            >
              ★
            </Text>
          </Pressable>
        );
      });
    };

    return (
      <VStack ref={ref} gap="sm" align="center" style={style} testID={testID}>
        <HStack gap="xs">{renderStars()}</HStack>
        {showText && (
          <Text variant="caption" weight="600" color={colors.onSurfaceVariant}>
            {rating.toFixed(1)} / {maxRating}
          </Text>
        )}
      </VStack>
    );
  },
);

Rating.displayName = 'Rating';
