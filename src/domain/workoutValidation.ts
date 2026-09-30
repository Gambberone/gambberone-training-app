import type { ExerciseModeType } from '../constants/workout';
import type { Exercise } from './exercises';

export function validateExerciseStep(
  selectedExercise: Exercise | null,
  exerciseMode: ExerciseModeType,
  exerciseValue: number,
  repetitionIntervalSeconds: number,
  sets: number,
  hasSetPause: boolean,
  pauseBetweenSetsDuration: number,
) {
  const errors: string[] = [];
  if (!selectedExercise) errors.push('messages.enterExercise');
  if (!Number.isFinite(Number(exerciseValue)) || Number(exerciseValue) <= 0)
    errors.push('messages.positiveValue');
  if (
    exerciseMode === 'repetitions' &&
    (!Number.isInteger(Number(repetitionIntervalSeconds)) || Number(repetitionIntervalSeconds) < 1)
  )
    errors.push('messages.intervalError');
  if (!Number.isInteger(Number(sets)) || Number(sets) < 1) errors.push('messages.setsError');
  if (
    hasSetPause &&
    Number(sets) > 1 &&
    (!Number.isFinite(Number(pauseBetweenSetsDuration)) || Number(pauseBetweenSetsDuration) <= 0)
  )
    errors.push('messages.pauseError');
  return errors;
}
