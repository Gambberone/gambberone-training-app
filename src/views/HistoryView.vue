<template>
  <section class="mx-auto max-w-2xl space-y-6">
    <header>
      <p class="mb-1 text-sm font-semibold text-primary">{{ tr('ui.training') }}</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">
        {{ tr('ui.history_and_session') }}
      </h1>
    </header>

    <article
      v-if="activeWorkoutSessionRef"
      class="card border border-primary/20 bg-primary/5 shadow-sm"
    >
      <div class="card-body items-center p-6 text-center">
        <h2 class="text-xl font-bold">{{ tr('ui.workout_in_progress') }}</h2>
        <p class="text-sm text-base-content/65">
          {{ tr('ui.use_the_top_bar_to_reopen_the_player_and_continue_your_workout') }}
        </p>
      </div>
    </article>
    <article v-else class="card bg-base-200 shadow-sm">
      <div class="card-body items-center p-6 text-center">
        <h2 class="text-xl font-bold">{{ tr('ui.no_workout_in_progress') }}</h2>
        <p class="text-sm text-base-content/65">
          {{ tr('ui.start_one_from_the_workouts_section') }}
        </p>
      </div>
    </article>

    <div>
      <h2 class="mb-3 text-lg font-bold">{{ tr('ui.completed_sessions') }}</h2>
      <ul v-if="workoutSessionsRef.length" class="list rounded-box bg-base-100">
        <li v-for="session in workoutSessionsRef" :key="session.id" class="list-row">
          <div>
            <p class="font-semibold">{{ workoutName(session.workoutId) }}</p>
            <p class="text-sm text-base-content/60">{{ completedLabel(session.completedAt) }}</p>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-base-content/60">
        {{ tr('ui.completed_sessions_will_appear_here') }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { appLocale, tr } from '@/localization';
import { activeWorkoutSessionRef, workoutSessionsRef, workoutsRef } from '@/stores/workoutCreator';

const workoutName = (id: string) =>
  workoutsRef.value.find((workout) => workout.id === id)?.name ?? tr('ui.deleted_workout');
const completedLabel = (date?: string) =>
  date
    ? new Intl.DateTimeFormat(appLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(date),
      )
    : tr('ui.completed');
</script>
