<template>
  <div class="flex flex-col gap-5">
    <div v-for="(warmupExercise, warmupExerciseIndex) in warmupExercises" :key="warmupExercise.id">
      <WorkoutCreatorWarmupExercise v-model="warmupExercises[warmupExerciseIndex]" />
    </div>
    <button class="btn" type="button" @click="addWarmupExercise">{{ tr('ui.add_exercise') }}</button>
  </div>
</template>

<script setup lang="ts">
import { tr } from '@/localization';
import { computed } from 'vue';
import WorkoutCreatorWarmupExercise from './WorkoutCreatorWarmupExercise.vue';
import {
  createWarmupExercise,
  currentWorkoutCreatorStep,
} from '@/stores/workoutCreator.ts';

const warmupExercises = computed(() => currentWorkoutCreatorStep.value?.warmupExercises ?? []);

const addWarmupExercise = () => {
  currentWorkoutCreatorStep.value?.warmupExercises?.push(createWarmupExercise());
};
</script>
