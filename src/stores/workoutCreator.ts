import { ref } from 'vue';
import { localRef } from '@/composables/localRef';
import {
  WORKOUT_CREATOR_STEP_ACTION,
  DEFAULT_REPETITION_INTERVAL_SECONDS,
  type WorkoutCreatorStep,
  type WorkoutCreatorStepAction,
  type WorkoutSession,
  type StretchingExercise,
  type WarmupExercise,
} from '@/constants';
import {
  collectionValidationErrors,
  exerciseStepToDraftChanges,
  exerciseStepValidationErrors,
  getExerciseStepNode,
  resetExerciseStep,
  selectedExerciseNode,
  setCollectionValue,
} from '@/wavebinder/exerciseStep';
import { exercisesRef } from './exercises';
import { wb } from '@/wavebinder';
import { estimateWorkoutDuration } from '@/wavebinder/duration';

export interface WorkoutCreatorDraft {
  name: string;
  steps: WorkoutCreatorStep[];
}

export interface Workout {
  id: string;
  name: string;
  steps: WorkoutCreatorStep[];
}

export interface ScheduledWorkout {
  id: string;
  workoutId: string;
  date: string;
  time?: string;
}

export const createWarmupExercise = (): WarmupExercise => ({
  id: crypto.randomUUID(),
  duration: 0,
  repetitions: 0,
  repetitionIntervalSeconds: DEFAULT_REPETITION_INTERVAL_SECONDS,
  modeType: 'duration',
});

export const createStretchingExercise = (): StretchingExercise => ({
  id: crypto.randomUUID(),
  duration: 0,
});

const createStep = (type: WorkoutCreatorStepAction, step: number): WorkoutCreatorStep => ({
  step,
  type,
  sets: 1,
  pauseBetweenSetsDuration: 0,
  ...(type === WORKOUT_CREATOR_STEP_ACTION.WARMUP
    ? { warmupExercises: [createWarmupExercise()] }
    : {}),
  ...(type === WORKOUT_CREATOR_STEP_ACTION.STRETCHING
    ? { stretchingExercises: [createStretchingExercise()] }
    : {}),
  ...(type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE
    ? { exerciseModeType: 'repetitions', exerciseRepetitions: 0, repetitionIntervalSeconds: DEFAULT_REPETITION_INTERVAL_SECONDS }
    : {}),
  ...(type === WORKOUT_CREATOR_STEP_ACTION.PAUSE ? { pauseDuration: 0 } : {}),
});

export const workoutsRef = localRef<Workout[]>('gtt:workouts', () => []);
export const scheduledWorkoutsRef = localRef<ScheduledWorkout[]>(
  'gtt:scheduled-workouts',
  () => [],
);
export const workoutSessionsRef = localRef<WorkoutSession[]>('gtt:workout-sessions', () => []);
export const activeWorkoutSessionRef = localRef<WorkoutSession | null>(
  'gtt:active-workout-session',
  () => null,
);
// This is intentionally not persisted: it only controls whether the global player is expanded.
export const isWorkoutPlayerOpenRef = ref(false);
export const workoutPlayerStatusRef = ref<{ step: string; stepColorClass: string; counter: string; paused: boolean } | null>(null);
export const workoutPlayerPauseRequestRef = ref(0);

export type WorkoutPlaybackCheckpoint = {
  sessionId: string;
  segmentIndex: number;
  elapsedMilliseconds: number;
  totalElapsedMilliseconds: number;
  isStarting: boolean;
  startCountdown: number;
  pausedForBackground?: boolean;
  appliedResetId?: string;
};

const workoutPlaybackKey = 'gtt:workout-playback';

export const getWorkoutPlaybackCheckpoint = (sessionId: string): WorkoutPlaybackCheckpoint | null => {
  try {
    const saved = localStorage.getItem(workoutPlaybackKey);
    if (!saved) return null;
    const checkpoint = JSON.parse(saved) as WorkoutPlaybackCheckpoint;
    return checkpoint.sessionId === sessionId ? checkpoint : null;
  } catch {
    return null;
  }
};

export const saveWorkoutPlaybackCheckpoint = (checkpoint: WorkoutPlaybackCheckpoint) => {
  localStorage.setItem(workoutPlaybackKey, JSON.stringify(checkpoint));
};

export const clearWorkoutPlaybackCheckpoint = () => {
  localStorage.removeItem(workoutPlaybackKey);
};

export const toggleWorkoutPlayerPause = () => {
  if (activeWorkoutSessionRef.value) workoutPlayerPauseRequestRef.value += 1;
};
export const workoutCreatorDraft = ref<WorkoutCreatorDraft>({ name: '', steps: [] });
export const currentWorkoutCreatorStep = ref<WorkoutCreatorStep>();
export const isCreatingWorkoutCreatorStep = ref(true);
export const editingWorkoutCreatorStepIndex = ref<number>();

const cloneStep = (step: WorkoutCreatorStep) =>
  JSON.parse(JSON.stringify(step)) as WorkoutCreatorStep;

const normalizeStepNumbers = () => {
  workoutCreatorDraft.value.steps.forEach((step, index) => {
    step.step = index + 1;
  });
};

const loadExerciseStep = (step: WorkoutCreatorStep) => {
  const exercise = exercisesRef.value.find((item) => item.id === step.exerciseId) ?? null;
  getExerciseStepNode('selectedMuscleGroupId').next(exercise?.muscleGroupId ?? null);
  const selectedExerciseIndex = selectedExerciseNode().choices.findIndex(
    (choice) => choice.id === exercise?.id,
  );
  if (selectedExerciseIndex >= 0) selectedExerciseNode().setSelection(selectedExerciseIndex);
  else selectedExerciseNode().next(null);
  getExerciseStepNode('exerciseMode').next(step.exerciseModeType ?? 'repetitions');
  getExerciseStepNode('exerciseValue').next(
    step.exerciseModeType === 'duration'
      ? (step.exerciseDuration ?? 0)
      : (step.exerciseRepetitions ?? 0),
  );
  getExerciseStepNode('repetitionIntervalSeconds').next(
    step.repetitionIntervalSeconds ?? DEFAULT_REPETITION_INTERVAL_SECONDS,
  );
  getExerciseStepNode('sets').next(step.sets);
  getExerciseStepNode('hasSetPause').next(Boolean(step.hasSetPause));
  getExerciseStepNode('pauseBetweenSetsDuration').next(step.pauseBetweenSetsDuration);
};

export const startWorkoutCreatorStep = (type: WorkoutCreatorStepAction) => {
  editingWorkoutCreatorStepIndex.value = undefined;
  if (type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE) resetExerciseStep();
  currentWorkoutCreatorStep.value = createStep(type, workoutCreatorDraft.value.steps.length + 1);
};

export const editWorkoutCreatorStep = (index: number) => {
  const step = workoutCreatorDraft.value.steps[index];
  if (!step || step.type === WORKOUT_CREATOR_STEP_ACTION.SETPAUSE) return;

  editingWorkoutCreatorStepIndex.value = index;
  currentWorkoutCreatorStep.value = cloneStep(step);
  if (step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE) loadExerciseStep(step);
};

export const updateCurrentWorkoutCreatorStep = (changes: Partial<WorkoutCreatorStep>) => {
  if (!currentWorkoutCreatorStep.value) return;
  Object.assign(currentWorkoutCreatorStep.value, changes);
};

export const currentWorkoutCreatorStepValidationErrors = () => {
  const step = currentWorkoutCreatorStep.value;
  if (!step) return [];

  if (step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE) return exerciseStepValidationErrors();

  if (step.type === WORKOUT_CREATOR_STEP_ACTION.PAUSE) {
    const durationNode = wb.getNodeByName('pauseDuration');
    durationNode.next(step.pauseDuration ?? 0);
    return (wb.getNodeByName('pauseValidationErrors').getNodeValue() as string[] | null) ?? [];
  }

  if (step.type === WORKOUT_CREATOR_STEP_ACTION.WARMUP) {
    setCollectionValue('warmupExercises', step.warmupExercises ?? []);
    return collectionValidationErrors('warmupValidationErrors');
  }

  setCollectionValue('stretchingExercises', step.stretchingExercises ?? []);
  return collectionValidationErrors('stretchingValidationErrors');
};

export const isCurrentWorkoutCreatorStepValid = () =>
  currentWorkoutCreatorStepValidationErrors().length === 0;

export const createWorkoutCreatorStep = () => {
  if (!currentWorkoutCreatorStep.value) return;
  const step = currentWorkoutCreatorStep.value;
  if (!isCurrentWorkoutCreatorStepValid()) return;
  if (step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE) {
    Object.assign(step, exerciseStepToDraftChanges());
  }
  const editingIndex = editingWorkoutCreatorStepIndex.value;
  if (editingIndex === undefined) {
    workoutCreatorDraft.value.steps.push(step);
  } else {
    workoutCreatorDraft.value.steps.splice(editingIndex, 1, step);
  }

  if (step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE) {
    const setPauseIndex = (editingIndex ?? workoutCreatorDraft.value.steps.length - 1) + 1;
    const hasSetPause = step.hasSetPause && step.sets > 1;
    const existingSetPause = workoutCreatorDraft.value.steps[setPauseIndex];

    if (hasSetPause) {
      const setPauseStep: WorkoutCreatorStep = {
        step: step.step + 1,
        type: WORKOUT_CREATOR_STEP_ACTION.SETPAUSE,
        pauseDuration: step.pauseBetweenSetsDuration,
        sets: 1,
        pauseBetweenSetsDuration: 0,
      };
      if (existingSetPause?.type === WORKOUT_CREATOR_STEP_ACTION.SETPAUSE) {
        workoutCreatorDraft.value.steps.splice(setPauseIndex, 1, setPauseStep);
      } else {
        workoutCreatorDraft.value.steps.splice(setPauseIndex, 0, setPauseStep);
      }
    } else if (existingSetPause?.type === WORKOUT_CREATOR_STEP_ACTION.SETPAUSE) {
      workoutCreatorDraft.value.steps.splice(setPauseIndex, 1);
    }
  }

  normalizeStepNumbers();
  currentWorkoutCreatorStep.value = undefined;
  editingWorkoutCreatorStepIndex.value = undefined;
  isCreatingWorkoutCreatorStep.value = false;
};

export const removeWorkoutCreatorStep = () => {
  const editingIndex = editingWorkoutCreatorStepIndex.value;
  if (editingIndex === undefined) return;

  const step = workoutCreatorDraft.value.steps[editingIndex];
  if (!step) return;
  const count =
    step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE &&
    workoutCreatorDraft.value.steps[editingIndex + 1]?.type === WORKOUT_CREATOR_STEP_ACTION.SETPAUSE
      ? 2
      : 1;
  workoutCreatorDraft.value.steps.splice(editingIndex, count);
  normalizeStepNumbers();
  currentWorkoutCreatorStep.value = undefined;
  editingWorkoutCreatorStepIndex.value = undefined;
  isCreatingWorkoutCreatorStep.value = false;
};

export const returnToWorkoutCreatorOverview = () => {
  currentWorkoutCreatorStep.value = undefined;
  editingWorkoutCreatorStepIndex.value = undefined;
  isCreatingWorkoutCreatorStep.value = false;
};

export const createWorkout = () => {
  const name = workoutCreatorDraft.value.name.trim();
  if (!name || workoutCreatorDraft.value.steps.length === 0) return undefined;

  const workout: Workout = {
    id: crypto.randomUUID(),
    name,
    steps: JSON.parse(JSON.stringify(workoutCreatorDraft.value.steps)) as WorkoutCreatorStep[],
  };
  workoutsRef.value.push(workout);
  return workout;
};

export const loadWorkoutCreator = (workout: Workout) => {
  workoutCreatorDraft.value = {
    name: workout.name,
    steps: JSON.parse(JSON.stringify(workout.steps)) as WorkoutCreatorStep[],
  };
  currentWorkoutCreatorStep.value = undefined;
  editingWorkoutCreatorStepIndex.value = undefined;
  isCreatingWorkoutCreatorStep.value = workout.steps.length === 0;
};

export const updateWorkout = (id: Workout['id']) => {
  const name = workoutCreatorDraft.value.name.trim();
  if (!name || workoutCreatorDraft.value.steps.length === 0) return;

  const workout = workoutsRef.value.find((item) => item.id === id);
  if (!workout) return;

  workout.name = name;
  workout.steps = JSON.parse(
    JSON.stringify(workoutCreatorDraft.value.steps),
  ) as WorkoutCreatorStep[];
};

export const scheduleWorkout = (workoutId: string, date: string, time?: string) => {
  scheduledWorkoutsRef.value.push({
    id: crypto.randomUUID(),
    workoutId,
    date,
    ...(time ? { time } : {}),
  });
};

export const removeScheduledWorkout = (id: string) => {
  scheduledWorkoutsRef.value = scheduledWorkoutsRef.value.filter(
    (scheduledWorkout) => scheduledWorkout.id !== id,
  );
};

export const removeWorkout = (id: string) => {
  workoutsRef.value = workoutsRef.value.filter((workout) => workout.id !== id);
  scheduledWorkoutsRef.value = scheduledWorkoutsRef.value.filter(
    (scheduledWorkout) => scheduledWorkout.workoutId !== id,
  );
};

export const workoutVisibleSteps = (workout: Workout) =>
  workout.steps.filter((step) => step.type !== WORKOUT_CREATOR_STEP_ACTION.SETPAUSE);

export const workoutEstimatedDuration = (workout: Workout) =>
  estimateWorkoutDuration(workout.steps);

export const startWorkoutSession = (workoutId: string) => {
  const workout = workoutsRef.value.find((item) => item.id === workoutId);
  if (!workout) return;
  clearWorkoutPlaybackCheckpoint();
  activeWorkoutSessionRef.value = {
    id: crypto.randomUUID(),
    workoutId,
    startedAt: new Date().toISOString(),
    isPaused: false,
    currentStepIndex: 0,
    completedStepIndexes: [],
  };
  isWorkoutPlayerOpenRef.value = true;
};

export const openWorkoutPlayer = () => {
  if (activeWorkoutSessionRef.value) isWorkoutPlayerOpenRef.value = true;
};

export const minimizeWorkoutPlayer = () => {
  isWorkoutPlayerOpenRef.value = false;
};

export const advanceWorkoutSession = () => {
  const session = activeWorkoutSessionRef.value;
  const workout = session && workoutsRef.value.find((item) => item.id === session.workoutId);
  if (!session || !workout) return;
  if (!session.completedStepIndexes.includes(session.currentStepIndex)) {
    session.completedStepIndexes.push(session.currentStepIndex);
  }
  if (session.currentStepIndex >= workout.steps.length - 1) {
    const completed = { ...session, completedAt: new Date().toISOString() };
    workoutSessionsRef.value.unshift(completed);
    activeWorkoutSessionRef.value = null;
    isWorkoutPlayerOpenRef.value = false;
    clearWorkoutPlaybackCheckpoint();
    return;
  }
  session.currentStepIndex += 1;
};

export const updateWorkoutSessionStep = (stepIndex: number) => {
  if (!activeWorkoutSessionRef.value) return;
  activeWorkoutSessionRef.value.currentStepIndex = stepIndex;
};

export const completeWorkoutSession = () => {
  const session = activeWorkoutSessionRef.value;
  const workout = session && workoutsRef.value.find((item) => item.id === session.workoutId);
  if (!session || !workout) return;
  const completed = {
    ...session,
    completedAt: new Date().toISOString(),
    completedStepIndexes: workout.steps.map((_, index) => index),
  };
  workoutSessionsRef.value.unshift(completed);
  activeWorkoutSessionRef.value = null;
  isWorkoutPlayerOpenRef.value = false;
  clearWorkoutPlaybackCheckpoint();
};

export const abandonWorkoutSession = () => {
  activeWorkoutSessionRef.value = null;
  isWorkoutPlayerOpenRef.value = false;
  clearWorkoutPlaybackCheckpoint();
};

export const resetWorkoutCreator = () => {
  workoutCreatorDraft.value = { name: '', steps: [] };
  currentWorkoutCreatorStep.value = undefined;
  editingWorkoutCreatorStepIndex.value = undefined;
  isCreatingWorkoutCreatorStep.value = true;
};
