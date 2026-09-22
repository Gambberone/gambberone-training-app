<template>
  <article
    ref="playerElement"
    class="workout-player card border border-primary/25 bg-base-100 shadow-sm"
  >
    <div class="card-body gap-5 p-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-primary">
            In corso · <span class="font-mono tabular-nums">{{ totalElapsedLabel }}</span>
          </p>
          <h2 class="text-xl font-bold">{{ workout.name }}</h2>
        </div>
        <div class="flex items-center gap-1">
          <span class="badge badge-primary"
            >{{ currentSegmentIndex + 1 }}/{{ segments.length }}</span
          >
          <button
            class="btn btn-square btn-ghost btn-sm"
            type="button"
            aria-label="Riduci player"
            title="Continua in background"
            @click="minimizePlayer"
          >
            <Minimize2 class="size-5" aria-hidden="true" />
          </button>
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
        <div
          class="h-full bg-primary transition-all duration-200"
          :style="{ width: `${workoutProgress}%` }"
        />
      </div>

      <div class="flex min-h-96 flex-col justify-center rounded-box bg-base-200 p-3 text-center sm:p-8">
        <template v-if="isStarting">
          <p class="text-base font-semibold uppercase tracking-wider text-primary">Preparati</p>
          <p class="mt-3 text-8xl font-black text-primary sm:text-9xl" aria-live="assertive">
            {{ startLabel }}
          </p>
          <p class="mt-3 text-base text-base-content/60">Si parte tra un attimo</p>
        </template>
        <template v-else>
          <p class="flex h-20 items-center justify-center text-2xl font-bold sm:text-3xl" :class="currentSegment.colorClass">
            <span class="line-clamp-2">{{ currentSegment.name }}</span>
          </p>
          <div
            class="relative mt-5 grid aspect-square w-[min(85vw,22rem)] shrink-0 self-center place-items-center"
            :class="currentSegment.colorClass"
          >
            <span v-if="currentSegment.setLabel" class="absolute top-6 text-base font-bold sm:text-lg">
              {{ currentSegment.setLabel }}
            </span>
            <svg
              class="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-opacity="0.2" stroke-width="3" />
              <circle
                class="transition-[stroke-dashoffset] duration-100"
                cx="50" cy="50" r="46" fill="none" stroke="currentColor"
                stroke-width="3" stroke-linecap="round"
                pathLength="100" stroke-dasharray="100"
                :stroke-dashoffset="100 - segmentProgress"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <p
              class="relative font-black leading-none tracking-[-0.08em] tabular-nums"
              :class="isRepetitions ? 'text-[clamp(3.5rem,14vw,5rem)]' : 'text-[clamp(4.25rem,20vw,7rem)]'"
            >
              <template v-if="isRepetitions">{{ counterLabel }}</template>
              <template v-else>
                {{ counterLabel.split(':')[0] }}<span class="mx-[0.06em]">:</span>{{ counterLabel.split(':')[1] }}
              </template>
            </p>
          </div>
          <p class="mt-2 flex h-12 items-center justify-center text-base text-base-content/60 sm:text-lg">
            <span v-if="isRepetitions">Una ripetizione ogni {{ repetitionIntervalSeconds }} secondi</span>
          </p>
        </template>
      </div>

      <div v-if="upcomingSegment" class="rounded-box border border-base-300 bg-base-100 px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wider text-base-content/55">
              Prossimo step
            </p>
            <p class="mt-1 font-bold" :class="upcomingSegment.colorClass">
              {{ upcomingSegment.typeLabel }} · {{ upcomingSegment.name }}<span v-if="upcomingSegment.setLabel"> · {{ upcomingSegment.setLabel }}</span>
            </p>
          </div>
          <button
            v-if="!isStarting"
            class="btn btn-circle btn-ghost btn-sm shrink-0 text-primary hover:bg-base-200"
            type="button"
            :aria-label="`Avvia ora ${upcomingSegment.name}`"
            title="Avvia il prossimo step"
            @click="skipToNextSegment"
          >
            <Play :size="30" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div v-else class="rounded-box border border-success/30 bg-success/10 px-4 py-3 text-success">
        <p class="text-xs font-semibold uppercase tracking-wider">Ultimo step</p>
        <p class="mt-1 font-bold">Al termine il workout sarà completato.</p>
      </div>

      <div class="player-actions grid grid-cols-3 gap-2">
        <button class="btn btn-primary btn-sm px-1 text-xs sm:btn-md sm:px-4 sm:text-sm" type="button" aria-label="Ricomincia il segmento corrente" @click="resetCurrentSegment">
          <RotateCcw class="size-4 sm:size-5" aria-hidden="true" />
          Reset
        </button>
        <button class="btn btn-info btn-sm px-1 text-xs sm:btn-md sm:px-4 sm:text-sm" type="button" @click="togglePause">
          <Play v-if="isPaused" class="size-4 sm:size-5" aria-hidden="true" />
          <Pause v-else class="size-4 sm:size-5" aria-hidden="true" />
          {{ isPaused ? 'Riprendi' : 'Pausa' }}
        </button>
        <button class="btn btn-error btn-sm px-1 text-xs sm:btn-md sm:px-4 sm:text-sm" type="button" @click="abandonWorkoutSession">
          <Square class="size-4 sm:size-5" aria-hidden="true" />
          Abbandona
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { Maximize, Minimize, Minimize2, Pause, Play, RotateCcw, Square } from '@lucide/vue';
import {
  DEFAULT_REPETITION_INTERVAL_SECONDS,
  WORKOUT_CREATOR_STEP_ACTION,
  type WorkoutCreatorStep,
} from '@/constants';
import type { Workout } from '@/stores/workoutCreator';
import {
  abandonWorkoutSession,
  completeWorkoutSession,
  updateWorkoutSessionStep,
  workoutPlayerPauseRequestRef,
  workoutPlayerStatusRef,
} from '@/stores/workoutCreator';
import { exercisesRef } from '@/stores/exercises';

type PlayerSegment = {
  name: string;
  setLabel?: string;
  typeLabel: string;
  colorClass: string;
  sourceStepIndex: number;
  mode: 'duration' | 'repetitions';
  target: number;
  repetitionIntervalSeconds?: number;
};

const props = defineProps<{ workout: Workout }>();
const emit = defineEmits<{ minimize: [] }>();

const currentSegmentIndex = ref(0);
const elapsedMilliseconds = ref(0);
const totalElapsedMilliseconds = ref(0);
const startCountdown = ref(3);
const isStarting = ref(true);
const isPaused = ref(false);
const playerElement = ref<HTMLElement>();
const isFullscreen = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
let countdownTimer: ReturnType<typeof setInterval> | undefined;
let segmentStartedAt = 0;
let lastTotalTickAt = 0;

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
  props.workout.steps.flatMap<PlayerSegment>((step, sourceStepIndex) => {
    const style = segmentStyle(step.type);

    if (step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP) {
      return (step.warmupExercises ?? []).map((exercise) => ({
        ...style,
        name: exerciseName(exercise.exerciseId),
        sourceStepIndex,
        mode: exercise.modeType,
        target: Math.max(
          1,
          exercise.modeType === 'duration' ? exercise.duration : exercise.repetitions,
        ),
        repetitionIntervalSeconds: exercise.repetitionIntervalSeconds,
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
      return [
        {
          ...style,
          name: 'Recupero',
          sourceStepIndex,
          mode: 'duration' as const,
          target: Math.max(1, step.pauseDuration ?? 0),
        },
      ];
    }

    // The pauses between sets are generated from the exercise configuration below.
    // Old persisted SETPAUSE helper steps are therefore intentionally skipped.
    if (step.type === WORKOUT_CREATOR_STEP_ACTION.SETPAUSE) return [];

    const sets = Math.max(1, step.sets ?? 1);
    return Array.from({ length: sets }, (_, setIndex) => {
      const exercise = {
        ...style,
        name: exerciseName(step.exerciseId),
        setLabel: sets > 1 ? `Set ${setIndex + 1}/${sets}` : undefined,
        sourceStepIndex,
        mode: step.exerciseModeType ?? 'repetitions',
        target: Math.max(
          1,
          step.exerciseModeType === 'duration'
            ? (step.exerciseDuration ?? 0)
            : (step.exerciseRepetitions ?? 0),
        ),
        repetitionIntervalSeconds: step.repetitionIntervalSeconds,
      } satisfies PlayerSegment;
      const pause =
        setIndex < sets - 1 && step.hasSetPause
          ? [
              {
                ...segmentStyle(WORKOUT_CREATOR_STEP_ACTION.SETPAUSE),
                name: 'Recupero tra set',
                sourceStepIndex,
                mode: 'duration' as const,
                target: Math.max(1, step.pauseBetweenSetsDuration ?? 0),
              },
            ]
          : [];
      return [exercise, ...pause];
    }).flat();
  }),
);

const currentSegment = computed<PlayerSegment>(
  () =>
    segments.value[currentSegmentIndex.value] ?? {
      name: 'Workout completato',
      typeLabel: 'Completato',
      colorClass: 'text-success',
      sourceStepIndex: 0,
      mode: 'duration',
      target: 1,
    },
);
const nextSegment = computed(() => segments.value[currentSegmentIndex.value + 1]);
const upcomingSegment = computed(() =>
  isStarting.value ? currentSegment.value : nextSegment.value,
);
const repetitionIntervalSeconds = computed(() => {
  const interval = currentSegment.value.repetitionIntervalSeconds;
  return interval && Number.isInteger(interval) && interval > 0
    ? interval
    : DEFAULT_REPETITION_INTERVAL_SECONDS;
});
const elapsedSeconds = computed(
  () => Math.min(segmentDurationMilliseconds.value, elapsedMilliseconds.value) / 1000,
);
const repetitionsCompleted = computed(() =>
  Math.min(
    currentSegment.value.target,
    Math.floor(elapsedSeconds.value / repetitionIntervalSeconds.value),
  ),
);
const isRepetitions = computed(() => currentSegment.value.mode === 'repetitions');
const startLabel = computed(() =>
  startCountdown.value > 0 ? String(startCountdown.value) : 'GO!',
);
const counterLabel = computed(() =>
  isRepetitions.value
    ? `${repetitionsCompleted.value}/${currentSegment.value.target}`
    : formatTime(Math.ceil(currentSegment.value.target - elapsedSeconds.value)),
);
const totalElapsedLabel = computed(() => formatTime(Math.floor(totalElapsedMilliseconds.value / 1000)));
const segmentDurationMilliseconds = computed(
  () =>
    currentSegment.value.target *
    (isRepetitions.value ? repetitionIntervalSeconds.value : 1) *
    1000,
);
const workoutProgress = computed(() =>
  segments.value.length
    ? ((currentSegmentIndex.value + elapsedMilliseconds.value / segmentDurationMilliseconds.value) /
        segments.value.length) *
      100
    : 0,
);
const segmentProgress = computed(() =>
  Math.min(100, (elapsedMilliseconds.value / segmentDurationMilliseconds.value) * 100),
);

watchEffect(() => {
  workoutPlayerStatusRef.value = {
    step: currentSegment.value.name,
    stepColorClass: currentSegment.value.colorClass,
    remaining: isStarting.value
      ? formatTime(Math.max(0, startCountdown.value))
      : formatTime(
          Math.ceil((segmentDurationMilliseconds.value - elapsedMilliseconds.value) / 1000),
        ),
    paused: isPaused.value,
  };
});

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function updateTotalElapsed() {
  const now = Date.now();
  if (lastTotalTickAt) totalElapsedMilliseconds.value += now - lastTotalTickAt;
  lastTotalTickAt = now;
}

function startSegment() {
  updateTotalElapsed();
  segmentStartedAt = Date.now();
  elapsedMilliseconds.value = 0;
  updateWorkoutSessionStep(currentSegment.value.sourceStepIndex);
}

function skipToNextSegment() {
  if (isStarting.value || !nextSegment.value) return;
  currentSegmentIndex.value += 1;
  startSegment();
}

function tick() {
  updateTotalElapsed();
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

function runSegmentTimer() {
  timer = window.setInterval(tick, 100);
}

function runCountdown() {
  countdownTimer = window.setInterval(() => {
    startCountdown.value -= 1;
    if (startCountdown.value >= 0) return;
    stopCountdown();
    isStarting.value = false;
    startSegment();
    runSegmentTimer();
  }, 1000);
}

function togglePause() {
  if (!isPaused.value && !isStarting.value) updateTotalElapsed();
  if (isPaused.value && !isStarting.value) lastTotalTickAt = Date.now();
  isPaused.value = !isPaused.value;

  if (isPaused.value) {
    if (isStarting.value) stopCountdown();
    else {
      elapsedMilliseconds.value = Date.now() - segmentStartedAt;
      stopTimer();
    }
    return;
  }

  if (isStarting.value) runCountdown();
  else {
    segmentStartedAt = Date.now() - elapsedMilliseconds.value;
    runSegmentTimer();
  }
}

function resetCurrentSegment() {
  if (isStarting.value) {
    stopCountdown();
    startCountdown.value = 3;
    if (!isPaused.value) runCountdown();
    return;
  }

  segmentStartedAt = Date.now();
  elapsedMilliseconds.value = 0;
}

watch(workoutPlayerPauseRequestRef, togglePause);

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await playerElement.value?.requestFullscreen();
}

async function minimizePlayer() {
  if (document.fullscreenElement === playerElement.value) {
    try {
      await document.exitFullscreen();
    } catch {
      return;
    }
  }
  emit('minimize');
}

function syncFullscreenState() {
  isFullscreen.value = document.fullscreenElement === playerElement.value;
}

function beginWorkout() {
  totalElapsedMilliseconds.value = 0;
  lastTotalTickAt = 0;
  startCountdown.value = 3;
  isStarting.value = true;
  isPaused.value = false;
  runCountdown();
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState);
  if (!segments.value.length) return completeWorkoutSession();
  beginWorkout();
});
onBeforeUnmount(() => {
  stopTimer();
  stopCountdown();
  workoutPlayerStatusRef.value = null;
  document.removeEventListener('fullscreenchange', syncFullscreenState);
});
watch(
  () => props.workout.id,
  () => {
    stopTimer();
    stopCountdown();
    currentSegmentIndex.value = 0;
    beginWorkout();
  },
);
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

.workout-player:fullscreen .player-actions {
  margin-top: auto;
}
</style>
