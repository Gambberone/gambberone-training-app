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

const exerciseName = ref('');
const exerciseNameError = ref<string | undefined>(undefined);
const selectedMuscleGroup = ref<MuscleGroupType | undefined>(undefined);
const muscleGroupError = ref<string | undefined>(undefined);

watch(isOpen, () => {
  if (isOpen) {
    exerciseNameError.value = undefined;
    muscleGroupError.value = undefined;
    if (props.exercise) {
      selectedMuscleGroup.value = props.exercise.muscleGroupId;
      exerciseName.value = props.exercise.name;
    } else {
      exerciseName.value = '';
      selectedMuscleGroup.value = undefined;
    }
  }
});

watch(exerciseName, (name) => {
  if (name.trim()) {
    exerciseNameError.value = undefined;
  }
});

watch(selectedMuscleGroup, (muscleGroupId) => {
  if (muscleGroupId) {
    muscleGroupError.value = undefined;
  }
});

const modalActions = computed(() => {
  return props.exercise
    ? [{ id: 'save', label: tr('ui.save'), color: 'primary' }]
    : [{ id: 'create', label: tr('ui.create'), color: 'primary' }];
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

  exerciseNameError.value = name ? undefined : tr('ui.exercise_name_is_required');
  muscleGroupError.value = muscleGroupId ? undefined : tr('ui.muscle_group_is_required');

  if (!name || !muscleGroupId) {
    return;
  }

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
