import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const haptics = {
    light: () => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    medium: () => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    heavy: () => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    success: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    warning: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    error: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    selection: () => {
        if (Platform.OS === 'ios') Haptics.selectionAsync();
    },
};