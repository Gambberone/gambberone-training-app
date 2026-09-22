<template>
  <div
    v-if="!isWorkoutPlayerOpenRef"
    class="fab"
    style="bottom: calc(4.25rem + env(safe-area-inset-bottom) + max(env(safe-area-inset-bottom), 0.5rem))"
  >
    <button class="btn btn-lg btn-circle btn-primary rounded-xl" @click="emit('click')">
      <Plus />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@lucide/vue';
import { isWorkoutPlayerOpenRef } from '@/stores/workoutCreator';

const emit = defineEmits(['click']);
</script>
