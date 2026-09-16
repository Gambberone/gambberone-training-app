<template>
  <div v-if="!currentWorkoutCreatorStep" class="flex flex-col font-mono">
    <div class="card shadow-md w-full flex-1">
      <div class="card-body text-xl text-center text-primary font-semibold">
        SELEZIONA CON COSA INIZIARE IL TUO WORKOUT
      </div>
    </div>
    <div class="w-full flex-0 grid grid-cols-1 grid-rows-4 items-center gap-3">
      <GttInputField id="workout_name" label="Nome workout" compact v-model="workoutName" />
      <button
        class="flex-1 btn flex flex-col h-full w-full gap-2 text-xl py-4"
        :class="{ 'text-error': workoutName }"
        @click="selectStep(WORKOUT_CREATOR_STEP_ACTION.WARMUP)"
        v-if="!currentWorkoutCreatorStep"
        :disabled="!workoutName"
      >
        <Flame :size="50" /> WARM-UP
      </button>
      <button
        class="flex-1 btn flex flex-col h-full w-full gap-2 text-xl py-4"
        :class="{ 'text-warning': workoutName }"
        @click="selectStep(WORKOUT_CREATOR_STEP_ACTION.STRETCHING)"
        v-if="!currentWorkoutCreatorStep"
        :disabled="!workoutName"
      >
        <LineSquiggle :size="50" /> STRETCHING
      </button>
      <button
        class="flex-1 btn flex flex-col h-full w-full gap-2 text-xl py-4"
        :class="{ 'text-info': workoutName }"
        @click="selectStep(WORKOUT_CREATOR_STEP_ACTION.EXERCISE)"
        v-if="!currentWorkoutCreatorStep"
        :disabled="!workoutName"
      >
        <Dumbbell :size="50" /> ESERCIZIO
      </button>
      <button
        class="flex-1 btn flex flex-col h-full w-full gap-2 text-xl py-4"
        :class="{ 'text-primary': workoutName }"
        @click="selectStep(WORKOUT_CREATOR_STEP_ACTION.PAUSE)"
        v-if="!currentWorkoutCreatorStep"
        :disabled="!workoutName"
      >
        <Pause :size="50" /> PAUSA
      </button>
    </div>
  </div>
  <div v-if="currentWorkoutCreatorStep">
    <WorkoutCreatorWarmupAction
      v-if="currentWorkoutCreatorStep.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP"
    />
    <WorkoutCreatorStretchingAction
      v-if="currentWorkoutCreatorStep.type === WORKOUT_CREATOR_STEP_ACTION.STRETCHING"
    />
    <WorkoutCreatorExerciseAction
      v-if="currentWorkoutCreatorStep.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE"
    />
    <WorkoutCreatorPauseAction
      v-if="currentWorkoutCreatorStep.type === WORKOUT_CREATOR_STEP_ACTION.PAUSE"
    />
  </div>
</template>

<script setup lang="ts">
import { Dumbbell, Flame, LineSquiggle, Pause } from '@lucide/vue';
import { WORKOUT_CREATOR_STEP_ACTION, type WorkoutCreatorStepAction } from '../../../constants';
import WorkoutCreatorStretchingAction from './WorkoutCreatorStretchingAction.vue';
import WorkoutCreatorExerciseAction from './WorkoutCreatorExerciseAction.vue';
import WorkoutCreatorPauseAction from './WorkoutCreatorPauseAction.vue';
import WorkoutCreatorWarmupAction from './warmup/WorkoutCreatorWarmupAction.vue';
import {
  currentWorkoutCreatorStep,
  startWorkoutCreatorStep,
  workoutCreatorDraft,
} from '../../../stores/workoutCreator';
import GttInputField from '../../generic/form/GttInputField.vue';
import { computed } from 'vue';

const workoutName = computed({
  get: () => workoutCreatorDraft.value.name,
  set: (name: string) => {
    workoutCreatorDraft.value.name = name;
  },
});

const selectStep = (action: WorkoutCreatorStepAction) => {
  startWorkoutCreatorStep(action);
};
</script>
