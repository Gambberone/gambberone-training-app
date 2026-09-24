<template>
  <div class="flex h-dvh flex-col overflow-hidden">
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
              {{ workoutPlayerStatusRef.counter }}
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
      class="min-h-0 flex-1 p-4"
      :class="route.name === 'workouts' ? 'overflow-hidden' : 'overflow-y-auto'"
    >
      <!-- <div class="w-full flex">
                <span class="text-2xl font-semibold text-primary">{{ route.meta.title }}</span>
            </div> -->
      <div class="pt-3" :class="route.name === 'workouts' ? 'h-full min-h-0' : 'min-h-full'">
        <router-view />
      </div>
    </main>

    <div id="app-bottom-action" class="shrink-0 px-4 pb-4 empty:hidden" />

    <nav
      class="dock dock-sm app-dock shrink-0"
      style="position: relative; bottom: auto"
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
        <div class="grid size-7 place-items-center overflow-hidden rounded-full bg-primary/15 text-primary">
          <img v-if="profilePhoto" :src="profilePhoto" alt="Foto del profilo" class="h-full w-full object-cover" />
          <UserRound v-else class="size-5" aria-hidden="true" />
        </div>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, ChartSpline, Dumbbell, House, Pause, Play, Square, UserRound } from '@lucide/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { abandonWorkoutSession, activeWorkoutSessionRef, isWorkoutPlayerOpenRef, openWorkoutPlayer, toggleWorkoutPlayerPause, workoutPlayerStatusRef, workoutsRef } from '@/stores/workoutCreator';
import { useAuth } from '@/composables/useAuth';

const route = useRoute();
const { profilePhoto } = useAuth();
const activeWorkout = computed(() =>
  workoutsRef.value.find((workout) => workout.id === activeWorkoutSessionRef.value?.workoutId),
);
</script>
