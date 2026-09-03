import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface WakeruLogoProps {
  size?: number;
  showText?: boolean;
  color?: 'light' | 'dark';
}

export function WakeruLogo({
  size = 48,
  showText = true,
  color = 'light',
}: WakeruLogoProps) {
  const iconSize = size;
  const innerSize = iconSize * 0.55;
  const offset = iconSize * 0.15;

  return (
    <View style={styles.container}>
      <View
        style={[styles.iconContainer, { width: iconSize, height: iconSize }]}
      >
        {/* Back shape (emerald) */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={[
            styles.shape,
            styles.shapeBack,
            {
              width: innerSize,
              height: innerSize,
              left: offset,
              top: offset,
              borderRadius: innerSize * 0.3,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Front shape (blue) */}
        <LinearGradient
          colors={['#0EA5E9', '#2563EB']}
          style={[
            styles.shape,
            styles.shapeFront,
            {
              width: innerSize,
              height: innerSize,
              right: offset,
              bottom: offset,
              borderRadius: innerSize * 0.3,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Overlap highlight */}
        <View
          style={[
            styles.shape,
            styles.shapeOverlap,
            {
              width: innerSize * 0.7,
              height: innerSize * 0.7,
              borderRadius: innerSize * 0.2,
              top: offset * 2.2,
              left: offset * 2.2,
            },
          ]}
        />
      </View>

      {showText && (
        <Text
          style={[
            styles.text,
            {
              fontSize: size * 0.5,
              color: color === 'light' ? '#F8FAFC' : '#0F172A',
            },
          ]}
        >
          WAKERU
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shape: {
    position: 'absolute',
  },
  shapeBack: {
    opacity: 0.9,
    transform: [{ rotate: '15deg' }],
  },
  shapeFront: {
    opacity: 0.95,
    transform: [{ rotate: '-15deg' }],
  },
  shapeOverlap: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '45deg' }],
    zIndex: 10,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: 'System',
  },
});
