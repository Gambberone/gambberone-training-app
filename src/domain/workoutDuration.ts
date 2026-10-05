import { DEFAULT_REPETITION_INTERVAL_SECONDS, WORKOUT_CREATOR_STEP_ACTION, type WorkoutCreatorStep } from '@/constants/workout';

// A pure calculation shared by the creator, cards, and saved workouts.
export const estimateWorkoutDuration = (steps: WorkoutCreatorStep[] | null) =>
  (steps ?? []).reduce((total, step) => {
    if (step.type === WORKOUT_CREATOR_STEP_ACTION.SETPAUSE) return total;
    if (step.type === WORKOUT_CREATOR_STEP_ACTION.PAUSE)
      return total + Number(step.pauseDuration ?? 0);
    if (step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE) {
      const value =
        step.exerciseModeType === 'duration'
          ? Number(step.exerciseDuration ?? 0)
          : Number(step.exerciseRepetitions ?? 0) *
            (step.repetitionIntervalSeconds ?? DEFAULT_REPETITION_INTERVAL_SECONDS);
      const sets = Number(step.sets ?? 1);
      return (
        total +
        value * sets +
        Number(step.pauseBetweenSetsDuration ?? 0) * Math.max(0, sets - 1)
      );
    }
    if (step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP) {
      return (
        total +
        (step.warmupExercises ?? []).reduce(
          (sum, exercise) =>
            sum +
            (exercise.modeType === 'repetitions'
              ? Number(exercise.repetitions ?? 0) *
                (exercise.repetitionIntervalSeconds ?? DEFAULT_REPETITION_INTERVAL_SECONDS)
              : Number(exercise.duration ?? 0)),
          0,
        )
      );
    }
    return (
      total +
      (step.stretchingExercises ?? []).reduce(
        (sum, exercise) => sum + Number(exercise.duration ?? 0),
        0,
      )
    );
  }, 0);
