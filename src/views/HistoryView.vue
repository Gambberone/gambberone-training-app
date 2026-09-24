<template>
  <section class="mx-auto max-w-2xl space-y-6">
    <header>
      <p class="mb-1 text-sm font-semibold text-primary">Allenamento</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">Storico e sessione</h1>
    </header>

    <article
      v-if="activeWorkoutSessionRef"
      class="card border border-primary/20 bg-primary/5 shadow-sm"
    >
      <div class="card-body items-center p-6 text-center">
        <h2 class="text-xl font-bold">Workout in corso</h2>
        <p class="text-sm text-base-content/65">
          Usa la barra in alto per riaprire il player e continuare l’allenamento.
        </p>
      </div>
    </article>
    <article v-else class="card bg-base-200 shadow-sm">
      <div class="card-body items-center p-6 text-center">
        <h2 class="text-xl font-bold">Nessun workout in corso</h2>
        <p class="text-sm text-base-content/65">Avviane uno dalla sezione Workouts per iniziare.</p>
      </div>
    </article>

    <div>
      <h2 class="mb-3 text-lg font-bold">Sessioni completate</h2>
      <ul v-if="workoutSessionsRef.length" class="list rounded-box bg-base-100">
        <li v-for="session in workoutSessionsRef" :key="session.id" class="list-row">
          <div>
            <p class="font-semibold">{{ workoutName(session.workoutId) }}</p>
            <p class="text-sm text-base-content/60">{{ completedLabel(session.completedAt) }}</p>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-base-content/60">Le sessioni completate appariranno qui.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { activeWorkoutSessionRef, workoutSessionsRef, workoutsRef } from '@/stores/workoutCreator';
const workoutName = (id: string) =>
  workoutsRef.value.find((workout) => workout.id === id)?.name ?? 'Workout eliminato';
const completedLabel = (date?: string) =>
  date
    ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(date),
      )
    : 'Completato';
</script>
