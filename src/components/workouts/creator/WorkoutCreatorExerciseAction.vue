<template>
  <div v-if="desktop" class="space-y-5">
    <div
      v-if="selectedExercise"
      class="flex items-center justify-between gap-3"
    >
      <p class="text-sm font-semibold text-primary">
        {{ localizedExerciseName(selectedExercise) }}
      </p>
      <GttButton
        mode="ghost"
        size="xs"
        class="shrink-0"
        type="button"
        :aria-expanded="isPickerOpen"
        @click="isPickerOpen = !isPickerOpen"
      >
        {{ tr("creator.changeExercise") }}
      </GttButton>
    </div>
    <div v-if="isPickerOpen || !selectedExercise" class="space-y-3">
      <div
        class="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
      >
        <GttInputField
          id="desktop-exercise-search"
          v-model="search"
          :label="tr('ui.exercise')"
          :placeholder="tr('creator.searchExercise')"
          compact
        />
        <GttSelectField
          id="desktop-exercise-group"
          v-model="catalogGroup"
          :options="catalogGroups"
          :label="tr('ui.muscle_group')"
          compact
        />
      </div>
      <div
        class="max-h-63 overflow-y-auto overscroll-contain rounded-field border border-base-300 bg-base-100 divide-y divide-base-300/60 lg:max-h-40"
        :aria-label="tr('creator.exerciseResults')"
      >
        <GttButton
          unstyled
          v-for="exercise in filteredExercises"
          :key="exercise.id"
          type="button"
          class="flex h-14 w-full items-center justify-between gap-3 px-3 text-left text-sm hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary"
          :class="
            selectedExerciseId === exercise.id
              ? 'bg-primary/10 text-primary'
              : ''
          "
          :aria-pressed="selectedExerciseId === exercise.id"
          @click="pickExercise(exercise)"
        >
          <span
            class="min-w-0 flex-1 truncate font-medium"
            :title="localizedExerciseName(exercise)"
            >{{ localizedExerciseName(exercise) }}</span
          >
          <Check
            v-if="selectedExerciseId === exercise.id"
            class="size-4 shrink-0"
          />
          <span v-else class="shrink-0 text-xs text-base-content/60">{{
            tr(`muscleGroups.${exercise.muscleGroupId}`)
          }}</span>
        </GttButton>
        <p
          v-if="!filteredExercises.length"
          class="p-3 text-sm text-base-content/60"
        >
          {{ tr("creator.noExercises") }}
        </p>
      </div>
    </div>
    <dl v-if="selectedExercise" class="creator-execution-summary">
      <div>
        <dt>{{ tr("ui.sets") }}</dt>
        <dd>{{ sets }}</dd>
      </div>
      <div>
        <dt>
          {{ tr(isRepetitions ? "ui.repetitions" : "ui.duration_seconds") }}
        </dt>
        <dd>{{ exerciseValue }}</dd>
      </div>
      <div>
        <dt>{{ tr("creator.recoveryLabel") }}</dt>
        <dd :class="{ 'is-empty': !(hasSetPause && isPauseAvailable) }">
          {{
            hasSetPause && isPauseAvailable
              ? pauseBetweenSetsDuration + " s"
              : "—"
          }}
        </dd>
      </div>
    </dl>
    <fieldset v-if="selectedExercise" class="space-y-3">
      <legend class="mb-2 text-sm font-medium">
        {{ tr("creator.execution") }}
      </legend>
      <div class="join">
        <GttButton
          size="sm"
          type="button"
          class="join-item"
          :class="isRepetitions ? 'btn-primary' : 'btn-outline'"
          :aria-pressed="isRepetitions"
          @click="isRepetitions = true"
        >
          {{ tr("ui.repetitions") }}
        </GttButton>
        <GttButton
          size="sm"
          type="button"
          class="join-item"
          :class="!isRepetitions ? 'btn-primary' : 'btn-outline'"
          :aria-pressed="!isRepetitions"
          @click="isRepetitions = false"
        >
          {{ tr("ui.timed") }}
        </GttButton>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GttNumberStepper
          id="desktop-exercise-sets"
          v-model="sets"
          :min="1"
          :label="tr('ui.sets')"
          compact
        />
        <GttNumberStepper
          id="desktop-exercise-value"
          v-model="exerciseValue"
          :large-step="10"
          :label="
            isRepetitions ? tr('ui.repetitions') : tr('ui.duration_seconds')
          "
          compact
        />
      </div>
    </fieldset>
    <div
      v-if="selectedExercise"
      class="grid grid-cols-1 items-end gap-3 border-t border-base-300 pt-4 sm:grid-cols-2"
    >
      <GttToggleField
        id="desktop-set-pause-toggle"
        v-model="hasSetPause"
        :label="tr('ui.rest_between_sets')"
        :disabled="!isPauseAvailable"
        small
        class="h-12"
      />
      <GttNumberStepper
        v-if="hasSetPause && isPauseAvailable"
        id="desktop-set-pause"
        class="pb-0!"
        v-model="pauseBetweenSetsDuration"
        :large-step="10"
        :label="tr('ui.rest_duration_seconds')"
        compact
      />
    </div>
    <details
      v-if="selectedExercise && isRepetitions"
      class="border-t border-base-300 pt-3"
    >
      <summary class="cursor-pointer text-sm text-base-content/65">
        {{ tr("creator.advanced") }}
      </summary>
      <GttNumberStepper
        id="desktop-repetition-interval"
        v-model="repetitionInterval"
        :min="1"
        :label="tr('ui.seconds_per_repetition')"
        compact
        class="mt-3"
      />
    </details>
  </div>
  <div v-else class="flex flex-col gap-5">
    <GttSelectField
      id="exercise_muscle_group"
      v-model="selectedMuscleGroupId"
      :options="trainingMuscleGroups"
      :label="tr('ui.muscle_group')"
      :placeholder="tr('ui.choose_a_muscle_group')"
      required
      compact
    />
    <GttSelectField
      id="exercise"
      v-model="selectedExerciseId"
      :options="localizedExercises(availableExercises ?? [])"
      :label="tr('ui.exercise')"
      value-key="name"
      :placeholder="tr('ui.choose_an_exercise')"
      :disabled="!selectedMuscleGroupId"
      required
      compact
    />
    <div class="flex flex-col gap-1">
      <WorkoutCreatorDurationRepetitionField
        id="exercise_value"
        v-model="exerciseValue"
        :label="
          isRepetitions ? tr('ui.repetitions') : tr('ui.duration_seconds')
        "
      />
      <GttToggleField
        id="exercise-mode-toggle"
        v-model="isRepetitions"
        :off-label="tr('ui.timed')"
        :label="tr('ui.repetitions')"
        small
        inline
      />
    </div>
    <WorkoutCreatorDurationRepetitionField
      v-if="isRepetitions"
      id="exercise_repetition_interval"
      v-model="repetitionInterval"
      :label="tr('ui.seconds_per_repetition')"
    />
    <WorkoutCreatorDurationRepetitionField
      id="exercise_sets"
      v-model="sets"
      :label="tr('ui.sets')"
    />
    <div class="flex flex-col gap-1">
      <GttToggleField
        id="exercise-set-pause-toggle"
        v-model="hasSetPause"
        :label="tr('ui.rest_between_sets')"
        :disabled="!isPauseAvailable"
        small
      />
      <WorkoutCreatorDurationRepetitionField
        v-if="hasSetPause && isPauseAvailable"
        id="exercise_set_pause"
        v-model="pauseBetweenSetsDuration"
        :label="tr('ui.rest_duration_seconds')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import GttInputField from "@/components/generic/form/GttInputField.vue";
import GttNumberStepper from "@/components/generic/form/GttNumberStepper.vue";
import GttSelectField from "@/components/generic/form/GttSelectField.vue";
import GttToggleField from "@/components/generic/form/GttToggleField.vue";
import {
  useWaveBinderMultiNode,
  useWaveBinderNode,
} from "@/composables/useWaveBinderNode";
import { DEFAULT_REPETITION_INTERVAL_SECONDS } from "@/constants";
import { muscleGroups, type Exercise } from "@/domain/exercises";
import { localizedExerciseName, localizedExercises, tr } from "@/localization";
import { exercisesRef } from "@/stores/exercises";
import {
  getExerciseStepNode,
  selectedExerciseNode,
} from "@/wavebinder/exerciseStep";
import { Check } from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import WorkoutCreatorDurationRepetitionField from "./WorkoutCreatorDurationRepetitionField.vue";

defineProps<{ desktop?: boolean }>();
const search = ref("");
const catalogGroup = ref<string | undefined>("");
const catalogGroups = computed(() => [
  { id: "", label: tr("creator.allGroups") },
  ...trainingMuscleGroups.value,
]);
const filteredExercises = computed(() =>
  exercisesRef.value.filter(
    (exercise) =>
      trainingMuscleGroups.value.some(
        (group) => group.id === exercise.muscleGroupId,
      ) &&
      (!catalogGroup.value || exercise.muscleGroupId === catalogGroup.value) &&
      localizedExerciseName(exercise)
        .toLocaleLowerCase()
        .includes(search.value.trim().toLocaleLowerCase()),
  ),
);
const selectedExercise = computed(() =>
  exercisesRef.value.find(
    (exercise) => exercise.id === selectedExerciseId.value,
  ),
);
function pickExercise(exercise: Exercise) {
  getExerciseStepNode("selectedMuscleGroupId").next(exercise.muscleGroupId);
  const node = selectedExerciseNode();
  const index = node.choices.findIndex((choice) => choice.id === exercise.id);
  if (index >= 0) {
    node.setSelection(index);
    isPickerOpen.value = false;
  }
}

const selectedMuscleGroupIdNode = useWaveBinderNode<string | null>(
  getExerciseStepNode("selectedMuscleGroupId"),
);
const { selectedId: selectedExerciseId, choices: availableExercises } =
  useWaveBinderMultiNode<Exercise>(selectedExerciseNode());
const isPickerOpen = ref(!selectedExerciseId.value);
const mode = useWaveBinderNode<"duration" | "repetitions">(
  getExerciseStepNode("exerciseMode"),
);
const exerciseValueNumber = useWaveBinderNode<number>(
  getExerciseStepNode("exerciseValue"),
);
const repetitionIntervalNumber = useWaveBinderNode<number>(
  getExerciseStepNode("repetitionIntervalSeconds"),
);
const setsNumber = useWaveBinderNode<number>(getExerciseStepNode("sets"));
const hasSetPause = useWaveBinderNode<boolean>(
  getExerciseStepNode("hasSetPause"),
);
const pauseDurationNumber = useWaveBinderNode<number>(
  getExerciseStepNode("pauseBetweenSetsDuration"),
);
const isPauseAvailable = useWaveBinderNode<boolean>(
  getExerciseStepNode("isPauseAvailable"),
);

const { t } = useI18n();
const trainingMuscleGroups = computed(() =>
  muscleGroups
    .filter(({ id }) => id !== "WARMUP" && id !== "STRETCHING")
    .map(({ id }) => ({ id, label: t(`muscleGroups.${id}`) })),
);
const selectedMuscleGroupId = computed<string | undefined>({
  get: () => selectedMuscleGroupIdNode.value ?? undefined,
  set: (value) => {
    selectedMuscleGroupIdNode.value = value ?? null;
  },
});
const isRepetitions = computed({
  get: () => mode.value === "repetitions",
  set: (value: boolean) => {
    mode.value = value ? "repetitions" : "duration";
  },
});
const exerciseValue = computed({
  get: () => String(exerciseValueNumber.value ?? 0),
  set: (value: string) => {
    exerciseValueNumber.value = Math.max(0, Number(value));
  },
});
const repetitionInterval = computed({
  get: () =>
    String(
      repetitionIntervalNumber.value ?? DEFAULT_REPETITION_INTERVAL_SECONDS,
    ),
  set: (value: string) => {
    repetitionIntervalNumber.value = Number(value);
  },
});
const sets = computed({
  get: () => String(setsNumber.value ?? 1),
  set: (value: string) => {
    setsNumber.value = Math.max(1, Number(value));
  },
});
const pauseBetweenSetsDuration = computed({
  get: () => String(pauseDurationNumber.value ?? 0),
  set: (value: string) => {
    pauseDurationNumber.value = Math.max(0, Number(value));
  },
});
watch(isPauseAvailable, (available) => {
  if (!available) hasSetPause.value = false;
});
</script>

<style scoped>
/* Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4 · execution summary */
.creator-execution-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-ui-xs);
  padding: var(--space-ui-md);
  border: 1px solid var(--color-ui-rule);
  border-radius: var(--radius-box);
  background: var(--color-base-100);
  text-align: center;
}
.creator-execution-summary dt {
  font-size: var(--text-ui-small);
  color: var(--color-ui-muted);
  overflow-wrap: anywhere;
}
.creator-execution-summary dd {
  margin-top: var(--space-ui-xs);
  color: var(--color-primary);
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.creator-execution-summary dd.is-empty {
  color: var(--color-ui-muted);
  font-size: 1.5rem;
}
</style>
