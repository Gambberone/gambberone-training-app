<template>
  <GttModal
    v-model="isOpen"
    full
    :title="modalTitle"
    :actions="stepActions"
    :close-on-action="false"
    :before-close="requestClose"
    :go-back="Boolean(currentWorkoutCreatorStep)"
    @action="handleAction"
    @go-back="requestGoBack"
    enable-full-screen
  >
    <WorkoutCreator />
  </GttModal>
  <GttModal
    v-model="isDiscardStepConfirmationOpen"
    title="Modifiche non salvate"
    :actions="[
      { id: 'keep-editing', label: 'Continua' },
      { id: 'discard', label: 'Abbandona', color: 'error' },
    ]"
    @action="handleDiscardStepConfirmation"
  >
    <p class="text-md">Vuoi tornare alla lista degli step senza salvare le modifiche?</p>
  </GttModal>
  <GttModal
    v-model="isDiscardConfirmationOpen"
    title="Modifiche non salvate"
    :actions="[
      { id: 'keep-editing', label: 'Continua' },
      { id: 'discard', label: 'Abbandona', color: 'error' },
    ]"
    @action="handleDiscardConfirmation"
  >
    <p class="text-md">Hai modifiche non salvate. Vuoi davvero chiudere il workout creator?</p>
  </GttModal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import GttModal from '@/components/generic/GttModal.vue';
import WorkoutCreator from '@/components/workouts/WorkoutCreator.vue';
import {
  createWorkoutCreatorStep,
  createWorkout,
  currentWorkoutCreatorStep,
  editingWorkoutCreatorStepIndex,
  isCurrentWorkoutCreatorStepValid,
  isCreatingWorkoutCreatorStep,
  loadWorkoutCreator,
  resetWorkoutCreator,
  removeWorkoutCreatorStep,
  returnToWorkoutCreatorOverview,
  type Workout,
  updateWorkout,
  workoutCreatorDraft,
} from '@/stores/workoutCreator';
import { getExerciseStepNode, selectedExerciseNode } from '@/wavebinder/exerciseStep';
import { useWaveBinderNode } from '@/composables/useWaveBinderNode';
import { showToast } from '@/composables/toast';

const isOpen = defineModel<boolean>({ default: false });
const props = defineProps<{
  workout?: Workout;
}>();
const isExerciseStepValid = useWaveBinderNode<boolean | null>(getExerciseStepNode('isStepValid'));
const router = useRouter();
const resetDelayMs = 250;
let resetTimeout: ReturnType<typeof setTimeout> | undefined;
const isDiscardConfirmationOpen = ref(false);
const isDiscardStepConfirmationOpen = ref(false);
let initialCreatorState: string | undefined;
let initialStepState: string | undefined;

const creatorState = () =>
  JSON.stringify({
    draft: workoutCreatorDraft.value,
    currentStep: currentWorkoutCreatorStep.value,
    isCreatingStep: isCreatingWorkoutCreatorStep.value,
  });

const hasUnsavedChanges = () =>
  initialCreatorState !== undefined && creatorState() !== initialCreatorState;

const currentStepState = () => {
  const step = currentWorkoutCreatorStep.value;
  return JSON.stringify({
    step,
    ...(step?.type === 'EXERCISE'
      ? {
          exercise: {
            selectedMuscleGroupId: getExerciseStepNode('selectedMuscleGroupId').getNodeValue(),
            selectedExerciseId: selectedExerciseNode().getNodeValue()?.id,
            mode: getExerciseStepNode('exerciseMode').getNodeValue(),
            value: getExerciseStepNode('exerciseValue').getNodeValue(),
            sets: getExerciseStepNode('sets').getNodeValue(),
            hasSetPause: getExerciseStepNode('hasSetPause').getNodeValue(),
            pauseDuration: getExerciseStepNode('pauseBetweenSetsDuration').getNodeValue(),
          },
        }
      : {}),
  });
};

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
    initialCreatorState = creatorState();
  }

  if (wasOpen && !open) {
    resetAfterClose();
  }
});

watch(currentWorkoutCreatorStep, (step) => {
  initialStepState = step ? currentStepState() : undefined;
});

const requestClose = () => {
  if (!hasUnsavedChanges()) return true;

  isDiscardConfirmationOpen.value = true;
  return false;
};

const handleDiscardConfirmation = (actionId: string) => {
  if (actionId === 'discard') isOpen.value = false;
};

const requestGoBack = () => {
  if (initialStepState === currentStepState()) {
    returnToWorkoutCreatorOverview();
    return;
  }
  isDiscardStepConfirmationOpen.value = true;
};

const handleDiscardStepConfirmation = (actionId: string) => {
  if (actionId === 'discard') returnToWorkoutCreatorOverview();
};

onBeforeUnmount(() => {
  cancelScheduledReset();
});

const modalTitle = computed(
  () =>
    currentWorkoutCreatorStep.value?.type ??
    (props.workout ? 'Modifica workout' : 'Workout creator'),
);
const stepActions = computed(() => {
  if (currentWorkoutCreatorStep.value) {
    const isExerciseStep = currentWorkoutCreatorStep.value.type === 'EXERCISE';
    return [
      ...(editingWorkoutCreatorStepIndex.value === undefined
        ? []
        : [{ id: 'delete-step', label: 'Elimina step', color: 'error' as const }]),
      {
        id: 'create-step',
        label: editingWorkoutCreatorStepIndex.value === undefined ? 'Crea step' : 'Salva step',
        color: 'primary',
        disabled:
          !isCurrentWorkoutCreatorStepValid() || (isExerciseStep && !isExerciseStepValid.value),
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
  if (actionId === 'delete-step') removeWorkoutCreatorStep();
  if (actionId === 'save-workout') {
    if (props.workout) {
      updateWorkout(props.workout.id);
    } else {
      const workout = createWorkout();
      if (workout) {
        showToast({
          title: 'Workout creato con successo!',
          message: 'Vuoi programmarlo nel calendario?',
          actions: [
            { label: 'Non ora', color: 'secondary' },
            { label: 'Programma', color: 'primary', onClick: () => goToCalendar(workout.id) },
          ],
        });
      }
    }
    isOpen.value = false;
  }
};

const goToCalendar = (workoutId: string) => {
  router.push({ name: 'calendar', query: { workout: workoutId } });
};
</script>
