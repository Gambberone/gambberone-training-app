<template>
  <div class="flex flex-col gap-5">
    <GttSelectField
      id="exercise"
      v-model="selectedExerciseId"
      :options="availableExercises"
      label="Esercizio"
      value-key="name"
      required
    />

    <div class="flex flex-col gap-1">
      <WorkoutCreatorDurationRepetitionField
        id="exercise_value"
        v-model="exerciseValue"
        :label="isRepetitions ? 'Ripetizioni' : 'Durata (secondi)'"
      />
      <label class="label">
        A tempo
        <input v-model="isRepetitions" type="checkbox" class="toggle toggle-sm toggle-neutral" />
        Ripetizioni
      </label>
    </div>

    <WorkoutCreatorDurationRepetitionField id="exercise_sets" v-model="sets" label="Set" />

    <div class="flex flex-col gap-1">
      <label class="label">
        Pausa tra set
        <input
          v-model="hasSetPause"
          type="checkbox"
          class="toggle toggle-sm toggle-neutral"
          :disabled="Number(sets) < 2"
        />
      </label>
      <WorkoutCreatorDurationRepetitionField
        v-if="hasSetPause"
        id="exercise_set_pause"
        v-model="pauseBetweenSetsDuration"
        label="Durata pausa (secondi)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { WORKOUT_CREATOR_STEP_ACTION } from '../../../constants/workout.ts';
import type { Exercise } from '../../../domain/exercises.ts';
import { exercisesRef } from '../../../stores/exercises.ts';
import {
  currentWorkoutCreatorStep,
  updateCurrentWorkoutCreatorStep,
} from '../../../stores/workoutCreator.ts';
import GttSelectField from '../../generic/form/GttSelectField.vue';
import WorkoutCreatorDurationRepetitionField from './WorkoutCreatorDurationRepetitionField.vue';

const availableExercises = computed(() =>
  exercisesRef.value.filter(
    (exercise: Exercise) =>
      exercise.muscleGroupId !== WORKOUT_CREATOR_STEP_ACTION.WARMUP &&
      exercise.muscleGroupId !== WORKOUT_CREATOR_STEP_ACTION.STRETCHING,
  ),
);

const selectedExerciseId = computed({
  get: () => currentWorkoutCreatorStep.value?.exerciseId,
  set: (exerciseId: string | undefined) => updateCurrentWorkoutCreatorStep({ exerciseId }),
});

const isRepetitions = computed({
  get: () => currentWorkoutCreatorStep.value?.exerciseModeType === 'repetitions',
  set: (isRepetitions: boolean) => {
    const step = currentWorkoutCreatorStep.value;
    if (!step) return;

    const value = isRepetitions ? step.exerciseDuration : step.exerciseRepetitions;
    updateCurrentWorkoutCreatorStep({
      exerciseModeType: isRepetitions ? 'repetitions' : 'duration',
      ...(isRepetitions ? { exerciseRepetitions: value ?? 0 } : { exerciseDuration: value ?? 0 }),
    });
  },
});

const exerciseValue = computed({
  get: () => {
    const step = currentWorkoutCreatorStep.value;
    return String(isRepetitions.value ? step?.exerciseRepetitions ?? 0 : step?.exerciseDuration ?? 0);
  },
  set: (value: string) => {
    const numericValue = Number(value);
    updateCurrentWorkoutCreatorStep(
      isRepetitions.value ? { exerciseRepetitions: numericValue } : { exerciseDuration: numericValue },
    );
  },
});

const sets = computed({
  get: () => String(currentWorkoutCreatorStep.value?.sets ?? 1),
  set: (value: string) => updateCurrentWorkoutCreatorStep({ sets: Math.max(1, Number(value)) }),
});

const hasSetPause = computed({
  get: () => currentWorkoutCreatorStep.value?.hasSetPause ?? false,
  set: (hasSetPause: boolean) => updateCurrentWorkoutCreatorStep({ hasSetPause }),
});

const pauseBetweenSetsDuration = computed({
  get: () => String(currentWorkoutCreatorStep.value?.pauseBetweenSetsDuration ?? 0),
  set: (value: string) =>
    updateCurrentWorkoutCreatorStep({ pauseBetweenSetsDuration: Number(value) }),
});
</script>
