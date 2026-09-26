<template>
    <GttTabs
        class="h-full min-h-0"
        :tabs="[
            { key: 'workouts', label: 'Workouts' },
            { key: 'exercises', label: 'Exercises' },
        ]"
        v-model="activeTab"
        scroll-content
    >
        <template #actions>
            <div id="workouts-desktop-action" class="hidden shrink-0 self-stretch lg:flex [&>div]:flex [&>div]:h-full [&_button]:h-full" />
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
import { ref } from "vue";
import ExercisesList from "@/components/exercises/ExercisesList.vue";
import GttTabs from "@/components/generic/GttTabs.vue";
import WorkoutList from "@/components/workouts/WorkoutList.vue";

const activeTab = ref<string>();
</script>
