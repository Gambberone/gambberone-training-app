<template>
  <WorkoutCreatorFirstStep v-if="isCreatingWorkoutCreatorStep || currentWorkoutCreatorStep" />
  <section v-else class="flex flex-col items-center gap-6">
    <ol class="workout-stepper">
      <li
        v-for="step in visibleSteps"
        :key="step.step"
        class="workout-stepper-item"
        :class="stepColorClass(step.type)"
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
import { WORKOUT_CREATOR_STEP_ACTION, type WorkoutCreatorStepAction } from '../../constants';
import {
  currentWorkoutCreatorStep,
  isCreatingWorkoutCreatorStep,
  startWorkoutCreatorStep,
  workoutCreatorDraft,
} from '../../stores/workoutCreator';

const hasWarmup = computed(() =>
  workoutCreatorDraft.value.steps.some((step) => step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP),
);

const visibleSteps = computed(() =>
  workoutCreatorDraft.value.steps.filter(
    (step) => step.type !== WORKOUT_CREATOR_STEP_ACTION.SETPAUSE,
  ),
);

const addStep = (type: WorkoutCreatorStepAction) => {
  startWorkoutCreatorStep(type);
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
