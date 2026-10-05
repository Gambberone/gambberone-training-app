<template>
  <dialog
    ref="dialog"
    class="modal gtt-modal"
    :class="{ 'gtt-modal--sheet': !props.full && !props.actions?.length, 'gtt-modal--editor': props.full }"
    :aria-labelledby="props.title ? titleId : undefined"
    @cancel.prevent="closeModal"
    @close="isOpen = false"
    @click.self="closeModal"
  >
    <div
      class="modal-box flex max-h-[calc(100dvh-2rem)] flex-col"
      :class="[
        props.contentClass,
        {
          'w-[95dvw] h-[95dvh]': props.full,
          'w-screen! h-screen! max-w-none! max-h-none! rounded-none': isFullScreen,
        },
      ]"
    >
      <div class="modal-top relative z-10 flex items-center bg-base-100/85 backdrop-blur-sm">
        <div class="flex flex-1 items-center">
          <GttButton mode="ghost" size="sm" shape="circle"
            v-if="props.goBack"
            class="mr-2 text-primary"
            type="button"
            :aria-label="tr('ui.go_back')"
            @click="emit('goBack')"
          >
            <ChevronLeft :size="25" />
          </GttButton>
          <h2 :id="titleId" class="min-w-0 flex-1 text-xl font-bold wrap-break-word" v-if="props.title">{{ props.title }}</h2>
        </div>
        <div class="flex-0 flex">
          <GttButton mode="ghost" size="sm" shape="circle"
            class="top-4 right-4"
            type="button"
            v-if="enableFullScreen"
            :aria-label="
              isFullScreen ? tr('ui.minimize_dialog') : tr('ui.expand_dialog_to_fullscreen')
            "
            @click="toggleFullScreen"
          >
            <Minimize v-if="isFullScreen" :size="20" />
            <Maximize v-else :size="20" />
          </GttButton>
          <GttButton mode="ghost" size="sm" shape="circle"
            class="top-4 right-4 text-base-content"
            type="button"
            :aria-label="tr('ui.close_dialog')"
            @click="closeModal"
          >
            <Close :size="25" />
          </GttButton>
        </div>
      </div>
      <div
        class="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-3 mask-[linear-gradient(to_bottom,transparent,black_0.75rem,black_calc(100%-0.75rem),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_0.75rem,black_calc(100%-0.75rem),transparent)]"
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
        <GttButton
          v-for="action in props.actions"
          :class="[action.color && `btn-${action.color}`]"
          :key="action.id"
          
          type="button"
          :disabled="action.disabled"
          @click="actionHandler(action.id)"
        >
          {{ action.label }}
        </GttButton>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { tr } from '@/localization';
import { ChevronLeft, X as Close, Maximize, Minimize } from '@lucide/vue';
import { ref, watch, useId } from 'vue';

interface ModalAction {
  id: string;
  label: string;
  color?: string;
  disabled?: boolean;
}

interface ModalProps {
  contentClass?: string;
  full?: boolean;
  closeOnAction?: boolean;
  title?: string;
  message?: string;
  actions?: ModalAction[];
  enableFullScreen?: boolean;
  beforeClose?: () => boolean;
  goBack?: boolean;
}

const props = withDefaults(defineProps<ModalProps>(), {
  full: false,
  closeOnAction: true,
});

const emit = defineEmits<{
  action: [id: string];
  goBack: [];
}>();

const titleId = useId();
const isOpen = defineModel<boolean>({ default: false });
const dialog = ref<HTMLDialogElement | null>(null);
const isFullScreen = ref(false);

// A conditional modal can mount with its model already true. Wait for the
// native element as well as model changes so that first opening is applied.
watch([isOpen, dialog], ([open, element]) => {
  if (open && element && !element.open) element.showModal();
  if (!open && element?.open) element.close();
}, { flush: 'post' });

const closeModal = () => {
  if (props.beforeClose?.() === false) return;
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
