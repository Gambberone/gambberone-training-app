<template>
    <GttModal v-model="showModal" title="Aggiungi pausa"></GttModal>
</template>

<script setup lang="ts">
import GttModal from '../generic/GttModal.vue';

const showModal = defineModel<boolean>({ default: false });
</script>
