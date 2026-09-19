<template>
  <dialog ref="dialog" class="modal" @close="isOpen = false" @click.self="closeModal">
    <div
      class="modal-box flex max-h-[calc(100dvh-2rem)] flex-col"
      :class="{
        'w-[95dvw] h-[95dvh]': props.full,
        'w-screen! h-screen! max-w-none! max-h-none! rounded-none': isFullScreen,
      }"
    >
      <div class="modal-top relative z-10 flex items-center bg-base-100/85 backdrop-blur-sm">
        <div class="flex-1">
          <span class="text-xl" v-if="props.title">{{ props.title }}</span>
        </div>
        <div class="flex-0 flex">
          <button
            class="btn btn-ghost btn-sm btn-circle top-4 right-4"
            type="button"
            v-if="enableFullScreen"
            :aria-label="isFullScreen ? 'Riduci modal' : 'Espandi modal a schermo intero'"
            @click="toggleFullScreen"
          >
            <Minimize v-if="isFullScreen" :size="20" />
            <Maximize v-else :size="20" />
          </button>
          <button
            class="btn btn-ghost btn-sm btn-circle top-4 right-4"
            type="button"
            aria-label="Chiudi modal"
            @click="closeModal"
          >
            <Close :size="25" />
          </button>
        </div>
      </div>
      <div
        class="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-3 mask-[linear-gradient(to_bottom,transparent,black_0.75rem,black_calc(100%-0.75rem),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_0.75rem,black_calc(100%-0.75rem),transparent)]"
      >
        <slot>
          <p v-if="props.message" class="text-md">
            {{ props.message }}
          </p>
        </slot>
      </div>
      <div
        class="modal-action relative z-10 shrink-0 bg-base-100/85 backdrop-blur-sm"
        v-if="props.actions && props.actions.length > 0"
      >
        <button
          v-for="action in props.actions"
          :class="[action.color && `btn-${action.color}`]"
          :key="action.id"
          class="btn"
          type="button"
          :disabled="action.disabled"
          @click="actionHandler(action.id)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { X as Close, Maximize, Minimize } from '@lucide/vue';
import { ref, watch } from 'vue';

interface ModalAction {
  id: string;
  label: string;
  color?: string;
  disabled?: boolean;
}

interface ModalProps {
  full?: boolean;
  closeOnAction?: boolean;
  title?: string;
  message?: string;
  actions?: ModalAction[];
  enableFullScreen?: boolean;
}

const props = withDefaults(defineProps<ModalProps>(), {
  full: false,
  closeOnAction: true,
});

const emit = defineEmits<{
  action: [id: string];
}>();

const isOpen = defineModel<boolean>({ default: false });
const dialog = ref<HTMLDialogElement | null>(null);
const isFullScreen = ref(false);

watch(isOpen, (open) => {
  if (open && !dialog.value?.open) dialog.value?.showModal();
  if (!open && dialog.value?.open) dialog.value.close();
});

const closeModal = () => {
  dialog.value?.close();
  emit('action', 'close');
};

const toggleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;
};

const actionHandler = (actionId: string) => {
  emit('action', actionId);
  if (props.closeOnAction) {
    closeModal();
  }
};
</script>
