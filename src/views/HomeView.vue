<template>
  <section class="mx-auto w-full max-w-7xl home-page">
    <header class="mb-7">
      <p class="mb-1 text-sm font-semibold text-primary">{{ todayLabel }}</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">
        {{ greeting }}<span v-if="userName" class="text-primary">{{ userName }}</span>
      </h1>
      <p class="mt-2 text-base-content/65">{{ t('home.intro') }}</p>
    </header>

    <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div class="flex min-w-0 flex-col">
        <div
          v-if="todayWorkouts.length"
          class="home-today card border border-primary/30 bg-base-100 p-5 space-y-3"
        >
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-bold text-base-content">
              {{ t('home.today', todayWorkouts.length) }}
            </h2>
          </div>

          <article
            v-for="(scheduledWorkout, index) in todayWorkouts"
            :key="scheduledWorkout.id"
            class="relative py-4"
            :class="{ 'border-t border-base-300/50': index > 0 }"
          >
            <span
              v-if="scheduledWorkout.time"
              class="home-workout-time badge badge-primary badge-outline h-auto gap-1.5 px-3 py-2 text-sm font-semibold"
            >
              <Clock3 :size="18" />
              {{ scheduledWorkout.time
              }}<span
                v-if="isAgendaWorkoutExpired(scheduledWorkout, currentTime)"
                class="text-warning"
              >
                · {{ t('home.expired') }}</span
              >
            </span>
            <div class="flex flex-col gap-4">
              <div class="flex items-start gap-4">
                <div
                  class="grid size-12 shrink-0 place-items-center rounded-box bg-primary text-primary-content"
                >
                  <Dumbbell :size="23" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-primary">{{ workoutLabel(index) }}</p>
                  <h3 class="truncate text-xl font-bold text-base-content">
                    {{ workoutName(scheduledWorkout.workoutId) }}
                  </h3>
                  <p class="mt-1 text-sm text-base-content/60">
                    {{ workoutDetails(scheduledWorkout.workoutId) }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <GttButton color="primary" size="sm"
                  
                  type="button"
                  @click="startWorkout(scheduledWorkout.workoutId, scheduledWorkout.id)"
                >
                  <Play :size="17" />
                  {{ t('home.start') }}
                </GttButton>
                <RouterLink class="btn btn-outline btn-primary btn-sm" to="/calendar">
                  {{ t('home.calendar') }}
                  <ArrowRight :size="17" />
                </RouterLink>
              </div>
            </div>
          </article>
        </div>

        <article v-else class="home-rest card border border-base-300/50 bg-base-100 p-5">
          <div class="flex items-start gap-3">
            <div class="grid size-11 shrink-0 place-items-center rounded-box bg-base-200 text-primary">
              <FaceGrinning :size="24" />
            </div>
            <div class="min-w-0">
              <h2 class="text-xl font-bold">{{ t('home.rest') }}</h2>
              <p class="mt-1 text-sm text-base-content/65">{{ t('home.recoveryDescription') }}</p>
            </div>
          </div>
          <div v-if="nextWorkout" class="home-next mt-5 border-t border-base-300/50 pt-4">
            <p class="text-xs font-semibold text-base-content/65">{{ t('home.nextWorkout') }}</p>
            <h3 class="mt-1 text-lg font-bold wrap-break-word">{{ workoutName(nextWorkout.workoutId) }}</h3>
            <p class="mt-1 text-sm text-primary">{{ nextWorkoutDate }}<span v-if="nextWorkout.time"> · {{ nextWorkout.time }}</span></p>
            <p class="mt-1 text-sm text-base-content/65">{{ workoutDetails(nextWorkout.workoutId) }}</p>
          </div>
          <RouterLink class="btn btn-outline mt-5 self-start" to="/calendar">
            <CalendarPlus :size="18" />{{ t(nextWorkout ? 'home.calendar' : 'home.schedule') }}
          </RouterLink>
        </article>
      </div>
      <aside
        class="flex min-w-0 flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-stretch"
      >
        <section
          class="home-summary flex-1 p-5"
          aria-labelledby="summary-heading"
        >
          <h2 id="summary-heading" class="text-lg font-bold">{{ t('home.summary') }}</h2>
          <p class="mt-1 text-sm text-base-content/60">{{ t('home.period') }}</p>
          <dl class="mt-6 grid grid-cols-2 gap-4">
            <div>
              <dd class="text-4xl font-bold tabular-nums">{{ weekSessions.length }}</dd>
              <dt class="mt-1 text-sm text-base-content/65">{{ t('home.completedWorkouts') }}</dt>
            </div>
            <div>
              <dd class="text-4xl font-bold tabular-nums">
                {{ weeklyMinutes }}<span class="ml-1 text-sm font-normal">min</span>
              </dd>
              <dt class="mt-1 text-sm text-base-content/65">{{ t('home.sessionTime') }}</dt>
            </div>
          </dl>
          <WorkoutTrend class="lg:mt-6" />
        </section>
      </aside>
      <section
        class="home-agenda lg:col-start-1 lg:row-start-2"
        aria-labelledby="week-heading"
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 id="week-heading" class="text-lg font-bold">{{ t('home.agenda') }}</h2>
          <RouterLink to="/calendar" class="text-sm font-semibold text-primary"
            >{{ t('home.calendar') }} →</RouterLink
          >
        </div>
        <div
          id="home-agenda-days"
          class="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:items-stretch lg:gap-2"
        >
          <GttButton unstyled
            v-for="day in weekDays"
            :key="day.key"
            type="button"
            aria-haspopup="dialog"
            @click="openAgendaDay(day.key)"
            :aria-label="
              t('home.dayLabel', {
                day: day.label,
                number: day.number,
                scheduled: day.scheduled.length,
                completed: day.completed.length,
              })
            "
            class="home-agenda-day flex min-w-0 flex-col rounded-box border text-left"
            :class="[
              day.key === todayKey
                ? 'home-agenda-day--today gap-3 border-primary bg-base-100 p-4 '
                : 'gap-2 border-base-300/50 bg-base-100 p-3',
            ]"
          >
            <span class="text-xs capitalize text-base-content/60">{{ day.label }}</span>
            <span class="font-bold" :class="day.key === todayKey ? 'text-2xl' : 'text-lg'">{{
              day.number
            }}</span>
            <p v-if="day.completed.length" class="line-clamp-2 text-xs font-medium text-primary">
              ✓
              {{
                t(
                  'home.completedSummary',
                  {
                    count: day.completed.length,
                    minutes: day.completed.reduce(
                      (total, session) => total + sessionMinutes(session),
                      0,
                    ),
                  },
                  day.completed.length,
                )
              }}
            </p>
            <div v-if="day.scheduled.length" class="space-y-3">
              <div v-for="workout in day.scheduled.slice(0, 2)" :key="workout.id" class="text-sm">
                <p class="truncate font-semibold text-base-content">
                  {{ workoutName(workout.workoutId) }}
                </p>
                <p
                  class="mt-1 text-xs"
                  :class="
                    isAgendaWorkoutExpired(workout, currentTime)
                      ? 'text-warning'
                      : 'text-base-content/60'
                  "
                >
                  {{
                    t(
                      isAgendaWorkoutExpired(workout, currentTime)
                        ? 'home.expired'
                        : 'home.scheduled',
                    )
                  }}<span v-if="workout.time"> · {{ workout.time }}</span>
                </p>
              </div>
            </div>
            <span v-if="day.scheduled.length > 2" class="text-xs font-semibold text-primary">
              {{ t('messages.calendarMore', { count: day.scheduled.length - 2 }) }}
            </span>
            <span
              v-if="!day.completed.length && !day.scheduled.length"
              class="text-sm text-base-content/65"
              >{{ t(day.key > todayKey ? 'home.emptyFuture' : 'home.empty') }}</span
            >
          </GttButton>
        </div>
      </section>
    </div>
    <GttModal v-model="isAgendaDayOpen" :title="agendaDayLabel">
      <div v-if="selectedAgendaDay" class="space-y-5">
        <section v-if="selectedAgendaDay.scheduled.length" class="space-y-2">
          <h3 class="font-semibold">{{ t('home.scheduledHeading') }}</h3>
          <div
            v-for="workout in selectedAgendaDay.scheduled"
            :key="workout.id"
            class="flex items-center gap-3 rounded-box bg-base-200 p-3"
          >
            <Dumbbell :size="18" class="shrink-0 text-primary" />
            <span class="min-w-0 flex-1 wrap-break-word font-medium">{{
              workoutName(workout.workoutId)
            }}</span>
            <span
              class="shrink-0 text-sm"
              :class="
                isAgendaWorkoutExpired(workout, currentTime)
                  ? 'text-warning'
                  : 'text-base-content/60'
              "
            >
              {{
                t(isAgendaWorkoutExpired(workout, currentTime) ? 'home.expired' : 'home.scheduled')
              }}<span v-if="workout.time"> · {{ workout.time }}</span>
            </span>
          </div>
        </section>
        <section v-if="selectedAgendaDay.completed.length" class="space-y-2">
          <h3 class="font-semibold">{{ t('home.completedHeading') }}</h3>
          <div
            v-for="session in selectedAgendaDay.completed"
            :key="session.id"
            class="rounded-box bg-base-200 p-3"
          >
            <p class="wrap-break-word font-medium">{{ workoutName(session.workoutId) }}</p>
            <p class="mt-1 text-sm text-primary">
              {{ t('home.completed') }} · {{ sessionMinutes(session) }} min
            </p>
          </div>
        </section>
        <p
          v-if="!selectedAgendaDay.scheduled.length && !selectedAgendaDay.completed.length"
          class="text-sm text-base-content/60"
        >
          {{ t(selectedAgendaDay.key > todayKey ? 'home.emptyFuture' : 'home.empty') }}
        </p>
      </div>
    </GttModal>
  </section>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import type { WorkoutSession } from '@/constants';
import { isAgendaWorkoutExpired, pendingAgendaWorkouts } from '@/domain/agenda';
import {
  scheduledWorkoutsRef,
  startWorkoutSession,
  workoutEstimatedDuration,
  workoutSessionsRef,
  workoutsRef,
} from '@/stores/workoutCreator';
import { ArrowRight, CalendarPlus, Clock3, Dumbbell, FaceGrinning, Play } from '@lucide/vue';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const WorkoutTrend = defineAsyncComponent(() => import('@/components/home/WorkoutTrend.vue'));
const { t, locale } = useI18n();

const { currentUser } = useAuth();

const pad = (value: number) => String(value).padStart(2, '0');
const currentTime = ref(Date.now());
let agendaClock: ReturnType<typeof setInterval>;
onMounted(() => {
  agendaClock = setInterval(() => {
    currentTime.value = Date.now();
  }, 15000);
});
onUnmounted(() => clearInterval(agendaClock));
const now = new Date();
const pendingWorkouts = computed(() =>
  pendingAgendaWorkouts(scheduledWorkoutsRef.value, workoutSessionsRef.value),
);
const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const todayLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now),
);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.morning');
  if (hour < 18) return t('home.afternoon');
  return t('home.evening');
});

const userName = computed(() => {
  if (!currentUser.value) return '';
  if (currentUser.value.displayName) return currentUser.value.displayName;

  const emailName = currentUser.value.email?.split('@')[0] ?? '';
  return emailName.replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
});

const nextWorkout = computed(() => pendingWorkouts.value.find(item => item.date > todayKey));
const nextWorkoutDate = computed(() => nextWorkout.value
  ? new Intl.DateTimeFormat(locale.value, { weekday: 'long', day: 'numeric', month: 'long' })
      .format(new Date(`${nextWorkout.value.date}T12:00:00`)) : '');

const todayWorkouts = computed(() =>
  pendingWorkouts.value.filter((scheduledWorkout) => scheduledWorkout.date === todayKey),
);

function workoutName(workoutId: string) {
  return workoutsRef.value.find((workout) => workout.id === workoutId)?.name ?? t('home.deleted');
}

function workoutDetails(workoutId: string) {
  const workout = workoutsRef.value.find((item) => item.id === workoutId);
  if (!workout) return t('home.unavailable');
  const minutes = Math.ceil(workoutEstimatedDuration(workout) / 60);
  return (
    t('home.steps', { count: workout.steps.length }, workout.steps.length) +
    (minutes ? ` · ${t('home.estimate', { minutes })}` : '')
  );
}

const localKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
const weekDays = computed(() =>
  Array.from({ length: 4 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date.setDate(date.getDate() + index);
    const key = localKey(date);
    return {
      key,
      number: date.getDate(),
      label: new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(date),
      completed: workoutSessionsRef.value.filter(
        (session) => session.completedAt && localKey(new Date(session.completedAt)) === key,
      ),
      scheduled: pendingWorkouts.value
        .filter((item) => item.date === key)
        .sort((a, b) => {
          if (!a.time) return b.time ? 1 : 0;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        }),
    };
  }),
);
const isAgendaDayOpen = ref(false);
const selectedAgendaDate = ref<string>();
const selectedAgendaDay = computed(() =>
  weekDays.value.find((day) => day.key === selectedAgendaDate.value),
);
const agendaDayLabel = computed(() =>
  selectedAgendaDate.value
    ? new Intl.DateTimeFormat(locale.value, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(`${selectedAgendaDate.value}T12:00:00`))
    : '',
);
function openAgendaDay(date: string) {
  selectedAgendaDate.value = date;
  isAgendaDayOpen.value = true;
}

const weekSessions = computed(() =>
  workoutSessionsRef.value.filter(
    (session) =>
      session.completedAt &&
      Date.parse(session.completedAt) >= weekStart.getTime() &&
      Date.parse(session.completedAt) <= Date.now(),
  ),
);
function sessionMinutes(session: WorkoutSession) {
  return Math.max(
    0,
    Math.round(
      (Date.parse(session.completedAt ?? session.startedAt) - Date.parse(session.startedAt)) /
        60000,
    ),
  );
}
const weeklyMinutes = computed(() =>
  weekSessions.value.reduce((total, session) => total + sessionMinutes(session), 0),
);
function workoutLabel(index: number) {
  return index === 0 ? t('home.focus') : t('home.number', { number: index + 1 });
}

function startWorkout(workoutId: string, scheduledWorkoutId?: string) {
  startWorkoutSession(workoutId, scheduledWorkoutId);
}
</script>
