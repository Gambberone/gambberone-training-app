<template>
  <ul v-if="workoutsRef.length" class="list bg-base-100">
    <li v-for="workout in workoutsRef" :key="workout.id">
      <button class="list-row flex w-full items-center text-left" type="button" @click="openWorkout(workout)">
        <Dumbbell class="size-5 text-primary" aria-hidden="true" />
        <div>
          <div>{{ workout.name }}</div>
          <div class="text-xs font-semibold uppercase opacity-60">
            {{ visibleStepCount(workout) }} step
          </div>
        </div>
      </button>
    </li>
  </ul>
  <p v-else class="py-8 text-center text-base-content/60">Non hai ancora creato workout.</p>

  <WorkoutCreatorModal v-model="showWorkoutCreatorModal" />
  <GttModal v-model="isWorkoutDetailModalOpen" :title="selectedWorkout?.name">
    <ol v-if="selectedWorkout" class="workout-stepper">
      <li
        v-for="(step, stepIndex) in visibleSteps(selectedWorkout)"
        :key="step.step"
        class="workout-stepper-item"
        :class="[
          stepColorClass(step.type),
          { 'workout-stepper-item--connected': stepIndex < visibleSteps(selectedWorkout).length - 1 },
        ]"
      >
        <Flame v-if="step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP" :size="20" />
        <Dumbbell v-else-if="step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE" :size="20" />
        <Pause v-else-if="step.type === WORKOUT_CREATOR_STEP_ACTION.PAUSE" :size="20" />
        <LineSquiggle v-else-if="step.type === WORKOUT_CREATOR_STEP_ACTION.STRETCHING" :size="20" />
        <span>{{ stepLabel(step) }}</span>
      </li>
    </ol>
  </GttModal>
  <GttFab @click="showWorkoutCreatorModal = true" />
</template>

<script setup lang="ts">
import { Dumbbell, Flame, LineSquiggle, Pause } from '@lucide/vue';
import { ref } from 'vue';
import {
  WORKOUT_CREATOR_STEP_ACTION,
  type WorkoutCreatorStep,
  type WorkoutCreatorStepAction,
} from '../../constants';
import { exercisesRef } from '../../stores/exercises.ts';
import { type Workout, workoutsRef } from '../../stores/workoutCreator.ts';
import GttModal from '../generic/GttModal.vue';
import GttFab from '../generic/GttFab.vue';
import WorkoutCreatorModal from '../WorkoutCreatorModal.vue';

const showWorkoutCreatorModal = ref(false);
const isWorkoutDetailModalOpen = ref(false);
const selectedWorkout = ref<Workout>();

const visibleStepCount = (workout: Workout) =>
  visibleSteps(workout).length;

const visibleSteps = (workout: Workout) =>
  workout.steps.filter((step) => step.type !== WORKOUT_CREATOR_STEP_ACTION.SETPAUSE);

const stepLabel = (step: WorkoutCreatorStep) => {
  if (step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE) {
    return exercisesRef.value.find((exercise) => exercise.id === step.exerciseId)?.name ?? 'Esercizio';
  }

  return {
    WARMUP: 'Warm-up',
    PAUSE: 'Pausa',
    STRETCHING: 'Stretching',
    SETPAUSE: 'Pausa tra serie',
  }[step.type];
};

const stepColorClass = (type: WorkoutCreatorStepAction) =>
  ({
    WARMUP: 'border-error bg-error/10 text-error',
    EXERCISE: 'border-info bg-info/10 text-info',
    PAUSE: 'border-primary bg-primary/10 text-primary',
    STRETCHING: 'border-warning bg-warning/10 text-warning',
    SETPAUSE: 'border-primary bg-primary/10 text-primary',
  })[type];

const openWorkout = (workout: Workout) => {
  selectedWorkout.value = workout;
  isWorkoutDetailModalOpen.value = true;
};
</script>
