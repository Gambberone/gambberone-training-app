<template>
  <div v-if="workoutsRef.length" class="workout-collection">
    <header class="workout-list-toolbar">
      <p class="text-sm text-base-content/65">
        {{ tr("workoutCards.collectionCount", { count: workoutsRef.length }) }}
      </p>
      <div class="join" role="group" :aria-label="tr('workoutCards.view')">
        <GttButton
          mode="ghost"
          size="sm"
          class="join-item"
          :class="{ 'workout-view-active': !compact }"
          :aria-pressed="!compact"
          @click="compact = false"
          ><LayoutGrid :size="17" aria-hidden="true" />{{
            tr("workoutCards.cards")
          }}</GttButton
        >
        <GttButton
          mode="ghost"
          size="sm"
          class="join-item"
          :class="{ 'workout-view-active': compact }"
          :aria-pressed="compact"
          @click="compact = true"
          ><Rows3 :size="17" aria-hidden="true" />{{
            tr("workoutCards.compact")
          }}</GttButton
        >
      </div>
    </header>
    <div class="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.45fr)]">
      <GttInputField :id="searchId" v-model="search" type="search" :label="tr('collection.searchWorkouts')" :placeholder="tr('collection.searchWorkouts')" compact />
      <GttSelectField :id="sortId" v-model="sortOrder" :label="tr('collection.sort')" :options="sortOptions" compact />
    </div>
    <p class="mb-3 text-sm text-[var(--color-ui-muted)]" role="status" v-if="search.trim()">
      {{ tr('collection.results', { count: visibleWorkouts.length }) }}
    </p>
    <div v-if="!visibleWorkouts.length" class="py-8">
      <p class="font-semibold">{{ tr('collection.noResults') }}</p>
      <GttButton mode="outline" class="mt-3" @click="search = ''">{{ tr('collection.clearSearch') }}</GttButton>
    </div>
    <p v-if="startBlocked" :id="startBlockedId" class="mb-4 text-sm text-[var(--color-ui-muted)]" role="status">
      {{ tr("workoutCards.startBlocked") }}
    </p>
    <ul class="workout-list" :class="{ 'workout-list--compact': compact }">
      <li v-for="workout in visibleWorkouts" :key="workout.id" class="workout-card">
        <header class="workout-card-header">
          <GttButton
            unstyled
            class="workout-name"
            :aria-label="tr('messages.editNamed', { name: workout.name })"
            @click="openWorkout(workout)"
          >
            <h2 class="text-xl font-bold wrap-break-word">
              {{ workout.name }}
            </h2>
            <p class="mt-2 text-xs text-base-content/65">
              {{ tr("home.steps", { count: visibleStepCount(workout) }) }}
            </p>
            <p
              class="mt-1 text-xs text-base-content/65"
              :title="lastCompletedDate(workout)"
            >
              {{ lastCompletedLabel(workout) }}
            </p>
          </GttButton>
          <div
            class="workout-duration"
            :aria-label="tr('workoutCards.estimatedDuration')"
          >
            <Clock3 :size="16" aria-hidden="true" /><span>{{
              estimatedDuration(workout)
            }}</span>
          </div>
        </header>
        <div class="workout-timeline">
          <h3 class="text-xs font-semibold text-base-content/65">
            {{ tr("workoutCards.timeline") }}
          </h3>
          <div class="flex gap-1" :aria-label="tr('workoutCards.timeline')">
            <GttTooltip
              v-for="step in timelineBars(workout)"
              :key="step.index"
              class="min-w-0 py-2"
              :style="{ flex: `${step.weight} 1 0%` }"
              :text="stepDetails(workout, step)"
              :text-color="step.textColor"
              :aria-label="stepDetails(workout, step)"
              ><span class="block h-2 rounded-sm" :class="step.barClass"
            /></GttTooltip>
          </div>
        </div>
        <dl v-if="targetGroups(workout).length" class="workout-targets text-sm">
          <dt class="text-xs text-base-content/65">
            {{ tr("workoutCards.targets") }}
          </dt>
          <dd class="mt-1">{{ targetGroups(workout).join(", ") }}</dd>
        </dl>
        <div class="workout-card-actions">
          <GttButton
            color="primary"
            class="workout-start"
            :disabled="startBlocked"
            :aria-describedby="startBlocked ? startBlockedId : undefined"
            :aria-label="tr('messages.startNamed', { name: workout.name })"
            @click="startWorkout(workout.id)"
            ><Play :size="17" aria-hidden="true" />{{
              tr("workoutCards.start")
            }}</GttButton
          >
          <GttButton
            mode="ghost"
            :disabled="!!activeWorkoutSessionRef || !!sharedRoomId"
            :aria-label="tr('together.title')"
            @click="selectedTogetherWorkout = workout"
            ><UsersRound :size="17" aria-hidden="true" /><span
              class="hidden sm:inline"
              >{{ tr("together.together") }}</span
            ></GttButton
          >
          <GttButton
            mode="ghost"
            :aria-label="tr('messages.editNamed', { name: workout.name })"
            @click="openWorkout(workout)"
            ><Pencil :size="17" aria-hidden="true" />{{
              tr("workoutCards.edit")
            }}</GttButton
          >
          <GttButton
            mode="ghost"
            shape="square"
            class="workout-delete"
            :aria-label="tr('messages.deleteNamed', { name: workout.name })"
            :title="tr('ui.delete')"
            @click="askToRemoveWorkout(workout)"
          >
            <Trash2 :size="18" aria-hidden="true" />
          </GttButton>
        </div>
      </li>
    </ul>
  </div>
  <section v-else class="workout-empty">
    <div
      class="grid size-14 place-items-center rounded-box bg-base-200 text-primary"
    >
      <Dumbbell :size="28" aria-hidden="true" />
    </div>
    <h2 class="mt-5 text-2xl font-bold">{{ tr("workoutCards.emptyTitle") }}</h2>
    <p class="mt-2 max-w-md text-base-content/65">
      {{ tr("workoutCards.emptyDescription") }}
    </p>
    <GttButton color="primary" class="mt-5" @click="createWorkout"
      ><Plus :size="18" />{{ tr("ui.create_workout") }}</GttButton
    >
  </section>

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
      {{ tr("messages.deleteWorkout", { name: workoutToRemove?.name ?? "" }) }}
    </p>
  </GttModal>
  <GttBottomAction
    v-if="workoutsRef.length"
    desktop-target="#workouts-desktop-action"
    :label="tr('ui.create_workout')"
    @click="createWorkout"
  />
</template>

<script setup lang="ts">
import {
  selectedTogetherWorkout,
  sharedRoomId,
} from "@/services/sharedWorkout";
import { activeWorkoutSessionRef } from "@/stores/workoutCreator";
import { tr, appLocale, localizedExerciseName } from "@/localization";
import {
  UsersRound,
  Dumbbell,
  Play,
  Trash2,
  Pencil,
  LayoutGrid,
  Rows3,
  Clock3,
  Plus,
} from "@lucide/vue";
import { computed, ref, useId } from "vue";
import { estimateWorkoutDuration } from "@/domain/workoutDuration";
import { WORKOUT_CREATOR_STEP_ACTION } from "@/constants";
import {
  removeWorkout,
  startWorkoutSession,
  workoutEstimatedDuration,
  type Workout,
  workoutsRef,
  workoutSessionsRef,
} from "@/stores/workoutCreator.ts";
import { exercisesRef } from "@/stores/exercises";
import GttInputField from '@/components/generic/form/GttInputField.vue';
import GttSelectField from '@/components/generic/form/GttSelectField.vue';
import GttTooltip from "@/components/generic/GttTooltip.vue";
import GttBottomAction from "@/components/generic/GttBottomAction.vue";
import WorkoutCreatorModal from "./creator/WorkoutCreatorModal.vue";

const startBlockedId = useId();
const startBlocked = computed(() => !!activeWorkoutSessionRef.value || !!sharedRoomId.value);
const searchId = useId();
const sortId = useId();
const search = ref('');
const sortOrder = ref('original');
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase(appLocale()).trim();
const sortOptions = computed(() => [
  { id: 'original', label: tr('collection.original') },
  { id: 'recent', label: tr('collection.recent') },
  { id: 'name', label: tr('collection.byName') },
]);
const visibleWorkouts = computed(() => {
  const query = normalizeSearch(search.value);
  const items = workoutsRef.value.filter(workout => normalizeSearch(workout.name).includes(query));
  if (sortOrder.value === 'name') items.sort((a, b) => a.name.localeCompare(b.name, appLocale(), { sensitivity: 'base', numeric: true }));
  if (sortOrder.value === 'recent') {
    const completed = new Map<string, number>();
    for (const session of workoutSessionsRef.value) {
      const timestamp = Date.parse(session.completedAt ?? '');
      if (Number.isFinite(timestamp) && timestamp <= Date.now()) completed.set(session.workoutId, Math.max(completed.get(session.workoutId) ?? 0, timestamp));
    }
    items.sort((a, b) => (completed.get(b.id) ?? 0) - (completed.get(a.id) ?? 0));
  }
  return items;
});
const compact = ref(false);
const showWorkoutCreatorModal = ref(false);
function createWorkout() {
  selectedWorkoutForEdit.value = undefined;
  showWorkoutCreatorModal.value = true;
}
const selectedWorkoutForEdit = ref<Workout>();
const isWorkoutEliminationModalOpen = ref(false);
const workoutToRemove = ref<Workout>();

const visibleStepCount = (workout: Workout) =>
  workout.steps.filter(
    (step) => step.type !== WORKOUT_CREATOR_STEP_ACTION.SETPAUSE,
  ).length;

const phaseStyles = {
  WARMUP: { barClass: "bg-error/70", textColor: "var(--color-error)" },
  EXERCISE: { barClass: "bg-primary/70", textColor: "var(--color-primary)" },
  PAUSE: { barClass: "bg-info/60", textColor: "var(--color-info)" },
  STRETCHING: { barClass: "bg-warning/70", textColor: "var(--color-warning)" },
};
const timelineSteps = (workout: Workout) =>
  workout.steps
    .filter((step) => step.type !== "SETPAUSE")
    .map((step, index) => {
      const type = step.type as keyof typeof phaseStyles;
      const exercise =
        type === "EXERCISE"
          ? exercisesRef.value.find((item) => item.id === step.exerciseId)
          : undefined;
      const label = exercise
        ? localizedExerciseName(exercise)
        : tr(`stepTypes.${type}`);
      const seconds = estimateWorkoutDuration([step]);
      const duration = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
      const detail =
        type === "EXERCISE"
          ? tr("workoutCards.setCount", { count: step.sets ?? 1 })
          : type === "WARMUP" || type === "STRETCHING"
            ? tr("workoutCards.exerciseCount", {
                count:
                  (type === "WARMUP"
                    ? step.warmupExercises
                    : step.stretchingExercises
                  )?.length ?? 0,
              })
            : "";
      return { index, label, detail, duration, ...phaseStyles[type] };
    });
const timelineBars = (workout: Workout) => {
  const steps = timelineSteps(workout);
  const timedSteps = steps.filter((step) => step.duration > 0);
  // An untimed workout has no duration proportions: retain a neutral equal split.
  return timedSteps.length
    ? timedSteps.map((step) => ({ ...step, weight: step.duration }))
    : steps.map((step) => ({ ...step, weight: 1 }));
};
const stepDetails = (
  workout: Workout,
  step: ReturnType<typeof timelineSteps>[number],
) => {
  const total = timelineSteps(workout).reduce(
    (sum, item) => sum + item.duration,
    0,
  );
  const name = [step.label, step.detail].filter(Boolean).join(" · ");
  if (!total) return `${name} · ${tr("ui.untimed")}`;
  const minutes = Math.floor(step.duration / 60);
  const seconds = Math.round(step.duration % 60);
  const duration = minutes
    ? `${minutes} min${seconds ? ` ${seconds} s` : ""}`
    : `${seconds} s`;
  return tr("workoutCards.stepDetails", { name, duration });
};
const targetGroups = (workout: Workout) => {
  const exerciseIds = workout.steps
    .filter((step) => step.type === "EXERCISE")
    .map((step) => step.exerciseId);
  const groups = exercisesRef.value
    .filter((exercise) => exerciseIds.includes(exercise.id))
    .map((exercise) => exercise.muscleGroupId);
  return [...new Set(groups)].map((group) => tr(`muscleGroups.${group}`));
};
const lastCompletedAt = (workout: Workout) => {
  const timestamps = workoutSessionsRef.value
    .filter(
      (session) => session.workoutId === workout.id && session.completedAt,
    )
    .map((session) => Date.parse(session.completedAt!))
    .filter(
      (timestamp) => Number.isFinite(timestamp) && timestamp <= Date.now(),
    );
  return timestamps.length ? new Date(Math.max(...timestamps)) : undefined;
};
const lastCompletedDate = (workout: Workout) => {
  const date = lastCompletedAt(workout);
  return date
    ? new Intl.DateTimeFormat(appLocale(), {
        dateStyle: "long",
        timeStyle: "short",
      }).format(date)
    : undefined;
};
const lastCompletedLabel = (workout: Workout) => {
  const date = lastCompletedAt(workout);
  if (!date) return tr("workoutCards.neverCompleted");
  const now = new Date();
  // Compare local calendar dates, so yesterday remains yesterday across DST changes.
  const dayNumber = (value: Date) =>
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000;
  const days = dayNumber(date) - dayNumber(now);
  const relative = new Intl.RelativeTimeFormat(appLocale(), {
    numeric: "auto",
  }).format(days, "day");
  return tr("workoutCards.lastCompleted", { date: relative });
};

const estimatedDuration = (workout: Workout) => {
  const seconds = workoutEstimatedDuration(workout);
  return seconds ? `~${Math.ceil(seconds / 60)} min` : tr("ui.untimed");
};

const openWorkout = (workout: Workout) => {
  selectedWorkoutForEdit.value = workout;
  showWorkoutCreatorModal.value = true;
};

const startWorkout = (workoutId: string) => {
  if (activeWorkoutSessionRef.value || sharedRoomId.value) return;
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
  if (actionId === "delete" && workoutToRemove.value) {
    removeWorkout(workoutToRemove.value.id);
  }
  workoutToRemove.value = undefined;
};
</script>

<style scoped>
/* Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4
 * Training collection: name and duration first, sequence retained. */
.workout-list-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-ui-sm);
  margin-bottom: var(--space-ui-md);
}
.workout-view-active {
  color: var(--color-primary);
  background: var(--color-base-200);
}
.workout-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-ui-md);
}
.workout-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: var(--space-ui-md);
  padding: var(--space-ui-md);
  border: 1px solid var(--color-ui-rule);
  border-radius: var(--radius-box);
  background: var(--color-base-100);
}
.workout-card-header {
  padding-inline-end: calc(var(--size-ui-control) + var(--space-ui-xs));
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-ui-xs);
  align-items: start;
}
.workout-name {
  min-width: 0;
  text-align: left;
  grid-column: 1;
  grid-row: 1;
}
.workout-name h2 {
  overflow-wrap: anywhere;
}
.workout-duration {
  display: flex;
  align-items: center;
  gap: var(--space-ui-xs);
  font-size: 1.125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  grid-column: 1;
}
.workout-duration svg {
  color: var(--color-ui-muted);
}
.workout-delete {
  position: absolute;
  top: var(--space-ui-md);
  inset-inline-end: var(--space-ui-md);
  color: var(--color-error);
}
@media (min-width: 64rem) and (hover: hover) and (pointer: fine) {
  .workout-delete {
    opacity: 0;
    pointer-events: none;
  }
  .workout-card:hover .workout-delete,
  .workout-card:focus-within .workout-delete {
    opacity: 1;
    pointer-events: auto;
  }
}
.workout-card-actions {
  display: flex;
  gap: var(--space-ui-xs);
  align-items: center;
  margin-top: auto;
}
.workout-start {
  flex: 1;
}
.workout-empty {
  padding: var(--space-ui-2xl) var(--space-ui-md);
}
.workout-list--compact .workout-targets {
  display: none;
}
.workout-list--compact .workout-card {
  gap: var(--space-ui-sm);
}
@media (min-width: 64rem) {
  .workout-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .workout-card {
    padding: var(--space-ui-lg);
  }
  .workout-card .workout-delete {
    top: var(--space-ui-lg);
    inset-inline-end: var(--space-ui-lg);
  }
  .workout-list--compact {
    grid-template-columns: minmax(0, 1fr);
  }
  .workout-list--compact .workout-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(8rem, 0.6fr) auto;
    align-items: center;
    gap: var(--space-ui-lg);
    padding: var(--space-ui-md);
  }
  .workout-list--compact .workout-card-header {
    padding-inline-end: 0;
  }
  .workout-list--compact .workout-delete {
    position: static;
    opacity: 1;
    pointer-events: auto;
    flex-shrink: 0;
  }
  .workout-list--compact .workout-card-actions {
    margin: 0;
  }
  .workout-list--compact .workout-name h2 {
    font-size: 1.125rem;
  }
}
</style>
