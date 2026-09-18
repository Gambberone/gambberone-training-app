<template>
  <ul v-if="workoutsRef.length" class="list bg-base-100">
    <li v-for="workout in workoutsRef" :key="workout.id" class="list-row flex items-center gap-2">
      <button class="flex min-w-0 flex-1 items-center gap-3 text-left" type="button" @click="openWorkout(workout)">
        <Dumbbell class="size-5 shrink-0 text-primary" aria-hidden="true" />
        <div class="min-w-0">
          <div class="truncate">{{ workout.name }}</div>
          <div class="text-xs font-semibold uppercase opacity-60">
            {{ visibleStepCount(workout) }} step
          </div>
        </div>
      </button>
      <button
        class="btn btn-square btn-ghost btn-sm text-error"
        type="button"
        :aria-label="`Elimina ${workout.name}`"
        @click="askToRemoveWorkout(workout)"
      >
        <Trash2 class="size-5" aria-hidden="true" />
      </button>
    </li>
  </ul>
  <p v-else class="py-8 text-center text-base-content/60">Non hai ancora creato workout.</p>

  <WorkoutCreatorModal
    v-model="showWorkoutCreatorModal"
    :workout="selectedWorkoutForEdit"
    @update:model-value="onWorkoutCreatorModalUpdate"
  />
  <GttModal
    v-model="isWorkoutEliminationModalOpen"
    title="Eliminazione workout"
    :actions="[
      { id: 'cancel', label: 'Annulla' },
      { id: 'delete', label: 'Elimina', color: 'error' },
    ]"
    @action="handleWorkoutElimination"
  >
    <p class="text-md">
      Vuoi eliminare <strong>{{ workoutToRemove?.name }}</strong>? Verranno rimosse anche le programmazioni nel calendario.
    </p>
  </GttModal>
  <GttFab @click="showWorkoutCreatorModal = true" />
</template>

<script setup lang="ts">
import { Dumbbell, Trash2 } from '@lucide/vue';
import { ref } from 'vue';
import { WORKOUT_CREATOR_STEP_ACTION } from '../../constants';
import { removeWorkout, type Workout, workoutsRef } from '../../stores/workoutCreator.ts';
import GttModal from '../generic/GttModal.vue';
import GttFab from '../generic/GttFab.vue';
import WorkoutCreatorModal from '../WorkoutCreatorModal.vue';

const showWorkoutCreatorModal = ref(false);
const selectedWorkoutForEdit = ref<Workout>();
const isWorkoutEliminationModalOpen = ref(false);
const workoutToRemove = ref<Workout>();

const visibleStepCount = (workout: Workout) =>
  workout.steps.filter((step) => step.type !== WORKOUT_CREATOR_STEP_ACTION.SETPAUSE).length;

const openWorkout = (workout: Workout) => {
  selectedWorkoutForEdit.value = workout;
  showWorkoutCreatorModal.value = true;
};

const onWorkoutCreatorModalUpdate = (isOpen: boolean) => {
  showWorkoutCreatorModal.value = isOpen;
  if (!isOpen) selectedWorkoutForEdit.value = undefined;
};

const askToRemoveWorkout = (workout: Workout) => {
  workoutToRemove.value = workout;
  isWorkoutEliminationModalOpen.value = true;
};

const handleWorkoutElimination = (actionId: string) => {
  if (actionId === 'delete' && workoutToRemove.value) {
    removeWorkout(workoutToRemove.value.id);
  }
  workoutToRemove.value = undefined;
};
</script>
