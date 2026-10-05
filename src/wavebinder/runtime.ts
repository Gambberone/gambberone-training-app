import { readonly, ref } from 'vue';

type Runtime = { waitUntilReady(): Promise<void>; isReady(): boolean };

export function createRuntimeStatus() {
  const status = ref<'loading' | 'ready' | 'unavailable'>('loading');
  return {
    status: readonly(status),
    invalidate() { status.value = 'unavailable'; },
    async initialize(runtime: Runtime) {
      try {
        await runtime.waitUntilReady();
        // waitUntilReady also resolves when the license check fails.
        if (status.value !== 'unavailable') {
          status.value = runtime.isReady() ? 'ready' : 'unavailable';
        }
      } catch {
        status.value = 'unavailable';
      }
    },
  };
}
