import { WaveBinder } from 'wave-binder';
import './crypto-compat';

import {
  DEFAULT_REPETITION_INTERVAL_SECONDS,
  type StretchingExercise,
  type WarmupExercise,
} from '@/constants/workout';
import { pendingAgendaWorkouts } from '@/domain/agenda';
import { validateExerciseEditor, exerciseEditorCanSave } from '@/domain/exerciseValidation';
import { completedWorkoutSessions, workoutStatistics, filterWorkoutHistory } from '@/domain/workoutInsights';
import { validateExerciseStep } from '@/domain/workoutValidation';
import { getExercisesForMuscleGroup } from '@/domain/exerciseChoices';
import { createRuntimeStatus } from './runtime';
import { bindExerciseCatalog } from './catalog';
import { exercisesRef } from '@/stores/exercises';
import EXT_API_CONFIG from './extapi.json';
import LICENSE from './license.json';
import PROTO_NODES from './protonodes.json';
import { scheduleValidationErrors } from './schedule';

const licenseServerUrl = import.meta.env.VITE_WAVEBINDER_LICENSE_SERVER_URL?.replace(/\/$/, '');

if (licenseServerUrl) {
  (
    globalThis as typeof globalThis & { WAVEBINDER_LICENSE_SERVER_URL?: string }
  ).WAVEBINDER_LICENSE_SERVER_URL = licenseServerUrl;
}

const extApis = new Map();

extApis.set('api', EXT_API_CONFIG);

const runtime = createRuntimeStatus();
export const waveBinderStatus = runtime.status;

class AppWaveBinder extends WaveBinder {
  override nukeNodes() {
    runtime.invalidate();
    super.nukeNodes();
  }
}

export const wb = new AppWaveBinder(
  LICENSE,
  PROTO_NODES as ConstructorParameters<typeof WaveBinder>[1],
  extApis,
  [
    { name: 'validateExerciseEditor', implementation: validateExerciseEditor },
    { name: 'exerciseEditorCanSave', implementation: exerciseEditorCanSave },
    { name: 'completedWorkoutSessions', implementation: completedWorkoutSessions },
    { name: 'workoutStatistics', implementation: workoutStatistics },
    { name: 'filterWorkoutHistory', implementation: filterWorkoutHistory },
    { name: 'pendingAgendaWorkouts', implementation: pendingAgendaWorkouts },
    {
      name: 'getExercisesForMuscleGroup',
      implementation: getExercisesForMuscleGroup,
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
      implementation: validateExerciseStep,
    },
    {
      name: 'isStepValid',
      implementation: (validationErrors: string[]) => validationErrors.length === 0,
    },
    {
      name: 'validateWarmupExercises',
      implementation: (items: WarmupExercise[]) => {
        if (!items?.length) return ['messages.warmupRequired'];
        return items.flatMap((item, index) => {
          if (!item.exerciseId)
            return [
              JSON.stringify({ key: 'messages.warmupExercise', values: { number: index + 1 } }),
            ];
          const value = item.modeType === 'repetitions' ? item.repetitions : item.duration;
          if (
            item.modeType === 'repetitions' &&
            (!Number.isInteger(
              item.repetitionIntervalSeconds ?? DEFAULT_REPETITION_INTERVAL_SECONDS,
            ) ||
              (item.repetitionIntervalSeconds ?? DEFAULT_REPETITION_INTERVAL_SECONDS) < 1)
          ) {
            return [
              JSON.stringify({ key: 'messages.warmupInterval', values: { number: index + 1 } }),
            ];
          }
          return Number(value) > 0
            ? []
            : [JSON.stringify({ key: 'messages.warmupPositive', values: { number: index + 1 } })];
        });
      },
    },
    {
      name: 'validateStretchingExercises',
      implementation: (items: StretchingExercise[]) => {
        if (!items?.length) return ['messages.stretchRequired'];
        return items.flatMap((item, index) => {
          if (!item.exerciseId)
            return [
              JSON.stringify({ key: 'messages.stretchExercise', values: { number: index + 1 } }),
            ];
          return Number(item.duration) > 0
            ? []
            : [JSON.stringify({ key: 'messages.stretchPositive', values: { number: index + 1 } })];
        });
      },
    },
    {
      name: 'validateSchedule',
      implementation: scheduleValidationErrors,
    },
    {
      name: 'validatePause',
      implementation: (duration: number) =>
        Number(duration) > 0 ? [] : ['messages.pausePositive'],
    },
  ],
);

wb.tangleNodes();

void runtime.initialize(wb);

// Keep the local catalog available even when it loads before the runtime nodes.
bindExerciseCatalog(exercisesRef, waveBinderStatus, () => wb.getNodeByName('exerciseCatalog'));
