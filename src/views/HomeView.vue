<template>
  <section class="mx-auto w-full max-w-7xl">
    <header class="mb-7">
      <p class="mb-1 text-sm font-semibold text-primary">{{ todayLabel }}</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content">
        {{ greeting
        }}<span v-if="userName" class="text-primary">{{ userName }}</span>
      </h1>
      <p class="mt-2 text-base-content/65">{{ t('home.intro') }}</p>
    </header>

    <div class="grid items-stretch gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div class="flex min-w-0 flex-col">
        <div v-if="todayWorkouts.length" class="card border border-base-300/50 bg-base-100 h-full p-5 shadow-sm space-y-3">
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
              class="badge badge-primary badge-outline absolute top-4 right-0 h-auto gap-1.5 px-3 py-2 text-base font-semibold"
            >
              <Clock3 :size="18" />
              {{ scheduledWorkout.time }}
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
                <button
                  class="btn btn-primary btn-sm"
                  type="button"
                  @click="startWorkout(scheduledWorkout.workoutId)"
                >
                  <Play :size="17" />
                  {{ t('home.start') }}
                </button>
                <RouterLink class="btn btn-outline btn-primary btn-sm" to="/calendar">
                  {{ t('home.calendar') }}
                  <ArrowRight :size="17" />
                </RouterLink>
              </div>
            </div>
          </article>
        </div>

        <article v-else class="card h-full overflow-hidden border border-base-300/50 bg-base-100 shadow-sm">
          <div class="card-body items-center px-6 py-6 text-center lg:items-start lg:text-left">
            <div class="grid size-16 place-items-center rounded-full bg-success/15 text-success">
              <FaceGrinning :size="31" />
            </div>
            <h2 class="mt-3 text-xl font-bold text-base-content">{{ t('home.rest') }}</h2>
            <p class="max-w-sm text-base-content/65">
              {{ t('home.restDescription') }}
            </p>
            <RouterLink class="btn btn-primary mt-3" to="/calendar">
              <CalendarPlus :size="18" />
              {{ t('home.schedule') }}
            </RouterLink>
          </div>
        </article>
      </div>
      <aside class="flex min-w-0 flex-col">
        <section class="card h-full border border-base-300/50 bg-base-100 p-5 shadow-sm" aria-labelledby="summary-heading">
          <h2 id="summary-heading" class="text-lg font-bold">{{ t('home.summary') }}</h2>
          <p class="mt-1 text-sm text-base-content/60">{{ t('home.period') }}</p>
          <dl class="mt-6 grid grid-cols-2 gap-4">
            <div>
              <dd class="text-3xl font-bold text-primary">{{ weekSessions.length }}</dd>
              <dt class="mt-1 text-sm text-base-content/65">{{ t('home.completedWorkouts') }}</dt>
            </div>
            <div>
              <dd class="text-3xl font-bold">
                {{ weeklyMinutes }}<span class="ml-1 text-sm font-normal">min</span>
              </dd>
              <dt class="mt-1 text-sm text-base-content/65">{{ t('home.sessionTime') }}</dt>
            </div>
          </dl>
          <WorkoutTrend />
        </section>
      </aside>
    </div>
        <section class="card mt-8 border border-base-300/50 bg-base-100 p-5 shadow-sm" aria-labelledby="week-heading">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 id="week-heading" class="text-lg font-bold">{{ t('home.agenda') }}</h2>
            <RouterLink to="/calendar" class="text-sm font-semibold text-primary"
              >{{ t('home.calendar') }} →</RouterLink
            >
          </div>
          <div id="home-agenda-days" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <RouterLink
              v-for="(day, index) in weekDays"
              :key="day.key"
              to="/calendar"
              :aria-label="t('home.dayLabel', { day: day.label, number: day.number, scheduled: day.scheduled.length, completed: day.completed.length })"
              class="flex min-w-0 flex-col gap-3 rounded-box border p-4 xl:min-h-56"
              :class="[
                day.key === todayKey
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-base-300/50 bg-base-100',
                index >= 3 && !showAllAgendaDays ? 'max-lg:hidden' : '',
              ]"
            >
              <span class="text-xs capitalize text-base-content/60">{{ day.label }}</span>
              <span class="text-lg font-bold">{{ day.number }}</span>
              <div v-if="day.completed.length" class="space-y-3">
                <div v-for="session in day.completed" :key="session.id" class="text-sm">
                  <p class="break-words font-semibold text-base-content">{{ workoutName(session.workoutId) }}</p>
                  <p class="mt-1 text-xs text-primary">{{ t('home.completed') }} · {{ sessionMinutes(session) }} min</p>
                </div>
              </div>
              <div v-if="day.scheduled.length" class="space-y-3">
                <div v-for="workout in day.scheduled" :key="workout.id" class="text-sm">
                  <p class="break-words font-semibold text-base-content">{{ workoutName(workout.workoutId) }}</p>
                  <p class="mt-1 text-xs text-base-content/60">{{ t('home.scheduled') }}<span v-if="workout.time"> · {{ workout.time }}</span></p>
                </div>
              </div>
              <span v-if="!day.completed.length && !day.scheduled.length" class="text-sm text-base-content/45">{{ t(day.key > todayKey ? 'home.emptyFuture' : 'home.empty') }}</span>
            </RouterLink>
          </div>
          <button
            class="btn btn-ghost mt-3 self-center text-primary lg:hidden"
            type="button"
            :aria-expanded="showAllAgendaDays"
            aria-controls="home-agenda-days"
            @click="showAllAgendaDays = !showAllAgendaDays"
          >
            {{ t(showAllAgendaDays ? 'home.showLess' : 'home.showMore') }}
          </button>
        </section>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, CalendarPlus, Clock3, Dumbbell, FaceGrinning, Play } from '@lucide/vue';
import { computed, ref, defineAsyncComponent } from 'vue';
const WorkoutTrend = defineAsyncComponent(() => import('@/components/home/WorkoutTrend.vue'));
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n();
import type { WorkoutSession } from '@/constants';
import { useAuth } from '@/composables/useAuth';
import {
  scheduledWorkoutsRef,
  startWorkoutSession,
  workoutsRef,
  workoutSessionsRef,
  workoutEstimatedDuration,
} from '@/stores/workoutCreator';

const { currentUser } = useAuth();
const showAllAgendaDays = ref(false);

const pad = (value: number) => String(value).padStart(2, '0');
const now = new Date();
const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const todayLabel = computed(() => new Intl.DateTimeFormat(locale.value, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(now));

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

const todayWorkouts = computed(() =>
  scheduledWorkoutsRef.value.filter((scheduledWorkout) => scheduledWorkout.date === todayKey),
);

function workoutName(workoutId: string) {
  return workoutsRef.value.find((workout) => workout.id === workoutId)?.name ?? t('home.deleted');
}

function workoutDetails(workoutId: string) {
  const workout = workoutsRef.value.find((item) => item.id === workoutId);
  if (!workout) return t('home.unavailable');
  const minutes = Math.ceil(workoutEstimatedDuration(workout) / 60);
  return t('home.steps', { count: workout.steps.length }, workout.steps.length) + (minutes ? ` · ${t('home.estimate', { minutes })}` : '');
}

const localKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date.setDate(date.getDate() + index);
    const key = localKey(date);
    return {
      key,
      number: date.getDate(),
      label: new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(date),
      completed: workoutSessionsRef.value.filter((session) => session.completedAt && localKey(new Date(session.completedAt)) === key),
      scheduled: scheduledWorkoutsRef.value.filter((item) => item.date === key),
    };
  }),
);
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

function startWorkout(workoutId: string) {
  startWorkoutSession(workoutId);
}
</script>
