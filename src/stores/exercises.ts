import { exercises as seedExercises, type Exercise } from '../domain/exercises'
import { localRef } from '../composables/localRef'

export const exercisesRef = localRef<Exercise[]>('gtt:exercises', () =>
  structuredClone(seedExercises),
)
