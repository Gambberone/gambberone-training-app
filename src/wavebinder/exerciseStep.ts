import type { Exercise } from '@/domain/exercises';
import type { ExerciseModeType, WorkoutCreatorStep } from '@/constants';
import { DEFAULT_REPETITION_INTERVAL_SECONDS } from '@/constants/workout';
import { ListNode, MultiNode, SingleNode } from 'wave-binder';
import { wb } from './index';

type ExerciseStepNodeName =
  | 'selectedMuscleGroupId'
  | 'exerciseMode'
  | 'exerciseValue'
  | 'repetitionIntervalSeconds'
  | 'sets'
  | 'hasSetPause'
  | 'pauseBetweenSetsDuration'
  | 'isPauseAvailable'
  | 'effectivePauseDuration'
  | 'validationErrors'
  | 'isStepValid';

type CollectionNodeName = 'warmupExercises' | 'stretchingExercises';
type CollectionValidationNodeName = 'warmupValidationErrors' | 'stretchingValidationErrors';

export const getExerciseStepNode = (name: ExerciseStepNodeName) =>
  wb.getNodeByName(name) as SingleNode;

export const selectedExerciseNode = () => wb.getNodeByName('selectedExercise') as MultiNode;

export const getCollectionNode = (name: CollectionNodeName) => wb.getNodeByName(name) as ListNode;

export const setCollectionValue = (name: CollectionNodeName, value: unknown[]) =>
  getCollectionNode(name).next(value);

export const collectionValidationErrors = (name: CollectionValidationNodeName) =>
  ((wb.getNodeByName(name) as SingleNode).getNodeValue() as string[] | null) ?? [];

export const resetExerciseStep = () => {
  getExerciseStepNode('selectedMuscleGroupId').next(null);
  selectedExerciseNode().next(null);
  getExerciseStepNode('exerciseMode').next('repetitions');
  getExerciseStepNode('exerciseValue').next(0);
  getExerciseStepNode('repetitionIntervalSeconds').next(DEFAULT_REPETITION_INTERVAL_SECONDS);
  getExerciseStepNode('sets').next(1);
  getExerciseStepNode('hasSetPause').next(false);
  getExerciseStepNode('pauseBetweenSetsDuration').next(0);
};

export const exerciseStepIsValid = () => Boolean(getExerciseStepNode('isStepValid').getNodeValue());

export const exerciseStepValidationErrors = () =>
  {
    const errors: string[] = [];
    const exercise = selectedExerciseNode().getNodeValue() as Exercise | null;
    const value = Number(getExerciseStepNode('exerciseValue').getNodeValue());
    const sets = Number(getExerciseStepNode('sets').getNodeValue());
    const mode = getExerciseStepNode('exerciseMode').getNodeValue() as ExerciseModeType;
    const repetitionInterval = Number(getExerciseStepNode('repetitionIntervalSeconds').getNodeValue());
    const hasSetPause = Boolean(getExerciseStepNode('hasSetPause').getNodeValue());
    const pauseDuration = Number(getExerciseStepNode('pauseBetweenSetsDuration').getNodeValue());

    if (!exercise) errors.push('Seleziona un esercizio.');
    if (!Number.isFinite(value) || value <= 0) errors.push('Inserisci un valore maggiore di zero.');
    if (mode === 'repetitions' && (!Number.isInteger(repetitionInterval) || repetitionInterval < 1)) {
      errors.push('L’intervallo tra le ripetizioni deve essere di almeno un secondo.');
    }
    if (!Number.isInteger(sets) || sets < 1) errors.push('I set devono essere almeno uno.');
    if (hasSetPause && sets > 1 && (!Number.isFinite(pauseDuration) || pauseDuration <= 0)) {
      errors.push('Inserisci la durata della pausa tra i set.');
    }
    return errors;
  };

export const exerciseStepToDraftChanges = (): Partial<WorkoutCreatorStep> => {
  const exercise = selectedExerciseNode().getNodeValue() as Exercise | null;
  const mode = getExerciseStepNode('exerciseMode').getNodeValue() as ExerciseModeType;
  const value = Number(getExerciseStepNode('exerciseValue').getNodeValue() ?? 0);

  return {
    exerciseId: exercise?.id,
    exerciseModeType: mode,
    exerciseRepetitions: mode === 'repetitions' ? value : undefined,
    repetitionIntervalSeconds: mode === 'repetitions'
      ? Number(getExerciseStepNode('repetitionIntervalSeconds').getNodeValue())
      : undefined,
    exerciseDuration: mode === 'duration' ? value : undefined,
    sets: Math.max(1, Number(getExerciseStepNode('sets').getNodeValue() ?? 1)),
    hasSetPause: Boolean(getExerciseStepNode('hasSetPause').getNodeValue()),
    pauseBetweenSetsDuration: Number(getExerciseStepNode('effectivePauseDuration').getNodeValue() ?? 0),
  };
};
