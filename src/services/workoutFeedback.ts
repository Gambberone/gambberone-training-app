import { useWorkoutPreferences } from '@/composables/useWorkoutPreferences';

const { timerSounds, timerVibration } = useWorkoutPreferences();
let audioContext: AudioContext | undefined;

export function signalTimer(change = false, sound = true, tone: 'beep' | 'go' = 'beep') {
  if (timerVibration.value && 'vibrate' in navigator) {
    navigator.vibrate(change ? [120, 60, 120] : 70);
  }

  if (!sound || !timerSounds.value) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    const isGo = tone === 'go';
    const duration = isGo ? 0.6 : change ? 0.22 : 0.12;
    oscillator.type = isGo ? 'triangle' : 'sine';
    oscillator.frequency.value = change ? 880 : 660;
    volume.gain.setValueAtTime(0.0001, audioContext.currentTime);
    volume.gain.exponentialRampToValueAtTime(isGo ? 0.18 : 0.12, audioContext.currentTime + 0.01);
    if (isGo) {
      volume.gain.setValueAtTime(0.18, audioContext.currentTime + duration - 0.06);
    }
    volume.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + 0.01);
  } catch {
    // Sound is unavailable on this device or in this browser context.
  }
}
