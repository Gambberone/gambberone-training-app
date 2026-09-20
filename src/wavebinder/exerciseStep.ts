import type { Exercise } from '@/domain/exercises';
import type { ExerciseModeType, WorkoutCreatorStep } from '@/constants';
import { ListNode, MultiNode, SingleNode } from 'wave-binder';
import { wb } from './index';

type ExerciseStepNodeName =
  | 'selectedMuscleGroupId'
  | 'exerciseMode'
  | 'exerciseValue'
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
  getExerciseStepNode('sets').next(1);
  getExerciseStepNode('hasSetPause').next(false);
  getExerciseStepNode('pauseBetweenSetsDuration').next(0);
};

export const exerciseStepIsValid = () => Boolean(getExerciseStepNode('isStepValid').getNodeValue());

export const exerciseStepValidationErrors = () =>
  (getExerciseStepNode('validationErrors').getNodeValue() as string[] | null) ?? [];

export const exerciseStepToDraftChanges = (): Partial<WorkoutCreatorStep> => {
  const exercise = selectedExerciseNode().getNodeValue() as Exercise | null;
  const mode = getExerciseStepNode('exerciseMode').getNodeValue() as ExerciseModeType;
  const value = Number(getExerciseStepNode('exerciseValue').getNodeValue() ?? 0);

  return {
    exerciseId: exercise?.id,
    exerciseModeType: mode,
    exerciseRepetitions: mode === 'repetitions' ? value : undefined,
    exerciseDuration: mode === 'duration' ? value : undefined,
    sets: Math.max(1, Number(getExerciseStepNode('sets').getNodeValue() ?? 1)),
    hasSetPause: Boolean(getExerciseStepNode('hasSetPause').getNodeValue()),
    pauseBetweenSetsDuration: Number(getExerciseStepNode('effectivePauseDuration').getNodeValue() ?? 0),
  };
};
