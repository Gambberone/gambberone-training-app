<template>
  <WorkoutCreatorFirstStep v-if="isCreatingWorkoutCreatorStep || currentWorkoutCreatorStep" />
  <section v-else class="flex flex-col items-center gap-6">
    <GttInputField id="workout_name" :label="tr('ui.workout_name')" compact v-model="workoutName" />
    <p v-if="workoutCreatorDraft.steps.length" class="text-sm text-base-content/65">
      {{ tr('messages.estimatedDuration', { duration: estimatedDurationLabel }) }}
    </p>
    <ol class="workout-stepper">
      <li
        v-for="step in visibleSteps"
        :key="step.index"
        class="workout-stepper-item cursor-pointer transition hover:brightness-95"
        :class="stepColorClass(step.type)"
        role="button"
        tabindex="0"
        @click="editStep(step.index)"
        @keydown.enter="editStep(step.index)"
        @keydown.space.prevent="editStep(step.index)"
      >
        <Flame v-if="step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP" :size="20" />
        <Dumbbell v-else-if="step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE" :size="20" />
        <Pause v-else-if="step.type === WORKOUT_CREATOR_STEP_ACTION.PAUSE" :size="20" />
        <LineSquiggle v-else-if="step.type === WORKOUT_CREATOR_STEP_ACTION.STRETCHING" :size="20" />
        <span>{{ stepLabel(step.type) }}</span>
      </li>
      <li class="flex w-full max-w-md justify-center gap-3">
        <GttButton shape="square" mode="outline" color="error"
          v-if="!hasWarmup"
          
          type="button"
          :aria-label="tr('ui.add_warm_up')"
          :title="tr('ui.add_warm_up')"
          @click="addStep(WORKOUT_CREATOR_STEP_ACTION.WARMUP)"
        >
          <Flame :size="28" />
        </GttButton>
        <GttButton shape="square" mode="outline" color="info"
          
          type="button"
          :aria-label="tr('ui.add_exercise')"
          :title="tr('ui.add_exercise')"
          @click="addStep(WORKOUT_CREATOR_STEP_ACTION.EXERCISE)"
        >
          <Dumbbell :size="28" />
        </GttButton>
        <GttButton shape="square" mode="outline" color="primary"
          
          type="button"
          :aria-label="tr('ui.add_rest')"
          :title="tr('ui.add_rest')"
          @click="addStep(WORKOUT_CREATOR_STEP_ACTION.PAUSE)"
        >
          <Pause :size="28" />
        </GttButton>
        <GttButton shape="square" mode="outline" color="warning"
          
          type="button"
          :aria-label="tr('ui.add_stretching')"
          :title="tr('ui.add_stretching')"
          @click="addStep(WORKOUT_CREATOR_STEP_ACTION.STRETCHING)"
        >
          <LineSquiggle :size="28" />
        </GttButton>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import GttInputField from '@/components/generic/form/GttInputField.vue';
import { WORKOUT_CREATOR_STEP_ACTION, type WorkoutCreatorStepAction } from '@/constants';
import { tr } from '@/localization';
import {
  currentWorkoutCreatorStep,
  editWorkoutCreatorStep,
  isCreatingWorkoutCreatorStep,
  startWorkoutCreatorStep,
  workoutCreatorDraft,
} from '@/stores/workoutCreator';
import { estimateWorkoutDuration } from '@/wavebinder/duration';
import { Dumbbell, Flame, LineSquiggle, Pause } from '@lucide/vue';
import { computed } from 'vue';
import WorkoutCreatorFirstStep from './creator/WorkoutCreatorFirstStep.vue';

const estimatedDurationLabel = computed(() => {
  const seconds = estimateWorkoutDuration(workoutCreatorDraft.value.steps);
  return seconds > 0 ? `~${Math.ceil(seconds / 60)} min` : tr('ui.untimed');
});

const hasWarmup = computed(() =>
  workoutCreatorDraft.value.steps.some((step) => step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP),
);

const workoutName = computed({
  get: () => workoutCreatorDraft.value.name,
  set: (name: string) => {
    workoutCreatorDraft.value.name = name;
  },
});

const visibleSteps = computed(() =>
  workoutCreatorDraft.value.steps
    .map((step, index) => ({ ...step, index }))
    .filter((step) => step.type !== WORKOUT_CREATOR_STEP_ACTION.SETPAUSE),
);

const addStep = (type: WorkoutCreatorStepAction) => {
  startWorkoutCreatorStep(type);
};

const editStep = (index: number) => {
  editWorkoutCreatorStep(index);
};

const stepLabel = (type: WorkoutCreatorStepAction) =>
  ({
    WARMUP: 'Warm-up',
    EXERCISE: tr('ui.exercise'),
    PAUSE: tr('ui.rest'),
    STRETCHING: 'Stretching',
    SETPAUSE: tr('ui.rest_between_sets'),
  })[type];

const stepColorClass = (type: WorkoutCreatorStepAction) =>
  ({
    WARMUP: 'border-error bg-error/10 text-error',
    EXERCISE: 'border-info bg-info/10 text-info',
    PAUSE: 'border-primary bg-primary/10 text-primary',
    STRETCHING: 'border-warning bg-warning/10 text-warning',
    SETPAUSE: 'border-primary bg-primary/10 text-primary',
  })[type];
</script>
