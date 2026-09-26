export type WorkoutCreatorStepAction = 'WARMUP' | 'PAUSE' | 'SETPAUSE' | 'EXERCISE' | 'STRETCHING';

export const WORKOUT_CREATOR_STEP_ACTION = {
  WARMUP: 'WARMUP',
  PAUSE: 'PAUSE',
  SETPAUSE: 'SETPAUSE',
  EXERCISE: 'EXERCISE',
  STRETCHING: 'STRETCHING',
} as const satisfies Record<WorkoutCreatorStepAction, WorkoutCreatorStepAction>;

export const DEFAULT_REPETITION_INTERVAL_SECONDS = 3;

export type WarmupExercise = {
  id: string;
  exerciseId?: string;
  duration: number;
  repetitions: number;
  repetitionIntervalSeconds?: number;
  modeType: 'duration' | 'repetitions';
};

export type StretchingExercise = {
  id: string;
  exerciseId?: string;
  duration: number;
};

export type ExerciseModeType = 'duration' | 'repetitions';

export interface WorkoutCreatorStep {
  step: number;
  type: WorkoutCreatorStepAction;
  exerciseId?: string;
  stretchingType?: string;
  pauseDuration?: number;
  exerciseRepetitions?: number;
  repetitionIntervalSeconds?: number;
  exerciseDuration?: number;
  exerciseModeType?: ExerciseModeType;
  hasSetPause?: boolean;
  warmupExercises?: WarmupExercise[];
  stretchingExercises?: StretchingExercise[];
  sets: number;
  pauseBetweenSetsDuration: number;
}

export type WorkoutSession = {
  id: string;
  workoutId: string;
  startedAt: string;
  isPaused?: boolean;
  segmentReset?: { id: string; segmentIndex: number; isStarting: boolean; action?: 'reset' | 'skip' };
  completedAt?: string;
  currentStepIndex: number;
  completedStepIndexes: number[];
};
