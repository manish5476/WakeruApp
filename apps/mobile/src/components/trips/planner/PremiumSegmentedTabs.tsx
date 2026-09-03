import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../../providers/ThemeProvider';

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
}

interface PremiumSegmentedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'primary' | 'secondary';
}

export function PremiumSegmentedTabs({
  tabs,
  activeTab,
  onChange,
  variant = 'primary',
}: PremiumSegmentedTabsProps) {
  const theme = useTheme();
  const [tabWidths, setTabWidths] = useState<{ [key: string]: number }>({});
  const [tabPositions, setTabPositions] = useState<{ [key: string]: number }>(
    {},
  );
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  useEffect(() => {
    const activeWidth = tabWidths[activeTab];
    const activePos = tabPositions[activeTab];
    if (activeWidth !== undefined && activePos !== undefined) {
      indicatorWidth.value = withSpring(
        activeWidth,
        theme.animation.easing.spring,
      );
      indicatorPosition.value = withSpring(
        activePos,
        theme.animation.easing.spring,
      );
    }
  }, [
    activeTab,
    tabWidths,
    tabPositions,
    indicatorWidth,
    indicatorPosition,
    theme.animation.easing.spring,
  ]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: indicatorWidth.value,
  }));

  const handleLayout = (
    event: LayoutChangeEvent,
    tabId: string,
    index: number,
  ) => {
    const { width, x } = event.nativeEvent.layout;
    setTabWidths(prev => ({ ...prev, [tabId]: width }));
    setTabPositions(prev => ({ ...prev, [tabId]: x }));
  };

  const isPrimary = variant === 'primary';
  const containerBg = isPrimary ? theme.colors.neutralBg : 'transparent';
  const indicatorBg = isPrimary ? theme.colors.surface : theme.colors.neutralBg;
  const padding = isPrimary ? theme.spacing['1'] : 0;
  const borderRadius = isPrimary ? theme.borderRadius.xl : 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: containerBg, borderRadius, padding },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.keys(tabWidths).length > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                backgroundColor: indicatorBg,
                borderRadius: isPrimary
                  ? theme.borderRadius.lg
                  : theme.borderRadius.md,
                ...theme.shadows.xs,
              },
              animatedIndicatorStyle,
            ]}
          />
        )}
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const textColor = isActive
            ? theme.colors.textPrimary
            : theme.colors.textTertiary;
          const fontWeight = isActive
            ? theme.typography.fontWeight.bold
            : theme.typography.fontWeight.medium;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              onLayout={e => handleLayout(e, tab.id, index)}
              style={[
                styles.tabBtn,
                {
                  paddingVertical: isPrimary
                    ? theme.spacing['2']
                    : theme.spacing['2'],
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: textColor,
                    fontWeight,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
              >
                {tab.label}
              </Text>
              {tab.badge != null && tab.badge > 0 && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isActive
                        ? theme.colors.primaryLight
                        : theme.colors.neutralBg,
                      borderRadius: theme.borderRadius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: isActive
                          ? theme.colors.surface
                          : theme.colors.textSecondary,
                        fontSize: theme.typography.fontSize.xs - 2,
                        fontWeight: theme.typography.fontWeight.bold,
                      },
                    ]}
                  >
                    {tab.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  scrollContent: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    height: '100%',
    top: 0,
    left: 0,
  },
  tabBtn: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  tabText: {
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {},
});
