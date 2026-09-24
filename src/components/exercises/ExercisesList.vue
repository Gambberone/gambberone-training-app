<template>
  <div class="grid gap-3 md:grid-cols-2">
    <article
      v-for="{ muscleGroup, cardClass, textClass, badgeClass } in exerciseCards"
      :key="muscleGroup.id"
      class="card card-border overflow-hidden bg-base-100 shadow-sm"
      :class="cardClass"
    >
      <div
        class="collapse collapse-arrow"
        :class="{ 'collapse-open': expandedMuscleGroupId === muscleGroup.id }"
      >
        <button
          type="button"
          class="collapse-title flex w-full items-center justify-between gap-3 text-left font-semibold"
          :class="textClass"
          :aria-expanded="expandedMuscleGroupId === muscleGroup.id"
          @click="toggleMuscleGroup(muscleGroup.id)"
        >
          <span>{{ muscleGroup.name }}</span>
          <span class="badge mr-5" :class="badgeClass">{{
            exercisesForMuscleGroup(muscleGroup.id).length
          }}</span>
        </button>
        <div class="collapse-content px-0 pb-0">
          <ul class="list bg-base-100">
            <li
              v-for="exercise in exercisesForMuscleGroup(muscleGroup.id)"
              :key="exercise.id"
              class="list-row flex items-center"
            >
              <div class="flex flex-1 gap-3">
                <Dumbbell class="size-5 text-primary" aria-hidden="true" />
                <div>{{ exercise.name }}</div>
              </div>
              <div class="flex-0 flex">
                <button
                  class="btn btn-square btn-ghost btn-sm text-primary"
                  type="button"
                  :aria-label="`Modifica ${exercise.name}`"
                  @click.stop="editExercise(exercise)"
                >
                  <Pencil class="size-5" aria-hidden="true" />
                </button>
                <button
                  class="btn btn-square btn-ghost btn-sm text-error"
                  type="button"
                  :aria-label="`Elimina ${exercise.name}`"
                  @click.stop="removeExercise(exercise)"
                >
                  <Trash class="size-5" aria-hidden="true" />
                </button>
              </div>
            </li>
            <li
              v-if="exercisesForMuscleGroup(muscleGroup.id).length === 0"
              class="px-4 py-3 text-sm text-base-content/60"
            >
              Nessun esercizio per questo macrogruppo.
            </li>
          </ul>
        </div>
      </div>
    </article>
  </div>
  <GttBottomAction label="Aggiungi esercizio" @click="isExercisesCreatorEditorModalOpen = true" />
  <ExerciseCreatorModal
    v-model="isExercisesCreatorEditorModalOpen"
    :exercise="selectedExerciseForEdit"
    @update:model-value="onExerciseCreatorEditorModalUpdate"
  />
  <GttModal
    v-model="showExerciseEliminationModal"
    :actions="[
      { id: 'cancel', label: 'Annulla' },
      { id: 'delete', label: 'Elimina', color: 'error' },
    ]"
    title="Eliminazione esercizio"
    @action="eliminationModalActionHandler"
  >
    <p class="text-md">
      {{ `Sei sicuro di voler eliminare l'esercizio ${selectedExerciseForElimination?.name}` }}
    </p>
  </GttModal>
</template>

<script setup lang="ts">
import { Dumbbell, Pencil, Trash } from '@lucide/vue';
import { ref } from 'vue';
import {
  MUSCLE_GROUPS,
  muscleGroups,
  type Exercise,
  type MuscleGroup,
} from '@/domain/exercises.ts';
import { exercisesRef } from '@/stores/exercises.ts';
import GttBottomAction from '@/components/generic/GttBottomAction.vue';
import GttModal from '@/components/generic/GttModal.vue';
import ExerciseCreatorModal from './ExerciseCreatorModal.vue';

const isExercisesCreatorEditorModalOpen = ref(false);
const expandedMuscleGroupId = ref<MuscleGroup['id'] | null>(null);

function toggleMuscleGroup(muscleGroupId: MuscleGroup['id']) {
  expandedMuscleGroupId.value =
    expandedMuscleGroupId.value === muscleGroupId ? null : muscleGroupId;
}

const exerciseSections = [
  {
    title: 'Stretching',
    groups: muscleGroups.filter(({ id }) => id === MUSCLE_GROUPS.STRETCHING),
    cardClass: 'border-warning bg-warning/10',
    textClass: 'text-warning',
    badgeClass: 'badge-warning',
  },
  {
    title: 'Warm-up',
    groups: muscleGroups.filter(({ id }) => id === MUSCLE_GROUPS.WARMUP),
    cardClass: 'border-error bg-error/10',
    textClass: 'text-error',
    badgeClass: 'badge-error',
  },
  {
    title: 'Exercises',
    groups: muscleGroups.filter(
      ({ id }) => id !== MUSCLE_GROUPS.STRETCHING && id !== MUSCLE_GROUPS.WARMUP,
    ),
    cardClass: 'border-info bg-info/10',
    textClass: 'text-info',
    badgeClass: 'badge-info',
  },
];

const exerciseCards = exerciseSections.flatMap(({ groups, cardClass, textClass, badgeClass }) =>
  groups.map((muscleGroup) => ({ muscleGroup, cardClass, textClass, badgeClass })),
);

function exercisesForMuscleGroup(muscleGroupId: MuscleGroup['id']) {
  return exercisesRef.value.filter((exercise) => exercise.muscleGroupId === muscleGroupId);
}

// Exercise edit handler
const selectedExerciseForEdit = ref<Exercise | null>(null);
const editExercise = (exercise: Exercise) => {
  selectedExerciseForEdit.value = exercise;
  isExercisesCreatorEditorModalOpen.value = true;
};

const onExerciseCreatorEditorModalUpdate = (isOpen: boolean) => {
  isExercisesCreatorEditorModalOpen.value = isOpen;

  if (!isOpen) {
    selectedExerciseForEdit.value = null;
  }
};

// Exercise elimination handler
const selectedExerciseForElimination = ref<Exercise | null>(null);
const showExerciseEliminationModal = ref(false);
const removeExercise = (exercise: Exercise) => {
  selectedExerciseForElimination.value = exercise;
  showExerciseEliminationModal.value = true;
};

const eliminationModalActionHandler = (actionId: string) => {
  if (actionId === 'cancel') {
    setTimeout(() => {
      selectedExerciseForElimination.value = null;
    }, 500);
  } else if (actionId === 'delete') {
    exercisesRef.value = exercisesRef.value.filter(
      (exercise) => exercise.id !== selectedExerciseForElimination.value?.id,
    );
  }
};
</script>
