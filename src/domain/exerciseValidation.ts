import { muscleGroups } from './exercises';

export type ExerciseEditorErrors = { name?: string; muscleGroup?: string };

export function validateExerciseEditor(name: string, muscleGroupId: string | null): ExerciseEditorErrors {
  return {
    name: name?.trim() ? undefined : 'ui.exercise_name_is_required',
    muscleGroup: muscleGroups.some((group) => group.id === muscleGroupId)
      ? undefined : 'ui.muscle_group_is_required',
  };
}

export function exerciseEditorCanSave(errors: ExerciseEditorErrors | null) {
  return Boolean(errors && !errors.name && !errors.muscleGroup);
}
