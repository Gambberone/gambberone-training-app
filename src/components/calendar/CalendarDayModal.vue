<template>
  <GttModal v-model="isOpen" :title="dayLabel">
    <div class="space-y-5">
      <div v-if="scheduledWorkouts.length" class="space-y-2">
        <p class="text-sm font-medium text-base-content/70">{{ tr('ui.scheduled_workouts') }}</p>
        <div
          v-for="scheduledWorkout in scheduledWorkouts"
          :key="scheduledWorkout.id"
          class="flex items-center gap-2 rounded-box bg-base-200 px-3 py-2"
        >
          <Dumbbell :size="17" class="text-primary" />
          <span class="flex-1 font-medium">{{ workoutName(scheduledWorkout.workoutId) }}</span>
          <span v-if="scheduledWorkout.time" class="flex items-center gap-1 text-sm text-base-content/60">
            <Clock3 :size="15" />
            {{ scheduledWorkout.time }}
          </span>
          <button
            class="btn btn-ghost btn-xs btn-circle"
            type="button"
            :aria-label="tr('ui.remove_scheduled_workout')"
            @click="removeScheduledWorkout(scheduledWorkout.id)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>

      <div v-if="workoutsRef.length">
        <GttTimeField
          v-model="scheduledTime"
          id="workout-scheduled-time"
          :label="tr('ui.time_optional')"
          compact
        />
        <GttSelectField
          v-model="workoutToSchedule"
          id="workout-to-schedule"
          :label="tr('ui.add_workout')"
          :options="workoutOptions"
          :placeholder="tr('ui.choose_a_workout')"
          split-action
          :split-action-label="tr('ui.add_workout_to_this_day')"
          @action="addWorkoutToDay"
        >
          <template #split-action><Plus :size="20" /></template>
        </GttSelectField>
      </div>
      <p v-else class="text-sm text-base-content/60">
        {{ tr('ui.create_a_workout_in_the_workouts_section_first') }}
      </p>
      <p v-if="scheduleError" class="text-sm text-error" role="alert">{{ localizedValidationMessage(scheduleError) }}</p>
    </div>
  </GttModal>
</template>

<script setup lang="ts">
import { tr, appLocale, localizedValidationMessage } from '@/localization';
import { computed, ref, watch } from 'vue';
import { Clock3, Dumbbell, Plus, Trash2 } from '@lucide/vue';
import GttTimeField from '@/components/generic/form/GttTimeField.vue';
import GttSelectField from '@/components/generic/form/GttSelectField.vue';
import GttModal from '@/components/generic/GttModal.vue';
import {
  removeScheduledWorkout,
  scheduleWorkout,
  scheduledWorkoutsRef,
  workoutsRef,
} from '@/stores/workoutCreator';
import { scheduleValidationErrors } from '@/wavebinder/schedule';

const props = defineProps<{ date?: string; preselectedWorkoutId?: string }>();
const isOpen = defineModel<boolean>({ default: false });
const workoutToSchedule = ref<string | undefined>();
const scheduledTime = ref('');
const scheduleError = ref('');

const dayLabel = computed(() =>
  props.date
    ? new Intl.DateTimeFormat(appLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(
        new Date(`${props.date}T12:00:00`),
      )
    : tr('ui.schedule_workout'),
);
const scheduledWorkouts = computed(() =>
  scheduledWorkoutsRef.value.filter((scheduledWorkout) => scheduledWorkout.date === props.date),
);
const workoutOptions = computed(() =>
  workoutsRef.value.map((workout) => ({ id: workout.id, label: workout.name })),
);

watch(isOpen, (open) => {
  if (open) {
    workoutToSchedule.value = props.preselectedWorkoutId;
    scheduledTime.value = '';
    scheduleError.value = '';
  }
});

function workoutName(workoutId: string) {
  return workoutsRef.value.find((workout) => workout.id === workoutId)?.name ?? tr('ui.deleted_workout');
}
function addWorkoutToDay() {
  if (!props.date || !workoutToSchedule.value) return;
  const errors = scheduleValidationErrors({
    date: props.date,
    workoutId: workoutToSchedule.value,
    time: scheduledTime.value || undefined,
    scheduled: scheduledWorkoutsRef.value,
  });
  if (errors.length) {
    scheduleError.value = errors[0];
    return;
  }
  scheduleWorkout(workoutToSchedule.value, props.date, scheduledTime.value || undefined);
  workoutToSchedule.value = undefined;
  scheduledTime.value = '';
  scheduleError.value = '';
}
</script>
