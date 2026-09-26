<template>
  <div class="flex flex-col gap-5">
    <GttSelectField
      id="exercise_muscle_group"
      v-model="selectedMuscleGroupId"
      :options="trainingMuscleGroups"
      :label="tr('ui.muscle_group')"
      :placeholder="tr('ui.choose_a_muscle_group')"
      required
      compact
    />
    <GttSelectField
      id="exercise"
      v-model="selectedExerciseId"
      :options="localizedExercises(availableExercises ?? [])"
      :label="tr('ui.exercise')"
      value-key="name"
      :placeholder="tr('ui.choose_an_exercise')"
      :disabled="!selectedMuscleGroupId"
      required
      compact
    />
    <div class="flex flex-col gap-1">
      <WorkoutCreatorDurationRepetitionField
        id="exercise_value"
        v-model="exerciseValue"
        :label="isRepetitions ? tr('ui.repetitions') : tr('ui.duration_seconds')"
      />
      <label class="label">
        {{ tr('ui.timed') }}
        <input v-model="isRepetitions" type="checkbox" class="toggle toggle-sm toggle-neutral" />
        {{ tr('ui.repetitions') }}
      </label>
    </div>
    <WorkoutCreatorDurationRepetitionField
      v-if="isRepetitions"
      id="exercise_repetition_interval"
      v-model="repetitionInterval"
      :label="tr('ui.seconds_per_repetition')"
    />
    <WorkoutCreatorDurationRepetitionField id="exercise_sets" v-model="sets" :label="tr('ui.sets')" />
    <div class="flex flex-col gap-1">
      <label class="label">
        {{ tr('ui.rest_between_sets') }}
        <input
          v-model="hasSetPause"
          type="checkbox"
          class="toggle toggle-sm toggle-neutral"
          :disabled="!isPauseAvailable"
        />
      </label>
      <WorkoutCreatorDurationRepetitionField
        v-if="hasSetPause && isPauseAvailable"
        id="exercise_set_pause"
        v-model="pauseBetweenSetsDuration"
        :label="tr('ui.rest_duration_seconds')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { tr, localizedExercises } from '@/localization';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWaveBinderMultiNode, useWaveBinderNode } from '@/composables/useWaveBinderNode';
import { muscleGroups, type Exercise } from '@/domain/exercises';
import { DEFAULT_REPETITION_INTERVAL_SECONDS } from '@/constants';
import { getExerciseStepNode, selectedExerciseNode } from '@/wavebinder/exerciseStep';
import GttSelectField from '@/components/generic/form/GttSelectField.vue';
import WorkoutCreatorDurationRepetitionField from './WorkoutCreatorDurationRepetitionField.vue';

const selectedMuscleGroupIdNode = useWaveBinderNode<string | null>(
  getExerciseStepNode('selectedMuscleGroupId'),
);
const { selectedId: selectedExerciseId, choices: availableExercises } =
  useWaveBinderMultiNode<Exercise>(selectedExerciseNode());
const mode = useWaveBinderNode<'duration' | 'repetitions'>(getExerciseStepNode('exerciseMode'));
const exerciseValueNumber = useWaveBinderNode<number>(getExerciseStepNode('exerciseValue'));
const repetitionIntervalNumber = useWaveBinderNode<number>(getExerciseStepNode('repetitionIntervalSeconds'));
const setsNumber = useWaveBinderNode<number>(getExerciseStepNode('sets'));
const hasSetPause = useWaveBinderNode<boolean>(getExerciseStepNode('hasSetPause'));
const pauseDurationNumber = useWaveBinderNode<number>(
  getExerciseStepNode('pauseBetweenSetsDuration'),
);
const isPauseAvailable = useWaveBinderNode<boolean>(getExerciseStepNode('isPauseAvailable'));

const { t } = useI18n();
const trainingMuscleGroups = computed(() => muscleGroups
  .filter(({ id }) => id !== 'WARMUP' && id !== tr('ui.stretching'))
  .map(({ id }) => ({ id, label: t(`muscleGroups.${id}`) })));
const selectedMuscleGroupId = computed<string | undefined>({
  get: () => selectedMuscleGroupIdNode.value ?? undefined,
  set: (value) => {
    selectedMuscleGroupIdNode.value = value ?? null;
  },
});
const isRepetitions = computed({
  get: () => mode.value === 'repetitions',
  set: (value: boolean) => {
    mode.value = value ? 'repetitions' : 'duration';
  },
});
const exerciseValue = computed({
  get: () => String(exerciseValueNumber.value ?? 0),
  set: (value: string) => {
    exerciseValueNumber.value = Math.max(0, Number(value));
  },
});
const repetitionInterval = computed({
  get: () => String(repetitionIntervalNumber.value ?? DEFAULT_REPETITION_INTERVAL_SECONDS),
  set: (value: string) => {
    repetitionIntervalNumber.value = Number(value);
  },
});
const sets = computed({
  get: () => String(setsNumber.value ?? 1),
  set: (value: string) => {
    setsNumber.value = Math.max(1, Number(value));
  },
});
const pauseBetweenSetsDuration = computed({
  get: () => String(pauseDurationNumber.value ?? 0),
  set: (value: string) => {
    pauseDurationNumber.value = Math.max(0, Number(value));
  },
});
watch(isPauseAvailable, (available) => {
  if (!available) hasSetPause.value = false;
});
</script>
