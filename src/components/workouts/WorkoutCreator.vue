<template>
  <WorkoutCreatorFirstStep v-if="isCreatingWorkoutCreatorStep || currentWorkoutCreatorStep" />
  <section v-else class="flex flex-col items-center gap-6">
    <GttInputField id="workout_name" label="Nome workout" compact v-model="workoutName" />
    <p v-if="workoutCreatorDraft.steps.length" class="text-sm text-base-content/65">
      Durata stimata: {{ estimatedDurationLabel }}
    </p>
    <ol class="workout-stepper">
      <li
        v-for="step in visibleSteps"
        :key="step.index"
        class="workout-stepper-item cursor-pointer transition hover:brightness-95"
        :class="stepColorClass(step.type)"
        role="button"
        tabindex="0"
        @click="editStep(step.index)"
        @keydown.enter="editStep(step.index)"
        @keydown.space.prevent="editStep(step.index)"
      >
        <Flame v-if="step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP" :size="20" />
        <Dumbbell v-else-if="step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE" :size="20" />
        <Pause v-else-if="step.type === WORKOUT_CREATOR_STEP_ACTION.PAUSE" :size="20" />
        <LineSquiggle v-else-if="step.type === WORKOUT_CREATOR_STEP_ACTION.STRETCHING" :size="20" />
        <span>{{ stepLabel(step.type) }}</span>
      </li>
      <li class="flex w-full max-w-md justify-center gap-3">
        <button
          v-if="!hasWarmup"
          class="btn btn-square btn-outline btn-error"
          type="button"
          aria-label="Aggiungi warm-up"
          title="Aggiungi warm-up"
          @click="addStep(WORKOUT_CREATOR_STEP_ACTION.WARMUP)"
        >
          <Flame :size="28" />
        </button>
        <button
          class="btn btn-square btn-outline btn-info"
          type="button"
          aria-label="Aggiungi esercizio"
          title="Aggiungi esercizio"
          @click="addStep(WORKOUT_CREATOR_STEP_ACTION.EXERCISE)"
        >
          <Dumbbell :size="28" />
        </button>
        <button
          class="btn btn-square btn-outline btn-primary"
          type="button"
          aria-label="Aggiungi pausa"
          title="Aggiungi pausa"
          @click="addStep(WORKOUT_CREATOR_STEP_ACTION.PAUSE)"
        >
          <Pause :size="28" />
        </button>
        <button
          class="btn btn-square btn-outline btn-warning"
          type="button"
          aria-label="Aggiungi stretching"
          title="Aggiungi stretching"
          @click="addStep(WORKOUT_CREATOR_STEP_ACTION.STRETCHING)"
        >
          <LineSquiggle :size="28" />
        </button>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Dumbbell, Flame, LineSquiggle, Pause } from '@lucide/vue';
import WorkoutCreatorFirstStep from './creator/WorkoutCreatorFirstStep.vue';
import GttInputField from '@/components/generic/form/GttInputField.vue';
import { WORKOUT_CREATOR_STEP_ACTION, type WorkoutCreatorStepAction } from '@/constants';
import {
  currentWorkoutCreatorStep,
  editWorkoutCreatorStep,
  isCreatingWorkoutCreatorStep,
  startWorkoutCreatorStep,
  workoutCreatorDraft,
} from '@/stores/workoutCreator';
import { estimateWorkoutDuration } from '@/wavebinder/duration';

const estimatedDurationLabel = computed(() => {
  const seconds = estimateWorkoutDuration(workoutCreatorDraft.value.steps);
  return seconds > 0 ? `~${Math.ceil(seconds / 60)} min` : 'durata libera';
});

const hasWarmup = computed(() =>
  workoutCreatorDraft.value.steps.some((step) => step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP),
);

const workoutName = computed({
  get: () => workoutCreatorDraft.value.name,
  set: (name: string) => {
    workoutCreatorDraft.value.name = name;
  },
});

const visibleSteps = computed(() =>
  workoutCreatorDraft.value.steps
    .map((step, index) => ({ ...step, index }))
    .filter((step) => step.type !== WORKOUT_CREATOR_STEP_ACTION.SETPAUSE),
);

const addStep = (type: WorkoutCreatorStepAction) => {
  startWorkoutCreatorStep(type);
};

const editStep = (index: number) => {
  editWorkoutCreatorStep(index);
};

const stepLabel = (type: WorkoutCreatorStepAction) =>
  ({
    WARMUP: 'Warm-up',
    EXERCISE: 'Esercizio',
    PAUSE: 'Pausa',
    STRETCHING: 'Stretching',
    SETPAUSE: 'Pausa tra serie',
  })[type];

const stepColorClass = (type: WorkoutCreatorStepAction) =>
  ({
    WARMUP: 'border-error bg-error/10 text-error',
    EXERCISE: 'border-info bg-info/10 text-info',
    PAUSE: 'border-primary bg-primary/10 text-primary',
    STRETCHING: 'border-warning bg-warning/10 text-warning',
    SETPAUSE: 'border-primary bg-primary/10 text-primary',
  })[type];
</script>
