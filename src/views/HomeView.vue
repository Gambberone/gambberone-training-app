<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import WorkoutCreatorModal from '../components/WorkoutCreatorModal.vue'

const isWorkoutCreatorOpen = ref(false)
</script>

<template>
    <p>home view</p>
    <WorkoutCreatorModal v-model="isWorkoutCreatorOpen" />

    <div class="fab bottom-[calc(4rem+env(safe-area-inset-bottom))]">
        <button class="btn btn-lg btn-circle btn-primary" aria-label="Crea allenamento"
            @click="isWorkoutCreatorOpen = true">
            <Plus />
        </button>
    </div>
</template>
