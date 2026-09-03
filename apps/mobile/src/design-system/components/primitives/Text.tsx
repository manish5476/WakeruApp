/**
 * Text Component
 * Semantic text component with typography presets
 */

import React, { ReactNode } from 'react';
import { Text as RNText, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TEXT_PRESETS } from '../../fonts/typography';

type TypographyVariant = keyof typeof TEXT_PRESETS;

interface TextProps {
  children?: ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  numberOfLines?: number;
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold';
  italic?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  capitalize?: boolean;
  opacity?: number;
  testID?: string;
  onPress?: () => void;
}

export const Text: React.FC<TextProps> = ({
  children,
  style,
  variant = 'body',
  color,
  align,
  numberOfLines,
  weight,
  italic,
  uppercase,
  lowercase,
  capitalize,
  opacity,
  testID,
  onPress,
}) => {
  const { colors } = useTheme();

  const baseStyle = TEXT_PRESETS[variant];

  let displayText = String(children || '');
  if (uppercase) displayText = displayText.toUpperCase();
  if (lowercase) displayText = displayText.toLowerCase();
  if (capitalize)
    displayText = displayText.charAt(0).toUpperCase() + displayText.slice(1);

  const textStyle: TextStyle = {
    ...baseStyle,
    ...(color ? { color } : { color: colors.text }),
    ...(align && { textAlign: align }),
    ...(weight && {
      fontWeight:
        weight === 'bold'
          ? '700'
          : weight === 'semibold'
            ? '600'
            : weight === 'medium'
              ? '500'
              : weight === 'light'
                ? '300'
                : '400',
    }),
    ...(italic && { fontStyle: 'italic' }),
    ...(opacity !== undefined && { opacity }),
  };

  return (
    <RNText
      style={[textStyle, style]}
      numberOfLines={numberOfLines}
      testID={testID}
      onPress={onPress}
    >
      {displayText}
    </RNText>
  );
};

export default Text;
