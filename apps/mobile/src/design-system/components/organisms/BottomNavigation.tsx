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

interface NavigationItemViewProps {
  item: BottomNavigationItem;
  index: number;
  activeIndex: number;
  animatedActiveIndex: { value: number };
  variant: 'default' | 'floating' | 'labeled';
  colors: ReturnType<typeof useTheme>['colors'];
  isExpanded: boolean;
}

const NavigationItemView: React.FC<NavigationItemViewProps> = ({
  item,
  index,
  activeIndex,
  animatedActiveIndex,
  variant,
  colors,
  isExpanded,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = Math.round(animatedActiveIndex.value) === index;
    return {
      transform: [{ scale: isActive ? 1.1 : 1 }],
      opacity: isActive ? 1 : 0.7,
    };
  });

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        animatedStyle,
        {
          flex: isExpanded ? 1 : 0,
        },
      ]}
    >
      <Pressable
        onPress={item.onPress}
        testID={item.testID || `bottom-nav-${index}`}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      >
        <View style={styles.iconContainer}>{item.icon}</View>
        {variant !== 'default' && (
          <Text
            variant="caption"
            style={{
              color:
                index === activeIndex ? colors.primary : colors.textSecondary,
              marginTop: SPACING.xs,
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
              variant="h3"
              style={{ color: colors.primary, fontWeight: 'bold' }}
            >
              {item.badge}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

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
          <NavigationItemView
            key={index}
            item={item}
            index={index}
            activeIndex={activeIndex}
            animatedActiveIndex={animatedActiveIndex}
            variant={variant}
            colors={colors}
            isExpanded={items.length <= 5}
          />
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
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
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
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
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
    paddingHorizontal: SPACING.xs,
  },
});

export default BottomNavigation;
