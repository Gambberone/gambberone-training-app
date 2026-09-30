<template>
  <GttTabs
    class="h-full min-h-0 gap-4!"
    :tabs="[
      { key: 'workouts', label: tr('ui.workouts') },
      { key: 'exercises', label: tr('ui.exercises') },
    ]"
    :initial-active-tab="route.query.tab === 'exercises' ? 'exercises' : 'workouts'"
    v-model="activeTab"
    scroll-content
  >
    <template #actions>
      <div
        id="workouts-desktop-action"
        class="hidden w-56 shrink-0 self-stretch lg:flex [&>div]:flex [&>div]:h-full [&>div]:w-full [&_button]:h-full [&_button]:w-full"
      />
    </template>
    <template #workouts>
      <WorkoutList />
    </template>
    <template #exercises>
      <ExercisesList />
    </template>
  </GttTabs>
</template>

<script setup lang="ts">
import ExercisesList from '@/components/exercises/ExercisesList.vue';
import GttTabs from '@/components/generic/GttTabs.vue';
import WorkoutList from '@/components/workouts/WorkoutList.vue';
import { tr } from '@/localization';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeTab = ref<string>();
watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = tab === 'exercises' ? 'exercises' : 'workouts';
  },
);
</script>
