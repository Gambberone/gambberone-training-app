import { computed, onScopeDispose, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue';
import type { MultiNode, SingleNode } from 'wave-binder';

type Choice = { id: string };

/** Bridges WaveBinder's RxJS nodes with Vue refs for form controls. */
export function useWaveBinderNode<T>(node: SingleNode): Ref<T> {
  const value = useWaveBinderValue<T>(node);
  return computed({
    get: () => value.value,
    set: (nextValue) => {
      if (!Object.is(node.getNodeValue(), nextValue)) node.next(nextValue);
    },
  });
}

/** Subscribes to derived nodes without writing their results back into the graph. */
export function useWaveBinderValue<T>(node: SingleNode): ComputedRef<T> {
  const value = shallowRef<T>(node.getNodeValue() as T) as Ref<T>;
  const subscription = node.subscribe(() => {
    value.value = node.getNodeValue() as T;
  });
  onScopeDispose(() => subscription.unsubscribe());
  return computed(() => value.value);
}

/** Like useWaveBinderNode, but exposes a MULTI node as an option id for GttSelectField. */
export function useWaveBinderMultiNode<T extends Choice>(node: MultiNode) {
  const selectedId = ref<string | undefined>(node.getNodeValue()?.id);
  const choices = ref<T[]>(node.choices as T[]);
  const subscription = node.subscribe((nextValue) => {
    choices.value = [...node.choices] as T[];
    selectedId.value = (nextValue as T | null)?.id;
  });

  watch(selectedId, (id) => {
    const index = node.choices.findIndex((choice: T) => choice.id === id);
    if (index >= 0) {
      if (node.getNodeValue()?.id !== id) node.setSelection(index);
    } else if (node.getNodeValue() !== null) {
      node.next(null);
    }
  });

  onScopeDispose(() => subscription.unsubscribe());
  return { selectedId, choices };
}
