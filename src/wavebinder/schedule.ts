import type { ScheduledWorkout } from '@/stores/workoutCreator';

export type ScheduleInput = {
  date?: string;
  workoutId?: string;
  time?: string;
  scheduled?: ScheduledWorkout[];
};

export const scheduleValidationErrors = (input: ScheduleInput | null): string[] => {
  if (!input?.date || !input.workoutId) return ['messages.scheduleRequired'];
  const duplicate = input.scheduled?.some(
    (item) =>
      item.date === input.date && item.workoutId === input.workoutId && item.time === input.time,
  );
  return duplicate ? ['messages.duplicateSchedule'] : [];
};
