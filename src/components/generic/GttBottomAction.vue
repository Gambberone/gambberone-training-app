<template>
  <Teleport defer :to="isDesktop && desktopTarget ? desktopTarget : '#app-bottom-action'">
    <div v-if="!isWorkoutPlayerOpenRef">
      <button
        class="btn gap-2 font-semibold"
        :class="isDesktop && desktopTarget ? 'btn-ghost whitespace-nowrap text-primary' : 'btn-primary mx-auto flex h-12 w-full max-w-2xl rounded-xl border border-primary/20 shadow-sm shadow-primary/15'"
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
import { onMounted, onUnmounted, ref } from 'vue';
import { Plus } from '@lucide/vue';
import { isWorkoutPlayerOpenRef } from '@/stores/workoutCreator';

defineProps<{ label: string; desktopTarget?: string }>();
const isDesktop = ref(false);
let mediaQuery: MediaQueryList | undefined;
const updateDesktop = () => { isDesktop.value = mediaQuery?.matches ?? false; };
onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 1024px)');
  updateDesktop();
  mediaQuery.addEventListener('change', updateDesktop);
});
onUnmounted(() => mediaQuery?.removeEventListener('change', updateDesktop));
const emit = defineEmits<{ click: [] }>();
</script>
