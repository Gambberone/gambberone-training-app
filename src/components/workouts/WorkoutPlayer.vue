<template>
  <article
    ref="playerElement"
    class="workout-player card bg-base-100 shadow-sm"
    :class="{
      'workout-player--paused': isPaused,
      'workout-player--focus': isFullscreen,
    }"
    @keydown="handleFocusKeys"
  >
    <div class="player-body card-body gap-5 p-5">
      <div v-if="isFullscreen" class="player-focus-top">
        <GttButton
          mode="ghost"
          shape="square"
          :aria-label="tr('ui.exit_fullscreen')"
          @click="toggleFullscreen"
          ><Minimize :size="22" aria-hidden="true"
        /></GttButton>
      </div>
      <div class="player-header flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-primary">
            {{
              isPaused ? tr("playerDesign.paused") : tr("messages.inProgress")
            }}
            ·
            <span class="font-mono tabular-nums">{{ totalElapsedLabel }}</span>
          </p>
          <h2 class="text-xl font-bold">{{ workout.name }}</h2>
        </div>
        <div class="flex items-center gap-1">
          <span class="badge badge-primary"
            >{{ currentSegmentIndex + 1 }}/{{ segments.length }}</span
          >
          <GttButton
            shape="square"
            mode="ghost"
            size="sm"
            type="button"
            :aria-label="tr('ui.minimize_player')"
            :title="tr('ui.continue_in_the_background')"
            @click="minimizePlayer"
          >
            <Minimize2 class="size-5" aria-hidden="true" />
          </GttButton>
          <GttButton
            shape="square"
            mode="ghost"
            size="sm"
            type="button"
            :aria-label="
              isFullscreen
                ? tr('ui.exit_fullscreen')
                : tr('ui.enter_fullscreen')
            "
            :title="
              isFullscreen ? tr('ui.exit_fullscreen') : tr('ui.fullscreen')
            "
            @click="toggleFullscreen"
          >
            <Minimize v-if="isFullscreen" class="size-5" aria-hidden="true" />
            <Maximize v-else class="size-5" aria-hidden="true" />
          </GttButton>
        </div>
      </div>

      <div class="player-progress h-2 overflow-hidden rounded-full bg-base-200">
        <div
          class="player-progress-fill h-full origin-left bg-primary"
          :style="{ transform: `scaleX(${workoutProgress / 100})` }"
        />
      </div>

      <p v-if="isPaused" class="player-pause-status" role="status">
        <Pause :size="18" aria-hidden="true" />{{
          tr("playerDesign.pauseHint")
        }}
      </p>
      <div
        class="player-stage flex min-h-80 flex-col justify-center rounded-box bg-base-200 p-3 text-center sm:p-8"
      >
        <template v-if="isStarting">
          <p
            class="text-base font-semibold uppercase tracking-wider text-primary"
          >
            {{ tr("ui.get_ready") }}
          </p>
          <p
            class="mt-3 text-8xl font-black text-primary sm:text-9xl"
            aria-live="assertive"
          >
            {{ startLabel }}
          </p>
          <p class="mt-3 text-base text-base-content/60">
            {{ tr("ui.starting_shortly") }}
          </p>
        </template>
        <template v-else>
          <p
            class="player-step-name flex items-center justify-center text-3xl font-bold leading-tight sm:text-4xl"
            :class="currentSegment.colorClass"
          >
            <span class="min-w-0 wrap-break-word">{{
              currentSegment.name
            }}</span>
          </p>
          <div
            class="player-ring relative mt-3 grid aspect-square w-full max-w-84 shrink-0 self-center place-items-center sm:max-w-md"
            :class="currentSegment.colorClass"
          >
            <span
              v-if="currentSegment.setLabel"
              class="absolute inset-x-[15%] top-[19%] text-center text-base font-bold leading-tight sm:text-lg"
            >
              {{ currentSegment.setLabel }}
            </span>
            <svg
              class="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                stroke-opacity="0.2"
                stroke-width="4.5"
              />
              <circle
                ref="progressCircle"
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                stroke-width="4.5"
                stroke-linecap="round"
                pathLength="100"
                stroke-dasharray="100"
                stroke-dashoffset="100"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <p
              class="relative font-black leading-none tracking-[-0.08em] tabular-nums"
              :class="
                isRepetitions
                  ? 'text-[clamp(3.5rem,14vw,5rem)] sm:text-[clamp(5rem,10vw,7rem)]'
                  : 'text-[clamp(4.25rem,20vw,7rem)] sm:text-[clamp(7rem,11vw,9rem)]'
              "
            >
              <template v-if="isRepetitions">{{ counterLabel }}</template>
              <template v-else>
                {{ counterLabel.split(":")[0]
                }}<span class="mx-[0.06em]">:</span
                >{{ counterLabel.split(":")[1] }}
              </template>
            </p>
            <p
              v-if="isRepetitions"
              class="player-cadence absolute inset-x-[15%] bottom-[19%] text-sm leading-tight text-base-content/60 sm:text-base"
            >
              {{
                tr("messages.repetitionInterval", {
                  seconds: repetitionIntervalSeconds,
                })
              }}
            </p>
          </div>
        </template>
      </div>

      <div v-if="isFullscreen" class="player-focus-controls">
        <p
          v-if="upcomingSegment"
          class="player-focus-next text-sm text-base-content/65"
        >
          {{ tr("ui.next_step") }}:
          <span class="font-semibold" :class="upcomingSegment.colorClass">{{
            upcomingSegment.name
          }}</span>
        </p>
        <p v-else class="text-sm text-base-content/65">
          {{ tr("ui.last_step") }}
        </p>
        <GttButton
          color="primary"
          class="player-focus-pause"
          :aria-pressed="isPaused"
          @click="togglePause"
          ><Play v-if="isPaused" :size="22" aria-hidden="true" /><Pause
            v-else
            :size="22"
            aria-hidden="true"
          />{{ isPaused ? tr("ui.resume") : tr("ui.pause") }}</GttButton
        >
      </div>
      <div class="player-sidebar flex flex-col gap-4">
        <div
          class="player-next rounded-box border border-base-300 bg-base-100 px-4 py-3"
        >
          <p
            class="player-next-label text-left text-xs font-semibold"
            :class="upcomingSegment ? 'text-base-content/55' : 'text-success'"
          >
            {{ upcomingSegment ? tr("ui.next_step") : tr("ui.last_step") }}
          </p>
          <div
            class="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-3 text-center"
          >
            <GttButton
              shape="circle"
              mode="ghost"
              size="sm"
              class="shrink-0 text-primary hover:bg-base-200"
              type="button"
              :disabled="isStarting || !previousSegment"
              :aria-label="
                previousSegment
                  ? tr('messages.previousNamed', { name: previousSegment.name })
                  : tr('ui.no_previous_step')
              "
              :title="tr('ui.go_to_the_previous_step')"
              @click="skipToPreviousSegment"
            >
              <SkipBack :size="24" aria-hidden="true" />
            </GttButton>
            <div v-if="upcomingSegment" class="min-w-0 flex-1">
              <p
                class="text-sm font-semibold leading-tight"
                :class="upcomingSegment.colorClass"
              >
                {{ upcomingSegment.name
                }}<span v-if="upcomingSegment.setLabel">
                  · {{ upcomingSegment.setLabel }}</span
                >
              </p>
            </div>
            <div v-else class="min-w-0 flex-1 text-success">
              <p class="font-bold">
                {{ tr("ui.the_workout_will_be_completed_after_this_step") }}
              </p>
            </div>
            <GttButton
              shape="circle"
              mode="ghost"
              size="sm"
              :disabled="isStarting || !upcomingSegment"
              class="shrink-0 text-primary hover:bg-base-200"
              type="button"
              :aria-label="
                upcomingSegment
                  ? tr('messages.startNamed', { name: upcomingSegment.name })
                  : tr('ui.no_next_step')
              "
              :title="tr('ui.start_the_next_step')"
              @click="skipToNextSegment"
            >
              <SkipForward :size="24" aria-hidden="true" />
            </GttButton>
          </div>
        </div>
        <div class="player-actions grid grid-cols-2 gap-2">
          <GttButton
            mode="ghost"
            size="sm"
            class="player-reset px-1 text-xs sm:btn-md sm:px-4 sm:text-sm"
            type="button"
            :aria-label="tr('ui.restart_the_current_segment')"
            @click="resetCurrentSegment"
          >
            <RotateCcw class="size-4 sm:size-5" aria-hidden="true" />
            {{ tr("ui.reset") }}
          </GttButton>
          <GttButton
            color="primary"
            size="sm"
            class="player-pause px-1 text-xs sm:btn-md sm:px-4 sm:text-sm"
            type="button"
            :aria-pressed="isPaused"
            @click="togglePause"
          >
            <Play v-if="isPaused" class="size-4 sm:size-5" aria-hidden="true" />
            <Pause v-else class="size-4 sm:size-5" aria-hidden="true" />
            {{ isPaused ? tr("ui.resume") : tr("ui.pause") }}
          </GttButton>
          <GttButton
            mode="ghost"
            size="sm"
            class="player-abandon text-error px-1 text-xs sm:btn-md sm:px-4 sm:text-sm"
            type="button"
            @click="abandonWorkoutSession"
          >
            <Square class="size-4 sm:size-5" aria-hidden="true" />
            {{ tr("ui.abandon") }}
          </GttButton>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { tr, localizedExerciseName } from "@/localization";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from "vue";
import {
  Maximize,
  Minimize,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Square,
} from "@lucide/vue";
import {
  DEFAULT_REPETITION_INTERVAL_SECONDS,
  WORKOUT_CREATOR_STEP_ACTION,
  type WorkoutCreatorStep,
} from "@/constants";
import type { Workout } from "@/stores/workoutCreator";
import {
  abandonWorkoutSession,
  activeWorkoutSessionRef,
  completeWorkoutSession,
  getWorkoutPlaybackCheckpoint,
  saveWorkoutPlaybackCheckpoint,
  updateWorkoutSessionStep,
  workoutPlayerPauseRequestRef,
  workoutPlayerStatusRef,
} from "@/stores/workoutCreator";
import { exercisesRef } from "@/stores/exercises";
import { useWorkoutPreferences } from "@/composables/useWorkoutPreferences";
import { signalTimer } from "@/services/workoutFeedback";

type PlayerSegment = {
  name: string;
  setLabel?: string;
  typeLabel: string;
  colorClass: string;
  sourceStepIndex: number;
  mode: "duration" | "repetitions";
  target: number;
  repetitionIntervalSeconds?: number;
};

const props = defineProps<{ workout: Workout }>();
const emit = defineEmits<{ minimize: [] }>();
const sessionId = activeWorkoutSessionRef.value?.id;

const currentSegmentIndex = ref(0);
const elapsedMilliseconds = ref(0);
const totalElapsedMilliseconds = ref(0);
const startCountdown = ref(3);
const isStarting = ref(true);
const isPaused = ref(false);
let pausedForBackground = false;
let appliedResetId: string | undefined;
const playerElement = ref<HTMLElement>();
const progressCircle = ref<SVGCircleElement>();
let ringFrame: number | undefined;
const isFullscreen = ref(false);
const { keepScreenAwake } = useWorkoutPreferences();
let wakeLock: WakeLockSentinel | undefined;
let isUnmounted = false;
let lastRemainingCount = 0;
let timer: ReturnType<typeof setInterval> | undefined;
let countdownTimer: ReturnType<typeof setInterval> | undefined;
let segmentStartedAt = 0;
let lastTotalTickAt = 0;
let lastCheckpointAt = 0;

const exerciseName = (id?: string) => {
  const exercise = exercisesRef.value.find((item) => item.id === id);
  return exercise ? localizedExerciseName(exercise) : tr("ui.exercise");
};

const segmentStyle = (type: WorkoutCreatorStep["type"]) => {
  switch (type) {
    case WORKOUT_CREATOR_STEP_ACTION.WARMUP:
      return { typeLabel: "Warm-up", colorClass: "text-error" };
    case WORKOUT_CREATOR_STEP_ACTION.STRETCHING:
      return { typeLabel: "Stretching", colorClass: "text-warning" };
    case WORKOUT_CREATOR_STEP_ACTION.PAUSE:
    case WORKOUT_CREATOR_STEP_ACTION.SETPAUSE:
      return { typeLabel: tr("ui.rest"), colorClass: "text-info" };
    default:
      return { typeLabel: tr("ui.exercise"), colorClass: "text-primary" };
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
          exercise.modeType === "duration"
            ? exercise.duration
            : exercise.repetitions,
        ),
        repetitionIntervalSeconds: exercise.repetitionIntervalSeconds,
      }));
    }

    if (step.type === WORKOUT_CREATOR_STEP_ACTION.STRETCHING) {
      return (step.stretchingExercises ?? []).map((exercise) => ({
        ...style,
        name: exerciseName(exercise.exerciseId),
        sourceStepIndex,
        mode: "duration" as const,
        target: Math.max(1, exercise.duration),
      }));
    }

    if (step.type === WORKOUT_CREATOR_STEP_ACTION.PAUSE) {
      return [
        {
          ...style,
          name: tr("messages.recovery"),
          sourceStepIndex,
          mode: "duration" as const,
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
        setLabel:
          sets > 1
            ? tr("messages.setNumber", { number: setIndex + 1, total: sets })
            : undefined,
        sourceStepIndex,
        mode: step.exerciseModeType ?? "repetitions",
        target: Math.max(
          1,
          step.exerciseModeType === "duration"
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
                name: tr("messages.setRecovery"),
                sourceStepIndex,
                mode: "duration" as const,
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
      name: tr("messages.workoutDone"),
      typeLabel: tr("ui.completed"),
      colorClass: "text-success",
      sourceStepIndex: 0,
      mode: "duration",
      target: 1,
    },
);
const previousSegment = computed(
  () => segments.value[currentSegmentIndex.value - 1],
);
const nextSegment = computed(
  () => segments.value[currentSegmentIndex.value + 1],
);
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
  () =>
    Math.min(segmentDurationMilliseconds.value, elapsedMilliseconds.value) /
    1000,
);
const currentRepetition = computed(() =>
  Math.min(
    currentSegment.value.target,
    Math.floor(elapsedSeconds.value / repetitionIntervalSeconds.value) + 1,
  ),
);
const isRepetitions = computed(
  () => currentSegment.value.mode === "repetitions",
);
const startLabel = computed(() =>
  startCountdown.value > 0 ? String(startCountdown.value) : "GO!",
);
const counterLabel = computed(() =>
  isRepetitions.value
    ? `${currentRepetition.value}/${currentSegment.value.target}`
    : formatTime(Math.ceil(currentSegment.value.target - elapsedSeconds.value)),
);
const totalElapsedLabel = computed(() =>
  formatTime(Math.floor(totalElapsedMilliseconds.value / 1000)),
);
const segmentDurationMilliseconds = computed(
  () =>
    currentSegment.value.target *
    (isRepetitions.value ? repetitionIntervalSeconds.value : 1) *
    1000,
);
const workoutProgress = computed(() =>
  segments.value.length
    ? ((currentSegmentIndex.value +
        elapsedMilliseconds.value / segmentDurationMilliseconds.value) /
        segments.value.length) *
      100
    : 0,
);
// Draw from the same clock as playback, without rerendering the player every frame.
function drawRing() {
  const elapsed = isStarting.value
    ? 0
    : isPaused.value
      ? elapsedMilliseconds.value
      : Math.max(0, Date.now() - segmentStartedAt);
  const progress = Math.min(1, elapsed / segmentDurationMilliseconds.value);
  progressCircle.value?.setAttribute(
    "stroke-dashoffset",
    String(100 * (1 - progress)),
  );
  ringFrame = window.requestAnimationFrame(drawRing);
}

watchEffect(() => {
  workoutPlayerStatusRef.value = {
    step: currentSegment.value.name,
    stepColorClass: currentSegment.value.colorClass,
    counter: isStarting.value
      ? formatTime(Math.max(0, startCountdown.value))
      : counterLabel.value,
    paused: isPaused.value,
  };
});

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function savePlayback() {
  if (!sessionId || activeWorkoutSessionRef.value?.id !== sessionId) return;
  saveWorkoutPlaybackCheckpoint({
    sessionId,
    segmentIndex: currentSegmentIndex.value,
    elapsedMilliseconds: elapsedMilliseconds.value,
    totalElapsedMilliseconds: totalElapsedMilliseconds.value,
    isStarting: isStarting.value,
    startCountdown: startCountdown.value,
    pausedForBackground,
    ...(appliedResetId ? { appliedResetId } : {}),
  });
  lastCheckpointAt = Date.now();
}

function restorePlayback() {
  if (!sessionId) return false;
  const checkpoint = getWorkoutPlaybackCheckpoint(sessionId);
  if (checkpoint) {
    if (
      !Number.isInteger(checkpoint.segmentIndex) ||
      checkpoint.segmentIndex < 0 ||
      checkpoint.segmentIndex >= segments.value.length ||
      !Number.isFinite(checkpoint.elapsedMilliseconds) ||
      checkpoint.elapsedMilliseconds < 0 ||
      !Number.isFinite(checkpoint.totalElapsedMilliseconds) ||
      checkpoint.totalElapsedMilliseconds < 0 ||
      typeof checkpoint.isStarting !== "boolean" ||
      !Number.isInteger(checkpoint.startCountdown) ||
      checkpoint.startCountdown < 0 ||
      checkpoint.startCountdown > 3
    )
      return false;

    currentSegmentIndex.value = checkpoint.segmentIndex;
    elapsedMilliseconds.value = Math.min(
      checkpoint.elapsedMilliseconds,
      segmentDurationMilliseconds.value - 1,
    );
    totalElapsedMilliseconds.value = checkpoint.totalElapsedMilliseconds;
    isStarting.value = checkpoint.isStarting;
    startCountdown.value = checkpoint.startCountdown;
    pausedForBackground = checkpoint.pausedForBackground === true;
    appliedResetId = checkpoint.appliedResetId;
  } else {
    const savedStepIndex = activeWorkoutSessionRef.value?.currentStepIndex ?? 0;
    if (savedStepIndex === 0) return false;
    const matchingSegmentIndex = segments.value.findIndex(
      (segment) => segment.sourceStepIndex >= savedStepIndex,
    );
    currentSegmentIndex.value = Math.max(0, matchingSegmentIndex);
    isStarting.value = false;
  }

  isPaused.value = true;
  segmentStartedAt = Date.now() - elapsedMilliseconds.value;
  lastTotalTickAt = 0;
  savePlayback();
  return true;
}

function checkpointAtExit() {
  if (!sessionId || activeWorkoutSessionRef.value?.id !== sessionId) return;
  if (isPaused.value) savePlayback();
  else {
    pausedForBackground = true;
    setPaused(true, false);
  }
}

function checkpointWhenHidden() {
  if (document.visibilityState === "hidden") {
    checkpointAtExit();
  } else {
    resumeAfterBackground();
  }
}

function resumeAfterBackground() {
  if (!pausedForBackground || document.visibilityState !== "visible") return;
  pausedForBackground = false;
  const session = activeWorkoutSessionRef.value;
  if (session && session.id === sessionId && session.isPaused !== true) {
    setPaused(false, false);
  }
  savePlayback();
}

function updateTotalElapsed() {
  const now = Date.now();
  if (lastTotalTickAt) totalElapsedMilliseconds.value += now - lastTotalTickAt;
  lastTotalTickAt = now;
}

function startSegment() {
  lastRemainingCount = 0;
  updateTotalElapsed();
  segmentStartedAt = Date.now();
  elapsedMilliseconds.value = 0;
  updateWorkoutSessionStep(currentSegment.value.sourceStepIndex);
  savePlayback();
  signalTimer(true, false);
}

function skipToPreviousSegment() {
  if (isStarting.value || !previousSegment.value) return;
  publishSegmentChange(currentSegmentIndex.value - 1, false, "skip");
}

function skipToNextSegment() {
  if (isStarting.value || !nextSegment.value) return;
  publishSegmentChange(currentSegmentIndex.value + 1, false, "skip");
}

function tick() {
  updateTotalElapsed();
  elapsedMilliseconds.value = Date.now() - segmentStartedAt;
  const remainingCount = isRepetitions.value
    ? currentSegment.value.target - currentRepetition.value + 1
    : Math.max(
        0,
        Math.ceil(
          (segmentDurationMilliseconds.value - elapsedMilliseconds.value) /
            1000,
        ),
      );
  if (remainingCount !== lastRemainingCount) {
    lastRemainingCount = remainingCount;
    if (remainingCount > 0 && remainingCount <= 3) signalTimer();
  }
  if (Date.now() - lastCheckpointAt >= 1000) savePlayback();
  if (elapsedMilliseconds.value < segmentDurationMilliseconds.value) return;
  if (currentSegmentIndex.value >= segments.value.length - 1) {
    stopTimer();
    signalTimer(true, false);
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
  if (startCountdown.value > 0 && startCountdown.value <= 3) signalTimer();
  countdownTimer = window.setInterval(() => {
    startCountdown.value -= 1;
    if (startCountdown.value > 0) signalTimer();
    else if (startCountdown.value === 0) signalTimer(true, true, "go");
    savePlayback();
    if (startCountdown.value >= 0) return;
    stopCountdown();
    isStarting.value = false;
    startSegment();
    runSegmentTimer();
  }, 1000);
}

async function syncWakeLock() {
  if (
    !keepScreenAwake.value ||
    document.visibilityState !== "visible" ||
    isUnmounted
  ) {
    await wakeLock?.release().catch(() => {});
    wakeLock = undefined;
    return;
  }
  if (wakeLock || !("wakeLock" in navigator)) return;
  try {
    const lock = await navigator.wakeLock.request("screen");
    if (
      isUnmounted ||
      !keepScreenAwake.value ||
      document.visibilityState !== "visible"
    ) {
      await lock.release();
    } else wakeLock = lock;
  } catch {
    // The device can refuse a screen wake lock, for example in power saving mode.
  }
}

watch(keepScreenAwake, () => void syncWakeLock());

function setPaused(paused: boolean, syncSession = true) {
  if (syncSession) pausedForBackground = false;
  if (isPaused.value === paused) return;
  if (!isPaused.value && !isStarting.value) updateTotalElapsed();
  if (isPaused.value && !isStarting.value) lastTotalTickAt = Date.now();
  isPaused.value = paused;

  if (isPaused.value) {
    if (isStarting.value) stopCountdown();
    else {
      elapsedMilliseconds.value = Date.now() - segmentStartedAt;
      stopTimer();
    }
    savePlayback();
    const session = activeWorkoutSessionRef.value;
    if (syncSession && session && session.id === sessionId)
      session.isPaused = true;
    return;
  }

  if (isStarting.value) runCountdown();
  else {
    segmentStartedAt = Date.now() - elapsedMilliseconds.value;
    runSegmentTimer();
  }
  savePlayback();
  const session = activeWorkoutSessionRef.value;
  if (syncSession && session && session.id === sessionId)
    session.isPaused = false;
}

function togglePause() {
  setPaused(!isPaused.value);
}

function applySegmentReset() {
  const session = activeWorkoutSessionRef.value;
  const reset = session?.segmentReset;
  if (
    !session ||
    session.id !== sessionId ||
    !reset ||
    reset.id === appliedResetId
  )
    return;
  if (
    !Number.isInteger(reset.segmentIndex) ||
    reset.segmentIndex < 0 ||
    reset.segmentIndex >= segments.value.length
  )
    return;

  if (!isPaused.value && !isStarting.value) updateTotalElapsed();
  stopTimer();
  stopCountdown();
  appliedResetId = reset.id;
  currentSegmentIndex.value = reset.segmentIndex;
  isStarting.value = reset.isStarting;
  startCountdown.value = 3;
  segmentStartedAt = Date.now();
  elapsedMilliseconds.value = 0;
  lastRemainingCount = 0;
  isPaused.value =
    session.isPaused === true || document.visibilityState === "hidden";
  pausedForBackground =
    document.visibilityState === "hidden" && session.isPaused !== true;
  lastTotalTickAt = isPaused.value || isStarting.value ? 0 : Date.now();
  if (!isPaused.value) {
    if (isStarting.value) runCountdown();
    else runSegmentTimer();
  }
  savePlayback();
  if (reset.action === "skip" && document.visibilityState === "visible")
    signalTimer(true, false);
}

function publishSegmentChange(
  segmentIndex: number,
  starting: boolean,
  action: "reset" | "skip",
) {
  const session = activeWorkoutSessionRef.value;
  const segment = segments.value[segmentIndex];
  if (!session || session.id !== sessionId || !segment) return;
  // Publish the destination and command together so every device sees the same series.
  activeWorkoutSessionRef.value = {
    ...session,
    currentStepIndex: segment.sourceStepIndex,
    segmentReset: {
      id: crypto.randomUUID(),
      segmentIndex,
      isStarting: starting,
      action,
    },
  };
}

function resetCurrentSegment() {
  publishSegmentChange(currentSegmentIndex.value, isStarting.value, "reset");
}

watch(
  () => activeWorkoutSessionRef.value?.segmentReset?.id,
  applySegmentReset,
  { flush: "sync" },
);

watch(workoutPlayerPauseRequestRef, togglePause);
watch(
  () => activeWorkoutSessionRef.value?.isPaused,
  (paused) => {
    if (
      activeWorkoutSessionRef.value?.id === sessionId &&
      typeof paused === "boolean"
    ) {
      if (!paused && document.visibilityState === "hidden") return;
      setPaused(paused, false);
    }
  },
  { flush: "sync" },
);

async function toggleFullscreen() {
  if (isFullscreen.value) {
    if (document.fullscreenElement === playerElement.value)
      await document.exitFullscreen();
    isFullscreen.value = false;
    await nextTick();
    playerElement.value
      ?.querySelector<HTMLButtonElement>(".player-header button:last-child")
      ?.focus();
    return;
  }
  isFullscreen.value = true;
  try {
    await playerElement.value?.requestFullscreen?.();
  } catch {
    /* Keep the focused viewport layout when native fullscreen is unavailable. */
  }
  await nextTick();
  playerElement.value
    ?.querySelector<HTMLButtonElement>(".player-focus-top button")
    ?.focus();
}
function handleFocusKeys(event: KeyboardEvent) {
  if (!isFullscreen.value) return;
  if (event.key === "Escape") {
    event.preventDefault();
    void toggleFullscreen();
  }
  if (event.key !== "Tab") return;
  const buttons = [
    ...(playerElement.value?.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    ) ?? []),
  ].filter((button) => button.getClientRects().length);
  const first = buttons[0],
    last = buttons[buttons.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

async function minimizePlayer() {
  if (document.fullscreenElement === playerElement.value) {
    try {
      await document.exitFullscreen();
    } catch {
      return;
    }
  }
  emit("minimize");
}

function syncFullscreenState() {
  isFullscreen.value = document.fullscreenElement === playerElement.value;
}

function beginWorkout(paused = false) {
  totalElapsedMilliseconds.value = 0;
  lastTotalTickAt = 0;
  startCountdown.value = 3;
  isStarting.value = true;
  isPaused.value = paused;
  if (!paused) runCountdown();
  savePlayback();
}

onMounted(() => {
  isUnmounted = false;
  ringFrame = window.requestAnimationFrame(drawRing);
  void syncWakeLock();
  document.addEventListener("fullscreenchange", syncFullscreenState);
  document.addEventListener("visibilitychange", checkpointWhenHidden);
  document.addEventListener("visibilitychange", syncWakeLock);
  window.addEventListener("pagehide", checkpointAtExit);
  window.addEventListener("pageshow", resumeAfterBackground);
  window.addEventListener("focus", resumeAfterBackground);
  if (!segments.value.length) return completeWorkoutSession();
  if (restorePlayback()) {
    applySegmentReset();
    if (pausedForBackground) resumeAfterBackground();
    else if (activeWorkoutSessionRef.value?.isPaused === false)
      setPaused(false, false);
    return;
  }
  beginWorkout(activeWorkoutSessionRef.value?.isPaused === true);
  applySegmentReset();
});
onBeforeUnmount(() => {
  isUnmounted = true;
  if (ringFrame !== undefined) window.cancelAnimationFrame(ringFrame);
  void wakeLock?.release().catch(() => {});
  wakeLock = undefined;
  checkpointAtExit();
  stopTimer();
  stopCountdown();
  workoutPlayerStatusRef.value = null;
  document.removeEventListener("fullscreenchange", syncFullscreenState);
  document.removeEventListener("visibilitychange", checkpointWhenHidden);
  document.removeEventListener("visibilitychange", syncWakeLock);
  window.removeEventListener("pagehide", checkpointAtExit);
  window.removeEventListener("pageshow", resumeAfterBackground);
  window.removeEventListener("focus", resumeAfterBackground);
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
/* Hallmark · component: workout player · theme: existing app
 * pre-emit critique: P4 H5 E4 S5 R5 V4 */
.player-header > div:first-child {
  min-width: 0;
}
.player-header h2,
.player-step-name,
.player-next p {
  overflow-wrap: anywhere;
}
.player-next {
  position: relative;
  display: grid;
  align-items: center;
  min-height: 5.5rem;
  padding: 2rem 1rem 0.75rem;
}
.player-next-label {
  position: absolute;
  top: 0.75rem;
  inset-inline: 1rem;
}
.player-ring {
  container-type: inline-size;
}
.player-ring > p:first-of-type {
  font-size: clamp(3rem, 23cqw, 9rem);
}
.player-ring:has(.player-cadence) > p:first-of-type {
  font-size: clamp(2.5rem, 20cqw, 7rem);
}
.workout-player:fullscreen {
  width: 100%;
  height: 100%;
  max-width: none;
  overflow-y: auto;
  border: 0;
  border-radius: 0;
  background: var(--color-base-100);
}
.workout-player:fullscreen .player-body {
  width: 100%;
  min-width: 0;
  min-height: 100%;
  box-sizing: border-box;
}
@media (min-width: 1024px) {
  .player-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 20rem);
    grid-template-rows: auto auto minmax(0, 1fr);
    gap: 1rem 1.5rem;
    padding: 1.5rem;
  }
  .player-header,
  .player-progress {
    grid-column: 1 / -1;
  }
  .player-stage {
    min-height: 0;
    padding: 1.25rem;
    gap: 0.5rem;
  }
  .player-step-name {
    font-size: clamp(1.5rem, 2.5vw, 2.25rem);
  }
  .player-ring {
    width: min(100%, clamp(15rem, calc(100dvh - 17rem), 34rem));
    margin-top: 0.5rem;
  }
  .player-sidebar {
    justify-content: center;
    min-width: 0;
  }
  .player-actions {
    grid-template-columns: 1fr;
  }
  .player-actions .btn {
    min-height: 3rem;
  }
  .workout-player:fullscreen .player-body {
    max-width: none;
    margin: 0;
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
  }
  .workout-player:fullscreen .player-ring {
    width: min(100%, clamp(15rem, calc(100dvh - 15rem), 42rem));
    max-width: none;
  }
}
.player-pause-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-ui-xs);
  padding: var(--space-ui-sm);
  border: 1px solid var(--color-ui-rule);
  border-radius: var(--radius-box);
  background: var(--color-base-200);
  font-weight: 600;
}
.player-pause {
  grid-column: 1 / -1;
  grid-row: 1;
  min-height: 3.5rem;
  font-size: 1rem;
}
.player-sidebar {
  flex-direction: column-reverse;
}
.workout-player--paused .player-stage {
  outline: 2px solid var(--color-ui-rule);
  outline-offset: -2px;
}
@media (min-width: 64rem) {
  .workout-player--paused .player-body {
    grid-template-rows: auto auto auto minmax(0, 1fr);
  }
  .player-pause-status {
    grid-column: 1 / -1;
  }
  .player-sidebar {
    flex-direction: column-reverse;
    justify-content: center;
  }
  .player-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .player-actions .player-pause {
    min-height: 3.5rem;
  }
}
/* Focused counter: one screen, essential information and controls. */
.workout-player--focus {
  position: fixed;
  inset: 0;
  z-index: 100;
  width: 100%;
  height: 100dvh;
  max-width: none;
  border: 0;
  border-radius: 0;
  overflow: hidden;
  background: var(--color-base-100);
}
.workout-player--focus .player-body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: var(--space-ui-md);
  gap: var(--space-ui-sm);
}
.workout-player--focus .player-header,
.workout-player--focus .player-progress,
.workout-player--focus .player-pause-status,
.workout-player--focus .player-sidebar {
  display: none;
}
.player-focus-top {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
}
.workout-player--focus .player-stage {
  flex: 1;
  min-height: 0;
  padding: 0;
  background: var(--color-base-100);
  outline: 0;
  border-radius: 0;
}
.workout-player--focus .player-step-name {
  font-size: clamp(1.25rem, 3vw, 2.5rem);
}
.workout-player--focus .player-ring {
  width: min(85vw, calc(100dvh - 15rem));
  max-width: none;
  margin-top: var(--space-ui-xs);
}
.player-focus-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  gap: var(--space-ui-sm);
  padding-bottom: env(safe-area-inset-bottom);
}
.player-focus-next {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.workout-player--focus .player-focus-pause {
  min-height: 3.5rem;
  width: min(100%, 20rem);
  font-size: 1rem;
}
@media (orientation: landscape) and (max-height: 32rem) {
  .workout-player--focus .player-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(12rem, 18rem);
    grid-template-rows: auto minmax(0, 1fr);
    gap: var(--space-ui-xs) var(--space-ui-lg);
  }
  .player-focus-top {
    grid-column: 2;
    grid-row: 1;
  }
  .workout-player--focus .player-stage {
    grid-column: 1;
    grid-row: 1 / span 2;
  }
  .workout-player--focus .player-ring {
    width: min(100%, calc(100dvh - 6rem));
  }
  .player-focus-controls {
    grid-column: 2;
    grid-row: 2;
    align-self: center;
    min-width: 0;
  }
  .player-focus-next {
    width: 100%;
  }
}
@media (max-width: 63.9375rem) and (orientation: portrait) {
  .workout-player--focus .player-stage { gap: var(--space-ui-md); }
  .workout-player--focus .player-stage > p { flex: 0 0 auto; }
  .workout-player--focus .player-step-name { margin: 0; font-size: 1.25rem; }
  .workout-player--focus .player-ring {
    width: min(calc(100vw - 2 * var(--space-ui-md)), calc(100dvh - 16rem));
    margin-top: 0;
  }
}
</style>
