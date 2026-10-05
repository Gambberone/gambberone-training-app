import type { Exercise } from '@/domain/exercises';
import { watch, type Ref } from 'vue';

type CatalogNode = { next(exercises: Exercise[]): unknown };

export function bindExerciseCatalog(
  exercises: Ref<Exercise[]>,
  runtimeStatus: Readonly<Ref<string>>,
  getCatalogNode: () => CatalogNode | undefined,
) {
  // The first local read can precede node creation. Replay it when startup finishes,
  // without depending on a later account snapshot to populate the selection graph.
  return watch([exercises, runtimeStatus], ([catalog, status]) => {
    if (status === 'ready') getCatalogNode()?.next(catalog);
  }, { deep: true, immediate: true, flush: 'sync' });
}
