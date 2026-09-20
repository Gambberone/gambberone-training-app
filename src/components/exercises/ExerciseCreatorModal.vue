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
      label="Macrogruppo"
      :options="muscleGroups"
      placeholder="Seleziona un macrogruppo"
      value-key="name"
      required
      :error="muscleGroupError"
    />
    <GttInputField
      v-model="exerciseName"
      label="Nome esercizio"
      id="exercise_name"
      required
      :error="exerciseNameError"
      placeholder="Es. Curl con manubri"
    />
  </GttModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { muscleGroups, type Exercise, type MuscleGroupType } from '@/domain/exercises.ts';
import { exercisesRef } from '@/stores/exercises';
import GttInputField from '@/components/generic/form/GttInputField.vue';
import GttSelectField from '@/components/generic/form/GttSelectField.vue';
import GttModal from '@/components/generic/GttModal.vue';

interface ExerciseCreatorEditorProps {
  exercise: Exercise | null;
}

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
    ? [{ id: 'save', label: 'Salva', color: 'primary' }]
    : [{ id: 'create', label: 'Crea', color: 'primary' }];
});

const modalTitle = computed(() => (props.exercise ? 'Modifica esercizio' : 'Crea esercizio'));

const handleAction = (actionId: string) => {
  if (actionId !== 'create' && actionId !== 'save') {
    return;
  }

  const name = exerciseName.value.trim();
  const muscleGroupId = selectedMuscleGroup.value;

  exerciseNameError.value = name ? undefined : "Il nome dell'esercizio è obbligatorio.";
  muscleGroupError.value = muscleGroupId ? undefined : 'Il macrogruppo è obbligatorio.';

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
