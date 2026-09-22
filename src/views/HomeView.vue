<template>
  <section class="mx-auto max-w-2xl">
    <header class="mb-7">
      <p class="mb-1 text-sm font-semibold text-primary">{{ todayLabel }}</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">
        {{ greeting }}<span v-if="userName" class="text-primary">{{ userName }}</span
        >!
      </h1>
      <p class="mt-2 text-base-content/65">Ecco cosa ti aspetta oggi.</p>
    </header>

    <div v-if="todayWorkouts.length" class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-base-content">
          {{ todayWorkouts.length === 1 ? 'Allenamento di oggi' : 'Allenamenti di oggi' }}
        </h2>
        <span class="badge badge-primary badge-outline">{{ todayWorkouts.length }} workout</span>
      </div>

      <article
        v-for="(scheduledWorkout, index) in todayWorkouts"
        :key="scheduledWorkout.id"
        class="card relative overflow-hidden border border-primary/20 bg-base-100 shadow-sm"
      >
        <span
          v-if="scheduledWorkout.time"
          class="badge badge-primary badge-outline absolute top-4 right-4 gap-1 px-2.5 py-3 text-sm"
        >
          <Clock3 :size="15" />
          {{ scheduledWorkout.time }}
        </span>
        <div class="card-body gap-4 p-5">
          <div class="flex items-start gap-4">
            <div
              class="grid size-12 shrink-0 place-items-center rounded-box bg-primary text-primary-content"
            >
              <Dumbbell :size="23" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-primary">{{ workoutLabel(index) }}</p>
              <h3 class="truncate text-xl font-bold text-base-content">
                {{ workoutName(scheduledWorkout.workoutId) }}
              </h3>
              <p class="mt-1 text-sm text-base-content/60">
                {{ workoutSteps(scheduledWorkout.workoutId) }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              class="btn btn-primary btn-sm"
              type="button"
              @click="startWorkout(scheduledWorkout.workoutId)"
            >
              <Play :size="17" />
              Avvia ora
            </button>
            <RouterLink class="btn btn-outline btn-primary btn-sm" to="/calendar">
              Calendario
              <ArrowRight :size="17" />
            </RouterLink>
          </div>
        </div>
      </article>
    </div>

    <article v-else class="card overflow-hidden bg-base-200 shadow-sm">
      <div class="card-body items-center px-6 py-10 text-center">
        <div class="grid size-16 place-items-center rounded-full bg-success/15 text-success">
          <FaceGrinning :size="31" />
        </div>
        <h2 class="mt-3 text-xl font-bold text-base-content">Oggi si recupera</h2>
        <p class="max-w-sm text-base-content/65">
          Nessun workout in programma: goditi il riposo, oppure pianifica la tua prossima sfida.
        </p>
        <RouterLink class="btn btn-primary mt-3" to="/calendar">
          <CalendarPlus :size="18" />
          Programma un workout
        </RouterLink>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, CalendarPlus, Clock3, Dumbbell, FaceGrinning, Play } from '@lucide/vue';
import { computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { scheduledWorkoutsRef, startWorkoutSession, workoutsRef } from '@/stores/workoutCreator';

const { currentUser } = useAuth();

const pad = (value: number) => String(value).padStart(2, '0');
const now = new Date();
const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const todayLabel = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(now);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno, ';
  if (hour < 18) return 'Buon pomeriggio, ';
  return 'Buonasera, ';
});

const userName = computed(() => {
  if (!currentUser.value) return '';
  if (currentUser.value.displayName) return currentUser.value.displayName;

  const emailName = currentUser.value.email?.split('@')[0] ?? '';
  return emailName.replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
});

const todayWorkouts = computed(() =>
  scheduledWorkoutsRef.value.filter((scheduledWorkout) => scheduledWorkout.date === todayKey),
);

function workoutName(workoutId: string) {
  return workoutsRef.value.find((workout) => workout.id === workoutId)?.name ?? 'Workout eliminato';
}

function workoutSteps(workoutId: string) {
  const steps = workoutsRef.value.find((workout) => workout.id === workoutId)?.steps.length;
  if (!steps) return 'Pronto per iniziare';
  return `${steps} step in programma`;
}

function workoutLabel(index: number) {
  return index === 0 ? 'Il tuo focus di oggi' : `Workout ${index + 1}`;
}

function startWorkout(workoutId: string) {
  startWorkoutSession(workoutId);
}
</script>
