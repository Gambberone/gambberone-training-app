<template>
  <div class="flex h-dvh flex-col">
    <div v-if="activeWorkout && !isWorkoutPlayerOpenRef" class="shrink-0 px-4 pt-4">
      <div
        class="aura aura-lg mx-auto block w-full max-w-2xl bg-primary/10 text-primary"
        :class="{ 'aura-dual': !workoutPlayerStatusRef?.paused }"
      >
        <div class="flex w-full items-center gap-1 rounded-box bg-base-100 pr-2 text-base-content shadow-sm">
          <button
            class="flex min-w-0 flex-1 items-center justify-between gap-2 py-2 pl-3 text-left"
            type="button"
            aria-label="Riapri workout in corso"
            @click="openWorkoutPlayer"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-content">
                <Dumbbell class="size-4" aria-hidden="true" />
              </span>
              <span class="min-w-0">
                <span class="block truncate text-sm font-semibold">{{ activeWorkout.name }}</span>
                <span v-if="workoutPlayerStatusRef" class="block truncate text-xs font-semibold" :class="workoutPlayerStatusRef.stepColorClass">
                  {{ workoutPlayerStatusRef.step }}
                </span>
              </span>
            </span>
            <span v-if="workoutPlayerStatusRef" class="shrink-0 font-mono text-2xl font-bold tabular-nums" :class="workoutPlayerStatusRef.stepColorClass">
              {{ workoutPlayerStatusRef.remaining }}
            </span>
          </button>
          <button
            class="btn btn-square btn-ghost btn-sm shrink-0 text-primary"
            type="button"
            :aria-label="workoutPlayerStatusRef?.paused ? 'Riprendi workout' : 'Metti in pausa workout'"
            :title="workoutPlayerStatusRef?.paused ? 'Riprendi' : 'Pausa'"
            @click="toggleWorkoutPlayerPause"
          >
            <Play v-if="workoutPlayerStatusRef?.paused" class="size-5" aria-hidden="true" />
            <Pause v-else class="size-5" aria-hidden="true" />
          </button>
          <button
            class="btn btn-square btn-ghost btn-sm shrink-0 text-error"
            type="button"
            aria-label="Ferma workout"
            title="Ferma workout"
            @click="abandonWorkoutSession"
          >
            <Square class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
    <main
      class="min-h-0 flex-1 overflow-y-auto p-4"
      style="padding-bottom: calc(4.25rem + env(safe-area-inset-bottom) + max(env(safe-area-inset-bottom), 0.5rem))"
    >
      <!-- <div class="w-full flex">
                <span class="text-2xl font-semibold text-primary">{{ route.meta.title }}</span>
            </div> -->
      <div class="h-full py-3">
        <router-view />
      </div>
    </main>

    <nav
      class="dock dock-sm"
      style="bottom: max(env(safe-area-inset-bottom), 0.5rem)"
      aria-label="Navigazione principale"
    >
      <router-link to="/" :class="{ 'dock-active': route.name === 'home' }">
        <House />
      </router-link>

      <router-link to="/calendar" :class="{ 'dock-active': route.name === 'calendar' }">
        <CalendarDays />
      </router-link>

      <router-link to="/workouts" :class="{ 'dock-active': route.name === 'workouts' }">
        <Dumbbell />
      </router-link>

      <router-link to="/history" :class="{ 'dock-active': route.name === 'history' }">
        <ChartSpline />
      </router-link>

      <router-link to="/account" :class="{ 'dock-active': route.name === 'account' }">
        <div class="avatar">
          <div class="w-7 rounded-full">
            <img
              src="https://img.daisyui.com/images/profile/demo/superperson@192.webp"
              alt="Tailwind-CSS-Avatar-component"
            />
          </div>
        </div>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, ChartSpline, Dumbbell, House, Pause, Play, Square } from '@lucide/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { abandonWorkoutSession, activeWorkoutSessionRef, isWorkoutPlayerOpenRef, openWorkoutPlayer, toggleWorkoutPlayerPause, workoutPlayerStatusRef, workoutsRef } from '@/stores/workoutCreator';

const route = useRoute();
const activeWorkout = computed(() =>
  workoutsRef.value.find((workout) => workout.id === activeWorkoutSessionRef.value?.workoutId),
);
</script>
