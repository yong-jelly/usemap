import { writable } from 'svelte/store';

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

const TOAST_TIMEOUT = 5000; // 5초 기본 지속시간

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substring(2, 10);
    const duration = toast.duration || TOAST_TIMEOUT;

    update((toasts) => [
      ...toasts,
      { id, ...toast, duration },
    ]);

    // 지정된 시간 후에 자동으로 제거
    setTimeout(() => {
      remove(id);
    }, duration);

    return id;
  }

  function remove(id: string) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  function clear() {
    update(() => []);
  }

  return {
    subscribe,
    add,
    remove,
    clear,
    toast: (props: Omit<Toast, 'id'>) => add(props),
  };
}

export const toasts = createToastStore();

type ToastParams = Omit<Toast, 'id'>;

export function toast(params: ToastParams) {
  return toasts.add(params);
} 