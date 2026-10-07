import Toast from 'react-native-toast-message';

export const showToast = {
  success: (msg: string, desc?: string) =>
    Toast.show({ type: 'success', text1: msg, text2: desc }),
  error: (msg: string, desc?: string) =>
    Toast.show({ type: 'error', text1: msg, text2: desc }),
  warning: (msg: string, desc?: string) =>
    Toast.show({ type: 'info', text1: msg, text2: desc }),
  info: (msg: string, desc?: string) =>
    Toast.show({ type: 'info', text1: msg, text2: desc }),
  fromError: (err: any) =>
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: err?.message || 'Something went wrong',
    }),
};
