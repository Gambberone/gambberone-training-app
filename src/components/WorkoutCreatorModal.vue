<template>
  <GttModal
    v-model="isOpen"
    full
    :title="modalTitle"
    :actions="stepActions"
    :close-on-action="false"
    @action="handleAction"
    enable-full-screen
  >
    <WorkoutCreator />
  </GttModal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import GttModal from './generic/GttModal.vue';
import WorkoutCreator from './workouts/WorkoutCreator.vue';
import {
  createWorkoutCreatorStep,
  createWorkout,
  currentWorkoutCreatorStep,
  loadWorkoutCreator,
  resetWorkoutCreator,
  type Workout,
  updateWorkout,
  workoutCreatorDraft,
} from '../stores/workoutCreator';
import { getExerciseStepNode } from '../wavebinder/exerciseStep';
import { useWaveBinderNode } from '../composables/useWaveBinderNode';

const isOpen = defineModel<boolean>({ default: false });
const props = defineProps<{
  workout?: Workout;
}>();
const isExerciseStepValid = useWaveBinderNode<boolean | null>(getExerciseStepNode('isStepValid'));
const resetDelayMs = 250;
let resetTimeout: ReturnType<typeof setTimeout> | undefined;

const cancelScheduledReset = () => {
  if (resetTimeout === undefined) return;
  clearTimeout(resetTimeout);
  resetTimeout = undefined;
};

const resetAfterClose = () => {
  cancelScheduledReset();
  resetTimeout = setTimeout(() => {
    resetWorkoutCreator();
    resetTimeout = undefined;
  }, resetDelayMs);
};

watch(isOpen, (open, wasOpen) => {
  if (open && !wasOpen) {
    cancelScheduledReset();
    if (props.workout) {
      loadWorkoutCreator(props.workout);
    } else {
      resetWorkoutCreator();
    }
  }

  if (wasOpen && !open) {
    resetAfterClose();
  }
});

onBeforeUnmount(cancelScheduledReset);

const modalTitle = computed(
  () =>
    currentWorkoutCreatorStep.value?.type ??
    (props.workout ? 'Modifica workout' : 'Workout creator'),
);
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
    ? [
        {
          id: 'save-workout',
          label: props.workout ? 'Salva workout' : 'Crea workout',
          color: 'primary',
        },
      ]
    : [];
});

const handleAction = (actionId: string) => {
  if (actionId === 'create-step') createWorkoutCreatorStep();
  if (actionId === 'save-workout') {
    if (props.workout) {
      updateWorkout(props.workout.id);
    } else {
      createWorkout();
    }
    isOpen.value = false;
  }
};
</script>
