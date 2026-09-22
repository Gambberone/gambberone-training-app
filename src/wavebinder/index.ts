import './crypto-compat';
import { WaveBinder } from 'wave-binder';
import { watch } from 'vue';

import EXT_API_CONFIG from './extapi.json';
import LICENSE from './license.json';
import PROTO_NODES from './protonodes.json';
import { exercisesRef } from '@/stores/exercises';
import type { Exercise } from '@/domain/exercises';
import { DEFAULT_REPETITION_INTERVAL_SECONDS, type StretchingExercise, type WarmupExercise, type WorkoutCreatorStep, type WorkoutSession } from '@/constants';
import type { ScheduledWorkout } from '@/stores/workoutCreator';

const licenseServerUrl = import.meta.env.VITE_WAVEBINDER_LICENSE_SERVER_URL?.replace(/\/$/, '');

if (licenseServerUrl) {
  (globalThis as typeof globalThis & { WAVEBINDER_LICENSE_SERVER_URL?: string })
    .WAVEBINDER_LICENSE_SERVER_URL = licenseServerUrl;
}

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
        pauseBetweenSetsDuration: number,
      ) => {
        const errors: string[] = [];
        if (!selectedExercise) errors.push('Seleziona un esercizio.');
        if (!Number.isFinite(Number(exerciseValue)) || Number(exerciseValue) <= 0) {
          errors.push('Inserisci un valore maggiore di zero.');
        }
        if (!Number.isInteger(Number(sets)) || Number(sets) < 1) errors.push('I set devono essere almeno uno.');
        if (hasSetPause && Number(sets) > 1 && Number(pauseBetweenSetsDuration) <= 0) {
          errors.push('Inserisci la durata della pausa tra i set.');
        }
        return errors;
      },
    },
    {
      name: 'isStepValid',
      implementation: (validationErrors: string[]) => validationErrors.length === 0,
    },
    {
      name: 'validateWarmupExercises',
      implementation: (items: WarmupExercise[]) => {
        if (!items?.length) return ['Aggiungi almeno un esercizio di warm-up.'];
        return items.flatMap((item, index) => {
          if (!item.exerciseId) return [`Seleziona l'esercizio ${index + 1} di warm-up.`];
          const value = item.modeType === 'repetitions' ? item.repetitions : item.duration;
          if (item.modeType === 'repetitions' &&
            (!Number.isInteger(item.repetitionIntervalSeconds ?? DEFAULT_REPETITION_INTERVAL_SECONDS) || (item.repetitionIntervalSeconds ?? DEFAULT_REPETITION_INTERVAL_SECONDS) < 1)) {
            return [`L’intervallo tra le ripetizioni del warm-up ${index + 1} deve essere di almeno un secondo.`];
          }
          return Number(value) > 0 ? [] : [`Inserisci un valore maggiore di zero per il warm-up ${index + 1}.`];
        });
      },
    },
    {
      name: 'validateStretchingExercises',
      implementation: (items: StretchingExercise[]) => {
        if (!items?.length) return ['Aggiungi almeno un esercizio di stretching.'];
        return items.flatMap((item, index) => {
          if (!item.exerciseId) return [`Seleziona l'esercizio ${index + 1} di stretching.`];
          return Number(item.duration) > 0 ? [] : [`Inserisci una durata maggiore di zero per lo stretching ${index + 1}.`];
        });
      },
    },
    {
      name: 'validateSchedule',
      implementation: (input: {
        date?: string;
        workoutId?: string;
        time?: string;
        scheduled?: ScheduledWorkout[];
      } | null) => {
        if (!input?.date || !input.workoutId) return ['Scegli un workout da programmare.'];
        const duplicate = input.scheduled?.some(
          (item) => item.date === input.date && item.workoutId === input.workoutId && item.time === input.time,
        );
        return duplicate ? ['Questo workout è già programmato nello stesso orario.'] : [];
      },
    },
    {
      name: 'validatePause',
      implementation: (duration: number) =>
        Number(duration) > 0 ? [] : ['Inserisci una durata della pausa maggiore di zero.'],
    },
    {
      name: 'getSessionProgress',
      implementation: (input: { session?: WorkoutSession; steps?: WorkoutCreatorStep[] } | null) => {
        const session = input?.session;
        const steps = input?.steps ?? [];
        const total = steps.filter((step) => step.type !== 'SETPAUSE').length;
        const completed = session?.completedStepIndexes.filter((index) => steps[index]?.type !== 'SETPAUSE').length ?? 0;
        return { total, completed, isComplete: Boolean(session?.completedAt) };
      },
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
