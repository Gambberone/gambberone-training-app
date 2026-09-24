<template>
  <Teleport defer to="#app-bottom-action">
    <div v-if="!isWorkoutPlayerOpenRef">
      <button
        class="btn btn-primary mx-auto flex h-12 w-full max-w-2xl gap-2 rounded-xl border border-primary/20 font-semibold shadow-sm shadow-primary/15"
        type="button"
        @click="emit('click')"
      >
        <Plus class="size-5" aria-hidden="true" />
        {{ label }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Plus } from '@lucide/vue';
import { isWorkoutPlayerOpenRef } from '@/stores/workoutCreator';

defineProps<{ label: string }>();
const emit = defineEmits<{ click: [] }>();
</script>
