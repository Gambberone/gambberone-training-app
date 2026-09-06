<template>
  <GttModal v-model="isOpen" title="Workout creator WIP" full>
    <WorkoutCreator />
  </GttModal>
</template>

<script setup lang="ts">
import GttModal from './generic/GttModal.vue'
import WorkoutCreator from './WorkoutCreator.vue'

const isOpen = defineModel<boolean>({ default: false })

</script>