// components/trips/planner/ExpandableFAB.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../../providers/ThemeProvider';
import AppIcon from '../../common/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';

export interface ActionItem {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export function ExpandableFAB({
  actions,
  onPress,
}: {
  actions: ActionItem[];
  onPress: (id: string) => void;
}) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useSharedValue(0);

  const toggleMenu = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    animation.value = withSpring(nextState ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  };

  const mainBtnStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${interpolate(animation.value, [0, 1], [0, 45])}deg` },
      ],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
      zIndex: isOpen ? 100 : -1,
    };
  });

  return (
    <>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={toggleMenu} />
      </Animated.View>
      <View style={styles.container} pointerEvents="box-none">
        {actions.map((action, index) => (
          <ExpandableFABAction
            key={action.id}
            action={action}
            index={index}
            animation={animation}
            isOpen={isOpen}
            onPress={() => {
              toggleMenu();
              onPress(action.id);
            }}
          />
        ))}

        <Animated.View style={[styles.mainBtnWrapper, mainBtnStyle]}>
          <Pressable onPress={toggleMenu} style={styles.pressable}>
            <LinearGradient
              colors={['#FF6B00', '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainBtn}
            >
              <AppIcon name="plus" size={28} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
}

function ExpandableFABAction({
  action,
  index,
  animation,
  isOpen,
  onPress,
}: {
  action: ActionItem;
  index: number;
  animation: any;
  isOpen: boolean;
  onPress: () => void;
}) {
  const actionStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      animation.value,
      [0, 1],
      [0, -64 * (index + 1)],
      Extrapolate.CLAMP,
    );
    const scale = interpolate(
      animation.value,
      [0, 1],
      [0.5, 1],
      Extrapolate.CLAMP,
    );
    return {
      transform: [{ translateY }, { scale }],
      opacity: animation.value,
    };
  });

  return (
    <Animated.View
      style={[styles.actionWrapper, actionStyle]}
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      <Pressable style={styles.actionRow} onPress={onPress}>
        <Text style={styles.actionLabel}>{action.label}</Text>
        <View style={[styles.actionBtn, { backgroundColor: action.color }]}>
          <AppIcon name={action.icon as any} size={18} color="#FFF" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    ...Platform.select({
      web: { backdropFilter: 'blur(4px)' } as any,
      default: {},
    }),
  },
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 32 : 24,
    right: Platform.OS === 'web' ? 32 : 24,
    alignItems: 'center',
    zIndex: 101,
  },
  mainBtnWrapper: {
    zIndex: 10,
  },
  pressable: {
    borderRadius: 28,
    overflow: 'hidden',

    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(234, 88, 12, 0.4)',
      } as any,

      default: {
        shadowColor: '#000',

        shadowOffset: {
          width: 0,
          height: 4,
        },

        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  } as any,
  mainBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionWrapper: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      web: { backdropFilter: 'blur(8px)' } as any,
      default: {},
    }),
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',

    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      } as any,

      default: {
        shadowColor: '#000',

        shadowOffset: {
          width: 0,
          height: 4,
        },

        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      },
    }),
  } as any,
});
