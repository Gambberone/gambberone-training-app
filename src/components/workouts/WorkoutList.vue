<template>
  <ul v-if="workoutsRef.length" class="list bg-base-100">
    <li v-for="workout in workoutsRef" :key="workout.id" class="list-row flex items-center gap-2">
      <button class="flex min-w-0 flex-1 items-center gap-3 text-left" type="button" @click="openWorkout(workout)">
        <Dumbbell class="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div class="min-w-0">
          <div class="truncate">{{ workout.name }}</div>
          <div class="text-xs font-semibold uppercase opacity-60">
            {{ visibleStepCount(workout) }} step
          </div>
        </div>
      </button>
      <button
        class="btn btn-square btn-ghost btn-sm text-error"
        type="button"
        :aria-label="`Elimina ${workout.name}`"
        @click="askToRemoveWorkout(workout)"
      >
        <Trash2 class="size-5" aria-hidden="true" />
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
  <GttModal
    v-model="isWorkoutEliminationModalOpen"
    title="Eliminazione workout"
    :actions="[
      { id: 'cancel', label: 'Annulla' },
      { id: 'delete', label: 'Elimina', color: 'error' },
    ]"
    @action="handleWorkoutElimination"
  >
    <p class="text-md">
      Vuoi eliminare <strong>{{ workoutToRemove?.name }}</strong>? Verranno rimosse anche le programmazioni nel calendario.
    </p>
  </GttModal>
  <GttFab @click="showWorkoutCreatorModal = true" />
</template>

<script setup lang="ts">
import { Dumbbell, Flame, LineSquiggle, Pause, Trash2 } from '@lucide/vue';
import { ref } from 'vue';
import {
  WORKOUT_CREATOR_STEP_ACTION,
  type WorkoutCreatorStep,
  type WorkoutCreatorStepAction,
} from '../../constants';
import { exercisesRef } from '../../stores/exercises.ts';
import { removeWorkout, type Workout, workoutsRef } from '../../stores/workoutCreator.ts';
import GttModal from '../generic/GttModal.vue';
import GttFab from '../generic/GttFab.vue';
import WorkoutCreatorModal from '../WorkoutCreatorModal.vue';

const showWorkoutCreatorModal = ref(false);
const isWorkoutDetailModalOpen = ref(false);
const selectedWorkout = ref<Workout>();
const isWorkoutEliminationModalOpen = ref(false);
const workoutToRemove = ref<Workout>();

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

const askToRemoveWorkout = (workout: Workout) => {
  workoutToRemove.value = workout;
  isWorkoutEliminationModalOpen.value = true;
};

const handleWorkoutElimination = (actionId: string) => {
  if (actionId === 'delete' && workoutToRemove.value) {
    removeWorkout(workoutToRemove.value.id);
  }
  workoutToRemove.value = undefined;
};
</script>
