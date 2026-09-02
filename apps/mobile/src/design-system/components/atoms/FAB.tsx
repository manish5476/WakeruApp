/**
 * FAB Component
 * Floating Action Button with animation support
 */

import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS, SHADOWS } from '../../tokens/tokens';

interface FABProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  disabled?: boolean;
  testID?: string;
}

const POSITION_STYLES: Record<string, ViewStyle> = {
  'bottom-right': {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  'bottom-left': {
    position: 'absolute',
    bottom: 24,
    left: 24,
  },
  'bottom-center': {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    marginLeft: -28,
  },
} as const;

export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  style,
  position = 'bottom-right',
  disabled = false,
  testID,
}) => {
  const { colors } = useTheme();

  const fabStyle: ViewStyle = {
    ...POSITION_STYLES[position],
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[fabStyle, style]}
      testID={testID}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
    >
      {icon}
    </Pressable>
  );
};

export default FAB;
