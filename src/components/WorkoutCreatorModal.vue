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
import { getExerciseStepNode } from '../wavebinder/exerciseStep';
import { useWaveBinderNode } from '../composables/useWaveBinderNode';

const isOpen = defineModel<boolean>({ default: false });
const isExerciseStepValid = useWaveBinderNode<boolean | null>(getExerciseStepNode('isStepValid'));

watch(isOpen, (open, wasOpen) => {
  if (wasOpen && !open) {
    resetWorkoutCreator();
  }
});

const modalTitle = computed(() => currentWorkoutCreatorStep.value?.type ?? 'Workout creator');
const stepActions = computed(() => {
  if (currentWorkoutCreatorStep.value) {
    const isExerciseStep = currentWorkoutCreatorStep.value.type === 'EXERCISE';
    return [
      {
        id: 'create-step',
        label: 'Crea step',
        color: 'primary',
        disabled: isExerciseStep && !isExerciseStepValid.value,
      },
    ];
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
