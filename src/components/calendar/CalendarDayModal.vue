<template>
  <GttModal v-model="isOpen" :title="dayLabel">
    <div class="space-y-5">
      <div v-if="scheduledWorkouts.length" class="space-y-2">
        <p class="text-sm font-medium text-base-content/70">Workout programmati</p>
        <div
          v-for="scheduledWorkout in scheduledWorkouts"
          :key="scheduledWorkout.id"
          class="flex items-center gap-2 rounded-box bg-base-200 px-3 py-2"
        >
          <Dumbbell :size="17" class="text-primary" />
          <span class="flex-1 font-medium">{{ workoutName(scheduledWorkout.workoutId) }}</span>
          <button
            class="btn btn-ghost btn-xs btn-circle"
            type="button"
            aria-label="Rimuovi workout programmato"
            @click="removeScheduledWorkout(scheduledWorkout.id)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>

      <div v-if="workoutsRef.length">
        <GttSelectField
          v-model="workoutToSchedule"
          id="workout-to-schedule"
          label="Aggiungi workout"
          :options="workoutOptions"
          placeholder="Scegli un workout"
          split-action
          split-action-label="Aggiungi workout al giorno"
          @action="addWorkoutToDay"
        >
          <template #split-action><Plus :size="20" /></template>
        </GttSelectField>
      </div>
      <p v-else class="text-sm text-base-content/60">
        Crea prima un workout nella sezione Workouts.
      </p>
    </div>
  </GttModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Dumbbell, Plus, Trash2 } from '@lucide/vue';
import GttSelectField from '../generic/form/GttSelectField.vue';
import GttModal from '../generic/GttModal.vue';
import {
  removeScheduledWorkout,
  scheduleWorkout,
  scheduledWorkoutsRef,
  workoutsRef,
} from '../../stores/workoutCreator';

const props = defineProps<{ date?: string }>();
const isOpen = defineModel<boolean>({ default: false });
const workoutToSchedule = ref<string | undefined>();

const dayLabel = computed(() =>
  props.date
    ? new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(
        new Date(`${props.date}T12:00:00`),
      )
    : 'Programma workout',
);
const scheduledWorkouts = computed(() =>
  scheduledWorkoutsRef.value.filter((scheduledWorkout) => scheduledWorkout.date === props.date),
);
const workoutOptions = computed(() =>
  workoutsRef.value.map((workout) => ({ id: workout.id, label: workout.name })),
);

watch(isOpen, (open) => {
  if (open) workoutToSchedule.value = undefined;
});

function workoutName(workoutId: string) {
  return workoutsRef.value.find((workout) => workout.id === workoutId)?.name ?? 'Workout eliminato';
}
function addWorkoutToDay() {
  if (!props.date || !workoutToSchedule.value) return;
  scheduleWorkout(workoutToSchedule.value, props.date);
  workoutToSchedule.value = undefined;
}
</script>
