// src/components/ui/PopoverTooltip.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from './GlassCard';
import { Typography } from './Typography';

interface PopoverTooltipProps {
  content: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function PopoverTooltip({
  content,
  children,
  style,
  placement = 'top',
}: PopoverTooltipProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const viewRef = useRef<View>(null);

  // Use window dimensions to prevent tooltips from going off-screen
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const handlePress = () => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      const tooltipWidth = 200;
      const tooltipHeight = 60;
      const spacing = 10;

      let tooltipLeft = x + width / 2 - tooltipWidth / 2; // Center horizontal
      let tooltipTop = y - tooltipHeight - spacing; // Default top

      if (placement === 'right') {
        tooltipLeft = x + width + spacing;
        tooltipTop = y + height / 2 - tooltipHeight / 2;
      } else if (placement === 'left') {
        tooltipLeft = x - tooltipWidth - spacing;
        tooltipTop = y + height / 2 - tooltipHeight / 2;
      } else if (placement === 'bottom') {
        tooltipTop = y + height + spacing;
      }

      // Clamp to prevent overflow off-screen
      tooltipLeft = Math.max(
        10,
        Math.min(tooltipLeft, windowWidth - tooltipWidth - 10),
      );
      tooltipTop = Math.max(
        40,
        Math.min(tooltipTop, windowHeight - tooltipHeight - 40),
      );

      setPosition({ top: tooltipTop, left: tooltipLeft });
      setVisible(true);
    });
  };

  return (
    <>
      <TouchableOpacity
        ref={viewRef}
        onPress={handlePress}
        activeOpacity={0.7}
        style={style}
      >
        <View pointerEvents="none">{children}</View>
      </TouchableOpacity>

      {/* Instead of Modal, render absolute positioned view conditionally */}
      {visible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setVisible(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            backgroundColor: 'transparent', // No dark overlay, just tap-outside to close
          }}
        >
          <TouchableOpacity activeOpacity={1}>
            <GlassCard
              variant="prominent"
              padding="md"
              intensity={theme.isDark ? 30 : 50}
              style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                width: 200,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="bodySm"
                weight="semibold"
                align="center"
                color="textPrimary"
              >
                {content}
              </Typography>
            </GlassCard>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </>
  );
}
