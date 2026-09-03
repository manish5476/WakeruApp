import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import AppIcon from '../../common/AppIcon';
import { colors, radius, spacing, typography, shadow } from '../theme/tokens';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'ghost';
  fullWidth?: boolean;
  style?: ViewStyle;
}

/**
 * Primary CTA used across all 5 onboarding screens.
 * Uses Reanimated for ultra-smooth 60fps tactile pressing.
 */
export default function GradientButton({
  label,
  onPress,
  icon = 'arrow-right',
  variant = 'primary',
  fullWidth = true,
  style,
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const pressIn = () => {
    scale.value = withSpring(0.96, { damping: 12, stiffness: 300 });
  };
  const pressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (variant === 'ghost') {
    return (
      <Animated.View
        style={[animatedStyle, fullWidth && styles.fullWidth, style]}
      >
        <Pressable
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          style={styles.ghostButton}
        >
          <Text style={styles.ghostText}>{label}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[animatedStyle, fullWidth && styles.fullWidth, style]}
    >
      {/* Outer glow layer */}
      <View style={[StyleSheet.absoluteFill, styles.glowLayer]} />
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <LinearGradient
          colors={['#0EA5E9', '#10B981'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={styles.label}>{label}</Text>
          {icon ? (
            <AppIcon name={icon} size={20} color={colors.textOnDark} />
          ) : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 18,
    borderRadius: radius.lg,
  },
  label: {
    color: colors.textOnDark,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
  ghostButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassLight,
  },
  ghostText: {
    color: colors.textOnDark,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
  },
  glowLayer: {
    borderRadius: radius.lg,
    backgroundColor: '#0EA5E9',
    opacity: 0.4,
    filter: 'blur(12px)',
    transform: [{ scale: 1.05 }, { translateY: 4 }],
  },
});
