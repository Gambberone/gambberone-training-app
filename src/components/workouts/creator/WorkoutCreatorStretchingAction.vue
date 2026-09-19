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
    <button class="btn" type="button" @click="addStretchingExercise">Aggiungi esercizio</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WorkoutCreatorStretchingExercise from './stretching/WorkoutCreatorStretchingExercise.vue';
import {
  currentWorkoutCreatorStep,
} from '../../../stores/workoutCreator';
import { createStretchingExercise } from '../../../stores/workoutCreator.ts';

const stretchingExercises = computed(() => currentWorkoutCreatorStep.value?.stretchingExercises ?? []);

const addStretchingExercise = () => {
  currentWorkoutCreatorStep.value?.stretchingExercises?.push(createStretchingExercise());
};

const removeStretchingExercise = (index: number) => {
  currentWorkoutCreatorStep.value?.stretchingExercises?.splice(index, 1);
};
</script>
