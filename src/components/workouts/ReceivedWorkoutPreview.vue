<template>
  <div class="space-y-5">
    <p class="text-sm text-base-content/65">
      {{
        t("friends.estimatedMinutes", {
          count: Math.ceil(workoutEstimatedDuration(workout) / 60),
        })
      }}
      · {{ t("friends.steps", { count: steps.length }) }}
    </p>
    <ol class="space-y-3">
      <li
        v-for="(step, index) in steps"
        :key="index"
        class="rounded-box border border-base-300/50 p-4"
      >
        <div class="flex items-start gap-3">
          <span
            class="grid size-7 shrink-0 place-items-center rounded-full bg-base-200 text-xs font-bold tabular-nums"
            >{{ index + 1 }}</span
          >
          <div class="min-w-0 flex-1">
            <p
              class="font-semibold wrap-anywhere"
              :class="phaseColors[step.type]"
            >
              {{
                step.type === "EXERCISE"
                  ? exerciseName(step.exerciseId)
                  : t(`stepTypes.${step.type}`)
              }}
            </p>
            <p
              v-if="step.type === 'EXERCISE'"
              class="mt-1 text-sm text-base-content/65"
            >
              {{ t("friends.previewSets", { count: step.sets ?? 1 }) }} ·
              {{
                step.exerciseModeType === "duration"
                  ? t("friends.previewSeconds", {
                      count: step.exerciseDuration ?? 0,
                    })
                  : t("friends.previewReps", {
                      count: step.exerciseRepetitions ?? 0,
                    })
              }}
            </p>
            <p
              v-if="step.type === 'EXERCISE' && step.hasSetPause"
              class="mt-1 text-xs text-base-content/65"
            >
              {{
                t("friends.previewRest", {
                  count: step.pauseBetweenSetsDuration ?? 0,
                })
              }}
            </p>
            <p
              v-if="step.type === 'PAUSE'"
              class="mt-1 text-sm text-base-content/65"
            >
              {{
                t("friends.previewSeconds", { count: step.pauseDuration ?? 0 })
              }}
            </p>
            <ul
              v-if="step.type === 'WARMUP' || step.type === 'STRETCHING'"
              class="mt-2 space-y-2 text-sm"
            >
              <li
                v-for="item in step.type === 'WARMUP'
                  ? step.warmupExercises
                  : step.stretchingExercises"
                :key="item.id"
                class="wrap-anywhere"
              >
                {{ exerciseName(item.exerciseId) }}
                <span class="text-base-content/65">
                  ·
                  {{
                    "modeType" in item && item.modeType === "repetitions"
                      ? t("friends.previewReps", {
                          count:
                            "repetitions" in item
                              ? Number(item.repetitions)
                              : 0,
                        })
                      : t("friends.previewSeconds", { count: item.duration })
                  }}</span
                >
              </li>
            </ul>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>
<script setup lang="ts">
import type { SharedWorkout } from "@/services/friends";
import { workoutEstimatedDuration } from "@/stores/workoutCreator";
import { exercisesRef } from "@/stores/exercises";
import { localizedExerciseName, tr as t } from "@/localization";
import { computed } from "vue";
const props = defineProps<{ workout: SharedWorkout["workout"] }>();
const steps = computed(() =>
  props.workout.steps.filter((step) => step.type !== "SETPAUSE"),
);
const phaseColors = {
  WARMUP: "text-error",
  EXERCISE: "text-primary",
  PAUSE: "text-info",
  SETPAUSE: "text-info",
  STRETCHING: "text-warning",
};
function exerciseName(id?: string) {
  if (!id) return t("friends.previewUnnamed");
  if (props.workout.exerciseNames?.[id]) return props.workout.exerciseNames[id];
  const exercise = exercisesRef.value.find((item) => item.id === id);
  return exercise
    ? localizedExerciseName(exercise)
    : t("friends.previewUnnamed");
}
</script>
