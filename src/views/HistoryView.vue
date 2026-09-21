<template>
  <section class="mx-auto max-w-2xl space-y-6">
    <header>
      <p class="mb-1 text-sm font-semibold text-primary">Allenamento</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">Storico e sessione</h1>
    </header>

    <WorkoutPlayer v-if="activeWorkout && activeWorkoutSessionRef" :workout="activeWorkout" />

    <article v-else class="card bg-base-200 shadow-sm"><div class="card-body items-center p-6 text-center"><h2 class="text-xl font-bold">Nessun workout in corso</h2><p class="text-sm text-base-content/65">Avviane uno dalla sezione Workouts per seguirne l’avanzamento qui.</p></div></article>

    <div><h2 class="mb-3 text-lg font-bold">Sessioni completate</h2><ul v-if="workoutSessionsRef.length" class="list rounded-box bg-base-100"><li v-for="session in workoutSessionsRef" :key="session.id" class="list-row"><div><p class="font-semibold">{{ workoutName(session.workoutId) }}</p><p class="text-sm text-base-content/60">{{ completedLabel(session.completedAt) }}</p></div></li></ul><p v-else class="text-sm text-base-content/60">Le sessioni completate appariranno qui.</p></div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { activeWorkoutSessionRef, workoutSessionsRef, workoutsRef } from '@/stores/workoutCreator';
import WorkoutPlayer from '@/components/workouts/WorkoutPlayer.vue';

const activeWorkout = computed(() => workoutsRef.value.find((workout) => workout.id === activeWorkoutSessionRef.value?.workoutId));
const workoutName = (id: string) => workoutsRef.value.find((workout) => workout.id === id)?.name ?? 'Workout eliminato';
const completedLabel = (date?: string) => date ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : 'Completato';
</script>
