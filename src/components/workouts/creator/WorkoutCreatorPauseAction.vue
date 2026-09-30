<template>
  <GttNumberStepper
    v-if="desktop"
    id="desktop-pause-duration"
    v-model="pauseDuration"
    :large-step="10"
    :label="tr('ui.rest_duration_seconds')"
    compact
  />
  <WorkoutCreatorDurationRepetitionField
    v-else
    id="pause_duration"
    v-model="pauseDuration"
    :label="tr('ui.rest_duration_seconds')"
  />
</template>

<script setup lang="ts">
import GttNumberStepper from '@/components/generic/form/GttNumberStepper.vue';
import { tr } from '@/localization';
import {
  currentWorkoutCreatorStep,
  updateCurrentWorkoutCreatorStep,
} from '@/stores/workoutCreator.ts';
import { computed } from 'vue';
import WorkoutCreatorDurationRepetitionField from './WorkoutCreatorDurationRepetitionField.vue';

defineProps<{ desktop?: boolean }>();

const pauseDuration = computed({
  get: () => String(currentWorkoutCreatorStep.value?.pauseDuration ?? 0),
  set: (value: string) => updateCurrentWorkoutCreatorStep({ pauseDuration: Number(value) }),
});
</script>
