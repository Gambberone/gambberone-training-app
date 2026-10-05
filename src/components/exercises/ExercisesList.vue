<template>
  <div class="mb-4">
    <GttInputField :id="searchId" v-model="search" type="search" :label="tr('collection.searchExercises')" :placeholder="tr('collection.searchExercises')" compact />
    <p v-if="search.trim()" role="status" class="mt-2 text-sm text-[var(--color-ui-muted)]">{{ tr('collection.results', { count: filteredExercises.length }) }}</p>
  </div>
  <div v-if="search.trim() && !filteredExercises.length" class="py-8">
    <p class="font-semibold">{{ tr('collection.noResults') }}</p>
    <GttButton mode="outline" class="mt-3" @click="search = ''">{{ tr('collection.clearSearch') }}</GttButton>
  </div>
  <div class="grid items-start gap-3 md:grid-cols-2">
    <div
      v-for="(column, index) in exerciseColumns"
      :key="index"
      class="flex min-w-0 flex-col gap-3"
      :class="index === 1 ? 'hidden md:flex' : ''"
    >
      <article
        v-for="{ muscleGroup, cardClass, textClass, badgeClass } in column"
        :key="muscleGroup.id"
        class="card card-border overflow-hidden bg-base-100 shadow-sm"
        :class="cardClass"
      >
        <div
          class="collapse collapse-arrow"
          :class="{ 'collapse-open': Boolean(search.trim()) || expandedMuscleGroupId === muscleGroup.id }"
        >
          <GttButton unstyled
            type="button"
            class="collapse-title flex w-full items-center justify-between gap-3 text-left font-semibold"
            :class="textClass"
            :aria-expanded="Boolean(search.trim()) || expandedMuscleGroupId === muscleGroup.id"
            @click="toggleMuscleGroup(muscleGroup.id)"
          >
            <span>{{ t(`muscleGroups.${muscleGroup.id}`) }}</span>
            <span class="badge mr-5" :class="badgeClass">{{
              exercisesForMuscleGroup(muscleGroup.id).length
            }}</span>
          </GttButton>
          <div class="collapse-content px-0 pb-0">
            <ul class="list bg-base-100">
              <li
                v-for="exercise in exercisesForMuscleGroup(muscleGroup.id)"
                :key="exercise.id"
                class="list-row flex items-center"
              >
                <div class="flex flex-1 gap-3">
                  <Dumbbell class="size-5 text-primary" aria-hidden="true" />
                  <div>{{ localizedExerciseName(exercise) }}</div>
                </div>
                <div class="flex-0 flex">
                  <GttButton shape="square" mode="ghost" size="sm"
                    class="text-primary"
                    type="button"
                    :aria-label="
                      tr('messages.editNamed', { name: localizedExerciseName(exercise) })
                    "
                    @click.stop="editExercise(exercise)"
                  >
                    <Pencil class="size-5" aria-hidden="true" />
                  </GttButton>
                  <GttButton shape="square" mode="ghost" size="sm"
                    class="text-error"
                    type="button"
                    :aria-label="
                      tr('messages.deleteNamed', { name: localizedExerciseName(exercise) })
                    "
                    @click.stop="removeExercise(exercise)"
                  >
                    <Trash class="size-5" aria-hidden="true" />
                  </GttButton>
                </div>
              </li>
              <li
                v-if="exercisesForMuscleGroup(muscleGroup.id).length === 0"
                class="px-4 py-3 text-sm text-base-content/60"
              >
                {{ tr('ui.no_exercises_in_this_muscle_group') }}
              </li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  </div>
  <GttBottomAction
    desktop-target="#workouts-desktop-action"
    :label="tr('ui.add_exercise')"
    @click="isExercisesCreatorEditorModalOpen = true"
  />
  <ExerciseCreatorModal
    v-model="isExercisesCreatorEditorModalOpen"
    :exercise="selectedExerciseForEdit"
    @update:model-value="onExerciseCreatorEditorModalUpdate"
  />
  <GttModal
    v-model="showExerciseEliminationModal"
    :actions="[
      { id: 'cancel', label: tr('ui.cancel') },
      { id: 'delete', label: tr('ui.delete'), color: 'error' },
    ]"
    :title="tr('ui.delete_exercise')"
    @action="eliminationModalActionHandler"
  >
    <p class="text-md">
      {{
        tr('messages.deleteExercise', {
          name: selectedExerciseForElimination
            ? localizedExerciseName(selectedExerciseForElimination)
            : '',
        })
      }}
    </p>
  </GttModal>
</template>

<script setup lang="ts">
import GttInputField from '@/components/generic/form/GttInputField.vue';
import GttBottomAction from '@/components/generic/GttBottomAction.vue';
import {
  MUSCLE_GROUPS,
  muscleGroups,
  type Exercise,
  type MuscleGroup,
} from '@/domain/exercises.ts';
import { localizedExerciseName, tr } from '@/localization';
import { exercisesRef } from '@/stores/exercises.ts';
import { Dumbbell, Pencil, Trash } from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import ExerciseCreatorModal from './ExerciseCreatorModal.vue';

const { t, locale } = useI18n();
const searchId = useId();
const search = ref('');
const filteredExercises = computed(() => {
  const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase(locale.value).trim();
  const query = normalize(search.value);
  return exercisesRef.value.filter(exercise => normalize(localizedExerciseName(exercise)).includes(query));
});
const isExercisesCreatorEditorModalOpen = ref(false);
const expandedMuscleGroupId = ref<MuscleGroup['id'] | null>(null);

function toggleMuscleGroup(muscleGroupId: MuscleGroup['id']) {
  expandedMuscleGroupId.value =
    expandedMuscleGroupId.value === muscleGroupId ? null : muscleGroupId;
}

const exerciseSections = [
  {
    title: 'Stretching',
    groups: muscleGroups.filter(({ id }) => id === MUSCLE_GROUPS.STRETCHING),
    cardClass: 'border-base-300/60 bg-base-100',
    textClass: 'text-base-content',
    badgeClass: 'badge-neutral badge-outline',
  },
  {
    title: 'Warm-up',
    groups: muscleGroups.filter(({ id }) => id === MUSCLE_GROUPS.WARMUP),
    cardClass: 'border-base-300/60 bg-base-100',
    textClass: 'text-base-content',
    badgeClass: 'badge-neutral badge-outline',
  },
  {
    title: tr('ui.exercises'),
    groups: muscleGroups.filter(
      ({ id }) => id !== MUSCLE_GROUPS.STRETCHING && id !== MUSCLE_GROUPS.WARMUP,
    ),
    cardClass: 'border-base-300/60 bg-base-100',
    textClass: 'text-base-content',
    badgeClass: 'badge-neutral badge-outline',
  },
];

const exerciseCards = exerciseSections.flatMap(({ groups, cardClass, textClass, badgeClass }) =>
  groups.map((muscleGroup) => ({ muscleGroup, cardClass, textClass, badgeClass })),
);

const isTwoColumnLayout = ref(false);
let columnMediaQuery: MediaQueryList | undefined;
const updateColumnLayout = () => {
  isTwoColumnLayout.value = columnMediaQuery?.matches ?? false;
};
onMounted(() => {
  columnMediaQuery = window.matchMedia('(min-width: 768px)');
  updateColumnLayout();
  columnMediaQuery.addEventListener('change', updateColumnLayout);
});
onUnmounted(() => columnMediaQuery?.removeEventListener('change', updateColumnLayout));
const matchingCards = computed(() => search.value.trim()
  ? exerciseCards.filter(card => exercisesForMuscleGroup(card.muscleGroup.id).length)
  : exerciseCards);
const exerciseColumns = computed(() =>
  isTwoColumnLayout.value
    ? [
        matchingCards.value.filter((_, index) => index % 2 === 0),
        matchingCards.value.filter((_, index) => index % 2 === 1),
      ]
    : [matchingCards.value],
);

function exercisesForMuscleGroup(muscleGroupId: MuscleGroup['id']) {
  return filteredExercises.value.filter((exercise) => exercise.muscleGroupId === muscleGroupId);
}

const selectedExerciseForEdit = ref<Exercise | null>(null);
const editExercise = (exercise: Exercise) => {
  selectedExerciseForEdit.value = exercise;
  isExercisesCreatorEditorModalOpen.value = true;
};

const onExerciseCreatorEditorModalUpdate = (isOpen: boolean) => {
  isExercisesCreatorEditorModalOpen.value = isOpen;

  if (!isOpen) {
    selectedExerciseForEdit.value = null;
  }
};

const selectedExerciseForElimination = ref<Exercise | null>(null);
const showExerciseEliminationModal = ref(false);
const removeExercise = (exercise: Exercise) => {
  selectedExerciseForElimination.value = exercise;
  showExerciseEliminationModal.value = true;
};

const eliminationModalActionHandler = (actionId: string) => {
  if (actionId === 'cancel') {
    setTimeout(() => {
      selectedExerciseForElimination.value = null;
    }, 500);
  } else if (actionId === 'delete') {
    exercisesRef.value = exercisesRef.value.filter(
      (exercise) => exercise.id !== selectedExerciseForElimination.value?.id,
    );
  }
};
</script>
