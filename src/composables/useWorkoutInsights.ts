import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { SingleNode } from 'wave-binder';
import type { WorkoutSession } from '@/constants/workout';
import type { HistoryFilter, WorkoutStatistics } from '@/domain/workoutInsights';
import { workoutStatistics } from '@/domain/workoutInsights';
import { scheduledWorkoutsRef, workoutSessionsRef, type ScheduledWorkout } from '@/stores/workoutCreator';
import { wb } from '@/wavebinder';
import { useWaveBinderValue } from './useWaveBinderNode';

const node = (name: string) => wb.getNodeByName(name) as SingleNode;
const currentTime = ref(Date.now());
let clock: ReturnType<typeof setInterval> | undefined;
let consumers = 0;

// Persisted data stays in the stores; one bridge supplies the shared graph for every view.
watch(workoutSessionsRef, (sessions) => node('insightSessions')?.next(sessions), { deep: true, immediate: true });
watch(scheduledWorkoutsRef, (scheduled) => node('insightScheduled')?.next(scheduled), { deep: true, immediate: true });
watch(currentTime, (now) => node('insightNow')?.next(now), { immediate: true, flush: 'sync' });

export function useWorkoutInsights() {
  onMounted(() => {
    currentTime.value = Date.now();
    if (consumers++ === 0) clock = setInterval(() => { currentTime.value = Date.now(); }, 15000);
  });
  onUnmounted(() => {
    if (--consumers === 0) { clearInterval(clock); clock = undefined; }
  });
  const completed = useWaveBinderValue<WorkoutSession[] | null>(node('completedWorkoutSessions'));
  const pending = useWaveBinderValue<ScheduledWorkout[] | null>(node('pendingAgendaWorkouts'));
  const statistics = useWaveBinderValue<WorkoutStatistics | null>(node('workoutStatistics'));
  return {
    currentTime,
    completedSessions: computed(() => completed.value ?? []),
    pendingWorkouts: computed(() => pending.value ?? []),
    statistics: computed(() => statistics.value ?? workoutStatistics([], currentTime.value)),
  };
}

export function useWorkoutHistoryFilter(filter: () => HistoryFilter) {
  watch(filter, (value) => node('historyFilter').next(value), { immediate: true, flush: 'sync' });
  const sessions = useWaveBinderValue<WorkoutSession[] | null>(node('filteredWorkoutHistory'));
  return computed(() => sessions.value ?? []);
}
