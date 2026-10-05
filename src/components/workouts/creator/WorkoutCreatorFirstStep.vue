<template>
  <div v-if="!currentWorkoutCreatorStep" class="flex flex-col gap-4 font-mono">
    <GttInputField id="workout_name" :label="tr('ui.workout_name')" compact v-model="workoutName" />
    <Transition name="creator-reveal">
      <div v-if="workoutName.trim()" class="flex origin-center flex-col gap-4">
        <div class="card w-full shadow-md">
          <div class="card-body text-center text-xl font-semibold text-primary">
            {{ tr('ui.choose_how_to_start_your_workout') }}
          </div>
        </div>
        <div class="grid w-full grid-cols-1 gap-3">
          <GttButton
            class="flex h-auto min-h-20 w-full flex-col gap-2 py-4 text-xl text-error"
            type="button"
            @click="selectStep(WORKOUT_CREATOR_STEP_ACTION.WARMUP)"
          >
            <Flame :size="50" /> {{ tr('ui.warm_up') }}
          </GttButton>
          <GttButton
            class="flex h-auto min-h-20 w-full flex-col gap-2 py-4 text-xl text-warning"
            type="button"
            @click="selectStep(WORKOUT_CREATOR_STEP_ACTION.STRETCHING)"
          >
            <LineSquiggle :size="50" /> {{ tr('ui.stretching') }}
          </GttButton>
          <GttButton
            class="flex h-auto min-h-20 w-full flex-col gap-2 py-4 text-xl text-info"
            type="button"
            @click="selectStep(WORKOUT_CREATOR_STEP_ACTION.EXERCISE)"
          >
            <Dumbbell :size="50" /> {{ tr('ui.exercise') }}
          </GttButton>
          <GttButton
            class="flex h-auto min-h-20 w-full flex-col gap-2 py-4 text-xl text-primary"
            type="button"
            @click="selectStep(WORKOUT_CREATOR_STEP_ACTION.PAUSE)"
          >
            <Pause :size="50" /> {{ tr('ui.rest') }}
          </GttButton>
        </div>
      </div>
    </Transition>
  </div>
  <div v-if="currentWorkoutCreatorStep">
    <WorkoutCreatorWarmupAction
      v-if="currentWorkoutCreatorStep.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP"
    />
    <WorkoutCreatorStretchingAction
      v-if="currentWorkoutCreatorStep.type === WORKOUT_CREATOR_STEP_ACTION.STRETCHING"
    />
    <WorkoutCreatorExerciseAction
      v-if="currentWorkoutCreatorStep.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE"
    />
    <WorkoutCreatorPauseAction
      v-if="currentWorkoutCreatorStep.type === WORKOUT_CREATOR_STEP_ACTION.PAUSE"
    />
  </div>
</template>

<script setup lang="ts">
import GttInputField from '@/components/generic/form/GttInputField.vue';
import { WORKOUT_CREATOR_STEP_ACTION, type WorkoutCreatorStepAction } from '@/constants';
import { tr } from '@/localization';
import {
  currentWorkoutCreatorStep,
  startWorkoutCreatorStep,
  workoutCreatorDraft,
} from '@/stores/workoutCreator';
import { Dumbbell, Flame, LineSquiggle, Pause } from '@lucide/vue';
import { computed } from 'vue';
import WorkoutCreatorExerciseAction from './WorkoutCreatorExerciseAction.vue';
import WorkoutCreatorPauseAction from './WorkoutCreatorPauseAction.vue';
import WorkoutCreatorStretchingAction from './WorkoutCreatorStretchingAction.vue';
import WorkoutCreatorWarmupAction from './warmup/WorkoutCreatorWarmupAction.vue';

const workoutName = computed({
  get: () => workoutCreatorDraft.value.name,
  set: (name: string) => {
    workoutCreatorDraft.value.name = name;
  },
});

const selectStep = (action: WorkoutCreatorStepAction) => {
  startWorkoutCreatorStep(action);
};
</script>

<style scoped>
.creator-reveal-enter-active,
.creator-reveal-leave-active {
  transition:
    transform var(--dur-ui-short) var(--ease-ui-out),
    opacity var(--dur-ui-short) var(--ease-ui-out);
}

.creator-reveal-enter-from,
.creator-reveal-leave-to {
  transform: translateY(0.25rem);
  opacity: 0;
}

.creator-reveal-enter-to,
.creator-reveal-leave-from {
  transform: translateY(0);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .creator-reveal-enter-active,
  .creator-reveal-leave-active {
    transition: none;
  }
}
</style>
