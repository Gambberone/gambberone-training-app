import { ref } from 'vue';

export type ToastAction = {
  label: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
};

export type ToastOptions = {
  title: string;
  message?: string;
  actions?: ToastAction[];
  duration?: number;
};

export const activeToast = ref<ToastOptions>();

let dismissTimeout: ReturnType<typeof setTimeout> | undefined;

export const hideToast = () => {
  activeToast.value = undefined;
  if (dismissTimeout !== undefined) {
    clearTimeout(dismissTimeout);
    dismissTimeout = undefined;
  }
};

export const showToast = (options: ToastOptions) => {
  hideToast();
  activeToast.value = options;
  dismissTimeout = setTimeout(hideToast, options.duration ?? 5000);
};
