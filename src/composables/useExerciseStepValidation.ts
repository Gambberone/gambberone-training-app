import { getExerciseStepNode } from '@/wavebinder/exerciseStep';
import { computed } from 'vue';
import { useWaveBinderValue } from './useWaveBinderNode';

export function useExerciseStepValidation() {
  const errors = useWaveBinderValue<string[] | null>(getExerciseStepNode('validationErrors'));
  return computed(() => errors.value ?? ['messages.enterExercise']);
}
