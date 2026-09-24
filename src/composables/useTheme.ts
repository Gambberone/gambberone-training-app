import { watch } from 'vue';
import { localRef } from './localRef';

export type ThemePreference = 'auto' | 'light' | 'dark';

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const preference = localRef<ThemePreference>('gtt-theme-preference', () => {
  // Keep the explicit choice made with the previous light/dark switch.
  const previousTheme = localStorage.getItem('gtt-theme');
  if (previousTheme === '"training-light"') return 'light';
  if (previousTheme === '"training-dark"') return 'dark';
  return 'auto';
});

function applyTheme() {
  const dark = preference.value === 'dark' || (preference.value === 'auto' && systemDark.matches);
  document.documentElement.dataset.theme = dark ? 'training-dark' : 'training-light';
}

watch(preference, applyTheme, { immediate: true });
systemDark.addEventListener('change', applyTheme);

export function useTheme() {
  return { themePreference: preference };
}
