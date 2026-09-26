<template>
  <ul v-if="workoutsRef.length" class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
    <li v-for="workout in workoutsRef" :key="workout.id" class="relative flex h-full flex-col items-stretch gap-4 rounded-box border border-base-300/60 bg-base-100 p-4 shadow-sm lg:p-5">
      <button
        class="flex min-w-0 items-start gap-3 pr-8 text-left"
        type="button"
        @click="openWorkout(workout)"
      >
        <Dumbbell class="size-5 shrink-0 text-primary mt-1" aria-hidden="true" />
        <div class="min-w-0">
          <div class="break-words text-lg font-bold leading-tight lg:text-xl">{{ workout.name }}</div>
          <div class="text-xs font-semibold uppercase opacity-60 mt-2">
            {{ tr('home.steps', { count: visibleStepCount(workout) }) }} · {{ estimatedDuration(workout) }}
          </div>
          <p class="mt-1 text-xs text-base-content/60" :title="lastCompletedDate(workout)">{{ lastCompletedLabel(workout) }}</p>
        </div>
      </button>
      <div class="space-y-2">
        <h3 class="text-sm font-semibold">{{ tr('workoutCards.timeline') }}</h3>
        <div class="flex gap-1" :aria-label="tr('workoutCards.timeline')">
          <GttTooltip v-for="step in timelineBars(workout)" :key="step.index"
            
            class="min-w-0 py-2 focus-visible:outline-2 focus-visible:outline-primary"
            :style="{ flex: `${step.weight} 1 0%` }"
            :text="stepDetails(workout, step)"
            :aria-label="stepDetails(workout, step)">
            <span class="block h-2 rounded-sm" :class="step.barClass" />
          </GttTooltip>
        </div>
        <ol class="workout-step-tags flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <li v-for="step in timelineSteps(workout)" :key="step.index" class="min-w-0 shrink-0 lg:shrink">
            <GttTooltip 
              class="inline-flex min-w-0 items-center gap-1 rounded-field px-2 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-primary"
              :class="step.badgeClass"
              :text="stepDetails(workout, step)" :aria-label="stepDetails(workout, step)">
              <component :is="step.icon" class="size-3.5 shrink-0" aria-hidden="true" />
              <span class="whitespace-nowrap text-left lg:whitespace-normal lg:break-words">{{ step.label }} <span class="opacity-70">({{ step.index + 1 }}/{{ visibleStepCount(workout) }})</span></span>
            </GttTooltip>
          </li>
        </ol>
      </div>
      <dl v-if="targetGroups(workout).length" class="block">
        <dt class="text-sm font-semibold">{{ tr('workoutCards.targets') }}</dt>
        <dd class="mt-1 text-sm text-base-content/70">{{ targetGroups(workout).join(', ') }}</dd>
      </dl>
      <div class="mt-auto flex shrink-0 items-center gap-3 pt-2">
        <button
          class="btn btn-primary h-12 min-w-0 flex-1 gap-2 px-4 lg:px-5"
          type="button"
          :aria-label="tr('messages.startNamed', { name: workout.name })"
          @click="startWorkout(workout.id)"
        >
          <Play class="size-4" aria-hidden="true" />
          <span>{{ tr('workoutCards.start') }}</span>
        </button>
        <button class="btn btn-outline btn-primary h-12 gap-2 px-4" type="button"
          :aria-label="tr('messages.editNamed', { name: workout.name })" @click="openWorkout(workout)">
          <Pencil class="size-4" aria-hidden="true" />
          {{ tr('workoutCards.edit') }}
        </button>
      </div>
      <details data-workout-menu class="dropdown dropdown-end absolute right-3 top-3" @keydown.esc="($event.currentTarget as HTMLDetailsElement).open = false">
        <summary class="btn btn-square btn-ghost btn-sm list-none [&::-webkit-details-marker]:hidden" :aria-label="tr('workoutCards.actions', { name: workout.name })">
          <Ellipsis class="size-5" aria-hidden="true" />
        </summary>
        <ul class="dropdown-content menu z-10 mt-1 w-44 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
          <li><button class="text-error" type="button" @click="askToRemoveWorkout(workout); ($event.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')">
            <Trash2 class="size-4" aria-hidden="true" />{{ tr('ui.delete') }}
          </button></li>
        </ul>
      </details>
    </li>
  </ul>
  <p v-else class="py-8 text-center text-base-content/60">{{ tr('ui.you_have_not_created_any_workouts_yet') }}</p>

  <WorkoutCreatorModal
    v-model="showWorkoutCreatorModal"
    :workout="selectedWorkoutForEdit"
    @update:model-value="onWorkoutCreatorModalUpdate"
  />
  <GttModal
    v-model="isWorkoutEliminationModalOpen"
    :title="tr('ui.delete_workout')"
    :actions="[
      { id: 'cancel', label: tr('ui.cancel') },
      { id: 'delete', label: tr('ui.delete'), color: 'error' },
    ]"
    @action="handleWorkoutElimination"
  >
    <p class="text-md">
      {{ tr('messages.deleteWorkout', { name: workoutToRemove?.name ?? '' }) }}
    </p>
  </GttModal>
  <GttBottomAction desktop-target="#workouts-desktop-action" :label="tr('ui.create_workout')" @click="showWorkoutCreatorModal = true" />
</template>

<script setup lang="ts">
import { tr, appLocale, localizedExerciseName } from '@/localization';
import { Dumbbell, Play, Trash2, Pencil, Ellipsis, Flame, Pause, LineSquiggle } from '@lucide/vue';
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { estimateWorkoutDuration } from '@/wavebinder/duration';
import { WORKOUT_CREATOR_STEP_ACTION } from '@/constants';
import {
  removeWorkout,
  startWorkoutSession,
  workoutEstimatedDuration,
  type Workout,
  workoutsRef,
  workoutSessionsRef,
} from '@/stores/workoutCreator.ts';
import { exercisesRef } from '@/stores/exercises';
import GttTooltip from '@/components/generic/GttTooltip.vue';
import GttBottomAction from '@/components/generic/GttBottomAction.vue';
import GttModal from '@/components/generic/GttModal.vue';
import WorkoutCreatorModal from './creator/WorkoutCreatorModal.vue';

function closeMenusOnOutsideClick(event: PointerEvent) {
  const target = event.target;
  if (!(target instanceof Node)) return;
  document.querySelectorAll<HTMLDetailsElement>('details[data-workout-menu][open]').forEach((menu) => {
    if (!menu.contains(target)) menu.open = false;
  });
}
onMounted(() => document.addEventListener('pointerdown', closeMenusOnOutsideClick));
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeMenusOnOutsideClick));

const showWorkoutCreatorModal = ref(false);
const selectedWorkoutForEdit = ref<Workout>();
const isWorkoutEliminationModalOpen = ref(false);
const workoutToRemove = ref<Workout>();

const visibleStepCount = (workout: Workout) =>
  workout.steps.filter((step) => step.type !== WORKOUT_CREATOR_STEP_ACTION.SETPAUSE).length;

const phaseStyles = {
  WARMUP: { icon: Flame, barClass: 'bg-error/70', badgeClass: 'bg-error/15 text-error' },
  EXERCISE: { icon: Dumbbell, barClass: 'bg-primary/70', badgeClass: 'bg-primary/15 text-primary' },
  PAUSE: { icon: Pause, barClass: 'bg-info/60', badgeClass: 'bg-info/15 text-info' },
  STRETCHING: { icon: LineSquiggle, barClass: 'bg-warning/70', badgeClass: 'bg-warning/15 text-warning' },
};
const timelineSteps = (workout: Workout) => workout.steps
  .filter((step) => step.type !== 'SETPAUSE')
  .map((step, index) => {
    const type = step.type as keyof typeof phaseStyles;
    const exercise = type === 'EXERCISE' ? exercisesRef.value.find((item) => item.id === step.exerciseId) : undefined;
    const label = exercise ? localizedExerciseName(exercise) : tr(`stepTypes.${type}`);
    const seconds = estimateWorkoutDuration([step]);
    const duration = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    return { index, label, duration, ...phaseStyles[type] };
  });
const timelineBars = (workout: Workout) => {
  const steps = timelineSteps(workout);
  const timedSteps = steps.filter((step) => step.duration > 0);
  // An untimed workout has no duration proportions: retain a neutral equal split.
  return timedSteps.length ? timedSteps.map((step) => ({ ...step, weight: step.duration })) : steps.map((step) => ({ ...step, weight: 1 }));
};
const stepDetails = (workout: Workout, step: ReturnType<typeof timelineSteps>[number]) => {
  const total = timelineSteps(workout).reduce((sum, item) => sum + item.duration, 0);
  if (!total) return `${step.label} · ${tr('ui.untimed')}`;
  const minutes = Math.floor(step.duration / 60);
  const seconds = Math.round(step.duration % 60);
  const duration = minutes ? `${minutes} min${seconds ? ` ${seconds} s` : ''}` : `${seconds} s`;
  const percent = new Intl.NumberFormat(appLocale(), { style: 'percent', maximumFractionDigits: 1 }).format(step.duration / total);
  return tr('workoutCards.stepDetails', { name: step.label, duration, percent });
};
const targetGroups = (workout: Workout) => {
  const exerciseIds = workout.steps.filter((step) => step.type === 'EXERCISE').map((step) => step.exerciseId);
  const groups = exercisesRef.value.filter((exercise) => exerciseIds.includes(exercise.id)).map((exercise) => exercise.muscleGroupId);
  return [...new Set(groups)].map((group) => tr(`muscleGroups.${group}`));
};
const lastCompletedAt = (workout: Workout) => {
  const timestamps = workoutSessionsRef.value
    .filter((session) => session.workoutId === workout.id && session.completedAt)
    .map((session) => Date.parse(session.completedAt!))
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp <= Date.now());
  return timestamps.length ? new Date(Math.max(...timestamps)) : undefined;
};
const lastCompletedDate = (workout: Workout) => {
  const date = lastCompletedAt(workout);
  return date ? new Intl.DateTimeFormat(appLocale(), { dateStyle: 'long', timeStyle: 'short' }).format(date) : undefined;
};
const lastCompletedLabel = (workout: Workout) => {
  const date = lastCompletedAt(workout);
  if (!date) return tr('workoutCards.neverCompleted');
  const now = new Date();
  // Compare local calendar dates, so yesterday remains yesterday across DST changes.
  const dayNumber = (value: Date) => Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000;
  const days = dayNumber(date) - dayNumber(now);
  const relative = new Intl.RelativeTimeFormat(appLocale(), { numeric: 'auto' }).format(days, 'day');
  return tr('workoutCards.lastCompleted', { date: relative });
};

const estimatedDuration = (workout: Workout) => {
  const seconds = workoutEstimatedDuration(workout);
  return seconds ? `~${Math.ceil(seconds / 60)} min` : tr('ui.untimed');
};

const openWorkout = (workout: Workout) => {
  selectedWorkoutForEdit.value = workout;
  showWorkoutCreatorModal.value = true;
};

const startWorkout = (workoutId: string) => {
  startWorkoutSession(workoutId);
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


<style scoped>
@media (max-width: 1023px) {
  .workout-step-tags {
    padding-right: 1.5rem;
    mask-image: linear-gradient(to right, black calc(100% - 1rem), transparent);
  }
}
</style>
