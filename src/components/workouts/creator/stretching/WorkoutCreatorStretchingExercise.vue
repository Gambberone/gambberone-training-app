<template>
  <div class="flex items-end gap-2">
    <GttSelectField
      :id="`stretching_exercise_${stretchingExercise.id}`"
      v-model="selectedExerciseId"
      :options="stretchingExercises"
      label="Esercizio stretching"
      value-key="name"
      required
    />
    <button
      v-if="props.showRemove"
      class="btn btn-square btn-ghost btn-error mb-1"
      type="button"
      aria-label="Elimina esercizio stretching"
      title="Elimina esercizio"
      @click="emit('remove')"
    >
      <Trash2 class="size-5" aria-hidden="true" />
    </button>
  </div>

  <WorkoutCreatorDurationRepetitionField
    :id="`stretching_duration_${stretchingExercise.id}`"
    v-model="stretchingDuration"
    label="Durata (secondi)"
  />
</template>

<script setup lang="ts">
import { Trash2 } from '@lucide/vue';
import { computed } from 'vue';
import { WORKOUT_CREATOR_STEP_ACTION, type StretchingExercise } from '../../../../constants/workout.ts';
import type { Exercise } from '../../../../domain/exercises.ts';
import { exercisesRef } from '../../../../stores/exercises.ts';
import GttSelectField from '../../../generic/form/GttSelectField.vue';
import WorkoutCreatorDurationRepetitionField from '../WorkoutCreatorDurationRepetitionField.vue';

const stretchingExercise = defineModel<StretchingExercise>({ required: true });
const props = withDefaults(defineProps<{ showRemove?: boolean }>(), { showRemove: false });
const emit = defineEmits<{ remove: [] }>();

const stretchingExercises = computed(() =>
  exercisesRef.value.filter(
    (exercise: Exercise) => exercise.muscleGroupId === WORKOUT_CREATOR_STEP_ACTION.STRETCHING,
  ),
);

const selectedExerciseId = computed({
  get: () => stretchingExercise.value.exerciseId,
  set: (exerciseId) => {
    stretchingExercise.value = { ...stretchingExercise.value, exerciseId };
  },
});

const stretchingDuration = computed({
  get: () => String(stretchingExercise.value.duration),
  set: (value: string) => {
    stretchingExercise.value = { ...stretchingExercise.value, duration: Number(value) };
  },
});
</script>
