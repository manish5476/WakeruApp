import { create } from 'zustand';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastStore {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>(set => ({
  toasts: [],
  show: toast => {
    const id = Math.random().toString(36).substring(2, 9);
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  dismiss: id =>
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export const useToast = () => {
  const { toasts, show, dismiss, clear } = useToastStore();
  return {
    toasts,
    show,
    dismiss,
    clear,
    success: (
      message: string,
      options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>,
    ) => show({ type: 'success', message, ...options }),
    error: (
      message: string,
      options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>,
    ) => show({ type: 'error', message, ...options }),
    warning: (
      message: string,
      options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>,
    ) => show({ type: 'warning', message, ...options }),
    info: (
      message: string,
      options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>,
    ) => show({ type: 'info', message, ...options }),
  };
};

export default useToast;
