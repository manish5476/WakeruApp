import React, { useMemo } from 'react';
import {
  StyleSheet,
  Pressable,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  FadeInUp,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import AppIcon from '../common/AppIcon';
import { useTheme } from '../../providers/ThemeProvider';
import { haptics } from '../../utils/haptics';
import type { Theme } from '../../theme';

interface ReminderFABProps {
  onPress: () => void;
  onLongPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ReminderFAB({ onPress, onLongPress, style }: ReminderFABProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(500).springify()}
      style={[styles.container, style]}
    >
      <AnimatedPressable
        onPress={() => {
          haptics.light();
          onPress();
        }}
        onLongPress={() => {
          haptics.medium();
          onLongPress();
        }}
        onPressIn={() => (scale.value = withSpring(0.9))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
          },
          animatedStyle,
        ]}
      >
        <AppIcon name="plus" size={24} color={theme.colors.textInverse} />
      </AnimatedPressable>
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? theme.spacing[10] : theme.spacing[6],
      right: theme.spacing[6],
      zIndex: 100,
    },
    fab: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
  });
}
// // src/components/reminders/ReminderFAB.tsx
// import React from 'react';
// import { StyleSheet, Pressable, Platform } from 'react-native';
// import Animated, { FadeInUp, withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
// import AppIcon  from '../common/AppIcon';
// import { useTheme } from '../../providers/ThemeProvider';
// import { haptics } from '../../utils/haptics';

// interface ReminderFABProps {
//     onPress: () => void;
//     onLongPress: () => void;
//     style?: any;
// }

// const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// export function ReminderFAB({ onPress, onLongPress, style }: ReminderFABProps) {
//     const theme = useTheme();
//     const scale = useSharedValue(1);

//     const animatedStyle = useAnimatedStyle(() => ({
//         transform: [{ scale: scale.value }]
//     }));

//     return (
//         <Animated.View entering={FadeInUp.delay(500).springify()} style={[styles.container, style]}>
//             <AnimatedPressable
//                 onPress={() => {
//                     haptics.selection();
//                     onPress();
//                 }}
//                 onLongPress={() => {
//                     haptics.heavy();
//                     onLongPress();
//                 }}
//                 onPressIn={() => scale.value = withSpring(0.9)}
//                 onPressOut={() => scale.value = withSpring(1)}
//                 style={[
//                     styles.fab,
//                     { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary },
//                     animatedStyle
//                 ]}
//             >
//                 <AppIcon name="plus" size={24} color="#FFF" />
//             </AnimatedPressable>
//         </Animated.View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         position: 'absolute',
//         bottom: Platform.OS === 'ios' ? 40 : 24,
//         right: 24,
//         zIndex: 100,
//     },
//     fab: {
//         width: 60,
//         height: 60,
//         borderRadius: 30,
//         alignItems: 'center',
//         justifyContent: 'center',
//         elevation: 8,
//         shadowOffset: { width: 0, height: 8 },
//         shadowOpacity: 0.3,
//         shadowRadius: 12,
//     }
// });
