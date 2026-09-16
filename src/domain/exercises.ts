export type MuscleGroup = {
  id: MuscleGroupType;
  name: string;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroupId: MuscleGroup['id'];
};

export type MuscleGroupType =
  | 'STRETCHING'
  | 'WARMUP'
  | 'ABDOMINALS'
  | 'BICEPS'
  | 'LEGS'
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'TRICEPS';

export const MUSCLE_GROUPS = {
  STRETCHING: 'STRETCHING',
  WARMUP: 'WARMUP',
  ABDOMINALS: 'ABDOMINALS',
  BICEPS: 'BICEPS',
  LEGS: 'LEGS',
  CHEST: 'CHEST',
  BACK: 'BACK',
  SHOULDERS: 'SHOULDERS',
  TRICEPS: 'TRICEPS',
} as const satisfies Record<MuscleGroupType, MuscleGroupType>;

export const muscleGroups: MuscleGroup[] = [
  { id: MUSCLE_GROUPS.STRETCHING, name: 'Stretching' },
  { id: MUSCLE_GROUPS.WARMUP, name: 'Warm-up' },
  { id: MUSCLE_GROUPS.ABDOMINALS, name: 'Addominali' },
  { id: MUSCLE_GROUPS.BICEPS, name: 'Bicipiti' },
  { id: MUSCLE_GROUPS.LEGS, name: 'Gambe' },
  { id: MUSCLE_GROUPS.CHEST, name: 'Petto' },
  { id: MUSCLE_GROUPS.BACK, name: 'Schiena' },
  { id: MUSCLE_GROUPS.SHOULDERS, name: 'Spalle' },
  { id: MUSCLE_GROUPS.TRICEPS, name: 'Tricipiti' },
];

export const exercises: Exercise[] = [
  { id: 'curl-manubri', name: 'Curl con manubri', muscleGroupId: MUSCLE_GROUPS.BICEPS },
  { id: 'curl-bilanciere', name: 'Curl con bilanciere', muscleGroupId: MUSCLE_GROUPS.BICEPS },
  { id: 'hammer-curl', name: 'Hammer curl', muscleGroupId: MUSCLE_GROUPS.BICEPS },
  { id: 'push-down', name: 'Push down', muscleGroupId: MUSCLE_GROUPS.TRICEPS },
  { id: 'french-press', name: 'French press', muscleGroupId: MUSCLE_GROUPS.TRICEPS },
  { id: 'dip-panca', name: 'Dip alla panca', muscleGroupId: MUSCLE_GROUPS.TRICEPS },
  { id: 'military-press', name: 'Military press', muscleGroupId: MUSCLE_GROUPS.SHOULDERS },
  { id: 'alzate-laterali', name: 'Alzate laterali', muscleGroupId: MUSCLE_GROUPS.SHOULDERS },
  { id: 'lat-machine', name: 'Lat machine', muscleGroupId: MUSCLE_GROUPS.BACK },
  { id: 'rematore', name: 'Rematore', muscleGroupId: MUSCLE_GROUPS.BACK },
];
