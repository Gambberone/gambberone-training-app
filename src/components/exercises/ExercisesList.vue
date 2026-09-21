<template>
  <div class="join join-vertical bg-base-100 w-full">
    <div
      class="collapse collapse-arrow join-item border-base-200 border"
      v-for="(muscleGroup, muscleGroupIndex) in muscleGroups"
      :key="muscleGroup.id"
    >
      <input type="radio" name="my-accordion-4" :checked="muscleGroupIndex === 0" />
      <div class="collapse-title font-semibold">
        {{ muscleGroup.name }}
      </div>
      <div class="collapse-content px-0">
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
  </div>
  <div
    class="fab"
    style="bottom: calc(4.25rem + env(safe-area-inset-bottom) + max(env(safe-area-inset-bottom), 0.5rem))"
  >
    <button
      class="btn btn-lg btn-circle btn-primary rounded-xl"
      aria-label="Crea allenamento"
      @click="isExercisesCreatorEditorModalOpen = true"
    >
      <Plus />
    </button>
  </div>
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
import { Dumbbell, Pencil, Plus, Trash } from '@lucide/vue';
import { ref } from 'vue';
import { muscleGroups, type Exercise, type MuscleGroup } from '@/domain/exercises.ts';
import { exercisesRef } from '@/stores/exercises.ts';
import GttModal from '@/components/generic/GttModal.vue';
import ExerciseCreatorModal from './ExerciseCreatorModal.vue';

const isExercisesCreatorEditorModalOpen = ref(false);

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
