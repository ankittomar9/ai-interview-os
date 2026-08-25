import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let globalToasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

const notify = () => {
  listeners.forEach((l) => l([...globalToasts]));
};

export const toast = {
  show: (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, title, message, duration };
    globalToasts = [...globalToasts, item];
    notify();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },
  success: (message: string, title?: string) => toast.show(message, 'success', title),
  error: (message: string, title?: string) => toast.show(message, 'error', title, 6000),
  warning: (message: string, title?: string) => toast.show(message, 'warning', title),
  info: (message: string, title?: string) => toast.show(message, 'info', title),
  dismiss: (id: string) => {
    globalToasts = globalToasts.filter((t) => t.id !== id);
    notify();
  }
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>(globalToasts);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  return { toasts, toast, dismiss };
};
