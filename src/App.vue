<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import GttToast from './components/generic/GttToast.vue';
import WorkoutPlayer from './components/workouts/WorkoutPlayer.vue';
import { useTheme } from './composables/useTheme';
import {
  activeWorkoutSessionRef,
  isWorkoutPlayerOpenRef,
  minimizeWorkoutPlayer,
  workoutsRef,
} from './stores/workoutCreator';

useTheme();

const route = useRoute();
const activeWorkout = computed(() =>
  workoutsRef.value.find((workout) => workout.id === activeWorkoutSessionRef.value?.workoutId),
);
const isAppRoute = computed(() => route.matched.some((record) => record.meta.requiresAuth));

watch(
  () => route.fullPath,
  () => minimizeWorkoutPlayer(),
);
</script>

<template>
  <router-view />
  <div
    v-if="isAppRoute && activeWorkout && activeWorkoutSessionRef"
    v-show="isWorkoutPlayerOpenRef"
    class="fixed inset-0 z-50 overflow-y-auto bg-base-100/95 p-4 backdrop-blur-sm"
  >
    <div class="mx-auto min-h-full max-w-2xl py-3">
      <WorkoutPlayer :key="activeWorkoutSessionRef.id" :workout="activeWorkout" @minimize="minimizeWorkoutPlayer" />
    </div>
  </div>
  <GttToast />
</template>
