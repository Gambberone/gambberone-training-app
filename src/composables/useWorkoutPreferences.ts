import { localRef } from './localRef';

const timerSounds = localRef('gtt-timer-sounds', () => false);
const timerVibration = localRef('gtt-timer-vibration', () => false);
const keepScreenAwake = localRef('gtt-keep-screen-awake', () => false);

export function useWorkoutPreferences() {
  return { timerSounds, timerVibration, keepScreenAwake };
}
