import type GttButton from './components/generic/GttButton.vue';
import type GttModal from './components/generic/GttModal.vue';

declare module 'vue' {
  export interface GlobalComponents {
    GttButton: typeof GttButton;
    GttModal: typeof GttModal;
  }
}

export {};
