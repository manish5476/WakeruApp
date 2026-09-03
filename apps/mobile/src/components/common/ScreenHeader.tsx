// src/components/common/ScreenHeader.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from '../ui/Typography';
import { GlassCard } from '../ui/GlassCard';
import { InteractiveWrapper } from '../ui/InteractiveWrapper';
import { haptics } from '../../utils/haptics';
import AppIcon from './AppIcon';

export type ScreenHeaderVariant =
  'default' | 'glass' | 'transparent' | 'elevated';
export type ScreenHeaderSize = 'sm' | 'md' | 'lg';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onBackHaptic?: 'light' | 'medium' | 'heavy';
  rightAction?: {
    icon: string;
    onPress: () => void;
    haptic?: 'light' | 'medium' | 'heavy';
    badge?: number;
  };
  rightActions?: Array<{
    icon: string;
    onPress: () => void;
    haptic?: 'light' | 'medium' | 'heavy';
    badge?: number;
  }>;
  rightComponent?: React.ReactNode;
  variant?: ScreenHeaderVariant;
  size?: ScreenHeaderSize;
  /**
   * If true, the header will be sticky at the top of the screen (web only)
   */
  sticky?: boolean;
  /**
   * Custom elevation/shadow intensity
   */
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Custom padding
   */
  paddingHorizontal?: number;
  paddingVertical?: number;
  /**
   * If true, shows a decorative gradient line at the bottom
   */
  accentLine?: boolean;
  /**
   * Custom accent color for the line
   */
  accentColor?: string;
  /**
   * If true, title is centered. If false, title is left-aligned
   */
  centered?: boolean;
  /**
   * Custom fallback for back button (if not using router.back)
   */
  fallbackRoute?: string;
  /**
   * Additional styles for the container
   */
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  onBackHaptic = 'light',
  rightAction,
  rightActions,
  rightComponent,
  variant = 'default',
  size = 'md',
  sticky = false,
  elevation = 'sm',
  paddingHorizontal,
  paddingVertical,
  accentLine = false,
  accentColor,
  centered = true,
  fallbackRoute,
  style,
}: ScreenHeaderProps) {
  const theme = useTheme();

  // --- Haptic feedback ---
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    switch (type) {
      case 'light':
        haptics.light();
        break;
      case 'medium':
        haptics.medium();
        break;
      case 'heavy':
        haptics.heavy();
        break;
      default:
        haptics.light();
    }
  };

  // --- Back handler ---
  const handleBack = () => {
    triggerHaptic(onBackHaptic);
    if (onBack) {
      onBack();
    } else if (fallbackRoute) {
      router.push(fallbackRoute as any);
    } else {
      router.back();
    }
  };

  // --- Size variants ---
  const sizeMap = {
    sm: {
      paddingVertical: 8,
      titleSize: 'subtitle' as const,
      backSize: 28,
      iconSize: 16,
    },
    md: {
      paddingVertical: 12,
      titleSize: 'h3' as const,
      backSize: 36,
      iconSize: 18,
    },
    lg: {
      paddingVertical: 16,
      titleSize: 'h2' as const,
      backSize: 44,
      iconSize: 20,
    },
  };

  const sizeConfig = sizeMap[size];

  // --- Variant styles ---
  const getVariantStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingHorizontal: paddingHorizontal ?? theme.spacing.lg,
      paddingVertical: paddingVertical ?? sizeConfig.paddingVertical,
      minHeight: size === 'lg' ? 72 : size === 'sm' ? 48 : 56,
      width: '100%',
    };

    switch (variant) {
      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          marginHorizontal: theme.spacing.md,
          marginTop: theme.spacing.md,
          borderRadius: theme.borderRadius.xl,
          borderWidth: 1,
          borderColor: theme.glass.borderTopColor,
          ...(elevation !== 'none' &&
            theme.shadows[elevation as keyof typeof theme.shadows]),
        };
      case 'transparent':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          ...(elevation !== 'none' &&
            theme.shadows[elevation as keyof typeof theme.shadows]),
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
        };
      case 'default':
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
        };
    }
  };

  const variantStyle = getVariantStyle();

  // --- Sticky styles (web only) ---
  const getStickyStyle = (): ViewStyle => {
    if (!sticky || Platform.OS !== 'web') return {};
    return {
      position: 'sticky' as any,
      top: 0,
      zIndex: 100,
    } as ViewStyle;
  };

  // --- Render back button ---
  const renderBackButton = () => {
    if (!onBack && !fallbackRoute) return null;

    const isGlass = variant === 'glass';

    return (
      <InteractiveWrapper onPress={handleBack}>
        <View
          style={[
            styles.backButton,
            {
              width: sizeConfig.backSize,
              height: sizeConfig.backSize,
              borderRadius: sizeConfig.backSize / 2,
              backgroundColor: isGlass
                ? 'rgba(255,255,255,0.15)'
                : theme.colors.primaryBg,
              borderWidth: isGlass ? 1 : 0,
              borderColor: isGlass ? 'rgba(255,255,255,0.2)' : 'transparent',
            },
          ]}
        >
          <AppIcon
            name="chevron-left"
            size={sizeConfig.iconSize}
            color={
              isGlass ? theme.colors.textInverse : theme.colors.textPrimary
            }
          />
        </View>
      </InteractiveWrapper>
    );
  };

  // --- Render right actions ---
  const renderRightActions = () => {
    const actions = rightActions || (rightAction ? [rightAction] : []);
    const isGlass = variant === 'glass';

    if (actions.length === 0 && !rightComponent) return null;

    return (
      <View style={styles.rightContainer}>
        {actions.map((action, index) => (
          <InteractiveWrapper
            key={index}
            onPress={() => {
              triggerHaptic(action.haptic || 'light');
              action.onPress();
            }}
            style={styles.actionWrapper}
          >
            <View
              style={[
                styles.actionButton,
                {
                  width: sizeConfig.backSize,
                  height: sizeConfig.backSize,
                  borderRadius: sizeConfig.backSize / 2,
                  backgroundColor: isGlass
                    ? 'rgba(255,255,255,0.15)'
                    : theme.colors.primaryBg,
                  borderWidth: isGlass ? 1 : 0,
                  borderColor: isGlass
                    ? 'rgba(255,255,255,0.2)'
                    : 'transparent',
                },
              ]}
            >
              <AppIcon
                name={action.icon}
                size={sizeConfig.iconSize}
                color={
                  isGlass ? theme.colors.textInverse : theme.colors.textPrimary
                }
              />
              {action.badge && action.badge > 0 && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: theme.colors.danger,
                      borderColor: isGlass
                        ? 'rgba(255,255,255,0.2)'
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    color="textInverse"
                    style={styles.badgeText}
                  >
                    {action.badge > 99 ? '99+' : action.badge}
                  </Typography>
                </View>
              )}
            </View>
          </InteractiveWrapper>
        ))}
        {rightComponent}
      </View>
    );
  };

  // --- Text color based on variant ---
  const getTextColor = () => {
    if (variant === 'glass') return 'textInverse';
    return 'textPrimary';
  };

  const getSubtitleColor = () => {
    if (variant === 'glass') return 'textInverse' as const;
    return 'textSecondary' as const;
  };

  // --- Render header content ---
  const renderHeaderContent = () => {
    const textColor = getTextColor();
    const subtitleColor = getSubtitleColor();

    return (
      <View style={styles.contentRow}>
        {/* Left Section */}
        <View style={[styles.leftSection, { width: sizeConfig.backSize + 8 }]}>
          {renderBackButton()}
        </View>

        {/* Center Section */}
        <View style={[styles.centerSection, !centered && styles.leftAligned]}>
          <Typography
            variant={sizeConfig.titleSize}
            weight="bold"
            color={textColor}
            numberOfLines={1}
            style={centered ? styles.centeredText : styles.leftText}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              color={subtitleColor}
              style={centered ? styles.centeredText : styles.leftText}
              opacity={0.7}
            >
              {subtitle}
            </Typography>
          )}
        </View>

        {/* Right Section */}
        <View style={[styles.rightSection, { width: sizeConfig.backSize + 8 }]}>
          {renderRightActions()}
        </View>
      </View>
    );
  };

  // --- Render ---
  const stickyStyle = getStickyStyle();

  if (variant === 'glass') {
    return (
      <View style={[stickyStyle, style]}>
        <GlassCard
          variant="medium"
          padding="none"
          intensity={theme.isDark ? 30 : 40}
          style={[styles.glassWrapper, variantStyle]}
        >
          {renderHeaderContent()}
        </GlassCard>
      </View>
    );
  }

  return (
    <>
      <View style={[stickyStyle, styles.container, variantStyle, style]}>
        {renderHeaderContent()}
      </View>

      {/* Accent Line */}
      {accentLine && variant !== 'elevated' && (
        <View
          style={[
            styles.accentLine,
            {
              backgroundColor: accentColor || theme.colors.accent,
              opacity: 0.6,
            },
          ]}
        />
      )}
    </>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  glassWrapper: {
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftSection: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  leftAligned: {
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionWrapper: {
    position: 'relative',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 14,
  },
  centeredText: {
    textAlign: 'center',
  },
  leftText: {
    textAlign: 'left',
  },
  accentLine: {
    height: 2,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 1,
  },
});
