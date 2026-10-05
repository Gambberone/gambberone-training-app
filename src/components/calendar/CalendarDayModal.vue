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
          <span
            v-if="scheduledWorkout.time"
            class="flex items-center gap-1 text-sm text-base-content/60"
          >
            <Clock3 :size="15" />
            {{ scheduledWorkout.time }}
          </span>
          <GttButton mode="ghost" size="xs" shape="circle"
            
            type="button"
            :aria-label="tr('ui.remove_scheduled_workout')"
            @click="removeScheduledWorkout(scheduledWorkout.id)"
          >
            <Trash2 :size="16" />
          </GttButton>
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
          :split-action-disabled="validationErrors.length > 0"
          :split-action-label="tr('ui.add_workout_to_this_day')"
          @action="addWorkoutToDay"
        >
          <template #split-action><Plus :size="20" /></template>
        </GttSelectField>
      </div>
      <p v-else class="text-sm text-base-content/60">
        {{ tr('ui.create_a_workout_in_the_workouts_section_first') }}
      </p>
      <p v-if="scheduleError" class="text-sm text-error" role="alert">
        {{ localizedValidationMessage(scheduleError) }}
      </p>
    </div>
  </GttModal>
</template>

<script setup lang="ts">
import GttSelectField from '@/components/generic/form/GttSelectField.vue';
import GttTimeField from '@/components/generic/form/GttTimeField.vue';
import { appLocale, localizedValidationMessage, tr } from '@/localization';
import {
  removeScheduledWorkout,
  scheduleWorkout,
  scheduledWorkoutsRef,
  workoutsRef,
} from '@/stores/workoutCreator';
import { useWaveBinderValue } from '@/composables/useWaveBinderNode';
import { wb } from '@/wavebinder';
import type { SingleNode } from 'wave-binder';
import { Clock3, Dumbbell, Plus, Trash2 } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{ date?: string; preselectedWorkoutId?: string }>();
const isOpen = defineModel<boolean>({ default: false });
const workoutToSchedule = ref<string | undefined>();
const scheduledTime = ref('');
const errors = useWaveBinderValue<string[] | null>(
  wb.getNodeByName('scheduleValidationErrors') as SingleNode,
);
const validationErrors = computed(() => errors.value ?? ['messages.scheduleRequired']);
const scheduleError = computed(() => workoutToSchedule.value ? validationErrors.value[0] : undefined);

watch(() => ({
  open: isOpen.value,
  date: props.date,
  workoutId: workoutToSchedule.value,
  time: scheduledTime.value || undefined,
  scheduled: scheduledWorkoutsRef.value,
}), (input) => {
  if (isOpen.value) wb.getNodeByName('scheduleInput').next(input);
}, { deep: true, immediate: true, flush: 'sync' });

const dayLabel = computed(() =>
  props.date
    ? new Intl.DateTimeFormat(appLocale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(`${props.date}T12:00:00`))
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
  }
});

function workoutName(workoutId: string) {
  return (
    workoutsRef.value.find((workout) => workout.id === workoutId)?.name ?? tr('ui.deleted_workout')
  );
}
function addWorkoutToDay() {
  if (!props.date || !workoutToSchedule.value) return;
  if (validationErrors.value.length) return;
  scheduleWorkout(workoutToSchedule.value, props.date, scheduledTime.value || undefined);
  workoutToSchedule.value = undefined;
  scheduledTime.value = '';
}
</script>
