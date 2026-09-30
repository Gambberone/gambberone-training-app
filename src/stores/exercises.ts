import { localRef } from '@/composables/localRef';
import { exercises as seedExercises, type Exercise } from '@/domain/exercises';

export const exercisesRef = localRef<Exercise[]>('gtt:exercises', () =>
  structuredClone(seedExercises),
);
