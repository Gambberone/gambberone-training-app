<template>
  <div class="flex flex-col gap-5">
    <div
      v-for="(stretchingExercise, stretchingExerciseIndex) in stretchingExercises"
      :key="stretchingExercise.id"
    >
      <WorkoutCreatorStretchingExercise
        v-model="stretchingExercises[stretchingExerciseIndex]"
        :show-remove="stretchingExercises.length > 1"
        @remove="removeStretchingExercise(stretchingExerciseIndex)"
      />
    </div>
    <GttButton  type="button" @click="addStretchingExercise">
      {{ tr('ui.add_exercise') }}
    </GttButton>
  </div>
</template>

<script setup lang="ts">
import { tr } from '@/localization';
import { currentWorkoutCreatorStep } from '@/stores/workoutCreator';
import { createStretchingExercise } from '@/stores/workoutCreator.ts';
import { computed } from 'vue';
import WorkoutCreatorStretchingExercise from './stretching/WorkoutCreatorStretchingExercise.vue';

const stretchingExercises = computed(
  () => currentWorkoutCreatorStep.value?.stretchingExercises ?? [],
);

const addStretchingExercise = () => {
  currentWorkoutCreatorStep.value?.stretchingExercises?.push(createStretchingExercise());
};

const removeStretchingExercise = (index: number) => {
  currentWorkoutCreatorStep.value?.stretchingExercises?.splice(index, 1);
};
</script>
