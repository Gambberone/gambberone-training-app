<template>
  <GttSelectField
    :options="warmupExercises"
    label="Warmup exercise"
    :id="`warmup_exercise_${warmupExercise.id}`"
    value-key="name"
    required
    v-model="selectedExerciseId"
  />

  <div class="flex flex-col gap-1">
    <WorkoutCreatorDurationRepetitionField
      :id="`warmup_value_${warmupExercise.id}`"
      v-model="warmupValue"
      :label="isRepetitions ? 'Ripetizioni' : 'Durata (secondi)'"
    />
    <label class="label">
      A tempo
      <input v-model="isRepetitions" type="checkbox" class="toggle toggle-sm toggle-neutral" />
      Ripetizioni
    </label>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { WORKOUT_CREATOR_STEP_ACTION } from '@/constants/workout.ts';
import type { WarmupExercise } from '@/constants/workout.ts';
import type { Exercise } from '@/domain/exercises.ts';
import { exercisesRef } from '@/stores/exercises.ts';
import GttSelectField from '@/components/generic/form/GttSelectField.vue';
import WorkoutCreatorDurationRepetitionField from '@/components/workouts/creator/WorkoutCreatorDurationRepetitionField.vue';

const warmupExercise = defineModel<WarmupExercise>({ required: true });

const warmupExercises = computed(() => {
  return exercisesRef.value.filter(
    (exercise: Exercise) => exercise.muscleGroupId === WORKOUT_CREATOR_STEP_ACTION.WARMUP,
  );
});

const selectedExerciseId = computed({
  get: () => warmupExercise.value.exerciseId,
  set: (exerciseId) => {
    warmupExercise.value = { ...warmupExercise.value, exerciseId };
  },
});

const isRepetitions = computed({
  get: () => warmupExercise.value.modeType === 'repetitions',
  set: (isRepetitions) => {
    const currentValue = isRepetitions
      ? warmupExercise.value.duration
      : warmupExercise.value.repetitions;

    warmupExercise.value = {
      ...warmupExercise.value,
      modeType: isRepetitions ? 'repetitions' : 'duration',
      ...(isRepetitions ? { repetitions: currentValue } : { duration: currentValue }),
    };
  },
});

const warmupValue = computed({
  get: () =>
    String(isRepetitions.value ? warmupExercise.value.repetitions : warmupExercise.value.duration),
  set: (value: string) => {
    const numericValue = Number(value);
    warmupExercise.value = isRepetitions.value
      ? { ...warmupExercise.value, repetitions: numericValue }
      : { ...warmupExercise.value, duration: numericValue };
  },
});
</script>
