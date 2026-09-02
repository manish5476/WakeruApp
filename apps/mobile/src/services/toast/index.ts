import { useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

class ToastManager {
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private toasts: Toast[] = [];
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  add(toast: Omit<Toast, 'id'>) {
    const id = Date.now().toString();
    const newToast: Toast = { ...toast, id };
    this.toasts.push(newToast);
    this.notify();

    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      const timeout = setTimeout(() => this.remove(id), duration);
      this.timeouts.set(id, timeout);
    }

    return id;
  }

  remove(id: string) {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  clear() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.toasts = [];
    this.notify();
  }

  getToasts() {
    return [...this.toasts];
  }
}

export const toastManager = new ToastManager();

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  const show = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      options?: Omit<Toast, 'id' | 'message' | 'type'>,
    ) => {
      return toastManager.add({ message, type, ...options });
    },
    [],
  );

  const success = useCallback(
    (message: string, options?: Omit<Toast, 'id' | 'message' | 'type'>) => {
      return show(message, 'success', options);
    },
    [show],
  );

  const error = useCallback(
    (message: string, options?: Omit<Toast, 'id' | 'message' | 'type'>) => {
      return show(message, 'error', options);
    },
    [show],
  );

  const warning = useCallback(
    (message: string, options?: Omit<Toast, 'id' | 'message' | 'type'>) => {
      return show(message, 'warning', options);
    },
    [show],
  );

  const info = useCallback(
    (message: string, options?: Omit<Toast, 'id' | 'message' | 'type'>) => {
      return show(message, 'info', options);
    },
    [show],
  );

  const dismiss = useCallback((id: string) => {
    toastManager.remove(id);
  }, []);

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    clear: () => toastManager.clear(),
  };
};
