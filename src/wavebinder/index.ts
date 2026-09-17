import './crypto-compat';
import { WaveBinder } from 'wave-binder';
import { watch } from 'vue';

import EXT_API_CONFIG from './extapi.json';
import LICENSE from './license.json';
import PROTO_NODES from './protonodes.json';
import { exercisesRef } from '../stores/exercises';
import type { Exercise } from '../domain/exercises';

const extApis = new Map();

extApis.set('api', EXT_API_CONFIG);

export const wb = new WaveBinder(
  LICENSE,
  PROTO_NODES as ConstructorParameters<typeof WaveBinder>[1],
  extApis,
  [
    {
      name: 'getExercisesForMuscleGroup',
      implementation: (selectedMuscleGroupId: string | null) =>
        exercisesRef.value.filter((exercise) => exercise.muscleGroupId === selectedMuscleGroupId),
    },
    {
      name: 'isPauseAvailable',
      implementation: (sets: number) => Number(sets) > 1,
    },
    {
      name: 'effectivePauseDuration',
      implementation: (isPauseAvailable: boolean, hasSetPause: boolean, duration: number) =>
        isPauseAvailable && hasSetPause ? Math.max(0, Number(duration)) : 0,
    },
    {
      name: 'validateExerciseStep',
      implementation: (
        selectedExercise: Exercise | null,
        exerciseValue: number,
        sets: number,
        hasSetPause: boolean,
        effectivePauseDuration: number,
      ) => {
        const errors: string[] = [];
        if (!selectedExercise) errors.push('Seleziona un esercizio.');
        if (!Number.isFinite(Number(exerciseValue)) || Number(exerciseValue) <= 0) {
          errors.push('Inserisci un valore maggiore di zero.');
        }
        if (!Number.isInteger(Number(sets)) || Number(sets) < 1) errors.push('I set devono essere almeno uno.');
        if (hasSetPause && Number(sets) > 1 && Number(effectivePauseDuration) <= 0) {
          errors.push('Inserisci la durata della pausa tra i set.');
        }
        return errors;
      },
    },
    {
      name: 'isStepValid',
      implementation: (validationErrors: string[]) => validationErrors.length === 0,
    },
  ],
);

wb.tangleNodes();

// The catalog is persisted outside WaveBinder. Re-emitting the source value keeps its dependent
// choices current after an exercise is created, edited, or removed.
watch(
  exercisesRef,
  () => {
    const muscleGroupNode = wb.getNodeByName('selectedMuscleGroupId');
    muscleGroupNode.next(muscleGroupNode.getNodeValue());
  },
  { deep: true },
);
