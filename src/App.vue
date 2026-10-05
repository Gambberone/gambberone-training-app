<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { waveBinderStatus } from './wavebinder';
import { useRoute } from 'vue-router';
import GttToast from './components/generic/GttToast.vue';
import WorkoutPlayer from './components/workouts/WorkoutPlayer.vue';
import { initializeAppTour } from './composables/useAppTour';
import { useAppUpdateNotice } from './composables/useAppUpdateNotice';
import { useTheme } from './composables/useTheme';
import {
  activeWorkoutSessionRef,
  isWorkoutPlayerOpenRef,
  minimizeWorkoutPlayer,
  workoutsRef,
} from './stores/workoutCreator';

initializeAppTour();
useTheme();
useAppUpdateNotice();

const { t } = useI18n();
const reloadApp = () => window.location.reload();
const route = useRoute();
const activeWorkout = computed(() =>
  activeWorkoutSessionRef.value?.sharedWorkout ?? workoutsRef.value.find((workout) => workout.id === activeWorkoutSessionRef.value?.workoutId),
);
const isAppRoute = computed(() => route.matched.some((record) => record.meta.requiresAuth));

watch(
  () => route.fullPath,
  () => minimizeWorkoutPlayer(),
);
</script>

<template>
  <router-view v-if="!isAppRoute || waveBinderStatus === 'ready'" />
  <main v-else class="grid min-h-dvh place-items-center bg-base-100 p-6">
    <div class="max-w-md space-y-4 text-center" :role="waveBinderStatus === 'loading' ? 'status' : 'alert'">
      <template v-if="waveBinderStatus === 'loading'">
        <span class="loading loading-spinner loading-lg" aria-hidden="true" />
        <p>{{ t('runtime.loading') }}</p>
      </template>
      <template v-else>
        <h1 class="text-xl font-bold">{{ t('runtime.unavailableTitle') }}</h1>
        <p>{{ t('runtime.unavailableMessage') }}</p>
        <GttButton @click="reloadApp">{{ t('runtime.retry') }}</GttButton>
      </template>
    </div>
  </main>
  <div
    v-if="isAppRoute && activeWorkout && activeWorkoutSessionRef"
    v-show="isWorkoutPlayerOpenRef"
    class="fixed inset-0 z-50 overflow-y-auto bg-base-100/95 p-4 backdrop-blur-sm"
  >
    <div class="mx-auto min-h-full max-w-2xl py-3 lg:max-w-7xl lg:py-0">
      <WorkoutPlayer
        :key="activeWorkoutSessionRef.id"
        :workout="activeWorkout"
        @minimize="minimizeWorkoutPlayer"
      />
    </div>
  </div>
  <GttToast />
</template>
