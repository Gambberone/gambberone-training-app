import { computed } from 'vue';
import type { ExerciseModeType } from '@/constants';
import type { Exercise } from '@/domain/exercises';
import { validateExerciseStep } from '@/domain/workoutValidation';
import { getExerciseStepNode, selectedExerciseNode } from '@/wavebinder/exerciseStep';
import { useWaveBinderMultiNode, useWaveBinderNode } from './useWaveBinderNode';

export function useExerciseStepValidation() {
  const { selectedId, choices } = useWaveBinderMultiNode<Exercise>(selectedExerciseNode());
  const mode = useWaveBinderNode<ExerciseModeType>(getExerciseStepNode('exerciseMode'));
  const value = useWaveBinderNode<number>(getExerciseStepNode('exerciseValue'));
  const interval = useWaveBinderNode<number>(getExerciseStepNode('repetitionIntervalSeconds'));
  const sets = useWaveBinderNode<number>(getExerciseStepNode('sets'));
  const hasPause = useWaveBinderNode<boolean>(getExerciseStepNode('hasSetPause'));
  const pause = useWaveBinderNode<number>(getExerciseStepNode('pauseBetweenSetsDuration'));
  return computed(() => validateExerciseStep(
    choices.value.find((exercise) => exercise.id === selectedId.value) ?? null,
    mode.value, value.value, interval.value, sets.value, hasPause.value, pause.value,
  ));
}
