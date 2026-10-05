// src/components/ui/SyncStatusIndicator.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  ViewStyle,
} from 'react-native';
import { useNetworkState } from '../../hooks/useNetworkState';
import { useTheme } from '../../providers/ThemeProvider';
import AppIcon from '../common/AppIcon';

interface SyncStatusIndicatorProps {
  style?: ViewStyle;
  tripId?: string;
  compact?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  style,
  tripId,
  compact = false,
}) => {
  const { isOnline, syncState, pendingCount, triggerSync } = useNetworkState();
  const theme = useTheme();

  // Animation for fading / sliding indicator
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline && syncState === 'SYNCED' && pendingCount === 0) {
      // Fade out after 3 seconds of being in SYNCED state
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [isOnline, syncState, pendingCount]);

  // If online, idle, and no pending changes, don't show anything intrusive
  if (isOnline && syncState === 'IDLE' && pendingCount === 0) {
    return null;
  }

  // Configure appearance based on state
  let iconName = 'check';
  let message = 'All changes synced';
  let bgColor = theme.colors.successBg;
  let textColor = theme.colors.success;
  let isActionable = false;

  if (!isOnline) {
    iconName = 'wifi-off';
    message =
      pendingCount > 0
        ? `${pendingCount} saved offline · Syncs when online`
        : 'Offline · Changes saved locally';
    bgColor = theme.colors.warningBg;
    textColor = theme.colors.warning;
  } else if (syncState === 'SYNCING') {
    iconName = 'refresh-cw';
    message =
      pendingCount > 0
        ? `Syncing ${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'}…`
        : 'Syncing…';
    bgColor = theme.colors.infoBg;
    textColor = theme.colors.info;
  } else if (syncState === 'ERROR') {
    iconName = 'alert-circle';
    message = 'Sync issue · Tap to retry';
    bgColor = theme.colors.dangerBg;
    textColor = theme.colors.danger;
    isActionable = true;
  }

  const content = (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor: `${textColor}33`,
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      {syncState === 'SYNCING' ? (
        <ActivityIndicator
          size="small"
          color={textColor}
          style={styles.spinner}
        />
      ) : (
        <AppIcon name={iconName} size={14} color={textColor} />
      )}
      {!compact && (
        <Text style={[styles.text, { color: textColor }]}>{message}</Text>
      )}
    </Animated.View>
  );

  if (isActionable) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => triggerSync(tripId)}
        accessibilityRole="button"
        accessibilityLabel="Retry syncing"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: 4,
    gap: 6,
  },
  spinner: {
    marginRight: 2,
    transform: [{ scale: 0.75 }],
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
