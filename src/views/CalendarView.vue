<template>
  <section
    class="calendar-page mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col"
  >
    <header class="planner-header">
      <div class="planner-heading">
        <p class="text-sm text-base-content/65">{{ tr("planner.title") }}</p>
        <h1 class="text-2xl font-bold capitalize">{{ calendarLabel }}</h1>
      </div>
      <div class="planner-controls">
        <div class="flex items-center gap-1">
          <GttButton
            mode="ghost"
            shape="square"
            :aria-label="
              calendarView === 'month'
                ? tr('ui.previous_month')
                : tr('ui.previous_week')
            "
            @click="movePeriod(-1)"
            ><ChevronLeft :size="20"
          /></GttButton>
          <GttButton mode="outline" @click="goToToday">{{
            tr("ui.today")
          }}</GttButton>
          <GttButton
            mode="ghost"
            shape="square"
            :aria-label="
              calendarView === 'month'
                ? tr('ui.next_month')
                : tr('ui.next_week')
            "
            @click="movePeriod(1)"
            ><ChevronRight :size="20"
          /></GttButton>
        </div>
        <div class="join" role="group" :aria-label="tr('ui.calendar_view')">
          <GttButton
            mode="ghost"
            class="join-item"
            :class="{ 'planner-view-active': calendarView === 'month' }"
            :aria-pressed="calendarView === 'month'"
            @click="calendarView = 'month'"
            >{{ tr("ui.month") }}</GttButton
          >
          <GttButton
            mode="ghost"
            class="join-item"
            :class="{ 'planner-view-active': calendarView === 'week' }"
            :aria-pressed="calendarView === 'week'"
            @click="calendarView = 'week'"
            >{{ tr("ui.week") }}</GttButton
          >
        </div>
      </div>
    </header>
    <div class="calendar-body planner-body">
      <div class="planner-overview">
        <div v-if="calendarView === 'month'" class="calendar">
          <div class="calendar-weekdays">
            <span v-for="weekday in weekdays" :key="weekday">{{
              weekday
            }}</span>
          </div>
          <div
            class="calendar-grid"
            :style="{ '--calendar-rows': calendarDays.length / 7 }"
          >
            <GttButton
              unstyled
              v-for="day in calendarDays"
              :key="day.key"
              class="calendar-day"
              :class="{
                'calendar-day--other-month': !day.isCurrentMonth,
                'calendar-day--today': day.isToday,
                'calendar-day--selected': day.key === selectedMonthDay,
              }"
              :aria-pressed="day.key === selectedMonthDay"
              :aria-label="dayAccessibleLabel(day)"
              @click="selectDay(day.key)"
            >
              <time class="calendar-day-number" :datetime="day.key">{{
                day.date.getDate()
              }}</time>
              <span
                class="calendar-day-count"
                :class="{ invisible: !entriesForDate(day.key).length }"
                aria-hidden="true"
                >{{ entriesForDate(day.key).length }}</span
              >
              <div class="calendar-events">
                <div
                  v-for="entry in entriesForDate(day.key).slice(0, 2)"
                  :key="entry.id"
                  class="calendar-event"
                >
                  <Check
                    v-if="entry.completed"
                    :size="12"
                    class="shrink-0 text-primary"
                    aria-hidden="true"
                  /><Clock3
                    v-else
                    :size="12"
                    class="shrink-0 text-base-content/65"
                    aria-hidden="true"
                  /><span v-if="entry.time" class="calendar-event-time">{{
                    entry.time
                  }}</span
                  ><span class="calendar-event-name">{{
                    workoutName(entry.workoutId)
                  }}</span>
                </div>
                <span
                  v-if="entriesForDate(day.key).length > 2"
                  class="calendar-more"
                  >{{
                    tr("messages.calendarMore", {
                      count: entriesForDate(day.key).length - 2,
                    })
                  }}</span
                >
              </div>
            </GttButton>
          </div>
        </div>
        <div v-else class="week-calendar">
          <GttButton
            unstyled
            v-for="day in weekDays"
            :key="day.key"
            class="week-day-row"
            :class="{
              'week-day-row--today': day.isToday,
              'week-day-row--selected': day.key === selectedMonthDay,
            }"
            :aria-pressed="day.key === selectedMonthDay"
            :aria-label="dayAccessibleLabel(day)"
            @click="selectDay(day.key)"
          >
            <time class="week-day-heading" :datetime="day.key"
              >{{ weekdayLabel(day.date)
              }}<strong>{{ day.date.getDate() }}</strong></time
            >
            <div class="week-day-events">
              <div
                v-for="entry in entriesForDate(day.key)"
                :key="entry.id"
                class="week-workout"
              >
                <Check
                  v-if="entry.completed"
                  :size="16"
                  class="shrink-0 text-primary"
                  aria-hidden="true"
                /><span class="week-workout-name">{{
                  workoutName(entry.workoutId)
                }}</span
                ><span v-if="entry.time" class="week-workout-time">{{
                  entry.time
                }}</span>
              </div>
              <span
                v-if="!entriesForDate(day.key).length"
                class="text-sm text-base-content/60"
                >{{ tr("visual.emptyDay") }}</span
              >
            </div>
          </GttButton>
        </div>
        <p class="planner-legend">
          <span class="flex items-center gap-1"
            ><Clock3 :size="14" />{{ tr("planner.scheduled") }}</span
          ><span class="flex items-center gap-1"
            ><Check :size="14" class="text-primary" />{{
              tr("planner.completed")
            }}</span
          >
        </p>
      </div>
      <section
        class="calendar-day-detail planner-detail"
        aria-labelledby="calendar-day-detail-title"
      >
        <p class="planner-detail-eyebrow text-xs font-semibold text-base-content/65">
          {{ tr("visual.dayDetails") }}
        </p>
        <h2
          id="calendar-day-detail-title"
          class="mt-1 text-xl font-bold capitalize"
        >
          <span class="planner-detail-date">{{ selectedDayLabel }}</span>
          <span class="planner-detail-mobile-title">{{ tr("visual.dayDetails") }}</span>
        </h2>
        <GttButton
          color="primary"
          class="planner-desktop-action w-full mt-4"
          @click="openDay(selectedMonthDay)"
          ><Plus :size="18" aria-hidden="true" />{{ tr("visual.planDay") }}</GttButton
        >
        <ul v-if="selectedDayWorkouts.length" class="planner-detail-list">
          <li
            v-for="entry in selectedDayWorkouts"
            :key="entry.id"
            class="planner-session"
          >
            <div class="flex items-center justify-between gap-2 text-sm">
              <span
                class="flex items-center gap-1"
                :class="
                  entry.completed ? 'text-primary' : 'text-base-content/65'
                "
                ><Check v-if="entry.completed" :size="16" /><Clock3
                  v-else
                  :size="16"
                />{{
                  tr(
                    entry.completed ? "planner.completed" : "planner.scheduled",
                  )
                }}</span
              ><time v-if="entry.time" class="tabular-nums font-semibold">{{
                entry.time
              }}</time>
            </div>
            <h3 class="mt-2 font-bold wrap-break-word">
              {{ workoutName(entry.workoutId) }}
            </h3>
            <p
              v-if="entry.minutes || entry.completed"
              class="mt-1 text-sm text-base-content/65"
            >
              {{
                tr(entry.completed ? "planner.duration" : "planner.estimate", {
                  minutes: entry.minutes,
                })
              }}
            </p>
            <RouterLink
              v-if="entry.completed"
              to="/history"
              class="planner-session-link"
              >{{ tr("planner.history") }}</RouterLink
            >
            <GttButton
              v-else
              mode="ghost"
              size="sm"
              class="mt-2"
              @click="openDay(selectedMonthDay)"
              >{{ tr("planner.manage") }}</GttButton
            >
          </li>
        </ul>
        <div v-else class="planner-empty">
          <Dumbbell :size="28" class="planner-empty-icon text-base-content/50" aria-hidden="true" />
          <div>
            <p class="planner-empty-title font-semibold">{{ tr("visual.emptyDay") }}</p>
            <p class="mt-1 text-sm text-base-content/65">
              {{ tr("planner.emptyHint") }}
            </p>
          </div>
        </div>

      </section>
    </div>
    <div class="planner-mobile-action">
      <time :datetime="selectedMonthDay" class="planner-action-date">{{ selectedDayLabel }}</time>
      <GttButton
        color="primary"
        :aria-label="`${tr('visual.planDay')}: ${selectedDayLabel}`"
        @click="openDay(selectedMonthDay)"
        ><Plus :size="18" aria-hidden="true" />{{ tr("visual.planDay") }}</GttButton
      >
    </div>
    <CalendarDayModal
      v-model="isDayModalOpen"
      :date="selectedDate"
      :preselected-workout-id="workoutForSelectedDay"
      @update:model-value="onDayModalUpdate"
    />
  </section>
</template>

<script setup lang="ts">
import CalendarDayModal from "@/components/calendar/CalendarDayModal.vue";
import { appLocale, tr } from "@/localization";
import {
  workoutsRef,
  workoutEstimatedDuration,
} from "@/stores/workoutCreator";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  Check,
  Clock3,
} from "@lucide/vue";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useWorkoutInsights } from "@/composables/useWorkoutInsights";
import { sessionMinutes } from "@/domain/workoutInsights";

type CalendarDay = {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const weekdays = computed(() =>
  Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(appLocale(), { weekday: "short" }).format(
      new Date(2024, 0, 1 + index),
    ),
  ),
);
type CalendarView = "month" | "week";
const route = useRoute();
const router = useRouter();
const currentDate = ref(new Date());
const calendarView = ref<CalendarView>("month");
const selectedDate = ref<string>();
const pendingWorkoutId = ref<string>();
const workoutForSelectedDay = ref<string>();
const isDayModalOpen = ref(false);

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayKey = dateKey(new Date());
const selectedMonthDay = ref(todayKey);
const selectedDayWorkouts = computed(() =>
  entriesForDate(selectedMonthDay.value),
);
const selectedDayLabel = computed(() =>
  new Intl.DateTimeFormat(appLocale(), {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date(`${selectedMonthDay.value}T12:00:00`)),
);
function dayAccessibleLabel(day: CalendarDay) {
  const label = new Intl.DateTimeFormat(appLocale(), {
    dateStyle: "full",
  }).format(day.date);
  return `${label}, ${tr("planner.dayCount", { count: workoutsForDate(day.key).length })}`;
}
function selectDay(date: string) {
  selectedMonthDay.value = date;
  if (pendingWorkoutId.value) openDay(date);
}
watch(calendarView, () => {
  currentDate.value = new Date(`${selectedMonthDay.value}T12:00:00`);
});
watch(currentDate, (date) => {
  const selected = new Date(`${selectedMonthDay.value}T12:00:00`);
  if (calendarView.value === "week") {
    if (!weekDays.value.some((day) => day.key === selectedMonthDay.value))
      selectedMonthDay.value = weekDays.value[0]!.key;
    return;
  }
  if (
    selected.getMonth() !== date.getMonth() ||
    selected.getFullYear() !== date.getFullYear()
  ) {
    selectedMonthDay.value = dateKey(
      new Date(date.getFullYear(), date.getMonth(), 1),
    );
  }
});

watch(
  () => route.query.workout,
  (workout) => {
    pendingWorkoutId.value = typeof workout === "string" ? workout : undefined;
  },
  { immediate: true },
);

const calendarLabel = computed(() => {
  if (calendarView.value === "month") {
    return new Intl.DateTimeFormat(appLocale(), {
      month: "long",
      year: "numeric",
    }).format(currentDate.value);
  }

  const start = weekDays.value[0];
  const end = weekDays.value[6];
  return new Intl.DateTimeFormat(appLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatRange(start.date, end.date);
});
const calendarDays = computed<CalendarDay[]>(() => {
  const firstDay = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    1,
  );
  firstDay.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  const lastDay = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    0,
  );
  const count =
    Math.ceil(
      (Math.round((lastDay.getTime() - firstDay.getTime()) / 86400000) + 1) / 7,
    ) * 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    const key = dateKey(date);
    return {
      date,
      key,
      isCurrentMonth: date.getMonth() === currentDate.value.getMonth(),
      isToday: key === todayKey,
    };
  });
});
const weekDays = computed<CalendarDay[]>(() => {
  const firstDay = new Date(currentDate.value);
  firstDay.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    const key = dateKey(date);
    return { date, key, isCurrentMonth: true, isToday: key === todayKey };
  });
});

const { pendingWorkouts: pending, completedSessions } = useWorkoutInsights();
function estimatedMinutes(id: string) {
  const workout = workoutsRef.value.find((item) => item.id === id);
  return workout ? Math.ceil(workoutEstimatedDuration(workout) / 60) : 0;
}
function entriesForDate(date: string) {
  const planned = pending.value
    .filter((item) => item.date === date)
    .map((item) => ({
      id: item.id,
      workoutId: item.workoutId,
      time: item.time,
      sortTime: item.time,
      completed: false,
      minutes: estimatedMinutes(item.workoutId),
    }));
  const completed = completedSessions.value
    .filter(
      (session) =>
        session.completedAt && dateKey(new Date(session.completedAt)) === date,
    )
    .map((session) => ({
      id: session.id,
      workoutId: session.workoutId,
      completed: true,
      sortTime: `${pad(new Date(session.startedAt).getHours())}:${pad(new Date(session.startedAt).getMinutes())}`,
      time: new Intl.DateTimeFormat(appLocale(), {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(session.startedAt)),
      minutes: sessionMinutes(session),
    }));
  return [...planned, ...completed].sort((a, b) =>
    (a.sortTime || "24:00").localeCompare(b.sortTime || "24:00"),
  );
}
function workoutsForDate(date: string) {
  return entriesForDate(date);
}
function workoutName(workoutId: string) {
  return (
    workoutsRef.value.find((workout) => workout.id === workoutId)?.name ??
    tr("ui.deleted_workout")
  );
}
function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat(appLocale(), { weekday: "short" }).format(
    date,
  );
}
function movePeriod(amount: number) {
  const nextDate = new Date(currentDate.value);
  if (calendarView.value === "month") {
    nextDate.setDate(1);
    nextDate.setMonth(nextDate.getMonth() + amount);
  } else nextDate.setDate(nextDate.getDate() + amount * 7);
  currentDate.value = nextDate;
}
function goToToday() {
  selectedMonthDay.value = todayKey;
  currentDate.value = new Date();
}
function openDay(date: string) {
  selectedDate.value = date;
  workoutForSelectedDay.value = pendingWorkoutId.value;
  pendingWorkoutId.value = undefined;
  isDayModalOpen.value = true;
  if (route.query.workout) router.replace({ name: "calendar" });
}
function onDayModalUpdate(isOpen: boolean) {
  isDayModalOpen.value = isOpen;
  if (!isOpen) {
    workoutForSelectedDay.value = undefined;
  }
}
</script>

<style scoped>
/* Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4
 * Training planner: month overview + day inspector, persistent mobile action.
 * Existing training theme and shared button states preserved. */
.planner-header {
  flex-shrink: 0;
}
.planner-mobile-action {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-ui-sm);
  padding-top: var(--space-ui-sm);
  margin-top: var(--space-ui-sm);
  border-top: 1px solid var(--color-ui-rule);
  background: var(--color-base-100);
}
.planner-action-date {
  min-width: 0;
  font-size: var(--text-ui-small);
  font-weight: 600;
  text-transform: capitalize;
  overflow-wrap: anywhere;
}
.planner-mobile-action .btn {
  flex-shrink: 0;
}
.planner-desktop-action,
.planner-detail-mobile-title {
  display: none;
}
.planner-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: end;
  gap: var(--space-ui-md);
  margin-bottom: var(--space-ui-lg);
}
.planner-heading {
  min-width: 0;
}
.planner-heading h1 {
  overflow-wrap: anywhere;
}
.planner-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-ui-xs);
}
.planner-view-active {
  background: var(--color-base-200);
  color: var(--color-primary);
}
.calendar-page .planner-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: var(--space-ui-lg);
  overflow-y: auto;
}
.planner-overview {
  min-width: 0;
}
.calendar-page .calendar {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-ui-rule);
  border-radius: var(--radius-box);
  background: var(--color-base-100);
  overflow: hidden;
  min-height: 0;
}
.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.calendar-page .calendar-grid {
  grid-template-rows: repeat(var(--calendar-rows), minmax(3.25rem, 1fr));
}
.calendar-weekdays span {
  padding: var(--space-ui-sm) 0;
  text-align: center;
  font-size: var(--text-ui-small);
  color: var(--color-ui-muted);
}
.calendar-page .calendar-day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  gap: 0.125rem;
  padding: var(--space-ui-xs);
  border-top: 1px solid var(--color-base-200);
  border-right: 1px solid var(--color-base-200);
  background: var(--color-base-100);
}
.calendar-day:nth-child(7n) {
  border-right: 0;
}
.calendar-page .calendar-day--other-month {
  background: var(--color-base-200);
  color: var(--color-ui-muted);
}
.calendar-page .calendar-day--selected {
  box-shadow: inset 0 0 0 2px var(--color-primary);
}
.calendar-day-number {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  font-size: var(--text-ui-small);
  font-weight: 600;
}
.calendar-day--today .calendar-day-number {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
.calendar-page .calendar-day-count {
  display: block;
  font-size: 0.6875rem;
  height: auto;
  color: var(--color-primary);
}
.calendar-page .calendar-events {
  display: none;
}
.calendar-event {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  min-width: 0;
}
.calendar-event-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.calendar-event-time {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  color: var(--color-ui-muted);
}
.calendar-more {
  font-size: 0.75rem;
  color: var(--color-primary);
}
.calendar-page .week-calendar {
  display: flex;
  flex-direction: column;
  overflow: visible;
  border: 1px solid var(--color-ui-rule);
  border-radius: var(--radius-box);
  background: var(--color-base-100);
}
.calendar-page .week-day-row {
  display: flex;
  min-height: 5rem;
  align-items: center;
  gap: var(--space-ui-md);
  padding: var(--space-ui-md);
  border-bottom: 1px solid var(--color-base-200);
  text-align: left;
}
.week-day-row:last-child {
  border-bottom: 0;
}
.week-day-row--selected {
  box-shadow: inset 3px 0 var(--color-primary);
}
.calendar-page .week-day-heading {
  display: flex;
  flex-direction: column;
  width: 2.5rem;
  flex-shrink: 0;
  text-transform: capitalize;
  font-size: var(--text-ui-small);
}
.week-day-heading strong {
  font-size: 1.5rem;
}
.week-day-row--today .week-day-heading {
  color: var(--color-primary);
}
.calendar-page .week-day-events {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: var(--space-ui-xs);
}
.calendar-page .week-workout {
  display: flex;
  align-items: center;
  gap: var(--space-ui-xs);
  font-size: var(--text-ui-small);
}
.week-workout-name {
  min-width: 0;
  flex: 1;
  overflow-wrap: anywhere;
  text-align: left;
  font-weight: 600;
}
.week-workout-time {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.planner-legend {
  display: flex;
  gap: var(--space-ui-md);
  margin-top: var(--space-ui-sm);
  font-size: 0.75rem;
  color: var(--color-ui-muted);
}
.calendar-page .planner-detail {
  display: block;
  padding: var(--space-ui-lg);
  border: 1px solid var(--color-ui-rule);
  border-radius: var(--radius-box);
  background: var(--color-base-100);
  min-width: 0;
}
.planner-detail-list {
  margin-top: var(--space-ui-lg);
}
.planner-session {
  padding-block: var(--space-ui-md);
  border-top: 1px solid var(--color-base-200);
}
.planner-session-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--size-ui-control);
  font-size: var(--text-ui-small);
  color: var(--color-primary);
  font-weight: 600;
}
.planner-empty {
  padding-block: var(--space-ui-md);
}
.planner-empty-title {
  margin-top: var(--space-ui-sm);
}
.calendar-day:hover,
.week-day-row:hover {
  background: var(--color-base-200);
}
.planner-session-link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}
@media (max-width: 63.9375rem) {
  .calendar-page .planner-detail {
    padding: 0;
    border: 0;
    border-radius: 0;
  }
  .planner-detail-eyebrow,
  .planner-detail-date {
    display: none;
  }
  .planner-detail-mobile-title {
    display: inline;
    text-transform: none;
  }
  .calendar-page .planner-detail h2 {
    margin-top: 0;
    font-size: var(--text-ui-small);
  }
  .planner-detail-list {
    margin-top: var(--space-ui-xs);
  }
  .planner-empty {
    display: flex;
    align-items: start;
    gap: var(--space-ui-sm);
    padding-block: var(--space-ui-sm);
  }
  .planner-empty-icon {
    width: var(--space-ui-lg);
    height: var(--space-ui-lg);
    flex-shrink: 0;
  }
  .planner-empty-title {
    margin-top: 0;
  }
  .calendar-page .week-day-row {
    min-height: 4rem;
    padding: var(--space-ui-sm);
  }
}
@media (min-width: 64rem) {
  .planner-mobile-action {
    display: none;
  }
  .planner-desktop-action {
    display: inline-flex;
  }
  .calendar-page .planner-body {
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 19rem);
  }
  .calendar-page .calendar-grid {
    grid-template-rows: repeat(var(--calendar-rows), minmax(5.5rem, 1fr));
  }
  .calendar-page .calendar-day {
    align-items: start;
    justify-content: start;
  }
  .calendar-page .calendar-day-count {
    display: none;
  }
  .calendar-page .calendar-events {
    display: grid;
    width: 100%;
    gap: 0.25rem;
    margin-top: var(--space-ui-xs);
  }
  .calendar-page .planner-detail {
    position: sticky;
    top: 0;
  }
}
</style>
