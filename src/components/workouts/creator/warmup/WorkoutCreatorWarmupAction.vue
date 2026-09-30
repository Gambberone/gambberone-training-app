<template>
  <div class="flex flex-col gap-5">
    <div v-for="(warmupExercise, warmupExerciseIndex) in warmupExercises" :key="warmupExercise.id">
      <WorkoutCreatorWarmupExercise v-model="warmupExercises[warmupExerciseIndex]" />
    </div>
    <GttButton  type="button" @click="addWarmupExercise">
      {{ tr('ui.add_exercise') }}
    </GttButton>
  </div>
</template>

<script setup lang="ts">
import { tr } from '@/localization';
import { createWarmupExercise, currentWorkoutCreatorStep } from '@/stores/workoutCreator.ts';
import { computed } from 'vue';
import WorkoutCreatorWarmupExercise from './WorkoutCreatorWarmupExercise.vue';

const warmupExercises = computed(() => currentWorkoutCreatorStep.value?.warmupExercises ?? []);

const addWarmupExercise = () => {
  currentWorkoutCreatorStep.value?.warmupExercises?.push(createWarmupExercise());
};
</script>
