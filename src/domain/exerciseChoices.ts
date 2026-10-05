import type { Exercise } from './exercises';

export function getExercisesForMuscleGroup(exercises: Exercise[], selectedMuscleGroupId: string | null) {
  return exercises.filter((exercise) => exercise.muscleGroupId === selectedMuscleGroupId);
}
