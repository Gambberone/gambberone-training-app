<template>
  <section class="mx-auto max-w-2xl space-y-6">
    <header>
      <p class="mb-1 text-sm font-semibold text-primary">Allenamento</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">Storico e sessione</h1>
    </header>

    <article v-if="activeWorkout && activeWorkoutSessionRef" class="card border border-primary/25 bg-base-100 shadow-sm">
      <div class="card-body gap-4 p-5">
        <div class="flex items-center justify-between gap-3">
          <div><p class="text-sm font-semibold text-primary">In corso</p><h2 class="text-xl font-bold">{{ activeWorkout.name }}</h2></div>
          <span class="badge badge-primary">{{ progress.completed }}/{{ progress.total }} step</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-base-200"><div class="h-full bg-primary transition-all" :style="{ width: `${progressPercent}%` }" /></div>
        <div class="rounded-box bg-base-200 p-4"><p class="text-sm text-base-content/60">Step {{ activeWorkoutSessionRef.currentStepIndex + 1 }}</p><p class="mt-1 text-lg font-bold">{{ currentStepLabel }}</p></div>
        <div class="flex gap-2"><button class="btn btn-primary flex-1" type="button" @click="advanceWorkoutSession">{{ isLastStep ? 'Completa workout' : 'Completa step' }}</button><button class="btn btn-ghost btn-error" type="button" @click="abandonWorkoutSession">Abbandona</button></div>
      </div>
    </article>

    <article v-else class="card bg-base-200 shadow-sm"><div class="card-body items-center p-6 text-center"><h2 class="text-xl font-bold">Nessun workout in corso</h2><p class="text-sm text-base-content/65">Avviane uno dalla sezione Workouts per seguirne l’avanzamento qui.</p></div></article>

    <div><h2 class="mb-3 text-lg font-bold">Sessioni completate</h2><ul v-if="workoutSessionsRef.length" class="list rounded-box bg-base-100"><li v-for="session in workoutSessionsRef" :key="session.id" class="list-row"><div><p class="font-semibold">{{ workoutName(session.workoutId) }}</p><p class="text-sm text-base-content/60">{{ completedLabel(session.completedAt) }}</p></div></li></ul><p v-else class="text-sm text-base-content/60">Le sessioni completate appariranno qui.</p></div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { abandonWorkoutSession, activeWorkoutSessionRef, advanceWorkoutSession, workoutSessionsRef, workoutsRef } from '@/stores/workoutCreator';
import { getSessionProgress } from '@/wavebinder/session';

const activeWorkout = computed(() => workoutsRef.value.find((workout) => workout.id === activeWorkoutSessionRef.value?.workoutId));
const progress = computed(() => getSessionProgress(activeWorkoutSessionRef.value, activeWorkout.value?.steps ?? []));
const progressPercent = computed(() => progress.value.total ? (progress.value.completed / progress.value.total) * 100 : 0);
const isLastStep = computed(() => Boolean(activeWorkout.value && activeWorkoutSessionRef.value && activeWorkoutSessionRef.value.currentStepIndex >= activeWorkout.value.steps.length - 1));
const currentStepLabel = computed(() => {
  const step = activeWorkout.value?.steps[activeWorkoutSessionRef.value?.currentStepIndex ?? 0];
  if (!step) return 'Workout completato';
  return ({ WARMUP: 'Warm-up', EXERCISE: 'Esercizio', PAUSE: 'Pausa', SETPAUSE: 'Pausa tra set', STRETCHING: 'Stretching' })[step.type];
});
const workoutName = (id: string) => workoutsRef.value.find((workout) => workout.id === id)?.name ?? 'Workout eliminato';
const completedLabel = (date?: string) => date ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : 'Completato';
</script>
