// src/components/ui/TabBar.tsx
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';
import { Typography } from './Typography';
import { Badge } from './Badge';
import { GlassCard } from './GlassCard';
import { haptics } from '../../utils/haptics';
import AppIcon from '../common/AppIcon';
import type { Theme } from '../../theme';

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
  badge?: string | number;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export type TabVariant = 'pills' | 'underline' | 'segmented';

export interface TabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onTabChange: (key: string) => void;
  variant?: TabVariant;
  scrollable?: boolean;
  style?: ViewStyle;
  hapticFeedback?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}

export function TabBar({
  tabs,
  activeKey,
  onTabChange,
  variant = 'pills',
  scrollable = false,
  style,
  hapticFeedback = true,
  size = 'md',
  orientation = 'horizontal',
}: TabBarProps) {
  const theme = useTheme();
  const styles = getStyles(theme, variant, size, orientation);

  // Reanimated shared values for smooth 60fps indicator
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabLayouts = React.useRef<Record<string, { x: number; width: number }>>(
    {},
  );

  useEffect(() => {
    const layout = tabLayouts.current[activeKey];
    if (layout) {
      indicatorPosition.value = withSpring(layout.x, {
        damping: 18,
        stiffness: 180,
      });
      indicatorWidth.value = withSpring(layout.width, {
        damping: 18,
        stiffness: 180,
      });
    }
  }, [activeKey, tabs]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: indicatorWidth.value,
  }));

  const handleTabPress = (key: string) => {
    if (hapticFeedback) haptics.light();
    onTabChange(key);
  };

  const containerStyles = [
    styles.container,
    variant === 'segmented' && styles.containerSegmented,
    variant === 'pills' && styles.containerPills,
    variant === 'underline' && styles.containerUnderline,
    style,
  ];

  const ContainerComponent: any = variant === 'segmented' ? GlassCard : View;
  const containerProps = variant === 'segmented' ? { intensity: 40 } : {};

  const renderTab = (tab: TabItem) => {
    const isActive = activeKey === tab.key;

    const tabStyles = [
      styles.tab,
      variant === 'segmented' && !scrollable && styles.tabSegmented,
      variant === 'segmented' &&
        scrollable && { borderRadius: theme.borderRadius.full },
      variant === 'pills' && styles.tabPill,
      variant === 'underline' && styles.tabUnderline,
      isActive && variant === 'segmented' && styles.tabSegmentedActive,
      isActive && variant === 'pills' && styles.tabPillActive,
    ];

    const textStyles = [
      styles.tabText,
      size === 'sm' && styles.tabTextSm,
      size === 'lg' && styles.tabTextLg,
      isActive && styles.tabTextActive,
      isActive && variant === 'segmented' && styles.tabTextSegmentedActive,
    ];

    return (
      <Pressable
        key={tab.key}
        onPress={() => handleTabPress(tab.key)}
        onLayout={e => {
          const { x, width } = e.nativeEvent.layout;
          tabLayouts.current[tab.key] = { x, width };
        }}
        style={({ pressed, hovered }: any) => [
          tabStyles,
          pressed && styles.tabPressed,
          Platform.OS === 'web' && hovered && !isActive && styles.tabHovered,
        ]}
      >
        {tab.icon &&
          (typeof tab.icon === 'string' &&
          tab.icon.length > 2 &&
          !tab.icon.includes(' ') ? (
            <AppIcon
              name={tab.icon as any}
              size={size === 'sm' ? 13 : 15}
              color={
                isActive
                  ? variant === 'underline'
                    ? theme.colors.primary
                    : '#FFFFFF'
                  : theme.colors.textSecondary
              }
            />
          ) : (
            <Typography
              variant={size === 'sm' ? 'caption' : 'bodySm'}
              style={{ opacity: isActive ? 1 : 0.6 }}
            >
              {tab.icon}
            </Typography>
          ))}
        <Typography
          variant={
            size === 'sm' ? 'caption' : size === 'lg' ? 'body' : 'bodySm'
          }
          weight={isActive ? 'bold' : 'semibold'}
          style={textStyles}
        >
          {tab.label}
        </Typography>
        {tab.badge !== undefined && tab.badge !== null && (
          <Badge
            label={String(tab.badge)}
            variant={tab.badgeVariant || (isActive ? 'accent' : 'neutral')}
          />
        )}
      </Pressable>
    );
  };

  const renderIndicator = () => {
    if (variant !== 'underline') return null;
    return <Animated.View style={[styles.indicator, indicatorAnimatedStyle]} />;
  };

  const content = (
    <View style={styles.tabsWrapper}>
      {tabs.map(renderTab)}
      {renderIndicator()}
    </View>
  );

  if (scrollable) {
    return (
      <ContainerComponent {...containerProps} style={containerStyles}>
        <ScrollView
          horizontal={orientation === 'horizontal'}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      </ContainerComponent>
    );
  }

  return (
    <ContainerComponent {...containerProps} style={containerStyles}>
      {content}
    </ContainerComponent>
  );
}

function getStyles(
  theme: Theme,
  variant: TabVariant,
  size: 'sm' | 'md' | 'lg',
  orientation: 'horizontal' | 'vertical',
) {
  const sizeConfig = {
    sm: { paddingY: 6, paddingX: 14, gap: 6, fontSize: 12 },
    md: { paddingY: 8, paddingX: 16, gap: 6, fontSize: 13 },
    lg: { paddingY: 10, paddingX: 20, gap: 8, fontSize: 14 },
  };
  const s = sizeConfig[size];

  const isVertical = orientation === 'vertical';

  return StyleSheet.create({
    container: { width: '100%' },
    containerPills: { paddingVertical: 4 },
    containerSegmented: {
      borderRadius: theme.borderRadius.full,
      padding: 4,
      overflow: 'hidden',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.04)',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    },
    containerUnderline: {
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)',
    },
    scrollContent: isVertical
      ? { paddingBottom: 16, gap: 4 }
      : { paddingRight: 16, gap: 6 },
    tabsWrapper: {
      flexDirection: isVertical ? 'column' : 'row',
      alignItems: isVertical ? 'stretch' : 'center',
      position: 'relative',
      gap: isVertical ? 4 : 4,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isVertical ? 'flex-start' : 'center',
      paddingVertical: s.paddingY,
      paddingHorizontal: s.paddingX,
      gap: s.gap,
      borderRadius: theme.borderRadius.full,
      position: 'relative',
    },
    tabPressed: { transform: [{ scale: 0.96 }] },
    tabHovered: {
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(0,0,0,0.04)',
    },
    tabSegmented: { flex: 1, borderRadius: theme.borderRadius.full },
    tabSegmentedActive: {
      backgroundColor: '#2563EB',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    tabPill: {
      borderRadius: theme.borderRadius.full,
      marginHorizontal: 2,
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.03)',
    },
    tabPillActive: {
      backgroundColor: '#2563EB',
      borderColor: '#1D4ED8',
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    tabUnderline: { borderRadius: 0, paddingBottom: s.paddingY + 6 },
    tabText: {
      fontSize: s.fontSize,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    tabTextSm: { fontSize: 12 },
    tabTextLg: { fontSize: 15 },
    tabTextActive: {
      color: variant === 'underline' ? theme.colors.primary : '#FFFFFF',
      fontWeight: '700',
    },
    tabTextSegmentedActive: { color: '#FFFFFF', fontWeight: '700' },
    indicator: {
      position: 'absolute',
      bottom: 0,
      height: 3,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
  });
}

export function useTabBar(initialKey: string, tabs: TabItem[]) {
  const [activeKey, setActiveKey] = React.useState(initialKey);
  const activeTab = tabs.find(t => t.key === activeKey);
  return {
    activeKey,
    activeTab,
    setActiveKey,
    props: { tabs, activeKey, onTabChange: setActiveKey },
  };
}
