import React, { ReactNode } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS, ELEVATION } from '../../tokens/tokens';
import Text from '../primitives/Text';

interface BottomNavigationItem {
  label: string;
  icon: ReactNode;
  badge?: number | string;
  onPress: () => void;
  testID?: string;
}

interface BottomNavigationProps {
  items: BottomNavigationItem[];
  activeIndex: number;
  variant?: 'default' | 'floating' | 'labeled';
  style?: StyleProp<ViewStyle>;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeIndex,
  variant = 'default',
  style,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const animatedActiveIndex = useSharedValue(activeIndex);

  React.useEffect(() => {
    animatedActiveIndex.value = withSpring(activeIndex);
  }, [activeIndex, animatedActiveIndex]);

  const itemAnimatedStyle = (index: number) =>
    useAnimatedStyle(() => {
      const isActive = Math.round(animatedActiveIndex.value) === index;
      return {
        transform: [{ scale: isActive ? 1.1 : 1 }],
        opacity: isActive ? 1 : 0.7,
      };
    });

  const containerStyle = [
    styles.container,
    {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      paddingBottom: insets.bottom,
    },
    variant === 'floating' && styles.floating,
    style,
  ];

  return (
    <View style={containerStyle}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={items.length > 5}
        contentContainerStyle={styles.content}
      >
        {items.map((item, index) => (
          <Animated.View
            key={index}
            style={[
              styles.itemContainer,
              itemAnimatedStyle(index),
              {
                flex: items.length <= 5 ? 1 : 0,
              },
            ]}
          >
            <Pressable
              onPress={item.onPress}
              testID={item.testID || `bottom-nav-${index}`}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={styles.iconContainer}>{item.icon}</View>
              {variant !== 'default' && (
                <Text
                  variant="caption"
                  style={{
                    color:
                      index === activeIndex
                        ? colors.primary
                        : colors.textSecondary,
                    marginTop: SPACING[1],
                  }}
                >
                  {item.label}
                </Text>
              )}
              {item.badge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: colors.danger,
                    },
                  ]}
                >
                  <Text
                    variant="micro"
                    style={{ color: colors.white, fontWeight: 'bold' }}
                  >
                    {item.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    elevation: ELEVATION.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  floating: {
    marginHorizontal: SPACING[4],
    marginBottom: SPACING[4],
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-around',
  },
  itemContainer: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flex: 1,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: {
    opacity: 0.7,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    width: 24,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[1],
  },
});

export default BottomNavigation;
