<template>
  <Teleport defer :to="isDesktop && desktopTarget ? desktopTarget : '#app-bottom-action'">
    <div v-if="!isWorkoutPlayerOpenRef">
      <GttButton
        mode="outline"
        color="primary"
        class="gap-2 font-semibold"
        :class="
          isDesktop && desktopTarget
            ? 'whitespace-nowrap'
            : 'mx-auto flex h-12 w-full max-w-2xl rounded-xl'
        "
        type="button"
        @click="emit('click')"
      >
        <template #icon><Plus class="size-5" aria-hidden="true" /></template>
        <template #label>{{ label }}</template>
      </GttButton>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { isWorkoutPlayerOpenRef } from '@/stores/workoutCreator';
import { Plus } from '@lucide/vue';
import { onMounted, onUnmounted, ref } from 'vue';

defineProps<{ label: string; desktopTarget?: string }>();
const isDesktop = ref(false);
let mediaQuery: MediaQueryList | undefined;
const updateDesktop = () => {
  isDesktop.value = mediaQuery?.matches ?? false;
};
onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 1024px)');
  updateDesktop();
  mediaQuery.addEventListener('change', updateDesktop);
});
onUnmounted(() => mediaQuery?.removeEventListener('change', updateDesktop));
const emit = defineEmits<{ click: [] }>();
</script>
