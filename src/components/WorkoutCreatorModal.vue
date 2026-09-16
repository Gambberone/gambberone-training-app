<template>
  <GttModal
    v-model="isOpen"
    full
    :title="modalTitle"
    :actions="stepActions"
    :close-on-action="false"
    @action="handleAction"
  >
    <WorkoutCreator />
  </GttModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import GttModal from './generic/GttModal.vue';
import WorkoutCreator from './workouts/WorkoutCreator.vue';
import {
  createWorkoutCreatorStep,
  createWorkout,
  currentWorkoutCreatorStep,
  resetWorkoutCreator,
  workoutCreatorDraft,
} from '../stores/workoutCreator';

const isOpen = defineModel<boolean>({ default: false });

watch(isOpen, (open, wasOpen) => {
  if (wasOpen && !open) {
    resetWorkoutCreator();
  }
});

const modalTitle = computed(() => currentWorkoutCreatorStep.value?.type ?? 'Workout creator');
const stepActions = computed(() => {
  if (currentWorkoutCreatorStep.value) {
    return [{ id: 'create-step', label: 'Crea step', color: 'primary' }];
  }

  return workoutCreatorDraft.value.steps.length > 0 && workoutCreatorDraft.value.name.trim()
    ? [{ id: 'create-workout', label: 'Crea workout', color: 'primary' }]
    : [];
});

const handleAction = (actionId: string) => {
  if (actionId === 'create-step') createWorkoutCreatorStep();
  if (actionId === 'create-workout') {
    createWorkout();
    isOpen.value = false;
  }
};
</script>
