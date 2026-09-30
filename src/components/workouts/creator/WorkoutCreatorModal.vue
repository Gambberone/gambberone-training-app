<template>
  <GttModal
    v-model="isOpen"
    full
    :title="modalTitle"
    :actions="[]"
    :content-class="
      isDesktop ? 'max-w-6xl!' : 'w-screen! h-dvh! max-w-none! max-h-none! rounded-none! p-4!'
    "
    :close-on-action="false"
    :before-close="requestClose"
    :go-back="!isDesktop && Boolean(currentWorkoutCreatorStep)"
    @action="handleAction"
    @go-back="requestGoBack"
    :enable-full-screen="isDesktop"
  >
    <WorkoutCreatorDesktop
      :exercise-errors="exerciseValidationErrors ?? []"
      @save="handleAction('save-workout')"
      @cancel-step="requestGoBack"
    />
  </GttModal>
  <GttModal
    v-model="isDiscardStepConfirmationOpen"
    :title="tr('ui.unsaved_changes')"
    :actions="[
      { id: 'keep-editing', label: tr('ui.continue') },
      { id: 'discard', label: tr('ui.abandon'), color: 'error' },
    ]"
    @action="handleDiscardStepConfirmation"
  >
    <p class="text-md">{{ tr('ui.return_to_the_step_list_without_saving_your_changes') }}</p>
  </GttModal>
  <GttModal
    v-model="isDiscardConfirmationOpen"
    :title="tr('ui.unsaved_changes')"
    :actions="[
      { id: 'keep-editing', label: tr('ui.continue') },
      { id: 'discard', label: tr('ui.abandon'), color: 'error' },
    ]"
    @action="handleDiscardConfirmation"
  >
    <p class="text-md">{{ tr('ui.you_have_unsaved_changes_close_the_workout_editor') }}</p>
  </GttModal>
</template>

<script setup lang="ts">
import { showToast } from '@/composables/toast';
import { useExerciseStepValidation } from '@/composables/useExerciseStepValidation';
import { tr } from '@/localization';
import {
  createWorkout,
  currentWorkoutCreatorStep,
  loadWorkoutCreator,
  resetWorkoutCreator,
  returnToWorkoutCreatorOverview,
  updateWorkout,
  workoutCreatorDraft,
  type Workout,
} from '@/stores/workoutCreator';
import { getExerciseStepNode, selectedExerciseNode } from '@/wavebinder/exerciseStep';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import WorkoutCreatorDesktop from './WorkoutCreatorDesktop.vue';

const desktopMedia = window.matchMedia('(min-width: 1024px)');
const isDesktop = ref(desktopMedia.matches);
const updateDesktop = () => {
  isDesktop.value = desktopMedia.matches;
};
desktopMedia.addEventListener('change', updateDesktop);
onBeforeUnmount(() => desktopMedia.removeEventListener('change', updateDesktop));

const isOpen = defineModel<boolean>({ default: false });
const props = defineProps<{
  workout?: Workout;
}>();
const exerciseValidationErrors = useExerciseStepValidation();
const router = useRouter();
const resetDelayMs = 250;
let resetTimeout: ReturnType<typeof setTimeout> | undefined;
const isDiscardConfirmationOpen = ref(false);
const isDiscardStepConfirmationOpen = ref(false);
let initialDraftState: string | undefined;
let initialStepState: string | undefined;

const hasUnsavedChanges = () =>
  initialDraftState !== undefined &&
  (JSON.stringify(workoutCreatorDraft.value) !== initialDraftState ||
    Boolean(currentWorkoutCreatorStep.value && currentStepState() !== initialStepState));

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
    initialDraftState = JSON.stringify(workoutCreatorDraft.value);
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
    (!isDesktop.value && currentWorkoutCreatorStep.value
      ? tr(`stepTypes.${currentWorkoutCreatorStep.value.type}`)
      : undefined) ?? (props.workout ? tr('ui.edit_workout') : tr('ui.workout_editor')),
);
const handleAction = (actionId: string) => {
  if (actionId === 'save-workout') {
    if (props.workout) {
      updateWorkout(props.workout.id);
    } else {
      const workout = createWorkout();
      if (workout) {
        showToast({
          title: tr('ui.workout_created_successfully'),
          message: tr('ui.schedule_it_in_the_calendar'),
          actions: [
            { label: tr('ui.not_now'), color: 'secondary' },
            { label: tr('ui.schedule'), color: 'primary', onClick: () => goToCalendar(workout.id) },
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
