/**
 * Modal Component
 * Overlay dialog component with backdrop
 */

import React, { ReactNode } from 'react';
import {
  Modal as RNModal,
  View,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS, Z_INDEX } from '../../tokens/tokens';
import Box from '../primitives/Box';
import Text from '../primitives/Text';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  animated?: boolean;
  transparent?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  title,
  animated = true,
  transparent = true,
  style,
  testID,
}) => {
  const { colors } = useTheme();

  const modalContent: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  };

  const modalBody: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: RADIUS.xl,
    maxWidth: '90%',
    padding: SPACING.lg,
    zIndex: Z_INDEX.modal,
  };

  return (
    <RNModal
      visible={visible}
      transparent={transparent}
      animationType={animated ? 'fade' : 'none'}
      onRequestClose={onClose}
    >
      <Pressable style={modalContent} onPress={onClose} testID={testID}>
        <Pressable
          style={[modalBody, style]}
          onPress={e => e.stopPropagation()}
        >
          {title && (
            <Box marginBottom="lg">
              <Text variant="headingMedium">{title}</Text>
            </Box>
          )}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
};

export default Modal;
