export type MuscleGroup = {
  id: string;
  name: string;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroupId: MuscleGroup['id'];
};

export const muscleGroups: MuscleGroup[] = [
  { id: 'addominali', name: 'Addominali' },
  { id: 'bicipiti', name: 'Bicipiti' },
  { id: 'gambe', name: 'Gambe' },
  { id: 'petto', name: 'Petto' },
  { id: 'schiena', name: 'Schiena' },
  { id: 'spalle', name: 'Spalle' },
  { id: 'tricipiti', name: 'Tricipiti' },
];

export const exercises: Exercise[] = [
  { id: 'curl-manubri', name: 'Curl con manubri', muscleGroupId: 'bicipiti' },
  { id: 'curl-bilanciere', name: 'Curl con bilanciere', muscleGroupId: 'bicipiti' },
  { id: 'hammer-curl', name: 'Hammer curl', muscleGroupId: 'bicipiti' },
  { id: 'push-down', name: 'Push down', muscleGroupId: 'tricipiti' },
  { id: 'french-press', name: 'French press', muscleGroupId: 'tricipiti' },
  { id: 'dip-panca', name: 'Dip alla panca', muscleGroupId: 'tricipiti' },
  { id: 'military-press', name: 'Military press', muscleGroupId: 'spalle' },
  { id: 'alzate-laterali', name: 'Alzate laterali', muscleGroupId: 'spalle' },
  { id: 'lat-machine', name: 'Lat machine', muscleGroupId: 'schiena' },
  { id: 'rematore', name: 'Rematore', muscleGroupId: 'schiena' },
];
