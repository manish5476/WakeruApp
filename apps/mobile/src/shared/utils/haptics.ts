import { Vibration, Platform } from 'react-native';

export const haptics = {
  light: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(10);
    }
  },
  medium: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(20);
    }
  },
  heavy: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(30);
    }
  },
  success: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 15, 50, 20]);
    }
  },
  warning: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 30, 40, 30]);
    }
  },
  error: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 40, 50, 40]);
    }
  },
  selection: () => {
    if (Platform.OS === 'android') {
      Vibration.vibrate(5);
    }
  },
};

export default haptics;
