<template>
  <div v-if="activeToast" class="toast toast-bottom toast-center z-[1000] w-full px-4">
    <article class="w-full max-w-sm overflow-hidden rounded-box bg-base-100 shadow-xl ring-1 ring-base-content/10">
      <div class="flex items-start gap-3 p-4">
        <div class="grid size-10 shrink-0 place-items-center rounded-full bg-success/15 text-success">
          <CircleCheck :size="22" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="font-bold text-base-content">{{ activeToast.title }}</h2>
          <p v-if="activeToast.message" class="mt-0.5 text-sm text-base-content/65">
            {{ activeToast.message }}
          </p>
        </div>
      </div>

      <div v-if="activeToast.actions?.length" class="flex justify-end gap-2 border-t border-base-content/10 bg-base-100 p-3">
        <button
          v-for="action in activeToast.actions"
          :key="action.label"
          class="btn btn-sm"
          :class="action.color && `btn-${action.color}`"
          type="button"
          @click="runAction(action)"
        >
          {{ action.label }}
        </button>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { CircleCheck } from '@lucide/vue';
import { activeToast, hideToast, type ToastAction } from '../../composables/toast';

function runAction(action: ToastAction) {
  action.onClick?.();
  hideToast();
}
</script>
