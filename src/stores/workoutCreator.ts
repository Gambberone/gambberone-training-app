import { ref } from 'vue';
import { localRef } from '../composables/localRef';
import {
  WORKOUT_CREATOR_STEP_ACTION,
  type WorkoutCreatorStep,
  type WorkoutCreatorStepAction,
  type StretchingExercise,
  type WarmupExercise,
} from '../constants';

export interface WorkoutCreatorDraft {
  name: string;
  steps: WorkoutCreatorStep[];
}

export interface Workout {
  id: string;
  name: string;
  steps: WorkoutCreatorStep[];
}

export const createWarmupExercise = (): WarmupExercise => ({
  id: crypto.randomUUID(),
  duration: 0,
  repetitions: 0,
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
    ? { exerciseModeType: 'repetitions', exerciseRepetitions: 0 }
    : {}),
  ...(type === WORKOUT_CREATOR_STEP_ACTION.PAUSE ? { pauseDuration: 0 } : {}),
});

export const workoutsRef = localRef<Workout[]>('gtt:workouts', () => []);
export const workoutCreatorDraft = ref<WorkoutCreatorDraft>({ name: '', steps: [] });
export const currentWorkoutCreatorStep = ref<WorkoutCreatorStep>();
export const isCreatingWorkoutCreatorStep = ref(true);

export const startWorkoutCreatorStep = (type: WorkoutCreatorStepAction) => {
  currentWorkoutCreatorStep.value = createStep(type, workoutCreatorDraft.value.steps.length + 1);
};

export const updateCurrentWorkoutCreatorStep = (changes: Partial<WorkoutCreatorStep>) => {
  if (!currentWorkoutCreatorStep.value) return;
  Object.assign(currentWorkoutCreatorStep.value, changes);
};

export const createWorkoutCreatorStep = () => {
  if (!currentWorkoutCreatorStep.value) return;
  const step = currentWorkoutCreatorStep.value;
  workoutCreatorDraft.value.steps.push(step);

  if (step.type === WORKOUT_CREATOR_STEP_ACTION.EXERCISE && step.hasSetPause && step.sets > 1) {
    workoutCreatorDraft.value.steps.push({
      step: step.step + 1,
      type: WORKOUT_CREATOR_STEP_ACTION.SETPAUSE,
      pauseDuration: step.pauseBetweenSetsDuration,
      sets: 1,
      pauseBetweenSetsDuration: 0,
    });
  }

  currentWorkoutCreatorStep.value = undefined;
  isCreatingWorkoutCreatorStep.value = false;
};

export const createWorkout = () => {
  const name = workoutCreatorDraft.value.name.trim();
  if (!name || workoutCreatorDraft.value.steps.length === 0) return;

  workoutsRef.value.push({
    id: crypto.randomUUID(),
    name,
    steps: JSON.parse(JSON.stringify(workoutCreatorDraft.value.steps)) as WorkoutCreatorStep[],
  });
};

export const resetWorkoutCreator = () => {
  workoutCreatorDraft.value = { name: '', steps: [] };
  currentWorkoutCreatorStep.value = undefined;
  isCreatingWorkoutCreatorStep.value = true;
};
