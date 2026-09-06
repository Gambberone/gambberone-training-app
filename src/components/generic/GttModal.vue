<template>
    <dialog
        ref="dialog"
        class="modal"
        @close="isOpen = false"
        @click.self="closeModal"
    >
        <div class="modal-box" :class="{ 'w-[95dvw] h-[95dvh]': props.full }">
            <div class="modal-top flex items-center">
                <div class="flex-1">
                    <span class="text-xl">{{ props.title }}</span>
                </div>
                <div class="flex-0">
                    <button
                        class="btn btn-ghost btn-sm btn-circle top-4 right-4"
                        type="button"
                        aria-label="Chiudi modal"
                        @click="closeModal"
                    >
                        <Close class="size-5" />
                    </button>
                </div>
            </div>
            <div class="mt-5">
                <slot>
                    <p v-if="props.message" class="text-md">
                        {{ props.message }}
                    </p>
                </slot>
            </div>
            <div
                class="modal-action"
                v-if="props.actions && props.actions.length > 0"
            >
                <button
                    v-for="action in props.actions"
                    :class="[action.color && `btn-${action.color}`]"
                    :key="action.id"
                    class="btn"
                    @click="actionHandler(action.id)"
                >
                    {{ action.label }}
                </button>
            </div>
        </div>
    </dialog>
</template>

<script setup lang="ts">
import { X as Close } from "@lucide/vue";
import { ref, watch } from "vue";

interface ModalAction {
    id: string;
    label: string;
    color?: string;
}

interface ModalProps {
    full?: boolean;
    title: string;
    message?: string;
    actions?: ModalAction[];
}

const props = withDefaults(defineProps<ModalProps>(), {
    full: false,
});

const emit = defineEmits<{
    action: [id: string];
}>();

const isOpen = defineModel<boolean>({ default: false });
const dialog = ref<HTMLDialogElement | null>(null);

watch(isOpen, (open) => {
    if (open && !dialog.value?.open) dialog.value?.showModal();
    if (!open && dialog.value?.open) dialog.value.close();
});

const closeModal = () => {
    dialog.value?.close();
};

const actionHandler = (actionId: string) => {
    emit("action", actionId);
    closeModal();
};
</script>
