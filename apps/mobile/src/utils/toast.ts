import Toast from 'react-native-toast-message';
import { haptics } from './haptics';
import { normalizeApiError } from './error';

/**
 * Standardized application-wide toast notification utility for TripSplit.
 * Integrates haptic feedback and error normalization automatically.
 */
export const showToast = {
  success: (title: string, message?: string, options?: any) => {
    try {
      haptics.success();
    } catch {}
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
      props: options,
    });
  },

  error: (title: string, message?: string, options?: any) => {
    try {
      haptics.error();
    } catch {}
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
      props: options,
    });
  },

  warning: (title: string, message?: string, options?: any) => {
    try {
      haptics.warning();
    } catch {}
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      visibilityTime: 4500,
      autoHide: true,
      topOffset: 50,
      props: options,
    });
  },

  info: (title: string, message?: string, options?: any) => {
    try {
      haptics.light();
    } catch {}
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      visibilityTime: 3500,
      autoHide: true,
      topOffset: 50,
      props: options,
    });
  },

  /**
   * Display an error toast from any caught error or rejection.
   * Extracts clean, user-friendly copy and attaches suitable title.
   */
  fromError: (error: unknown, fallbackTitle = 'Action Failed') => {
    const normalized = normalizeApiError(error);
    const title = normalized.isPlanLimit
      ? 'Plan Limit Reached'
      : normalized.isNetworkError
        ? 'Connection Error'
        : normalized.isAuthError
          ? 'Authentication Required'
          : fallbackTitle;

    try {
      haptics.error();
    } catch {}
    Toast.show({
      type: 'error',
      text1: title,
      text2: normalized.message,
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
    });

    return normalized;
  },

  hide: () => {
    Toast.hide();
  },
};
