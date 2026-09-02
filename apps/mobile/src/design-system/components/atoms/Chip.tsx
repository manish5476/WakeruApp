/**
 * Chip Component
 * Compact interactive element for selection and filtering
 */

import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS, SPACING } from '../../tokens/tokens';
import Text from '../primitives/Text';
import Box from '../primitives/Box';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  onDelete?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  onDelete,
  style,
  testID,
}) => {
  const { colors } = useTheme();

  const chipStyle: ViewStyle = {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: selected ? colors.primary : colors.surfaceAlt,
    borderWidth: selected ? 0 : 1,
    borderColor: colors.border,
  };

  return (
    <Pressable onPress={onPress} style={[chipStyle, style]} testID={testID}>
      <Box flexDirection="row" alignItems="center" gap="sm">
        {icon}
        <Text
          variant="labelSmall"
          color={selected ? colors.textInverted : colors.text}
        >
          {label}
        </Text>
      </Box>
      {onDelete && (
        <Pressable onPress={onDelete}>
          <Text
            color={selected ? colors.textInverted : colors.text}
            style={{ marginLeft: SPACING.xs }}
          >
            ×
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
};

export default Chip;
