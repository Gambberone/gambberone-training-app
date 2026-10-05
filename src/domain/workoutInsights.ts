import type { WorkoutSession } from '../constants/workout';

export type HistoryFilter = { period: string; workoutId: string };
export type WorkoutStatistics = ReturnType<typeof workoutStatistics>;

export function sessionMinutes(session: WorkoutSession) {
  const elapsed = Date.parse(session.completedAt ?? '') - Date.parse(session.startedAt);
  return Number.isFinite(elapsed) ? Math.max(0, Math.round(elapsed / 60000)) : 0;
}

export function completedWorkoutSessions(sessions: WorkoutSession[], now: number) {
  return sessions.filter((session) => {
    const completed = Date.parse(session.completedAt ?? '');
    return Number.isFinite(completed) && completed <= now;
  }).sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!));
}

export function workoutStatistics(sessions: WorkoutSession[], now: number) {
  const today = new Date(now);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const currentMonthSessions = sessions.filter((session) =>
    Date.parse(session.completedAt!) >= currentMonthStart.getTime());
  const previousMonthSessions = sessions.filter((session) => {
    const completed = Date.parse(session.completedAt!);
    return completed >= previousMonthStart.getTime() && completed < currentMonthStart.getTime();
  });
  const weekSessions = sessions.filter((session) => Date.parse(session.completedAt!) >= monday.getTime());
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(monday);
    start.setDate(start.getDate() - (7 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {
      start: start.getTime(),
      count: sessions.filter((session) => {
        const completed = Date.parse(session.completedAt!);
        return completed >= start.getTime() && completed < end.getTime();
      }).length,
    };
  });
  const minutes = (items: WorkoutSession[]) => items.reduce((sum, session) => sum + sessionMinutes(session), 0);
  return {
    currentMonthStart: currentMonthStart.getTime(), previousMonthStart: previousMonthStart.getTime(),
    currentMonthSessions, previousMonthSessions, weekSessions, weeks,
    currentMonthMinutes: minutes(currentMonthSessions), previousMonthMinutes: minutes(previousMonthSessions),
    weeklyMinutes: minutes(weekSessions),
    monthDifference: currentMonthSessions.length - previousMonthSessions.length,
    weekDifference: weeks[6]!.count - weeks[5]!.count,
  };
}

export function filterWorkoutHistory(sessions: WorkoutSession[], now: number, filter: HistoryFilter) {
  const today = new Date(now);
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  cutoff.setDate(cutoff.getDate() - Number(filter.period) + 1);
  return sessions.filter((session) =>
    (filter.workoutId === 'all' || session.workoutId === filter.workoutId) &&
    (filter.period === 'all' || Date.parse(session.completedAt!) >= cutoff.getTime()));
}
