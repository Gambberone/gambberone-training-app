<template>
  <GttNumberStepper v-if="desktop" id="desktop-pause-duration" v-model="pauseDuration" :large-step="10" :label="tr('ui.rest_duration_seconds')" compact />
  <WorkoutCreatorDurationRepetitionField v-else
    id="pause_duration"
    v-model="pauseDuration"
    :label="tr('ui.rest_duration_seconds')"
  />
</template>

<script setup lang="ts">
import { tr } from '@/localization';
import { computed } from 'vue';
import GttNumberStepper from '@/components/generic/form/GttNumberStepper.vue';
defineProps<{ desktop?: boolean }>();
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
