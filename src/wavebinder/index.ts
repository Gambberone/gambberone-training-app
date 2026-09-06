import './crypto-compat';
import { WaveBinder } from 'wave-binder';

import EXT_API_CONFIG from './extapi.json';
import LICENSE from './license.json';
import PROTO_NODES from './protonodes.json';
import { exercisesRef } from '../stores/exercises';

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
  ],
);

wb.tangleNodes();
