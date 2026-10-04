<template>
  <div class="desktop-creator flex h-full min-h-0 flex-col gap-3 lg:gap-5">
    <header
      class="flex shrink-0 items-end gap-6 border-b border-base-300 pb-3 lg:pb-4"
      :class="{ 'max-lg:hidden': Boolean(currentWorkoutCreatorStep) }"
    >
      <div class="min-w-0 flex-1 [&_.fieldset]:pb-0">
        <GttInputField
          id="desktop-workout-name"
          v-model="workoutName"
          :label="tr('ui.workout_name')"
          compact
          class="h-10"
        />
      </div>
      <div class="hidden shrink-0 lg:block text-right">
        <p class="text-xs text-base-content/65">
          {{ tr("workoutCards.estimatedDuration") }}
        </p>
        <p class="text-xl font-bold tabular-nums">{{ estimatedDuration }}</p>
      </div>
      <GttButton
        color="primary"
        class="hidden h-10 shrink-0 lg:inline-flex"
        type="button"
        :disabled="!canSaveWorkout"
        @click="saveWorkout"
      >
        {{ tr("ui.save_workout") }}
      </GttButton>
    </header>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6"
    >
      <section
        class="flex min-h-0 flex-col gap-4"
        :class="{ 'max-lg:hidden': Boolean(currentWorkoutCreatorStep) }"
        :aria-label="tr('creator.sequence')"
      >
        <div class="flex shrink-0 items-center justify-between gap-3">
          <h2 class="font-semibold">{{ tr("creator.sequence") }}</h2>
          <p
            class="flex items-center gap-2 whitespace-nowrap text-xs text-base-content/60"
          >
            <span>{{ tr("home.steps", { count: visibleSteps.length }) }}</span>
            <span aria-hidden="true">·</span>
            <Clock3 class="size-3.5" aria-hidden="true" />
            <span>{{ estimatedDuration }}</span>
          </p>
        </div>
        <div class="grid shrink-0 grid-cols-2 gap-2">
          <GttButton
            mode="outline"
            v-for="type in addTypes"
            :key="type.type"
            class="h-11 justify-start text-sm"
            :class="type.color"
            type="button"
            :disabled="type.type === 'WARMUP' && hasWarmup"
            @click="navigate(() => startWorkoutCreatorStep(type.type))"
          >
            <component
              :is="phaseStyles[type.type].icon"
              class="size-4"
              aria-hidden="true"
            />{{ tr(`stepTypes.${type.type}`) }}
          </GttButton>
        </div>
        <ol
          ref="stepList"
          class="creator-sequence min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
        >
          <li
            v-for="(step, position) in visibleSteps"
            :key="step.index"
            :data-step-index="step.index"
            class="creator-sequence-step rounded-box border transition-colors"
            :class="
              editingWorkoutCreatorStepIndex === step.index
                ? 'creator-sequence-step--selected border-primary bg-base-100'
                : 'border-base-300 bg-base-100'
            "
          >
            <GttButton
              unstyled
              class="flex w-full items-start gap-3 p-3 text-left hover:bg-base-200/50 focus-visible:outline-2 focus-visible:outline-primary"
              type="button"
              :aria-pressed="editingWorkoutCreatorStepIndex === step.index"
              @click="selectStep(step.index)"
            >
              <span
                class="creator-step-number mt-0.5 shrink-0 text-xs font-semibold tabular-nums text-base-content/65"
                >{{ position + 1 }}</span
              >
              <component
                :is="phaseStyles[step.type].icon"
                class="mt-0.5 size-4 shrink-0"
                :class="phaseStyles[step.type].color"
              />
              <span class="min-w-0 flex-1">
                <span
                  class="block wrap-break-word text-sm font-semibold"
                  :class="phaseStyles[step.type].color"
                  >{{ stepName(step) }}</span
                >
                <span class="mt-1 block text-xs text-base-content/65">{{
                  stepSummary(step)
                }}</span>
              </span>
            </GttButton>
            <div
              class="creator-sequence-tools flex justify-end gap-1 border-t border-base-300/50 px-2 py-1"
            >
              <GttButton
                mode="ghost"
                shape="square"
                class="size-10 lg:btn-xs lg:size-6"
                type="button"
                :disabled="position === 0"
                :aria-label="tr('creator.moveUp')"
                :title="tr('creator.moveUp')"
                @click="moveStep(step.index, -1)"
              >
                <ArrowUp class="size-3.5" />
              </GttButton>
              <GttButton
                mode="ghost"
                shape="square"
                class="size-10 lg:btn-xs lg:size-6"
                type="button"
                :disabled="position === visibleSteps.length - 1"
                :aria-label="tr('creator.moveDown')"
                :title="tr('creator.moveDown')"
                @click="moveStep(step.index, 1)"
              >
                <ArrowDown class="size-3.5" />
              </GttButton>
              <GttButton
                mode="ghost"
                shape="square"
                class="size-10 lg:btn-xs lg:size-6"
                type="button"
                :disabled="step.type === 'WARMUP'"
                :aria-label="tr('creator.duplicate')"
                :title="tr('creator.duplicate')"
                @click="duplicateStep(step.index)"
              >
                <Copy class="size-3.5" />
              </GttButton>
              <GttButton
                mode="ghost"
                shape="square"
                class="size-10 text-error lg:btn-xs lg:size-6"
                type="button"
                :aria-label="tr('ui.delete_step')"
                :title="tr('ui.delete_step')"
                @click="deleteStep(step.index)"
              >
                <Trash2 class="size-3.5" />
              </GttButton>
            </div>
          </li>
          <li
            v-if="
              currentWorkoutCreatorStep &&
              editingWorkoutCreatorStepIndex === undefined
            "
            class="rounded-box border border-dashed border-current p-3 text-sm"
            :class="phaseStyles[currentWorkoutCreatorStep.type].color"
          >
            {{
              tr("creator.newStep", {
                type: tr(`stepTypes.${currentWorkoutCreatorStep.type}`),
              })
            }}
          </li>
          <li
            v-if="!visibleSteps.length && !currentWorkoutCreatorStep"
            class="py-8 text-sm leading-relaxed text-base-content/60"
          >
            {{ tr("creator.emptySequence") }}
          </li>
        </ol>
      </section>

      <section
        class="flex min-h-0 flex-col lg:rounded-box lg:border lg:border-base-300 lg:bg-base-200/30"
        :class="{ 'max-lg:hidden': !currentWorkoutCreatorStep }"
      >
        <template v-if="currentWorkoutCreatorStep">
          <div
            class="creator-step-heading flex shrink-0 items-center justify-between gap-3 border-b border-base-300 px-2 py-3 lg:px-5 lg:py-4"
          >
            <div class="min-w-0">
              <p class="text-xs font-semibold text-base-content/65">
                {{ stepPositionLabel }}
              </p>
              <h2
                class="mt-1 font-bold wrap-break-word"
                :class="phaseStyles[currentWorkoutCreatorStep.type].color"
              >
                {{ stepName(currentWorkoutCreatorStep) }}
              </h2>
            </div>
            <span class="shrink-0 text-xs text-base-content/65">{{
              tr("creator.sequenceDuration", { duration: estimatedDuration })
            }}</span>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto px-2 py-2 lg:p-5">
            <WorkoutCreatorExerciseAction
              v-if="currentWorkoutCreatorStep.type === 'EXERCISE'"
              :key="editorKey"
              desktop
            />
            <WorkoutCreatorWarmupAction
              v-else-if="currentWorkoutCreatorStep.type === 'WARMUP'"
              :key="editorKey"
            />
            <WorkoutCreatorStretchingAction
              v-else-if="currentWorkoutCreatorStep.type === 'STRETCHING'"
              :key="editorKey"
            />
            <WorkoutCreatorPauseAction v-else :key="editorKey" desktop />
            <ul
              v-if="showErrors && validationErrors.length"
              class="mt-4 space-y-1 text-sm text-error"
              role="alert"
            >
              <li v-for="error in validationErrors" :key="error">
                {{ localizedValidationMessage(error) }}
              </li>
            </ul>
          </div>
          <footer
            class="creator-step-actions flex flex-wrap shrink-0 items-center justify-end gap-2 border-t border-base-300 bg-base-100/90 px-1 py-3 backdrop-blur-sm lg:bg-transparent lg:p-4"
          >
            <GttButton
              mode="ghost"
              size="sm"
              class="hidden lg:inline-flex"
              type="button"
              @click="emit('cancel-step')"
            >
              {{ tr("ui.cancel") }}
            </GttButton>
            <GttButton
              mode="ghost"
              size="sm"
              v-if="
                currentWorkoutCreatorStep.type === 'EXERCISE' &&
                editingWorkoutCreatorStepIndex === undefined
              "
              class="min-w-0 flex-1 whitespace-nowrap lg:flex-none"
              type="button"
              :disabled="!stepValid"
              @click="saveAndContinue"
            >
              {{ tr("creator.addContinue") }}
            </GttButton>
            <GttButton
              mode="outline"
              color="primary"
              size="sm"
              class="min-w-0 flex-1 whitespace-nowrap lg:flex-none"
              type="button"
              :disabled="!stepValid"
              @click="commitStep"
            >
              <span class="lg:hidden">{{ tr("ui.save_step") }}</span
              ><span class="hidden lg:inline">{{
                editingWorkoutCreatorStepIndex === undefined
                  ? tr("creator.addStep")
                  : tr("ui.save_step")
              }}</span>
            </GttButton>
            <p class="w-full text-xs text-base-content/65 lg:text-right">
              {{ tr("creator.stepSaveHint") }}
            </p>
          </footer>
        </template>
        <div
          v-else
          class="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
        >
          <Dumbbell class="size-8 text-primary" />
          <h2 class="text-lg font-semibold">{{ tr("creator.chooseStep") }}</h2>
          <p class="max-w-sm text-sm leading-relaxed text-base-content/60">
            {{ tr("creator.editorHint") }}
          </p>
        </div>
      </section>
    </div>
    <footer
      v-if="!currentWorkoutCreatorStep"
      class="shrink-0 border-t border-base-300 bg-base-100/90 px-1 py-3 backdrop-blur-sm lg:hidden"
    >
      <GttButton
        color="primary"
        class="w-full"
        type="button"
        :disabled="!canSaveWorkout"
        @click="saveWorkout"
      >
        {{ tr("ui.save_workout") }}
      </GttButton>
    </footer>
  </div>
</template>

<script setup lang="ts">
import GttInputField from "@/components/generic/form/GttInputField.vue";
import type { WorkoutCreatorStep } from "@/constants";
import {
  duplicateWorkoutStep,
  moveWorkoutStep,
  removeWorkoutStep,
} from "@/domain/workoutSequence";
import {
  localizedExerciseName,
  localizedValidationMessage,
  tr,
} from "@/localization";
import { exercisesRef } from "@/stores/exercises";
import {
  createWorkoutCreatorStep,
  currentWorkoutCreatorStep,
  currentWorkoutCreatorStepValidationErrors,
  editingWorkoutCreatorStepIndex,
  editWorkoutCreatorStep,
  returnToWorkoutCreatorOverview,
  startWorkoutCreatorStep,
  workoutCreatorDraft,
} from "@/stores/workoutCreator";
import { estimateWorkoutDuration } from "@/wavebinder/duration";
import {
  ArrowDown,
  ArrowUp,
  Clock3,
  Copy,
  Dumbbell,
  Flame,
  LineSquiggle,
  Pause,
  Trash2,
} from "@lucide/vue";
import { computed, nextTick, ref, watch } from "vue";
import WorkoutCreatorWarmupAction from "./warmup/WorkoutCreatorWarmupAction.vue";
import WorkoutCreatorExerciseAction from "./WorkoutCreatorExerciseAction.vue";
import WorkoutCreatorPauseAction from "./WorkoutCreatorPauseAction.vue";
import WorkoutCreatorStretchingAction from "./WorkoutCreatorStretchingAction.vue";

const props = defineProps<{ exerciseErrors: string[] }>();
const emit = defineEmits<{ save: []; "cancel-step": [] }>();
const showErrors = ref(false);
const stepList = ref<HTMLOListElement>();
const editorRevision = ref(0);
const phaseStyles = {
  WARMUP: { icon: Flame, color: "text-error" },
  EXERCISE: { icon: Dumbbell, color: "text-primary" },
  PAUSE: { icon: Pause, color: "text-info" },
  STRETCHING: { icon: LineSquiggle, color: "text-warning" },
  SETPAUSE: { icon: Pause, color: "text-info" },
};
const addTypes = [
  { type: "EXERCISE" as const, color: "text-primary" },
  { type: "PAUSE" as const, color: "text-info" },
  { type: "WARMUP" as const, color: "text-error" },
  { type: "STRETCHING" as const, color: "text-warning" },
];
const workoutName = computed({
  get: () => workoutCreatorDraft.value.name,
  set: (name: string) => {
    workoutCreatorDraft.value.name = name;
  },
});
const visibleSteps = computed(() =>
  workoutCreatorDraft.value.steps
    .map((step, index) => ({ ...step, index }))
    .filter((step) => step.type !== "SETPAUSE"),
);
const stepPositionLabel = computed(() => {
  const position = visibleSteps.value.findIndex(
    (step) => step.index === editingWorkoutCreatorStepIndex.value,
  );
  return position < 0
    ? tr("creator.newPosition", { number: visibleSteps.value.length + 1 })
    : tr("creator.stepPosition", {
        number: position + 1,
        total: visibleSteps.value.length,
      });
});
const hasWarmup = computed(
  () =>
    workoutCreatorDraft.value.steps.some((step) => step.type === "WARMUP") ||
    currentWorkoutCreatorStep.value?.type === "WARMUP",
);
const editorKey = computed(
  () =>
    `${currentWorkoutCreatorStep.value?.type}-${editingWorkoutCreatorStepIndex.value ?? "new"}-${editorRevision.value}`,
);
const validationErrors = computed(() =>
  currentWorkoutCreatorStep.value?.type === "EXERCISE"
    ? props.exerciseErrors
    : currentWorkoutCreatorStepValidationErrors(),
);
const stepValid = computed(() => validationErrors.value.length === 0);
const canSaveWorkout = computed(
  () =>
    Boolean(workoutName.value.trim()) &&
    Boolean(visibleSteps.value.length || currentWorkoutCreatorStep.value) &&
    (!currentWorkoutCreatorStep.value || stepValid.value),
);
const estimatedDuration = computed(() =>
  durationLabel(estimateWorkoutDuration(workoutCreatorDraft.value.steps)),
);
watch(currentWorkoutCreatorStep, () => {
  showErrors.value = false;
});

function durationLabel(seconds: number) {
  if (!seconds) return tr("ui.untimed");
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return [minutes ? `${minutes} min` : "", rest ? `${rest} s` : ""]
    .filter(Boolean)
    .join(" ");
}
function stepName(step: WorkoutCreatorStep) {
  const exercise =
    step.type === "EXERCISE"
      ? exercisesRef.value.find((item) => item.id === step.exerciseId)
      : undefined;
  return exercise
    ? localizedExerciseName(exercise)
    : tr(`stepTypes.${step.type}`);
}
function stepSummary(step: WorkoutCreatorStep) {
  const duration = durationLabel(estimateWorkoutDuration([step]));
  if (step.type === "EXERCISE") {
    const value =
      step.exerciseModeType === "duration"
        ? `${step.exerciseDuration ?? 0} s`
        : tr("creator.repetitionCount", {
            count: step.exerciseRepetitions ?? 0,
          });
    return `${step.sets} × ${value}${step.hasSetPause && step.sets > 1 ? ` · ${tr("creator.recovery", { seconds: step.pauseBetweenSetsDuration })}` : ""} · ${duration}`;
  }
  if (step.type === "WARMUP" || step.type === "STRETCHING") {
    const count =
      (step.type === "WARMUP" ? step.warmupExercises : step.stretchingExercises)
        ?.length ?? 0;
    return `${tr("workoutCards.exerciseCount", { count })} · ${duration}`;
  }
  return duration;
}
function commitStep() {
  if (!stepValid.value) {
    showErrors.value = true;
    return false;
  }
  const position =
    editingWorkoutCreatorStepIndex.value === undefined
      ? visibleSteps.value.length
      : visibleSteps.value.findIndex(
          (step) => step.index === editingWorkoutCreatorStepIndex.value,
        );
  createWorkoutCreatorStep();
  if (
    !currentWorkoutCreatorStep.value &&
    window.matchMedia("(max-width: 1023px)").matches
  ) {
    void nextTick(() => {
      const step =
        stepList.value?.querySelectorAll<HTMLLIElement>("[data-step-index]")[
          position
        ];
      step?.scrollIntoView({ block: "nearest" });
      step
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    });
  }
  showErrors.value = false;
  return !currentWorkoutCreatorStep.value;
}
function navigate(action: () => void) {
  if (currentWorkoutCreatorStep.value && !commitStep()) return;
  action();
}
function selectStep(index: number) {
  if (editingWorkoutCreatorStepIndex.value === index) return;
  // Committing an exercise can insert or remove its hidden recovery step.
  const position = visibleSteps.value.findIndex((step) => step.index === index);
  navigate(() => {
    const target = visibleSteps.value[position];
    if (target) editWorkoutCreatorStep(target.index);
  });
}
function saveAndContinue() {
  navigate(() => {
    editorRevision.value += 1;
    startWorkoutCreatorStep("EXERCISE");
  });
}
function saveWorkout() {
  navigate(() => emit("save"));
}
function moveStep(index: number, direction: -1 | 1) {
  const position = visibleSteps.value.findIndex((step) => step.index === index);
  navigate(() => {
    const target = visibleSteps.value[position];
    if (target)
      workoutCreatorDraft.value.steps = moveWorkoutStep(
        workoutCreatorDraft.value.steps,
        target.index,
        direction,
      );
  });
}
function deleteStep(index: number) {
  const steps = workoutCreatorDraft.value.steps;
  const updated = removeWorkoutStep(steps, index);
  const editingIndex = editingWorkoutCreatorStepIndex.value;
  if (editingIndex === index) {
    returnToWorkoutCreatorOverview();
    showErrors.value = false;
  } else if (editingIndex !== undefined && editingIndex > index) {
    editingWorkoutCreatorStepIndex.value =
      editingIndex - (steps.length - updated.length);
  }
  workoutCreatorDraft.value.steps = updated;
}
function duplicateStep(index: number) {
  const position = visibleSteps.value.findIndex((step) => step.index === index);
  navigate(() => {
    const target = visibleSteps.value[position];
    if (target)
      workoutCreatorDraft.value.steps = duplicateWorkoutStep(
        workoutCreatorDraft.value.steps,
        target.index,
      );
  });
}
</script>

<style scoped>
/* Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4
 * desktop workout editor · utilitarian · existing training theme
 * structure: persistent sequence / detail editor · motion: focus and hover only
 */
.desktop-creator :deep(button:focus-visible) {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.creator-sequence {
  padding-inline-start: var(--space-ui-sm);
}
.creator-sequence-step {
  position: relative;
}
.creator-sequence-step + .creator-sequence-step::before {
  content: "";
  position: absolute;
  inset-inline-start: 1.5rem;
  top: calc(var(--space-ui-xs) * -1 - 1px);
  height: var(--space-ui-xs);
  border-inline-start: 2px solid var(--color-ui-rule);
}
.creator-step-number {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--color-ui-rule);
  border-radius: 50%;
  background: var(--color-base-100);
}
.creator-sequence-step--selected {
  box-shadow: inset 3px 0 var(--color-primary);
}
.creator-sequence-step--selected .creator-step-number {
  background: var(--color-primary);
  color: var(--color-primary-content);
  border-color: var(--color-primary);
}
.creator-step-heading h2 {
  overflow-wrap: anywhere;
}
@media (max-width: 25rem) {
  .creator-step-actions > .btn {
    flex-basis: 100%;
  }
}
</style>
