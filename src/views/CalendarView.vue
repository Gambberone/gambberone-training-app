<template>
  <section class="mx-auto w-full max-w-7xl">
    <header class="mb-5">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-2xl font-bold text-primary capitalize">{{ calendarLabel }}</h1>
        <div class="flex items-center gap-1">
          <button
            class="btn btn-ghost btn-sm btn-circle"
            type="button"
            :aria-label="calendarView === 'month' ? 'Mese precedente' : 'Settimana precedente'"
            @click="movePeriod(-1)"
          >
            <ChevronLeft :size="20" />
          </button>
          <button class="btn btn-primary btn-sm" type="button" @click="goToToday">Oggi</button>
          <button
            class="btn btn-ghost btn-sm btn-circle"
            type="button"
            :aria-label="calendarView === 'month' ? 'Mese successivo' : 'Settimana successiva'"
            @click="movePeriod(1)"
          >
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>
      <div class="mt-3 flex items-center justify-between gap-3">
        <p class="text-sm text-base-content/60">Tocca un giorno per programmare un workout.</p>
        <div class="join shrink-0" aria-label="Vista calendario">
          <button
            class="btn btn-sm join-item"
            :class="{ 'btn-primary': calendarView === 'month' }"
            type="button"
            @click="calendarView = 'month'"
          >
            Mese
          </button>
          <button
            class="btn btn-sm join-item"
            :class="{ 'btn-primary': calendarView === 'week' }"
            type="button"
            @click="calendarView = 'week'"
          >
            Settimana
          </button>
        </div>
      </div>
    </header>

    <div v-if="calendarView === 'month'" class="calendar card bg-base-200 shadow-sm">
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
              class="calendar-event gap-1"
              @click.stop="openDay(day.key)"
            >
              <span class="calendar-event-name">{{ workoutName(scheduledWorkout.workoutId) }}</span>
              <span v-if="scheduledWorkout.time" class="calendar-event-time">{{
                scheduledWorkout.time
              }}</span>
            </div>
            <span v-if="workoutsForDate(day.key).length > 2" class="calendar-more">
              +{{ workoutsForDate(day.key).length - 2 }} altri
            </span>
          </div>
        </button>
      </div>
    </div>

    <div v-else class="week-calendar card bg-base-200 shadow-sm">
      <button
        v-for="day in weekDays"
        :key="day.key"
        class="week-day-row"
        :class="{ 'week-day-row--today': day.isToday }"
        type="button"
        @click="openDay(day.key)"
      >
        <time class="week-day-heading" :datetime="day.key">
          {{ weekdayLabel(day.date) }} <strong>{{ day.date.getDate() }}</strong>
        </time>
        <div
          class="week-day-events"
          :class="{ 'week-day-events--single': workoutsForDate(day.key).length === 1 }"
        >
          <div
            v-for="scheduledWorkout in workoutsForDate(day.key).slice(0, 2)"
            :key="scheduledWorkout.id"
            class="week-workout gap-1"
          >
            <span class="week-workout-name">{{ workoutName(scheduledWorkout.workoutId) }}</span>
            <span v-if="scheduledWorkout.time" class="week-workout-time">{{
              scheduledWorkout.time
            }}</span>
          </div>
          <span v-if="workoutsForDate(day.key).length > 2" class="calendar-more">
            +{{ workoutsForDate(day.key).length - 2 }} altri
          </span>
        </div>
      </button>
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
import CalendarDayModal from '@/components/calendar/CalendarDayModal.vue';
import { scheduledWorkoutsRef, workoutsRef } from '@/stores/workoutCreator';

type CalendarDay = { date: Date; key: string; isCurrentMonth: boolean; isToday: boolean };

const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
type CalendarView = 'month' | 'week';
const route = useRoute();
const router = useRouter();
const currentDate = ref(new Date());
const calendarView = ref<CalendarView>('month');
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

const calendarLabel = computed(() => {
  if (calendarView.value === 'month') {
    return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(
      currentDate.value,
    );
  }

  const [start, end] = weekDays.value;
  const startLabel = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(
    start.date,
  );
  const endLabel = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(end.date);
  return `${startLabel} – ${endLabel}`;
});
const calendarDays = computed<CalendarDay[]>(() => {
  const firstDay = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1);
  firstDay.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
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

function workoutsForDate(date: string) {
  return scheduledWorkoutsRef.value.filter((scheduledWorkout) => scheduledWorkout.date === date);
}
function workoutName(workoutId: string) {
  return workoutsRef.value.find((workout) => workout.id === workoutId)?.name ?? 'Workout eliminato';
}
function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(date);
}
function movePeriod(amount: number) {
  const nextDate = new Date(currentDate.value);
  if (calendarView.value === 'month') nextDate.setMonth(nextDate.getMonth() + amount);
  else nextDate.setDate(nextDate.getDate() + amount * 7);
  currentDate.value = nextDate;
}
function goToToday() {
  currentDate.value = new Date();
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
  if (!isOpen) {
    workoutForSelectedDay.value = undefined;
  }
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
  min-height: 7.5rem;
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
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
}
.calendar-day--today .calendar-day-number {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
.week-calendar {
  overflow: hidden;
}
.week-day-row {
  display: flex;
  width: 100%;
  min-height: 3.75rem;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
  padding: 0.75rem;
  text-align: left;
}
.week-day-row:hover {
  background: color-mix(in srgb, var(--color-primary) 7%, transparent);
}
.week-day-heading {
  width: 5.5rem;
  flex: 0 0 auto;
  text-transform: capitalize;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-base-content) 65%, transparent);
}
.week-day-row--today .week-day-heading {
  color: var(--color-primary);
}
.week-day-heading strong {
  margin-left: 0.15rem;
  font-size: 1rem;
  color: var(--color-base-content);
}
.week-day-events {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.week-day-events--single .week-workout {
  width: 100%;
}
.week-day-events > .calendar-more {
  align-self: center;
}
.week-workout {
  display: flex;
  min-height: 2.25rem;
  align-items: center;
  border-radius: 0.25rem;
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
}
.week-workout-name {
  font-weight: 700;
}
.week-workout-time {
  font-weight: 400;
}
.calendar-events {
  display: grid;
  width: 100%;
  gap: 0.25rem;
  margin-top: 0.3rem;
}
.calendar-event {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0.25rem;
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  padding: 0.2rem 0.35rem;
  color: var(--color-base-content);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.1;
}
.calendar-event-name {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.calendar-event-time {
  font-weight: 400;
}
.calendar-more {
  padding-left: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-primary);
}
@media (max-width: 480px) {
  .calendar-day {
    min-height: 5.5rem;
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
