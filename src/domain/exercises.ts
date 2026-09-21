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
  // Warm-up
  { id: 'camminata-sul-posto', name: 'Camminata sul posto', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'corsa-sul-posto', name: 'Corsa sul posto', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'jumping-jack', name: 'Jumping jack', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'skip-alto', name: 'Skip alto', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'calci-ai-glutei', name: 'Calci ai glutei', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'circonduzioni-braccia', name: 'Circonduzioni delle braccia', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'circonduzioni-spalle', name: 'Circonduzioni delle spalle', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'rotazioni-busto', name: 'Rotazioni del busto', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'slanci-gambe', name: 'Slanci delle gambe', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'squat-corpo-libero', name: 'Squat a corpo libero', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'affondi-alternati', name: 'Affondi alternati', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'mobilita-caviglie', name: 'Mobilità delle caviglie', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'mobilita-polsi', name: 'Mobilità dei polsi', muscleGroupId: MUSCLE_GROUPS.WARMUP },
  { id: 'cat-cow', name: 'Cat-cow', muscleGroupId: MUSCLE_GROUPS.WARMUP },

  // Stretching
  { id: 'stretching-quadricipiti', name: 'Stretching quadricipiti', muscleGroupId: MUSCLE_GROUPS.STRETCHING },
  { id: 'stretching-femorali', name: 'Stretching femorali', muscleGroupId: MUSCLE_GROUPS.STRETCHING },
  { id: 'stretching-polpacci', name: 'Stretching polpacci', muscleGroupId: MUSCLE_GROUPS.STRETCHING },
  { id: 'stretching-flessori-anca', name: 'Stretching flessori dell’anca', muscleGroupId: MUSCLE_GROUPS.STRETCHING },
  { id: 'stretching-glutei', name: 'Stretching glutei', muscleGroupId: MUSCLE_GROUPS.STRETCHING },
  { id: 'stretching-pettorali', name: 'Stretching pettorali', muscleGroupId: MUSCLE_GROUPS.STRETCHING },
  { id: 'stretching-dorsali', name: 'Stretching dorsali', muscleGroupId: MUSCLE_GROUPS.STRETCHING },
  { id: 'stretching-spalle', name: 'Stretching spalle', muscleGroupId: MUSCLE_GROUPS.STRETCHING },
  { id: 'stretching-tricipiti', name: 'Stretching tricipiti', muscleGroupId: MUSCLE_GROUPS.STRETCHING },
  { id: 'stretching-collo', name: 'Stretching collo', muscleGroupId: MUSCLE_GROUPS.STRETCHING },

  // Addominali
  { id: 'crunch', name: 'Crunch', muscleGroupId: MUSCLE_GROUPS.ABDOMINALS },
  { id: 'plank', name: 'Plank', muscleGroupId: MUSCLE_GROUPS.ABDOMINALS },
  { id: 'russian-twist', name: 'Russian twist', muscleGroupId: MUSCLE_GROUPS.ABDOMINALS },
  { id: 'leg-raise', name: 'Leg raise', muscleGroupId: MUSCLE_GROUPS.ABDOMINALS },
  { id: 'mountain-climber', name: 'Mountain climber', muscleGroupId: MUSCLE_GROUPS.ABDOMINALS },

  // Bicipiti
  { id: 'curl-manubri', name: 'Curl con manubri', muscleGroupId: MUSCLE_GROUPS.BICEPS },
  { id: 'curl-bilanciere', name: 'Curl con bilanciere', muscleGroupId: MUSCLE_GROUPS.BICEPS },
  { id: 'hammer-curl', name: 'Hammer curl', muscleGroupId: MUSCLE_GROUPS.BICEPS },
  { id: 'curl-panca-inclinata', name: 'Curl su panca inclinata', muscleGroupId: MUSCLE_GROUPS.BICEPS },
  { id: 'curl-cavi', name: 'Curl ai cavi', muscleGroupId: MUSCLE_GROUPS.BICEPS },

  // Tricipiti
  { id: 'push-down', name: 'Push down', muscleGroupId: MUSCLE_GROUPS.TRICEPS },
  { id: 'french-press', name: 'French press', muscleGroupId: MUSCLE_GROUPS.TRICEPS },
  { id: 'dip-panca', name: 'Dip alla panca', muscleGroupId: MUSCLE_GROUPS.TRICEPS },
  { id: 'estensioni-tricipiti-cavo', name: 'Estensioni tricipiti al cavo', muscleGroupId: MUSCLE_GROUPS.TRICEPS },

  // Spalle
  { id: 'military-press', name: 'Military press', muscleGroupId: MUSCLE_GROUPS.SHOULDERS },
  { id: 'alzate-laterali', name: 'Alzate laterali', muscleGroupId: MUSCLE_GROUPS.SHOULDERS },
  { id: 'alzate-frontali', name: 'Alzate frontali', muscleGroupId: MUSCLE_GROUPS.SHOULDERS },
  { id: 'reverse-fly', name: 'Reverse fly', muscleGroupId: MUSCLE_GROUPS.SHOULDERS },

  // Schiena
  { id: 'lat-machine', name: 'Lat machine', muscleGroupId: MUSCLE_GROUPS.BACK },
  { id: 'rematore', name: 'Rematore', muscleGroupId: MUSCLE_GROUPS.BACK },
  { id: 'pulley-basso', name: 'Pulley basso', muscleGroupId: MUSCLE_GROUPS.BACK },
  { id: 'trazioni', name: 'Trazioni', muscleGroupId: MUSCLE_GROUPS.BACK },
  { id: 'pullover-cavi', name: 'Pullover ai cavi', muscleGroupId: MUSCLE_GROUPS.BACK },

  // Petto
  { id: 'panca-piana-bilanciere', name: 'Panca piana con bilanciere', muscleGroupId: MUSCLE_GROUPS.CHEST },
  { id: 'panca-inclinata-manubri', name: 'Panca inclinata con manubri', muscleGroupId: MUSCLE_GROUPS.CHEST },
  { id: 'croci-manubri', name: 'Croci con manubri', muscleGroupId: MUSCLE_GROUPS.CHEST },
  { id: 'push-up', name: 'Push-up', muscleGroupId: MUSCLE_GROUPS.CHEST },
  { id: 'chest-press', name: 'Chest press', muscleGroupId: MUSCLE_GROUPS.CHEST },

  // Gambe
  { id: 'squat-bilanciere', name: 'Squat con bilanciere', muscleGroupId: MUSCLE_GROUPS.LEGS },
  { id: 'leg-press', name: 'Leg press', muscleGroupId: MUSCLE_GROUPS.LEGS },
  { id: 'stacco-rumeno', name: 'Stacco rumeno', muscleGroupId: MUSCLE_GROUPS.LEGS },
  { id: 'leg-curl', name: 'Leg curl', muscleGroupId: MUSCLE_GROUPS.LEGS },
  { id: 'leg-extension', name: 'Leg extension', muscleGroupId: MUSCLE_GROUPS.LEGS },
  { id: 'calf-raise', name: 'Calf raise', muscleGroupId: MUSCLE_GROUPS.LEGS },
];
