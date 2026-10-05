<template>
  <GttModal
    v-model="isOpen"
    :title="modalTitle"
    :actions="modalActions"
    :close-on-action="false"
    @action="handleAction"
  >
    <GttSelectField
      v-model="selectedMuscleGroup"
      id="exercise_muscle_group"
      :label="tr('ui.muscle_group')"
      :options="localizedMuscleGroups"
      :placeholder="tr('ui.select_a_muscle_group')"
      value-key="name"
      required
      :error="muscleGroupError"
    />
    <GttInputField
      v-model="exerciseName"
      :label="tr('ui.exercise_name')"
      id="exercise_name"
      required
      :error="exerciseNameError"
      :placeholder="tr('ui.e_g_dumbbell_curl')"
    />
  </GttModal>
</template>

<script setup lang="ts">
import GttInputField from '@/components/generic/form/GttInputField.vue';
import GttSelectField from '@/components/generic/form/GttSelectField.vue';
import { muscleGroups, type Exercise, type MuscleGroupType } from '@/domain/exercises.ts';
import { tr } from '@/localization';
import { useWaveBinderNode, useWaveBinderValue } from '@/composables/useWaveBinderNode';
import type { ExerciseEditorErrors } from '@/domain/exerciseValidation';
import { wb } from '@/wavebinder';
import type { SingleNode } from 'wave-binder';
import { exercisesRef } from '@/stores/exercises';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface ExerciseCreatorEditorProps {
  exercise: Exercise | null;
}

const { t } = useI18n();
const localizedMuscleGroups = computed(() =>
  muscleGroups.map(({ id }) => ({ id, name: t(`muscleGroups.${id}`) })),
);
const isOpen = defineModel<boolean>({ default: false });
const props = defineProps<ExerciseCreatorEditorProps>();

const exerciseName = useWaveBinderNode<string>(wb.getNodeByName('catalogExerciseName') as SingleNode);
const muscleGroup = useWaveBinderNode<MuscleGroupType | null>(
  wb.getNodeByName('catalogExerciseMuscleGroup') as SingleNode,
);
const selectedMuscleGroup = computed({
  get: () => muscleGroup.value ?? undefined,
  set: (value: MuscleGroupType | undefined) => { muscleGroup.value = value ?? null; },
});
const errors = useWaveBinderValue<ExerciseEditorErrors | null>(
  wb.getNodeByName('catalogExerciseErrors') as SingleNode,
);
const canSave = useWaveBinderValue<boolean>(wb.getNodeByName('catalogExerciseCanSave') as SingleNode);
const showErrors = ref(false);
let initializing = false;
const exerciseNameError = computed(() => showErrors.value && errors.value?.name ? tr(errors.value.name) : undefined);
const muscleGroupError = computed(() => showErrors.value && errors.value?.muscleGroup ? tr(errors.value.muscleGroup) : undefined);

watch(isOpen, (open) => {
  if (!open) return;
  initializing = true;
  showErrors.value = false;
  exerciseName.value = props.exercise?.name ?? '';
  selectedMuscleGroup.value = props.exercise?.muscleGroupId;
  initializing = false;
}, { immediate: true, flush: 'sync' });
watch([exerciseName, selectedMuscleGroup], () => {
  if (!initializing && isOpen.value) showErrors.value = true;
}, { flush: 'sync' });

const modalActions = computed(() => {
  return props.exercise
    ? [{ id: 'save', label: tr('ui.save'), color: 'primary', disabled: !canSave.value }]
    : [{ id: 'create', label: tr('ui.create'), color: 'primary', disabled: !canSave.value }];
});

const modalTitle = computed(() =>
  props.exercise ? tr('ui.edit_exercise') : tr('ui.create_exercise'),
);

const handleAction = (actionId: string) => {
  if (actionId !== 'create' && actionId !== 'save') {
    return;
  }

  const name = exerciseName.value.trim();
  const muscleGroupId = selectedMuscleGroup.value;

  showErrors.value = true;
  if (!canSave.value || !muscleGroupId) return;

  if (actionId === 'create') {
    const exercise: Exercise = {
      id: crypto.randomUUID(),
      name,
      muscleGroupId,
    };

    exercisesRef.value.push(exercise);
  } else if (actionId === 'save' && props.exercise) {
    exercisesRef.value = exercisesRef.value.map((exercise) =>
      exercise.id === props.exercise?.id ? { ...exercise, name, muscleGroupId } : exercise,
    );
  } else {
    return;
  }

  exerciseName.value = '';
  selectedMuscleGroup.value = undefined;
  isOpen.value = false;
};
</script>
