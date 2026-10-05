import { ref, watch, type Ref } from 'vue';

const ownerKey = 'gtt:data-owner';
let owner = localStorage.getItem(ownerKey);
const bindings: (() => void)[] = [];

export const localStorageKey = (key: string) =>
  owner ? `${key}:owner:${owner}` : key;
export const localDataOwner = () => owner;

// Adopt the pre-existing cache once, then keep guest and account archives separate.
export function selectLocalDataOwner(uid: string | null) {
  const nextOwner = uid ?? 'guest';
  if (owner === nextOwner) return;
  if (!owner) {
    owner = nextOwner;
    for (const key of Object.keys(localStorage)) {
      if ((key.startsWith('gtt:') || key.startsWith('gtt-')) && key !== ownerKey && !key.includes(':owner:')) {
        localStorage.setItem(localStorageKey(key), localStorage.getItem(key)!);
      }
    }
  } else {
    owner = nextOwner;
  }
  localStorage.setItem(ownerKey, nextOwner);
  bindings.forEach((load) => load());
}

export function localRef<T>(key: string, createInitialValue: () => T): Ref<T> {
  const read = (): T => {
    const saved = localStorage.getItem(localStorageKey(key));
    if (saved !== null) {
      try { return JSON.parse(saved) as T; } catch { /* Restore defaults. */ }
    }
    return createInitialValue();
  };
  const state = ref(read()) as Ref<T>;
  const persist = () => localStorage.setItem(localStorageKey(key), JSON.stringify(state.value));
  persist();
  watch(state, persist, { deep: true, flush: 'sync' });
  bindings.push(() => { state.value = read(); persist(); });
  return state;
}
