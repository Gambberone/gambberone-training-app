<template>
  <section class="mx-auto w-full max-w-7xl space-y-8 pb-8">
    <header>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">
        {{ t("history.title") }}
      </h1>
      <p class="mt-2 text-sm text-base-content/65">{{ t("history.intro") }}</p>
    </header>

    <section
      aria-labelledby="history-summary"
      class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
    >
      <div
        class="rounded-box border border-base-300/50 bg-base-100 p-5 shadow-sm sm:p-6"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="history-summary" class="text-lg font-bold">
            {{ currentMonthLabel }}
          </h2>
          <span class="text-sm text-base-content/60">{{
            t("history.thisMonth")
          }}</span>
        </div>
        <dl class="mt-7 grid grid-cols-2 gap-4">
          <div>
            <dd
              class="text-4xl font-bold tabular-nums text-primary sm:text-5xl"
            >
              {{ currentMonthSessions.length }}
            </dd>
            <dt class="mt-2 text-sm text-base-content/65">
              {{ t("history.sessions") }}
            </dt>
          </div>
          <div>
            <dd class="text-4xl font-bold tabular-nums sm:text-5xl">
              {{ currentMonthMinutes }}
            </dd>
            <dt class="mt-2 text-sm text-base-content/65">
              {{ t("history.minutes") }}
            </dt>
          </div>
        </dl>
      </div>
      <div
        class="rounded-box border border-base-300/50 bg-base-100 p-5 shadow-sm sm:p-6"
      >
        <h2 class="text-lg font-bold">{{ t("history.previousMonth") }}</h2>
        <p class="mt-1 text-sm capitalize text-base-content/60">
          {{ previousMonthLabel }}
        </p>
        <p class="mt-6 text-2xl font-bold tabular-nums">
          {{ previousMonthSessions.length }}
          <span class="text-sm font-normal text-base-content/60">{{
            t("history.sessions")
          }}</span>
        </p>
        <p class="mt-2 text-sm text-base-content/65">
          {{ t("history.minutesValue", { count: previousMonthMinutes }) }}
        </p>
      </div>
    </section>

    <section aria-labelledby="history-list-heading">
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h2 id="history-list-heading" class="text-xl font-bold">
            {{ t("history.allSessions") }}
          </h2>
          <p class="mt-1 text-sm text-base-content/60">
            {{ t("history.results", { count: filteredSessions.length }) }}
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:w-[28rem]">
          <label class="form-control min-w-0">
            <span
              class="mb-1 block text-xs font-semibold text-base-content/65"
              >{{ t("history.period") }}</span
            >
            <select
              v-model="period"
              class="select select-bordered w-full bg-base-100"
              :aria-label="t('history.period')"
            >
              <option value="all">{{ t("history.allTime") }}</option>
              <option value="30">{{ t("history.last30Days") }}</option>
              <option value="90">{{ t("history.last90Days") }}</option>
              <option value="365">{{ t("history.lastYear") }}</option>
            </select>
          </label>
          <label class="form-control min-w-0">
            <span
              class="mb-1 block text-xs font-semibold text-base-content/65"
              >{{ t("history.workout") }}</span
            >
            <select
              v-model="selectedWorkout"
              class="select select-bordered w-full bg-base-100"
              :aria-label="t('history.workout')"
            >
              <option value="all">{{ t("history.allWorkouts") }}</option>
              <option
                v-for="workout in sessionWorkouts"
                :key="workout.id"
                :value="workout.id"
              >
                {{ workout.name }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <div
        v-if="!completedSessions.length"
        class="mt-5 rounded-box border border-base-300/50 bg-base-100 px-6 py-12 text-center shadow-sm"
      >
        <CalendarCheck2
          class="mx-auto size-10 text-primary"
          aria-hidden="true"
        />
        <h3 class="mt-4 text-lg font-bold">{{ t("history.emptyTitle") }}</h3>
        <p class="mx-auto mt-2 max-w-md text-sm text-base-content/65">
          {{ t("history.emptyDescription") }}
        </p>
        <RouterLink to="/workouts" class="btn btn-primary mt-5">{{
          t("history.goToWorkouts")
        }}</RouterLink>
      </div>
      <div
        v-else-if="!filteredSessions.length"
        class="mt-5 rounded-box border border-base-300/50 bg-base-100 px-6 py-10 text-center shadow-sm"
      >
        <h3 class="text-lg font-bold">{{ t("history.noResults") }}</h3>
        <p class="mt-2 text-sm text-base-content/65">
          {{ t("history.changeFilters") }}
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-sm mt-4"
          @click="resetFilters"
        >
          {{ t("history.resetFilters") }}
        </button>
      </div>
      <div v-else class="mt-5 space-y-6">
        <section
          v-for="group in groupedSessions"
          :key="group.key"
          :aria-label="group.label"
        >
          <h3
            class="mb-3 text-sm font-semibold capitalize text-base-content/65"
          >
            {{ group.label }}
          </h3>
          <ul
            class="overflow-hidden rounded-box border border-base-300/50 bg-base-100 shadow-sm"
          >
            <li
              v-for="(session, index) in group.sessions"
              :key="session.id"
              class="grid gap-2 px-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:px-5"
              :class="{ 'border-t border-base-300/50': index > 0 }"
            >
              <time
                class="text-sm font-semibold text-primary"
                :datetime="session.completedAt"
                >{{ dayLabel(session.completedAt!) }}</time
              >
              <div class="min-w-0">
                <p class="truncate font-semibold">
                  {{ workoutName(session.workoutId) }}
                </p>
                <p class="mt-0.5 text-xs text-base-content/60">
                  {{ timeLabel(session.completedAt!) }}
                </p>
              </div>
              <span
                class="text-sm tabular-nums text-base-content/65 sm:text-right"
                >{{
                  t("history.minutesValue", { count: sessionMinutes(session) })
                }}</span
              >
            </li>
          </ul>
        </section>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { WorkoutSession } from "@/constants";
import { workoutSessionsRef, workoutsRef } from "@/stores/workoutCreator";
import { CalendarCheck2 } from "@lucide/vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const period = ref("all");
const selectedWorkout = ref("all");
const now = new Date();
const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const monthFormatter = (date: Date) =>
  new Intl.DateTimeFormat(locale.value, {
    month: "long",
    year: "numeric",
  }).format(date);
const currentMonthLabel = computed(() => monthFormatter(currentMonthStart));
const previousMonthLabel = computed(() => monthFormatter(previousMonthStart));
const completedSessions = computed(() =>
  workoutSessionsRef.value
    .filter(
      (session) =>
        session.completedAt && Number.isFinite(Date.parse(session.completedAt)),
    )
    .sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!)),
);
const currentMonthSessions = computed(() =>
  completedSessions.value.filter(
    (session) =>
      Date.parse(session.completedAt!) >= currentMonthStart.getTime(),
  ),
);
const previousMonthSessions = computed(() =>
  completedSessions.value.filter((session) => {
    const completed = Date.parse(session.completedAt!);
    return (
      completed >= previousMonthStart.getTime() &&
      completed < currentMonthStart.getTime()
    );
  }),
);
function sessionMinutes(session: WorkoutSession) {
  const elapsed =
    Date.parse(session.completedAt ?? "") - Date.parse(session.startedAt);
  return Number.isFinite(elapsed)
    ? Math.max(0, Math.round(elapsed / 60000))
    : 0;
}
const currentMonthMinutes = computed(() =>
  currentMonthSessions.value.reduce(
    (total, session) => total + sessionMinutes(session),
    0,
  ),
);
const previousMonthMinutes = computed(() =>
  previousMonthSessions.value.reduce(
    (total, session) => total + sessionMinutes(session),
    0,
  ),
);
const sessionWorkouts = computed(() =>
  [...new Set(completedSessions.value.map((session) => session.workoutId))]
    .map((id) => ({ id, name: workoutName(id) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale.value)),
);
const filteredSessions = computed(() =>
  completedSessions.value.filter((session) => {
    if (
      selectedWorkout.value !== "all" &&
      session.workoutId !== selectedWorkout.value
    )
      return false;
    if (period.value === "all") return true;
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    cutoff.setDate(cutoff.getDate() - Number(period.value) + 1);
    return Date.parse(session.completedAt!) >= cutoff.getTime();
  }),
);
const groupedSessions = computed(() => {
  const groups = new Map<
    string,
    { key: string; label: string; sessions: WorkoutSession[] }
  >();
  for (const session of filteredSessions.value) {
    const date = new Date(session.completedAt!);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!groups.has(key))
      groups.set(key, { key, label: monthFormatter(date), sessions: [] });
    groups.get(key)!.sessions.push(session);
  }
  return [...groups.values()];
});
function workoutName(id: string) {
  return (
    workoutsRef.value.find((workout) => workout.id === id)?.name ??
    t("ui.deleted_workout")
  );
}
function dayLabel(value: string) {
  return new Intl.DateTimeFormat(locale.value, {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}
function timeLabel(value: string) {
  return new Intl.DateTimeFormat(locale.value, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
function resetFilters() {
  period.value = "all";
  selectedWorkout.value = "all";
}
</script>
