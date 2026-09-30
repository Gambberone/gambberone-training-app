import type { WorkoutSession } from '../constants/workout';
import type { ScheduledWorkout } from '../stores/workoutCreator';

const localDate = (value: string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function pendingAgendaWorkouts(scheduled: ScheduledWorkout[], sessions: WorkoutSession[]) {
  const completed = sessions.filter((session) => session.completedAt);
  const matched = new Set(
    completed.flatMap((session) =>
      session.scheduledWorkoutId ? [session.scheduledWorkoutId] : [],
    ),
  );
  const remaining = scheduled
    .filter((item) => !matched.has(item.id))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || (a.time || '24:00').localeCompare(b.time || '24:00'),
    );
  for (const session of completed.filter((item) => !item.scheduledWorkoutId)) {
    const index = remaining.findIndex(
      (item) =>
        item.workoutId === session.workoutId && item.date === localDate(session.completedAt!),
    );
    if (index >= 0) remaining.splice(index, 1);
  }
  return remaining;
}

export function isAgendaWorkoutExpired(workout: ScheduledWorkout, now: number) {
  const deadline = workout.time
    ? new Date(`${workout.date}T${workout.time}`).getTime()
    : new Date(`${workout.date}T23:59:59.999`).getTime();
  return now > deadline;
}
