import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/tokens';

interface ProgressIndicatorProps {
  total: number;
  scrollX: Animated.Value;
  stepWidth: number;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Expanding pill-dot progress indicator with sleek dimensions and subtle glows.
 */
export default function ProgressIndicator({
  total,
  scrollX,
  stepWidth,
  orientation = 'horizontal',
}: ProgressIndicatorProps) {
  return (
    <View style={[styles.row, orientation === 'vertical' && styles.column]}>
      {Array.from({ length: total }).map((_, index) => {
        const inputRange = [
          (index - 1) * stepWidth,
          index * stepWidth,
          (index + 1) * stepWidth,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [6, 28, 6],
          extrapolate: 'clamp',
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: [
            'rgba(255,255,255,0.4)',
            colors.travelCyan,
            'rgba(255,255,255,0.4)',
          ],
          extrapolate: 'clamp',
        });

        // Add a subtle glow to the active dot
        const shadowOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0, 0.6, 0],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={{
              borderRadius: 4,
              width: orientation === 'vertical' ? 4 : dotWidth,
              height: orientation === 'vertical' ? dotWidth : 4,
              opacity,
              backgroundColor,
              shadowColor: colors.travelCyan,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 6,
              shadowOpacity,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  column: { flexDirection: 'column', alignItems: 'center', gap: 6 },
});
