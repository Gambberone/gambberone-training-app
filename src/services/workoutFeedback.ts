import { useWorkoutPreferences } from '@/composables/useWorkoutPreferences';

const { timerSounds, timerVibration } = useWorkoutPreferences();
let audioContext: AudioContext | undefined;

export function signalTimer(change = false, sound = true) {
  if (timerVibration.value && 'vibrate' in navigator) {
    navigator.vibrate(change ? [120, 60, 120] : 70);
  }

  if (!sound || !timerSounds.value) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = change ? 880 : 660;
    volume.gain.setValueAtTime(0.0001, audioContext.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.01);
    volume.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + (change ? 0.22 : 0.12),
    );
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + (change ? 0.23 : 0.13));
  } catch {
    // Sound is unavailable on this device or in this browser context.
  }
}
