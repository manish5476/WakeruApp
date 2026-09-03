// src/components/ui/Avatar.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';

export interface AvatarProps {
  url?: string | null;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  ringColor?: string;
  style?: ViewStyle;
  /** If true, tapping the avatar opens a full-screen lightbox preview */
  previewable?: boolean;
}

export function Avatar({
  url,
  fallback = '?',
  size = 'md',
  online,
  ringColor,
  style,
  previewable = true,
}: AvatarProps) {
  const theme = useTheme();
  const [previewVisible, setPreviewVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const dimensions = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  };

  const fontSize = {
    sm: 'caption' as const,
    md: 'bodySm' as const,
    lg: 'body' as const,
    xl: 'h3' as const,
  };

  const dimension = dimensions[size];
  const ringWidth = size === 'xl' ? 3 : size === 'lg' ? 2.5 : 2;
  const onlineDotSize = size === 'xl' ? 14 : size === 'lg' ? 12 : 10;

  const accentColor = ringColor || theme.colors.accent;

  const openPreview = () => {
    if (!previewable || !url) return;
    setPreviewVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 25,
    }).start();
  };

  const closePreview = () => {
    Animated.spring(scaleAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 200,
      friction: 25,
    }).start(() => setPreviewVisible(false));
  };

  const renderAvatar = () => {
    if (url) {
      return (
        <Image
          source={{ uri: url }}
          style={{
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          }}
          resizeMode="cover"
        />
      );
    }
    return (
      <View
        style={[
          styles.fallback,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            backgroundColor: accentColor,
          },
        ]}
      >
        <Typography
          variant={fontSize[size]}
          weight="extrabold"
          color="textInverse"
          style={{ letterSpacing: -0.3 }}
        >
          {fallback}
        </Typography>
      </View>
    );
  };

  const content = (
    <>
      <View
        style={[
          styles.ring,
          {
            width: dimension + ringWidth * 2,
            height: dimension + ringWidth * 2,
            borderRadius: (dimension + ringWidth * 2) / 2,
            borderColor: `${accentColor}60`,
            borderWidth: ringWidth,
          },
        ]}
      >
        {renderAvatar()}
      </View>

      {online !== undefined && (
        <View
          style={[
            styles.onlineDot,
            {
              width: onlineDotSize,
              height: onlineDotSize,
              borderRadius: onlineDotSize / 2,
              backgroundColor: online
                ? theme.colors.success
                : theme.colors.textTertiary,
              borderColor: theme.colors.surface,
              borderWidth: 2,
              bottom: ringWidth,
              right: ringWidth,
            },
          ]}
        />
      )}
    </>
  );

  return (
    <>
      <TouchableOpacity
        onPress={openPreview}
        activeOpacity={0.8}
        disabled={!previewable || !url}
        style={[styles.container, style]}
      >
        {content}
      </TouchableOpacity>

      {/* PREVIEW MODAL */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closePreview}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.previewContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: scaleAnim,
              },
            ]}
          >
            {url && (
              <Image
                source={{ uri: url }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
  },
  // --- Preview Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: '90%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});
