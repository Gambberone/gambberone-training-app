import { i18n } from '@/i18n';
import { exercises as catalogue, type Exercise } from '@/domain/exercises';

export const tr = (key: string, values: Record<string, string | number> = {}) => i18n.global.t(key, values);
export const appLocale = () => i18n.global.locale.value;
const catalogueById = new Map(catalogue.map((exercise) => [exercise.id, exercise]));

// Only translate unchanged built-in names. Custom names remain user content.
export function localizedExerciseName(exercise: Exercise) {
  const original = catalogueById.get(exercise.id);
  const key = `exerciseNames.${exercise.id}`;
  return original?.name === exercise.name && i18n.global.te(key)
    ? tr(key)
    : exercise.name;
}
export const localizedExercises = (exercises: Exercise[]) => exercises.map((exercise) => ({ ...exercise, name: localizedExerciseName(exercise) }));

export function localizedValidationMessage(value: string) {
  if (i18n.global.te(value)) return tr(value);
  try {
    const message = JSON.parse(value) as { key: string; values: Record<string, string | number> };
    if (message.key && i18n.global.te(message.key)) return tr(message.key, message.values);
  } catch { /* Older validation messages may be plain text. */ }
  return value;
}
