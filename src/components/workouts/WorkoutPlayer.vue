<template>
  <article ref="playerElement" class="workout-player card border border-primary/25 bg-base-100 shadow-sm">
    <div class="card-body gap-5 p-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-primary">In corso</p>
          <h2 class="text-xl font-bold">{{ workout.name }}</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="badge badge-primary">{{ currentSegmentIndex + 1 }}/{{ segments.length }}</span>
          <button
            class="btn btn-square btn-ghost btn-sm"
            type="button"
            :aria-label="isFullscreen ? 'Esci da schermo intero' : 'Apri a schermo intero'"
            :title="isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'"
            @click="toggleFullscreen"
          >
            <Minimize v-if="isFullscreen" class="size-5" aria-hidden="true" />
            <Maximize v-else class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="h-2 overflow-hidden rounded-full bg-base-200">
        <div class="h-full bg-primary transition-all duration-200" :style="{ width: `${workoutProgress}%` }" />
      </div>

      <div class="rounded-box bg-base-200 p-6 text-center">
        <template v-if="isStarting">
          <p class="text-sm font-semibold uppercase tracking-wider text-primary">Preparati</p>
          <p class="mt-3 text-7xl font-black text-primary" aria-live="assertive">{{ startLabel }}</p>
          <p class="mt-3 text-sm text-base-content/60">Si parte tra un attimo</p>
        </template>
        <template v-else>
          <p class="text-sm font-semibold uppercase tracking-wider" :class="currentSegment.colorClass">
            {{ currentSegment.typeLabel }}
          </p>
          <p class="mt-2 text-2xl font-bold" :class="currentSegment.colorClass">{{ currentSegment.name }}</p>
          <p class="mt-5 font-mono text-6xl font-bold tabular-nums" :class="currentSegment.colorClass">
            {{ counterLabel }}
          </p>
          <p class="mt-2 text-sm text-base-content/60">{{ counterDetail }}</p>
        </template>
      </div>

      <div class="flex justify-between gap-3 text-sm text-base-content/60">
        <span>Step {{ currentSegment.sourceStepIndex + 1 }}</span>
        <span>Avanzamento automatico</span>
      </div>

      <div v-if="upcomingSegment" class="rounded-box border border-base-300 bg-base-100 px-4 py-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-base-content/55">Prossimo step</p>
        <p class="mt-1 font-bold" :class="upcomingSegment.colorClass">
          {{ upcomingSegment.typeLabel }} · {{ upcomingSegment.name }}
        </p>
      </div>
      <div v-else class="rounded-box border border-success/30 bg-success/10 px-4 py-3 text-success">
        <p class="text-xs font-semibold uppercase tracking-wider">Ultimo step</p>
        <p class="mt-1 font-bold">Al termine il workout sarà completato.</p>
      </div>

      <button class="abandon-button btn btn-ghost btn-error" type="button" @click="abandonWorkoutSession">Abbandona</button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Maximize, Minimize } from '@lucide/vue';
import { WORKOUT_CREATOR_STEP_ACTION, type WorkoutCreatorStep } from '@/constants';
import type { Workout } from '@/stores/workoutCreator';
import {
  abandonWorkoutSession,
  completeWorkoutSession,
  updateWorkoutSessionStep,
} from '@/stores/workoutCreator';
import { exercisesRef } from '@/stores/exercises';

type PlayerSegment = {
  name: string;
  typeLabel: string;
  colorClass: string;
  sourceStepIndex: number;
  mode: 'duration' | 'repetitions';
  target: number;
};

const props = defineProps<{ workout: Workout }>();

const REPETITION_INTERVAL_SECONDS = 3;
const currentSegmentIndex = ref(0);
const elapsedMilliseconds = ref(0);
const startCountdown = ref(3);
const isStarting = ref(true);
const playerElement = ref<HTMLElement>();
const isFullscreen = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
let countdownTimer: ReturnType<typeof setInterval> | undefined;
let segmentStartedAt = 0;

const exerciseName = (id?: string) =>
  exercisesRef.value.find((exercise) => exercise.id === id)?.name ?? 'Esercizio';

const segmentStyle = (type: WorkoutCreatorStep['type']) => {
  switch (type) {
    case WORKOUT_CREATOR_STEP_ACTION.WARMUP:
      return { typeLabel: 'Warm-up', colorClass: 'text-error' };
    case WORKOUT_CREATOR_STEP_ACTION.STRETCHING:
      return { typeLabel: 'Stretching', colorClass: 'text-warning' };
    case WORKOUT_CREATOR_STEP_ACTION.PAUSE:
    case WORKOUT_CREATOR_STEP_ACTION.SETPAUSE:
      return { typeLabel: 'Pausa', colorClass: 'text-info' };
    default:
      return { typeLabel: 'Esercizio', colorClass: 'text-primary' };
  }
};

const segments = computed<PlayerSegment[]>(() =>
  props.workout.steps.flatMap((step, sourceStepIndex) => {
    const style = segmentStyle(step.type);

    if (step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP) {
      return (step.warmupExercises ?? []).map((exercise) => ({
        ...style,
        name: exerciseName(exercise.exerciseId),
        sourceStepIndex,
        mode: exercise.modeType,
        target: Math.max(1, exercise.modeType === 'duration' ? exercise.duration : exercise.repetitions),
      }));
    }

    if (step.type === WORKOUT_CREATOR_STEP_ACTION.STRETCHING) {
      return (step.stretchingExercises ?? []).map((exercise) => ({
        ...style,
        name: exerciseName(exercise.exerciseId),
        sourceStepIndex,
        mode: 'duration' as const,
        target: Math.max(1, exercise.duration),
      }));
    }

    if (step.type === WORKOUT_CREATOR_STEP_ACTION.PAUSE) {
      return [{ ...style, name: 'Recupero', sourceStepIndex, mode: 'duration' as const, target: Math.max(1, step.pauseDuration ?? 0) }];
    }

    // The pauses between sets are generated from the exercise configuration below.
    // Old persisted SETPAUSE helper steps are therefore intentionally skipped.
    if (step.type === WORKOUT_CREATOR_STEP_ACTION.SETPAUSE) return [];

    const sets = Math.max(1, step.sets ?? 1);
    return Array.from({ length: sets }, (_, setIndex) => {
      const exercise = {
        ...style,
        name: sets > 1 ? `${exerciseName(step.exerciseId)} · Set ${setIndex + 1}/${sets}` : exerciseName(step.exerciseId),
        sourceStepIndex,
        mode: step.exerciseModeType ?? 'repetitions',
        target: Math.max(1, step.exerciseModeType === 'duration' ? (step.exerciseDuration ?? 0) : (step.exerciseRepetitions ?? 0)),
      } satisfies PlayerSegment;
      const pause = setIndex < sets - 1 && step.hasSetPause
        ? [{ ...segmentStyle(WORKOUT_CREATOR_STEP_ACTION.SETPAUSE), name: 'Recupero tra set', sourceStepIndex, mode: 'duration' as const, target: Math.max(1, step.pauseBetweenSetsDuration ?? 0) }]
        : [];
      return [exercise, ...pause];
    }).flat();
  }),
);

const currentSegment = computed<PlayerSegment>(() => segments.value[currentSegmentIndex.value] ?? {
  name: 'Workout completato', typeLabel: 'Completato', colorClass: 'text-success', sourceStepIndex: 0, mode: 'duration', target: 1,
});
const nextSegment = computed(() => segments.value[currentSegmentIndex.value + 1]);
const upcomingSegment = computed(() => isStarting.value ? currentSegment.value : nextSegment.value);
const elapsedSeconds = computed(() => Math.min(currentSegment.value.target, elapsedMilliseconds.value / 1000));
const repetitionsCompleted = computed(() => Math.min(currentSegment.value.target, Math.floor(elapsedSeconds.value / REPETITION_INTERVAL_SECONDS)));
const isRepetitions = computed(() => currentSegment.value.mode === 'repetitions');
const startLabel = computed(() => startCountdown.value > 0 ? String(startCountdown.value) : 'GO!');
const counterLabel = computed(() => isRepetitions.value ? `${repetitionsCompleted.value}/${currentSegment.value.target}` : formatTime(Math.ceil(currentSegment.value.target - elapsedSeconds.value)));
const counterDetail = computed(() => isRepetitions.value
  ? `Una ripetizione ogni ${REPETITION_INTERVAL_SECONDS} secondi · ${formatTime(Math.floor(elapsedSeconds.value))} trascorsi`
  : `${formatTime(Math.floor(elapsedSeconds.value))} trascorsi`);
const segmentDurationMilliseconds = computed(() => currentSegment.value.target * (isRepetitions.value ? REPETITION_INTERVAL_SECONDS : 1) * 1000);
const workoutProgress = computed(() => segments.value.length ? ((currentSegmentIndex.value + elapsedMilliseconds.value / segmentDurationMilliseconds.value) / segments.value.length) * 100 : 0);

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function startSegment() {
  segmentStartedAt = Date.now();
  elapsedMilliseconds.value = 0;
  updateWorkoutSessionStep(currentSegment.value.sourceStepIndex);
}

function tick() {
  elapsedMilliseconds.value = Date.now() - segmentStartedAt;
  if (elapsedMilliseconds.value < segmentDurationMilliseconds.value) return;
  if (currentSegmentIndex.value >= segments.value.length - 1) {
    stopTimer();
    completeWorkoutSession();
    return;
  }
  currentSegmentIndex.value += 1;
  startSegment();
}

function stopTimer() {
  if (timer) window.clearInterval(timer);
  timer = undefined;
}

function stopCountdown() {
  if (countdownTimer) window.clearInterval(countdownTimer);
  countdownTimer = undefined;
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await playerElement.value?.requestFullscreen();
}

function syncFullscreenState() {
  isFullscreen.value = document.fullscreenElement === playerElement.value;
}

function beginWorkout() {
  startCountdown.value = 3;
  isStarting.value = true;
  countdownTimer = window.setInterval(() => {
    startCountdown.value -= 1;
    if (startCountdown.value >= 0) return;
    stopCountdown();
    isStarting.value = false;
    startSegment();
    timer = window.setInterval(tick, 100);
  }, 1000);
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState);
  if (!segments.value.length) return completeWorkoutSession();
  beginWorkout();
});
onBeforeUnmount(() => {
  stopTimer();
  stopCountdown();
  document.removeEventListener('fullscreenchange', syncFullscreenState);
});
watch(() => props.workout.id, () => {
  stopTimer();
  stopCountdown();
  currentSegmentIndex.value = 0;
  beginWorkout();
});
</script>

<style scoped>
.workout-player:fullscreen {
  width: min(100%, 48rem);
  height: 100%;
  max-width: none;
  border: 0;
  border-radius: 0;
  background: var(--color-base-100);
}

.workout-player:fullscreen .card-body {
  justify-content: flex-start;
  min-height: 100%;
  padding: 2rem;
}

.workout-player:fullscreen .abandon-button {
  margin-top: auto;
}
</style>
