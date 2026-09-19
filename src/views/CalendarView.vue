<template>
  <section class="mx-auto max-w-5xl">
    <header class="mb-5">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-primary capitalize">{{ monthLabel }}</h1>
        <div class="flex items-center gap-1">
          <button
            class="btn btn-ghost btn-sm btn-circle"
            type="button"
            aria-label="Mese precedente"
            @click="moveMonth(-1)"
          >
            <ChevronLeft :size="20" />
          </button>
          <button class="btn btn-primary btn-sm" type="button" @click="goToToday">Oggi</button>
          <button
            class="btn btn-ghost btn-sm btn-circle"
            type="button"
            aria-label="Mese successivo"
            @click="moveMonth(1)"
          >
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>
      <p class="mt-1 text-sm text-base-content/60">Tocca un giorno per programmare un workout.</p>
    </header>

    <div class="calendar card bg-base-200 shadow-sm">
      <div class="calendar-weekdays">
        <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
      </div>
      <div class="calendar-grid">
        <button
          v-for="day in calendarDays"
          :key="day.key"
          class="calendar-day"
          :class="{
            'calendar-day--other-month': !day.isCurrentMonth,
            'calendar-day--today': day.isToday,
          }"
          type="button"
          @click="openDay(day.key)"
        >
          <time class="calendar-day-number" :datetime="day.key">{{ day.date.getDate() }}</time>
          <div class="calendar-events">
            <div
              v-for="scheduledWorkout in workoutsForDate(day.key).slice(0, 2)"
              :key="scheduledWorkout.id"
              class="calendar-event"
              @click.stop="openDay(day.key)"
            >
              {{ workoutName(scheduledWorkout.workoutId) }}{{ scheduledWorkout.time ? ` · ${scheduledWorkout.time}` : '' }}
            </div>
            <span v-if="workoutsForDate(day.key).length > 2" class="calendar-more">
              +{{ workoutsForDate(day.key).length - 2 }} altri
            </span>
          </div>
        </button>
      </div>
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
import { computed, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';
import CalendarDayModal from '../components/calendar/CalendarDayModal.vue';
import { scheduledWorkoutsRef, workoutsRef } from '../stores/workoutCreator';

type CalendarDay = { date: Date; key: string; isCurrentMonth: boolean; isToday: boolean };

const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const route = useRoute();
const router = useRouter();
const currentMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const selectedDate = ref<string>();
const pendingWorkoutId = ref<string>();
const workoutForSelectedDay = ref<string>();
const isDayModalOpen = ref(false);

const pad = (value: number) => String(value).padStart(2, '0');
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayKey = dateKey(new Date());

watch(
  () => route.query.workout,
  (workout) => {
    pendingWorkoutId.value = typeof workout === 'string' ? workout : undefined;
  },
  { immediate: true },
);

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(currentMonth.value),
);
const calendarDays = computed<CalendarDay[]>(() => {
  const firstDay = new Date(currentMonth.value);
  firstDay.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    const key = dateKey(date);
    return {
      date,
      key,
      isCurrentMonth: date.getMonth() === currentMonth.value.getMonth(),
      isToday: key === todayKey,
    };
  });
});

function workoutsForDate(date: string) {
  return scheduledWorkoutsRef.value.filter((scheduledWorkout) => scheduledWorkout.date === date);
}
function workoutName(workoutId: string) {
  return workoutsRef.value.find((workout) => workout.id === workoutId)?.name ?? 'Workout eliminato';
}
function moveMonth(amount: number) {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + amount,
    1,
  );
}
function goToToday() {
  currentMonth.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}
function openDay(date: string) {
  selectedDate.value = date;
  workoutForSelectedDay.value = pendingWorkoutId.value;
  pendingWorkoutId.value = undefined;
  isDayModalOpen.value = true;
  if (route.query.workout) router.replace({ name: 'calendar' });
}
function onDayModalUpdate(isOpen: boolean) {
  isDayModalOpen.value = isOpen;
  if (!isOpen) workoutForSelectedDay.value = undefined;
}
</script>

<style scoped>
.calendar {
  overflow: hidden;
}
.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}
.calendar-weekdays {
  border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 12%, transparent);
}
.calendar-weekdays span {
  padding: 0.75rem 0.25rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: color-mix(in srgb, var(--color-base-content) 60%, transparent);
}
.calendar-day {
  display: flex;
  min-height: 9rem;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  border-right: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
  padding: 0.4rem;
  text-align: left;
  transition: background-color 0.15s;
}
.calendar-day:nth-child(7n) {
  border-right: 0;
}
.calendar-day:hover {
  background: color-mix(in srgb, var(--color-primary) 7%, transparent);
}
.calendar-day--other-month {
  background: color-mix(in srgb, var(--color-base-300) 55%, transparent);
  color: color-mix(in srgb, var(--color-base-content) 40%, transparent);
}
.calendar-day-number {
  display: inline-grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
}
.calendar-day--today .calendar-day-number {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
.calendar-events {
  display: grid;
  width: 100%;
  gap: 0.25rem;
  margin-top: 0.3rem;
}
.calendar-event {
  overflow: hidden;
  border-radius: 0.25rem;
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  padding: 0.2rem 0.35rem;
  color: var(--color-base-content);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.calendar-more {
  padding-left: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-primary);
}
@media (max-width: 480px) {
  .calendar-day {
    min-height: 6.5rem;
    padding: 0.25rem;
  }
  .calendar-weekdays span {
    font-size: 0.65rem;
  }
  .calendar-event {
    padding: 0.18rem 0.25rem;
    font-size: 0.62rem;
  }
}
</style>
