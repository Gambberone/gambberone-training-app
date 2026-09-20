<template>
  <WorkoutCreatorDurationRepetitionField
    id="pause_duration"
    v-model="pauseDuration"
    label="Durata pausa (secondi)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  currentWorkoutCreatorStep,
  updateCurrentWorkoutCreatorStep,
} from '@/stores/workoutCreator.ts';
import WorkoutCreatorDurationRepetitionField from './WorkoutCreatorDurationRepetitionField.vue';

const pauseDuration = computed({
  get: () => String(currentWorkoutCreatorStep.value?.pauseDuration ?? 0),
  set: (value: string) => updateCurrentWorkoutCreatorStep({ pauseDuration: Number(value) }),
});
</script>
