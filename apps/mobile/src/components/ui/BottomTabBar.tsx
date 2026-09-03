// src/components/navigation/BottomTabBar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import AppIcon from '../common/AppIcon';
import { useTheme } from '../../providers/ThemeProvider';
import { GlassCard } from './GlassCard';
import { haptics } from '../../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';

const TAB_BAR_HEIGHT = 70;
const FAB_SIZE = 60;

export function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [isVisible, setIsVisible] = useState(true);
  const translateY = useSharedValue(0);
  const fabScale = useSharedValue(1);

  const iconMap: {
    [key: string]: {
      icon: React.ComponentProps<typeof AppIcon>['name'];
      label: string;
    };
  } = {
    home: { icon: 'home', label: 'Home' },
    trips: { icon: 'map', label: 'Trips' },
    expenses: { icon: 'credit-card', label: 'Expenses' },
    budget: { icon: 'pie-chart', label: 'Budget' },
    profile: { icon: 'user', label: 'Profile' },
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [state.index]);

  useEffect(() => {
    translateY.value = withSpring(
      isVisible ? 0 : TAB_BAR_HEIGHT + (insets.bottom || 20) + 20,
      {
        damping: 18,
        stiffness: 150,
      },
    );
  }, [isVisible, insets.bottom]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleFabPress = () => {
    fabScale.value = withSpring(0.9, { damping: 15, stiffness: 400 }, () => {
      fabScale.value = withSpring(1);
    });
    navigation.navigate('quick-actions');
    haptics.heavy();
  };

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
    haptics.light();
  }, []);

  return (
    <>
      {/* Show/Hide Toggle Button */}
      {!isVisible && (
        <TouchableOpacity
          onPress={toggleVisibility}
          style={[styles.showButton, { bottom: (insets.bottom || 10) + 5 }]}
        >
          <GlassCard intensity={25} style={styles.showButtonGlass}>
            <AppIcon
              name="chevron-up"
              size={20}
              color={theme.colors.textSecondary}
            />
          </GlassCard>
        </TouchableOpacity>
      )}

      {/* Main Pill Bar */}
      <Animated.View
        style={[
          styles.wrapper,
          { paddingBottom: insets.bottom || 20 },
          animatedStyle,
        ]}
      >
        <GlassCard style={styles.pillContainer} intensity={30}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            if (route.name === 'create')
              return <View key={route.key} style={styles.fabPlaceholder} />;

            const config = iconMap[route.name];
            if (!config) return null;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                    haptics.medium();
                  }
                }}
                style={styles.tabItem}
              >
                <AppIcon
                  name={config.icon}
                  size={isFocused ? 22 : 20}
                  color={
                    isFocused ? theme.colors.primary : theme.colors.textTertiary
                  }
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused
                        ? theme.colors.primary
                        : theme.colors.textTertiary,
                    },
                    isFocused && styles.labelFocused,
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </GlassCard>

        {/* 
                   FAB - Nested properly inside the pill container using `position: 'absolute'`.
                   `alignSelf: 'center'` ensures it centers horizontally.
                   `bottom: 0` paired with `translateY(-50%)` ensures perfect vertical center regardless of device padding or height.
                */}
        <View
          style={[
            styles.fabContainer,
            { bottom: (insets.bottom || 20) + (TAB_BAR_HEIGHT - FAB_SIZE) / 2 },
          ]}
        >
          <Animated.View style={fabAnimatedStyle}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.fab}
              onPress={handleFabPress}
            >
              <LinearGradient
                colors={theme.gradients?.primary ?? ['#18181B', '#3F3F46']}
                style={StyleSheet.absoluteFill}
              />
              <AppIcon name="plus" size={30} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '92%',
    maxWidth: 460,
    paddingHorizontal: 8,
    position: 'relative', // Essential for absolute positioning of FAB
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelFocused: {
    fontWeight: '700',
  },
  fabPlaceholder: {
    width: FAB_SIZE * 0.8,
  },
  fabContainer: {
    position: 'absolute',
    alignSelf: 'center', // Perfect horizontal centering
    zIndex: 10,
    // bottom is calculated dynamically with the correct insets in the component props
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  showButton: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
  },
  showButtonGlass: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
