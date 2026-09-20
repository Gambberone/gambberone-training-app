import { computed, watch } from 'vue';
import { localRef } from './localRef';

type Theme = 'training-light' | 'training-dark';

const theme = localRef<Theme>('gtt-theme', () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'training-dark' : 'training-light',
);

function applyTheme(value: Theme) {
  document.documentElement.dataset.theme = value;
}

applyTheme(theme.value);
watch(theme, applyTheme, { immediate: true });

export function useTheme() {
  const isDark = computed({
    get: () => theme.value === 'training-dark',
    set: (value: boolean) => {
      theme.value = value ? 'training-dark' : 'training-light';
    },
  });

  return { isDark };
}
