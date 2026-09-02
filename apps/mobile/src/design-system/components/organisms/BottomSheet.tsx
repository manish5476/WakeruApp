/**
 * BottomSheet Component
 * Slide-up panel from bottom of screen
 */

import React, { ReactNode } from 'react';
import {
  Modal,
  View,
  Pressable,
  ViewStyle,
  StyleProp,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { RADIUS, SPACING } from '../../tokens/tokens';
import Box from '../primitives/Box';
import Text from '../primitives/Text';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  height?: number | string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  title,
  height = '60%',
  style,
  testID,
}) => {
  const { colors } = useTheme();

  const bottomSheetHeight =
    typeof height === 'number'
      ? height
      : (parseFloat(height as string) / 100) * SCREEN_HEIGHT;

  const containerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  };

  const sheetStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: bottomSheetHeight,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  };

  const handleStyle: ViewStyle = {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={containerStyle} onPress={onClose} testID={testID}>
        <Pressable
          style={[sheetStyle, style]}
          onPress={e => e.stopPropagation()}
        >
          <View style={handleStyle} />
          {title && (
            <Box marginBottom="lg">
              <Text variant="headingSmall">{title}</Text>
            </Box>
          )}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default BottomSheet;
