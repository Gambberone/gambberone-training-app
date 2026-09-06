import { ref, watch, type Ref } from 'vue';

export function localRef<T>(key: string, createInitialValue: () => T): Ref<T> {
  const savedValue = localStorage.getItem(key);
  let value: T;

  if (savedValue === null) {
    value = createInitialValue();
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    try {
      value = JSON.parse(savedValue) as T;
    } catch {
      value = createInitialValue();
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  const state = ref(value) as Ref<T>;

  watch(state, (updatedValue) => localStorage.setItem(key, JSON.stringify(updatedValue)), {
    deep: true,
  });

  return state;
}
